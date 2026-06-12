import * as SecureStore from 'expo-secure-store'

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

const REFRESH_KEY = 'cw_refresh'
const USER_KEY = 'cw_user'

let accessToken = null
let onSessionExpired = () => {}

export const setAccessToken = (t) => { accessToken = t }
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn }

export const saveRefreshToken = (t) => SecureStore.setItemAsync(REFRESH_KEY, t)
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY)
export const saveUser = (u) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(u))
export const getStoredUser = async () => {
  const raw = await SecureStore.getItemAsync(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}
export const clearSession = async () => {
  accessToken = null
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {})
  await SecureStore.deleteItemAsync(USER_KEY).catch(() => {})
}

// один refresh на все параллельные 401 — иначе ротация инвалидирует токен у «соседей»
let refreshPromise = null

function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = await getRefreshToken()
      if (!rt) return false
      try {
        const res = await fetch(`${BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        })
        if (!res.ok) return false
        const data = await res.json().catch(() => null)
        if (!data?.token || !data?.refresh_token) return false
        accessToken = data.token
        await saveRefreshToken(data.refresh_token)
        return true
      } catch {
        return false
      }
    })().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// сервер отвечает по-английски — пользователю показываем по-человечески
const ERROR_RU = {
  'Invalid credentials': 'не нашли такой дневник — проверь почту и пароль',
  'Email already registered': 'эта почта уже занята — попробуй войти',
  'Invalid email format': 'похоже, в почте опечатка',
  'Password must be at least 8 characters and contain a letter and a digit':
    'пароль — минимум 8 символов, и в нём нужны буква и цифра',
  'Email and password are required': 'нужны и почта, и пароль',
}

async function request(path, options = {}, isRetry = false) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('нет связи с сервером — проверь интернет и попробуй ещё раз')
  }

  if (res.status === 204) return null

  let data = null
  try { data = await res.json() } catch {}

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      if (!isRetry && await tryRefresh()) {
        return request(path, options, true)
      }
      await clearSession()
      onSessionExpired()
    }
    throw new Error(ERROR_RU[data?.error] || data?.error || 'что-то пошло не так — попробуй ещё раз')
  }
  return data
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   (body) => request('/api/auth/logout',   { method: 'POST', body: JSON.stringify(body) }),

  getTransactions:   () => request('/api/transactions?limit=200'),
  createTransaction: (body) => request('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
}
