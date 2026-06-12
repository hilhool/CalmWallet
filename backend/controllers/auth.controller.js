const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const env = require('../config/env');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// access-токен короткоживущий, отзыв — через refresh-токен в БД
async function issueTokens(userId) {
  const token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [userId, hashToken(refreshToken)]
  );
  return { token, refreshToken };
}

function publicUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at };
}

async function register(req, res) {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (typeof password !== 'string' || password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and contain a letter and a digit' });
  }

  const hash = await bcrypt.hash(password, 12);
  let user;
  try {
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hash]
    );
    user = result.rows[0];
  } catch (err) {
    // unique_violation — email уже занят (включая гонку двух одновременных регистраций)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }

  const { token, refreshToken } = await issueTokens(user.id);
  res.status(201).json({ token, refresh_token: refreshToken, user: publicUser(user) });
}

async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await db.query(
    'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { token, refreshToken } = await issueTokens(user.id);
  res.json({ token, refresh_token: refreshToken, user: publicUser(user) });
}

async function refresh(req, res) {
  const { refresh_token } = req.body || {};
  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'refresh_token is required' });
  }

  // отзыв и проверка одним атомарным UPDATE — повторное использование токена невозможно
  const result = await db.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [hashToken(refresh_token)]
  );
  const row = result.rows[0];
  if (!row) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const { token, refreshToken } = await issueTokens(row.user_id);
  res.json({ token, refresh_token: refreshToken });
}

async function logout(req, res) {
  const { refresh_token } = req.body || {};
  if (refresh_token && typeof refresh_token === 'string') {
    await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashToken(refresh_token)]
    );
  }
  res.status(204).end();
}

module.exports = { register, login, refresh, logout };
