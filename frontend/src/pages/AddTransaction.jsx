import { useState } from 'react'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { CheckCircle } from 'lucide-react'
import { CATEGORIES, EMOTIONS, TRIGGERS } from '../lib/constants'
import { fmt } from '../lib/format'

function ResultScreen({ result, onReset }) {
  return (
    <div className="flex flex-col animate-slide-up">
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-moss-light/60 via-peach-light/40 to-rose-dust/50" />
        <div className="absolute -top-6 left-8 w-40 h-40 rounded-full bg-moss/30 blur-3xl" />
        <div className="absolute bottom-0 right-4 w-32 h-32 rounded-full bg-peach/30 blur-3xl" />
        <div className="relative z-10 flex items-end h-full px-6 pb-6">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-moss flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-soft/50">Трата добавлена</p>
              <h2 className="text-2xl font-light text-soft/85">Вот что я думаю</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 flex flex-col gap-4 pb-6">
        {result.ai_response ? (
          <div className="bg-white rounded-3xl shadow-card p-6 border-l-[3px] border-moss">
            <p className="text-[11px] text-moss font-medium uppercase tracking-widest mb-3">Коуч</p>
            <p className="text-sm text-soft font-light leading-relaxed">{result.ai_response}</p>
          </div>
        ) : (
          <Card className="text-center py-6">
            <p className="text-xs text-muted font-light">Коуч временно недоступен — но трата сохранена.</p>
          </Card>
        )}

        <Card>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Сумма</span>
            <span className="font-medium text-soft">{fmt(result.amount)}</span>
          </div>
        </Card>

        <Button onClick={onReset} className="w-full">
          Добавить ещё
        </Button>
      </div>
    </div>
  )
}

export default function AddTransaction() {
  const [form, setForm] = useState({
    amount: '', category: '', emotional_state: '', triggered_by: '', note: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  function reset() {
    setResult(null)
    setForm({ amount: '', category: '', emotional_state: '', triggered_by: '', note: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.category || !form.emotional_state) {
      setError('Укажи сумму, категорию и эмоцию')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.createTransaction(form)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) return <ResultScreen result={result} onReset={reset} />

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-peach-light/70 via-rose-dust/50 to-moss-light/40" />
        <div className="absolute -top-6 right-6 w-44 h-44 rounded-full bg-peach/40 blur-3xl" />
        <div className="absolute bottom-0 left-4 w-32 h-32 rounded-full bg-rose-dust/40 blur-3xl" />
        <div className="relative z-10 flex items-end h-full px-6 pb-6">
          <h2 className="text-2xl font-light text-soft/85">Новая трата</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 -mt-5 flex flex-col gap-5 pb-6">

        {/* Amount */}
        <div className="bg-white rounded-3xl shadow-card p-6">
          <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-3">Сумма</p>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              inputMode="decimal"
              className="flex-1 bg-transparent text-5xl font-light text-soft outline-none placeholder-muted/25 w-full"
            />
            <span className="text-2xl text-muted/60 font-light">₽</span>
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-3 px-1">Категория</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('category', c.value)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-200 flex-shrink-0 ${
                  form.category === c.value
                    ? 'bg-moss text-white shadow-md scale-[1.03]'
                    : 'bg-card text-muted hover:bg-card-warm'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-xs font-medium whitespace-nowrap">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emotion */}
        <div>
          <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-3 px-1">Как ты сейчас?</p>
          <div className="grid grid-cols-3 gap-2">
            {EMOTIONS.map(e => (
              <button
                key={e.value}
                type="button"
                onClick={() => set('emotional_state', e.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 transition-all duration-200 ${
                  form.emotional_state === e.value
                    ? 'bg-peach/25 ring-2 ring-peach text-soft scale-[1.03]'
                    : 'bg-card text-muted hover:bg-card-warm'
                }`}
              >
                <span className="text-xl">{e.emoji}</span>
                <span className="text-xs font-medium">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trigger */}
        <div>
          <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-3 px-1">
            Что спровоцировало?{' '}
            <span className="normal-case text-muted/60">необязательно</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('triggered_by', form.triggered_by === t.value ? '' : t.value)}
                className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                  form.triggered_by === t.value
                    ? 'bg-soft text-white'
                    : 'bg-card text-muted hover:bg-card-warm'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-2 px-1">
            Заметка{' '}
            <span className="normal-case text-muted/60">необязательно</span>
          </p>
          <textarea
            placeholder="Что происходило в тот момент..."
            value={form.note}
            onChange={e => set('note', e.target.value)}
            rows={3}
            className="w-full bg-card rounded-2xl px-4 py-3.5 text-soft placeholder-muted/50 outline-none focus:ring-2 focus:ring-moss/25 transition-all duration-200 text-sm resize-none"
          />
        </div>

        {error && (
          <div className="text-xs text-peach-dark bg-peach/10 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Анализирую...' : 'Сохранить'}
        </Button>
      </form>
    </div>
  )
}
