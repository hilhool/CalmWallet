export const CATEGORIES = [
  { value: 'food',          label: 'Еда',          emoji: '🍕' },
  { value: 'clothes',       label: 'Одежда',       emoji: '👗' },
  { value: 'entertainment', label: 'Развлечения',  emoji: '🎭' },
  { value: 'subscriptions', label: 'Подписки',     emoji: '📱' },
  { value: 'other',         label: 'Другое',       emoji: '✨' },
]

export const EMOTIONS = [
  { value: 'calm',     label: 'Спокойно',  emoji: '😌' },
  { value: 'stressed', label: 'В стрессе', emoji: '😰' },
  { value: 'sad',      label: 'Грустно',   emoji: '😔' },
  { value: 'bored',    label: 'Скучно',    emoji: '😑' },
  { value: 'happy',    label: 'Радостно',  emoji: '😊' },
  { value: 'anxious',  label: 'Тревожно',  emoji: '😟' },
]

export const TRIGGERS = [
  { value: 'work',    label: 'Работа' },
  { value: 'social',  label: 'Соцдавление' },
  { value: 'boredom', label: 'Скука' },
  { value: 'habit',   label: 'Привычка' },
  { value: 'need',    label: 'Необходимость' },
  { value: 'unknown', label: 'Не знаю' },
]

const toMap = (list, key) => Object.fromEntries(list.map(i => [i.value, i[key]]))

export const CATEGORY_RU = toMap(CATEGORIES, 'label')
export const EMOTION_RU = toMap(EMOTIONS, 'label')
export const EMOTION_EMOJI = toMap(EMOTIONS, 'emoji')
export const TRIGGER_RU = toMap(TRIGGERS, 'label')
