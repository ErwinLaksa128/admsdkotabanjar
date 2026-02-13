import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, BookOpen, Plus, Edit, Trash, ArrowLeft,
  X, ExternalLink, Download, Loader2, CheckCircle, ClipboardCheck, QrCode, Link as LinkIcon
} from 'lucide-react';
import { storageService, User, SupervisionReport } from '../../services/storage';
import { supabaseService } from '../../services/supabaseService';
import { studentService, Student } from '../../services/studentService';
import { generateDocument, GasResponse, pjokFolders } from '../../services/api';
import { googleDriveService } from '../../services/googleDrive';
import CameraCapture from '../../components/CameraCapture';
import GoogleSyncWidget from '../../components/GoogleSyncWidget';
import { ADMIN_DOCS } from '../../constants/documents';
import { generatePerangkatPembelajaran3HalamanPdf } from '../../services/templates';


// Map of available Modul Ajar files per class
const PJOK_MODULES: Record<string, { label: string; file: string }[]> = {
  '1': [
    { label: '1.1.1 Gerak Dasar Berpindah Tempat', file: 'Kelas_1.1.1_GERAK_DASAR_BERPINDAH_TEMPAT.docx' },
    { label: '1.1.2 Gerak Dasar Ditempat', file: 'Kelas_1.1.2_GERAK_DASAR_DITEMPAT.docx' },
    { label: '1.1.3 Gerak Dasar Menggunakan Alat', file: 'Kelas_1.1.3_GERAK_DASAR_MENGGUNAKAN_ALAT.docx' },
    { label: '1.2 Senam Lantai', file: 'Kelas_1.2_SENAM_LANTAI.docx' },
    { label: '1.3 Gerak Berirama', file: 'Kelas_1.3_GERAK_BERIRAMA.docx' },
    { label: '1.4 Olahraga Air', file: 'Kelas_1.4_OLAHRAGA_AIR.docx' },
    { label: '1.5 Kebugaran Jasmani', file: 'Kelas_1.5_KEBUGARAN_JASMANI.docx' },
    { label: '1.6 Perilaku Hidup Sehat', file: 'Kelas_1.6_PERILAKU_HIDUP_SEHAT.docx' },
  ],
  '2': [
    { label: '2.1 Pola Gerak Dasar Lokomotor', file: 'Kelas_2.1_LOKOMOTOR.docx' },
    { label: '2.2 Pola Gerak Dasar Non-Lokomotor', file: 'Kelas_2.2_NONLOKOMOTOR.docx' },
    { label: '2.3 Pola Gerak Dasar Manipulatif', file: 'Kelas_2.3_MANIPULATIF.docx' },
    { label: '2.4 Senam', file: 'Kelas_2.4_SENAM.docx' },
    { label: '2.5 Gerak Berirama', file: 'Kelas_2.5_GERAK_BERIRAMA.docx' },
    { label: '2.6 Olahraga Air', file: 'Kelas_2.6_OLAHRAGA_AIR.docx' },
    { label: '2.7 Kebugaran Jasmani', file: 'Kelas_2.7_KEBUGARAN_JASMANI.docx' },
    { label: '2.8 Cara Hidup Sehat', file: 'Kelas_2.8_HIDUP_SEHAT.docx' },
  ],
  '3': [
    { label: '3.1 Pola Gerak Dasar Lokomotor', file: 'Kelas_3.1_LOKOMOTOR.docx' },
    { label: '3.2 Pola Gerak Dasar Non-Lokomotor', file: 'Kelas_3.2_NONLOKOMOTOR.docx' },
    { label: '3.3 Pola Gerak Dasar Manipulatif', file: 'Kelas_3.3_MANIPULATIF.docx' },
    { label: '3.4 Senam Lantai', file: 'Kelas_3.4_SENAM_LANTAI.docx' },
    { label: '3.5 Gerak Berirama', file: 'Kelas_3.5_GERAK_BERIRAMA.docx' },
    { label: '3.6 Olahraga Air', file: 'Kelas_3.6_OLAHRAGA_AIR.docx' },
    { label: '3.7 Kebugaran Jasmani', file: 'Kelas_3.7_KEBUGARAN_JASMANI.docx' },
    { label: '3.8 Kesehatan', file: 'Kelas_3.8_KESEHATAN.docx' },
  ],
  '4': [
    { label: '4.1 Permainan Invasi', file: 'Kelas_4.1_INVASI.docx' },
    { label: '4.2 Permainan Net', file: 'Kelas_4.2_NET.docx' },
    { label: '4.3 Permainan Lapangan', file: 'Kelas_4.3_LAPANGAN.docx' },
    { label: '4.4 Beladiri', file: 'Kelas_4.4_BELADIRI.docx' },
    { label: '4.5 Atletik', file: 'Kelas_4.5_ATLETIK.docx' },
    { label: '4.6 Senam Lantai', file: 'Kelas_4.6_SENAM_LANTAI.docx' },
    { label: '4.7 Gerak Berirama', file: 'Kelas_4.7_GERAK_BERIRAMA.docx' },
    { label: '4.8 Olahraga Air', file: 'Kelas_4.8_OLAHRAGA_AIR.docx' },
    { label: '4.9 Kebugaran Jasmani', file: 'Kelas_4.9_KEBUGARAN_JASMANI.docx' },
    { label: '4.10 Kesehatan', file: 'Kelas_4.10_KESEHATAN.docx' },
  ],
  '5': [
    { label: '5.1 Permainan Invasi', file: 'Kelas_5.1_INVASI.docx' },
    { label: '5.2 Permainan Net', file: 'Kelas_5.2_NET.docx' },
    { label: '5.3 Permainan Lapangan', file: 'Kelas_5.3_LAPANGAN.docx' },
    { label: '5.4 Beladiri', file: 'Kelas_5.4_BELADIRI.docx' },
    { label: '5.5 Atletik', file: 'Kelas_5.5_ATLETIK.docx' },
    { label: '5.6 Senam', file: 'Kelas_5.6_SENAM.docx' },
    { label: '5.7 Gerak Berirama', file: 'Kelas_5.7_GERAK_BERIRAMA.docx' },
    { label: '5.8 Olahraga Air', file: 'Kelas_5.8_OLAHRAGA_AIR.docx' },
    { label: '5.9 Kebugaran Jasmani', file: 'Kelas_5.9_KEBUGARAN_JASMANI.docx' },
    { label: '5.10 Kesehatan', file: 'Kelas_5.10_KESEHATAN.docx' },
  ],
  '6': [
    { label: '6.1 Permainan Invasi', file: 'Kelas_6.1_INVASI.docx' },
    { label: '6.2 Permainan Net', file: 'Kelas_6.2_NET.docx' },
    { label: '6.3 Permainan Lapangan', file: 'Kelas_6.3_LAPANGAN.docx' },
    { label: '6.4 Beladiri', file: 'Kelas_6.4_BELADIRI.docx' },
    { label: '6.5 Atletik', file: 'Kelas_6.5_ATLETIK.docx' },
    { label: '6.6 Olahraga Tradisional', file: 'Kelas_6.6_OLTRAD.docx' },
    { label: '6.7 Gerak Berirama', file: 'Kelas_6.7_GERAK_BERIRAMA.docx' },
    { label: '6.8 Senam', file: 'Kelas_6.8_SENAM.docx' },
    { label: '6.9 Kebugaran Jasmani', file: 'Kelas_6.9_KEBUGARAN_JASMANI.docx' },
    { label: '6.10 Olahraga Air', file: 'Kelas_6.10_OLAHRAGA_AIR.docx' },
    { label: '6.11 Kesehatan', file: 'Kelas_6.11_KESEHATAN.docx' },
  ],
};

