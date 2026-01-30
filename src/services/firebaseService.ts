import { db, auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteDoc, collection, updateDoc, query, where, orderBy, runTransaction, increment, getDocs } from 'firebase/firestore';
import { User, SupervisionReport, SchoolVisit } from './storage';

const SETTINGS_COLLECTION = 'settings';
const RUNNING_TEXT_DOC = 'running_text';
const USERS_COLLECTION = 'users';
const SUPERVISIONS_COLLECTION = 'supervisions';
const GENERATED_DOCS_COLLECTION = 'generated_docs';
const SCHOOL_STATS_COLLECTION = 'school_stats';
const SCHOOL_VISITS_COLLECTION = 'school_visits';

export const firebaseService = {
  // Login with Google
  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Find user by email in Firestore
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as User;
        return { success: true, user: userData, googleUser: user };
      } else {
        return { success: false, googleUser: user, message: 'Email belum terdaftar.' };
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  },

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
  subscribeUsers: (callback: (users: User[]) => void, onError?: (error: any) => void) => {
    const collectionRef = collection(db, USERS_COLLECTION);
    
    return onSnapshot(collectionRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      callback(users);
    }, (error) => {
      console.error("Error fetching users:", error);
      if (onError) onError(error);
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
      // 1. Try to delete by ID (standard case)
      const docRef = doc(db, USERS_COLLECTION, nip);
      await deleteDoc(docRef);

      // 2. Also find and delete any documents with this NIP field (edge case: mismatch ID)
      // This handles cases where documents were created with auto-generated IDs
      const q = query(collection(db, USERS_COLLECTION), where("nip", "==", nip));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${querySnapshot.size} duplicate/mismatched user documents for NIP ${nip}`);
      }

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

  // Update Managed Schools (for Pengawas)
  updateManagedSchools: async (nip: string, schools: string[]) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, nip);
      await updateDoc(docRef, {
        managedSchools: schools
      });
      return true;
    } catch (error) {
      console.error("Error updating managed schools:", error);
      throw error;
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

  // Save generated doc log AND Update School Stats (Aggregation)
  saveGeneratedDocLog: async (log: { teacherNip: string; teacherName: string; school: string; docType: string; fileName: string }) => {
    try {
      const safeDocType = log.docType.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${log.teacherNip}_${safeDocType}`;
      const docRef = doc(db, GENERATED_DOCS_COLLECTION, docId);
      
      // Use transaction to ensure consistency
      await runTransaction(db, async (transaction) => {
        // 1. Check if doc already exists to avoid double counting
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
           // 2. Create log
           transaction.set(docRef, {
             ...log,
             timestamp: new Date().toISOString()
           });

           // 3. Increment School Stats (Aggregation)
           if (log.school) {
             const schoolId = log.school.replace(/\s+/g, '_').toLowerCase(); // simple slug
             const statsRef = doc(db, SCHOOL_STATS_COLLECTION, schoolId);
             
             transaction.set(statsRef, {
               schoolName: log.school,
               totalDocs: increment(1),
               lastActivity: new Date().toISOString(),
               [`teachers.${log.teacherNip}.name`]: log.teacherName,
               [`teachers.${log.teacherNip}.docs`]: increment(1),
               [`teachers.${log.teacherNip}.lastDoc`]: log.docType
             }, { merge: true });
           }
        } else {
           // Just update timestamp if re-generated
           transaction.update(docRef, {
             timestamp: new Date().toISOString(),
             fileName: log.fileName
           });
        }
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
  },

  // Subscribe to School Stats (For Pengawas & Dinas - Hemat Read)
  subscribeSchoolStats: (callback: (stats: any[]) => void) => {
    const colRef = collection(db, SCHOOL_STATS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const stats: any[] = [];
      snapshot.forEach(doc => stats.push(doc.data()));
      callback(stats);
    }, (error) => {
       console.error("Error fetching school stats:", error);
    });
  },

  // Save School Visit
  saveSchoolVisit: async (visit: SchoolVisit) => {
    try {
      const docRef = doc(db, SCHOOL_VISITS_COLLECTION, visit.id);
      const cleanVisit = JSON.parse(JSON.stringify(visit));
      await setDoc(docRef, cleanVisit);
      return true;
    } catch (error) {
      console.error("Error saving school visit:", error);
      throw error;
    }
  },

  // Subscribe to School Visits
  subscribeSchoolVisits: (schoolName: string, callback: (visits: SchoolVisit[]) => void) => {
    const q = query(collection(db, SCHOOL_VISITS_COLLECTION), where("schoolName", "==", schoolName));
    return onSnapshot(q, (snapshot) => {
      const visits: SchoolVisit[] = [];
      snapshot.forEach((doc) => {
        visits.push(doc.data() as SchoolVisit);
      });
      // Client-side sort to avoid index requirement
      visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(visits);
    });
  }
};
