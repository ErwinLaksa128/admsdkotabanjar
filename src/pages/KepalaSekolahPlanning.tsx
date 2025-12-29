import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, File, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, SupervisionReport, storageService } from '../services/storage';
import { PLANNING_OBSERVATION_INSTRUMENT } from '../constants/documents';

export const KSPlanningDeepList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supervisions, setSupervisions] = useState<Record<string, SupervisionReport[]>>({});

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

      const supData: Record<string, SupervisionReport[]> = {};
      schoolTeachers.forEach(t => {
        const allSups = storageService.getSupervisions(t.nip);
        supData[t.nip] = allSups.filter(s => s.type === 'planning_deep');
      });
      setSupervisions(supData);
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
        <h1 className="text-xl font-bold text-gray-800">Observasi Perencanaan Pembelajaran</h1>
      </div>

      <div className="grid gap-4">
        {teachers.map(teacher => {
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
      const observations = existing.filter(s => s.type === 'planning_deep');
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
            <File size={20} /> PDF
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
                <>
                    <tr key={sIdx} className="bg-gray-100 font-bold">
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
                </>
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
