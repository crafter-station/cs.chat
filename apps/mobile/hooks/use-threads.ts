import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type ChatThread,
  createThread,
  deleteThread,
  generateThreadTitle,
  listThreads,
  updateThread,
} from "@/lib/thread-api"
import { useChatContext } from "@/lib/chat-context"

const THREADS_KEY = ["threads"]

export function useThreads() {
  const { visitorId } = useChatContext()
  return useQuery({
    queryKey: [...THREADS_KEY, visitorId],
    queryFn: async () => {
      try {
        return await listThreads(visitorId!)
      } catch (err) {
        console.warn("[threads] listThreads failed", err)
        throw err
      }
    },
    enabled: !!visitorId,
  })
}

export function useCreateThread() {
  const queryClient = useQueryClient()
  const { visitorId } = useChatContext()

  return useMutation({
    mutationFn: ({ id, model }: { id: string; model: string }) =>
      createThread({ id, model, userId: visitorId! }),
    onMutate: async ({ id, model }) => {
      const key = [...THREADS_KEY, visitorId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChatThread[]>(key)
      const optimistic: ChatThread = {
        id,
        userId: visitorId!,
        title: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model,
      }
      queryClient.setQueryData<ChatThread[]>(key, (old = []) => [
        optimistic,
        ...old,
      ])
      return { previous }
    },
    onError: (err, _vars, context) => {
      console.warn("[threads] mutation error", err)
      if (context?.previous) {
        queryClient.setQueryData(
          [...THREADS_KEY, visitorId],
          context.previous,
        )
      }
    },
  })
}

export function useUpdateThreadTitle() {
  const queryClient = useQueryClient()
  const { visitorId } = useChatContext()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateThread(id, { title }),
    onMutate: async ({ id, title }) => {
      const key = [...THREADS_KEY, visitorId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChatThread[]>(key)
      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.map((t) =>
          t.id === id
            ? { ...t, title, updatedAt: new Date().toISOString() }
            : t,
        ),
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      console.warn("[threads] mutation error", err)
      if (context?.previous) {
        queryClient.setQueryData(
          [...THREADS_KEY, visitorId],
          context.previous,
        )
      }
    },
  })
}

export function useUpdateThreadModel() {
  const queryClient = useQueryClient()
  const { visitorId } = useChatContext()
  return useMutation({
    mutationFn: ({ id, model }: { id: string; model: string }) =>
      updateThread(id, { model }),
    onMutate: async ({ id, model }) => {
      const key = [...THREADS_KEY, visitorId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChatThread[]>(key)
      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.map((t) =>
          t.id === id
            ? { ...t, model, updatedAt: new Date().toISOString() }
            : t,
        ),
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      console.warn("[threads] mutation error", err)
      if (context?.previous) {
        queryClient.setQueryData(
          [...THREADS_KEY, visitorId],
          context.previous,
        )
      }
    },
  })
}

export function useDeleteThread() {
  const queryClient = useQueryClient()
  const { visitorId } = useChatContext()
  return useMutation({
    mutationFn: (id: string) => deleteThread(id),
    onMutate: async (id: string) => {
      const key = [...THREADS_KEY, visitorId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChatThread[]>(key)
      queryClient.setQueryData<ChatThread[]>(key, (old = []) =>
        old.filter((t) => t.id !== id),
      )
      return { previous }
    },
    onError: (err, _id, context) => {
      console.warn("[threads] delete error", err)
      if (context?.previous) {
        queryClient.setQueryData(
          [...THREADS_KEY, visitorId],
          context.previous,
        )
      }
    },
  })
}

export function useGenerateTitle() {
  const updateTitle = useUpdateThreadTitle()
  return useMutation({
    mutationFn: async ({
      prompt,
      threadId,
    }: {
      prompt: string
      threadId: string
    }) => {
      const { title } = await generateThreadTitle({
        prompt,
        model: "openai/gpt-4o-mini",
      })
      return { title, threadId }
    },
    retry: 2,
    onSuccess: ({ title, threadId }) => {
      if (title) updateTitle.mutate({ id: threadId, title })
    },
  })
}
