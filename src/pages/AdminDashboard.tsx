import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Settings, Plus, Trash2, Activity, Pencil } from 'lucide-react';
import { User, isUserOnline } from '../services/storage';
import { firebaseService } from '../services/firebaseService';
import RunningText from '../components/RunningText';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';


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
            Pengaturan
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
             location.pathname === '/admin/users' ? 'Manajemen User' : 'Pengaturan Sistem'}
          </h1>
          <div className="text-gray-600">Selamat datang, Admin</div>
        </header>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/settings" element={<AdminSettings />} />
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
    let unsubscribeUsers: (() => void) | undefined;

    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        // Mengambil data langsung dari Firebase Server (Realtime)
        unsubscribeUsers = firebaseService.subscribeUsers(
          (serverUsers) => {
            setUsers(serverUsers);
            // Hitung online users
            setOnlineCount(serverUsers.filter(u => isUserOnline(u.lastSeen)).length);
            setError(null);
          },
          (err) => {
            // Callback error realtime dari Firestore
            console.error("Firestore subscribe error:", err);
            if (err?.code === 'permission-denied') {
              setError('Izin akses ditolak. Mohon ubah Firestore Rules ke mode publik atau allow read/write.');
            } else {
              setError(`Gagal terhubung ke database: ${err.message}`);
            }
          }
        );
      } catch (err: any) {
        console.error("Error connecting to server:", err);
        if (err?.code === 'auth/configuration-not-found') {
          setError('Fitur Autentikasi belum diaktifkan di Firebase Console. Mohon aktifkan "Anonymous" sign-in provider.');
        } else if (err?.code === 'permission-denied') {
          setError('Izin akses ditolak. Pastikan Security Rules mengizinkan akses.');
        } else {
          setError('Gagal terhubung ke server. Cek koneksi internet atau konfigurasi Firebase.');
        }
      }
    };

    init();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const guruCount = users.filter(u => u.role === 'guru').length;
  
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
        <div className="font-bold mb-2">Terjadi Kesalahan Koneksi Server:</div>
        <p>{error}</p>
        <p className="text-sm mt-2 text-red-600">
          Tips: Buka Firebase Console &gt; Authentication &gt; Sign-in method &gt; Aktifkan <strong>Anonymous</strong>.
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
  const [newUser, setNewUser] = useState<User>({ nip: '', name: '', role: 'guru', active: true });
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Mode edit
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;

    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        // Subscribe langsung ke Firebase untuk data realtime dan akurat
        unsubscribeUsers = firebaseService.subscribeUsers((serverUsers) => {
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
    
    // Simpan langsung ke Firebase
    try {
      await firebaseService.saveUser(newUser);
      setNewUser({ nip: '', name: '', role: 'guru', active: true });
      setIsAdding(false);
      setIsEditing(false);
      // Tidak perlu fetch manual, subscription akan update otomatis
    } catch (error) {
      alert('Gagal menyimpan user ke server');
      console.error(error);
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
    if (window.confirm('Yakin ingin menghapus user ini?')) {
      try {
        await firebaseService.deleteUser(nip);
      } catch (error) {
        alert('Gagal menghapus user dari server');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setNewUser({ nip: '', name: '', role: 'guru', active: true });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setNewUser({ nip: '', name: '', role: 'guru', active: true });
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
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={handleCancel} className="rounded px-4 py-2 hover:bg-gray-200">Batal</button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              {isEditing ? 'Update User' : 'Simpan User'}
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
                  <td className="px-6 py-4 capitalize">{user.role.replace('-', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.school || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.nip)}
                        className="text-red-600 hover:text-red-800"
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
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        // Kita subscribe sekali saja untuk mendapatkan nilai awal
        unsubscribe = firebaseService.subscribeRunningText((text) => {
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
      await firebaseService.saveRunningText(runningText);
      alert('Running text berhasil diperbarui secara ONLINE!');
    } catch (error) {
      alert('Gagal menyimpan. Pastikan konfigurasi Firebase sudah benar.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Pengaturan Sistem (Mode Online)</h2>
      
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

export default AdminDashboard;
