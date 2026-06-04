import { useEffect, useState, FormEvent } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { UserProfile, Project } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone,
  ArrowUpRight,
  UserPlus,
  Shield,
  Activity,
  Target,
  Briefcase,
  X,
  Plus,
  Link2,
  Calendar,
  Layers,
  CheckCircle,
  FileText
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export function ResourcesPage({ user }: { user: UserProfile }) {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'OWNER' | 'PROJECT_MANAGER' | 'EMPLOYEE' | 'HR' | 'FINANCE' | 'CLIENT'>('EMPLOYEE');
  const [newDepartment, setNewDepartment] = useState('');

  // Selected User Detail Modal / Drawer state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignRole, setAssignRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE');

  const loadData = async () => {
    try {
      setEmployees(StorageService.getUsers());
      const projectsData = await api.get('/projects');
      setAllProjects(projectsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const term = (search || '').toLowerCase();
    return (
      (emp.displayName || '').toLowerCase().includes(term) ||
      (emp.email || '').toLowerCase().includes(term) ||
      (emp.department || '').toLowerCase().includes(term) ||
      (emp.role || '').toLowerCase().includes(term)
    );
  });

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newDisplayName || !newEmail) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    const newUser: UserProfile = {
      uid: 'user-' + Math.random().toString(36).substr(2, 9),
      email: newEmail,
      displayName: newDisplayName,
      role: newRole,
      department: newDepartment || 'Technique',
      createdAt: new Date().toISOString(),
      lastLogin: ''
    };

    StorageService.saveUserProfile(newUser);
    StorageService.addActivityLog(
      user.uid,
      'Création utilisateur',
      `Création du compte de ${newUser.displayName} avec le rôle ${newUser.role}.`
    );

    toast.success(`Le compte de ${newUser.displayName} (${newUser.role}) a été créé !`);
    setIsCreateModalOpen(false);
    
    // Reset fields
    setNewDisplayName('');
    setNewEmail('');
    setNewRole('EMPLOYEE');
    setNewDepartment('');
    
    loadData();
  };

  const handleSelectUser = async (emp: UserProfile) => {
    setSelectedUser(emp);
    
    // Load this user's activity logs
    const logs = StorageService.getActivityLogs().filter(log => log.userId === emp.uid);
    setUserLogs(logs);

    // Refresh all projects first to guarantee up-to-date states
    try {
      const projectsList = allProjects.filter(p => 
        p.projectManagerId === emp.uid || 
        p.manager_id === emp.uid ||
        (p.teamMembers && p.teamMembers.includes(emp.uid)) ||
        (p.team_members && p.team_members.includes(emp.uid))
      );
      setUserProjects(projectsList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !assignProjectId || !allProjects) return;

    const projectId = assignProjectId;
    const targetProject = allProjects.find(p => String(p.id) === String(projectId));
    
    if (!targetProject) {
      toast.error('Projet inexistant.');
      return;
    }

    try {
      if (assignRole === 'MANAGER') {
        const payload = { 
          manager_id: selectedUser.uid, 
          projectManagerId: selectedUser.uid 
        };
        await api.put(`/projects/${targetProject.id}`, payload);
        
        try {
          await api.post(`/projects/${targetProject.id}/assign-manager`, { manager_id: selectedUser.uid });
        } catch (e) {
          console.log("Custom manager endpoint not present or unnecessary, general update handler handled assignment.");
        }

        StorageService.addActivityLog(
          user.uid,
          'Sûreté d\'affectation',
          `Projet "${targetProject.name}" assigné au Chef de Projet ${selectedUser.displayName}.`
        );
        toast.success(`Le projet "${targetProject.name}" est désormais managé par ${selectedUser.displayName}.`);
      } else {
        const currentMembers = targetProject.team_members || targetProject.teamMembers || [];
        if (currentMembers.includes(selectedUser.uid)) {
          toast.warning('Cet utilisateur fait déjà partie des membres de ce projet.');
          return;
        }

        const updatedMembers = [...currentMembers, selectedUser.uid];
        const payload = { 
          team_members: updatedMembers, 
          teamMembers: updatedMembers 
        };
        await api.put(`/projects/${targetProject.id}`, payload);

        StorageService.addActivityLog(
          user.uid,
          'Assignation Projet',
          `Projet "${targetProject.name}" rattaché à l'utilisateur ${selectedUser.displayName}.`
        );
        toast.success(`Le projet "${targetProject.name}" a été associé.`);
      }

      setAssignProjectId('');
      
      // Reload everything
      const freshProjects = await api.get('/projects');
      setAllProjects(freshProjects);
      
      const pList = freshProjects.filter((p: any) => 
        p.projectManagerId === selectedUser.uid || 
        p.manager_id === selectedUser.uid ||
        (p.teamMembers && p.teamMembers.includes(selectedUser.uid)) ||
        (p.team_members && p.team_members.includes(selectedUser.uid))
      );
      setUserProjects(pList);
      loadData();
    } catch (e: any) {
      toast.error('Erreur lors de l\'association: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in duration-1000">
         <div className="relative">
            <div className="w-16 h-16 border-8 border-slate-50 rounded-full shadow-inner"></div>
            <div className="w-16 h-16 border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
         </div>
         <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display">Initialisation des Ressources Critiques</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Matrice des Compétences • EcoTransfo EPPM</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                 <Users size={16} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-display italic">Gestion IAM & Journal d'Audit • EcoTransfo G0</p>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-display uppercase">Capital <span className="text-blue-600 italic">Humain</span></h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest font-display italic">Créez des accès collaborateurs/clients et gérez les rôles d'équipe</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary px-8 py-4 shadow-blue-500/10 font-display text-[11px] tracking-widest whitespace-nowrap"
        >
          <UserPlus size={20} />
          CRÉER UN ACCÈS UTILISATEUR
        </button>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <ResourceStat label="Accès configurés" value={employees.length} icon={Shield} color="bg-slate-900" />
        <ResourceStat label="Collaborateurs internes" value={employees.filter(e => e.role !== 'CLIENT').length} icon={Briefcase} color="bg-blue-600" />
        <ResourceStat label="Comptes Clients externes" value={employees.filter(e => e.role === 'CLIENT').length} icon={Target} color="bg-emerald-500" />
        <ResourceStat label="Dernières Actions auditées" value={StorageService.getActivityLogs().length} icon={Activity} color="bg-orange-500" />
      </div>

      {/* Main Data Grid */}
      <div className="friendly-card p-1 bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col group">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
           <div className="relative flex-1 max-w-xl group/search">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-blue-600 transition-colors" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rôle, Nom, Email ou Département..." 
                className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none text-[11px] font-bold text-slate-900 uppercase tracking-widest focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300 placeholder:italic font-display shadow-sm"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-display">
             <thead>
               <tr>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Identité & Matrice</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Email d'enteprise</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Unité d'Affectation</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Date d'embauche / création</th>
                 <th className="px-8 py-6 border-b border-slate-50"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredEmployees.map((emp, idx) => (
                  <tr 
                   key={`${emp.uid}-${idx}`} 
                  onClick={() => handleSelectUser(emp)}
                  className="hover:bg-slate-50/70 transition-all group/row cursor-pointer"
                 >
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover/row:bg-slate-900 group-hover/row:text-white group-hover/row:scale-105 transition-all shadow-sm relative overflow-hidden",
                            emp.role === 'CLIENT' ? "bg-emerald-50 text-emerald-600" : ""
                          )}>
                             {emp.displayName?.charAt(0) || 'U'}
                          </div>
                          <div className="space-y-1">
                             <p className="font-extrabold text-slate-900 text-sm uppercase tracking-tight group-hover/row:text-blue-600 transition-colors leading-tight">{emp.displayName}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Poste :</span>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                  emp.role === 'CLIENT' ? "bg-emerald-100 text-emerald-800" :
                                  emp.role === 'OWNER' ? "bg-slate-900 text-slate-100" :
                                  "bg-blue-55 text-blue-600 font-bold bg-blue-50"
                                )}>{emp.role}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs font-mono font-bold text-slate-600">{emp.email}</span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{emp.department || 'EcoTransfo Standard'}</span>
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                       {emp.createdAt ? formatDate(emp.createdAt) : 'Initiale'}
                    </td>
                    <td className="px-8 py-5 text-right text-xs font-bold text-blue-600 uppercase tracking-widest group-hover/row:translate-x-1 duration-250">
                       Suivi & Logs →
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/50 flex items-center justify-center gap-6">
           <Activity size={16} className="text-blue-500 animate-pulse" />
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">EPPM Human Capital Ledger v4.2 • Real-time Sync Active</p>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          
          <div className="bg-white rounded-[32px] max-w-lg w-full p-8 p-md-10 relative z-10 shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6 space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">Créer un Accès plateforme</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Déclarer un nouveau profil collaborateur ou client</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom & Prénom / Raison sociale</label>
                <input 
                  type="text" 
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ex: Nabil Rajai (ONEE) ou Karim Bensalah"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-350"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email d'authentification</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: nabil.rajai@onee.ma"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-350"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle & Droits IAM</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-950 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Collaborateur)</option>
                    <option value="PROJECT_MANAGER">PROJECT MANAGER (Chef de Projet)</option>
                    <option value="CLIENT">CLIENT (Externe - Visualisation & KPI)</option>
                    <option value="FINANCE">FINANCE (Gestion Acompte/Budget)</option>
                    <option value="HR">HR (Gestion Staff)</option>
                    <option value="OWNER">OWNER (Dirigeant)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Département d'appartenance</label>
                  <input 
                    type="text" 
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Ex: ONEE, Câblage, Finance, etc."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-350"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3.5 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-slate-900 font-display"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="btn-primary py-3.5 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest font-display"
                >
                  <Plus size={16} /> Générer l'accès
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED VIEW DRAWER / SIDE SHEET FOR SELECTED USER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedUser(null)}></div>
          
          <div className="bg-white max-w-xl w-full h-full relative z-10 shadow-2xl border-l border-slate-200 overflow-y-auto p-8 md:p-10 space-y-8 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black">
                  {selectedUser.displayName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display leading-tight">{selectedUser.displayName}</h3>
                  <p className="text-xs text-slate-450 font-mono font-bold mt-0.5">{selectedUser.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 rounded">RÔLE : {selectedUser.role}</span>
                </div>
              </div>
            </div>

            {/* ATTACH PROJECT FORM ZONE */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-[24px] space-y-4">
              <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-display">Associer à un Projet</h4>
                <p className="text-[10px] text-slate-400 font-medium">Affecter cet utilisateur comme collaborateur ou manager.</p>
              </div>

              <form onSubmit={handleAttachProject} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-white/60 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAssignRole('EMPLOYEE')}
                    className={cn(
                      "py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      assignRole === 'EMPLOYEE' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Collaborateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignRole('MANAGER')}
                    className={cn(
                      "py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      assignRole === 'MANAGER' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Chef de Projet
                  </button>
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <select 
                      required
                      value={assignProjectId}
                      onChange={(e) => setAssignProjectId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm cursor-pointer"
                    >
                      <option value="">-- Choisir un projet actif --</option>
                      {allProjects.map((p, idx) => (
                        <option key={`${p.id}-${idx}`} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="btn-primary py-2.5 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider font-display shrink-0"
                  >
                    <Link2 size={14} /> Rattacher
                  </button>
                </div>
              </form>
            </div>

            {/* PROJECTS OF THIS USER SUMMARY */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affectations Projets ({userProjects.length})</h4>
              {userProjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Cet utilisateur n'est assigné à aucun projet pour l'instant.</p>
              ) : (
                <div className="space-y-2.5">
                  {userProjects.map((proj, idx) => {
                    const isMgr = proj.projectManagerId === selectedUser.uid || proj.manager_id === selectedUser.uid;
                    return (
                      <div key={`${proj.id}-${idx}`} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 uppercase font-display">{proj.name}</p>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            Rôle: <span className="font-bold text-slate-700">{isMgr ? 'CHEF DE PROJET' : 'COLLABORATEUR'}</span>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-blue-50 text-blue-600 uppercase tracking-wider">{proj.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AUDIT LOGS FOR THIS USER */}
            <div className="space-y-4">
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="text-blue-500 animate-pulse" /> Journal de sécurité IAM (Audit Logs)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Actions enregistrées de cet utilisateur dans la session courante.</p>
              </div>

              {userLogs.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 text-xs italic">
                  Aucune action détectée dans l'audit G-Sync pour ce matricule.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                  {userLogs.map((log, idx) => (
                    <div key={`${log.id}-${idx}`} className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs space-y-1 transition-all hover:bg-blue-50/20">
                      <div className="flex justify-between items-center gap-3">
                        <span className="px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider bg-slate-200 text-slate-700">
                          {log.action}
                        </span>
                        <span className="text-[9px] text-slate-450 font-mono italic">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceStat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="friendly-card p-1 bg-white border-slate-200 shadow-sm relative group hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all overflow-hidden flex flex-col group/card">
       <div className="p-8 flex items-center gap-6">
          <div className={cn("h-14 w-14 rounded-[20px] flex items-center justify-center text-white shadow-2xl transition-all group-hover/card:scale-105 group-hover/card:rotate-6 duration-550", color)}>
             <Icon size={20} />
          </div>
          <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-display italic">{label}</p>
             <h4 className="text-3xl font-black text-slate-900 tracking-tighter font-display uppercase leading-none">{value}</h4>
          </div>
       </div>
       <div className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-1 group-hover/card:translate-x-0">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-lg">
             <ArrowUpRight size={14} />
          </div>
       </div>
       <div className="absolute -bottom-10 -right-10 opacity-5 group-hover/card:opacity-10 transition-opacity">
          <Icon size={100} className="text-slate-900" />
       </div>
    </div>
  );
}
