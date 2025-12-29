export interface GasResponse {
  status: 'success' | 'error';
  message: string;
  folderUrl?: string;
  files?: string[];
}

export interface GenerateDocParams {
  type: string;
  subRole?: string;
  folderId?: string;

  nama?: string;
  nip?: string;
  sekolah?: string;
  kepsek?: string;
  nipKepsek?: string;
  pengawas?: string;
  nipPengawas?: string;
  
  // Additional fields for Modul Ajar
  mapel?: string;
  fase?: string;
  semester?: string;
  materi?: string;
  alokasiWaktu?: string;
}

// Template Folder PJOK
const PJOK_TEMPLATE_FOLDER_ID = '1yTMpaiS7KZBHc8WBGC4OEanMwJWqUR_z';

// URL GAS Web App
const GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbx233kWlbod1uZ7d0axxcYwNCkw5cS2tEMhmKmQketpfP54eEWo-iwZfsZCgnV3cXsl/exec';

export const generateDocument = async (
  params: GenerateDocParams
): Promise<GasResponse> => {
  try {
    let folderId = params.folderId;

    if (!folderId && params.subRole) {
      if (params.subRole.includes('PJOK')) {
        folderId = PJOK_TEMPLATE_FOLDER_ID;
      }
    }

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        ...params,
        folderId
      })
    });

    return await response.json();
  } catch (err) {
    return {
      status: 'error',
      message: 'Gagal menghubungi server'
    };
  }
};
