import type { Express } from 'express'

/**
 * Multer 将 multipart 文件名按 latin1 解析，中文常会乱码。
 * 将字节按 UTF-8 还原；若客户端额外传 originalFilename 则优先使用。
 */
export function decodeUploadFilename(name: string): string {
  if (!name) return name
  if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(name)) return name
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8')
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(decoded)) return decoded
    if (decoded && !/[\uFFFD]/.test(decoded) && decoded !== name) return decoded
  } catch {
    /* ignore */
  }
  return name
}

export function resolveUploadFilename(
  file: Express.Multer.File,
  body?: Record<string, unknown>,
): string {
  const fromClient = body?.originalFilename
  if (typeof fromClient === 'string' && fromClient.trim()) {
    return fromClient.trim().slice(0, 255)
  }
  return decodeUploadFilename(file.originalname)
}
