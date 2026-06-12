import { Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { gentleSpring } from '../theme/motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Базовый тактильный отклик: всё нажимаемое мягко поддаётся под пальцем.
// Стиль и transform на одном узле: если style уезжает на вложенный View,
// flex-раскладка родителя перестаёт видеть размеры кнопки.
export default function PressableScale({ children, style, onPress, onLongPress, haptic, scaleTo = 0.96, disabled }) {
  const pressed = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pressed.value * (scaleTo - 1) }],
  }))

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { pressed.value = withSpring(1, gentleSpring); haptic?.() }}
      onPressOut={() => { pressed.value = withSpring(0, gentleSpring) }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}
