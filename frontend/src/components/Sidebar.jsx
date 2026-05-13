import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, MapPin, TrendingUp, Users, Luggage, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/conference-hub', label: 'Conference Hub', icon: Users },
  { to: '/ebx', label: 'EBX Briefings', icon: CalendarCheck },
  { to: '/travel', label: 'Travel Planner', icon: MapPin },
  { to: '/travel-dashboard', label: 'Travel Dashboard', icon: Luggage },
  { to: '/opportunities', label: 'Opportunities', icon: TrendingUp },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 bg-brand-900 text-white flex flex-col flex-shrink-0">
      <div className="px-4 py-4 border-b border-blue-800">
        <img src="/opforcements-logo.png" alt="OpForcements" className="w-full max-w-[160px] mx-auto block" />
        {user?.tenant_name && (
          <div className="text-center mt-2 text-xs font-semibold text-blue-300 truncate px-1">
            {user.tenant_name}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'super_admin' && (
          <>
            <div className="pt-3 pb-1 px-3 text-[10px] font-semibold text-blue-500 uppercase tracking-widest">
              Platform Admin
            </div>
            <NavLink to="/admin/tenants"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <ShieldCheck size={18} />
              Tenants
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-blue-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-blue-400 truncate">{user?.email}</div>
          </div>
          <button onClick={logout} title="Sign out"
            className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-800 transition-colors flex-shrink-0">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
