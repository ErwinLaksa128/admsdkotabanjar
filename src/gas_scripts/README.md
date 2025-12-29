# Google Apps Script Setup untuk Administrasi Guru

File `Code.gs` berisi kode backend untuk memproses generate dokumen dari template Google Drive.

## Langkah-langkah Setup:

1.  Buka [Google Apps Script](https://script.google.com/).
2.  Buat **New Project**.
3.  Salin isi file `Code.gs` di folder ini dan paste ke dalam editor `Code.gs` di browser.
4.  Simpan project (Ctrl+S).
5.  Klik tombol **Deploy** (kanan atas) > **New Deployment**.
6.  Pilih tipe **Web App**.
7.  Isi konfigurasi:
    *   **Description**: API Administrasi Guru
    *   **Execute as**: `Me` (email kamu)
    *   **Who has access**: `Anyone` (PENTING: pilih Anyone agar aplikasi React bisa mengakses tanpa login Google user di awal).
8.  Klik **Deploy**.
9.  Copy **Web App URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`).
10. Buka file `src/services/api.ts` di VS Code.
11. Paste URL tersebut ke variabel `GAS_API_URL` (baris 19).

## Cara Kerja:
*   Aplikasi akan mengirim nama dokumen (misal "Program Tahunan") dan data guru ke GAS.
*   GAS akan mencari file dengan nama yang mengandung "Program Tahunan" di Folder Template PJOK (`1yTMpaiS7KZBHc8WBGC4OEanMwJWqUR_z`).
*   GAS akan menduplikasi template tersebut, mengganti placeholder (jika ada), dan mengembalikan link download.
