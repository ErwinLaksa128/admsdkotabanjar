import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, File as FileIcon, Save, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, SupervisionReport, storageService, isUserOnline, SchoolVisit } from '../services/storage';
import { ADMINISTRATION_OBSERVATION_INSTRUMENT, PLANNING_OBSERVATION_INSTRUMENT, PELAKSANAAN_OBSERVATION_INSTRUMENT, ADMIN_DOCS, MANAJERIAL_DOCS, KEWIRAUSAHAAN_DOCS, SUPERVISI_EVIDENCE_DOCS } from '../constants/documents';
import RunningText from '../components/RunningText';
import { firebaseService } from '../services/firebaseService';

export const KSPlanningDeepList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supervisions, setSupervisions] = useState<Record<string, SupervisionReport[]>>({});

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();

    if (currentUser && currentUser.school) {
      // Initial Load from Local Storage (for instant render)
      const allUsers = storageService.getUsers();
      const localTeachers = allUsers.filter((u: User) => 
        u.role === 'guru' && 
        u.active && 
        u.school?.toLowerCase() === currentUser.school?.toLowerCase()
      );
      setTeachers(localTeachers);

      // Subscribe to Users (Realtime)
      const unsubscribeUsers = firebaseService.subscribeUsers((users) => {
        const schoolTeachers = users.filter((u: User) => 
            u.role === 'guru' && 
            u.active && 
            u.school?.toLowerCase() === currentUser.school?.toLowerCase()
        );
        setTeachers(schoolTeachers);
      });

      // Subscribe to Supervisions (Realtime)
      const unsubscribeSups = firebaseService.subscribeSupervisionsBySchool(currentUser.school, (reports) => {
        const supData: Record<string, SupervisionReport[]> = {};
        // Initialize for all known teachers to ensure empty arrays
        localTeachers.forEach(t => supData[t.nip] = []);
        
        reports.forEach(r => {
            if (r.type === 'planning_deep') {
                if (!supData[r.teacherNip]) supData[r.teacherNip] = [];
                supData[r.teacherNip].push(r);
            }
        });
        
        // Sort by date
        Object.keys(supData).forEach(nip => {
            supData[nip].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        
        setSupervisions(supData);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeSups();
      };
    }
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/kepala-sekolah')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        <h1 className="text-xl font-bold text-gray-800">Observasi Pembelajaran</h1>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher: User) => {
          const teacherSupervisions = supervisions[teacher.nip] || [];
          const lastSupervision = teacherSupervisions.length > 0 ? teacherSupervisions[teacherSupervisions.length - 1] : null;

          return (
            <div key={teacher.nip} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">NIP: {teacher.nip}</p>
                </div>
              </div>

              <div className="text-right">
                {lastSupervision ? (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Terakhir: {lastSupervision.date}</span>
                    <div className="text-sm font-semibold text-green-600">Skor: {lastSupervision.finalScore.toFixed(1)}%</div>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-gray-400">Belum ada data</div>
                )}
                
                <button 
                  onClick={() => navigate(`/kepala-sekolah/perencanaan/${teacher.nip}`)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {lastSupervision ? 'Lihat / Edit' : 'Input Supervisi'}
                </button>
              </div>
            </div>
          );
        })}

        {teachers.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Tidak ada data guru.
          </div>
        )}
      </div>
    </div>
  );
};

export const KSPelaksanaanList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supervisions, setSupervisions] = useState<Record<string, SupervisionReport[]>>({});

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();

    if (currentUser && currentUser.school) {
      // Initial Load
      const allUsers = storageService.getUsers();
      const localTeachers = allUsers.filter((u: User) => 
        u.role === 'guru' && 
        u.active && 
        u.school?.toLowerCase() === currentUser.school?.toLowerCase()
      );
      setTeachers(localTeachers);

      // Subscribe to Users
      const unsubscribeUsers = firebaseService.subscribeUsers((users) => {
        const schoolTeachers = users.filter((u: User) => 
            u.role === 'guru' && 
            u.active && 
            u.school?.toLowerCase() === currentUser.school?.toLowerCase()
        );
        setTeachers(schoolTeachers);
      });

      // Subscribe to Supervisions
      const unsubscribeSups = firebaseService.subscribeSupervisionsBySchool(currentUser.school, (reports) => {
        const supData: Record<string, SupervisionReport[]> = {};
        // Initialize
        localTeachers.forEach(t => supData[t.nip] = []);
        
        reports.forEach(r => {
            if (r.type === 'observation') {
                if (!supData[r.teacherNip]) supData[r.teacherNip] = [];
                supData[r.teacherNip].push(r);
            }
        });
        
        // Sort
        Object.keys(supData).forEach(nip => {
            supData[nip].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        
        setSupervisions(supData);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeSups();
      };
    }
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/kepala-sekolah')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        <h1 className="text-xl font-bold text-gray-800">Observasi Pelaksanaan Pembelajaran</h1>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher: User) => {
          const teacherSupervisions = supervisions[teacher.nip] || [];
          const lastSupervision = teacherSupervisions.length > 0 ? teacherSupervisions[teacherSupervisions.length - 1] : null;
          return (
            <div key={teacher.nip} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">NIP: {teacher.nip}</p>
                </div>
              </div>
              <div className="text-right">
                {lastSupervision ? (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Terakhir: {lastSupervision.date}</span>
                    <div className="text-sm font-semibold text-green-600">Skor: {lastSupervision.finalScore.toFixed(1)}%</div>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-gray-400">Belum ada data</div>
                )}
                <button 
                  onClick={() => navigate(`/kepala-sekolah/pelaksanaan/${teacher.nip}`)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {lastSupervision ? 'Lihat / Edit' : 'Input Supervisi'}
                </button>
              </div>
            </div>
          );
        })}
        {teachers.length === 0 && (
          <div className="text-center py-10 text-gray-500">Tidak ada data guru.</div>
        )}
      </div>
    </div>
  );
};

