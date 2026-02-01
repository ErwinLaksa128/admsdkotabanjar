import { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';

const RunningText = () => {
  const [text, setText] = useState('Memuat pengumuman...');

  useEffect(() => {
    // Menggunakan Realtime Listener dari Supabase
    const unsubscribe = supabaseService.subscribeRunningText((newText) => {
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
