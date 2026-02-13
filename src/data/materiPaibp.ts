export const MATERI_PAIBP: Record<string, string[]> = {
  "1": [
    "Kasih Sayang",
    "Aku Cinta Al-Qur'an",
    "Iman Kepada Allah Swt.",
    "Bersih Itu Sehat",
    "Cinta Nabi dan Rasul",
    "Ayo Belajar",
    "Ayo Belajar Al-Qur'an",
    "Allah Maha Raja",
    "Ayo Shalat",
    "Perilaku Terpuji"
  ],
  "2": [
    "Nabi Muhammad Saw. Teladanku",
    "Asyik Bisa Membaca Al-Qur'an",
    "Allah Maha Pencipta",
    "Perilaku Terpuji",
    "Hidup Bersih dan Sehat",
    "Ayo Berwudhu",
    "Berani",
    "Senang Bisa Membaca Al-Qur'an",
    "Allah Maha Suci",
    "Kasih Sayang"
  ],
  "3": [
    "Nabi Muhammad Saw. Panutanku",
    "Senang Bisa Membaca Al-Qur'an",
    "Meyakini Allah Maha Esa dan Maha Pemberi",
    "Hidup Tenang dengan Berperilaku Terpuji",
    "Shalat Kewajibanku",
    "Kisah Keteladanan Nabi Yusuf a.s. dan Nabi Syu'aib a.s.",
    "Hati Tentram dengan Berperilaku Baik",
    "Ayo Belajar Al-Qur'an",
    "Meyakini Sifat-Sifat Allah Swt.",
    "Bersyukur Kepada Allah Swt."
  ],
  "4": [
    "Mari Belajar Q.S. Al-Falaq",
    "Beriman Kepada Allah dan Rasul-Nya",
    "Aku Anak Shalih",
    "Bersih Itu Sehat",
    "Aku Cinta Nabi dan Rasul",
    "Mari Belajar Q.S. Al-Fil",
    "Beriman Kepada Malaikat Allah",
    "Mari Berperilaku Terpuji",
    "Mari Melaksanakan Shalat",
    "Kisah Keteladanan Wali Songo"
  ],
  "5": [
    "Mari Belajar Q.S. At-Tin",
    "Mengenal Nama-Nama Allah dan Kitab-Nya",
    "Cita-Citaku Menjadi Anak Shalih",
    "Bulan Ramadhan yang Indah",
    "Rasul Allah Idolaku",
    "Mari Belajar Q.S. Al-Ma'un",
    "Mari Mengenal Rasul-Rasul Allah",
    "Mari Hidup Sederhana dan Ikhlas",
    "Indahnya Shalat Tarawih dan Tadarus Al-Qur'an",
    "Kisah Keteladanan Luqman"
  ],
  "6": [
    "Indahnya Saling Menghormati",
    "Ketika Bumi Berhenti Berputar",
    "Indahnya Nama-Nama Allah Swt.",
    "Ayo Membayar Zakat",
    "Keteladanan Rasulullah Saw. dan Sahabatnya",
    "Indahnya Saling Membantu",
    "Menerima Qada dan Qadar",
    "Senangnya Berakhlak Terpuji",
    "Ayo Berinfak dan Bersedekah",
    "Senangnya Meneladani Para Nabi dan Ashabul Kahfi"
  ]
};

export const getMateriPaibpByClass = (className: string): string[] => {
  // Extract number from class name (e.g. "1A" -> "1", "Kelas 1" -> "1")
  const match = className.match(/\d+/);
  if (match) {
    const grade = match[0];
    return MATERI_PAIBP[grade] || [];
  }
  return [];
};
