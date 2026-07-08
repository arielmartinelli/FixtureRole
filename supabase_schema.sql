-- Supabase Schema for Conquer Fixture Roleplay Hub

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Lowercase normalized name ID
    name TEXT NOT NULL,
    email TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) - optional, disabled by default for ease of testing
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create Objections Table
CREATE TABLE IF NOT EXISTS public.objections (
    id TEXT PRIMARY KEY, -- Lowercase normalized label ID
    label TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.objections ENABLE ROW LEVEL SECURITY;

-- 4. Create Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY, -- Custom generated ID
    week_id TEXT NOT NULL,
    user1_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user2_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    objection_id TEXT REFERENCES public.objections(id) ON DELETE SET NULL,
    date_time TEXT NOT NULL,
    status TEXT DEFAULT 'Pendiente'::text NOT NULL CHECK (status IN ('Pendiente', 'Realizado', 'No Realizado')),
    fail_reason TEXT,
    updated_by TEXT,
    reviews JSONB DEFAULT '{}'::jsonb NOT NULL, -- Reviews map keyed by reviewer user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 5. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    read_by TEXT[] DEFAULT '{}'::text[] NOT NULL, -- Array of user IDs who read this message
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Insert Default Users
INSERT INTO public.users (id, name, active, is_admin)
VALUES 
    ('admin', 'Administrador', true, true),
    ('jazmin_merlo', 'Jazmin Merlo', true, false),
    ('jazmin_mercado', 'Jazmin Mercado', true, false),
    ('fabrizio', 'Fabrizio', true, false),
    ('ariel', 'Ariel', true, false),
    ('cande', 'Cande', true, false),
    ('ariana', 'Ariana', true, false),
    ('manuel', 'Manuel', true, false),
    ('julieta', 'Julieta', true, false),
    ('lucas', 'Lucas', true, false),
    ('tomas', 'Tomas', true, false),
    ('cristian', 'Cristian', true, false),
    ('agostina', 'Agostina', true, false)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, is_admin = EXCLUDED.is_admin;

-- 7. Insert Default Objections
INSERT INTO public.objections (id, label)
VALUES 
    ('dinero', 'Dinero'),
    ('pareja', 'Pareja'),
    ('pensarlo', 'Pensarlo'),
    ('otras_opciones', 'Otras Opciones'),
    ('otro', 'Otro')
ON CONFLICT (id) DO UPDATE 
SET label = EXCLUDED.label;

-- 8. Setup basic permissive public policies for testing (Supabase RLS Bypass Policies)
CREATE POLICY "Permitir todo a usuarios anonimos en users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios anonimos en objections" ON public.objections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios anonimos en matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios anonimos en messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
