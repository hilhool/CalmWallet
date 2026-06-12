import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeIn, FadeInDown, FadeOut, LinearTransition, SlideInDown, SlideOutDown,
  useSharedValue, useAnimatedStyle, withSpring, interpolate,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { colors, emotions, categories, triggers, EMOTION_ORDER, type, space } from '../theme'
import { gentleSpring, settle } from '../theme/motion'
import { tapLight, tapMedium, noteSuccess } from '../theme/haptics'
import { api } from '../api/client'
import PressableScale from '../components/PressableScale'
import BreathingDot from '../components/BreathingDot'
import CoachReveal from '../components/CoachReveal'

const KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [',', '0', '⌫']]

function groupInt(str) {
  const [int, frac] = str.split(',')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return frac !== undefined ? `${grouped},${frac}` : grouped
}

// Выбор эмоции как физический жест: выбранная подаётся вперёд,
// остальные отступают. Подпись появляется только у выбранной.
function EmotionOption({ ekey, selected, anySelected, onPick }) {
  const meta = emotions[ekey]
  const target = selected ? 1 : anySelected ? -1 : 0
  const sv = useSharedValue(0)

  useEffect(() => {
    sv.value = withSpring(target, gentleSpring)
  }, [target])

  const circleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [-1, 0, 1], [0.35, 1, 1]),
    transform: [{ scale: interpolate(sv.value, [-1, 0, 1], [0.84, 1, 1.18]) }],
  }))

  return (
    <PressableScale onPress={() => onPick(ekey)} haptic={tapMedium} scaleTo={0.88}>
      <View style={styles.emotionItem}>
        <Animated.View
          style={[
            styles.emotionCircle,
            { backgroundColor: selected ? meta.color : meta.tint },
            circleStyle,
          ]}
        >
          {!selected && <View style={[styles.emotionCore, { backgroundColor: meta.color }]} />}
        </Animated.View>
        <Text style={[styles.emotionLabel, { opacity: selected ? 1 : 0 }]}>{meta.label}</Text>
      </View>
    </PressableScale>
  )
}

