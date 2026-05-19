import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserById, db } from '../db.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';
import { signToken } from '../utils/jwt.js';
import { mapUser } from '../utils/userMapper.js';
import { requireAuth } from '../middleware/auth.js';
export const authRouter = Router();
function inferStage(years) {
    if (years >= 7)
        return 'mastery';
    if (years >= 6)
        return 'authorization';
    if (years >= 3)
        return 'advanced';
    return 'foundation';
}
authRouter.post('/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' });
        return;
    }
    const { email, password, name, yearsOfPractice } = parsed.data;
    if (getUserByEmail(email)) {
        res.status(409).json({ error: '该邮箱已注册' });
        return;
    }
    const passwordHash = bcrypt.hashSync(password, 12);
    const stageId = inferStage(yearsOfPractice);
    const result = db
        .prepare(`INSERT INTO users (email, password_hash, name, stage_id, years_of_practice)
       VALUES (?, ?, ?, ?, ?)`)
        .run(email, passwordHash, name, stageId, yearsOfPractice);
    const row = getUserById(Number(result.lastInsertRowid));
    if (!row) {
        res.status(500).json({ error: '注册失败' });
        return;
    }
    const user = mapUser(row);
    const token = signToken(user.id);
    res.status(201).json({ token, user });
});
authRouter.post('/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' });
        return;
    }
    const { email, password } = parsed.data;
    const row = getUserByEmail(email);
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        res.status(401).json({ error: '邮箱或密码错误' });
        return;
    }
    const user = mapUser(row);
    const token = signToken(user.id);
    res.json({ token, user });
});
authRouter.get('/me', requireAuth, (req, res) => {
    const row = getUserById(req.userId);
    if (!row) {
        res.status(404).json({ error: '用户不存在' });
        return;
    }
    res.json({ user: mapUser(row) });
});
