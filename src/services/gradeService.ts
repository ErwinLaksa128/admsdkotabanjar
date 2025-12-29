export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  type: 'Penilaian Harian' | 'Penilaian STS' | 'Penilaian SAS';
  score: number;
  date: string; // YYYY-MM-DD
  semester: string; // e.g., "1", "2"
  
  // Additional fields for Mapel Teachers (PJOK)
  materi?: string;
  pertemuan?: number;
}

const STORAGE_KEY_GRADES = 'app_grades';

export const gradeService = {
  getAll: (): GradeRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY_GRADES);
    return stored ? JSON.parse(stored) : [];
  },

  getByClass: (className: string): GradeRecord[] => {
    return gradeService.getAll().filter(r => r.className === className);
  },

  getByStudent: (studentId: string): GradeRecord[] => {
    return gradeService.getAll().filter(r => r.studentId === studentId);
  },

  add: (record: Omit<GradeRecord, 'id'>) => {
    const all = gradeService.getAll();
    const newRecord = { ...record, id: Date.now().toString() };
    all.push(newRecord);
    localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(all));
    return newRecord;
  },

  update: (record: GradeRecord) => {
    const all = gradeService.getAll();
    const index = all.findIndex(r => r.id === record.id);
    if (index >= 0) {
      all[index] = record;
      localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(all));
    }
  },

  delete: (id: string) => {
    const all = gradeService.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(all));
  }
};
