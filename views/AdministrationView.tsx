
import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectOperator, AdminDocStatus, AdminPOStatus, Vendor } from '../types';
import { Search, Filter, Briefcase, Plus, Edit2, Trash2, Save, X, Users, Key, UserPlus, Shield } from 'lucide-react';
import { sheetService } from '../services/mockSheetService';

interface AdministrationViewProps {
  projects: Project[];
  onUpdateProject: (project: Project) => void;
  currentUser?: Vendor; // Pass current user to check if admin
}

// ... (Existing Interfaces) ...
interface AdminItem {
    projectId: string;
    projectName: string;
    operator: ProjectOperator;
}

const AdministrationView: React.FC<AdministrationViewProps> = ({ projects, onUpdateProject, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'admin_project' | 'user_management'>('admin_project');
  
  // --- EXISTING LOGIC FOR PROJECT ADMIN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPO, setFilterPO] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);

  const allOperators: AdminItem[] = useMemo(() => {
      return projects.flatMap(p => 
          (p.operators || []).map(op => ({ projectId: p.id, projectName: p.name, operator: op }))
      );
  }, [projects]);

  const filteredData = allOperators.filter(item => {
      const matchSearch = item.operator.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterPO === 'all' || item.operator.adminPOStatus === filterPO;
      return matchSearch && matchFilter;
  });

  const handleDelete = (item: AdminItem) => {
      if(window.confirm(`Delete operator ${item.operator.name} from project?`)) {
          const project = projects.find(p => p.id === item.projectId);
          if (project) {
              const updatedOperators = project.operators.filter(op => op.id !== item.operator.id);
              onUpdateProject({ ...project, operators: updatedOperators });
          }
      }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingItem) return;
      const project = projects.find(p => p.id === editingItem.projectId);
      if (project) {
          const updatedOperators = project.operators.map(op => op.id === editingItem.operator.id ? editingItem.operator : op);
          onUpdateProject({ ...project, operators: updatedOperators });
          setEditingItem(null);
      }
  };

  const updateEditingField = (field: keyof ProjectOperator, value: any) => {
      if (editingItem) {
          setEditingItem({ ...editingItem, operator: { ...editingItem.operator, [field]: value } });
      }
  };

  const getDocStatusBadge = (status?: AdminDocStatus) => {
    switch(status) {
        case AdminDocStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
        case AdminDocStatus.SUBMITTED: return 'bg-blue-100 text-blue-700 border-blue-200';
        case AdminDocStatus.REVISION: return 'bg-orange-100 text-orange-700 border-orange-200';
        case AdminDocStatus.PENDING: return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getPOStatusBadge = (status?: AdminPOStatus) => {
    switch(status) {
        case AdminPOStatus.PAID: return 'bg-green-100 text-green-700 border-green-200';
        case AdminPOStatus.PO_DONE: return 'bg-teal-100 text-teal-700 border-teal-200';
        case AdminPOStatus.ISSUED: return 'bg-purple-100 text-purple-700 border-purple-200';
        case AdminPOStatus.PROCESSING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case AdminPOStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  // --- NEW LOGIC FOR USER MANAGEMENT ---
  const [users, setUsers] = useState<Vendor[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', name: '', email: '', password: '', role: 'vendor' });

  useEffect(() => {
      if (activeTab === 'user_management') {
          loadUsers();
      }
  }, [activeTab]);

  const loadUsers = async () => {
      const data = await sheetService.fetchUsers();
      setUsers(data);
  };

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      await sheetService.addUser(newUser);
      setShowAddUserModal(false);
      setNewUser({ id: '', name: '', email: '', password: '', role: 'vendor' });
      loadUsers(); // refresh
  };

  const handleDeleteUser = async (userId: string) => {
      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          await sheetService.deleteUser(userId);
          loadUsers();
      }
  };

  return (
    <div className="space-y-6 pb-20">
       {/* Header with Tabs */}
       <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pusat Administrasi</h2>
                    <p className="text-sm text-gray-500">Kelola administrasi project dan akses pengguna aplikasi.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setActiveTab('admin_project')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'admin_project' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Briefcase size={16} /> Admin Project
                </button>
                {/* Only show User Management if Admin */}
                {(!currentUser || currentUser?.id === 'admin') && (
                    <button 
                        onClick={() => setActiveTab('user_management')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'user_management' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} /> User Management
                    </button>
                )}
            </div>
       </div>

       {/* --- TAB CONTENT: ADMIN PROJECT --- */}
       {activeTab === 'admin_project' && (
           <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari Operator / Project..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="relative">
                        <select value={filterPO} onChange={(e) => setFilterPO(e.target.value)} className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-brand-500">
                            <option value="all">Filter PO Status</option>
                            {Object.values(AdminPOStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Filter size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">No.</th>
                                    <th className="px-6 py-4">Nama Operator</th>
                                    <th className="px-6 py-4 text-center">Status Dokumen</th>
                                    <th className="px-6 py-4 text-center">Status PO</th>
                                    <th className="px-6 py-4 text-center">Tanggal Submit</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((item, idx) => (
                                    <tr key={`${item.projectId}_${item.operator.id}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-center text-gray-400">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{item.operator.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Briefcase size={10} />{item.projectName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-semibold border ${getDocStatusBadge(item.operator.adminDocStatus)}`}>{item.operator.adminDocStatus || '-'}</span></td>
                                        <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-semibold border ${getPOStatusBadge(item.operator.adminPOStatus)}`}>{item.operator.adminPOStatus || '-'}</span></td>
                                        <td className="px-6 py-4 text-center font-mono">{item.operator.adminSubmitDate ? new Date(item.operator.adminSubmitDate).toLocaleDateString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate">{item.operator.adminRemarks || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setEditingItem(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
           </div>
       )}

       {/* --- TAB CONTENT: USER MANAGEMENT --- */}
       {activeTab === 'user_management' && (
           <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <div>
                       <h3 className="text-lg font-bold text-gray-900">Daftar Pengguna Aplikasi</h3>
                       <p className="text-xs text-gray-500">Kelola akun vendor dan admin yang memiliki akses.</p>
                   </div>
                   <button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 shadow-sm text-sm">
                       <UserPlus size={16} /> Tambah User
                   </button>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <table className="w-full text-sm text-left text-gray-500">
                       <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                           <tr>
                               <th className="px-6 py-3">User ID (Login)</th>
                               <th className="px-6 py-3">Nama Lengkap / Vendor</th>
                               <th className="px-6 py-3">Email</th>
                               <th className="px-6 py-3 text-center">Role</th>
                               <th className="px-6 py-3 text-center">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {users.map(user => (
                               <tr key={user.id} className="hover:bg-gray-50">
                                   <td className="px-6 py-4 font-mono font-medium text-gray-900">{user.id}</td>
                                   <td className="px-6 py-4">{user.name}</td>
                                   <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                   <td className="px-6 py-4 text-center">
                                       {user.id === 'admin' ? (
                                           <span className="flex items-center justify-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200"><Shield size={10}/> ADMIN</span>
                                       ) : (
                                           <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">VENDOR</span>
                                       )}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                        {user.id !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                   </td>
                               </tr>
                           ))}
                           {users.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Loading users...</td></tr>}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* --- MODALS --- */}
       
       {/* 1. Edit Project Admin Modal (Existing) */}
       {editingItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
            <div className="relative bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Update Administrasi</h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                     {/* ... Form fields as before ... */}
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nama Operator</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed" value={editingItem.operator.name} readOnly />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status Dokumen</label>
                             <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500" value={editingItem.operator.adminDocStatus || ''} onChange={(e) => updateEditingField('adminDocStatus', e.target.value)}>
                                 <option value="">Select...</option>{Object.values(AdminDocStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status PO</label>
                             <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500" value={editingItem.operator.adminPOStatus || ''} onChange={(e) => updateEditingField('adminPOStatus', e.target.value)}>
                                 <option value="">Select...</option>{Object.values(AdminPOStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tanggal Submit</label>
                         <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500" value={editingItem.operator.adminSubmitDate || ''} onChange={(e) => updateEditingField('adminSubmitDate', e.target.value)} />
                    </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Keterangan</label>
                         <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500" value={editingItem.operator.adminRemarks || ''} onChange={(e) => updateEditingField('adminRemarks', e.target.value)} />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"><Save size={16} /> Save Changes</button>
                    </div>
                </form>
            </div>
         </div>
       )}

       {/* 2. Add User Modal (New) */}
       {showAddUserModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)}></div>
                <div className="relative bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Tambah User Baru</h3>
                        <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleAddUser} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID (Untuk Login)</label>
                            <input 
                                required
                                type="text" 
                                placeholder="e.g. pt_vendor_jaya"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                                value={newUser.id}
                                onChange={(e) => setNewUser({...newUser, id: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                            <input 
                                required
                                type="text" 
                                placeholder="Secret123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 font-mono"
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Perusahaan / User</label>
                            <input 
                                required
                                type="text" 
                                placeholder="e.g. PT Vendor Jaya Abadi"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <input 
                                required
                                type="email" 
                                placeholder="admin@vendor.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                             <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                             >
                                 <option value="vendor">Vendor</option>
                                 <option value="admin">Admin</option>
                             </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm">
                                <UserPlus size={16} /> Add User
                            </button>
                        </div>
                    </form>
                </div>
           </div>
       )}

    </div>
  );
};

export default AdministrationView;
