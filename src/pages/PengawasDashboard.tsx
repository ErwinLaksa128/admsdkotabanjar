import { useEffect, useState, useMemo, Component, ReactNode } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, LogOut, School as SchoolIcon, Users, X, ChevronRight, Settings, Save, Check, ClipboardList, PlusCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import GoogleSyncWidget from '../components/GoogleSyncWidget'
import RunningText from '../components/RunningText'
import WorkloadAssessmentModal from '../components/WorkloadAssessmentModal'
import SupervisionListModal from '../components/SupervisionListModal'
import { supabaseService } from '../services/supabaseService'
import { User, storageService, SchoolVisit, School, SupervisionReport } from '../services/storage'
import { MANAJERIAL_DOCS, KEWIRAUSAHAAN_DOCS, SUPERVISI_EVIDENCE_DOCS, ADMIN_DOCS } from '../constants/documents'

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
          <h3 className="text-lg font-bold text-red-800 mb-2">Terjadi Kesalahan pada Dashboard</h3>
          <p className="text-sm text-red-700 mb-4">Mohon maaf, terjadi kesalahan saat memuat komponen ini.</p>
          <div className="bg-white p-4 rounded border border-red-100 mb-4 overflow-auto max-h-40">
            <code className="text-xs text-red-600 block">
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper to get the best principal for a school (prioritizing active and evidence count)
const getBestPrincipal = (users: User[], schoolName: string): User | undefined => {
  const normalize = (str: string | undefined | null) => str?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
  const targetSchool = normalize(schoolName);
  
  const candidates = users.filter(u => 
      normalize(u.school) === targetSchool && 
      u.role === 'kepala-sekolah'
  );

  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Filter active ones first
  const activeCandidates = candidates.filter(u => u.active);
  const pool = activeCandidates.length > 0 ? activeCandidates : candidates;

  // Sort by evidence count (descending)
  return pool.sort((a, b) => {
      const evidenceA = { ...((a as any).workloadEvidence || {}), ...(a.workloadEvidence_v2 || {}) };
      const evidenceB = { ...((b as any).workloadEvidence || {}), ...(b.workloadEvidence_v2 || {}) };
      
      const countA = Object.keys(evidenceA).length;
      const countB = Object.keys(evidenceB).length;
      return countB - countA;
  })[0];
};

interface PengawasHomeProps {
  users: User[];
  currentUser: User | null;
}

