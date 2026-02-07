"use client";

import { useMutation } from "@tanstack/react-query";
import { useUpdateThreadTitle } from "./use-threads";

export function useGenerateTitle() {
  const updateTitle = useUpdateThreadTitle();

  return useMutation({
    mutationFn: async ({
      prompt,
      threadId,
    }: {
      prompt: string;
      threadId: string;
    }) => {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "openai/gpt-4o-mini" }),
      });
      const { title } = (await res.json()) as { title: string };
      return { title, threadId };
    },
    onSuccess: ({ title, threadId }) => {
      updateTitle.mutate({ id: threadId, title });
    },
  });
}
