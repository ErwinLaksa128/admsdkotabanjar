# 🚀 PANDUAN REPLIKASI APLIKASI (WHITE LABELING)

Gunakan panduan ini setiap kali Anda ingin membuat aplikasi baru untuk daerah/sekolah berbeda menggunakan kode ini sebagai basis (template).

## ⚠️ PERINGATAN KRUSIAL
Jangan pernah men-deploy aplikasi hasil copy sebelum menghapus folder `.netlify`, atau Anda akan menimpa website yang lama!

---

## TAHAP 1: DUPLIKASI & PEMBERSIHAN
Lakukan ini di File Explorer (Windows) atau Finder (Mac):

1. [ ] **Copy Folder Project**
   - Copy seluruh folder project ini.
   - Paste di lokasi baru.
   - Rename folder menjadi nama project baru (contoh: `guru-app-jakarta`).

2. [ ] **Hapus Folder `.git`**
   - Masuk ke folder baru.
   - Pastikan "Hidden Items" terlihat di View explorer.
   - Hapus folder bernama `.git`.
   - *Tujuan: Agar history git lama hilang dan tidak terhubung ke repo lama.*

3. [ ] **Hapus Folder `.netlify`** 
   - Cari folder bernama `.netlify`.
   - Hapus folder tersebut.
   - *Tujuan: Agar ID hosting lama hilang. Jika tidak dihapus, Anda akan menimpa website daerah lain!*

4. [ ] **Hapus Folder `dist` (Opsional)**
   - Folder ini adalah hasil build lama, bisa dihapus agar bersih.

---

## TAHAP 2: SETUP PROJECT BARU
Buka folder baru tersebut di Trae / VS Code:

1. [ ] **Inisialisasi Git Baru**
   Buka terminal di dalam Trae, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Start project baru"
   ```

2. [ ] **Update `package.json`**
   - Buka file `package.json`.
   - Ubah bagian `"name"` menjadi nama project baru (misal: `"guru-jakarta"`).

3. [ ] **Install Dependencies**
   - Jalankan perintah: `npm install`

---

## TAHAP 3: KONFIGURASI ULANG (WAJIB)

1. [ ] **Firebase Database (PENTING)**
   - Buat Project baru di [Firebase Console](https://console.firebase.google.com/).
   - Buka file: `src/lib/firebase.ts`.
   - Ganti isi `firebaseConfig` dengan config dari project baru.

2. [ ] **Logo Aplikasi**
   - Siapkan file logo daerah baru (format PNG transparan disarankan).
   - Timpa file lama di: `public/logo.png`.

3. [ ] **Judul & Meta Data**
   - Buka file: `index.html`.
   - Ganti `<title>...</title>` dengan nama aplikasi baru.

4. [ ] **Kop Surat PDF**
   - Buka file: `src/services/templates.ts`.
   - Cari fungsi `addStandardHeader`.
   - Ganti teks "PEMERINTAH KABUPATEN ..." dengan daerah baru.
   - Sesuaikan warna kop surat jika perlu (kode warna RGB).

---

## TAHAP 4: DEPLOYMENT

1. [ ] **Deploy ke Netlify**
   - Jalankan perintah:
     ```bash
     npm run build
     netlify deploy --prod
     ```
   - Pilih **"Create & configure a new site"** (Jangan pilih link to existing site!).
   - Ikuti prosesnya sampai selesai.

---

✅ **Selesai!** Aplikasi baru Anda sudah siap dan terpisah total dari aplikasi lama.
