import { loadQuestions } from '@/lib/csv'
import { readProgress } from '@/lib/progress'
import { QuestionWithProgress } from '@/lib/types'

export async function GET() {
  const questions = loadQuestions()
  const progress = readProgress()

  const result: QuestionWithProgress[] = questions.map((q) => ({
    ...q,
    progress: progress[q.id] ?? { status: 'pending' },
  }))

  return Response.json(result)
}
