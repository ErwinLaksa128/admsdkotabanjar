// KONFIGURASI GOOGLE DRIVE
// ANDA HARUS MENGGANTI INI DENGAN CLIENT ID DAN API KEY ANDA SENDIRI
// DARI GOOGLE CLOUD CONSOLE (https://console.cloud.google.com)
export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Masukkan Client ID Anda di sini
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,   // Masukkan API Key Anda di sini
  // Discovery doc URL for APIs used by the quickstart
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
};

const BACKUP_FILENAME = 'guru_admin_backup.json';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const googleDriveService = {
  tokenClient: null as any,
  gapiInited: false,
  gisInited: false,

  init: async (callback: (isSignedIn: boolean) => void) => {
    if (!GOOGLE_CONFIG.CLIENT_ID || !GOOGLE_CONFIG.API_KEY) {
      console.warn('Google Drive Client ID or API Key is missing');
      return;
    }
    
    // Load GAPI
    if (window.gapi) {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_CONFIG.API_KEY,
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        });
        
        // Restore token if exists
        const savedToken = localStorage.getItem('gdrive_token');
        if (savedToken) {
            try {
                const token = JSON.parse(savedToken);
                window.gapi.client.setToken(token);
            } catch (e) {
                console.error('Invalid saved token', e);
                localStorage.removeItem('gdrive_token');
            }
        }

        googleDriveService.gapiInited = true;
        if (googleDriveService.gisInited) {
             const isSignedIn = !!window.gapi.client.getToken();
             callback(isSignedIn);
        }
      });
    }

    // Load GIS
    if (window.google) {
      googleDriveService.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        scope: GOOGLE_CONFIG.SCOPES,
        callback: '', // defined later
      });
      googleDriveService.gisInited = true;
      if (googleDriveService.gapiInited) {
         const isSignedIn = !!window.gapi.client.getToken();
         callback(isSignedIn);
      }
    }
  },

  signIn: () => {
    return new Promise<void>((resolve, reject) => {
      if (!googleDriveService.tokenClient) {
        reject('Google Drive API not initialized');
        return;
      }

      googleDriveService.tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
          return;
        }
        // Save token to persist session
        localStorage.setItem('gdrive_token', JSON.stringify(resp));
        resolve();
      };

      if (window.gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        googleDriveService.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        googleDriveService.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  signOut: () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      localStorage.removeItem('gdrive_token');
    }
  },

  // Find backup file
  findBackupFile: async () => {
    try {
      // Pastikan client drive sudah terload
      if (!window.gapi.client) {
        console.error('GAPI Client is not initialized');
        return null;
      }
      
      if (!window.gapi.client.drive) {
         // Load drive API
         await new Promise<void>((resolve) => {
           window.gapi.client.load('drive', 'v3', resolve);
         });
      }

      if (!window.gapi.client.drive) {
        console.error('Failed to load Drive API. gapi.client.drive is undefined.');
        return null;
      }

      const response = await window.gapi.client.drive.files.list({
        q: `name = '${BACKUP_FILENAME}' and trashed = false`,
        fields: 'files(id, name)',
      });
      
      // Safe access
      const files = response.result?.files;
      if (files && files.length > 0) {
        return files[0];
      }
      return null;
    } catch (err) {
      console.error('Error finding file', err);
      // Jangan throw error agar flow tidak putus total, return null saja
      return null;
    }
  },

  // Upload data (Create or Update)
  uploadBackup: async (data: any) => {
    const fileContent = JSON.stringify(data);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
    };

    try {
      const existingFile = await googleDriveService.findBackupFile();

      const accessToken = window.gapi.client.getToken().access_token;
      
      if (existingFile) {
        // Update
        const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: BACKUP_FILENAME })], { type: 'application/json' }));
        form.append('file', file);

        await fetch(url, {
          method: 'PATCH',
          headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
          body: form,
        });
      } else {
        // Create
        // Perbaikan: Gunakan multipart request yang benar-benar standar untuk Google Drive API v3
        // Boundary string yang unik
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const contentType = 'application/json';

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            '\r\n' +
            fileContent +
            close_delim;

        const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
        const response = await fetch(url, {
          method: 'POST',
          headers: new Headers({
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary
          }),
          body: multipartRequestBody,
        });

        if (!response.ok) {
           const errorText = await response.text();
           console.error('Upload Failed Response:', response.status, errorText);
           
           if (response.status === 403 && errorText.includes('Google Drive API has not been used')) {
             throw new Error(`Google Drive API belum diaktifkan. Silakan buka console Google Cloud dan aktifkan API Drive.`);
           }

           throw new Error(`Gagal upload (${response.status}): ${errorText || response.statusText}`);
        }
      }
      return true;
    } catch (err) {
      console.error('Upload error details:', err);
      throw err;
    }
  },

  // Download data
  downloadBackup: async () => {
    try {
      const existingFile = await googleDriveService.findBackupFile();
      if (!existingFile) return null;

      const response = await window.gapi.client.drive.files.get({
        fileId: existingFile.id,
        alt: 'media',
      });
      
      return response.result; // This should be the JSON object
    } catch (err) {
      console.error('Download error', err);
      throw err;
    }
  },

  createShortcut: async (name: string, targetId: string, parentId?: string) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not initialized');
    }
    const token = window.gapi.client.getToken();
    if (!token || !token.access_token) {
      throw new Error('Google Drive access token missing');
    }
    const metadata: Record<string, any> = {
      name,
      mimeType: 'application/vnd.google-apps.shortcut',
      shortcutDetails: { targetId }
    };
    if (parentId) metadata.parents = [parentId];
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: new Headers({
        Authorization: 'Bearer ' + token.access_token,
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(metadata)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Failed to create shortcut');
    }
    return await res.json();
  },

  createFolder: async (folderName: string, parentId?: string) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not initialized');
    }
    const accessToken = window.gapi.client.getToken()?.access_token;
    if (!accessToken) throw new Error('Access token missing');

    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) throw new Error('Failed to create folder');
    return await response.json();
  },

  uploadFile: async (fileBlob: Blob, filename: string, mimeType: string, parentId?: string) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not initialized');
    }
    
    const accessToken = window.gapi.client.getToken()?.access_token;
    if (!accessToken) {
      throw new Error('Google Drive access token missing');
    }

    const metadata: any = {
      name: filename,
      mimeType: mimeType,
    };
    
    if (parentId) {
        metadata.parents = [parentId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }
    
    return await response.json();
  },

  // Helper to get all local data
  getLocalData: () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('app_') || key === 'currentUser')) {
        const val = localStorage.getItem(key);
        try {
          data[key] = val ? JSON.parse(val) : null;
        } catch {
          data[key] = val;
        }
      }
    }
    return data;
  },

  // Helper to restore data
  restoreData: (data: Record<string, any>) => {
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (typeof val === 'object') {
        localStorage.setItem(key, JSON.stringify(val));
      } else {
        localStorage.setItem(key, val);
      }
    });
    window.location.reload(); // Reload to apply changes
  }
};
