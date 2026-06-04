import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { loadAllDataFromFirebase } from '../lib/firebase-sync';
import { generateProjectReportPDF } from '../lib/pdf-generator';
import { Project, UserProfile, ProjectStatus, ProjectPriority } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Grid,
  List as ListIcon,
  Columns,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  Shield,
  Activity,
  X,
  Trash2,
  Eye,
  Users
} from 'lucide-react';
import { cn, formatCurrency, formatDate, getClientName } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { LOGO_URL, APP_NAME } from '../constants';

interface ProjectListProps {
  user: UserProfile;
}

export function ProjectList({ user }: ProjectListProps) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch stats
      try {
        const statsData = await api.get('/projects/global/stats');
        setGlobalStats(statsData);
      } catch (err) {
        console.error("Failed to fetch global stats", err);
      }
      
      const data = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    try {
      setAllUsers(StorageService.getUsers());
    } catch(err) {
      console.warn("Failed to load users for quick assign", err);
    }
  }, [refreshTrigger]);

  const handleCreateProject = async (data: any) => {
    try {
      await api.post('/projects', data);
      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Erreur lors de la création du projet.");
    }
  };

  const handleUpdateStatus = async (projectId: string | number, newStatus: string) => {
    try {
      await api.put(`/projects/${projectId}`, { status: newStatus });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredProjects = projects.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    getClientName(p.client).toLowerCase().includes(search.toLowerCase())
  );

  const renderKanbanList = (status: string) => {
    const list = filteredProjects.filter(p => p.status === status);
    const statusLabels: Record<string, string> = {
      'PLANNING': 'PLANIFICATION',
      'ACTIVE': 'EN COURS',
      'ON_HOLD': 'EN PAUSE',
      'COMPLETED': 'TERMINÉ',
      'CANCELLED': 'ANNULÉ',
    };
    return (
      <div className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 min-w-[320px] max-w-[320px]">
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">{statusLabels[status] || status}</span>
          <span className="text-xs font-bold bg-white text-slate-400 px-3 py-1 rounded-xl shadow-sm border border-slate-100">{list.length}</span>
        </div>
        {list.map(project => (
          <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <PriorityBadge priority={project.priority || 'MEDIUM'} />
              <button 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Voir détails"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 leading-tight mb-2 font-display">{project.name}</h4>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={12} className="text-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.client?.company_name || project.client || 'Client N/D'}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 text-[10px]">
              <label className="text-slate-400 font-bold uppercase tracking-widest">Changer Statut:</label>
              <select 
                className="mt-1 w-full bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                value={project.status}
                disabled={user.role === 'CLIENT'}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleUpdateStatus(project.id, e.target.value)}
              >
                <option value="PLANNING">Planification</option>
                <option value="ACTIVE">En cours</option>
                <option value="COMPLETED">Terminé</option>
                <option value="ON_HOLD">En pause</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="h-0.5 w-10 bg-blue-600 rounded-full"></div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-display">Portefeuille Projets</p>
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display uppercase">Répertoire <span className="text-blue-600">Projets</span></h1>
           <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest italic">Gérez et suivez l'évolution de tous vos engagements sur {APP_NAME}.</p>
           
           {globalStats && (
             <div className="flex flex-wrap items-center gap-6 pt-4">
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display block mb-1">Chiffre d'Affaires Total</span>
                   <span className="text-2xl font-black text-slate-900">{formatCurrency(globalStats.total_chiffre_daffaire || 0)}</span>
                </div>
             </div>
           )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
            <button 
              onClick={() => setViewMode('table')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'table' ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'kanban' ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}
            >
              <Columns size={18} />
            </button>
          </div>
          {user.role !== 'CLIENT' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full sm:w-auto justify-center py-4 px-8"
            >
              <Plus size={20} /> Nouveau Projet
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative flex-1 group w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, client..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-transparent text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 font-display"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto p-1">
          <button className="flex-1 md:flex-none btn-secondary py-3 text-[10px]">
            <Filter size={14} /> Filtres
          </button>
          <button 
            onClick={() => generateProjectReportPDF(projects, StorageService.getTasks(), user.displayName)}
            className="flex-1 md:flex-none btn-secondary py-3 text-[10px] cursor-pointer"
          >
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
           <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-50 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-12 h-12 border-t-4 border-blue-600 rounded-full animate-spin"></div>
           </div>
           <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] font-display">Accès à la base de données...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'kanban' ? (
          <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start">
            {renderKanbanList('PLANNING')}
            {renderKanbanList('ACTIVE')}
            {renderKanbanList('ON_HOLD')}
            {renderKanbanList('COMPLETED')}
            {renderKanbanList('CANCELLED')}
          </div>
        ) : viewMode === 'table' ? (
          <div className="friendly-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="w-24 px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest font-display text-center">ID</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Projet & Priorité</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Maître d'Ouvrage</th>
                    <th className="w-64 px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Timeline & Progrès</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest font-display text-right w-[420px]">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProjects.map((project, idx) => (
                    <tr 
                      key={`${project.id}-${idx}`} 
                      className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <td className="px-8 py-6 text-center">
                         <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{String(project.id).slice(0, 4).toUpperCase()}</span>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</p>
                         <div className="mt-2">
                            <PriorityBadge priority={project.priority} />
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-sm font-bold text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-xl">{project.client?.company_name || project.client?.name || project.client || 'Client N/D'}</span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                  <Calendar size={14} />
                                  {formatDate(project.startDate)} → {formatDate(project.endDate)}
                               </p>
                               <span className="text-xs font-bold text-slate-900">{project.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                            {/* Manager Dropdown selector */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 relative hover:border-blue-400 hover:bg-white min-w-[140px] transition-all shadow-sm">
                               <Users size={12} className="text-slate-400 shrink-0" />
                               <select
                                 value={project.projectManagerId || project.manager_id || ''}
                                 disabled={user.role === 'CLIENT'}
                                 onChange={async (e) => {
                                   const newId = e.target.value;
                                   try {
                                     await api.put(`/projects/${project.id}`, { manager_id: newId, projectManagerId: newId });
                                     try {
                                       await api.post(`/projects/${project.id}/assign-manager`, { manager_id: newId });
                                     } catch (err) {}
                                     setRefreshTrigger(prev => prev + 1);
                                     toast.success("Chef de projet réaffecté !");
                                   } catch(err) {
                                     toast.error("Erreur d'affectation.");
                                   }
                                 }}
                                 className="w-full bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-3"
                                 title="Assigner un Manager"
                               >
                                 <option value="">-- Aucun --</option>
                                 {allUsers.filter(u => u.role !== 'CLIENT').map(u => (
                                   <option key={u.uid} value={u.uid}>{u.displayName}</option>
                                 ))}
                               </select>
                               <ChevronDown size={10} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>

                            {/* Status select dropdown */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 relative hover:border-teal-400 hover:bg-white min-w-[110px] transition-all shadow-sm">
                               <Activity size={12} className="text-slate-400 shrink-0" />
                               <select
                                 value={project.status}
                                 disabled={user.role === 'CLIENT'}
                                 onChange={async (e) => {
                                   const newS = e.target.value;
                                   try {
                                     const pData = projects.find(pr => pr.id === project.id);
                                     if (pData) {
                                       await api.put(`/projects/${project.id}`, {
                                         ...pData,
                                         status: newS
                                       });
                                       setRefreshTrigger(prev => prev + 1);
                                       toast.success("Statut mis à jour !");
                                     }
                                   } catch(err) {
                                     toast.error("Erreur de statut.");
                                   }
                                 }}
                                 className="w-full bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-3"
                                 title="Changer le statut"
                               >
                                 <option value="PLANNING">Planification</option>
                                 <option value="ACTIVE">En cours</option>
                                 <option value="ON_HOLD">En pause</option>
                                 <option value="COMPLETED">Terminé</option>
                                 <option value="CANCELLED">Annulé</option>
                               </select>
                               <ChevronDown size={10} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>

                            {/* Delete Button */}
                            {user.role !== 'CLIENT' && (
                              <button
                                onClick={(e) => {
                                   e.stopPropagation();
                                   setProjectToDelete(project);
                                }}
                                className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shrink-0 shadow-sm border border-rose-100 hover:scale-105 active:scale-95"
                                title="Supprimer définitivement"
                              >
                                 <Trash2 size={13} />
                              </button>
                            )}

                            {/* Details Button */}
                            <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 navigate(`/projects/${project.id}`);
                              }}
                              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shrink-0 shadow-sm border border-blue-100 hover:scale-105 active:scale-95"
                              title="Détails"
                            >
                               <Eye size={13} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50/50 px-4 md:px-8 py-4 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">
               <p>{filteredProjects.length} PROJETS ACTIFS</p>
               <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  <span className="flex items-center gap-2"><Activity size={12} className="text-blue-500" /> Progression moyenne: {(projects.reduce((a,b)=>a+b.progress,0)/projects.length || 0).toFixed(1)}%</span>
                  <span className="flex items-center gap-2"><Download size={12} className="text-emerald-500" /> Budget total: {formatCurrency(projects.reduce((a,b)=>a+b.budget,0))}</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, idx) => (
              <motion.div 
                key={`grid-${project.id}-${idx}`}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="friendly-card p-8 cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <StatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors font-display">
                   {project.name}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                   <Shield size={14} className="text-slate-300" />
                   {project.client?.company_name || project.client?.name || project.client || 'Client N/D'}
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display">
                    <span>Performance</span>
                    <span className="text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget</p>
                     <p className="text-sm font-bold text-slate-900 font-display">{formatCurrency(project.budget || 0)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Echéance</p>
                     <p className="text-sm font-bold text-slate-900 font-display">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                <div className="absolute top-0 right-0 p-3 translate-x-4 -translate-y-4 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                   <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                      <ArrowUpRight size={20} />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="friendly-card p-20 text-center space-y-4">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Search size={40} />
           </div>
           <p className="text-lg font-bold text-slate-900">Aucun résultat trouvé</p>
           <p className="text-slate-400 font-medium">Réessayez avec d'autres termes de recherche ou créez un nouveau projet.</p>
           <button onClick={() => setSearch('')} className="btn-secondary">Réinitialiser la recherche</button>
        </div>
      )}

      {/* Corporate Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-3xl md:rounded-[32px] shadow-2xl p-0 overflow-hidden h-full md:h-auto md:max-h-[95vh] flex flex-col border border-white"
            >
              <div className="px-6 py-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="space-y-1">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 font-display uppercase tracking-tight">Initialisation Projet</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ECOTRANSFO V6 Pipeline Setup</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                <ProjectForm 
                  onClose={() => setIsModalOpen(false)} 
                  onSubmit={handleCreateProject} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm box-border"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 md:p-8 overflow-hidden border border-slate-100 flex flex-col z-10"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
                    <Trash2 size={24} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase font-display tracking-tight">Confirmer la suppression ?</h3>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Cette action est définitive</p>
                 </div>
                 <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                    Voulez-vous vraiment supprimer définitivement le projet <span className="font-extrabold text-slate-900">"{projectToDelete.name}"</span> ?
                 </p>
              </div>

              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100 w-full">
                 <button 
                   onClick={() => setProjectToDelete(null)}
                   className="flex-1 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider font-display border border-slate-200 rounded-xl"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={async () => {
                     const pId = projectToDelete.id;
                     setProjectToDelete(null);
                     try {
                        await api.delete(`/projects/${pId}`);
                        setRefreshTrigger(prev => prev + 1);
                        toast.success("Projet supprimé définitivement !");
                     } catch (err) {
                        toast.error("Erreur durant la suppression.");
                     }
                   }}
                   className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-xs font-black uppercase text-white rounded-xl tracking-wider transition-all shadow-md shadow-rose-200 font-display"
                 >
                   Supprimer
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'ACTIVE': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'PLANNING': 'bg-blue-50 text-blue-600 border-blue-100',
    'COMPLETED': 'bg-slate-50 text-slate-600 border-slate-200',
    'ON_HOLD': 'bg-amber-50 text-amber-600 border-amber-100',
    'CANCELLED': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const labels: Record<string, string> = {
    'ACTIVE': 'EN COURS',
    'PLANNING': 'PLANIFICATION',
    'COMPLETED': 'TERMINÉ',
    'ON_HOLD': 'EN PAUSE',
    'CANCELLED': 'ANNULÉ',
  };

  return (
    <span className={cn(
      "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-xl inline-flex items-center justify-center min-w-[90px] font-display",
      styles[status] || 'bg-slate-50 text-slate-500 border-slate-100'
    )}>
      {labels[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    'CRITICAL': 'text-rose-600 border-rose-100 bg-rose-50',
    'HIGH': 'text-amber-600 border-amber-100 bg-amber-50',
    'MEDIUM': 'text-blue-600 border-blue-100 bg-blue-50',
    'LOW': 'text-slate-400 border-slate-100 bg-slate-50',
  };

  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 border rounded-xl flex items-center gap-2 w-fit font-display shadow-sm", styles[priority])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      {priority}
    </span>
  );
}

function ProjectForm({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    budget: '',
    start_date: '',
    end_date: '',
    description: '',
    priority: 'MEDIUM' as ProjectPriority,
    status: 'PLANNING' as ProjectStatus,
  });

  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    api.get('/clients').then(setClients).catch(console.error);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: Number(formData.budget),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Titre du Projet</label>
          <input 
            required 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none placeholder:text-slate-300"
            placeholder="Ex: Construction de la nouvelle unité G2"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Maître d'Ouvrage (Client)</label>
          <select 
            required 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none cursor-pointer"
            value={formData.client_id}
            onChange={e => {
              setFormData({
                ...formData,
                client_id: e.target.value
              });
            }}
          >
            <option value="">-- Choisir un client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.company_name || c.name} ({c.industry || 'Industrie'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Budget Alloué (MAD)</label>
          <input 
            required 
            type="number"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none placeholder:text-slate-300 font-mono"
            placeholder="500000"
            value={formData.budget}
            onChange={e => setFormData({...formData, budget: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Date de Lancement</label>
          <input 
            required 
            type="date"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
            value={formData.start_date}
            onChange={e => setFormData({...formData, start_date: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Echéance Finale</label>
          <input 
            required 
            type="date"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
            value={formData.end_date}
            onChange={e => setFormData({...formData, end_date: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Priorité Stratégique</label>
          <select 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none cursor-pointer appearance-none shadow-sm"
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: e.target.value as ProjectPriority})}
          >
            <option value="CRITICAL">CRITIQUE (P1)</option>
            <option value="HIGH">HAUTE (P2)</option>
            <option value="MEDIUM">MOYENNE (P3)</option>
            <option value="LOW">BASSE (P4)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Phase Initiale</label>
          <select 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none cursor-pointer appearance-none shadow-sm"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
          >
            <option value="PLANNING">PLANIFICATION</option>
            <option value="ACTIVE">EXÉCUTION ACTIVE</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-display">Périmètre & Descriptions</label>
          <textarea 
            rows={4}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none placeholder:text-slate-300 leading-relaxed"
            placeholder="Détaillez les objectifs et les contraintes..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-50">
        <button 
          type="button" 
          onClick={onClose}
          className="px-6 py-4 text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit"
          className="btn-primary px-12"
        >
          Valider & Créer
        </button>
      </div>
    </form>
  );
}
