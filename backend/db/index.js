const { Pool } = require('pg');
const env = require('../config/env');
const logger = require('../logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// ошибка простаивающего клиента не фатальна — пул переподключится сам
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected DB pool error');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
