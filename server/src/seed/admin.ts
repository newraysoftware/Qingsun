import bcrypt from 'bcryptjs'
import { db, getUserByEmail, getUserById } from '../db.js'

export const ADMIN_EMAIL = 'admin@qingsun.com'
export const ADMIN_DEFAULT_PASSWORD = 'admin123'
const ADMIN_NAME = '系统管理员'

/** 确保存在系统管理员账号（仅首次创建时写入初始密码） */
export function seedAdminUser() {
  const existing = getUserByEmail(ADMIN_EMAIL)
  const passwordHash = bcrypt.hashSync(ADMIN_DEFAULT_PASSWORD, 12)

  if (!existing) {
    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, stage_id, years_of_practice, role)
         VALUES (?, ?, ?, 'mastery', 10, 'admin')`,
      )
      .run(ADMIN_EMAIL, passwordHash, ADMIN_NAME)
    const row = getUserById(Number(result.lastInsertRowid))
    if (row) {
      console.log(`已创建系统管理员: ${ADMIN_EMAIL}`)
    }
    return
  }

  if (existing.role !== 'admin') {
    db.prepare(`UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE id = ?`).run(
      existing.id,
    )
    console.log(`已将 ${ADMIN_EMAIL} 提升为系统管理员`)
  }
}
