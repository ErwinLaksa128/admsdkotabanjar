export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  className: string;
  // Fields for Mapel Teachers (PJOK/PAIBP)
  materi?: string;
  pertemuan?: number; // 1-4
  records: {
    studentId: string;
    studentName: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
    note?: string;
  }[];
}

const STORAGE_KEY_ATTENDANCE = 'app_attendance_v2';

export const attendanceService = {
  getAll: (): AttendanceRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    return stored ? JSON.parse(stored) : [];
  },

  getByClassAndDate: (className: string, date: string): AttendanceRecord | undefined => {
    const all = attendanceService.getAll();
    return all.find(r => r.className === className && r.date === date && !r.materi);
  },

  getByClassAndMaterial: (className: string, materi: string, pertemuan: number): AttendanceRecord | undefined => {
    const all = attendanceService.getAll();
    return all.find(r => 
      r.className === className && 
      r.materi === materi && 
      r.pertemuan === pertemuan
    );
  },

  getByClass: (className: string): AttendanceRecord[] => {
    return attendanceService.getAll().filter(r => r.className === className);
  },

  save: (record: AttendanceRecord) => {
    const all = attendanceService.getAll();
    const index = all.findIndex(r => r.id === record.id);
    
    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }
    
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(all));
  },
  
  delete: (id: string) => {
    const all = attendanceService.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(all));
  }
};
