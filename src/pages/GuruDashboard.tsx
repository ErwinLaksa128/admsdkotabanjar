import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { storageService, User } from '../services/storage';
import GuruHome from './guru/GuruHome';
import PresensiPage from './guru/PresensiPage';
import PenilaianPage from './guru/PenilaianPage';
import RunningText from '../components/RunningText';

const GuruDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 1. Header & Logo */}
      <header className="bg-white shadow-sm">
        <RunningText />
        <div className="container mx-auto flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto md:h-16" />
            <div>
              <h1 className="text-lg font-bold text-blue-900 md:text-xl">Sistem Administrasi Guru</h1>
              <p className="text-xs text-gray-600 md:text-sm">Kota Banjar</p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-4 border-t pt-4 md:w-auto md:border-t-0 md:pt-0">
            <div className="text-left md:text-right">
              <span className="block font-medium text-gray-800">{user.subRole || user.role}</span>
              <span className="block text-xs text-gray-500">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<GuruHome />} />
        <Route path="/presensi" element={<PresensiPage />} />
        <Route path="/penilaian" element={<PenilaianPage />} />
      </Routes>
    </div>
  );
};

export default GuruDashboard;
