import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { storageService } from '../../services/storage';
import { studentService, Student } from '../../services/studentService';
import { gradeService, GradeRecord } from '../../services/gradeService';
import { attendanceService } from '../../services/attendanceService';
import { getMateriByClass } from '../../data/materiPjok';
import { getMateriPaibpByClass } from '../../data/materiPaibp';

const PenilaianPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filter States
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [type, setType] = useState<GradeRecord['type']>('Penilaian Harian');
  const [semester, setSemester] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Mapel Teacher State (PJOK)
  const [isMapelTeacher, setIsMapelTeacher] = useState(false);
  const [materi, setMateri] = useState('');
  const [pertemuan, setPertemuan] = useState(1);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableMateri, setAvailableMateri] = useState<string[]>([]);

  // Attendance Status: studentId -> status
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});

  // Scores State: studentId -> score
  const [scores, setScores] = useState<Record<string, number>>({});

  // View Mode: 'input' | 'rekap'
  const [viewMode, setViewMode] = useState<'input' | 'rekap'>('input');
  
  // Rekap State
  const [rekapMateri, setRekapMateri] = useState<string[]>([]);
  const [rekapData, setRekapData] = useState<{
    student: Student;
    materiScores: Record<string, { NH: number; STS: number; SAS: number; NA: number }>;
    finalScore: number;
  }[]>([]);

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    const params = new URLSearchParams(location.search);
    const subjectParam = params.get('subject');
    const classParam = params.get('class');
    const typeParam = params.get('type');
    const semesterParam = params.get('semester');
    const dateParam = params.get('date');
    const materiParam = params.get('materi');
    const pertemuanParam = params.get('pertemuan');
    const viewParam = params.get('view');

    if (subjectParam) setSubject(subjectParam);
    if (semesterParam) setSemester(semesterParam);
    if (dateParam) setDate(dateParam);
    if (typeParam === 'Penilaian Harian' || typeParam === 'Penilaian STS' || typeParam === 'Penilaian SAS') {
      setType(typeParam);
    }
    if (viewParam === 'rekap' || viewParam === 'input') setViewMode(viewParam);

    const isMapel = currentUser.subRole?.includes('PJOK') || currentUser.subRole?.includes('PAIBP');
    setIsMapelTeacher(!!isMapel);

    const resolveClass = (token: string, available: string[]) => {
      const cleaned = (token || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!cleaned) return '';
      if (available.includes(cleaned)) return cleaned;
      const m = cleaned.match(/^(\d{1,2})([A-Z])?$/);
      if (!m) return '';
      const digits = m[1];
      const letter = m[2];
      if (letter && available.includes(`${digits}${letter}`)) return `${digits}${letter}`;
      const first = available.find(c => c.toUpperCase().startsWith(digits));
      if (first) return first;
      return `${digits}${letter || 'A'}`;
    };

    if (isMapel) {
       // For Mapel teachers, load available classes
       const available = storageService.getClasses();
       setAvailableClasses(available);
       if (classParam) setSelectedClass(resolveClass(classParam, available));

       // Set default subject based on role
       if (currentUser.subRole?.includes('PJOK')) setSubject('PJOK');
       if (currentUser.subRole?.includes('PAIBP')) setSubject('PAIBP'); // Assuming PAIBP is a subject option

       if (materiParam) setMateri(materiParam);
       if (pertemuanParam) {
        const n = Number(pertemuanParam);
        if (Number.isFinite(n) && n > 0) setPertemuan(n);
       }
    } else if (currentUser.subRole?.includes('Kelas')) {
      const available = storageService.getClasses();
      const classNum = currentUser.subRole.split('Kelas ')[1];
      const roleDefault = resolveClass(classNum, available);
      const paramResolved = classParam ? resolveClass(classParam, available) : '';
      setSelectedClass(paramResolved || roleDefault || (classNum ? `${classNum}A` : '1A'));
    } else {
      const available = storageService.getClasses();
      const paramResolved = classParam ? resolveClass(classParam, available) : '';
      setSelectedClass(paramResolved || '1A');
    }
  }, [navigate, location.search]);

  useEffect(() => {
    if (selectedClass) {
      if (isMapelTeacher) {
        // Load Materi if PJOK or PAIBP
        const currentUser = storageService.getCurrentUser();
        if (currentUser?.subRole?.includes('PJOK')) {
           const mat = getMateriByClass(selectedClass);
           setAvailableMateri(mat);
        } else if (currentUser?.subRole?.includes('PAIBP')) {
           const mat = getMateriPaibpByClass(selectedClass);
           setAvailableMateri(mat);
        }
      }
      loadStudentsAndScores();
    } else {
      setAvailableMateri([]);
    }
  }, [selectedClass, subject, type, semester, date, materi, pertemuan, isMapelTeacher]);

  const loadStudentsAndScores = () => {
    let classStudents = studentService.getAllStudents().filter(s => s.class === selectedClass);
    if (classStudents.length === 0) {
      classStudents = studentService.getAllStudents().filter(s => s.class.startsWith(selectedClass.replace(/[A-Z]/g, '')));
    }
    setStudents(classStudents);

    // 1. Load Attendance to check eligibility
    let attendanceMap: Record<string, string> = {};
    if (isMapelTeacher) {
      // Check by Materi & Pertemuan
      const att = attendanceService.getByClassAndMaterial(selectedClass, materi, pertemuan);
      if (att) {
        att.records.forEach(r => attendanceMap[r.studentId] = r.status);
      }
    } else {
      // Check by Date
      const att = attendanceService.getByClassAndDate(selectedClass, date);
      if (att) {
        att.records.forEach(r => attendanceMap[r.studentId] = r.status);
      }
    }
    setAttendanceStatus(attendanceMap);

    // 2. Load existing scores
    const allGrades = gradeService.getByClass(selectedClass);
    const relevantGrades = allGrades.filter(g => 
      g.subject === subject && 
      g.type === type && 
      g.semester === semester &&
      // Filter logic changes based on mode
      (isMapelTeacher ? (g.materi === materi && g.pertemuan === pertemuan) : true) 
      // Note: For class teacher, we might want to filter by date if "Harian", but typically grades are aggregated.
      // However, if we block by attendance, we imply this specific grading session is tied to that date's attendance.
      // For simplicity, let's assumes Class Teacher grades are just linked to Subject/Type/Semester, 
      // but VALIDATION is done against the selected DATE's attendance.
    );

    const newScores: Record<string, number> = {};
    relevantGrades.forEach(g => {
      newScores[g.studentId] = g.score;
    });
    setScores(newScores);
  };

  useEffect(() => {
    if (viewMode === 'rekap' && selectedClass) {
      calculateRekap();
    }
  }, [viewMode, selectedClass, subject, semester]); // Removed 'type' from dependency as we want all types

  const calculateRekap = () => {
    // 1. Get Students
    let classStudents = studentService.getAllStudents().filter(s => s.class === selectedClass);
    if (classStudents.length === 0) {
      classStudents = studentService.getAllStudents().filter(s => s.class.startsWith(selectedClass.replace(/[A-Z]/g, '')));
    }

    // 2. Get All Grades for Class, Subject, Semester (Ignore Type)
    const allGrades = gradeService.getByClass(selectedClass).filter(g => 
      g.subject === subject && 
      g.semester === semester
    );

    // 3. Determine Materis
    let materis: string[] = [];
    if (isMapelTeacher) {
       // Group by Materi from PH records
       materis = Array.from(new Set(allGrades.filter(g => g.materi).map(g => g.materi!))).sort();
    } else {
       // For Class Teacher, fallback to grouping by Date as "Materi"
       materis = Array.from(new Set(allGrades.filter(g => g.date).map(g => g.date))).sort();
    }

    setRekapMateri(materis);

    // 4. Map Data
    const data = classStudents.map(student => {
      const studentGrades = allGrades.filter(g => g.studentId === student.id);
      const materiScores: Record<string, { NH: number; STS: number; SAS: number; NA: number }> = {};
      let totalNASum = 0;
      let totalNACount = 0;

      materis.forEach(mat => {
        // Filter grades for this Materi (or Date for class teacher)
        const phGrades = studentGrades.filter(g => 
          g.type === 'Penilaian Harian' && 
          (isMapelTeacher ? g.materi === mat : g.date === mat)
        );

        const stsGrade = studentGrades.find(g => 
          g.type === 'Penilaian STS' && 
          (isMapelTeacher ? g.materi === mat : g.date === mat)
        );

        const sasGrade = studentGrades.find(g => 
          g.type === 'Penilaian SAS' && 
          (isMapelTeacher ? g.materi === mat : g.date === mat)
        );

        // Calculate NH (Average of PHs)
        let nhVal = 0;
        if (phGrades.length > 0) {
          const sum = phGrades.reduce((a, b) => a + b.score, 0);
          nhVal = Number((sum / phGrades.length).toFixed(2));
        }

        const stsVal = stsGrade ? stsGrade.score : 0;
        const sasVal = sasGrade ? sasGrade.score : 0;

        // Calculate NA per Materi: Average of existing components
        let components = 0;
        let sum = 0;
        
        if (phGrades.length > 0) { sum += nhVal; components++; }
        if (stsGrade) { sum += stsVal; components++; }
        if (sasGrade) { sum += sasVal; components++; }
        
        const naVal = components > 0 ? Number((sum / components).toFixed(2)) : 0;

        materiScores[mat] = {
          NH: nhVal,
          STS: stsVal,
          SAS: sasVal,
          NA: naVal
        };

        if (components > 0) {
            totalNASum += naVal;
            totalNACount++;
        }
      });

      const finalScore = totalNACount > 0 ? Number((totalNASum / totalNACount).toFixed(2)) : 0;

      return {
        student,
        materiScores,
        finalScore
      };
    });

    setRekapData(data);
  };

  const handleExport = () => {
    if (rekapData.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Header Row 1: No, NIS, Nama, [Materi Merged], N. AKHIR
    const headerRow1 = ["No", "NIS", "Nama Siswa"];
    rekapMateri.forEach(mat => {
      headerRow1.push(mat, "", "", ""); // Placeholder for merge
    });
    headerRow1.push("N. AKHIR");

    // Header Row 2: "", "", "", [NH, STS, SAS, NA]..., ""
    const headerRow2 = ["", "", ""];
    rekapMateri.forEach(() => {
      headerRow2.push("NH", "STS", "SAS", "NA");
    });
    headerRow2.push("");

    // Data Rows
    const dataRows = rekapData.map((row, index) => {
      const rowVals = [
        index + 1,
        row.student.nis,
        row.student.name
      ];
      rekapMateri.forEach(mat => {
        const scores = row.materiScores[mat];
        rowVals.push(
          scores.NH || "", 
          scores.STS || "", 
          scores.SAS || "", 
          scores.NA || ""
        );
      });
      rowVals.push(row.finalScore);
      return rowVals;
    });

    // Construct Worksheet Data
    const wsData = [
      [`REKAPITULASI PENILAIAN`],
      [`KELAS ${selectedClass} - MATA PELAJARAN ${subject.toUpperCase()} - SEMESTER ${semester}`],
      [""],
      headerRow1,
      headerRow2,
      ...dataRows,
      [""],
      // Signature Section
    ];
    
    const totalCols = 4 + (rekapMateri.length * 4);
    
    // Signature
    const sigRow1 = ["", "Mengetahui,", "", ...Array(totalCols - 5).fill(""), `.............., ${dateStr}`, ""];
    const sigRow2 = ["", "Kepala Sekolah", "", ...Array(totalCols - 5).fill(""), isMapelTeacher ? "Guru Mata Pelajaran" : "Guru Kelas", ""];
    const sigRowSpacer = ["", "", "", ...Array(totalCols - 5).fill(""), "", ""];
    const sigRow3 = ["", "( ........................ )", "", ...Array(totalCols - 5).fill(""), "( ........................ )", ""];
    const sigRow4 = ["", "NIP.", "", ...Array(totalCols - 5).fill(""), "NIP.", ""];

    wsData.push(sigRow1, sigRow2, sigRowSpacer, sigRowSpacer, sigRowSpacer, sigRow3, sigRow4);

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // === STYLING ===
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

    // Apply Title Styles
    if (ws['A1']) ws['A1'].s = titleStyle;
    if (ws['A2']) ws['A2'].s = titleStyle;

    // Apply Header Styles (Rows 4 & 5)
    // Row 4 (Index 3)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = headerStyle;
    }
    // Row 5 (Index 4)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = headerStyle;
    }

    // Apply Data Styles
    const dataStartIndex = 5;
    const dataEndIndex = dataStartIndex + dataRows.length;
    
    for (let r = dataStartIndex; r < dataEndIndex; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        ws[cellRef].s = c === 2 ? dataLeftStyle : dataCenterStyle;
      }
    }

    // Configure Merges
    if (!ws['!merges']) ws['!merges'] = [];
    const merges = ws['!merges']!;
    
    // Title Merges
    merges.push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }
    );

    // Header Merges
    // No, NIS, Nama (Row 3-4 Merged Vertically)
    merges.push(
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // No
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // NIS
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }  // Nama
    );
    
    // Materi Headers (Row 3 Merged Horizontally across 4 cols)
    let colIdx = 3;
    rekapMateri.forEach(() => {
      merges.push({ s: { r: 3, c: colIdx }, e: { r: 3, c: colIdx + 3 } });
      colIdx += 4;
    });

    // N. AKHIR (Row 3-4 Merged Vertically)
    merges.push(
      { s: { r: 3, c: totalCols - 1 }, e: { r: 4, c: totalCols - 1 } }
    );

    // Configure Column Widths
    const cols = [
      { wch: 5 },  // No
      { wch: 15 }, // NIS
      { wch: 35 }, // Nama
    ];
    // Dynamic Cols (4 per Materi)
    rekapMateri.forEach(() => {
      cols.push({ wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }); // NH, STS, SAS, NA
    });
    cols.push({ wch: 10 }); // N. AKHIR

    ws['!cols'] = cols;

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");

    // Save File
    XLSX.writeFile(wb, `Rekap_Nilai_${selectedClass}_${subject}_${semester}.xlsx`);
  };

  const handleSave = () => {
    if (isMapelTeacher && !materi) {
      alert('Mohon pilih materi terlebih dahulu');
      return;
    }

    const allGrades = gradeService.getAll();
    
    students.forEach(student => {
      // Skip if student is not present
      if (attendanceStatus && attendanceStatus[student.id] && attendanceStatus[student.id] !== 'Hadir') {
        return;
      }

      const scoreVal = scores[student.id];
      if (scoreVal !== undefined && scoreVal !== null) {
        // Check if record exists
        const existingIndex = allGrades.findIndex(g => 
          g.studentId === student.id &&
          g.subject === subject &&
          g.type === type &&
          g.semester === semester &&
          (isMapelTeacher ? (g.materi === materi && g.pertemuan === pertemuan) : true)
        );

        const recordData: GradeRecord = {
          id: existingIndex >= 0 ? allGrades[existingIndex].id : Date.now().toString() + Math.random(),
          studentId: student.id,
          studentName: student.name,
          className: selectedClass,
          subject,
          type,
          score: Number(scoreVal),
          date,
          semester,
          materi: isMapelTeacher ? materi : undefined,
          pertemuan: isMapelTeacher ? pertemuan : undefined
        };

        if (existingIndex >= 0) {
          gradeService.update(recordData);
        } else {
          gradeService.add(recordData);
        }
      }
    });

    alert('Nilai berhasil disimpan!');
    navigate('/guru');
  };

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => navigate('/guru')} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </button>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Penilaian Siswa</h1>

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            className={`px-4 py-2 font-medium ${viewMode === 'input' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('input')}
          >
            Input Nilai
          </button>
          <button
            className={`px-4 py-2 font-medium ${viewMode === 'rekap' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('rekap')}
          >
            Rekap Nilai
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {/* Class Selection */}
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

          {/* Mapel Teacher Inputs - ONLY IN INPUT MODE */}
          {isMapelTeacher && viewMode === 'input' && (
            <>
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
          )}

          {/* Class Teacher Inputs */}
          {!isMapelTeacher && (
            <>
              {/* Date - ONLY IN INPUT MODE */}
              {viewMode === 'input' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border p-2"
                  />
                </div>
              )}
              {/* Subject - ALWAYS VISIBLE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border p-2"
                >
                  <option>Matematika</option>
                  <option>Bahasa Indonesia</option>
                  <option>IPA</option>
                  <option>IPS</option>
                  <option>PPKn</option>
                  <option>PJOK</option>
                  <option>Seni Budaya</option>
                </select>
              </div>
            </>
          )}

          {viewMode === 'input' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Penilaian</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-md border p-2"
              >
                <option>Penilaian Harian</option>
                <option>Penilaian STS</option>
                <option>Penilaian SAS</option>
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full rounded-md border p-2"
            >
              <option>1</option>
              <option>2</option>
            </select>
          </div>
        </div>

        {viewMode === 'input' ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama Siswa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{student.nis}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {attendanceStatus[student.id] && attendanceStatus[student.id] !== 'Hadir' ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                            Tidak Hadir ({attendanceStatus[student.id]})
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={scores[student.id] ?? ''}
                            onChange={(e) => setScores(prev => ({ ...prev, [student.id]: e.target.value === '' ? undefined : Number(e.target.value) } as any))}
                            className={`w-24 rounded border border-gray-300 p-2 text-center font-bold ${
                              (scores[student.id] !== undefined && scores[student.id] <= 75)
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}
                            placeholder="0"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
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
                <Save size={20} /> Simpan Nilai
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border">No</th>
                    <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border">NIS</th>
                    <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border">Nama Siswa</th>
                    {rekapMateri.map((mat, idx) => (
                      <th key={idx} colSpan={4} className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 border">
                        {mat}
                      </th>
                    ))}
                    <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 border">N. AKHIR</th>
                  </tr>
                  <tr>
                    {rekapMateri.map((_, idx) => (
                      <React.Fragment key={idx}>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 border">NH</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 border">STS</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 border">SAS</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 border bg-gray-100">NA</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rekapData.map((row, index) => (
                    <tr key={row.student.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 border">{index + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 border">{row.student.nis}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 border">{row.student.name}</td>
                      {rekapMateri.map((mat, idx) => {
                         const scores = row.materiScores[mat] || { NH: 0, STS: 0, SAS: 0, NA: 0 };
                         return (
                          <React.Fragment key={idx}>
                            <td className="whitespace-nowrap px-2 py-4 text-center text-sm text-gray-900 border">{scores.NH || '-'}</td>
                            <td className="whitespace-nowrap px-2 py-4 text-center text-sm text-gray-900 border">{scores.STS || '-'}</td>
                            <td className="whitespace-nowrap px-2 py-4 text-center text-sm text-gray-900 border">{scores.SAS || '-'}</td>
                            <td className="whitespace-nowrap px-2 py-4 text-center text-sm font-bold text-gray-900 border bg-gray-50">{scores.NA || '-'}</td>
                          </React.Fragment>
                         );
                      })}
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-bold text-blue-600 border">
                        {row.finalScore}
                      </td>
                    </tr>
                  ))}
                  {rekapData.length === 0 && (
                    <tr>
                      <td colSpan={4 + (rekapMateri.length * 4)} className="px-6 py-4 text-center text-gray-500 border">
                        Tidak ada data rekap untuk filter ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700"
              >
                <FileSpreadsheet size={20} /> Download Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PenilaianPage;
