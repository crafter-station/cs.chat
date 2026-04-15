"use client";

import { nanoid } from "nanoid";
import type { WorkerRequest, WorkerResponse } from "./worker";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type FileStatus = "pending" | "downloading" | "done";

export interface FileProgress {
  file: string;
  status: FileStatus;
  loaded: number;
  total: number;
  /** 0 – 1 */
  progress: number;
}

export type LoadPhase =
  | "idle"
  | "loading"
  | "downloading"
  | "warming"
  | "ready"
  | "error";

export interface LocalModelState {
  modelId: string | null;
  phase: LoadPhase;
  /** 0 – 1, aggregate across all files */
  progress: number;
  files: Record<string, FileProgress>;
  readyFiles: number;
  totalFiles: number;
  errorMessage?: string;
}

const INITIAL_STATE: LocalModelState = {
  modelId: null,
  phase: "idle",
  progress: 0,
  files: {},
  readyFiles: 0,
  totalFiles: 0,
};

interface PendingLoad {
  resolve: () => void;
  reject: (err: Error) => void;
}

interface PendingGenerate {
  onToken: (delta: string) => void;
  resolve: () => void;
  reject: (err: Error) => void;
}

class LocalModelClient {
  private worker: Worker | null = null;
  private loadedModelId: string | null = null;
  private loadingPromise: Promise<void> | null = null;
  private pendingLoads = new Map<string, PendingLoad>();
  private pendingGenerate = new Map<string, PendingGenerate>();

  private state: LocalModelState = INITIAL_STATE;
  private listeners = new Set<() => void>();

  getState = (): LocalModelState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(patch: Partial<LocalModelState>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  private updateFile(file: string, patch: Partial<FileProgress>) {
    const prev: FileProgress =
      this.state.files[file] ??
      { file, status: "pending", loaded: 0, total: 0, progress: 0 };
    const next = { ...prev, ...patch };
    const files = { ...this.state.files, [file]: next };
    const values = Object.values(files);
    const totalFiles = values.length;
    const readyFiles = values.filter((f) => f.status === "done").length;
    // Aggregate progress: sum of per-file progress / count, weighted so
    // finished files count as 1 even if we never got a final progress event.
    const aggregate =
      totalFiles === 0
        ? 0
        : values.reduce(
            (acc, f) => acc + (f.status === "done" ? 1 : f.progress),
            0,
          ) / totalFiles;

    this.state = {
      ...this.state,
      files,
      totalFiles,
      readyFiles,
      progress: Math.min(1, Math.max(this.state.progress, aggregate)),
    };
    for (const l of this.listeners) l();
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.addEventListener("message", (e: MessageEvent<WorkerResponse>) => {
      this.handleMessage(e.data);
    });
    this.worker.addEventListener("error", () => {
      const err = new Error("Local model worker crashed");
      for (const p of this.pendingLoads.values()) p.reject(err);
      this.pendingLoads.clear();
      for (const p of this.pendingGenerate.values()) p.reject(err);
      this.pendingGenerate.clear();
      this.setState({ phase: "error", errorMessage: err.message });
    });
    return this.worker;
  }

  private handleMessage(msg: WorkerResponse) {
    // File-level progress is broadcast to state regardless of which request
    // initiated the load; we only track one model at a time.
    if (msg.status === "file-initiate") {
      this.updateFile(msg.file, { status: "downloading" });
      if (this.state.phase === "loading") this.setState({ phase: "downloading" });
      return;
    }
    if (msg.status === "file-progress") {
      this.updateFile(msg.file, {
        status: "downloading",
        loaded: msg.loaded,
        total: msg.total,
        progress: msg.total > 0 ? msg.loaded / msg.total : msg.progress / 100,
      });
      return;
    }
    if (msg.status === "file-done") {
      this.updateFile(msg.file, { status: "done", progress: 1 });
      return;
    }
    if (msg.status === "loading") {
      if (/warm|optim/i.test(msg.message)) this.setState({ phase: "warming" });
      return;
    }

    const load = this.pendingLoads.get(msg.id);
    if (load) {
      if (msg.status === "ready") {
        load.resolve();
        this.pendingLoads.delete(msg.id);
      } else if (msg.status === "error") {
        load.reject(new Error(msg.message));
        this.pendingLoads.delete(msg.id);
      }
      return;
    }

    const gen = this.pendingGenerate.get(msg.id);
    if (gen) {
      if (msg.status === "update") {
        gen.onToken(msg.output);
      } else if (msg.status === "complete") {
        gen.resolve();
        this.pendingGenerate.delete(msg.id);
      } else if (msg.status === "error") {
        gen.reject(new Error(msg.message));
        this.pendingGenerate.delete(msg.id);
      }
    }
  }

  private send(req: WorkerRequest) {
    this.ensureWorker().postMessage(req);
  }

  async load(modelId: string): Promise<void> {
    if (this.loadedModelId === modelId && this.state.phase === "ready") return;
    if (this.loadingPromise && this.state.modelId === modelId) return this.loadingPromise;

    const id = nanoid();
    this.setState({
      modelId,
      phase: "loading",
      progress: 0,
      files: {},
      readyFiles: 0,
      totalFiles: 0,
      errorMessage: undefined,
    });

    this.loadingPromise = new Promise<void>((resolve, reject) => {
      this.pendingLoads.set(id, {
        resolve: () => {
          this.loadedModelId = modelId;
          this.loadingPromise = null;
          this.setState({ phase: "ready", progress: 1 });
          resolve();
        },
        reject: (err) => {
          this.loadingPromise = null;
          this.setState({ phase: "error", errorMessage: err.message });
          reject(err);
        },
      });
      this.send({ id, type: "load", data: modelId });
    });
    return this.loadingPromise;
  }

  preload(modelId: string): void {
    // Fire-and-forget; errors surface through subscribed state.
    this.load(modelId).catch(() => {});
  }

  generate(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const id = nanoid();
    return new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        this.send({ id, type: "interrupt" });
        this.pendingGenerate.delete(id);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener("abort", onAbort, { once: true });

      this.pendingGenerate.set(id, {
        onToken,
        resolve: () => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        },
        reject: (err) => {
          signal?.removeEventListener("abort", onAbort);
          reject(err);
        },
      });
      this.send({ id, type: "generate", data: messages });
    });
  }
}

let singleton: LocalModelClient | null = null;

export function getLocalModelClient(): LocalModelClient {
  if (!singleton) singleton = new LocalModelClient();
  return singleton;
}

export function isWebGpuAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof (navigator as unknown as { gpu?: unknown }).gpu !== "undefined";
}
