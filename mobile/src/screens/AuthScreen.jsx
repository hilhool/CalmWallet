import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated'
import { colors, emotions, type, space } from '../theme'
import { settle } from '../theme/motion'
import { tapMedium } from '../theme/haptics'
import { useAuth } from '../context/AuthContext'
import BreathingBackdrop from '../components/BreathingBackdrop'
import PressableScale from '../components/PressableScale'
import BreathingDot from '../components/BreathingDot'

export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy || !email.trim() || !password) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <View style={styles.screen}>
      <BreathingBackdrop tint={emotions.calm.tint} color={emotions.calm.color} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.content, { paddingTop: insets.top + space(20) }]}
      >
        <Animated.View entering={FadeInDown.duration(settle.duration)}>
          <Text style={styles.title}>CalmWallet</Text>
          <Text style={styles.subtitle}>дневник трат без тревоги</Text>
        </Animated.View>

        <Animated.View layout={LinearTransition.duration(300)} style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="почта"
            placeholderTextColor={colors.inkFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="пароль"
            placeholderTextColor={colors.inkFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={submit}
          />

          {error && (
            <Animated.Text entering={FadeIn.duration(300)} style={styles.error}>
              {error}
            </Animated.Text>
          )}

          <PressableScale style={styles.button} haptic={tapMedium} onPress={submit} disabled={busy}>
            {busy ? (
              <BreathingDot size={10} color={colors.card} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Войти' : 'Создать дневник'}
              </Text>
            )}
          </PressableScale>

          <PressableScale
            style={styles.switch}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? 'у меня ещё нет дневника' : 'у меня уже есть дневник'}
            </Text>
          </PressableScale>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: space(8),
  },
  title: {
    fontFamily: type.display,
    fontSize: 52,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: type.text,
    fontSize: 16,
    color: colors.inkSoft,
    marginTop: space(1),
  },
  form: {
    marginTop: space(14),
  },
  input: {
    fontFamily: type.text,
    fontSize: 17,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: space(3),
    marginBottom: space(4),
  },
  error: {
    fontFamily: type.text,
    fontSize: 14,
    color: colors.alert,
    marginBottom: space(3),
  },
  button: {
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space(4),
  },
  buttonText: {
    fontFamily: type.textSemi,
    fontSize: 17,
    color: colors.card,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: space(5),
  },
  switchText: {
    fontFamily: type.text,
    fontSize: 15,
    color: colors.inkSoft,
  },
})
