import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  api, setAccessToken, setSessionExpiredHandler,
  saveRefreshToken, getRefreshToken, saveUser, getStoredUser, clearSession,
} from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
    // восстановление сессии: user из хранилища, access-токен подтянется
    // через refresh при первом 401
    ;(async () => {
      const [storedUser, rt] = await Promise.all([getStoredUser(), getRefreshToken()])
      if (storedUser && rt) setUser(storedUser)
      setReady(true)
    })()
  }, [])

  const applySession = useCallback(async (data) => {
    setAccessToken(data.token)
    await saveRefreshToken(data.refresh_token)
    await saveUser(data.user)
    setUser(data.user)
  }, [])

  const login = useCallback(async (email, password) => {
    applySession(await api.login({ email, password }))
  }, [applySession])

  const register = useCallback(async (email, password) => {
    applySession(await api.register({ email, password }))
  }, [applySession])

  const logout = useCallback(async () => {
    const rt = await getRefreshToken()
    if (rt) api.logout({ refresh_token: rt }).catch(() => {})
    await clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