export default function AddFlow({ onClose, onSaved }) {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef(null)

  const [amount, setAmount] = useState('')
  const [emotion, setEmotion] = useState(null)
  const [category, setCategory] = useState(null)
  const [trigger, setTrigger] = useState(null)
  const [note, setNote] = useState('')
  const [keypadOpen, setKeypadOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [coach, setCoach] = useState(null)

  const amountNum = parseFloat(amount.replace(',', '.')) || 0

  const pressKey = (key) => {
    setAmount((prev) => {
      if (key === '⌫') return prev.slice(0, -1)
      if (key === ',') {
        if (prev.includes(',')) return prev
        return prev === '' ? '0,' : prev + ','
      }
      const [int, frac] = prev.split(',')
      if (frac !== undefined && frac.length >= 2) return prev
      if (frac === undefined && int.length >= 7) return prev
      if (prev === '0') return key
      return prev + key
    })
  }

  const pickEmotion = (ekey) => {
    setEmotion(ekey)
    setKeypadOpen(false)
  }

  // интерфейс раскрывается вниз — мягко довозим взгляд до нового шага
  useEffect(() => {
    if (emotion || category) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350)
      return () => clearTimeout(t)
    }
  }, [emotion, category])

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const tx = await api.createTransaction({
        amount: amountNum,
        category,
        emotional_state: emotion,
        triggered_by: trigger || undefined,
        note: note.trim() || undefined,
      })
      noteSuccess()
      onSaved()
      setCoach({ message: tx.ai_response })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(26).stiffness(140).mass(1)}
      exiting={SlideOutDown.duration(350)}
      style={[StyleSheet.absoluteFill, styles.screen]}
    >
      {coach ? (
        <CoachReveal emotion={emotion} message={coach.message} onDone={onClose} />
      ) : (
        <View style={[styles.inner, { paddingTop: insets.top + space(3) }]}>
          <View style={styles.topRow}>
            <PressableScale style={styles.close} haptic={tapLight} onPress={onClose} scaleTo={0.85}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M6 6 L18 18 M18 6 L6 18"
                  stroke={colors.inkSoft}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
              </Svg>
            </PressableScale>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PressableScale scaleTo={0.98} onPress={() => setKeypadOpen((open) => (emotion ? !open : true))}>
              <Animated.View layout={LinearTransition.duration(300)}>
                <Text style={styles.amountLabel}>сколько ушло</Text>
                <Text style={[styles.amount, !amount && styles.amountEmpty]}>
                  {amount ? groupInt(amount) : '0'}
                  <Text style={styles.amountCurrency}> ₽</Text>
                </Text>
              </Animated.View>
            </PressableScale>

            {amountNum > 0 && (
              <Animated.View
                entering={FadeInDown.duration(settle.duration)}
                layout={LinearTransition.duration(300)}
                style={styles.section}
              >
                <Text style={styles.sectionLabel}>что ты чувствуешь</Text>
                <View style={styles.emotionRow}>
                  {EMOTION_ORDER.map((ekey) => (
                    <EmotionOption
                      key={ekey}
                      ekey={ekey}
                      selected={emotion === ekey}
                      anySelected={!!emotion}
                      onPick={pickEmotion}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {emotion && (
              <Animated.View
                entering={FadeInDown.duration(settle.duration).delay(120)}
                layout={LinearTransition.duration(300)}
                style={styles.section}
              >
                <Text style={styles.sectionLabel}>на что</Text>
                <View style={styles.chipWrap}>
                  {Object.entries(categories).map(([key, label]) => (
                    <PressableScale
                      key={key}
                      haptic={tapLight}
                      onPress={() => setCategory(key)}
                      style={[
                        styles.chip,
                        category === key && { backgroundColor: emotions[emotion].color, borderColor: emotions[emotion].color },
                      ]}
                    >
                      <Text style={[styles.chipText, category === key && styles.chipTextActive]}>
                        {label}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </Animated.View>
            )}

            {category && (
              <Animated.View
                entering={FadeInDown.duration(settle.duration).delay(120)}
                layout={LinearTransition.duration(300)}
                style={styles.section}
              >
                <Text style={styles.sectionLabel}>что подтолкнуло · необязательно</Text>
                <View style={styles.chipWrap}>
                  {Object.entries(triggers).map(([key, label]) => (
                    <PressableScale
                      key={key}
                      haptic={tapLight}
                      onPress={() => setTrigger(trigger === key ? null : key)}
                      style={[styles.chipSmall, trigger === key && styles.chipSmallActive]}
                    >
                      <Text style={[styles.chipSmallText, trigger === key && styles.chipTextActive]}>
                        {label}
                      </Text>
                    </PressableScale>
                  ))}
                </View>

                <TextInput
                  style={styles.noteInput}
                  placeholder="заметка, если хочется"
                  placeholderTextColor={colors.inkFaint}
                  value={note}
                  onChangeText={setNote}
                  maxLength={200}
                />
              </Animated.View>
            )}

            {error && (
              <Animated.Text entering={FadeIn.duration(300)} style={styles.error}>
                {error}
              </Animated.Text>
            )}
          </ScrollView>

          {keypadOpen ? (
            <Animated.View
              entering={FadeInDown.duration(settle.duration)}
              exiting={FadeOut.duration(250)}
              style={[styles.keypad, { paddingBottom: Math.max(insets.bottom, space(4)) }]}
            >
              {KEYS.map((row, i) => (
                <View key={i} style={styles.keyRow}>
                  {row.map((key) => (
                    <PressableScale
                      key={key}
                      style={styles.key}
                      haptic={tapLight}
                      scaleTo={0.88}
                      onPress={() => pressKey(key)}
                    >
                      <Text style={styles.keyText}>{key}</Text>
                    </PressableScale>
                  ))}
                </View>
              ))}
            </Animated.View>
          ) : category ? (
            <Animated.View
              entering={FadeInDown.duration(settle.duration).delay(150)}
              style={[styles.saveWrap, { paddingBottom: Math.max(insets.bottom, space(4)) }]}
            >
              <PressableScale
                style={[styles.save, { backgroundColor: colors.ink }]}
                haptic={tapMedium}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <BreathingDot size={10} color={colors.card} />
                ) : (
                  <Text style={styles.saveText}>Записать</Text>
                )}
              </PressableScale>
            </Animated.View>
          ) : null}
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  inner: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space(5),
  },
  close: {
    padding: space(3),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space(7),
    paddingBottom: space(8),
  },
  amountLabel: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginTop: space(4),
  },
  amount: {
    fontFamily: type.display,
    fontSize: 76,
    lineHeight: 88,
    color: colors.ink,
    marginTop: space(1),
  },
  amountEmpty: {
    color: colors.inkFaint,
  },
  amountCurrency: {
    fontSize: 44,
    color: colors.inkFaint,
  },
  section: {
    marginTop: space(9),
  },
  sectionLabel: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: space(4),
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emotionItem: {
    alignItems: 'center',
    gap: space(2),
  },
  emotionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  emotionLabel: {
    fontFamily: type.textMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2.5),
  },
  chip: {
    paddingHorizontal: space(4.5),
    paddingVertical: space(2.5),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipText: {
    fontFamily: type.textMedium,
    fontSize: 15,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.card,
  },
  chipSmall: {
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSmallActive: {
    backgroundColor: colors.inkSoft,
    borderColor: colors.inkSoft,
  },
  chipSmallText: {
    fontFamily: type.text,
    fontSize: 14,
    color: colors.inkSoft,
  },
  noteInput: {
    fontFamily: type.text,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: space(2.5),
    marginTop: space(5),
  },
  error: {
    fontFamily: type.text,
    fontSize: 14,
    color: colors.alert,
    marginTop: space(4),
  },
  keypad: {
    paddingHorizontal: space(5),
  },
  keyRow: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: type.display,
    fontSize: 28,
    color: colors.ink,
  },
  saveWrap: {
    paddingHorizontal: space(7),
  },
  save: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: type.textSemi,
    fontSize: 17,
    color: colors.card,
  },
})
