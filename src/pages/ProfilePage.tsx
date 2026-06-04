import { UserProfile } from '../types';
import { User, Mail, Building, Shield, Calendar, Clock, Edit3, Camera, ArrowRight, Activity } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

export function ProfilePage({ user }: { user: UserProfile }) {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="relative h-64 bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl border border-slate-800 group">
         <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]"></div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
         <button className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all border border-white/10 shadow-xl group-hover:scale-105 active:scale-95 font-display">
            <Camera size={18} /> Modifier la bannière de profil
         </button>
      </div>

      <div className="px-12 -mt-24 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative group p-1.5 bg-white rounded-[44px] shadow-2xl ring-1 ring-slate-100">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-40 h-40 rounded-[38px] object-cover" />
              ) : (
                <div className="w-40 h-40 rounded-[38px] bg-slate-50 flex items-center justify-center text-5xl font-black text-slate-300 font-display italic">
                  {user.displayName.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 rounded-[38px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                <Camera size={32} className="text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-[6px] border-white rounded-full shadow-lg"></div>
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-display">{user.displayName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-blue-100 font-display italic">{user.role}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-display italic mx-2">•</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-display">{user.department || 'Dép. Infrastructure Stratégique'}</span>
              </div>
            </div>
          </div>
          <button className="btn-primary px-10 py-4 shadow-blue-500/10 font-display text-[11px] tracking-widest group">
            <Edit3 size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Éditer le Profil G4</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            <section className="friendly-card p-12 shadow-sm border-slate-100 bg-white group">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-4 font-display">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                      <User size={20} />
                   </div>
                   Identité Métier
                 </h3>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-display italic">Audit Cycle: 2024.B</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                 <InfoField label="Adresse Email Corporative" value={user.email} icon={Mail} />
                 <InfoField label="Unité de Rattachement" value={user.department || 'Direction Technique Centrale'} icon={Building} />
                 <InfoField label="Privilèges Système" value={user.role} icon={Shield} />
                 <InfoField label="Date d'Enrôlement" value={formatDate(user.createdAt)} icon={Calendar} />
              </div>
            </section>

            <section className="friendly-card p-12 shadow-sm border-slate-100 bg-white group hover:border-blue-500 transition-all duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50 font-display">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Clock size={20} />
                   </div>
                   Performance Logistique
                 </h3>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Actif</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                 <StatItem label="Projets Pilotés" value="12" color="text-blue-600" />
                 <StatItem label="Lots Actifs" value="48" color="text-amber-600" />
                 <StatItem label="Heures Audit" value="156" color="text-indigo-600" />
                 <StatItem label="KPI Index" value="9.2" color="text-emerald-600" />
              </div>
            </section>
          </div>

          <div className="space-y-12">
             <section className="friendly-card p-10 bg-white shadow-sm border-slate-100 group">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4 font-display">Compétences Certifiées</h3>
                <div className="flex flex-wrap gap-2.5">
                   {['Project Management', 'Construction HT', 'Budgeting', 'Risk Analysis', 'Primavera P6', 'Eco-Design'].map(skill => (
                     <span key={skill} className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all cursor-default shadow-sm font-display">{skill}</span>
                   ))}
                </div>
             </section>

             <section className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                <div className="relative z-10 space-y-8">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                         <Shield size={24} className="text-blue-400" />
                      </div>
                      <h3 className="font-black uppercase tracking-[0.2em] text-xs font-display">Sécurisation G4</h3>
                   </div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.05em] leading-relaxed font-display italic">
                      Authentification à double facteur (2FA) activée • Protection biométrique & Chiffrement AES-256 opérationnel.
                   </p>
                   <button className="w-full py-4 bg-white text-slate-900 font-black uppercase tracking-widest rounded-2xl text-[10px] transition-all shadow-xl hover:bg-blue-400 hover:text-white active:scale-95 font-display flex items-center justify-center gap-4 group/btn">
                      <span>Gérer la voûte sécurité</span>
                      <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                   </button>
                </div>
                <Activity className="absolute -bottom-12 -right-12 text-blue-500 opacity-5 group-hover:opacity-10 transition-all duration-[2000ms] group-hover:scale-125" size={200} />
             </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: any) {
  return (
    <div className="space-y-3 group/field">
       <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">
          <Icon size={16} className="group-hover/field:text-blue-500 transition-colors" />
          {label}
       </div>
       <p className="font-extrabold text-slate-900 text-sm truncate uppercase tracking-tight font-display">{value}</p>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-50 text-center hover:bg-white hover:shadow-xl transition-all duration-500 group shadow-inner">
       <p className={cn("text-3xl font-black tracking-tighter font-display transition-transform group-hover:scale-110 duration-500 leading-none", color)}>{value}</p>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 font-display italic">{label}</p>
    </div>
  );
}
