import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Clock, ListTodo, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/home', label: 'Inicio', icon: Home },
  { path: '/history', label: 'Historial', icon: Clock },
  { path: '/tasks', label: 'Tareas', icon: ListTodo },
  { path: '/settings', label: 'Ajustes', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around"
      style={{
        height: 56,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path
        const Icon = item.icon

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
            style={{
              height: '100%',
              color: isActive ? 'var(--player-1)' : 'var(--text-muted)',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span
              style={{
                fontSize: 'var(--text-tiny)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
