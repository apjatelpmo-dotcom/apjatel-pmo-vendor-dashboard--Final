
import React, { useState, useEffect } from 'react';
import { Project, WorkItem } from '../types';
import { X, Save, Plus, Trash2, Camera, Loader2 } from 'lucide-react';
import { sheetService } from '../services/mockSheetService';

interface WorkItemModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
}

const WorkItemModal: React.FC<WorkItemModalProps> = ({ project, onClose, onUpdate }) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [description, setDescription] = useState(project.description || '');
  const [uploadingState, setUploadingState] = useState<{itemIdx: number, isUploading: boolean}>({itemIdx: -1, isUploading: false});

  useEffect(() => {
    if (project.workItems && project.workItems.length > 0) {
        setItems(JSON.parse(JSON.stringify(project.workItems)));
    } else {
        setItems([{
            id: `w_${Date.now()}`,
            name: '',
            weight: 0,
            unit: 'm',
            planQty: 0,
            actualQty: 0,
            photos: [],
            remarks: ''
        }]);
    }
  }, [project]);

  const calculatedProjectProgress = items.length > 0 
    ? items.reduce((sum, item) => {
        if (!item.planQty || item.planQty === 0) return sum;
        const itemProgressPct = Math.min(100, (item.actualQty / item.planQty) * 100);
        return sum + itemProgressPct;
      }, 0) / items.length
    : 0;

  const handleAddItem = () => {
    setItems([...items, {
        id: `w_${Date.now()}`,
        name: '',
        weight: 0,
        unit: 'm',
        planQty: 0,
        actualQty: 0,
        photos: [],
        remarks: ''
    }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChange = (index: number, field: keyof WorkItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadingState({ itemIdx: index, isUploading: true });
        try {
            const photoUrl = await sheetService.uploadFile(file);
            const newItems = [...items];
            newItems[index].photos.push(photoUrl);
            setItems(newItems);
        } catch (error) {
            alert("Gagal mengupload foto.");
        } finally {
            setUploadingState({ itemIdx: -1, isUploading: false });
        }
    }
  };

  const removePhoto = (itemIndex: number, photoUrl: string) => {
      const newItems = [...items];
      newItems[itemIndex].photos = newItems[itemIndex].photos.filter(p => p !== photoUrl);
      setItems(newItems);
  };

  const handleSave = () => {
    if (uploadingState.isUploading) {
        alert("Tunggu proses upload selesai.");
        return;
    }
    const updatedProject: Project = {
        ...project,
        description: description,
        workItems: items,
        progress: parseFloat(calculatedProjectProgress.toFixed(1))
    };
    onUpdate(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Update Progress Pekerjaan</h2>
                    <p className="text-sm text-gray-500">{project.name}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex gap-6">
                        <div>
                            <span className="text-sm text-gray-500">Total Item</span>
                            <div className="text-xl font-bold text-gray-700">{items.length}</div>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Total Progress</span>
                            <div className="text-xl font-bold text-brand-600">{calculatedProjectProgress.toFixed(2)}%</div>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">#</th>
                                <th className="px-4 py-3 min-w-[200px]">Item Pekerjaan</th>
                                <th className="px-4 py-3 w-20 text-center">Satuan</th>
                                <th className="px-4 py-3 w-28 text-center">Plan</th>
                                <th className="px-4 py-3 w-28 text-center">Actual</th>
                                <th className="px-4 py-3 w-24 text-center">Progress</th>
                                <th className="px-4 py-3 w-32 text-center">Foto</th>
                                <th className="px-4 py-3 min-w-[150px]">Keterangan</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.map((item, idx) => {
                                const itemProgress = item.planQty > 0 ? (item.actualQty / item.planQty) * 100 : 0;
                                const isThisUploading = uploadingState.itemIdx === idx && uploadingState.isUploading;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-2"><input type="text" className="w-full border-gray-300 rounded text-sm" value={item.name} onChange={(e) => handleChange(idx, 'name', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="text" className="w-full text-center border-gray-300 rounded text-sm" value={item.unit} onChange={(e) => handleChange(idx, 'unit', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-full text-center border-gray-300 rounded text-sm" value={item.planQty} onChange={(e) => handleChange(idx, 'planQty', parseFloat(e.target.value))} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-full text-center border-gray-300 rounded text-sm font-semibold text-gray-900" value={item.actualQty} onChange={(e) => handleChange(idx, 'actualQty', parseFloat(e.target.value))} /></td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="text-xs font-semibold text-gray-700">{itemProgress.toFixed(0)}%</div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {item.photos.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 justify-center mb-1">
                                                        {item.photos.map((url, pIdx) => (
                                                            <div key={pIdx} className="relative group">
                                                                <a href={url} target="_blank" rel="noreferrer" className="block w-6 h-6 bg-gray-200 rounded overflow-hidden border">
                                                                    <img src={url} alt="work" className="w-full h-full object-cover" />
                                                                </a>
                                                                <button onClick={() => removePhoto(idx, url)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={8}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {isThisUploading ? (
                                                    <Loader2 size={16} className="animate-spin text-brand-600" />
                                                ) : (
                                                    <label className="cursor-pointer text-brand-600 hover:text-brand-700">
                                                        <Camera size={18} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(idx, e)} />
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                         <td className="px-4 py-2"><input type="text" className="w-full border-gray-300 rounded text-xs" value={item.remarks || ''} onChange={(e) => handleChange(idx, 'remarks', e.target.value)} /></td>
                                        <td className="px-4 py-2 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button onClick={handleAddItem} className="w-full py-4 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center gap-2 border-t border-gray-200">
                        <Plus size={18} /> Tambah Item Pekerjaan Baru
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Umum</label>
                    <textarea className="w-full border-gray-300 rounded-lg p-3 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={uploadingState.isUploading} className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 text-sm disabled:opacity-50">
                    <Save size={16} /> Simpan Update
                </button>
            </div>
        </div>
    </div>
  );
};

export default WorkItemModal;
