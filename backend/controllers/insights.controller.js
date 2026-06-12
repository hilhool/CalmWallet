const db = require('../db');
const logger = require('../logger');
const { generateWeeklyInsights } = require('../services/gemini.service');

const WEEKDAY_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function mondayOfCurrentWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

async function createWeeklyInsight(req, res) {
  const [txs, checkins] = await Promise.all([
    db.query(
      `SELECT amount, category, emotional_state, triggered_by, note, created_at
       FROM transactions
       WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at`,
      [req.userId]
    ),
    db.query(
      `SELECT mood_score, anxiety_score, note, created_at
       FROM checkins
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at`,
      [req.userId]
    ),
  ]);

  // меньше трёх дней с данными — паттернов не найти, инсайты выйдут выдуманными
  const daysWithData = new Set(
    [...txs.rows, ...checkins.rows].map((r) => new Date(r.created_at).toDateString())
  );
  if (daysWithData.size < 3) {
    return res.status(422).json({ error: 'not_enough_data' });
  }

  // агрегаты считаем сами — модель получает готовые числа и реже галлюцинирует
  const byEmotion = {};
  const byCategory = {};
  for (const t of txs.rows) {
    const amount = Number(t.amount);
    byEmotion[t.emotional_state] = (byEmotion[t.emotional_state] || 0) + amount;
    byCategory[t.category] = (byCategory[t.category] || 0) + amount;
  }
  const anxietyBuckets = {};
  for (const c of checkins.rows) {
    const wd = new Date(c.created_at).getDay();
    (anxietyBuckets[wd] = anxietyBuckets[wd] || []).push(c.anxiety_score);
  }
  const anxietyByDay = Object.entries(anxietyBuckets).map(([wd, scores]) => ({
    day: WEEKDAY_RU[wd],
    avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
  }));

  let insight;
  try {
    insight = await generateWeeklyInsights({
      transactions: txs.rows,
      checkins: checkins.rows,
      aggregates: { byEmotion, byCategory, anxietyByDay },
    });
  } catch (err) {
    logger.error({ err }, 'Weekly insights Gemini error');
    return res.status(502).json({ error: 'ai_unavailable' });
  }

  // повторная генерация на той же неделе перезаписывает инсайт, а не плодит дубли
  const result = await db.query(
    `INSERT INTO weekly_insights (user_id, week_start, headline, insights, question)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, week_start)
     DO UPDATE SET headline = EXCLUDED.headline, insights = EXCLUDED.insights,
                   question = EXCLUDED.question, created_at = NOW()
     RETURNING *`,
    [req.userId, mondayOfCurrentWeek(), insight.headline, JSON.stringify(insight.insights), insight.question]
  );
  res.status(201).json(result.rows[0]);
}

async function getWeeklyInsights(req, res) {
  const result = await db.query(
    `SELECT * FROM weekly_insights
     WHERE user_id = $1
     ORDER BY week_start DESC
     LIMIT 4`,
    [req.userId]
  );
  res.json(result.rows);
}

module.exports = { createWeeklyInsight, getWeeklyInsights };
