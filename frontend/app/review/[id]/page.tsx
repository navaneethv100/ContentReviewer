'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactMarkdown, { Components } from 'react-markdown'
import { QuestionWithProgress, DemandBrief, QCReport, FixResult } from '@/lib/types'

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl">
      <div className="w-8 h-8 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  )
}

function fixInlineNumberedList(text: string): string {
  return text.replace(/([^\n]) (\d{1,2})\. /g, (match, preceding, num) => {
    return parseInt(num) >= 2 ? `${preceding}\n${num}. ` : match
  })
}

const MD: Components = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1.5">{children}</h3>,
  p:  ({ children }) => <p  className="text-sm text-gray-800 leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em:     ({ children }) => <em className="italic text-gray-700">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-gray-800">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-gray-800">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full text-xs border-collapse">{children}</table></div>,
  th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-medium text-gray-700">{children}</th>,
  td: ({ children }) => <td className="border border-gray-200 px-2 py-1 text-gray-800">{children}</td>,
  code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-600 mb-3">{children}</blockquote>,
  img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded my-2" />,
  hr: () => <hr className="border-gray-200 my-3" />,
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="min-w-0">
      <ReactMarkdown components={MD}>{fixInlineNumberedList(content)}</ReactMarkdown>
    </div>
  )
}

