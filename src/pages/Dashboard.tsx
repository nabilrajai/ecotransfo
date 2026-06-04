import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Layers,
  Target,
  ArrowUpRight,
  MoreVertical,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: UserProfile;
}

interface DashboardData {
    projects: { total: number; active: number; completed: number; avg_progress: number; total_budget: number };
    tasks: { total: number; pending: number; overdue: number; done: number };
    reclamations: { total: number; open: number; critical: any[] };
    notifications: { unread_count: number };
    recent_activity: any[];
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    client_id: '',
    project_id: ''
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const responseData = await api.get('/dashboard', activeFilters);
      setData(responseData);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', client_id: '', project_id: '' });
    // setTimeout(() => fetchDashboardData(), 0); // we can trigger it or let the user click apply
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
       <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin"></div>
       </div>
       <div className="text-center">
          <p className="text-lg font-bold text-slate-900 font-display text-center">Synchronisation en cours</p>
          <p className="text-sm text-slate-400 font-medium text-center">Récupération des indicateurs de performance...</p>
       </div>
    </div>
  );

  if (!data || !data.projects) return <div className="p-8 text-center text-slate-500">Erreur lors du chargement des données. L'API n'a pas renvoyé le format attendu.</div>;

  const stats = [
    { label: "Projets (Total)", value: data.projects?.total || 0, trend: "", icon: Layers, color: "bg-blue-600" },
    { label: "Projets Actifs", value: data.projects?.active || 0, trend: "", icon: Layers, color: "bg-blue-500" },
    { label: "Projets Complétés", value: data.projects?.completed || 0, trend: "", icon: CheckCircle2, color: "bg-emerald-600" },
    { label: "Budget Total", value: data.projects?.total_budget || 0, isCurrency: true, trend: "", icon: Target, color: "bg-amber-500" },
    { label: "Progression Moy.", value: `${data.projects?.avg_progress || 0}%`, trend: "", icon: Activity, color: "bg-indigo-500" },
    { label: "Tâches (Total)", value: data.tasks?.total || 0, trend: "", icon: Layers, color: "bg-slate-600" },
    { label: "Tâches En Attente", value: data.tasks?.pending || 0, trend: "", icon: Clock, color: "bg-amber-500" },
    { label: "Tâches En Retard", value: data.tasks?.overdue || 0, trend: "", icon: Clock, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <div className="h-0.5 w-10 bg-blue-600 rounded-full"></div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest font-display">Vue d'ensemble du Portefeuille</p>
           </div>
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">Tableau de <span className="text-blue-600">Pilotage</span></h1>
           <p className="text-slate-500 font-medium text-base">Ravi de vous revoir, <span className="text-slate-900 font-bold">{user.displayName}</span>. Voici l'état de vos projets.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             className={cn("btn-secondary", showFilters ? "bg-slate-200" : "")} 
             onClick={() => setShowFilters(!showFilters)}
           >
              <Filter size={18} /> Filtrer
           </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">Date de début</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">Date de fin</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">ID Client</label>
              <input
                type="text"
                placeholder="Ex: 5"
                value={filters.client_id}
                onChange={(e) => setFilters(prev => ({ ...prev, client_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">ID Projet</label>
              <input
                type="text"
                placeholder="Ex: 12"
                value={filters.project_id}
                onChange={(e) => setFilters(prev => ({ ...prev, project_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              Réinitialiser
            </button>
            <button onClick={handleApplyFilters} className="btn-primary py-2 px-6">
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label} 
            className="friendly-card p-6 group"
          >
            <div className="flex justify-between items-start mb-6">
               <div className={cn("p-4 rounded-2xl text-white shadow-lg", stat.color)}>
                  <stat.icon size={22} />
               </div>
               {stat.trend && (
                 <div className="text-right">
                    <span className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600 mb-1">
                       <ArrowUpRight size={14} /> {stat.trend}
                    </span>
                 </div>
               )}
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 font-display">{stat.label}</p>
               <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none font-display">
                  {stat.isCurrency ? formatCurrency(stat.value as number) : stat.value}
               </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Performance Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <section className="friendly-card overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-3">
                  <TrendingUp size={24} className="text-blue-500" />
                  Activités Récentes
               </h3>
               <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={20} className="text-slate-400" /></button>
            </div>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="p-8">
                    {data.recent_activity && data.recent_activity.length > 0 ? (
                        <div className="space-y-6">
                            {data.recent_activity.map((activity, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-110 transition-all">
                                            <Activity size={16} className="text-blue-500" />
                                        </div>
                                        {i !== data.recent_activity.length - 1 && <div className="w-px flex-1 bg-slate-100 my-2"></div>}
                                    </div>
                                    <div className="pt-1 pb-4">
                                        <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{activity.action}</p>
                                        <p className="text-sm text-slate-500 mt-1">{activity.details}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{activity.user?.name || activity.userName || 'Système'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic text-center py-8">Aucune activité récente.</p>
                    )}
                </div>
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
           <section className="friendly-card p-8 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-3">
                    <Target size={24} className="text-indigo-500" />
                    Réclamations
                 </h3>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest font-display text-[10px]">Total Enregistr.</span>
                    <span className="text-xl font-black text-slate-900">{data.reclamations?.total || 0}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest font-display text-[10px]">En Cours</span>
                    <span className="text-xl font-black text-amber-600">{data.reclamations?.open || 0}</span>
                 </div>
                 {data.reclamations?.critical && data.reclamations.critical.length > 0 && (
                     <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                         <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-widest text-[10px]">Attention Requise</p>
                         <p className="text-sm text-red-700 font-medium">{data.reclamations.critical.length} réclamation(s) critique(s) en attente de résolution.</p>
                     </div>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
