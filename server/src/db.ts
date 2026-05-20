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
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS training_contents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    stage_id TEXT NOT NULL,
    category TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'none',
    duration TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    preview_image TEXT,
    content_file TEXT,
    content_file_name TEXT,
    content_file_size INTEGER,
    vr_format TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_training_contents_stage ON training_contents(stage_id);
  CREATE INDEX IF NOT EXISTS idx_training_contents_category ON training_contents(category);

  CREATE TABLE IF NOT EXISTS content_learning_progress (
    user_id INTEGER NOT NULL,
    content_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    last_position TEXT,
    started_at TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, content_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON content_learning_progress(user_id);
`)

const userColumns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[]
if (!userColumns.some((c) => c.name === 'role')) {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`)
}

export type UserRole = 'admin' | 'user'

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
  role: UserRole
  created_at: string
  updated_at: string
}

export function getUserById(id: number): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined
}

export function getUserByEmail(email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined
}
