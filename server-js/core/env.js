import dotenv from 'dotenv';

dotenv.config();

function processEnv(variable) {
    if (variable=="true") return true;
    if (variable=="false") return false;
    return variable
}

const env = {
    BACKEND_PORT: processEnv(process.env.BACKEND_PORT) || 3000,
    ADMIN_PASS: processEnv(process.env.ADMIN_PASS) || "admin",
    BYPASS_RATELIMIT: processEnv(process.env.BYPASS_RATELIMIT) || false,
    DESTROY_DB_ON_START: processEnv(process.env.DESTROY_DB_ON_START) || false,
    COMFY_API_URL: processEnv(process.env.COMFY_API_URL) || "http://localhost:5000",
    DBFILE: processEnv(process.env.DBFILE) || 'data.db',
    DISABLE_FIREBASE: processEnv(process.env.DISABLE_FIREBASE) || false
}

export { env };