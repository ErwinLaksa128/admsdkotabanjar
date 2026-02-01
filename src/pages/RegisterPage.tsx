import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, School, ArrowLeft, Save } from 'lucide-react';
import { storageService } from '../services/storage';
import { supabaseService as firebaseService } from '../services/supabaseService';
import { DEFAULT_SCHOOLS } from '../services/storage';

const ROLES = [
  { id: 'guru', label: 'Guru', icon: <User size={20} /> },
  { id: 'kepala-sekolah', label: 'Kepala Sekolah', icon: <School size={20} /> },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('guru');
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    school: '',
    // Guru specific
    guruRoleType: 'kelas', // kelas, pjok, paibp
    guruClass: '1',
    // Kepsek specific
    pangkat: '',
    jabatan: '',
    // Pengawas specific
    wilayahBinaan: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync users to ensure we have latest data for validation
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeUsers((users) => {
      storageService.syncUsers(users);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!formData.nip || formData.nip.length < 5) {
      setError('NIP harus diisi dengan benar (minimal 5 karakter).');
      setIsSubmitting(false);
      return;
    }
    if (!formData.name) {
      setError('Nama Lengkap harus diisi.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.school) {
        setError('Sekolah harus dipilih.');
        setIsSubmitting(false);
        return;
    }

    // Check if NIP already exists
    const existingUser = storageService.validateNip(formData.nip);
    if (existingUser) {
      setError(`NIP ${formData.nip} sudah terdaftar atas nama ${existingUser.name}. Silakan login.`);
      setIsSubmitting(false);
      return;
    }

    // Construct SubRole for Guru
    let subRole = '';
    if (role === 'guru') {
        if (formData.guruRoleType === 'kelas') {
            subRole = `Guru Kelas ${formData.guruClass}`;
        } else if (formData.guruRoleType === 'pjok') {
            subRole = 'Guru PJOK';
        } else if (formData.guruRoleType === 'paibp') {
            subRole = 'Guru PAI-BP';
        }
    }

    // Create User Object
    const newUser: any = {
      nip: formData.nip,
      name: formData.name,
      role: role as any,
      active: true,
      school: formData.school,
      subRole: role === 'guru' ? subRole : undefined,
      isPremium: false, // Default Free User
      // Optional fields based on role
      pangkat: role === 'kepala-sekolah' ? formData.pangkat : undefined,
      jabatan: role === 'kepala-sekolah' ? formData.jabatan : undefined,
    };

    // Auto-assign Officials for Guru
    if (role === 'guru' && formData.school) {
        const allUsers = storageService.getUsers();
        
        // Find Kepala Sekolah
        const kepsek = allUsers.find(u => u.role === 'kepala-sekolah' && u.school === formData.school);
        if (kepsek) {
            newUser.kepsekName = kepsek.name;
            newUser.kepsekNip = kepsek.nip;
        }

        // Find Pengawas
        const pengawas = allUsers.find(u => u.role === 'pengawas' && u.managedSchools?.includes(formData.school));
        if (pengawas) {
            newUser.pengawasName = pengawas.name;
            newUser.pengawasNip = pengawas.nip;
            newUser.wilayahBinaan = pengawas.wilayahBinaan;
        }
    }

    try {
      // Save to Storage & Firebase
      storageService.saveUser(newUser);
      firebaseService.saveUser(newUser);

      // Redirect to Login
      alert('Pendaftaran berhasil! Silakan login dengan NIP Anda.');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Gagal mendaftar: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center text-white relative">
            <button 
                onClick={() => navigate('/')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Daftar Akun Baru</h1>
            <p className="text-blue-100 text-sm mt-1">Silakan lengkapi data diri Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                {ROLES.map(r => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${
                            role === r.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className="mb-1">{r.icon}</div>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Common Fields */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                <input 
                    type="text" 
                    value={formData.nip}
                    onChange={(e) => handleChange('nip', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: 19800101..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap & Gelar</label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sekolah</label>
                <select 
                    value={formData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                >
                    <option value="">-- Pilih Sekolah --</option>
                    {DEFAULT_SCHOOLS.map(s => (
                        <option key={s.npsn} value={s.name}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Guru Specific */}
            {role === 'guru' && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800">Detail Guru</h3>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Guru</label>
                        <select 
                            value={formData.guruRoleType}
                            onChange={(e) => handleChange('guruRoleType', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="kelas">Guru Kelas</option>
                            <option value="pjok">Guru PJOK</option>
                            <option value="paibp">Guru PAI-BP</option>
                        </select>
                    </div>

                    {formData.guruRoleType === 'kelas' && (
                         <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Kelas</label>
                            <select 
                                value={formData.guruClass}
                                onChange={(e) => handleChange('guruClass', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                                {[1,2,3,4,5,6].map(c => (
                                    <option key={c} value={c}>Kelas {c}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Kepsek Specific */}
            {role === 'kepala-sekolah' && (
                <div className="bg-indigo-50 p-4 rounded-lg space-y-3 border border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-800">Detail Jabatan</h3>
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Pangkat/Golongan</label>
                         <input 
                            type="text"
                            value={formData.pangkat}
                            onChange={(e) => handleChange('pangkat', e.target.value)}
                            placeholder="Contoh: Pembina Tk. I, IV/b"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Jabatan</label>
                         <input 
                            type="text"
                            value={formData.jabatan}
                            onChange={(e) => handleChange('jabatan', e.target.value)}
                            placeholder="Kepala Sekolah"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
                {isSubmitting ? 'Memproses...' : (
                    <>
                        <Save size={20} />
                        Daftar Sekarang
                    </>
                )}
            </button>

            <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                    Sudah punya akun? 
                    <button 
                        type="button"
                        onClick={() => navigate('/')}
                        className="ml-1 text-blue-600 font-bold hover:underline"
                    >
                        Masuk disini
                    </button>
                </p>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
