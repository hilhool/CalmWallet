import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Card from '../components/ui/Card'
import { ChevronDown, Trash2 } from 'lucide-react'
import { EMOTION_EMOJI, EMOTION_RU, CATEGORY_RU, TRIGGER_RU } from '../lib/constants'
import { fmt, fmtDate, plural } from '../lib/format'

export default function Transactions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('Удалить эту запись?')) return
    setDeleting(id)
    try {
      await api.deleteTransaction(id)
      setItems(prev => prev.filter(t => t.id !== id))
    } catch {
      // запись остаётся в списке — можно повторить
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    api.getTransactions()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-dust/60 via-peach-light/50 to-moss-light/50" />
        <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-rose-dust/40 blur-3xl" />
        <div className="absolute bottom-0 left-6 w-32 h-32 rounded-full bg-peach/30 blur-3xl" />
        <div className="relative z-10 flex items-end h-full px-6 pb-6">
          <div>
            <h2 className="text-2xl font-light text-soft/85">Мои траты</h2>
            {!loading && !error && (
              <p className="text-xs text-soft/40 mt-0.5">{items.length} {plural(items.length, ['запись', 'записи', 'записей'])}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 flex flex-col gap-3 pb-6">
        {loading && (
          <div className="flex justify-center py-16">
            <span className="w-6 h-6 border-2 border-moss border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">🌧️</p>
            <p className="text-sm text-muted font-light">Не получилось загрузить — попробуй обновить страницу</p>
          </Card>
        )}

        {!loading && !error && items.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">💸</p>
            <p className="text-sm text-muted font-light">Ещё нет записей</p>
          </Card>
        )}

        {items.map(t => {
          const open = expanded === t.id
          return (
            <Card
              key={t.id}
              onClick={() => setExpanded(open ? null : t.id)}
              className="transition-all duration-250"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl flex-shrink-0">{EMOTION_EMOJI[t.emotional_state] ?? '💸'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-soft">{CATEGORY_RU[t.category] ?? t.category}</p>
                    <p className="text-sm font-medium text-soft flex-shrink-0">{fmt(t.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted">{EMOTION_RU[t.emotional_state]}</p>
                    {t.triggered_by && (
                      <>
                        <span className="text-muted/30 text-xs">·</span>
                        <p className="text-xs text-muted">{TRIGGER_RU[t.triggered_by]}</p>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted/50 mt-0.5">{fmtDate(t.created_at)}</p>
                </div>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className={`text-muted/50 flex-shrink-0 transition-transform duration-250 ${open ? 'rotate-180' : ''}`}
                />
              </div>

              {open && (
                <div className="mt-4 pt-4 border-t border-card-warm flex flex-col gap-3 animate-fade-in">
                  {t.note && (
                    <div>
                      <p className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1.5">Заметка</p>
                      <p className="text-sm text-soft font-light">{t.note}</p>
                    </div>
                  )}
                  {t.ai_response && (
                    <div className="bg-moss/8 rounded-2xl p-4">
                      <p className="text-[11px] text-moss font-medium uppercase tracking-wider mb-2">Коуч</p>
                      <p className="text-sm text-soft font-light leading-relaxed">{t.ai_response}</p>
                    </div>
                  )}
                  {!t.ai_response && !t.note && (
                    <p className="text-xs text-muted/60 font-light">Нет дополнительной информации</p>
                  )}
                  <button
                    type="button"
                    onClick={e => handleDelete(e, t.id)}
                    disabled={deleting === t.id}
                    className="self-start flex items-center gap-1.5 text-xs text-peach-dark/70 hover:text-peach-dark transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                    {deleting === t.id ? 'Удаляю...' : 'Удалить'}
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
