/// <reference lib="webworker" />
// In-browser LLM worker. Loads an ONNX model via @huggingface/transformers
// and streams generated tokens back to the main thread. Runs on WebGPU.

import {
  pipeline,
  TextStreamer,
  DynamicCache,
  InterruptableStoppingCriteria,
  type TextGenerationPipeline as TGPipeline,
} from "@huggingface/transformers";

export interface WorkerRequest {
  id: string;
  type: "check" | "load" | "generate" | "interrupt" | "reset";
  data?: unknown;
}

export type WorkerResponse =
  | { id: string; status: "check-ok" }
  | { id: string; status: "file-initiate"; file: string }
  | { id: string; status: "file-progress"; file: string; loaded: number; total: number; progress: number }
  | { id: string; status: "file-done"; file: string }
  | { id: string; status: "loading"; message: string }
  | { id: string; status: "ready" }
  | { id: string; status: "start" }
  | { id: string; status: "update"; output: string; tps?: number; numTokens: number }
  | { id: string; status: "complete" }
  | { id: string; status: "error"; message: string };

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;

let pipelinePromise: Promise<TGPipeline> | null = null;
let currentModelId: string | null = null;
const stopping = new InterruptableStoppingCriteria();
let pastKeyValues: DynamicCache | null = null;

function post(msg: WorkerResponse) {
  scope.postMessage(msg);
}

function disposePastKeyValues() {
  pastKeyValues?.dispose?.();
  pastKeyValues = null;
}

async function checkWebGpu(id: string) {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    const adapter = await gpu?.requestAdapter();
    if (!adapter) throw new Error("WebGPU not supported (no adapter)");
    post({ id, status: "check-ok" });
  } catch (e) {
    post({ id, status: "error", message: (e as Error).message });
  }
}

async function load(id: string, modelId: string) {
  if (currentModelId && currentModelId !== modelId) {
    disposePastKeyValues();
    pipelinePromise = null;
  }
  currentModelId = modelId;

  post({ id, status: "loading", message: "Loading model…" });

  if (!pipelinePromise) {
    pipelinePromise = pipeline("text-generation", modelId, {
      device: "webgpu",
      dtype: "q1",
      progress_callback: (info: Record<string, unknown>) => {
        const status = info.status;
        const file = typeof info.file === "string" ? info.file : "";
        if (!file && status !== "ready") return;
        if (status === "initiate") {
          post({ id, status: "file-initiate", file });
        } else if (status === "progress") {
          post({
            id,
            status: "file-progress",
            file,
            loaded: Number(info.loaded ?? 0),
            total: Number(info.total ?? 0),
            progress: Number(info.progress ?? 0),
          });
        } else if (status === "done") {
          post({ id, status: "file-done", file });
        }
      },
    }) as Promise<TGPipeline>;
  }

  try {
    const generator = await pipelinePromise;
    post({ id, status: "loading", message: "Warming up…" });
    const inputs = generator.tokenizer("a");
    await generator.model.generate({ ...inputs, max_new_tokens: 1 });
    post({ id, status: "ready" });
  } catch (e) {
    pipelinePromise = null;
    post({ id, status: "error", message: (e as Error).message });
  }
}

async function generate(id: string, messages: ChatMessage[]) {
  if (!pipelinePromise) {
    post({ id, status: "error", message: "Model not loaded" });
    return;
  }

  try {
    const generator = await pipelinePromise;
    let startTime: number | undefined;
    let numTokens = 0;
    let tps: number | undefined;

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (output: string) => {
        if (!output) return;
        post({ id, status: "update", output, tps, numTokens });
      },
      token_callback_function: () => {
        startTime ??= performance.now();
        if (numTokens++ > 0) {
          tps = (numTokens / (performance.now() - startTime)) * 1000;
        }
      },
    });

    post({ id, status: "start" });
    pastKeyValues ??= new DynamicCache();

    await generator(messages, {
      max_new_tokens: 1024,
      do_sample: false,
      streamer,
      stopping_criteria: stopping,
      past_key_values: pastKeyValues,
    });

    post({ id, status: "complete" });
  } catch (e) {
    post({ id, status: "error", message: (e as Error).message });
  }
}

scope.addEventListener("message", (e: MessageEvent<WorkerRequest>) => {
  const { id, type, data } = e.data;
  switch (type) {
    case "check":
      checkWebGpu(id);
      break;
    case "load":
      load(id, data as string);
      break;
    case "generate":
      stopping.reset();
      generate(id, data as ChatMessage[]);
      break;
    case "interrupt":
      stopping.interrupt();
      break;
    case "reset":
      disposePastKeyValues();
      stopping.reset();
      pipelinePromise = null;
      currentModelId = null;
      break;
  }
});
