import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('opf_auth')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('opf_auth') }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const data = res.data
    const userData = {
      token: data.access_token,
      name: data.user_name,
      email: data.user_email,
      role: data.user_role,
      tenant_id: data.tenant_id,
      tenant_name: data.tenant_name,
    }
    localStorage.setItem('opf_auth', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('opf_auth')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
