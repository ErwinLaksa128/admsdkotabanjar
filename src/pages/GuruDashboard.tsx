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
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-blue-900">Sistem Administrasi Guru</h1>
              <p className="text-sm text-gray-600">Kota Banjar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
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
