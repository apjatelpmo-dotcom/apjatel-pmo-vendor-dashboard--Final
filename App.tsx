
import React, { useState, useEffect } from 'react';
import Login from './views/Login';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import ProjectListView from './views/ProjectListView';
import AddProjectView from './views/AddProjectView';
import ReportView from './views/ReportView';
import DocumentView from './views/DocumentView';
import BASTView from './views/BASTView';
import AdministrationView from './views/AdministrationView'; // Imported
import ProjectDetailModal from './components/ProjectDetailModal';
import { Project, Vendor } from './types';
import { sheetService } from './services/mockSheetService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<string>('view');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  // Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Initial Connection Simulation
  useEffect(() => {
    const init = async () => {
        const status = await sheetService.initializeConnection();
        setConnectionStatus(status.message);
    };
    init();
  }, []);

  // Fetch Projects when user logs in or adds data
  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        const data = await sheetService.getProjects(currentUser.id);
        setProjects(data);
    } catch (e) {
        console.error("Failed to fetch", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleLogin = (vendor: Vendor) => {
    setCurrentUser(vendor);
    setActiveTab('view');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProjects([]);
  };

  const handleAddProject = async (project: Project) => {
    setLoading(true);
    await sheetService.addProject(project);
    await fetchProjects();
    setActiveTab('project-list');
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setLoading(true);
    await sheetService.updateProject(updatedProject);
    await fetchProjects();
    
    // FIX: Only update selectedProject if the modal is CURRENTLY OPEN and matches the project.
    // This prevents the modal from popping up unexpectedly when editing from AdministrationView.
    if (selectedProject && selectedProject.id === updatedProject.id) {
        setSelectedProject(updatedProject);
    }
    
    setLoading(false);
  };

  // Render Logic
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (loading && projects.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Loading data from Google Sheet...</div>;
    }

    // Handle Sub-Reports Routing
    if (activeTab.startsWith('report')) {
        const subTab = activeTab.replace('report-', '');
        // If exact match 'report', default to timeline
        const actualSubTab = subTab === 'report' ? 'timeline' : subTab;
        return <ReportView projects={projects} activeSubTab={actualSubTab} />;
    }

    switch (activeTab) {
        case 'view':
            return <DashboardView 
                projects={projects} 
                currentUser={currentUser}
                vendors={sheetService.getVendors()}
            />;
        case 'project-list':
            return <ProjectListView 
                projects={projects} 
                onAddClick={() => setActiveTab('project-add')} 
                currentUser={currentUser}
                vendors={sheetService.getVendors()}
                onProjectClick={(p) => setSelectedProject(p)}
            />;
        case 'project-add':
            // Updated to pass currentUser and vendors for Admin functionality
            return <AddProjectView 
                currentUser={currentUser} 
                vendors={sheetService.getVendors()} 
                onSave={handleAddProject} 
                onCancel={() => setActiveTab('project-list')} 
            />;
        case 'bast':
            return <BASTView projects={projects} currentUser={currentUser} />;
        case 'administration': // New Route
            return <AdministrationView projects={projects} onUpdateProject={handleUpdateProject} currentUser={currentUser} />;
        case 'documents':
            return <DocumentView 
                projects={projects}
                currentUser={currentUser}
                vendors={sheetService.getVendors()}
            />;
        case 'other':
            return <div className="p-10 text-center text-gray-500">Other Settings</div>;
        default:
            return <DashboardView 
                projects={projects} 
                currentUser={currentUser}
                vendors={sheetService.getVendors()}
            />;
    }
  };

  return (
    <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
    >
        {renderContent()}
        
        {/* Project Detail Modal */}
        {selectedProject && (
            <ProjectDetailModal 
                project={selectedProject} 
                onClose={() => setSelectedProject(null)} 
                onUpdate={handleUpdateProject}
            />
        )}
    </Layout>
  );
};

export default App;
