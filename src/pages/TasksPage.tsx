import { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { Task, UserProfile } from '../types';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MoreHorizontal,
  Clock,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  Shield,
  Activity,
  Maximize2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

import { APP_NAME } from '../constants';

import { TaskModal } from '../components/TaskModal';
import { Project } from '../types';

interface TasksPageProps {
  user: UserProfile;
}

export function TasksPage({ user }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isGroupCreation, setIsGroupCreation] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tasks');
      const projectsRaw = await api.get('/projects');
      
      const normalizedProjects = (Array.isArray(projectsRaw) ? projectsRaw : []).map((p: any) => ({
        ...p,
        id: String(p.id),
        name: p.name || 'Sans Nom',
        description: p.description || '',
        client: p.client || 'Client Inconnu',
        clientId: p.client_id ? String(p.client_id) : (p.clientId ? String(p.clientId) : ''),
        budget: typeof p.budget === 'string' ? parseFloat(p.budget) : (p.budget || 0),
        spent: typeof p.spent === 'string' ? parseFloat(p.spent) : (p.spent || 0),
        startDate: p.start_date || p.startDate || '',
        endDate: p.end_date || p.endDate || '',
        progress: p.progress_percentage !== undefined ? Number(p.progress_percentage) : (p.progress !== undefined ? Number(p.progress) : 0),
        priority: p.priority || 'MEDIUM',
        status: p.status || 'PLANNING',
        projectManagerId: p.manager_id ? String(p.manager_id) : (p.projectManagerId ? String(p.projectManagerId) : ''),
        teamMembers: Array.isArray(p.team_members) ? p.team_members.map(String) : (Array.isArray(p.teamMembers) ? p.teamMembers.map(String) : []),
        createdAt: p.created_at || p.createdAt || '',
        updatedAt: p.updated_at || p.updatedAt || ''
      }));

      const normalizedTasks = (Array.isArray(data) ? data : []).map((t: any) => {
        let progressVal = 0;
        if (t.progress !== undefined) {
          progressVal = Number(t.progress);
        } else if (t.progress_percentage !== undefined) {
          progressVal = Number(t.progress_percentage);
        } else {
          if (t.status === 'DONE') progressVal = 100;
          else if (t.status === 'IN_PROGRESS') progressVal = 45;
        }

        let startD = t.startDate || t.start_date || (t.project && (t.project.startDate || t.project.start_date)) || t.created_at?.split('T')[0] || '2026-01-01';
        let endD = t.endDate || t.end_date || t.due_date || (t.project && (t.project.endDate || t.project.end_date)) || t.due_date || '2026-12-31';

        let assigneeIdVal = '';
        if (t.assigneeId) {
          assigneeIdVal = String(t.assigneeId);
        } else if (t.assigned_to_user_id) {
          assigneeIdVal = String(t.assigned_to_user_id);
        }

        let assigneeNameVal = '';
        if (t.assignee) {
          if (typeof t.assignee === 'string') {
            assigneeNameVal = t.assignee;
          } else if (t.assignee.displayName) {
            assigneeNameVal = t.assignee.displayName;
          } else if (t.assignee.name) {
            assigneeNameVal = t.assignee.name;
          }
        }

        return {
          id: String(t.id),
          projectId: String(t.projectId || t.project_id || (t.project && t.project.id) || ''),
          lotId: t.lotId ? String(t.lotId) : (t.lot_id ? String(t.lot_id) : undefined),
          name: t.name || 'Sans nom',
          description: t.description || '',
          assigneeId: assigneeIdVal,
          assigneeName: assigneeNameVal,
          startDate: startD,
          endDate: endD,
          status: t.status === 'IN_PROGRESS' || t.status === 'ACTIVE' ? 'IN_PROGRESS' : (t.status || 'TODO'),
          priority: t.priority || 'MEDIUM',
          progress: progressVal,
          dependencies: Array.isArray(t.dependencies) ? t.dependencies.map(String) : [],
          comments: Array.isArray(t.comments) ? t.comments : [],
          attachments: Array.isArray(t.attachments) ? t.attachments : [],
          createdAt: t.createdAt || t.created_at || '',
          updatedAt: t.updatedAt || t.updated_at || '',
          estimatedHours: t.estimatedHours || t.estimated_hours || 0,
          actualHours: t.actualHours || t.actual_hours || 0,
          parentTaskId: t.parentTaskId || t.parent_task_id ? String(t.parentTaskId || t.parent_task_id) : undefined,
          parent_task_id: t.parent_task_id || t.parentTaskId ? String(t.parent_task_id || t.parentTaskId) : undefined,
        };
      });
      
      setTasks(normalizedTasks);
      setProjects(normalizedProjects);
      
      if (normalizedProjects.length > 0) {
        setSelectedProjectId('ALL');
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSuccess = () => {
    fetchAllTasks();
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesProject = !selectedProjectId || selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    return matchesSearch && matchesProject;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const onDragEnd = async (result: DropResult) => {
    if (user.role === 'CLIENT') return;
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => String(t.id) === String(draggableId));
    if (!task) return;

    const newStatus = destination.droppableId as any;
    
    // Optimistic update
    const updatedTasks = tasks.map(t => 
      String(t.id) === String(draggableId) ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await api.put(`/tasks/${String(draggableId)}`, { status: newStatus });
      toast.success(`Unité de travail mise à jour`, {
        description: `Le statut de "${task.name}" est passé à ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Échec de la mise à jour");
      // Revert on error
      setTasks(tasks);
    }
  };

  const columns = [
    { id: 'TODO', label: 'Backlog Opérationnel', color: 'bg-slate-300', icon: ListIcon },
    { id: 'IN_PROGRESS', label: 'En Cours d\'Exécution', color: 'bg-blue-500', icon: Activity },
    { id: 'REVIEW', label: 'Contrôle & Revue', color: 'bg-amber-400', icon: Shield },
    { id: 'DONE', label: 'Clôturé & Audité', color: 'bg-emerald-500', icon: CheckSquare },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                 <Shield size={16} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-display italic">Gestion Opérationnelle</p>
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter font-display uppercase">Unités de Travail</h1>
           <p className="hidden md:block text-slate-400 text-sm font-bold uppercase tracking-widest font-display italic">Suivi des tâches critiques du portefeuille {APP_NAME}.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setView('list')}
              className={cn("flex-1 sm:flex-none p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center", view === 'list' ? "bg-white text-blue-600 shadow-xl" : "text-slate-400 hover:bg-white hover:text-slate-900")}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={cn("flex-1 sm:flex-none p-2.5 rounded-2xl transition-all duration-300 inline-flex items-center justify-center gap-2 px-5", view === 'kanban' ? "bg-white text-blue-600 shadow-xl" : "text-slate-400 hover:bg-white hover:text-slate-900")}
            >
              <LayoutGrid size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest font-display">Kanban</span>
            </button>
          </div>
          {user.role !== 'CLIENT' && (
            <>
              <button 
                disabled={!selectedProjectId || selectedProjectId === 'ALL'}
                onClick={() => {
                  setIsGroupCreation(false);
                  setSelectedTask(null);
                  setIsModalOpen(true);
                }}
                className={cn(
                  "btn-primary w-full sm:w-auto px-6 py-4 shadow-blue-500/10 font-display text-[11px] tracking-widest justify-center gap-2",
                  (!selectedProjectId || selectedProjectId === 'ALL') && "opacity-40 cursor-not-allowed bg-slate-300 pointer-events-none hover:bg-slate-300 text-slate-500 border-none shadow-none"
                )}
              >
                <Plus size={16} />
                NOUVELLE TÂCHE
              </button>
              
              <button 
                disabled={!selectedProjectId || selectedProjectId === 'ALL'}
                onClick={() => {
                  setIsGroupCreation(true);
                  setSelectedTask(null);
                  setIsModalOpen(true);
                }}
                className={cn(
                  "w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display text-[11px] tracking-widest font-black uppercase rounded-[20px] transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200",
                  (!selectedProjectId || selectedProjectId === 'ALL') && "opacity-40 cursor-not-allowed bg-slate-50 pointer-events-none hover:bg-slate-50 text-slate-300 border-slate-100 shadow-none"
                )}
              >
                <LayoutGrid size={14} />
                NOUVEAU GROUPE
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="relative flex-1 group w-full">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
             <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Référence ID, Désignation..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[28px] font-bold text-[11px] text-slate-900 focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-display shadow-sm"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="relative group/prj flex-1 md:flex-none">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-slate-100 rounded-[28px] text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none transition-all font-display shadow-sm cursor-pointer"
            >
              <option value="ALL">TOUS LES PROJETS</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <p className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex-shrink-0">
             {filteredTasks.length} UNITÉS
          </p>
        </div>
      </div>

      {(!selectedProjectId || selectedProjectId === 'ALL') && (
        <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 shrink-0">
            <Filter size={14} />
          </div>
          <p className="text-[10px] sm:text-[11px] font-black text-amber-800/90 uppercase tracking-widest font-display">
            Sélectionnez un projet spécifique pour débloquer les boutons "Nouvelle Tâche" et "Nouveau Groupe".
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in duration-1000">
           <div className="relative">
              <div className="w-16 h-16 border-8 border-slate-50 rounded-full"></div>
              <div className="w-16 h-16 border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
           </div>
           <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display">Synchronisation du Flux Opérationnel</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Accès sécurisé au Grand Livre EPPM...</p>
           </div>
        </div>
      ) : view === 'list' ? (
        <div className="friendly-card overflow-hidden shadow-sm border-slate-200">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="w-24 px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center font-display italic">REFERENCE</th>
                     <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">DÉSIGNATION UNITÉ</th>
                     <th className="w-48 px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">CODE PORTEFEUILLE</th>
                     <th className="w-48 px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">ÉCHÉANCE AUDITÉ</th>
                     <th className="w-40 px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center font-display">STATUS G-SYNC</th>
                     <th className="w-20 px-8 py-5"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredTasks.filter((t) => !t.parent_task_id && !t.parentTaskId).flatMap((parentTask) => [parentTask, ...filteredTasks.filter(sub => String(sub.parent_task_id || sub.parentTaskId) === String(parentTask.id))]).map((task, idx, arr) => (
                     <tr key={task.id} className={cn("hover:bg-slate-50/50 transition-all group", task.parent_task_id || task.parentTaskId ? "bg-slate-50/40" : "")}>
                       <td className="px-8 py-6 text-center">
                          <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-bold text-slate-500 uppercase italic">
                            {(task.parent_task_id || task.parentTaskId) && <span className="mr-1 text-slate-400">↳</span>}
                            #{String(task.id).slice(0, 5)}
                          </div>
                       </td>
                       <td className={cn("px-8 py-6", task.parent_task_id || task.parentTaskId ? "pl-16" : "")}>
                          <p 
                            onClick={() => { if (user.role !== 'CLIENT') handleEditTask(task); }}
                            className={cn(
                              "text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors font-display cursor-pointer",
                              user.role === 'CLIENT' && "cursor-default group-hover:text-slate-900"
                            )}
                          >
                            {task.name}
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                             <PriorityBadge priority={task.priority} />
                             <div className="h-3 w-px bg-slate-200"></div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Audit ID: EQ-{String(task.id).slice(5,10).toUpperCase()}</span>
                             {(task.parentTaskId || task.parent_task_id) && (
                               <>
                                 <div className="h-3 w-px bg-slate-200"></div>
                                 <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase font-display select-none">
                                   Parent: {tasks.find(pt => String(pt.id) === String(task.parentTaskId || task.parent_task_id))?.name || 'Charge Principale'}
                                 </span>
                               </>
                             )}
                             {tasks.filter(t => String(t.parent_task_id || t.parentTaskId) === String(task.id)).length > 0 && (
                               <>
                                 <div className="h-3 w-px bg-slate-200"></div>
                                 <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase font-display select-none">
                                   {tasks.filter(t => String(t.parent_task_id || t.parentTaskId) === String(task.id)).length} sous-tâches
                                 </span>
                               </>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white">P</div>
                             <span className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-tighter">PRJ-{String(task.projectId).slice(0, 8).toUpperCase()}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3 text-[11px] font-extrabold text-slate-600 font-display">
                             <Calendar size={14} className="text-slate-300" />
                             {formatDate(task.endDate)}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <select
                            value={task.status}
                            disabled={user.role === 'CLIENT'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              api.put(`/tasks/${task.id}`, { status: newStatus }).then(() => fetchAllTasks());
                            }}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none appearance-none cursor-pointer text-center min-w-[100px]",
                              task.status === 'DONE' || task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                              task.status === 'IN_PROGRESS' || task.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                              task.status === 'REVIEW' || task.status === 'ON_HOLD' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
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
                          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90">
                             <MoreHorizontal size={20} />
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
           <div className="bg-slate-50/50 p-6 border-t border-slate-50 text-center flex items-center justify-center gap-4">
              <div className="h-px bg-slate-200 w-20"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">JOURNAL OPÉRATIONNEL CLOTURÉ</span>
              <div className="h-px bg-slate-200 w-20"></div>
           </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-8 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex flex-nowrap lg:grid lg:grid-cols-4 gap-8 items-start min-w-[1200px] lg:min-w-0">
              {columns.map(col => (
                <div key={col.id} className="w-[300px] lg:w-full min-h-[700px] flex flex-col space-y-6">
                  <div className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between shadow-sm group hover:border-blue-500 transition-all duration-500">
                     <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110", col.color)}>
                           <col.icon size={18} />
                        </div>
                        <div className="space-y-0.5">
                           <h4 className="font-black text-[10px] text-slate-900 uppercase tracking-widest font-display">{col.label}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Module G0</p>
                        </div>
                     </div>
                     <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-100 font-display italic">
                        {filteredTasks.filter(t => t.status === col.id).length}
                     </span>
                  </div>
                  
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "space-y-4 flex-1 transition-colors duration-200 rounded-[32px]",
                          snapshot.isDraggingOver ? "bg-slate-50/50" : ""
                        )}
                      >
                         {filteredTasks.filter(t => t.status === col.id).map((task, index) => (
                           /* @ts-ignore - Library types mismatch with React key prop */
                           <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                             {(provided, snapshot) => (
                               <div
                                 ref={provided.innerRef}
                                 {...provided.draggableProps}
                                 {...provided.dragHandleProps}
                                 style={{
                                   ...provided.draggableProps.style,
                                 }}
                                 className={cn(
                                   tasks.some(t => String(t.parent_task_id || t.parentTaskId) === String(task.id)) ? "border-blue-500 border-2 bg-gradient-to-br from-blue-50/50 to-white hover:ring-2 hover:ring-blue-500/20" : "border-slate-100 hover:border-blue-300 ring-1 ring-transparent hover:ring-blue-100",
                                   "bg-white p-6 rounded-[32px] border shadow-sm transition-all group relative overflow-hidden",
                                   user.role !== 'CLIENT' && "cursor-pointer",
                                   snapshot.isDragging ? "shadow-2xl ring-blue-500 rotate-2 scale-105 z-50" : ""
                                 )}
                                 onClick={() => { if (user.role !== 'CLIENT') handleEditTask(task); }}
                               >
                                  <div className="flex justify-between items-start mb-6">
                                     <PriorityBadge priority={task.priority} />
                                     <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all"><Maximize2 size={14} /></button>
                                  </div>
                                  <h5 className="text-[12px] font-black text-slate-900 uppercase leading-tight tracking-tight mb-2 group-hover:text-blue-600 transition-colors font-display">{task.name}</h5>
                                  
                                  {/* Parent and child links */}
                                  <div className="flex flex-col gap-1.5 mb-6">
                                    {(task.parentTaskId || task.parent_task_id) && (
                                      <div className="inline-flex items-center gap-1.5 text-[8px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded px-2 py-0.5 w-fit uppercase font-display">
                                        <span>Parent:</span>
                                        <span className="truncate max-w-[120px]">
                                          {tasks.find(pt => String(pt.id) === String(task.parentTaskId || task.parent_task_id))?.name || 'Charge Principale'}
                                        </span>
                                      </div>
                                    )}
                                    {tasks.filter(t => String(t.parent_task_id || t.parentTaskId) === String(task.id)).length > 0 && (
                                      <div className="inline-flex items-center gap-1.5 text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 w-fit uppercase font-display">
                                        <span>Groupe :</span>
                                        <span>{tasks.filter(t => String(t.parent_task_id || t.parentTaskId) === String(task.id)).length} sous-tâches</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                     <div className="flex items-center -space-x-2">
                                        <div className="w-8 h-8 rounded-2xl bg-slate-900 flex items-center justify-center text-[9px] font-black text-white uppercase ring-4 ring-white shadow-lg font-display italic">
                                           {user.displayName.charAt(0)}
                                        </div>
                                        <div className="w-8 h-8 rounded-2xl bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600 uppercase ring-4 ring-white shadow-lg font-display italic overflow-hidden">
                                           +2
                                        </div>
                                     </div>
                                     <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 font-display italic">
                                           <Calendar size={12} className="text-blue-400" />
                                           {formatDate(task.endDate)}
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest font-display">Unit-ID: {String(task.id).slice(0,8).toUpperCase()}</span>
                                     </div>
                                  </div>
                                  <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50/50 -rotate-45 translate-x-6 -translate-y-6 transition-transform group-hover:translate-x-4 group-hover:-translate-y-4"></div>
                               </div>
                             )}
                           </Draggable>
                         ))}
                         {provided.placeholder}
                         
                         {filteredTasks.filter(t => t.status === col.id).length === 0 && (
                           <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 gap-3 group/drop transition-all hover:border-blue-200 hover:bg-blue-50/30">
                              <Activity size={24} className="text-slate-100 group-hover/drop:text-blue-200 transition-colors" />
                              <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest font-display text-center px-8">Zone d'injection de flux vide</span>
                           </div>
                         )}
                      </div>
                    )}
                  </Droppable>
  
                  {user.role !== 'CLIENT' && (
                    <button className="w-full py-4 bg-white border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-[28px] hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-4 group/add font-display mt-auto shadow-sm">
                       <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center group-hover/add:bg-blue-100 group-hover/add:text-blue-600">
                          <Plus size={14} />
                       </div>
                       <span>Injecter Livrable G0</span>
                    </button>
                  )}
               </div>
             ))}
            </div>
          </div>
        </DragDropContext>
      )}
      {(selectedProject || projects[0]) && (
        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={selectedProject || projects[0]}
          task={selectedTask}
          onSuccess={handleTaskSuccess}
          isGroupCreation={isGroupCreation}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'DONE': 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50',
    'IN_PROGRESS': 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50',
    'TODO': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50',
    'BACKLOG': 'text-slate-400 bg-slate-50 border-slate-100 shadow-slate-50',
    'REVIEW': 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-50',
  };
  return (
    <span className={cn(
      "px-5 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest min-w-[110px] text-center shadow-sm font-display italic", 
      styles[status] || 'bg-slate-50 border-slate-100 text-slate-400'
    )}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    'CRITICAL': 'text-rose-600 border-rose-100 bg-rose-50 shadow-rose-50',
    'HIGH': 'text-amber-600 border-amber-100 bg-amber-50 shadow-amber-50',
    'MEDIUM': 'text-blue-600 border-blue-100 bg-blue-50 shadow-blue-50',
    'LOW': 'text-slate-400 border-slate-100 bg-slate-50 shadow-slate-50 outline-none',
  };
  return <span className={cn("px-4 py-1 border text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm font-display italic", styles[priority])}>{priority}</span>;
}
