import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, LogOut } from 'lucide-react'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import RunningText from '../components/RunningText'

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

const PengawasHome = () => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-lg border bg-purple-50 p-6 text-purple-900">
        <h3 className="text-lg font-semibold">Sekolah Dibina</h3>
        <p className="text-3xl font-bold">8</p>
      </div>
      <div className="rounded-lg border bg-green-50 p-6 text-green-900">
        <h3 className="text-lg font-semibold">Observasi Bulan Ini</h3>
        <p className="text-3xl font-bold">5</p>
      </div>
      <div className="rounded-lg border bg-blue-50 p-6 text-blue-900">
        <h3 className="text-lg font-semibold">Laporan Terselesaikan</h3>
        <p className="text-3xl font-bold">12</p>
      </div>
    </div>

    <div className="max-w-md">
      <GoogleSyncWidget />
    </div>
  </div>
)

const PengawasPenilaian = () => (
  <div>
    <h2 className="mb-4 text-lg font-semibold">Penilaian Kinerja</h2>
    <p className="text-gray-600">Daftar penilaian dan status tindak lanjut.</p>
  </div>
)

export default PengawasDashboard
