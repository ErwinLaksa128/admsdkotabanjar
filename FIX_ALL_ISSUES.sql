
-- 1. Fix Users Table Schema (Idempotent)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "school" TEXT,
ADD COLUMN IF NOT EXISTS "subRole" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekName" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekNip" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasName" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasNip" TEXT;

-- 2. Fix Generated Docs Schema (Critical for Teacher Progress)
ALTER TABLE public.generated_docs 
ADD COLUMN IF NOT EXISTS "teacherNip" TEXT,
ADD COLUMN IF NOT EXISTS "teacherName" TEXT,
ADD COLUMN IF NOT EXISTS "school" TEXT,
ADD COLUMN IF NOT EXISTS "docType" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- 3. Enable Realtime for Critical Tables
-- Add tables to publication if not already added (Supabase doesn't error if added again usually, but let's be safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'generated_docs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE generated_docs;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'supervisions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE supervisions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'school_visits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE school_visits;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'school_stats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE school_stats;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  END IF;
END
$$;

-- 4. Set Replica Identity to Full (Required for Realtime DELETE/UPDATE payloads)
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE generated_docs REPLICA IDENTITY FULL;
ALTER TABLE supervisions REPLICA IDENTITY FULL;
ALTER TABLE school_visits REPLICA IDENTITY FULL;
ALTER TABLE school_stats REPLICA IDENTITY FULL;
ALTER TABLE settings REPLICA IDENTITY FULL;
