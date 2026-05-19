import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'qingsun-api' });
});
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use((_req, res) => {
    res.status(404).json({ error: '接口不存在' });
});
app.listen(config.port, () => {
    console.log(`青笋 API 运行于 http://localhost:${config.port}`);
});
