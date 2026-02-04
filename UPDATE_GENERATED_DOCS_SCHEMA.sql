-- Perintah untuk memperbaiki tabel generated_docs agar sesuai dengan aplikasi
-- Jalankan ini di SQL Editor Supabase

-- 1. Tambahkan kolom teacherNip dan teacherName
ALTER TABLE public.generated_docs 
ADD COLUMN IF NOT EXISTS "teacherNip" TEXT,
ADD COLUMN IF NOT EXISTS "teacherName" TEXT;

-- 2. Pastikan kolom fileUrl ada (jika sebelumnya pakai fileName)
ALTER TABLE public.generated_docs 
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- 3. Tambahkan ke publikasi realtime (jika belum)
alter publication supabase_realtime add table generated_docs;

-- 4. Set replica identity agar update terdeteksi
alter table generated_docs replica identity full;
