const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'missing-key');

const SYSTEM_INSTRUCTION = `Ты финансовый коуч-ассистент в приложении CalmWallet. Помогаешь пользователю осознать связь между эмоциями и тратами, снизить финансовую тревогу.

Используй техники CBT и ACT: задавай уточняющие вопросы, помогай переосмыслить ситуацию, нормализуй эмоции без осуждения.

Тон: тёплый, конкретный, без лекций и непрошеных советов.

Если пользователь описывает серьёзный дистресс или мысли о вреде себе — мягко предложи обратиться к специалисту.

Ты не ставишь диагнозы и не заменяешь терапевта.

Формат ответа: 2–4 предложения. Один вопрос в конце если уместно. Отвечай на том же языке что и пользователь.`;

const CATEGORY_LABELS = {
  food: 'еда',
  clothes: 'одежда',
  entertainment: 'развлечения',
  subscriptions: 'подписки',
  other: 'другое',
};

const EMOTIONAL_LABELS = {
  calm: 'спокойный',
  stressed: 'в стрессе',
  sad: 'грустный',
  bored: 'скучающий',
  happy: 'счастливый',
  anxious: 'тревожный',
};

const TRIGGER_LABELS = {
  work: 'работа',
  social: 'социальное давление',
  boredom: 'скука',
  habit: 'привычка',
  need: 'необходимость',
  unknown: 'неизвестно',
};

const model = genAI.getGenerativeModel(
  {
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { maxOutputTokens: 400 },
  },
  // не держим запрос пользователя дольше 15 секунд — транзакция сохранится без ai_response
  { timeout: 15000 }
);

// одна повторная попытка при перегрузке/лимитах Gemini
async function generateWithRetry(prompt) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    if (err.status === 429 || err.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return model.generateContent(prompt);
    }
    throw err;
  }
}

function historyLine(t) {
  return `- ${t.amount} руб., ${CATEGORY_LABELS[t.category] || t.category}, состояние: ${EMOTIONAL_LABELS[t.emotional_state] || t.emotional_state}`;
}

async function analyzeTransaction({ amount, category, emotional_state, triggered_by, note, history = [] }) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const categoryLabel = CATEGORY_LABELS[category] || category;
  const emotionLabel = EMOTIONAL_LABELS[emotional_state] || emotional_state;
  const triggerLabel = triggered_by ? (TRIGGER_LABELS[triggered_by] || triggered_by) : null;

  const promptParts = [
    `Пользователь только что совершил покупку на сумму ${amount} руб. в категории "${categoryLabel}".`,
    `Его эмоциональное состояние: ${emotionLabel}.`,
    triggerLabel ? `Триггер: ${triggerLabel}.` : null,
    note ? `Заметка пользователя: "${note}"` : null,
    history.length > 0
      ? `\nПредыдущие траты пользователя (от новых к старым):\n${history.map(historyLine).join('\n')}`
      : null,
    `\nПомоги пользователю осмыслить эту ситуацию. Если в предыдущих тратах виден паттерн — мягко обрати на него внимание.`,
  ].filter(Boolean).join(' ');

  const result = await generateWithRetry(promptParts);
  return result.response.text();
}

module.exports = { analyzeTransaction };
