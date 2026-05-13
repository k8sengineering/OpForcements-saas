import React, { useEffect, useState } from 'react'
import { getAdminTenants } from '../api/client'
import { Building2, ExternalLink, Users, MapPin, Briefcase } from 'lucide-react'

const COLOR = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminTenants()
      .then(setTenants)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading tenants...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <p className="text-gray-500 text-sm mt-1">All active OpForcements client portals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {tenants.map(t => {
          const c = COLOR[t.color] || COLOR.blue
          return (
            <div key={t.id} className={`bg-white rounded-xl border-2 ${c.border} p-5 flex flex-col gap-4`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Building2 size={20} className={c.icon} />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                  {t.id}
                </span>
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{t.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{t.description}</p>
              </div>

              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Briefcase size={12} className="text-gray-400 flex-shrink-0" />
                  {t.industry}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  {t.hq}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="font-mono">{t.namespace}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-auto">
                <div className="text-xs text-gray-400 mb-2">Admin login</div>
                <div className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mb-3">
                  {t.admin_email}
                </div>
                <a
                  href={`http://localhost:${t.portal_port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium ${c.bg} ${c.icon} border ${c.border} hover:opacity-80 transition-opacity`}
                >
                  <ExternalLink size={12} />
                  Open Portal (:{t.portal_port})
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Quick Reference — Login Credentials</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-4">Tenant</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Password</th>
                <th className="pb-2">Port</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map(t => (
                <tr key={t.id}>
                  <td className="py-2 pr-4 font-medium text-gray-800">{t.name}</td>
                  <td className="py-2 pr-4 font-mono text-gray-600">{t.admin_email}</td>
                  <td className="py-2 pr-4 font-mono text-gray-600">
                    {t.id === 'novatech' ? 'NovaTech123!' : t.id === 'meridian' ? 'Meridian123!' : 'Apex123!'}
                  </td>
                  <td className="py-2 font-mono text-gray-600">{t.portal_port}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
