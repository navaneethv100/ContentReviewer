import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { Question } from './types'

const CSV_PATH = path.join(process.cwd(), '..', 'Mains Model Answers.csv')

let cached: Question[] | null = null

export function loadQuestions(): Question[] {
  if (cached) return cached

  const raw = fs.readFileSync(CSV_PATH, 'utf-8')
  const { data } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })

  cached = data.map((row) => ({
    id: row['id'].trim(),
    question: row['Question'].trim(),
    marks: parseInt(row['Marks'], 10),
    paper: row['GS - Paper'].trim(),
    subject: row['Subject'].trim(),
    year: row['Year'].trim(),
    v1Answer: row['Model Answer'].trim(),
  }))

  return cached
}

export function getQuestion(id: string): Question | undefined {
  return loadQuestions().find((q) => q.id === id)
}
