import { View } from 'react-native'
import { emotions } from '../theme'

// Эмоциональный контекст траты — без слов: цветная точка с мягким ореолом.
export default function EmotionMark({ emotion, size = 12 }) {
  const meta = emotions[emotion] || emotions.calm
  const halo = size * 2

  return (
    <View
      style={{
        width: halo,
        height: halo,
        borderRadius: halo / 2,
        backgroundColor: meta.tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.color,
        }}
      />
    </View>
  )
}
