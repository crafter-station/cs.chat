import type { UIMessage } from "ai"
import { API_BASE_URL } from "@/lib/api"
import { getClerkToken } from "@/lib/clerk-token"

export interface ChatThread {
  id: string
  userId: string
  title: string | null
  model: string
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getClerkToken()
  const url = `${API_BASE_URL}${path}`
  const method = init?.method ?? "GET"
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch (err) {
    console.warn(`[thread-api] ${method} ${url} network error`, err)
    throw err
  }
  if (!res.ok) {
    let body = ""
    try {
      body = await res.text()
    } catch {}
    console.warn(
      `[thread-api] ${method} ${url} -> ${res.status} ${res.statusText}`,
      body,
    )
    throw new Error(`${method} ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function listThreads(userId: string) {
  return request<{ threads: ChatThread[] }>(
    `/api/threads?userId=${encodeURIComponent(userId)}`,
  ).then((r) => r.threads)
}

export function createThread(params: {
  id: string
  model: string
  userId: string
}) {
  return request<{ ok: true }>("/api/threads", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function updateThread(
  id: string,
  patch: { title?: string; model?: string },
) {
  return request<{ ok: true }>(`/api/threads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function deleteThread(id: string) {
  return request<{ ok: true }>(`/api/threads/${id}`, {
    method: "DELETE",
  })
}

export function fetchThreadMessages(id: string) {
  return request<{ messages: UIMessage[] }>(
    `/api/threads/${id}/messages`,
  ).then((r) => r.messages)
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  return request<{ ok: true }>(`/api/threads/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ messages }),
  })
}

export function generateThreadTitle(params: { prompt: string; model: string }) {
  return request<{ title: string }>("/api/title", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export interface UsageData {
  tier: string
  used: number
  limit: number | null
  remaining: number | null
  canSend: boolean
}

export function fetchUsage(userId: string) {
  return request<UsageData>(
    `/api/usage?fingerprintId=${encodeURIComponent(userId)}`,
  )
}
