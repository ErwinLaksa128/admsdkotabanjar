export interface ObservationItem {
  id: string;
  text: string;
}

export interface ObservationSection {
  title: string;
  items: ObservationItem[];
}

export interface ObservationGroup {
  title: string;
  sections: ObservationSection[];
}

export const ADMIN_DOCS = [
  'Kalender Pendidikan',
  'Alokasi Waktu Efektif Belajar',
  'Program Tahunan',
  'Program Semester',
  'SKL',
  'CP dan ATP',
  'RPPM/Modul Ajar PM',
  'KKTP',
  'Jadwal Pelajaran',
  'Agenda Harian/Jurnal Mengajar',
  'Daftar Hadir Siswa',
  'Daftar Nilai Siswa',
  'Format Kegiatan Remidial',
  'Format Kegiatan Pengayaan',
  'Analisis Hasil Ulangan',
  'Bank Soal',
  'Catatan Refleksi Pelaksanaan Pembelajaran',
  'Buku Inventaris/Pegangan Guru',
  'Catatan Bimbingan Konseling',
  'Rekap Jurnal GTK/IH',
  'Catatan Notulen Rapat/Briefing',
  'Buku Supervisi/Observasi'
];

export const ADMINISTRATION_OBSERVATION_INSTRUMENT = [
  "Kalender Pendidikan",
  "Alokasi Waktu Efektif Belajar",
  "Program Tahunan",
  "Program Semester",
  "SKL",
  "CP dan ATP",
  "RPPM/Modul Ajar PM",
  "KKTP",
  "Jadwal Pelajaran",
  "Agenda Harian/Jurnal Mengajar",
  "Daftar Hadir Siswa",
  "Daftar Nilai Siswa",
  "Format Kegiatan Remidial",
  "Format Kegiatan Pengayaan",
  "Analisis Hasil Ulangan",
  "Bank Soal",
  "Pembelajaran",
  "Buku Inventaris/Pegangan Guru",
  "Catatan Bimbingan Konseling",
  "Rekap Jurnal GTK/IH",
  "Catatan Notulen Rapat/Briefing",
  "Buku Supervisi/Observasi*"
];

export const PLANNING_OBSERVATION_INSTRUMENT = [
  {
    title: "Keselarasan",
    items: [
      { id: "1", text: "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah mengarah pada pencapaian Dimensi Profil Lulusan" },
      { id: "2", text: "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah selaras" }
    ]
  },
  {
    title: "Kerangka Pembelajaran",
    items: [
      { id: "3", text: "Praktik pedagogis yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran" },
      { id: "4", text: "Lingkungan belajar yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran" },
      { id: "5", text: "Kemitraan pembelajaran yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran" },
      { id: "6", text: "Pemanfaatan digital yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran" }
    ]
  },
  {
    title: "Langkah Pembelajaran",
    items: [
      { id: "7", text: "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI (terlibat aktif mengonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks)." },
      { id: "8", text: "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI (mengaplikasi pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan)." },
      { id: "9", text: "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI (mengevaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindaklanjut ke depan)." },
      { id: "10", text: "Langkah perencanaan pembelajaran dapat memfasilitasi tindakan saling MEMULIAKAN antara Guru-Murid, Murid-Guru, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal" },
      { id: "11", text: "Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran" },
      { id: "12", text: "Perencanaan pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik peserta didik" }
    ]
  },
  {
    title: "Asesmen",
    items: [
      { id: "13", text: "Asesmen awal pembelajaran dirancang untuk mengetahui kesiapan belajar murid" },
      { id: "14", text: "Asesmen selama proses pembelajaran dirancang untuk memantau perkembangan dan memberi umpan balik" },
      { id: "15", text: "Asesmen hasil pembelajaran dirancang untuk mengukur pencapaian kompetensi murid" }
    ]
  }
];

