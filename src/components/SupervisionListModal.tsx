import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, User as UserIcon, ClipboardList, BookOpen, PenTool } from 'lucide-react';
import { SupervisionReport } from '../services/storage';
import { supabaseService } from '../services/supabaseService';

interface SupervisionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  principalName: string;
}

const SupervisionListModal: React.FC<SupervisionListModalProps> = ({ 
  isOpen, 
  onClose, 
  schoolName, 
  principalName 
}) => {
  const [reports, setReports] = useState<SupervisionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'planning' | 'execution' | 'instrument'>('planning');

  useEffect(() => {
    if (isOpen && schoolName) {
      setIsLoading(true);
      const unsubscribe = supabaseService.subscribeSupervisionsBySchool(schoolName, (fetchedReports) => {
        setReports(fetchedReports);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isOpen, schoolName]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 91) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 81) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 91) return 'Sangat Baik';
    if (score >= 81) return 'Baik';
    if (score >= 70) return 'Cukup';
    return 'Kurang';
  };

  // Filter reports based on active tab
  const filteredReports = reports.filter(r => {
    if (activeTab === 'planning') return r.type === 'planning' || r.type === 'planning_deep';
    if (activeTab === 'execution') return r.type === 'observation';
    if (activeTab === 'instrument') return r.type === 'administration';
    return false;
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6 bg-gradient-to-r from-indigo-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Laporan Supervisi Guru
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sekolah: <span className="font-medium text-gray-700">{schoolName}</span> • 
              Kepala Sekolah: <span className="font-medium text-gray-700">{principalName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50/50 px-6 pt-4 gap-4">
          <button
            onClick={() => setActiveTab('planning')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'planning' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={16} />
            Perencanaan
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'execution' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenTool size={16} />
            Pelaksanaan
          </button>
          <button
            onClick={() => setActiveTab('instrument')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'instrument' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList size={16} />
            Instrumen
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p>Memuat data supervisi...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">Belum ada laporan {
                activeTab === 'planning' ? 'Perencanaan' : 
                activeTab === 'execution' ? 'Pelaksanaan' : 'Instrumen'
              }</p>
              <p className="text-sm">Belum ada data supervisi untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        report.type === 'planning_deep' || report.type === 'planning' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : report.type === 'observation' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {report.type === 'planning_deep' || report.type === 'planning' ? 'Perencanaan' : 
                         report.type === 'observation' ? 'Pelaksanaan' : 'Instrumen'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(report.date)}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <UserIcon size={16} className="text-gray-400" />
                      {report.teacherName}
                    </h3>
                    <p className="text-sm text-gray-500 ml-6">
                      Mapel: {report.subject || '-'} • Kelas: {report.grade || '-'}
                    </p>
                    
                    {report.notes && (report.notes.umum || report.notes.pelaksanaan || report.notes.conditions) && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                        <p className="line-clamp-2 italic">"{report.notes.umum || report.notes.pelaksanaan || (report.notes.conditions ? 'Catatan Instrumen Tersedia' : '')}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end min-w-[120px]">
                    <div className={`flex flex-col items-center justify-center w-full p-2 rounded-lg border ${getScoreColor(report.finalScore)}`}>
                      <span className="text-2xl font-bold">{report.finalScore.toFixed(1)}</span>
                      <span className="text-xs font-medium uppercase tracking-wide">{getScoreLabel(report.finalScore)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisionListModal;
