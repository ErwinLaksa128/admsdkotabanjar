import { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

const RunningText = () => {
  const [text, setText] = useState('Memuat pengumuman...');

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        // Menggunakan Realtime Listener dari Firebase
        unsubscribe = firebaseService.subscribeRunningText((newText) => {
          setText(newText);
        });
      } catch (error) {
        console.error("Error connecting to running text:", error);
        setText("Gagal memuat pengumuman. Cek koneksi server.");
      }
    };

    init();

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
