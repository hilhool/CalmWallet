import { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Animated, { FadeIn, ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated'
import { useFonts } from 'expo-font'
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif'
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk'
import { colors } from './src/theme'
import { api } from './src/api/client'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'
import InsightsScreen from './src/screens/InsightsScreen'
import AddFlow from './src/screens/AddFlow'
import TabBar from './src/components/TabBar'
import BreathingDot from './src/components/BreathingDot'

function Shell() {
  const [tab, setTab] = useState('home')
  const [adding, setAdding] = useState(false)
  const [transactions, setTransactions] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setTransactions(await api.getTransactions())
    } catch {
      setTransactions((prev) => prev || [])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const reload = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  return (
    <View style={styles.shell}>
      <Animated.View key={tab} entering={FadeIn.duration(350)} style={styles.shell}>
        {tab === 'home' ? (
          <HomeScreen transactions={transactions} onReload={reload} refreshing={refreshing} />
        ) : (
          <InsightsScreen transactions={transactions} />
        )}
      </Animated.View>

      <TabBar tab={tab} onTab={setTab} onAdd={() => setAdding(true)} />

      {adding && (
        <AddFlow onClose={() => setAdding(false)} onSaved={load} />
      )}
    </View>
  )
}

function Root() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <View style={styles.splash}>
        <BreathingDot />
      </View>
    )
  }

  return user ? <Shell /> : <AuthScreen />
}

export default function App() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  })

  if (!fontsLoaded) {
    return <View style={styles.splash} />
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* при включённом «Уменьшении движения» Reanimated 4 вообще не отрисовывает
            элементы с entering-анимациями — играем анимации всегда */}
        <ReducedMotionConfig mode={ReduceMotion.Never} />
        <StatusBar style="dark" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
