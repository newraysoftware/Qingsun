import { Router } from 'express';
import { getUserById, db } from '../db.js';
import { updateProfileSchema } from '../schemas/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { mapUser } from '../utils/userMapper.js';
export const usersRouter = Router();
usersRouter.patch('/me', requireAuth, (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' });
        return;
    }
    const data = parsed.data;
    const fields = [];
    const values = [];
    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }
    if (data.stageId !== undefined) {
        fields.push('stage_id = ?');
        values.push(data.stageId);
    }
    if (data.yearsOfPractice !== undefined) {
        fields.push('years_of_practice = ?');
        values.push(data.yearsOfPractice);
    }
    if (data.planProgress !== undefined) {
        fields.push('plan_progress = ?');
        values.push(data.planProgress);
    }
    if (data.contentMastery !== undefined) {
        fields.push('content_mastery = ?');
        values.push(data.contentMastery);
    }
    if (data.points !== undefined) {
        fields.push('points = ?');
        values.push(data.points);
    }
    if (data.streak !== undefined) {
        fields.push('streak = ?');
        values.push(data.streak);
    }
    if (data.weakAreas !== undefined) {
        fields.push('weak_areas = ?');
        values.push(JSON.stringify(data.weakAreas));
    }
    if (data.assessmentDone !== undefined) {
        fields.push('assessment_done = ?');
        values.push(data.assessmentDone ? 1 : 0);
    }
    if (fields.length === 0) {
        res.status(400).json({ error: '没有可更新的字段' });
        return;
    }
    const userId = req.userId;
    fields.push("updated_at = datetime('now')");
    values.push(userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const row = getUserById(userId);
    if (!row) {
        res.status(404).json({ error: '用户不存在' });
        return;
    }
    res.json({ user: mapUser(row) });
});
