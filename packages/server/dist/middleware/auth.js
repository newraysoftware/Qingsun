import { verifyToken } from '../utils/jwt.js';
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: '未登录或登录已过期' });
        return;
    }
    try {
        const token = header.slice(7);
        const payload = verifyToken(token);
        req.userId = payload.userId;
        next();
    }
    catch {
        res.status(401).json({ error: '未登录或登录已过期' });
    }
}
