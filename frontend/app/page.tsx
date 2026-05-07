'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QuestionWithProgress, ReviewStatus } from '@/lib/types'

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  generated: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  skipped: 'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending',
  generated: 'Generated',
  confirmed: 'Confirmed',
  skipped: 'Skipped',
}

export default function Dashboard() {
  const [questions, setQuestions] = useState<QuestionWithProgress[]>([])
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/questions')
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? questions : questions.filter((q) => q.progress.status === filter)

  const counts = questions.reduce(
    (acc, q) => {
      acc[q.progress.status] = (acc[q.progress.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading questions…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">UPSC Answer Reviewer</h1>
        <p className="text-sm text-gray-500 mt-0.5">{questions.length} questions · Mains Model Answers</p>
      </header>

      <div className="px-6 py-4 flex gap-3 flex-wrap">
        {(['all', 'pending', 'generated', 'confirmed', 'skipped'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {s === 'all' ? `All (${questions.length})` : `${STATUS_LABELS[s]} (${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      <main className="px-6 pb-10">
        <div className="grid gap-3">
          {filtered.map((q) => (
            <Link
              key={q.id}
              href={`/review/${q.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-400 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">#{q.id}</span>
                    <span className="text-xs text-gray-400">{q.paper}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{q.subject}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{q.year}</span>
                  </div>
                  <p className="text-gray-900 font-medium text-sm leading-snug line-clamp-2">
                    {q.question}
                  </p>
                  {q.progress.qc_report && (
                    <p className="text-xs text-gray-400 mt-1">
                      QC Score: {q.progress.qc_report.score}/10
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[q.progress.status]}`}
                  >
                    {STATUS_LABELS[q.progress.status]}
                  </span>
                  <span className="text-xs text-gray-400">{q.marks}M</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
