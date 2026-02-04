-- Perintah untuk mengaktifkan Realtime pada tabel-tabel penting
-- Jalankan ini di SQL Editor Supabase

-- 1. Mengaktifkan publikasi 'supabase_realtime'
--    Biasanya sudah ada secara default, tapi kita pastikan tabel masuk ke publikasi ini.

-- Tambahkan tabel ke publikasi realtime
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table supervisions;
alter publication supabase_realtime add table school_visits;
alter publication supabase_realtime add table school_stats;
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table generated_docs;

-- 2. Pastikan REPLICA IDENTITY diatur ke FULL (Opsional tapi disarankan untuk update yang akurat)
alter table users replica identity full;
alter table supervisions replica identity full;
alter table school_visits replica identity full;
alter table school_stats replica identity full;
alter table settings replica identity full;
alter table generated_docs replica identity full;