export const KSPelaksanaanForm = () => {
  const { nip } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState('Ganjil');
  const [year, setYear] = useState('2024/2025');
  const [observation, setObservation] = useState('');
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [conclusion, setConclusion] = useState('');

  // New Fields matching KSPlanningDeepForm
  const [subject, setSubject] = useState('');
  const [materi, setMateri] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const allUsers = storageService.getUsers();
    const t = allUsers.find(u => u.nip === nip);
    if (t) setTeacher(t);

    const curr = storageService.getCurrentUser();
    if (curr) setCurrentUser(curr);

    if (nip) {
      const existing = storageService.getSupervisions(nip);
      const observations = existing.filter((s: SupervisionReport) => s.type === 'observation');
      if (observations.length > 0) {
        const last = observations[observations.length - 1];
        setDate(last.date);
        setSemester(last.semester);
        setYear(last.year);
        setScores(last.scores);
        if (last.notes?.umum) setNotes(last.notes.umum);
        if (last.notes?.pelaksanaan) setObservation(last.notes.pelaksanaan);
        if (last.conclusion) setConclusion(last.conclusion);
        if (last.subject) setSubject(last.subject);
        if (last.topic) setMateri(last.topic);
        if (last.grade) setGrade(last.grade);
      }
    }
  }, [nip]);

  const handleScoreChange = (id: string, score: number) => {
    setScores(prev => ({ ...prev, [id]: score }));
  };

  const calculateTotal = () => {
    let total = 0;
    PELAKSANAAN_OBSERVATION_INSTRUMENT.forEach(group => {
      group.sections.forEach(section => {
        section.items.forEach(item => {
          total += scores[item.id] || 0;
        });
      });
    });
    return total;
  };

  const maxScore = (() => {
    let count = 0;
    PELAKSANAAN_OBSERVATION_INSTRUMENT.forEach(group => {
      group.sections.forEach(section => {
        count += section.items.length;
      });
    });
    return count * 4;
  })();

  const calculatePercentage = () => {
    const total = calculateTotal();
    return (total / maxScore) * 100;
  };

  const handleSave = () => {
    if (!teacher || !nip) return;
    const report: SupervisionReport = {
      id: `${nip}_${date}_observation`,
      teacherNip: nip,
      teacherName: teacher.name,
      date,
      semester,
      year,
      scores,
      notes: { umum: notes, pelaksanaan: observation },
      conclusion,
      followUp: '',
      finalScore: calculatePercentage(),
      type: 'observation',
      subject,
      topic: materi,
      grade
    };
    storageService.saveSupervision(report);
    firebaseService.saveSupervision({ ...report, school: teacher.school || '' });
    alert('Observasi pelaksanaan berhasil disimpan!');
    navigate('/kepala-sekolah/pelaksanaan');
  };

  const generatePDF = () => {
    if (!teacher || !currentUser) return;

    const createPDF = (logoImg?: HTMLImageElement) => {
      const doc = new jsPDF();
      
      // Logo & Header
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMERINTAH KOTA BANJAR', 115, 15, { align: 'center' });
      doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 115, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104', 115, 28, { align: 'center' });
      doc.line(20, 32, 190, 32);

      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INSTRUMEN SUPERVISI', 105, 40, { align: 'center' });
      doc.text('PELAKSANAAN PEMBELAJARAN', 105, 46, { align: 'center' });

      // Identity
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 60;
      const xLabel = 20;
      const xSep = 60;
      const xVal = 65;

      doc.text('Nama Satuan Pendidikan', xLabel, y); doc.text(':', xSep, y); doc.text(teacher.school || '-', xVal, y); y += 6;
      doc.text('Nama Guru', xLabel, y); doc.text(':', xSep, y); doc.text(teacher.name, xVal, y); y += 6;
      doc.text('Kelas/Semester', xLabel, y); doc.text(':', xSep, y); doc.text(`${grade} / ${semester}`, xVal, y); y += 6;
      doc.text('Mata Pelajaran', xLabel, y); doc.text(':', xSep, y); doc.text(subject, xVal, y); y += 6;
      doc.text('Materi', xLabel, y); doc.text(':', xSep, y); doc.text(materi, xVal, y); y += 6;
      doc.text('Hari/Tanggal', xLabel, y); doc.text(':', xSep, y); doc.text(new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), xVal, y); y += 10;

      // Table Body
      const tableBody: any[] = [];
      PELAKSANAAN_OBSERVATION_INSTRUMENT.forEach(group => {
        tableBody.push([{ content: group.title, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        group.sections.forEach(section => {
          tableBody.push([{ content: section.title, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }]);
          section.items.forEach((item) => {
             const score = scores[item.id] || 0;
             tableBody.push([
               item.id,
               item.text,
               score === 1 ? 'V' : '',
               score === 2 ? 'V' : '',
               score === 3 ? 'V' : '',
               score === 4 ? 'V' : ''
             ]);
          });
        });
      });

      // Summary
      const totalScore = calculateTotal();
      const percentage = calculatePercentage();
      const qualification = percentage >= 91 ? 'Sangat Baik' : percentage >= 81 ? 'Baik' : percentage >= 70 ? 'Cukup' : 'Kurang';

      tableBody.push([
        { content: 'JUMLAH SKOR', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: totalScore.toString(), colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: `TOTAL SKOR (Max ${maxScore})`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: maxScore.toString(), colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: 'NILAI', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: percentage.toFixed(2), colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: 'KUALIFIKASI', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: qualification, colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);

      autoTable(doc, {
        startY: y,
        head: [[
          { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'URAIAN KEGIATAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'KRITERIA NILAI', colSpan: 4, styles: { halign: 'center', valign: 'middle' } }
        ], [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } }
        ]],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 110 },
            2: { cellWidth: 10, halign: 'center' },
            3: { cellWidth: 10, halign: 'center' },
            4: { cellWidth: 10, halign: 'center' },
            5: { cellWidth: 10, halign: 'center' }
        },
        headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: [0, 0, 0] },
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY + 10;

      // Observasi Kelas (Catatan Tambahan)
      if (observation) {
        if (finalY > 230) { doc.addPage(); finalY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text('Observasi Kelas (Catatan Tambahan) :', 20, finalY);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(observation, 170);
        doc.text(obsLines, 20, finalY + 5);
        finalY += 10 + (obsLines.length * 5);
      }

      // Catatan Umum
      if (notes) {
        if (finalY > 230) { doc.addPage(); finalY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text('Catatan Umum :', 20, finalY);
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(notes, 170);
        doc.text(noteLines, 20, finalY + 5);
        finalY += 10 + (noteLines.length * 5);
      }

      // Saran Pembinaan
      if (finalY > 230) { doc.addPage(); finalY = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Saran Pembinaan :', 20, finalY);
      doc.setFont('helvetica', 'normal');
      const saranLines = doc.splitTextToSize(conclusion || '-', 170);
      doc.text(saranLines, 20, finalY + 5);
      finalY += 15 + (saranLines.length * 5);

      // Signatures
      if (finalY > 250) { doc.addPage(); finalY = 20; }

      const dateStr = `Banjar, ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      
      doc.text('Guru,', 40, finalY, { align: 'center' });
      doc.text(dateStr, 150, finalY, { align: 'center' });
      doc.text('Kepala Sekolah,', 150, finalY + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.text(teacher.name, 40, finalY + 30, { align: 'center' });
      doc.text(currentUser.name, 150, finalY + 30, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${teacher.nip}`, 40, finalY + 35, { align: 'center' });
      doc.text(`NIP. ${currentUser.nip}`, 150, finalY + 35, { align: 'center' });

      doc.save(`Supervisi_Pelaksanaan_${teacher.name}_${date}.pdf`);
    };

    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createPDF(img);
    img.onerror = () => createPDF();
  };

  if (!teacher) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg rounded-lg print:shadow-none print:p-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate('/kepala-sekolah/pelaksanaan')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex gap-2">
          <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            <FileIcon size={20} /> PDF
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
            <Save size={20} /> Simpan
          </button>
        </div>
      </div>

      {/* Header Form */}
      <div className="flex items-center justify-center gap-4 mb-6 border-b pb-4 relative">
        <img src="/logo.png" alt="Logo Pemkot" className="w-20 h-auto absolute left-4 top-0" />
        <div className="text-center w-full pl-20 pr-4">
          <h2 className="text-lg font-bold uppercase">Pemerintah Kota Banjar</h2>
          <h1 className="text-xl font-bold uppercase">Dinas Pendidikan dan Kebudayaan</h1>
          <p className="text-xs italic">Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104 Kota Banjar 46311</p>
          <p className="text-xs">Fax. (0265) 2731304 Email: disdik_ktb@yahoo.com</p>
          
          <div className="mt-4 border-t-2 border-black pt-2">
            <h3 className="text-lg font-bold uppercase">INSTRUMEN SUPERVISI</h3>
            <h3 className="text-lg font-bold uppercase">PELAKSANAAN PEMBELAJARAN</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[180px_10px_1fr] gap-y-2 mb-6 text-sm">
        <div>Nama Satuan Pendidikan</div><div>:</div><div>{teacher.school}</div>
        <div>Nama Guru</div><div>:</div><div>{teacher.name}</div>
        
        <div>Kelas/Semester</div><div>:</div>
        <div>
            <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: IV / Ganjil" />
        </div>

        <div>Mata Pelajaran</div><div>:</div>
        <div>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: Matematika" />
        </div>

        <div>Materi</div><div>:</div>
        <div>
            <input type="text" value={materi} onChange={e => setMateri(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: Pecahan" />
        </div>

        <div>Hari/Tanggal</div><div>:</div>
        <div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-b border-gray-400 focus:outline-none px-2" />
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-800 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th rowSpan={2} className="border border-gray-800 p-2 w-10">No</th>
              <th rowSpan={2} className="border border-gray-800 p-2 text-center">URAIAN KEGIATAN</th>
              <th colSpan={4} className="border border-gray-800 p-2 text-center">KRITERIA NILAI</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-800 p-1 w-10 text-center">1</th>
              <th className="border border-gray-800 p-1 w-10 text-center">2</th>
              <th className="border border-gray-800 p-1 w-10 text-center">3</th>
              <th className="border border-gray-800 p-1 w-10 text-center">4</th>
            </tr>
          </thead>
          <tbody>
            {PELAKSANAAN_OBSERVATION_INSTRUMENT.map((group, gIdx) => (
              <>
                <tr key={`g-${gIdx}`} className="bg-gray-100 font-bold">
                  <td colSpan={6} className="border border-gray-800 p-2">{group.title}</td>
                </tr>
                {group.sections.map((section, sIdx) => (
                  <>
                    <tr key={`s-${gIdx}-${sIdx}`} className="bg-gray-50">
                      <td colSpan={6} className="border border-gray-800 p-2 font-semibold">{section.title}</td>
                    </tr>
                    {section.items.map(item => {
                      const score = scores[item.id] || 0;
                      return (
                        <tr key={item.id}>
                          <td className="border border-gray-800 p-2 text-center">{item.id}</td>
                          <td className="border border-gray-800 p-2 whitespace-pre-wrap">{item.text}</td>
                          {[1,2,3,4].map(val => (
                            <td
                              key={val}
                              className={`border border-gray-800 p-2 text-center cursor-pointer hover:bg-blue-50 ${score === val ? 'bg-blue-100' : ''}`}
                              onClick={() => handleScoreChange(item.id, val)}
                            >
                              {score === val ? 'V' : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </>
            ))}

            <tr className="font-bold">
              <td colSpan={2} className="border border-gray-800 p-2 text-right">JUMLAH SKOR</td>
              <td colSpan={4} className="border border-gray-800 p-2 text-center">{calculateTotal()}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={2} className="border border-gray-800 p-2 text-right">TOTAL SKOR (Max {maxScore})</td>
              <td colSpan={4} className="border border-gray-800 p-2 text-center">{maxScore}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={2} className="border border-gray-800 p-2 text-right">NILAI</td>
              <td colSpan={4} className="border border-gray-800 p-2 text-center">{calculatePercentage().toFixed(2)}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={2} className="border border-gray-800 p-2 text-right">KUALIFIKASI</td>
              <td colSpan={4} className="border border-gray-800 p-2 text-center">
                {(() => {
                  const p = calculatePercentage();
                  if (p >= 91) return 'Sangat Baik';
                  if (p >= 81) return 'Baik';
                  if (p >= 70) return 'Cukup';
                  return 'Kurang';
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Observasi Kelas (Catatan Tambahan)</label>
        <textarea className="w-full border rounded p-2 min-h-[120px]" value={observation} onChange={e => setObservation(e.target.value)} placeholder="Deskripsikan pelaksanaan pembelajaran jika ada catatan tambahan" />
      </div>
      <div className="mb-6">
        <label className="block font-medium mb-1">Catatan Umum</label>
        <textarea className="w-full border rounded p-2 min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan atau rekomendasi" />
      </div>
      <div className="mb-6">
        <label className="block font-medium mb-1">Saran Pembinaan</label>
        <textarea className="w-full border rounded p-2 min-h-[80px]" value={conclusion} onChange={e => setConclusion(e.target.value)} placeholder="Saran pembinaan" />
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-20 text-sm">
        <div className="text-center mt-8">
          <p className="mb-20">Guru,</p>
          <p className="font-bold underline">{teacher.name}</p>
          <p>NIP. {teacher.nip}</p>
        </div>
        <div className="text-center">
          <p className="mb-1">Banjar, .......................... 2025</p>
          <p className="mb-20">Kepala Sekolah,</p>
          <p className="font-bold underline">{currentUser?.name || '...................'}</p>
          <p>NIP. {currentUser?.nip || '...................'}</p>
        </div>
      </div>
    </div>
  );
};

export const KSReportsPage = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supervisions, setSupervisions] = useState<Record<string, SupervisionReport[]>>({});

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();

    if (currentUser && currentUser.school) {
      // Initial Load
      const allUsers = storageService.getUsers();
      const localTeachers = allUsers.filter((u: User) => 
        u.role === 'guru' && 
        u.active && 
        u.school?.toLowerCase() === currentUser.school?.toLowerCase()
      );
      setTeachers(localTeachers);

      // Subscribe to Users
      const unsubscribeUsers = firebaseService.subscribeUsers((users) => {
        const schoolTeachers = users.filter((u: User) => 
            u.role === 'guru' && 
            u.active && 
            u.school?.toLowerCase() === currentUser.school?.toLowerCase()
        );
        setTeachers(schoolTeachers);
      });

      // Subscribe to Supervisions
      const unsubscribeSups = firebaseService.subscribeSupervisionsBySchool(currentUser.school, (reports) => {
        const supData: Record<string, SupervisionReport[]> = {};
        // Initialize
        localTeachers.forEach(t => supData[t.nip] = []);
        
        reports.forEach(r => {
            if (r.type === 'administration') {
                if (!supData[r.teacherNip]) supData[r.teacherNip] = [];
                supData[r.teacherNip].push(r);
            }
        });
        
        // Sort
        Object.keys(supData).forEach(nip => {
            supData[nip].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        
        setSupervisions(supData);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeSups();
      };
    }
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/kepala-sekolah')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        <h1 className="text-xl font-bold text-gray-800">Laporan Instrumen Supervisi</h1>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher: User) => {
          const teacherSupervisions = supervisions[teacher.nip] || [];
          const lastSupervision = teacherSupervisions.length > 0 ? teacherSupervisions[teacherSupervisions.length - 1] : null;
          return (
            <div key={teacher.nip} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">NIP: {teacher.nip}</p>
                </div>
              </div>
              <div className="text-right">
                {lastSupervision ? (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Terakhir: {lastSupervision.date}</span>
                    <div className="text-sm font-semibold text-green-600">Skor: {lastSupervision.finalScore.toFixed(1)}%</div>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-gray-400">Belum ada data</div>
                )}
                <button 
                  onClick={() => navigate(`/kepala-sekolah/laporan/${teacher.nip}`)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {lastSupervision ? 'Lihat / Edit' : 'Input Supervisi'}
                </button>
              </div>
            </div>
          );
        })}
        {teachers.length === 0 && (
          <div className="text-center py-10 text-gray-500">Tidak ada data guru.</div>
        )}
      </div>
    </div>
  );
};

export const KSReportForm = () => {
  const { nip } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState('Ganjil');
  const [year, setYear] = useState('2025/2026');
  
  // New Fields
  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('');
  
  // Instrument State
  const [conditions, setConditions] = useState<Record<string, boolean>>({}); // true = Ada, false = Tidak
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const [conclusion, setConclusion] = useState('');
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    const allUsers = storageService.getUsers();
    const t = allUsers.find(u => u.nip === nip);
    if (t) {
      setTeacher(t);
      if (t.school) setSchoolName(t.school);
    }
    
    const curr = storageService.getCurrentUser();
    if (curr) setCurrentUser(curr);

    // Load existing data if any
    if (nip) {
      const existing = storageService.getSupervisions(nip);
      const reports = existing.filter((s: SupervisionReport) => s.type === 'administration');
      if (reports.length > 0) {
        const last = reports[reports.length - 1];
        setDate(last.date);
        setSemester(last.semester);
        setYear(last.year);
        setScores(last.scores || {});
        // Load other fields if stored in notes/custom fields
        // Assuming conditions stored in notes for now or we need to update type
        if (last.notes && last.notes.conditions) {
            try {
                setConditions(JSON.parse(last.notes.conditions));
            } catch (e) {
                setConditions({});
            }
        }
        if (last.notes && last.notes.grade) setGrade(last.notes.grade);
        setConclusion(last.conclusion || '');
        setFollowUp(last.followUp || '');
      }
    }
  }, [nip]);

  const handleConditionChange = (item: string, value: boolean) => {
    setConditions(prev => ({ ...prev, [item]: value }));
  };

  const handleScoreChange = (item: string, value: number) => {
    setScores(prev => ({ ...prev, [item]: value }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(scores).forEach(val => total += val);
    return total;
  };

  const maxScore = ADMINISTRATION_OBSERVATION_INSTRUMENT.length * 4;

  const calculatePercentage = () => {
    const total = calculateTotal();
    if (maxScore === 0) return 0;
    return (total / maxScore) * 100;
  };

  const handleSave = () => {
    if (!teacher || !nip) return;
    const percentage = calculatePercentage();
    
    const report: SupervisionReport = {
      id: `${nip}_${date}_administration`,
      teacherNip: nip,
      teacherName: teacher.name,
      date,
      semester,
      year,
      scores,
      notes: { 
          conditions: JSON.stringify(conditions),
          grade
      },
      conclusion,
      followUp,
      finalScore: percentage,
      type: 'administration'
    };
    storageService.saveSupervision(report);
    if (teacher.school) {
        firebaseService.saveSupervision({ ...report, school: teacher.school });
    }
    alert('Laporan instrumen supervisi berhasil disimpan!');
    navigate('/kepala-sekolah/laporan');
  };

  const generatePDF = () => {
    if (!teacher || !currentUser) return;

    const createPDF = (logoImg?: HTMLImageElement) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 10, 20, 20);
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMERINTAH KOTA BANJAR', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(16);
      doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104', pageWidth / 2, 28, { align: 'center' });
      doc.text('e-mail: disdik_ktjrptrom@yahoo.com', pageWidth / 2, 33, { align: 'center' });
      doc.line(10, 36, pageWidth - 10, 36);
      doc.setLineWidth(0.5);
      doc.line(10, 37, pageWidth - 10, 37);

      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MONITORING PELAKSANAAN', pageWidth / 2, 45, { align: 'center' });
      doc.text('SUPERVISI ADMINISTRASI PERENCANAAN PEMBELAJARAN GURU', pageWidth / 2, 50, { align: 'center' });
      doc.text(`SEMESTER ${semester.toUpperCase()} TAHUN PELAJARAN ${year}`, pageWidth / 2, 55, { align: 'center' });

      // Identity
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 65;
      const xLabel = 20;
      const xColon = 60;
      const xValue = 65;

      doc.text('Nama Sekolah', xLabel, y); doc.text(':', xColon, y); doc.text(schoolName, xValue, y); y += 6;
      doc.text('Nama Guru', xLabel, y); doc.text(':', xColon, y); doc.text(teacher.name, xValue, y); y += 6;
      doc.text('NIP', xLabel, y); doc.text(':', xColon, y); doc.text(teacher.nip, xValue, y); y += 6;
      doc.text('Guru Kelas/Mapel', xLabel, y); doc.text(':', xColon, y); doc.text(grade, xValue, y); y += 6;
      
      const formattedDate = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      doc.text('Hari/Tanggal', xLabel, y); doc.text(':', xColon, y); doc.text(formattedDate, xValue, y); y += 10;

      // Table
      const tableBody: any[] = ADMINISTRATION_OBSERVATION_INSTRUMENT.map((item, index) => {
        const isPresent = conditions[item];
        const score = scores[item] || 0;
        return [
          { content: index + 1, styles: { halign: 'center' } },
          item,
          { content: isPresent ? 'V' : '', styles: { halign: 'center' } },
          { content: !isPresent && conditions[item] !== undefined ? 'V' : '', styles: { halign: 'center' } },
          { content: score === 4 ? 'V' : '', styles: { halign: 'center' } },
          { content: score === 3 ? 'V' : '', styles: { halign: 'center' } },
          { content: score === 2 ? 'V' : '', styles: { halign: 'center' } },
          { content: score === 1 ? 'V' : '', styles: { halign: 'center' } },
          '' // Ket
        ];
      });

      // Footer Rows
      const total = calculateTotal();
      const percent = calculatePercentage().toFixed(2);
      
      tableBody.push([
        { content: 'Jumlah', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: total.toString(), colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        ''
      ]);
      tableBody.push([
        { content: 'Capaian (%)', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `${percent}%`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        ''
      ]);

      autoTable(doc, {
        startY: y,
        head: [
          [
            { content: 'No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Komponen', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Kondisi', colSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Skor Nilai', colSpan: 4, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Ket.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
          ],
          [
            { content: 'Ada', styles: { halign: 'center' } },
            { content: 'Tidak', styles: { halign: 'center' } },
            { content: '4', styles: { halign: 'center' } },
            { content: '3', styles: { halign: 'center' } },
            { content: '2', styles: { halign: 'center' } },
            { content: '1', styles: { halign: 'center' } }
          ]
        ],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 60 },
            2: { cellWidth: 15 },
            3: { cellWidth: 15 },
            4: { cellWidth: 10 },
            5: { cellWidth: 10 },
            6: { cellWidth: 10 },
            7: { cellWidth: 10 },
            8: { cellWidth: 20 }
        },
        headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: [0, 0, 0] },
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY + 10;
      
      if (finalY > 220) { doc.addPage(); finalY = 20; }

      // Calculation Text
      doc.setFontSize(9);
      doc.text(`Nilai Akhir = (Skor Perolehan / Skor Maksimal) x 100% = ${percent}%`, 20, finalY);
      finalY += 10;

      // Kesimpulan
      if (finalY > 250) { doc.addPage(); finalY = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Kesimpulan:', 20, finalY);
      finalY += 5;
      doc.setFont('helvetica', 'normal');
      const conclusionLines = doc.splitTextToSize(conclusion || '', pageWidth - 40);
      (conclusionLines.length > 0 ? conclusionLines : ['', '', '']).forEach((line: string) => {
        if (finalY > 270) { doc.addPage(); finalY = 20; }
        doc.text(line, 20, finalY);
        doc.line(20, finalY + 1, pageWidth - 20, finalY + 1);
        finalY += 7;
      });
      finalY += 10;

      // Tindak Lanjut
      if (finalY > 250) { doc.addPage(); finalY = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Tindak Lanjut:', 20, finalY);
      finalY += 5;
      doc.setFont('helvetica', 'normal');
      const followUpLines = doc.splitTextToSize(followUp || '', pageWidth - 40);
      (followUpLines.length > 0 ? followUpLines : ['', '', '']).forEach((line: string) => {
        if (finalY > 270) { doc.addPage(); finalY = 20; }
        doc.text(line, 20, finalY);
        doc.line(20, finalY + 1, pageWidth - 20, finalY + 1);
        finalY += 7;
      });
      finalY += 20;

      // Signatures
      if (finalY > 250) { doc.addPage(); finalY = 20; }

      const dateStr = `Banjar, ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      
      doc.text('Mengetahui', 20, finalY);
      doc.text('Kepala Sekolah,', 20, finalY + 5);
      
      doc.text(dateStr, 140, finalY);
      doc.text('Guru,', 140, finalY + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.text(currentUser.name, 20, finalY + 30);
      doc.text(teacher.name, 140, finalY + 30);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${currentUser.nip}`, 20, finalY + 35);
      doc.text(`NIP. ${teacher.nip}`, 140, finalY + 35);

      doc.save(`Laporan_Supervisi_${teacher.name}.pdf`);
    };

    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createPDF(img);
    img.onerror = () => createPDF();
  };

  if (!teacher) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 shadow-lg rounded-lg print:shadow-none print:p-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate('/kepala-sekolah/laporan')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex gap-2">
          <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            <FileIcon size={20} /> PDF
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
            <Save size={20} /> Simpan
          </button>
        </div>
      </div>

      {/* Header Form */}
      <div className="flex items-center justify-center gap-4 mb-6 border-b pb-4 relative">
        <img src="/logo.png" alt="Logo Pemkot" className="w-20 h-auto absolute left-4 top-0" />
        <div className="text-center w-full pl-20 pr-4">
          <h2 className="text-lg font-bold uppercase">Pemerintah Kota Banjar</h2>
          <h1 className="text-xl font-bold uppercase">Dinas Pendidikan dan Kebudayaan</h1>
          <p className="text-sm">Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104</p>
          <p className="text-sm">e-mail: disdik_ktjrptrom@yahoo.com</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-bold text-lg uppercase">Monitoring Pelaksanaan</h2>
        <h2 className="font-bold text-lg uppercase">Supervisi Administrasi Perencanaan Pembelajaran Guru</h2>
        <h3 className="font-bold uppercase">Semester {semester} Tahun Pelajaran {year}</h3>
      </div>

      <div className="grid grid-cols-[180px_10px_1fr] gap-y-2 mb-6 text-sm">
        <div>Nama Sekolah</div><div>:</div><div><input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full border-b focus:outline-none" /></div>
        <div>Nama Guru</div><div>:</div><div>{teacher.name}</div>
        <div>NIP</div><div>:</div><div>{teacher.nip}</div>
        <div>Guru Kelas/Mapel</div><div>:</div><div><input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="w-full border-b focus:outline-none" /></div>
        <div>Hari/Tanggal</div><div>:</div><div><input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" /></div>
      </div>

      <div className="mb-4 text-sm italic">
        <p>Petunjuk:</p>
        <ol className="list-decimal list-inside">
            <li>Gunakan data (V) untuk menunjukkan keberadaan bukti fisik pada kolom yang disediakan</li>
            <li>Berikan skor (1, 2, 3, dan 4) untuk memberikan penilaian pada kolom yang disediakan:
                <ul className="ml-5">
                    <li>Skor 4: Sangat Baik</li>
                    <li>Skor 3: Baik</li>
                    <li>Skor 2: Cukup Baik</li>
                    <li>Skor 1: Kurang Baik</li>
                </ul>
            </li>
        </ol>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border border-gray-300 p-2 w-10">No.</th>
              <th rowSpan={2} className="border border-gray-300 p-2 text-left">Komponen</th>
              <th colSpan={2} className="border border-gray-300 p-2">Kondisi</th>
              <th colSpan={4} className="border border-gray-300 p-2">Skor Nilai</th>
              <th rowSpan={2} className="border border-gray-300 p-2">Ket.</th>
            </tr>
            <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 w-12">Ada</th>
                <th className="border border-gray-300 p-1 w-12">Tidak</th>
                <th className="border border-gray-300 p-1 w-10">4</th>
                <th className="border border-gray-300 p-1 w-10">3</th>
                <th className="border border-gray-300 p-1 w-10">2</th>
                <th className="border border-gray-300 p-1 w-10">1</th>
            </tr>
          </thead>
          <tbody>
            {ADMINISTRATION_OBSERVATION_INSTRUMENT.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                <td className="border border-gray-300 p-2">{item}</td>
                <td className="border border-gray-300 p-2 text-center">
                    <input 
                        type="radio" 
                        name={`condition_${index}`} 
                        checked={conditions[item] === true} 
                        onChange={() => handleConditionChange(item, true)} 
                    />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                    <input 
                        type="radio" 
                        name={`condition_${index}`} 
                        checked={conditions[item] === false} 
                        onChange={() => handleConditionChange(item, false)} 
                    />
                </td>
                {[4, 3, 2, 1].map(score => (
                    <td key={score} className="border border-gray-300 p-2 text-center">
                        <input 
                            type="radio" 
                            name={`score_${index}`} 
                            checked={scores[item] === score} 
                            onChange={() => handleScoreChange(item, score)} 
                        />
                    </td>
                ))}
                <td className="border border-gray-300 p-2"></td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
                <td colSpan={6} className="border border-gray-300 p-2 text-right">Jumlah</td>
                <td colSpan={2} className="border border-gray-300 p-2 text-center">{calculateTotal()}</td>
                <td className="border border-gray-300 p-2"></td>
            </tr>
            <tr className="font-bold bg-gray-50">
                <td colSpan={6} className="border border-gray-300 p-2 text-right">Capaian (%)</td>
                <td colSpan={2} className="border border-gray-300 p-2 text-center">{calculatePercentage().toFixed(2)}%</td>
                <td className="border border-gray-300 p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
            <span className="font-bold">Nilai Akhir = (Skor Perolehan / Skor Maksimal) x 100% = </span>
            <span className="border-b min-w-[50px] text-center font-bold">{calculatePercentage().toFixed(2)}%</span>
        </div>

        <div className="mb-4">
            <label className="block font-bold mb-1">Kesimpulan:</label>
            <textarea 
                className="w-full border rounded p-2 min-h-[100px] focus:outline-none" 
                value={conclusion} 
                onChange={e => setConclusion(e.target.value)} 
            />
        </div>

        <div className="mb-4">
            <label className="block font-bold mb-1">Tindak Lanjut:</label>
            <textarea 
                className="w-full border rounded p-2 min-h-[100px] focus:outline-none" 
                value={followUp} 
                onChange={e => setFollowUp(e.target.value)} 
            />
        </div>
      </div>

      <div className="grid grid-cols-2 mt-12 gap-8">
        <div className="text-center">
            <p>Mengetahui</p>
            <p>Kepala Sekolah,</p>
            <div className="h-24"></div>
            <p className="font-bold underline">{currentUser?.name}</p>
            <p>NIP. {currentUser?.nip}</p>
        </div>
        <div className="text-center">
            <p>Banjar, {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Guru,</p>
            <div className="h-24"></div>
            <p className="font-bold underline">{teacher.name}</p>
            <p>NIP. {teacher.nip}</p>
        </div>
      </div>
    </div>
  );
};

export const KSPlanningDeepForm = () => {
  const { nip } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [conclusion, setConclusion] = useState(''); // Saran Pembinaan
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState('Ganjil');
  const [year, setYear] = useState('2024/2025');
  
  // New Fields
  const [subject, setSubject] = useState('');
  const [materi, setMateri] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const allUsers = storageService.getUsers();
    const t = allUsers.find(u => u.nip === nip);
    if (t) setTeacher(t);

    const curr = storageService.getCurrentUser();
    if (curr) setCurrentUser(curr);

    if (nip) {
      const existing = storageService.getSupervisions(nip);
      const observations = existing.filter((s: SupervisionReport) => s.type === 'planning_deep');
      if (observations.length > 0) {
        const last = observations[observations.length - 1];
        setDate(last.date);
        setSemester(last.semester);
        setYear(last.year);
        setScores(last.scores);
        setNotes(last.notes);
        setConclusion(last.conclusion); // Using conclusion as Saran Pembinaan
        if (last.subject) setSubject(last.subject);
        if (last.topic) setMateri(last.topic);
        if (last.learningGoals) setLearningOutcomes(last.learningGoals);
        if (last.grade) setGrade(last.grade);
      }
    }
  }, [nip]);

  const handleScoreChange = (id: string, score: number) => {
    setScores(prev => ({ ...prev, [id]: score }));
  };

  

  const calculateTotal = () => {
    let total = 0;
    PLANNING_OBSERVATION_INSTRUMENT.forEach(section => {
      section.items.forEach(item => {
        total += scores[item.id] || 0;
      });
    });
    return total;
  };
  
  const calculatePercentage = () => {
    const total = calculateTotal();
    const maxScore = 15 * 4; // 15 items * 4 max score
    return (total / maxScore) * 100;
  };

  const handleSave = () => {
    if (!teacher || !nip) return;

    const report: SupervisionReport = {
      id: `${nip}_${date}_planning_deep`,
      teacherNip: nip,
      teacherName: teacher.name,
      date,
      semester,
      year,
      scores,
      notes,
      conclusion, // Saran Pembinaan
      followUp: '', // Not used in this form explicitly but required by type
      finalScore: calculatePercentage(),
      type: 'planning_deep',
      subject,
      topic: materi,
      learningGoals: learningOutcomes,
      grade
    };
    
    storageService.saveSupervision(report);
    firebaseService.saveSupervision({ ...report, school: teacher.school || '' });
    alert('Laporan Supervisi Perencanaan berhasil disimpan!');
    navigate('/kepala-sekolah/perencanaan');
  };

  const generatePDF = () => {
    if (!teacher || !currentUser) return;

    const createPDF = (logoImg?: HTMLImageElement) => {
      const doc = new jsPDF();
      
      // Logo & Header
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMERINTAH KOTA BANJAR', 115, 15, { align: 'center' });
      doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 115, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104', 115, 28, { align: 'center' });
      doc.line(20, 32, 190, 32);

      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INSTRUMEN SUPERVISI', 105, 40, { align: 'center' });
      doc.text('RENCANA PEMBELAJARAN MENDALAM', 105, 46, { align: 'center' });

      // Identity
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 60;
      const xLabel = 20;
      const xSep = 60;
      const xVal = 65;

      doc.text('Nama Satuan Pendidikan', xLabel, y); doc.text(':', xSep, y); doc.text(teacher.school || '-', xVal, y); y += 6;
      doc.text('Nama Guru', xLabel, y); doc.text(':', xSep, y); doc.text(teacher.name, xVal, y); y += 6;
      doc.text('Kelas/Semester', xLabel, y); doc.text(':', xSep, y); doc.text(`${grade} / ${semester}`, xVal, y); y += 6;
      doc.text('Mata Pelajaran', xLabel, y); doc.text(':', xSep, y); doc.text(subject, xVal, y); y += 6;
      doc.text('Materi', xLabel, y); doc.text(':', xSep, y); doc.text(materi, xVal, y); y += 6;
      doc.text('Capaian Pembelajaran', xLabel, y); doc.text(':', xSep, y); 
      const cpLines = doc.splitTextToSize(learningOutcomes, 120);
      doc.text(cpLines, xVal, y); 
      y += (cpLines.length * 5) + 2;
      doc.text('Hari/Tanggal', xLabel, y); doc.text(':', xSep, y); doc.text(new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), xVal, y); y += 10;

      // Table Body
      const tableBody: any[] = [];
      PLANNING_OBSERVATION_INSTRUMENT.forEach(section => {
        tableBody.push([{ content: section.title, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        section.items.forEach((item) => {
           const score = scores[item.id] || 0;
           tableBody.push([
             item.id,
             item.text,
             score === 1 ? 'V' : '',
             score === 2 ? 'V' : '',
             score === 3 ? 'V' : '',
             score === 4 ? 'V' : ''
           ]);
        });
      });

      // Summary
      const totalScore = calculateTotal();
      const percentage = calculatePercentage();
      const qualification = percentage >= 91 ? 'Sangat Baik' : percentage >= 81 ? 'Baik' : percentage >= 70 ? 'Cukup' : 'Kurang';

      tableBody.push([
        { content: 'JUMLAH SKOR', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: totalScore, colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: 'TOTAL SKOR (Max 60)', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: '60', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: 'NILAI', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: percentage.toFixed(2), colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      tableBody.push([
        { content: 'KUALIFIKASI', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: qualification, colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);

      autoTable(doc, {
        startY: y,
        head: [[
          { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'URAIAN KEGIATAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'KRITERIA NILAI', colSpan: 4, styles: { halign: 'center', valign: 'middle' } }
        ], [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } }
        ]],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 110 },
            2: { cellWidth: 10, halign: 'center' },
            3: { cellWidth: 10, halign: 'center' },
            4: { cellWidth: 10, halign: 'center' },
            5: { cellWidth: 10, halign: 'center' }
        },
        headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: [0, 0, 0] },
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY + 10;

      // Saran Pembinaan
      if (finalY > 230) { doc.addPage(); finalY = 20; }
      
      doc.setFont('helvetica', 'bold');
      doc.text('Saran Pembinaan :', 20, finalY);
      doc.setFont('helvetica', 'normal');
      const saranLines = doc.splitTextToSize(conclusion || '-', 170);
      doc.text(saranLines, 20, finalY + 5);
      finalY += 15 + (saranLines.length * 5);

      // Signatures
      if (finalY > 250) { doc.addPage(); finalY = 20; }

      const dateStr = `Banjar, ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      
      doc.text('Guru,', 40, finalY, { align: 'center' });
      doc.text(dateStr, 150, finalY, { align: 'center' });
      doc.text('Kepala Sekolah,', 150, finalY + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.text(teacher.name, 40, finalY + 30, { align: 'center' });
      doc.text(currentUser.name, 150, finalY + 30, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${teacher.nip}`, 40, finalY + 35, { align: 'center' });
      doc.text(`NIP. ${currentUser.nip}`, 150, finalY + 35, { align: 'center' });

      doc.save(`Supervisi_Perencanaan_${teacher.name}_${date}.pdf`);
    };

    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createPDF(img);
    img.onerror = () => createPDF();
  };

  if (!teacher) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg rounded-lg print:shadow-none print:p-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate('/kepala-sekolah/perencanaan')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex gap-2">
          <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            <FileIcon size={20} /> PDF
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
            <Save size={20} /> Simpan
          </button>
        </div>
      </div>

      {/* Header Form */}
      <div className="flex items-center justify-center gap-4 mb-6 border-b pb-4 relative">
        <img src="/logo.png" alt="Logo Pemkot" className="w-20 h-auto absolute left-4 top-0" />
        <div className="text-center w-full pl-20 pr-4">
          <h2 className="text-lg font-bold uppercase">Pemerintah Kota Banjar</h2>
          <h1 className="text-xl font-bold uppercase">Dinas Pendidikan dan Kebudayaan</h1>
          <p className="text-xs italic">Jln. Gerilya Komplek Perkantoran Pamongkoran Tlp. (0265) 2730104 Kota Banjar 46311</p>
          <p className="text-xs">Fax. (0265) 2731304 Email: disdik_ktb@yahoo.com</p>
          
          <div className="mt-4 border-t-2 border-black pt-2">
            <h3 className="text-lg font-bold uppercase">INSTRUMEN SUPERVISI</h3>
            <h3 className="text-lg font-bold uppercase">RENCANA PEMBELAJARAN MENDALAM</h3>
          </div>
        </div>
      </div>

      {/* Identitas */}
      <div className="grid grid-cols-[180px_10px_1fr] gap-y-2 mb-6 text-sm">
        <div>Nama Satuan Pendidikan</div><div>:</div><div>{teacher.school}</div>
        <div>Nama Guru</div><div>:</div><div>{teacher.name}</div>
        
        <div>Kelas/Semester</div><div>:</div>
        <div>
            <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: IV / Ganjil" />
        </div>

        <div>Mata Pelajaran</div><div>:</div>
        <div>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: Matematika" />
        </div>

        <div>Materi</div><div>:</div>
        <div>
            <input type="text" value={materi} onChange={e => setMateri(e.target.value)} className="w-full border-b border-gray-400 focus:outline-none px-2" placeholder="Contoh: Pecahan" />
        </div>

        <div className="col-span-3 mt-1">
            <label className="block font-medium mb-1">Capaian Pembelajaran:</label>
            <textarea 
                value={learningOutcomes} 
                onChange={e => setLearningOutcomes(e.target.value)} 
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500"
                rows={2}
                placeholder="..."
            />
        </div>

        <div>Hari/Tanggal</div><div>:</div>
        <div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-b border-gray-400 focus:outline-none px-2" />
        </div>
      </div>

      {/* Tabel Penilaian */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-800 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th rowSpan={2} className="border border-gray-800 p-2 w-10">No</th>
              <th rowSpan={2} className="border border-gray-800 p-2 text-center">URAIAN KEGIATAN</th>
              <th colSpan={4} className="border border-gray-800 p-2 text-center">KRITERIA NILAI</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-800 p-1 w-10 text-center">1</th>
              <th className="border border-gray-800 p-1 w-10 text-center">2</th>
              <th className="border border-gray-800 p-1 w-10 text-center">3</th>
              <th className="border border-gray-800 p-1 w-10 text-center">4</th>
            </tr>
          </thead>
          <tbody>
            {PLANNING_OBSERVATION_INSTRUMENT.map((section, sIdx) => (
                <React.Fragment key={sIdx}>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={6} className="border border-gray-800 p-2">{section.title}</td>
                    </tr>
                    {section.items.map((item) => {
                        const score = scores[item.id] || 0;
                        return (
                            <tr key={item.id}>
                                <td className="border border-gray-800 p-2 text-center">{item.id}</td>
                                <td className="border border-gray-800 p-2 whitespace-pre-wrap">{item.text}</td>
                                {[1, 2, 3, 4].map(val => (
                                    <td 
                                        key={val} 
                                        className={`border border-gray-800 p-2 text-center cursor-pointer hover:bg-blue-50 ${score === val ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleScoreChange(item.id, val)}
                                    >
                                        {score === val ? 'V' : ''}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </React.Fragment>
            ))}
            
            {/* Summary Rows */}
            <tr className="font-bold">
                <td colSpan={2} className="border border-gray-800 p-2 text-right">JUMLAH SKOR</td>
                <td colSpan={4} className="border border-gray-800 p-2 text-center">{calculateTotal()}</td>
            </tr>
            <tr className="font-bold">
                <td colSpan={2} className="border border-gray-800 p-2 text-right">TOTAL SKOR</td>
                <td colSpan={4} className="border border-gray-800 p-2 text-center">60</td>
            </tr>
            <tr className="font-bold">
                <td colSpan={2} className="border border-gray-800 p-2 text-right">NILAI</td>
                <td colSpan={4} className="border border-gray-800 p-2 text-center">{calculatePercentage().toFixed(2)}</td>
            </tr>
            <tr className="font-bold">
                <td colSpan={2} className="border border-gray-800 p-2 text-right">KUALIFIKASI</td>
                <td colSpan={4} className="border border-gray-800 p-2 text-center">
                    {(() => {
                        const p = calculatePercentage();
                        if (p >= 91) return 'Sangat Baik';
                        if (p >= 81) return 'Baik';
                        if (p >= 70) return 'Cukup';
                        return 'Kurang';
                    })()}
                </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
        <div>
            <p className="font-bold mb-2">Skor maksimum = 15 x 4 = 60</p>
            <div className="flex items-center gap-2">
                <p className="font-bold">Perolehan Nilai = </p>
                <div className="text-center">
                    <div className="border-b border-black">Jumlah Skor yang dicapai</div>
                    <div>Jumlah skor maksimum</div>
                </div>
                <p className="font-bold"> x 100</p>
            </div>
        </div>
        <div>
            <p className="font-bold underline mb-1">Kualifikasi nilai :</p>
            <div className="grid grid-cols-[80px_20px_1fr]">
                <div>91 – 100</div><div>=</div><div>Sangat Baik</div>
                <div>81 – 90</div><div>=</div><div>Baik</div>
                <div>70 – 80</div><div>=</div><div>Cukup</div>
                <div>{'< 70'}</div><div>=</div><div>Kurang</div>
            </div>
        </div>
      </div>

      {/* Saran Pembinaan */}
      <div className="mt-8">
        <h3 className="font-bold mb-2">Saran Pembinaan :</h3>
        <textarea 
            className="w-full border border-gray-300 rounded p-2 min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={conclusion}
            onChange={e => setConclusion(e.target.value)}
            placeholder="Tulis saran pembinaan..."
        />
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-20 text-sm">
        <div className="text-center mt-8">
          <p className="mb-20">Guru,</p>
          <p className="font-bold underline">{teacher.name}</p>
          <p>NIP. {teacher.nip}</p>
        </div>
        <div className="text-center">
          <p className="mb-1">Banjar, .......................... 2025</p>
          <p className="mb-20">Kepala Sekolah,</p>
          <p className="font-bold underline">{currentUser?.name || '...................'}</p>
          <p>NIP. {currentUser?.nip || '...................'}</p>
        </div>
      </div>
    </div>
  );
};

const KSDashboardHome = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [latestReports, setLatestReports] = useState<SupervisionReport[]>([]);
  const [generatedStats, setGeneratedStats] = useState<Record<string, number>>({});
  const [visits, setVisits] = useState<SchoolVisit[]>([]);

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    const allUsers = storageService.getUsers();
    if (currentUser && currentUser.school) {
      const schoolTeachers = allUsers.filter(u => 
        u.role === 'guru' && 
        u.active && 
        u.school?.toLowerCase() === currentUser.school?.toLowerCase()
      );
      setTeachers(schoolTeachers);

      const unsubscribeUsers = firebaseService.subscribeUsers((users) => {
        const filtered = users.filter(u => 
          u.role === 'guru' && 
          u.active && 
          u.school?.toLowerCase() === currentUser.school?.toLowerCase()
        );
        setTeachers(filtered);
      });

      const unsubscribeSup = firebaseService.subscribeSupervisionsBySchool(currentUser.school, (reports) => {
        setLatestReports(reports.slice(0, 5));
      });

      const unsubscribeStats = firebaseService.subscribeSchoolStats((allStats) => {
        const mySchoolId = currentUser.school?.replace(/\s+/g, '_').toLowerCase();
        const mySchoolStats = allStats.find(s => s.schoolName === currentUser.school || s.id === mySchoolId);
        
        if (mySchoolStats && mySchoolStats.teachers) {
             const stats: Record<string, number> = {};
             Object.keys(mySchoolStats.teachers).forEach(nip => {
                 stats[nip] = mySchoolStats.teachers[nip].docs || 0;
             });
             setGeneratedStats(stats);
        }
      });

      const unsubscribeVisits = firebaseService.subscribeSchoolVisits(currentUser.school, (data) => {
        setVisits(data);
      });

      return () => {
        if (unsubscribeUsers) unsubscribeUsers();
        if (unsubscribeSup) unsubscribeSup();
        if (unsubscribeStats) unsubscribeStats();
        if (unsubscribeVisits) unsubscribeVisits();
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Kunjungan Pengawas</h3>
        <div className="grid gap-4">
            {visits.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Belum ada data kunjungan pengawas.
                </div>
            ) : (
                visits.map(visit => (
                    <div key={visit.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900">{visit.purpose}</h4>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                    <Calendar size={12} />
                                    {new Date(visit.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {visit.status === 'completed' ? 'Selesai' : 'Terjadwal'}
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
                            {visit.findings && (
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Catatan</div>
                                    <div className="text-gray-700 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{visit.findings}</div>
                                </div>
                            )}
                            {visit.recommendations && (
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Rekomendasi</div>
                                    <div className="text-gray-700 bg-blue-50 p-2 rounded border border-blue-100 whitespace-pre-wrap">{visit.recommendations}</div>
                                </div>
                            )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Pengawas: {visit.visitorName}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Guru di sekolah Anda</h3>
        <div className="grid gap-3">
          {teachers.map(t => {
            const count = generatedStats[t.nip] || 0;
            const total = ADMIN_DOCS.length;
            const percentage = Math.min(Math.round((count / total) * 100), 100);

            return (
            <div key={t.nip} className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">NIP: {t.nip}</div>
                </div>
                <span className={`text-xs rounded px-2 py-1 ${isUserOnline(t.lastSeen) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{isUserOnline(t.lastSeen) ? 'Online' : 'Offline'}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress Administrasi</span>
                <span>{count}/{total} ({percentage}%)</span>
              </div>
            </div>
          )})}

          {teachers.length === 0 && (
            <div className="text-sm text-gray-500">Tidak ada data guru.</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-2 font-semibold">Laporan Terbaru</h3>
          {latestReports.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada laporan supervisi.</div>
          ) : (
            <div className="grid gap-2">
              {latestReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                  <div className="text-sm">
                    <div className="font-medium">{r.teacherName}</div>
                    <div className="text-xs text-gray-500">{r.date} • {r.type}</div>
                  </div>
                  <span className="text-xs rounded bg-indigo-100 px-2 py-1 text-indigo-700">{r.finalScore.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KSVisitsPage = () => {
  const [visits, setVisits] = useState<SchoolVisit[]>([]);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user?.school) {
      const unsubscribe = firebaseService.subscribeSchoolVisits(user.school, (data) => {
        setVisits(data);
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-800">Riwayat Kunjungan Pengawas</h2>
      <div className="grid gap-4">
        {visits.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
             Belum ada data kunjungan pengawas.
           </div>
        ) : (
          visits.map(visit => (
            <div key={visit.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-lg text-gray-900">{visit.purpose}</h3>
                   <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                     <Calendar size={14} />
                     {new Date(visit.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {visit.status === 'completed' ? 'Selesai' : 'Terjadwal'}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Pengawas</div>
                  <div className="text-gray-800">{visit.visitorName}</div>
                </div>
                {visit.findings && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Temuan</div>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{visit.findings}</div>
                  </div>
                )}
                {visit.recommendations && (
                  <div>
                     <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Rekomendasi</div>
                     <div className="text-gray-700 bg-blue-50 p-3 rounded text-sm whitespace-pre-wrap">{visit.recommendations}</div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EvidenceUploadSection = ({ 
  title, 
  items, 
  onCompletionCheck 
}: { 
  title: string; 
  items: { id: string; label: string }[];
  onCompletionCheck?: () => void;
}) => {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.workloadEvidence) {
        setEvidence(user.workloadEvidence);
      }
    }
  }, []);

  const handleSave = (id: string) => {
    // Re-fetch user to ensure we have the latest state before saving
    let user = storageService.getCurrentUser();
    if (!user) {
        console.error("No user found when saving");
        return;
    }

    const url = editValues[id] !== undefined ? editValues[id] : (evidence[id] || '');
    
    // Update local evidence state immediately
    const updatedEvidence = { ...evidence, [id]: url };
    setEvidence(updatedEvidence);
    
    // Update User object
    // We merge with existing evidence in storage to avoid overwriting updates from other sections
    const existingEvidence = user.workloadEvidence || {};
    const finalEvidence = { ...existingEvidence, [id]: url };
    
    const updatedUser = { ...user, workloadEvidence: finalEvidence };
    
    // 1. Save to LocalStorage
    storageService.saveUser(updatedUser);
    
    // 2. Update SessionStorage (Critical for getCurrentUser() calls)
    storageService.setCurrentUser(updatedUser);
    
    // 3. Update local component state
    setCurrentUser(updatedUser);
    
    // 4. Save to Firebase
    firebaseService.saveUser(updatedUser);
    
    // 5. Reset UI state
    setIsEditing(prev => ({ ...prev, [id]: false }));
    setEditValues(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });

    // 6. Notify Parent
    if (onCompletionCheck) {
        // Small timeout to allow storage propagation if needed
        setTimeout(() => {
            onCompletionCheck();
        }, 50);
    }
  };

  const handleCancel = (id: string) => {
    setIsEditing(prev => ({ ...prev, [id]: false }));
    setEditValues(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">{title}</h2>
      <div className="space-y-4">
        {items.map((item, index) => {
           // Check evidence directly from state
           const currentUrl = evidence[item.id];
           const hasLink = !!currentUrl && currentUrl.length > 0;
           const editing = isEditing[item.id];
           
           // Determine input value: Priority to Edit Value -> Current Saved Value -> Empty
           const inputValue = editValues[item.id] !== undefined ? editValues[item.id] : (currentUrl || '');
           
           return (
            <div key={item.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex gap-3">
                <div className="font-bold text-gray-500 min-w-[24px]">{index + 1}.</div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">{item.label}</p>
                  
                  {editing || !hasLink ? (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Tempel link Google Drive dokumen PDF disini..." 
                            className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={inputValue}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave(item.id);
                                }
                            }}
                        />
                        <button 
                            onClick={() => handleSave(item.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                            Simpan
                        </button>
                        {hasLink && (
                            <button 
                                onClick={() => handleCancel(item.id)}
                                className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white p-3 border rounded text-sm">
                        <div className="flex items-center gap-2 text-green-600 truncate max-w-md">
                            <span className="bg-green-100 p-1 rounded-full">✓</span>
                            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                {currentUrl}
                            </a>
                        </div>
                        <button 
                            onClick={() => {
                                setIsEditing(prev => ({ ...prev, [item.id]: true }));
                                setEditValues(prev => ({ ...prev, [item.id]: currentUrl || '' }));
                            }}
                            className="text-gray-500 hover:text-blue-600 text-xs underline"
                        >
                            Ubah Link
                        </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

const KSManajerialPage = ({ onUpdate }: { onUpdate?: () => void }) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Beban Kerja: Manajerial</h1>
        <p className="text-gray-600">Bukti Fisik Penugasan (Manajerial)</p>
      </div>
      <EvidenceUploadSection title="Dokumen Manajerial" items={MANAJERIAL_DOCS} onCompletionCheck={onUpdate} />
    </div>
  );
};

const KSKewirausahaanPage = ({ onUpdate }: { onUpdate?: () => void }) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Beban Kerja: Pengembangan Kewirausahaan</h1>
        <p className="text-gray-600">Bukti Fisik Penugasan (Pengembangan Kewirausahaan)</p>
      </div>
      <EvidenceUploadSection title="Dokumen Kewirausahaan" items={KEWIRAUSAHAAN_DOCS} onCompletionCheck={onUpdate} />
    </div>
  );
};

const KSSupervisiPage = ({ onUpdate }: { onUpdate?: () => void }) => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Beban Kerja: Supervisi</h1>
        <p className="text-gray-600">Bukti Fisik Penugasan (Supervisi kepada guru dan tenaga kependidikan)</p>
      </div>

      <EvidenceUploadSection title="Dokumen Bukti Fisik Supervisi" items={SUPERVISI_EVIDENCE_DOCS} onCompletionCheck={onUpdate} />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Alat Supervisi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => navigate('/kepala-sekolah/perencanaan')} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">Supervisi Perencanaan</h3>
                <p className="text-sm text-gray-500">Input & Cek Dokumen</p>
            </div>
            </button>

            <button onClick={() => navigate('/kepala-sekolah/pelaksanaan')} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <FileText size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">Supervisi Pelaksanaan</h3>
                <p className="text-sm text-gray-500">Input Observasi Kelas</p>
            </div>
            </button>

            <button onClick={() => navigate('/kepala-sekolah/laporan')} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-purple-500 hover:bg-purple-50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FileText size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">Laporan Supervisi</h3>
                <p className="text-sm text-gray-500">Rekapitulasi Laporan</p>
            </div>
            </button>
        </div>
      </div>
    </div>
  );
};

const WorkloadCompletionStatus = ({ user }: { user: User | null }) => {
    const [isComplete, setIsComplete] = useState(false);
    const [progress, setProgress] = useState(0);
    const [averageScore, setAverageScore] = useState(0);
    const [category, setCategory] = useState('');
    const [hasScores, setHasScores] = useState(false);

    useEffect(() => {
        if (user) {
            const totalItems = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length;
            
            const allIds = [
                ...MANAJERIAL_DOCS.map(d => d.id),
                ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
            ];
            
            // Progress Calculation
            const filledCount = allIds.filter(id => user.workloadEvidence?.[id]).length;
            const newProgress = Math.round((filledCount / totalItems) * 100);
            setProgress(newProgress);
            setIsComplete(filledCount === totalItems);

            // Score Calculation
            if (user.workloadScores) {
                let totalScore = 0;
                let scoredCount = 0;
                
                // Sum all scores found
                Object.values(user.workloadScores).forEach(score => {
                    totalScore += score;
                    scoredCount++;
                });

                // Calculate average based on 18 documents as per requirement
                // "rentang 0-100 x 18 dokumen / 18"
                const avg = totalScore / 18;
                setAverageScore(avg);
                setHasScores(scoredCount > 0);

                // Determine Category
                if (avg <= 60) setCategory('Perlu Perbaikan');
                else if (avg <= 75) setCategory('Cukup');
                else if (avg <= 90) setCategory('Baik');
                else setCategory('Sangat Baik');
            } else {
                setHasScores(false);
            }
        }
    }, [user]);

    return (
        <div className="space-y-6 mb-6">
            {/* Progress Section */}
            {!isComplete ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-blue-800">Progress Beban Kerja</h3>
                        <span className="text-blue-600 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-blue-600 mt-2">Lengkapi semua bukti fisik untuk menyelesaikan beban kerja.</p>
                </div>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                        <span className="text-2xl">🎉</span>
                    </div>
                    <h2 className="text-xl font-bold text-green-800 mb-2">Terima Kasih</h2>
                    <p className="text-green-700 max-w-2xl mx-auto">
                        Telah mengisi bukti fisik penugasan untuk Memenuhi beban kerja 37 (tiga puluh tujuh) jam dan 30 (tiga puluh) menit yang di dalamnya sudah mencakup 24 (dua puluh empat) jam tatap muka.
                    </p>
                </div>
            )}

            {/* Assessment Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Hasil Penilaian Pengawas</h3>
                {hasScores ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-gray-500 text-sm mb-1">Nilai Rata-rata</p>
                            <div className="text-4xl font-bold text-indigo-600">{averageScore.toFixed(1)}</div>
                            <p className="text-xs text-gray-400 mt-1">Skor Total / 18 Dokumen</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-gray-500 text-sm mb-1">Kategori</p>
                            <div className={`text-2xl font-bold ${
                                category === 'Sangat Baik' ? 'text-green-600' :
                                category === 'Baik' ? 'text-blue-600' :
                                category === 'Cukup' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {category}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Predikat Kinerja</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        Belum ada penilaian dari pengawas sekolah.
                    </div>
                )}
            </div>
        </div>
    );
};

const KepalaSekolahDashboard = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshUser = () => {
    const user = storageService.getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isActive = (path: string) => (location.pathname === path ? 'bg-indigo-700' : '');

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-indigo-800 text-white">
        <div className="p-6 text-xl font-bold">Kepala Sekolah</div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link to="/kepala-sekolah" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-indigo-700 ${isActive('/kepala-sekolah')}`}>
            <FileText size={20} />
            Dashboard
          </Link>
          <Link to="/kepala-sekolah/manajerial" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-indigo-700 ${isActive('/kepala-sekolah/manajerial')}`}>
            <FileText size={20} />
            Manajerial
          </Link>
          <Link to="/kepala-sekolah/kewirausahaan" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-indigo-700 ${isActive('/kepala-sekolah/kewirausahaan')}`}>
            <FileText size={20} />
            Kewirausahaan
          </Link>
          <Link to="/kepala-sekolah/supervisi" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-indigo-700 ${isActive('/kepala-sekolah/supervisi')}`}>
            <FileText size={20} />
            Supervisi
          </Link>
          
          <div className="my-2 border-t border-indigo-700"></div>
          
          <Link to="/kepala-sekolah/kunjungan" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-indigo-700 ${isActive('/kepala-sekolah/kunjungan')}`}>
            <Calendar size={20} />
            Kunjungan Pengawas
          </Link>
          <Link to="/" className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-indigo-700 hover:text-red-100">
            <FileText size={20} />
            Keluar
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <RunningText />
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {location.pathname === '/kepala-sekolah' 
              ? 'Ringkasan' 
              : location.pathname.startsWith('/kepala-sekolah/manajerial')
                ? 'Beban Kerja: Manajerial'
              : location.pathname.startsWith('/kepala-sekolah/kewirausahaan')
                ? 'Beban Kerja: Kewirausahaan'
              : location.pathname.startsWith('/kepala-sekolah/supervisi')
                ? 'Beban Kerja: Supervisi'
              : location.pathname.startsWith('/kepala-sekolah/perencanaan') 
                ? 'Observasi Perencanaan' 
              : location.pathname.startsWith('/kepala-sekolah/pelaksanaan')
                  ? 'Observasi Pelaksanaan Pembelajaran'
              : location.pathname.startsWith('/kepala-sekolah/kunjungan')
                  ? 'Kunjungan Pengawas'
                  : 'Laporan Instrumen Supervisi'}
          </h1>
          <div className="text-gray-600">
            Selamat datang, {currentUser ? `${currentUser.name} Kepala ${currentUser.school || ''}` : 'Kepala Sekolah'}
          </div>
        </header>

        <WorkloadCompletionStatus user={currentUser} />

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<KSDashboardHome />} />
            
            {/* Workload Pages */}
            <Route path="manajerial" element={<KSManajerialPage onUpdate={refreshUser} />} />
            <Route path="kewirausahaan" element={<KSKewirausahaanPage onUpdate={refreshUser} />} />
            <Route path="supervisi" element={<KSSupervisiPage onUpdate={refreshUser} />} />

            {/* Existing Sub-pages (kept for routing from Supervisi page) */}
            <Route path="perencanaan" element={<KSPlanningDeepList />} />
            <Route path="perencanaan/:nip" element={<KSPlanningDeepForm />} />
            <Route path="pelaksanaan" element={<KSPelaksanaanList />} />
            <Route path="pelaksanaan/:nip" element={<KSPelaksanaanForm />} />
            <Route path="laporan" element={<KSReportsPage />} />
            <Route path="laporan/:nip" element={<KSReportForm />} />
            <Route path="kunjungan" element={<KSVisitsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default KepalaSekolahDashboard;
