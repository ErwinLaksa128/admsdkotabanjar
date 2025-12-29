import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc, collection, updateDoc } from 'firebase/firestore';
import { User } from './storage';

const SETTINGS_COLLECTION = 'settings';
const RUNNING_TEXT_DOC = 'running_text';
const USERS_COLLECTION = 'users';

export const firebaseService = {
  // Subscribe to Running Text changes (Realtime)
  subscribeRunningText: (callback: (text: string) => void) => {
    const docRef = doc(db, SETTINGS_COLLECTION, RUNNING_TEXT_DOC);
    
    // onSnapshot adalah fitur "ajaib" Firebase untuk realtime listener
    return onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data().text);
      } else {
        // Jika dokumen belum ada, kita buatkan defaultnya
        const defaultText = 'Selamat Datang di Sistem Administrasi Guru (Mode Online)';
        setDoc(docRef, { text: defaultText, updatedAt: new Date().toISOString() });
        callback(defaultText);
      }
    }, (error) => {
      console.error("Error fetching running text:", error);
      // Fallback jika koneksi gagal
      callback('Menunggu koneksi ke server...');
    });
  },

  // Save Running Text
  saveRunningText: async (text: string) => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, RUNNING_TEXT_DOC);
      await setDoc(docRef, { 
        text,
        updatedAt: new Date().toISOString() 
      });
      return true;
    } catch (error) {
      console.error("Error saving running text:", error);
      throw error;
    }
  },

  // Subscribe to Users changes (Realtime)
  subscribeUsers: (callback: (users: User[]) => void) => {
    const collectionRef = collection(db, USERS_COLLECTION);
    
    return onSnapshot(collectionRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      callback(users);
    }, (error) => {
      console.error("Error fetching users:", error);
    });
  },

  // Save User
  saveUser: async (user: User) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, user.nip);
      // Hapus field yang undefined karena Firestore menolaknya
      const cleanUser = JSON.parse(JSON.stringify(user));
      await setDoc(docRef, cleanUser);
      return true;
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  },

  // Delete User
  deleteUser: async (nip: string) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, nip);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Update Heartbeat
  updateHeartbeat: async (nip: string) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, nip);
      await updateDoc(docRef, {
        lastSeen: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      // Don't throw, just ignore if fails (e.g. user deleted)
    }
  }
};
