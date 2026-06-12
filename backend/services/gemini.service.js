const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'missing-key');

const SYSTEM_INSTRUCTION = `Ты финансовый коуч-ассистент в приложении CalmWallet. Помогаешь пользователю осознать связь между эмоциями и тратами, снизить финансовую тревогу.

В каждом ответе:
1. Признай эмоцию пользователя без осуждения.
2. Если в последних тратах виден паттерн — мягко назови его.
3. Задай один вопрос ИЛИ предложи одну небольшую технику CBT/ACT — что-то одно, не оба сразу.

Тон: тёплый, конкретный, без лекций и непрошеных советов.

Если пользователь описывает серьёзный дистресс или мысли о вреде себе — мягко предложи обратиться к специалисту.

Ты не ставишь диагнозы и не заменяешь терапевта.

Формат ответа: 2–4 предложения, без markdown. Отвечай всегда на русском языке.`;

const WEEKLY_SYSTEM_INSTRUCTION = `Ты финансовый коуч-ассистент в приложении CalmWallet. Раз в неделю ты смотришь на траты и чек-ины настроения пользователя и находишь связи между эмоциями и деньгами.

Пиши тепло и конкретно, без осуждения и без финансовых советов в духе «составь бюджет». Опирайся только на присланные данные и готовые агрегаты — не выдумывай числа. Весь текст всегда на русском языке.

Отвечай строго JSON-объектом без markdown и пояснений, в формате:
{
  "headline": "одно предложение — главный паттерн недели",
  "insights": [
    { "text": "наблюдение", "highlight": "число или короткий факт" },
    { "text": "наблюдение", "highlight": "число или короткий факт" },
    { "text": "наблюдение", "highlight": "число или короткий факт" }
  ],
  "question": "один мягкий вопрос для рефлексии"
}`;

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

// thinkingBudget: 0 — иначе «думающие» 2.5-модели тратят лимит токенов на рассуждения
// и могут вернуть пустой текст
const coachModel = genAI.getGenerativeModel(
  {
    model: env.GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
  },
  // не держим запрос пользователя дольше 15 секунд — транзакция сохранится без ai_response
  { timeout: 15000 }
);

const weeklyModel = genAI.getGenerativeModel(
  {
    model: env.GEMINI_MODEL,
    systemInstruction: WEEKLY_SYSTEM_INSTRUCTION,
    generationConfig: {
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  },
  { timeout: 20000 }
);

// одна повторная попытка при перегрузке/лимитах Gemini
async function generateWithRetry(model, prompt) {
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

function daysAgoLabel(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400e3);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} дн. назад`;
}

function historyLine(t) {
  const trigger = t.triggered_by ? `, триггер: ${TRIGGER_LABELS[t.triggered_by] || t.triggered_by}` : '';
  return `- ${t.amount} руб., ${CATEGORY_LABELS[t.category] || t.category}, состояние: ${EMOTIONAL_LABELS[t.emotional_state] || t.emotional_state}${trigger}`;
}

async function analyzeTransaction({ amount, category, emotional_state, triggered_by, note, history = [], checkin = null }) {
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
    checkin
      ? `\nПоследний чек-ин настроения (${daysAgoLabel(checkin.created_at)}): настроение ${checkin.mood_score}/10, тревожность ${checkin.anxiety_score}/10${checkin.note ? `, заметка: "${checkin.note}"` : ''}.`
      : null,
    history.length > 0
      ? `\nПредыдущие траты пользователя (от новых к старым):\n${history.map(historyLine).join('\n')}`
      : null,
    `\nПомоги пользователю осмыслить эту ситуацию. Если в предыдущих тратах виден паттерн — мягко обрати на него внимание.`,
  ].filter(Boolean).join(' ');

  const result = await generateWithRetry(coachModel, promptParts);
  return result.response.text();
}

// модель иногда оборачивает JSON в ```json … ``` несмотря на responseMimeType
function parseWeeklyJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const data = JSON.parse(cleaned);
  if (
    typeof data.headline !== 'string' || !data.headline.trim() ||
    typeof data.question !== 'string' || !data.question.trim() ||
    !Array.isArray(data.insights) || data.insights.length === 0
  ) {
    throw new Error('Weekly insights JSON has invalid shape');
  }
  const insights = data.insights
    .filter((i) => i && typeof i.text === 'string' && typeof i.highlight === 'string')
    .slice(0, 3)
    .map((i) => ({ text: i.text.trim(), highlight: i.highlight.trim() }));
  if (insights.length === 0) {
    throw new Error('Weekly insights JSON has invalid shape');
  }
  return { headline: data.headline.trim(), insights, question: data.question.trim() };
}

function transactionWeekLine(t) {
  const created = new Date(t.created_at);
  const day = created.toLocaleDateString('ru-RU', { weekday: 'long' });
  const trigger = t.triggered_by ? `, триггер: ${TRIGGER_LABELS[t.triggered_by] || t.triggered_by}` : '';
  const note = t.note ? `, заметка: "${t.note}"` : '';
  return `- ${day}: ${t.amount} руб., ${CATEGORY_LABELS[t.category] || t.category}, состояние: ${EMOTIONAL_LABELS[t.emotional_state] || t.emotional_state}${trigger}${note}`;
}

function checkinWeekLine(c) {
  const day = new Date(c.created_at).toLocaleDateString('ru-RU', { weekday: 'long' });
  const note = c.note ? `, заметка: "${c.note}"` : '';
  return `- ${day}: настроение ${c.mood_score}/10, тревожность ${c.anxiety_score}/10${note}`;
}

async function generateWeeklyInsights({ transactions, checkins, aggregates }) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const emotionAgg = Object.entries(aggregates.byEmotion)
    .map(([k, v]) => `${EMOTIONAL_LABELS[k] || k}: ${v} руб.`)
    .join(', ');
  const categoryAgg = Object.entries(aggregates.byCategory)
    .map(([k, v]) => `${CATEGORY_LABELS[k] || k}: ${v} руб.`)
    .join(', ');
  const anxietyAgg = aggregates.anxietyByDay
    .map((d) => `${d.day}: ${d.avg}`)
    .join(', ');

  const prompt = [
    `Данные пользователя за последние 7 дней.`,
    `\nТраты:\n${transactions.length > 0 ? transactions.map(transactionWeekLine).join('\n') : 'трат не было'}`,
    `\nЧек-ины настроения:\n${checkins.length > 0 ? checkins.map(checkinWeekLine).join('\n') : 'чек-инов не было'}`,
    `\nГотовые агрегаты:`,
    `- сумма трат по эмоциям: ${emotionAgg || 'нет данных'}`,
    `- сумма трат по категориям: ${categoryAgg || 'нет данных'}`,
    `- средняя тревожность по дням: ${anxietyAgg || 'нет данных'}`,
    `\nНайди главный паттерн недели и верни JSON по формату.`,
  ].join('\n');

  const result = await generateWithRetry(weeklyModel, prompt);
  return parseWeeklyJson(result.response.text());
}

module.exports = { analyzeTransaction, generateWeeklyInsights };
