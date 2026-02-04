import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, School, BookOpen, Building2, ChevronLeft, Edit2, Shield, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabaseService';

const MAIN_ROLES = [
  { id: 'guru', label: 'Guru', description: 'Akses untuk Guru Kelas & Mapel', icon: <User size={24} /> },
  { id: 'kepala-sekolah', label: 'Kepala Sekolah', description: 'Manajemen & Supervisi Sekolah', icon: <School size={24} /> },
  { id: 'pengawas', label: 'Pengawas Sekolah', description: 'Monitoring & Evaluasi Wilayah', icon: <BookOpen size={24} /> },
  { id: 'dinas', label: 'Dinas Pendidikan', description: 'Administrator Sistem Pusat', icon: <Building2 size={24} /> },
  { id: 'admin', label: 'Administrator', description: 'Akses Panel Admin', icon: <Shield size={24} /> },
];

const Login = () => {
  const navigate = useNavigate();
  
  // Steps: 'select-role' -> 'input-form'
  const [step, setStep] = useState<'select-role' | 'input-form'>('select-role');
  const [selectedMainRole, setSelectedMainRole] = useState<string>('');
  
  // Logic States
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showFullForm, setShowFullForm] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    // Common
    subRole: '', // For Guru
    guruRoleType: 'kelas',
    guruClass: '1',
    schoolName: '',
    
    // Guru / User Info
    userName: '',
    userNip: '',
    
    // Kepsek Info (Context for Guru) or User Info (for Kepsek)
    kepsekName: '',
    kepsekNip: '',
    
    // Pengawas Info
    pengawasName: '',
    pengawasNip: '',
    
    // Pengawas Specific
    wilayahBinaan: '',

    // Kepala Sekolah Specific
    pangkat: '',
    jabatan: '',
    kecamatan: '',
  });

  const [error, setError] = useState('');

  // Debounce ref
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Sync users from Firebase
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeUsers((users) => {
      storageService.syncUsers(users);
    });
    return () => unsubscribe();
  }, []);



  const handleRoleSelect = (roleId: string) => {
    setSelectedMainRole(roleId);
    setStep('input-form');
    setError('');
    // Reset form data slightly but keep some defaults if needed
    setFormData(prev => {
      if (roleId !== 'guru') {
        return {
          ...prev,
          subRole: ''
        };
      }

      return {
        ...prev,
        subRole: 'Guru Kelas 1',
        guruRoleType: 'kelas',
        guruClass: '1'
      };
    });
    // Reset detection
    setIsReturningUser(false);
    setShowFullForm(true);
  };

  const handleBack = () => {
    setStep('select-role');
    setSelectedMainRole('');
    setError('');
    setIsReturningUser(false);
    setShowFullForm(true);
  };

  const checkUserExistence = async (nip: string, role: string) => {
      const cleanNip = nip.trim();
      if (!cleanNip || cleanNip.length < 3) return;

      setIsChecking(true);
      let user: any = null;
      let relatedKepsek: any = null;
      let relatedPengawas: any = null;

      // 1. Try Remote First (Supabase)
      try {
        user = await supabaseService.getUserByNip(cleanNip);
        if (user && user.role === role) {
           storageService.saveUser(user); // Sync to local
           
           // Fetch Relations from Remote
           if (role === 'guru' && user.school) {
              relatedKepsek = await supabaseService.getKepsekBySchool(user.school);
           }
           if ((role === 'guru' || role === 'kepala-sekolah') && user.school) {
              relatedPengawas = await supabaseService.getPengawasBySchool(user.school);
           }
        } else {
           user = null; // Wrong role or not found
        }
      } catch (err) {
        console.error('Remote check failed:', err);
        user = null;
      }

      // 2. Fallback to Local if Remote Failed/Not Found
      if (!user) {
          user = storageService.validateNip(cleanNip);
          if (user && user.role === role) {
              // Fetch Relations locally
              const allUsers = storageService.getUsers();
              
              if (role === 'guru' && user.school) {
                  relatedKepsek = allUsers.find(u => u.role === 'kepala-sekolah' && u.school === user.school);
              }
              
              if ((role === 'guru' || role === 'kepala-sekolah') && user.school) {
                 relatedPengawas = allUsers.find(u => u.role === 'pengawas' && u.managedSchools && u.managedSchools.includes(user.school!));
              }
          } else {
              user = null;
          }
      }
      
      setIsChecking(false);

      // 3. Apply to UI
      if (user) {
          setIsReturningUser(true);

          // If user has complete data, we can hide the form
           let isComplete = !!user.school;
           if (role === 'guru') {
               // specific check for guru: need subRole and class if applicable
               if (!user.subRole) isComplete = false;
               else if (user.subRole.includes('Kelas')) {
                   const cls = user.subRole.split('Kelas ')[1];
                   if (!cls || !cls.trim()) isComplete = false;
               }
           }
           if (isComplete) {
              setShowFullForm(false);
           }
          
          // Autofill Form
          setFormData(prev => {
              const newData = { ...prev };
              if (role === 'guru') {
                  newData.userName = user.name;
                  if (user.school) newData.schoolName = user.school;
                  if (user.subRole) {
                    newData.subRole = user.subRole;
                    if (user.subRole.includes('PJOK')) {
                      newData.guruRoleType = 'pjok';
                      newData.guruClass = '';
                    } else if (user.subRole.includes('PAIBP')) {
                      newData.guruRoleType = 'paibp';
                      newData.guruClass = '';
                    } else if (user.subRole.includes('Kelas')) {
                      newData.guruRoleType = 'kelas';
                      newData.guruClass = user.subRole.split('Kelas ')[1] || '';
                    }
                  }
                  
                  // Use found relations if direct properties are missing
                  newData.kepsekName = user.kepsekName || (relatedKepsek ? relatedKepsek.name : '');
                  newData.kepsekNip = user.kepsekNip || (relatedKepsek ? relatedKepsek.nip : '');
                  newData.pengawasName = user.pengawasName || (relatedPengawas ? relatedPengawas.name : '');
                  newData.pengawasNip = user.pengawasNip || (relatedPengawas ? relatedPengawas.nip : '');
                  
              } else if (role === 'dinas') {
                  newData.userName = user.name;
                  if (user.school) newData.schoolName = user.school;
              } else if (role === 'admin') {
                  newData.userName = user.name;
              } else if (role === 'kepala-sekolah') {
                  newData.kepsekName = user.name;
                  if (user.school) newData.schoolName = user.school;
                  
                  // Use found relations
                  newData.pengawasName = user.pengawasName || (relatedPengawas ? relatedPengawas.name : '');
                  newData.pengawasNip = user.pengawasNip || (relatedPengawas ? relatedPengawas.nip : '');
                  
                  if (user.pangkat) newData.pangkat = user.pangkat;
                  if (user.jabatan) newData.jabatan = user.jabatan;
                  if (user.kecamatan) newData.kecamatan = user.kecamatan;
              } else if (role === 'pengawas') {
                  newData.pengawasName = user.name;
                  if (user.wilayahBinaan) newData.wilayahBinaan = user.wilayahBinaan;
                  if (user.pangkat) newData.pangkat = user.pangkat;
                  if (user.jabatan) newData.jabatan = user.jabatan;
              }
              return newData;
          });
      } else {
          // If previously found but now not (e.g. user changed NIP), reset
          if (isReturningUser) {
              setIsReturningUser(false);
              setShowFullForm(true);
          }
      }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check NIP dynamically with debounce
    if (
        (selectedMainRole === 'guru' && field === 'userNip') ||
        (selectedMainRole === 'kepala-sekolah' && field === 'kepsekNip') ||
        (selectedMainRole === 'pengawas' && field === 'pengawasNip') ||
        (selectedMainRole === 'dinas' && field === 'userNip') ||
        (selectedMainRole === 'admin' && field === 'userNip')
    ) {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
            checkUserExistence(value, selectedMainRole);
        }, 800); // 800ms delay
    }
  };

  const parseGuruClassToken = (raw: string) => {
    const cleaned = (raw || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return '';

    const direct = cleaned.match(/^(\d{1,2})([A-Z])?$/);
    if (direct) return `${direct[1]}${direct[2] || ''}`;

    const prefixed = cleaned.match(/^KELAS(\d{1,2})([A-Z])?$/);
    if (prefixed) return `${prefixed[1]}${prefixed[2] || ''}`;

    return '';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Determine which NIP to validate based on role
    let nipToValidate = '';
    
    if (selectedMainRole === 'guru') {
      nipToValidate = formData.userNip;
    } else if (selectedMainRole === 'kepala-sekolah') {
      nipToValidate = formData.kepsekNip;
    } else if (selectedMainRole === 'pengawas') {
      nipToValidate = formData.pengawasNip;
    } else if (selectedMainRole === 'dinas') {
      nipToValidate = formData.userNip; 
    } else if (selectedMainRole === 'admin') {
      nipToValidate = formData.userNip;
    }

    if (!nipToValidate) {
      setError('Mohon lengkapi NIP untuk login.');
      return;
    }

    // Validate NIP
    // Force check from Supabase first
    let user: any = null;
    try {
        const remoteUser = await supabaseService.getUserByNip(nipToValidate);
        if (remoteUser) {
            storageService.saveUser(remoteUser);
            user = remoteUser;
        }
    } catch (err) {
        console.error('Login error:', err);
    }
    
    // Fallback to local if remote failed
    if (!user) {
        user = storageService.validateNip(nipToValidate);
    }
    
    if (!user) {
      setError('NIP tidak terdaftar. Silakan hubungi Admin.');
      return;
    }

    // Strict Role Check
    if (user.role !== 'admin' && user.role !== selectedMainRole) {
      setError(`NIP terdaftar sebagai '${user.role}', bukan '${selectedMainRole}'.`);
      return;
    }

    const computedGuruSubRole = (() => {
      if (selectedMainRole !== 'guru') return '';
      if (formData.guruRoleType === 'pjok') return 'Guru PJOK';
      if (formData.guruRoleType === 'paibp') return 'Guru PAIBP';
      const token = parseGuruClassToken(formData.guruClass || (formData.subRole.includes('Kelas') ? formData.subRole.split('Kelas ')[1] : ''));
      if (!token) return '';
      return `Guru Kelas ${token}`;
    })();

    if (selectedMainRole === 'guru' && !computedGuruSubRole) {
      setError('Mohon isi kelas (contoh: 4 / 4A / 4B).');
      return;
    }

    // Construct Session User
    // We prioritize stored data if the form is hidden (returning user)
    // But if the user explicitly edited the form (showFullForm is true), we take the form data.
    const sessionUser = {
      ...user,
      
      name: (selectedMainRole === 'guru' ? formData.userName : 
            selectedMainRole === 'kepala-sekolah' ? formData.kepsekName : 
            selectedMainRole === 'pengawas' ? formData.pengawasName : formData.userName) || user.name,
      
      school: formData.schoolName || user.school,
      
      subRole: (selectedMainRole === 'guru' ? computedGuruSubRole : 
               selectedMainRole === 'kepala-sekolah' ? 'Kepala Sekolah' :
               selectedMainRole === 'pengawas' ? 'Pengawas Sekolah' : 
               selectedMainRole === 'admin' ? 'Administrator' : 'Dinas Pendidikan') || user.subRole,
               
      kepsekName: formData.kepsekName || user.kepsekName,
      kepsekNip: formData.kepsekNip || user.kepsekNip,
      pengawasName: formData.pengawasName || user.pengawasName,
      pengawasNip: formData.pengawasNip || user.pengawasNip,
      wilayahBinaan: formData.wilayahBinaan || user.wilayahBinaan,

      // Kepala Sekolah fields
      pangkat: formData.pangkat || user.pangkat,
      jabatan: formData.jabatan || user.jabatan,
      kecamatan: formData.kecamatan || user.kecamatan,
      
      displayName: (selectedMainRole === 'guru' ? formData.userName : 
                   selectedMainRole === 'kepala-sekolah' ? formData.kepsekName : 
                   selectedMainRole === 'pengawas' ? formData.pengawasName : formData.userName) || user.name,
    };

    // IMPORTANT: Save context back to persistent storage
    // This ensures next time they login, their school/subRole is remembered
    storageService.saveUser(sessionUser);

    // Save to session
    storageService.setCurrentUser(sessionUser);

    // Redirect
    switch (selectedMainRole) {
      case 'guru': navigate('/guru'); break;
      case 'kepala-sekolah': navigate('/kepala-sekolah'); break;
      case 'pengawas': navigate('/pengawas'); break;
      case 'dinas': navigate('/dinas'); break;
      case 'admin': navigate('/admin'); break;
      default: navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 
            className="text-3xl font-bold text-blue-900"
          >
            Sistem Administrasi Guru
          </h1>
          <p className="mt-2 text-gray-600">Pusat Data dan Layanan Pendidikan</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: SELECT ROLE */}
        {step === 'select-role' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MAIN_ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`group relative flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-white p-6 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md text-center ${role.id === 'admin' ? 'sm:col-span-2' : ''}`}
                >
                  <div className={`rounded-full bg-blue-100 p-3 text-blue-600 group-hover:bg-blue-200 transition-colors ${role.id === 'admin' ? 'sm:bg-blue-50' : ''}`}>
                    {role.icon}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-800 text-lg">{role.label}</span>
                    <span className="text-sm text-gray-500 group-hover:text-blue-600">{role.description}</span>
                  </div>
                  <div className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${role.id === 'admin' ? 'sm:right-6' : ''}`}>
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center border-t pt-6">
                <p className="text-gray-600 mb-2">Belum memiliki akun?</p>
                <button 
                    onClick={() => navigate('/register')}
                    className="text-blue-600 font-bold hover:underline hover:text-blue-800 transition-colors"
                >
                    Daftar Akun Baru Disini
                </button>
            </div>

          </div>
        )}

        {/* STEP 2: INPUT FORM */}
        {step === 'input-form' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={handleBack}
                  className="rounded-full p-2 hover:bg-gray-100 text-gray-600"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                  Login {MAIN_ROLES.find(r => r.id === selectedMainRole)?.label}
                </h2>
              </div>
              
              {isReturningUser && !showFullForm && (
                <button
                  type="button"
                  onClick={() => setShowFullForm(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={16} />
                  Lengkapi / Ubah Data
                </button>
              )}
            </div>

            {/* --- SCENARIO: GURU --- */}
            {selectedMainRole === 'guru' && (
              <div className="space-y-4">
                {/* NIP First - Always Visible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP Guru</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.userNip}
                      onChange={(e) => handleInputChange('userNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                    {isChecking && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                  </div>
                </div>

                {isReturningUser && !showFullForm ? (
                  <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                           {formData.userName.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg">{formData.userName}</h3>
                           <p className="text-sm text-gray-600">{formData.subRole || 'Guru'} • {formData.schoolName}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                        <User size={16} />
                        <span>Data ditemukan! Silakan klik tombol <strong>Masuk Aplikasi</strong> di bawah.</span>
                     </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Guru</label>
                      <input
                        type="text"
                        required
                        value={formData.userName}
                        onChange={(e) => handleInputChange('userName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nama Lengkap"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detail Sekolah & Atasan</h3>
                        {/* Sub Role */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Peran Guru</label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <select
                            required
                            value={formData.guruRoleType}
                            onChange={(e) => {
                              const next = e.target.value;
                              handleInputChange('guruRoleType', next);
                              if (next !== 'kelas') handleInputChange('guruClass', '');
                            }}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="kelas">Guru Kelas</option>
                            <option value="pjok">Guru PJOK</option>
                            <option value="paibp">Guru PAIBP</option>
                          </select>

                          <input
                            type="text"
                            required={formData.guruRoleType === 'kelas'}
                            disabled={formData.guruRoleType !== 'kelas'}
                            value={formData.guruClass}
                            onChange={(e) => handleInputChange('guruClass', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="Kelas (contoh: 4 / 4A)"
                          />
                        </div>
                        </div>

                        {/* Nama Sekolah */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                        <input
                            type="text"
                            required
                            value={formData.schoolName}
                            onChange={(e) => handleInputChange('schoolName', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Contoh: SDN 1 Banjar"
                        />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Sekolah</label>
                            <input
                            type="text"
                            value={formData.kepsekName}
                            onChange={(e) => handleInputChange('kepsekName', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Nama Kepsek"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Sekolah</label>
                            <input
                            type="text"
                            value={formData.kepsekNip}
                            onChange={(e) => handleInputChange('kepsekNip', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="NIP Kepsek"
                            />
                        </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengawas</label>
                            <input
                            type="text"
                            value={formData.pengawasName}
                            onChange={(e) => handleInputChange('pengawasName', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Nama Pengawas"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIP Pengawas</label>
                            <input
                            type="text"
                            value={formData.pengawasNip}
                            onChange={(e) => handleInputChange('pengawasNip', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="NIP Pengawas"
                            />
                        </div>
                        </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- SCENARIO: KEPALA SEKOLAH --- */}
            {selectedMainRole === 'kepala-sekolah' && (
              <div className="space-y-4">
                {/* NIP First */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Sekolah</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.kepsekNip}
                      onChange={(e) => handleInputChange('kepsekNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                    {isChecking && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                  </div>
                </div>

                {isReturningUser && !showFullForm ? (
                   <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                            {formData.kepsekName.charAt(0)}
                         </div>
                         <div>
                            <h3 className="font-bold text-gray-900 text-lg">{formData.kepsekName}</h3>
                            <p className="text-sm text-gray-600">Kepala Sekolah • {formData.schoolName}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                         <User size={16} />
                         <span>Data ditemukan! Silakan klik tombol <strong>Masuk Aplikasi</strong> di bawah.</span>
                      </div>
                   </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Sekolah</label>
                      <input
                        type="text"
                        required
                        value={formData.kepsekName}
                        onChange={(e) => handleInputChange('kepsekName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nama Lengkap & Gelar"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                            <input
                                type="text"
                                required
                                value={formData.schoolName}
                                onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Contoh: SDN 1 Banjar"
                            />
                        </div>

                        {/* Additional Fields for Kepala Sekolah */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat/Gol/Ruang</label>
                              <select
                                required
                                value={formData.pangkat}
                                onChange={(e) => handleInputChange('pangkat', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Pilih Pangkat/Golongan</option>
                                <option value="Penata, III/c">Penata, III/c</option>
                                <option value="Penata Tingkat I, III/d">Penata Tingkat I, III/d</option>
                                <option value="Pembina, IV/a">Pembina, IV/a</option>
                                <option value="Pembina Tingkat I, IV/b">Pembina Tingkat I, IV/b</option>
                                <option value="Pembina Utama Muda, IV/c">Pembina Utama Muda, IV/c</option>
                                <option value="Pembina Utama Madya, IV/d">Pembina Utama Madya, IV/d</option>
                                <option value="Pembina Utama, IV/e">Pembina Utama, IV/e</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                              <select
                                required
                                value={formData.jabatan}
                                onChange={(e) => handleInputChange('jabatan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Pilih Jabatan</option>
                                <option value="Guru Ahli Muda">Guru Ahli Muda</option>
                                <option value="Guru Ahli Madya">Guru Ahli Madya</option>
                                <option value="Guru Ahli Utama">Guru Ahli Utama</option>
                              </select>
                           </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                            <select
                                required
                                value={formData.kecamatan}
                                onChange={(e) => handleInputChange('kecamatan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Pilih Kecamatan</option>
                                <option value="Banjar">Banjar</option>
                                <option value="Pataruman">Pataruman</option>
                                <option value="Purwaharja">Purwaharja</option>
                                <option value="Langensari">Langensari</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengawas</label>
                                <input
                                type="text"
                                value={formData.pengawasName}
                                onChange={(e) => handleInputChange('pengawasName', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Nama Pengawas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIP Pengawas</label>
                                <input
                                type="text"
                                value={formData.pengawasNip}
                                onChange={(e) => handleInputChange('pengawasNip', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="NIP Pengawas"
                                />
                            </div>
                        </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- SCENARIO: DINAS --- */}
            {selectedMainRole === 'dinas' && (
              <div className="space-y-4">
                 {/* NIP First */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP / ID Pegawai</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.userNip}
                        onChange={(e) => handleInputChange('userNip', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="NIP / ID"
                      />
                      {isChecking && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                    </div>
                 </div>

                 {isReturningUser && !showFullForm ? (
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                             {formData.userName.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-gray-900 text-lg">{formData.userName}</h3>
                             <p className="text-sm text-gray-600">Dinas Pendidikan • {formData.schoolName}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                          <User size={16} />
                          <span>Data ditemukan! Silakan klik tombol <strong>Masuk Aplikasi</strong> di bawah.</span>
                       </div>
                    </div>
                 ) : (
                   <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={formData.userName}
                          onChange={(e) => handleInputChange('userName', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Nama Lengkap"
                        />
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja / Sekolah</label>
                        <input
                          type="text"
                          required
                          value={formData.schoolName}
                          onChange={(e) => handleInputChange('schoolName', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Nama Sekolah / Unit Kerja"
                        />
                      </div>
                   </>
                 )}
              </div>
            )}

            {/* --- SCENARIO: PENGAWAS --- */}
            {selectedMainRole === 'pengawas' && (
              <div className="space-y-4">
                {/* NIP First */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP Pengawas</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.pengawasNip}
                      onChange={(e) => handleInputChange('pengawasNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                    {isChecking && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                  </div>
                </div>

                {isReturningUser && !showFullForm ? (
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                             {formData.pengawasName.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-gray-900 text-lg">{formData.pengawasName}</h3>
                             <p className="text-sm text-gray-600">Pengawas Sekolah • {formData.wilayahBinaan}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                          <User size={16} />
                          <span>Data ditemukan! Silakan klik tombol <strong>Masuk Aplikasi</strong> di bawah.</span>
                       </div>
                    </div>
                ) : (
                   <>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengawas</label>
                       <input
                         type="text"
                         required
                         value={formData.pengawasName}
                         onChange={(e) => handleInputChange('pengawasName', e.target.value)}
                         className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                         placeholder="Nama Lengkap & Gelar"
                       />
                     </div>

                     <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat/Golongan</label>
                              <input
                                type="text"
                                value={formData.pangkat}
                                onChange={(e) => handleInputChange('pangkat', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Contoh: Pembina, IV/a"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                              <input
                                type="text"
                                value={formData.jabatan}
                                onChange={(e) => handleInputChange('jabatan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Contoh: Pengawas Sekolah Ahli Madya"
                              />
                           </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah Binaan</label>
                          <input
                            type="text"
                            value={formData.wilayahBinaan}
                            onChange={(e) => handleInputChange('wilayahBinaan', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Contoh: Kecamatan Banjar"
                          />
                        </div>
                      </div>
                   </>
                )}
              </div>
            )}

            {/* --- SCENARIO: ADMIN --- */}
            {selectedMainRole === 'admin' && (
              <div className="space-y-4">
                 {/* NIP First */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP / ID Admin</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.userNip}
                        onChange={(e) => handleInputChange('userNip', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="NIP / ID"
                      />
                      {isChecking && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                    </div>
                 </div>

                 {isReturningUser && !showFullForm ? (
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                             {formData.userName.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-gray-900 text-lg">{formData.userName}</h3>
                             <p className="text-sm text-gray-600">Administrator</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                          <User size={16} />
                          <span>Data ditemukan! Silakan klik tombol <strong>Masuk Aplikasi</strong> di bawah.</span>
                       </div>
                    </div>
                 ) : (
                   <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={formData.userName}
                          onChange={(e) => handleInputChange('userName', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Nama Lengkap"
                        />
                      </div>
                   </>
                 )}
              </div>
            )}

            <button type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Masuk Dashboard
            </button>

            {/* Registration Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
