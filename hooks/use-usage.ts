"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useChatContext } from "@/lib/chat-context";

interface UsageData {
  tier: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  canSend: boolean;
}

export function useUsage() {
  const { visitorId } = useChatContext();
  const { isSignedIn } = useAuth();

  return useQuery<UsageData>({
    queryKey: ["usage", visitorId, isSignedIn],
    queryFn: async () => {
      const res = await fetch(`/api/usage?fingerprintId=${visitorId}`);
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
    enabled: !!visitorId,
    refetchInterval: 60_000,
  });
}
