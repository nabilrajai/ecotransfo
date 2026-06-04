import { Project } from '../../types';
import { Users, UserPlus, Mail, Phone, Shield, Activity, Target, Zap, Trash2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function ProjectResources({ project, user, onRefresh }: { project: any; user?: any; onRefresh?: () => void }) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssigneeUid, setSelectedAssigneeUid] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const usersList = await api.get('/users');
        setAllUsers(usersList);
      } catch (err) {
        console.error("Error loading users list:", err);
      }
    }
    loadUsers();
  }, []);

  const resources = project?.resources || [];

  const handleDelete = async (id: string, name: string) => {
    const isManager = id === project?.projectManagerId || id === project?.manager_id;
    if (isManager) {
      toast.warning("Le Chef de Projet ne peut pas être retiré des ressources de cette manière. Pour changer de responsable de projet, utilisez le menu principal.");
      return;
    }

    if (window.confirm(`Voulez-vous vraiment retirer la ressource "${name}" de ce projet ?`)) {
      try {
        const currentMembers = project?.teamMembers || project?.team_members || [];
        const updatedMembers = currentMembers.filter((mId: string) => String(mId) !== String(id));
        
        await api.put(`/projects/${project?.id}`, { team_members: updatedMembers });
        toast.success(`La ressource "${name}" a été retirée du projet !`);
        onRefresh?.();
      } catch (err) {
        toast.error("Erreur durant le retrait de la ressource.");
      }
    }
  };

  const handleAssignResource = async () => {
    if (!selectedAssigneeUid) {
      toast.error("Veuillez sélectionner un collaborateur.");
      return;
    }

    const selectedEmployee = allUsers.find(u => String(u.uid) === String(selectedAssigneeUid));
    const name = selectedEmployee ? selectedEmployee.displayName : "Collaborateur";

    try {
      const currentMembers = project?.teamMembers || project?.team_members || [];
      if (currentMembers.map(String).includes(String(selectedAssigneeUid))) {
        toast.error("Cet utilisateur fait déjà partie des membres affectés.");
        return;
      }
      const updatedMembers = [...currentMembers, selectedAssigneeUid];

      await api.put(`/projects/${project?.id}`, { team_members: updatedMembers });
      toast.success(`${name} a été affecté à ce projet et synchronisé !`);
      setIsAssignModalOpen(false);
      setSelectedAssigneeUid('');
      onRefresh?.();
    } catch (err) {
      toast.error("Erreur lors de l'affectation de la ressource.");
    }
  };

  const filteredResources = resources.filter((res: any) => 
    (res.name || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (res.role || '').toLowerCase().includes((search || '').toLowerCase())
  );

  // Filter unassigned users
  const unassignedUsers = allUsers.filter(u => 
    String(u.uid) !== String(project?.projectManagerId) &&
    String(u.uid) !== String(project?.manager_id) &&
    !(project?.teamMembers || []).map(String).includes(String(u.uid)) &&
    !(project?.team_members || []).map(String).includes(String(u.uid))
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
        <div className="friendly-card shadow-sm border-slate-100 relative items-center flex flex-1 group overflow-hidden bg-white ring-1 ring-slate-100">
          <input 
            type="text" 
            placeholder="Rechercher une ressource par nom ou rôle..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-4 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-300 font-display"
          />
        </div>
        <div className="flex items-center gap-4">
           {user?.role !== 'CLIENT' && (
             <button 
               onClick={() => setIsAssignModalOpen(true)}
               className="btn-primary py-4 px-8 shadow-blue-500/10 border-blue-400 group/btn"
             >
               <UserPlus size={18} className="group-hover/btn:rotate-12 transition-transform" />
               <span>Nouvelle Affectation</span>
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence>
          {filteredResources.map((res: any, idx: number) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              key={res.id} 
              className="friendly-card p-10 hover:border-blue-500 group relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="absolute top-6 right-6">
                 <span className={cn(
                   "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border rounded-full font-display shadow-sm",
                   res.status === 'Surcharge' 
                     ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' 
                     : res.status === 'Congés' 
                       ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50'
                       : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50'
                 )}>
                   {res.status}
                 </span>
              </div>

              <div className="relative mb-8">
                 <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-3xl font-black text-white shadow-2xl group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 relative border-4 border-white ring-1 ring-slate-100">
                   <span className="font-display font-black tracking-tighter">{res.avatar}</span>
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
                 </div>
                 <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
              </div>

              <div className="space-y-1 relative z-10 w-full mb-8">
                 <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight font-display">{res.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic">{res.role}</p>
                 {res.email && <p className="text-[10px] font-medium text-slate-400 italic truncate max-w-full font-mono">{res.email}</p>}
              </div>
              
              <div className="w-full space-y-4 mb-10 pt-8 border-t border-slate-50 relative z-10">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
                      <Activity size={12} className="text-blue-400" /> Charge de travail
                   </span>
                   <span className={cn(
                     "text-sm font-bold font-display",
                     res.load > 90 ? "text-rose-500" : res.load > 70 ? "text-amber-500" : "text-emerald-500"
                   )}>{res.load}%</span>
                 </div>
                 <div className="h-3 bg-slate-100/50 rounded-full overflow-hidden shadow-inner relative">
                   <div 
                     className={cn(
                       "h-full transition-all duration-1500 ease-out relative z-10 rounded-full",
                       res.load > 90 ? "bg-rose-500" : res.load > 70 ? "bg-amber-500" : "bg-emerald-500 shadow-emerald-200 shadow-lg"
                     )}
                     style={{ width: `${res.load}%` }}
                   >
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[size:16px_16px] animate-[stripe_1.5s_linear_infinite]"></div>
                   </div>
                 </div>
              </div>

              <div className="flex items-center justify-center gap-3 w-full">
                <a href={`mailto:${res.email || ''}`} className="flex-1 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-all flex items-center justify-center shadow-sm"><Mail size={18} /></a>
                {user?.role !== 'CLIENT' && (
                  <button 
                    onClick={() => handleDelete(res.id, res.name)}
                    className="flex-1 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 transition-all flex items-center justify-center shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <a href={`tel:${res.phone || ''}`} title={res.phone} className="flex-1 h-12 rounded-2xl bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all flex items-center justify-center shadow-sm hover:shadow-blue-200"><Zap size={18} /></a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Assignment Modal dialog */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 md:p-8 overflow-hidden border border-slate-100 flex flex-col z-10"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight font-display">Affectation Ressource</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-display">Opérations de déploiement</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center border border-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Sélectionner un Collaborateur</label>
                  {unassignedUsers.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-400 text-xs font-medium rounded-xl text-center border border-dashed border-slate-200">
                      Tous les collaborateurs sont déjà affectés à ce projet.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedAssigneeUid}
                        onChange={(e) => setSelectedAssigneeUid(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none transition-all shadow-sm"
                      >
                        <option value="">-- Choisir un collaborateur --</option>
                        {unassignedUsers.map(user => (
                          <option key={user.uid} value={user.uid}>
                            {user.displayName} ({user.role || 'Collaborateur'}) - {user.department || 'Ingénierie'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Users size={14} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      setSelectedAssigneeUid('');
                    }}
                    className="flex-1 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider font-display border border-slate-200 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleAssignResource}
                    disabled={!selectedAssigneeUid}
                    className={cn(
                      "flex-1 py-3.5 text-xs font-black uppercase text-white rounded-xl tracking-wider transition-all shadow-md font-display flex items-center justify-center gap-2",
                      selectedAssigneeUid 
                        ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-95 cursor-pointer" 
                        : "bg-slate-200 shadow-none cursor-not-allowed text-slate-400"
                    )}
                  >
                    <Check size={14} />
                    Valider l'affectation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
