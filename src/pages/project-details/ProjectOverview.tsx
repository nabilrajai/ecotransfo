import { Project, Task, Lot } from '../../types';
import { 
  Target, 
  Clock, 
  ArrowRight,
  TrendingUp,
  BarChart2,
  DollarSign,
  Activity,
  Shield,
  Layers
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';

export function ProjectOverview({ project, tasks, lots }: { project: Project, tasks: Task[], lots: Lot[] }) {
  const itemsToDisplay = tasks.length > 0 ? tasks : lots;
  const completedItems = itemsToDisplay.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const totalItems = itemsToDisplay.length;
  const label = tasks.length > 0 ? "Activités" : "Lots";
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-2 space-y-8">
        {/* Audit & Description */}
        <section className="friendly-card group overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-100 p-5 flex justify-between items-center group-hover:bg-slate-100/50 transition-colors">
             <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3 font-display">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                   <Target size={16} />
                </div>
                Dossier de Prescription & Objectifs
             </h3>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-display">REV: B.01.2024</span>
          </div>
          <div className="p-10 relative">
             <div className="absolute top-10 right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-1000 group-hover:scale-110 pointer-events-none">
                <Activity size={240} className="text-slate-900" />
             </div>
             
             <div className="relative z-10 space-y-10">
                <div className="bg-blue-50/30 border-l-4 border-blue-500 rounded-r-2xl p-8 italic shadow-sm backdrop-blur-sm">
                   <p className="text-slate-600 text-lg font-medium leading-relaxed font-display">
                      {project.description || "Aucune spécification technique n'a été documentée. Le directeur de projet doit initialiser le périmètre contractuel immédiatement."}
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-2">
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">{label} Livrés</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">{completedItems}</span>
                         <span className="text-sm text-slate-400 font-bold font-display italic">/ {totalItems} UNI</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${totalItems ? (completedItems / totalItems) * 100 : 0}%` }}></div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Indice de Santé</p>
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200"></div>
                         <p className="text-2xl font-extrabold text-emerald-600 tracking-tight font-display italic">OPTIMAL</p>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-display">Aucune anomalie critique</p>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Niveau de Priorité</p>
                      <div className="flex items-center gap-2">
                         <p className="text-2xl font-extrabold text-blue-600 tracking-tight font-display italic">{project.priority || 'NORMAL'}</p>
                         <Shield size={18} className="text-blue-200" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-display">Classé: Stratégique</p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Operational Milestone Grid */}
        <section className="friendly-card overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-100 p-5 flex justify-between items-center font-display">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                 <Layers size={16} />
              </div>
              Journal des Événements Opérationnels
            </h3>
            <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 uppercase tracking-widest transition-all p-2 hover:bg-blue-50 rounded-lg">
              Voir Audit Complet <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {itemsToDisplay.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all shadow-sm",
                    item.status === 'DONE' || item.status === 'COMPLETED'
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50" 
                      : "bg-white text-slate-300 border-slate-100"
                  )}>
                     {item.status === 'DONE' || item.status === 'COMPLETED' ? "OK" : ">>"}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 uppercase group-hover:text-blue-600 transition-colors font-display tracking-tight">{item.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Échéance: {formatDate(item.endDate)}</span>
                       <div className="h-3 w-px bg-slate-200"></div>
                       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-display">UNIT-ID: {String(item.id).slice(0,8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {itemsToDisplay.length === 0 && (
               <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Activity size={40} className="text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic font-display">Aucune donnée opérationnelle enregistrée.</p>
               </div>
            )}
          </div>
        </section>
      </div>

      <div className="space-y-8">
        {/* Finance Snapshot */}
        <section className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
           <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-3 text-blue-400 font-display">
                  <DollarSign size={20} />
                  Contrôle Budgétaire
                </h3>
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                   <TrendingUp size={18} className="text-emerald-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <div className="flex justify-between items-baseline mb-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Consommation du Budget</span>
                       <span className="text-4xl font-extrabold text-blue-400 font-display tracking-tighter">
                          {project.budget ? ((project.spent / project.budget) * 100).toFixed(1) : 0}%
                       </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner font-display">
                       <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1500 ease-out shadow-lg" 
                          style={{ width: `${project.budget ? (project.spent / project.budget) * 100 : 0}%` }}
                       ></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display">Capitaux Engagés</span>
                       <span className="text-xl font-bold font-display text-slate-200">{formatCurrency(project.spent || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                       <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest font-display">Marge Résiduelle</span>
                       <span className="text-xl font-bold font-display text-emerald-400">{formatCurrency((project.budget || 0) - (project.spent || 0))}</span>
                    </div>
                 </div>
              </div>
           </div>
           <Activity className="absolute -bottom-16 -right-16 text-blue-500/5 group-hover:text-blue-500/10 transition-all duration-[2000ms] group-hover:scale-110" size={300} />
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'DONE': 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50',
    'COMPLETED': 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50',
    'IN_PROGRESS': 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50',
    'ACTIVE': 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50',
    'TODO': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50',
    'BACKLOG': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50',
    'PLANNING': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50',
    'REVIEW': 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-50',
    'ON_HOLD': 'text-orange-600 bg-orange-50 border-orange-100 shadow-orange-50',
  };
  return (
    <span className={cn("px-4 py-1.5 border rounded-xl text-[10px] font-bold uppercase tracking-widest min-w-[100px] text-center shadow-sm font-display", styles[status] || 'bg-slate-50 text-slate-400')}>
      {status}
    </span>
  );
}
