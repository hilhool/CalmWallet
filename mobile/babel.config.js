module.exports = function (api) {
  api.cache(true)
  // worklets-плагин не указываем вручную: babel-preset-expo подключает его сам,
  // а двойное применение тихо ломает entering/layout-анимации
  return {
    presets: ['babel-preset-expo'],
  }
}
