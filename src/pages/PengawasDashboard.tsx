import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, LogOut, School, Users, X, ChevronRight, Settings, Save, Check, ClipboardList, PlusCircle } from 'lucide-react'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import RunningText from '../components/RunningText'
import { firebaseService } from '../services/firebaseService'
import { auth } from '../lib/firebase'
import { signInAnonymously } from 'firebase/auth'
import { User, storageService, SchoolVisit } from '../services/storage'
import { MANAJERIAL_DOCS, KEWIRAUSAHAAN_DOCS, SUPERVISI_EVIDENCE_DOCS } from '../constants/documents'



const PengawasHome = () => {
  const [stats, setStats] = useState({
    schools: 0,
    observations: 0,
    reports: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]); // All available schools from stats
  const [displayedSchools, setDisplayedSchools] = useState<string[]>([]); // Schools to show (filtered)
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolStatsMap, setSchoolStatsMap] = useState<any[]>([]);

  // Management Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tempManagedSchools, setTempManagedSchools] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Visit Reports State
  const [visitReports, setVisitReports] = useState<SchoolVisit[]>([]);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SchoolVisit | null>(null);

  // Assessment Modal State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [activeAssessmentPrincipal, setActiveAssessmentPrincipal] = useState<User | null>(null);
  const [assessmentScores, setAssessmentScores] = useState<Record<string, number>>({});

  const handleOpenAssessment = (principal: User) => {
    setActiveAssessmentPrincipal(principal);
    setAssessmentScores(principal.workloadScores || {});
    setIsAssessmentModalOpen(true);
  };

  const handleSaveAssessment = async () => {
    if (!activeAssessmentPrincipal) return;
    setIsSaving(true);
    try {
        const updatedUser = {
            ...activeAssessmentPrincipal,
            workloadScores: assessmentScores
        };
        await firebaseService.saveUser(updatedUser);
        
        setIsAssessmentModalOpen(false);
        setActiveAssessmentPrincipal(null);
    } catch (error) {
        console.error("Failed to save assessment", error);
        alert("Gagal menyimpan penilaian.");
    } finally {
        setIsSaving(false);
    }
  };

  // Subscribe to visits when school is selected
  useEffect(() => {
    if (selectedSchool) {
      const unsub = firebaseService.subscribeSchoolVisits(selectedSchool, (visits) => {
        setVisitReports(visits);
      });
      return () => unsub();
    } else {
      setVisitReports([]);
    }
  }, [selectedSchool]);

  useEffect(() => {
    // Initial User Load
    const localUser = storageService.getCurrentUser();
    setCurrentUser(localUser);

    let unsubStats: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        // Subscribe to School Stats (Aggregation)
        unsubStats = firebaseService.subscribeSchoolStats((statsData) => {
          setSchoolStatsMap(statsData); 
        });

        // Subscribe Users to get Realtime Role & Managed Schools updates
        unsubUsers = firebaseService.subscribeUsers((fetchedUsers) => {
             setUsers(fetchedUsers);
             
             // Update current user if found in realtime list
             if (localUser) {
               const foundMe = fetchedUsers.find(u => u.nip === localUser.nip);
               if (foundMe) {
                 setCurrentUser(foundMe);
               }
             }
        });

      } catch (error) {
        console.error("Error connecting to server:", error);
      }
    };

    init();

    return () => {
      if (unsubStats) unsubStats();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Combine schools from Users and Stats to get complete list
  useEffect(() => {
     const schoolsFromUsers = users.map(u => u.school).filter(Boolean) as string[];
     const schoolsFromStats = schoolStatsMap.map(s => s.schoolName);
     const unique = Array.from(new Set([...schoolsFromUsers, ...schoolsFromStats])).sort();
     setAllSchools(unique);
  }, [users, schoolStatsMap]);

  // Filter Displayed Schools whenever allSchools or currentUser changes
  useEffect(() => {
    if (currentUser?.managedSchools && currentUser.managedSchools.length > 0) {
      // Filter only managed schools
      const filtered = allSchools.filter(s => currentUser.managedSchools!.includes(s));
      setDisplayedSchools(filtered);
      setStats(prev => ({ ...prev, schools: filtered.length }));
    } else {
      // If no managed schools set, show ALL (or maybe none? usually none, but for fallback let's show all or prompt)
      // Requirement: "tambah/hapus sekolah binaan" implies default might be empty or full.
      // Let's default to showing ALL if nothing is configured, so they see something.
      // Or better: Show empty state if nothing configured, encouraging them to use the button.
      // But for backward compatibility with existing data, let's show ALL if managedSchools is undefined.
      if (!currentUser?.managedSchools) {
         setDisplayedSchools(allSchools);
         setStats(prev => ({ ...prev, schools: allSchools.length }));
      } else {
         // It is defined but empty array -> Show 0
         setDisplayedSchools([]);
         setStats(prev => ({ ...prev, schools: 0 }));
      }
    }
  }, [allSchools, currentUser]);

  const getSchoolStats = (schoolName: string) => {
    return schoolStatsMap.find(s => s.schoolName === schoolName);
  };

  const getSchoolUsers = (schoolName: string) => {
    return users.filter(u => u.school === schoolName);
  };

  const handleOpenManageModal = () => {
    // Initialize temp state with current managed schools
    const currentSet = new Set(currentUser?.managedSchools || []);
    // If undefined, maybe we want to start with ALL selected? 
    // No, better start with empty or what they have. 
    // If they had undefined (showing all), let's pre-select ALL so they don't lose view.
    if (!currentUser?.managedSchools && allSchools.length > 0) {
      // Pre-select all if it was undefined
       allSchools.forEach(s => currentSet.add(s));
    }
    setTempManagedSchools(currentSet);
    setIsManageModalOpen(true);
  };

  const toggleSchoolSelection = (school: string) => {
    const newSet = new Set(tempManagedSchools);
    if (newSet.has(school)) {
      newSet.delete(school);
    } else {
      newSet.add(school);
    }
    setTempManagedSchools(newSet);
  };

  const saveManagedSchools = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const schoolsToSave = Array.from(tempManagedSchools);
      await firebaseService.updateManagedSchools(currentUser.nip, schoolsToSave);
      setIsManageModalOpen(false);
    } catch (error) {
      console.error("Failed to save managed schools", error);
      alert("Gagal menyimpan data sekolah binaan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVisit = (schoolName?: string) => {
    const targetSchool = typeof schoolName === 'string' ? schoolName : selectedSchool;
    
    // Try to recover user session if missing
    let effectiveUser = currentUser;
    if (!effectiveUser) {
        const storedUser = storageService.getCurrentUser();
        if (storedUser) {
            effectiveUser = storedUser;
            setCurrentUser(storedUser);
        }
    }

    if (!effectiveUser) {
        alert("Sesi pengguna tidak valid. Silakan login kembali.");
        return;
    }

    if (!targetSchool) return;
    
    const newVisit: SchoolVisit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      schoolName: targetSchool,
      visitorNip: effectiveUser.nip,
      visitorName: effectiveUser.name,
      date: new Date().toISOString().split('T')[0],
      purpose: '',
      findings: '',
      recommendations: '',
      status: 'planned',
      createdAt: new Date().toISOString()
    };
    
    setEditingVisit(newVisit);
    setIsVisitModalOpen(true);
  };

  const handleEditVisit = (visit: SchoolVisit) => {
    setEditingVisit(visit);
    setIsVisitModalOpen(true);
  };

  const saveVisit = async (visit: SchoolVisit) => {
    setIsSaving(true);
    try {
      await firebaseService.saveSchoolVisit(visit);
      setIsVisitModalOpen(false);
      setEditingVisit(null);
    } catch (error) {
      console.error("Failed to save visit", error);
      alert("Gagal menyimpan laporan kunjungan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-purple-50 p-6 text-purple-900">
          <h3 className="text-lg font-semibold">Sekolah Dibina</h3>
          <p className="text-3xl font-bold">{stats.schools}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-6 text-green-900">
          <h3 className="text-lg font-semibold">Total Guru</h3>
          <p className="text-3xl font-bold">
            {users.filter(u => u.role === 'guru' && displayedSchools.includes(u.school || '')).length}
          </p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-6 text-blue-900">
          <h3 className="text-lg font-semibold">Total Kepala Sekolah</h3>
          <p className="text-3xl font-bold">
             {users.filter(u => u.role === 'kepala-sekolah' && displayedSchools.includes(u.school || '')).length}
          </p>
        </div>
      </div>

      {/* School List Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <School className="h-6 w-6 text-purple-700" />
             Daftar Sekolah Binaan (Progress Supervisi)
           </h2>
           <button
             onClick={handleOpenManageModal}
             className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition shadow-sm"
           >
             <Settings size={16} />
             Kelola Sekolah Binaan
           </button>
        </div>
        
        {displayedSchools.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
             {allSchools.length > 0 ? (
               <div className="flex flex-col items-center gap-2">
                 <p>Belum ada sekolah yang dipilih.</p>
                 <button onClick={handleOpenManageModal} className="text-purple-600 hover:underline">
                    Pilih Sekolah Binaan
                 </button>
               </div>
             ) : (
               "Belum ada data sekolah di sistem."
             )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedSchools.map((school) => {
              const teacherCount = users.filter(u => u.school === school && u.role === 'guru').length;
              const principal = users.find(u => u.school === school && u.role === 'kepala-sekolah');
              const stats = getSchoolStats(school);
              
              // Hitung progress guru secara global di sekolah ini
              let totalTeacherDocs = 0;
              if (stats && stats.teachers) {
                  Object.values(stats.teachers).forEach((t: any) => {
                      totalTeacherDocs += t.docs || 0;
                  });
              }
              // Asumsi 1 guru = 22 dokumen
              const maxDocs = teacherCount * 22; 
              const progressPercent = maxDocs > 0 ? Math.round((totalTeacherDocs / maxDocs) * 100) : 0;

              // Hitung progress KS
              let ksProgressPercent = 0;
              if (principal) {
                  const totalItems = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length;
                  const allIds = [
                      ...MANAJERIAL_DOCS.map(d => d.id),
                      ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                      ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
                  ];
                  const filledCount = allIds.filter(id => principal.workloadEvidence?.[id]).length;
                  ksProgressPercent = Math.round((filledCount / totalItems) * 100);
              }

              return (
                <button
                  key={school}
                  onClick={() => setSelectedSchool(school)}
                  className="flex flex-col gap-3 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:bg-purple-50 hover:shadow-md hover:border-purple-200 group"
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-900">{school}</h3>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                  </div>
                  
                  <div className="w-full space-y-2">
                     <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress Guru ({teacherCount})</span>
                        <span>{progressPercent}%</span>
                     </div>
                     <div className="h-2 w-full rounded-full bg-gray-100">
                        <div 
                            className="h-2 rounded-full bg-blue-500 transition-all" 
                            style={{ width: `${progressPercent}%` }}
                        />
                     </div>

                     <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Progress Kepala Sekolah</span>
                        <span>{ksProgressPercent}%</span>
                     </div>
                     <div className="h-2 w-full rounded-full bg-gray-100">
                        <div 
                            className="h-2 rounded-full bg-purple-500 transition-all" 
                            style={{ width: `${ksProgressPercent}%` }}
                        />
                     </div>
                  </div>

                  <div className="border-t pt-2 mt-1">
                      <p className="text-xs text-gray-500 mb-1">Kepala Sekolah:</p>
                      {principal ? (
                          <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] text-purple-700 font-bold">
                                  {principal.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-700 truncate">{principal.name}</span>
                          </div>
                      ) : (
                          <span className="text-xs italic text-red-400">Belum ada KS</span>
                      )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-md">
        <GoogleSyncWidget />
      </div>

      {/* Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <School className="h-5 w-5" />
                {selectedSchool}
              </h3>
              <button 
                onClick={() => setSelectedSchool(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-white/50 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Kepala Sekolah Section */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kepala Sekolah
                </h4>
                <div className="space-y-2">
                  {getSchoolUsers(selectedSchool).filter(u => u.role === 'kepala-sekolah').length > 0 ? (
                    getSchoolUsers(selectedSchool)
                      .filter(u => u.role === 'kepala-sekolah')
                      .map(user => (
                        <div key={user.nip} className="flex flex-col gap-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
                          <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-purple-900">{user.name}</p>
                                <p className="text-xs text-purple-600">NIP: {user.nip}</p>
                              </div>
                              <span className="ml-auto text-xs rounded-full bg-green-100 px-2 py-1 text-green-700">
                                Aktif
                              </span>
                          </div>
                          
                          {/* Progress Tugas Tambahan Kepala Sekolah */}
                          <div className="mt-1 border-t border-purple-100 pt-2">
                              {(() => {
                                  const totalItems = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length; // 18
                                  const allIds = [
                                      ...MANAJERIAL_DOCS.map(d => d.id),
                                      ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                                      ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
                                  ];
                                  const filledCount = allIds.filter(id => user.workloadEvidence?.[id]).length;
                                  const progressPercent = Math.round((filledCount / totalItems) * 100);
                                  
                                  // Score Calculation
                                  let totalScore = 0;
                                  let scoredCount = 0;
                                  if (user.workloadScores) {
                                      Object.values(user.workloadScores).forEach(score => {
                                          totalScore += score;
                                          scoredCount++;
                                      });
                                  }
                                  const avgScore = totalScore / 18;
                                  const category = avgScore <= 60 ? 'Perlu Perbaikan' : 
                                                   avgScore <= 75 ? 'Cukup' : 
                                                   avgScore <= 90 ? 'Baik' : 'Sangat Baik';
                                  const categoryColor = avgScore <= 60 ? 'text-red-600' : 
                                                        avgScore <= 75 ? 'text-yellow-600' : 
                                                        avgScore <= 90 ? 'text-blue-600' : 'text-green-600';

                                  return (
                                      <>
                                          <div className="flex justify-between text-xs text-purple-800 mb-1">
                                              <span>Progress Tugas Tambahan ({filledCount}/{totalItems})</span>
                                              <span className="font-bold">{progressPercent}%</span>
                                          </div>
                                          <div className="h-1.5 w-full rounded-full bg-purple-200 mb-2">
                                              <div className="h-1.5 rounded-full bg-purple-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                          </div>
                                          
                                          {scoredCount > 0 && (
                                              <div className="flex justify-between items-center text-xs mb-2">
                                                  <span className="text-gray-600">Nilai: <span className="font-bold">{avgScore.toFixed(1)}</span></span>
                                                  <span className={`font-bold ${categoryColor}`}>{category}</span>
                                              </div>
                                          )}

                                          <button 
                                              onClick={() => handleOpenAssessment(user)}
                                              className="w-full mt-1 flex items-center justify-center gap-1 rounded bg-purple-100 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition"
                                          >
                                              <CheckSquare size={14} />
                                              Nilai Beban Kerja
                                          </button>
                                      </>
                                  );
                              })()}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Kepala Sekolah terdaftar.</p>
                  )}
                </div>
              </div>

              {/* Guru Section */}
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Daftar Guru
                </h4>
                <div className="space-y-2">
                  {getSchoolUsers(selectedSchool).filter(u => u.role === 'guru').length > 0 ? (
                    getSchoolUsers(selectedSchool)
                      .filter(u => u.role === 'guru')
                      .map(user => {
                        // Ambil stats dari school_stats aggregation
                        const stats = getSchoolStats(selectedSchool);
                        let docCount = 0;
                        if (stats && stats.teachers && stats.teachers[user.nip]) {
                             docCount = stats.teachers[user.nip].docs || 0;
                        }
                        const totalDocs = 22; // Asumsi
                        const percent = Math.min(100, Math.round((docCount / totalDocs) * 100));

                        return (
                          <div key={user.nip} className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-gray-50 transition">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                  <div className="h-1.5 w-24 rounded-full bg-gray-200">
                                      <div 
                                          className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                          style={{ width: `${percent}%` }} 
                                      />
                                  </div>
                                  <span className="text-xs text-gray-500">{docCount}/{totalDocs} Docs</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                percent >= 100 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {percent >= 100 ? 'Selesai' : 'Proses'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Guru terdaftar.</p>
                  )}
                </div>
              </div>

              {/* Laporan Kunjungan Section */}
              <div className="mt-8 border-t pt-6">
                <div className="mb-4 flex items-center justify-between">
                   <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                     <ClipboardList className="h-4 w-4" />
                     Laporan Kunjungan
                   </h4>
                   <button
                     onClick={() => {
                        console.log("Tombol Buat Laporan diklik");
                        handleCreateVisit();
                     }}
                     className="flex items-center gap-1 rounded-md bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 transition"
                   >
                     <PlusCircle size={14} />
                     Buat Laporan
                   </button>
                </div>

                <div className="space-y-3">
                  {visitReports.length > 0 ? (
                    visitReports.map((visit) => (
                      <button
                        key={visit.id}
                        onClick={() => handleEditVisit(visit)}
                        className="w-full flex flex-col gap-2 rounded-lg border bg-white p-3 text-left hover:bg-gray-50 transition"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-medium text-gray-800">{visit.purpose || 'Kunjungan Rutin'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {visit.status === 'completed' ? 'Selesai' : 'Direncanakan'}
                          </span>
                        </div>
                        <div className="flex w-full items-center justify-between text-xs text-gray-500">
                           <span>{visit.date}</span>
                           <span className="truncate max-w-[150px]">{visit.visitorName}</span>
                        </div>
                        {visit.findings && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1 bg-gray-50 p-2 rounded">
                            {visit.findings}
                          </p>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-sm text-gray-400">Belum ada laporan kunjungan.</p>
                      <button onClick={() => handleCreateVisit()} className="text-xs text-purple-600 hover:underline mt-1">
                        Buat Laporan Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t bg-gray-50 p-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedSchool(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Schools Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
                 <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Kelola Sekolah Binaan
                 </h3>
                 <button onClick={() => setIsManageModalOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-white/50 transition">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                 <p className="mb-4 text-sm text-gray-600">Pilih sekolah yang berada di bawah pengawasan Anda.</p>
                 <div className="space-y-2">
                    {allSchools.map(school => (
                       <label key={school} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition">
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${tempManagedSchools.has(school) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                             {tempManagedSchools.has(school) && <Check size={14} className="text-white" />}
                          </div>
                          <input 
                             type="checkbox" 
                             className="hidden"
                             checked={tempManagedSchools.has(school)}
                             onChange={() => toggleSchoolSelection(school)}
                          />
                          <span className="text-sm font-medium text-gray-700">{school}</span>
                       </label>
                    ))}
                    {allSchools.length === 0 && <p className="text-center text-gray-400 italic py-4">Tidak ada data sekolah tersedia.</p>}
                 </div>
              </div>

              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                 <button 
                    onClick={() => setIsManageModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                 >
                    Batal
                 </button>
                 <button 
                    onClick={saveManagedSchools}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50"
                 >
                    {isSaving ? 'Menyimpan...' : (
                       <>
                          <Save size={16} />
                          Simpan Perubahan
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Visit Form Modal */}
      {isVisitModalOpen && editingVisit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
                 <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    {editingVisit.id ? 'Edit Laporan' : 'Buat Laporan Baru'}
                 </h3>
                 <button onClick={() => setIsVisitModalOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-white/50 transition">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kunjungan</label>
                    <input 
                       type="date"
                       value={editingVisit.date}
                       onChange={e => setEditingVisit({...editingVisit, date: e.target.value})}
                       className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Kunjungan</label>
                    <select
                       value={editingVisit.purpose}
                       onChange={e => setEditingVisit({...editingVisit, purpose: e.target.value})}
                       className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                       <option value="">-- Pilih Tujuan --</option>
                       <option value="Supervisi Manajerial">Supervisi Manajerial</option>
                       <option value="Monitoring Rutin">Monitoring Rutin</option>
                       <option value="Supervisi Akademik">Supervisi Akademik</option>
                       <option value="Evaluasi Program">Evaluasi Program</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temuan (Findings)</label>
                    <textarea 
                       rows={4}
                       value={editingVisit.findings}
                       onChange={e => setEditingVisit({...editingVisit, findings: e.target.value})}
                       className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                       placeholder="Catatan temuan selama kunjungan..."
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rekomendasi / Tindak Lanjut</label>
                    <textarea 
                       rows={3}
                       value={editingVisit.recommendations}
                       onChange={e => setEditingVisit({...editingVisit, recommendations: e.target.value})}
                       className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                       placeholder="Saran perbaikan atau tindak lanjut..."
                    />
                 </div>

                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                    <input 
                       type="checkbox"
                       id="statusCheck"
                       checked={editingVisit.status === 'completed'}
                       onChange={e => setEditingVisit({...editingVisit, status: e.target.checked ? 'completed' : 'planned'})}
                       className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="statusCheck" className="text-sm font-medium text-gray-700">Tandai sebagai Selesai</label>
                 </div>
              </div>

              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                 <button 
                    onClick={() => setIsVisitModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                 >
                    Batal
                 </button>
                 <button 
                    onClick={() => saveVisit(editingVisit)}
                    disabled={isSaving || !editingVisit.purpose}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50"
                 >
                    {isSaving ? 'Menyimpan...' : (
                       <>
                          <Save size={16} />
                          Simpan Laporan
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Assessment Modal */}
      {isAssessmentModalOpen && activeAssessmentPrincipal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
                 <div>
                    <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Penilaian Beban Kerja Kepala Sekolah
                    </h3>
                    <p className="text-sm text-purple-700">{activeAssessmentPrincipal.name} - {activeAssessmentPrincipal.school}</p>
                 </div>
                 <button onClick={() => setIsAssessmentModalOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-white/50 transition">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                 {/* Helper to render sections */}
                 {[
                    { title: "Tugas Manajerial", docs: MANAJERIAL_DOCS },
                    { title: "Pengembangan Kewirausahaan", docs: KEWIRAUSAHAAN_DOCS },
                    { title: "Supervisi Guru dan Tendik", docs: SUPERVISI_EVIDENCE_DOCS }
                 ].map((section, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700">
                            {section.title}
                        </div>
                        <div className="divide-y">
                            {section.docs.map((doc) => {
                                const score = assessmentScores[doc.id] || 0;
                                const hasEvidence = activeAssessmentPrincipal.workloadEvidence?.[doc.id];
                                
                                return (
                                    <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 text-sm">{doc.label}</p>
                                            {hasEvidence ? (
                                                <a href={activeAssessmentPrincipal.workloadEvidence?.[doc.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
                                                    <Check size={12} /> Lihat Bukti
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 mt-2 text-xs text-red-500">
                                                    <X size={12} /> Belum ada bukti
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-24">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                value={score}
                                                onChange={(e) => {
                                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                    setAssessmentScores(prev => ({
                                                        ...prev,
                                                        [doc.id]: val
                                                    }));
                                                }}
                                                className="w-full text-center rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 ))}
              </div>

              <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                 <div className="flex-1 flex items-center text-sm text-gray-600">
                    <span>Rata-rata Nilai: </span>
                    <span className="ml-2 font-bold text-lg text-purple-700">
                        {(Object.values(assessmentScores).reduce((a, b) => a + b, 0) / 18).toFixed(1)}
                    </span>
                 </div>
                 <button 
                    onClick={() => setIsAssessmentModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                 >
                    Batal
                 </button>
                 <button 
                    onClick={handleSaveAssessment}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50"
                 >
                    {isSaving ? 'Menyimpan...' : (
                       <>
                          <Save size={16} />
                          Simpan Penilaian
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

const PengawasPenilaian = () => (
  <div>
    <h2 className="mb-4 text-lg font-semibold">Penilaian Kinerja</h2>
    <p className="text-gray-600">Daftar penilaian dan status tindak lanjut.</p>
  </div>
)

const PengawasDashboard = () => {
  const location = useLocation()
  const isActive = (path: string) => (location.pathname === path ? 'bg-purple-700' : '')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-purple-800 text-white">
        <div className="p-6 text-xl font-bold">Pengawas</div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link to="/pengawas" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-purple-700 ${isActive('/pengawas')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/pengawas/penilaian" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-purple-700 ${isActive('/pengawas/penilaian')}`}>
            <CheckSquare size={20} />
            Penilaian
          </Link>
          <Link to="/" className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-purple-700 hover:text-red-100">
            <LogOut size={20} />
            Keluar
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <RunningText />
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{location.pathname === '/pengawas' ? 'Ringkasan' : 'Penilaian'}</h1>
          <div className="text-gray-600">Selamat datang, Pengawas</div>
        </header>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Routes>
            <Route path="/" element={<PengawasHome />} />
            <Route path="/penilaian" element={<PengawasPenilaian />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default PengawasDashboard
