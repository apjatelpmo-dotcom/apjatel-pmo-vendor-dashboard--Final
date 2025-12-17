
import React, { useState } from 'react';
import { Project, ProjectOperator, FOCableType, HandholeAssignment, ABDFile, MaterialStatus, WorkStatus } from '../types';
import { Save, Plus, Trash2, MapPin, Ruler, Server, Database, CloudUpload, FileCheck, CheckSquare, Square, FileText, X, Loader2, ExternalLink } from 'lucide-react';
import { exportToCSV } from '../services/exportService';
import { sheetService } from '../services/mockSheetService';

interface FinalDataReportProps {
    project: Project;
    onUpdate: (updatedProject: Project) => void;
}

const CABLE_TYPES: FOCableType[] = ['FO 288', 'FO 144', 'FO 96', 'FO 48', 'FO 24', 'Cable Coaxial', '-'];

const FinalDataReport: React.FC<FinalDataReportProps> = ({ project, onUpdate }) => {
    const [localHandholes, setLocalHandholes] = useState<HandholeAssignment[]>(project.handholeAssignments || []);
    const [isUploading, setIsUploading] = useState(false);

    const handleOperatorChange = (operatorId: string, field: keyof ProjectOperator, value: any) => {
        const updatedOperators = project.operators.map(op => op.id === operatorId ? { ...op, [field]: value } : op);
        onUpdate({ ...project, operators: updatedOperators });
    };

    // Handhole Logic
    const handleAddHandhole = () => {
        const nextNum = localHandholes.length + 1;
        setLocalHandholes([...localHandholes, { id: `hh_${Date.now()}`, name: `HH-${nextNum.toString().padStart(2, '0')}`, operatorIds: [] }]);
    };

    const handleHandholeNameChange = (idx: number, name: string) => {
        const newHHs = [...localHandholes];
        newHHs[idx].name = name;
        setLocalHandholes(newHHs);
    };

    const handleToggleOperatorInHH = (hhIndex: number, opId: string) => {
        const newHHs = [...localHandholes];
        const hh = newHHs[hhIndex];
        if (hh.operatorIds.includes(opId)) {
            hh.operatorIds = hh.operatorIds.filter(id => id !== opId);
        } else {
            hh.operatorIds.push(opId);
        }
        setLocalHandholes(newHHs);
    };

    const handleDeleteHandhole = (index: number) => {
        const newHHs = [...localHandholes];
        newHHs.splice(index, 1);
        setLocalHandholes(newHHs);
    };

    const handleSaveHandholes = () => {
        onUpdate({ ...project, handholeAssignments: localHandholes });
        alert('Data Handhole berhasil disimpan!');
    };

    // ABD Upload Logic with Drive
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const driveUrl = await sheetService.uploadFile(file);
                const newFile: ABDFile = {
                    id: `abd_${Date.now()}`,
                    name: file.name,
                    uploadDate: new Date().toISOString(),
                    url: driveUrl
                };
                const currentFiles = project.abdFiles || [];
                onUpdate({ ...project, abdFiles: [...currentFiles, newFile] });
            } catch (err) {
                alert("Gagal upload file ABD.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleDeleteFile = (id: string) => {
        const currentFiles = project.abdFiles || [];
        onUpdate({ ...project, abdFiles: currentFiles.filter(f => f.id !== id) });
    };

    const handleExportFinalData = () => {
         const cableData = project.operators.map(op => ({
             Operator: op.name,
             Panjang_Main_Route: op.participationLength,
             CableType: op.cableType || '-',
         }));
         exportToCSV(cableData, `FinalData_Cable_${project.name}`);
    };

    return (
        <div className="space-y-8 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">Data Akhir (Final Report)</h3>
                    <p className="text-sm text-gray-500">{project.name} - {project.location}</p>
                 </div>
                 <button onClick={handleExportFinalData} className="text-xs text-brand-600 hover:underline font-medium flex items-center gap-1">
                     <FileText size={14}/> Download CSV
                 </button>
            </div>

            {/* --- SECTION 1: CABLE DATA --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Server size={18} className="text-blue-600"/>
                    <h4 className="font-bold text-gray-800 text-sm uppercase">1. Daftar Kabel & Panjang</h4>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-10">#</th>
                                <th className="px-6 py-3">Nama Operator</th>
                                <th className="px-6 py-3">Jenis Kabel</th>
                                <th className="px-6 py-3">Panjang (m)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(!project.operators || project.operators.length === 0) ? (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-400 italic">Belum ada operator terdaftar.</td></tr>
                            ) : (
                                project.operators.map((op, idx) => (
                                    <tr key={op.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-center">{idx + 1}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{op.name}</td>
                                        <td className="px-6 py-3">
                                            <select 
                                                value={op.cableType || '-'}
                                                onChange={(e) => handleOperatorChange(op.id, 'cableType', e.target.value)}
                                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                            >
                                                {CABLE_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-3 font-mono">
                                            {op.participationLength} m
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- SECTION 2: HANDHOLE ASSIGNMENT --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database size={18} className="text-orange-600"/>
                        <h4 className="font-bold text-gray-800 text-sm uppercase">2. Handhole Assignment</h4>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddHandhole} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <Plus size={14} /> Add Handhole
                        </button>
                        <button onClick={handleSaveHandholes} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors">
                            <Save size={14} /> Save HH
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {localHandholes.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="italic">Belum ada handhole. Klik "Add Handhole" untuk memulai.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localHandholes.map((hh, idx) => (
                                <div key={hh.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-brand-200 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white border border-gray-200 rounded text-gray-500">
                                                <Database size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={hh.name}
                                                onChange={(e) => handleHandholeNameChange(idx, e.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none font-bold text-gray-800 text-sm w-32"
                                            />
                                        </div>
                                        <button onClick={() => handleDeleteHandhole(idx)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Occupants:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {project.operators.map(op => {
                                                const isSelected = hh.operatorIds.includes(op.id);
                                                return (
                                                    <button 
                                                        key={op.id}
                                                        onClick={() => handleToggleOperatorInHH(idx, op.id)}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border transition-all ${isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                                                        {op.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- SECTION 3: ABD UPLOAD --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <CloudUpload size={18} className="text-purple-600"/>
                    <h4 className="font-bold text-gray-800 text-sm uppercase">3. Upload As Built Drawing (ABD)</h4>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {isUploading ? <Loader2 className="animate-spin text-brand-600" size={32} /> : <CloudUpload className="w-8 h-8 mb-3 text-gray-400" />}
                                    <p className="mb-2 text-sm text-gray-500">{isUploading ? 'Uploading...' : 'Click to upload ABD File'}</p>
                                    <p className="text-xs text-gray-500">PDF, CAD, or Image</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        </div>

                        <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-500 uppercase">Uploaded Files</h5>
                            {!project.abdFiles || project.abdFiles.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Belum ada file ABD diupload.</p>
                            ) : (
                                project.abdFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded">
                                                <FileCheck size={18} />
                                            </div>
                                            <div>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:underline truncate max-w-[150px] flex items-center gap-1">
                                                    {file.name} <ExternalLink size={10} />
                                                </a>
                                                <p className="text-[10px] text-gray-500">{new Date(file.uploadDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteFile(file.id)} className="text-gray-400 hover:text-red-500 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalDataReport;
