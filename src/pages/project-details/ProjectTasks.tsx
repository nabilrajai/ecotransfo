import { Project, Task, UserProfile, Lot } from '../../types';
import React, { useState } from 'react';
import { 
  Plus, 
  CheckSquare, 
  List as ListIcon, 
  LayoutGrid, 
  Search, 
  MoreVertical,
  Clock,
  AlertCircle,
  Filter,
  Download,
  Shield,
  Activity,
  ArrowRight,
  Edit2,
  Trash2,
  Calendar
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { StorageService } from '../../lib/storage';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { TaskModal } from '../../components/TaskModal';

interface ProjectTasksProps {
  project: Project;
  tasks: Task[];
  lots: Lot[];
  user: UserProfile;
  onRefresh: () => void;
}

export function ProjectTasks({ project, tasks, lots, user, onRefresh }: ProjectTasksProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [expandedLot, setExpandedLot] = useState<string | null>(null);
  const [isGroupCreation, setIsGroupCreation] = useState(false);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string>('');

  // Groups/Lots are now top-level tasks without parent_task_id
  const filteredLots = tasks.filter(t => !t.parent_task_id && !t.parentTaskId && (t.name || '').toLowerCase().includes(search.toLowerCase()));
  const unassignedTasks: any[] = [];
  const listTasks = tasks.filter(t => t.parent_task_id || t.parentTaskId);

  const columns = [
    { id: 'TODO', label: 'À faire', color: 'bg-slate-400', badgeColor: 'bg-slate-100 text-slate-600' },
    { id: 'IN_PROGRESS', label: 'En Cours', color: 'bg-blue-600', badgeColor: 'bg-blue-50 text-blue-600' },
    { id: 'REVIEW', label: 'Revue', color: 'bg-orange-500', badgeColor: 'bg-orange-50 text-orange-600' },
    { id: 'DONE', label: 'Terminé', color: 'bg-emerald-600', badgeColor: 'bg-emerald-50 text-emerald-600' },
  ];

  const handleEdit = (lot: any) => {
    setSelectedLot(lot);
    setSelectedParentTaskId('');
    setIsGroupCreation(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce lot technique ainsi que toutes ses sous-tâches ? Cette action est irréversible.")) {
      try {
        await api.delete(`/tasks/${id}`);
        onRefresh();
      } catch (err) {
        console.error("Error deleting lot:", err);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    console.log("Deleting task with id:", id);
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      try {
        await api.delete(`/tasks/${id}`);
        console.log("Task deleted successfully");
        onRefresh();
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  const handleAddLot = () => {
    setSelectedLot(null);
    setSelectedParentTaskId('');
    setIsGroupCreation(true);
    setIsModalOpen(true);
  };

  const handleAddSubtask = (parentLot: any) => {
    setSelectedLot(null);
    setSelectedParentTaskId(parentLot.id);
    setIsGroupCreation(false);
    setIsModalOpen(true);
  };

  const handleDrop = async (taskId: string, status: any) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (taskObj) {
      try {
        await api.put(`/tasks/${taskObj.id}`, { status });
        onRefresh();
      } catch (err) {
        console.error("Error updating drag-dropped task:", err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Technical Controls */}
      <div className="friendly-card overflow-hidden flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="relative flex-1 w-full group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrer les lots par désignation ou code technique..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 font-display"
          />
        </div>
        
        <div className="flex items-center p-2 gap-2 w-full md:w-auto shrink-0">
          <div className="flex items-center bg-slate-100/50 rounded-2xl p-1 gap-1">
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-display", 
                view === 'list' ? "bg-white text-blue-600 shadow-sm shadow-blue-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ListIcon size={16} /> Liste
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "px-5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-display", 
                view === 'kanban' ? "bg-white text-blue-600 shadow-sm shadow-blue-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
          </div>
          
          {user.role !== 'CLIENT' && (
            <button 
              onClick={handleAddLot}
              className="btn-primary py-3.5 px-8 ml-2"
            >
              <Plus size={18} /> <span>Initialiser Lot</span>
            </button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <div className="friendly-card overflow-hidden shadow-sm border-slate-200">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display shrink-0">Désignation Technique</th>
                      <th className="w-56 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Échéance</th>
                      <th className="w-48 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Budget (MAD)</th>
                      <th className="w-56 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-center">Exécution (%)</th>
                      <th className="w-48 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-left">Assignés</th>
                      <th className="w-40 px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display text-center">Statut G0</th>
                      <th className="w-40 px-8 py-5 text-right"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredLots.map(lot => {
                     const isExpanded = expandedLot === lot.id;
                     const lotTasks = tasks.filter(t => t.parent_task_id === lot.id || t.parentTaskId === lot.id);
                     return (
                       <React.Fragment key={lot.id}>
                         <tr className="group hover:bg-blue-50/10 transition-all border-l-4 border-l-transparent hover:border-l-blue-500 cursor-pointer" onClick={() => setExpandedLot(isExpanded ? null : lot.id)}>
                            <td className="px-8 py-6">
                               <div className="space-y-1.5 flex flex-col items-start translate-x-1 group-hover:translate-x-2 transition-transform">
                                  <div className="flex items-center gap-2">
                                     <ArrowRight size={14} className={cn("text-slate-300 transition-transform", isExpanded && "rotate-90 text-blue-500")} />
                                     <p className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors font-display" onClick={(e) => { e.stopPropagation(); handleEdit(lot); }}>{lot.name}</p>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-300 italic tracking-tighter" onClick={(e) => { e.stopPropagation(); handleEdit(lot); }}>WBS-LOT-{String(lot.id).slice(0,6).toUpperCase()}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-display">
                                  <Calendar size={14} className="text-slate-300" />
                                  {formatDate(lot.endDate)}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-xs font-extrabold text-slate-900 font-display">{formatCurrency(lot.budget || 0)}</span>
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
                               <select
                                 value={lot.status}
                                 disabled={user.role === 'CLIENT'}
                                 onClick={(e) => e.stopPropagation()}
                                 onChange={(e) => {
                                   const newStatus = e.target.value;
                                   api.put(`/tasks/${lot.id}`, { status: newStatus }).then(() => onRefresh());
                                 }}
                                 className={cn(
                                   "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none appearance-none cursor-pointer text-center min-w-[110px]",
                                   lot.status === 'DONE' || (lot.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                   lot.status === 'IN_PROGRESS' || (lot.status as string) === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                   lot.status === 'REVIEW' || (lot.status as string) === 'ON_HOLD' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                   'bg-slate-50 text-slate-600 border border-slate-200'
                                 )}
                               >
                                 <option value="TODO">À faire</option>
                                 <option value="IN_PROGRESS">En Cours</option>
                                 <option value="REVIEW">Revue</option>
                                 <option value="DONE">Terminé</option>
                               </select>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  {user.role !== 'CLIENT' && (
                                    <>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(lot); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                      >
                                         <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(lot.id); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}
                               </div>
                            </td>
                         </tr>
                         {isExpanded && (
                           <tr className="bg-slate-50/50">
                             <td colSpan={7} className="px-8 py-6 border-b border-slate-100">
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
                                           <select
                                             value={task.status}
                                             disabled={user.role === 'CLIENT'}
                                             onClick={(e) => e.stopPropagation()}
                                             onChange={(e) => {
                                               const newStatus = e.target.value;
                                               api.put(`/tasks/${task.id}`, { status: newStatus }).then(() => onRefresh());
                                             }}
                                             className={cn(
                                               "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none appearance-none cursor-pointer text-center min-w-[100px]",
                                               task.status === 'DONE' || (task.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                               task.status === 'IN_PROGRESS' || (task.status as string) === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                               task.status === 'REVIEW' || (task.status as string) === 'ON_HOLD' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                               'bg-slate-50 text-slate-600 border border-slate-200'
                                             )}
                                           >
                                             <option value="TODO">À faire</option>
                                             <option value="IN_PROGRESS">En Cours</option>
                                             <option value="REVIEW">Revue</option>
                                             <option value="DONE">Terminé</option>
                                           </select>
                                           {user.role !== 'CLIENT' && (
                                             <div className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer" onClick={() => {
                                                handleDeleteTask(task.id);
                                             }}>
                                                <Trash2 size={14} />
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-xs text-slate-400 italic">Aucune tâche assignée à ce lot.</p>
                                 )}
                                 {user.role !== 'CLIENT' && (
                                   <button onClick={() => handleAddSubtask(lot)} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:text-blue-700">
                                      <Plus size={14} /> Ajouter une tâche
                                   </button>
                                 )}
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                   })}

                   {unassignedTasks.length > 0 && (
                     <React.Fragment>
                       <tr 
                         className="group hover:bg-amber-50/10 transition-all border-l-4 border-l-transparent hover:border-l-amber-500 cursor-pointer" 
                         onClick={() => setExpandedLot(expandedLot === 'unassigned' ? null : 'unassigned')}
                       >
                         <td className="px-8 py-6">
                           <div className="space-y-1.5 flex flex-col items-start translate-x-1 group-hover:translate-x-2 transition-transform">
                             <div className="flex items-center gap-2">
                               <ArrowRight size={14} className={cn("text-slate-300 transition-transform", expandedLot === 'unassigned' && "rotate-90 text-amber-500")} />
                               <p className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-amber-600 transition-colors font-display">Tâches Générales / Hors Lot</p>
                             </div>
                             <span className="text-[10px] font-mono font-bold text-slate-300 italic tracking-tighter">SPECIFIC-DELIVERABLES</span>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-display">
                             <Calendar size={14} className="text-slate-300" />
                             {project.endDate ? formatDate(project.endDate) : ''}
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <span className="text-xs font-extrabold text-slate-900 font-display">-</span>
                         </td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner font-display">
                               <div 
                                 className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                                 style={{ width: `${unassignedTasks.length ? (unassignedTasks.filter(t => t.status === 'DONE').length / unassignedTasks.length) * 100 : 0}%` }}
                               ></div>
                             </div>
                             <span className="text-[11px] font-black text-slate-900 font-display">{unassignedTasks.length ? Math.round((unassignedTasks.filter(t => t.status === 'DONE').length / unassignedTasks.length) * 100) : 0}%</span>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <div className="flex flex-wrap gap-1">
                             <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-display">
                               {unassignedTasks.length} Tâches
                             </span>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                           <StatusBadge status={unassignedTasks.every(t => t.status === 'DONE') ? 'COMPLETED' : 'ACTIVE'} />
                         </td>
                         <td className="px-8 py-6 text-right">
                         </td>
                       </tr>
                       {expandedLot === 'unassigned' && (
                         <tr className="bg-slate-50/50">
                           <td colSpan={7} className="px-8 py-6 border-b border-slate-100">
                             <div className="pl-10 border-l-2 border-slate-200">
                               <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-900 mb-4 flex items-center gap-2">
                                 <Activity size={14} className="text-amber-500" /> Tâches hors lot technique ({unassignedTasks.length})
                               </h4>
                               <div className="space-y-2">
                                 {unassignedTasks.map(task => (
                                   <div key={task.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-all">
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
                                       <select
                                         value={task.status}
                                         disabled={user.role === 'CLIENT'}
                                         onClick={(e) => e.stopPropagation()}
                                         onChange={(e) => {
                                           const newStatus = e.target.value;
                                           api.put(`/tasks/${task.id}`, { status: newStatus }).then(() => onRefresh());
                                         }}
                                         className={cn(
                                           "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none appearance-none cursor-pointer text-center min-w-[100px]",
                                           task.status === 'DONE' || (task.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                           task.status === 'IN_PROGRESS' || (task.status as string) === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                           task.status === 'REVIEW' || (task.status as string) === 'ON_HOLD' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                           'bg-slate-50 text-slate-600 border border-slate-200'
                                         )}
                                       >
                                         <option value="TODO">À faire</option>
                                         <option value="IN_PROGRESS">En Cours</option>
                                         <option value="REVIEW">Revue</option>
                                         <option value="DONE">Terminé</option>
                                       </select>
                                       {user.role !== 'CLIENT' && (
                                         <div className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer" onClick={() => {
                                            handleDeleteTask(task.id);
                                         }}>
                                            <Trash2 size={14} />
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                                </div>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   )}

                   {filteredLots.length === 0 && unassignedTasks.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                              <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-200">
                                 <Shield size={32} />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-sm font-bold text-slate-900">Aucun lot technique</p>
                                 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-loose">Commencez par initialiser le premier lot de travail pour ce projet.</p>
                              </div>
                              {user.role !== 'CLIENT' && (
                                <button onClick={handleAddLot} className="btn-secondary py-3 px-6 mt-4">Initialiser maintenant</button>
                              )}
                           </div>
                        </td>
                     </tr>
                   )}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-10 no-scrollbar items-start">
           {columns.map(col => {
             const colLots = filteredLots.filter(l => l.status === col.id);
             return (
                <div 
                  key={col.id} 
                  className="flex flex-col gap-6 w-[340px] shrink-0 group/col relative rounded-3xl border-2 border-transparent transition-all"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    e.currentTarget.classList.add('border-blue-200', 'bg-blue-50/10');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-blue-200', 'bg-blue-50/10');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-blue-200', 'bg-blue-50/10');
                    const lotId = e.dataTransfer.getData('text/plain');
                    if (!lotId || !lotId.trim()) return;
                    
                    const lot = lots.find(l => l.id === lotId);
                    if (lot) {
                      StorageService.saveLot({ ...lot, status: col.id as any });
                      onRefresh();
                    }
                  }}
                >
                  <div className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-3xl sticky top-0 z-10 shadow-sm group-hover/col:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-3 h-3 rounded-full shadow-inner", col.color)}></div>
                       <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-widest font-display">{col.label}</h4>
                    </div>
                    <span className={cn("text-[10px] font-black px-3 py-1 rounded-full shadow-inner", col.badgeColor)}>
                      {colLots.length}
                    </span>
                  </div>
                  
                  <div className="space-y-4 min-h-[600px] p-1">
                     {colLots.map(lot => (
                       <div 
                        key={lot.id} 
                        draggable
                        onDragStart={(e: any) => {
                          e.dataTransfer.setData('text/plain', lot.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
                        }}
                        onDragEnd={(e: any) => {
                          e.target.style.opacity = '1';
                        }}
                        onClick={() => handleEdit(lot)}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group cursor-grab active:cursor-grabbing relative overflow-hidden"
                       >
                         <h5 className="text-sm font-bold text-slate-800 uppercase leading-snug tracking-tight mb-6 group-hover:text-blue-600 transition-colors font-display line-clamp-2">{lot.name}</h5>
                         
                         <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Budget</span>
                               <span className="text-[11px] font-extrabold text-slate-900">{formatCurrency(lot.budget || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 px-2.5 py-1 bg-blue-50 rounded-full border border-blue-100">
                               <Activity size={12} />
                               {lot.progress}%
                            </div>
                         </div>
                         {lot.assignedUsers && lot.assignedUsers.length > 0 && (
                            <div className="pt-3 mt-3 border-t border-slate-50 flex items-center gap-2 flex-wrap">
                               {lot.assignedUsers.map((user: string, idx: number) => (
                                 <span key={idx} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-display">
                                   {user}
                                 </span>
                               ))}
                            </div>
                         )}
                       </div>
                     ))}
                     
                     {user.role !== 'CLIENT' && (
                       <button 
                         onClick={handleAddLot}
                         className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all font-display text-xs font-bold uppercase tracking-widest"
                       >
                         <Plus size={16} /> Ajouter un lot
                       </button>
                     )}
                  </div>
                </div>
             );
           })}
        </div>
      )}

      {project && (
        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={project}
          task={selectedLot}
          isGroupCreation={isGroupCreation}
          onSuccess={onRefresh}
          initialParentTaskId={selectedParentTaskId}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'COMPLETED': 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50/50',
    'ACTIVE': 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50/50',
    'PLANNING': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50/50',
    'ON_HOLD': 'text-orange-600 bg-orange-50 border-orange-100 shadow-orange-50/50',
  };
  return (
    <span className={cn(
      "px-4 py-1.5 border rounded-xl text-[10px] font-bold uppercase tracking-widest min-w-[110px] text-center inline-block shadow-sm font-display", 
      styles[status] || 'bg-slate-50 border-slate-100 text-slate-400'
    )}>
      {status}
    </span>
  );
}
