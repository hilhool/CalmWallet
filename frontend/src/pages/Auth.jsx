import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fn = tab === 'login' ? api.login : api.register
      const data = await fn(form)
      login(data.token, data.refresh_token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">

        {/* Hero */}
        <div className="relative h-72 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-peach-light via-rose-dust/70 to-moss-light/80" />
          {/* Abstract blobs */}
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-peach/50 blur-3xl" />
          <div className="absolute top-10 right-0 w-44 h-44 rounded-full bg-rose-dust/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-40 rounded-full bg-moss-light/60 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-peach-light/70 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-end h-full pb-10 px-7">
            <p className="text-[11px] font-medium text-soft/40 uppercase tracking-widest mb-2">Добро пожаловать</p>
            <h1 className="text-4xl font-light text-soft/85 tracking-tight leading-tight">
              CalmWallet
            </h1>
            <p className="text-sm text-soft/50 mt-2 font-light">Деньги и спокойствие</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 -mt-6">
          <div className="bg-white rounded-3xl shadow-card p-6">

            {/* Tabs */}
            <div className="flex gap-1 bg-card rounded-2xl p-1 mb-6">
              {[
                { key: 'login',    label: 'Войти' },
                { key: 'register', label: 'Регистрация' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTab(key); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 ${
                    tab === key
                      ? 'bg-white shadow-sm text-soft'
                      : 'text-muted hover:text-soft/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
                required
              />
              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
              />

              {error && (
                <div className="text-xs text-peach-dark bg-peach/10 rounded-2xl px-4 py-3 leading-relaxed">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-1">
                {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted/60 mt-6 pb-8 font-light leading-relaxed px-4">
            Всё, что ты записываешь — только твоё.
          </p>
        </div>
      </div>
    </div>
  )
}
