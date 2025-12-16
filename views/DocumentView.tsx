
import React, { useState, useMemo } from 'react';
import { Project, Vendor } from '../types';
import { Search, FileText, Download, Filter, Eye, FolderOpen, Building2, Calendar, FileCheck, ChevronLeft, ChevronRight, Briefcase, MapPin } from 'lucide-react';

interface DocumentViewProps {
  projects: Project[];
  currentUser: Vendor;
  vendors: Vendor[];
}

// Helper interface for the flattened list
interface FlattenedDoc {
  id: string; // Composite ID
  docName: string;
  fileName: string;
  projectName: string;
  projectLocation: string;
  vendorId: string;
  date: string; // Proxying project start date as upload date for mock
  type: string; // file extension
}

interface GroupedDocuments {
    projectName: string;
    projectId: string;
    location: string;
    vendorId: string;
    documents: FlattenedDoc[];
}

const DocumentView: React.FC<DocumentViewProps> = ({ projects, currentUser, vendors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // all, pdf, xlsx, etc.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Projects per page

  const isAdmin = currentUser.id === 'admin';

  // 1. Flatten Data
  const allDocuments = useMemo(() => {
    const docs: FlattenedDoc[] = [];
    projects.forEach(project => {
        if (project.requiredDocuments) {
            project.requiredDocuments.forEach((doc, idx) => {
                if (doc.hasFile && doc.fileName) {
                    const ext = doc.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                    docs.push({
                        id: `${project.id}_doc_${idx}`,
                        docName: doc.name,
                        fileName: doc.fileName,
                        projectName: project.name,
                        projectLocation: project.location,
                        vendorId: project.vendorId,
                        date: project.startDate, 
                        type: ext
                    });
                }
            });
        }
    });
    return docs;
  }, [projects]);

  // 2. Filter Data
  const filteredDocuments = allDocuments.filter(doc => {
      const matchesSearch = 
        doc.docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      return matchesSearch && matchesType;
  });

  // 3. Group by Project
  const groupedDocs: GroupedDocuments[] = useMemo(() => {
      const groups: Record<string, GroupedDocuments> = {};
      
      filteredDocuments.forEach(doc => {
          if (!groups[doc.projectName]) {
              groups[doc.projectName] = {
                  projectName: doc.projectName,
                  projectId: doc.projectName, // Using Name as ID for grouping simplicity in this view
                  location: doc.projectLocation,
                  vendorId: doc.vendorId,
                  documents: []
              };
          }
          groups[doc.projectName].documents.push(doc);
      });
      
      return Object.values(groups);
  }, [filteredDocuments]);

  // 4. Pagination Logic (Based on Groups)
  const totalPages = Math.ceil(groupedDocs.length / itemsPerPage);
  const currentGroups = groupedDocs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const getVendorName = (id: string) => {
      return vendors.find(v => v.id === id)?.name || id;
  };

  const getFileIconColor = (type: string) => {
      switch(type) {
          case 'PDF': return 'text-red-500 bg-red-50';
          case 'XLSX': 
          case 'XLS': return 'text-green-500 bg-green-50';
          case 'DOCX':
          case 'DOC': return 'text-blue-500 bg-blue-50';
          case 'JPG':
          case 'PNG': return 'text-purple-500 bg-purple-50';
          case 'KMZ': return 'text-orange-500 bg-orange-50';
          default: return 'text-gray-500 bg-gray-50';
      }
  };

  const uniqueTypes = Array.from(new Set(allDocuments.map(d => d.type)));

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Document Repository</h2>
                <p className="text-sm text-gray-500">
                    {isAdmin 
                        ? 'Centralized database of all vendor project documents.' 
                        : 'Manage and access your uploaded project documents.'}
                </p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari Dokumen atau Project..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="relative">
                    <select 
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    >
                        <option value="all">All Types</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Filter size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
            </div>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FolderOpen size={24} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{groupedDocs.length}</p>
                </div>
            </div>
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <FileCheck size={24} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredDocuments.length}</p>
                </div>
            </div>
       </div>

       {/* Table with Grouping & Scrolling */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 bg-gray-50">Document Name</th>
                            <th className="px-6 py-3 bg-gray-50">File Info</th>
                            <th className="px-6 py-3 bg-gray-50">Upload Date</th>
                            {isAdmin && <th className="px-6 py-3 bg-gray-50">Vendor</th>}
                            <th className="px-6 py-3 text-center bg-gray-50">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentGroups.length > 0 ? (
                            currentGroups.map((group) => (
                                <React.Fragment key={group.projectId}>
                                    {/* Group Header Row */}
                                    <tr className="bg-gray-100/80 border-b border-gray-200">
                                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={16} className="text-brand-600" />
                                                <span className="font-bold text-gray-900 text-sm">{group.projectName}</span>
                                                <div className="flex items-center text-xs font-normal text-gray-500 ml-2 gap-1 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                    <MapPin size={10} /> {group.location}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* Document Rows */}
                                    {group.documents.map(doc => (
                                        <tr key={doc.id} className="bg-white hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 pl-10 border-l-4 border-l-transparent hover:border-l-brand-500">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg shrink-0 ${getFileIconColor(doc.type)}`}>
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="font-medium text-gray-900">{doc.docName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                        {doc.fileName}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">{doc.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(doc.date).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-3">
                                                    <span className="bg-brand-50 text-brand-700 py-0.5 px-2 rounded text-[10px] font-semibold border border-brand-100">
                                                        {getVendorName(doc.vendorId)}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Preview">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download">
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-400 italic">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText size={48} className="text-gray-200 mb-3" />
                                        <p>Tidak ada dokumen yang ditemukan.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
                    <span className="text-xs text-gray-500 mr-2">Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
       </div>
    </div>
  );
};

export default DocumentView;
