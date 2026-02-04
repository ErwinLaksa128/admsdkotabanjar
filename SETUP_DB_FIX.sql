-- SQL FIX UNTUK PROGRESS BAR & REGISTRASI
-- Salin dan Jalankan script ini di Supabase > SQL Editor

-- 1. Perbaikan Tabel Users (Mengatasi error "isPremium" & "school")
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "school" TEXT,
ADD COLUMN IF NOT EXISTS "subRole" TEXT,
ADD COLUMN IF NOT EXISTS "nip" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekName" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekNip" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasName" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasNip" TEXT;

-- 2. Perbaikan Tabel Generated Docs (Wajib untuk Progress Bar Guru)
ALTER TABLE public.generated_docs 
ADD COLUMN IF NOT EXISTS "teacherNip" TEXT,
ADD COLUMN IF NOT EXISTS "teacherName" TEXT,
ADD COLUMN IF NOT EXISTS "school" TEXT,
ADD COLUMN IF NOT EXISTS "docType" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- 3. Aktifkan Realtime agar Dashboard update otomatis
-- Menambahkan tabel ke publikasi realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'generated_docs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE generated_docs;
  END IF;
END
$$;

-- 4. Set Replica Identity (Penting untuk konsistensi Realtime)
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE generated_docs REPLICA IDENTITY FULL;
