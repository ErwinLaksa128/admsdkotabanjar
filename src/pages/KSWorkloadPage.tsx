import { useEffect, useState } from 'react';
import { User, storageService } from '../services/storage';
import { supabaseService } from '../services/supabaseService';
import { MANAJERIAL_DOCS, KEWIRAUSAHAAN_DOCS, SUPERVISI_EVIDENCE_DOCS } from '../constants/documents';
import { CheckSquare, ExternalLink, Link as LinkIcon, FileText, AlertCircle } from 'lucide-react';
import SupervisionListModal from '../components/SupervisionListModal';

const KSWorkloadPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('Manajerial');
  const [isSupervisionModalOpen, setIsSupervisionModalOpen] = useState(false);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setEvidenceLinks(user.workloadEvidence_v2 || {});
      
      // Subscribe to user updates to get latest scores/feedback
      const unsubscribe = supabaseService.subscribeUsers((users) => {
        const found = users.find(u => u.nip === user.nip);
        if (found) {
          setCurrentUser(found);
          // Only update evidence if we haven't modified it locally (optional, but for now let's just sync)
          // Actually, if we are editing, we might want to be careful. 
          // But for simplicity, let's trust the user's local state for inputs, 
          // and only update from server if we are not editing. 
          // For now, let's just update currentUser for scores/feedback.
          // setEvidenceLinks(found.workloadEvidence_v2 || {}); // Don't overwrite local edits immediately?
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSaveEvidence = async (docId: string, url: string) => {
    if (!currentUser) return;

    // Validasi URL sederhana
    if (url && !url.startsWith('http')) {
        alert('Link harus diawali dengan http:// atau https://');
        return;
    }

    setIsSaving(true);
    try {
      const updatedEvidence = {
        ...currentUser.workloadEvidence_v2,
        [docId]: url
      };
      
      const updatedUser = {
        ...currentUser,
        workloadEvidence_v2: updatedEvidence
      };

      // 1. Update local storage first (Optimistic)
      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      
      // 2. Update local state
      setCurrentUser(updatedUser);
      setEvidenceLinks(updatedEvidence);

      // 3. Save to Supabase (Async)
      await supabaseService.saveUser(updatedUser);
      
      // Check for school field after saving attempt
      if (!updatedUser.school) {
           alert("Peringatan: Data sekolah Anda belum terisi. Pengawas mungkin tidak dapat melihat data ini. Silakan hubungi admin atau lengkapi profil Anda.");
      }
      
    } catch (error) {
      console.error("Failed to save evidence", error);
      alert("Gagal menyimpan bukti ke server. Periksa koneksi internet Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { title: "Tugas Manajerial", docs: MANAJERIAL_DOCS },
    { title: "Pengembangan Kewirausahaan", docs: KEWIRAUSAHAAN_DOCS },
    { title: "Supervisi Guru dan Tendik", docs: SUPERVISI_EVIDENCE_DOCS }
  ];

  if (!currentUser) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  const scores = currentUser.workloadScores_v2 || {};
  
  const calculateAverage = () => {
    const totalItems = 18; // Fixed based on docs length
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    return (totalScore / totalItems).toFixed(1);
  };

  const totalDocs = MANAJERIAL_DOCS.length + KEWIRAUSAHAAN_DOCS.length + SUPERVISI_EVIDENCE_DOCS.length;
  const filledDocs = Object.values(evidenceLinks).filter(link => link && link.trim() !== '').length;
  const progressPercentage = Math.round((filledDocs / totalDocs) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Card */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-sm text-gray-500 mb-1">Rata-rata Penilaian</p>
              <h2 className="text-3xl font-bold text-indigo-700">{calculateAverage()}</h2>
           </div>
           <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <CheckSquare size={24} />
           </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
           <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-gray-500 mb-1">Kelengkapan Bukti</p>
                <h2 className="text-2xl font-bold text-green-700">{progressPercentage}%</h2>
              </div>
              <span className="text-sm text-gray-500">{filledDocs} / {totalDocs} Dokumen</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Input Bukti Dukung
        </h1>
      </div>

      {/* Feedback Section */}
      {currentUser.workloadFeedback_v2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
                <h3 className="font-semibold text-blue-900">Catatan dari Pengawas</h3>
                <p className="text-blue-800 mt-1">{currentUser.workloadFeedback_v2}</p>
                <p className="text-xs text-blue-600 mt-2">
                    Diperbarui: {new Date(currentUser.workloadFeedbackDate_v2 || '').toLocaleDateString('id-ID')}
                </p>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs/Sections */}
        <div className="flex border-b overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveSection(section.title)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeSection === section.title
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">{activeSection}</h3>
                {activeSection.includes("Supervisi") && (
                    <button 
                        onClick={() => setIsSupervisionModalOpen(true)}
                        className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2 font-medium"
                    >
                        <FileText size={16} /> 
                        Lihat Data Supervisi Aplikasi
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {sections.find(s => s.title === activeSection)?.docs.map((doc) => {
                    const currentLink = evidenceLinks[doc.id] || '';
                    const score = scores[doc.id] || 0;

                    return (
                        <div key={doc.id} className="p-4 rounded-lg border border-gray-200 hover:border-indigo-200 transition bg-gray-50/50">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800 mb-1">{doc.label}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="relative flex-1 max-w-md">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LinkIcon size={14} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="url"
                                                disabled={isSaving}
                                                placeholder={isSaving ? "Menyimpan..." : "Tempel link bukti (Google Drive/Docs)..."}
                                                className={`pl-9 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm py-2 ${isSaving ? 'bg-gray-100 text-gray-500' : ''}`}
                                                value={currentLink}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEvidenceLinks(prev => ({ ...prev, [doc.id]: val }));
                                                }}
                                                onBlur={() => {
                                                    // Auto-save on blur if changed
                                                    if (currentLink !== (currentUser.workloadEvidence_v2?.[doc.id] || '')) {
                                                        handleSaveEvidence(doc.id, currentLink);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {currentLink && (
                                            <a 
                                                href={currentLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                                title="Buka Link"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {currentLink ? 'Link tersimpan otomatis saat kursor keluar.' : 'Masukkan link bukti dukung untuk dinilai.'}
                                    </p>
                                </div>

                                <div className="w-full md:w-32 flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Nilai</span>
                                    {score > 0 ? (
                                        <span className="text-2xl font-bold text-indigo-600">{score}</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <SupervisionListModal
        isOpen={isSupervisionModalOpen}
        onClose={() => setIsSupervisionModalOpen(false)}
        schoolName={currentUser.school || ''}
        principalName={currentUser.name}
      />
    </div>
  );
};

export default KSWorkloadPage;
