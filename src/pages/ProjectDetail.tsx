import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { Project, Task, UserProfile, Lot } from '../types';
import { 
  ChevronLeft, 
  Calendar, 
  Target, 
  Users, 
  DollarSign, 
  FileText, 
  CheckSquare, 
  Layers,
  Clock,
  Shield,
  Activity,
  ArrowUpRight,
  Filter,
  Download,
  Trash2,
  Table
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Tab Components
import { ProjectOverview } from './project-details/ProjectOverview';
import { ProjectPlanning } from './project-details/ProjectPlanning';
import { ProjectTasks } from './project-details/ProjectTasks';
import { ProjectResources } from './project-details/ProjectResources';
import { ProjectBudget } from './project-details/ProjectBudget';
import { ProjectDocuments } from './project-details/ProjectDocuments';
import { ProjectBaselineTable } from './project-details/ProjectBaselineTable';

interface ProjectDetailProps {
  user: UserProfile;
}

const TABS = [
  { id: 'overview', label: 'Audit & Revue', icon: Activity },
  { id: 'planning', label: 'Echéancier', icon: Layers },
  { id: 'tasks', label: 'Lots de Travail', icon: CheckSquare },
  { id: 'resources', label: 'Ressources', icon: Users },
  { id: 'budget', label: 'Finance', icon: DollarSign },
  { id: 'documents', label: 'GED', icon: FileText },
  { id: 'baseline', label: 'Tableau Baseline', icon: Table },
];

export function ProjectDetail({ user }: ProjectDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any | null>(null);
  const [kpis, setKpis] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.get(`/projects/${id}`);
        if (data.project) {
          const rawP = data.project;
          const normalizedP = {
            ...rawP,
            id: String(rawP.id),
            name: rawP.name || 'Sans Nom',
            description: rawP.description || '',
            client: rawP.client || 'Client Inconnu',
            clientId: rawP.client_id ? String(rawP.client_id) : (rawP.clientId ? String(rawP.clientId) : ''),
            budget: typeof rawP.budget === 'string' ? parseFloat(rawP.budget) : (rawP.budget || 0),
            spent: typeof rawP.spent === 'string' ? parseFloat(rawP.spent) : (rawP.spent || 0),
            startDate: rawP.start_date || rawP.startDate || '',
            endDate: rawP.end_date || rawP.endDate || '',
            progress: rawP.progress_percentage !== undefined ? Number(rawP.progress_percentage) : (rawP.progress !== undefined ? Number(rawP.progress) : 0),
            priority: rawP.priority || 'MEDIUM',
            status: rawP.status || 'PLANNING',
            projectManagerId: rawP.manager_id ? String(rawP.manager_id) : (rawP.projectManagerId ? String(rawP.projectManagerId) : ''),
            teamMembers: Array.isArray(rawP.team_members) ? rawP.team_members.map(String) : (Array.isArray(rawP.teamMembers) ? rawP.teamMembers.map(String) : []),
            createdAt: rawP.created_at || rawP.createdAt || '',
            updatedAt: rawP.updated_at || rawP.updatedAt || ''
          };
          setProject(normalizedP);
          setKpis(data.kpis);

          const rawTasks = rawP.tasks || [];
          const normalizedTasks = rawTasks.map((t: any) => {
            let progressVal = 0;
            if (t.progress !== undefined) {
              progressVal = Number(t.progress);
            } else if (t.progress_percentage !== undefined) {
              progressVal = Number(t.progress_percentage);
            } else {
              if (t.status === 'DONE') progressVal = 100;
              else if (t.status === 'IN_PROGRESS') progressVal = 45;
            }

            let startD = t.startDate || t.start_date || t.created_at?.split('T')[0] || normalizedP.startDate || '2026-01-01';
            let endD = t.endDate || t.end_date || t.due_date || normalizedP.endDate || '2026-12-31';

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
              projectId: String(t.projectId || t.project_id || normalizedP.id),
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
              parent_task_id: t.parent_task_id || t.parentTaskId || undefined,
            };
          });
          setTasks(normalizedTasks);

          const rawLots = rawP.lots || [];
          const normalizedLots = rawLots.map((l: any) => ({
            ...l,
            id: String(l.id),
            projectId: String(l.projectId || l.project_id || normalizedP.id),
            name: l.name || '',
            description: l.description || '',
            startDate: l.start_date || l.startDate || normalizedP.startDate || '2026-01-01',
            endDate: l.end_date || l.endDate || normalizedP.endDate || '2026-12-31',
            status: l.status || 'PLANNING',
            progress: l.progress_percentage !== undefined ? Number(l.progress_percentage) : (l.progress !== undefined ? Number(l.progress) : 0),
          }));
          setLots(normalizedLots);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, refreshTrigger]);

  const refreshData = () => {
     setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le projet "${project.name}" ? Tous les lots, documents et communications associés seront perdus.`)) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects');
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-50 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin"></div>
       </div>
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Extraction des données critiques...</p>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
         <Shield size={40} />
      </div>
      <div className="text-center space-y-2">
         <p className="text-xl font-bold text-slate-900 font-display">Projet Introuvable</p>
         <p className="text-slate-500 font-medium max-w-xs mx-auto">L'identifiant du projet est invalide ou vous ne disposez pas des droits d'accès nécessaires.</p>
      </div>
      <Link to="/projects" className="btn-primary">Retour au Répertoire</Link>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Executive Header */}
      <div className="friendly-card overflow-hidden">
         <div className="bg-slate-50/50 border-b border-slate-100 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 md:gap-6">
               <Link to="/projects" className="text-slate-400 hover:text-blue-600 transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <ChevronLeft size={16} /> <span className="hidden sm:inline">Retour</span>
               </Link>
               <div className="h-4 w-px bg-slate-200"></div>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display truncate max-w-[150px] md:max-w-none">Temps réel</span>
               </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
               <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg md:rounded-xl transition-all shadow-sm">
                  <Download size={16} />
               </button>
               {user.role !== 'CLIENT' && (
                 <button 
                   onClick={handleDeleteProject}
                   className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg md:rounded-xl transition-all shadow-sm"
                 >
                    <Trash2 size={16} />
                 </button>
               )}
            </div>
         </div>
         
         <div className="p-6 md:p-10">
            <div className="flex flex-col lg:flex-row justify-between gap-8 md:gap-12">
               <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center lg:items-start max-w-4xl">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-[28px] md:rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl border-4 border-white group">
                     <span className="text-white font-display font-black text-2xl md:text-3xl tracking-tighter group-hover:scale-110 transition-transform">{project.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                     <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <StatusBadge status={project.status} />
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">#{String(project.id).slice(0, 8)}</span>
                     </div>
                     <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">{project.name}</h1>
                     <div className="flex flex-wrap items-center gap-3 md:gap-6">
                        <span className="text-[11px] md:text-sm font-bold text-slate-500">
                           Client: <span className="text-slate-900 font-extrabold">{project.client?.company_name || project.client?.name || project.client || 'Client N/D'}</span>
                        </span>
                        <div className="hidden md:block w-1.5 h-1.5 bg-blue-200 rounded-full"></div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Opérations G0</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 lg:flex items-center gap-6 md:gap-10 border-t border-slate-100 md:border-t-0 pt-6 md:pt-0">
                  <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Investissement</span>
                     <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">{formatCurrency(project.budget || 0)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Echéance</span>
                     <div className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">{formatDate(project.endDate)}</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                           <Clock size={16} />
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col min-w-[180px] gap-2">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Progression Globale</span>
                        <span className="text-sm font-bold text-blue-600 font-display">{project.progress || 0}%</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${project.progress || 0}%` }}></div>
                     </div>
                  </div>
                  <button className="btn-primary py-5 px-8 shadow-blue-200">
                     <ArrowUpRight size={20} />
                     <span>Actions</span>
                  </button>
               </div>
            </div>

            {/* Navigation Bar */}
            <div className="mt-8 md:mt-12 flex items-center bg-slate-50/50 rounded-3xl md:rounded-[40px] border border-slate-200/60 p-1.5 overflow-x-auto no-scrollbar shadow-inner -mx-4 md:mx-0 px-4 md:px-1.5">
               <div className="flex items-center gap-1.5 md:gap-2">
                  {TABS.map((tab) => {
                     const isActive = activeTab === tab.id;
                     return (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={cn(
                              "flex items-center gap-2 md:gap-3 px-5 md:px-8 py-3 md:py-3.5 rounded-2xl md:rounded-[32px] text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap font-display",
                              isActive 
                                 ? "bg-white text-blue-600 shadow-xl shadow-blue-100 ring-1 ring-slate-100" 
                                 : "text-slate-400 hover:text-slate-900 hover:bg-white/50"
                           )}
                        >
                           <tab.icon size={16} className={cn(isActive ? "text-blue-500" : "text-slate-300")} />
                           {tab.label}
                        </button>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>

      {/* Module Content Area */}
      <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {activeTab === 'overview' && <ProjectOverview project={project} tasks={tasks} lots={lots} />}
            {activeTab === 'planning' && <ProjectPlanning project={project} tasks={tasks} lots={lots} />}
            {activeTab === 'tasks' && <ProjectTasks project={project} tasks={tasks} lots={lots} user={user} onRefresh={refreshData} />}
            {activeTab === 'resources' && <ProjectResources project={project} onRefresh={refreshData} />}
            {activeTab === 'budget' && <ProjectBudget project={project} />}
            {activeTab === 'documents' && <ProjectDocuments project={project} />}
            {activeTab === 'baseline' && <ProjectBaselineTable project={project} tasks={tasks} lots={lots} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'ACTIVE': 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100',
    'PLANNING': 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100',
    'COMPLETED': 'bg-slate-50 text-slate-600 border-slate-200 shadow-slate-100',
    'ON_HOLD': 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100',
    'CANCELLED': 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100',
  };

  return (
    <span className={cn(
      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-[14px] shadow-sm font-display",
      styles[status] || 'bg-slate-50 text-slate-500 border-slate-100'
    )}>
      {status}
    </span>
  );
}
