import { createContext, useContext, useState, useEffect } from 'react'
import { api, clearSession } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('cw_token')
    const u = localStorage.getItem('cw_user')
    if (t && u) {
      try { setUser(JSON.parse(u)) } catch {}
    }
    setReady(true)
  }, [])

  function login(token, refreshToken, userData) {
    localStorage.setItem('cw_token', token)
    localStorage.setItem('cw_refresh', refreshToken)
    localStorage.setItem('cw_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    const rt = localStorage.getItem('cw_refresh')
    // отзываем refresh-токен на сервере; локальную сессию чистим в любом случае
    if (rt) api.logout({ refresh_token: rt }).catch(() => {})
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
