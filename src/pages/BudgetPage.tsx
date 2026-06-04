import { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { Project, UserProfile } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart2, 
  PieChart as PieIcon,
  Search,
  Filter,
  Download,
  Plus,
  Shield,
  Activity,
  Target,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export function BudgetPage({ user }: { user: UserProfile }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanceData() {
      try {
        const data = await api.get('/projects');
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinanceData();
  }, []);

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);
  const remaining = totalBudget - totalSpent;

  const data = projects.map(p => ({
     name: p.name.split(' ').slice(0, 2).join(' '),
     budget: p.budget,
     spent: p.spent
  })).slice(0, 8);

  const pieData = [
     { name: 'Consommé', value: totalSpent, color: '#2563eb' },
     { name: 'Restant', value: remaining, color: '#10b981' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in duration-1000">
         <div className="relative">
            <div className="w-16 h-16 border-8 border-slate-50 rounded-full shadow-inner"></div>
            <div className="w-16 h-16 border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
         </div>
         <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display">Initialisation du Noyau Financier</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Consolidation du Grand Livre • EcoTransfo EPPM</p>
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
                 <Shield size={16} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-display italic">Direction Financière • EPPM G-Sync v4</p>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-display uppercase">Audit des Engagements <span className="text-blue-600 italic">CAPEX</span></h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest font-display italic">Portefeuille consolidé • Période fiscale 2026.Q1</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-white border border-slate-100 rounded-[28px] text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 flex items-center gap-3 transition-all font-display shadow-sm group">
            <Download size={18} className="group-hover:translate-y-1 transition-transform" />
            <span>Rapport Centralisé G0</span>
          </button>
          <button className="btn-primary px-8 py-4 shadow-blue-500/10 font-display text-[11px] tracking-widest">
            <Plus size={20} />
            RÉVISION BUDGÉTAIRE
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <FinanceCard title="Enveloppe CAPEX Certifiée" value={formatCurrency(totalBudget)} icon={Shield} color="bg-slate-900" />
         <FinanceCard title="Déboursement Consommé" value={formatCurrency(totalSpent)} icon={Activity} color="bg-blue-600" trend="-12.4% vs Prévision" />
         <FinanceCard title="Trésorerie Project Reserve" value={formatCurrency(remaining)} icon={Target} color="bg-emerald-500" trend="+5.2% Efficacité" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Chart - Analytics View */}
        <div className="lg:col-span-2 friendly-card p-1 shadow-sm border-slate-100 overflow-hidden flex flex-col group bg-white hover:border-blue-200 transition-all duration-500">
           <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-4 font-display">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                       <BarChart2 size={18} />
                    </div>
                    Analyse du Burn-Rate
                 </h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display ml-14">Comparatif Budget/Réel • Multi-Portefeuille</p>
              </div>
              <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 font-display ml-14 sm:ml-0">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-900 shadow-lg shadow-slate-900/20"></div> BUDGET</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div> CONSUMMÉ</div>
              </div>
           </div>
           <div className="p-10 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data}>
                    <defs>
                       <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/><stop offset="95%" stopColor="#0F172A" stopOpacity={0}/></linearGradient>
                       <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'Plus Jakarta Sans'}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'Plus Jakarta Sans'}} />
                    <Tooltip 
                       contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', padding: '20px'}}
                       itemStyle={{color: '#ffffff', fontSize: '11px', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans'}}
                       labelStyle={{color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold'}}
                       cursor={{stroke: '#cbd5e1', strokeWidth: 1}}
                    />
                    <Area type="monotone" dataKey="budget" stroke="#0F172A" fillOpacity={1} fill="url(#colorBudget)" strokeWidth={4} dot={{ r: 4, fill: '#0F172A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="spent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
           <div className="bg-slate-50/50 border-t border-slate-50 p-6 flex items-center justify-center gap-6">
              <Activity size={16} className="text-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">EPPM Financial Core G-SYNC v4.2 • Distributed Ledger Audit Ready</span>
           </div>
        </div>

        {/* Global Utilization - Gauge View */}
        <div className="friendly-card p-1 bg-slate-900 text-white shadow-2xl border-slate-800 flex flex-col overflow-hidden relative group">
           <div className="p-8 border-b border-white/5 relative z-10">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-4 font-display">
                 <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <PieIcon size={18} />
                 </div>
                 Capacité d'Absorption
              </h3>
           </div>
           <div className="p-10 flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="relative w-full h-80 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={pieData} cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={12} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={index} fill={entry.color} className="drop-shadow-2xl" />)}
                       </Pie>
                       <Tooltip 
                         contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold'}}
                         itemStyle={{color: '#fff'}}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-display italic">Trésorerie Libre</p>
                    <p className="text-6xl font-black text-white tracking-tighter font-display leading-none">{((remaining/totalBudget)*100).toFixed(1)}%</p>
                 </div>
              </div>
              <div className="w-full mt-10 space-y-4">
                 <div className="flex justify-between items-center p-6 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-all cursor-default group/item">
                    <div className="space-y-1">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">Engagé Certifié</span>
                       <p className="text-xl font-black text-white font-display uppercase tracking-tight">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="w-2 h-10 bg-blue-500 rounded-full group-hover/item:scale-y-125 transition-transform"></div>
                 </div>
                 <div className="flex justify-between items-center p-6 bg-emerald-500/5 rounded-[28px] border border-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-default group/item">
                    <div className="space-y-1">
                       <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-display">Marge Project Reserve</span>
                       <p className="text-xl font-black text-emerald-400 font-display uppercase tracking-tight">{formatCurrency(remaining)}</p>
                    </div>
                    <div className="w-2 h-10 bg-emerald-400 rounded-full group-hover/item:scale-y-125 transition-transform"></div>
                 </div>
              </div>
           </div>
           <Activity className="absolute -bottom-20 -right-20 text-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-[2000ms] group-hover:scale-125 pointer-events-none" size={300} />
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="friendly-card p-1 bg-white border-slate-100 shadow-sm relative group hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all overflow-hidden flex flex-col group/card">
       <div className="p-10">
          <div className="flex items-start justify-between mb-10">
             <div className={cn("h-16 w-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-transform group-hover/card:scale-110 duration-500", color)}>
                <Icon size={24} />
             </div>
             {trend && (
                <div className="text-right space-y-1">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-display italic">Live Performance</p>
                   <div className={cn("inline-flex items-center gap-2 text-[11px] font-black italic px-3 py-1 rounded-full border shadow-sm", 
                     trend.startsWith('+') ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
                   )}>
                      {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {trend}
                   </div>
                </div>
             )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-display italic">{title}</p>
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter font-display uppercase leading-none">{value}</h4>
       </div>
       <div className="h-2 w-full bg-slate-50 relative mt-auto overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '70%' }}
            transition={{ duration: 2, ease: "easeOut" }}
            className={cn("h-full opacity-40", color)}
          ></motion.div>
       </div>
       <div className="absolute top-6 right-6 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-lg">
             <ArrowUpRight size={18} />
          </div>
       </div>
    </div>
  );
}