export const PELAKSANAAN_OBSERVATION_INSTRUMENT: ObservationGroup[] = [
  {
    title: "A. Kegiatan Awal",
    sections: [
      {
        title: "1. Orientasi",
        items: [
          { id: "A1a", text: "Guru menyiapkan fisik dan psikis murid dengan menyapa dan memberi salam." },
          { id: "A1b", text: "Guru menyampaikan rencana kegiatan: mengelola emosional dan kesadaran sosial siswa (KSE) dan menyepakati keyakinan kelas." }
        ]
      },
      {
        title: "2. Motivasi",
        items: [
          { id: "A2a", text: "Guru mengajukan pertanyaan pemantik yang menantang untuk memotivasi murid." },
          { id: "A2b", text: "Guru menyampaikan manfaat hal yang akan dipelajari dalam kehidupan sehari-hari." }
        ]
      },
      {
        title: "3. Apersepsi",
        items: [
          { id: "A3a", text: "Guru menyampaikan capaian pembelajaran dan tujuan pembelajaran yang akan dicapai." },
          { id: "A3b", text: "Guru mengaitkan materi dengan materi pembelajaran sebelumnya." },
          { id: "A3c", text: "Guru mengelola KSE siswa untuk fokus pada materi yang akan diajarkan." }
        ]
      }
    ]
  },
  {
    title: "B. Kegiatan Inti",
    sections: [
      {
        title: "1. Memahami",
        items: [
          { id: "B1a", text: "Guru menyampaikan materi ajar dengan mencari jawaban pertanyaan pemantik sesuai dengan tujuan pembelajaran." },
          { id: "B1b", text: "Guru mengkaitkan materi dengan pengetahuan lain yang relevan, perkembangan iptek, budaya positif dan kehidupan nyata." },
          { id: "B1c", text: "Guru menyajikan pembahasan materi pembelajaran dengan tepat." },
          { id: "B1d", text: "Guru menyajikan materi secara sistematis (mudah kesulit, dari konkrit ke abstrak)." }
        ]
      },
      {
        title: "2. Mengaplikasi",
        items: [
          { id: "B2a", text: "Guru melaksanakan pembelajaran sesuai dengan kompetensi yang akan dicapai, menggunakan kelompok berbeda sesuai gaya belajar murid." },
          { id: "B2b", text: "Guru melaksanakan pembelajaran yang menumbuhkan partisipasi aktif murid dalam mengajukan pertanyaan." },
          { id: "B2c", text: "Guru melaksanakan pembelajaran yang menumbuhkan partisipasi aktif murid dalam mengemukakan pendapat." },
          { id: "B2d", text: "Guru melaksanakan pembelajaran yang mengembangkan keterampilan murid sesuai dengan materi ajar." },
          { id: "B2e", text: "Guru melaksanakan pembelajaran yang bersifat kontekstual sesuai dengan gaya belajar murid." },
          { id: "B2f", text: "Guru melaksanakan pembelajaran yang memungkinkan tumbuhnya kebiasaan dan sikap positif." },
          { id: "B2g", text: "Guru melaksanakan pembelajaran sesuai dengan alokasi waktu yang direncanakan." }
        ]
      },
      {
        title: "3. Merefleksi",
        items: [
          { id: "B3a", text: "Guru memberikan kesempatan peserta didik untuk presentasi atau mendemonstrasikan hasil kegiatan pembelajaran." },
          { id: "B3b", text: "Guru memberikan umpan balik terhadap hasil kegiatan pembelajaran." },
          { id: "B3c", text: "Guru memberikan kesempatan peserta didik untuk membuat jurnal refleksi individu." },
          { id: "B3d", text: "Guru memberikan kesempatan peserta didik untuk melakukan evaluasi diri terhadap pencapaian tujuan pembelajaran." },
          { id: "B3e", text: "Guru memberikan kesempatan peserta didik untuk menemukan solusi atau peran lanjutan setelah belajar." }
        ]
      },
      {
        title: "4. Pemanfaatan Teknologi Digital",
        items: [
          { id: "B4a", text: "Guru menunjukkan keterampilan dalam penggunaan sumber belajar teknologi digital yang bervariasi." },
          { id: "B4b", text: "Guru menunjukkan keterampilan dalam penggunaan teknologi digital." },
          { id: "B4c", text: "Guru melibatkan murid dalam pemanfaatan teknologi digital." },
          { id: "B4d", text: "Guru melibatkan murid dalam penggunaan teknologi digital." },
          { id: "B4e", text: "Menghasilkan kesan yang menarik." }
        ]
      },
      {
        title: "5. Penggunaan Bahasa yang benar dan tepat",
        items: [
          { id: "B5a", text: "Guru dapat menggunakan bahasa lisan secara jelas dan lancar." },
          { id: "B5b", text: "Guru dapat menggunakan bahasa tulis yang baik dan benar." }
        ]
      }
    ]
  },
  {
    title: "C. Kegiatan Penutup",
    sections: [
      {
        title: "1. Proses rangkuman, refleksi, dan tindak lanjut",
        items: [
          { id: "C1a", text: "Guru memfasilitasi dan membimbing murid merangkum/menyimpulkan materi pelajaran." },
          { id: "C1b", text: "Guru menunjukkan aktivitas belajar yang bertujuan meningkatkan pengetahuan dan keterampilan mengajar." },
          { id: "C1c", text: "Guru menunjukkan aktivitas untuk mengevaluasi dan merefleksikan praktik pengajaran yang telah diterapkan, terutama dampaknya pada belajar murid." },
          { id: "C1d", text: "Guru menerapkan cara, bahan, atau pendekatan baru dalam praktik pengajaran dari perencanaan hingga evaluasi pembelajaran." },
          { id: "C1e", text: "Guru melaksanakan tindak lanjut dengan memberikan arahan kegiatan berikutnya dan tugas perbaikan/pengayaan secara individu atau kelompok." }
        ]
      },
      {
        title: "2. Pelaksanaan Penilaian Hasil Belajar",
        items: [
          { id: "C2a", text: "Guru melaksanakan asesmen pada awal pembelajaran." },
          { id: "C2b", text: "Guru melaksanakan asesmen pada proses pembelajaran." },
          { id: "C2c", text: "Guru melaksanakan asesmen pada akhir pembelajaran." }
        ]
      }
    ]
  }
];

