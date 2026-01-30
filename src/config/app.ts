export const APP_CONFIG = {
  // --- IDENTITAS DAERAH (Ubah ini untuk clone baru) ---
  pemda: 'PEMERINTAH KABUPATEN BANJAR',
  dinas: 'DINAS PENDIDIKAN',
  
  // --- IDENTITAS APLIKASI ---
  appName: 'Administrasi Guru PJOK',
  defaultSchool: 'UPTD SDN ...', // Placeholder nama sekolah
  
  // --- WARNA TEMA PDF (Format: [R, G, B]) ---
  colors: {
    primary: [30, 144, 255] as [number, number, number],   // Biru Utama (Dodger Blue)
    secondary: [255, 200, 0] as [number, number, number], // Kuning/Emas
    accent: [0, 220, 255] as [number, number, number],    // Cyan/Biru Muda
    text: [0, 0, 0] as [number, number, number]           // Hitam
  }
};
