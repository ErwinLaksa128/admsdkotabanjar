import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Check, FileText } from 'lucide-react';
import { User } from '../services/storage';
import { MANAJERIAL_DOCS, KEWIRAUSAHAAN_DOCS, SUPERVISI_EVIDENCE_DOCS } from '../constants/documents';
import { supabaseService } from '../services/supabaseService';

interface WorkloadAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  principal: User;
  onSave: () => void;
  onViewSupervision?: () => void;
}

const WorkloadAssessmentModal: React.FC<WorkloadAssessmentModalProps> = ({
  isOpen,
  onClose,
  principal,
  onSave,
  onViewSupervision
}) => {
  const [localPrincipal, setLocalPrincipal] = useState<User>(principal);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync local principal with prop when it changes
  useEffect(() => {
    setLocalPrincipal(principal);
  }, [principal]);

  useEffect(() => {
    if (isOpen && principal) {
      setScores(principal.workloadScores_v2 || {});
      setFeedback(principal.workloadFeedback_v2 || '');
      
      // Fetch latest data to ensure evidence is up to date
      fetchLatestData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, principal.nip]);

  const fetchLatestData = async () => {
      setIsLoading(true);
      try {
          const latest = await supabaseService.getUserByNip(principal.nip);
          if (latest) {
              setLocalPrincipal(latest);
              // Also update scores if they were updated elsewhere
              // setScores(latest.workloadScores_v2 || {}); 
              // Don't overwrite scores if we are editing? 
              // Actually, for assessment, we probably want to see latest saved scores unless we have dirty state.
              // For now, let's just update evidence via localPrincipal.
          }
      } catch (err) {
          console.error("Failed to fetch latest principal data", err);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        ...localPrincipal,
        workloadScores_v2: scores,
        workloadFeedback_v2: feedback,
        workloadFeedbackDate_v2: new Date().toISOString()
      };

      await supabaseService.saveUser(updatedUser);
      onSave(); // Notify parent to refresh
      onClose();
      alert('Penilaian berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      alert('Gagal menyimpan penilaian.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const calculateAverage = () => {
    const totalItems = 18; // Fixed total items based on docs length
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    return (totalScore / totalItems).toFixed(1);
  };

  // Calculate merged evidence from localPrincipal (latest data)
  const mergedEvidence = {
    ...((localPrincipal as any).workloadEvidence || {}),
    ...(localPrincipal.workloadEvidence_v2 || {})
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b p-6 bg-purple-50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Penilaian Beban Kerja Kepala Sekolah
            </h3>
            <p className="text-sm text-purple-700">{localPrincipal.name} - {localPrincipal.school}</p>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={fetchLatestData} 
                className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition" 
                title="Refresh Data"
                disabled={isLoading}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-refresh-cw ${isLoading ? 'animate-spin' : ''}`}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
             </button>
             <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-white/50 transition">
                <X className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {[
            { title: "Tugas Manajerial", docs: MANAJERIAL_DOCS },
            { title: "Pengembangan Kewirausahaan", docs: KEWIRAUSAHAAN_DOCS },
            { title: "Supervisi Guru dan Tendik", docs: SUPERVISI_EVIDENCE_DOCS }
          ].map((section, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700 flex justify-between items-center">
                <span>{section.title}</span>
                {section.title.includes("Supervisi") && onViewSupervision && (
                  <button 
                    onClick={onViewSupervision} 
                    className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-200 transition flex items-center gap-1.5 font-medium"
                  >
                    <FileText size={14} /> 
                    Lihat Data Supervisi Aplikasi
                  </button>
                )}
              </div>
              <div className="divide-y">
                {section.docs.map((doc) => {
                  const score = scores[doc.id] || 0;
                  const hasEvidence = mergedEvidence[doc.id];
                  
                  return (
                    <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{doc.label}</p>
                        {hasEvidence ? (
                          <a href={mergedEvidence[doc.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
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
                          disabled={!hasEvidence}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setScores(prev => ({
                              ...prev,
                              [doc.id]: val
                            }));
                          }}
                          className="w-full text-center rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={!hasEvidence ? "Penilaian terkunci karena belum ada bukti dukung" : "Masukkan nilai (0-100)"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700">
              Catatan / Umpan Balik
            </div>
            <div className="p-4">
              <textarea
                className="w-full border rounded-md p-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none min-h-[100px]"
                placeholder="Tuliskan catatan atau umpan balik untuk Kepala Sekolah..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <div className="flex-1 flex items-center text-sm text-gray-600">
            <span>Rata-rata Nilai: </span>
            <span className="ml-2 font-bold text-lg text-purple-700">
              {calculateAverage()}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
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
  );
};

export default WorkloadAssessmentModal;
