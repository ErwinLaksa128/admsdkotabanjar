
export interface School {
  npsn: string;
  name: string;
  address: string;
  village: string; // Kelurahan/Desa
  district: string; // Kecamatan
  status: 'NEGERI' | 'SWASTA';
  guruCount?: number;
  tasCount?: number;
}

export const DEFAULT_SCHOOLS: School[] = [
  // Sekolah Percontohan
  { npsn: '12345678', name: 'SDN Percontohan 1', address: 'Jl. Pendidikan No. 1', village: 'Percontohan', district: 'Pusat', status: 'NEGERI', guruCount: 20, tasCount: 5 },

  // Kecamatan Banjar
  { npsn: '69896395', name: 'SD INSPIRATIF AL-ILHAM', address: 'JL. LOBAK NO. 519 RT. 04 RW. 15 LINGK. BANJAR KOLOT', village: 'Banjar', district: 'Banjar', status: 'SWASTA', guruCount: 25, tasCount: 6 },
  { npsn: '70045735', name: 'SD Islam Al Istiqomah', address: 'Dusun Gardu RT 020/RW 007', village: 'Balokang', district: 'Banjar', status: 'SWASTA', guruCount: 9, tasCount: 2 },
  { npsn: '20225323', name: 'SDN 4 BANJAR', address: 'Lingkungan Pintusinga No 27', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225162', name: 'SDN 1 BALOKANG', address: 'Jl. Wijaya Kusuma RT. 45 RW. 14 Dusun Balokang', village: 'Balokang', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225163', name: 'SDN 1 BANJAR', address: 'Jalan Sudiro W No. 52', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 25, tasCount: 3 },
  { npsn: '20225291', name: 'SDN 1 CIBEUREUM', address: 'Dusun Pasirnagara RT 12 RW 03', village: 'Cibeureum', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225167', name: 'SDN 1 JAJAWAR', address: 'Dusun Karangpucung Kulon', village: 'Jajawar', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225288', name: 'SDN 1 MEKARSARI', address: 'Jalan Moh Hamim', village: 'Mekarsari', district: 'Banjar', status: 'NEGERI', guruCount: 9, tasCount: 3 },
  { npsn: '20225303', name: 'SDN 1 NEGLASARI', address: 'Jl. Dr. Husein Kartasasmita No. 210', village: 'Neglasari', district: 'Banjar', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225262', name: 'SDN 1 SITUBATU', address: 'Jl. Dr. Husen Kartasasmita No. 429', village: 'Situbatu', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225310', name: 'SDN 2 BALOKANG', address: 'Jalan Peta No 131', village: 'Balokang', district: 'Banjar', status: 'NEGERI', guruCount: 12, tasCount: 3 },
  { npsn: '20225300', name: 'SDN 2 BANJAR', address: 'Jln Dewi Sartika No 78', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 16, tasCount: 3 },
  { npsn: '20225312', name: 'SDN 2 NEGLASARI', address: 'Dusun Warungbuah', village: 'Neglasari', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225329', name: 'SDN 2 SITUBATU', address: 'Jalan Dr. Husein Kartasasmita No. 444', village: 'Situbatu', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225331', name: 'SDN 3 BALOKANG', address: 'Jalan Peta No. 56', village: 'Balokang', district: 'Banjar', status: 'NEGERI', guruCount: 10, tasCount: 2 },
  { npsn: '20225332', name: 'SDN 3 BANJAR', address: 'Jl. DR. Husein Kartasasmita No. 230 Banjar', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 21, tasCount: 2 },
  { npsn: '20225316', name: 'SDN 3 MEKARSARI', address: 'Jl. Gotong Royong No. 268', village: 'Mekarsari', district: 'Banjar', status: 'NEGERI', guruCount: 15, tasCount: 3 },
  { npsn: '20225319', name: 'SDN 3 NEGLASARI', address: 'Jalan Dr. Husein Kartasasmita No. 287', village: 'Neglasari', district: 'Banjar', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225253', name: 'SDN 4 MEKARSARI', address: 'Jalan Gerilya Nomor 153', village: 'Mekarsari', district: 'Banjar', status: 'NEGERI', guruCount: 17, tasCount: 3 },
  { npsn: '20225258', name: 'SDN 5 BANJAR', address: 'Jl. Dewi Sartika Gang Jeruk RT. 001 RW. 008 Lingk. Parunglesang', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 18, tasCount: 3 },
  { npsn: '20225250', name: 'SDN 5 MEKARSARI', address: 'Jalan Tentara Pelajar No. 123A', village: 'Mekarsari', district: 'Banjar', status: 'NEGERI', guruCount: 15, tasCount: 3 },
  { npsn: '20225247', name: 'SDN 8 BANJAR', address: 'Jalan KH. Mustofa No. 21', village: 'Banjar', district: 'Banjar', status: 'NEGERI', guruCount: 17, tasCount: 2 },
  
  // Kecamatan Purwaharja
  { npsn: '20225169', name: 'SDN 1 KARANGPANIMBAL', address: 'Jalan Siliwangi No. 21', village: 'Karangpanimbal', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225237', name: 'SDN 1 MEKARHARJA', address: 'Jalan Siliwangi No.271', village: 'Mekarharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225305', name: 'SDN 1 PURWAHARJA', address: 'Jalan Brigjen M. Isya SH No. 65', village: 'Purwaharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225306', name: 'SDN 1 RAHARJA', address: 'Jalan Siliwangi No. 85 Desa Raharja', village: 'Raharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 10, tasCount: 3 },
  { npsn: '20225293', name: 'SDN 2 KARANGPANIMBAL', address: 'Jalan Rawa Onom No. 22', village: 'Karangpanimbal', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225297', name: 'SDN 2 MEKARHARJA', address: 'Jalan Balai Desa Mekarharja, No 228', village: 'Mekarharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225326', name: 'SDN 2 PURWAHARJA', address: 'Jalan Brigjen M. Isya No. 118', village: 'Purwaharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225327', name: 'SDN 2 RAHARJA', address: 'Jalan Raya Majenang No. 35', village: 'Raharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225315', name: 'SDN 3 MEKARHARJA', address: 'Jalan Balai Desa Mekarharja No. 229', village: 'Mekarharja', district: 'Purwaharja', status: 'NEGERI', guruCount: 12, tasCount: 2 },
  
  // Kecamatan Pataruman
  { npsn: '20246325', name: 'SDIT USWATUN HASANAH', address: 'Dusun Gudang Jalan Pegadaian No. 91', village: 'Hegarsari', district: 'Pataruman', status: 'SWASTA', guruCount: 18, tasCount: 5 },
  { npsn: '20225165', name: 'SDN 1 BINANGUN', address: 'Jalan Tentara Pelajar No. 48', village: 'Binangun', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225168', name: 'SDN 1 HEGARSARI', address: 'Jl Bkr No 11 Kota Banjar', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225170', name: 'SDN 1 KARYAMUKTI', address: 'Dusun Cigadung Rt/rw. 09/04', village: 'Karyamukti', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225302', name: 'SDN 1 MULYASARI', address: 'Jalan Langkap Lancar No. 119', village: 'Mulyasari', district: 'Pataruman', status: 'NEGERI', guruCount: 16, tasCount: 2 },
  { npsn: '20225304', name: 'SDN 1 PATARUMAN', address: 'Jl. Serbaguna No.410 Jelat', village: 'Pataruman', district: 'Pataruman', status: 'NEGERI', guruCount: 14, tasCount: 2 },
  { npsn: '20225299', name: 'SDN 1 SUKAMUKTI', address: 'Jalan Pangandaran Dsn. Sukamulya RT. 07 RW.02', village: 'Sukamukti', district: 'Pataruman', status: 'NEGERI', guruCount: 10, tasCount: 2 },
  { npsn: '20225309', name: 'SDN 10 HEGARSARI', address: 'Lingkungan Jadimulya RT 01 RW 07', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225334', name: 'SDN 2 BATULAWANG', address: 'Dusun Cimanggu RT.08 RW.02', village: 'Batulawang', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225289', name: 'SDN 2 BINANGUN', address: 'Dusun Priagung', village: 'Binangun', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225292', name: 'SDN 2 HEGARSARI', address: 'Jln. Letjend Suwarto No. 181', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 18, tasCount: 2 },
  { npsn: '20225294', name: 'SDN 2 KARYAMUKTI', address: 'Karyamukti', village: 'Karyamukti', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225313', name: 'SDN 2 PATARUMAN', address: 'Jalan Kehutanan No. 53', village: 'Pataruman', district: 'Pataruman', status: 'NEGERI', guruCount: 9, tasCount: 3 },
  { npsn: '20255757', name: 'SDN 2 SUKAMUKTI', address: 'Jln. Giri Mukti', village: 'Sukamukti', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20246316', name: 'SDN 3 BATULAWANG', address: 'Dusun Tundangan RT. 20 RW. 06', village: 'Batulawang', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225325', name: 'SDN 3 KARYAMUKTI', address: 'Dusun Pabuaran', village: 'Karyamukti', district: 'Pataruman', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225318', name: 'SDN 3 MULYASARI', address: 'Dusun Margaluyu', village: 'Mulyasari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225320', name: 'SDN 3 PATARUMAN', address: 'Jl. Ir. Purnomo Sidi Lingkungan Pataruman', village: 'Pataruman', district: 'Pataruman', status: 'NEGERI', guruCount: 15, tasCount: 2 },
  { npsn: '20229663', name: 'SDN 4 BATULAWANG', address: 'Dusun Karangsari', village: 'Batulawang', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225255', name: 'SDN 4 PATARUMAN', address: 'Jalan Serbaguna No 409', village: 'Pataruman', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225259', name: 'SDN 5 HEGARSARI', address: 'Lingkungan Cikabuyutan Timur', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225249', name: 'SDN 5 PATARUMAN', address: 'Jl. Pelita No 7', village: 'Pataruman', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225242', name: 'SDN 6 HEGARSARI', address: 'Cikabuyutan Timur', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225245', name: 'SDN 7 HEGARSARI', address: 'Jalan Pangandaran No. 154', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225248', name: 'SDN 8 HEGARSARI', address: 'Jalan Pangandaran No 299', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225261', name: 'SDN 9 HEGARSARI', address: 'Jl Pangandaran No 298', village: 'Hegarsari', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225164', name: 'SDN 1 BATULAWANG', address: 'Jalan Cimanggu', village: 'Batulawang', district: 'Pataruman', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225311', name: 'SDN SINARTANJUNG', address: 'Jalan Ir. Purnomosidi No.163', village: 'SINARTANJUNG', district: 'Pataruman', status: 'NEGERI', guruCount: 16, tasCount: 2 },
  { npsn: '20253922', name: 'SDIT INSANTAMA', address: 'Jln. Kantor Pos Gg Rusa Nomor 237', village: 'Hegarsari', district: 'Pataruman', status: 'SWASTA', guruCount: 19, tasCount: 2 },
  
  // Kecamatan Langensari
  { npsn: '20268229', name: 'SD IT Darul Hikam', address: 'Jalan Sasagaran Margasari Rt 02 Rw 05', village: 'Bojongkantong', district: 'Langensari', status: 'SWASTA', guruCount: 6, tasCount: 1 },
  { npsn: '70036760', name: 'SD IT YAYASAN AL-FALAH', address: 'Jl.Pengairan PU no 7, Dusun Kedungaringin Rt 01/05', village: 'Waringinsari', district: 'Langensari', status: 'SWASTA', guruCount: 4, tasCount: 0 },
  { npsn: '20225184', name: 'SDN 1 LANGENSARI', address: 'Jalan Madjalikin No.252', village: 'Langensari', district: 'Langensari', status: 'NEGERI', guruCount: 14, tasCount: 2 },
  { npsn: '20225171', name: 'SDN 1 KUJANGSARI', address: 'Dusun Cijurey Rt 05 Rw 03', village: 'Kujangsari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225301', name: 'SDN 1 MUKTISARI', address: 'Lingkungan Langen RT 06 RW 01', village: 'Muktisari', district: 'Langensari', status: 'NEGERI', guruCount: 12, tasCount: 1 },
  { npsn: '20225307', name: 'SDN 1 REJASARI', address: 'Dusun Rancabulus RT 03 RW 04', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 7, tasCount: 1 },
  { npsn: '20225308', name: 'SDN 1 WARINGINSARI', address: 'Jalan Pelita II No.101', village: 'Waringinsari', district: 'Langensari', status: 'NEGERI', guruCount: 15, tasCount: 3 },
  { npsn: '20225290', name: 'SDN 2 BOJONGKANTONG', address: 'Jln. Bojongsari No. 153', village: 'Bojongkantong', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 3 },
  { npsn: '20225295', name: 'SDN 2 KUJANGSARI', address: 'Jalan Kujang No.19, Dusun Cijurey RT:05 RW:03', village: 'Kujangsari', district: 'Langensari', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225296', name: 'SDN 2 LANGENSARI', address: 'Jalan Rancawati No. 258', village: 'Langensari', district: 'Langensari', status: 'NEGERI', guruCount: 18, tasCount: 2 },
  { npsn: '20225298', name: 'SDN 2 MUKTISARI', address: 'Lingkungan Sidamukti RT. 05 RW. 05', village: 'Muktisari', district: 'Langensari', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225328', name: 'SDN 2 REJASARI', address: 'Dusun Sindanggalih', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 7, tasCount: 1 },
  { npsn: '20225330', name: 'SDN 2 WARINGINSARI', address: 'Jalan Pengairan Dusun Kedungwaringin Rt.07 Rw.06', village: 'Waringinsari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225335', name: 'SDN 3 BOJONGKANTONG', address: 'Dusun Margasari Rt.004 Rw.005', village: 'Bojongkantong', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225324', name: 'SDN 3 KUJANGSARI', address: 'Dusun Sindangmulya', village: 'Kujangsari', district: 'Langensari', status: 'NEGERI', guruCount: 16, tasCount: 2 },
  { npsn: '20225314', name: 'SDN 3 LANGENSARI', address: 'Jl. Pelita II No. 4 Langensari', village: 'Langensari', district: 'Langensari', status: 'NEGERI', guruCount: 15, tasCount: 2 },
  { npsn: '20225317', name: 'SDN 3 MUKTISARI', address: 'Jln. Ir. Purnomo Sidi Nomor : 182 Lingkungan Langen RT.03 RW.01', village: 'Muktisari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225321', name: 'SDN 3 REJASARI', address: 'Dusun Sindanggalih Rt 03 / Rw 06', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225322', name: 'SDN 3 WARINGINSARI', address: 'Jalan Pengairan PU', village: 'Waringinsari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225287', name: 'SDN 4 BOJONGKANTONG', address: 'Lingkungan Langkaplancar Rt. 03 Rw. 01', village: 'Bojongkantong', district: 'Langensari', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225251', name: 'SDN 4 KUJANGSARI', address: 'Sindangmulya', village: 'Kujangsari', district: 'Langensari', status: 'NEGERI', guruCount: 9, tasCount: 2 },
  { npsn: '20225252', name: 'SDN 4 LANGENSARI', address: 'Jalan Garuda Gang Angkasa 03 No. 281 Karangmukti', village: 'Langensari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225254', name: 'SDN 4 MUKTISARI', address: 'Lingkungan Sidamukti', village: 'Muktisari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225256', name: 'SDN 4 REJASARI', address: 'Jln. Wagino No 25', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225239', name: 'SDN 5 REJASARI', address: 'Dusun Sindanggalih', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225240', name: 'SDN 5 WARINGINSARI', address: 'Dusun Sukanagara', village: 'Waringinsari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
  { npsn: '20225244', name: 'SDN 6 REJASARI', address: 'Dusun Bantardawa', village: 'Rejasari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 1 },
  { npsn: '20225246', name: 'SDN 7 KUJANGSARI', address: 'Jalan KALAPASABRANG', village: 'Kujangsari', district: 'Langensari', status: 'NEGERI', guruCount: 8, tasCount: 2 },
];

export interface User {
  nip: string;
  name: string;
  role: 'guru' | 'kepala-sekolah' | 'pengawas' | 'dinas' | 'admin';
  email?: string; // Email untuk login Google
  active: boolean;
  school?: string; // Menambahkan field sekolah
  photo?: string; // Menyimpan foto profil (base64)
  subRole?: string; // Menambahkan sub-role spesifik (e.g. "Guru Kelas 1")
  
  // Additional fields for document generation context
  kepsekName?: string;
  kepsekNip?: string;
  pengawasName?: string;
  pengawasNip?: string;
  wilayahBinaan?: string;
  managedSchools?: string[]; // List of schools assigned to this user (for Pengawas)
  lastSeen?: string; // ISO date string for online status
  
  // Additional fields for Kepala Sekolah
  pangkat?: string;
  jabatan?: string;
  kecamatan?: string;
  
  // Workload Evidence Links
  workloadEvidence_v2?: Record<string, string>;
  // Workload Scores from Pengawas (0-100)
  workloadScores_v2?: Record<string, number>;
  workloadFeedback_v2?: string;
  workloadFeedbackDate_v2?: string;
  
  // Premium Features
  isPremium?: boolean;
}

export const DEFAULT_USERS: User[] = [
  { 
    nip: '196911142003121005', 
    name: 'Toha, S.Ag., M.Pd.I', 
    role: 'pengawas', 
    active: true, 
    school: 'Dinas Pendidikan',
    pangkat: 'Pembina Tk. I, IV/b',
    jabatan: 'Pengawas Sekolah Ahli Madya / Pengawas PAI SMP',
    wilayahBinaan: 'Kecamatan Banjar, Pataruman, Purwaharja, Langensari',
    managedSchools: [
      'SDN 1 BANJAR',
      'SDN 2 BANJAR',
      'SDN 3 BANJAR',
      'SDN 4 BANJAR',
      'SDN 5 BANJAR',
      'SDN 8 BANJAR',
      'SDN 1 MEKARSARI',
      'SDN 3 MEKARSARI',
      'SDN 4 MEKARSARI',
      'SDN 5 MEKARSARI',
      'SDN 1 BALOKANG',
      'SDN 2 BALOKANG',
      'SDN 3 BALOKANG',
      'SDN 1 NEGLASARI',
      'SDN 2 NEGLASARI',
      'SDN 3 NEGLASARI',
      'SDN 1 SITUBATU',
      'SDN 2 SITUBATU',
      'SDN 1 CIBEUREUM',
      'SDN 1 JAJAWAR',
      'SD INSPIRATIF AL-ILHAM',
      'SD Islam Al Istiqomah'
    ]
  },
  { 
    nip: '197502032003122003', 
    name: 'Sugiharti, S.Pd., M.Pd.', 
    role: 'pengawas', 
    active: true, 
    school: 'Dinas Pendidikan', 
    pangkat: 'Pembina Tk. I, IV/b', 
    jabatan: 'Pengawas Sekolah Ahli Madya', 
    wilayahBinaan: 'Kecamatan Banjar & Langensari', 
    managedSchools: [
      'SDN 1 LANGENSARI',
      'SDN 2 LANGENSARI',
      'SDN 3 LANGENSARI',
      'SDN 4 LANGENSARI',
      'SDN 1 WARINGINSARI',
      'SDN 2 WARINGINSARI',
      'SDN 3 WARINGINSARI',
      'SDN 5 WARINGINSARI',
      'SD IT YAYASAN AL-FALAH',
      'SDN 1 KUJANGSARI',
      'SDN 2 KUJANGSARI',
      'SDN 3 KUJANGSARI',
      'SDN 4 KUJANGSARI',
      'SDN 7 KUJANGSARI',
      'SDN 2 BOJONGKANTONG',
      'SDN 3 BOJONGKANTONG',
      'SDN 4 BOJONGKANTONG',
      'SD IT Darul Hikam'
    ]
  },
  { 
    nip: '198201052009022004', 
    name: 'Lany Maelany, S.Pd., M.Pd.', 
    role: 'pengawas', 
    active: true, 
    school: 'Dinas Pendidikan',
    pangkat: 'Penata Tk. I, III/b',
    jabatan: 'Pengawas Sekolah Ahli Muda',
    wilayahBinaan: 'Kecamatan Purwaharja & Langensari',
    managedSchools: [
      'SDN 1 PURWAHARJA',
      'SDN 2 PURWAHARJA',
      'SDN 1 KARANGPANIMBAL',
      'SDN 2 KARANGPANIMBAL',
      'SDN 1 RAHARJA',
      'SDN 2 RAHARJA',
      'SDN 1 MEKARHARJA',
      'SDN 2 MEKARHARJA',
      'SDN 3 MEKARHARJA',
      'SDN 1 REJASARI',
      'SDN 2 REJASARI',
      'SDN 3 REJASARI',
      'SDN 4 REJASARI',
      'SDN 5 REJASARI',
      'SDN 6 REJASARI',
      'SDN 1 MUKTISARI',
      'SDN 2 MUKTISARI',
      'SDN 3 MUKTISARI',
      'SDN 4 MUKTISARI'
    ]
  },
  { 
    nip: '198105132006041008', 
    name: 'Kasdi, S.Pd.I', 
    role: 'pengawas', 
    active: true, 
    school: 'Dinas Pendidikan',
    pangkat: 'Penata Tk. I, III/d',
    jabatan: 'Pengawas Sekolah Ahli Muda',
    wilayahBinaan: 'Kecamatan Pataruman, Purwaharja, Langensari',
    managedSchools: [
      'SDN 7 HEGARSARI',
      'SDN 8 HEGARSARI',
      'SDN 9 HEGARSARI',
      'SDN 1 BINANGUN',
      'SDN 2 BINANGUN',
      'SDN 1 SUKAMUKTI',
      'SDN 2 SUKAMUKTI',
      'SDN 1 BATULAWANG',
      'SDN 2 BATULAWANG',
      'SDN 3 BATULAWANG',
      'SDN 4 BATULAWANG',
      'SDN 1 KARYAMUKTI',
      'SDN 2 KARYAMUKTI',
      'SDN 3 KARYAMUKTI',
      'SDN 1 HEGARSARI',
      'SDN 2 HEGARSARI',
      'SDN 5 HEGARSARI',
      'SDN 6 HEGARSARI',
      'SDN 10 HEGARSARI',
      'SDIT USWATUN HASANAH',
      'SDIT INSANTAMA',
      'SDN 1 PATARUMAN',
      'SDN 2 PATARUMAN',
      'SDN 3 PATARUMAN',
      'SDN 4 PATARUMAN',
      'SDN 5 PATARUMAN',
      'SDN 1 MULYASARI',
      'SDN SINARTANJUNG',
      'SDN 3 MULYASARI'
    ]
  },
];

export const STORAGE_KEYS = {
  USERS: 'app_users_v3',
  RUNNING_TEXT: 'app_running_text_v2',
  CLASSES: 'app_classes_v2',
  GENERATED_DOCS: 'app_generated_docs_v3',
  SUPERVISIONS: 'app_supervisions_v3',
  SCHEDULES: 'app_schedules_v3',
  SCHOOL_VISITS: 'app_school_visits_v3',
  SCHOOLS: 'app_schools_v2',
};

export interface SchoolVisit {
  id: string;
  schoolName: string;
  visitorNip: string; // Pengawas NIP
  visitorName: string;
  date: string;
  purpose: string;
  findings: string;
  recommendations: string;
  status: 'planned' | 'completed';
  createdAt: string;
}

export interface ScheduleItem {
  day: string;
  time: string;
  subject: string;
}

export interface SupervisionReport {
  id: string;
  teacherNip: string;
  teacherName: string;
  date: string;
  semester: string;
  year: string;
  scores: Record<string, number>; // docName -> score (1-4)
  notes: Record<string, string>; // docName -> notes (optional)
  conclusion: string;
  followUp: string;
  finalScore: number;
  type?: 'administration' | 'observation' | 'planning' | 'planning_deep';
  school?: string; // School Name (for aggregation)
  // Additional fields for Planning Supervision
  subject?: string;
  topic?: string;
  learningGoals?: string;
  grade?: string; // Kelas/Semester
}

const DEFAULT_CLASSES: string[] = [];

export const isUserOnline = (lastSeen?: string, now: Date = new Date()) => {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 60000;
  return diffMinutes < 2; // Online if seen in last 2 minutes (buffer for 1 min heartbeat)
};

export const storageService = {
  // ... existing methods ...
  
  saveSupervision: (report: SupervisionReport) => {
    const key = `${STORAGE_KEYS.SUPERVISIONS}_${report.teacherNip}`;
    const stored = localStorage.getItem(key);
    let reports: SupervisionReport[] = stored ? JSON.parse(stored) : [];
    
    // Update existing or add new
    const existingIndex = reports.findIndex(r => r.id === report.id);
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    localStorage.setItem(key, JSON.stringify(reports));
  },

  getSupervisions: (teacherNip: string): SupervisionReport[] => {
    const key = `${STORAGE_KEYS.SUPERVISIONS}_${teacherNip}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  saveSchoolVisit: (visit: SchoolVisit) => {
    const key = `${STORAGE_KEYS.SCHOOL_VISITS}_${visit.schoolName}`;
    const stored = localStorage.getItem(key);
    let visits: SchoolVisit[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = visits.findIndex(v => v.id === visit.id);
    if (existingIndex >= 0) {
      visits[existingIndex] = visit;
    } else {
      visits.push(visit);
    }
    
    localStorage.setItem(key, JSON.stringify(visits));
  },

  getSchoolVisits: (schoolName: string): SchoolVisit[] => {
    const key = `${STORAGE_KEYS.SCHOOL_VISITS}_${schoolName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    
    let users = JSON.parse(stored);
    let hasChanges = false;

    // Sync DEFAULT_USERS updates to localStorage (ensuring managedSchools and profile data are up-to-date)
    DEFAULT_USERS.forEach(defaultUser => {
      const index = users.findIndex((u: User) => u.nip === defaultUser.nip);
      if (index !== -1) {
        const storedUser = users[index];
        // Check for critical field updates
        const needsUpdate = 
            JSON.stringify(storedUser.managedSchools) !== JSON.stringify(defaultUser.managedSchools) ||
            storedUser.wilayahBinaan !== defaultUser.wilayahBinaan ||
            storedUser.pangkat !== defaultUser.pangkat ||
            storedUser.jabatan !== defaultUser.jabatan ||
            storedUser.name !== defaultUser.name;

        if (needsUpdate) {
            users[index] = { ...storedUser, ...defaultUser };
            hasChanges = true;
        }
      } else {
        // Add missing default user
        users.push(defaultUser);
        hasChanges = true;
      }
    });

    // 3. Remove deprecated default users (Cleanup logic)
    const deprecatedNips = ['123456', '111111', '222222', '333333', '999999'];
    const originalLength = users.length;
    users = users.filter((u: User) => !deprecatedNips.includes(u.nip));
    
    if (users.length !== originalLength) {
        hasChanges = true;
    }

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return users;
  },

  getSchools: (): School[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    let schools: School[] = stored ? JSON.parse(stored) : [];
    
    // Always sync DEFAULT_SCHOOLS to ensure updates (renames, counts) are reflected
    let hasChanges = false;
    
    // 1. Update existing and add new from DEFAULT_SCHOOLS
    DEFAULT_SCHOOLS.forEach(defSchool => {
      const index = schools.findIndex(s => s.npsn === defSchool.npsn);
      if (index !== -1) {
        // Check for changes in key fields
        const current = schools[index];
        if (current.name !== defSchool.name || 
            current.guruCount !== defSchool.guruCount || 
            current.tasCount !== defSchool.tasCount ||
            current.status !== defSchool.status) {
           schools[index] = { ...current, ...defSchool };
           hasChanges = true;
        }
      } else {
        schools.push(defSchool);
        hasChanges = true;
      }
    });

    if (hasChanges || !stored) {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
    }
    
    return schools;
  },

  saveSchool: (school: School) => {
    const schools = storageService.getSchools();
    const existingIndex = schools.findIndex(s => s.npsn === school.npsn);
    
    if (existingIndex >= 0) {
      schools[existingIndex] = school;
    } else {
      schools.push(school);
    }
    
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  },

  getClasses: (): string[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
      return DEFAULT_CLASSES;
    }
    return JSON.parse(stored);
  },

  addClass: (className: string) => {
    const classes = storageService.getClasses();
    if (!classes.includes(className)) {
      classes.push(className);
      // Sort classes alphanumeric (optional, but good for display)
      classes.sort(); 
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    }
  },

  deleteClass: (className: string) => {
    const classes = storageService.getClasses().filter(c => c !== className);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const existingIndex = users.findIndex((u) => u.nip === user.nip);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    // Trigger event for syncing
    window.dispatchEvent(new CustomEvent('local-user-update', { detail: { type: 'save', user } }));
  },

  deleteUser: (nip: string) => {
    const users = storageService.getUsers().filter((u) => u.nip !== nip);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    // Trigger event for syncing
    window.dispatchEvent(new CustomEvent('local-user-update', { detail: { type: 'delete', nip } }));
  },

  syncUsers: (remoteUsers: User[]) => {
    const localUsers = storageService.getUsers();
    
    // Merge strategy:
    // 1. Add new users from Remote (Supabase)
    // 2. Update existing users (prefer Remote data as truth)
    
    remoteUsers.forEach(remoteUser => {
      const existingIndex = localUsers.findIndex(u => u.nip === remoteUser.nip);
      if (existingIndex >= 0) {
        // Update existing
        localUsers[existingIndex] = { ...localUsers[existingIndex], ...remoteUser };
      } else {
        // Add new
        localUsers.push(remoteUser);
      }
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(localUsers));
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('local-user-update', { detail: { type: 'sync', count: remoteUsers.length } }));
  },

  validateNip: (nip: string): User | undefined => {
    const users = storageService.getUsers();
    return users.find((u) => u.nip === nip && u.active);
  },

  getRunningText: (): string => {
    return localStorage.getItem(STORAGE_KEYS.RUNNING_TEXT) || 'Selamat Datang di Sistem Administrasi Guru';
  },

  saveRunningText: (text: string) => {
    localStorage.setItem(STORAGE_KEYS.RUNNING_TEXT, text);
    window.dispatchEvent(new Event('running-text-changed'));
    
    // Broadcast change to other tabs/windows using BroadcastChannel
    const bc = new BroadcastChannel('app_updates');
    bc.postMessage({ type: 'running_text_update', text });
    bc.close();
  },
  
  // Helper untuk menyimpan user yang sedang login di session/local storage agar persisten
  setCurrentUser: (user: User) => {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },
  
  getCurrentUser: (): User | null => {
    try {
      const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing current user:", error);
      return null;
    }
  },

  logout: () => {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
  },

  // Track generated documents per user
  addGeneratedDoc: (nip: string, docType: string, url: string) => {
    const key = `${STORAGE_KEYS.GENERATED_DOCS}_${nip}`;
    const stored = localStorage.getItem(key);
    let docs: { type: string; url: string; date: string }[] = [];
    
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      // Handle legacy string array
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        docs = parsed.map((t: string) => ({ type: t, url: '', date: new Date().toISOString() }));
      } else {
        docs = parsed;
      }
    } catch (e) {
      docs = [];
    }

    // Remove existing entry for this type to update it
    docs = docs.filter(d => d.type !== docType);
    
    docs.push({
      type: docType,
      url: url,
      date: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(docs));
  },

  getGeneratedDocs: (nip: string): { type: string; url: string; date: string }[] => {
    const key = `${STORAGE_KEYS.GENERATED_DOCS}_${nip}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      // Handle legacy string array
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map((t: string) => ({ type: t, url: '', date: '' }));
      }
      return parsed;
    } catch (e) {
      return [];
    }
  },

  getSchedule: (nip: string): ScheduleItem[] => {
    const key = `${STORAGE_KEYS.SCHEDULES}_${nip}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  saveSchedule: (nip: string, schedule: ScheduleItem[]) => {
    const key = `${STORAGE_KEYS.SCHEDULES}_${nip}`;
    localStorage.setItem(key, JSON.stringify(schedule));
  }
};
