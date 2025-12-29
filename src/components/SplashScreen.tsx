import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Animasi fade out dimulai setelah 2.5 detik
    const timer = setTimeout(() => {
      setFade(true);
    }, 2500);

    // Komponen di-unmount setelah animasi selesai (total 3 detik)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 text-white transition-opacity duration-700 ${
        fade ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative mb-6 animate-bounce">
        <div className="absolute -inset-4 rounded-full bg-blue-500 opacity-20 blur-xl"></div>
        <img 
          src="/logo.png" 
          alt="Logo Kota Banjar" 
          className="relative z-10 h-32 w-auto object-contain drop-shadow-lg"
        />
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white animate-pulse">
        SISTEM ADMINISTRASI GURU
      </h1>
      
      <p className="text-blue-300 text-sm tracking-widest uppercase mb-12">
        Digitalisasi • Otomasi • Terintegrasi
      </p>

      {/* Loading Bar */}
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-blue-900/50 backdrop-blur-sm">
        <div className="h-full w-full origin-left animate-[grow_2s_ease-in-out_infinite] bg-blue-400"></div>
      </div>
      
      <div className="absolute bottom-8 text-xs text-blue-400/60">
        v1.0.0 &copy; 2024
      </div>
    </div>
  );
};

export default SplashScreen;
