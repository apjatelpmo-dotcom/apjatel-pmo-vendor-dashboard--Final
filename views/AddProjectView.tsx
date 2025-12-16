
import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectDocumentStatus, ProjectCategory, Vendor } from '../types';
import { Save, X, FileText, Upload, Trash2, CloudUpload, CheckCircle2, Plus, Loader2, Users } from 'lucide-react';
import { sheetService } from '../services/mockSheetService';

interface AddProjectViewProps {
  currentUser: Vendor;
  vendors: Vendor[];
  onSave: (project: Project) => void;
  onCancel: () => void;
}

const REQUIRED_DOCS_LIST = [
    'Surat Perintah Relokasi',
    'Surat Penunjukkan Vendor (SPK)',
    'Berita Acara Survey Dinas',
    'Price List Apjatel',
    'KMZ',
    'APD'
];

const AddProjectView: React.FC<AddProjectViewProps> = ({ currentUser, vendors, onSave, onCancel }) => {
  const isAdmin = currentUser.id === 'admin';
  
  const [formData, setFormData] = useState<Partial<Project>>({
    vendorAppointmentNumber: '',
    name: '',
    location: '',
    status: ProjectStatus.PLANNING,
    category: ProjectCategory.RELOCATION,
    startDate: '',
    endDate: '', 
    remarks: '', 
    description: '',
    lengthMeter: 0,
    initiator: '',
    relocationReason: ''
  });

  // If admin, default to first vendor or empty
  const [selectedVendorId, setSelectedVendorId] = useState<string>(isAdmin ? (vendors[0]?.id || '') : currentUser.id);

  const [docsStatus, setDocsStatus] = useState<ProjectDocumentStatus[]>(
    REQUIRED_DOCS_LIST.map(name => ({ name, hasFile: false, isCustom: false }))
  );
  
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadingIndex(index);
        try {
            // Upload to Drive
            const driveUrl = await sheetService.uploadFile(file);
            
            const newDocs = [...docsStatus];
            newDocs[index].hasFile = true;
            newDocs[index].fileName = file.name;
            newDocs[index].url = driveUrl; // Save URL
            setDocsStatus(newDocs);
        } catch (error) {
            alert("Gagal mengupload file. Silakan coba lagi.");
        } finally {
            setUploadingIndex(null);
        }
    }
  };

  const removeFile = (index: number) => {
    const newDocs = [...docsStatus];
    newDocs[index].hasFile = false;
    newDocs[index].fileName = undefined;
    newDocs[index].url = undefined;
    setDocsStatus(newDocs);
    const fileInput = document.getElementById(`file-upload-${index}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const addCustomDocument = () => {
    setDocsStatus([
        ...docsStatus,
        { name: 'Dokumen Tambahan', hasFile: false, isCustom: true }
    ]);
  };

  const removeCustomDocumentRow = (index: number) => {
    const newDocs = [...docsStatus];
    newDocs.splice(index, 1);
    setDocsStatus(newDocs);
  };

  const handleCustomDocNameChange = (index: number, newName: string) => {
    const newDocs = [...docsStatus];
    newDocs[index].name = newName;
    setDocsStatus(newDocs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingIndex !== null) {
        alert("Harap tunggu hingga proses upload selesai.");
        return;
    }

    if (isAdmin && !selectedVendorId) {
        alert("Silakan pilih Vendor Pelaksana.");
        return;
    }

    const newProject: Project = {
        id: `p${Math.floor(Math.random() * 10000)}`,
        vendorId: selectedVendorId, // Use selected ID
        vendorAppointmentNumber: formData.vendorAppointmentNumber!,
        name: formData.name!,
        location: formData.location!,
        status: formData.status as ProjectStatus,
        progress: 0, 
        budget: 0, 
        spent: 0, 
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        remarks: formData.remarks!,
        description: formData.description!,
        lengthMeter: Number(formData.lengthMeter) || 0,
        initiator: formData.initiator || '',
        relocationReason: formData.relocationReason || '',
        category: formData.category as ProjectCategory,
        progressMeter: 0,
        requiredDocuments: docsStatus,
        workItems: [],
        operators: [],
        photos: []
    };
    onSave(newProject);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Registrasi Project Baru</h2>
                <p className="text-sm text-gray-500 mt-1">Isi formulir di bawah ini untuk mendaftarkan pekerjaan baru.</p>
            </div>
            <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Info & Timeline sections same as before (omitted for brevity, assume present) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-brand-500 rounded-full block"></span> Informasi Umum
                </h3>
                
                {/* Admin Vendor Selection */}
                {isAdmin && (
                    <div className="mb-6 bg-brand-50 p-4 rounded-xl border border-brand-100">
                        <label className="block text-xs font-bold text-brand-700 uppercase mb-2 flex items-center gap-2">
                            <Users size={14} /> Pilih Vendor Pelaksana
                        </label>
                        <select 
                            value={selectedVendorId} 
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-medium text-gray-800"
                        >
                            <option value="">-- Pilih Vendor --</option>
                            {vendors.filter(v => v.id !== 'admin').map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-brand-600 mt-1">Project ini akan didaftarkan atas nama vendor yang dipilih.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. Penunjukkan Vendor (SPK)</label>
                        <input required name="vendorAppointmentNumber" type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Awal</label>
                        <select name="status" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} value={formData.status}>
                            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Project</label>
                        <input required name="name" type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Inisiator</label>
                        <input required name="initiator" type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                        <input required name="location" type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                         <label className="block text-sm font-medium text-gray-700 mb-2">Panjang (m)</label>
                         <input required name="lengthMeter" type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                         <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                         <select name="category" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} value={formData.category}>
                            {Object.values(ProjectCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full block"></span> Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input required name="startDate" type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input required name="endDate" type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" onChange={handleChange} />
                    </div>
                </div>
            </div>

            {/* Document Repository */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full block"></span>
                        Dokumen Pendukung
                    </h3>
                    <button type="button" onClick={addCustomDocument} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200">
                        <Plus size={14} /> Tambah Dokumen Lain
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docsStatus.map((doc, idx) => (
                        <div key={idx} className="relative group">
                            <input type="file" id={`file-upload-${idx}`} className="hidden" onChange={(e) => handleFileUpload(idx, e)} disabled={uploadingIndex !== null} />

                            <div className="h-full flex flex-col border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all">
                                {doc.isCustom && (
                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                                        <input type="text" value={doc.name} onChange={(e) => handleCustomDocNameChange(idx, e.target.value)} placeholder="Nama Dokumen" className="w-full bg-transparent text-sm font-medium text-gray-700 focus:outline-none border-b border-transparent focus:border-brand-500 placeholder-gray-400" />
                                    </div>
                                )}

                                {doc.hasFile ? (
                                    <div className="flex items-center justify-between p-4 bg-brand-50 h-full">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white text-brand-600 rounded-lg shadow-sm border border-brand-100 shrink-0">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-brand-900 truncate">{doc.name}</p>
                                                <p className="text-xs text-brand-600 truncate flex items-center gap-1"><FileText size={10} /> {doc.fileName}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col relative">
                                        {doc.isCustom && <button type="button" onClick={() => removeCustomDocumentRow(idx)} className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 rounded-full z-10"><X size={14} /></button>}
                                        <label htmlFor={`file-upload-${idx}`} className={`flex-1 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${uploadingIndex === idx ? 'opacity-50 cursor-wait' : ''}`}>
                                            {uploadingIndex === idx ? (
                                                <div className="flex flex-col items-center text-brand-600">
                                                    <Loader2 size={24} className="animate-spin mb-2" />
                                                    <span className="text-xs font-medium">Uploading to Drive...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-2 bg-gray-100 rounded-full text-gray-400 mb-2 group-hover:bg-white group-hover:text-brand-500 transition-colors"><CloudUpload size={20} /></div>
                                                    {!doc.isCustom && <span className="text-sm font-medium text-gray-700 text-center">{doc.name}</span>}
                                                    <span className="text-[10px] text-gray-400 mt-1">Klik untuk upload</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
                <button type="submit" disabled={uploadingIndex !== null} className="flex items-center gap-2 px-8 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50">
                    <Save size={18} /> Simpan Project
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddProjectView;
