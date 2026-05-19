import 'dotenv/config';
export const config = {
    port: Number(process.env.PORT) || 3001,
    jwtSecret: process.env.JWT_SECRET || 'dev-only-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
