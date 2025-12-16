
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, Vendor } from '../types';
import { Search, Plus, Calendar, FileText, Check, X, MapPin, ChevronLeft, ChevronRight, MessageSquare, Ruler, Building2, Download, Printer } from 'lucide-react';
import { exportToCSV, printComponent } from '../services/exportService';

interface ProjectListViewProps {
  projects: Project[];
  onAddClick: () => void;
  currentUser: Vendor;
  vendors: Vendor[];
  onProjectClick?: (project: Project) => void;
}

const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, onAddClick, currentUser, vendors, onProjectClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = currentUser.id === 'admin';

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorAppointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.initiator && p.initiator.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case ProjectStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
        case ProjectStatus.DELAYED: return 'bg-red-100 text-red-800';
        case ProjectStatus.PLANNING: return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || vendorId;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
  };

  const handleDownloadCSV = () => {
    const data = filteredProjects.map(p => ({
        SPK: p.vendorAppointmentNumber,
        Name: p.name,
        Location: p.location,
        Status: p.status,
        Progress: p.progress,
        StartDate: p.startDate,
        EndDate: p.endDate,
        Remarks: p.remarks
    }));
    exportToCSV(data, 'Project_List_Export');
  };

  const handlePrint = () => {
      printComponent('project-list-table', 'Daftar Project APJATEL');
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]"> 
       {/* Header Section */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Daftar Project</h2>
        <div className="flex gap-2">
             <button 
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
            >
                <Download size={18} /> CSV
            </button>
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
            >
                <Printer size={18} /> PDF
            </button>
            <button 
                onClick={onAddClick}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm font-medium"
            >
                <Plus size={18} />
                Add Project
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div className="relative max-w-md w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input 
                    type="text" 
                    className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500" 
                    placeholder="Cari Project, Lokasi, No SPK..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>entries</span>
            </div>
        </div>

        {/* Table Container with Overflow for Sticky Header */}
        <div className="flex-1 overflow-auto relative" id="project-list-table">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3 w-16 bg-gray-100">No.</th>
                        {isAdmin && <th className="px-6 py-3 bg-gray-100">Vendor</th>}
                        <th className="px-6 py-3 bg-gray-100">No. Penunjukkan</th>
                        <th className="px-6 py-3 bg-gray-100">Nama Project</th>
                        <th className="px-6 py-3 bg-gray-100">Inisiator</th>
                        <th className="px-6 py-3 bg-gray-100">Lokasi</th>
                        <th className="px-6 py-3 bg-gray-100">Panjang (m)</th>
                        <th className="px-6 py-3 bg-gray-100">Timeline</th>
                        <th className="px-6 py-3 bg-gray-100">Dokumen</th>
                        <th className="px-6 py-3 bg-gray-100">Status / Progress</th>
                        <th className="px-6 py-3 bg-gray-100">Remarks</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentProjects.length > 0 ? (
                        currentProjects.map((project, index) => (
                            <tr 
                                key={project.id} 
                                className="bg-white hover:bg-blue-50/50 align-top cursor-pointer transition-colors"
                                onClick={() => onProjectClick && onProjectClick(project)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {indexOfFirstItem + index + 1}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 text-brand-600 font-medium">
                                        {getVendorName(project.vendorId)}
                                    </td>
                                )}
                                <td className="px-6 py-4 font-mono text-gray-600 whitespace-nowrap text-xs">{project.vendorAppointmentNumber}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {project.name}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-1.5" title={project.initiator}>
                                        <Building2 size={14} className="text-gray-400 shrink-0" />
                                        <span className="truncate max-w-[150px]">{project.initiator || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-gray-400 shrink-0" />
                                        <span>{project.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <Ruler size={14} className="text-gray-400 shrink-0" />
                                        <span className="font-mono">{project.lengthMeter ? `${project.lengthMeter} m` : '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="w-8 text-gray-400">Start:</span>
                                            <span className="font-medium">{formatDate(project.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-8 text-gray-400">End:</span>
                                            <span className="font-medium">{formatDate(project.endDate)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 w-32">
                                        {project.requiredDocuments?.map((doc, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${doc.hasFile ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}
                                                title={doc.name + (doc.hasFile ? ' (Uploaded)' : ' (Missing)')}
                                            >
                                                <FileText size={12} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        {project.requiredDocuments?.filter(d => d.hasFile).length}/{project.requiredDocuments?.length || 0} Uploaded
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}>
                                        {project.status}
                                    </span>
                                    <div className="mt-2 w-24">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-1.5 rounded-full ${project.progress === 100 ? 'bg-green-500' : 'bg-brand-600'}`} style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs mt-1 block text-gray-500">
                                            {project.progress}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                    {project.remarks ? (
                                        <div className="flex items-center gap-1.5" title={project.remarks}>
                                            <MessageSquare size={12} className="text-gray-400 shrink-0" />
                                            <span className="truncate">{project.remarks}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={isAdmin ? 11 : 10} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                                <div className="flex flex-col items-center justify-center">
                                    <Search size={48} className="text-gray-300 mb-2" />
                                    <p className="text-lg font-medium text-gray-900">Tidak ada project ditemukan</p>
                                    <p className="text-sm text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
            <div className="text-sm text-gray-500 hidden sm:block">
                Menampilkan <span className="font-medium text-gray-900">{filteredProjects.length > 0 ? indexOfFirstItem + 1 : 0}</span> sampai <span className="font-medium text-gray-900">{Math.min(indexOfLastItem, filteredProjects.length)}</span> dari <span className="font-medium text-gray-900">{filteredProjects.length}</span> data
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                            p = currentPage - 2 + i;
                        }
                        if (p > totalPages) return null;

                        return (
                             <button 
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectListView;
