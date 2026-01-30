import { useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { storageService } from '../services/storage';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

const STORAGE_KEYS = {
  USERS: 'app_users',
};

const UserSync = () => {
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;

    const initSync = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        // 1. Subscribe to Firebase changes (Download)
        unsubscribeUsers = firebaseService.subscribeUsers(async (firebaseUsers) => {
          // Selalu sync data dari Firebase ke Local Storage sebagai "Source of Truth"
          // Kita simpan meskipun kosong, agar sinkronisasi akurat (misal semua user dihapus)
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(firebaseUsers));
          console.log('Users synced from Firebase:', firebaseUsers.length);
          // Dispatch event agar komponen lain tahu ada update
          window.dispatchEvent(new Event('external-users-update'));

          // 2. Cek apakah Default Users sudah ada di Firebase
          // BAGIAN INI DINONAKTIFKAN agar Admin bisa menghapus data demo
          /*
          if (!isCheckingDefaults.current) {
            isCheckingDefaults.current = true;
            
            const missingDefaults = DEFAULT_USERS.filter(defUser => 
              !firebaseUsers.some(fbUser => fbUser.nip === defUser.nip)
            );

            if (missingDefaults.length > 0) {
              console.log(`Found ${missingDefaults.length} missing default users. Uploading to Firebase...`);
              try {
                for (const user of missingDefaults) {
                  await firebaseService.saveUser(user);
                  console.log(`Uploaded default user: ${user.name} (${user.nip})`);
                }
              } catch (error) {
                console.error('Error uploading default users:', error);
              }
            }
            
            isCheckingDefaults.current = false;
          }
          */
        });
      } catch (error) {
        console.error('Error initializing UserSync:', error);
      }
    };

    initSync();

    // 3. Listen to local changes to push to Firebase (Upload)
    const handleLocalUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, user, nip } = customEvent.detail;
      
      try {
        if (type === 'save' && user) {
          await firebaseService.saveUser(user);
          console.log('Synced user to Firebase:', user.nip);
        } else if (type === 'delete' && nip) {
          await firebaseService.deleteUser(nip);
          console.log('Deleted user from Firebase:', nip);
        }
      } catch (error) {
        console.error('Failed to sync user change to Firebase:', error);
      }
    };

    window.addEventListener('local-user-update', handleLocalUpdate);

    const heartbeat = () => {
      const currentUser = storageService.getCurrentUser();
      if (currentUser) {
        firebaseService.updateHeartbeat(currentUser.nip);
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
