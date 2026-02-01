-- Enable Row Level Security (RLS) is recommended for all tables
-- But for initial migration/testing, we might keep it open or use basic authenticated policies

-- 1. USERS Table
-- Mapped from 'users' collection
CREATE TABLE public.users (
    nip TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('guru', 'kepala-sekolah', 'pengawas', 'dinas', 'admin')),
    sub_role TEXT,
    school TEXT,
    active BOOLEAN DEFAULT true,
    photo TEXT, -- Base64 or URL
    
    -- Hierarchy / Relationships
    kepsek_name TEXT,
    kepsek_nip TEXT,
    pengawas_name TEXT,
    pengawas_nip TEXT,
    wilayah_binaan TEXT,
    
    -- Pengawas Specific
    managed_schools TEXT[], -- Array of school names
    
    -- Kepala Sekolah Specific
    pangkat TEXT,
    jabatan TEXT,
    kecamatan TEXT,
    
    -- Performance / Feedback
    workload_evidence_v2 JSONB, -- Record<string, string>
    workload_scores_v2 JSONB,   -- Record<string, number>
    workload_feedback_v2 TEXT,
    workload_feedback_date_v2 TIMESTAMPTZ,
    
    -- System
    last_seen TIMESTAMPTZ,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data (or public profiles if needed)
-- For this app, it seems users need to read other users (e.g. Pengawas reads Guru list)
CREATE POLICY "Allow authenticated read access" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual update" ON public.users FOR UPDATE TO authenticated USING (auth.uid()::text = nip); -- Warning: This assumes auth.uid() matches NIP, which might not be true if using Supabase Auth UUIDs. 
-- BETTER STRATEGY: Link Supabase Auth ID to this table via a separate column or table, OR just rely on app logic for now if not strict.
-- For now, allow full access to authenticated users for migration simplicity (Refine in production)
CREATE POLICY "Allow full access for authenticated" ON public.users FOR ALL TO authenticated USING (true);


-- 2. SETTINGS Table
-- Mapped from 'settings' collection
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY, -- e.g., 'running_text'
    text TEXT,
    value JSONB, -- Flexible column for other settings
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin update" ON public.settings FOR UPDATE TO authenticated USING (true); -- Restrict to admin role in future


-- 3. SUPERVISIONS Table
-- Mapped from 'supervisions_v3' collection
CREATE TABLE public.supervisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Metadata
    supervisor_nip TEXT REFERENCES public.users(nip),
    teacher_nip TEXT REFERENCES public.users(nip),
    school TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    semester TEXT,
    academic_year TEXT,
    
    -- Content (Storing complex nested objects as JSONB for flexibility)
    -- This includes: sections, scores, notes, feedback
    content JSONB NOT NULL,
    
    -- Summary Stats
    total_score NUMERIC,
    grade TEXT,
    
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for stakeholders" ON public.supervisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow create for supervisors" ON public.supervisions FOR INSERT TO authenticated WITH CHECK (true);


-- 4. SCHOOL VISITS Table
-- Mapped from 'school_visits' collection
CREATE TABLE public.school_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_nip TEXT REFERENCES public.users(nip),
    school_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    
    purpose TEXT,
    notes TEXT,
    photo_url TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    location_address TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access visits" ON public.school_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow create visits" ON public.school_visits FOR INSERT TO authenticated WITH CHECK (true);


-- 5. SCHOOL STATS Table
-- Mapped from 'school_stats' collection
CREATE TABLE public.school_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_name TEXT UNIQUE NOT NULL,
    
    guru_count INTEGER DEFAULT 0,
    tas_count INTEGER DEFAULT 0,
    student_count INTEGER DEFAULT 0,
    rombel_count INTEGER DEFAULT 0,
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read stats" ON public.school_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow update stats" ON public.school_stats FOR ALL TO authenticated USING (true);


-- 6. GENERATED DOCS Table
-- Mapped from 'generated_docs' collection
CREATE TABLE public.generated_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    generated_by TEXT REFERENCES public.users(nip),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read docs" ON public.generated_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow create docs" ON public.generated_docs FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_users_school ON public.users(school);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_supervisions_school ON public.supervisions(school);
CREATE INDEX idx_supervisions_teacher ON public.supervisions(teacher_nip);
CREATE INDEX idx_visits_visitor ON public.school_visits(visitor_nip);
