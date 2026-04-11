type TokenGetter = () => Promise<string | null>

let currentGetter: TokenGetter | null = null

export function setClerkTokenGetter(getter: TokenGetter | null) {
  currentGetter = getter
}

export async function getClerkToken(): Promise<string | null> {
  if (!currentGetter) return null
  try {
    return await currentGetter()
  } catch {
    return null
  }
}
