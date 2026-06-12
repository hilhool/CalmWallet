import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { colors, emotions, type, space } from '../theme'
import { reveal } from '../theme/motion'
import BreathingDot from './BreathingDot'
import PressableScale from './PressableScale'

// Ответ коуча — не уведомление, а момент присутствия.
// Сначала пауза с дыханием (собеседник «думает»), потом слова. Много воздуха.
export default function CoachReveal({ emotion, message, onDone }) {
  const meta = emotions[emotion] || emotions.calm
  const [phase, setPhase] = useState('breathing') // breathing → message → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('message'), 1600)
    const t2 = setTimeout(() => setPhase('done'), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: meta.tint }]}
    >
      <View style={styles.body}>
        {phase === 'breathing' ? (
          <BreathingDot size={16} color={meta.color} />
        ) : (
          <Animated.View entering={FadeIn.duration(reveal.duration)} style={styles.messageWrap}>
            <Text style={[styles.label, { color: meta.color }]}>
              {message ? 'твой коуч' : 'записано'}
            </Text>
            <Text style={styles.message}>
              {message || 'Ты заметил эту трату и то, что за ней стояло. Это уже забота о себе.'}
            </Text>
          </Animated.View>
        )}
      </View>

      {phase === 'done' && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.footer}>
          <PressableScale onPress={onDone} style={styles.thanks}>
            <Text style={styles.thanksText}>спасибо</Text>
          </PressableScale>
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(9),
  },
  messageWrap: {
    alignItems: 'center',
  },
  label: {
    fontFamily: type.textSemi,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: space(6),
  },
  message: {
    fontFamily: type.display,
    fontSize: 26,
    lineHeight: 38,
    color: colors.ink,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: space(16),
  },
  thanks: {
    paddingVertical: space(3),
    paddingHorizontal: space(8),
  },
  thanksText: {
    fontFamily: type.textMedium,
    fontSize: 16,
    color: colors.inkSoft,
  },
})
