
import React, { useState, useEffect } from 'react';
import { Project, ProjectOperator, MaterialStatus, WorkStatus, OperatorCustomItem, JointSurveyStatus } from '../types';
import { X, Save, Building2, Ruler, Box, Cable, Zap, FileText, Activity, Plus, Trash2, List, ClipboardCheck, Calendar, Clock } from 'lucide-react';

interface OperatorDetailModalProps {
  project: Project;
  operator?: ProjectOperator | null; // If null, adding new
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

// Local interface for UI state handling
interface UIListItem {
    id: string;
    label: string;
    value: number;
    unit: string;
    isCustom: boolean; // false = maps to legacy fixed fields, true = maps to customItems
    fixedKey?: keyof ProjectOperator; // To map back to specific fields like participationLength
}

const OperatorDetailModal: React.FC<OperatorDetailModalProps> = ({ project, operator, onClose, onSave }) => {
  // 1. Basic Operator Identity
  const [operatorName, setOperatorName] = useState(operator?.name || '');
  
  // 2. Status Fields
  const [statuses, setStatuses] = useState({
      statusMaterial: operator?.statusMaterial || MaterialStatus.NOT_YET,
      statusPulling: operator?.statusPulling || WorkStatus.NOT_STARTED,
      statusCutOver: operator?.statusCutOver || WorkStatus.NOT_STARTED,
  });

  // 3. Remarks
  const [remarks, setRemarks] = useState(operator?.remarks || '');

  // 4. Joint Survey
  const [jointSurvey, setJointSurvey] = useState({
    date: operator?.jointSurveyDate || '',
    deadline: operator?.jointSurveyDeadline || '', // NEW FIELD
    status: operator?.jointSurveyStatus || JointSurveyStatus.PENDING,
    remarks: operator?.jointSurveyRemarks || ''
  });

  // 5. Dynamic List State
  const [listItems, setListItems] = useState<UIListItem[]>([]);

  useEffect(() => {
    // Initialize List Items from Operator Data
    const initialItems: UIListItem[] = [];

    // Standard Fields Mapping
    initialItems.push({ id: 'std_1', label: 'Panjang Keterlibatan', value: operator?.participationLength || 0, unit: 'm', isCustom: false, fixedKey: 'participationLength' });
    initialItems.push({ id: 'std_2', label: 'Jalur Akses', value: operator?.accessLength || 0, unit: 'm', isCustom: false, fixedKey: 'accessLength' });
    initialItems.push({ id: 'std_3', label: 'Jalur Crossing', value: operator?.crossingLength || 0, unit: 'm', isCustom: false, fixedKey: 'crossingLength' });
    initialItems.push({ id: 'std_4', label: 'Handhole Bersama', value: operator?.hhSharedQty || 0, unit: 'Unit', isCustom: false, fixedKey: 'hhSharedQty' });
    initialItems.push({ id: 'std_5', label: 'Handhole Pribadi', value: operator?.hhPrivateQty || 0, unit: 'Unit', isCustom: false, fixedKey: 'hhPrivateQty' });

    // Custom Items Mapping
    if (operator?.customItems && operator.customItems.length > 0) {
        operator.customItems.forEach(ci => {
            initialItems.push({
                id: ci.id,
                label: ci.label,
                value: ci.value,
                unit: ci.unit,
                isCustom: true
            });
        });
    }

    setListItems(initialItems);
  }, [operator]);

  // Handlers for List
  const handleItemChange = (index: number, field: keyof UIListItem, newValue: any) => {
      const updatedList = [...listItems];
      updatedList[index] = { ...updatedList[index], [field]: newValue };
      setListItems(updatedList);
  };

  const handleAddItem = () => {
      setListItems([
          ...listItems,
          { id: `custom_${Date.now()}`, label: '', value: 0, unit: '', isCustom: true }
      ]);
  };

  const handleRemoveItem = (index: number) => {
      const updatedList = [...listItems];
      updatedList.splice(index, 1);
      setListItems(updatedList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the object back
    const newOperatorData: any = {
        id: operator?.id || `op_${Date.now()}`,
        name: operatorName,
        statusMaterial: statuses.statusMaterial,
        statusPulling: statuses.statusPulling,
        statusCutOver: statuses.statusCutOver,
        remarks: remarks,
        
        // Survey
        jointSurveyDate: jointSurvey.date,
        jointSurveyDeadline: jointSurvey.deadline, // Save Deadline
        jointSurveyStatus: jointSurvey.status,
        jointSurveyRemarks: jointSurvey.remarks,

        customItems: []
    };

    // Distribute List Items back to Fixed fields or Custom Array
    listItems.forEach(item => {
        if (!item.isCustom && item.fixedKey) {
            newOperatorData[item.fixedKey] = Number(item.value);
        } else {
            // It's a custom item or a standard item that was somehow unmapped (fallback to custom)
            if(item.label.trim() !== '') {
                 newOperatorData.customItems.push({
                    id: item.id,
                    label: item.label,
                    value: Number(item.value),
                    unit: item.unit
                });
            }
        }
    });

    // Clone project to update
    const updatedProject = { ...project };
    if (!updatedProject.operators) updatedProject.operators = [];

    if (operator) {
        // Edit existing
        updatedProject.operators = updatedProject.operators.map(op => 
            op.id === newOperatorData.id ? (newOperatorData as ProjectOperator) : op
        );
    } else {
        // Add new
        updatedProject.operators = [...updatedProject.operators, (newOperatorData as ProjectOperator)];
    }

    onSave(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{operator ? 'Update Data Operator' : 'Tambah Operator Baru'}</h3>
                    <p className="text-sm text-gray-500">{project.name}</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto p-8 bg-gray-50/50">
                <form id="operatorForm" onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Section 1: Operator Identity */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-brand-500" />
                            Informasi Operator
                        </h4>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nama Tenant / Operator</label>
                            <input 
                                required
                                value={operatorName}
                                onChange={(e) => setOperatorName(e.target.value)}
                                placeholder="Contoh: Telkomsel, IOH, XL"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Section 2: Technical Items List */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                             <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <List size={18} className="text-blue-500" />
                                Item Pekerjaan & Dimensi
                            </h4>
                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                            >
                                <Plus size={14} /> Item Baru
                            </button>
                        </div>
                       
                        <div className="space-y-3">
                            {listItems.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Belum ada item pekerjaan.</p>}
                            {listItems.map((item, index) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                                    <div className="flex-1 w-full">
                                        <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Item Pekerjaan</label>
                                        <input 
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                                            placeholder="Nama Item (e.g. Panjang Kabel)"
                                            className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded text-sm focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="w-full sm:w-32">
                                         <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Volume / Qty</label>
                                         <input 
                                            type="number"
                                            value={item.value}
                                            onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                                            className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded text-sm focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="w-full sm:w-24">
                                         <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Satuan</label>
                                         <input 
                                            type="text"
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                            className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded text-sm focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    {item.isCustom ? (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveItem(index)}
                                            className="mt-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        // Placeholder for alignment
                                        <div className="w-8 h-8 mt-4"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Joint Survey Info */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ClipboardCheck size={18} className="text-purple-500" />
                            Jadwal & Status Joint Survey
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400"/> Tanggal Survey
                                </label>
                                <input 
                                    type="date"
                                    value={jointSurvey.date}
                                    onChange={(e) => setJointSurvey({...jointSurvey, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                    <Clock size={14} className="text-red-400"/> Deadline Survey (Batas)
                                </label>
                                <input 
                                    type="date"
                                    value={jointSurvey.deadline}
                                    onChange={(e) => setJointSurvey({...jointSurvey, deadline: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 border-l-4 border-l-red-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status Survey</label>
                                <select 
                                    value={jointSurvey.status} 
                                    onChange={(e) => setJointSurvey({...jointSurvey, status: e.target.value as JointSurveyStatus})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                >
                                    {Object.values(JointSurveyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Catatan Survey</label>
                                <input 
                                    type="text"
                                    value={jointSurvey.remarks}
                                    onChange={(e) => setJointSurvey({...jointSurvey, remarks: e.target.value})}
                                    placeholder="Hasil kesepakatan survey..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Statuses */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-green-500" />
                            Status Pekerjaan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                    <Box size={14} className="text-orange-500"/> Status Material
                                </label>
                                <select 
                                    value={statuses.statusMaterial} 
                                    onChange={(e) => setStatuses({...statuses, statusMaterial: e.target.value as MaterialStatus})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                >
                                    {Object.values(MaterialStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                    <Cable size={14} className="text-blue-500"/> Status Pulling
                                </label>
                                <select 
                                    value={statuses.statusPulling} 
                                    onChange={(e) => setStatuses({...statuses, statusPulling: e.target.value as WorkStatus})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                >
                                    {Object.values(WorkStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                    <Zap size={14} className="text-yellow-500"/> Status Cut Over
                                </label>
                                <select 
                                    value={statuses.statusCutOver} 
                                    onChange={(e) => setStatuses({...statuses, statusCutOver: e.target.value as WorkStatus})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                >
                                    {Object.values(WorkStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Remarks */}
                     <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-gray-500" />
                            Catatan Keterlibatan (Remarks)
                        </h4>
                        <textarea 
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Specific notes related to their involvement..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                        />
                    </div>
                </form>
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Batal</button>
                <button form="operatorForm" type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-transform transform hover:-translate-y-0.5">
                    <Save size={18} /> Simpan Data
                </button>
            </div>
        </div>
    </div>
  );
};

export default OperatorDetailModal;
