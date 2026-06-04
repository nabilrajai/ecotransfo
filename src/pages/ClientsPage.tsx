import React, { useState, useEffect, FormEvent } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { Client, Project, Acompte, UserProfile } from '../types';
import { 
  Building2, 
  Layers, 
  CheckCircle, 
  Plus, 
  X, 
  TrendingUp, 
  User, 
  Mail, 
  Phone, 
  ChevronRight, 
  Clock, // Re-added Clock
  Briefcase, 
  UserCheck, 
  Key, 
  ShieldCheck,
  Search,
  Trash2,
  Check,
  Eye,
  SlidersHorizontal,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  FileText,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, cn, getClientName } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsPageProps {
  user: UserProfile;
}

export function ClientsPage({ user }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [acomptes, setAcomptes] = useState<Acompte[]>([]);
  const [loading, setLoading] = useState(true);

  // User Accounts list
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  // Selector states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Create Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');

  // Create Acompte Modal State
  const [isAcompteModalOpen, setIsAcompteModalOpen] = useState(false);
  const [acompteAmount, setAcompteAmount] = useState('');
  const [acompteProjectId, setAcompteProjectId] = useState('');
  const [acompteNotes, setAcompteNotes] = useState('');

  // Create User Login Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userUid, setUserUid] = useState('');

  const loadData = async () => {
    try {
      const clientsData = await api.get('/clients');
      const projectsData = await api.get('/projects');
      setClients(clientsData);
      setAllProjects(projectsData);
      setAcomptes(StorageService.getAcomptes());
      setAllUsers(StorageService.getUsers());
      
      // Keep selected client state synchronized
      if (selectedClient) {
        const found = clientsData.find((c: any) => c.id === selectedClient.id);
        if (found) {
          setSelectedClient(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selection dynamically when clients change
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0]);
    }
  }, [clients]);

  // Handle Create Client
  const handleCreateClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) {
      toast.error('Le nom et l\'email sont requis.');
      return;
    }

    try {
      await api.post('/clients', {
        name: newClientName,
        email: newClientEmail,
        company_name: newClientName,
        phone: newClientPhone || '+212 5 22 00 00 00',
        address: newClientContact || 'Responsable Technique',
        industry: newClientIndustry || 'Énergie & Réseaux',
        password: newClientPassword || 'password',
        status: 'PENDING',
        is_approved: false
      });
      
      toast.success(`Client "${newClientName}" créé avec succès.`);
      
      // Reset fields
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPassword('');
      setNewClientPhone('');
      setNewClientContact('');
      setNewClientIndustry('');
      
      setIsClientModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création du client.');
    }
  };

  // Toggle Client Status (APPROVED / PENDING)
  const handleToggleClientApproval = async (e: React.MouseEvent, c: Client) => {
    e.stopPropagation(); // Avoid selecting node
    try {
      const currentStatus = c.status || 'PENDING';
      const newStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      const isApproved = newStatus === 'APPROVED';

      await api.post(`/clients/${c.id}`, {
        status: newStatus,
        is_approved: isApproved
      });

      toast.success(
        newStatus === 'APPROVED' 
          ? `Client "${c.company_name || c.name}" approuvé avec succès !`
          : `Client "${c.company_name || c.name}" mis en attente.`
      );

      // Instantly synchronize selected panel if it is the current one
      if (selectedClient && selectedClient.id === c.id) {
        setSelectedClient(prev => prev ? { ...prev, status: newStatus, is_approved: isApproved } : null);
      }

      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur de modification du statut client.");
    }
  };

  // Toggle Portal user authorization status
  const handleToggleUserApproval = async (selectedUser: UserProfile) => {
    try {
      const isCurrentlyApproved = selectedUser.role === 'CLIENT'; // or we can toggle passwordChangeRequired, roles, etc.
      // Let's use custom property isOffline or passwordChangeRequired for test accounts just to showcase state changes.
      const updatedUser = {
        ...selectedUser,
        passwordChangeRequired: !selectedUser.passwordChangeRequired
      };
      await StorageService.saveUserProfile(updatedUser);
      toast.success(`Mise à jour effectuée pour le compte ${selectedUser.displayName}`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour du compte.");
    }
  };

  // Delete Client
  const handleDeleteClient = async (e: React.MouseEvent, c: Client) => {
    e.stopPropagation();
    const clientName = c.company_name || c.name || 'Ce client';
    
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le client "${clientName}" et toutes ses fiches associées ? 
Cette action est irréversible et synchronisée.`)) {
      return;
    }

    try {
      await api.delete(`/clients/${c.id}`);
      toast.success(`Client "${clientName}" supprimé de la base de données.`);
      
      if (selectedClient && selectedClient.id === c.id) {
        setSelectedClient(null);
      }
      
      await loadData();
    } catch (err) {
      toast.error("Échec de la suppression.");
    }
  };

  // Handle Create Acompte
  const handleCreateAcompte = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const amount = parseFloat(acompteAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant d\'acompte invalide.');
      return;
    }

    if (!acompteProjectId) {
      toast.error('Veuillez sélectionner le projet associé.');
      return;
    }

    const project = allProjects.find(p => p.id === acompteProjectId);
    if (!project) return;

    const newAcompte: Acompte = {
      id: 'ac-' + Math.random().toString(36).substr(2, 9),
      clientId: selectedClient.id,
      projectId: project.id,
      projectName: project.name,
      amount: amount,
      status: 'PAID',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: acompteNotes || 'Versement acompte contractuel'
    };

    await StorageService.addAcompte(newAcompte);
    await StorageService.addActivityLog(
      user.uid,
      'Création Acompte',
      `Facture d'acompte de ${formatCurrency(amount)} émise pour le projet "${project.name}" (Client: ${selectedClient.name}).`
    );

    toast.success(`L'acompte de ${formatCurrency(amount)} a été enregistré.`);
    
    // Reset fields
    setAcompteAmount('');
    setAcompteProjectId('');
    setAcompteNotes('');
    
    setIsAcompteModalOpen(false);
    loadData();
  };

  const openCreateUserModal = () => {
    if (!selectedClient) return;
    
    setUserDisplayName(selectedClient.contactName || `${selectedClient.name} (Contact)`);
    setUserEmail(selectedClient.contactEmail || selectedClient.email);
    
    // Generate clean login slug
    const suffix = Math.random().toString(36).substring(2, 6);
    const slug = (selectedClient.name || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, "-")      // Replace non-alphanumeric with dashes
      .replace(/-+/g, "-")             // Replace double dashes
      .replace(/^-|-$/g, "");          // Trim boundary dashes
    
    setUserUid(`client-${slug || 'user'}-${suffix}`);
    setIsUserModalOpen(true);
  };

  const handleCreateUserAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!userDisplayName.trim() || !userEmail.trim() || !userUid.trim()) {
      toast.error('Tous les champs sont requis.');
      return;
    }

    const testUid = userUid.trim();

    // Check if UID is already taken
    const exists = allUsers.some(u => (u.uid || '').toLowerCase() === testUid.toLowerCase());
    if (exists) {
      toast.error(`L'identifiant de connexion "${testUid}" est déjà pris.`);
      return;
    }

    const newUserProfile: UserProfile = {
      uid: testUid,
      email: userEmail.trim(),
      displayName: userDisplayName.trim(),
      role: 'CLIENT',
      department: selectedClient.name || '',
      clientId: selectedClient.id || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await StorageService.saveUserProfile(newUserProfile);
    await StorageService.addActivityLog(
      user.uid,
      'Création Compte Portail',
      `Compte d'accès portail créé pour "${userDisplayName}" (ID: ${testUid}).`
    );

    toast.success(`Le compte d'accès pour "${userDisplayName}" a été créé avec succès pour la connexion.`);
    
    // Reset fields
    setUserDisplayName('');
    setUserEmail('');
    setUserUid('');
    setIsUserModalOpen(false);
    loadData();
  };

  // Filter clients based on search query and industry filter
  const industries = Array.from(new Set<string>(clients.map(c => c.industry || 'Énergie & Réseaux')));

  const filteredClients = clients.filter(c => {
    const cName = (c.company_name || c.name || '').toLowerCase();
    const cMail = (c.email || '').toLowerCase();
    const cContact = (c.contactName || '').toLowerCase();
    const cIndustry = (c.industry || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = cName.includes(query) || cMail.includes(query) || cContact.includes(query) || cIndustry.includes(query);
    const matchesIndustry = selectedIndustry === '' || (c.industry || 'Énergie & Réseaux') === selectedIndustry;

    return matchesSearch && matchesIndustry;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des comptes clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-550 min-h-screen pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-150">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 tracking-wider uppercase font-display">
            <Building2 size={12} className="animate-pulse" />
            Espace Comptes Tiers EPPM
          </div>
          <h1 className="text-3.5xl font-black text-slate-900 tracking-tight font-display uppercase leading-none">
            Interfaces & <span className="text-blue-600">Clients</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Pilotez les portails clients de production, approuvez les accès et gérez les consolidations budgétaires en temps réel.
          </p>
        </div>
        <button 
          onClick={() => setIsClientModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3.5 px-6 shrink-0 font-display text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-105 hover:translate-y-[-2px] flex items-center gap-2"
        >
          <Plus size={15} /> Nouveau Compte Client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Dynamic Client Directory with rapid actions */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest font-display">
                Annuaire Fédéré ({filteredClients.length})
              </h3>
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Total: {clients.length}
              </span>
            </div>

            {/* Quick Filter Inputs */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par nom, email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs font-bold text-slate-905 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-600 transition-all font-display"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-450 hover:text-slate-900"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Selector filter for industries */}
              {industries.length > 0 && (
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={12} className="text-slate-405 shrink-0" />
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 text-[10px] font-extrabold text-slate-550 py-1.5 px-3 rounded-lg outline-none cursor-pointer font-display uppercase tracking-wider"
                  >
                    <option value="">Tous les Secteurs</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* List items */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-205 border-dashed rounded-3xl">
                <AlertCircle size={28} className="text-slate-300 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-800 uppercase tracking-tight font-display">Aucun client trouvé</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Ajustez vos filtres de recherche.</p>
              </div>
            ) : (
              filteredClients.map((c) => {
                const clientName = c.company_name || c.name || c.user?.name || 'Nom Inconnu';
                const clientEmail = c.email || c.user?.email || 'Email non configuré';
                const clientIndustry = c.industry || 'Énergie & Réseaux';
                const isApproved = c.status === 'APPROVED' || c.is_approved === true || c.is_approved === 1;

                // Project statistics
                const localProj = allProjects.filter(p => 
                  p.clientId === c.id || 
                  (c.name && getClientName(p.client).toLowerCase().includes(c.name.toLowerCase())) ||
                  (c.company_name && getClientName(p.client).toLowerCase().includes(c.company_name.toLowerCase()))
                );
                const nestedProj = c.projects || [];
                const mergedProj = [...localProj];
                nestedProj.forEach(np => {
                  const npIdStr = String(np.id);
                  if (!mergedProj.some(p => String(p.id) === npIdStr)) {
                    mergedProj.push({
                      id: npIdStr,
                      name: np.name,
                      description: np.description || '',
                      client: clientName,
                      clientId: String(c.id),
                      budget: typeof np.budget === 'string' ? parseFloat(np.budget) : (np.budget || 0),
                      spent: 0,
                      startDate: np.start_date || '',
                      endDate: np.end_date || '',
                      progress: np.progress_percentage !== undefined ? np.progress_percentage : 45,
                      priority: 'MEDIUM',
                      status: np.status === 'IN_PROGRESS' || np.status === 'ACTIVE' ? 'ACTIVE' : (np.status === 'COMPLETED' ? 'COMPLETED' : 'PLANNING'),
                      projectManagerId: '',
                      teamMembers: [],
                      createdAt: np.created_at || '',
                      updatedAt: '2026-06-02T13:01:05.000000Z'
                    });
                  }
                });

                const clientProjects = mergedProj;
                const clientTurnover = clientProjects.reduce((acc, p) => acc + p.budget, 0);
                const isActiveLocal = selectedClient?.id === c.id;

                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={cn(
                      "p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group relative shadow-sm overflow-hidden",
                      isActiveLocal 
                        ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/50"
                    )}
                  >
                    {/* Background active pulse glow */}
                    {isActiveLocal && (
                      <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-full pointer-events-none"></div>
                    )}

                    <div className="space-y-3 relative z-10">
                      {/* Badge and ID header */}
                      <div className="flex justify-between items-center gap-2">
                        <span className={cn(
                          "px-2 px-2.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider font-display",
                          isActiveLocal ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                        )}>
                          {clientIndustry}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Approval rapid status indicator */}
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isApproved ? "bg-emerald-500 shadow-md shadow-emerald-400" : "bg-amber-500 shadow-md shadow-amber-400"
                          )}></span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest font-display",
                            isActiveLocal ? "text-slate-305" : "text-slate-400"
                          )}>
                            {isApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                      </div>

                      {/* Brand client heading */}
                      <div>
                        <h4 className={cn(
                          "text-[15px] font-black uppercase font-display tracking-tight leading-tight transition-colors",
                          isActiveLocal ? "text-white" : "text-slate-900 group-hover:text-blue-600"
                        )}>
                          {clientName}
                        </h4>
                        <p className={cn(
                          "text-[10px] font-medium mt-1 select-all font-mono opacity-80 truncate block",
                          isActiveLocal ? "text-slate-300" : "text-slate-450"
                        )}>
                          {clientEmail}
                        </p>
                      </div>
                    </div>

                    {/* Cumulated amounts and metadata */}
                    <div className={cn(
                      "mt-4 pt-3 border-t flex justify-between items-center text-xs relative z-10",
                      isActiveLocal ? "border-slate-800" : "border-slate-100"
                    )}>
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-60 text-slate-400">CHIFRE ENGAGÉ</span>
                        <span className="font-extrabold text-[11px] font-mono text-emerald-500">{formatCurrency(clientTurnover)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-60 text-slate-400">PROJETS ACTIVE</span>
                        <span className="font-extrabold text-[11px]">{clientProjects.length} rattaché(s)</span>
                      </div>
                    </div>

                    {/* RAPID ACTIONS BUTTONS LAYER inside card */}
                    <div className={cn(
                      "mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-1.5 relative z-10",
                      isActiveLocal ? "border-slate-800" : "border-slate-100"
                    )}>
                      {/* See Details Action */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(c);
                        }}
                        className={cn(
                          "py-1.5 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-display transition-all flex items-center gap-1 shrink-0 border",
                          isActiveLocal 
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                            : "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-250"
                        )}
                        title="Voir la fiche détaillée"
                      >
                        <Eye size={10} />
                        <span>Détails</span>
                      </button>

                      {/* Change Status Action */}
                      <button 
                        onClick={(e) => handleToggleClientApproval(e, c)}
                        className={cn(
                          "py-1.5 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-display transition-all flex items-center gap-1 shrink-0 border",
                          isApproved 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        )}
                        title={isApproved ? "Suspendre l'approbation" : "Valider l'approbation du compte"}
                      >
                        {isApproved ? <Check size={10} /> : <Clock size={10} />}
                        <span>{isApproved ? 'Approved' : 'Pending'}</span>
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={(e) => handleDeleteClient(e, c)}
                        className="p-1 px-2.5 h-[26px] rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-slate-200 hover:border-rose-200 flex items-center justify-center shrink-0 ml-auto"
                        title="Supprimer Client"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: KPI Dashboard + Full Payments & Status actions handling */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (() => {
            const activeName = selectedClient.company_name || selectedClient.name || selectedClient.user?.name || 'Nom Inconnu';
            const activeEmail = selectedClient.email || selectedClient.user?.email || 'Email non configuré';
            const activePhone = selectedClient.phone || '+212 5 22 00 00 00';
            const activeAddress = selectedClient.address || 'Adresse Technique Principale, Maroc';
            const activeIndustry = selectedClient.industry || 'Énergie & Réseaux';
            const activeIsApproved = selectedClient.status === 'APPROVED' || selectedClient.is_approved === true || selectedClient.is_approved === 1;

            // Merge local projects state and selected client-specific nested projects from API
            const activeLocalProj = allProjects.filter(p => 
              p.clientId === selectedClient.id || 
              (selectedClient.name && getClientName(p.client).toLowerCase().includes(selectedClient.name.toLowerCase())) ||
              (selectedClient.company_name && getClientName(p.client).toLowerCase().includes(selectedClient.company_name.toLowerCase()))
            );
            const activeNestedProj = selectedClient.projects || [];
            const activeMergedProj = [...activeLocalProj];
            activeNestedProj.forEach(np => {
              const npIdStr = String(np.id);
              if (!activeMergedProj.some(p => String(p.id) === npIdStr)) {
                activeMergedProj.push({
                  id: npIdStr,
                  name: np.name,
                  description: np.description || '',
                  client: activeName,
                  clientId: String(selectedClient.id),
                  budget: typeof np.budget === 'string' ? parseFloat(np.budget) : (np.budget || 0),
                  spent: 0,
                  startDate: np.start_date || '',
                  endDate: np.end_date || '',
                  progress: np.progress_percentage !== undefined ? np.progress_percentage : 45,
                  priority: 'MEDIUM',
                  status: np.status === 'IN_PROGRESS' || np.status === 'ACTIVE' ? 'ACTIVE' : (np.status === 'COMPLETED' ? 'COMPLETED' : 'PLANNING'),
                  projectManagerId: '',
                  teamMembers: [],
                  createdAt: np.created_at || '',
                  updatedAt: ''
                });
              }
            });

            const activeProjectsList = activeMergedProj;
            const activeTotalTurnover = activeProjectsList.reduce((acc, p) => acc + p.budget, 0);

            const clientLogins = allUsers.filter(u => u.clientId === selectedClient.id || u.department === selectedClient.name || u.department === selectedClient.company_name);

            return (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Active Client Details Header Card */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-block px-2.5 py-0.5 text-[8px] font-black bg-blue-50 text-blue-600 rounded uppercase tracking-wider font-display">
                          Profil Organisme EPPM
                        </span>
                        
                        {/* Elite verification indicator */}
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider font-display border",
                          activeIsApproved 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                            : "bg-amber-50 text-amber-800 border-amber-100"
                        )}>
                          {activeIsApproved ? "✓ COMPTE APPROUVÉ" : "⚠ EN RECONNAISSANCE"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <h3 className="text-2.5xl font-black text-slate-900 uppercase tracking-tight font-display">
                          {activeName}
                        </h3>
                      </div>
                      
                      <p className="text-slate-500 text-xs font-mono select-all flex items-center gap-2">
                        <span>{activeEmail}</span>
                        <span className="text-slate-250">•</span>
                        <span>{activePhone}</span>
                      </p>
                    </div>

                    {/* Executive buttons bar */}
                    <div className="flex flex-wrap gap-2.5 shrink-0">
                      {/* State approval switch action */}
                      <button
                        onClick={(e) => handleToggleClientApproval(e, selectedClient)}
                        className={cn(
                          "py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest font-display transition-all flex items-center gap-1.5 border",
                          activeIsApproved 
                            ? "bg-amber-550 border-amber-500 hover:bg-amber-600 text-white" 
                            : "bg-emerald-600 border-emerald-555 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {activeIsApproved ? <Lock size={13} /> : <Unlock size={13} />}
                        {activeIsApproved ? "Désactiver" : "Approuver le statut"}
                      </button>

                      <button 
                        onClick={openCreateUserModal}
                        className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest font-display whitespace-nowrap transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck size={13} /> Compte Connexion
                      </button>
                      
                      <button 
                        onClick={() => setIsAcompteModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest font-display whitespace-nowrap flex items-center gap-1.5 border border-blue-600"
                      >
                        <Plus size={13} /> Enregistrer Acompte
                      </button>

                      {/* Red delete button inside details header */}
                      <button
                        onClick={(e) => handleDeleteClient(e, selectedClient)}
                        className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-205 hover:border-rose-100 transition-colors"
                        title="Supprimer Client de force"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Fiche Signalétique (System Information Block) */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-[24px] grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-2">
                      <span className="text-[8px] uppercase font-black text-slate-400 tracking-wider block font-display">Adresse de Facturation & Siège</span>
                      <p className="font-extrabold text-slate-850 text-xs font-display">{activeAddress}</p>
                      <p className="font-semibold text-slate-500 font-mono">Tél direct: <span className="text-slate-800 font-bold">{activePhone}</span></p>
                    </div>
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-4 md:pt-0 md:pl-6 leading-tight">
                      <span className="text-[8px] uppercase font-black text-slate-400 tracking-wider block font-display">Informations Système & DB</span>
                      <p className="font-semibold text-slate-600">ID Interne Client: <code className="font-mono bg-white px-2 py-0.5 border border-slate-150 rounded text-[11px] font-bold text-slate-900 select-all">{selectedClient.id}</code></p>
                      <p className="font-semibold text-slate-600 mt-1">Secteur Principal: <strong className="text-slate-800 uppercase font-display">{activeIndustry}</strong></p>
                      {selectedClient.created_at && (
                        <p className="text-[10px] text-slate-400 font-mono">Enregistrement: {formatDate(selectedClient.created_at)}</p>
                      )}
                    </div>
                  </div>

                  {/* Financial Counters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="p-5 bg-gradient-to-tr from-slate-50 to-white rounded-2xl border border-slate-150 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">Chiffre d'Affaires global engagé</span>
                      <p className="text-2xl font-black text-slate-950 font-display font-mono">
                        {formatCurrency(activeTotalTurnover)}
                      </p>
                    </div>
                    <div className="p-5 bg-gradient-to-tr from-emerald-50/10 to-white rounded-2xl border border-emerald-200/50 space-y-1">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest font-display">Acomptes encaissés consolidés</span>
                      <p className="text-2xl font-black text-emerald-700 font-display font-mono">
                        {formatCurrency(acomptes.filter(a => a.clientId === selectedClient.id && a.status === 'PAID').reduce((sum, a) => sum + a.amount, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* COMPTE DE TEST PORTAIL CLIENT PRÉ-CONFIGURÉ (direct nested attribute) */}
                {selectedClient.user && (
                  <div className="bg-gradient-to-br from-blue-50/20 to-slate-50/20 border-2 border-blue-100 rounded-[32px] p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-900 text-[8px] font-black rounded uppercase border border-blue-200">
                          <ShieldCheck size={10} className="text-blue-700 animate-pulse" />
                          Utilisateur système associé (Authentifié)
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest font-display mt-1">
                          Données de connexion API Directe
                        </h4>
                        <p className="text-[10px] text-slate-500">Ce compte est stocké dans la table utilisateur et lié à ce profil client.</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn(
                          "px-2.5 py-0.5 text-[8px] font-black text-white rounded uppercase tracking-wider",
                          selectedClient.user.is_approved === 1 || selectedClient.user.is_approved === true
                            ? "bg-emerald-600"
                            : "bg-amber-500"
                        )}>
                          {selectedClient.user.is_approved === 1 || selectedClient.user.is_approved === true ? "✓ Approuvé" : "En attente d'approbation"}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400">ID Unique User: {selectedClient.user.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-display">Nom complet</span>
                        <p className="font-extrabold text-slate-800 font-display">{selectedClient.user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Email de connexion</span>
                        <p className="font-mono font-semibold text-slate-700 select-all">{selectedClient.user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Mot de Passe Direct</span>
                        <code className="text-[11px] text-blue-700 font-mono font-bold select-all bg-white px-2 py-1 rounded border border-blue-150 block w-fit">
                          {selectedClient.user.password || 'password'}
                        </code>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                      <span>Rôle Global: {selectedClient.user.role}</span>
                      <span>Changement de MP requis au 1er login: {selectedClient.user.password_change_required ? 'OUI' : 'NON'}</span>
                    </div>
                  </div>
                )}

                {/* Comptes d'Accès au Portail Client (Local accounts generated) */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-600" />
                        Comptes d'Accès de Test Portail Client ({clientLogins.length})
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Configurez des identifiants d'utilisateur pour simuler l'affichage de l'espace client.</p>
                    </div>
                    <button 
                      onClick={openCreateUserModal}
                      className="hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-950 py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={12} /> Nouveau Compte de Test
                    </button>
                  </div>

                  {clientLogins.length === 0 ? (
                    <div className="p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center py-8">
                      <UserCheck size={28} className="text-slate-300 mb-2 animate-pulse" />
                      <p className="text-slate-800 text-xs font-black uppercase tracking-wider">Aucun identifiant de connexion additionnel</p>
                      <p className="text-[10px] text-slate-400 max-w-md mt-1 font-medium">Créez un profil pour tester directement le tableau de bord en mode client (Role: CLIENT).</p>
                      <button 
                        onClick={openCreateUserModal}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl transition-all shadow-sm"
                      >
                        Générer un compte d'accès maintenant
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientLogins.map((lg) => (
                        <div key={lg.uid} className="p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors border border-slate-100 rounded-2xl relative group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black rounded uppercase border",
                                lg.passwordChangeRequired 
                                  ? "bg-amber-50 text-amber-700 border-amber-100" 
                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full animate-pulse",
                                  lg.passwordChangeRequired ? "bg-amber-550" : "bg-emerald-500"
                                )}></span>
                                {lg.passwordChangeRequired ? "OFFLINE / PENDING" : "ACTIVE / APPROVED"}
                              </span>
                              <h5 className="text-xs font-black uppercase text-slate-900 font-display mt-1">{lg.displayName}</h5>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 select-all">{lg.email}</p>
                            </div>
                            
                            {/* Toggle login test account status button */}
                            <button
                              onClick={() => handleToggleUserApproval(lg)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-105 text-blue-600 flex items-center justify-center shrink-0 border border-blue-105 transition-all"
                              title="Changer statut autorisation"
                            >
                              <Key size={14} />
                            </button>
                          </div>
                          
                          <div className="border-t border-slate-200/45 mt-3 pt-2 text-[9px] font-mono flex items-center justify-between text-slate-400">
                            <span>ID: <strong className="text-slate-800 select-all font-sans">{lg.uid}</strong></span>
                            <span className="text-slate-405 italic">Connexion validée</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Project KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {['PLANNING', 'ACTIVE', 'COMPLETED'].map((status) => {
                    const items = activeProjectsList.filter(p => p.status === status);
                    return (
                      <div key={status} className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-1">
                        <span className={cn(
                          "inline-block px-2.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider mb-2",
                          status === 'ACTIVE' ? "bg-amber-50 text-amber-600 border border-amber-105" :
                          status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border border-emerald-105" :
                          "bg-blue-50 text-blue-600 border border-blue-105"
                        )}>
                          {status === 'ACTIVE' ? 'En Cours' : status === 'COMPLETED' ? 'Terminé' : 'En Planification'}
                        </span>
                        <h4 className="text-2xl font-black text-slate-900 font-display leading-none">{items.length}</h4>
                        <p className="text-[9px] font-medium text-slate-400 font-display uppercase tracking-wider">Projets enregistrés</p>
                      </div>
                    );
                  })}
                </div>

                {/* Projects list */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-display">Suivi d'avancement du portefeuille</h4>
                  
                  {activeProjectsList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-4">Aucun projet n'est rattaché à ce client.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeProjectsList.map((proj) => (
                        <div key={proj.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-300 transition-colors">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight font-display">{proj.name}</p>
                            <span className="text-[9px] font-mono block text-slate-400">Réf: {proj.id} | Budget: <strong className="text-slate-700">{formatCurrency(proj.budget)}</strong></span>
                          </div>
                          <div className="min-w-[150px] space-y-1.5 text-right">
                            <div className="flex justify-between text-[9px] font-extrabold text-slate-405 uppercase tracking-wider mb-1 font-display">
                              <span>Progression</span>
                              <span className="text-slate-900">{proj.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client historical acomptes */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-display">Historique des Acomptes</h4>
                    <span className="text-[10px] font-mono text-emerald-600 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      SOLVABILITÉ: EXCELLENTE
                    </span>
                  </div>
                  
                  {acomptes.filter(a => a.clientId === selectedClient.id).length === 0 ? (
                    <p className="text-slate-450 text-xs text-center py-4 italic font-medium">Aucun droit d'acompte n'a été encaissé à ce jour pour ce client.</p>
                  ) : (
                    <div className="space-y-3">
                      {acomptes.filter(a => a.clientId === selectedClient.id).map((ac) => (
                        <div key={ac.id} className="flex justify-between items-center text-xs p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/40 transition-colors">
                          <div className="space-y-1">
                            <p className="font-extrabold text-slate-800 uppercase font-display leading-tight">{ac.projectName}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">N° {ac.id} (Date d'échéance : de {formatDate(ac.issueDate)})</span>
                          </div>
                          <div className="text-right space-y-1 shrink-0">
                            <p className="font-black text-slate-950 font-mono text-xs">{formatCurrency(ac.amount)}</p>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100">Réglé</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="bg-white border border-slate-205 rounded-[32px] p-16 text-center h-full flex flex-col justify-center items-center">
              <Building2 size={48} className="text-slate-250 mb-4 animate-bounce" />
              <h3 className="text-base font-black text-slate-805 uppercase font-display select-none">Aucun Client Sélectionné</h3>
              <p className="text-slate-400 text-xs max-w-sm mt-1.5 font-medium leading-relaxed">
                Sélectionnez un profil client dans l'annuaire de gauche pour afficher ses portails d'accès, sychroniser les statuts d'approbations et encaisser de nouveaux acomptes de production.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)}></div>
          
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsClientModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Nouveau Profil Client</h3>
              <p className="text-xs text-slate-400 font-medium">Créer une fiche client dans le grand livre</p>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Raison Sociale / Entreprise</label>
                <input 
                  type="text" 
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: ONEE Branche Eau ou l'ONDA"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Technique</label>
                <input 
                  type="email" 
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Ex: contact@onee.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mot de passe de connexion</label>
                <input 
                  type="password" 
                  required
                  value={newClientPassword}
                  onChange={(e) => setNewClientPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Référent</label>
                  <input 
                    type="text" 
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    placeholder="Nom du référent"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-display">Secteur</label>
                  <input 
                    type="text" 
                    value={newClientIndustry}
                    onChange={(e) => setNewClientIndustry(e.target.value)}
                    placeholder="Énergie, Transport..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Téléphone d'Assistance</label>
                <input 
                  type="text" 
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="+212 5..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest font-display"
                >
                  Ajouter Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ACOMPTE MODAL */}
      {isAcompteModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAcompteModalOpen(false)}></div>
          
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAcompteModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Enregistrer un Acompte</h3>
              <p className="text-xs text-slate-400 font-medium">Attribuer un acompte reçu de {selectedClient.name}</p>
            </div>

            <form onSubmit={handleCreateAcompte} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Associer au Projet</label>
                <select 
                  required
                  value={acompteProjectId}
                  onChange={(e) => setAcompteProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none cursor-pointer"
                >
                  <option value="">-- Choisir un projet --</option>
                  {allProjects.filter(p => p.clientId === selectedClient.id || getClientName(p.client).toLowerCase().includes((selectedClient.name || '').toLowerCase())).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Montant de l'acompte (MAD)</label>
                <input 
                  type="number" 
                  required
                  value={acompteAmount}
                  onChange={(e) => setAcompteAmount(e.target.value)}
                  placeholder="Ex: 150000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Notes & Libellé</label>
                <textarea 
                  rows={2}
                  value={acompteNotes}
                  onChange={(e) => setAcompteNotes(e.target.value)}
                  placeholder="Ex: Deuxième versement contractuel suite à validation du Lot 1..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAcompteModalOpen(false)}
                  className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest font-display whitespace-nowrap"
                >
                  Valider l'Acompte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LOGIN USER ACCOUNT MODAL */}
      {isUserModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
          
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6 space-y-1">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest font-display">Sécurisation & Accès</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Créer un Compte Portail Client</h3>
              <p className="text-xs text-slate-400 font-medium">Générez des identifiants d'accès exclusifs au tableau de bord pour {selectedClient.name}.</p>
            </div>

            <form onSubmit={handleCreateUserAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nom Prénom de l'utilisateur principal</label>
                <input 
                  type="text" 
                  required
                  value={userDisplayName}
                  onChange={(e) => setUserDisplayName(e.target.value)}
                  placeholder="Ex: M. Khalid Alaoui"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email de Connexion</label>
                <input 
                  type="email" 
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Ex: khalid.alaoui@onee.ma"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-905 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Identifiant de Test Unique (UID)</label>
                  <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Utilisé pour le Sélecteur</span>
                </div>
                <input 
                  type="text" 
                  required
                  value={userUid}
                  onChange={(e) => setUserUid(e.target.value)}
                  placeholder="Ex: client-onee-sub"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-950 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[9px] text-slate-400 font-medium">Cet identifiant unique s'affichera instantanément dans le sélecteur d'utilisateurs sur l'écran d'accueil.</p>
              </div>

              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-[10px] text-blue-800 font-medium leading-relaxed">
                  <strong>Accès sécurisé:</strong> Le compte disposera du rôle <strong>CLIENT</strong>. Lors de sa connexion, il accèdera directement au <strong>Portail Client sécurisé</strong> affichant uniquement ses projets et budgets associés.
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest font-display"
                >
                  Générer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
