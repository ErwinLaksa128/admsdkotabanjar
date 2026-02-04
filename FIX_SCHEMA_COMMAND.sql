-- Salin dan jalankan perintah ini di SQL Editor Supabase Anda untuk memperbaiki database

-- Menambahkan kolom yang hilang ke tabel users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "subRole" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekName" TEXT,
ADD COLUMN IF NOT EXISTS "kepsekNip" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasName" TEXT,
ADD COLUMN IF NOT EXISTS "pengawasNip" TEXT,
ADD COLUMN IF NOT EXISTS "pangkat" TEXT,
ADD COLUMN IF NOT EXISTS "jabatan" TEXT,
ADD COLUMN IF NOT EXISTS "wilayahBinaan" TEXT;

-- Pastikan tabel lain juga aman (Opsional, tapi bagus untuk dijalankan)
CREATE TABLE IF NOT EXISTS public.school_stats (
  "schoolName" TEXT PRIMARY KEY,
  npsn TEXT,
  address TEXT,
  village TEXT,
  district TEXT,
  status TEXT,
  "guruCount" INTEGER,
  "tasCount" INTEGER,
  "pengawasNip" TEXT,
  "pengawasName" TEXT,
  teachers JSONB,
  "totalDocs" INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
