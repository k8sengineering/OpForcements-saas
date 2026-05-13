import React, { useEffect, useState } from 'react'
import { getTravelPlans, deleteTravelPlan } from '../api/client'
import {
  MapPin, Calendar, DollarSign, Building2, TrendingUp,
  ChevronDown, ChevronUp, Trash2, User, Tag, Plane,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6']

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

function fmtDateRange(start, end) {
  if (!start) return ''
  const s = fmtDate(start)
  if (!end || end === start) return s
  const eDate = new Date(end + 'T00:00:00')
  const sDate = new Date(start + 'T00:00:00')
  if (eDate.getFullYear() === sDate.getFullYear() && eDate.getMonth() === sDate.getMonth()) {
    return `${new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${eDate.getDate()}, ${eDate.getFullYear()}`
  }
  return `${s} – ${fmtDate(end)}`
}

function tripPipeline(plan) {
  return plan.accounts.reduce((sum, a) => sum + (a.total_pipeline || 0), 0)
}

function isUpcoming(plan) {
  return new Date(plan.travel_end + 'T00:00:00') >= new Date(new Date().toDateString())
}

export default function TravelDashboard() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    getTravelPlans()
      .then(data => { setPlans(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this trip?')) return
    setDeleting(id)
    try {
      await deleteTravelPlan(id)
      setPlans(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const upcoming = plans.filter(isUpcoming).sort((a, b) => new Date(a.travel_start) - new Date(b.travel_start))
  const past = plans.filter(p => !isUpcoming(p)).sort((a, b) => new Date(b.travel_start) - new Date(a.travel_start))

  const totalAccounts = new Set(plans.flatMap(p => p.accounts.map(a => a.id))).size
  const totalPipeline = plans.reduce((sum, p) => sum + tripPipeline(p), 0)
  const nextTrip = upcoming[0]

  const chartData = [...plans]
    .sort((a, b) => tripPipeline(b) - tripPipeline(a))
    .map(p => ({
      name: p.city + (p.state ? `, ${p.state}` : ''),
      pipeline: tripPipeline(p),
      upcoming: isUpcoming(p),
    }))

  if (loading) return <div className="p-8 text-gray-400">Loading travel dashboard...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Travel Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">All saved trips, pipeline coverage, and account priorities</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Saved Trips" value={plans.length} icon={Plane} color="blue" />
        <StatCard label="Upcoming Trips" value={upcoming.length} icon={Calendar} color="amber" />
        <StatCard label="Unique Accounts" value={totalAccounts} icon={Building2} color="purple" />
        <StatCard label="Total Pipeline" value={fmt(totalPipeline)} icon={DollarSign} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pipeline by trip chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Pipeline by Trip</h2>
            <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 40)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.upcoming ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Upcoming</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" /> Past</span>
            </div>
          </div>
        )}

        {/* Next trip summary */}
        {nextTrip ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plane size={16} className="text-blue-600" /> Next Trip
            </h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">
                  {nextTrip.city}{nextTrip.state ? `, ${nextTrip.state}` : ''}
                </div>
                <div className="text-sm text-gray-500">{fmtDateRange(nextTrip.travel_start, nextTrip.travel_end)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{nextTrip.account_count}</div>
                <div className="text-xs text-gray-500">Accounts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{fmt(tripPipeline(nextTrip))}</div>
                <div className="text-xs text-gray-500">Pipeline</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {nextTrip.accounts.reduce((s, a) => s + (a.open_opportunity_count || 0), 0)}
                </div>
                <div className="text-xs text-gray-500">Open Opps</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {nextTrip.accounts.slice(0, 4).map((a, i) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                    {a.name}
                  </span>
                  <span className="text-gray-500 text-xs">{fmt(a.total_pipeline)}</span>
                </div>
              ))}
              {nextTrip.accounts.length > 4 && (
                <div className="text-xs text-gray-400 pl-6">+{nextTrip.accounts.length - 4} more accounts</div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center justify-center text-center gap-2">
            <MapPin size={32} className="text-gray-300" />
            <p className="text-gray-400 text-sm">No upcoming trips.<br />Use Travel Planner to save a trip.</p>
          </div>
        )}
      </div>

      {/* Upcoming trips */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Upcoming Trips
            <span className="text-xs font-normal text-gray-400 ml-1">{upcoming.length}</span>
          </h2>
          <div className="space-y-3">
            {upcoming.map(plan => (
              <TripCard key={plan.id} plan={plan} expanded={expanded.has(plan.id)}
                onToggle={() => toggle(plan.id)}
                onDelete={() => handleDelete(plan.id)}
                deleting={deleting === plan.id}
                upcoming />
            ))}
          </div>
        </section>
      )}

      {/* Past trips */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" /> Past Trips
            <span className="text-xs font-normal text-gray-400 ml-1">{past.length}</span>
          </h2>
          <div className="space-y-3">
            {past.map(plan => (
              <TripCard key={plan.id} plan={plan} expanded={expanded.has(plan.id)}
                onToggle={() => toggle(plan.id)}
                onDelete={() => handleDelete(plan.id)}
                deleting={deleting === plan.id}
                upcoming={false} />
            ))}
          </div>
        </section>
      )}

      {plans.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No trips saved yet.</p>
          <p className="text-gray-400 text-sm mt-1">Use the Travel Planner to search a city and save a trip.</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700' },
  }[color] || { bg: 'bg-gray-50', icon: 'text-gray-600', val: 'text-gray-700' }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={colors.icon} />
      </div>
      <div>
        <div className={`text-xl font-bold ${colors.val}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function TripCard({ plan, expanded, onToggle, onDelete, deleting, upcoming }) {
  const pipeline = tripPipeline(plan)

  return (
    <div className={`bg-white rounded-xl border transition-all ${upcoming ? 'border-gray-200' : 'border-gray-100 opacity-80'}`}>
      <button onClick={onToggle} className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${upcoming ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <MapPin size={16} className={upcoming ? 'text-blue-600' : 'text-gray-400'} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900">
                {plan.city}{plan.state ? `, ${plan.state}` : ''}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {fmtDateRange(plan.travel_start, plan.travel_end)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">{fmt(pipeline)}</div>
              <div className="text-xs text-gray-400">{plan.account_count} account{plan.account_count !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              disabled={deleting}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete trip"
            >
              <Trash2 size={14} />
            </button>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && plan.accounts.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/40">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Accounts &amp; Opportunities — ranked by pipeline priority
          </div>
          <div className="space-y-3">
            {plan.accounts.map((a, i) => {
              const interestColor = INTEREST_COLOR[a.product_interest] || 'bg-gray-100 text-gray-600'
              return (
                <div key={a.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {/* Account header */}
                  <div className="px-3 py-2.5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {a.name}
                      {a.industry && <span className="font-normal text-gray-400 ml-1">· {a.industry}</span>}
                    </div>
                    {a.product_interest && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${interestColor}`}>
                        <Tag size={8} /> {a.product_interest}
                      </span>
                    )}
                  </div>

                  {/* Owner */}
                  {a.owner && (
                    <div className="px-3 pb-2 flex items-center gap-2 text-gray-500 ml-5">
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
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Open Opportunities
                      </div>
                      <div className="divide-y divide-gray-100">
                        {a.opportunities.map(o => (
                          <div key={o.id} className="px-3 py-2 flex items-start justify-between gap-3">
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
        </div>
      )}
    </div>
  )
}
