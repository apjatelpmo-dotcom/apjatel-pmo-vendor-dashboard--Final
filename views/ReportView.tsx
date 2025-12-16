
import React, { useState } from 'react';
import { Project, ProjectCategory, ProjectOperator, JointSurveyStatus } from '../types';
import { Search, MapPin, TrendingUp, Clock, CalendarDays, Radio, Plus, Edit2, Ruler, ChevronLeft, ChevronRight, Activity, AlertTriangle, CalendarClock, ArrowRight, ClipboardList, ZoomIn, ZoomOut, BarChart3, X, Download, Printer, Database } from 'lucide-react';
import WorkItemModal from '../components/WorkItemModal';
import OperatorDetailModal from '../components/OperatorDetailModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
import GanttChartModal from '../components/GanttChartModal';
import FinalDataReport from '../components/FinalDataReport'; // Import New Component
import { sheetService } from '../services/mockSheetService';
import { exportToCSV, printComponent } from '../services/exportService';

interface ReportViewProps {
  projects: Project[];
  activeSubTab: string; // New prop to control view
}

// --- Helper Component: Timeline Card ---
const TimelineCard: React.FC<{ project: Project; onSelect: (p: Project) => void }> = ({ project, onSelect }) => {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = new Date().getTime();
  const totalDuration = end - start;
  const elapsed = now - start;
  let timeProgress = 0;
  
  if (elapsed > 0 && totalDuration > 0) {
      timeProgress = Math.min(100, (elapsed / totalDuration) * 100);
  }

  return (
      <div 
          onClick={() => onSelect(project)}
          className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer overflow-hidden relative flex flex-col"
      >
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${project.progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`}></div>
          
          <div className="p-5 pl-7 flex-1">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors">{project.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin size={14} /> 
                          <span>{project.location}</span>
                          <span className="text-gray-300">|</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{project.vendorAppointmentNumber}</span>
                      </div>
                  </div>
                  <div className="flex flex-col items-end">
                       <div className={`text-2xl font-bold ${project.progress === 100 ? 'text-green-600' : 'text-brand-600'}`}>
                          {project.progress}%
                      </div>
                      <span className="text-xs text-gray-400">Total Progress</span>
                  </div>
              </div>

              <div className="space-y-4 mb-5">
                  <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1"><Clock size={12}/> Time Elapsed: {timeProgress.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full w-full overflow-hidden flex relative">
                          <div 
                             className={`h-full rounded-full relative z-20 ${project.progress >= 100 ? 'bg-green-500' : 'bg-brand-500'}`} 
                             style={{ width: `${project.progress}%` }}
                          ></div>
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-30" style={{ left: `${timeProgress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                          <span>{project.startDate}</span>
                          <span>{project.endDate}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};

// Pagination Controls Component
const PaginationControls: React.FC<{ currentPage: number, totalPages: number, onPageChange: (p: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-white">
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 font-medium px-2">
                Page {currentPage} of {totalPages}
            </span>
            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ projects, activeSubTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination States
  const [timelinePage, setTimelinePage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [operatorPage, setOperatorPage] = useState(1);
  const [surveyPage, setSurveyPage] = useState(1);
  
  // Gantt Modal State
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [ganttProject, setGanttProject] = useState<Project | null>(null);
  
  // Final Data Selection
  const [selectedFinalDataProject, setSelectedFinalDataProject] = useState<Project | null>(null);

  const itemsPerPage = 5; 

  // Modal States for Edits
  const [selectedTimelineProject, setSelectedTimelineProject] = useState<Project | null>(null);
  const [editOperatorModal, setEditOperatorModal] = useState<{ project: Project, operator: ProjectOperator | null } | null>(null);
  const [editProjectModal, setEditProjectModal] = useState<Project | null>(null);

  // Filtering Logic
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relocationProjects = filteredProjects.filter(p => p.category === ProjectCategory.RELOCATION);
  
  const handleUpdateProject = async (updatedProject: Project) => {
    await sheetService.updateProject(updatedProject);
    // If updating from Gantt modal, update the local ganttProject state to reflect changes immediately
    if (ganttProject && ganttProject.id === updatedProject.id) {
        setGanttProject(updatedProject);
    }
    // If updating from Final Data
    if (selectedFinalDataProject && selectedFinalDataProject.id === updatedProject.id) {
        setSelectedFinalDataProject(updatedProject);
    }
  };

  const handleOpenGantt = (project: Project) => {
      setGanttProject(project);
      setShowGanttModal(true);
  };

  const formatDate = (dateStr: string) => {
      if(!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calculateDays = (start: string, end: string) => {
      if(!start || !end) return 0;
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diff = e - s;
      return Math.ceil(diff / (1000 * 3600 * 24));
  };

  // --- Export Functions ---
  
  // 1. Export for Master Schedule (Project List)
  const handleExportSchedule = (type: 'csv' | 'print') => {
      if (type === 'csv') {
          const dataToExport = relocationProjects.map(p => ({
            Name: p.name,
            Location: p.location,
            Start: p.startDate,
            End: p.endDate,
            Remarks: p.remarks
        }));
        exportToCSV(dataToExport, `Report_Schedule`);
      } else {
          printComponent('report-container-print', `Report Schedule`);
      }
  };

  // 2. Export for Operator List
  const handleExportOperators = (type: 'csv' | 'print') => {
      if (type === 'csv') {
        const data = relocationProjects.flatMap(p => 
            (p.operators || []).map(op => ({
                ProjectName: p.name,
                Location: p.location,
                Operator: op.name,
                ParticipationM: op.participationLength,
                AccessM: op.accessLength,
                CrossingM: op.crossingLength,
                HH_Shared: op.hhSharedQty,
                HH_Private: op.hhPrivateQty,
                Status_Material: op.statusMaterial,
                Status_Pulling: op.statusPulling,
                Status_CutOver: op.statusCutOver,
                Remarks: op.remarks
            }))
        );
        exportToCSV(data, 'Report_Jalur_Operator');
      } else {
        printComponent('operator-view-container', 'Report Jalur Operator');
      }
  };

  // 3. Export for Survey
  const handleExportSurveys = (type: 'csv' | 'print') => {
      if (type === 'csv') {
        const data = relocationProjects.flatMap(p => 
            (p.operators || []).map(op => ({
                ProjectName: p.name,
                Location: p.location,
                Operator: op.name,
                SurveyDate: op.jointSurveyDate,
                SurveyDeadline: op.jointSurveyDeadline,
                Status: op.jointSurveyStatus,
                Remarks: op.jointSurveyRemarks
            }))
        );
        exportToCSV(data, 'Report_Scheduled_Join_Survey');
      } else {
        printComponent('survey-view-container', 'Report Scheduled Join Survey');
      }
  };


  // --- Render Functions ---

  const renderTimeline = () => {
    const totalPages = Math.ceil(filteredProjects.length / 4); 
    const paginated = filteredProjects.slice((timelinePage - 1) * 4, timelinePage * 4);

    return (
        <div className="space-y-8 pb-10">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Project Overview</h3>
                        <p className="text-sm text-gray-500">Visualisasi progress fisik project relokasi</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paginated.length === 0 && <p className="text-gray-400 italic col-span-2 ml-2">Tidak ada data project.</p>}
                    {paginated.map(p => (
                        <TimelineCard key={p.id} project={p} onSelect={setSelectedTimelineProject} />
                    ))}
                </div>

                <PaginationControls currentPage={timelinePage} totalPages={totalPages} onPageChange={setTimelinePage} />
            </div>
        </div>
    );
  };

  // --- Master Schedule (Table List View) ---
  const renderMasterSchedule = () => {
    const totalPages = Math.ceil(relocationProjects.length / itemsPerPage); 
    const paginated = relocationProjects.slice((schedulePage - 1) * itemsPerPage, schedulePage * itemsPerPage);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Master Schedule</h3>
                        <p className="text-xs text-gray-500">Monitoring Dateline Dinas & Masa Berlaku Izin</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExportSchedule('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportSchedule('print')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"><Printer size={14}/> PDF</button>
                </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto" id="report-container-print">
                <div className="min-w-[1000px] divide-y divide-gray-100">
                    <div className="bg-gray-100 text-xs font-bold text-gray-600 uppercase flex sticky top-0 z-10 shadow-sm">
                        <div className="w-1/4 p-4 bg-gray-100">Project Details</div>
                        <div className="w-1/6 p-4 text-center border-l border-gray-200 bg-gray-100">Durasi</div>
                        <div className="w-1/6 p-4 text-center border-l border-gray-200 bg-gray-100">Deadline Dinas</div>
                        <div className="w-1/4 p-4 border-l border-gray-200 bg-gray-100">Kendala / Keterangan</div>
                        <div className="w-1/6 p-4 text-center border-l border-gray-200 bg-gray-100">Status & Action</div>
                    </div>

                    {paginated.length === 0 && (
                        <div className="p-8 text-center text-gray-400 italic">Belum ada project relokasi.</div>
                    )}
                    {paginated.map(p => {
                        const cutOffDate = p.cutOffDate ? new Date(p.cutOffDate) : null;
                        const today = new Date();
                        // Normalize to compare dates only
                        today.setHours(0,0,0,0);
                        
                        const durationDays = calculateDays(p.startDate, p.endDate);
                        
                        const isOverdue = today > new Date(p.endDate) && p.progress < 100;
                        
                        // Critical Warning Logic: Has CutOff Date + Today > CutOff Date + Not Completed
                        let isCritical = false;
                        if (cutOffDate && p.progress < 100) {
                            const checkCutOff = new Date(cutOffDate);
                            // If today is strictly after the cutoff date
                            if (today > checkCutOff) {
                                isCritical = true;
                            }
                        }

                        return (
                            <div key={p.id} className={`flex transition-colors group border-b border-gray-100 last:border-0 ${isCritical ? 'bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-500' : 'hover:bg-gray-50'}`}>
                                {/* Project Info */}
                                <div className="w-1/4 p-4 flex flex-col justify-center">
                                    <h4 className={`text-sm font-bold truncate ${isCritical ? 'text-red-900' : 'text-gray-900'}`} title={p.name}>{p.name}</h4>
                                    <div className={`text-xs flex items-center gap-1 mt-1 ${isCritical ? 'text-red-700' : 'text-gray-500'}`}>
                                        <MapPin size={10} /> {p.location}
                                    </div>
                                    {/* Link to Gantt Chart */}
                                    <button 
                                        onClick={() => handleOpenGantt(p)}
                                        className="mt-2 text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold underline"
                                    >
                                        <BarChart3 size={12} />
                                        Lihat Gantt Chart
                                    </button>
                                </div>

                                {/* Duration Bar */}
                                <div className="w-1/6 p-4 border-l border-gray-100 flex flex-col justify-center items-center">
                                    <div className="flex items-center gap-1 text-xs font-mono text-gray-700">
                                        <span>{new Date(p.startDate).toLocaleDateString('id-ID', {day: 'numeric', month:'short'})}</span>
                                        <ArrowRight size={10} className="text-gray-400"/>
                                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>{new Date(p.endDate).toLocaleDateString('id-ID', {day: 'numeric', month:'short'})}</span>
                                    </div>
                                    <div className="mt-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                                        {durationDays} Hari
                                    </div>
                                </div>

                                {/* Deadline Dinas */}
                                <div className={`w-1/6 p-4 border-l border-gray-100 flex flex-col justify-center items-center ${isCritical ? 'bg-red-100/50' : 'bg-gray-50/30'}`}>
                                    {p.cutOffDate ? (
                                        <div className={`flex flex-col items-center ${isCritical ? 'text-red-700' : 'text-gray-700'}`}>
                                            <CalendarClock size={16} className={`mb-1 ${isCritical ? 'text-red-600 animate-pulse' : 'opacity-70'}`}/>
                                            <span className={`text-xs font-mono font-bold ${isCritical ? 'underline decoration-red-400 decoration-2 underline-offset-2' : ''}`}>{formatDate(p.cutOffDate)}</span>
                                            <span className={`text-[10px] mt-1 ${isCritical ? 'text-red-600 font-bold bg-red-200 px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>
                                                {isCritical ? 'EXPIRED' : 'Batas Pemutusan'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-300">-</span>
                                    )}
                                </div>

                                {/* Remarks Column */}
                                <div className="w-1/4 p-4 border-l border-gray-100 flex items-center">
                                    <p className="text-xs text-gray-600 italic line-clamp-3">
                                        {p.remarks || <span className="text-gray-300">Tidak ada kendala / catatan.</span>}
                                    </p>
                                </div>

                                {/* Status & Alerts & Actions */}
                                <div className="w-1/6 p-4 border-l border-gray-100 flex flex-col justify-center gap-3">
                                    {/* Alerts */}
                                    {isCritical ? (
                                        <div className="flex items-start gap-2 p-2 bg-red-100 border border-red-200 rounded-lg shadow-sm animate-pulse">
                                            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight leading-tight">
                                                    PERINGATAN: Batas Waktu Dinas Terlampaui!
                                                </p>
                                            </div>
                                        </div>
                                    ) : isOverdue ? (
                                        <div className="flex items-start gap-2 p-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                                            <AlertTriangle size={14} className="text-orange-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-orange-700">Overdue!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-gray-500">On Schedule</span>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setEditProjectModal(p)}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-brand-600 rounded text-xs font-medium transition-colors"
                                    >
                                        <Edit2 size={12} />
                                        Edit Project
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <PaginationControls currentPage={schedulePage} totalPages={totalPages} onPageChange={setSchedulePage} />
        </div>
    );
  };

  const renderOperatorTable = () => {
    const totalPages = Math.ceil(relocationProjects.length / itemsPerPage);
    const paginated = relocationProjects.slice((operatorPage - 1) * itemsPerPage, operatorPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Operator Toolbar/Header for Global Actions */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                         <Radio size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Jalur Operator (Tenant)</h3>
                        <p className="text-xs text-gray-500">Detail status per operator per project</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleExportOperators('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <Download size={14}/> CSV
                    </button>
                    <button onClick={() => handleExportOperators('print')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <Printer size={14}/> PDF
                    </button>
                </div>
            </div>

            <div id="operator-view-container" className="space-y-6">
                {paginated.length === 0 && <p className="text-center text-gray-500 py-10">Tidak ada project relokasi yang tersedia.</p>}
                
                {paginated.map(project => (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        {/* Project Header */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {project.location}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1"><Ruler size={10} /> Total: {project.lengthMeter} m</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEditOperatorModal({ project, operator: null })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium shadow-sm transition-colors"
                            >
                                <Plus size={16} />
                                Tambah Operator
                            </button>
                        </div>

                        {/* Operators Table with Vertical Scrolling */}
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 w-10 bg-gray-100">#</th>
                                        <th className="px-6 py-3 min-w-[150px] bg-gray-100">Nama Operator</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Panjang (m)</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Akses (m)</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Crossing (m)</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">HH Bersama</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">HH Pribadi</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Material</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Pulling</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Cut Over</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Remarks</th>
                                        <th className="px-6 py-3 text-center bg-gray-100">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {!project.operators || project.operators.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-8 text-center text-gray-400 italic bg-gray-50/50">
                                                Belum ada data operator yang diinput untuk project ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        project.operators.map((op, idx) => (
                                            <tr key={op.id} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4 text-center">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{op.name}</td>
                                                <td className="px-6 py-4 text-center font-mono">
                                                    {op.participationLength}
                                                    <span className="text-xs text-gray-400 ml-1">/ {project.lengthMeter}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-gray-700">{op.accessLength || 0}</td>
                                                <td className="px-6 py-4 text-center font-mono text-gray-700">{op.crossingLength || 0}</td>
                                                <td className="px-6 py-4 text-center font-mono">{op.hhSharedQty}</td>
                                                <td className="px-6 py-4 text-center font-mono">{op.hhPrivateQty}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-gray-700">{op.statusMaterial}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-gray-700">{op.statusPulling}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-gray-700">{op.statusCutOver}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs text-gray-500 italic max-w-[150px] truncate block mx-auto">{op.remarks || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => setEditOperatorModal({ project, operator: op })}
                                                        className="text-gray-400 hover:text-brand-600 transition-colors"
                                                        title="Edit Detail"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {project.operators && project.operators.length > 0 && (
                                    <tfoot className="bg-gray-50 text-xs font-semibold text-gray-600 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                        <tr>
                                            <td colSpan={2} className="px-6 py-3 text-right bg-gray-50 border-t border-gray-200">Total:</td>
                                            <td className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200">
                                                {project.operators.reduce((sum, op) => sum + (Number(op.participationLength) || 0), 0)}
                                            </td>
                                            <td className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200">{project.operators.reduce((sum, op) => sum + (Number(op.accessLength) || 0), 0)}</td>
                                            <td className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200">{project.operators.reduce((sum, op) => sum + (Number(op.crossingLength) || 0), 0)}</td>
                                            <td className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200">{project.operators.reduce((sum, op) => sum + op.hhSharedQty, 0)}</td>
                                            <td className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200">{project.operators.reduce((sum, op) => sum + op.hhPrivateQty, 0)}</td>
                                            <td colSpan={5} className="bg-gray-50 border-t border-gray-200"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            <PaginationControls currentPage={operatorPage} totalPages={totalPages} onPageChange={setOperatorPage} />
        </div>
    );
  };

  const renderSurveyTable = () => {
    // Flatten list of operators with survey data
    const allSurveys = relocationProjects.flatMap(project => 
        (project.operators || []).map(op => ({
            projectId: project.id,
            projectName: project.name,
            projectLocation: project.location,
            operator: op,
            project: project // full object ref for editing
        }))
    );

    const totalPages = Math.ceil(allSurveys.length / itemsPerPage);
    const paginatedSurveys = allSurveys.slice((surveyPage - 1) * itemsPerPage, surveyPage * itemsPerPage);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Scheduled Join Survey</h3>
                        <p className="text-xs text-gray-500">Jadwal survey bersama antar operator</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleExportSurveys('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <Download size={14}/> CSV
                    </button>
                    <button onClick={() => handleExportSurveys('print')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <Printer size={14}/> PDF
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto" id="survey-view-container">
                 <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 bg-gray-100">Nama Project</th>
                            <th className="px-6 py-3 bg-gray-100">Lokasi</th>
                            <th className="px-6 py-3 bg-gray-100">Nama Operator</th>
                            <th className="px-6 py-3 bg-gray-100">Tanggal Join Survey</th>
                            <th className="px-6 py-3 bg-gray-100">Dateline Survey</th>
                            <th className="px-6 py-3 text-center bg-gray-100">Status</th>
                            <th className="px-6 py-3 bg-gray-100">Remarks</th>
                            <th className="px-6 py-3 text-center bg-gray-100">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedSurveys.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data operator/survey.</td>
                            </tr>
                        ) : (
                            paginatedSurveys.map((item, idx) => {
                                // Survey Deadline Logic
                                const deadline = item.operator.jointSurveyDeadline ? new Date(item.operator.jointSurveyDeadline) : null;
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const isDeadlineOverdue = deadline && today > deadline && item.operator.jointSurveyStatus !== JointSurveyStatus.DONE;

                                return (
                                <tr key={`${item.projectId}_${item.operator.id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.projectName}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 flex items-center gap-1">
                                        <MapPin size={12} /> {item.projectLocation}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-blue-600">{item.operator.name}</td>
                                    <td className="px-6 py-4">
                                        {item.operator.jointSurveyDate ? formatDate(item.operator.jointSurveyDate) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                         {item.operator.jointSurveyDeadline ? (
                                             <div className="flex flex-col">
                                                 <span className={`font-mono ${isDeadlineOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                                     {formatDate(item.operator.jointSurveyDeadline)}
                                                 </span>
                                                 {isDeadlineOverdue && (
                                                     <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                                         <AlertTriangle size={10} /> Overdue
                                                     </span>
                                                 )}
                                             </div>
                                         ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                            ${item.operator.jointSurveyStatus === JointSurveyStatus.DONE ? 'bg-green-100 text-green-700' : 
                                            item.operator.jointSurveyStatus === JointSurveyStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' : 
                                            item.operator.jointSurveyStatus === JointSurveyStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.operator.jointSurveyStatus || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 italic">
                                        {item.operator.jointSurveyRemarks || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <button 
                                            onClick={() => setEditOperatorModal({ project: item.project, operator: item.operator })}
                                            className="text-gray-400 hover:text-brand-600 transition-colors"
                                            title="Update Survey"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls currentPage={surveyPage} totalPages={totalPages} onPageChange={setSurveyPage} />
        </div>
    );
  };

  // --- Final Data View ---
  const renderFinalData = () => {
      // Allow user to select a project to view final data for
      if (!selectedFinalDataProject) {
          return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relocationProjects.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedFinalDataProject(p)}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 cursor-pointer transition-all"
                      >
                          <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                                    <Database size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900">{p.name}</h3>
                          </div>
                          <div className="space-y-2 text-sm text-gray-500">
                                <p className="flex items-center gap-2"><MapPin size={14}/> {p.location}</p>
                                <p className="flex items-center gap-2"><Ruler size={14}/> {p.lengthMeter} m</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-brand-600 font-medium flex items-center justify-end">
                              Buka Data Akhir <ArrowRight size={14} className="ml-1"/>
                          </div>
                      </div>
                  ))}
                  {relocationProjects.length === 0 && (
                      <p className="col-span-3 text-center text-gray-400 py-10 italic">Tidak ada project untuk ditampilkan.</p>
                  )}
              </div>
          );
      }

      return (
          <div>
              <button 
                onClick={() => setSelectedFinalDataProject(null)} 
                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                  <ChevronLeft size={16} /> Kembali ke Daftar Project
              </button>
              <FinalDataReport 
                project={selectedFinalDataProject} 
                onUpdate={handleUpdateProject} 
              />
          </div>
      );
  };


  return (
    <div className="space-y-6">
       {/* Header & Tabs */}
       <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Project Reports</h2>
                    <p className="text-sm text-gray-500">Monitoring Progress Fisik & Status Operator Tenant</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari Project..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
       </div>

       {/* View Content based on activeSubTab prop */}
       <div className="min-h-[400px]">
            {(activeSubTab === 'timeline' || !activeSubTab) && renderTimeline()}
            {activeSubTab === 'gantt' && renderMasterSchedule()}
            {activeSubTab === 'operator' && renderOperatorTable()}
            {activeSubTab === 'survey' && renderSurveyTable()}
            {activeSubTab === 'finaldata' && renderFinalData()}
       </div>

       {/* Render Gantt Modal (Conditional) */}
       {showGanttModal && ganttProject && (
           <GanttChartModal 
               project={ganttProject}
               onClose={() => {
                   setShowGanttModal(false);
                   setGanttProject(null);
               }}
               onUpdate={handleUpdateProject}
           />
       )}

       {/* Timeline Work Item Modal */}
       {selectedTimelineProject && (
           <WorkItemModal 
                project={selectedTimelineProject}
                onClose={() => setSelectedTimelineProject(null)}
                onUpdate={(p) => {
                    handleUpdateProject(p);
                    setSelectedTimelineProject(null);
                }}
           />
       )}

       {/* Edit Operator Modal */}
       {editOperatorModal && (
           <OperatorDetailModal 
                project={editOperatorModal.project}
                operator={editOperatorModal.operator}
                onClose={() => setEditOperatorModal(null)}
                onSave={(p) => handleUpdateProject(p)}
           />
       )}

       {/* Edit Project Schedule Modal */}
       {editProjectModal && (
           <ProjectDetailModal
                project={editProjectModal}
                onClose={() => setEditProjectModal(null)}
                onUpdate={(p) => {
                    handleUpdateProject(p);
                    setEditProjectModal(null);
                }}
           />
       )}
    </div>
  );
};

export default ReportView;
