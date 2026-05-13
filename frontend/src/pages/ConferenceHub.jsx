import React, { useEffect, useState } from 'react'
import {
  getConferences, getConferenceAttendees, getEBXAssignments,
  createConferenceAttendee, deleteConferenceAttendee, getUsers
} from '../api/client'
import {
  CalendarCheck, Users, Hotel, Plane, Plus, X, ChevronDown, ChevronUp,
  User, Briefcase, Check, AlertCircle
} from 'lucide-react'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ROLE_COLOR = {
  'K8s Platform Specialist': 'bg-blue-100 text-blue-800',
  'K8s Presenter': 'bg-blue-100 text-blue-800',
  'Networking Specialist': 'bg-teal-100 text-teal-800',
  'Storage Solutions Specialist': 'bg-purple-100 text-purple-800',
  'Security Lead': 'bg-red-100 text-red-800',
  'AI/ML Specialist': 'bg-pink-100 text-pink-800',
  'AI/ML Demo Lead': 'bg-pink-100 text-pink-800',
  'Cloud Infrastructure Architect': 'bg-indigo-100 text-indigo-800',
  'Cloud Infrastructure Lead': 'bg-indigo-100 text-indigo-800',
}
const roleColor = (role) => ROLE_COLOR[role] || 'bg-gray-100 text-gray-700'

const BLANK_FORM = {
  user_id: 'U001', role: '', hotel_name: '', hotel_address: '',
  check_in: '', check_out: '', flight_in: '', flight_out: '', notes: '',
}

