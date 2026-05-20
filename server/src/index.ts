import express from 'express'
import cors from 'cors'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { learningProgressRouter } from './routes/learningProgress.js'
import { trainingContentsRouter } from './routes/trainingContents.js'
import { UPLOAD_ROOT } from './middleware/upload.js'
import './db.js'
import { SEED_CONTENTS } from './seed/contents.js'
import { seedAdminUser } from './seed/admin.js'
import { seedContentsIfEmpty } from './repositories/contentRepository.js'

seedAdminUser()
seedContentsIfEmpty(SEED_CONTENTS)

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: config.maxJsonBody }))
app.use('/uploads', express.static(UPLOAD_ROOT))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'qingsun-api' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/users/me/learning-progress', learningProgressRouter)
app.use('/api/training-contents', trainingContentsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

app.listen(config.port, () => {
  console.log(`青笋 API 运行于 http://localhost:${config.port}`)
})
