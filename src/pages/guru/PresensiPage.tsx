import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { storageService } from '../../services/storage';
import { studentService, Student } from '../../services/studentService';
import { attendanceService, AttendanceRecord } from '../../services/attendanceService';
import { getMateriByClass } from '../../data/materiPjok';

const PresensiPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // View Mode: 'input' | 'rekap'
  const [viewMode, setViewMode] = useState<'input' | 'rekap'>('input');
  const [rekapMonth, setRekapMonth] = useState(new Date().getMonth() + 1);
  const [rekapYear, setRekapYear] = useState(new Date().getFullYear());
  const [rekapData, setRekapData] = useState<{
    student: Student;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
  }[]>([]);

  // Mapel Teacher State
  const [isMapelTeacher, setIsMapelTeacher] = useState(false);
  const [materi, setMateri] = useState('');
  const [pertemuan, setPertemuan] = useState(1);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableMateri, setAvailableMateri] = useState<string[]>([]);
  
  // Local state for attendance form
  // Map studentId -> status
  const [attendanceData, setAttendanceData] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    const isMapel = currentUser.subRole?.includes('PJOK') || currentUser.subRole?.includes('PAIBP');
    setIsMapelTeacher(!!isMapel);

    if (isMapel) {
      // For Mapel teachers, load available classes
      setAvailableClasses(storageService.getClasses());
      // Don't auto-select class, let them choose
    } else if (currentUser.subRole?.includes('Kelas')) {
      const classNum = currentUser.subRole.split('Kelas ')[1];
      const available = storageService.getClasses();
      const cleaned = (classNum || '').trim().toUpperCase().replace(/\s+/g, '');
      const exact = available.includes(cleaned) ? cleaned : '';
      const first = cleaned ? available.find(c => c.toUpperCase().startsWith(cleaned.replace(/[A-Z]/g, ''))) : '';
      setSelectedClass(exact || first || (cleaned ? `${cleaned.replace(/[A-Z]/g, '')}A` : '1A'));
    } else {
      setSelectedClass('1A'); // Default fallback
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedClass) {
      if (isMapelTeacher) {
        // Load Materi if PJOK
        const currentUser = storageService.getCurrentUser();
        if (currentUser?.subRole?.includes('PJOK')) {
          setAvailableMateri(getMateriByClass(selectedClass));
        }
      }
      loadStudentsAndAttendance();
    } else {
      setAvailableMateri([]);
    }
  }, [selectedClass, date, materi, pertemuan, isMapelTeacher]);

  useEffect(() => {
    if (viewMode === 'rekap' && selectedClass) {
      calculateRekap();
    }
  }, [viewMode, selectedClass, rekapMonth, rekapYear]);

  const calculateRekap = () => {
    // 1. Get all students of the class
    let classStudents = studentService.getAllStudents().filter(s => s.class === selectedClass);
    if (classStudents.length === 0) {
        classStudents = studentService.getAllStudents().filter(s => s.class.startsWith(selectedClass.replace(/[A-Z]/g, '')));
    }

    // 2. Get all attendance records for this class
    const allRecords = attendanceService.getByClass(selectedClass);
    
    // 3. Filter by Month & Year
    const monthlyRecords = allRecords.filter(r => {
      const d = new Date(r.date);
      return (d.getMonth() + 1) === rekapMonth && d.getFullYear() === rekapYear;
    });

    // 4. Aggregate
    const stats = classStudents.map(student => {
      let hadir = 0, sakit = 0, izin = 0, alpa = 0;
      
      monthlyRecords.forEach(record => {
        const studentRecord = record.records.find(s => s.studentId === student.id);
        if (studentRecord) {
          if (studentRecord.status === 'Hadir') hadir++;
          else if (studentRecord.status === 'Sakit') sakit++;
          else if (studentRecord.status === 'Izin') izin++;
          else if (studentRecord.status === 'Alpa') alpa++;
        }
      });

      return {
        student,
        hadir,
        sakit,
        izin,
        alpa,
        total: hadir + sakit + izin + alpa
      };
    });

    setRekapData(stats);
  };

  const loadStudentsAndAttendance = () => {
    // Load students
    let classStudents = studentService.getAllStudents().filter(s => s.class === selectedClass);
    // If exact match fails (e.g. user has '1' but students are '1A'), try startsWith
    if (classStudents.length === 0) {
        classStudents = studentService.getAllStudents().filter(s => s.class.startsWith(selectedClass.replace(/[A-Z]/g, '')));
    }
    setStudents(classStudents);

    // Load existing attendance
    let existingRecord: AttendanceRecord | undefined;
    
    if (isMapelTeacher) {
      // Use Materi & Pertemuan
      existingRecord = attendanceService.getByClassAndMaterial(selectedClass, materi, pertemuan);
    } else {
      // Use Date
      existingRecord = attendanceService.getByClassAndDate(selectedClass, date);
    }

    const newAttendance: Record<string, any> = {};
    const newNotes: Record<string, string> = {};

    if (existingRecord) {
      existingRecord.records.forEach(r => {
        newAttendance[r.studentId] = r.status;
        if (r.note) newNotes[r.studentId] = r.note;
      });
    } else {
      // Default to Hadir
      classStudents.forEach(s => {
        newAttendance[s.id] = 'Hadir';
      });
    }
    setAttendanceData(newAttendance);
    setNotes(newNotes);
  };

  const handleSave = () => {
    if (isMapelTeacher && !materi) {
      alert('Mohon isi materi terlebih dahulu');
      return;
    }

    const records = students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      status: attendanceData[s.id] || 'Hadir',
      note: notes[s.id] || ''
    }));

    let record: AttendanceRecord;

    if (isMapelTeacher) {
      record = {
        id: `${selectedClass}-${materi.replace(/\s+/g, '_')}-p${pertemuan}`,
        date: new Date().toISOString().split('T')[0], // Still track when it was last saved
        className: selectedClass,
        materi,
        pertemuan,
        records
      };
    } else {
      record = {
        id: `${selectedClass}-${date}`,
        date,
        className: selectedClass,
        records
      };
    }

    attendanceService.save(record);
    alert('Data presensi berhasil disimpan!');
    navigate('/guru');
  };

  const handleStatusChange = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleExport = () => {
    if (rekapData.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const monthName = new Date(0, rekapMonth - 1).toLocaleString('id-ID', { month: 'long' });
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Prepare Data Rows
    const dataRows = rekapData.map((row, index) => [
      index + 1,
      row.student.nis,
      row.student.name,
      row.hadir,
      row.sakit,
      row.izin,
      row.alpa,
      row.total
    ]);

    // Construct Worksheet Data (Full Grid Layout)
    const wsData = [
      ["REKAPITULASI PRESENSI SISWA"], // Row 0: Main Title (Merged A1:H1)
      [`KELAS ${selectedClass} - ${monthName.toUpperCase()} ${rekapYear}`], // Row 1: Sub Title (Merged A2:H2)
      [""], // Row 2: Spacer
      ["No", "NIS", "Nama Siswa", "Hadir", "Sakit", "Izin", "Alpa", "Total"], // Row 3: Table Headers
      ...dataRows, // Rows 4...N: Data
      [""], // Spacer after table
      ["", "Mengetahui,", "", "", "", `.............., ${dateStr}`], // Signature Header
      ["", "Kepala Sekolah", "", "", "", isMapelTeacher ? "Guru Mata Pelajaran" : "Guru Kelas"], // Signature Role
      [""], [""], [""], // Signature Space (3 rows)
      ["", "( ........................ )", "", "", "", "( ........................ )"], // Signature Name Placeholders
      ["", "NIP.", "", "", "", "NIP."] // Signature NIP
    ];

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // === STYLING ===
    // Define Styles
    const titleStyle = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      },
      fill: { fgColor: { rgb: "EEEEEE" } }
    };

    const dataCenterStyle = {
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      }
    };

    const dataLeftStyle = {
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      }
    };

    // Apply Title Styles (A1 and A2)
    if (ws['A1']) ws['A1'].s = titleStyle;
    if (ws['A2']) ws['A2'].s = titleStyle;

    // Apply Table Header Styles (Row 4, index 3)
    const headerRowIndex = 3;
    const colCount = 8; // A to H
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: c });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }

    // Apply Data Styles (Rows 5 onwards)
    const dataStartIndex = 4;
    const dataEndIndex = dataStartIndex + dataRows.length;
    
    for (let r = dataStartIndex; r < dataEndIndex; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
        // Ensure cell exists even if empty (for borders)
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        
        // Apply style: Name (col 2) is Left, others Center
        ws[cellRef].s = c === 2 ? dataLeftStyle : dataCenterStyle;
      }
    }

    // Configure Merges for Titles
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title 1 (A1:H1)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Title 2 (A2:H2)
    );

    // Configure Column Widths
    ws['!cols'] = [
      { wch: 5 },  // No (A)
      { wch: 15 }, // NIS (B)
      { wch: 35 }, // Nama (C)
      { wch: 8 },  // H (D)
      { wch: 8 },  // S (E)
      { wch: 8 },  // I (F)
      { wch: 8 },  // A (G)
      { wch: 10 }, // Total (H)
    ];

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");

    // Save File
    XLSX.writeFile(wb, `Rekap_Presensi_${selectedClass}_${monthName}_${rekapYear}.xlsx`);
  };

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => navigate('/guru')} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </button>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {viewMode === 'input' ? `Input Presensi ${isMapelTeacher ? '(Per Materi)' : '(Harian)'}` : 'Rekapitulasi Presensi'}
          </h1>
          <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('input')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'input' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Input Presensi
            </button>
            <button
              onClick={() => setViewMode('rekap')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'rekap' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rekapitulasi
            </button>
          </div>
        </div>

        {viewMode === 'input' ? (
          // === INPUT MODE ===
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {isMapelTeacher ? (
                // Form untuk Guru Mapel
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full rounded-md border p-2"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Materi Pembelajaran</label>
                    {availableMateri.length > 0 ? (
                      <select
                        value={materi}
                        onChange={(e) => setMateri(e.target.value)}
                        className="w-full rounded-md border p-2"
                      >
                        <option value="">-- Pilih Materi --</option>
                        {availableMateri.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={materi}
                        onChange={(e) => setMateri(e.target.value)}
                        placeholder="Contoh: Senam Lantai"
                        className="w-full rounded-md border p-2"
                      />
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Pertemuan Ke-</label>
                    <select
                      value={pertemuan}
                      onChange={(e) => setPertemuan(Number(e.target.value))}
                      className="w-full rounded-md border p-2"
                    >
                      {[1, 2, 3, 4].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                // Form untuk Guru Kelas (Original)
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
                    <input 
                      type="text" 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full rounded-md border p-2"
                      placeholder="Contoh: 1A"
                      readOnly // Guru kelas biasanya fix kelasnya
                    />
                  </div>
                </>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Hadir</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Sakit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Izin</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Alpa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {student.name}
                        <div className="text-xs text-gray-500">{student.nis}</div>
                      </td>
                      {['Hadir', 'Sakit', 'Izin', 'Alpa'].map((status) => (
                        <td key={status} className="whitespace-nowrap px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={attendanceData[student.id] === status}
                            onChange={() => handleStatusChange(student.id, status as any)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-6 py-4">
                        <input
                          type="text"
                          value={notes[student.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                          className="w-full rounded border border-gray-300 p-1 text-sm"
                          placeholder="Catatan..."
                        />
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada siswa ditemukan di kelas {selectedClass}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                <Save size={20} /> Simpan Presensi
              </button>
            </div>
          </>
        ) : (
          // === REKAP MODE ===
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
               <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
                {isMapelTeacher ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-md border p-2"
                    readOnly
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bulan</label>
                <select
                  value={rekapMonth}
                  onChange={(e) => setRekapMonth(Number(e.target.value))}
                  className="w-full rounded-md border p-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tahun</label>
                <select
                  value={rekapYear}
                  onChange={(e) => setRekapYear(Number(e.target.value))}
                  className="w-full rounded-md border p-2"
                >
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <FileSpreadsheet size={20} /> Download Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Hadir</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Sakit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Izin</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Alpa</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rekapData.map((row, index) => (
                    <tr key={row.student.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{row.student.nis}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{row.student.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900">{row.hadir}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-yellow-600">{row.sakit}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-blue-600">{row.izin}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-red-600">{row.alpa}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-bold text-gray-900">{row.total}</td>
                    </tr>
                  ))}
                  {rekapData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data rekapitulasi untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PresensiPage;
