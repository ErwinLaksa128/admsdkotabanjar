export const MATERI_PJOK: Record<string, string[]> = {
  "1": [
    "Gerak Lokomotor",
    "Gerak Non-Lokomotor",
    "Gerak Manipulatif",
    "Senam",
    "Aktivitas Gerak Berirama",
    "Aktivitas Pengenalan Air",
    "Aktivitas Kebugaran",
    "Mengenal Bagian Tubuh"
  ],
  "2": [
    "Gerak Lokomotor",
    "Gerak Non-Lokomotor",
    "Gerak Manipulatif",
    "Senam",
    "Aktivitas Gerak Berirama",
    "Aktivitas Pengenalan Air",
    "Aktivitas Kebugaran",
    "Kebersihan Lingkungan"
  ],
  "3": [
    "Gerak Lokomotor",
    "Gerak Non Lokomotor",
    "Gerak Manipulatif",
    "Gerak Dominan",
    "Gerak Berirama",
    "Aktivitas Air",
    "Kebugaran Jasmani",
    "Kesehatan"
  ],
  "4": [
    "Permainan Invasif",
    "Permainan Net",
    "Permainan Lapangan",
    "Aktivitas Beladiri",
    "Atletik",
    "Senam Lantai",
    "Gerak Berirama",
    "Aktivitas Pengenalan Air",
    "Aktivitas Kebugaran Jasmani",
    "Pemeliharaan Kebersihan Alat Reproduksi"
  ],
  "5": [
    "Modifikasi Permainan Invasif",
    "Permainan Net",
    "Permainan Lapangan",
    "Aktivitas Beladiri",
    "Atletik",
    "Senam",
    "Aktivitas Gerak Berirama",
    "Aktivitas Pengenalan Air",
    "Aktivitas Kebugaran",
    "Bahaya Merokok dan Minuman Keras"
  ],
  "6": [
    "Permainan Invasif",
    "Permainan Net",
    "Permainan Lapangan",
    "Bela Diri",
    "Senam",
    "Gerak Berirama",
    "Aktivitas Air",
    "Kebugaran Jasmani",
    "Penyakit Menular dan Tidak Menular"
  ]
};

export const getMateriByClass = (className: string): string[] => {
  // Extract number from class name (e.g. "1A" -> "1", "Kelas 1" -> "1")
  const match = className.match(/\d+/);
  if (match) {
    const grade = match[0];
    return MATERI_PJOK[grade] || [];
  }
  return [];
};
