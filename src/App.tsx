import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import History from './pages/History'
import Tasks from './pages/Tasks'
import Settings from './pages/Settings'

const PAGES_WITH_NAV = ['/home', '/history', '/tasks', '/settings']

function AppLayout() {
  const location = useLocation()
  const showNav = PAGES_WITH_NAV.includes(location.pathname)

  return (
    <AuthGuard>
      <div
        className="min-h-dvh"
        style={{
          backgroundColor: 'var(--bg-primary)',
          paddingBottom: showNav ? 'calc(56px + env(safe-area-inset-bottom))' : undefined,
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        {showNav && <BottomNav />}
        <InstallPrompt />
      </div>
    </AuthGuard>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
