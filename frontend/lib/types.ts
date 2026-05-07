export interface Question {
  id: string
  question: string
  marks: number
  paper: string
  subject: string
  year: string
  v1Answer: string
}

export interface DemandBrief {
  directive: string
  topic: string
  sub_demands: string[]
  angle: string
  word_limit: number
}

export interface QCReport {
  score: number
  issues: string[]
  missing_elements: string[]
  strengths: string[]
}

export type ReviewStatus = 'pending' | 'generated' | 'confirmed' | 'skipped'

export interface ProgressEntry {
  status: ReviewStatus
  demand_brief?: DemandBrief
  qc_report?: QCReport
  v2_answer?: string
  v2_qc_report?: QCReport
  reviewer_notes?: string
  generated_at?: string
  confirmed_at?: string
}

export type ProgressStore = Record<string, ProgressEntry>

export interface QuestionWithProgress extends Question {
  progress: ProgressEntry
}

export interface GenerateResult {
  demand_brief: DemandBrief
  qc_report: QCReport
  v2_answer: string
  v2_qc_report: QCReport
}

export interface FixResult {
  v2_answer: string
  v2_qc_report: QCReport
}
