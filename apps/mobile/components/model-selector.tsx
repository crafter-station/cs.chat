import { useMemo } from "react"
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAIElementsTheme } from "@crafter/rn-ai-elements"
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import { Check, ChevronDown } from "lucide-react-native"
import { chefs, models, type Model } from "@cs-chat/shared"

const SUPPORTS_GLASS = isLiquidGlassAvailable()

interface ModelSelectorTriggerProps {
  selectedModelId: string
  onPress: () => void
}

export function ModelSelectorTrigger({
  selectedModelId,
  onPress,
}: ModelSelectorTriggerProps) {
  const theme = useAIElementsTheme()
  const selected = models.find((m) => m.id === selectedModelId) ?? models[0]

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.trigger,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.triggerText, { color: theme.colors.foreground }]}
      >
        {selected.name}
      </Text>
      <ChevronDown
        size={14}
        color={theme.colors.mutedForeground}
        strokeWidth={2.5}
      />
    </Pressable>
  )
}

interface ModelSelectorMenuProps {
  visible: boolean
  selectedModelId: string
  onSelect: (modelId: string) => void
  onClose: () => void
}

export function ModelSelectorMenu({
  visible,
  selectedModelId,
  onSelect,
  onClose,
}: ModelSelectorMenuProps) {
  const theme = useAIElementsTheme()
  const insets = useSafeAreaInsets()

  const grouped = useMemo(
    () =>
      chefs.map((chef) => ({
        chef,
        items: models.filter((m) => m.chef === chef),
      })),
    [],
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={{ height: insets.top + 48 }} />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassView
            glassEffectStyle="regular"
            colorScheme={theme.dark ? "dark" : "light"}
            style={[
              styles.menu,
              {
                borderColor: theme.colors.border,
                backgroundColor: SUPPORTS_GLASS
                  ? "transparent"
                  : theme.colors.card,
              },
            ]}
          >
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {grouped.map((group, groupIdx) => (
              <View key={group.chef}>
                {groupIdx > 0 ? (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    styles.groupLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  {group.chef}
                </Text>
                {group.items.map((model) => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    selected={model.id === selectedModelId}
                    onPress={() => {
                      onSelect(model.id)
                      onClose()
                    }}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

interface ModelRowProps {
  model: Model
  selected: boolean
  onPress: () => void
}

function ModelRow({ model, selected, onPress }: ModelRowProps) {
  const theme = useAIElementsTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: theme.colors.muted } : null,
      ]}
    >
      <View style={styles.rowCheckSlot}>
        {selected ? (
          <Check
            size={16}
            color={theme.colors.foreground}
            strokeWidth={2.5}
          />
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.rowText, { color: theme.colors.foreground }]}
      >
        {model.name}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
  },
  menu: {
    width: 280,
    maxHeight: 420,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
    marginHorizontal: 12,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowCheckSlot: {
    width: 22,
    alignItems: "center",
  },
  rowText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
})
