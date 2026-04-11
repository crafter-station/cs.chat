import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAIElementsTheme } from "@crafter/rn-ai-elements"
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import { useSignIn, useSignUp } from "@clerk/expo"
import { ArrowLeft, X } from "lucide-react-native"

const SUPPORTS_GLASS = isLiquidGlassAvailable()

type Step = "email" | "code"
type Mode = "sign-in" | "sign-up"

interface SignInSheetProps {
  visible: boolean
  onClose: () => void
}

export function SignInSheet({ visible, onClose }: SignInSheetProps) {
  const theme = useAIElementsTheme()
  const insets = useSafeAreaInsets()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()

  const [step, setStep] = useState<Step>("email")
  const [mode, setMode] = useState<Mode>("sign-in")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailInputRef = useRef<TextInput>(null)
  const codeInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!visible) return
    setStep("email")
    setMode("sign-in")
    setEmail("")
    setCode("")
    setBusy(false)
    setError(null)
    const t = setTimeout(() => emailInputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [visible])

  useEffect(() => {
    if (step === "code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [step])

  const showError = (err: { message?: string; longMessage?: string } | null) => {
    setError(err?.longMessage ?? err?.message ?? "Something went wrong.")
  }

  const handleRequestCode = useCallback(async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    Keyboard.dismiss()
    setBusy(true)
    setError(null)

    // Try sign-in first.
    const sendResult = await signIn.emailCode.sendCode({
      emailAddress: trimmed,
    })

    if (!sendResult.error) {
      setMode("sign-in")
      setStep("code")
      setBusy(false)
      return
    }

    // No matching account → fall through to sign-up.
    if (sendResult.error.code === "form_identifier_not_found") {
      const createResult = await signUp.create({ emailAddress: trimmed })
      if (createResult.error) {
        showError(createResult.error)
        setBusy(false)
        return
      }
      const prepareResult = await signUp.verifications.sendEmailCode()
      if (prepareResult.error) {
        showError(prepareResult.error)
        setBusy(false)
        return
      }
      setMode("sign-up")
      setStep("code")
      setBusy(false)
      return
    }

    showError(sendResult.error)
    setBusy(false)
  }, [email, signIn, signUp])

  const handleVerify = useCallback(async () => {
    const trimmed = code.trim()
    if (trimmed.length < 4) return
    Keyboard.dismiss()
    setBusy(true)
    setError(null)

    if (mode === "sign-in") {
      const verifyResult = await signIn.emailCode.verifyCode({ code: trimmed })
      if (verifyResult.error) {
        showError(verifyResult.error)
        setBusy(false)
        return
      }
      const finalizeResult = await signIn.finalize()
      if (finalizeResult.error) {
        showError(finalizeResult.error)
        setBusy(false)
        return
      }
      onClose()
      return
    }

    const verifyResult = await signUp.verifications.verifyEmailCode({
      code: trimmed,
    })
    if (verifyResult.error) {
      showError(verifyResult.error)
      setBusy(false)
      return
    }
    const finalizeResult = await signUp.finalize()
    if (finalizeResult.error) {
      showError(finalizeResult.error)
      setBusy(false)
      return
    }
    onClose()
  }, [code, mode, signIn, signUp, onClose])

  const handleBack = useCallback(() => {
    setStep("email")
    setCode("")
    setError(null)
  }, [])

  const canSubmit =
    step === "email" ? email.trim().length > 3 : code.trim().length >= 4

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: "100%" }}
        >
          <GlassView
            glassEffectStyle="regular"
            style={[
              styles.sheet,
              {
                borderColor: theme.colors.border,
                backgroundColor: SUPPORTS_GLASS
                  ? "transparent"
                  : theme.colors.card,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            <View style={styles.header}>
              {step === "code" ? (
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <ArrowLeft
                    size={20}
                    color={theme.colors.foreground}
                    strokeWidth={2}
                  />
                </Pressable>
              ) : (
                <View style={{ width: 20 }} />
              )}
              <Text
                style={[styles.title, { color: theme.colors.foreground }]}
              >
                {step === "email" ? "Sign in to C3" : "Check your email"}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <X
                  size={20}
                  color={theme.colors.mutedForeground}
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.mutedForeground },
              ]}
            >
              {step === "email"
                ? "We'll email you a code. No password needed."
                : `We sent a 6-digit code to ${email}.`}
            </Text>

            {step === "email" ? (
              <TextInput
                ref={emailInputRef}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="go"
                onSubmitEditing={handleRequestCode}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.foreground,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              />
            ) : (
              <TextInput
                ref={codeInputRef}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={theme.colors.mutedForeground}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                returnKeyType="go"
                onSubmitEditing={handleVerify}
                style={[
                  styles.input,
                  styles.codeInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.foreground,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              />
            )}

            {error ? (
              <Text
                style={[styles.error, { color: theme.colors.destructive }]}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={step === "email" ? handleRequestCode : handleVerify}
              disabled={!canSubmit || busy}
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: !canSubmit || busy ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    { color: theme.colors.primaryForeground },
                  ]}
                >
                  {step === "email" ? "Send code" : "Verify"}
                </Text>
              )}
            </Pressable>
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 6,
    fontSize: 20,
    fontWeight: "600",
  },
  error: {
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  submit: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
