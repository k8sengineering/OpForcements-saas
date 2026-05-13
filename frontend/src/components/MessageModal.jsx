import React, { useState } from 'react'
import { X, Copy, Check, Mail, MessageSquare } from 'lucide-react'

const PRODUCT_PITCH = {
  'Kubernetes Platform': 'our enterprise Kubernetes platform — helping teams ship faster, reduce operational overhead, and run cloud-native at scale',
  'Networking': 'our cloud networking solutions — SD-WAN, observability, and high-performance connectivity for modern distributed architectures',
  'Storage': 'our cloud-native storage solutions — high-performance, scalable, and purpose-built for containerized workloads',
  'Security': 'our zero-trust security platform — runtime protection, compliance automation, and threat detection for cloud-native environments',
  'AI/ML': 'our AI/ML infrastructure — purpose-built GPU orchestration, MLOps pipelines, and scalable model-serving on Kubernetes',
  'Cloud Infrastructure': 'our cloud infrastructure modernization capabilities — helping teams migrate, optimize, and run resilient multi-cloud environments',
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n) {
  if (!n) return '$0'
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`
}

export default function MessageModal({ isOpen, onClose, account, dates, conferenceInfo }) {
  const [tab, setTab] = useState('email')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !account) return null

  const rep = account.owner
  if (!rep) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">No Account Rep Assigned</h2>
            <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
          </div>
          <p className="text-sm text-gray-500">This account does not have an assigned rep.</p>
        </div>
      </div>
    )
  }

  const repFirst = rep.name.split(' ')[0]
  const city = account.billing_city
  const state = account.billing_state
  const interest = account.product_interest || 'cloud-native solutions'
  const pitch = PRODUCT_PITCH[interest] || 'our cloud-native platform capabilities'
  const pipeline = fmtMoney(account.total_pipeline)
  const oppCount = account.open_opportunity_count || 0
  const executives = (account.contacts || []).filter(c => c.is_executive)
  const topContact = executives[0]

  const dateRange = dates?.start && dates?.end && dates.start !== dates.end
    ? `${fmtDate(dates.start)} - ${fmtDate(dates.end)}`
    : dates?.start ? fmtDate(dates.start) : 'the upcoming dates'

  const contextLine = conferenceInfo
    ? `I will be in ${city}, ${state} attending ${conferenceInfo.name} from ${dateRange}`
    : `I will be in ${city}, ${state} from ${dateRange}`

  const topOpp = account.opportunities?.[0]

  const emailSubject = `${account.name} - meeting opportunity while I am in ${city}`

  const emailBody = `Hi ${repFirst},

${contextLine} and wanted to reach out about ${account.name}.

${oppCount > 0
  ? `They have ${oppCount > 1 ? `${oppCount} open opportunities` : 'an open opportunity'} in our pipeline totaling ${pipeline}${topOpp ? ` — the largest being "${topOpp.name}" at ${fmtMoney(topOpp.amount)} (${topOpp.probability}% close probability, ${topOpp.stage})` : ''}.`
  : `This is a strategic account worth visiting.`}

Their focus on ${interest} is a strong fit for ${pitch}.${topContact ? `\n\nI see ${topContact.first_name} ${topContact.last_name} (${topContact.title}) is a key contact — would be great to get in front of them.` : ''}

Would you be able to set up a meeting while I am in town? Even 30 minutes to walk them through what we are doing in cloud-native could move things forward significantly.

Happy to prepare materials or a demo if it helps.

Thanks,
Bruce Jacobs
K8s Platform Specialist`

  const slackMessage = `Hey ${repFirst}! Heads up — ${contextLine.toLowerCase()}. ${account.name} is on my radar: ${pipeline} pipeline${topOpp ? `, "${topOpp.name}" at ${topOpp.probability}% close probability` : ''}. Their ${interest} interest is a great fit for what we are doing. Any chance you could set up a quick customer meeting while I am in town? Happy to bring a demo. Let me know!`

  const activeText = tab === 'email' ? emailBody : slackMessage

  const copy = () => {
    navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openEmail = () => {
    const mailto = `mailto:${rep.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailto, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Contact Account Rep</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Re: {account.name} &middot; {city}, {state}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Rep info */}
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-blue-400 text-xs uppercase tracking-wide">Account Rep</span>
            <div className="font-semibold text-blue-900">{rep.name}</div>
            <div className="text-blue-700 text-xs">{rep.title}</div>
          </div>
          <div>
            <span className="text-blue-400 text-xs uppercase tracking-wide">Email</span>
            <div className="text-blue-800 font-mono text-xs">{rep.email}</div>
          </div>
          {rep.slack_handle && (
            <div>
              <span className="text-blue-400 text-xs uppercase tracking-wide">Slack</span>
              <div className="text-blue-800 font-mono text-xs">@{rep.slack_handle}</div>
            </div>
          )}
          <div>
            <span className="text-blue-400 text-xs uppercase tracking-wide">Specialty</span>
            <div className="text-blue-700 text-xs">{rep.specialty}</div>
          </div>
        </div>

        {/* Opportunity brief */}
        {topOpp && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-sm">
            <span className="text-amber-600 text-xs font-semibold uppercase tracking-wide">Top Opportunity Brief</span>
            <div className="mt-1 text-amber-900">
              <span className="font-medium">{topOpp.name}</span>
              <span className="text-amber-700 ml-2">
                {fmtMoney(topOpp.amount)} &middot; {topOpp.probability}% &middot; {topOpp.stage}
                {topOpp.close_date && ` &middot; Close ${fmtDate(topOpp.close_date)}`}
              </span>
            </div>
            {account.opportunities?.length > 1 && (
              <div className="text-amber-600 text-xs mt-0.5">
                +{account.opportunities.length - 1} more {account.opportunities.length - 1 === 1 ? 'opportunity' : 'opportunities'} &middot; {pipeline} total pipeline
              </div>
            )}
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex border-b border-gray-100 px-5 pt-3">
          {[
            { id: 'email', label: 'Email Draft', icon: Mail },
            { id: 'slack', label: 'Slack Message', icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Message body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'email' && (
            <div className="mb-2 text-xs text-gray-500">
              <span className="font-medium">To:</span> {rep.email} &nbsp;
              <span className="font-medium">Subject:</span> {emailSubject}
            </div>
          )}
          {tab === 'slack' && rep.slack_handle && (
            <div className="mb-2 text-xs text-gray-500">
              <span className="font-medium">To:</span> @{rep.slack_handle} via Slack DM
            </div>
          )}
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
            {activeText}
          </pre>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              copied
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {tab === 'email' && (
            <button
              onClick={openEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Mail size={14} />
              Open in Email Client
            </button>
          )}
          {tab === 'slack' && rep.slack_handle && (
            <button
              onClick={copy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <MessageSquare size={14} />
              Copy for Slack
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
