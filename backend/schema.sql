-- Supabase PostgreSQL Schema for Extraction Tools Hub

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Password Resets Table
CREATE TABLE IF NOT EXISTS public.password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);

-- Initial default administrator (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO public.users (id, email, username, hashed_password, full_name, is_active)
VALUES (
    'usr_admin_001',
    'admin@extractiontools.com',
    'admin',
    '$2b$12$K8yXpvdgO.M7/lH5mX1XteXw0vA6p7VdJzYqL.Xgqf7FhM1e2rK1K',
    'Administrator',
    TRUE
)
ON CONFLICT (id) DO NOTHING;
