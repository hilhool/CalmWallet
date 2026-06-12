const env = require('./config/env');

// Gemini из некоторых регионов недоступен напрямую («User location is not supported»),
// поэтому при заданном HTTPS_PROXY весь fetch уходит через прокси. Встроенный fetch
// Node не видит диспетчер пакетного undici — подменяем fetch целиком.
const { fetch: undiciFetch, Agent, ProxyAgent, setGlobalDispatcher } = require('undici');
if (env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(env.HTTPS_PROXY));
  globalThis.fetch = undiciFetch;
} else {
  setGlobalDispatcher(new Agent());
}
const logger = require('./logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const authMiddleware = require('./middleware/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const checkinsRoutes = require('./routes/checkins.routes');
const insightsRoutes = require('./routes/insights.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'up',
      gemini: env.GEMINI_API_KEY ? 'configured' : 'not configured',
    });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', authMiddleware, transactionsRoutes);
app.use('/api/checkins', authMiddleware, checkinsRoutes);
app.use('/api/insights', authMiddleware, insightsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 4 аргумента обязательны — так Express распознаёт error-handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(env.PORT, () => {
  logger.info(`CalmWallet backend running on port ${env.PORT}`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    db.pool.end().then(() => process.exit(0));
  });
  // если активные соединения не закрылись за 10с — выходим принудительно
  setTimeout(() => process.exit(1), 10_000).unref();
}

['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
