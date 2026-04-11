import { type ReactNode, useEffect } from "react"
import { Dimensions, Pressable, StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useAIElementsTheme } from "@crafter/rn-ai-elements"

const SCREEN_WIDTH = Dimensions.get("window").width
const DRAWER_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.82), 320)
const ANIMATION_DURATION = 260
// Matches modern iPhone display corner radius so the pushed panel echoes the
// physical device shape. Applied statically so the corners always align with
// the hardware bezel when the drawer is closed (invisible) and reveal the
// curve against the sidebar when it slides open.
const DEVICE_CORNER_RADIUS = 48

interface AppDrawerProps {
  open: boolean
  onClose: () => void
  drawer: ReactNode
  children: ReactNode
}

export function AppDrawer({ open, onClose, drawer, children }: AppDrawerProps) {
  const theme = useAIElementsTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  }, [open, progress])

  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * DRAWER_WIDTH }],
  }))

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.drawer, { width: DRAWER_WIDTH }]}>{drawer}</View>
      <Animated.View
        style={[
          styles.mainOuter,
          { backgroundColor: theme.colors.background },
          mainStyle,
        ]}
      >
        <View
          style={[
            styles.mainInner,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {children}
          {open ? (
            <Pressable
              accessibilityLabel="Close sidebar"
              style={styles.backdrop}
              onPress={onClose}
            />
          ) : null}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  mainOuter: {
    flex: 1,
    borderRadius: DEVICE_CORNER_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: -12, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 20,
  },
  mainInner: {
    flex: 1,
    borderRadius: DEVICE_CORNER_RADIUS,
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
})