function DiffView({ parts }: { parts: DiffPart[] }) {
  const added   = parts.filter(p => p.added).reduce((n, p) => n + p.value.split(/\s+/).filter(Boolean).length, 0)
  const removed = parts.filter(p => p.removed).reduce((n, p) => n + p.value.split(/\s+/).filter(Boolean).length, 0)

  // V1 view: kept text + removed text (highlighted red), skip added
  const v1Parts = parts.filter(p => !p.added)
  // V2 view: kept text + added text (highlighted green), skip removed
  const v2Parts = parts.filter(p => !p.removed)

  function renderPart(part: DiffPart, i: number) {
    if (part.removed) {
      return (
        <mark key={i} className="bg-red-100 text-red-800 line-through decoration-red-400 rounded px-0.5 mx-px">
          {part.value}
        </mark>
      )
    }
    if (part.added) {
      return (
        <mark key={i} className="bg-green-100 text-green-900 rounded px-0.5 mx-px font-medium">
          {part.value}
        </mark>
      )
    }
    return <span key={i}>{part.value}</span>
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full">
          <span className="text-base leading-none">−</span> {removed} words removed
        </span>
        <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full">
          <span className="text-base leading-none">+</span> {added} words added
        </span>
        <span className="text-gray-400">net {added - removed >= 0 ? '+' : ''}{added - removed} words</span>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* V1 — show what was removed */}
        <div className="rounded-xl border border-red-200 bg-red-50/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-red-200 bg-red-50 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">V1 — Original</span>
            <span className="ml-auto text-xs text-red-400">highlighted = removed</span>
          </div>
          <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {v1Parts.map((p, i) => renderPart(p, i))}
          </div>
        </div>

        {/* V2 — show what was added */}
        <div className="rounded-xl border border-green-200 bg-green-50/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-green-200 bg-green-50 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">V2 — Improved</span>
            <span className="ml-auto text-xs text-green-500">highlighted = added</span>
          </div>
          <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {v2Parts.map((p, i) => renderPart(p, i))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DemandCard({ brief }: { brief: DemandBrief }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
      <h3 className="font-semibold text-blue-900 text-xs uppercase tracking-wide">Demand Brief</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-blue-700 font-medium">Directive:</span>{' '}
          <span className="text-blue-900">{brief.directive}</span>
        </div>
        <div>
          <span className="text-blue-700 font-medium">Angle:</span>{' '}
          <span className="text-blue-900">{brief.angle}</span>
        </div>
        <div>
          <span className="text-blue-700 font-medium">Word Limit:</span>{' '}
          <span className="text-blue-900">~{brief.word_limit}</span>
        </div>
      </div>
      <div>
        <span className="text-blue-700 font-medium">Topic:</span>{' '}
        <span className="text-blue-900">{brief.topic}</span>
      </div>
      {brief.sub_demands.length > 0 && (
        <div>
          <span className="text-blue-700 font-medium">Sub-demands:</span>
          <ul className="mt-1 list-disc list-inside text-blue-900 space-y-0.5">
            {brief.sub_demands.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface QCCardProps {
  report: QCReport
  title: string
  subtitle: string
  theme: 'amber' | 'indigo'
}

function QCCard({ report, title, subtitle, theme }: QCCardProps) {
  const scoreColor =
    report.score >= 7 ? 'text-green-700' : report.score >= 4 ? 'text-yellow-700' : 'text-red-700'

  const t = theme === 'amber'
    ? { bg: 'bg-amber-50', border: 'border-amber-200', heading: 'text-amber-900', sub: 'text-amber-600', label: 'text-amber-800', body: 'text-amber-900' }
    : { bg: 'bg-indigo-50', border: 'border-indigo-200', heading: 'text-indigo-900', sub: 'text-indigo-500', label: 'text-indigo-800', body: 'text-indigo-900' }

  return (
    <div className={`${t.bg} ${t.border} border rounded-xl p-4 text-sm space-y-3`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${t.heading} text-xs uppercase tracking-wide`}>{title}</h3>
          <p className={`${t.sub} text-xs mt-0.5`}>{subtitle}</p>
        </div>
        <span className={`text-2xl font-bold ${scoreColor}`}>{report.score}/10</span>
      </div>
      {report.issues.length > 0 && (
        <div>
          <p className={`font-medium ${t.label} mb-1`}>Issues:</p>
          <ul className={`list-disc list-inside ${t.body} space-y-0.5`}>
            {report.issues.map((issue, i) => <li key={i}>{issue}</li>)}
          </ul>
        </div>
      )}
      {report.missing_elements.length > 0 && (
        <div>
          <p className={`font-medium ${t.label} mb-1`}>Missing:</p>
          <ul className={`list-disc list-inside ${t.body} space-y-0.5`}>
            {report.missing_elements.map((el, i) => <li key={i}>{el}</li>)}
          </ul>
        </div>
      )}
      {report.strengths.length > 0 && (
        <div>
          <p className={`font-medium ${t.label} mb-1`}>Strengths:</p>
          <ul className={`list-disc list-inside ${t.body} space-y-0.5`}>
            {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [data, setData] = useState<QuestionWithProgress | null>(null)
  const [diffParts, setDiffParts] = useState<DiffPart[]>([])
  const [v2Edited, setV2Edited] = useState('')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [undoSnapshot, setUndoSnapshot] = useState<{ v2: string; qc: QCReport | undefined } | null>(null)
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'diff'>('side-by-side')
  const [v2Mode, setV2Mode] = useState<'preview' | 'edit'>('preview')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/questions/${id}`)
    const q = await res.json() as QuestionWithProgress
    setData(q)
    setV2Edited(q.progress.v2_answer ?? '')
    setNotes(q.progress.reviewer_notes ?? '')
  }, [id])

  const loadDiff = useCallback(async () => {
    const res = await fetch(`/api/questions/${id}/diff`)
    const { parts } = await res.json() as { parts: DiffPart[] }
    setDiffParts(parts)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (data?.progress.v2_answer) loadDiff()
  }, [data?.progress.v2_answer, loadDiff])

  const handleGenerate = async () => {
    setUndoSnapshot(null)
    setGenerating(true)
    try {
      const res = await fetch(`/api/questions/${id}/generate`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        showToast(`Error: ${err.error}`)
        return
      }
      await loadData()
      await loadDiff()
      setV2Mode('preview')
      showToast('V2 generated successfully')
    } finally {
      setGenerating(false)
    }
  }

  const handleAcceptV1 = async () => {
    setSaving(true)
    try {
      await fetch(`/api/questions/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ v2_answer: data?.v1Answer, accepted_v1: true, status: 'confirmed' }),
      })
      await loadData()
      showToast('V1 accepted as final answer')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (status: 'confirmed' | 'skipped') => {
    setUndoSnapshot(null)
    setSaving(true)
    try {
      await fetch(`/api/questions/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ v2_answer: v2Edited, reviewer_notes: notes, status }),
      })
      await loadData()
      showToast(status === 'confirmed' ? 'Confirmed and saved' : 'Marked as skipped')
    } finally {
      setSaving(false)
    }
  }

  const handleFix = async () => {
    if (!notes.trim()) return
    // Snapshot current V2 before overwriting so undo is possible
    setUndoSnapshot({ v2: v2Edited, qc: data?.progress.v2_qc_report })
    setFixing(true)
    try {
      const res = await fetch(`/api/questions/${id}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_notes: notes }),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        showToast(`Error: ${err.error}`)
        setUndoSnapshot(null)
        return
      }
      const result = await res.json() as FixResult
      setV2Edited(result.v2_answer)
      setV2Mode('preview')
      await loadData()
      await loadDiff()
      showToast('Fix applied — use "Undo Fix" to revert')
    } finally {
      setFixing(false)
    }
  }

  const handleUndo = async () => {
    if (!undoSnapshot) return
    await fetch(`/api/questions/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        v2_answer: undoSnapshot.v2,
        v2_qc_report: undoSnapshot.qc,
        status: 'generated',
      }),
    })
    setV2Edited(undoSnapshot.v2)
    setUndoSnapshot(null)
    setV2Mode('preview')
    await loadData()
    await loadDiff()
    showToast('Reverted to previous V2')
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  const { progress } = data

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Back</Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">
            #{data.id} · {data.paper} · {data.subject} · {data.year} · {data.marks}M
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">{data.question}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating…' : progress.v2_answer ? 'Regenerate' : 'Generate V2'}
          </button>
          {progress.v2_answer && (
            <>
              <button
                onClick={() => handleSave('confirmed')}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Confirm V2
              </button>
              <button
                onClick={handleAcceptV1}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Keep V1
              </button>
              <button
                onClick={() => handleSave('skipped')}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Skip
              </button>
            </>
          )}
        </div>
      </header>

      {/* Analysis cards — Demand Brief + V1 QC */}
      {(progress.demand_brief || progress.qc_report) && (
        <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.demand_brief && <DemandCard brief={progress.demand_brief} />}
          {progress.qc_report && (
            <QCCard
              report={progress.qc_report}
              title="Original Answer Quality"
              subtitle="Score of the existing answer before improvement"
              theme="amber"
            />
          )}
        </div>
      )}

      {/* Tab switcher */}
      {progress.v2_answer && (
        <div className="px-6 pt-4 flex gap-1">
          {(['side-by-side', 'diff'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'side-by-side' ? 'Side by Side' : 'Diff View'}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <main className="flex-1 px-6 py-4">
        {!progress.v2_answer ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">V1 Answer (Original)</p>
            <MarkdownView content={data.v1Answer} />
          </div>
        ) : activeTab === 'side-by-side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* V1 — always rendered */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">V1 (Original)</p>
              <MarkdownView content={data.v1Answer} />
            </div>

            {/* V2 — preview/edit toggle */}
            <div className="relative bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              {(generating || fixing) && (
                <Spinner label={generating ? 'Generating V2…' : 'Applying fix…'} />
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">V2 (Improved)</p>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {(['preview', 'edit'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setV2Mode(m)}
                      className={`px-3 py-1 font-medium transition-colors ${
                        v2Mode === m ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {m === 'preview' ? 'Preview' : 'Edit'}
                    </button>
                  ))}
                </div>
              </div>

              {v2Mode === 'preview' ? (
                <MarkdownView content={v2Edited} />
              ) : (
                <textarea
                  className="flex-1 text-sm text-gray-900 leading-relaxed resize-none outline-none min-h-64 font-mono"
                  value={v2Edited}
                  onChange={(e) => setV2Edited(e.target.value)}
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <DiffView parts={diffParts} />
          </div>
        )}

        {/* Bottom row: Reviewer Feedback (left) + V2 QC (right) */}
        {progress.v2_answer && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* Left — Reviewer Feedback + Apply Fix */}
            <div className="relative bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              {fixing && <Spinner label="Applying fix…" />}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reviewer Feedback</p>
                <p className="text-xs text-gray-400 mt-0.5">Describe what to fix — Gemini will apply it to V2 without a full rewrite</p>
              </div>
              <textarea
                className="w-full text-sm text-gray-900 leading-relaxed resize-none outline-none min-h-24 border border-gray-100 rounded-lg p-3 bg-gray-50 focus:bg-white focus:border-gray-300 transition-colors"
                placeholder="e.g. Add a point about the Supreme Court's 2023 judgment on forest rights. Replace the Polavaram example with the Ken-Betwa river linking project."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFix}
                  disabled={fixing || !notes.trim()}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {fixing ? 'Applying fix…' : 'Apply Fix to V2'}
                </button>
                {undoSnapshot && !fixing && (
                  <button
                    onClick={handleUndo}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ↩ Undo Fix
                  </button>
                )}
              </div>
            </div>

            {/* Right — V2 QC */}
            {progress.v2_qc_report ? (
              <div className="relative">
                {fixing && <Spinner label="Re-evaluating V2…" />}
                <QCCard
                  report={progress.v2_qc_report}
                  title="Improved Answer Quality"
                  subtitle="Self-evaluation of the V2 answer — honest assessment of what's still improvable"
                  theme="indigo"
                />
              </div>
            ) : (
              <div className="relative bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-center min-h-32">
                {(generating || fixing) && <Spinner label="Evaluating V2…" />}
                {!generating && !fixing && (
                  <p className="text-sm text-indigo-300">V2 QC will appear after generation</p>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
