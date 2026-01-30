
export interface User {
  nip: string;
  name: string;
  role: 'guru' | 'kepala-sekolah' | 'pengawas' | 'administrasi' | 'admin';
  active: boolean;
  school?: string; // Menambahkan field sekolah
  photo?: string; // Menyimpan foto profil (base64)
  subRole?: string; // Menambahkan sub-role spesifik (e.g. "Guru Kelas 1")
  
  // Additional fields for document generation context
  kepsekName?: string;
  kepsekNip?: string;
  pengawasName?: string;
  pengawasNip?: string;
  wilayahBinaan?: string;
  managedSchools?: string[]; // List of schools assigned to this user (for Pengawas)
  lastSeen?: string; // ISO date string for online status
}

export const DEFAULT_USERS: User[] = [
  { nip: '123456', name: 'Budi Santoso', role: 'guru', active: true, school: 'SDN 1 Banjar' },
  { nip: '111111', name: 'Drs. Asep', role: 'kepala-sekolah', active: true, school: 'SDN 1 Banjar' },
  { nip: '222222', name: 'Siti Aminah', role: 'pengawas', active: true, school: 'Dinas Pendidikan' },
  { nip: '333333', name: 'Rina Admin', role: 'administrasi', active: true, school: 'SDN 1 Banjar' },
  { nip: '999999', name: 'Super Admin', role: 'admin', active: true, school: 'Pusat' },
];

const STORAGE_KEYS = {
  USERS: 'app_users',
  RUNNING_TEXT: 'app_running_text',
  CLASSES: 'app_classes',
  GENERATED_DOCS: 'app_generated_docs',
  SUPERVISIONS: 'app_supervisions',
  SCHEDULES: 'app_schedules',
  SCHOOL_VISITS: 'app_school_visits',
};

export interface SchoolVisit {
  id: string;
  schoolName: string;
  visitorNip: string; // Pengawas NIP
  visitorName: string;
  date: string;
  purpose: string;
  findings: string;
  recommendations: string;
  status: 'planned' | 'completed';
  createdAt: string;
}

export interface ScheduleItem {
  day: string;
  time: string;
  subject: string;
}

export interface SupervisionReport {
  id: string;
  teacherNip: string;
  teacherName: string;
  date: string;
  semester: string;
  year: string;
  scores: Record<string, number>; // docName -> score (1-4)
  notes: Record<string, string>; // docName -> notes (optional)
  conclusion: string;
  followUp: string;
  finalScore: number;
  type?: 'administration' | 'observation' | 'planning' | 'planning_deep';
  // Additional fields for Planning Supervision
  subject?: string;
  topic?: string;
  learningGoals?: string;
  grade?: string; // Kelas/Semester
}

const DEFAULT_CLASSES: string[] = [];

export const isUserOnline = (lastSeen?: string, now: Date = new Date()) => {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 60000;
  return diffMinutes < 2; // Online if seen in last 2 minutes (buffer for 1 min heartbeat)
};

export const storageService = {
  // ... existing methods ...
  
  saveSupervision: (report: SupervisionReport) => {
    const key = `${STORAGE_KEYS.SUPERVISIONS}_${report.teacherNip}`;
    const stored = localStorage.getItem(key);
    let reports: SupervisionReport[] = stored ? JSON.parse(stored) : [];
    
    // Update existing or add new
    const existingIndex = reports.findIndex(r => r.id === report.id);
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    localStorage.setItem(key, JSON.stringify(reports));
  },

  getSupervisions: (teacherNip: string): SupervisionReport[] => {
    const key = `${STORAGE_KEYS.SUPERVISIONS}_${teacherNip}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  saveSchoolVisit: (visit: SchoolVisit) => {
    const key = `${STORAGE_KEYS.SCHOOL_VISITS}_${visit.schoolName}`;
    const stored = localStorage.getItem(key);
    let visits: SchoolVisit[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = visits.findIndex(v => v.id === visit.id);
    if (existingIndex >= 0) {
      visits[existingIndex] = visit;
    } else {
      visits.push(visit);
    }
    
    localStorage.setItem(key, JSON.stringify(visits));
  },

  getSchoolVisits: (schoolName: string): SchoolVisit[] => {
    const key = `${STORAGE_KEYS.SCHOOL_VISITS}_${schoolName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(stored);
  },

  getClasses: (): string[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
      return DEFAULT_CLASSES;
    }
    return JSON.parse(stored);
  },

  addClass: (className: string) => {
    const classes = storageService.getClasses();
    if (!classes.includes(className)) {
      classes.push(className);
      // Sort classes alphanumeric (optional, but good for display)
      classes.sort(); 
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    }
  },

  deleteClass: (className: string) => {
    const classes = storageService.getClasses().filter(c => c !== className);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const existingIndex = users.findIndex((u) => u.nip === user.nip);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    // Trigger event for syncing
    window.dispatchEvent(new CustomEvent('local-user-update', { detail: { type: 'save', user } }));
  },

  deleteUser: (nip: string) => {
    const users = storageService.getUsers().filter((u) => u.nip !== nip);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    // Trigger event for syncing
    window.dispatchEvent(new CustomEvent('local-user-update', { detail: { type: 'delete', nip } }));
  },

  validateNip: (nip: string): User | undefined => {
    const users = storageService.getUsers();
    return users.find((u) => u.nip === nip && u.active);
  },

  getRunningText: (): string => {
    return localStorage.getItem(STORAGE_KEYS.RUNNING_TEXT) || 'Selamat Datang di Sistem Administrasi Guru';
  },

  saveRunningText: (text: string) => {
    localStorage.setItem(STORAGE_KEYS.RUNNING_TEXT, text);
    window.dispatchEvent(new Event('running-text-changed'));
    
    // Broadcast change to other tabs/windows using BroadcastChannel
    const bc = new BroadcastChannel('app_updates');
    bc.postMessage({ type: 'running_text_update', text });
    bc.close();
  },
  
  // Helper untuk menyimpan user yang sedang login di session/local storage agar persisten
  setCurrentUser: (user: User) => {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },
  
  getCurrentUser: (): User | null => {
    const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  },

  logout: () => {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
  },

  // Track generated documents per user
  addGeneratedDoc: (nip: string, docType: string, url: string) => {
    const key = `${STORAGE_KEYS.GENERATED_DOCS}_${nip}`;
    const stored = localStorage.getItem(key);
    let docs: { type: string; url: string; date: string }[] = [];
    
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      // Handle legacy string array
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        docs = parsed.map((t: string) => ({ type: t, url: '', date: new Date().toISOString() }));
      } else {
        docs = parsed;
      }
    } catch (e) {
      docs = [];
    }

    // Remove existing entry for this type to update it
    docs = docs.filter(d => d.type !== docType);
    
    docs.push({
      type: docType,
      url: url,
      date: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(docs));
  },

  getGeneratedDocs: (nip: string): { type: string; url: string; date: string }[] => {
    const key = `${STORAGE_KEYS.GENERATED_DOCS}_${nip}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      // Handle legacy string array
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map((t: string) => ({ type: t, url: '', date: '' }));
      }
      return parsed;
    } catch (e) {
      return [];
    }
  },

  getSchedule: (nip: string): ScheduleItem[] => {
    const key = `${STORAGE_KEYS.SCHEDULES}_${nip}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  saveSchedule: (nip: string, schedule: ScheduleItem[]) => {
    const key = `${STORAGE_KEYS.SCHEDULES}_${nip}`;
    localStorage.setItem(key, JSON.stringify(schedule));
  }
};
