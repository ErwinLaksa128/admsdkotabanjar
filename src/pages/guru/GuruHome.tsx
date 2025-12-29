import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, BookOpen, Settings, Plus, Edit, Trash, ArrowLeft,
  X, ExternalLink, Download, Loader2, CheckCircle
} from 'lucide-react';
import { storageService, User } from '../../services/storage';
import { studentService, Student } from '../../services/studentService';
import { generateDocument, GasResponse } from '../../services/api';
import CameraCapture from '../../components/CameraCapture';
import GoogleSyncWidget from '../../components/GoogleSyncWidget';
import { ADMIN_DOCS } from '../../constants/documents';

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
  
  // Schedule State (Mock)
  const [schedule, setSchedule] = useState<{day: string, time: string, subject: string}[]> ([
    { day: 'Senin', time: '07:00 - 08:00', subject: 'Upacara' },
    { day: 'Senin', time: '08:00 - 09:30', subject: 'Matematika' },
  ]);
  const [currentTeaching, setCurrentTeaching] = useState('');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GasResponse | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<{ type: string; url: string; date: string }[]>([]);
  const [adminViewMode, setAdminViewMode] = useState<'menu' | 'generate' | 'results'>('menu');

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ day: 'Senin', time: '08:00 - 09:30', subject: 'Matematika' });

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      // Handled by parent or redirect
      return;
    }
    setUser(currentUser);
    updateCurrentTeaching();
    
    // Load generated docs history
    if (currentUser.nip) {
      setGeneratedDocs(storageService.getGeneratedDocs(currentUser.nip));
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

  const updateCurrentTeaching = () => {
    const now = new Date();
    const currentDay = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
    const found = schedule.find(s => s.day === currentDay);
    setCurrentTeaching(found ? found.subject : 'Tidak ada jadwal mengajar saat ini');
  };

  const handleProfileUpdate = (imageData: string) => {
    if (user) {
      const updatedUser = { ...user, photo: imageData };
      setUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      storageService.saveUser(updatedUser);
    }
  };

  const handleGenerateDoc = async (docName: string) => {
    const role = user?.subRole || 'Guru';
    
    // Set loading state
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const result = await generateDocument({
        type: docName,
        subRole: role,
        // Extra fields for GAS
        nama: user?.name,
        nip: user?.nip,
        sekolah: user?.school,
        kepsek: user?.kepsekName || 'Drs. Asep', // Fallback sementara
        nipKepsek: user?.kepsekNip || '111111',
        pengawas: user?.pengawasName || 'Siti Aminah',
        nipPengawas: user?.pengawasNip || '222222',
      });
      
      setGenerationResult(result);

      // If success, mark as generated
      if (result.status === 'success' && user?.nip) {
        // Fallback to empty string if url is missing, though it should be present on success
        const folderUrl = result.folderUrl || '';
        storageService.addGeneratedDoc(user.nip, docName, folderUrl);
        setGeneratedDocs(storageService.getGeneratedDocs(user.nip));
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

  const handleAddSchedule = () => {
    setNewSchedule({ day: 'Senin', time: '08:00 - 09:30', subject: 'Matematika' });
    setIsScheduleModalOpen(true);
  };

  const confirmAddSchedule = () => {
    if (newSchedule.day && newSchedule.time && newSchedule.subject) {
      setSchedule([...schedule, newSchedule]);
      setIsScheduleModalOpen(false);
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

  return (
    <>
      {/* Modal Result / Loading */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col items-center rounded-lg bg-white p-8 shadow-xl">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">Sedang membuat dokumen...</p>
            <p className="text-sm text-gray-500">Mohon tunggu sebentar, proses ini mungkin memakan waktu.</p>
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
                placeholder="Contoh: 7A"
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

      {/* Modal Add Schedule */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Tambah Jadwal</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hari</label>
                <select
                  value={newSchedule.day}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2.5"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Waktu</label>
                <input
                  type="text"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  placeholder="08:00 - 09:30"
                  className="w-full rounded-lg border border-gray-300 p-2.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                <input
                  type="text"
                  value={newSchedule.subject}
                  onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                  placeholder="Matematika"
                  className="w-full rounded-lg border border-gray-300 p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  onClick={confirmAddSchedule}
                  disabled={!newSchedule.subject || !newSchedule.time}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto mt-6 px-4">
        {/* User Info & Camera */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="col-span-1 flex flex-col gap-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="text-center">
                <CameraCapture onCapture={handleProfileUpdate} initialImage={user.photo} />
                <h2 className="mt-4 text-lg font-bold">{user.name}</h2>
                <p className="text-gray-600">{user.subRole || user.role}</p>
                <p className="text-sm text-gray-500">NIP: {user.nip}</p>
                <p className="text-sm text-gray-500">{user.school}</p>
              </div>
            </div>
            
            <GoogleSyncWidget />
          </div>

          <div className="col-span-1 md:col-span-2">
            {/* Info Hari & Mengajar */}
            <div className="mb-6 rounded-lg bg-blue-50 p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-blue-900">Jadwal Mengajar Hari Ini</h3>
              <p className="text-3xl font-bold text-blue-600">{currentTeaching}</p>
              <p className="mt-2 text-gray-600">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Modules & Presensi Shortcuts */}
            <div className="grid grid-cols-3 gap-4">
              <div 
                onClick={() => {
                  const docType = 'RPPM/Modul Ajar PM';
                  const existingDoc = generatedDocs.find(d => d.type === docType);
                  if (existingDoc && existingDoc.url) {
                    window.open(existingDoc.url, '_blank', 'noopener,noreferrer');
                  } else {
                    // Trigger generate if not exists
                    handleGenerateDoc(docType);
                  }
                }}
                className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2 text-purple-600">
                  <BookOpen />
                  <span className="font-bold">Modul Ajar</span>
                </div>
                <p className="text-sm text-gray-500">Akses template modul ajar sesuai kurikulum merdeka.</p>
              </div>
              <div 
                onClick={() => navigate('/guru/presensi')}
                className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2 text-orange-600">
                  <Users />
                  <span className="font-bold">Presensi Kelas</span>
                </div>
                <p className="text-sm text-gray-500">Catat kehadiran siswa secara digital.</p>
              </div>
              <div 
                onClick={() => navigate('/guru/penilaian')}
                className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2 text-green-600">
                  <FileText />
                  <span className="font-bold">Penilaian</span>
                </div>
                <p className="text-sm text-gray-500">Input nilai formatif dan sumatif siswa.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Administrasi Pembelajaran (Generate Docs) */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText size={24} />
              </div>
              Administrasi Pembelajaran
            </h3>
            
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

          {/* Menu Mode */}
          {adminViewMode === 'menu' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                onClick={() => setAdminViewMode('generate')}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100"
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-blue-50 opacity-50 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Plus size={32} />
                  </div>
                  <h4 className="mb-2 text-2xl font-bold text-gray-900 group-hover:text-blue-700">Generate Dokumen</h4>
                  <p className="text-gray-500">Buat dokumen administrasi pembelajaran baru secara otomatis dengan template standar.</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-blue-600">
                    Mulai Generate <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={16} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAdminViewMode('results')}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100"
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
                const isResultMode = adminViewMode === 'results';
                
                const isDisabled = isResultMode && !isDone;
                
                const handleClick = () => {
                  if (isGenerateMode) {
                    handleGenerateDoc(doc);
                  } else if (isResultMode && isDone && existingDoc?.url) {
                    window.open(existingDoc.url, '_blank', 'noopener,noreferrer');
                  } else if (isResultMode && isDone && !existingDoc?.url) {
                    alert('Link dokumen tidak ditemukan. Silakan generate ulang.');
                  }
                };

                return (
                  <button
                    key={idx}
                    onClick={handleClick}
                    disabled={isDisabled}
                    title={
                      isGenerateMode
                        ? 'Klik untuk generate dokumen' 
                        : (isDone ? 'Klik untuk membuka folder' : 'Belum digenerate')
                    }
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-6 text-center transition-all duration-300 ${
                      isGenerateMode
                        ? (isDone 
                            ? 'border-green-200 bg-green-50/50 hover:-translate-y-1 hover:bg-green-100 hover:shadow-lg' // Generate mode (done)
                            : 'border-gray-200 bg-white hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg') // Generate mode (not done)
                        : (isDone
                            ? 'border-green-200 bg-white hover:-translate-y-1 hover:border-green-400 hover:shadow-lg cursor-pointer' // Result mode (available)
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed') // Result mode (unavailable)
                    }`}
                  >
                    <div className={`mb-4 rounded-full p-3 transition-colors ${
                      isGenerateMode 
                        ? (isDone ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600')
                        : (isDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')
                    }`}>
                       {isResultMode && isDone ? <ExternalLink size={24} /> : <FileText size={24} />}
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
                    
                    {/* Status Badge for Generate Mode */}
                    {isGenerateMode && (
                      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isDone 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {isDone ? 'Selesai' : 'Belum Ada'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Jadwal Mengajar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Settings className="text-blue-600" />
              Jadwal Mengajar
            </h3>
            <button 
              onClick={handleAddSchedule}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
            >
              <Plus size={14} /> Tambah
            </button>
          </div>
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hari</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mata Pelajaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {schedule.map((s, idx) => (
                  <tr key={idx}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{s.day}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.time}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Siswa */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Users className="text-blue-600" />
              Data Siswa ({selectedClassForMapel ? `Kelas ${selectedClassForMapel}` : user.subRole})
            </h3>
            
            <div className="flex gap-2">
              {/* Tombol Kembali untuk Guru Mapel jika sudah memilih kelas */}
              {(user.subRole?.includes('PJOK') || user.subRole?.includes('PAIBP')) && selectedClassForMapel && (
                <button 
                  onClick={() => setSelectedClassForMapel('')}
                  className="flex items-center gap-1 rounded-md bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
                >
                  <ArrowLeft size={14} /> Kembali ke Daftar Kelas
                </button>
              )}
              
              {/* Tombol Tambah Siswa hanya muncul jika sudah di view tabel siswa (sudah pilih kelas atau guru kelas) */}
              {((user.subRole?.includes('PJOK') || user.subRole?.includes('PAIBP')) ? selectedClassForMapel : true) && (
                <button 
                  onClick={() => setShowStudentForm(!showStudentForm)}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  <Plus size={14} /> {showStudentForm ? 'Tutup Form' : 'Tambah Siswa'}
                </button>
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
                      placeholder="NIS"
                      className="rounded border p-2"
                      value={studentForm.nis}
                      onChange={e => setStudentForm({...studentForm, nis: e.target.value})}
                      required
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

              <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                    {students.length > 0 ? (
                      students.map((student) => (
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
            </>
          )}
        </div>

        {/* Laporan Kepala Sekolah */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-gray-800">Laporan & Supervisi</h3>
          <p className="text-gray-600">
            Rangkuman administrasi dan hasil supervisi akan muncul di sini setelah diverifikasi oleh Kepala Sekolah.
          </p>
        </div>
      </main>
    </>
  );
};

export default GuruHome;
