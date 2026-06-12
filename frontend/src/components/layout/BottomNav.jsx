import { NavLink } from 'react-router-dom'
import { Home, Plus, List, Heart } from 'lucide-react'

const items = [
  { to: '/',            icon: Home,  label: 'Главная' },
  { to: '/add',         icon: Plus,  label: 'Добавить' },
  { to: '/transactions',icon: List,  label: 'Траты' },
  { to: '/checkins',    icon: Heart, label: 'Настрой' },
]

export default function BottomNav() {
  return (
    <nav className="bg-white/80 backdrop-blur-xl border-t border-card shadow-nav">
      <div className="flex justify-around items-center px-2 py-2 pb-safe">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-250 ${
                isActive ? 'text-moss' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-250 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
