import { useQuery } from "@tanstack/react-query"
import { fetchUsage, type UsageData } from "@/lib/thread-api"
import { useChatContext } from "@/lib/chat-context"

export function useUsage() {
  const { visitorId } = useChatContext()
  return useQuery<UsageData>({
    queryKey: ["usage", visitorId],
    queryFn: () => fetchUsage(visitorId!),
    enabled: !!visitorId,
    refetchInterval: 60_000,
  })
}