const PengawasHome = ({ users, currentUser }: PengawasHomeProps) => {
  const [schoolsData, setSchoolsData] = useState<School[]>([]); // Full School Objects
  const [displayedSchools, setDisplayedSchools] = useState<School[]>([]); // Schools to show (filtered)
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedSchoolDocs, setSelectedSchoolDocs] = useState<any[]>([]);
  const [schoolStatsMap, setSchoolStatsMap] = useState<any[]>([]);

  // Management Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tempManagedSchools, setTempManagedSchools] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Visit Reports State
  const [allVisits, setAllVisits] = useState<SchoolVisit[]>([]);
  const [allSupervisions, setAllSupervisions] = useState<SupervisionReport[]>([]);

  // Workload Assessment State (for Principals)
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [assessmentPrincipal, setAssessmentPrincipal] = useState<User | null>(null);

  // Supervision List Modal State
  const [isSupervisionListModalOpen, setIsSupervisionListModalOpen] = useState(false);
  const [supervisionModalProps, setSupervisionModalProps] = useState<{school: string, principal: string} | null>(null);

  // Fresh Principal Data (Direct Fetch)
  const [freshPrincipals, setFreshPrincipals] = useState<User[]>([]);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);




  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // DEBUG: Monitor users updates
  useEffect(() => {
    if (users.length > 0) {
        const target = users.find(u => u.nip === '222224');
        console.log("DEBUG: Target Principal Data in Dashboard:", target);
        if (target) {
            console.log("DEBUG: Evidence:", target.workloadEvidence_v2);
        }
    }
  }, [users]);

  useEffect(() => {
    // Initial User Load - Handled by Parent
    
    let unsubStats: (() => void) | undefined;
    let unsubAllSupervisions: (() => void) | undefined;

    const init = async () => {
      try {
        // Subscribe to School Stats (Aggregation)
        unsubStats = supabaseService.subscribeSchoolStats((statsData) => {
          console.log("DEBUG: School Stats Updated", statsData.length);
          setSchoolStatsMap(statsData); 
        });

        // Subscribe to All Supervisions (Global)
        unsubAllSupervisions = supabaseService.subscribeAllSupervisions((reports) => {
            setAllSupervisions(reports);
        });

      } catch (error) {
        console.error("Error connecting to server:", error);
      }
    };

    init();

    return () => {
      if (unsubStats) unsubStats();
      if (unsubAllSupervisions) unsubAllSupervisions();
    };
  }, []);

  // Subscribe to Visits when currentUser changes
  useEffect(() => {
     if (currentUser) {
        const unsub = supabaseService.subscribeVisitsByVisitor(currentUser.nip, (visits) => {
            setAllVisits(visits);
        });
        return () => unsub();
     }
  }, [currentUser]);

  // Load Schools from Storage
  useEffect(() => {
     setSchoolsData(storageService.getSchools());
  }, []);

  // Filter Displayed Schools whenever schoolsData or currentUser changes
  useEffect(() => {
    if (currentUser?.managedSchools && currentUser.managedSchools.length > 0) {
      // Filter only managed schools
      const filtered = schoolsData.filter(s => currentUser.managedSchools!.includes(s.name));
      setDisplayedSchools(filtered);
    } else {
      // If no managed schools set, show ALL (or maybe none? usually none, but for fallback let's show all or prompt)
      // Requirement: "tambah/hapus sekolah binaan" implies default might be empty or full.
      // Let's default to showing ALL if nothing is configured, so they see something.
      // Or better: Show empty state if nothing configured, encouraging them to use the button.
      // But for backward compatibility with existing data, let's show ALL if managedSchools is undefined.
      if (!currentUser?.managedSchools) {
         setDisplayedSchools([]);
      } else {
         // It is defined but empty array -> Show 0
         setDisplayedSchools([]);
      }
    }
  }, [schoolsData, currentUser]);

  // Subscribe to Generated Docs for Selected School
  useEffect(() => {
    if (selectedSchool) {
        // Reset first
        setSelectedSchoolDocs([]);
        
        // Fetch fresh generated docs
        const unsubscribe = supabaseService.subscribeGeneratedDocsBySchool(selectedSchool, (data) => {
            setSelectedSchoolDocs(data);
        });

        // Fetch fresh principal data to ensure we have latest evidence
        setIsLoadingFresh(true);
        supabaseService.getPrincipalsBySchool(selectedSchool)
            .then(data => {
                console.log("DEBUG: Fresh principals fetched:", data);
                setFreshPrincipals(data);
            })
            .catch(err => console.error("Error fetching fresh principals:", err))
            .finally(() => setIsLoadingFresh(false));

        return () => {
            unsubscribe();
        };
    } else {
        setFreshPrincipals([]);
    }
  }, [selectedSchool]);

  // Keep assessmentPrincipal in sync with real-time users to reflect evidence updates
  useEffect(() => {
    if (assessmentPrincipal) {
       const updated = users.find(u => u.nip === assessmentPrincipal.nip);
       if (updated) {
          setAssessmentPrincipal(updated);
       }
    }
  }, [users, assessmentPrincipal?.nip]);

  const normalize = (str: string | undefined | null) => str?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

  const getSchoolStats = (schoolName: string) => {
    return schoolStatsMap.find(s => normalize(s.schoolName) === normalize(schoolName));
  };

  const getSchoolUsers = (schoolName: string) => {
    return users.filter(u => normalize(u.school) === normalize(schoolName));
  };

  // Chart Data Preparation
  const chartData = useMemo(() => {
    try {
      // 1. School Activity (Visits + Supervisions)
      const schoolActivityData = displayedSchools.map(school => {
         const visitCount = allVisits.filter(v => normalize(v.schoolName) === normalize(school.name)).length;
         const supervisionCount = allSupervisions.filter(r => (r as any).school === school.name || normalize((r as any).school) === normalize(school.name)).length;
         
         return {
           name: school.name.replace('SDN ', '').replace('SDIT ', '').substring(0, 10), // Short name
           fullName: school.name,
           visits: visitCount,
           supervisions: supervisionCount,
           total: visitCount + supervisionCount
         };
      }).sort((a, b) => b.total - a.total).slice(0, 10); // Top 10 active schools
  
      // 2. Monthly Trend (Cumulative Teacher Supervision)
      const monthlyData: any[] = [];
      // 2b. Monthly Trend (School Activity) - RESTORED
      const schoolActivityTrendData: any[] = [];
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0-based index
      
      // Calculate Total Teachers in Managed Schools
      const totalTeachersCount = displayedSchools.reduce((acc, s) => acc + (s.guruCount || 0), 0);
  
      // Add start point (0)
      monthlyData.push({
          name: '', 
          perencanaan: 0,
          pelaksanaan: 0,
          instrumen: 0,
          totalTeachers: totalTeachersCount
      });
  
      schoolActivityTrendData.push({
          name: '',
          manajerial: 0,
          monitoring: 0,
          akademik: 0,
          evaluasi: 0,
          totalSchools: displayedSchools.length
      });
  
      // Iterate from January (0) to December (11) of the current year
      for (let i = 0; i < 12; i++) {
          const monthLabel = months[i];
          
          // Only calculate coverage if month is within range (<= current month)
          let perencanaan: number | null = null;
          let pelaksanaan: number | null = null;
          let instrumen: number | null = null;
  
          let manajerial: number | null = null;
          let monitoring: number | null = null;
          let akademik: number | null = null;
          let evaluasi: number | null = null;
          
          if (i <= currentMonthIndex) {
              const endOfMonth = new Date(currentYear, i + 1, 0); // Last day of month i
              
              // Sets to track unique TEACHERS per category
              const perencanaanSet = new Set<string>();
              const pelaksanaanSet = new Set<string>();
              const instrumenSet = new Set<string>();
  
              // Sets to track unique SCHOOLS per category (Activity)
              const manajerialSet = new Set<string>();
              const monitoringSet = new Set<string>();
              const akademikSet = new Set<string>();
              const evaluasiSet = new Set<string>();
  
              // Helper to check if school is managed
              const isManagedSchool = (name: string) => displayedSchools.some(s => normalize(s.name) === normalize(name));
  
              // Process Visits for Activity
              allVisits.forEach(v => {
                  const vDate = new Date(v.date);
                  if (vDate.getFullYear() === currentYear && vDate <= endOfMonth) {
                      if (isManagedSchool(v.schoolName)) {
                          const purpose = (v.purpose || '').toLowerCase();
                          const school = normalize(v.schoolName);
                          
                          // Categorization Logic
                          if (purpose.includes('manajerial')) {
                              manajerialSet.add(school);
                          } else if (purpose.includes('evaluasi')) {
                              evaluasiSet.add(school);
                          } else if (purpose.includes('akademik')) {
                              akademikSet.add(school);
                          } else {
                              // Default to Monitoring Rutin
                              monitoringSet.add(school);
                          }
                      }
                  }
              });
  
              // Process Supervisions for both Teacher Progress and School Activity (Akademik)
              allSupervisions.forEach(r => {
                   const sDate = new Date(r.date);
                   // Check if report is within the cumulative period (up to end of this month)
                   if (sDate.getFullYear() === currentYear && sDate <= endOfMonth) {
                       const schoolName = (r as any).school;
                       // Only count if school is managed
                       if (schoolName && isManagedSchool(schoolName)) {
                          const type = r.type;
                          const teacherId = r.teacherNip || r.teacherName; // Use NIP or Name as unique identifier
                          
                          // For Teacher Supervision Progress
                          if (type === 'planning' || type === 'planning_deep') {
                              perencanaanSet.add(teacherId);
                          } else if (type === 'observation') {
                              pelaksanaanSet.add(teacherId);
                          } else if (type === 'administration') {
                              instrumenSet.add(teacherId);
                          }
  
                          // For School Activity (Akademik)
                          akademikSet.add(normalize(schoolName));
                       }
                   }
              });
              
              perencanaan = perencanaanSet.size;
              pelaksanaan = pelaksanaanSet.size;
              instrumen = instrumenSet.size;
  
              manajerial = manajerialSet.size;
              monitoring = monitoringSet.size;
              akademik = akademikSet.size;
              evaluasi = evaluasiSet.size;
          }
  
          monthlyData.push({
              name: `${monthLabel}`,
              perencanaan,
              pelaksanaan,
              instrumen,
              totalTeachers: totalTeachersCount
          });
  
          schoolActivityTrendData.push({
              name: `${monthLabel}`,
              manajerial,
              monitoring,
              akademik,
              evaluasi,
              totalSchools: displayedSchools.length
          });
      }
  
      // 3. Teacher Admin Progress per School
      const adminProgressData = displayedSchools.map(school => {
          const stats = getSchoolStats(school.name);
          let totalDocs = 0;
          let teacherCount = 0;
          
          if (stats && stats.teachers) {
              Object.values(stats.teachers).forEach((t: any) => {
                  totalDocs += (t.docs || 0);
                  teacherCount++;
              });
          }
          
          const avgDocs = teacherCount > 0 ? Math.round(totalDocs / teacherCount) : 0;
          
          return {
              name: school.name.replace('SDN ', '').replace('SDIT ', '').substring(0, 10),
              fullName: school.name,
              avgDocs: avgDocs,
              totalDocs: stats?.totalDocs || 0
          };
      }).sort((a, b) => b.avgDocs - a.avgDocs).slice(0, 10);
  
      // 5. Overall Principal Progress Trend (Line Chart)
      const ksProgressTrendData: any[] = [];
      
      // Add start point (0)
      ksProgressTrendData.push({
          name: '', 
          progress: 0
      });
  
      for (let i = 0; i < 12; i++) {
          const monthLabel = months[i];
          let progress: number | null = null;
          
          if (i <= currentMonthIndex) {
              let totalPossibleDocs = 0;
              let totalFilledDocs = 0;
              
              const managedPrincipals = displayedSchools
                .map(s => getBestPrincipal(users, s.name))
                .filter((p): p is User => !!p);
  
              managedPrincipals.forEach(p => {
                   const totalItems = (MANAJERIAL_DOCS?.length || 0) + (KEWIRAUSAHAAN_DOCS?.length || 0) + (SUPERVISI_EVIDENCE_DOCS?.length || 0);
                   const allIds = [
                      ...(MANAJERIAL_DOCS?.map(d => d.id) || []),
                      ...(KEWIRAUSAHAAN_DOCS?.map(d => d.id) || []),
                      ...(SUPERVISI_EVIDENCE_DOCS?.map(d => d.id) || [])
                   ];
                   const evidence = p.workloadEvidence_v2 || (p as any).workloadEvidence || {};
                   const filledCount = allIds.filter(id => evidence[id]).length;
                   
                   totalPossibleDocs += totalItems;
                   totalFilledDocs += filledCount;
              });
  
              const globalAvg = totalPossibleDocs > 0 ? Math.round((totalFilledDocs / totalPossibleDocs) * 100) : 0;
              
              progress = Math.round((globalAvg * (i + 1)) / (currentMonthIndex + 1));
          }
  
          ksProgressTrendData.push({
              name: `${monthLabel}`,
              progress: progress
          });
      }
  
      return { schoolActivityData, monthlyData, schoolActivityTrendData, adminProgressData, ksProgressTrendData };
    } catch (err) {
      console.error("Error calculating chart data:", err);
      return { 
        schoolActivityData: [], 
        monthlyData: [], 
        schoolActivityTrendData: [], 
        adminProgressData: [], 
        ksProgressTrendData: [] 
      };
    }
  }, [displayedSchools, allVisits, allSupervisions, schoolStatsMap, users]);

  const handleOpenManageModal = () => {
    // Initialize temp state with current managed schools
    const currentSet = new Set(currentUser?.managedSchools || []);
    // If undefined, maybe we want to start with ALL selected? 
    // No, better start with empty or what they have. 
    // If they had undefined (showing all), let's pre-select ALL so they don't lose view.
    if (!currentUser?.managedSchools && schoolsData.length > 0) {
      // Pre-select all if it was undefined
       schoolsData.forEach(s => currentSet.add(s.name));
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
      await supabaseService.updateManagedSchools(currentUser.nip, schoolsToSave);
      setIsManageModalOpen(false);
    } catch (error) {
      console.error("Failed to save managed schools", error);
      alert("Gagal menyimpan data sekolah binaan");
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="space-y-8">
      {/* Stats Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-purple-50 p-6 text-purple-900">
          <h3 className="text-lg font-semibold">Sekolah Binaan</h3>
          <p className="text-3xl font-bold">{displayedSchools.length}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-6 text-green-900">
          <h3 className="text-lg font-semibold">Total Guru</h3>
          <p className="text-3xl font-bold">
            {displayedSchools.reduce((acc, s) => acc + (s.guruCount || 0), 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-6 text-blue-900">
          <h3 className="text-lg font-semibold">Total Kepala Sekolah</h3>
          <p className="text-3xl font-bold">
             {users.filter(u => u.role === 'kepala-sekolah' && displayedSchools.some(s => s.name === u.school)).length}
          </p>
        </div>
      </div>

      {/* NEW CHARTS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Chart 1: School Activity (RESTORED) */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
           <h3 className="mb-4 text-sm font-semibold text-gray-700">Grafik Aktivitas Sekolah (Tahun {new Date().getFullYear()})</h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData.schoolActivityTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 10}} />
                 <YAxis 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false} 
                    label={{ value: 'Jumlah Sekolah', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                 />
                 <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 {!isMobile && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '8px' }} />}
                 <Line 
                    type="monotone" 
                    dataKey="manajerial" 
                    name="Supervisi Manajerial" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="monitoring" 
                    name="Monitoring Rutin" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="akademik" 
                    name="Supervisi Akademik" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="evaluasi" 
                    name="Evaluasi Program" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="step" 
                    dataKey="totalSchools" 
                    name="Target (Total Sekolah)" 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5" 
                    strokeWidth={2} 
                    dot={false} 
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 2: Principal Progress Trend */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
           <h3 className="mb-4 text-sm font-semibold text-gray-700">Tren Progres Kepala Sekolah</h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData.ksProgressTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 10}} />
                 <YAxis unit="%" domain={[0, 100]} />
                 <RechartsTooltip />
                 {!isMobile && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '8px' }} />}
                 <Line 
                    type="monotone" 
                    dataKey="progress" 
                    name="Progres Akumulasi" 
                    stroke="#8884d8" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 3: Teacher Supervision (Cumulative) - NOW PRIMARY */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
           <h3 className="mb-4 text-sm font-semibold text-gray-700">Grafik Supervisi Guru (Kumulatif)</h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 12}} />
                 <YAxis 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false} 
                    label={{ value: 'Jumlah Guru', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                 />
                 <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 {!isMobile && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '8px' }} />}
                 <Line 
                    type="monotone" 
                    dataKey="perencanaan" 
                    name="Perencanaan" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="pelaksanaan" 
                    name="Pelaksanaan" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="instrumen" 
                    name="Instrumen" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                 />
                 <Line 
                    type="step" 
                    dataKey="totalTeachers" 
                    name="Target (Total Guru)" 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5" 
                    strokeWidth={2} 
                    dot={false} 
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* School List Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <SchoolIcon className="h-6 w-6 text-purple-700" />
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
             {schoolsData.length > 0 ? (
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
          <div className="flex flex-col gap-3">
            {displayedSchools.map((school) => {
              const teacherCount = users.filter(u => normalize(u.school) === normalize(school.name) && u.role === 'guru').length;
              
              const principal = getBestPrincipal(users, school.name);

              const stats = getSchoolStats(school.name);
              
              // Hitung progress guru berdasarkan status supervisi
              // Logic: Jumlah guru yang sudah disupervisi (minimal 1x) / Total Guru
              const schoolSupervisions = allSupervisions.filter(r => 
                  (r as any).school === school.name || 
                  normalize((r as any).school) === normalize(school.name)
              );
              // Count unique teachers who have ANY supervision
              const supervisedTeacherNips = new Set(schoolSupervisions.map(r => r.teacherNip || r.teacherName));
              const supervisedCount = supervisedTeacherNips.size;
              
              // Gunakan guruCount dari database sekolah jika ada, sebagai penyebut (denominator)
              const totalGurus = school.guruCount || teacherCount || 1; 
              
              // Calculate Percentage based on Supervision coverage
              const supervisionProgressPercent = totalGurus > 0 ? Math.round((supervisedCount / totalGurus) * 100) : 0;
              
              // Also keep document progress calculation if needed for other things, but for the card display we use supervision progress
              let totalTeacherDocs = 0;
              if (stats && stats.teachers) {
                  Object.values(stats.teachers).forEach((t: any) => {
                      totalTeacherDocs += t.docs || 0;
                  });
              }

              // Hitung progress KS
              let ksProgressPercent = 0;
              let ksFilledCount = 0;
              let ksTotalItems = 0;

              if (principal) {
                  const totalItems = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length;
                  const allIds = [
                      ...MANAJERIAL_DOCS.map(d => d.id),
                      ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                      ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
                  ];
                  // Fix: Merge v2 and legacy evidence to be consistent with detail modal
                  const evidence = { ...((principal as any).workloadEvidence || {}), ...(principal.workloadEvidence_v2 || {}) };
                  const filledCount = allIds.filter(id => evidence[id]).length;
                  ksProgressPercent = Math.round((filledCount / totalItems) * 100);
                  
                  ksFilledCount = filledCount;
                  ksTotalItems = totalItems;
              }

              return (
                <button
                  key={school.name}
                  onClick={() => setSelectedSchool(school.name)}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 text-left shadow-sm transition hover:bg-purple-50 hover:shadow-md hover:border-purple-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-900 truncate">{school.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Users className="h-3 w-3" />
                        {principal ? (
                            <span>{principal.name}</span>
                        ) : (
                            <span className="text-red-400 italic">Belum ada KS</span>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 mr-4">
                     <div className="text-right min-w-[80px]">
                        <p className="text-xs text-gray-500 mb-1">Supervisi Guru</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${supervisionProgressPercent}%` }}></div>
                            </div>
                            <span className="font-medium text-blue-600 text-sm">{supervisionProgressPercent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{supervisedCount}/{totalGurus} Guru</p>
                     </div>

                     <div className="text-right min-w-[80px]">
                        <p className="text-xs text-gray-500 mb-1">Progress KS</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${ksProgressPercent}%` }}></div>
                            </div>
                            <span className="font-medium text-purple-600 text-sm">{ksProgressPercent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {principal ? `${ksFilledCount}/${ksTotalItems} Dokumen` : '-'}
                        </p>
                     </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>



      {/* Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <SchoolIcon className="h-5 w-5" />
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
                  {(() => {
                    // Use fresh data if available, otherwise fallback to global state
                    let bestPrincipal: User | undefined;
                    
                    if (freshPrincipals.length > 0) {
                        bestPrincipal = getBestPrincipal(freshPrincipals, selectedSchool);
                    }
                    
                    if (!bestPrincipal) {
                        bestPrincipal = getBestPrincipal(users, selectedSchool);
                    }
                    
                    const displayPrincipals = bestPrincipal ? [bestPrincipal] : [];
                    
                    if (isLoadingFresh && displayPrincipals.length === 0) {
                         return <p className="text-sm text-purple-600 animate-pulse p-4">Memuat data kepala sekolah...</p>;
                    }

                    return displayPrincipals.length > 0 ? (
                      displayPrincipals.map(user => (
                        <div key={user.nip} className="flex flex-col gap-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
                          <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-purple-900">{user.name}</p>
                                <p className="text-xs text-purple-600">NIP: {user.nip}</p>
                              </div>
                              {user.active && (
                                <span className="ml-auto text-xs rounded-full bg-green-100 px-2 py-1 text-green-700">
                                  Aktif
                                </span>
                              )}
                          </div>
                          
                          {/* Progress Tugas Tambahan Kepala Sekolah */}
                          <div className="mt-1 border-t border-purple-100 pt-2">
                              {(() => {
                                  try {
                                      if (!MANAJERIAL_DOCS || !KEWIRAUSAHAAN_DOCS || !SUPERVISI_EVIDENCE_DOCS) {
                                          return <p className="text-xs text-red-500">Error: Konfigurasi dokumen tidak ditemukan.</p>;
                                      }

                                      const totalItems = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length; // 18
                                      const allIds = [
                                          ...MANAJERIAL_DOCS.map(d => d.id),
                                          ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                                          ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
                                      ];
                                      
                                      // Fix: Merge v2 and legacy evidence
                                      const evidence = { ...((user as any).workloadEvidence || {}), ...(user.workloadEvidence_v2 || {}) };
                                      const filledCount = allIds.filter(id => evidence[id]).length;
                                      const progressPercent = Math.round((filledCount / totalItems) * 100);
                                      
                                      // Score Calculation
                                      let totalScore = 0;
                                      let scoredCount = 0;
                                      if (user.workloadScores_v2) {
                                          Object.values(user.workloadScores_v2).forEach(score => {
                                              totalScore += score;
                                              scoredCount++;
                                          });
                                      }
                                      const avgScore = totalScore > 0 ? totalScore / 18 : 0;
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
                                              
                                              <div className="flex justify-between items-center text-xs mb-2">
                                                  {scoredCount > 0 ? (
                                                      <>
                                                          <span className="text-gray-600">Nilai: <span className="font-bold">{avgScore.toFixed(1)}</span></span>
                                                          <span className={`font-bold ${categoryColor}`}>{category}</span>
                                                      </>
                                                  ) : (
                                                      <span className="text-gray-400 italic">Belum dinilai</span>
                                                  )}
                                              </div>
                                          </>
                                      );
                                  } catch (err) {
                                      console.error("Error calculating progress:", err);
                                      return <p className="text-xs text-red-400">Gagal menghitung progress.</p>;
                                  }
                              })()}

                                          {/* Daftar Link Bukti Fisik */}
                                          <div className="mt-3 border-t border-purple-100 pt-3 mb-3">
                                              <h5 className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1">
                                                <ClipboardList size={12} />
                                                Bukti Fisik Terunggah
                                              </h5>
                                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                  {(() => {
                                                       try {
                                                           if (!MANAJERIAL_DOCS || !KEWIRAUSAHAAN_DOCS || !SUPERVISI_EVIDENCE_DOCS) {
                                                               console.error("Docs constants are undefined");
                                                               return <p className="text-xs text-red-500">Error loading docs configuration.</p>;
                                                           }
                                                           
                                                           const allDocs = [...MANAJERIAL_DOCS, ...KEWIRAUSAHAAN_DOCS, ...SUPERVISI_EVIDENCE_DOCS];
                                                           const evidence = { ...((user as any).workloadEvidence || {}), ...(user.workloadEvidence_v2 || {}) };
                                                           
                                                           // DEBUG: Log evidence for troubleshooting
                                                           console.log(`[DEBUG] Rendering evidence for ${user.name}:`, evidence);
                                                           console.log(`[DEBUG] Has workloadScores_v2?`, !!user.workloadScores_v2);
                                                           
                                                           const uploadedDocs = allDocs.filter(d => evidence[d.id]);
                                                           
                                                           if (uploadedDocs.length === 0) return <p className="text-xs text-gray-400 italic pl-1">Belum ada dokumen diunggah.</p>;

                                                           return uploadedDocs.map(doc => (
                                                               <div key={doc.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-purple-100 hover:border-purple-300 transition-colors">
                                                                   <span className="truncate flex-1 mr-2 text-gray-700 font-medium" title={doc.label}>{doc.label}</span>
                                                                   <a 
                                                                      href={evidence[doc.id]} 
                                                                      target="_blank" 
                                                                      rel="noopener noreferrer"
                                                                      className="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded flex-shrink-0 flex items-center gap-1 transition-colors"
                                                                   >
                                                                       Buka Link <ExternalLink size={10} />
                                                                   </a>
                                                               </div>
                                                           ));
                                                       } catch (err) {
                                                           console.error("Error rendering uploaded docs:", err);
                                                           return <p className="text-xs text-red-400">Gagal memuat dokumen.</p>;
                                                       }
                                                  })()}
                                              </div>
                                          </div>

                                          <button
                                            onClick={() => {
                                                setAssessmentPrincipal(user);
                                                setIsWorkloadModalOpen(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 rounded-md bg-purple-600 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition"
                                          >
                                            <CheckSquare size={14} />
                                            Beri Penilaian Kinerja
                                          </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Kepala Sekolah terdaftar.</p>
                  )
                })()}
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
                        // Calculate progress from real-time docs
                        const teacherDocs = selectedSchoolDocs.filter(d => d.teacherNip === user.nip);
                        // Count unique doc types
                        const uniqueDocTypes = new Set(teacherDocs.map(d => d.docType));
                        const docCount = uniqueDocTypes.size;
                        const totalDocs = ADMIN_DOCS.length;
                        const percent = Math.min(100, Math.round((docCount / totalDocs) * 100));

                        return (
                          <div key={user.nip} className="flex flex-col gap-3 rounded-lg border bg-white p-3 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-500">NIP: {user.nip} • {user.subRole || 'Guru Mapel'}</p>
                                </div>
                                <span className="text-xs font-bold text-blue-600">{percent}%</span>
                            </div>

                            <div className="mt-1">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>Kelengkapan Administrasi ({docCount}/{totalDocs})</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-gray-100">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                </div>
                            </div>

                            {/* Supervision Scores */}
                            {(() => {
                                // Get supervision scores for this teacher
                                const teacherSupervisions = allSupervisions.filter(r => 
                                    r.teacherNip === user.nip || r.teacherName === user.name
                                );
                                
                                const getLatestScore = (type: string) => {
                                    const relevant = teacherSupervisions.filter(r => {
                                         if (type === 'planning') return r.type === 'planning' || r.type === 'planning_deep';
                                         return r.type === type;
                                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    
                                    return relevant.length > 0 ? relevant[0].finalScore : null;
                                };
                                
                                const scorePlanning = getLatestScore('planning');
                                 const scoreObservation = getLatestScore('observation');
                                 const scoreAdmin = getLatestScore('administration');
                                 
                                 const getScoreDetails = (score: number | null) => {
                                     if (score === null) return { formatted: '-', color: 'text-gray-300', label: '' };
                                     
                                     const formatted = score.toFixed(1);
                                     let label = '';
                                     let color = '';
                                     
                                     if (score <= 60) {
                                         label = 'Perlu Pembinaan';
                                         color = 'text-red-600';
                                     } else if (score <= 75) {
                                         label = 'Cukup';
                                         color = 'text-yellow-600';
                                     } else if (score <= 90) {
                                         label = 'Baik';
                                         color = 'text-blue-600';
                                     } else {
                                         label = 'Sangat Baik';
                                         color = 'text-green-600';
                                     }
                                     
                                     return { formatted, color, label };
                                 };

                                 const planningDetails = getScoreDetails(scorePlanning);
                                 const observationDetails = getScoreDetails(scoreObservation);
                                 const adminDetails = getScoreDetails(scoreAdmin);
                                 
                                 return (
                                    <div className="grid grid-cols-3 gap-2 border-t pt-3 mt-2">
                                       <div className="text-center">
                                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Perencanaan</p>
                                          <p className={`text-sm font-bold ${planningDetails.color}`}>
                                             {planningDetails.formatted}
                                          </p>
                                          {planningDetails.label && (
                                              <p className={`text-[9px] font-medium ${planningDetails.color} leading-tight`}>
                                                  {planningDetails.label}
                                              </p>
                                          )}
                                       </div>
                                       <div className="text-center border-l border-gray-100">
                                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pelaksanaan</p>
                                          <p className={`text-sm font-bold ${observationDetails.color}`}>
                                             {observationDetails.formatted}
                                          </p>
                                          {observationDetails.label && (
                                              <p className={`text-[9px] font-medium ${observationDetails.color} leading-tight`}>
                                                  {observationDetails.label}
                                              </p>
                                          )}
                                       </div>
                                       <div className="text-center border-l border-gray-100">
                                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Instrumen</p>
                                          <p className={`text-sm font-bold ${adminDetails.color}`}>
                                             {adminDetails.formatted}
                                          </p>
                                          {adminDetails.label && (
                                              <p className={`text-[9px] font-medium ${adminDetails.color} leading-tight`}>
                                                  {adminDetails.label}
                                              </p>
                                          )}
                                       </div>
                                    </div>
                                 );
                            })()}
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm italic text-gray-400">Belum ada Guru terdaftar.</p>
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
                    {schoolsData.map(school => (
                       <label key={school.name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition">
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${tempManagedSchools.has(school.name) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                             {tempManagedSchools.has(school.name) && <Check size={14} className="text-white" />}
                          </div>
                          <input 
                             type="checkbox" 
                             className="hidden"
                             checked={tempManagedSchools.has(school.name)}
                             onChange={() => toggleSchoolSelection(school.name)}
                          />
                          <span className="text-sm font-medium text-gray-700">{school.name}</span>
                       </label>
                    ))}
                    {schoolsData.length === 0 && <p className="text-center text-gray-400 italic py-4">Tidak ada data sekolah tersedia.</p>}
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



      {/* Workload Assessment Modal */}
      {assessmentPrincipal && (
        <WorkloadAssessmentModal
          isOpen={isWorkloadModalOpen}
          onClose={() => setIsWorkloadModalOpen(false)}
          principal={assessmentPrincipal}
          onSave={() => {
             // Refresh is handled by subscription
          }}
          onViewSupervision={() => {
              if (assessmentPrincipal.school) {
                  setSupervisionModalProps({
                      school: assessmentPrincipal.school,
                      principal: assessmentPrincipal.name
                  });
                  setIsSupervisionListModalOpen(true);
              } else {
                  alert("Data sekolah tidak valid untuk kepala sekolah ini.");
              }
          }}
        />
      )}

      {/* Supervision List Modal */}
      <SupervisionListModal
        isOpen={isSupervisionListModalOpen}
        onClose={() => setIsSupervisionListModalOpen(false)}
        schoolName={supervisionModalProps?.school || ''}
        principalName={supervisionModalProps?.principal || ''}
      />
    </div>
  );
};

interface PengawasPenilaianProps {
  users: User[];
  currentUser: User | null;
}

const PengawasPenilaian = ({ users, currentUser }: PengawasPenilaianProps) => {
  const [schoolsData, setSchoolsData] = useState<School[]>([]);
  const [managedSchools, setManagedSchools] = useState<School[]>([]);
  
  // Assessment Modal State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [activeAssessmentPrincipal, setActiveAssessmentPrincipal] = useState<User | null>(null);

  // Supervision Modal State
  const [isSupervisionModalOpen, setIsSupervisionModalOpen] = useState(false);
  const [selectedSupervisionSchool, setSelectedSupervisionSchool] = useState<string>('');
  const [selectedSupervisionPrincipal, setSelectedSupervisionPrincipal] = useState<string>('');

  const handleOpenSupervision = (schoolName: string, principalName: string) => {
    setSelectedSupervisionSchool(schoolName);
    setSelectedSupervisionPrincipal(principalName);
    setIsSupervisionModalOpen(true);
  };

  useEffect(() => {
    // Initial Data Load
    setSchoolsData(storageService.getSchools());
  }, []);

  useEffect(() => {
    if (currentUser?.managedSchools && currentUser.managedSchools.length > 0) {
      const filtered = schoolsData.filter(s => currentUser.managedSchools!.includes(s.name));
      setManagedSchools(filtered);
    } else {
      setManagedSchools([]);
    }
  }, [schoolsData, currentUser]);

  // Keep activeAssessmentPrincipal in sync with real-time users
  useEffect(() => {
    if (activeAssessmentPrincipal) {
       const updated = users.find(u => u.nip === activeAssessmentPrincipal.nip);
       if (updated) {
          setActiveAssessmentPrincipal(updated);
       }
    }
  }, [users, activeAssessmentPrincipal?.nip]);

  const handleOpenAssessment = (principal: User) => {
    setActiveAssessmentPrincipal(principal);
    setIsAssessmentModalOpen(true);
  };

  const calculateScore = (user: User) => {
    if (!user.workloadScores_v2) return 0;
    const totalScore = Object.values(user.workloadScores_v2).reduce((a, b) => a + b, 0);
    return (totalScore / 18).toFixed(1); // 18 items
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <CheckSquare className="h-6 w-6 text-purple-700" />
           Penilaian Kinerja Kepala Sekolah (PKKS)
        </h2>
        <p className="text-gray-600">Daftar penilaian kinerja kepala sekolah di wilayah binaan.</p>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-purple-50 text-purple-900 font-semibold border-b">
              <tr>
                <th className="p-4">Nama Sekolah</th>
                <th className="p-4">Kepala Sekolah</th>
                <th className="p-4 text-center">NIP</th>
                <th className="p-4 text-center">Status Bukti</th>
                <th className="p-4 text-center">Nilai PKKS</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {managedSchools.length > 0 ? (
                managedSchools.map((school) => {
                  const principal = getBestPrincipal(users, school.name);
                  const score = principal ? calculateScore(principal) : 0;
                  
                  // Calculate evidence progress
                  let evidenceCount = 0;
                  const totalItems = 18;
                  const evidence = { ...((principal as any).workloadEvidence || {}), ...(principal?.workloadEvidence_v2 || {}) };
                  
                  // Need to count based on actual required docs IDs
                  const allIds = [
                     ...MANAJERIAL_DOCS.map(d => d.id),
                     ...KEWIRAUSAHAAN_DOCS.map(d => d.id),
                     ...SUPERVISI_EVIDENCE_DOCS.map(d => d.id)
                  ];
                  evidenceCount = allIds.filter(id => evidence[id]).length;
                  const evidencePercent = Math.round((evidenceCount / totalItems) * 100);

                  return (
                    <tr key={school.name} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-800">{school.name}</td>
                      <td className="p-4">
                        {principal ? (
                          <div className="flex items-center gap-2">
                             <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                {principal.name.charAt(0)}
                             </div>
                             <span>{principal.name}</span>
                          </div>
                        ) : (
                          <span className="text-red-400 italic">Belum ada KS</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-500">{principal?.nip || '-'}</td>
                      <td className="p-4">
                         {principal ? (
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${evidencePercent}%` }}></div>
                               </div>
                               <span className="text-xs text-gray-500">{evidenceCount}/{totalItems} Bukti</span>
                            </div>
                         ) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        {principal && Number(score) > 0 ? (
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              Number(score) > 90 ? 'bg-green-100 text-green-700' : 
                              Number(score) > 75 ? 'bg-blue-100 text-blue-700' : 
                              'bg-yellow-100 text-yellow-700'
                           }`}>
                              {score}
                           </span>
                        ) : (
                           <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {principal ? (
                           <button 
                             onClick={() => handleOpenAssessment(principal)}
                             className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                           >
                             <CheckSquare size={14} /> Nilai
                           </button>
                        ) : (
                           <button disabled className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-400 text-xs rounded cursor-not-allowed">
                             <CheckSquare size={14} /> Nilai
                           </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                    Belum ada sekolah binaan. Silakan pilih sekolah di menu Dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeAssessmentPrincipal && (
        <WorkloadAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          principal={activeAssessmentPrincipal}
          onSave={() => {
            // Trigger refresh if needed, but subscription should handle it
          }}
          onViewSupervision={() => {
             if (activeAssessmentPrincipal.school) {
                handleOpenSupervision(activeAssessmentPrincipal.school, activeAssessmentPrincipal.name);
             } else {
                alert("Data sekolah tidak valid untuk kepala sekolah ini.");
             }
          }}
        />
      )}

      <SupervisionListModal
        isOpen={isSupervisionModalOpen}
        onClose={() => setIsSupervisionModalOpen(false)}
        schoolName={selectedSupervisionSchool}
        principalName={selectedSupervisionPrincipal}
      />
    </div>
  )
}

interface PengawasKunjunganProps {
  currentUser: User | null;
}

const PengawasKunjungan = ({ currentUser }: PengawasKunjunganProps) => {
  const [visits, setVisits] = useState<SchoolVisit[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [managedSchools, setManagedSchools] = useState<School[]>([]);
  
  // Visit Modal State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SchoolVisit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSchools(storageService.getSchools());
  }, []);

  // Subscribe to visits when currentUser is available
  useEffect(() => {
    if (currentUser) {
        // Subscribe to all visits by this pengawas
        const unsubVisits = supabaseService.subscribeVisitsByVisitor(currentUser.nip, (data) => {
            // Sort by date descending
            const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setVisits(sorted);
        });
        return () => unsubVisits();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.managedSchools && currentUser.managedSchools.length > 0) {
      const filtered = schools.filter(s => currentUser.managedSchools!.includes(s.name));
      setManagedSchools(filtered);
    } else {
      setManagedSchools([]);
    }
  }, [schools, currentUser]);

  const handleCreateVisit = () => {
    if (!currentUser) return;
    
    const newVisit: SchoolVisit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      schoolName: '', // Must select
      visitorNip: currentUser.nip,
      visitorName: currentUser.name,
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
    if (!visit.schoolName) {
        alert("Mohon pilih sekolah tujuan.");
        return;
    }
    setIsSaving(true);
    try {
      await supabaseService.saveSchoolVisit(visit);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-700" />
            Laporan Kunjungan Sekolah
            </h2>
            <p className="text-gray-600">Kelola jadwal dan laporan kunjungan ke sekolah binaan.</p>
        </div>
        <button
            onClick={handleCreateVisit}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition shadow-sm"
        >
            <PlusCircle size={16} />
            Buat Laporan Baru
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visits.length > 0 ? (
            visits.map((visit) => (
                <div key={visit.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {visit.status === 'completed' ? 'Selesai' : 'Direncanakan'}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(visit.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{visit.schoolName}</h3>
                    <p className="text-sm text-purple-600 font-medium mb-2">{visit.purpose}</p>
                    
                    {visit.findings && (
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 line-clamp-3">
                            {visit.findings}
                        </div>
                    )}
                    
                    <button 
                        onClick={() => handleEditVisit(visit)}
                        className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium border border-purple-100 rounded py-1 hover:bg-purple-50 transition"
                    >
                        Detail / Edit
                    </button>
                </div>
            ))
        ) : (
            <div className="col-span-full text-center py-10 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
                Belum ada data kunjungan.
            </div>
        )}
      </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sekolah Tujuan</label>
                    <select
                        value={editingVisit.schoolName}
                        onChange={e => setEditingVisit({...editingVisit, schoolName: e.target.value})}
                        className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="">-- Pilih Sekolah --</option>
                        {managedSchools.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                 </div>

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
                    disabled={isSaving || !editingVisit.purpose || !editingVisit.schoolName}
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
    </div>
  );
};

const PengawasDashboard = () => {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleRefresh = async () => {
      setIsRefreshing(true);
      setConnectionError(null);
      try {
          // Re-fetch users manually using normalized fetch
          const fetchedUsers = await supabaseService.getAllUsers();
          setUsers(fetchedUsers);
          
          // Note: School stats are subscribed in child component, no need to refresh here or pass trigger
          // If we really needed to refresh stats, we would need to lift state up.
      } catch (e) {
          console.error("Refresh failed", e);
          setConnectionError("Gagal memuat ulang data. Periksa koneksi internet Anda.");
      } finally {
          setIsRefreshing(false);
      }
  };

  useEffect(() => {
    const localUser = storageService.getCurrentUser();
    setCurrentUser(localUser);

    const unsub = supabaseService.subscribeUsers(
      (fetchedUsers) => {
        setUsers(fetchedUsers);
        setConnectionError(null);
        if (localUser) {
          const found = fetchedUsers.find(u => u.nip === localUser.nip);
          if (found) setCurrentUser(found);
        }
      },
      (error) => {
        console.error("Real-time connection error:", error);
        setConnectionError("Terputus dari server. Data mungkin tidak mutakhir.");
      }
    );
    return () => unsub();
  }, []);

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
          <Link to="/pengawas/kunjungan" className={`flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-purple-700 ${isActive('/pengawas/kunjungan')}`}>
            <ClipboardList size={20} />
            Kunjungan Sekolah
          </Link>
          <Link to="/" className="mt-auto flex items-center gap-3 rounded-md px-4 py-3 text-red-200 transition hover:bg-purple-700 hover:text-red-100">
            <LogOut size={20} />
            Keluar
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <RunningText />
        
        {connectionError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{connectionError}</p>
            <button 
              onClick={handleRefresh}
              className="ml-auto text-xs font-bold underline hover:text-red-800"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {location.pathname === '/pengawas' ? 'Ringkasan' : 
             location.pathname === '/pengawas/penilaian' ? 'Penilaian' :
             location.pathname === '/pengawas/kunjungan' ? 'Kunjungan Sekolah' : 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
             >
                <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                </div>
                {isRefreshing ? 'Memuat...' : 'Refresh Data'}
             </button>
             <div className="text-gray-600">Selamat datang, Pengawas</div>
          </div>
        </header>

        <div className="mb-6 max-w-md">
          <ErrorBoundary>
            <GoogleSyncWidget user={currentUser} />
          </ErrorBoundary>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<PengawasHome users={users} currentUser={currentUser} />} />
              <Route path="/penilaian" element={<PengawasPenilaian users={users} currentUser={currentUser} />} />
              <Route path="/kunjungan" element={<PengawasKunjungan currentUser={currentUser} />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

export default PengawasDashboard
