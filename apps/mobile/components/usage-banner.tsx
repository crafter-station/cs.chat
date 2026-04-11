import { type ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useAIElementsTheme } from "@crafter/rn-ai-elements"

import { useUsage } from "@/hooks/use-usage"

export function UsageBanner() {
  const { data } = useUsage()

  if (!data || data.tier === "paid") return null
  const blocked = !data.canSend

  if (data.tier === "anonymous") {
    if (!blocked && data.used < 2) return null
    return (
      <Banner blocked={blocked}>
        {blocked
          ? "Daily limit reached. Sign up to continue."
          : `${data.remaining} of ${data.limit} free messages remaining today.`}
      </Banner>
    )
  }

  if (data.tier === "free") {
    if (!blocked && data.used < 10) return null
    return (
      <Banner blocked={blocked}>
        {blocked
          ? "Daily limit reached. Upgrade to Pro."
          : `${data.remaining} of ${data.limit} messages remaining today.`}
      </Banner>
    )
  }

  return null
}

function Banner({
  blocked,
  children,
}: {
  blocked: boolean
  children: ReactNode
}) {
  const theme = useAIElementsTheme()
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: blocked
            ? `${theme.colors.primary}26`
            : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: blocked
              ? theme.colors.primary
              : theme.colors.mutedForeground,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 6,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  text: {
    fontSize: 12,
    textAlign: "center",
  },
})
