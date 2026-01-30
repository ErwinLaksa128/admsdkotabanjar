import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GenerateDocParams } from './api';
import type { User } from './storage';
import QRCode from 'qrcode';
import { APP_CONFIG } from '../config/app';

// Helper: Load Image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

// Helper: Format Tanggal Indonesia
const getIndonesianDate = () => {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getAcademicYear = (now: Date = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  return month > 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

// --- DRAWING HELPERS ---

const drawRoundedRect = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, color: [number, number, number]) => {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, h, r, r, 'F');
};

const drawCenteredText = (doc: jsPDF, text: string, y: number, fontSize: number, color: [number, number, number] = [0, 0, 0], font = 'helvetica', style = 'bold') => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFont(font, style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(text, pageWidth / 2, y, { align: 'center' });
};

export const generatePerangkatPembelajaran3HalamanPdf = async (params: {
  user: User;
  adminDocs: string[];
  generatedDocs: { type: string; url: string; date: string }[];
}) => {
  const now = new Date();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const tahunPelajaran = getAcademicYear(now);
  // const semester = getSemesterNumber(now); // Unused

  const sekolah = params.user.school || APP_CONFIG.defaultSchool;
  const namaGuru = params.user.name || 'Nama Guru';
  const nipGuru = params.user.nip || '-';
  const namaKepsek = params.user.kepsekName || '................';
  const nipKepsek = params.user.kepsekNip || '................';
  const namaPengawas = params.user.pengawasName || '................';
  const nipPengawas = params.user.pengawasNip || '................';

  // Load Assets
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage('/logo.png');
  } catch (e) {
    console.error('Failed to load logo', e);
  }

  // --- HALAMAN 1: COVER ---
  // Background Light Blue
  doc.setFillColor(230, 245, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Logos Top Left
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', 10, 10, 20, 20); // Logo Sekolah/Pemda
  }
  
  // Header Text (Top Right - Placeholder for logos)
  doc.setFontSize(10);
  doc.setTextColor(0, 50, 150);
  doc.text('Kurikulum Merdeka | Merdeka Belajar', pageWidth - 10, 20, { align: 'right' });

  // 1. School Name (Blue Pill)
  doc.setFont('helvetica', 'bold');
  const schoolNameWidth = doc.getTextWidth(sekolah) + 40;
  // Ensure max width isn't too wide
  const finalSchoolWidth = Math.min(schoolNameWidth, 180);
  drawRoundedRect(doc, (pageWidth - finalSchoolWidth) / 2, 40, finalSchoolWidth, 16, 8, APP_CONFIG.colors.primary); // Theme Primary
  drawCenteredText(doc, sekolah.toUpperCase(), 51, 16, [255, 255, 255]);

  // 2. "Administrasi" (Yellow Box)
  drawRoundedRect(doc, pageWidth / 2 - 70, 70, 140, 24, 4, APP_CONFIG.colors.secondary); // Theme Secondary
  drawCenteredText(doc, 'Administrasi', 87, 26, [0, 0, 0], 'times', 'bold');

  // 3. "PJOK" (Blue Rotated Box)
  const ctx = doc.context2d;
  ctx.save();
  ctx.translate(pageWidth / 2, 115);
  ctx.rotate(-0.08); // Slightly less rotation
  ctx.fillStyle = '#4169E1';
  ctx.fillRect(-35, -12, 70, 24);
  ctx.restore();
  
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('PJOK', pageWidth / 2, 120, { align: 'center', angle: 4 }); 

  // 4. Tahun Pelajaran (Orange Pill)
  const tpText = `Tahun Pelajaran`;
  const tpYear = `${tahunPelajaran}`;
  drawRoundedRect(doc, pageWidth / 2 - 50, 145, 100, 24, 8, [255, 120, 0]); // Orange
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(tpText, pageWidth / 2, 154, { align: 'center' });
  doc.setFontSize(16);
  doc.text(tpYear, pageWidth / 2, 164, { align: 'center' });

  // 5. Photo Frame
  const photoSize = 60;
  const photoY = 180;
  const photoX = (pageWidth - photoSize) / 2;
  
  doc.setFillColor(50, 50, 50);
  doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 4, 4, 'F');
  
  if (params.user.photo) {
    try {
      doc.addImage(params.user.photo, 'PNG', photoX, photoY, photoSize, photoSize);
    } catch {
      doc.setFillColor(200, 200, 200);
      doc.rect(photoX, photoY, photoSize, photoSize, 'F');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Foto Guru', pageWidth / 2, photoY + 30, { align: 'center' });
    }
  } else {
    doc.setFillColor(220, 220, 220);
    doc.rect(photoX, photoY, photoSize, photoSize, 'F');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('FOTO', pageWidth / 2, photoY + 30, { align: 'center' });
  }

  // 6. Name Tag (Cyan)
  const nameY = 255;
  drawRoundedRect(doc, 20, nameY, pageWidth - 40, 25, 8, APP_CONFIG.colors.accent); // Theme Accent
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(namaGuru.toUpperCase(), pageWidth / 2, nameY + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`NIP. ${nipGuru}`, pageWidth / 2, nameY + 18, { align: 'center' });


  // --- HALAMAN 2: LEMBAR PENGESAHAN ---
  doc.addPage();
  // Background Greenish Grey
  doc.setFillColor(180, 200, 190); // Sage Green light
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'F'); // Inner box like the image
  // Or full background? Image looks like a card on a blue bg.
  // Let's do full light blue bg then a card.
  doc.setFillColor(230, 245, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Card
  doc.setFillColor(180, 190, 180); // Grayish Green
  doc.roundedRect(20, 40, pageWidth - 40, pageHeight - 80, 10, 10, 'F');

  // Logos Top
  if (logoImg) doc.addImage(logoImg, 'PNG', 20, 10, 15, 15);
  
  // Title Header (Blue Pill)
  drawRoundedRect(doc, pageWidth / 2 - 80, 30, 160, 15, 5, APP_CONFIG.colors.primary);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('LEMBAR PENGESAHAN', pageWidth / 2, 40, { align: 'center' });

  // Content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let yContent = 80;
  doc.text('PERANGKAT PEMBELAJARAN', pageWidth / 2, yContent, { align: 'center' });
  doc.text('PENDIDIKAN JASMANI OLAHRAGA DAN KESEHATAN', pageWidth / 2, yContent + 7, { align: 'center' });

  yContent += 30;
  doc.text(`TAHUN PELAJARAN ${tahunPelajaran}`, pageWidth / 2, yContent, { align: 'center' });
  doc.text('SEMESTER 1 dan 2', pageWidth / 2, yContent + 7, { align: 'center' });

  yContent += 30;
  doc.text('Oleh,', pageWidth / 2, yContent, { align: 'center' });
  
  yContent += 25;
  doc.setFont('helvetica', 'bold');
  doc.text(namaGuru, pageWidth / 2, yContent, { align: 'center' });
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(namaGuru);
  doc.line(pageWidth / 2 - nameWidth / 2, yContent + 1, pageWidth / 2 + nameWidth / 2, yContent + 1); // Underline
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${nipGuru}`, pageWidth / 2, yContent + 7, { align: 'center' });

  yContent += 40;
  doc.setFont('helvetica', 'bold');
  doc.text('Mengesahkan,', pageWidth / 2, yContent, { align: 'center' });

  // Signatures
  const ySign = yContent + 40;
  doc.setFontSize(11);
  
  // Pengawas (Left)
  doc.text('Pengawas,', 60, ySign, { align: 'center' });
  doc.text(namaPengawas, 60, ySign + 25, { align: 'center' });
  doc.text(`NIP. ${nipPengawas}`, 60, ySign + 30, { align: 'center' });

  // Kepsek (Right)
  doc.text('Kepala Sekolah,', pageWidth - 60, ySign, { align: 'center' });
  doc.text(namaKepsek, pageWidth - 60, ySign + 25, { align: 'center' });
  doc.text(`NIP. ${nipKepsek}`, pageWidth - 60, ySign + 30, { align: 'center' });


  // --- HALAMAN 3: INDEKS QR ---
  doc.addPage();
  // Background Light Blue
  doc.setFillColor(230, 245, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header School
  if (logoImg) doc.addImage(logoImg, 'PNG', 10, 10, 15, 15);
  
  drawRoundedRect(doc, pageWidth / 2 - 80, 20, 160, 14, 7, APP_CONFIG.colors.primary);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(sekolah.toUpperCase(), pageWidth / 2, 29, { align: 'center' });

  // Adm PJOK Title (Side)
  // Yellow Box "Adm"
  drawRoundedRect(doc, pageWidth - 80, 50, 60, 25, 4, APP_CONFIG.colors.secondary);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('times', 'bold');
  doc.text('Adm', pageWidth - 50, 67, { align: 'center' });

  // Blue Box "PJOK" (Rotated)
  ctx.save();
  ctx.translate(pageWidth - 50, 90);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#4169E1';
  ctx.fillRect(-35, -15, 70, 30);
  ctx.restore();
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('PJOK', pageWidth - 50, 98, { align: 'center', angle: 5 });

  // Photo Bottom Right
  const smallPhotoSize = 40;
  const smallPhotoX = pageWidth - 60;
  const smallPhotoY = pageHeight - 100;
  
  // Photo Frame
  doc.setFillColor(50, 50, 50);
  doc.roundedRect(smallPhotoX - 2, smallPhotoY - 2, smallPhotoSize + 4, smallPhotoSize + 4, 4, 4, 'F');
  
  if (params.user.photo) {
    try {
      doc.addImage(params.user.photo, 'PNG', smallPhotoX, smallPhotoY, smallPhotoSize, smallPhotoSize);
    } catch {
       // Ignore
    }
  } else {
    doc.setFillColor(200, 200, 200);
    doc.rect(smallPhotoX, smallPhotoY, smallPhotoSize, smallPhotoSize, 'F');
  }

  // Name Tag Bottom Right
  const nameTagY = pageHeight - 30;
  drawRoundedRect(doc, pageWidth - 90, nameTagY, 80, 16, 4, APP_CONFIG.colors.accent);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(namaGuru, pageWidth - 50, nameTagY + 6, { align: 'center' });
  doc.text(`NIP. ${nipGuru}`, pageWidth - 50, nameTagY + 11, { align: 'center' });


  // --- QR CODES GRID (3 Columns) ---
  const docToUrl = new Map<string, string>();
  params.generatedDocs.forEach((d) => {
    if (d.type && d.url) docToUrl.set(d.type, d.url);
  });

  const qrSize = 16;
  const startX = 15;
  const startY = 55;
  const colWidth = 63;
  const rowHeight = 24;
  const itemsPerCol = 8;
  
  // Filter docs to generate QR for
  const qrDocs = params.adminDocs; 
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  for (let i = 0; i < qrDocs.length; i++) {
    const docName = qrDocs[i];
    const url = docToUrl.get(docName);
    
    // Calculate Position (3 Columns)
    const col = Math.floor(i / itemsPerCol);
    const row = i % itemsPerCol;
    
    // Safety check for max items
    if (col > 2) break; 

    const x = startX + (col * colWidth);
    const y = startY + (row * rowHeight);

    // Draw QR
    if (url) {
      try {
        const qrDataUrl = await QRCode.toDataURL(url, { margin: 0, width: 100 });
        doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
      } catch {
        doc.rect(x, y, qrSize, qrSize); // Placeholder
      }
    } else {
      doc.setDrawColor(200);
      doc.rect(x, y, qrSize, qrSize); // Empty placeholder
      doc.setFontSize(6);
      doc.text('No Link', x + qrSize/2, y + qrSize/2, { align: 'center', baseline: 'middle' });
    }

    // Label
    const labelX = x + qrSize + 2;
    const labelW = 42;
    const labelH = 12;
    
    doc.setFillColor(200, 220, 200);
    doc.roundedRect(labelX, y + (qrSize - labelH)/2, labelW, labelH, 3, 3, 'F'); 
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const splitText = doc.splitTextToSize(docName, labelW - 2);
    // Center text vertically in the pill
    const textY = y + (qrSize/2);
    doc.text(splitText, labelX + labelW/2, textY, { align: 'center', baseline: 'middle' });
  }

  const safeName = (namaGuru || 'Guru').replace(/[^a-zA-Z0-9 _.-]/g, '').trim();
  doc.save(`Perangkat_Pembelajaran_3H_QR_${safeName}.pdf`);
};

// Helper: Standard Header Dinas
const addStandardHeader = (doc: jsPDF, sekolah: string) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_CONFIG.pemda, pageWidth / 2, 20, { align: 'center' });
  doc.text(APP_CONFIG.dinas, pageWidth / 2, 26, { align: 'center' });
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
