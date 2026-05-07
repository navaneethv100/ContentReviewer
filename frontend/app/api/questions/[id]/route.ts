import { getQuestion } from '@/lib/csv'
import { getEntry } from '@/lib/progress'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const question = getQuestion(id)

  if (!question) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({
    ...question,
    progress: getEntry(id),
  })
}
