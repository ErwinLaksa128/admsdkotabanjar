import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, School, BookOpen, Building2, ChevronLeft, Edit2 } from 'lucide-react';
import { storageService } from '../services/storage';

const MAIN_ROLES = [
  { id: 'guru', label: 'Guru', icon: <User size={24} /> },
  { id: 'kepala-sekolah', label: 'Kepala Sekolah', icon: <School size={24} /> },
  { id: 'pengawas', label: 'Pengawas Sekolah', icon: <BookOpen size={24} /> },
  { id: 'administrasi', label: 'Administrasi Perkantoran', icon: <Building2 size={24} /> },
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
  });

  const [error, setError] = useState('');
  const [clickCount, setClickCount] = useState(0);

  // Reset click count
  useEffect(() => {
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) navigate('/admin');
  };

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

  const checkUserExistence = (nip: string, role: string) => {
      if (!nip || nip.length < 3) return;

      const user = storageService.validateNip(nip);
      if (user && user.role === role) {
          setIsReturningUser(true);
          // If user has complete data (e.g. subRole or school is set), we can hide the form
          // EXCEPTION: Guru role always shows full form with autofill
          if (user.school && role !== 'guru') {
            setShowFullForm(false);
          }
          
          // Autofill Name based on role
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
                  if (user.kepsekName) newData.kepsekName = user.kepsekName;
                  if (user.kepsekNip) newData.kepsekNip = user.kepsekNip;
                  if (user.pengawasName) newData.pengawasName = user.pengawasName;
                  if (user.pengawasNip) newData.pengawasNip = user.pengawasNip;
              } else if (role === 'administrasi') {
                  newData.userName = user.name;
                  if (user.school) newData.schoolName = user.school;
              } else if (role === 'kepala-sekolah') {
                  newData.kepsekName = user.name;
                  if (user.school) newData.schoolName = user.school;
                  if (user.pengawasName) newData.pengawasName = user.pengawasName;
                  if (user.pengawasNip) newData.pengawasNip = user.pengawasNip;
              } else if (role === 'pengawas') {
                  newData.pengawasName = user.name;
                  if (user.wilayahBinaan) newData.wilayahBinaan = user.wilayahBinaan;
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

    // Check NIP dynamically
    if (
        (selectedMainRole === 'guru' && field === 'userNip') ||
        (selectedMainRole === 'kepala-sekolah' && field === 'kepsekNip') ||
        (selectedMainRole === 'pengawas' && field === 'pengawasNip') ||
        (selectedMainRole === 'administrasi' && field === 'userNip')
    ) {
        checkUserExistence(value, selectedMainRole);
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

  const handleLogin = (e: React.FormEvent) => {
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
    } else if (selectedMainRole === 'administrasi') {
      nipToValidate = formData.userNip; 
    }

    if (!nipToValidate) {
      setError('Mohon lengkapi NIP untuk login.');
      return;
    }

    // Validate NIP
    const user = storageService.validateNip(nipToValidate);
    
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
               selectedMainRole === 'pengawas' ? 'Pengawas Sekolah' : 'Administrasi') || user.subRole,
               
      kepsekName: formData.kepsekName || user.kepsekName,
      kepsekNip: formData.kepsekNip || user.kepsekNip,
      pengawasName: formData.pengawasName || user.pengawasName,
      pengawasNip: formData.pengawasNip || user.pengawasNip,
      wilayahBinaan: formData.wilayahBinaan || user.wilayahBinaan,
      
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
      case 'administrasi': navigate('/administrasi'); break;
      default: navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 
            onClick={handleTitleClick}
            className="cursor-pointer text-3xl font-bold text-blue-900 transition hover:text-blue-700"
            title="Klik 5x untuk akses Admin"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MAIN_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
              >
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  {role.icon}
                </div>
                <span className="font-semibold text-gray-800">{role.label}</span>
              </button>
            ))}
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
                {/* Identity First - Always Visible */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP Guru</label>
                    <input
                      type="text"
                      required
                      value={formData.userNip}
                      onChange={(e) => handleInputChange('userNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                  </div>
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
              </div>
            )}

            {/* --- SCENARIO: KEPALA SEKOLAH --- */}
            {selectedMainRole === 'kepala-sekolah' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      required
                      value={formData.kepsekNip}
                      onChange={(e) => handleInputChange('kepsekNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                  </div>
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
                </div>

                {showFullForm && (
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
                )}
              </div>
            )}

            {/* --- SCENARIO: ADMINISTRASI --- */}
            {selectedMainRole === 'administrasi' && (
              <div className="space-y-4">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   {/* Inputs for NIP and Name now properly rendered */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP / ID Pegawai</label>
                    <input
                      type="text"
                      required
                      value={formData.userNip}
                      onChange={(e) => handleInputChange('userNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP / ID"
                    />
                  </div>
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
                </div>

                {showFullForm && (
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
                )}
              </div>
            )}

            {/* --- SCENARIO: PENGAWAS --- */}
            {selectedMainRole === 'pengawas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP Pengawas</label>
                    <input
                      type="text"
                      required
                      value={formData.pengawasNip}
                      onChange={(e) => handleInputChange('pengawasNip', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="NIP Anda"
                    />
                  </div>
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
                </div>

                {showFullForm && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah Binaan</label>
                    <input
                      type="text"
                      value={formData.wilayahBinaan}
                      onChange={(e) => handleInputChange('wilayahBinaan', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Contoh: Kecamatan Banjar"
                    />
                  </div>
                )}
              </div>
            )}

            <button type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Masuk Dashboard
            </button>

            <div className="mt-6 text-center text-xs text-gray-400">
              <p>NIP Demo:</p>
              <p>Guru: 123456 | Kepsek: 111111</p>
              <p>Pengawas: 222222 | Admin: 333333</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
