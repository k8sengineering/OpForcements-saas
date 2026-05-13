import React, { useState } from 'react'
import { getTravelSuggestions, createTravelPlan } from '../api/client'
import MessageModal from '../components/MessageModal'
import { MapPin, Search, Mail, Building2, User, Tag, ChevronDown, ChevronUp, Plus, Check, Bookmark } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6']

const US_STATES = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

const INTEREST_COLOR = {
  'Kubernetes Platform': 'bg-blue-100 text-blue-800',
  'Networking': 'bg-teal-100 text-teal-800',
  'Storage': 'bg-purple-100 text-purple-800',
  'Security': 'bg-red-100 text-red-800',
  'AI/ML': 'bg-pink-100 text-pink-800',
  'Cloud Infrastructure': 'bg-indigo-100 text-indigo-800',
}

const fmt = (n) =>
  n >= 1_000_000_000 ? `$${(n/1e9).toFixed(1)}B`
  : n >= 1_000_000 ? `$${(n/1e6).toFixed(1)}M`
  : `$${(n/1000).toFixed(0)}K`

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TravelPlanner() {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [modalAccount, setModalAccount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const search = async () => {
    if (!city.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setExpanded(null)
    setSelected(new Set())
    setSaved(false)
    try {
      const data = await getTravelSuggestions(city.trim(), state || undefined)
      setResult(data)
    } catch {
      setError('Failed to load suggestions. Check that the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const saveTrip = async () => {
    if (!startDate || !endDate || selected.size === 0) return
    setSaving(true)
    try {
      await createTravelPlan({
        city: result.city,
        state: result.state || state,
        travel_start: startDate,
        travel_end: endDate,
        account_ids: Array.from(selected),
      })
      setSaved(true)
    } catch {
      alert('Failed to save trip plan.')
    } finally {
      setSaving(false)
    }
  }

  const dates = { start: startDate, end: endDate }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Travel Planner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter a city and travel dates to see which customers to visit, ranked by pipeline priority.
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              type="text" value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="e.g. San Francisco"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {US_STATES.map(s => <option key={s} value={s}>{s || 'Any'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Arrive</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Depart</label>
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-end">
            <button onClick={search} disabled={loading || !city.trim()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
              <Search size={15} />
              {loading ? 'Searching...' : 'Find Customers'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {result && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-blue-600" />
              <div>
                <span className="font-semibold text-gray-900">
                  {result.city}{result.state ? `, ${result.state}` : ''}
                </span>
                {startDate && (
                  <span className="text-gray-500 text-sm ml-2">
                    {fmtDate(startDate)}{endDate && endDate !== startDate ? ` - ${fmtDate(endDate)}` : ''}
                  </span>
                )}
                <span className="text-gray-500 text-sm ml-2">
                  &mdash; {result.total_accounts} customer{result.total_accounts !== 1 ? 's' : ''} &middot; {fmt(result.total_pipeline)} pipeline
                </span>
              </div>
            </div>
            {selected.size > 0 && startDate && endDate && (
              <button
                onClick={saveTrip}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saved
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saved ? <Check size={14} /> : <Bookmark size={14} />}
                {saved ? 'Trip Saved to Dashboard' : `Save Trip (${selected.size} account${selected.size !== 1 ? 's' : ''})`}
              </button>
            )}
          </div>

          {result.regional_pipeline?.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="font-semibold text-gray-800 mb-1">
                Regional Pipeline — {result.state}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                {fmt(result.regional_total)} total pipeline across all cities in this state
              </p>
              <ResponsiveContainer width="100%" height={Math.max(140, result.regional_pipeline.length * 36)}>
                <BarChart data={result.regional_pipeline} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="city" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                    {result.regional_pipeline.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.city.toLowerCase() === result.city.toLowerCase() ? '#3b82f6' : COLORS[(i + 2) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {result.accounts.length === 0 ? (
            <div className="text-gray-400 text-sm">No customers found in this city.</div>
          ) : (
            <div className="space-y-3">
              {result.accounts.map((account, i) => {
                const isExpanded = expanded === account.id
                const isSelected = selected.has(account.id)
                const executives = (account.contacts || []).filter(c => c.is_executive)
                const interestColor = INTEREST_COLOR[account.product_interest] || 'bg-gray-100 text-gray-700'

                return (
                  <div key={account.id}
                    className={`bg-white rounded-xl border transition-all ${isSelected ? 'border-blue-300 bg-blue-50/20' : 'border-gray-200'}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Rank + select */}
                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold">
                            {i + 1}
                          </span>
                          <button
                            onClick={() => toggleSelect(account.id)}
                            title={isSelected ? 'Remove from trip' : 'Add to trip'}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{account.name}</span>
                            {account.product_interest && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${interestColor}`}>
                                <Tag size={10} /> {account.product_interest}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                            <span>{account.industry}</span>
                            <span className="font-medium text-gray-700">{fmt(account.total_pipeline)} pipeline</span>
                            <span>{account.open_opportunity_count} open opp{account.open_opportunity_count !== 1 ? 's' : ''}</span>
                          </div>
                          {/* Account rep row */}
                          {account.owner && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
                              <span className="flex items-center gap-1">
                                <User size={11} className="text-gray-400" />
                                <span className="font-medium">{account.owner.name}</span>
                                <span className="text-gray-400">{account.owner.title}</span>
                              </span>
                              <a href={`mailto:${account.owner.email}`}
                                className="text-blue-600 hover:underline">{account.owner.email}</a>
                              {account.owner.slack_handle && (
                                <span className="font-mono text-purple-600">@{account.owner.slack_handle}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {account.owner && (
                            <button
                              onClick={() => setModalAccount(account)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Mail size={12} />
                              Contact Rep
                            </button>
                          )}
                          <button
                            onClick={() => setExpanded(isExpanded ? null : account.id)}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Executives */}
                          {executives.length > 0 && (
                            <div>
                              <div className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Executives</div>
                              {executives.map(c => (
                                <div key={c.id} className="mb-2 bg-white border border-gray-200 rounded-lg p-2">
                                  <div className="font-semibold text-gray-800">{c.first_name} {c.last_name}</div>
                                  <div className="text-gray-500">{c.title}</div>
                                  {c.email && <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a>}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Opportunities */}
                          {account.opportunities?.length > 0 && (
                            <div>
                              <div className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Opportunities</div>
                              {account.opportunities.map(o => (
                                <div key={o.id} className="mb-2 bg-white border border-gray-200 rounded-lg p-2">
                                  <div className="font-semibold text-gray-800">{o.name}</div>
                                  <div className="text-gray-500 mt-0.5">
                                    {fmt(o.amount)} &middot; {o.probability}% close &middot; {o.stage}
                                    {o.close_date && ` &middot; Target close ${o.close_date}`}
                                  </div>
                                  <div className="text-gray-400 mt-0.5">
                                    Priority score: {fmt(o.priority_score)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {account.recommended_specialist && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                            <span className="font-medium text-amber-800">Recommended specialist:</span>
                            <span className="text-amber-700 ml-1">
                              {account.recommended_specialist.name} — {account.recommended_specialist.specialty}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <MessageModal
        isOpen={!!modalAccount}
        onClose={() => setModalAccount(null)}
        account={modalAccount}
        dates={dates}
      />
    </div>
  )
}
