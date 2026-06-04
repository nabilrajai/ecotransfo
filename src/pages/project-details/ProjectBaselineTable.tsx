import { Task, Project } from '../../types';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { Download, Table, FileInput, Image as ImageIcon, ArrowRight, Calendar, Activity, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import React, { useRef, useState } from 'react';

export function ProjectBaselineTable({ project, tasks, lots = [] }: { project: Project, tasks: Task[], lots?: any[] }) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [expandedLot, setExpandedLot] = useState<string | null>(null);

  const filteredLots = lots.length > 0 ? lots : tasks.filter(t => !t.parent_task_id && !t.parentTaskId);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tasks.map(t => ({
      Nom: t.name,
      Statut: t.status,
      Priorité: t.priority,
      DateDébut: t.startDate,
      DateFin: t.endDate,
      Progression: t.progress + '%'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Baseline");
    XLSX.writeFile(wb, `${project.name}_Baseline.xlsx`);
  };

  const exportImage = () => {
    if (tableRef.current) {
      toPng(tableRef.current).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${project.name}_Baseline.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3 font-display">
            <Table size={16} className="text-blue-600" /> Planification Baseline Complète
         </h3>
         <div className="flex gap-2">
            <button onClick={exportExcel} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:text-blue-600 transition-all uppercase tracking-widest">
               <FileInput size={14} /> Excel
            </button>
            <button onClick={exportImage} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:text-blue-600 transition-all uppercase tracking-widest">
               <ImageIcon size={14} /> Image
            </button>
         </div>
      </div>

      <div className="friendly-card overflow-hidden shadow-sm border-slate-200" ref={tableRef}>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display shrink-0">Désignation Technique</th>
                    <th className="w-48 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Échéance</th>
                    <th className="w-48 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-center">Exécution (%)</th>
                    <th className="w-48 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-left">Assignés</th>
                    <th className="w-40 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-center">Statut</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredLots.map(lot => {
                   const isExpanded = expandedLot === lot.id;
                   const lotTasks = tasks.filter(t => t.parent_task_id === lot.id || t.parentTaskId === lot.id || t.lotId === lot.id || (t as any).lot_id === lot.id);
                   return (
                     <React.Fragment key={lot.id}>
                       <tr className="group hover:bg-blue-50/10 transition-all border-l-4 border-l-transparent hover:border-l-blue-500 cursor-pointer" onClick={() => setExpandedLot(isExpanded ? null : lot.id)}>
                          <td className="px-8 py-6">
                             <div className="space-y-1.5 flex flex-col items-start translate-x-1 group-hover:translate-x-2 transition-transform">
                                <div className="flex items-center gap-2">
                                   <ArrowRight size={14} className={cn("text-slate-300 transition-transform", isExpanded && "rotate-90 text-blue-500")} />
                                   <p className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors font-display">{lot.name}</p>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-300 italic tracking-tighter">WBS-LOT-{String(lot.id).slice(0,6).toUpperCase()}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-display">
                                <Calendar size={14} className="text-slate-300" />
                                {formatDate(lot.endDate)}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                   <div 
                                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                                      style={{ width: `${lot.progress}%` }}
                                   ></div>
                                </div>
                                <span className="text-[11px] font-black text-slate-900 font-display">{lot.progress}%</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-wrap gap-1">
                               {lot.assignedUsers && lot.assignedUsers.length > 0 ? lot.assignedUsers.map((u, idx) => (
                                 <span key={idx} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-display">
                                   {u}
                                 </span>
                               )) : (
                                 <span className="text-[9px] font-medium text-slate-400 italic">Non assigné</span>
                               )}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl text-center min-w-[110px] inline-block",
                              lot.status === 'DONE' || (lot.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                              lot.status === 'IN_PROGRESS' || (lot.status as string) === 'ACTIVE' ? 'bg-blue-50 text-blue-600' :
                              lot.status === 'REVIEW' || (lot.status as string) === 'ON_HOLD' ? 'bg-orange-50 text-orange-600' :
                              'bg-slate-50 text-slate-600'
                            )}>
                              {lot.status === 'DONE' || (lot.status as string) === 'COMPLETED' ? 'Terminé' :
                               lot.status === 'IN_PROGRESS' || (lot.status as string) === 'ACTIVE' ? 'En Cours' :
                               lot.status === 'REVIEW' || (lot.status as string) === 'ON_HOLD' ? 'Revue' : 'À Faire'}
                            </span>
                          </td>
                       </tr>
                       {isExpanded && (
                         <tr className="bg-slate-50/50">
                           <td colSpan={5} className="px-8 py-6 border-b border-slate-100">
                             <div className="pl-10 border-l-2 border-slate-200">
                               <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-900 mb-4 flex items-center gap-2">
                                 <Activity size={14} className="text-blue-500" /> Tâches détaillées ({lotTasks.length})
                               </h4>
                               {lotTasks.length > 0 ? (
                                 <div className="space-y-2">
                                   {lotTasks.map(task => (
                                     <div key={task.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                       <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", 
                                              task.status === 'DONE' ? 'bg-emerald-500' : 
                                              task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 
                                              'bg-slate-300'
                                            )} />
                                            <span className="text-sm font-bold text-slate-700">{task.name}</span>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                         <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{task.priority}</span>
                                         <span className={cn(
                                           "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl text-center min-w-[100px]",
                                           task.status === 'DONE' || (task.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                           task.status === 'IN_PROGRESS' || (task.status as string) === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                           task.status === 'REVIEW' || (task.status as string) === 'ON_HOLD' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                           'bg-slate-50 text-slate-600 border border-slate-200'
                                         )}>
                                           {task.status === 'DONE' || (task.status as string) === 'COMPLETED' ? 'Terminé' :
                                            task.status === 'IN_PROGRESS' || (task.status as string) === 'ACTIVE' ? 'En Cours' :
                                            task.status === 'REVIEW' || (task.status as string) === 'ON_HOLD' ? 'Revue' : 'À Faire'}
                                         </span>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-xs text-slate-400 italic">Aucune tâche assignée à ce lot.</p>
                               )}
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   );
                 })}

                 {filteredLots.length === 0 && (
                   <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                         <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-200">
                               <Shield size={32} />
                            </div>
                            <div className="space-y-1">
                               <p className="text-sm font-bold text-slate-900">Aucun lot technique</p>
                            </div>
                         </div>
                      </td>
                   </tr>
                 )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

