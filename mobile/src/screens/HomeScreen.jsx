import { useMemo } from 'react'
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, emotions, categories, type, space, formatAmount } from '../theme'
import { settle } from '../theme/motion'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import BreathingBackdrop from '../components/BreathingBackdrop'
import AnimatedNumber from '../components/AnimatedNumber'
import EmotionMark from '../components/EmotionMark'
import BreathingDot from '../components/BreathingDot'
import PressableScale from '../components/PressableScale'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayTitle(date) {
  const now = new Date()
  if (isSameDay(date, now)) return 'сегодня'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'вчера'
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date)
  } catch {
    return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  }
}

// Доминирующая эмоция дня — по числу трат, при равенстве побеждает свежая
function dominantEmotion(txs) {
  const counts = {}
  for (const tx of txs) counts[tx.emotional_state] = (counts[tx.emotional_state] || 0) + 1
  let best = null
  for (const tx of txs) {
    if (!best || counts[tx.emotional_state] > counts[best]) best = tx.emotional_state
  }
  return best
}

export default function HomeScreen({ transactions, onReload, refreshing }) {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()

  const { todayTotal, mood, weekInsight, listData } = useMemo(() => {
    const txs = transactions || []
    const now = new Date()
    const todayTxs = txs.filter((tx) => isSameDay(new Date(tx.created_at), now))
    const weekAgo = new Date(now.getTime() - 7 * 86400e3)
    const insightTx = txs.find((tx) => tx.ai_response && new Date(tx.created_at) > weekAgo)

    const data = []
    let lastTitle = null
    for (const tx of txs) {
      const title = dayTitle(new Date(tx.created_at))
      if (title !== lastTitle) {
        data.push({ key: `h-${title}`, type: 'header', title })
        lastTitle = title
      }
      data.push({ key: tx.id, type: 'tx', tx })
    }

    return {
      todayTotal: todayTxs.reduce((sum, tx) => sum + Number(tx.amount), 0),
      mood: dominantEmotion(todayTxs),
      weekInsight: insightTx?.ai_response || null,
      listData: data,
    }
  }, [transactions])

  const moodMeta = mood ? emotions[mood] : null

  const confirmDelete = (tx) => {
    Alert.alert('Убрать запись?', `${categories[tx.category]} · ${formatAmount(Number(tx.amount))} ₽`, [
      { text: 'Оставить', style: 'cancel' },
      {
        text: 'Убрать',
        style: 'destructive',
        onPress: () => api.deleteTransaction(tx.id).then(onReload).catch(() => {}),
      },
    ])
  }

  const renderItem = ({ item, index }) => {
    if (item.type === 'header') {
      return <Text style={styles.dayHeader}>{item.title}</Text>
    }
    const { tx } = item
    return (
      <Animated.View entering={FadeInDown.duration(settle.duration).delay(Math.min(index * 40, 400))}>
        <PressableScale style={styles.row} scaleTo={0.98} onLongPress={() => confirmDelete(tx)}>
          <View style={styles.rowInner}>
            <EmotionMark emotion={tx.emotional_state} />
            <View style={styles.rowBody}>
              <Text style={styles.rowCategory}>{categories[tx.category] || tx.category}</Text>
              {tx.note ? (
                <Text style={styles.rowNote} numberOfLines={1}>{tx.note}</Text>
              ) : null}
            </View>
            <Text style={styles.rowAmount}>−{formatAmount(Number(tx.amount))} ₽</Text>
          </View>
        </PressableScale>
      </Animated.View>
    )
  }

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + space(6) }]}>
        <BreathingBackdrop
          tint={moodMeta ? moodMeta.tint : colors.canvasDeep}
          color={moodMeta ? moodMeta.color : colors.line}
        />
        <View style={styles.heroTop}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <PressableScale onPress={logout} style={styles.logout}>
            <Text style={styles.logoutText}>выйти</Text>
          </PressableScale>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.heroLabel}>за сегодня</Text>
          <AnimatedNumber value={todayTotal} style={styles.heroAmount} />
          <View style={styles.moodLine}>
            <View
              style={[
                styles.moodDot,
                { backgroundColor: moodMeta ? moodMeta.color : colors.inkFaint },
              ]}
            />
            <Text style={styles.moodText}>
              {moodMeta ? moodMeta.phrase : 'день ещё пишется'}
            </Text>
          </View>
        </View>
      </View>

      {weekInsight && (
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.insight}>
          <View style={[styles.insightRule, { backgroundColor: (moodMeta || emotions.calm).color }]} />
          <View style={styles.insightBody}>
            <Text style={styles.insightLabel}>коуч заметил на этой неделе</Text>
            <Text style={styles.insightText}>{weekInsight}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  )

  const empty = transactions === null ? (
    <View style={styles.empty}>
      <BreathingDot />
    </View>
  ) : (
    <View style={styles.empty}>
      <BreathingDot color={emotions.calm.color} />
      <Text style={styles.emptyText}>
        Здесь будут твои записи.{'\n'}Без оценок — просто наблюдение.
      </Text>
    </View>
  )

  return (
    <FlatList
      style={styles.screen}
      data={listData}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onReload} tintColor={colors.inkSoft} />
      }
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  listContent: {
    paddingBottom: space(34),
  },
  hero: {
    paddingHorizontal: space(7),
    paddingBottom: space(10),
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: type.textMedium,
    fontSize: 15,
    color: colors.inkSoft,
  },
  logout: {
    paddingVertical: space(1),
    paddingHorizontal: space(2),
  },
  logoutText: {
    fontFamily: type.text,
    fontSize: 13,
    color: colors.inkFaint,
  },
  heroBody: {
    marginTop: space(14),
  },
  heroLabel: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  heroAmount: {
    fontFamily: type.display,
    fontSize: 72,
    lineHeight: 84,
    color: colors.ink,
    marginTop: space(1),
  },
  moodLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginTop: space(2),
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodText: {
    fontFamily: type.text,
    fontSize: 15,
    color: colors.inkSoft,
  },
  insight: {
    flexDirection: 'row',
    marginHorizontal: space(7),
    marginTop: space(6),
    marginBottom: space(2),
  },
  insightRule: {
    width: 2,
    borderRadius: 1,
    marginRight: space(4),
  },
  insightBody: {
    flex: 1,
  },
  insightLabel: {
    fontFamily: type.textSemi,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginBottom: space(2),
  },
  insightText: {
    fontFamily: type.displayItalic,
    fontSize: 19,
    lineHeight: 28,
    color: colors.ink,
  },
  dayHeader: {
    fontFamily: type.textSemi,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.inkFaint,
    paddingHorizontal: space(7),
    paddingTop: space(7),
    paddingBottom: space(2),
  },
  row: {
    paddingHorizontal: space(7),
    paddingVertical: space(3),
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3.5),
  },
  rowBody: {
    flex: 1,
  },
  rowCategory: {
    fontFamily: type.textMedium,
    fontSize: 16,
    color: colors.ink,
  },
  rowNote: {
    fontFamily: type.text,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 1,
  },
  rowAmount: {
    fontFamily: type.display,
    fontSize: 21,
    color: colors.ink,
  },
  empty: {
    alignItems: 'center',
    paddingTop: space(16),
    gap: space(6),
  },
  emptyText: {
    fontFamily: type.display,
    fontSize: 20,
    lineHeight: 30,
    color: colors.inkSoft,
    textAlign: 'center',
  },
})
