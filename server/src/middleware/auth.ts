import type { Request, Response, NextFunction } from 'express'
import { getUserById } from '../db.js'
import { verifyToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  userId?: number
}

function parseBearerUserId(req: Request): number | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    const payload = verifyToken(header.slice(7))
    return payload.userId
  } catch {
    return null
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = parseBearerUserId(req)
  if (userId == null) {
    res.status(401).json({ error: '未登录或登录已过期' })
    return
  }
  req.userId = userId
  next()
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = parseBearerUserId(req)
  if (userId == null) {
    res.status(401).json({ error: '未登录或登录已过期' })
    return
  }
  const row = getUserById(userId)
  if (!row) {
    res.status(401).json({ error: '用户不存在' })
    return
  }
  if (row.role !== 'admin') {
    res.status(403).json({ error: '需要系统管理员权限' })
    return
  }
  req.userId = userId
  next()
}

/** 当前请求是否为已登录的系统管理员 */
export function requestIsAdmin(req: Request): boolean {
  const userId = parseBearerUserId(req)
  if (userId == null) return false
  const row = getUserById(userId)
  return row?.role === 'admin'
}
