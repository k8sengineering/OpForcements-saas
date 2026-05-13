import React from 'react'
import { DollarSign, Calendar, User } from 'lucide-react'

const STAGE_COLOR = {
  'Negotiation/Review': 'bg-green-100 text-green-800',
  'Proposal/Price Quote': 'bg-blue-100 text-blue-800',
  'Value Proposition': 'bg-indigo-100 text-indigo-800',
  'Needs Analysis': 'bg-yellow-100 text-yellow-800',
  'Qualification': 'bg-orange-100 text-orange-800',
  'Id. Decision Makers': 'bg-pink-100 text-pink-800',
  'Prospecting': 'bg-gray-100 text-gray-800',
}

const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${(n / 1_000).toFixed(0)}K`

export default function OpportunityCard({ opp, rank }) {
  const stageColor = STAGE_COLOR[opp.stage] || 'bg-gray-100 text-gray-700'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {rank && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold mr-2">
              {rank}
            </span>
          )}
          <span className="font-semibold text-gray-900 text-sm">{opp.name}</span>
          {opp.account_name && (
            <div className="text-xs text-gray-500 mt-0.5">{opp.account_name}</div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-gray-900">{fmt(opp.amount)}</div>
          <div className="text-xs text-gray-500">Score: {fmt(opp.priority_score)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageColor}`}>
          {opp.stage}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <DollarSign size={11} /> {opp.probability}%
        </span>
        {opp.close_date && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={11} /> {opp.close_date}
          </span>
        )}
        {opp.owner_name && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <User size={11} /> {opp.owner_name}
            {opp.owner_specialty && ` · ${opp.owner_specialty}`}
          </span>
        )}
      </div>
    </div>
  )
}
