
import React, { useState } from 'react';
import { Project, Vendor } from '../types';
import { Download, ChevronDown, FileCheck, Building2, Network, MapPin, CheckCircle2, Loader2, Database, Server } from 'lucide-react';
import { generatePDF } from '../services/exportService';

interface BASTViewProps {
  projects: Project[];
  currentUser: Vendor;
}

const BASTView: React.FC<BASTViewProps> = ({ projects, currentUser }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const today = new Date();

  const handleDownloadPDF = async () => {
    if (selectedProject) {
        setIsGenerating(true);
        setToastMessage('Sedang menyusun halaman PDF...');
        setShowToast(true);
        
        // Timeout to allow UI render
        setTimeout(async () => {
            // ID 'bast-document-area' is targeted
            const success = await generatePDF('bast-document-area', `BAST_${selectedProject.name.replace(/\s+/g, '_')}`);
            
            setIsGenerating(false);
            if (success) {
                 setToastMessage('Dokumen berhasil diunduh.');
            } else {
                 setToastMessage('Gagal. Silahkan coba lagi.');
            }
            setTimeout(() => setShowToast(false), 3000);
        }, 500);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
  };

  const getOperatorName = (id: string) => {
      return selectedProject?.operators?.find(op => op.id === id)?.name || 'Unknown';
  };

  if (projects.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <FileCheck size={48} className="mb-4 text-gray-300" />
              <p>Tidak ada data project.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 relative">
       {/* Toast */}
       {showToast && (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
            {isGenerating ? <Loader2 size={24} className="animate-spin text-blue-400" /> : <CheckCircle2 size={24} className="text-green-400" />}
            <div>
                <p className="text-sm font-bold">{isGenerating ? 'Mohon Tunggu' : 'Selesai'}</p>
                <p className="text-xs text-gray-300">{toastMessage}</p>
            </div>
         </div>
       )}

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 text-white rounded-lg">
                    <FileCheck size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">BAST & Handover</h2>
                    <p className="text-xs text-gray-500">Generate dokumen BAST resmi</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <select 
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-500 block p-2.5 pr-8"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>
                
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors shadow-sm text-sm disabled:opacity-70"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download PDF
                </button>
            </div>
       </div>

       {/* Preview Area - Background Gray */}
       <div className="flex-1 overflow-y-auto bg-gray-200 p-4 md:p-8 flex justify-center">
            {selectedProject ? (
                /* Kertas A4 Container */
                <div 
                    id="bast-document-area" 
                    className="bg-white shadow-2xl text-slate-900 mx-auto relative flex flex-col"
                    style={{
                        width: '210mm',
                        minHeight: '297mm', // A4 Height
                        padding: '20mm', // Standard Margin
                        boxSizing: 'border-box'
                    }}
                >
                    {/* --- HEADER --- */}
                    <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-6">
                        <div className="text-left">
                             {/* Space for Logo if needed later, currently text only */}
                             <h1 className="text-xl font-black text-slate-800 tracking-wider">BERITA ACARA</h1>
                             <h2 className="text-sm font-bold text-slate-600 tracking-widest">SERAH TERIMA PEKERJAAN</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-mono">
                                Ref: {selectedProject.id.toUpperCase()}/{new Date().getFullYear()}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                                Date: {today.toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* --- JUDUL TENGAH --- */}
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-bold uppercase underline underline-offset-4 decoration-2">Berita Acara Serah Terima (BAST)</h3>
                        <p className="text-xs font-medium text-slate-600 mt-1">
                            Nomor: BAST/{selectedProject.vendorAppointmentNumber.split('/')[1] || '000'}/{new Date().getMonth() + 1}/{new Date().getFullYear()}
                        </p>
                    </div>

                    {/* --- 1. INFORMASI PROJECT (Compact) --- */}
                    <div className="mb-6 break-inside-avoid">
                        <h4 className="text-xs font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 flex items-center gap-2">
                           <Building2 size={12}/> Informasi Pekerjaan
                        </h4>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="py-1 w-40 font-semibold text-slate-600 align-top">Nama Project</td>
                                    <td className="py-1 text-slate-900 align-top font-bold">: {selectedProject.name}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-slate-600 align-top">Lokasi</td>
                                    <td className="py-1 text-slate-900 align-top">: {selectedProject.location}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-slate-600 align-top">No. SPK / Penunjukkan</td>
                                    <td className="py-1 text-slate-900 align-top font-mono">: {selectedProject.vendorAppointmentNumber}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-slate-600 align-top">Vendor Pelaksana</td>
                                    <td className="py-1 text-slate-900 align-top">: {currentUser.name}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-slate-600 align-top">Periode</td>
                                    <td className="py-1 text-slate-900 align-top">: {formatDate(selectedProject.startDate)} s/d {formatDate(selectedProject.endDate)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-slate-600 align-top">Total Panjang</td>
                                    <td className="py-1 text-slate-900 align-top">: {selectedProject.lengthMeter} Meter</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* --- 2. PROGRESS FISIK --- */}
                    <div className="mb-6 break-inside-avoid">
                        <h4 className="text-xs font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 flex items-center gap-2">
                           <Network size={12}/> Laporan Fisik
                        </h4>
                        <div className="border border-slate-300">
                            <table className="w-full text-[10px]">
                                <thead className="bg-slate-200 font-bold text-center">
                                    <tr>
                                        <th className="py-1.5 border-r border-slate-300 w-8">No</th>
                                        <th className="py-1.5 border-r border-slate-300 text-left px-2">Item Pekerjaan</th>
                                        <th className="py-1.5 border-r border-slate-300 w-16">Satuan</th>
                                        <th className="py-1.5 border-r border-slate-300 w-16">Vol. Plan</th>
                                        <th className="py-1.5 border-r border-slate-300 w-16">Vol. Actual</th>
                                        <th className="py-1.5 w-16">Achiev (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProject.workItems && selectedProject.workItems.length > 0 ? (
                                        selectedProject.workItems.map((item, idx) => {
                                            const pct = item.planQty > 0 ? (item.actualQty / item.planQty) * 100 : 0;
                                            return (
                                                <tr key={idx} className="border-t border-slate-200">
                                                    <td className="py-1.5 text-center border-r border-slate-200">{idx + 1}</td>
                                                    <td className="py-1.5 px-2 border-r border-slate-200">{item.name}</td>
                                                    <td className="py-1.5 text-center border-r border-slate-200">{item.unit}</td>
                                                    <td className="py-1.5 text-center border-r border-slate-200">{item.planQty}</td>
                                                    <td className="py-1.5 text-center border-r border-slate-200">{item.actualQty}</td>
                                                    <td className="py-1.5 text-center font-bold">{pct.toFixed(0)}%</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan={6} className="py-4 text-center italic text-gray-500">Data Kosong</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                                    <tr>
                                        <td colSpan={5} className="py-1.5 px-2 text-right">Total Progress:</td>
                                        <td className="py-1.5 text-center">{selectedProject.progress}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* --- 3. DATA AKHIR (FINAL DATA) --- */}
                    <div className="mb-6 break-inside-avoid">
                        <h4 className="text-xs font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 flex items-center gap-2">
                           <Database size={12}/> Data Akhir (Final Data)
                        </h4>
                        
                        {/* 3.1 Tabel Kabel */}
                        <div className="mb-3">
                            <h5 className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1 ml-1">
                                <Server size={10} /> 3.1 Daftar Kabel & Panjang
                            </h5>
                            <div className="border border-slate-300">
                                <table className="w-full text-[9px]">
                                    <thead className="bg-slate-200 font-bold text-center">
                                        <tr>
                                            <th className="py-1.5 border-r border-slate-300 w-10">No</th>
                                            <th className="py-1.5 border-r border-slate-300 text-left px-2">Operator (Tenant)</th>
                                            <th className="py-1.5 border-r border-slate-300 w-24">Jenis Kabel</th>
                                            <th className="py-1.5 w-24">Panjang (m)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.operators && selectedProject.operators.length > 0 ? (
                                            selectedProject.operators.map((op, idx) => (
                                                <tr key={idx} className="border-t border-slate-200">
                                                    <td className="py-1 text-center border-r border-slate-200">{idx + 1}</td>
                                                    <td className="py-1 px-2 border-r border-slate-200 font-bold">{op.name}</td>
                                                    <td className="py-1 text-center border-r border-slate-200">{op.cableType || '-'}</td>
                                                    <td className="py-1 text-center font-mono">{op.participationLength} m</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="py-2 text-center italic text-gray-400">Belum ada data kabel operator.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3.2 Tabel Handhole */}
                        <div>
                            <h5 className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1 ml-1">
                                <Database size={10} /> 3.2 Daftar Handhole & Okupansi
                            </h5>
                            <div className="border border-slate-300">
                                <table className="w-full text-[9px]">
                                    <thead className="bg-slate-200 font-bold text-center">
                                        <tr>
                                            <th className="py-1.5 border-r border-slate-300 w-10">No</th>
                                            <th className="py-1.5 border-r border-slate-300 w-32">Nama Handhole</th>
                                            <th className="py-1.5 text-left px-2">Okupansi (Daftar Operator)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.handholeAssignments && selectedProject.handholeAssignments.length > 0 ? (
                                            selectedProject.handholeAssignments.map((hh, idx) => {
                                                const occupants = hh.operatorIds
                                                    .map(id => getOperatorName(id))
                                                    .join(', ');

                                                return (
                                                    <tr key={idx} className="border-t border-slate-200">
                                                        <td className="py-1 text-center border-r border-slate-200">{idx + 1}</td>
                                                        <td className="py-1 text-center border-r border-slate-200 font-mono font-bold">{hh.name}</td>
                                                        <td className="py-1 px-2">{occupants || <span className="text-gray-400 italic">Kosong</span>}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan={3} className="py-2 text-center italic text-gray-400">Belum ada konfigurasi Handhole.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* --- 4. CHECKLIST DOKUMEN --- */}
                    <div className="mb-8 break-inside-avoid">
                        <h4 className="text-xs font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 flex items-center gap-2">
                           <FileCheck size={12}/> Kelengkapan Dokumen
                        </h4>
                        <div className="border border-slate-300 p-3">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                {selectedProject.requiredDocuments && selectedProject.requiredDocuments.length > 0 ? (
                                    selectedProject.requiredDocuments.map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-[10px]">
                                            <div className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center ${doc.hasFile ? 'bg-slate-800 border-slate-800' : 'bg-white'}`}>
                                                {doc.hasFile && <span className="text-white text-[9px] font-bold">✓</span>}
                                            </div>
                                            <span className="uppercase font-medium text-slate-700">{doc.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-xs italic text-gray-400">Tidak ada dokumen.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- 5. TANDA TANGAN (Compact & Bottom) --- */}
                    <div className="mt-auto break-inside-avoid pt-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {/* Vendor */}
                            <div className="flex flex-col items-center">
                                <p className="text-xs mb-1 font-medium text-slate-700">
                                    Jakarta, {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] font-bold uppercase mb-1">Diserahkan Oleh,</p>
                                <p className="text-[9px] text-gray-500 mb-12">Pihak Vendor Pelaksana</p>
                                <p className="font-bold text-xs uppercase underline underline-offset-2">{currentUser.name}</p>
                            </div>

                             {/* Koordinator Daerah */}
                             <div className="flex flex-col items-center">
                                <div className="h-5 mb-1"></div> {/* Spacer for alignment */}
                                <p className="text-[10px] font-bold uppercase mb-1">Diterima Oleh,</p>
                                <p className="text-[9px] text-gray-500 mb-12">Koordinator Daerah</p>
                                <p className="font-bold text-xs uppercase underline underline-offset-2">( ....................................... )</p>
                            </div>

                            {/* Koordinator Wilayah */}
                            <div className="flex flex-col items-center">
                                <div className="h-5 mb-1"></div> {/* Spacer for alignment */}
                                <p className="text-[10px] font-bold uppercase mb-1">Mengetahui,</p>
                                <p className="text-[9px] text-gray-500 mb-12">Koordinator Wilayah</p>
                                <p className="font-bold text-xs uppercase underline underline-offset-2">( ....................................... )</p>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 italic">
                    Pilih project untuk preview.
                </div>
            )}
       </div>
    </div>
  );
};

export default BASTView;
