import { getQuestion } from '@/lib/csv'
import { getEntry } from '@/lib/progress'
import { diffWords } from 'diff'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const question = getQuestion(id)

  if (!question) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const entry = getEntry(id)
  const v2 = entry.v2_answer ?? ''

  const parts = diffWords(question.v1Answer, v2)
  return Response.json({ parts })
}
