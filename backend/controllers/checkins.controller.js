const db = require('../db');

async function createCheckin(req, res) {
  const { mood_score, anxiety_score, note } = req.body;

  if (mood_score === undefined || anxiety_score === undefined) {
    return res.status(400).json({ error: 'mood_score and anxiety_score are required' });
  }

  const mood = Number(mood_score);
  const anxiety = Number(anxiety_score);

  if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
    return res.status(400).json({ error: 'mood_score must be an integer between 1 and 10' });
  }
  if (!Number.isInteger(anxiety) || anxiety < 1 || anxiety > 10) {
    return res.status(400).json({ error: 'anxiety_score must be an integer between 1 and 10' });
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    return res.status(400).json({ error: 'note must be a string' });
  }
  const trimmedNote = note && note.trim() ? note.trim().slice(0, 1000) : null;

  const result = await db.query(
    `INSERT INTO checkins (user_id, mood_score, anxiety_score, note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.userId, mood, anxiety, trimmedNote]
  );
  res.status(201).json(result.rows[0]);
}

async function getCheckins(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const result = await db.query(
    `SELECT * FROM checkins
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.userId, limit, offset]
  );
  res.json(result.rows);
}

module.exports = { createCheckin, getCheckins };