export const DEEP_OBSERVATION_INSTRUMENT = PELAKSANAAN_OBSERVATION_INSTRUMENT;

export const OBSERVATION_ASPECTS = [
  'Kegiatan Pendahuluan',
  'Penguasaan Materi Pembelajaran',
  'Penerapan Strategi Pembelajaran yang Mendidik',
  'Pemanfaatan Sumber Belajar/Media Pembelajaran',
  'Pelibatan Peserta Didik dalam Pembelajaran',
  'Penggunaan Bahasa yang Benar dan Tepat',
  'Kegiatan Penutup',
  'Pelaksanaan Penilaian Hasil Belajar'
];

export const MANAJERIAL_DOCS = [
    { id: 'manajerial_1', label: 'Dokumen rencana kerja tahunan satuan pendidikan termasuk visi, misi dan tujuan satuan pendidikan' },
    { id: 'manajerial_2', label: 'Media komunikasi satuan pendidikan' },
    { id: 'manajerial_3', label: 'Dokumen kurikulum satuan pendidikan' },
    { id: 'manajerial_4', label: 'Dokumen rencana kegiatan dan anggaran satuan pendidikan' },
    { id: 'manajerial_5', label: 'Dokumen pengelolaan sumber daya satuan pendidikan' },
    { id: 'manajerial_6', label: 'Laporan pemanfaatan sistem informasi satuan pendidikan (misalnya Dapodik yang mutakhir, SIPLAH, pengelolaan kinerja, BOS, ARKAS, dll)' },
    { id: 'manajerial_7', label: 'Dokumen hasil refleksi berkala' },
    { id: 'manajerial_8', label: 'Dokumen penilaian kinerja guru/pendidik dan tenaga kependidikan' },
    { id: 'manajerial_9', label: 'Dokumen laporan pelaksanaan program dan anggaran satuan pendidikan' },
    { id: 'manajerial_10', label: 'Dokumen publikasi dan/atau komunikasi pelaksanaan program kegiatan kepada pemangku kepentingan' }
];

export const KEWIRAUSAHAAN_DOCS = [
    { id: 'kewirausahaan_1', label: 'Dokumen pemetaan kebutuhan kewirausahaan satuan pendidikan' },
    { id: 'kewirausahaan_2', label: 'Dokumen program pengembangan kewirausahaan satuan pendidikan' },
    { id: 'kewirausahaan_3', label: 'Dokumen laporan program pengembangan kewirausahaan satuan pendidikan' },
    { id: 'kewirausahaan_4', label: 'Dokumen hasil penggalangan sumber daya' },
    { id: 'kewirausahaan_5', label: 'Dokumen laporan pemantauan dan evaluasi dan laporan program kewirausahaan' },
];

export const SUPERVISI_EVIDENCE_DOCS = [
    { id: 'supervisi_1', label: 'Dokumen perencanaan dan pelaksanaan supervisi' },
    { id: 'supervisi_2', label: 'Dokumen refleksi hasil supervisi' },
    { id: 'supervisi_3', label: 'Laporan pelaksanaan supervisi' },
];
