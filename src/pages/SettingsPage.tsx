import { Settings, User, Bell, Shield, Globe, Palette, Database, Lock, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function SettingsPage() {
  const [activeSegment, setActiveSegment] = useState('general');

  const segments = [
    { id: 'general', label: 'Configuration Générale', icon: Settings },
    { id: 'users', label: "Gestion des Accès", icon: User },
    { id: 'notifications', label: 'Alertes & Notifications', icon: Bell },
    { id: 'security', label: 'Audit & Sécurité', icon: Shield },
    { id: 'branding', label: 'Identité Visuelle', icon: Palette },
    { id: 'api', label: 'API & Intégrations', icon: Database },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-display">Paramètres Système</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] italic font-display">Administration Centrale EcoTransfo EPPM v4.2</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="w-full lg:w-80 shrink-0 space-y-3 bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
           {segments.map(seg => (
             <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id)}
              className={cn(
                "flex items-center gap-4 w-full px-6 py-4 rounded-[20px] text-xs font-bold transition-all duration-300 font-display",
                activeSegment === seg.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-2" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              )}
             >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                  activeSegment === seg.id ? "bg-white/10" : "bg-slate-50 text-slate-400 group-hover:bg-white"
                )}>
                   <seg.icon size={18} />
                </div>
                {seg.label}
             </button>
           ))}
        </aside>

        <main className="flex-1 w-full">
           <div className="friendly-card p-12 min-h-[650px] shadow-sm flex flex-col bg-white">
              {activeSegment === 'general' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">Identité & Localisation</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic font-display">Paramètres fondamentaux de l'organisation</p>
                   </div>
                   
                   <div className="space-y-10">
                      <SettingInput label="Nom de l'organisation" value="Eco Transfo Maroc S.A." description="Le nom officiel utilisé pour l'indexation de tous les actifs et rapports financiers." />
                      <SettingInput label="Point d'accès (URL)" value="https://eppm.ecotransfo.ma" description="L'adresse URL racine pour l'accès sécurisé à l'instance Cloud EPPM." />
                      
                      <div className="flex items-center justify-between py-8 border-y border-slate-50 group hover:bg-slate-50/50 px-4 -mx-4 rounded-2xl transition-all">
                         <div className="space-y-1">
                            <p className="text-xs font-extrabold text-slate-900 uppercase tracking-tight font-display">Référentiel Temps & Fuseau</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest font-display italic">Casablanca / Rabat (UTC +01:00)</p>
                         </div>
                         <button className="btn-secondary text-[10px] px-6 py-2">Modifier Geo-Sync</button>
                      </div>

                      <div className="flex items-center justify-between py-8 border-b border-slate-50 group hover:bg-slate-50/50 px-4 -mx-4 rounded-2xl transition-all">
                         <div className="space-y-1">
                            <p className="text-xs font-extrabold text-slate-900 uppercase tracking-tight font-display">Langue de l'Interface</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest font-display italic">Français (FR-MA) Standard EcoTransfo</p>
                         </div>
                         <button className="btn-secondary text-[10px] px-6 py-2">Changer Langue</button>
                      </div>
                   </div>

                   <div className="pt-12 mt-auto flex justify-end gap-6">
                      <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors font-display">Annuler les modifications</button>
                      <button className="btn-primary px-10 py-4 shadow-blue-500/10 font-display text-[11px] tracking-[0.1em]">
                         Enregistrer les paramètres
                      </button>
                   </div>
                </div>
              )}

              {activeSegment === 'users' && (
                <div className="space-y-10 text-center py-24 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="w-24 h-24 rounded-[32px] bg-slate-900 flex items-center justify-center text-blue-400 mb-8 shadow-2xl relative overflow-hidden group">
                      <User size={42} className="relative z-10 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </div>
                   <div className="space-y-4 max-w-md">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">Gestion des Accès Unifiée</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed font-display italic">
                        La gestion des comptes et des permissions IAM s'effectue directement via le module Ressources pour une cohérence opérationnelle maximale.
                      </p>
                   </div>
                   <button className="btn-primary px-10 py-4 mt-8 shadow-blue-500/10 font-display text-[11px] tracking-widest group">
                      <span>Accéder au Hub Ressources</span>
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </button>
                </div>
              )}

              {activeSegment === 'api' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">API & Services Externes</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic font-display">Connexion sécurisée aux briques logistiques et ERP</p>
                   </div>

                   <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden group shadow-2xl border border-slate-800">
                      <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                              <Lock size={20} />
                           </div>
                           <h4 className="font-extrabold uppercase tracking-widest text-[11px] font-display">Master Production API Key</h4>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md group-hover:border-blue-500/30 transition-all">
                           <code className="flex-1 font-mono text-sm text-blue-200 overflow-hidden text-ellipsis selection:bg-blue-500 selection:text-white">sk_ecotransfo_prod_9921_8b22_f00d</code>
                           <button className="text-[10px] font-black uppercase bg-blue-500 text-white px-6 py-2.5 rounded-xl active:scale-95 transition-all shadow-lg shadow-blue-500/20 font-display">Copier la clé</button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic font-display">Attention: Ne partagez jamais cette clé prod. Elle permet un accès intégral au Grand Livre.</p>
                      </div>
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-[2000ms]">
                         <Database size={240} />
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest font-display">Webhooks Opérationnels</h4>
                      <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 text-center space-y-4">
                         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                            <Database size={24} />
                         </div>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic font-display">Aucun point de terminaison webhook configuré.</p>
                         <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline font-display">Ajouter un endpoint G0</button>
                      </div>
                   </div>
                </div>
              )}

              {['notifications', 'security', 'branding'].includes(activeSegment) && (
                <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/10 blur-3xl animate-pulse"></div>
                      <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center text-slate-200 shadow-xl relative z-10">
                         <Settings size={32} className="animate-[spin_4s_linear_infinite]" />
                      </div>
                   </div>
                   <div className="text-center space-y-2">
                      <p className="text-slate-900 font-extrabold uppercase tracking-[0.2em] text-xs font-display">Module en cours d'optimisation</p>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] font-display italic">Certification Cloud Readiness G4 - EcoTransfo 2024</p>
                   </div>
                </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
}

function SettingInput({ label, value, description }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start group">
       <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-900 uppercase tracking-tight font-display group-hover:text-blue-600 transition-colors uppercase">{label}</label>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.05em] leading-relaxed font-display italic">{description}</p>
       </div>
       <div className="relative h-14">
          <input 
            type="text" 
            defaultValue={value}
            className="w-full h-full px-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-display shadow-inner"
          />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
       </div>
    </div>
  );
}
