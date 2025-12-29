import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut } from 'lucide-react'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import RunningText from '../components/RunningText'

const AdministrasiDashboard = () => {
  const location = useLocation()
  const isActive = (path: string) => (location.pathname === path ? 'bg-gray-800' : '')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 text-xl font-bold">Administrasi</div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link to="/administrasi" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-800 ${isActive('/administrasi')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/administrasi/dokumen" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-800 ${isActive('/administrasi/dokumen')}`}>
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
          <h1 className="text-2xl font-bold text-gray-800">{location.pathname === '/administrasi' ? 'Ringkasan' : 'Dokumen'}</h1>
          <div className="text-gray-600">Selamat datang, Admin Perkantoran</div>
        </header>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<AdmHome />} />
            <Route path="/dokumen" element={<AdmDocs />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

const AdmHome = () => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-lg border bg-gray-50 p-6 text-gray-900">
        <h3 className="text-lg font-semibold">Surat Masuk</h3>
        <p className="text-3xl font-bold">18</p>
      </div>
      <div className="rounded-lg border bg-green-50 p-6 text-green-900">
        <h3 className="text-lg font-semibold">Surat Keluar</h3>
        <p className="text-3xl font-bold">12</p>
      </div>
      <div className="rounded-lg border bg-blue-50 p-6 text-blue-900">
        <h3 className="text-lg font-semibold">Dokumen Tersimpan</h3>
        <p className="text-3xl font-bold">220</p>
      </div>
    </div>

    <div className="max-w-md">
      <GoogleSyncWidget />
    </div>
  </div>
)

const AdmDocs = () => (
  <div>
    <h2 className="mb-4 text-lg font-semibold">Manajemen Dokumen</h2>
    <p className="text-gray-600">Kelola template dan arsip dokumen kantor.</p>
  </div>
)

export default AdministrasiDashboard
