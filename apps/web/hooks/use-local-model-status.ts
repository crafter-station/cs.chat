"use client";

import { useSyncExternalStore } from "react";
import {
  getLocalModelClient,
  type LocalModelState,
} from "@/lib/local-model/client";

const EMPTY: LocalModelState = {
  modelId: null,
  phase: "idle",
  progress: 0,
  files: {},
  readyFiles: 0,
  totalFiles: 0,
};

export function useLocalModelStatus(): LocalModelState {
  return useSyncExternalStore(
    (listener) => getLocalModelClient().subscribe(listener),
    () => getLocalModelClient().getState(),
    () => EMPTY,
  );
}
