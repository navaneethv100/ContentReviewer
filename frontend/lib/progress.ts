import fs from 'fs'
import path from 'path'
import { ProgressEntry, ProgressStore } from './types'

const PROGRESS_PATH = path.join(process.cwd(), 'data', 'progress.json')

export function readProgress(): ProgressStore {
  try {
    const raw = fs.readFileSync(PROGRESS_PATH, 'utf-8')
    return JSON.parse(raw) as ProgressStore
  } catch {
    return {}
  }
}

export function writeProgress(store: ProgressStore): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

export function getEntry(id: string): ProgressEntry {
  const store = readProgress()
  return store[id] ?? { status: 'pending' }
}

export function saveEntry(id: string, entry: ProgressEntry): void {
  const store = readProgress()
  store[id] = entry
  writeProgress(store)
}
