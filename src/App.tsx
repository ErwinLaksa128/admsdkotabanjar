import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import GuruDashboard from './pages/GuruDashboard';
import Login from './pages/Login';
import SplashScreen from './components/SplashScreen';
import KepalaSekolahDashboard from './pages/KepalaSekolahDashboard';
import PengawasDashboard from './pages/PengawasDashboard';
import AdministrasiDashboard from './pages/AdministrasiDashboard';
import UserSync from './components/UserSync';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <UserSync />
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/guru/*" element={<GuruDashboard />} />
          <Route path="/kepala-sekolah/*" element={<KepalaSekolahDashboard />} />
          <Route path="/pengawas/*" element={<PengawasDashboard />} />
          <Route path="/administrasi/*" element={<AdministrasiDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
