// Дизайн-токены CalmWallet — «тёплая бумага».
// Принцип: ни одного холодного оттенка, ни одного чистого белого или чёрного.
// Фон — бумага личного дневника, акценты — природные пигменты.

export const colors = {
  canvas: '#F5F0E6',      // тёплая бумага — основной фон
  canvasDeep: '#EDE5D5',  // углубление (зоны, подложки)
  card: '#FBF8F1',        // приподнятая поверхность
  ink: '#322E27',         // тёплые чернила — текст и сильные акценты
  inkSoft: '#6E665A',     // вторичный текст
  inkFaint: '#A69D8C',    // подписи, плейсхолдеры
  line: '#E4DCCB',        // разделители

  positive: '#5F7D58',    // мох — позитивные состояния и суммы «в порядке»
  positiveSoft: '#E2E9DB',
  alert: '#B9694A',       // тёплая глина — тревожные состояния (не «красная ошибка»)
  alertSoft: '#F3E0D4',
}

// Эмоции — стержень продукта. Цвет несёт смысл вместо текста:
// спектр от шалфея (покой) к глине (напряжение), всё приглушено до «выдоха».
export const emotions = {
  calm:     { label: 'спокойно',   color: '#8FAE8B', tint: '#E9EFE4', phrase: 'день идёт спокойно' },
  happy:    { label: 'радостно',   color: '#D9A441', tint: '#F6ECD5', phrase: 'сегодня радостно' },
  bored:    { label: 'скучно',     color: '#B3A68C', tint: '#EFEADB', phrase: 'день тянется неспешно' },
  sad:      { label: 'грустно',    color: '#8B95A6', tint: '#E8EBEF', phrase: 'сегодня непросто' },
  anxious:  { label: 'тревожно',   color: '#A4738D', tint: '#EFE4EA', phrase: 'сегодня тревожно' },
  stressed: { label: 'напряжённо', color: '#C97E5A', tint: '#F4E3D7', phrase: 'день напряжённый' },
}

export const EMOTION_ORDER = ['calm', 'happy', 'bored', 'sad', 'anxious', 'stressed']

export const categories = {
  food: 'еда',
  clothes: 'одежда',
  entertainment: 'развлечения',
  subscriptions: 'подписки',
  other: 'другое',
}

export const triggers = {
  work: 'работа',
  social: 'окружение',
  boredom: 'скука',
  habit: 'привычка',
  need: 'необходимость',
  unknown: 'не знаю',
}

// Пара шрифтов: Instrument Serif — крупные цифры и заголовки (editorial, тепло),
// Hanken Grotesk — всё остальное (гуманистический гротеск, мягкая геометрия).
export const type = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  text: 'HankenGrotesk_400Regular',
  textMedium: 'HankenGrotesk_500Medium',
  textSemi: 'HankenGrotesk_600SemiBold',
}

export const space = (n) => n * 4

export function formatAmount(n) {
  const rounded = Math.round(n * 100) / 100
  const [int, frac] = String(rounded).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return frac ? `${grouped},${frac}` : grouped
}
