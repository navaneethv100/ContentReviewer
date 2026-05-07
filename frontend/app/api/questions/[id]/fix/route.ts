import { getQuestion } from '@/lib/csv'
import { getEntry, saveEntry } from '@/lib/progress'
import { applyFix } from '@/lib/claude'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const question = getQuestion(id)

  if (!question) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const { reviewer_notes } = await request.json() as { reviewer_notes: string }

  if (!reviewer_notes?.trim()) {
    return Response.json({ error: 'Reviewer feedback is required' }, { status: 400 })
  }

  const entry = getEntry(id)
  if (!entry.v2_answer) {
    return Response.json({ error: 'Generate V2 first before applying a fix' }, { status: 400 })
  }

  try {
    const result = await applyFix(
      question.question,
      question.marks,
      entry.v2_answer,
      reviewer_notes
    )

    saveEntry(id, {
      ...entry,
      v2_answer: result.v2_answer,
      v2_qc_report: result.v2_qc_report,
      reviewer_notes,
    })

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
