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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 text-white transition-opacity duration-700 min-h-[100svh] ${
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

      <div className="text-center space-y-1 mb-8 px-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white animate-pulse mb-2">
          ADMINISTRASI GURU
        </h1>
        <h2 className="text-lg md:text-xl font-semibold text-blue-100 tracking-wide">
          TINGKAT SEKOLAH DASAR
        </h2>
        <h2 className="text-lg md:text-xl font-semibold text-blue-100 tracking-wide">
          KOTA BANJAR
        </h2>
      </div>
      
      <div className="text-center space-y-1 mb-12 px-4 flex flex-col items-center">
        <p className="text-blue-400 text-xs tracking-[0.2em] uppercase">
          TRANSFORMASI DIGITAL MENUJU
        </p>
        <p className="text-yellow-400/90 text-sm font-bold tracking-widest uppercase glow-sm">
          BANJAR BERDAYA, BANJAR MASAGI
        </p>
      </div>

      {/* Loading Bar */}
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-blue-900/50 backdrop-blur-sm">
        <div className="h-full w-full origin-left animate-[grow_2s_ease-in-out_infinite] bg-blue-400"></div>
      </div>
      
      <div className="absolute bottom-8 text-center space-y-1">
        <p className="text-xs text-blue-300/80 font-medium tracking-wide">
          DINAS PENDIDIKAN KOTA BANJAR
        </p>
        <p className="text-[10px] text-blue-400/50">
          &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
