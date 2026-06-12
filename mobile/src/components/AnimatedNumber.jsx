import { useEffect } from 'react'
import { TextInput, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

// Цифры не появляются — «досчитываются», как взгляд, привыкающий к сумме.
export default function AnimatedNumber({ value, style, suffix = ' ₽' }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [value])

  const animatedProps = useAnimatedProps(() => {
    const n = Math.round(progress.value)
    const text = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix
    return { text, defaultValue: text }
  })

  return (
    <AnimatedTextInput
      editable={false}
      animatedProps={animatedProps}
      style={[styles.reset, style]}
    />
  )
}

const styles = StyleSheet.create({
  reset: { padding: 0, margin: 0 },
})
