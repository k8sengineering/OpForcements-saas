import React, { useEffect, useState } from 'react'
import {
  getConferences, getEBXPriorities, getEBXAssignments,
  createEBXAssignment, deleteEBXAssignment
} from '../api/client'
import MessageModal from '../components/MessageModal'
import { CalendarCheck, Check, X, ChevronDown, ChevronUp, Mail, User, Tag } from 'lucide-react'

const fmt = (n) =>
  n >= 1_000_000_000 ? `$${(n/1e9).toFixed(1)}B`
  : n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M`
  : `$${(n/1_000).toFixed(0)}K`

const INTEREST_COLOR = {
  'Kubernetes Platform': 'bg-blue-100 text-blue-800',
  'Networking': 'bg-teal-100 text-teal-800',
  'Storage': 'bg-purple-100 text-purple-800',
  'Security': 'bg-red-100 text-red-800',
  'AI/ML': 'bg-pink-100 text-pink-800',
  'Cloud Infrastructure': 'bg-indigo-100 text-indigo-800',
}

export default function EBXPlanner() {
  const [conferences, setConferences] = useState([])
  const [selectedConf, setSelectedConf] = useState(null)
  const [priorities, setPriorities] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [modalAccount, setModalAccount] = useState(null)

  useEffect(() => {
    getConferences().then(c => {
      setConferences(c)
      if (c.length > 0) selectConference(c[0])
    })
  }, [])

  const selectConference = async (conf) => {
    setSelectedConf(conf)
    setLoading(true)
    try {
      const [prio, assigns] = await Promise.all([
        getEBXPriorities(conf.id),
        getEBXAssignments(conf.id),
      ])
      setPriorities(prio)
      setAssignments(assigns)
    } finally {
      setLoading(false)
    }
  }

  const assign = async (item) => {
    try {
      const body = {
        conference_id: selectedConf.id,
        account_id: item.account.id,
        opportunity_id: item.top_opportunity?.id || null,
        assigned_user_id: item.recommended_specialist?.id || null,
      }
      await createEBXAssignment(body)
      const [prio, assigns] = await Promise.all([
        getEBXPriorities(selectedConf.id),
        getEBXAssignments(selectedConf.id),
      ])
      setPriorities(prio)
      setAssignments(assigns)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to assign')
    }
  }

  const unassign = async (accountId) => {
    const a = assignments.find(x => x.account_id === accountId)
    if (!a) return
    await deleteEBXAssignment(a.id)
    const [prio, assigns] = await Promise.all([
      getEBXPriorities(selectedConf.id),
      getEBXAssignments(selectedConf.id),
    ])
    setPriorities(prio)
    setAssignments(assigns)
  }

  const slotsUsed = priorities?.assigned_count || 0
  const slotsTotal = priorities?.available_slots || 0

  const conferenceDates = selectedConf
    ? { start: selectedConf.start_date, end: selectedConf.end_date }
    : {}
  const conferenceInfo = selectedConf
    ? { name: selectedConf.name }
    : null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">EBX Briefings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Prioritize executive briefings for upcoming conferences. Accounts ranked by expected value (probability × ARR).
        </p>
      </div>

      {/* Conference selector */}
      <div className="flex flex-wrap gap-3 mb-6">
        {conferences.map(c => (
          <button
            key={c.id}
            onClick={() => selectConference(c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              selectedConf?.id === c.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <CalendarCheck size={14} />
            {c.name}
            <span className="text-xs opacity-70">
              {c.city}, {c.state} · {c.start_date}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-400">Loading priorities...</div>}

      {priorities && !loading && (
        <>
          {/* Slot progress bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">{priorities.conference.name}</div>
              <div className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{slotsUsed}</span> / {slotsTotal} slots assigned
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (slotsUsed / slotsTotal) * 100)}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span>{slotsTotal - slotsUsed} slots remaining</span>
              <span>·</span>
              <span>{priorities.conference.description}</span>
            </div>
          </div>

          {/* Assigned accounts */}
          {assignments.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Check size={16} className="text-green-600" /> Confirmed EBX Attendees ({assignments.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-sm">
                    <span className="font-medium text-green-800">{a.account_name}</span>
                    {a.assigned_user_name && (
                      <span className="text-green-600 text-xs">· {a.assigned_user_name}</span>
                    )}
                    <button
                      onClick={() => unassign(a.account_id)}
                      className="text-green-400 hover:text-red-500 transition-colors"
                      title="Remove assignment"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority list */}
          <h2 className="font-semibold text-gray-700 mb-3">
            All Accounts — Ranked by Priority Score
          </h2>
          <div className="space-y-3">
            {priorities.items.map((item) => {
              const isExpanded = expanded === item.account.id
              const interestColor = INTEREST_COLOR[item.account.product_interest] || 'bg-gray-100 text-gray-700'
              const executives = (item.account.contacts || []).filter(c => c.is_executive)

              return (
                <div
                  key={item.account.id}
                  className={`bg-white rounded-xl border transition-all ${
                    item.is_assigned ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex-shrink-0">
                            {item.rank}
                          </span>
                          <span className="font-semibold text-gray-900">{item.account.name}</span>
                          {item.is_assigned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check size={10} /> Assigned
                            </span>
                          )}
                          {item.account.product_interest && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${interestColor}`}>
                              <Tag size={10} /> {item.account.product_interest}
                            </span>
                          )}
                        </div>
                        <div className="ml-8 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>{item.account.billing_city}, {item.account.billing_state}</span>
                          <span>{item.account.industry}</span>
                          <span className="font-medium text-gray-700">Score: {fmt(item.priority_score)}</span>
                          <span className="font-medium text-gray-700">{fmt(item.account.total_pipeline)} pipeline</span>
                          <span>{item.account.open_opportunity_count} open opp{item.account.open_opportunity_count !== 1 ? 's' : ''}</span>
                        </div>
                        {/* Account rep row */}
                        {item.account.owner && (
                          <div className="ml-8 flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User size={11} className="text-gray-400" />
                              <span className="font-medium">{item.account.owner.name}</span>
                              <span className="text-gray-400">{item.account.owner.title}</span>
                            </span>
                            <a href={`mailto:${item.account.owner.email}`}
                              className="text-blue-600 hover:underline">{item.account.owner.email}</a>
                            {item.account.owner.slack_handle && (
                              <span className="font-mono text-purple-600">@{item.account.owner.slack_handle}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.account.owner && (
                          <button
                            onClick={() => setModalAccount(item.account)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Mail size={12} />
                            Contact Rep
                          </button>
                        )}
                        <button
                          onClick={() => setExpanded(isExpanded ? null : item.account.id)}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                          title="Expand"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {item.is_assigned ? (
                          <button
                            onClick={() => unassign(item.account.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => assign(item)}
                            disabled={slotsUsed >= slotsTotal}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                          >
                            Add to EBX
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                        {item.account.opportunities?.length > 0 && (
                          <div>
                            <div className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Opportunities</div>
                            {item.account.opportunities.map(o => (
                              <div key={o.id} className="mb-2 bg-white border border-gray-200 rounded-lg p-2">
                                <div className="font-semibold text-gray-800">{o.name}</div>
                                <div className="text-gray-500 mt-0.5">
                                  {fmt(o.amount)} · {o.probability}% close · {o.stage}
                                  {o.close_date && ` · Target close ${o.close_date}`}
                                </div>
                                <div className="text-gray-400 mt-0.5">
                                  Priority score: {fmt(o.priority_score)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.recommended_specialist && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                          <span className="font-medium text-amber-800">Recommended specialist:</span>
                          <span className="text-amber-700 ml-1">
                            {item.recommended_specialist.name} — {item.recommended_specialist.specialty}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <MessageModal
        isOpen={!!modalAccount}
        onClose={() => setModalAccount(null)}
        account={modalAccount}
        dates={conferenceDates}
        conferenceInfo={conferenceInfo}
      />
    </div>
  )
}
