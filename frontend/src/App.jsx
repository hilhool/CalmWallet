import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import AddTransaction from './pages/AddTransaction'
import Transactions from './pages/Transactions'
import Checkins from './pages/Checkins'

function Guard({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AppRoutes() {
  const { user, ready } = useAuth()
  if (!ready) return null

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<Guard><Layout><Home /></Layout></Guard>} />
      <Route path="/add" element={<Guard><Layout><AddTransaction /></Layout></Guard>} />
      <Route path="/transactions" element={<Guard><Layout><Transactions /></Layout></Guard>} />
      <Route path="/checkins" element={<Guard><Layout><Checkins /></Layout></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
