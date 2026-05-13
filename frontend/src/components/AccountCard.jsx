import React from 'react'
import { Building2, MapPin, Tag, User, Briefcase } from 'lucide-react'

const fmt = (n) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(1)}B`
    : n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(0)}M`
    : `$${(n / 1_000).toFixed(0)}K`

const INTEREST_COLOR = {
  'Kubernetes Platform': 'bg-blue-100 text-blue-800',
  'Networking': 'bg-teal-100 text-teal-800',
  'Storage': 'bg-purple-100 text-purple-800',
  'Security': 'bg-red-100 text-red-800',
  'AI/ML': 'bg-pink-100 text-pink-800',
  'Cloud Infrastructure': 'bg-indigo-100 text-indigo-800',
}

export default function AccountCard({ account, rank, showContacts = false }) {
  const interestColor = INTEREST_COLOR[account.product_interest] || 'bg-gray-100 text-gray-700'
  const executives = (account.contacts || []).filter(c => c.is_executive)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {rank && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex-shrink-0">
                {rank}
              </span>
            )}
            <Building2 size={15} className="text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 text-sm truncate">{account.name}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 ml-8 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {account.billing_city}, {account.billing_state}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={11} /> {account.industry}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-gray-900">
            {fmt(account.total_pipeline || 0)} pipeline
          </div>
          <div className="text-xs text-gray-500">{account.open_opportunity_count} opp{account.open_opportunity_count !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {account.product_interest && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${interestColor}`}>
            <Tag size={10} /> {account.product_interest}
          </span>
        )}
        {account.recommended_specialist && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <User size={10} /> {account.recommended_specialist.name}
          </span>
        )}
      </div>

      {showContacts && executives.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500 mb-1.5">Key Executives</div>
          <div className="space-y-1">
            {executives.map(c => (
              <div key={c.id} className="text-xs text-gray-700 flex items-center gap-1.5">
                <User size={11} className="text-gray-400" />
                <span className="font-medium">{c.first_name} {c.last_name}</span>
                <span className="text-gray-400">· {c.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
