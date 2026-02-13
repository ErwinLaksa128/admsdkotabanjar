import { useState, useEffect } from 'react';
import { Cloud, Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { googleDriveService } from '../services/googleDrive';
import { User } from '../services/storage';

interface GoogleSyncWidgetProps {
  user?: User | null;
}

const GoogleSyncWidget = ({ user }: GoogleSyncWidgetProps) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const getBackupFilename = () => {
    if (!user) return 'guru_admin_backup.json'; // Fallback
    // Format: trae_backup_{role}_{nip}.json
    const id = user.nip || 'unknown';
    return `trae_backup_${user.role}_${id}.json`;
  };

  const checkBackupStatus = async () => {
    if (!isSignedIn) return;
    
    const filename = getBackupFilename();
    try {
      const file = await googleDriveService.findBackupFile(filename);
      if (file) {
        setStatus('Backup ditemukan di Google Drive');
      } else {
        // If logged in but no backup exists, and we have local data, maybe auto-backup?
        // But let's stick to the "Action" plan: Auto-upload if new.
      }
    } catch (err) {
      console.error('Check backup failed', err);
    }
  };

  const isProduction = import.meta.env.PROD;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const missingKeys = !import.meta.env.VITE_GOOGLE_CLIENT_ID || !import.meta.env.VITE_GOOGLE_API_KEY;

  useEffect(() => {
    // In Production, if keys are missing, we don't enable "Configured" state to force the alert.
    // In Dev, we allow it for Mock Mode.
    if (missingKeys && isProduction) {
        setIsConfigured(false);
        return;
    }

    // We allow initialization even without keys now (Mock Mode) - but only in DEV or if keys exist
    setIsConfigured(true);
      
    // Set a timeout to detect if Google scripts fail to load
    const timeoutId = setTimeout(() => {
        if (!isSignedIn && status === '' && !googleDriveService.isMock) {
             // Only show error if we haven't successfully signed in or updated status yet
             // Check if window.gapi is actually missing
             if (!window.gapi || !window.google) {
                 setStatus('Offline / Google API tidak dapat dimuat');
             }
        }
    }, 5000); // 5 seconds timeout

    try {
    googleDriveService.init((signedIn) => {
        // Init callback
        if (signedIn) {
            setIsSignedIn(true);
            if (googleDriveService.isMock) {
                setStatus('Terhubung (Mode Simulasi)');
            } else {
                setStatus('Terhubung ke Google Drive');
            }
            // Check backup status after a short delay to ensure client is ready
            setTimeout(() => {
                checkBackupStatus();
            }, 1000);
        } else if (googleDriveService.isMock) {
             // Mock mode but not signed in yet
             setStatus('Siap (Mode Simulasi)');
        }
        clearTimeout(timeoutId); // Clear timeout on success
    });
    } catch (err) {
        console.error('Google Drive init error:', err);
        setStatus('Gagal memuat Google Drive Service');
        clearTimeout(timeoutId);
    }
    
    return () => clearTimeout(timeoutId);

  }, []);

  // Re-check when user changes (though usually component remounts)
  useEffect(() => {
    if (isSignedIn && user) {
        checkBackupStatus();
    }
  }, [user, isSignedIn]);

  const handleSignIn = async () => {
    setIsLoading(true);
    
    try {
      await googleDriveService.signIn();
      setIsSignedIn(true);

      if (user?.role === 'admin') {
        setStatus('Terhubung (Admin Mode)');
        return;
      }

      setStatus('Terhubung. Memeriksa backup...');

      // Auto-Sync Logic
      const filename = getBackupFilename();
      const existingFile = await googleDriveService.findBackupFile(filename);
      
      if (existingFile) {
        setStatus('Backup ditemukan. Silakan pulihkan jika perlu.');
        if (confirm('Backup data ditemukan di Google Drive. Apakah Anda ingin memulihkan data tersebut sekarang? (Data lokal akan ditimpa)')) {
             await handleRestore(filename);
        }
      } else {
        // No backup exists -> Auto Backup (Upload)
        setStatus('Backup otomatis...');
        await handleBackup(filename);
      }

    } catch (err: any) {
      console.error(err);
      setStatus('Gagal terhubung');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async (filenameOverride?: string) => {
    if (user?.role === 'admin') {
        // Admin might not want auto-backup or different logic, but prompt said "kecuali admin"
        // If user is admin, maybe we shouldn't have auto-triggered?
        // But manual backup is fine.
    }

    setIsLoading(true);
    setStatus('Sedang mengunggah...');
    const filename = filenameOverride || getBackupFilename();
    
    try {
      const data = googleDriveService.getLocalData();
      await googleDriveService.uploadBackup(data, filename);
      setStatus('Backup berhasil disimpan ke Drive!');
    } catch (err) {
      console.error(err);
      setStatus('Gagal menyimpan backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (filenameOverride?: string) => {
    if (!filenameOverride && !confirm('Peringatan: Data lokal saat ini akan ditimpa dengan data dari Google Drive. Lanjutkan?')) {
      return;
    }
    
    setIsLoading(true);
    setStatus('Sedang mengunduh...');
    const filename = filenameOverride || getBackupFilename();

    try {
      const data = await googleDriveService.downloadBackup(filename);
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
          {isProduction 
            ? "Fitur ini memerlukan konfigurasi Google Client ID dan API Key pada environment variables (Netlify)."
            : "Untuk mengaktifkan sinkronisasi, tambahkan VITE_GOOGLE_CLIENT_ID dan VITE_GOOGLE_API_KEY pada file .env"
          }
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
      
      {isSignedIn && user && (
        <div className="mb-3 text-xs text-gray-500 text-center">
            Backup File: <span className="font-mono">{getBackupFilename()}</span>
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-2 text-[10px] text-gray-400 text-center">
        ID: {clientId.slice(0,4)}...{clientId.slice(-4)}
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


        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBackup()}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-700 hover:bg-blue-100 transition"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-xs font-medium">Simpan ke Drive</span>
          </button>
          
          <button
            onClick={() => handleRestore()}
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
