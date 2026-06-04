import { Project, Task, Lot } from '../../types';
import { cn, formatDate } from '../../lib/utils';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  Activity,
  Shield,
  Target,
  Clock,
  Download,
  Settings
} from 'lucide-react';
import { useState } from 'react';

export function ProjectPlanning({ project, tasks, lots }: { project: Project, tasks: Task[], lots: Lot[] }) {
  const [zoomLevel, setZoomLevel] = useState(1); 

  const itemsToDisplay = tasks.length > 0 ? tasks : lots;
  const label = tasks.length > 0 ? "Unités Opérationnelles" : "Lots Stratégiques";

  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  const endDate = project.endDate ? new Date(project.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalMs = isNaN(endDate.getTime()) || isNaN(startDate.getTime()) ? 30 * 24 * 60 * 60 * 1000 : (endDate.getTime() - startDate.getTime() || 1);
  let weeksCount = Math.ceil(totalMs / (1000 * 60 * 60 * 24 * 7));
  if (weeksCount < 4) weeksCount = 4;
  if (weeksCount > 104) weeksCount = 104; // Max 2 years


  return (
    <div className="friendly-card overflow-hidden flex flex-col h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-xl border-slate-200">
      <div className="bg-slate-50/50 border-b border-slate-100 p-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-10">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3 font-display">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
               <Layers size={16} />
            </div>
            Échéancier Directeur G0
          </h3>
          <div className="flex items-center bg-slate-200/50 p-1.5 rounded-2xl gap-1 shadow-inner">
             <button 
                onClick={() => setZoomLevel(1)} 
                className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all font-display", 
                   zoomLevel === 1 ? 'bg-white shadow-xl shadow-blue-100 text-blue-600 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                )}
             >
                Horaires
             </button>
             <button 
                onClick={() => setZoomLevel(2)} 
                className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all font-display", 
                   zoomLevel === 2 ? 'bg-white shadow-xl shadow-blue-100 text-blue-600 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                )}
             >
                Jours
             </button>
             <button 
                onClick={() => setZoomLevel(3)} 
                className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all font-display", 
                   zoomLevel === 3 ? 'bg-white shadow-xl shadow-blue-100 text-blue-600 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                )}
             >
                Semaines
             </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"><ChevronLeft size={20} /></button>
           <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white font-technical">
        <div className="min-w-[1400px] h-full flex flex-col">
          {/* Header Dates */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 sticky top-0 z-30 shrink-0">
             <div className="w-[340px] border-r border-slate-100 p-6 shrink-0 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur-md font-display">Identifiant & Désignation</div>
             <div className="flex-1 flex font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 backdrop-blur-sm font-display">
                {Array.from({ length: weeksCount }).map((_, i) => {
                  const weekDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                  const monthName = weekDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                  return (
                    <div key={i} className="flex-1 border-r border-slate-100 p-6 text-center group hover:bg-white hover:text-blue-600 transition-all cursor-pointer min-w-[100px]">
                       S{i + 1}
                       <div className="text-[8px] font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase">{monthName}</div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Planning Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Legend Row */}
            <div className="flex border-b border-slate-100 bg-blue-50/30 sticky top-[61px] z-20 backdrop-blur-sm">
               <div className="w-[340px] border-r border-slate-100 p-6 shrink-0 flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-slate-900 rounded-full shadow-lg"></div>
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight font-display line-clamp-1">{project.name}</span>
               </div>
               <div className="flex-1 relative p-6 h-20 bg-white/50 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px)] bg-[size:calc(100%/14)_100%]">
                  <div className="absolute top-1/2 -translate-y-1/2 left-[5%] w-[90%] h-10 bg-slate-900 rounded-[14px] shadow-2xl flex items-center px-6 overflow-hidden group/bar border border-slate-800">
                    <span className="text-[10px] font-bold text-white uppercase italic tracking-widest font-display">Séquence Globale d'Exécution • Indice de Progression {project.progress || 0}%</span>
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
                  </div>
               </div>
            </div>

            {/* Task Registry Rows */}
            <div className="divide-y divide-slate-100 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px)] bg-[size:calc(100%/14+340px)_100%]">
              {itemsToDisplay.map((item, idx) => {
                const itemStart = item.startDate ? new Date(item.startDate) : startDate;
                const itemEnd = item.endDate ? new Date(item.endDate) : endDate;
                const startPercent = Math.max(0, Math.min(100, ((itemStart.getTime() - startDate.getTime()) / totalMs) * 100));
                const widthPercent = Math.max(5, Math.min(100 - startPercent, ((itemEnd.getTime() - itemStart.getTime()) / totalMs) * 100));

                return (
                <div key={item.id} className="flex h-16 group hover:bg-blue-50/10 transition-all">
                  <div className="w-[340px] border-r border-slate-100 px-8 py-4 shrink-0 flex items-center gap-4 relative overflow-hidden">
                     <span className="text-[10px] font-mono font-bold text-slate-300">{(idx + 1).toString().padStart(2, '0')}</span>
                     <span className="text-xs font-bold text-slate-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors flex-1 truncate font-display">{item.name}</span>
                  </div>
                  <div className="flex-1 relative h-full">
                     <div 
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-8 rounded-[14px] shadow-lg flex items-center px-4 border-2 transition-all cursor-pointer group-hover:h-10 group-hover:shadow-xl",
                        item.status === 'DONE' || (item.status as string) === 'COMPLETED'
                           ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20' 
                           : 'bg-white border-blue-100 text-blue-600 shadow-blue-500/5'
                      )}
                      style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                     >
                        <div className="absolute inset-y-0 left-0 w-1 bg-black/5 rounded-l-full"></div>
                        <span className="text-[10px] font-bold uppercase truncate tracking-widest font-display">{item.status === 'DONE' || (item.status as string) === 'COMPLETED' ? 'Terminé' : (item.status === 'IN_PROGRESS' || (item.status as string) === 'ACTIVE' ? 'En Cours' : 'À Faire')}</span>
                        {(item.status !== 'DONE' && (item.status as string) !== 'COMPLETED') && (
                          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-sm rotate-45 border-2 border-white z-10 hidden group-hover:block transition-all"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                     </div>
                  </div>
                </div>
                );
              })}
            </div>

            {itemsToDisplay.length === 0 && (
              <div className="p-32 text-center flex flex-col items-center justify-center gap-8">
                <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center group">
                   <Target size={60} className="text-slate-100 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="space-y-3">
                   <p className="text-slate-900 font-bold uppercase tracking-widest text-sm font-display">Aucune séquence d'ordonnancement</p>
                   <p className="text-slate-400 text-xs font-medium italic font-display">L'injection de lots de travail est nécessaire pour initialiser l'échancier.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Industrial Footer Status */}
      <div className="px-8 py-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 font-display shadow-2xl">
         <div className="flex items-center gap-10">
           <div className="flex items-center gap-4 group cursor-help">
              <div className="w-8 h-2.5 bg-slate-800 rounded-full border border-slate-600 shadow-inner group-hover:border-slate-500 transition-colors"></div>
              <span className="text-slate-300 group-hover:text-white transition-colors">Référentiel Contractuel</span>
           </div>
           <div className="flex items-center gap-4 group cursor-help">
              <div className="w-8 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
              <span className="text-slate-300 group-hover:text-white transition-colors">Lots Clôturés</span>
           </div>
           <div className="flex items-center gap-4 border-l border-slate-800 pl-10 group">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                 <Activity size={16} className="text-blue-400" />
              </div>
              <span className="text-blue-400/80 group-hover:text-blue-400 group-hover:animate-pulse transition-all">Analyse de dérive: +2.4 Jours</span>
           </div>
         </div>
         <div className="flex items-center gap-6">
            <button className="text-slate-500 hover:text-white transition-all flex items-center gap-3 py-2 px-4 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 uppercase tracking-widest">
               <Download size={16} /> EXPORTER XLS
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <p className="flex items-center gap-3 text-slate-500 italic">
               <Clock size={14} className="text-slate-600" />
               Dernière mise à jour: {formatDate(project.updatedAt)}
            </p>
         </div>
      </div>
    </div>
  );
}
