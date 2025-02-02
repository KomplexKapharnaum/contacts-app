import dotenv from 'dotenv';

dotenv.config();

const env = {
    BACKEND_PORT: process.env.BACKEND_PORT || 3000,
    ADMIN_PASS: process.env.ADMIN_PASS || "admin",
    BYPASS_RATELIMIT: process.env.BYPASS_RATELIMIT || false
}

export { env };
