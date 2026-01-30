import { useState, useEffect } from 'react';
import { Cloud, Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { googleDriveService, GOOGLE_CONFIG } from '../services/googleDrive';

const GoogleSyncWidget = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    if (GOOGLE_CONFIG.CLIENT_ID && GOOGLE_CONFIG.API_KEY) {
      setIsConfigured(true);
      googleDriveService.init((signedIn) => {
        // Init callback
        if (signedIn) {
            setIsSignedIn(true);
            setStatus('Terhubung ke Google Drive');
        }
      });
    }
    
    // Auto-show help if not on localhost to assist with redirect_uri_mismatch
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
       setShowTroubleshoot(true);
    }
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    // Tampilkan bantuan jika login memakan waktu (indikasi user terjebak di error popup)
    const helpTimer = setTimeout(() => setShowTroubleshoot(true), 2000);
    
    try {
      await googleDriveService.signIn();
      clearTimeout(helpTimer);
      setIsSignedIn(true);
      setStatus('Terhubung ke Google Drive');
      setShowTroubleshoot(false);
    } catch (err: any) {
      clearTimeout(helpTimer);
      console.error(err);
      setStatus('Gagal terhubung');
      setShowTroubleshoot(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    setStatus('Sedang mengunggah...');
    try {
      const data = googleDriveService.getLocalData();
      await googleDriveService.uploadBackup(data);
      setStatus('Backup berhasil disimpan ke Drive!');
    } catch (err) {
      console.error(err);
      setStatus('Gagal menyimpan backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Peringatan: Data lokal saat ini akan ditimpa dengan data dari Google Drive. Lanjutkan?')) {
      return;
    }
    
    setIsLoading(true);
    setStatus('Sedang mengunduh...');
    try {
      const data = await googleDriveService.downloadBackup();
      if (data) {
        googleDriveService.restoreData(data);
        setStatus('Data berhasil dipulihkan!');
      } else {
        setStatus('Tidak ada file backup ditemukan.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Gagal memulihkan data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertCircle size={20} />
          <h3 className="font-semibold">Google Drive Belum Dikonfigurasi</h3>
        </div>
        <p className="mt-2 text-sm text-orange-600">
          Untuk mengaktifkan sinkronisasi, Anda perlu menambahkan <strong>Client ID</strong> dan <strong>API Key</strong> pada file <code>src/services/googleDrive.ts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-800">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Cloud size={20} />
          </div>
          <h3 className="font-semibold">Sinkronisasi Cloud</h3>
        </div>
        {status && (
          <span className={`text-sm ${status.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>
            {status}
          </span>
        )}
      </div>

      {!isSignedIn ? (
        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />}
            Hubungkan Google Drive
          </button>

          {/* Troubleshooting Section */}
          {showTroubleshoot && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-100 space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="font-bold text-sm border-b border-red-200 pb-1">Panduan Mengatasi Masalah Login</p>
              
              <div>
                <p className="font-bold text-red-800 mb-1">Masalah Akses dari Device Lain / Network:</p>
                <div className="bg-white p-2 rounded border border-gray-200 mb-2 text-[10px] font-mono">
                   <p><strong>Status:</strong> {window.location.hostname === 'localhost' ? 'Local Development' : 'Production/Network'}</p>
                   <p><strong>Active Client ID:</strong> {GOOGLE_CONFIG.CLIENT_ID.substring(0, 15)}...</p>
                </div>
                <p className="mb-1">
                  Jika Anda melihat error <strong>400: redirect_uri_mismatch</strong> atau <strong>Access blocked</strong>, pastikan URL di bawah ini sudah ditambahkan ke Google Cloud Console.
                </p>
                <p className="mb-2">
                  Google memblokir akses dari alamat IP yang belum didaftarkan demi keamanan.
                </p>
                <p className="font-semibold text-gray-700 mb-1">Solusi:</p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                  <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console (Credentials)</a>.</li>
                  <li>Edit <strong>OAuth 2.0 Client ID</strong> yang Anda gunakan.</li>
                  <li>Pada bagian <strong>Authorized JavaScript origins</strong>, tambahkan URL ini:</li>
                </ol>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border border-red-200 font-mono text-xs select-all">
                    {window.location.origin}
                  </code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(window.location.origin)}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                    title="Salin URL"
                  >
                    Salin
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-gray-500 italic">
                  Catatan: Perubahan di Google Console mungkin butuh waktu beberapa menit untuk aktif.
                </p>
              </div>

              <div className="border-t border-red-200 pt-2 mt-2">
                <p className="font-bold text-red-800 mb-1">Masalah Lain (Access blocked):</p>
                <p className="mb-1">
                  Jika status aplikasi masih <strong>Testing</strong>, pastikan email Anda sudah ditambahkan di menu <em>OAuth consent screen</em> &gt; <em>Test users</em>.
                </p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="text-xs text-blue-600 underline hover:text-blue-800 w-full text-center py-1 font-medium"
          >
            {showTroubleshoot ? 'Sembunyikan Bantuan' : 'Tampilkan Bantuan Koneksi / Error'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBackup}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-700 hover:bg-blue-100 transition"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-xs font-medium">Simpan ke Drive</span>
          </button>
          
          <button
            onClick={handleRestore}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 hover:bg-green-100 transition"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            <span className="text-xs font-medium">Ambil dari Drive</span>
          </button>
        </div>
      )}
      
      {isSignedIn && (
        <button 
          onClick={() => {
            googleDriveService.signOut();
            setIsSignedIn(false);
            setStatus('');
          }}
          className="mt-3 w-full text-center text-xs text-gray-400 hover:text-red-500"
        >
          Putuskan Koneksi
        </button>
      )}
    </div>
  );
};

export default GoogleSyncWidget;
