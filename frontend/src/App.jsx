import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ConferenceHub from './pages/ConferenceHub'
import EBXPlanner from './pages/EBXPlanner'
import TravelPlanner from './pages/TravelPlanner'
import TravelDashboard from './pages/TravelDashboard'
import Opportunities from './pages/Opportunities'
import AdminTenants from './pages/AdminTenants'

function ProtectedApp() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/conference-hub" element={<ConferenceHub />} />
          <Route path="/ebx" element={<EBXPlanner />} />
          <Route path="/travel" element={<TravelPlanner />} />
          <Route path="/travel-dashboard" element={<TravelDashboard />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/admin/tenants" element={<AdminTenants />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </AuthProvider>
  )
}
