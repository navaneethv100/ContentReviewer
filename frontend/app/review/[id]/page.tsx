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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function DemandCard({ brief }: { brief: DemandBrief }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Demand Brief</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
            {brief.directive}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            ~{brief.word_limit}w
          </span>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Topic */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Topic</p>
            <p className="text-sm text-gray-800 leading-snug">{brief.topic}</p>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Directive</p>
              <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                {brief.directive}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Angle</p>
              <p className="text-sm text-gray-700">{brief.angle}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Word Limit</p>
              <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg">
                ~{brief.word_limit} words
              </span>
            </div>
          </div>

          {/* Sub-demands */}
          {brief.sub_demands.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Sub-demands ({brief.sub_demands.length})
              </p>
              <ol className="space-y-2">
                {brief.sub_demands.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">{d}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
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
  const [open, setOpen] = useState(true)

  const score = report.score
  const scoreLabel = score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Weak'
  const scoreRing = score >= 7 ? 'text-green-600 bg-green-50 border-green-200'
    : score >= 4 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-center border rounded-lg px-3 py-1 ${scoreRing}`}>
            <span className="text-lg font-bold leading-none">{score}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80 leading-none mt-0.5">{scoreLabel}</span>
          </div>
          <Chevron open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {report.strengths.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Strengths
              </p>
              <ul className="space-y-1.5">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-1 flex-shrink-0 text-[8px]">●</span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.issues.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                Issues
              </p>
              <ul className="space-y-1.5">
                {report.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 mt-1 flex-shrink-0 text-[8px]">●</span>
                    <span className="leading-snug">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.missing_elements.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Missing
              </p>
              <ul className="space-y-1.5">
                {report.missing_elements.map((el, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-400 mt-1 flex-shrink-0 text-[8px]">●</span>
                    <span className="leading-snug">{el}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
