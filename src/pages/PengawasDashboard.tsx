import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, LogOut, School, Users, X, ChevronRight } from 'lucide-react'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import RunningText from '../components/RunningText'
import { firebaseService } from '../services/firebaseService'
import { User, SupervisionReport } from '../services/storage'

const PengawasDashboard = () => {
  const location = useLocation()
  const isActive = (path: string) => (location.pathname === path ? 'bg-purple-700' : '')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-purple-800 text-white">
        <div className="p-6 text-xl font-bold">Pengawas</div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link to="/pengawas" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-purple-700 ${isActive('/pengawas')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/pengawas/penilaian" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-purple-700 ${isActive('/pengawas/penilaian')}`}>
            <CheckSquare size={20} />
            Penilaian
          </Link>
          <Link to="/" className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-purple-700 hover:text-red-100">
            <LogOut size={20} />
            Keluar
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <RunningText />
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{location.pathname === '/pengawas' ? 'Ringkasan' : 'Penilaian'}</h1>
          <div className="text-gray-600">Selamat datang, Pengawas</div>
        </header>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<PengawasHome />} />
            <Route path="/penilaian" element={<PengawasPenilaian />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

const PengawasHome = () => {
  const [stats, setStats] = useState({
    schools: 0,
    observations: 0,
    reports: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [schoolList, setSchoolList] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<Record<string, { completed: boolean; score: number }>>({});

  useEffect(() => {
    // Subscribe to Users to count schools and list them
    const unsubUsers = firebaseService.subscribeUsers((fetchedUsers) => {
      // Filter active teachers/principals and count unique schools
      const activeUsers = fetchedUsers.filter(u => 
        (u.role === 'guru' || u.role === 'kepala-sekolah') && u.active && u.school
      );
      
      setUsers(activeUsers);
      
      const schools = new Set(activeUsers.map(u => u.school!));
      const schoolsArray = Array.from(schools).sort();
      
      setSchoolList(schoolsArray);
      setStats(prev => ({ ...prev, schools: schools.size }));
    });

    // Subscribe to Supervisions
    const unsubSup = firebaseService.subscribeAllSupervisions((reports: SupervisionReport[]) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonth = reports.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      
      // Calculate admin completeness for each teacher
      const adminData: Record<string, { completed: boolean; score: number }> = {};
      
      reports.forEach(report => {
        if (report.type === 'administration') {
          // If multiple reports, take the latest one or logic to combine
          // For simplicity, we just take the latest one found
          // In a real app, we might need to sort by date
          adminData[report.teacherNip] = {
            completed: true,
            score: report.finalScore
          };
        }
      });

      setAdminStatus(adminData);

      setStats(prev => ({ 
        ...prev, 
        observations: thisMonth.length,
        reports: reports.length 
      }));
    });

    return () => {
      unsubUsers();
      unsubSup();
    };
  }, []);

  const getSchoolUsers = (schoolName: string) => {
    return users.filter(u => u.school === schoolName);
  };

  return (
    <div className="space-y-8">
      {/* Stats Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-purple-50 p-6 text-purple-900">
          <h3 className="text-lg font-semibold">Sekolah Dibina</h3>
          <p className="text-3xl font-bold">{stats.schools}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-6 text-green-900">
          <h3 className="text-lg font-semibold">Observasi Bulan Ini</h3>
          <p className="text-3xl font-bold">{stats.observations}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-6 text-blue-900">
          <h3 className="text-lg font-semibold">Laporan Terselesaikan</h3>
          <p className="text-3xl font-bold">{stats.reports}</p>
        </div>
      </div>

      {/* School List Section */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-800 flex items-center gap-2">
          <School className="h-6 w-6 text-purple-700" />
          Daftar Sekolah Binaan
        </h2>
        
        {schoolList.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
            Belum ada data sekolah yang terdaftar.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schoolList.map((school) => {
              const teacherCount = users.filter(u => u.school === school && u.role === 'guru').length;
              const hasPrincipal = users.some(u => u.school === school && u.role === 'kepala-sekolah');
              
              return (
                <button
                  key={school}
                  onClick={() => setSelectedSchool(school)}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 text-left shadow-sm transition hover:bg-purple-50 hover:shadow-md hover:border-purple-200 group"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-900">{school}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {teacherCount} Guru {hasPrincipal ? '• Ada Kepala Sekolah' : '• Belum ada KS'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-md">
        <GoogleSyncWidget />
      </div>

      {/* Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <School className="h-5 w-5" />
                {selectedSchool}
              </h3>
              <button 
                onClick={() => setSelectedSchool(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-white/50 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Kepala Sekolah Section */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kepala Sekolah
                </h4>
                <div className="space-y-2">
                  {getSchoolUsers(selectedSchool).filter(u => u.role === 'kepala-sekolah').length > 0 ? (
                    getSchoolUsers(selectedSchool)
                      .filter(u => u.role === 'kepala-sekolah')
                      .map(user => (
                        <div key={user.nip} className="flex items-center gap-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-purple-900">{user.name}</p>
                            <p className="text-xs text-purple-600">NIP: {user.nip}</p>
                          </div>
                          <span className="ml-auto text-xs rounded-full bg-green-100 px-2 py-1 text-green-700">
                            Aktif
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Kepala Sekolah terdaftar.</p>
                  )}
                </div>
              </div>

              {/* Guru Section */}
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Daftar Guru
                </h4>
                <div className="space-y-2">
                  {getSchoolUsers(selectedSchool).filter(u => u.role === 'guru').length > 0 ? (
                    getSchoolUsers(selectedSchool)
                      .filter(u => u.role === 'guru')
                      .map(user => {
                        const adminInfo = adminStatus[user.nip];
                        return (
                          <div key={user.nip} className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-gray-50 transition">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">NIP: {user.nip}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                adminInfo 
                                  ? adminInfo.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {adminInfo ? `Adm: ${adminInfo.score.toFixed(0)}%` : 'Adm: Belum'}
                              </span>
                              {adminInfo && (
                                <span className="text-[10px] text-gray-400">
                                  Terverifikasi
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Guru terdaftar.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t bg-gray-50 p-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedSchool(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PengawasPenilaian = () => (
  <div>
    <h2 className="mb-4 text-lg font-semibold">Penilaian Kinerja</h2>
    <p className="text-gray-600">Daftar penilaian dan status tindak lanjut.</p>
  </div>
)

export default PengawasDashboard
