import { getQuestion } from '@/lib/csv'
import { getEntry, saveEntry } from '@/lib/progress'
import { generateImprovedAnswer } from '@/lib/claude'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const question = getQuestion(id)

  if (!question) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await generateImprovedAnswer(
      question.question,
      question.marks,
      question.subject,
      question.paper,
      question.year,
      question.v1Answer
    )

    const existing = getEntry(id)
    saveEntry(id, {
      ...existing,
      status: 'generated',
      demand_brief: result.demand_brief,
      qc_report: result.qc_report,
      v2_answer: result.v2_answer,
      v2_qc_report: result.v2_qc_report,
      generated_at: new Date().toISOString(),
    })

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
