
import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectDocumentStatus } from '../types';
import { X, Calendar, MapPin, Hash, FileText, Download, Edit2, Save, Trash2, Plus, CloudUpload, CheckCircle2, MessageSquare, Ruler, Info, CalendarClock, Loader2, ExternalLink } from 'lucide-react';
import { sheetService } from '../services/mockSheetService';
import Toast, { ToastType } from './Toast';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (uploadingIndex !== null) {
        setToast({ message: "Harap tunggu proses upload selesai.", type: "error" });
        return;
    }
    setToast({ message: "Menyimpan perubahan...", type: "loading" });
    onUpdate(editedProject);
    setTimeout(() => {
         setToast({ message: "Berhasil disimpan!", type: "success" });
         setIsEditing(false);
    }, 500);
  };

  /* Document Logic with Drive Upload */
  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadingIndex(index);
        setToast({ message: `Mengupload ${file.name}...`, type: "loading" });
        try {
            const driveUrl = await sheetService.uploadFile(file);
            
            const newDocs = [...editedProject.requiredDocuments];
            newDocs[index].hasFile = true;
            newDocs[index].fileName = file.name;
            newDocs[index].url = driveUrl;
            
            setEditedProject(prev => ({...prev, requiredDocuments: newDocs}));
            setToast({ message: "Upload berhasil!", type: "success" });
        } catch (error) {
            setToast({ message: "Upload gagal. Cek koneksi.", type: "error" });
        } finally {
            setUploadingIndex(null);
        }
    }
  };

  const removeFile = (index: number) => {
    const newDocs = [...editedProject.requiredDocuments];
    newDocs[index].hasFile = false;
    newDocs[index].fileName = undefined;
    newDocs[index].url = undefined;
    setEditedProject(prev => ({...prev, requiredDocuments: newDocs}));
  };

  const addCustomDocument = () => {
     setEditedProject(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, { name: 'Dokumen Baru', hasFile: false, isCustom: true }]
     }));
  };

  const removeCustomDocumentRow = (index: number) => {
    const newDocs = [...editedProject.requiredDocuments];
    newDocs.splice(index, 1);
    setEditedProject(prev => ({...prev, requiredDocuments: newDocs}));
  };

  const handleCustomDocNameChange = (index: number, newName: string) => {
    const newDocs = [...editedProject.requiredDocuments];
    newDocs[index].name = newName;
    setEditedProject(prev => ({...prev, requiredDocuments: newDocs}));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-brand-100 text-brand-700 rounded-lg">
                    <FileText size={24} />
                 </div>
                 <div>
                    {isEditing ? (
                        <input name="name" value={editedProject.name} onChange={handleChange} className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full md:w-96" />
                    ) : (
                        <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500 font-mono">
                            <Hash size={14} />
                            {isEditing ? <input name="vendorAppointmentNumber" value={editedProject.vendorAppointmentNumber} onChange={handleChange} className="bg-white border rounded px-1 text-xs" /> : project.vendorAppointmentNumber}
                        </div>
                    </div>
                 </div>
            </div>
            <div className="flex items-center gap-3">
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Edit2 size={16} /> Edit
                    </button>
                ) : (
                    <button onClick={handleSave} disabled={uploadingIndex !== null} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm disabled:opacity-50">
                        <Save size={16} /> Save
                    </button>
                )}
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={24} /></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status & Location Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                         <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                             {isEditing ? (
                                <select name="status" value={editedProject.status} onChange={handleChange} className="mt-2 w-full p-2 border rounded-md">
                                     {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             ) : (
                                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">{project.status}</div>
                             )}
                         </div>
                         <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</label>
                            {isEditing ? <input name="location" value={editedProject.location} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" /> : <div className="mt-2 flex items-center gap-2 text-gray-900 font-medium"><MapPin size={18} className="text-gray-400" />{project.location}</div>}
                         </div>
                         <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Panjang (m)</label>
                            {isEditing ? <input type="number" name="lengthMeter" value={editedProject.lengthMeter} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" /> : <div className="mt-2 flex items-center gap-2 text-gray-900 font-medium"><Ruler size={18} className="text-gray-400" />{project.lengthMeter || 0} m</div>}
                         </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-blue-500 rounded-full block"></span> Timeline</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 border border-gray-200 rounded-xl">
                                <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                                {isEditing ? <input type="date" name="startDate" value={editedProject.startDate} onChange={handleChange} className="w-full text-sm border p-1 rounded"/> : <div className="font-semibold text-gray-900">{formatDate(project.startDate)}</div>}
                            </div>
                            <div className="p-4 border border-gray-200 rounded-xl">
                                <label className="text-xs text-gray-500 block mb-1">End Date</label>
                                {isEditing ? <input type="date" name="endDate" value={editedProject.endDate} onChange={handleChange} className="w-full text-sm border p-1 rounded"/> : <div className="font-semibold text-gray-900">{formatDate(project.endDate)}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Dokumen Project</h3>
                             {isEditing && <button onClick={addCustomDocument} className="text-xs flex items-center gap-1 text-brand-600 font-medium"><Plus size={14} /> Add Doc</button>}
                        </div>
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                            {editedProject.requiredDocuments?.map((doc, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${doc.hasFile ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-lg shrink-0 ${doc.hasFile ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-400'}`}>
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                 {isEditing && doc.isCustom ? (
                                                    <input value={doc.name} onChange={(e) => handleCustomDocNameChange(idx, e.target.value)} className="text-sm font-medium w-full border-b outline-none bg-transparent" placeholder="Nama Dokumen" />
                                                 ) : (
                                                    <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                                 )}
                                                
                                                {doc.hasFile ? (
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 truncate mt-0.5 hover:underline flex items-center gap-1">
                                                        {doc.fileName} <ExternalLink size={10} />
                                                    </a>
                                                ) : (
                                                    <p className="text-[10px] text-red-500 mt-1 italic">Belum tersedia</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 mt-1 border-t border-gray-100 pt-2">
                                        {isEditing && (
                                            <>
                                                <input type="file" id={`modal-file-${idx}`} className="hidden" onChange={(e) => handleFileUpload(idx, e)} disabled={uploadingIndex !== null} />
                                                <label htmlFor={`modal-file-${idx}`} className={`cursor-pointer text-xs flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded transition-colors ${uploadingIndex === idx ? 'opacity-50' : 'hover:text-brand-600 hover:bg-gray-200'}`}>
                                                    {uploadingIndex === idx ? <Loader2 size={12} className="animate-spin" /> : <CloudUpload size={12} />} 
                                                    {uploadingIndex === idx ? 'Uploading...' : (doc.hasFile ? 'Ganti' : 'Upload')}
                                                </label>
                                                
                                                {doc.hasFile && <button onClick={() => removeFile(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={12} /></button>}
                                                {doc.isCustom && <button onClick={() => removeCustomDocumentRow(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded ml-1"><X size={12} /></button>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
