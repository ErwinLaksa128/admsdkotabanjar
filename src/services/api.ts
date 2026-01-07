import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Helper: Load binary file from URL
const loadFileAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not find template file at ${url}`);
  }
  return await response.arrayBuffer();
};

export interface GasResponse {
  status: 'success' | 'error';
  message: string;
  folderUrl?: string;
  files?: string[];
  blob?: Blob;
  filename?: string;
}

export interface GenerateDocParams {
  type: string;
  subRole?: string;
  folderId?: string;
  kelas?: string;
  semester?: string;
  [key: string]: any;
}

export const pjokFolders: {[key: string]: string} = {
    'Kalender Pendidikan': '1. Kalender Pendidikan',
    'Alokasi Waktu Efektif Belajar': '2. Alokasi Waktu Efektif Belajar',
    'Program Tahunan': '3. Program Tahunan',
    'Program Semester': '4. Program Semester',
    'SKL': '5. SKL',
    'CP dan ATP': '6. CP dan ATP',
    'RPPM/Modul Ajar PM': '7. RPPM-Modul Ajar PM',
    'KKTP': '8. KKTP',
    'Jadwal Pelajaran': '9. Jadwal Pelajaran',
    'Agenda Harian/Jurnal Mengajar': '10. Agenda Harian-Jurnal Mengajar',
    'Daftar Hadir Siswa': '11. Daftar Hadir Siswa',
    'Daftar Nilai Siswa': '12. Daftar Nilai Siswa',
    'Format Kegiatan Remidial': '13. Format Kegiatan Remidial',
    'Format Kegiatan Pengayaan': '14. Format Kegiatan Pengayaan',
    'Analisis Hasil Ulangan': '15. Analisis Hasil Ulangan',
    'Bank Soal': '16. Bank Soal',
    'Catatan Refleksi Pelaksanaan Pembelajaran': '17. Catatan Refleksi Pelaksanaan Pembelajaran',
    'Buku Inventaris/Pegangan Guru': '18. Buku Inventaris-Pegangan Guru',
    'Catatan Bimbingan Konseling': '19. Catatan Bimbingan Konseling',
    'Rekap Jurnal G7KAIH': '20. Rekap Jurnal G7KAIH',
    'Catatan Notulen Rapat/Briefing': '21. Catatan Notulen Rapat-Briefing',
    'Buku Supervisi/Observasi': '22. Buku Supervisi-Observasi'
};

export const generateDocument = async (
  params: GenerateDocParams
): Promise<GasResponse> => {
  try {
    // 1. Tentukan nama file template dan path terlebih dahulu
    let extension = 'docx'; // Default
    let templateName = '';
    
    // Tentukan folder path berdasarkan role
    let folderPath = '/templates'; // default root
    const roleLower = (params.subRole || '').toLowerCase();

    // Logic penentuan path dan nama file
    if (roleLower.includes('pjok')) {
        folderPath = '/templates/guru_pjok';
        
        // Mapping tipe dokumen ke subfolder PJOK yang spesifik
        const docType = params.type;
        
        if (pjokFolders[docType]) {
            folderPath += `/${pjokFolders[docType]}`;
            
            // Logic Penamaan File PJOK
            const kelas = params.kelas || '1';
            const semester = params.semester || '1';
            
            switch (docType) {
                case 'Kalender Pendidikan':
                    templateName = 'Kalender Pendidikan.xlsx';
                    break;
                case 'Alokasi Waktu Efektif Belajar':
                    templateName = 'Alokasi waktu efektif.docx';
                    break;
                case 'Program Tahunan':
                    templateName = `Prota_Kelas${kelas}.docx`;
                    break;
                case 'Program Semester':
                    templateName = `Promes_Kelas${kelas}.docx`;
                    break;
                case 'SKL':
                    templateName = `SKL_Kelas ${kelas}.docx`;
                    break;
                case 'CP dan ATP':
                    templateName = `CP dan ATP_Kelas${kelas}.docx`;
                    break;
                case 'RPPM/Modul Ajar PM':
                    // Modul Ajar ada di subfolder per kelas
                    folderPath += `/Kelas ${kelas}`;
                    // Nama file diambil dari dropdown (params.materi) atau default
                    templateName = params.materi || `Kelas_${kelas}.1.1_GERAK_DASAR_BERPINDAH_TEMPAT.docx`;
                    break;
                case 'KKTP':
                    templateName = `KKTP_Kelas${kelas}.docx`;
                    break;
                case 'Jadwal Pelajaran':
                    templateName = 'Jadwal Pelajaran.docx';
                    break;
                case 'Agenda Harian/Jurnal Mengajar':
                    templateName = `Jurnal_Kelas${kelas}.${semester}.docx`;
                    break;
                case 'Daftar Hadir Siswa':
                    templateName = `Presensi${kelas}.xlsx`;
                    break;
                case 'Daftar Nilai Siswa':
                    templateName = `Nilai${kelas}.xlsx`;
                    break;
                case 'Format Kegiatan Remidial':
                    templateName = `Remedial_Kelas${kelas}.${semester}.docx`;
                    break;
                case 'Format Kegiatan Pengayaan':
                    templateName = `Pengayaan_Kelas${kelas}.${semester}.docx`;
                    break;
                case 'Analisis Hasil Ulangan':
                    templateName = `Analisis_Kelas${kelas}.xlsx`;
                    break;
                case 'Bank Soal':
                    templateName = `Soal STS Kelas ${kelas} PJOK.docx`;
                    break;
                case 'Catatan Refleksi Pelaksanaan Pembelajaran':
                    templateName = 'Pembelajaran.docx';
                    break;
                case 'Buku Inventaris/Pegangan Guru':
                    templateName = 'Buku_Inventaris.xlsx';
                    break;
                case 'Catatan Bimbingan Konseling':
                    templateName = `Bimbingan_Kelas${kelas}.docx`;
                    break;
                case 'Rekap Jurnal G7KAIH':
                    templateName = 'Jurnal G7KAIH.docx';
                    break;
                case 'Catatan Notulen Rapat/Briefing':
                    templateName = 'Notula.docx';
                    break;
                case 'Buku Supervisi/Observasi':
                    templateName = 'Supervisi.docx';
                    break;
                default:
                    // Fallback
                    break;
            }
        }
        
    } else if (roleLower.includes('paibp') || roleLower.includes('pai')) {
        folderPath = '/templates/guru_paibp';
    } else if (roleLower.includes('kelas')) {
        // extract number if exists (e.g. "guru kelas 1")
        const match = roleLower.match(/kelas\s*(\d+)/);
        if (match) {
            folderPath = `/templates/guru_kelas/kelas_${match[1]}`;
        } else {
             folderPath = '/templates/guru_kelas'; 
        }
    }

    // Jika templateName belum terset (misal bukan PJOK), gunakan logic default lama
    if (!templateName) {
        // Fallback ke logic lama based on type
        const EXCEL_DOC_TYPES = [
          'Daftar Nilai Siswa',
          'Daftar Hadir Siswa',
          'Analisis Hasil Ulangan',
          'Jadwal Pelajaran',
          'Agenda Harian/Jurnal Mengajar',
          'Rekap Jurnal G7KAIH',
          'Buku Inventaris/Pegangan Guru'
        ];
        const isExcelType = EXCEL_DOC_TYPES.includes(params.type);
        extension = isExcelType ? 'xlsx' : 'docx';
        templateName = `template.${extension}`;
        
        const typeLower = params.type.toLowerCase();
        if (typeLower.includes('modul')) templateName = 'modul_ajar.docx';
        else if (typeLower.includes('supervisi')) templateName = 'laporan_supervisi.docx';
    } else {
        // Jika sudah ada templateName (misal dari PJOK logic), extract extension
        const parts = templateName.split('.');
        if (parts.length > 1) {
            extension = parts[parts.length - 1];
        }
    }

    // Final determination of format based on EXTENSION, not Type list
    const isExcel = extension === 'xlsx';

    const templateUrl = `${folderPath}/${templateName}`;

    // 2. Load file template
    const content = await loadFileAsArrayBuffer(templateUrl);
    
    // 3. Siapkan Data
    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const tahunAjaran = new Date().getMonth() > 6 ? `${new Date().getFullYear()}/${new Date().getFullYear()+1}` : `${new Date().getFullYear()-1}/${new Date().getFullYear()}`;
    
    const data: any = {
      ...params,
      // Standard lowercase keys
      tanggal_hari_ini: tanggal,
      nama: params.nama || '',
      nip: params.nip || '',
      sekolah: params.sekolah || '',
      kepsek: params.kepsek || '',
      nipKepsek: params.nipKepsek || '',
      
      // Common Aliases (PascalCase, SnakeCase, UPPERCASE) to match various template formats
      // Sekolah
      Nama_Sekolah: params.sekolah || '',
      NAMA_SEKOLAH: params.sekolah || '',
      Sekolah: params.sekolah || '',
      
      // Guru
      Nama_Guru: params.nama || '',
      NAMA_GURU: params.nama || '',
      Nama: params.nama || '',
      NIP: params.nip || '',
      NIP_Guru: params.nip || '',
      
      // Kepsek
      Nama_Kepsek: params.kepsek || '',
      Kepala_Sekolah: params.kepsek || '',
      NAMA_KEPSEK: params.kepsek || '',
      NIP_Kepsek: params.nipKepsek || '',
      NIP_KEPSEK: params.nipKepsek || '',
      
      // Pengawas
      Nama_Pengawas: params.pengawas || '',
      NIP_Pengawas: params.nipPengawas || '',
      
      // Waktu
      Tanggal: tanggal,
      TANGGAL: tanggal,
      Tahun_Ajaran: tahunAjaran,
      Tahun_Pelajaran: tahunAjaran,
      TAHUN_PELAJARAN: tahunAjaran,
      
      // Akademik
      Kelas: params.kelas || '',
      KELAS: params.kelas || '',
      Semester: params.semester || '',
      SEMESTER: params.semester || '',
    };

    let outputBlob: Blob;

    if (isExcel) {
        // --- EXCEL GENERATION (High Fidelity - XML Replacement) ---
        // Menggunakan PizZip untuk memanipulasi XML langsung agar format/style asli 100% terjaga
        const zip = new PizZip(content);
        
        // Helper untuk escape XML char
        const escapeXml = (unsafe: string | number) => {
            if (unsafe === null || unsafe === undefined) return '';
            return String(unsafe)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        // File XML target yang berisi teks dalam Excel
        // 1. sharedStrings.xml (kebanyakan teks ada di sini)
        // 2. worksheets/sheet*.xml (kadang ada inline string)
        const targetFiles = Object.keys(zip.files).filter(path => 
            path.endsWith('sharedStrings.xml') || path.match(/^xl\/worksheets\/sheet\d+\.xml$/)
        );

        targetFiles.forEach(filePath => {
            let xmlContent = zip.file(filePath)?.asText();
            if (!xmlContent) return;

            let hasChange = false;

            // Lakukan replacement untuk setiap key data
            Object.keys(data).forEach(key => {
                const val = data[key];
                if (val === null || val === undefined) return;

                const escapedVal = escapeXml(val);
                // Regex untuk menangkap {Key} atau {{Key}}
                // Kita ganti global di file XML ini
                const regex = new RegExp(`\\{{1,2}${key}\\}{1,2}`, 'g');
                
                if (regex.test(xmlContent!)) {
                    xmlContent = xmlContent!.replace(regex, escapedVal);
                    hasChange = true;
                }
            });

            if (hasChange) {
                zip.file(filePath, xmlContent);
            }
        });

        outputBlob = zip.generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

    } else {
        // --- WORD GENERATION ---
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: {start: '{{', end: '}}'},
          nullGetter: () => { return ""; }
        });

        doc.render(data);

        outputBlob = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
    }

    // 7. Save File (Trigger Download)
    // Use the exact template name (which is already specific for PJOK) or construct one if needed
    // Logic: If templateName was determined specifically (like PJOK), reuse it.
    // Otherwise fall back to constructed name.
    
    let outputFilename = templateName;
    
    // Safety check: if templateName was generic 'template.docx', rename it to something descriptive
    if (outputFilename === 'template.docx' || outputFilename === 'template.xlsx') {
         outputFilename = `${params.type}_${params.nama || 'Guru'}.${extension}`;
    }

    saveAs(outputBlob, outputFilename);

    // Return success with Blob and Filename for further processing (e.g. upload to Drive)
    return {
      status: 'success',
      message: `Dokumen ${outputFilename} berhasil dibuat! Cek folder Download anda.`,
      blob: outputBlob,
      filename: outputFilename
    };

  } catch (err: any) {
    console.error('Doc Generation Error:', err);
    
    // Handle Docxtemplater specific errors
    if (err.properties && err.properties.errors) {
        const errorMessages = err.properties.errors.map((e: any) => e.message).join('\n');
        console.error('Detailed Docxtemplater Errors:', errorMessages);
        return {
            status: 'error',
            message: `Template Error: ${errorMessages}`
        };
    }

    return {
      status: 'error',
      message: 'Gagal membuat dokumen. Pastikan template tersedia.'
    };
  }
};