export default function ConferenceHub() {
  const [conferences, setConferences] = useState([])
  const [selected, setSelected] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [ebxAssignments, setEBXAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [expandedHotels, setExpandedHotels] = useState({})

  useEffect(() => {
    Promise.all([getConferences(), getUsers()]).then(([confs, usrs]) => {
      setConferences(confs)
      setUsers(usrs)
      if (confs.length > 0) loadConference(confs[0])
    })
  }, [])

  const loadConference = async (conf) => {
    setSelected(conf)
    setLoading(true)
    setShowForm(false)
    try {
      const [att, ebx] = await Promise.all([
        getConferenceAttendees(conf.id),
        getEBXAssignments(conf.id),
      ])
      setAttendees(att)
      setEBXAssignments(ebx)
      // Auto-expand all hotels
      const hotels = [...new Set(att.map(a => a.hotel_name || 'No hotel listed'))]
      const expanded = {}
      hotels.forEach(h => { expanded[h] = true })
      setExpandedHotels(expanded)
    } finally {
      setLoading(false)
    }
  }

  const openForm = () => {
    setForm({ ...BLANK_FORM, check_in: selected?.start_date || '', check_out: selected?.end_date || '' })
    setFormError(null)
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.role.trim()) { setFormError('Role is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      await createConferenceAttendee({ ...form, conference_id: selected.id })
      const att = await getConferenceAttendees(selected.id)
      setAttendees(att)
      const hotels = [...new Set(att.map(a => a.hotel_name || 'No hotel listed'))]
      setExpandedHotels(prev => {
        const next = { ...prev }
        hotels.forEach(h => { if (next[h] === undefined) next[h] = true })
        return next
      })
      setShowForm(false)
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Failed to register')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (attendeeId) => {
    await deleteConferenceAttendee(attendeeId)
    setAttendees(prev => prev.filter(a => a.id !== attendeeId))
  }

  // Group attendees by hotel
  const byHotel = attendees.reduce((acc, a) => {
    const h = a.hotel_name || 'No hotel listed'
    if (!acc[h]) acc[h] = []
    acc[h].push(a)
    return acc
  }, {})

  // Group EBX assignments by assigned user
  const ebxByUser = ebxAssignments.reduce((acc, e) => {
    const key = e.assigned_user_name || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const attendeeUserIds = new Set(attendees.map(a => a.user.id))
  // Warn about EBX accounts whose specialist is not attending
  const mismatches = ebxAssignments.filter(e =>
    e.assigned_user_id && !attendeeUserIds.has(e.assigned_user_id)
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conference Hub</h1>
        <p className="text-gray-500 text-sm mt-1">
          Coordinate who is attending each conference, their lodging, travel itineraries, and EBX coverage.
        </p>
      </div>

      {/* Conference tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {conferences.map(c => (
          <button
            key={c.id}
            onClick={() => loadConference(c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              selected?.id === c.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <CalendarCheck size={14} />
            {c.name}
            <span className="text-xs opacity-70">{c.city}, {c.state} · {c.start_date}</span>
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading...</div>}

      {selected && !loading && (
        <>
          {/* Summary bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Dates</div>
                  <div className="font-medium text-gray-800">
                    {fmtDate(selected.start_date)} – {fmtDate(selected.end_date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Location</div>
                  <div className="font-medium text-gray-800">{selected.city}, {selected.state}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Team Attending</div>
                  <div className="font-medium text-gray-800">{attendees.length} people</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">EBX Assigned</div>
                  <div className="font-medium text-gray-800">
                    {ebxAssignments.length} / {selected.ebx_slots} slots
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Hotels</div>
                  <div className="font-medium text-gray-800">{Object.keys(byHotel).length}</div>
                </div>
              </div>
              <button
                onClick={openForm}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={15} /> Register Attendee
              </button>
            </div>

            {/* EBX specialist mismatch warning */}
            {mismatches.length > 0 && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-semibold">Coverage gap: </span>
                  {mismatches.map(m => m.account_name).join(', ')} — assigned specialist is not registered for this conference.
                </div>
              </div>
            )}
          </div>

          {/* Register form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Register Attendee for {selected.name}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Team Member *</label>
                  <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.specialty}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role at Conference *</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="e.g. K8s Platform Specialist"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hotel</label>
                  <input value={form.hotel_name} onChange={e => setForm(f => ({ ...f, hotel_name: e.target.value }))}
                    placeholder="Hotel name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hotel Address</label>
                  <input value={form.hotel_address} onChange={e => setForm(f => ({ ...f, hotel_address: e.target.value }))}
                    placeholder="123 Main St, City, ST"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
                  <input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
                  <input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Flight In</label>
                  <input value={form.flight_in} onChange={e => setForm(f => ({ ...f, flight_in: e.target.value }))}
                    placeholder="AA 123 · Nov 10 · arrives 2:00 PM"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Flight Out</label>
                  <input value={form.flight_out} onChange={e => setForm(f => ({ ...f, flight_out: e.target.value }))}
                    placeholder="AA 124 · Nov 14 · departs 6:00 PM"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any notes..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {formError && <div className="mt-2 text-sm text-red-500">{formError}</div>}
              <div className="flex gap-2 mt-4">
                <button onClick={submit} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                  <Check size={14} /> {saving ? 'Saving...' : 'Register'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Team by Hotel */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Team Attendance ({attendees.length} people)
            </h2>

            {attendees.length === 0 && (
              <div className="text-gray-400 text-sm">No team members registered yet.</div>
            )}

            <div className="space-y-4">
              {Object.entries(byHotel).map(([hotel, guests]) => (
                <div key={hotel} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedHotels(prev => ({ ...prev, [hotel]: !prev[hotel] }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <Hotel size={15} className="text-blue-500" />
                      {hotel}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        {guests[0]?.hotel_address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        {guests.length} guest{guests.length !== 1 ? 's' : ''}
                      </span>
                      {expandedHotels[hotel]
                        ? <ChevronUp size={14} className="text-gray-400" />
                        : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </button>

                  {expandedHotels[hotel] && (
                    <div className="divide-y divide-gray-100">
                      {guests.map(a => {
                        const myEBX = ebxAssignments.filter(e => e.assigned_user_id === a.user.id)
                        return (
                          <div key={a.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {/* Name + role */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 text-sm">{a.user.name}</span>
                                  <span className="text-xs text-gray-400">{a.user.title}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor(a.role)}`}>
                                    {a.role}
                                  </span>
                                </div>

                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-600">
                                  {/* Hotel dates */}
                                  {(a.check_in || a.check_out) && (
                                    <div className="flex items-center gap-1.5">
                                      <Hotel size={11} className="text-gray-400 flex-shrink-0" />
                                      <span>
                                        Check-in {fmtDate(a.check_in)}
                                        {a.check_out ? ` · Check-out ${fmtDate(a.check_out)}` : ''}
                                      </span>
                                    </div>
                                  )}
                                  {/* Flights */}
                                  {a.flight_in && (
                                    <div className="flex items-center gap-1.5">
                                      <Plane size={11} className="text-gray-400 flex-shrink-0" />
                                      <span>{a.flight_in}</span>
                                    </div>
                                  )}
                                  {a.flight_out && (
                                    <div className="flex items-center gap-1.5">
                                      <Plane size={11} className="text-gray-400 flex-shrink-0 rotate-90" />
                                      <span>{a.flight_out}</span>
                                    </div>
                                  )}
                                </div>

                                {/* EBX accounts this person is covering */}
                                {myEBX.length > 0 && (
                                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                    <Briefcase size={11} className="text-amber-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-500">EBX covering:</span>
                                    {myEBX.map(e => (
                                      <span key={e.id} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                        {e.account_name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {a.notes && (
                                  <div className="mt-1 text-xs text-gray-400 italic">{a.notes}</div>
                                )}
                              </div>

                              <button
                                onClick={() => remove(a.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                                title="Remove attendee"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* EBX Coverage */}
          {ebxAssignments.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-amber-500" />
                EBX Coverage — {ebxAssignments.length} client{ebxAssignments.length !== 1 ? 's' : ''} assigned
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {Object.entries(ebxByUser).map(([userName, accts]) => {
                  const attending = accts.length > 0 && attendeeUserIds.has(accts[0].assigned_user_id)
                  return (
                    <div key={userName} className="px-4 py-3 flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full mt-1.5 ${attending ? 'bg-green-500' : 'bg-amber-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{userName}</span>
                          {!attending && accts[0].assigned_user_id && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle size={10} /> Not registered for this conference
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {accts.map(e => (
                            <div key={e.id} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                              <span className="font-medium text-gray-800">{e.account_name}</span>
                              {e.opportunity_name && (
                                <span className="text-gray-400 ml-1">· {e.opportunity_name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
