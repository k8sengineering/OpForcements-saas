import React, { useEffect, useState } from 'react'
import { getOpportunities } from '../api/client'
import OpportunityCard from '../components/OpportunityCard'
import { Filter, SortAsc } from 'lucide-react'

const STAGES = [
  '', 'Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition',
  'Id. Decision Makers', 'Proposal/Price Quote', 'Negotiation/Review',
]

const fmt = (n) =>
  n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${(n/1_000).toFixed(0)}K`

export default function Opportunities() {
  const [opps, setOpps] = useState([])
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState('')
  const [minProb, setMinProb] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [city, setCity] = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (stage) params.stage = stage
    if (minProb) params.min_probability = parseFloat(minProb)
    if (minAmount) params.min_amount = parseFloat(minAmount) * 1000
    if (city) params.city = city
    getOpportunities(params)
      .then(d => { setOpps(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const totalPipeline = opps.reduce((s, o) => s + o.amount, 0)
  const avgProb = opps.length ? Math.round(opps.reduce((s, o) => s + o.probability, 0) / opps.length) : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <p className="text-gray-500 text-sm mt-1">All open opportunities sorted by priority score</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STAGES.map(s => <option key={s} value={s}>{s || 'All Stages'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Probability %</label>
            <input
              type="number" min="0" max="100" placeholder="0"
              value={minProb} onChange={e => setMinProb(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Amount ($K)</label>
            <input
              type="number" min="0" placeholder="0"
              value={minAmount} onChange={e => setMinAmount(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              type="text" placeholder="e.g. Seattle"
              value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Filter size={14} /> Apply Filters
          </button>
          <button
            onClick={() => { setStage(''); setMinProb(''); setMinAmount(''); setCity(''); setTimeout(load, 0) }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="flex gap-6 text-sm text-gray-600 mb-4">
          <span><strong className="text-gray-900">{opps.length}</strong> opportunities</span>
          <span><strong className="text-gray-900">{fmt(totalPipeline)}</strong> total pipeline</span>
          <span><strong className="text-gray-900">{avgProb}%</strong> avg probability</span>
        </div>
      )}

      {loading && <div className="text-gray-400">Loading...</div>}

      {!loading && (
        <div className="space-y-3">
          {opps.map((opp, i) => (
            <OpportunityCard key={opp.id} opp={opp} rank={i + 1} />
          ))}
          {opps.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-8">
              No opportunities match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
