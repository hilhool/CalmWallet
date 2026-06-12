import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import { colors, emotions, type, space, formatAmount } from '../theme'
import { settle } from '../theme/motion'
import { tapMedium } from '../theme/haptics'
import { api } from '../api/client'
import BreathingDot from '../components/BreathingDot'
import PressableScale from '../components/PressableScale'

const DAYS = 14
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function weekLabel(weekStart) {
  const d = new Date(weekStart)
  return `неделя с ${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

// Сглаживание Catmull-Rom → Безье: линия трат течёт, а не ломается
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// Недельное письмо от коуча: headline → три факта → вопрос для рефлексии.
function WeeklyBlock({ transactions }) {
  const [history, setHistory] = useState(null) // null = грузим, [] = пусто
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getWeeklyInsights()
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [])

  // паттернов из пары дней не вытащить — честно просим ещё данных
  const enoughData = useMemo(() => {
    const days = new Set(
      (transactions || [])
        .filter((tx) => Date.now() - new Date(tx.created_at).getTime() < 7 * 86400e3)
        .map((tx) => new Date(tx.created_at).toDateString())
    )
    return days.size >= 3
  }, [transactions])

  const refresh = async () => {
    if (generating) return
    setGenerating(true)
    setError(null)
    try {
      const fresh = await api.generateWeeklyInsights()
      setHistory((prev) => [fresh, ...(prev || []).filter((i) => i.week_start !== fresh.week_start)])
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  if (history === null) {
    return (
      <View style={styles.weeklyLoading}>
        <BreathingDot size={12} color={emotions.calm.color} />
      </View>
    )
  }

  const current = history[0] || null
  const previous = history.slice(1)

  if (!current && !enoughData) {
    return (
      <View style={styles.weeklyEmpty}>
        <Text style={styles.weeklyEmptyText}>
          Добавь ещё несколько трат,{'\n'}и я найду паттерны
        </Text>
      </View>
    )
  }

  return (
    <View>
      {current ? (
        <Animated.View entering={FadeIn.duration(settle.duration)}>
          <Text style={styles.kicker}>{weekLabel(current.week_start)}</Text>
          <Text style={styles.headline}>{current.headline}</Text>

          <View style={styles.insightList}>
            {(current.insights || []).map((item, i) => (
              <View key={i} style={styles.insightItem}>
                <Text style={styles.insightHighlight}>{item.highlight}</Text>
                <Text style={styles.insightText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.questionWrap}>
            <Text style={styles.question}>{current.question}</Text>
          </View>
        </Animated.View>
      ) : (
        <View>
          <Text style={styles.kicker}>эта неделя</Text>
          <Text style={styles.headline}>Посмотрим, что неделя говорит о тебе?</Text>
        </View>
      )}

      {error && <Text style={styles.weeklyError}>{error}</Text>}

      <PressableScale
        style={styles.refreshButton}
        haptic={tapMedium}
        onPress={refresh}
        disabled={generating}
      >
        {generating ? (
          <BreathingDot size={9} color={colors.inkSoft} />
        ) : (
          <Text style={styles.refreshText}>{current ? 'обновить инсайты' : 'найти паттерны'}</Text>
        )}
      </PressableScale>

      {previous.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.historyScroll}
          contentContainerStyle={styles.historyContent}
        >
          {previous.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <Text style={styles.historyWeek}>{weekLabel(item.week_start)}</Text>
              <Text style={styles.historyHeadline} numberOfLines={4}>{item.headline}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default function InsightsScreen({ transactions }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const stats = useMemo(() => {
    const txs = (transactions || []).filter(
      (tx) => Date.now() - new Date(tx.created_at).getTime() < DAYS * 86400e3
    )
    if (txs.length === 0) return null

    // дневные суммы + доминирующая эмоция дня
    const days = []
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - i)
      days.push({ date, total: 0, counts: {} })
    }
    const byEmotion = {}
    const byWeekday = {}
    let calmish = 0

    for (const tx of txs) {
      const created = new Date(tx.created_at)
      const amount = Number(tx.amount)
      const day = days.find((d) => {
        const next = new Date(d.date.getTime() + 86400e3)
        return created >= d.date && created < next
      })
      if (day) {
        day.total += amount
        day.counts[tx.emotional_state] = (day.counts[tx.emotional_state] || 0) + 1
      }
      byEmotion[tx.emotional_state] = (byEmotion[tx.emotional_state] || 0) + amount
      const wd = created.getDay()
      byWeekday[wd] = (byWeekday[wd] || 0) + amount
      if (tx.emotional_state === 'calm' || tx.emotional_state === 'happy') calmish++
    }

    for (const day of days) {
      day.emotion = Object.keys(day.counts).sort((a, b) => day.counts[b] - day.counts[a])[0] || null
    }

    const topEmotion = Object.keys(byEmotion).sort((a, b) => byEmotion[b] - byEmotion[a])[0]
    const peakWeekday = Object.keys(byWeekday).sort((a, b) => byWeekday[b] - byWeekday[a])[0]

    const distribution = {}
    for (const tx of txs) {
      distribution[tx.emotional_state] = (distribution[tx.emotional_state] || 0) + 1
    }
    const distItems = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, share: count / txs.length }))

    return {
      days,
      topEmotion,
      topEmotionTotal: byEmotion[topEmotion],
      peakWeekday: WEEKDAYS[peakWeekday],
      calmShare: Math.round((calmish / txs.length) * 100),
      distItems,
    }
  }, [transactions])

  if (!stats) {
    return (
      <View style={[styles.screen, styles.emptyScreen, { paddingTop: insets.top }]}>
        <BreathingDot color={emotions.calm.color} />
        <Text style={styles.emptyText}>
          История появится,{'\n'}когда будет пара записей.
        </Text>
      </View>
    )
  }

  const chartWidth = width - space(14)
  const chartHeight = 170
  const maxTotal = Math.max(...stats.days.map((d) => d.total), 1)
  const points = stats.days.map((day, i) => ({
    x: (i / (DAYS - 1)) * chartWidth,
    y: chartHeight - 18 - (day.total / maxTotal) * (chartHeight - 40),
    day,
  }))
  const line = smoothPath(points)
  const area = `${line} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
  const topMeta = emotions[stats.topEmotion]

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space(8) }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(settle.duration)}>
        <WeeklyBlock transactions={transactions} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(settle.duration).delay(100)} style={styles.twoWeeks}>
        <Text style={styles.kicker}>две недели</Text>
        <Text style={styles.story}>
          Когда тебе <Text style={{ color: topMeta.color }}>{topMeta.label}</Text>, уходит больше всего —
        </Text>
        <Text style={styles.keyNumber}>{formatAmount(stats.topEmotionTotal)} ₽</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(settle.duration).delay(150)} style={styles.chart}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={topMeta.color} stopOpacity="0.22" />
              <Stop offset="1" stopColor={topMeta.color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke={colors.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          {points.map((p, i) =>
            p.day.total > 0 && p.day.emotion ? (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill={emotions[p.day.emotion].color}
                stroke={colors.canvas}
                strokeWidth={1.5}
              />
            ) : null
          )}
        </Svg>
        <View style={styles.chartEdges}>
          <Text style={styles.chartEdge}>две недели назад</Text>
          <Text style={styles.chartEdge}>сегодня</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(settle.duration).delay(250)} style={styles.factsRow}>
        <View style={styles.fact}>
          <Text style={styles.factNumber}>{stats.calmShare}%</Text>
          <Text style={styles.factCaption}>трат — в спокойствии</Text>
        </View>
        <View style={styles.fact}>
          <Text style={styles.factNumber}>{stats.peakWeekday}</Text>
          <Text style={styles.factCaption}>самый затратный день</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(settle.duration).delay(350)} style={styles.distBlock}>
        <Text style={styles.sectionLabel}>в каком настроении ты тратишь</Text>
        <View style={styles.distBar}>
          {stats.distItems.map(({ key, share }) => (
            <View
              key={key}
              style={{
                flex: share,
                backgroundColor: emotions[key].color,
                marginRight: 2,
                borderRadius: 7,
              }}
            />
          ))}
        </View>
        <View style={styles.distLegend}>
          {stats.distItems.slice(0, 3).map(({ key, share }) => (
            <View key={key} style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: emotions[key].color }]} />
              <Text style={styles.distLabel}>
                {emotions[key].label} · {Math.round(share * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: space(7),
    paddingBottom: space(34),
  },
  emptyScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(6),
  },
  emptyText: {
    fontFamily: type.display,
    fontSize: 20,
    lineHeight: 30,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  kicker: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  weeklyLoading: {
    alignItems: 'center',
    paddingVertical: space(10),
  },
  weeklyEmpty: {
    paddingVertical: space(6),
  },
  weeklyEmptyText: {
    fontFamily: type.display,
    fontSize: 24,
    lineHeight: 34,
    color: colors.inkSoft,
  },
  headline: {
    fontFamily: type.display,
    fontSize: 30,
    lineHeight: 40,
    color: colors.ink,
    marginTop: space(3),
  },
  insightList: {
    marginTop: space(7),
    gap: space(6),
  },
  insightItem: {},
  insightHighlight: {
    fontFamily: type.display,
    fontSize: 34,
    lineHeight: 42,
    color: colors.positive,
  },
  insightText: {
    fontFamily: type.text,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: space(1),
  },
  questionWrap: {
    marginTop: space(8),
    borderLeftWidth: 1.5,
    borderLeftColor: colors.inkFaint,
    paddingLeft: space(4),
  },
  question: {
    fontFamily: type.displayItalic,
    fontSize: 19,
    lineHeight: 28,
    color: colors.inkSoft,
  },
  weeklyError: {
    fontFamily: type.text,
    fontSize: 14,
    color: colors.alert,
    marginTop: space(5),
  },
  refreshButton: {
    alignSelf: 'flex-start',
    height: 44,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(5),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginTop: space(7),
  },
  refreshText: {
    fontFamily: type.textMedium,
    fontSize: 14,
    color: colors.ink,
  },
  historyScroll: {
    marginTop: space(7),
    marginHorizontal: -space(7),
  },
  historyContent: {
    paddingHorizontal: space(7),
    gap: space(3),
  },
  historyCard: {
    width: 220,
    padding: space(4),
    borderRadius: 16,
    backgroundColor: colors.canvasDeep,
  },
  historyWeek: {
    fontFamily: type.textSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  historyHeadline: {
    fontFamily: type.display,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    marginTop: space(2),
  },
  twoWeeks: {
    marginTop: space(12),
    paddingTop: space(8),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  story: {
    fontFamily: type.display,
    fontSize: 28,
    lineHeight: 38,
    color: colors.ink,
    marginTop: space(3),
  },
  keyNumber: {
    fontFamily: type.display,
    fontSize: 56,
    lineHeight: 66,
    color: colors.ink,
    marginTop: space(1),
  },
  chart: {
    marginTop: space(8),
  },
  chartEdges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space(1),
  },
  chartEdge: {
    fontFamily: type.text,
    fontSize: 12,
    color: colors.inkFaint,
  },
  factsRow: {
    flexDirection: 'row',
    gap: space(5),
    marginTop: space(10),
  },
  fact: {
    flex: 1,
  },
  factNumber: {
    fontFamily: type.display,
    fontSize: 34,
    color: colors.ink,
  },
  factCaption: {
    fontFamily: type.text,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: space(1),
  },
  sectionLabel: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: space(4),
  },
  distBlock: {
    marginTop: space(10),
  },
  distBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  distLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(4),
    marginTop: space(3),
  },
  distItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1.5),
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distLabel: {
    fontFamily: type.text,
    fontSize: 13,
    color: colors.inkSoft,
  },
})
