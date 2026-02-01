export interface Student {
  id: string;
  name: string;
  class: string; // e.g., "1A", "2B"
  nis: string;
  gender: 'L' | 'P';
}

const STORAGE_KEY_STUDENTS = 'app_students_v2';

const DEFAULT_STUDENTS: Student[] = [];

export const studentService = {
  getAllStudents: (): Student[] => {
    const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(stored);
  },

  getStudentsByClass: (className: string): Student[] => {
    return studentService.getAllStudents().filter(s => s.class === className);
  },

  addStudent: (student: Omit<Student, 'id'>) => {
    const students = studentService.getAllStudents();
    const newStudent = { ...student, id: Date.now().toString() };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    return newStudent;
  },

  updateStudent: (student: Student) => {
    const students = studentService.getAllStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      students[index] = student;
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    }
  },

  deleteStudent: (id: string) => {
    const students = studentService.getAllStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }
};
