-- Supabase Schema for Conquer Fixture Roleplay Hub

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table (with Password column for Authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Lowercase normalized name ID
    name TEXT NOT NULL,
    email TEXT,
    password TEXT DEFAULT 'conquer123'::text NOT NULL, -- User password (default name123, e.g. ariel123)
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

-- 6. Insert Default Users (with name + "123" default passwords, and admin123 for administrator)
INSERT INTO public.users (id, name, password, active, is_admin)
VALUES 
    ('admin', 'Administrador', 'admin123', true, true),
    ('jazmin_merlo', 'Jazmin Merlo', 'jazmin_merlo123', true, false),
    ('jazmin_mercado', 'Jazmin Mercado', 'jazmin_mercado123', true, false),
    ('fabrizio', 'Fabrizio', 'fabrizio123', true, false),
    ('ariel', 'Ariel', 'ariel123', true, false),
    ('cande', 'Cande', 'cande123', true, false),
    ('ariana', 'Ariana', 'ariana123', true, false),
    ('manuel', 'Manuel', 'manuel123', true, false),
    ('julieta', 'Julieta', 'julieta123', true, false),
    ('lucas', 'Lucas', 'lucas123', true, false),
    ('tomas', 'Tomas', 'tomas123', true, false),
    ('cristian', 'Cristian', 'cristian123', true, false),
    ('agostina', 'Agostina', 'agostina123', true, false)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, password = EXCLUDED.password, is_admin = EXCLUDED.is_admin;

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
