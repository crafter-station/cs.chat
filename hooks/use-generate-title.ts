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
      if (!res.ok) {
        throw new Error(`Title generation failed: ${res.status}`);
      }
      const { title } = (await res.json()) as { title: string };
      if (!title) throw new Error("Empty title");
      return { title, threadId };
    },
    retry: 2,
    onSuccess: ({ title, threadId }) => {
      updateTitle.mutate({ id: threadId, title });
    },
  });
}
