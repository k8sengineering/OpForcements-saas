import React, { useEffect, useState } from 'react'
import { getStats, getEBXAssignments } from '../api/client'
import StatCard from '../components/StatCard'
import OpportunityCard from '../components/OpportunityCard'
import {
  TrendingUp, DollarSign, Building2, CalendarCheck, MapPin, Users,
  ChevronDown, ChevronUp, User, Briefcase, Tag
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const fmt = (n) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(1)}B`
    : n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${(n / 1_000).toFixed(0)}K`

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6']

const INTEREST_COLOR = {
  'Kubernetes Platform': 'bg-blue-100 text-blue-800',
  'Networking': 'bg-teal-100 text-teal-800',
  'Storage': 'bg-purple-100 text-purple-800',
  'Security': 'bg-red-100 text-red-800',
  'AI/ML': 'bg-pink-100 text-pink-800',
  'Cloud Infrastructure': 'bg-indigo-100 text-indigo-800',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedEBX, setExpandedEBX] = useState(null)
  const [ebxDetails, setEbxDetails] = useState({})
  const [ebxLoading, setEbxLoading] = useState({})
  const [expandedTrip, setExpandedTrip] = useState(null)

  useEffect(() => {
    getStats().then(s => { setStats(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const toggleEBX = async (confId) => {
    if (expandedEBX === confId) { setExpandedEBX(null); return }
    setExpandedEBX(confId)
    if (!ebxDetails[confId]) {
      setEbxLoading(prev => ({ ...prev, [confId]: true }))
      try {
        const assignments = await getEBXAssignments(confId)
        setEbxDetails(prev => ({ ...prev, [confId]: assignments }))
      } finally {
        setEbxLoading(prev => ({ ...prev, [confId]: false }))
      }
    }
  }

  const toggleTrip = (planId) => {
    setExpandedTrip(expandedTrip === planId ? null : planId)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading dashboard...</div>
  if (!stats) return <div className="p-8 text-red-500">Failed to load stats.</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Pipeline overview and top priority opportunities</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Opportunities" value={stats.total_open_opportunities} icon={TrendingUp} color="blue" />
        <StatCard label="Total Pipeline" value={fmt(stats.total_pipeline_value)} icon={DollarSign} color="green" />
        <StatCard label="Accounts" value={stats.total_accounts} icon={Building2} color="purple" />
        <StatCard label="Upcoming Conferences" value={stats.upcoming_conferences} icon={CalendarCheck} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline by City (Top 10)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.pipeline_by_city} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                {stats.pipeline_by_city.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.pipeline_by_stage} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                {stats.pipeline_by_stage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.pipeline_by_conference?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline by Event</h2>
          <ResponsiveContainer width="100%" height={Math.max(160, stats.pipeline_by_conference.length * 44)}>
            <BarChart data={stats.pipeline_by_conference} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="conference" width={180} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                {stats.pipeline_by_conference.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* EBX + Travel Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* EBX by Conference */}
        {stats.ebx_by_conference?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              EBX Assignments by Conference
            </h2>
            <div className="space-y-2">
              {stats.ebx_by_conference.map(ebx => {
                const pct = ebx.slots > 0 ? Math.round((ebx.assigned / ebx.slots) * 100) : 0
                const isOpen = expandedEBX === ebx.conference_id
                const assignments = ebxDetails[ebx.conference_id] || []
                const isLoading = ebxLoading[ebx.conference_id]

                return (
                  <div key={ebx.conference_id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleEBX(ebx.conference_id)}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm">{ebx.conference_name}</div>
                          <div className="text-xs text-gray-400">{ebx.city} · {fmtDate(ebx.start_date)}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            ebx.assigned === 0 ? 'bg-gray-100 text-gray-500'
                            : pct >= 100 ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                            {ebx.assigned} / {ebx.slots} slots
                          </span>
                          {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-3 pb-3 pt-2">
                        {isLoading && (
                          <div className="text-xs text-gray-400 py-2">Loading assignments...</div>
                        )}
                        {!isLoading && assignments.length === 0 && (
                          <div className="text-xs text-gray-400 py-2">No accounts assigned yet.</div>
                        )}
                        {!isLoading && assignments.length > 0 && (
                          <div className="space-y-2">
                            {assignments.map((a, i) => (
                              <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-gray-800 flex items-center gap-1">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                    {a.account_name}
                                  </div>
                                  {a.assigned_user_name && (
                                    <span className="text-amber-700 text-[11px] flex items-center gap-1 flex-shrink-0">
                                      <User size={10} /> {a.assigned_user_name}
                                    </span>
                                  )}
                                </div>
                                {a.opportunity_name && (
                                  <div className="mt-1 text-gray-500 flex items-center gap-1">
                                    <Briefcase size={10} className="flex-shrink-0" />
                                    {a.opportunity_name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming Travel Plans */}
        {stats.upcoming_travel_plans?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Upcoming Travel Plans
            </h2>
            <div className="space-y-2">
              {stats.upcoming_travel_plans.map(plan => {
                const isOpen = expandedTrip === plan.id
                return (
                  <div key={plan.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleTrip(plan.id)}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {plan.city}{plan.state ? `, ${plan.state}` : ''}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {fmtDate(plan.travel_start)}
                            {plan.travel_end && plan.travel_end !== plan.travel_start
                              ? ` – ${fmtDate(plan.travel_end)}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {plan.account_count} account{plan.account_count !== 1 ? 's' : ''}
                          </span>
                          {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-3 pb-3 pt-2 space-y-2">
                        {!plan.accounts?.length && (
                          <div className="text-xs text-gray-400 py-1">No account details available.</div>
                        )}
                        {plan.accounts?.map((a, i) => {
                          const interestColor = INTEREST_COLOR[a.product_interest] || 'bg-gray-100 text-gray-600'
                          return (
                            <div key={a.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden text-xs">
                              {/* Account header */}
                              <div className="p-2.5 flex items-start justify-between gap-2">
                                <div className="font-semibold text-gray-800 flex items-center gap-1">
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                  {a.name}
                                  {a.industry && <span className="font-normal text-gray-400 ml-1">· {a.industry}</span>}
                                </div>
                                {a.product_interest && (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${interestColor}`}>
                                    <Tag size={9} /> {a.product_interest}
                                  </span>
                                )}
                              </div>
                              {a.owner && (
                                <div className="px-2.5 pb-2 flex items-center gap-2 text-gray-500 ml-5">
                                  <User size={10} className="text-gray-400 flex-shrink-0" />
                                  <span className="font-medium text-gray-700">{a.owner.name}</span>
                                  <a href={`mailto:${a.owner.email}`} className="text-blue-600 hover:underline truncate">{a.owner.email}</a>
                                  {a.owner.slack_handle && (
                                    <span className="font-mono text-purple-600">@{a.owner.slack_handle}</span>
                                  )}
                                </div>
                              )}
                              {/* Opportunities */}
                              {a.opportunities?.length > 0 && (
                                <div className="border-t border-gray-100 bg-gray-50/60">
                                  <div className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Open Opportunities</div>
                                  <div className="divide-y divide-gray-100">
                                    {a.opportunities.map(o => (
                                      <div key={o.id} className="px-2.5 py-1.5 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="font-medium text-gray-800 truncate">{o.name}</div>
                                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-gray-500 mt-0.5">
                                            <span className="font-semibold text-gray-700">{fmt(o.amount)}</span>
                                            <span>{o.stage}</span>
                                            {o.close_date && <span>Close {o.close_date}</span>}
                                          </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                          <div className="font-semibold text-gray-900">{o.probability}%</div>
                                          <div className="text-gray-400 text-[10px]">{fmt(o.priority_score)} score</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">
          Top 10 Opportunities by Priority Score
          <span className="ml-2 text-xs font-normal text-gray-400">(probability × ARR)</span>
        </h2>
        <div className="space-y-3">
          {stats.top_opportunities.map((opp, i) => (
            <OpportunityCard key={opp.id} opp={opp} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
