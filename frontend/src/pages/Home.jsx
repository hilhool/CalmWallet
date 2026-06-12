import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { LogOut } from 'lucide-react'
import { EMOTION_EMOJI, EMOTION_RU, CATEGORY_RU } from '../lib/constants'
import { fmt, plural } from '../lib/format'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [checkins, setCheckins] = useState([])

  useEffect(() => {
    api.getTransactions().then(setTransactions).catch(() => {})
    api.getCheckins().then(setCheckins).catch(() => {})
  }, [])

  const now = new Date()
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = thisMonth.reduce((s, t) => s + Number(t.amount), 0)
  const lastCheckin = checkins[0]
  const recent = transactions.slice(0, 3)

  const h = now.getHours()
  const greeting = h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер'
  const name = user?.email?.split('@')[0] ?? ''

  return (
    <div className="flex flex-col animate-fade-in">

      {/* Hero */}
      <div className="relative h-60 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-moss-light/60 via-peach-light/50 to-rose-dust/60" />
        <div className="absolute -top-8 right-0 w-52 h-52 rounded-full bg-peach/40 blur-3xl" />
        <div className="absolute top-16 -left-10 w-44 h-44 rounded-full bg-moss-light/50 blur-3xl" />
        <div className="absolute bottom-2 right-1/3 w-36 h-36 rounded-full bg-rose-dust/40 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full px-6 pt-14 pb-7">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-soft/50 font-light">{greeting}</p>
              <h2 className="text-xl font-light text-soft/85 mt-0.5 capitalize">{name}</h2>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-2xl hover:bg-black/5 transition-colors text-soft/40 hover:text-soft/70"
              aria-label="Выйти"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-5 flex flex-col gap-4 pb-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col gap-1">
            <p className="text-[11px] text-muted font-medium uppercase tracking-wider">В этом месяце</p>
            <p className="text-xl font-light text-soft mt-0.5">{fmt(monthTotal)}</p>
            <p className="text-xs text-muted">{thisMonth.length} {plural(thisMonth.length, ['трата', 'траты', 'трат'])}</p>
          </Card>

          <Card className="flex flex-col gap-1">
            <p className="text-[11px] text-muted font-medium uppercase tracking-wider">Настроение</p>
            {lastCheckin ? (
              <>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl">
                    {lastCheckin.mood_score >= 7 ? '😊' : lastCheckin.mood_score >= 4 ? '😐' : '😔'}
                  </span>
                  <span className="text-xl font-light text-soft">{lastCheckin.mood_score}<span className="text-sm text-muted">/10</span></span>
                </div>
                <p className="text-xs text-muted">Тревога {lastCheckin.anxiety_score}/10</p>
              </>
            ) : (
              <button
                onClick={() => navigate('/checkins')}
                className="text-sm text-moss font-medium mt-2 text-left"
              >
                Отметить →
              </button>
            )}
          </Card>
        </div>

        {/* CTA */}
        <Button onClick={() => navigate('/add')} className="w-full">
          + Добавить трату
        </Button>

        {/* Recent */}
        {recent.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-medium text-soft">Последние</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs text-moss font-medium"
              >
                Все →
              </button>
            </div>
            {recent.map(t => (
              <Card key={t.id} className="flex items-center gap-3.5">
                <span className="text-2xl flex-shrink-0">{EMOTION_EMOJI[t.emotional_state] ?? '💸'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-soft">{CATEGORY_RU[t.category] ?? t.category}</p>
                  <p className="text-xs text-muted">{EMOTION_RU[t.emotional_state] ?? t.emotional_state}</p>
                </div>
                <p className="text-sm font-medium text-soft flex-shrink-0">{fmt(t.amount)}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">🌿</p>
            <p className="text-sm text-muted font-light leading-relaxed">
              Ещё нет трат.<br />Добавь первую — это безопасно.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
