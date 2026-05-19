import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

const dbPath = join(dataDir, 'qingsun.db')
export const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    stage_id TEXT NOT NULL DEFAULT 'foundation',
    years_of_practice INTEGER NOT NULL DEFAULT 0,
    plan_progress INTEGER NOT NULL DEFAULT 0,
    content_mastery INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    weak_areas TEXT NOT NULL DEFAULT '[]',
    assessment_done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`)

export interface DbUser {
  id: number
  email: string
  password_hash: string
  name: string
  stage_id: string
  years_of_practice: number
  plan_progress: number
  content_mastery: number
  points: number
  streak: number
  weak_areas: string
  assessment_done: number
  created_at: string
  updated_at: string
}

export function getUserById(id: number): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined
}

export function getUserByEmail(email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined
}
