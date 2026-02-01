import { useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storage';

const STORAGE_KEYS = {
  USERS: 'app_users',
};

const UserSync = () => {
  useEffect(() => {
    // 1. Subscribe to Supabase changes (Download)
    const unsubscribeUsers = supabaseService.subscribeUsers(async (remoteUsers) => {
      // Selalu sync data dari Supabase ke Local Storage sebagai "Source of Truth"
      // Kita simpan meskipun kosong, agar sinkronisasi akurat (misal semua user dihapus)
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remoteUsers));
      console.log('Users synced from Supabase:', remoteUsers.length);
      // Dispatch event agar komponen lain tahu ada update
      window.dispatchEvent(new Event('external-users-update'));
    });



    // 3. Listen to local changes to push to Supabase (Upload)
    const handleLocalUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, user, nip } = customEvent.detail;
      
      try {
        if (type === 'save' && user) {
          await supabaseService.saveUser(user);
          console.log('Synced user to Supabase:', user.nip);
        } else if (type === 'delete' && nip) {
          await supabaseService.deleteUser(nip);
          console.log('Deleted user from Supabase:', nip);
        }
      } catch (error) {
        console.error('Failed to sync user change to Supabase:', error);
      }
    };

    window.addEventListener('local-user-update', handleLocalUpdate);

    const heartbeat = () => {
      const currentUser = storageService.getCurrentUser();
      if (currentUser) {
        supabaseService.updateHeartbeat(currentUser.nip);
      }
    };

    heartbeat();

    const handleFocus = () => {
      heartbeat();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        heartbeat();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Heartbeat (Update Last Seen every 1 minute)
    const heartbeatInterval = setInterval(() => {
      heartbeat();
    }, 60000); // 1 minute

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      window.removeEventListener('local-user-update', handleLocalUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
    };
  }, []); // Empty dependency array means this runs once on mount

  return null;
};

export default UserSync;
