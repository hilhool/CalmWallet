const BASE = import.meta.env.VITE_API_URL || ''

const getToken = () => localStorage.getItem('cw_token')

export function clearSession() {
  localStorage.removeItem('cw_token')
  localStorage.removeItem('cw_refresh')
  localStorage.removeItem('cw_user')
}

// один refresh на все параллельные 401 — иначе ротация инвалидирует токен у "соседей"
let refreshPromise = null

function tryRefresh() {
  const rt = localStorage.getItem('cw_refresh')
  if (!rt) return Promise.resolve(false)
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    })
      .then(async res => {
        if (!res.ok) return false
        const data = await res.json().catch(() => null)
        if (!data?.token || !data?.refresh_token) return false
        localStorage.setItem('cw_token', data.token)
        localStorage.setItem('cw_refresh', data.refresh_token)
        return true
      })
      .catch(() => false)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function request(path, options = {}, isRetry = false) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const t = getToken()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 204) return null

  let data = null
  try { data = await res.json() } catch {} // напр. HTML от упавшего прокси

  if (!res.ok) {
    // протух access-токен — пробуем обновить и повторить запрос один раз
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      if (!isRetry && await tryRefresh()) {
        return request(path, options, true)
      }
      clearSession()
      window.location.assign('/auth')
    }
    throw new Error(data?.error || 'Что-то пошло не так')
  }
  return data
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   (body) => request('/api/auth/logout',   { method: 'POST', body: JSON.stringify(body) }),

  getTransactions:    ()     => request('/api/transactions'),
  createTransaction:  (body) => request('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  deleteTransaction:  (id)   => request(`/api/transactions/${id}`, { method: 'DELETE' }),

  getCheckins:   ()     => request('/api/checkins'),
  createCheckin: (body) => request('/api/checkins', { method: 'POST', body: JSON.stringify(body) }),
}
