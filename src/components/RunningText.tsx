import { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';

const RunningText = () => {
  const [text, setText] = useState('Memuat pengumuman...');

  useEffect(() => {
    // Menggunakan Realtime Listener dari Firebase
    // Fungsi ini mengembalikan "unsubscribe" function untuk cleanup
    const unsubscribe = firebaseService.subscribeRunningText((newText) => {
      setText(newText);
    });

    // Cleanup saat komponen di-unmount
    return () => unsubscribe();
  }, []);

  if (!text) return null;

  return (
    <div className="w-full bg-blue-900 py-2 text-white overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-block">
        {text}
      </div>
    </div>
  );
};

export default RunningText;
