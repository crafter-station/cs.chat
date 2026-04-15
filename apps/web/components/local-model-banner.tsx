"use client";

import { useEffect } from "react";
import { CpuIcon, ShieldCheckIcon, InfinityIcon } from "lucide-react";
import { models } from "@cs-chat/shared";
import { useChatContext } from "@/lib/chat-context";
import { useLocalModelStatus } from "@/hooks/use-local-model-status";
import {
  getLocalModelClient,
  isWebGpuAvailable,
} from "@/lib/local-model/client";

function formatBytes(n: number): string {
  if (!n) return "0 MB";
  const mb = n / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

export function LocalModelBanner() {
  const { selectedModel } = useChatContext();
  const model = models.find((m) => m.id === selectedModel);
  const status = useLocalModelStatus();

  // Kick off preload as soon as a local model is selected.
  useEffect(() => {
    if (!model?.isLocal || !model.localModelId) return;
    if (!isWebGpuAvailable()) return;
    getLocalModelClient().preload(model.localModelId);
  }, [model?.isLocal, model?.localModelId]);

  if (!model?.isLocal) return null;

  const loading =
    status.phase === "loading" ||
    status.phase === "downloading" ||
    status.phase === "warming";
  const ready = status.phase === "ready";
  const errored = status.phase === "error";
  const idle = status.phase === "idle";

  const pct = Math.round(status.progress * 100);
  const fileValues = Object.values(status.files);
  const totalBytes = fileValues.reduce((acc, f) => acc + (f.total || 0), 0);
  const loadedBytes = fileValues.reduce(
    (acc, f) => acc + (f.status === "done" ? f.total : f.loaded),
    0,
  );

  if (!isWebGpuAvailable()) {
    return (
      <div className="pointer-events-auto mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
        {model.name} needs WebGPU — try Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="pointer-events-auto mb-2 overflow-hidden rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-900 dark:text-emerald-100">
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className={`relative flex size-2 shrink-0 rounded-full ${
            ready
              ? "bg-emerald-500"
              : errored
                ? "bg-rose-500"
                : "bg-emerald-400"
          }`}
        >
          {loading && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
        </span>

        <CpuIcon className="size-3.5 shrink-0 opacity-70" />

        <span className="truncate font-medium">{model.name}</span>

        <span className="mx-1 opacity-30">·</span>

        {ready && (
          <>
            <ShieldCheckIcon className="size-3.5 shrink-0" />
            <span className="truncate">Running 100% in your browser</span>
            <span className="mx-1 opacity-30">·</span>
            <span className="inline-flex items-center gap-0.5 font-medium">
              <InfinityIcon className="size-3.5" />
              <span>unlimited</span>
            </span>
          </>
        )}

        {loading && (
          <span className="truncate">
            {status.phase === "warming"
              ? "Warming up…"
              : status.totalFiles > 0
                ? `Downloading ${status.readyFiles}/${status.totalFiles} files — ${formatBytes(loadedBytes)}${
                    totalBytes ? ` / ${formatBytes(totalBytes)}` : ""
                  }`
                : "Loading model…"}
          </span>
        )}

        {idle && <span className="truncate opacity-70">Preparing…</span>}

        {errored && (
          <span className="truncate text-rose-600 dark:text-rose-400">
            {status.errorMessage ?? "Failed to load model"}
          </span>
        )}

        {(loading || idle) && (
          <span className="ml-auto shrink-0 tabular-nums font-medium">
            {pct}%
          </span>
        )}
      </div>

      {(loading || idle) && (
        <div className="h-1 w-full bg-emerald-500/15">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}
