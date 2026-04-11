"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchThreads,
  createThreadAction,
  updateThreadTitleAction,
  updateThreadModelAction,
  deleteThreadAction,
} from "@/lib/thread-actions";
import type { ChatThread } from "@/db/schema";
import { useChatContext } from "@/lib/chat-context";

const THREADS_KEY = ["threads"];

export function useThreads() {
  const { visitorId } = useChatContext();

  return useQuery({
    queryKey: [...THREADS_KEY, visitorId],
    queryFn: () => fetchThreads(visitorId!),
    enabled: !!visitorId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const { visitorId } = useChatContext();

  return useMutation({
    mutationFn: ({ id, model }: { id: string; model: string }) =>
      createThreadAction(id, model, visitorId!),
    onMutate: async ({ id, model }) => {
      const key = [...THREADS_KEY, visitorId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatThread[]>(key);

      const optimisticThread: ChatThread = {
        id,
        userId: visitorId!,
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        model,
      };
      queryClient.setQueryData<ChatThread[]>(key, (old = []) => [
        optimisticThread,
        ...old,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...THREADS_KEY, visitorId], context.previous);
      }
    },
  });
}

export function useUpdateThreadTitle() {
  const queryClient = useQueryClient();
  const { visitorId } = useChatContext();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateThreadTitleAction(id, title),
    onMutate: async ({ id, title }) => {
      const key = [...THREADS_KEY, visitorId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatThread[]>(key);

      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.map((t) =>
          t.id === id ? { ...t, title, updatedAt: new Date() } : t
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...THREADS_KEY, visitorId], context.previous);
      }
    },
  });
}

export function useUpdateThreadModel() {
  const queryClient = useQueryClient();
  const { visitorId } = useChatContext();

  return useMutation({
    mutationFn: ({ id, model }: { id: string; model: string }) =>
      updateThreadModelAction(id, model),
    onMutate: async ({ id, model }) => {
      const key = [...THREADS_KEY, visitorId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatThread[]>(key);

      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.map((t) =>
          t.id === id ? { ...t, model, updatedAt: new Date() } : t
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...THREADS_KEY, visitorId], context.previous);
      }
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  const { visitorId } = useChatContext();

  return useMutation({
    mutationFn: (id: string) => deleteThreadAction(id),
    onMutate: async (id: string) => {
      const key = [...THREADS_KEY, visitorId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatThread[]>(key);

      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.filter((t) => t.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...THREADS_KEY, visitorId], context.previous);
      }
    },
  });
}
