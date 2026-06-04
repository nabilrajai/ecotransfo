import { Project } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { Shield, Activity, Target, Mail, Phone, MapPin, Briefcase, User, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export function ProjectBudget({ project, user }: { project: any; user?: any }) {
  // Gracefully resolve client fields whether they are inside an object or plain attributes
  const clientName = project?.client?.company_name || project?.client?.name || (typeof project?.client === 'string' ? project?.client : 'Client Non Défini');
  const clientEmail = project?.client?.email || project?.client?.contactEmail || 'non-configure@onee.ma';
  const clientContact = project?.client?.contactName || project?.client?.displayName || 'Responsable Client';
  const clientPhone = project?.client?.phone || '+212 522 45-6789';
  const clientAddress = project?.client?.address || 'Adresse non spécifiée, Maroc';
  const clientIndustry = project?.client?.industry || 'Secteur Énergétique';

  const spentPercent = project?.budget ? (project.spent / project.budget) * 100 : 0;
  const remainingBudget = Math.max(0, (project?.budget || 0) - (project?.spent || 0));
  const remainingPercent = project?.budget ? (remainingBudget / project.budget) * 100 : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 1. Core Project Budget Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
            Suivi Financier de l'Exécution
          </h3>
          <p className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">
            Budget Consolidated & Avancement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Budget Total */}
          <div className="friendly-card relative group hover:border-blue-500 transition-all duration-500 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 flex-1">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-slate-900 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                  <Shield size={24} />
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Statut Budget</span>
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-tight italic font-display">Sous-Contrat</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter font-display leading-none">
                  {formatCurrency(project?.budget || 0)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Budget Consolidé (CAPEX)</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 relative mt-auto overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-slate-950 shadow-lg"
              ></motion.div>
            </div>
          </div>

          {/* Card 2: Spent Budget */}
          <div className="friendly-card relative group hover:border-blue-500 transition-all duration-500 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 flex-1">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                  <Activity size={24} />
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Progression</span>
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-tight italic font-display">
                    {Math.round(spentPercent)}% Consommé
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter font-display leading-none">
                  {formatCurrency(project?.spent || 0)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Déboursement d'Exécution</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 relative mt-auto overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, spentPercent)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-blue-600 shadow-lg"
              ></motion.div>
            </div>
          </div>

          {/* Card 3: Remaining Budget */}
          <div className="friendly-card relative group hover:border-blue-500 transition-all duration-500 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 flex-1">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-emerald-600 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                  <Target size={24} />
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Solde Restant</span>
                  <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-tight italic font-display">
                    {Math.round(remainingPercent)}% Disponible
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter font-display leading-none">
                  {formatCurrency(remainingBudget)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Marge Provisionnelle (Solde)</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 relative mt-auto overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, remainingPercent)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-emerald-600 shadow-lg"
              ></motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Client Information Section */}
      <div className="friendly-card overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 font-display">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Fiche Client & Coordination
          </h3>
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Informations Structurelles de l'Entité Contractante
          </p>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Company identity column */}
          <div className="space-y-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0">
                <Briefcase size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display block">Nom de l'Organisation</span>
                <h4 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight leading-snug mt-1">
                  {clientName}
                </h4>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 flex items-center justify-center shrink-0">
                <User size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display block">Point de Contact Désigné</span>
                <h5 className="text-sm font-extrabold text-slate-800 font-display mt-1">
                  {clientContact}
                </h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic mt-0.5">Responsable Comptes Clefs</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display block">Siège Social & Livraison</span>
                <p className="text-xs font-bold text-slate-700 leading-relaxed font-display mt-1">
                  {clientAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-8 bg-slate-50/55 p-8 rounded-[24px] border border-slate-100/70">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display border-b border-slate-150 pb-3 mb-4">
              Canaux de Communication Directe
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-150 shadow-sm">
                  <Mail size={16} className="text-blue-500" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] font-display block">Messagerie Professionnelle</span>
                  <a href={`mailto:${clientEmail}`} className="text-xs font-bold text-slate-900 font-mono hover:text-blue-600 transition-colors">
                    {clientEmail}
                  </a>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-slate-300" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-150 shadow-sm">
                  <Phone size={16} className="text-emerald-500" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] font-display block">Contact Téléphonique direct</span>
                  <a href={`tel:${clientPhone}`} className="text-xs font-bold text-slate-900 font-mono hover:text-emerald-600 transition-colors">
                    {clientPhone}
                  </a>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-slate-300" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 border border-slate-150 shadow-sm">
                  <Briefcase size={16} className="text-indigo-500" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] font-display block">Secteur Principal d'Activité</span>
                  <span className="text-xs font-bold text-slate-700 font-display block">
                    {clientIndustry}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50/50 border-t border-slate-100 text-[10px] font-bold text-slate-400 flex items-center justify-center uppercase tracking-[0.4em] font-display">
          Données Synchronisées avec le Répertoire National des Clients
        </div>
      </div>
    </div>
  );
}
