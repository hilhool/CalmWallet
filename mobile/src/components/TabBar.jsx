import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { colors, space } from '../theme'
import { tapLight, tapMedium } from '../theme/haptics'
import PressableScale from './PressableScale'

// Навигация без слов: два знака и жест добавления.
// Где ты — видно по плотности знака, не по подписи.

function HomeGlyph({ active }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10.6 L12 4.2 L19.5 10.6 V18.6 C19.5 19.65 18.65 20.5 17.6 20.5 H6.4 C5.35 20.5 4.5 19.65 4.5 18.6 Z"
        stroke={colors.ink}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={active ? colors.ink : 'none'}
        opacity={active ? 1 : 0.35}
      />
    </Svg>
  )
}

function WaveGlyph({ active }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 15.5 C7 15.5 7 8.5 10.75 8.5 C14.5 8.5 14.5 15.5 18 15.5 C19.6 15.5 20.3 13.7 20.5 12.6"
        stroke={colors.ink}
        strokeWidth={active ? 2.4 : 1.6}
        strokeLinecap="round"
        opacity={active ? 1 : 0.35}
      />
    </Svg>
  )
}

export default function TabBar({ tab, onTab, onAdd }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space(4)) }]}>
      <View style={styles.bar}>
        <PressableScale
          style={styles.item}
          haptic={tapLight}
          onPress={() => onTab('home')}
          scaleTo={0.9}
        >
          <HomeGlyph active={tab === 'home'} />
        </PressableScale>

        <PressableScale style={styles.add} haptic={tapMedium} onPress={onAdd} scaleTo={0.92}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M12 5 V19 M5 12 H19"
              stroke={colors.card}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </PressableScale>

        <PressableScale
          style={styles.item}
          haptic={tapLight}
          onPress={() => onTab('insights')}
          scaleTo={0.9}
        >
          <WaveGlyph active={tab === 'insights'} />
        </PressableScale>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(10),
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: space(7),
    paddingVertical: space(2.5),
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  item: {
    padding: space(2.5),
  },
  add: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
