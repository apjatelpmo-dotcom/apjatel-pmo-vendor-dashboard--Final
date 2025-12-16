
import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectStatus, Vendor } from '../types';
import { ProjectStatusChart, GenericDistributionChart, CategoryBarChart } from '../components/DashboardCharts';
import { TrendingUp, AlertTriangle, Users, MapPin, Ruler, Box, Cable, Zap, ClipboardCheck, Building2, List, XCircle, Download, Printer, AlertOctagon, FileText, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV, printComponent } from '../services/exportService';

interface DashboardViewProps {
  projects: Project[];
  currentUser: Vendor;
  vendors: Vendor[];
}

interface ActiveFilters {
    status?: string;
    location?: string;
    vendor?: string; // New filter
    material?: string;
    survey?: string;
    pulling?: string;
    cutOver?: string;
    poStatus?: string;
    isOverdue?: boolean;
}

const ITEMS_PER_PAGE = 5;

const DashboardView: React.FC<DashboardViewProps> = ({ projects, currentUser, vendors }) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  // Pagination State
  const [projectPage, setProjectPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);

  const isAdmin = currentUser.id === 'admin';

  // Reset pagination when filters change
  useEffect(() => {
    setProjectPage(1);
    setAdminPage(1);
  }, [activeFilters, selectedVendorId]);

  // 1. Filtering Logic
  const displayedProjects = useMemo(() => {
    let result = projects;

    // Admin Vendor Dropdown Filter (Global Context)
    if (isAdmin && selectedVendorId !== 'all') {
        result = projects.filter(p => p.vendorId === selectedVendorId);
    }

    // Chart/Card Filters
    if (activeFilters.status) {
        result = result.filter(p => p.status === activeFilters.status);
    }
    if (activeFilters.isOverdue) {
        const today = new Date();
        result = result.filter(p => {
             if (!p.endDate) return false;
             return new Date(p.endDate) < today && p.progress < 100;
        });
    }
    if (activeFilters.location) {
        result = result.filter(p => p.location === activeFilters.location);
    }
    
    // Vendor Filter (from Chart Click)
    if (activeFilters.vendor) {
        result = result.filter(p => {
            const vName = vendors.find(v => v.id === p.vendorId)?.name || 'Unknown';
            return vName === activeFilters.vendor;
        });
    }

    // Nested Operator Filters
    if (activeFilters.survey) {
        result = result.filter(p => p.operators?.some(op => op.jointSurveyStatus === activeFilters.survey));
    }
    if (activeFilters.material) {
        result = result.filter(p => p.operators?.some(op => op.statusMaterial === activeFilters.material));
    }
    if (activeFilters.pulling) {
        result = result.filter(p => p.operators?.some(op => op.statusPulling === activeFilters.pulling));
    }
    if (activeFilters.cutOver) {
        result = result.filter(p => p.operators?.some(op => op.statusCutOver === activeFilters.cutOver));
    }
    if (activeFilters.poStatus) {
        result = result.filter(p => p.operators?.some(op => op.adminPOStatus === activeFilters.poStatus));
    }

    return result;
  }, [projects, isAdmin, selectedVendorId, activeFilters, vendors]);

  // 2. Data Aggregation for KPIs
  const totalProjects = displayedProjects.length;
  const uniqueLocations = new Set(displayedProjects.map(p => p.location.trim())).size;
  const totalLengthMeters = displayedProjects.reduce((sum, p) => sum + (p.lengthMeter || 0), 0);
  
  const today = new Date();
  const overdueProjects = displayedProjects.filter(p => {
    if (!p.endDate) return false;
    return new Date(p.endDate) < today && p.progress < 100;
  }).length;

  const allOperators = displayedProjects.flatMap(p => p.operators || []);

  const countStatus = (items: any[], field: string) => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
        const val = item[field] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const countLocations = () => {
      const counts: Record<string, number> = {};
      displayedProjects.forEach(p => {
          const loc = p.location || 'Unknown';
          counts[loc] = (counts[loc] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); 
  };

  const calculateVendorDistribution = () => {
      if (!isAdmin) return [];
      const counts: Record<string, number> = {};
      displayedProjects.forEach(p => {
          const vName = vendors.find(v => v.id === p.vendorId)?.name || 'Unknown';
          counts[vName] = (counts[vName] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  };

  const materialData = countStatus(allOperators, 'statusMaterial');
  const pullingData = countStatus(allOperators, 'statusPulling');
  const cutOverData = countStatus(allOperators, 'statusCutOver');
  const surveyData = countStatus(allOperators, 'jointSurveyStatus');
  const poData = countStatus(allOperators, 'adminPOStatus'); 
  const locationData = countLocations();
  const vendorChartData = calculateVendorDistribution();

  const handleFilterChange = (key: keyof ActiveFilters, value: any) => {
      setActiveFilters(prev => {
          if (prev[key] === value) {
              const newState = { ...prev };
              delete newState[key];
              return newState;
          }
          return { ...prev, [key]: value };
      });
  };

  const clearFilters = () => setActiveFilters({});
  const hasFilters = Object.keys(activeFilters).length > 0;

  // 3. Prepare Data for Table 2 (Administrative)
  const adminTableData = useMemo(() => {
    return displayedProjects.flatMap(p => {
        // Apply nested filters to this list as well so it matches the charts
        const operators = p.operators || [];
        const filteredOps = operators.filter(op => {
             if (activeFilters.survey && op.jointSurveyStatus !== activeFilters.survey) return false;
             if (activeFilters.material && op.statusMaterial !== activeFilters.material) return false;
             if (activeFilters.pulling && op.statusPulling !== activeFilters.pulling) return false;
             if (activeFilters.cutOver && op.statusCutOver !== activeFilters.cutOver) return false;
             if (activeFilters.poStatus && op.adminPOStatus !== activeFilters.poStatus) return false;
             return true;
        });

        return filteredOps.map(op => ({
            projectId: p.id,
            projectName: p.name,
            location: p.location,
            operatorName: op.name,
            statusPO: op.adminPOStatus,
            statusDoc: op.adminDocStatus,
            submitDate: op.adminSubmitDate,
            remarks: op.adminRemarks
        }));
    });
  }, [displayedProjects, activeFilters]);

  // --- PAGINATION LOGIC ---
  const paginatedProjects = displayedProjects.slice((projectPage - 1) * ITEMS_PER_PAGE, projectPage * ITEMS_PER_PAGE);
  const totalProjectPages = Math.ceil(displayedProjects.length / ITEMS_PER_PAGE);

  const paginatedAdminData = adminTableData.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE);
  const totalAdminPages = Math.ceil(adminTableData.length / ITEMS_PER_PAGE);


  // Export Handlers
  const handleDownloadProjectCSV = () => {
      const data = displayedProjects.map(p => ({
            Name: p.name,
            Location: p.location,
            Status: p.status,
            Progress: p.progress,
            Start: p.startDate,
            End: p.endDate
        }));
        exportToCSV(data, 'Dashboard_Project_Summary');
  };

  const handleDownloadAdminCSV = () => {
       const data = adminTableData.map(row => ({
            Project: row.projectName,
            Location: row.location,
            Operator: row.operatorName,
            StatusPO: row.statusPO,
            StatusDoc: row.statusDoc,
            SubmitDate: row.submitDate,
            Remarks: row.remarks
        }));
        exportToCSV(data, 'Dashboard_Admin_PO_Data');
  };

  // Helper for badges
  const getPOStatusBadge = (status?: string) => {
      switch(status) {
          case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'PO Done': return 'bg-teal-100 text-teal-700 border-teal-200';
          case 'Issued': return 'bg-violet-100 text-violet-700 border-violet-200';
          case 'Processing': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
          default: return 'bg-gray-50 text-gray-500 border-gray-100';
      }
  };

  const getDocStatusBadge = (status?: string) => {
      switch(status) {
          case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Submitted': return 'bg-sky-100 text-sky-700 border-sky-200';
          case 'Revision': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-gray-50 text-gray-500 border-gray-100';
      }
  };

  // Reusable Pagination Component
  const PaginationFooter = ({ page, total, setPage }: { page: number, total: number, setPage: (n: number) => void }) => {
      if (total <= 1) return null;
      return (
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
            <span className="text-xs text-gray-400">
                Page <span className="font-medium text-gray-700">{page}</span> of <span className="font-medium text-gray-700">{total}</span>
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => setPage(Math.min(total, page + 1))}
                    disabled={page === total}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 pb-20 font-sans">
      {/* Header & Filter */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isAdmin ? 'Global PMO Dashboard' : 'Vendor Dashboard'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Monitoring kinerja project, status administrasi, dan laporan lapangan secara real-time.
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                {hasFilters && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors border border-rose-100"
                    >
                        <XCircle size={16} /> Clear Filters
                    </button>
                )}

                {/* Admin Vendor Filter */}
                {isAdmin && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-slate-400">
                            <Users size={16} />
                        </div>
                        <select 
                            className="bg-transparent border-none text-slate-700 text-sm focus:ring-0 cursor-pointer font-medium outline-none min-w-[150px]"
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                        >
                            <option value="all">All Vendors (Global)</option>
                            {vendors.filter(v => v.id !== 'admin').map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- ROW 1: KPI CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
         {/* 1. Total Project */}
        <div 
            onClick={clearFilters}
            className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Building2 size={48} className="text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Project</p>
            <p className="text-3xl font-bold text-slate-800">{totalProjects}</p>
            {!hasFilters && <div className="mt-3 inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full font-medium">All Data</div>}
        </div>

        {/* 2. Lokasi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Lokasi</p>
                 <MapPin size={18} className="text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{uniqueLocations}</p>
        </div>

        {/* 3. Total Length */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Panjang</p>
                <Ruler size={18} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">
                 {(totalLengthMeters / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-base font-normal text-slate-400">km</span>
            </p>
        </div>

        {/* 4. Overdue Project */}
        <div 
            onClick={() => handleFilterChange('isOverdue', true)}
            className={`p-5 rounded-2xl shadow-sm border cursor-pointer hover:shadow-md transition-all relative ${activeFilters.isOverdue ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100' : 'bg-white border-slate-100 hover:border-rose-200'}`}
        >
             <div className="flex justify-between items-start mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${activeFilters.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>Overdue</p>
                <AlertTriangle size={18} className={overdueProjects > 0 ? 'text-rose-500' : 'text-slate-300'} />
            </div>
            <p className={`text-3xl font-bold ${overdueProjects > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {overdueProjects}
            </p>
             {activeFilters.isOverdue && <div className="mt-2 text-[10px] text-rose-600 font-bold">Filter Active</div>}
        </div>

        {/* Admin Only: Total Vendors */}
        {isAdmin && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hidden lg:block">
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendors</p>
                    <Users size={18} className="text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-slate-800">{vendors.length - 1}</p>
            </div>
        )}
      </div>

      {/* --- ROW 2: MAIN CHARTS (Status & Location & Vendor) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Project Status (Pie) */}
        <div className={`col-span-1 bg-white p-6 rounded-2xl shadow-sm border transition-all ${activeFilters.status ? 'border-brand-400 ring-2 ring-brand-50' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-brand-500" size={20} />
                    Project Status
                </h3>
                {activeFilters.status && (
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        Filtered: {activeFilters.status}
                    </span>
                )}
            </div>
            <div className="relative">
                 <ProjectStatusChart 
                    projects={projects} 
                    onClick={(status) => handleFilterChange('status', status)}
                />
                <p className="text-center text-xs text-slate-400 mt-4 italic">Click pie slice to filter</p>
            </div>
        </div>
        
        {/* Col 2 & 3: Bar Charts */}
        {isAdmin ? (
            <>
                {/* Admin: Location Chart (Middle) */}
                <div className={`col-span-1 bg-white p-6 rounded-2xl shadow-sm border transition-all ${activeFilters.location ? 'border-pink-400 ring-2 ring-pink-50' : 'border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="text-pink-500" size={20} />
                            Sebaran Lokasi
                        </h3>
                     </div>
                     <CategoryBarChart 
                        data={locationData} 
                        color="#ec4899"
                        label="Projects"
                        onClick={(loc) => handleFilterChange('location', loc)}
                     />
                </div>

                {/* Admin: Vendor Chart (Right) */}
                <div className={`col-span-1 bg-white p-6 rounded-2xl shadow-sm border transition-all ${activeFilters.vendor ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-emerald-500" size={20} />
                            Sebaran Vendor
                        </h3>
                     </div>
                     <CategoryBarChart 
                        data={vendorChartData} 
                        color="#10b981"
                        label="Projects"
                        onClick={(vName) => handleFilterChange('vendor', vName)}
                     />
                </div>
            </>
        ) : (
            // Vendor: Location Chart (Spans 2 cols)
            <div className={`col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border transition-all ${activeFilters.location ? 'border-pink-400 ring-2 ring-pink-50' : 'border-slate-100'}`}>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-pink-500" size={20} />
                        Sebaran Lokasi Project
                    </h3>
                 </div>
                 <CategoryBarChart 
                    data={locationData} 
                    color="#ec4899"
                    label="Projects"
                    onClick={(loc) => handleFilterChange('location', loc)}
                 />
            </div>
        )}
      </div>

      {/* --- ROW 3: DETAILED OPERATOR STATUSES (Small Charts) --- */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-lg font-bold text-slate-900">Analisa Detail Lapangan & Administrasi</h3>
             <p className="text-xs text-slate-400 hidden sm:block">Klik bar grafik untuk filter tabel</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Status PO */}
            <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${activeFilters.poStatus ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Status PO (Purchase Order)</h4>
                </div>
                <GenericDistributionChart 
                    data={poData} 
                    color="#6366f1"
                    onClick={(val) => handleFilterChange('poStatus', val)}
                />
            </div>

            {/* 2. Status Join Survey */}
             <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${activeFilters.survey ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ClipboardCheck size={16} /></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Status Join Survey</h4>
                </div>
                <GenericDistributionChart 
                    data={surveyData} 
                    color="#10b981" 
                    onClick={(val) => handleFilterChange('survey', val)}
                />
            </div>

            {/* 3. Status Material (Shifted here as Location moved up) */}
            <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${activeFilters.material ? 'border-orange-400 ring-2 ring-orange-50' : 'border-slate-100 hover:border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                     <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Box size={16} /></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Status Material</h4>
                </div>
                <GenericDistributionChart 
                    data={materialData} 
                    color="#f97316"
                    onClick={(val) => handleFilterChange('material', val)}
                />
            </div>

            {/* 4. Status Pulling */}
            <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${activeFilters.pulling ? 'border-sky-400 ring-2 ring-sky-50' : 'border-slate-100 hover:border-sky-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                     <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><Cable size={16} /></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Status Pulling</h4>
                </div>
                <GenericDistributionChart 
                    data={pullingData} 
                    color="#0ea5e9" 
                    onClick={(val) => handleFilterChange('pulling', val)}
                />
            </div>

            {/* 5. Status Cut Over */}
            <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${activeFilters.cutOver ? 'border-amber-400 ring-2 ring-amber-50' : 'border-slate-100 hover:border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Zap size={16} /></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Status Cut Over</h4>
                </div>
                <GenericDistributionChart 
                    data={cutOverData} 
                    color="#eab308" 
                    onClick={(val) => handleFilterChange('cutOver', val)}
                />
            </div>
        </div>
      </div>

      {/* --- TABLE 1: PROJECT MONITORING (Main) --- */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                        <List size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Monitoring Project
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Ringkasan status project yang sedang berjalan
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDownloadProjectCSV}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button 
                        onClick={() => printComponent('project-table-container', 'Project Monitoring')}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Scrollable Container with Fixed Height & Sticky Header */}
            <div className="overflow-y-auto max-h-[500px]" id="project-table-container">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/95 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama Project</th>
                            <th className="px-6 py-4 font-semibold">Lokasi</th>
                            <th className="px-6 py-4 font-semibold text-center">Progress</th>
                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-center">Start Date</th>
                            <th className="px-6 py-4 font-semibold text-center">End Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {paginatedProjects.length > 0 ? (
                            paginatedProjects.map(project => {
                                const isCriticalOverdue = (() => {
                                    if (!project.endDate || project.progress === 100) return false;
                                    const end = new Date(project.endDate);
                                    const today = new Date();
                                    end.setHours(0,0,0,0);
                                    today.setHours(0,0,0,0);
                                    return today > end;
                                })();

                                return (
                                    <tr key={project.id} className="bg-white hover:bg-slate-50/80 transition-colors duration-200">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                {project.name}
                                                {isCriticalOverdue && (
                                                    <div className="group relative flex items-center" title="Overdue">
                                                        <AlertOctagon size={16} className="text-rose-500 animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <MapPin size={14} className="text-slate-400" />
                                                {project.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-full bg-slate-100 rounded-full h-2 max-w-[80px]">
                                                    <div className={`h-2 rounded-full ${project.progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${project.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border 
                                                ${project.status === ProjectStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                project.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                                project.status === ProjectStatus.DELAYED ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-mono text-slate-600">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-mono text-slate-600">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                    Tidak ada data project yang sesuai filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Project Pagination */}
            <PaginationFooter 
                page={projectPage} 
                total={totalProjectPages} 
                setPage={setProjectPage} 
            />
        </div>
      </div>

      {/* --- TABLE 2: ADMINISTRATIVE & PO STATUS (Separate) --- */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-200">
                        <Briefcase size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Status Administrasi & PO Operator
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Detail status dokumen dan purchase order per operator
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDownloadAdminCSV}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button 
                        onClick={() => printComponent('admin-table-container', 'Admin PO Status')}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Scrollable Container with Fixed Height & Sticky Header */}
            <div className="overflow-y-auto max-h-[500px]" id="admin-table-container">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-indigo-900 uppercase bg-indigo-50/90 backdrop-blur-sm sticky top-0 z-10 border-b border-indigo-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama Project</th>
                            <th className="px-6 py-4 font-semibold">Lokasi</th>
                            <th className="px-6 py-4 font-semibold">Operator</th>
                            <th className="px-6 py-4 font-semibold text-center">Status PO</th>
                            <th className="px-6 py-4 font-semibold text-center">Status Dokumen</th>
                            <th className="px-6 py-4 font-semibold text-center">Tgl Submit</th>
                            <th className="px-6 py-4 font-semibold">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedAdminData.length > 0 ? (
                            paginatedAdminData.map((row, idx) => (
                                <tr key={idx} className="bg-white hover:bg-indigo-50/30 transition-colors duration-200">
                                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate" title={row.projectName}>{row.projectName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            {row.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-brand-600">{row.operatorName}</td>
                                    <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border tracking-wide ${getPOStatusBadge(row.statusPO)}`}>
                                            {row.statusPO || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border tracking-wide ${getDocStatusBadge(row.statusDoc)}`}>
                                            {row.statusDoc || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-600">
                                        {row.submitDate ? new Date(row.submitDate).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs italic text-slate-500 truncate max-w-xs" title={row.remarks}>
                                        {row.remarks || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                    Tidak ada data operator yang sesuai filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Admin Pagination */}
            <PaginationFooter 
                page={adminPage} 
                total={totalAdminPages} 
                setPage={setAdminPage} 
            />
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
