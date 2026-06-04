import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { generateProjectReportPDF } from '../lib/pdf-generator';
import { Project, Task, UserProfile } from '../types';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface ReportsPageProps {
  user: UserProfile;
}

export function ReportsPage({ user }: ReportsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      try {
        const pData = StorageService.getProjects();
        const tData = StorageService.getTasks();
        
        // Access Control
        const authorizedProjects = pData.filter(p => 
          user.role === 'OWNER' || 
          p.projectManagerId === user.uid || 
          (p.teamMembers && p.teamMembers.includes(user.uid))
        );
        
        const authProjIds = new Set(authorizedProjects.map(p => p.id));
        const authorizedTasks = tData.filter(t => authProjIds.has(t.projectId));

        setProjects(authorizedProjects);
        setTasks(authorizedTasks);
      } catch (error) {
        console.error("Error fetching data for reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Data for projects status chart
  const statusData = [
    { name: 'Actifs', value: projects.filter(p => p.status === 'ACTIVE').length, color: '#3b82f6' },
    { name: 'Planifiés', value: projects.filter(p => p.status === 'PLANNING').length, color: '#94a3b8' },
    { name: 'Terminés', value: projects.filter(p => p.status === 'COMPLETED').length, color: '#10b981' },
    { name: 'En attente', value: projects.filter(p => p.status === 'ON_HOLD').length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Data for tasks distribution chart
  const taskDistributionData = [
    { name: 'A faire', value: tasks.filter(t => t.status === 'TODO').length, color: '#94a3b8' },
    { name: 'En cours', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'Revue', value: tasks.filter(t => t.status === 'REVIEW').length, color: '#f59e0b' },
    { name: 'Terminé', value: tasks.filter(t => t.status === 'DONE').length, color: '#10b981' },
    { name: 'Bloqué', value: tasks.filter(t => t.status === 'BLOCKED').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const budgetProgressData = projects.map(p => ({
    name: p.name,
    Budget: p.budget,
    Dépensé: p.spent
  })).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-display">
            <FileText className="text-blue-600" size={32} />
            RAPPORTS & KPIS
          </h1>
          <p className="text-slate-500 font-medium mt-1">Analyse approfondie de la performance opérationnelle et financière.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={16} />
            Derniers 30 jours
          </button>
          <button 
            onClick={() => generateProjectReportPDF(projects, tasks, user.displayName)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 cursor-pointer"
          >
            <Download size={16} />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
          title="Taux de Complétion" 
          value={`${taskCompletionRate.toFixed(1)}%`}
          subtitle={`${completedTasks}/${totalTasks} tâches terminées`}
          icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          trend={+2.4}
          color="bg-emerald-50"
        />
        <KPIItem 
          title="Utilisation Budget" 
          value={`${budgetUtilization.toFixed(1)}%`}
          subtitle={`${totalSpent.toLocaleString()} MAD dépensés`}
          icon={<TrendingUp size={24} className="text-blue-600" />}
          trend={-1.2}
          color="bg-blue-50"
        />
        <KPIItem 
          title="Projets Actifs" 
          value={activeProjects.toString()}
          subtitle={`${totalProjects} projets au total`}
          icon={<Briefcase size={24} className="text-slate-600" />}
          trend={0}
          color="bg-slate-50"
        />
        <KPIItem 
          title="Alertes Critiques" 
          value="2"
          subtitle="Problèmes de délais identifiés"
          icon={<AlertCircle size={24} className="text-rose-600" />}
          trend={+1}
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget vs Spent Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Performance Financière par Projet</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Comparaison Budget vs Réel (MAD)</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                />
                <Bar dataKey="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Dépensé" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm shadow-slate-100/50">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mb-8">Répartition par État</h2>
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Projets</p>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Unités de Travail</p>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {taskDistributionData.map((entry, index) => <Cell key={`cell-task-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Health Table */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mb-6">État de Santé des Projets</h2>
          <div className="space-y-4">
            {projects.slice(0, 4).map((p, idx) => {
              const variance = (p.budget || 0) - (p.spent || 0);
              const isOverBudget = variance < 0;
              return (
                <div key={`${p.id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                      isOverBudget ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {p.progress}%
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-black",
                      isOverBudget ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {isOverBudget ? 'Risque Financier' : 'Sur la Bonne Voie'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      VAR: {Math.abs(variance).toLocaleString()} MAD
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resources Allocation Summary */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display">Allocation des Ressources</h2>
            <div className="px-3 py-1 bg-blue-50 rounded-lg text-[10px] font-black text-blue-600 tracking-widest uppercase">PÉRIODE ACTUELLE</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Lun', value: 45 },
                { name: 'Mar', value: 52 },
                { name: 'Mer', value: 48 },
                { name: 'Jeu', value: 61 },
                { name: 'Ven', value: 55 },
                { name: 'Sam', value: 20 },
                { name: 'Dim', value: 15 },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Charge Moyenne</p>
              <p className="text-xl font-bold text-slate-900 mt-1">72%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heures Hebdo</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1,240h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPIItemProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: number;
  color: string;
}

function KPIItem({ title, value, subtitle, icon, trend, color }: KPIItemProps) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm shadow-slate-100/50 hover:border-blue-200 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", color)}>
          {icon}
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tracking-wider uppercase",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none font-display mb-2">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 font-display">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{subtitle}</p>
    </div>
  );
}
