import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GenerateDocParams } from './api';

// Helper: Format Tanggal Indonesia
const getIndonesianDate = () => {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Helper: Standard Header Dinas
const addStandardHeader = (doc: jsPDF, sekolah: string) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMERINTAH KABUPATEN BANJAR', pageWidth / 2, 20, { align: 'center' });
  doc.text('DINAS PENDIDIKAN', pageWidth / 2, 26, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`SEKOLAH: ${sekolah || '...................'}`, pageWidth / 2, 34, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 38, pageWidth - 20, 38);
};

// --- TEMPLATE 1: DEFAULT / GENERIC ---
export const generateDefaultDoc = (doc: jsPDF, params: GenerateDocParams) => {
  const pageWidth = doc.internal.pageSize.width;

  addStandardHeader(doc, params.sekolah || '');

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text((params.type || 'DOKUMEN').toUpperCase(), pageWidth / 2, 50, { align: 'center' });

  // Data Table
  const tableData = [
    ['Nama Guru', params.nama || '-'],
    ['NIP', params.nip || '-'],
    ['Jabatan', params.subRole || '-'],
    ['Mata Pelajaran', params.mapel || '-'],
    ['Fase / Kelas', params.fase || '-'],
    ['Semester', params.semester || '-'],
    ['Materi', params.materi || '-'],
    ['Alokasi Waktu', params.alokasiWaktu || '-'],
  ];

  const finalTableData = tableData.filter(row => row[1] !== '-' && row[1] !== undefined);

  autoTable(doc, {
    startY: 60,
    head: [['Data', 'Keterangan']],
    body: finalTableData,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
    margin: { top: 60 },
  });

  // Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  // Check page break
  if (finalY > doc.internal.pageSize.height - 40) {
    doc.addPage();
  }

  // Right side (Guru)
  doc.setFontSize(11);
  doc.text(`Martapura, ${getIndonesianDate()}`, pageWidth - 60, finalY, { align: 'center' });
  doc.text('Guru Mata Pelajaran,', pageWidth - 60, finalY + 6, { align: 'center' });
  doc.text(params.nama || '(Nama Guru)', pageWidth - 60, finalY + 30, { align: 'center' });
  doc.text(`NIP. ${params.nip || '................'}`, pageWidth - 60, finalY + 36, { align: 'center' });

  // Left side (Kepsek)
  doc.text('Mengetahui,', 60, finalY, { align: 'center' });
  doc.text('Kepala Sekolah,', 60, finalY + 6, { align: 'center' });
  doc.text(params.kepsek || '(Nama Kepala Sekolah)', 60, finalY + 30, { align: 'center' });
  doc.text(`NIP. ${params.nipKepsek || '................'}`, 60, finalY + 36, { align: 'center' });
};

// --- TEMPLATE 2: MODUL AJAR (Placeholder) ---
// Nanti kita isi ini setelah user kirim formatnya
export const generateModulAjar = (doc: jsPDF, params: GenerateDocParams) => {
  // Logic khusus Modul Ajar akan disini
  generateDefaultDoc(doc, params); // Sementara pakai default dulu
};

// --- TEMPLATE 3: LAPORAN SUPERVISI (Placeholder) ---
export const generateLaporanSupervisi = (doc: jsPDF, params: GenerateDocParams) => {
  // Logic khusus Laporan Supervisi akan disini
  generateDefaultDoc(doc, params);
};
