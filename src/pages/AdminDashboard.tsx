import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Settings, Plus, Trash2, Activity, Pencil, Crown, UploadCloud } from 'lucide-react';
import { User, isUserOnline } from '../services/storage';
import { supabaseService } from '../services/supabaseService';
import RunningText from '../components/RunningText';


const AdminDashboard = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link
            to="/admin"
            className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-blue-700 ${isActive('/admin')}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-blue-700 ${isActive('/admin/users')}`}
          >
            <Users size={20} />
            Kelola User
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-blue-700 ${isActive('/admin/settings')}`}
          >
            <Settings size={20} />
            Running Teks
          </Link>
          <Link
            to="/admin/upload"
            className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-blue-700 ${isActive('/admin/upload')}`}
          >
            <UploadCloud size={20} />
            Upload Data
          </Link>
          <Link
            to="/"
            className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-blue-700 hover:text-red-100"
          >
            <LogOut size={20} />
            Keluar
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <RunningText />
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {location.pathname === '/admin' ? 'Dashboard Overview' : 
             location.pathname === '/admin/users' ? 'Manajemen User' : 
             location.pathname === '/admin/upload' ? 'Upload Data Backup' : 'Running Teks'}
          </h1>
          <div className="text-gray-600">Selamat datang, Admin</div>
        </header>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/upload" element={<AdminUpload />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const AdminHome = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to Users
    const unsubscribeUsers = supabaseService.subscribeUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      
      // Calculate Online Count
      const count = fetchedUsers.filter(u => isUserOnline(u.lastSeen)).length;
      setOnlineCount(count);
    }, (err) => {
      console.error(err);
      setError("Gagal memuat data user.");
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const guruCount = users.filter(u => u.role === 'guru').length;
  
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
        <div className="font-bold mb-2">Terjadi Kesalahan Koneksi Server:</div>
        <p>{error}</p>
        <p className="text-sm mt-2 text-red-600">
          Tips: Pastikan koneksi Supabase sudah dikonfigurasi dengan benar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Total User Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-blue-50 opacity-50 transition-transform group-hover:scale-150"></div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Total User</h3>
          <p className="mt-2 text-4xl font-bold text-gray-900">{users.length}</p>
          <p className="mt-1 text-sm text-gray-500">Terdaftar dalam sistem</p>
        </div>
      </div>

      {/* Total Guru Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-green-50 opacity-50 transition-transform group-hover:scale-150"></div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Total Guru</h3>
          <p className="mt-2 text-4xl font-bold text-gray-900">{guruCount}</p>
          <p className="mt-1 text-sm text-gray-500">Guru aktif mengajar</p>
        </div>
      </div>

      {/* User Online Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-20%] rounded-full bg-purple-50 opacity-50 transition-transform group-hover:scale-150"></div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Activity size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">User Online</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900">{onlineCount}</p>
            <p className="text-sm font-medium text-green-600">Online</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">Sedang aktif sekarang</p>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<User>({ nip: '', name: '', role: 'guru', active: true, isPremium: false });
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Mode edit
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;

    const init = async () => {
      try {


        // Subscribe langsung ke Supabase untuk data realtime dan akurat
        unsubscribeUsers = supabaseService.subscribeUsers((serverUsers) => {
          setUsers(serverUsers);
        });
      } catch (error) {
        console.error("Error connecting to server:", error);
      }
    };

    init();

    // Update waktu lokal untuk status online/offline
    const onlineInterval = setInterval(() => setNow(new Date()), 10000);

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      clearInterval(onlineInterval);
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nip || !newUser.name) return;
    
    setIsSaving(true);
    // Simpan langsung ke Supabase
    try {
      await supabaseService.saveUser(newUser);
      setNewUser({ nip: '', name: '', role: 'guru', active: true, isPremium: false });
      setIsAdding(false);
      setIsEditing(false);
      // Tidak perlu fetch manual, subscription akan update otomatis
    } catch (error) {
      alert('Gagal menyimpan user ke server');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePremium = async (user: User) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Gunakan fungsi khusus update status premium agar lebih aman
      // dan menghindari masalah case-sensitivity kolom (isPremium vs ispremium)
      await supabaseService.updateUserPremium(user.nip, !user.isPremium);
    } catch (error) {
      alert('Gagal mengubah status premium');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setNewUser(user);
    setIsAdding(true);
    setIsEditing(true);
    // Scroll ke form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (nip: string) => {
    if (isSaving) return;
    if (window.confirm('Yakin ingin menghapus user ini?')) {
      setIsSaving(true);
      try {
        await supabaseService.deleteUser(nip);
      } catch (error) {
        alert('Gagal menghapus user dari server');
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setNewUser({ nip: '', name: '', role: 'guru', active: true, isPremium: false });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setNewUser({ nip: '', name: '', role: 'guru', active: true, isPremium: false });
              setIsEditing(false);
            }
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={16} /> {isAdding ? 'Tutup Form' : 'Tambah User'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddUser} className="mb-8 rounded-lg border bg-gray-50 p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-700">{isEditing ? 'Edit User' : 'Tambah User Baru'}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">NIP {isEditing && <span className="text-xs text-gray-500">(Tidak dapat diubah)</span>}</label>
              <input 
                type="text" 
                value={newUser.nip}
                onChange={e => setNewUser({...newUser, nip: e.target.value})}
                className={`w-full rounded border p-2 ${isEditing ? 'bg-gray-200 text-gray-500' : ''}`}
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama</label>
              <input 
                type="text" 
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                className="w-full rounded border p-2"
              >
                <option value="guru">Guru</option>
                <option value="kepala-sekolah">Kepala Sekolah</option>
                <option value="pengawas">Pengawas</option>
                <option value="dinas">Dinas Pendidikan</option>
                <option value="admin">Admin Sistem</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Sekolah</label>
              <input 
                type="text" 
                value={newUser.school || ''}
                onChange={e => setNewUser({...newUser, school: e.target.value})}
                className="w-full rounded border p-2"
                placeholder="Contoh: SDN 1 Banjar"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Jabatan / Kelas (Opsional)</label>
              <input 
                type="text" 
                value={newUser.subRole || ''}
                onChange={e => setNewUser({...newUser, subRole: e.target.value})}
                className="w-full rounded border p-2"
                placeholder="Contoh: Guru Kelas 1"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={newUser.isPremium || false}
                  onChange={e => setNewUser({...newUser, isPremium: e.target.checked})}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <Crown size={16} className="text-yellow-500" /> Premium User
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={handleCancel} disabled={isSaving} className="rounded px-4 py-2 hover:bg-gray-200">Batal</button>
            <button type="submit" disabled={isSaving} className={`rounded px-4 py-2 text-white ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSaving ? 'Menyimpan...' : (isEditing ? 'Update User' : 'Simpan User')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">NIP</th>
              <th className="px-6 py-3 font-medium text-gray-500">Nama</th>
              <th className="px-6 py-3 font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 font-medium text-gray-500">Sekolah</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status Premium</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => {
              const online = isUserOnline(user.lastSeen, now);
              return (
                <tr key={user.nip}>
                  <td className="px-6 py-4">{user.nip}</td>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4 capitalize">
                    {user.subRole ? (
                      <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${
                        user.role === 'guru' 
                          ? 'bg-blue-50 text-blue-700'
                          : user.role === 'kepala-sekolah'
                          ? 'bg-purple-50 text-purple-700'
                          : user.role === 'pengawas'
                          ? 'bg-orange-50 text-orange-700'
                          : user.role === 'dinas'
                          ? 'bg-indigo-50 text-indigo-700'
                          : user.role === 'admin'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {user.subRole}
                      </span>
                    ) : (
                      user.role.replace('-', ' ')
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.school || '-'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePremium(user)}
                      disabled={isSaving}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        user.isPremium 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isPremium ? (
                        <>
                          <Crown size={12} fill="currentColor" /> Premium
                        </>
                      ) : (
                        'Free'
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        disabled={isSaving}
                        className={`text-blue-600 hover:text-blue-800 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.nip)}
                        disabled={isSaving}
                        className={`text-red-600 hover:text-red-800 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [runningText, setRunningText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load initial text
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        
        // Kita subscribe sekali saja untuk mendapatkan nilai awal
        unsubscribe = supabaseService.subscribeRunningText((text) => {
          // Hanya set jika state masih kosong agar tidak menimpa ketikan user
          setRunningText((prev) => prev || text);
        });
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    init();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabaseService.saveRunningText(runningText);
      alert('Running text berhasil diperbarui secara ONLINE!');
    } catch (error) {
      alert('Gagal menyimpan. Pastikan konfigurasi Supabase sudah benar.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Running Teks</h2>
      
      <div className="mb-6">
        <label className="mb-2 block font-medium">Running Text (Teks Berjalan)</label>
        <textarea
          value={runningText}
          onChange={(e) => setRunningText(e.target.value)}
          className="h-24 w-full rounded-md border p-3 focus:border-blue-500 focus:outline-none"
          placeholder="Masukkan teks pengumuman di sini..."
          disabled={isSaving}
        />
        <p className="mt-1 text-sm text-gray-500">Teks ini akan muncul di semua perangkat pengguna secara realtime.</p>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`mt-4 rounded-md px-6 py-2 text-white ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

const AdminUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Silakan pilih file JSON terlebih dahulu' });
      return;
    }

    setUploading(true);
    setStatus({ type: null, message: '' });

    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Format file tidak valid. Pastikan file adalah JSON yang valid.');
      }

      let importedCount = 0;

      // 1. Students (app_students)
      if (Array.isArray(data.students)) {
        const currentStudents = JSON.parse(localStorage.getItem('app_students_v2') || '[]');
        // Merge Logic: Update if ID exists, Add if not
        const mergedStudents = [...currentStudents];
        data.students.forEach((s: any) => {
           if (!s.id || !s.name) return;
           const idx = mergedStudents.findIndex(curr => curr.id === s.id);
           if (idx >= 0) {
             mergedStudents[idx] = s;
           } else {
             mergedStudents.push(s);
           }
        });
        localStorage.setItem('app_students_v2', JSON.stringify(mergedStudents));
        importedCount += data.students.length;
      }

      // 2. Grades (app_grades)
      if (Array.isArray(data.grades)) {
         const currentGrades = JSON.parse(localStorage.getItem('app_grades_v2') || '[]');
         const mergedGrades = [...currentGrades];
         data.grades.forEach((g: any) => {
            if (!g.id) return;
            const idx = mergedGrades.findIndex(curr => curr.id === g.id);
            if (idx >= 0) mergedGrades[idx] = g;
            else mergedGrades.push(g);
         });
         localStorage.setItem('app_grades_v2', JSON.stringify(mergedGrades));
         importedCount += data.grades.length;
      }

      // 3. Attendance (app_attendance)
      if (Array.isArray(data.attendance)) {
         const currentAttendance = JSON.parse(localStorage.getItem('app_attendance_v2') || '[]');
         const mergedAttendance = [...currentAttendance];
         data.attendance.forEach((a: any) => {
            if (!a.id) return;
            const idx = mergedAttendance.findIndex(curr => curr.id === a.id);
            if (idx >= 0) mergedAttendance[idx] = a;
            else mergedAttendance.push(a);
         });
         localStorage.setItem('app_attendance_v2', JSON.stringify(mergedAttendance));
         importedCount += data.attendance.length;
      }

      // 4. Schedule (app_schedules_NIP)
      if (data.nip && Array.isArray(data.schedule)) {
        localStorage.setItem(`app_schedules_v2_${data.nip}`, JSON.stringify(data.schedule));
        importedCount += data.schedule.length;
      }

      setStatus({ 
        type: 'success', 
        message: `Upload berhasil! Total ${importedCount} item data telah diproses.` 
      });
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'Gagal memproses file upload.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Upload Data Backup Guru</h2>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 transition-colors hover:bg-gray-50">
            <UploadCloud size={48} className="mb-4 text-gray-400" />
            <p className="mb-2 text-lg font-medium text-gray-700">
              Drag & drop file JSON di sini, atau klik untuk memilih
            </p>
            <p className="text-sm text-gray-500">
              Format file harus JSON yang valid berisi data siswa, nilai, presensi, atau jadwal.
            </p>
            <input 
              id="file-upload"
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {status.message && (
          <div className={`mb-4 rounded-lg p-4 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <p className="font-medium">{status.type === 'success' ? 'Sukses' : 'Error'}</p>
            <p>{status.message}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button 
            onClick={handleUpload}
            disabled={uploading || !file}
            className={`flex items-center gap-2 rounded-md px-6 py-2 text-white ${
              uploading || !file 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Memproses...
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Upload Data
              </>
            )}
          </button>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Panduan Struktur JSON</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <pre className="overflow-x-auto text-xs text-gray-600">
{`{
  "nip": "123456...", // Wajib jika menyertakan jadwal
  "students": [ ... ], // Array data siswa
  "grades": [ ... ],   // Array data nilai
  "attendance": [ ... ], // Array data absensi
  "schedule": [ ... ]    // Array jadwal (perlu nip)
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
