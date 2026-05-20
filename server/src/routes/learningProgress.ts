import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { upsertLearningProgressSchema } from '../schemas/learningProgress.js'
import {
  deleteLearningProgress,
  getLearningProgress,
  listLearningProgress,
  upsertLearningProgress,
} from '../repositories/learningProgressRepository.js'

export const learningProgressRouter = Router()

function paramContentId(req: { params: { contentId?: string | string[] } }): string {
  const id = req.params.contentId
  return Array.isArray(id) ? id[0] : (id ?? '')
}

learningProgressRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const items = listLearningProgress(req.userId!)
  res.json({ items })
})

learningProgressRouter.get('/:contentId', requireAuth, (req: AuthRequest, res) => {
  const item = getLearningProgress(req.userId!, paramContentId(req))
  if (!item) {
    res.json({
      item: {
        contentId: paramContentId(req),
        status: 'not_started',
        progressPercent: 0,
        lastPosition: null,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date().toISOString(),
      },
    })
    return
  }
  res.json({ item })
})

learningProgressRouter.delete('/:contentId', requireAuth, (req: AuthRequest, res) => {
  deleteLearningProgress(req.userId!, paramContentId(req))
  res.json({ ok: true })
})

learningProgressRouter.put('/:contentId', requireAuth, (req: AuthRequest, res) => {
  const parsed = upsertLearningProgressSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' })
    return
  }
  const item = upsertLearningProgress(req.userId!, paramContentId(req), parsed.data)
  res.json({ item })
})
