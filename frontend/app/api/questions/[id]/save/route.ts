import { getEntry, saveEntry } from '@/lib/progress'
import { ReviewStatus, QCReport } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json() as {
    v2_answer?: string
    v2_qc_report?: QCReport
    reviewer_notes?: string
    status?: ReviewStatus
    accepted_v1?: boolean
  }

  const existing = getEntry(id)
  saveEntry(id, {
    ...existing,
    ...(body.v2_answer !== undefined && { v2_answer: body.v2_answer }),
    ...(body.v2_qc_report !== undefined && { v2_qc_report: body.v2_qc_report }),
    ...(body.reviewer_notes !== undefined && { reviewer_notes: body.reviewer_notes }),
    ...(body.accepted_v1 !== undefined && { accepted_v1: body.accepted_v1 }),
    status: body.status ?? 'confirmed',
    confirmed_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
