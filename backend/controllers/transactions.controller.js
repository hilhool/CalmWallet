const db = require('../db');
const logger = require('../logger');
const { analyzeTransaction } = require('../services/gemini.service');

const VALID_CATEGORIES = ['food', 'clothes', 'entertainment', 'subscriptions', 'other'];
const VALID_EMOTIONS = ['calm', 'stressed', 'sad', 'bored', 'happy', 'anxious'];
const VALID_TRIGGERS = ['work', 'social', 'boredom', 'habit', 'need', 'unknown'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function createTransaction(req, res) {
  const { amount, category, emotional_state, triggered_by, note } = req.body;

  if (amount === undefined || amount === null || amount === '' || !category || !emotional_state) {
    return res.status(400).json({ error: 'amount, category, and emotional_state are required' });
  }
  const parsedAmount = typeof amount === 'string' || typeof amount === 'number' ? Number(amount) : NaN;
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (parsedAmount > 1e9) {
    return res.status(400).json({ error: 'amount is too large' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (!VALID_EMOTIONS.includes(emotional_state)) {
    return res.status(400).json({ error: `emotional_state must be one of: ${VALID_EMOTIONS.join(', ')}` });
  }
  if (triggered_by && !VALID_TRIGGERS.includes(triggered_by)) {
    return res.status(400).json({ error: `triggered_by must be one of: ${VALID_TRIGGERS.join(', ')}` });
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    return res.status(400).json({ error: 'note must be a string' });
  }
  const trimmedNote = note && note.trim() ? note.trim().slice(0, 1000) : null;

  let ai_response = null;
  try {
    // последние траты и свежий чек-ин дают коучу контекст паттерна,
    // а не одну изолированную покупку
    const [history, checkin] = await Promise.all([
      db.query(
        `SELECT amount, category, emotional_state, triggered_by
         FROM transactions
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 5`,
        [req.userId]
      ),
      db.query(
        `SELECT mood_score, anxiety_score, note, created_at
         FROM checkins
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC LIMIT 1`,
        [req.userId]
      ),
    ]);
    ai_response = await analyzeTransaction({
      amount: parsedAmount,
      category,
      emotional_state,
      triggered_by,
      note: trimmedNote,
      history: history.rows,
      checkin: checkin.rows[0] || null,
    });
  } catch (geminiErr) {
    logger.error({ err: geminiErr }, 'Gemini error');
    // proceed without AI response rather than failing the whole request
  }

  const result = await db.query(
    `INSERT INTO transactions (user_id, amount, category, emotional_state, triggered_by, note, ai_response)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.userId, parsedAmount, category, emotional_state, triggered_by || null, trimmedNote, ai_response]
  );

  res.status(201).json(result.rows[0]);
}

async function getTransactions(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const result = await db.query(
    `SELECT * FROM transactions
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.userId, limit, offset]
  );
  res.json(result.rows);
}

async function deleteTransaction(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const result = await db.query(
    `UPDATE transactions SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, req.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.status(204).end();
}

module.exports = { createTransaction, getTransactions, deleteTransaction };
