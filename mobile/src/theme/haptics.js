import * as Haptics from 'expo-haptics'

// Хэптика только там, где действие имеет вес. Ошибки её не имеют —
// сбой вибромотора не должен ломать поток.

export const tapLight = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

export const tapMedium = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

export const noteSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