const GuruHome = () => {

  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  // Data Siswa State
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<Omit<Student, 'id'>>({
    name: '', class: '', nis: '', gender: 'L'
  });

  const [selectedClassForMapel, setSelectedClassForMapel] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);
  
  // Schedule State
  const [schedule, setSchedule] = useState<{day: string, time: string, subject: string}[]>([]);
  const [currentTeaching, setCurrentTeaching] = useState('');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GasResponse | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<{ type: string; url: string; date: string }[]>([]);
  const [adminViewMode, setAdminViewMode] = useState<'menu' | 'generate' | 'manual' | 'results'>('menu');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isExportingQrPdf, setIsExportingQrPdf] = useState(false);

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // PJOK Specific State
  const selectedPjokClass = '1';
  const selectedPjokSemester = '1';
  
  // Modul Ajar Selection State
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [pendingDocType, setPendingDocType] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);
  const [newSchedule, setNewSchedule] = useState({ day: 'Senin', time: '08:00 - 09:30', subject: 'Matematika' });

  // Supervision State
  const [supervisionReports, setSupervisionReports] = useState<SupervisionReport[]>([]);

  // Manual Input State (Free User)
  const [isManualInputModalOpen, setIsManualInputModalOpen] = useState(false);
  const [manualDocType, setManualDocType] = useState('');
  const [manualLink, setManualLink] = useState('');

  const handleOpenManualInput = (docName: string, currentUrl?: string) => {
    setManualDocType(docName);
    setManualLink(currentUrl || '');
    setIsManualInputModalOpen(true);
  };

  const handlePickFromDrive = async () => {
    try {
      // Ensure signed in first
      await googleDriveService.signIn();
      
      const file = await googleDriveService.openPicker();
      if (file) {
        setManualLink(file.url);
      }
    } catch (err: any) {
      console.error('Picker error:', err);
      // alert('Gagal membuka Google Picker: ' + (err.message || err));
    }
  };

  const handleSaveManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.nip && manualDocType) {
        // Validation
        if (!manualLink.startsWith('http://') && !manualLink.startsWith('https://')) {
            alert('Link harus diawali dengan http:// atau https://');
            return;
        }
        
        if (!manualLink.includes('drive.google.com') && !manualLink.includes('docs.google.com')) {
             alert('Link harus berupa link Google Drive atau Google Docs yang valid.');
             return;
        }

        // Save to local storage for display
        storageService.addGeneratedDoc(user.nip, manualDocType, manualLink);
        setGeneratedDocs(storageService.getGeneratedDocs(user.nip));
        
        // Log to Supabase for Principal Dashboard (Progress Tracking)
        if (user.school) {
            try {
                await supabaseService.saveGeneratedDocLog({
                    teacherNip: user.nip,
                    teacherName: user.name,
                    school: user.school,
                    docType: manualDocType,
                    fileName: `Manual Link: ${manualLink}`,
                    fileUrl: manualLink
                });
            } catch (error) {
                console.error('Failed to log manual input', error);
            }
        }

        setIsManualInputModalOpen(false);
        setManualDocType('');
        setManualLink('');
    }
  };

  useEffect(() => {
    if (user?.nip) {
      const unsubscribe = supabaseService.subscribeAllSupervisions((reports) => {
        const myReports = reports.filter(r => r.teacherNip === user.nip);
        setSupervisionReports(myReports);
      });
      return () => unsubscribe();
    }
  }, [user?.nip]);

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      // Handled by parent or redirect
      return;
    }
    setUser(currentUser);
    
    // Load Classes (Merge from storage and existing students)
    const storedClasses = storageService.getClasses();
    const allStudents = studentService.getAllStudents();
    const studentClasses = Array.from(new Set(allStudents.map(s => s.class))).filter(Boolean);
    const allClasses = Array.from(new Set([...storedClasses, ...studentClasses])).sort();
    setClasses(allClasses);

    // Initial update will be triggered by schedule effect
    
    // Load generated docs history
    if (currentUser.nip) {
      setGeneratedDocs(storageService.getGeneratedDocs(currentUser.nip));
      
      // Load Schedule
      const savedSchedule = storageService.getSchedule(currentUser.nip);
      if (savedSchedule.length > 0) {
        setSchedule(savedSchedule);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = () => {
    if (!user?.subRole) return;
    
    let all = studentService.getAllStudents();
    const role = user.subRole;

    if (role.includes('Kelas')) {
      const classNum = role.split('Kelas ')[1]; 
      all = all.filter(s => s.class.startsWith(classNum));
    }
    
    setStudents(all);
  };

  useEffect(() => {
    updateCurrentTeaching();
    // Update status every minute
    const interval = setInterval(updateCurrentTeaching, 60000);
    return () => clearInterval(interval);
  }, [schedule]);

  const updateCurrentTeaching = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute;

    const todaysSchedules = schedule.filter(s => s.day === currentDay);
    
    if (todaysSchedules.length === 0) {
      setCurrentTeaching('Libur / Tidak ada jadwal');
      return;
    }

    // Sort by time to find upcoming/active
    const parsedSchedules = todaysSchedules.map(s => {
      // Parse "07:00 - 08:30" or "07.00 - 08.30"
      const times = s.time.split('-').map(t => t.trim());
      if (times.length !== 2) return { ...s, startVal: 0, endVal: 0 };

      const parseTime = (timeStr: string) => {
        const parts = timeStr.replace('.', ':').split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
      };

      return {
        ...s,
        startVal: parseTime(times[0]),
        endVal: parseTime(times[1])
      };
    }).sort((a, b) => a.startVal - b.startVal);

    // Find active schedule
    const activeSchedule = parsedSchedules.find(s => 
      currentTimeVal >= s.startVal && currentTimeVal < s.endVal
    );

    if (activeSchedule) {
      setCurrentTeaching(activeSchedule.subject); // Display only subject name as requested
    } else {
      // Find next schedule
      const nextSchedule = parsedSchedules.find(s => s.startVal > currentTimeVal);
      if (nextSchedule) {
        setCurrentTeaching(`Selanjutnya: ${nextSchedule.subject} (${nextSchedule.time})`);
      } else {
        setCurrentTeaching('Jadwal Selesai Hari Ini');
      }
    }
  };

  const handleProfileUpdate = (imageData: string) => {
    if (user) {
      const updatedUser = { ...user, photo: imageData };
      setUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      storageService.saveUser(updatedUser);
    }
  };

  // Batch Generation State
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number, status: string} | null>(null);

  // Docs that generate 6 files (Class 1-6)
  const CLASS_BATCH_DOCS = [
    'Program Tahunan',
    'Program Semester',
    'SKL',
    'CP dan ATP',
    'KKTP',
    'Agenda Harian/Jurnal Mengajar',
    'Daftar Hadir Siswa',
    'Daftar Nilai Siswa',
    'Format Kegiatan Remidial',
    'Format Kegiatan Pengayaan',
    'Analisis Hasil Ulangan',
    'Bank Soal',
    'Catatan Bimbingan Konseling'
  ];

  // Docs that generate 1 file
  const SINGLE_DOCS = [
    'Kalender Pendidikan',
    'Alokasi Waktu Efektif Belajar',
    'Jadwal Pelajaran',
    'Catatan Refleksi Pelaksanaan Pembelajaran',
    'Buku Inventaris/Pegangan Guru',
    'Rekap Jurnal G7KAIH',
    'Catatan Notulen Rapat/Briefing',
    'Buku Supervisi/Observasi'
  ];

  const handleBatchGenerate = async (docName: string, overrideClass?: string) => {
    const isClassBatch = CLASS_BATCH_DOCS.includes(docName);
    const isSingleDoc = SINGLE_DOCS.includes(docName);
    // Modul Ajar: Generate all modules for selected class
    const isModuleBatch = docName === 'RPPM/Modul Ajar PM';

    if (!isClassBatch && !isModuleBatch && !isSingleDoc) return false;

    setIsGenerating(true);
    setBatchProgress({ current: 0, total: 0, status: 'Menyiapkan...' });

    try {
      let items: any[] = [];
      
      if (isClassBatch) {
        // Special case for docs that need Semester 1 AND 2 (Total 12 files)
        const DOCS_WITH_SEMESTER = [
            'Agenda Harian/Jurnal Mengajar', 
            'Format Kegiatan Remidial', 
            'Format Kegiatan Pengayaan'
        ];

        if (DOCS_WITH_SEMESTER.includes(docName)) {
             const semester1 = ['1', '2', '3', '4', '5', '6'].map(cls => ({
                kelas: cls,
                semester: '1',
                materi: ''
              }));
             const semester2 = ['1', '2', '3', '4', '5', '6'].map(cls => ({
                kelas: cls,
                semester: '2',
                materi: ''
              }));
              items = [...semester1, ...semester2];
        } else {
            // Default: Generate for all classes 1-6 (using current selected semester if relevant, but mostly general)
            // Note: If other docs also need 12 files, add them here.
            items = ['1', '2', '3', '4', '5', '6'].map(cls => ({
              kelas: cls,
              semester: selectedPjokSemester,
              materi: ''
            }));
        }
      } else if (isModuleBatch) {
        // Generate all modules for the SELECTED class (or override)
        const targetClass = overrideClass || selectedPjokClass;
        const modules = PJOK_MODULES[targetClass] || [];
        items = modules.map(m => ({
          kelas: targetClass,
          semester: selectedPjokSemester,
          materi: m.file
        }));
      } else if (isSingleDoc) {
        // Single item
        items = [{
            kelas: overrideClass || selectedPjokClass, // Support override for single docs too if needed
            semester: selectedPjokSemester,
            materi: ''
        }];
      }

      if (items.length === 0) {
        throw new Error('Tidak ada item untuk digenerate');
      }

      setBatchProgress({ current: 0, total: items.length, status: 'Menghubungkan ke Drive...' });

      // Create Parent Folder
      let parentFolderId = '';
      const token = (window as any).gapi?.client?.getToken?.();
      const isLoggedIn = token && token.access_token;

      if (isLoggedIn) {
        const dateLabel = new Date().toISOString().slice(0, 10);
        // Use the exact folder name from template structure if available
        const templateFolderName = pjokFolders[docName] || docName;
        // Format: "1. Kalender Pendidikan - Guru (2024-01-01)"
        const folderName = `${templateFolderName} - ${user?.name || 'Guru'} (${dateLabel})`;
        
        try {
          const folder = await googleDriveService.createFolder(folderName);
          parentFolderId = folder.id;
        } catch (e) {
          console.error('Failed to create parent folder', e);
        }
      }

      const generatedFiles: any[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setBatchProgress({ 
          current: i + 1, 
          total: items.length, 
          status: `Memproses ${docName} (${i+1}/${items.length})...` 
        });

        // Generate
        const result = await generateDocument({
          type: docName,
          subRole: user?.subRole || 'Guru',
          ...item,
          nama: user?.name,
          nip: user?.nip,
          sekolah: user?.school,
          kepsek: user?.kepsekName || 'Drs. Asep',
          nipKepsek: user?.kepsekNip || '111111',
          pengawas: user?.pengawasName || 'Siti Aminah',
          nipPengawas: user?.pengawasNip || '222222',
        });

        if (result.status === 'success') {
           generatedFiles.push(result);

           // Upload
           if (isLoggedIn && parentFolderId && result.blob && result.filename) {
             try {
               const mimeType = result.filename.endsWith('.xlsx') 
                  ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                  : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
               
               await googleDriveService.uploadFile(result.blob, result.filename, mimeType, parentFolderId);
             } catch (uploadErr) {
               console.error('Upload failed for item ' + i, uploadErr);
             }
           }
        }
      }

      setBatchProgress(null);
      setIsGenerating(false);

      let msg = `Berhasil membuat ${generatedFiles.length} dokumen.`;
      let url = '';

      if (isLoggedIn && parentFolderId) {
        msg += ' Semua file tersimpan dalam folder "' + (pjokFolders[docName] || docName) + '" di Google Drive Anda.';
        url = `https://drive.google.com/drive/folders/${parentFolderId}`;
      } else if (isLoggedIn && !parentFolderId) {
         msg += ' (Gagal membuat folder di Drive, file hanya terdownload)';
      } else {
         msg += ' (Tidak terupload ke Drive karena belum login)';
      }

      setGenerationResult({
        status: 'success',
        message: msg,
        folderUrl: url, // Link to the Drive Folder
        files: generatedFiles.map(f => f.filename || 'File')
      });

      // Update storage
      if (user?.nip && generatedFiles.length > 0) {
        storageService.addGeneratedDoc(user.nip, docName, url);
        setGeneratedDocs(storageService.getGeneratedDocs(user.nip));
      }

      // Log to Supabase
      if (user?.school) {
        supabaseService.saveGeneratedDocLog({
            teacherNip: user.nip || '',
            teacherName: user.name,
            school: user.school,
            docType: docName,
            fileName: `BATCH: ${generatedFiles.length} files`,
            fileUrl: url || 'https://drive.google.com' // Fallback if no URL generated
        });
      }

      return true;

    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      setBatchProgress(null);
      setGenerationResult({
        status: 'error',
        message: 'Gagal melakukan generation: ' + (err.message || 'Unknown error')
      });
      return true;
    }
  };

  const handleGenerateDoc = async (docName: string, overrideClass?: string) => {
    // Try batch first
    const batchHandled = await handleBatchGenerate(docName, overrideClass);
    if (batchHandled) return;

    const role = user?.subRole || 'Guru';
    
    // Set loading state
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const result = await generateDocument({
        type: docName,
        subRole: role,
        // PJOK specific params
        kelas: selectedPjokClass,
        semester: selectedPjokSemester,
        materi: '', // No longer used as batch handles modules
        // Extra fields for GAS
        nama: user?.name,
        nip: user?.nip,
        sekolah: user?.school,
        kepsek: user?.kepsekName || 'Drs. Asep', // Fallback sementara
        nipKepsek: user?.kepsekNip || '111111',
        pengawas: user?.pengawasName || 'Siti Aminah',
        nipPengawas: user?.pengawasNip || '222222',
      });
      
      let finalFolderUrl = '';
      let driveUploadStatus = 'skipped';

      // If success, mark as generated
      if (result.status === 'success' && user?.nip) {
        
        // 1. Cek apakah user login ke Google Drive untuk Upload Otomatis
        const token = (window as any).gapi?.client?.getToken?.();
        
        if (token && token.access_token && result.blob && result.filename) {
             try {
                console.log('DEBUG: Uploading to Drive...', result.filename);
                // 2. Upload Blob ke Google Drive
                const mimeType = result.filename.endsWith('.xlsx') 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                const uploadResult = await googleDriveService.uploadFile(
                    result.blob, 
                    result.filename, 
                    mimeType
                );
                
                // 3. Ambil Link dari hasil upload
                if (uploadResult.webViewLink) {
                    finalFolderUrl = uploadResult.webViewLink;
                    driveUploadStatus = 'success';
                }
             } catch (err) {
                 console.error('Failed to upload to Drive:', err);
                 driveUploadStatus = 'error';
             }
        } else if (!token) {
            driveUploadStatus = 'not_signed_in';
        }

        // 4. Simpan status generate & URL (jika ada) ke LocalStorage
        // URL ini yang akan dibuka tombol "Lihat Hasil"
        storageService.addGeneratedDoc(user.nip, docName, finalFolderUrl);
        setGeneratedDocs(storageService.getGeneratedDocs(user.nip));

        // Log to Firebase for Principal Dashboard
        if (user.school) {
            supabaseService.saveGeneratedDocLog({
                teacherNip: user.nip,
                teacherName: user.name,
                school: user.school,
                docType: docName,
                fileName: result.filename || docName
            });
        }

        // Update result message based on upload status
        let finalMessage = 'Dokumen berhasil di-download!';
        
        if (driveUploadStatus === 'success') {
          finalMessage += ' Salinan juga berhasil disimpan di Google Drive Anda.';
        } else if (driveUploadStatus === 'not_signed_in') {
          finalMessage += ' (Salinan TIDAK tersimpan ke Drive karena Anda belum Login di widget Sinkronisasi).';
        } else if (driveUploadStatus === 'error') {
          finalMessage += ' (Gagal upload ke Drive, cek koneksi).';
        }

        setGenerationResult({
          status: 'success',
          message: finalMessage,
          folderUrl: finalFolderUrl,
          files: result.files
        });
      } else {
          setGenerationResult(result);
      }

    } catch (error) {
      setGenerationResult({
        status: 'error',
        message: 'Terjadi kesalahan tidak terduga saat menghubungi server.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportQrPdf = async () => {
    if (!user?.nip || isExportingQrPdf) return;
    setIsExportingQrPdf(true);
    try {
      await generatePerangkatPembelajaran3HalamanPdf({
        user,
        adminDocs: ADMIN_DOCS,
        generatedDocs
      });
    } finally {
      setIsExportingQrPdf(false);
    }
  };

  const handleAddSchedule = () => {
    setEditingScheduleIndex(null);
    setNewSchedule({ day: 'Senin', time: '08:00 - 09:30', subject: '' });
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (index: number) => {
    setEditingScheduleIndex(index);
    setNewSchedule(schedule[index]);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = (index: number) => {
    if (window.confirm('Hapus jadwal ini?')) {
      const updated = [...schedule];
      updated.splice(index, 1);
      setSchedule(updated);
      if (user?.nip) {
        storageService.saveSchedule(user.nip, updated);
      }
    }
  };

  const confirmSaveSchedule = () => {
    if (newSchedule.day && newSchedule.time && newSchedule.subject) {
      let updated;
      if (editingScheduleIndex !== null) {
        // Edit existing
        updated = [...schedule];
        updated[editingScheduleIndex] = newSchedule;
      } else {
        // Add new
        updated = [...schedule, newSchedule];
      }
      setSchedule(updated);
      if (user?.nip) {
        storageService.saveSchedule(user.nip, updated);
      }
      setIsScheduleModalOpen(false);
      setEditingScheduleIndex(null);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      studentService.updateStudent({ ...studentForm, id: editingStudent.id });
    } else {
      studentService.addStudent(studentForm);
    }
    setShowStudentForm(false);
    setEditingStudent(null);
    setStudentForm({ name: '', class: '', nis: '', gender: 'L' });
    loadStudents();
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({ 
      name: student.name, 
      class: student.class, 
      nis: student.nis, 
      gender: student.gender 
    });
    setShowStudentForm(true);
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Yakin ingin menghapus data siswa ini?')) {
      studentService.deleteStudent(id);
      loadStudents();
    }
  };

  const handleAddClass = () => {
    setNewClassName('');
    setIsClassModalOpen(true);
  };

  const confirmAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName && newClassName.trim()) {
      storageService.addClass(newClassName.trim().toUpperCase());
      setClasses(storageService.getClasses());
      setIsClassModalOpen(false);
    }
  };

  const handleDeleteClass = (cls: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah trigger select class
    if (window.confirm(`Yakin ingin menghapus Kelas ${cls}?`)) {
      storageService.deleteClass(cls);
      setClasses(storageService.getClasses());
    }
  };

  if (!user) return null;

  const isClassTeacher = !!user.subRole?.includes('Kelas');
  const teacherClassToken = isClassTeacher ? (user.subRole?.split('Kelas ')[1] || '') : '';
  const resolveTeacherClass = (token: string) => {
    const cleaned = (token || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return '';
    if (classes.includes(cleaned)) return cleaned;
    const digits = cleaned.replace(/[A-Z]/g, '');
    if (!digits) return '';
    const first = classes.find(c => c.toUpperCase().startsWith(digits));
    return first || `${digits}A`;
  };
  const effectiveTeacherClass = isClassTeacher ? resolveTeacherClass(teacherClassToken) : '';
  const classTeacherSubjects = [
    'Matematika',
    'Bahasa Indonesia',
    'IPA',
    'IPS',
    'PPKn',
    'Seni Budaya',
    'PJOK'
  ];

  return (
    <>
      {/* Modal Selection (Input vs Generate) */}
      {isSelectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-8 flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-bold text-gray-900">Pilih Metode Input</h3>
                  <p className="text-gray-500">Bagaimana Anda ingin melengkapi dokumen administrasi?</p>
               </div>
               <button onClick={() => setIsSelectionModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Option 1: Manual Input */}
              <button
                onClick={() => {
                   setAdminViewMode('manual');
                   setIsSelectionModalOpen(false);
                }}
                className="group relative flex flex-col items-start overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-orange-300 hover:shadow-lg hover:ring-1 hover:ring-orange-200"
              >
                <div className="mb-4 rounded-xl bg-orange-100 p-3 text-orange-600 group-hover:scale-110 transition-transform">
                  <LinkIcon size={32} />
                </div>
                <h4 className="mb-2 text-lg font-bold text-gray-900">Input Manual (Link)</h4>
                <p className="mb-6 text-sm text-gray-500">
                  Masukkan link Google Drive / Docs yang sudah Anda miliki secara manual.
                </p>
                <div className="mt-auto flex items-center text-sm font-semibold text-orange-600">
                  Pilih Manual <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />
                </div>
                {/* Badge Free/Premium */}
                 <span className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                    Semua User
                 </span>
              </button>

              {/* Option 2: Generate AI */}
              <button
                onClick={() => {
                   if (user?.isPremium) {
                      setAdminViewMode('generate');
                      setIsSelectionModalOpen(false);
                   } else {
                      alert('Fitur Generate Otomatis hanya tersedia untuk akun Premium. Silakan hubungi admin sekolah untuk upgrade.');
                   }
                }}
                className={`group relative flex flex-col items-start overflow-hidden rounded-xl border p-6 text-left transition-all ${
                    user?.isPremium 
                    ? 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg hover:ring-1 hover:ring-blue-200' 
                    : 'border-gray-100 bg-gray-50 opacity-80'
                }`}
              >
                <div className={`mb-4 rounded-xl p-3 transition-transform group-hover:scale-110 ${
                    user?.isPremium ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  <FileText size={32} />
                </div>
                <h4 className="mb-2 text-lg font-bold text-gray-900">Generate Otomatis</h4>
                <p className="mb-6 text-sm text-gray-500">
                  Buat dokumen secara instan menggunakan template pintar dan AI.
                </p>
                <div className={`mt-auto flex items-center text-sm font-semibold ${
                    user?.isPremium ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {user?.isPremium ? 'Pilih Generate' : 'Terkunci (Premium)'} 
                  {user?.isPremium && <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />}
                </div>
                 {/* Badge Premium */}
                 <span className={`absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                     user?.isPremium ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                 }`}>
                    Premium
                 </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Result / Loading */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col items-center rounded-lg bg-white p-8 shadow-xl max-w-md text-center w-full">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">
                {batchProgress ? batchProgress.status : 'Sedang membuat dokumen...'}
            </p>
            
            {batchProgress ? (
                <div className="w-full mt-4">
                     <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        ></div>
                     </div>
                     <p className="text-xs text-gray-500">
                        {batchProgress.current} dari {batchProgress.total} file
                     </p>
                </div>
            ) : (
                <p className="text-sm text-gray-500">Mohon tunggu sebentar, proses ini mungkin memakan waktu.</p>
            )}
          </div>
        </div>
      )}

      {generationResult && !isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-lg font-bold ${generationResult.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {generationResult.status === 'success' ? 'Berhasil Generate Dokumen' : 'Gagal'}
              </h3>
              <button onClick={() => setGenerationResult(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="mb-6 text-gray-700">{generationResult.message}</p>

            {generationResult.status === 'success' && (
              <div className="flex flex-col gap-3">
                {generationResult.folderUrl && (
                  <a 
                    href={generationResult.folderUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
                  >
                    <ExternalLink size={20} /> Buka Folder di Google Drive
                  </a>
                )}

                {generationResult.files && generationResult.files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-600">File Tergenerate:</h4>
                    <div className="max-h-60 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2 scrollbar-thin scrollbar-thumb-gray-300">
                      {generationResult.files.map((fileUrl, idx) => (
                        <div key={idx} className="mb-2 flex items-center justify-between rounded bg-white p-3 shadow-sm last:mb-0 hover:bg-gray-50">
                          <span className="mr-2 flex-1 truncate text-xs text-gray-700 font-medium">Dokumen {idx + 1}</span>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-200"
                          >
                            <Download size={14} /> Buka / Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleExportQrPdf}
                  disabled={!user?.nip || isExportingQrPdf}
                  className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                >
                  {isExportingQrPdf ? <Loader2 size={20} className="animate-spin" /> : <ClipboardCheck size={20} />}
                  Download PDF 3 Halaman (Cover + Pengesahan + Indeks QR)
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setGenerationResult(null)}
                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manual Input Link (Free User) */}
      {isManualInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Input Link Dokumen</h3>
            <p className="mb-4 text-sm text-gray-600">
              Masukkan link Google Drive / Docs untuk dokumen <strong>{manualDocType}</strong>.
            </p>

            <div className="mb-4">
              <button
                type="button"
                onClick={handlePickFromDrive}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="h-5 w-5" />
                Pilih dari Google Drive
              </button>
              <div className="relative my-3 text-center text-xs text-gray-400">
                <span className="bg-white px-2">atau paste link manual</span>
                <div className="absolute top-1/2 left-0 -z-10 w-full border-t border-gray-200"></div>
              </div>
            </div>

            <form onSubmit={handleSaveManualLink}>
              <div className="mb-4">
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Link Dokumen</label>
                <input
                  type="text"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-400">Pastikan link dapat diakses (Public / Anyone with the link).</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualInputModalOpen(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!manualLink.trim()}
                  className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-orange-300"
                >
                  Simpan Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Class */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Tambah Kelas Baru</h3>
            <form onSubmit={confirmAddClass}>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Contoh: 1A, 2B"
                className="mb-4 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Selection Modal for Modul Ajar */}
      {showClassSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Pilih Kelas</h3>
            <p className="mb-4 text-sm text-gray-600">Pilih kelas untuk generate {pendingDocType}</p>
            <div className="grid grid-cols-2 gap-3">
              {['1', '2', '3', '4', '5', '6'].map(cls => (
                <button
                  key={cls}
                  onClick={() => {
                    handleGenerateDoc(pendingDocType, cls);
                    setShowClassSelector(false);
                    setPendingDocType('');
                  }}
                  className="rounded-lg bg-blue-50 px-4 py-3 font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  Kelas {cls}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                  setShowClassSelector(false);
                  setPendingDocType('');
              }}
              className="mt-6 w-full rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-600 hover:bg-gray-200"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Schedule */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-6 text-lg font-bold text-gray-800">
              {editingScheduleIndex !== null ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Hari</label>
                <select
                  value={newSchedule.day}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Waktu</label>
                <input
                  type="text"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  placeholder="08:00 - 09:30"
                  className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Mata Pelajaran</label>
                <input
                  type="text"
                  value={newSchedule.subject}
                  onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                  placeholder="Matematika"
                  className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={confirmSaveSchedule}
                  disabled={!newSchedule.subject || !newSchedule.time}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg disabled:bg-blue-300 disabled:shadow-none"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto mt-6 px-4 pb-20">
        {/* Modern Hero Section with Glassmorphism */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-xl text-white">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-8">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white/30 shadow-lg">
                 {user.photo ? (
                    <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/20 text-3xl font-bold text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
              </div>
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-indigo-700 bg-green-400"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Halo, {user.name} 👋</h1>
              <p className="mt-1 text-blue-100 opacity-90">{user.subRole || user.role} • {user.school}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                 <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                   <BookOpen size={14} /> {currentTeaching}
                 </span>
                 <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                   <Users size={14} /> {students.length} Siswa
                 </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <CameraCapture onCapture={handleProfileUpdate} initialImage={user.photo} />
               <GoogleSyncWidget user={user} />
            </div>
          </div>
        </div>

        {/* Dashboard Stats Grid */}
        <div className={`mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 ${isClassTeacher ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {/* Card 1: Progres Administrasi (Moved here for better visibility) */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100">
             <div className="flex items-center justify-between mb-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                 <FileText size={24} />
               </div>
               <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Kelengkapan</span>
             </div>
             <h3 className="text-2xl font-bold text-gray-800 mb-1">
               {Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100)}%
             </h3>
             <p className="text-sm text-gray-500 mb-4">Dokumen Administrasi Selesai</p>
             
             {/* Custom Progress Bar */}
             <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100)}%` }}
                ></div>
             </div>
             <div className="mt-2 text-xs text-gray-400 text-right">
               {generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length} / {ADMIN_DOCS.length} Dokumen
             </div>
          </div>

          {/* Card 2: Jadwal Mengajar */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100">
             <div className="flex items-center justify-between mb-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                 <BookOpen size={24} />
               </div>
               <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Hari Ini</span>
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">{currentTeaching}</h3>
             <a 
               href="#jadwal-section" 
               className="mt-2 inline-flex items-center text-xs font-semibold text-orange-600 hover:text-orange-700"
               onClick={(e) => {
                 e.preventDefault();
                 document.getElementById('jadwal-section')?.scrollIntoView({ behavior: 'smooth' });
               }}
             >
               Lihat Detail <ArrowLeft size={12} className="ml-1 rotate-180" />
             </a>
          </div>

          {/* Card 3: Presensi Siswa */}
          <div 
            onClick={() => navigate('/guru/presensi')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100"
          >
             <div className="flex items-center justify-between mb-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                 <ClipboardCheck size={24} />
               </div>
               <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Harian</span>
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-1">Presensi</h3>
             <p className="text-sm text-gray-500">Catat kehadiran siswa</p>
             <div className="mt-4 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
               Buka Presensi <ArrowLeft size={12} className="rotate-180" />
             </div>
          </div>

          {/* Card 4: Penilaian Cepat (Hanya untuk Guru Mata Pelajaran / Non-Wali Kelas) */}
          {!isClassTeacher && (
            <div 
              onClick={() => {
                navigate('/guru/penilaian');
              }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Edit size={24} />
                </div>
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Aksi Cepat</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Input Nilai</h3>
              <p className="text-sm text-gray-500">Formatif & Sumatif</p>
              <div className="mt-4 text-xs font-semibold text-green-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Buka Halaman Penilaian <ArrowLeft size={12} className="rotate-180" />
              </div>
            </div>
          )}
        </div>

        {isClassTeacher && (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Penilaian per Mata Pelajaran</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classTeacherSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('subject', subj);
                    const cls = effectiveTeacherClass || teacherClassToken;
                    if (cls) params.set('class', cls);
                    navigate(`/guru/penilaian?${params.toString()}`);
                  }}
                  className="group flex items-center justify-between rounded-2xl bg-white p-5 text-left shadow-md ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{subj}</div>
                      <div className="text-xs text-gray-500">Input nilai</div>
                    </div>
                  </div>
                  <ArrowLeft size={16} className="rotate-180 text-gray-400 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Administrasi Pembelajaran (Generate Docs) */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText size={24} />
              </div>
              Administrasi Pembelajaran
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Back Button if not in menu */}
              {adminViewMode !== 'menu' && (
                <button
                  onClick={() => setAdminViewMode('menu')}
                  className="group flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300 hover:shadow-md"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  Kembali ke Menu
                </button>
              )}
            </div>
          </div>

          {/* Menu Mode */}
          {adminViewMode === 'menu' && (
            <div className="mb-6">
               <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progres Kelengkapan Dokumen</span>
                  <span className="font-bold">{generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length}/{ADMIN_DOCS.length} ({Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100)}%)</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ width: `${Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100)}%` }}
                  >
                    {Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100) > 10 && 
                     `${Math.round((generatedDocs.filter(d => ADMIN_DOCS.includes(d.type)).length / ADMIN_DOCS.length) * 100)}%`}
                  </div>
               </div>
               <p className="text-xs text-gray-500 mt-2">
                 Lengkapi {ADMIN_DOCS.length} instrumen administrasi untuk memenuhi standar supervisi.
               </p>
            </div>
          )}

          {adminViewMode === 'menu' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => setIsSelectionModalOpen(true)}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100 md:p-8"
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-blue-50 opacity-50 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <FileText size={32} />
                  </div>
                  <h4 className="mb-2 text-2xl font-bold text-gray-900 group-hover:text-blue-700">
                    Input & Generate
                  </h4>
                  <p className="text-gray-500">
                    Kelola dokumen administrasi pembelajaran. Pilih input manual (link) atau generate otomatis (AI).
                  </p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-blue-600">
                    Mulai <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAdminViewMode('results')}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100 md:p-8"
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-green-50 opacity-50 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <ExternalLink size={32} />
                  </div>
                  <h4 className="mb-2 text-2xl font-bold text-gray-900 group-hover:text-green-700">Lihat Hasil</h4>
                  <p className="text-gray-500">Akses dan unduh dokumen administrasi yang telah berhasil dibuat sebelumnya.</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-green-600">
                    Buka Folder <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportQrPdf}
                disabled={!user?.nip || isExportingQrPdf}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100 md:p-8 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-purple-50 opacity-50 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {isExportingQrPdf ? <Loader2 size={32} className="animate-spin" /> : <QrCode size={32} />}
                  </div>
                  <h4 className="mb-2 text-2xl font-bold text-gray-900 group-hover:text-purple-700">Cetak QR</h4>
                  <p className="text-gray-500">Download PDF 3 halaman berisi Cover, Pengesahan, dan Indeks QR Code.</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-purple-600">
                    Download PDF <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Grid View (Generate / Results) */}
          {adminViewMode !== 'menu' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {ADMIN_DOCS.map((doc, idx) => {
                const existingDoc = generatedDocs.find(d => d.type === doc);
                const isDone = !!existingDoc;
                
                // Logic based on mode
                const isGenerateMode = adminViewMode === 'generate';
                const isManualMode = adminViewMode === 'manual';
                const isResultMode = adminViewMode === 'results';
                
                const isDisabled = isResultMode && !isDone;
                
                const handleClick = () => {
                  if (isManualMode) {
                      // Manual Mode: Always open manual input
                      handleOpenManualInput(doc, existingDoc?.url);
                  } else if (isGenerateMode) {
                    // Generate Mode: Check Premium (Double check, though modal filters it)
                    if (!user?.isPremium) {
                        alert('Akses Ditolak: Fitur ini hanya untuk Premium.');
                        return;
                    }

                    // Premium User Logic: Auto Generate
                    if (doc === 'RPPM/Modul Ajar PM') {
                        setPendingDocType(doc);
                        setShowClassSelector(true);
                    } else {
                        handleGenerateDoc(doc);
                    }
                  } else if (isResultMode && isDone && existingDoc?.url) {
                    window.open(existingDoc.url, '_blank', 'noopener,noreferrer');
                  } else if (isResultMode && isDone && !existingDoc?.url) {
                    alert('Link dokumen tidak ditemukan. Silakan generate ulang.');
                  }
                };

                // Styling determination
                let cardStyle = '';
                let iconBg = '';
                
                if (isGenerateMode) {
                        // Premium Generate Style
                        cardStyle = isDone 
                            ? 'border-green-500 bg-green-50 ring-1 ring-green-200 shadow-sm hover:-translate-y-1 hover:shadow-md'
                            : 'border-gray-200 bg-white hover:-translate-y-1 hover:border-blue-500 hover:ring-1 hover:ring-blue-200 hover:shadow-lg';
                        iconBg = isDone ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100';
                } else if (isManualMode) {
                        // Manual Input Style
                        cardStyle = isDone
                            ? 'border-green-200 bg-green-50/50 hover:-translate-y-1 hover:bg-green-100 hover:shadow-lg'
                            : 'border-gray-200 bg-white hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg';
                        iconBg = isDone ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100 group-hover:text-orange-600';
                } else {
                    // Result Mode
                    cardStyle = isDone
                        ? 'border-green-200 bg-white hover:-translate-y-1 hover:border-green-400 hover:shadow-lg cursor-pointer'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed';
                    iconBg = isDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400';
                }

                return (
                  <button
                    key={idx}
                    onClick={handleClick}
                    disabled={isDisabled}
                    title={
                      isGenerateMode ? 'Klik untuk generate otomatis' :
                      isManualMode ? 'Klik untuk input link manual' :
                      (isDone ? 'Klik untuk membuka folder' : 'Belum tersedia')
                    }
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-6 text-center transition-all duration-300 ${cardStyle}`}
                  >
                    <div className={`mb-4 rounded-full p-3 transition-colors ${iconBg}`}>
                       {isResultMode && isDone ? <ExternalLink size={24} /> : (
                         isManualMode ? <LinkIcon size={24} /> : <FileText size={24} />
                       )}
                    </div>
                    
                    {isDone && (
                      <div className="absolute right-3 top-3">
                        <div className="rounded-full bg-white p-0.5 shadow-sm">
                          <CheckCircle size={18} className="text-green-500 fill-current" />
                        </div>
                      </div>
                    )}

                    <span className={`text-sm font-semibold line-clamp-2 ${
                      isResultMode && !isDone 
                        ? 'text-gray-400' 
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {doc}
                    </span>
                    
                    {/* Status Badge for Generate/Manual Mode */}
                    {(isGenerateMode || isManualMode) && (
                      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isDone 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {isDone ? 'Selesai' : (isGenerateMode ? 'Generate' : 'Input Link')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Jadwal Mengajar */}
        <div id="jadwal-section" className="mb-10 scroll-mt-24">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <BookOpen size={24} />
              </div>
              Jadwal Mengajar
            </h3>
            <button 
              onClick={handleAddSchedule}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md sm:w-auto"
            >
              <Plus size={16} className="transition-transform group-hover:rotate-90" /> Atur Jadwal
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-md ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hari</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mata Pelajaran</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {schedule.map((s, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{s.day}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.time}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.subject}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                        <button 
                          onClick={() => handleEditSchedule(idx)}
                          className="rounded-full bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                          title="Edit Jadwal"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSchedule(idx)}
                          className="rounded-full bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                          title="Hapus Jadwal"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {schedule.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada jadwal mengajar. Silakan tambah jadwal baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Siswa */}
        <div className="mb-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Users size={24} />
              </div>
              Data Siswa <span className="text-lg font-normal text-gray-500">({selectedClassForMapel ? `Kelas ${selectedClassForMapel}` : user.subRole})</span>
            </h3>
            
            <div className="flex gap-3">
              {/* Tombol Kembali untuk Guru Mapel jika sudah memilih kelas */}
              {(user.subRole?.includes('PJOK') || user.subRole?.includes('PAIBP')) && selectedClassForMapel && (
                <button 
                  onClick={() => setSelectedClassForMapel('')}
                  className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
              )}
              
              {/* Tombol Tambah Siswa hanya muncul jika sudah di view tabel siswa (sudah pilih kelas atau guru kelas) */}
              {((user.subRole?.includes('PJOK') || user.subRole?.includes('PAIBP')) ? selectedClassForMapel : true) && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowStudentForm(!showStudentForm)}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    <Plus size={14} /> {showStudentForm ? 'Tutup Form' : 'Tambah Siswa'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid Pilihan Kelas untuk Guru Mapel */}
          {(user.subRole?.includes('PJOK') || user.subRole?.includes('PAIBP')) && !selectedClassForMapel ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {/* Tombol Tambah Kelas */}
              <button
                onClick={handleAddClass}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:border-blue-500 hover:bg-blue-50"
              >
                <Plus size={32} className="mb-3 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Tambah Kelas</span>
              </button>

              {classes.map((cls) => (
                <div
                  key={cls}
                  onClick={() => setSelectedClassForMapel(cls)}
                  className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
                >
                  <button
                    onClick={(e) => handleDeleteClass(cls, e)}
                    className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                    title="Hapus Kelas"
                  >
                    <Trash size={14} />
                  </button>
                  <Users size={32} className="mb-3 text-blue-500" />
                  <span className="text-lg font-bold text-gray-800">Kelas {cls}</span>
                  <span className="mt-1 text-xs text-gray-500">Lihat Data Siswa</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {showStudentForm && (
                <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
                  <h4 className="mb-4 font-bold">{editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h4>
                  <form onSubmit={handleSaveStudent} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nama Siswa"
                      className="rounded border p-2"
                      value={studentForm.name}
                      onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Kelas (e.g. 1A, 2B)"
                      className="rounded border p-2"
                      value={studentForm.class}
                      onChange={e => setStudentForm({...studentForm, class: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="NIS (Opsional)"
                      className="rounded border p-2"
                      value={studentForm.nis}
                      onChange={e => setStudentForm({...studentForm, nis: e.target.value})}
                    />
                    <select
                      className="rounded border p-2"
                      value={studentForm.gender}
                      onChange={e => setStudentForm({...studentForm, gender: e.target.value as 'L' | 'P'})}
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <div className="col-span-1 md:col-span-2">
                      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        Simpan
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">NIS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">L/P</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {students.filter(s => !selectedClassForMapel || s.class === selectedClassForMapel).length > 0 ? (
                      students
                        .filter(s => !selectedClassForMapel || s.class === selectedClassForMapel)
                        .map((student) => (
                        <tr key={student.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{student.nis}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{student.class}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{student.gender}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button onClick={() => handleEditStudent(student)} className="mr-2 text-blue-600 hover:text-blue-900">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-900">
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada data siswa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Modal Manual Input Link */}
      {isManualInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Input Link Dokumen</h3>
            <p className="mb-4 text-sm text-gray-600">
              Masukkan link Google Drive untuk dokumen <strong>{manualDocType}</strong>.
            </p>
            <form onSubmit={handleSaveManualLink}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Link Google Drive</label>
                <input
                  type="url"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualInputModalOpen(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
          )}
        </div>

        {/* Laporan Kepala Sekolah */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
          <div className="flex items-center gap-3 mb-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
               <FileText size={24} />
             </div>
             <h3 className="text-2xl font-bold text-gray-800">Laporan & Supervisi</h3>
          </div>
          
          {supervisionReports.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supervisionReports.map((report) => (
                <div key={report.id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                   <div className="mb-3 flex items-center justify-between">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        report.type === 'planning' || report.type === 'planning_deep' ? 'bg-blue-50 text-blue-700' :
                        report.type === 'observation' ? 'bg-orange-50 text-orange-700' :
                        'bg-teal-50 text-teal-700'
                      }`}>
                        {report.type === 'planning' ? 'Perencanaan' : 
                         report.type === 'planning_deep' ? 'Perencanaan (Telaah)' :
                         report.type === 'observation' ? 'Pelaksanaan' : 
                         report.type === 'administration' ? 'Administrasi' : report.type}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString('id-ID')}</span>
                   </div>
                   <div className="mb-4">
                      <div className="text-sm text-gray-500">Nilai Akhir</div>
                      <div className="flex items-end gap-2">
                        <div className="text-3xl font-bold text-gray-800">
                          {typeof report.finalScore === 'number' ? report.finalScore.toFixed(1) : report.finalScore}
                        </div>
                        <div className={`mb-1 text-sm font-semibold ${
                           (report.finalScore >= 91) ? 'text-green-600' :
                           (report.finalScore >= 81) ? 'text-blue-600' :
                           (report.finalScore >= 70) ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(report.finalScore >= 91) ? 'Sangat Baik' :
                           (report.finalScore >= 81) ? 'Baik' :
                           (report.finalScore >= 70) ? 'Cukup' : 'Kurang'}
                        </div>
                      </div>
                   </div>
                   
                   {report.conclusion && (
                     <div className="mb-3 rounded bg-gray-50 p-3 text-xs text-gray-600">
                        <span className="font-bold">Kesimpulan:</span> {report.conclusion}
                     </div>
                   )}

                   <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>Semester {report.semester} / {report.year}</span>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">
                Belum ada data supervisi dari Kepala Sekolah.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default GuruHome;
