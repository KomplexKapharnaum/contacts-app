import dotenv from 'dotenv';

dotenv.config();

const env = {
    BACKEND_PORT: process.env.BACKEND_PORT || 3000,
    ADMIN_PASS: process.env.ADMIN_PASS || "admin",
    BYPASS_RATELIMIT: process.env.BYPASS_RATELIMIT || false,
    DESTROY_DB_ON_START: process.env.DESTROY_DB_ON_START || false,
    COMFY_API_URL: process.env.COMFY_API_URL || "http://localhost:5000",
}

export { env };
