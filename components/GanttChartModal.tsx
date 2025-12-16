
import React, { useState, useEffect } from 'react';
import { Project, ScheduleItem } from '../types';
import { X, Save, Edit2, Plus, Trash2, CalendarDays, ArrowRight, User, AlertTriangle, Calendar, CalendarClock, Timer, Link2, Download, Printer } from 'lucide-react';
import { exportToCSV, printComponent } from '../services/exportService';

interface GanttChartModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
}

const GanttChartModal: React.FC<GanttChartModalProps> = ({ project, onClose, onUpdate }) => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(project.scheduleItems || []);
  const [isEditing, setIsEditing] = useState(false);
  const [timelineStart, setTimelineStart] = useState(new Date(project.startDate));

  // Form State for new item
  const [newItem, setNewItem] = useState<{
      description: string;
      startWeek: number;
      durationWeeks: number;
      pic: string;
  }>({
      description: '',
      startWeek: 1,
      durationWeeks: 1,
      pic: ''
  });

  // --- Project Constraint Logic ---
  const startDate = new Date(project.startDate);
  const cutOffDate = project.cutOffDate ? new Date(project.cutOffDate) : null;
  const today = new Date();
  
  // Normalize today for comparison
  today.setHours(0,0,0,0);

  const durationDays = cutOffDate 
    ? Math.ceil((cutOffDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const isOverdue = cutOffDate && today > cutOffDate && project.progress < 100;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
  };
  // --------------------------------

  // Determine Timeline Duration (Default 12 Weeks/3 Months if empty, or max of items)
  const maxWeek = scheduleItems.length > 0 
    ? Math.max(...scheduleItems.map(i => i.startWeek + i.durationWeeks)) 
    : 12;
  const totalWeeks = Math.max(12, maxWeek); // Minimum 12 weeks for view
  
  // Generate Calendar Headers
  const months: { name: string, weeks: number[] }[] = [];
  let currentWeek = 1;
  let currentDate = new Date(timelineStart);

  // Simple approximation: 4 weeks per month for the visual grid
  // We will generate headers based on 4-week chunks to simulate "Months"
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
  
  // Start month index
  let currentMonthIndex = currentDate.getMonth();

  for (let i = 0; i < Math.ceil(totalWeeks / 4); i++) {
      const mIndex = (currentMonthIndex + i) % 12;
      months.push({
          name: monthNames[mIndex],
          weeks: [1, 2, 3, 4] // Standardized W1-W4 for Excel look
      });
  }

  const handleAddNewItem = () => {
    if (!newItem.description.trim()) return;

    setScheduleItems([
        ...scheduleItems,
        { 
            id: `s_${Date.now()}`, 
            description: newItem.description, 
            startWeek: newItem.startWeek, 
            durationWeeks: newItem.durationWeeks,
            pic: newItem.pic,
            predecessors: []
        }
    ]);
    // Reset form
    setNewItem({
        description: '',
        startWeek: 1,
        durationWeeks: 1,
        pic: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...scheduleItems];
    newItems.splice(index, 1);
    setScheduleItems(newItems);
  };

  const handleChange = (index: number, field: keyof ScheduleItem, value: any) => {
    const newItems = [...scheduleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setScheduleItems(newItems);
  };

  const getPredecessorDisplay = (item: ScheduleItem): string => {
      if (!item.predecessors || item.predecessors.length === 0) return '';
      
      const indices = item.predecessors.map(predId => {
          const idx = scheduleItems.findIndex(i => i.id === predId);
          return idx !== -1 ? idx + 1 : null;
      }).filter(n => n !== null);

      return indices.join(', ');
  };

  const handlePredecessorChange = (index: number, value: string) => {
      const rowNumbers = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      const newPredecessors: string[] = [];

      rowNumbers.forEach(rowNum => {
          const targetIndex = rowNum - 1;
          if (targetIndex >= 0 && targetIndex < scheduleItems.length && targetIndex !== index) {
               newPredecessors.push(scheduleItems[targetIndex].id);
          }
      });

      const newItems = [...scheduleItems];
      newItems[index] = { ...newItems[index], predecessors: newPredecessors };
      setScheduleItems(newItems);
  };

  const handleSave = () => {
    const updatedProject = {
        ...project,
        scheduleItems: scheduleItems
    };
    onUpdate(updatedProject);
    setIsEditing(false);
  };

  // Export Logic
  const handleExportCSV = () => {
    const data = scheduleItems.map((item, idx) => ({
        No: idx + 1,
        Description: item.description,
        Resource: item.pic || '',
        DurationWeeks: item.durationWeeks,
        StartWeek: item.startWeek,
        Predecessors: getPredecessorDisplay(item)
    }));
    exportToCSV(data, `${project.name}_GanttChart`);
  };

  const handlePrint = () => {
    printComponent('gantt-chart-container', `Schedule: ${project.name}`);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
             <div>
                <h3 className="text-xl font-bold text-gray-900">Implementation Schedule</h3>
                <p className="text-sm text-gray-500">{project.name}</p>
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={handleExportCSV} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border border-gray-300 bg-white">
                    <Download size={14}/> CSV
                 </button>
                 <button onClick={handlePrint} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border border-gray-300 bg-white mr-4">
                    <Printer size={14}/> PDF
                 </button>

                 {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Edit2 size={16} /> Edit Schedule
                    </button>
                 ) : (
                     <>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 text-sm font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                     </>
                 )}
                 <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors ml-2">
                    <X size={24} />
                 </button>
             </div>
        </div>

        {/* Project Constraints Dashboard */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center gap-y-4 gap-x-8 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            {/* Start Date */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
                    <Calendar size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Start Date</p>
                    <p className="font-mono font-medium text-sm text-gray-900">{formatDate(startDate)}</p>
                </div>
            </div>

            {/* Deadline Dinas */}
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${isOverdue ? 'bg-red-100 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <CalendarClock size={20} />
                </div>
                <div>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        Dateline Dinas
                    </p>
                    <p className={`font-mono font-medium text-sm ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                        {cutOffDate ? formatDate(cutOffDate) : '-'}
                    </p>
                </div>
            </div>

            {/* Duration (Days) */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-blue-600">
                    <Timer size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Durasi Izin</p>
                    <p className="font-mono font-medium text-sm text-gray-900">{durationDays > 0 ? `${durationDays} Hari` : '-'}</p>
                </div>
            </div>

            {/* Warning Indicator */}
            {isOverdue && (
                <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200 animate-pulse shadow-sm">
                    <AlertTriangle size={20} />
                    <div>
                        <p className="text-xs font-bold uppercase">Project Expired</p>
                        <p className="text-[10px]">Melewati batas waktu dinas</p>
                    </div>
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white p-6" id="gantt-chart-container">
            
            {/* Input Form Section (Visible only when Editing) */}
            {isEditing && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm no-print">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Plus size={16} className="text-brand-600" /> Add New Task
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Task Description</label>
                            <input 
                                type="text"
                                value={newItem.description}
                                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                placeholder="e.g. Survey Lapangan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Resource / PIC</label>
                            <input 
                                type="text"
                                value={newItem.pic}
                                onChange={(e) => setNewItem({...newItem, pic: e.target.value})}
                                placeholder="e.g. Tim Civil..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Week</label>
                            <input 
                                type="number"
                                min="1"
                                value={newItem.startWeek}
                                onChange={(e) => setNewItem({...newItem, startWeek: parseInt(e.target.value) || 1})}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                            <input 
                                type="number"
                                min="1"
                                value={newItem.durationWeeks}
                                onChange={(e) => setNewItem({...newItem, durationWeeks: parseInt(e.target.value) || 1})}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button 
                                onClick={handleAddNewItem}
                                className="w-full px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded hover:bg-brand-700 transition-colors"
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Gantt Grid */}
            <div className="border border-slate-200 min-w-[1300px] text-xs shadow-sm rounded-lg overflow-hidden">
                
                {/* Header Row 1: Months */}
                <div className="flex border-b border-slate-200 bg-slate-50 text-slate-700">
                    <div className="w-10 border-r border-slate-200 p-3 flex items-center justify-center font-bold">#</div>
                    <div className="w-80 border-r border-slate-200 p-3 flex items-center font-bold">TASK NAME</div>
                    <div className="w-32 border-r border-slate-200 p-3 flex items-center justify-center font-bold">RESOURCE</div>
                    <div className="w-16 border-r border-slate-200 p-3 flex items-center justify-center font-bold text-center" title="Predecessors">PRED</div>
                    <div className="w-16 border-r border-slate-200 p-3 flex items-center justify-center font-bold text-center">DUR</div>
                    
                    {/* Timeline Headers */}
                    <div className="flex-1 flex">
                        {months.map((m, idx) => (
                            <div key={idx} className="flex-1 border-r border-slate-200 last:border-r-0">
                                <div className="text-center py-2 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider bg-slate-100">
                                    {m.name}
                                </div>
                                <div className="flex">
                                    {m.weeks.map(w => (
                                        <div key={w} className="flex-1 text-center py-1 border-r border-slate-200 last:border-r-0 text-slate-400 font-medium text-[9px]">
                                            W{w}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body Rows */}
                {scheduleItems.length === 0 && (
                     <div className="p-8 text-center text-gray-400 italic border-b border-slate-200">
                        No schedule items defined. Click "Edit Schedule" to add.
                    </div>
                )}

                {scheduleItems.map((item, idx) => {
                    // Check Dependency Conflicts
                    let hasDependencyConflict = false;
                    if (item.predecessors && item.predecessors.length > 0) {
                        item.predecessors.forEach(predId => {
                            const predItem = scheduleItems.find(i => i.id === predId);
                            if (predItem) {
                                const predEndWeek = predItem.startWeek + predItem.durationWeeks;
                                if (item.startWeek < predEndWeek) {
                                    hasDependencyConflict = true;
                                }
                            }
                        });
                    }

                    return (
                        <div key={item.id} className="flex border-b border-slate-100 hover:bg-blue-50/30 h-10 group transition-colors">
                            {/* No */}
                            <div className="w-10 border-r border-slate-100 flex items-center justify-center text-slate-400 font-mono">
                                {idx + 1}
                            </div>

                            {/* Description Input/Display */}
                            <div className="w-80 border-r border-slate-100 flex items-center px-3 text-slate-700">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={item.description}
                                        onChange={(e) => handleChange(idx, 'description', e.target.value)}
                                        className="w-full bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:border-brand-500 outline-none"
                                        placeholder="Item description..."
                                    />
                                ) : (
                                    <span className="truncate font-medium">{item.description}</span>
                                )}
                            </div>

                            {/* Resource/PIC Input/Display */}
                            <div className="w-32 border-r border-slate-100 flex items-center justify-center px-2 text-slate-600">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={item.pic || ''}
                                        onChange={(e) => handleChange(idx, 'pic', e.target.value)}
                                        className="w-full bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:border-brand-500 outline-none text-center"
                                        placeholder="PIC..."
                                    />
                                ) : (
                                    <span className="truncate text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{item.pic || '-'}</span>
                                )}
                            </div>

                             {/* Predecessors Input/Display */}
                             <div className="w-16 border-r border-slate-100 flex items-center justify-center text-slate-500">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={getPredecessorDisplay(item)}
                                        onChange={(e) => handlePredecessorChange(idx, e.target.value)}
                                        className={`w-12 text-center bg-white border border-slate-300 px-1 py-1 rounded text-xs focus:border-brand-500 outline-none ${hasDependencyConflict ? 'border-red-500 text-red-600' : ''}`}
                                        placeholder="1,2"
                                    />
                                ) : (
                                    <span className={`flex items-center gap-1 font-mono ${hasDependencyConflict ? 'text-red-500 font-bold' : ''}`}>
                                        {hasDependencyConflict && <AlertTriangle size={10} />}
                                        {getPredecessorDisplay(item) || ''}
                                    </span>
                                )}
                            </div>

                            {/* Duration Input/Display */}
                            <div className="w-16 border-r border-slate-100 flex items-center justify-center text-slate-600">
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={item.durationWeeks}
                                        onChange={(e) => handleChange(idx, 'durationWeeks', parseInt(e.target.value))}
                                        className="w-12 text-center bg-white border border-slate-300 px-1 py-1 rounded text-xs focus:border-brand-500 outline-none"
                                    />
                                ) : (
                                    <span>{item.durationWeeks} w</span>
                                )}
                            </div>

                            {/* Timeline Cells */}
                            <div className="flex-1 relative bg-white">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {Array.from({ length: months.length * 4 }).map((_, cellIdx) => (
                                        <div key={cellIdx} className="flex-1 border-r border-slate-100 h-full"></div>
                                    ))}
                                </div>

                                {/* The Bar */}
                                <div 
                                    className={`absolute top-2 bottom-2 z-10 rounded-full shadow-sm transition-all
                                        ${hasDependencyConflict 
                                            ? 'bg-red-500 border border-red-600' 
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 border border-blue-600'}
                                    `}
                                    style={{
                                        left: `${((item.startWeek - 1) / (months.length * 4)) * 100}%`,
                                        width: `${(item.durationWeeks / (months.length * 4)) * 100}%`
                                    }}
                                    title={hasDependencyConflict ? "Conflict: Starts before predecessor ends" : item.description}
                                ></div>

                                {/* Editing Controls overlay for Start Week */}
                                {isEditing && (
                                    <div className="absolute inset-0 z-20 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50/90 backdrop-blur-[1px]">
                                        <span className="mr-2 font-bold text-slate-600 text-[10px]">Start W:</span>
                                        <input 
                                            type="number"
                                            min="1"
                                            value={item.startWeek}
                                            onChange={(e) => handleChange(idx, 'startWeek', parseInt(e.target.value))}
                                            className="w-12 border border-slate-300 p-1 rounded text-center"
                                        />
                                        <button onClick={() => handleRemoveItem(idx)} className="ml-auto mr-4 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
             <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <span>Scheduled Task</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-2 rounded-full bg-red-500"></div>
                    <span>Dependency Conflict</span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default GanttChartModal;
