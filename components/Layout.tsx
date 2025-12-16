
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Files, 
  MoreHorizontal, 
  LogOut, 
  Menu,
  X,
  ShieldCheck,
  Network,
  FileCheck2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Activity,
  CalendarDays,
  Radio,
  ClipboardList,
  Database
} from 'lucide-react';
import { Vendor } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Vendor;
  onLogout: () => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: any;
    subItems?: { id: string; label: string; icon?: any }[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['report']); // Default expand report for visibility

  const navItems: NavItem[] = [
    { id: 'view', label: 'Dashboard View', icon: LayoutDashboard },
    { id: 'project-list', label: 'Projects', icon: FolderKanban },
    { 
        id: 'report', 
        label: 'Project Reports', 
        icon: FileText,
        subItems: [
            { id: 'report-timeline', label: 'Timeline & Overview', icon: Activity },
            { id: 'report-gantt', label: 'Master Schedule', icon: CalendarDays },
            { id: 'report-operator', label: 'Jalur Operator', icon: Radio },
            { id: 'report-survey', label: 'Join Survey', icon: ClipboardList },
            { id: 'report-finaldata', label: 'Data Akhir', icon: Database },
        ]
    },
    { id: 'bast', label: 'BAST & Handover', icon: FileCheck2 },
    { id: 'administration', label: 'Administrasi', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: Files },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.subItems) {
        // Toggle expansion
        if (expandedMenus.includes(item.id)) {
            setExpandedMenus(expandedMenus.filter(id => id !== item.id));
        } else {
            setExpandedMenus([...expandedMenus, item.id]);
        }
    } else {
        setActiveTab(item.id);
        setIsSidebarOpen(false);
    }
  };

  const handleSubItemClick = (subId: string) => {
      setActiveTab(subId);
      setIsSidebarOpen(false);
  };

  // Helper to determine if a nav item is active
  const isItemActive = (itemId: string) => {
    if (itemId === 'project-list' && (activeTab === 'project-list' || activeTab === 'project-add')) {
      return true;
    }
    // Check if any sub-item is active
    const item = navItems.find(i => i.id === itemId);
    if (item?.subItems) {
        return item.subItems.some(sub => sub.id === activeTab);
    }
    return activeTab === itemId;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-30 w-64 h-full bg-brand-900 text-white flex flex-col transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-brand-800 flex items-center justify-between">
          <div className="flex flex-col items-start">
             <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 bg-brand-700 rounded-lg">
                    <Network size={20} className="text-white" />
                 </div>
                 <h1 className="text-xl font-bold tracking-tight text-white">APJATEL</h1>
             </div>
             <p className="text-[10px] leading-tight text-brand-200 font-medium">Asosiasi Penyelenggara Jaringan Telekomunikasi</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-brand-700">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = isItemActive(item.id);
              const isExpanded = expandedMenus.includes(item.id);
              
              return (
                <li key={item.id}>
                    <button
                        onClick={() => handleNavClick(item)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors
                            ${isActive && !item.subItems ? 'bg-brand-600 text-white' : 'text-brand-100 hover:bg-brand-800'}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </div>
                        {item.subItems && (
                            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                    </button>

                    {/* Sub Menu Rendering */}
                    {item.subItems && isExpanded && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-brand-700 pl-2">
                            {item.subItems.map(sub => (
                                <li key={sub.id}>
                                    <button
                                        onClick={() => handleSubItemClick(sub.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-2 text-xs font-medium rounded-lg transition-colors
                                            ${activeTab === sub.id ? 'bg-brand-700/50 text-white' : 'text-brand-200 hover:text-white hover:bg-brand-800/50'}
                                        `}
                                    >
                                        {sub.icon && <sub.icon size={14} className={activeTab === sub.id ? 'text-brand-300' : 'text-brand-400'}/>}
                                        <span>{sub.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-brand-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-lg font-bold text-white relative">
                    {currentUser.id === 'admin' ? <ShieldCheck size={20} /> : currentUser.name.charAt(0)}
                    {currentUser.id === 'admin' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-brand-700 rounded-full"></span>}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-brand-300 truncate">{currentUser.email}</p>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-100 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
            >
                <LogOut size={16} />
                Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header (Mobile) */}
        <header className="md:hidden bg-brand-900 border-b border-brand-800 p-4 flex items-center justify-between shadow-sm text-white">
          <button onClick={() => setIsSidebarOpen(true)} className="text-brand-100">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg">APJATEL</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
