import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, FadeIn,
} from 'react-native-reanimated'
import { colors } from '../theme'
import { breath } from '../theme/motion'

// Живой фон hero-зоны: тёплый градиент в тон эмоции дня и мягкое пятно,
// которое дышит в ритме спокойного человека (~14 циклов в минуту).
export default function BreathingBackdrop({ tint, color }) {
  const { width } = useWindowDimensions()
  const phase = useSharedValue(0)

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, breath), -1, true)
  }, [])

  const blobStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + phase.value * 0.25,
    transform: [{ scale: 1 + phase.value * 0.09 }],
  }))

  const size = width * 1.1

  return (
    <Animated.View key={tint} entering={FadeIn.duration(900)} style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[tint, colors.canvas]}
        locations={[0, 0.95]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -size * 0.45,
            alignSelf: 'center',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          blobStyle,
        ]}
      />
    </Animated.View>
  )
}
