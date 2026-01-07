import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc, collection, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { User, SupervisionReport } from './storage';

const SETTINGS_COLLECTION = 'settings';
const RUNNING_TEXT_DOC = 'running_text';
const USERS_COLLECTION = 'users';
const SUPERVISIONS_COLLECTION = 'supervisions';
const GENERATED_DOCS_COLLECTION = 'generated_docs';

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
  },

  // Save Supervision Report (Realtime sync)
  saveSupervision: async (report: SupervisionReport & { school?: string }) => {
    try {
      const docRef = doc(db, SUPERVISIONS_COLLECTION, report.id);
      const cleanReport = JSON.parse(JSON.stringify(report));
      await setDoc(docRef, cleanReport);
      return true;
    } catch (error) {
      console.error('Error saving supervision:', error);
      // Do not throw to avoid blocking local save; just log
      return false;
    }
  },

  // Subscribe to supervision reports by school (latest first)
  subscribeSupervisionsBySchool: (school: string, callback: (reports: SupervisionReport[]) => void) => {
    const colRef = collection(db, SUPERVISIONS_COLLECTION);
    // REMOVED orderBy('date', 'desc') to avoid composite index requirement
    // Sorting will be done client-side
    const q = query(colRef, where('school', '==', school));
    return onSnapshot(q, (snapshot) => {
      const reports: SupervisionReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as SupervisionReport);
      });
      // Sort client-side
      reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      callback(reports);
    }, (error) => {
      console.error('Error subscribing supervisions:', error);
    });
  },

  // Subscribe to ALL supervision reports (for Pengawas)
  subscribeAllSupervisions: (callback: (reports: SupervisionReport[]) => void) => {
    const colRef = collection(db, SUPERVISIONS_COLLECTION);
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const reports: SupervisionReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as SupervisionReport);
      });
      callback(reports);
    }, (error) => {
      console.error('Error subscribing all supervisions:', error);
    });
  },

  // Save generated doc log
  saveGeneratedDocLog: async (log: { teacherNip: string; teacherName: string; school: string; docType: string; fileName: string }) => {
    try {
      // Use setDoc with a custom ID (teacherNip_docType) to avoid duplicates if generated multiple times
      // This way we only count unique documents
      const safeDocType = log.docType.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${log.teacherNip}_${safeDocType}`;
      const docRef = doc(db, GENERATED_DOCS_COLLECTION, docId);
      
      await setDoc(docRef, {
        ...log,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error saving gen doc log:', error);
      return false;
    }
  },

  // Subscribe to generated docs by school
  subscribeGeneratedDocsBySchool: (school: string, callback: (logs: any[]) => void) => {
    const colRef = collection(db, GENERATED_DOCS_COLLECTION);
    const q = query(colRef, where('school', '==', school));
    return onSnapshot(q, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push(doc.data()));
      callback(logs);
    });
  }
};
