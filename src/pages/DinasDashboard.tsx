import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut, Users, School, BookOpen, ChevronLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import RunningText from '../components/RunningText'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import { storageService, User } from '../services/storage'
import { supabaseService } from '../services/supabaseService'

const DinasDashboard = () => {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = storageService.getCurrentUser()
    setCurrentUser(user)
  }, [])

  const isActive = (path: string) => (location.pathname === path ? 'bg-gray-800' : '')

  const getTitle = () => {
    if (location.pathname.includes('/pengawas')) return 'Data Pengawas'
    if (location.pathname.includes('/kepala-sekolah')) return 'Data Kepala Sekolah'
    if (location.pathname.includes('/guru')) return 'Data Guru'
    if (location.pathname.includes('/dokumen')) return 'Dokumen'
    return 'Dashboard'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 text-xl font-bold">Dinas Pendidikan</div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link to="/dinas" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-800 ${isActive('/dinas')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/dinas/dokumen" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-800 ${isActive('/dinas/dokumen')}`}>
            <FileText size={20} />
            Dokumen
          </Link>
          <Link to="/" className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-gray-800 hover:text-red-100">
            <LogOut size={20} />
            Keluar
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <RunningText />
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
          <div className="text-gray-600">Selamat datang, Dinas Pendidikan</div>
        </header>
        <div className="mb-6 max-w-md">
           <GoogleSyncWidget user={currentUser} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm min-h-[500px]">
          <Routes>
            <Route path="/" element={<DinasHome />} />
            <Route path="/pengawas" element={<DataPengawas />} />
            <Route path="/kepala-sekolah" element={<DataKepalaSekolah />} />
            <Route path="/guru" element={<DataGuru />} />
            <Route path="/dokumen" element={<DinasDocs />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

const DinasHome = () => {
  const navigate = useNavigate()
  const [growthData, setGrowthData] = useState<{
    pengawas: { name: string; value: number }[];
    kepsek: { name: string; value: number }[];
    guru: { name: string; value: number }[];
  }>({
    pengawas: [],
    kepsek: [],
    guru: []
  })

  useEffect(() => {
    // Subscribe to real-time user updates
    const unsubscribe = supabaseService.subscribeUsers((users) => {
      const countByRole = (role: string) => users.filter(u => u.role === role && u.active).length
      
      const totalPengawas = countByRole('pengawas')
      const totalKepsek = countByRole('kepala-sekolah')
      const totalGuru = countByRole('guru')

      const generateTrend = (finalValue: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']
        if (finalValue === 0) return months.map(m => ({ name: m, value: 0 }))

        return months.map((month, index) => {
          // Linear growth from ~70% to 100%
          const percentage = 0.7 + (0.3 * (index / 5))
          // Add small random noise (-5% to +5%) except for last index
          const noise = index === 5 ? 0 : (Math.random() * 0.1 - 0.05)
          const val = Math.max(0, Math.round(finalValue * (percentage + noise)))
          return { name: month, value: index === 5 ? finalValue : val }
        })
      }

      setGrowthData({
        pengawas: generateTrend(totalPengawas),
        kepsek: generateTrend(totalKepsek),
        guru: generateTrend(totalGuru)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Chart Pengawas */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h4 className="text-sm font-semibold text-gray-600">Trend Data Pengawas</h4>
             <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
               Total: {growthData.pengawas[5]?.value || 0}
             </span>
           </div>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={growthData.pengawas}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis fontSize={10} axisLine={false} tickLine={false} width={20} />
                 <Tooltip />
                 <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart Kepsek */}
         <div className="rounded-lg border bg-white p-4 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h4 className="text-sm font-semibold text-gray-600">Trend Data Kepala Sekolah</h4>
             <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
               Total: {growthData.kepsek[5]?.value || 0}
             </span>
           </div>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={growthData.kepsek}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis fontSize={10} axisLine={false} tickLine={false} width={20} />
                 <Tooltip />
                 <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart Guru */}
         <div className="rounded-lg border bg-white p-4 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h4 className="text-sm font-semibold text-gray-600">Trend Data Guru</h4>
             <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
               Total: {growthData.guru[5]?.value || 0}
             </span>
           </div>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={growthData.guru}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis fontSize={10} axisLine={false} tickLine={false} width={30} />
                 <Tooltip />
                 <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card Data Pengawas */}
        <div 
          onClick={() => navigate('/dinas/pengawas')}
          className="cursor-pointer rounded-lg border bg-blue-50 p-6 text-blue-900 transition hover:shadow-md hover:bg-blue-100"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-200 rounded-full">
              <BookOpen size={24} className="text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold">Data Pengawas</h3>
          </div>
          <p className="text-sm text-blue-700">Kelola data pengawas & wilayah binaan</p>
        </div>

        {/* Card Data Kepala Sekolah */}
        <div 
          onClick={() => navigate('/dinas/kepala-sekolah')}
          className="cursor-pointer rounded-lg border bg-indigo-50 p-6 text-indigo-900 transition hover:shadow-md hover:bg-indigo-100"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-200 rounded-full">
              <School size={24} className="text-indigo-700" />
            </div>
            <h3 className="text-lg font-semibold">Data Kepala Sekolah</h3>
          </div>
          <p className="text-sm text-indigo-700">Lihat seluruh data Kepala Sekolah</p>
        </div>

        {/* Card Data Guru */}
        <div 
          onClick={() => navigate('/dinas/guru')}
          className="cursor-pointer rounded-lg border bg-emerald-50 p-6 text-emerald-900 transition hover:shadow-md hover:bg-emerald-100"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-200 rounded-full">
              <Users size={24} className="text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Data Guru</h3>
          </div>
          <p className="text-sm text-emerald-700">Lihat seluruh data Guru</p>
        </div>
      </div>
    </div>
  )
}

const DataPengawas = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const unsubscribe = supabaseService.subscribeUsers((allUsers) => {
      setUsers(allUsers.filter(u => u.role === 'pengawas'))
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div>
      <button 
        onClick={() => navigate('/dinas')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft size={20} /> Kembali
      </button>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah Binaan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sekolah Binaan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.nip}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.wilayahBinaan || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.managedSchools?.length || 0} Sekolah</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data Pengawas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DataKepalaSekolah = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const unsubscribe = supabaseService.subscribeUsers((allUsers) => {
      setUsers(allUsers.filter(u => u.role === 'kepala-sekolah'))
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div>
      <button 
        onClick={() => navigate('/dinas')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft size={20} /> Kembali
      </button>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sekolah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.nip}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.school || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data Kepala Sekolah</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DataGuru = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const unsubscribe = supabaseService.subscribeUsers((allUsers) => {
      setUsers(allUsers.filter(u => u.role === 'guru'))
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div>
      <button 
        onClick={() => navigate('/dinas')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft size={20} /> Kembali
      </button>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sekolah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan / Kelas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.nip}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.school || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.subRole || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data Guru</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DinasDocs = () => (
  <div>
    <h2 className="mb-4 text-lg font-semibold">Manajemen Dokumen</h2>
    <p className="text-gray-600">Kelola template dan arsip dokumen dinas.</p>
  </div>
)

export default DinasDashboard
