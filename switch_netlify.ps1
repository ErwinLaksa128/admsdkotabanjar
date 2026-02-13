Write-Host "=== PANDUAN GANTI AKUN NETLIFY ===" -ForegroundColor Cyan
Write-Host "1. Menghapus konfigurasi lama..."
if (Test-Path .netlify) {
    Remove-Item -Recurse -Force .netlify
    Write-Host "Konfigurasi lama dihapus." -ForegroundColor Green
} else {
    Write-Host "Tidak ada konfigurasi lama ditemukan." -ForegroundColor Yellow
}

Write-Host "`n2. Membuka browser untuk Login ke Akun Baru..."
Write-Host "Silakan login dengan akun Netlify yang baru di browser." -ForegroundColor Yellow
netlify login

Write-Host "`n3. Membuat Site Baru..."
Write-Host "Pilih 'Create & configure a new site' saat diminta." -ForegroundColor Yellow
netlify init

Write-Host "`n=== SIAP DEPLOY ===" -ForegroundColor Cyan
Write-Host "Jalankan perintah ini untuk deploy ke production:"
Write-Host "netlify deploy --prod" -ForegroundColor Green
