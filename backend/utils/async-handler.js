// Express 4 не ловит rejected promise из async-хендлеров —
// прокидываем ошибку в центральный error handler вместо try/catch в каждом контроллере
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
