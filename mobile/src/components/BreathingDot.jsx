import { useEffect } from 'react'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
} from 'react-native-reanimated'
import { colors } from '../theme'
import { breath } from '../theme/motion'

// Вместо спиннера — точка, которая дышит. Ожидание как пауза, не как сбой.
export default function BreathingDot({ size = 14, color = colors.inkSoft }) {
  const phase = useSharedValue(0)

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, { ...breath, duration: 1800 }), -1, true)
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + phase.value * 0.6,
    transform: [{ scale: 0.8 + phase.value * 0.35 }],
  }))

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  )
}
