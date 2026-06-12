import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { fmtDate } from '../lib/format'

function moodEmoji(score) {
  if (score >= 9) return '😄'
  if (score >= 7) return '🙂'
  if (score >= 5) return '😐'
  if (score >= 3) return '😔'
  return '😢'
}

function anxietyEmoji(score) {
  if (score >= 8) return '😰'
  if (score >= 6) return '😟'
  if (score >= 4) return '😐'
  return '😌'
}

function Slider({ label, value, onChange, getEmoji }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="text-[11px] text-muted font-medium uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xl">{getEmoji(value)}</span>
          <span className="text-2xl font-light text-soft">{value}</span>
          <span className="text-sm text-muted">/10</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[11px] text-muted/50 mt-1.5 px-0.5">
        <span>плохо</span>
        <span>отлично</span>
      </div>
    </div>
  )
}

export default function Checkins() {
  const [mood, setMood] = useState(5)
  const [anxiety, setAnxiety] = useState(5)
  const [note, setNote] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getCheckins().then(setItems).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const item = await api.createCheckin({
        mood_score: mood,
        anxiety_score: anxiety,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      setItems(prev => [item, ...prev])
      setNote('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-moss-light/65 via-peach-light/40 to-rose-dust/50" />
        <div className="absolute -top-6 left-6 w-44 h-44 rounded-full bg-moss-light/50 blur-3xl" />
        <div className="absolute bottom-2 right-4 w-32 h-32 rounded-full bg-peach/30 blur-3xl" />
        <div className="relative z-10 flex items-end h-full px-6 pb-6">
          <h2 className="text-2xl font-light text-soft/85">Как ты сейчас?</h2>
        </div>
      </div>

      <div className="px-5 -mt-4 flex flex-col gap-4 pb-6">
        {/* Form */}
        <div className="bg-white rounded-3xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <Slider
              label="Настроение"
              value={mood}
              onChange={setMood}
              getEmoji={moodEmoji}
            />
            <Slider
              label="Тревога"
              value={anxiety}
              onChange={setAnxiety}
              getEmoji={anxietyEmoji}
            />

            <div>
              <p className="text-[11px] text-muted font-medium uppercase tracking-widest mb-2">
                Заметка{' '}
                <span className="normal-case text-muted/60">необязательно</span>
              </p>
              <textarea
                placeholder="Что сейчас происходит..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-cream rounded-2xl px-4 py-3.5 text-soft placeholder-muted/50 outline-none focus:ring-2 focus:ring-moss/25 transition-all duration-200 text-sm resize-none"
              />
            </div>

            {error && (
              <div className="text-xs text-peach-dark bg-peach/10 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {saved ? '✓ Сохранено' : 'Записать'}
            </Button>
          </form>
        </div>

        {/* History */}
        {items.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-soft px-1 mt-1">История</h3>
            {items.map(item => (
              <Card key={item.id} className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{moodEmoji(item.mood_score)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-5 mb-1">
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">Настроение</p>
                      <p className="text-sm font-medium text-soft">{item.mood_score}<span className="text-xs text-muted">/10</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">Тревога</p>
                      <p className="text-sm font-medium text-soft">{item.anxiety_score}<span className="text-xs text-muted">/10</span></p>
                    </div>
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted font-light mt-1">{item.note}</p>
                  )}
                  <p className="text-[11px] text-muted/50 mt-1.5">{fmtDate(item.created_at)}</p>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
