import { useEffect, useState, useMemo, useRef } from 'react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { Project, Task, UserProfile, Lot } from '../types';
import { cn, formatDate, getClientName } from '../lib/utils';
import { Plus, X, Search, GitBranch, Settings, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { LotModal } from '../components/LotModal';
import { TaskModal } from '../components/TaskModal';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';

const DAY_WIDTH = 22; // px per day
const WEEK_WIDTH = DAY_WIDTH * 7; // px per week

const marocHolidays2026 = [
  { start: '2026-01-01', end: '2026-01-01', name: 'Nouvel An' },
  { start: '2026-01-11', end: '2026-01-11', name: 'Manifeste de l\'Indépendance' },
  { start: '2026-03-20', end: '2026-03-21', name: 'Aïd al-Fitr' },
  { start: '2026-05-01', end: '2026-05-01', name: 'Fête du Travail' },
  { start: '2026-05-27', end: '2026-05-28', name: 'Aïd al-Adha' },
  { start: '2026-06-22', end: '2026-06-28', name: 'EID HOLIDAY' }, // Exactly matching the image request
  { start: '2026-07-30', end: '2026-07-30', name: 'Fête du Trône' },
  { start: '2026-08-14', end: '2026-08-14', name: 'Oued Ed-Dahab' },
  { start: '2026-08-20', end: '2026-08-20', name: 'Révolution' },
  { start: '2026-08-21', end: '2026-08-21', name: 'Jeunesse' },
  { start: '2026-11-06', end: '2026-11-06', name: 'Marche Verte' },
  { start: '2026-11-18', end: '2026-11-18', name: 'Indépendance' },
];

function isHolidayObj(dateStr: string) {
  const t = new Date(dateStr).getTime();
  for (const h of marocHolidays2026) {
    const s = new Date(h.start).getTime();
    const e = new Date(h.end).getTime();
    if (t >= s && t <= e) return h;
  }
  return null;
}

export function GlobalGantt({ user }: { user: UserProfile }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!ganttRef.current) return;
    try {
      setExporting(true);
      toast.info('Génération de l\'image en cours...');
      
      // We temporarily need to remove hidden overflow from right panel to capture the full width
      const rPanel = document.getElementById('right-panel-scroll');
      const container = ganttRef.current;
      
      let origRPanelStyle = '';
      let origContainerStyle = '';
      
      if (rPanel) {
        origRPanelStyle = rPanel.style.cssText;
        rPanel.style.overflowX = 'visible';
        rPanel.style.width = 'max-content';
      }
      origContainerStyle = container.style.cssText;
      container.style.width = 'max-content';

      // Wait a tick for styles to apply
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(ganttRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Restore
      if (rPanel) {
        rPanel.style.cssText = origRPanelStyle;
      }
      container.style.cssText = origContainerStyle;

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Gantt_${selectedProject?.name || 'Global'}_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      
      toast.success('Image exportée avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export de l\'image.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = [];
      
      if (!selectedProject) {
        // Export Overview
        dataToExport.push(['Nom du Projet', 'Client', 'Avancement', 'Date de Début', 'Date de Fin']);
        filteredProjects.forEach(p => {
          dataToExport.push([p.name, getClientName(p.client), `${p.progress}%`, formatDate(p.startDate), formatDate(p.endDate)]);
        });
      } else {
        // Export Detailed
        dataToExport.push(['Tâche / Groupe', 'Responsable', 'Avancement', 'Date de Début', 'Date de Fin', 'Type']);
        projectLots.forEach(lot => {
          dataToExport.push([lot.name, '', `${lot.progress}%`, formatDate(lot.startDate), formatDate(lot.endDate), 'Groupe']);
          const lTasks = projectTasks.filter(t => t.lotId === lot.id);
          lTasks.forEach(task => {
            const userName = users.find(u => u.uid === task.assigneeId)?.displayName || (task as any).assigneeName || 'Production Team';
            dataToExport.push([`  ${task.name}`, userName, `${task.progress}%`, formatDate(task.startDate), formatDate(task.endDate), 'Tâche']);
          });
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plannification");
      XLSX.writeFile(wb, `Planification_${selectedProject?.name || 'Globale'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Fichier Excel exporté avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export Excel.');
    }
  };

  const loadData = async () => {
    try {
      const pDataArgs = await api.get('/projects');
      const pData = Array.isArray(pDataArgs) ? pDataArgs : [];
      const tDataArgs = await api.get('/tasks');
      const tData = Array.isArray(tDataArgs) ? tDataArgs : [];
      
      const rawLots = StorageService.getLots();
      const lData = Array.isArray(rawLots) ? rawLots.map((l: any) => ({
        ...l,
        id: String(l.id),
        projectId: String(l.projectId || l.project_id || ''),
        status: l.status || 'PLANNING',
        startDate: l.startDate || l.start_date || '2026-01-01',
        endDate: l.endDate || l.end_date || '2026-12-31',
        progress: l.progress !== undefined ? Number(l.progress) : (l.progress_percentage !== undefined ? Number(l.progress_percentage) : 0)
      })) : [];
      const uData = StorageService.getUsers();
      
      const authorizedProjects = pData.filter((p: any) => 
        user.role === 'OWNER' || 
        p.manager_id === user.uid || 
        (p.team_members && p.team_members.includes(user.uid)) ||
        true // temporary fallback
      );
      
      const normalizedProjects = authorizedProjects.map((p: any) => ({
        ...p,
        id: String(p.id),
        name: p.name || 'Sans Nom',
        description: p.description || '',
        client: p.client || 'Client Inconnu',
        clientId: p.client_id ? String(p.client_id) : (p.clientId ? String(p.clientId) : ''),
        budget: typeof p.budget === 'string' ? parseFloat(p.budget) : (p.budget || 0),
        spent: typeof p.spent === 'string' ? parseFloat(p.spent) : (p.spent || 0),
        startDate: p.start_date || p.startDate || '',
        endDate: p.end_date || p.endDate || '',
        progress: p.progress_percentage !== undefined ? Number(p.progress_percentage) : (p.progress !== undefined ? Number(p.progress) : 0),
        priority: p.priority || 'MEDIUM',
        status: p.status || 'PLANNING',
        projectManagerId: p.manager_id ? String(p.manager_id) : (p.projectManagerId ? String(p.projectManagerId) : ''),
        teamMembers: Array.isArray(p.team_members) ? p.team_members.map(String) : (Array.isArray(p.teamMembers) ? p.teamMembers.map(String) : []),
        createdAt: p.created_at || p.createdAt || '',
        updatedAt: p.updated_at || p.updatedAt || ''
      }));

      // Sort normalized projects using valid startDate string
      const sortedProjects = [...normalizedProjects].sort((a: any, b: any) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return timeA - timeB;
      });

      const normalizedTasks = tData.map((t: any) => {
        let progressVal = 0;
        if (t.progress !== undefined) {
          progressVal = Number(t.progress);
        } else if (t.progress_percentage !== undefined) {
          progressVal = Number(t.progress_percentage);
        } else {
          if (t.status === 'DONE') progressVal = 100;
          else if (t.status === 'IN_PROGRESS') progressVal = 45;
        }

        let startD = t.startDate || t.start_date || (t.project && (t.project.startDate || t.project.start_date)) || t.created_at?.split('T')[0] || '2026-01-01';
        let endD = t.endDate || t.end_date || t.due_date || (t.project && (t.project.endDate || t.project.end_date)) || t.due_date || '2026-12-31';

        let assigneeIdVal = '';
        if (t.assigneeId) {
          assigneeIdVal = String(t.assigneeId);
        } else if (t.assigned_to_user_id) {
          assigneeIdVal = String(t.assigned_to_user_id);
        }

        let assigneeNameVal = '';
        if (t.assignee) {
          if (typeof t.assignee === 'string') {
            assigneeNameVal = t.assignee;
          } else if (t.assignee.displayName) {
            assigneeNameVal = t.assignee.displayName;
          } else if (t.assignee.name) {
            assigneeNameVal = t.assignee.name;
          }
        }

        return {
          id: String(t.id),
          projectId: String(t.projectId || t.project_id || (t.project && t.project.id) || ''),
          lotId: t.lotId ? String(t.lotId) : (t.lot_id ? String(t.lot_id) : undefined),
          name: t.name || 'Sans nom',
          description: t.description || '',
          assigneeId: assigneeIdVal,
          assigneeName: assigneeNameVal,
          startDate: startD,
          endDate: endD,
          status: t.status === 'IN_PROGRESS' || t.status === 'ACTIVE' ? 'IN_PROGRESS' : (t.status || 'TODO'),
          priority: t.priority || 'MEDIUM',
          progress: progressVal,
          dependencies: Array.isArray(t.dependencies) ? t.dependencies.map(String) : [],
          comments: Array.isArray(t.comments) ? t.comments : [],
          attachments: Array.isArray(t.attachments) ? t.attachments : [],
          createdAt: t.createdAt || t.created_at || '',
          updatedAt: t.updatedAt || t.updated_at || '',
          estimatedHours: t.estimatedHours || t.estimated_hours || 0,
          actualHours: t.actualHours || t.actual_hours || 0,
          parentTaskId: t.parentTaskId || t.parent_task_id ? String(t.parentTaskId || t.parent_task_id) : undefined,
          parent_task_id: t.parent_task_id || t.parentTaskId ? String(t.parent_task_id || t.parentTaskId) : undefined,
        };
      });

      setProjects(sortedProjects);
      setTasks(normalizedTasks);
      setLots(lData);
      setUsers(uData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePlanningSuccess = () => {
    loadData();
    setIsTaskModalOpen(false);
    setIsLotModalOpen(false);
    setSelectedTask(null);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedProjectId && p.id !== selectedProjectId) return false;
      if (search) {
        return (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
               getClientName(p.client).toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [projects, search, selectedProjectId]);

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  const projectLots = useMemo(() => {
    if (!selectedProject) return [];
    return lots.filter(l => l.projectId === selectedProject.id).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [lots, selectedProject]);

  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter(t => t.projectId === selectedProject.id);
  }, [tasks, selectedProject]);

  // Determine Timeline Dates based on selected projects OR all filtered
  const { minDate, maxDate } = useMemo(() => {
    const parseDateSafe = (dStr: any) => {
      if (!dStr) return null;
      const d = new Date(dStr);
      const time = d.getTime();
      return isNaN(time) ? null : d;
    };

    if (selectedProject) {
        const pStart = parseDateSafe(selectedProject.startDate) || new Date();
        const pEnd = parseDateSafe(selectedProject.endDate) || new Date(pStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        let minTime = pStart.getTime();
        let maxTime = pEnd.getTime();
        
        const validTaskStartTimes = projectTasks
          .map(t => parseDateSafe(t.startDate || (t as any).start_date || (t as any).created_at))
          .filter((d): d is Date => d !== null)
          .map(d => d.getTime());

        const validTaskEndTimes = projectTasks
          .map(t => parseDateSafe(t.endDate || (t as any).end_date || (t as any).due_date || (t as any).updated_at))
          .filter((d): d is Date => d !== null)
          .map(d => d.getTime());

        if (validTaskStartTimes.length > 0) {
           minTime = Math.min(minTime, ...validTaskStartTimes);
        }
        if (validTaskEndTimes.length > 0) {
           maxTime = Math.max(maxTime, ...validTaskEndTimes);
        }

        if (maxTime - minTime < 30 * 24 * 60 * 60 * 1000) {
           maxTime = minTime + 30 * 24 * 60 * 60 * 1000;
        }

        const dMin = new Date(minTime);
        // Align to Monday
        const day = dMin.getDay();
        dMin.setDate(dMin.getDate() - (day === 0 ? 6 : day - 1));
        
        const dMax = new Date(maxTime);
        // Pad 2 weeks to right
        dMax.setDate(dMax.getDate() + 14);
        const maxDay = dMax.getDay();
        if (maxDay !== 0) {
          dMax.setDate(dMax.getDate() + (7 - maxDay));
        }
        
        return { minDate: dMin, maxDate: dMax };
    } else {
        let year = new Date().getFullYear();
        const validProjectStartTimes = filteredProjects
          .map(p => parseDateSafe(p.startDate))
          .filter((d): d is Date => d !== null)
          .map(d => d.getTime());

        if (validProjectStartTimes.length > 0) {
          year = new Date(Math.min(...validProjectStartTimes)).getFullYear();
        }

        const dMin = new Date(`${year}-01-01`);
        // Align to Monday
        const day = dMin.getDay();
        dMin.setDate(dMin.getDate() - (day === 0 ? 6 : day - 1));

        const dMax = new Date(`${year}-12-31`);
        // Align to Sunday
        const maxDay = dMax.getDay();
        if (maxDay !== 0) {
          dMax.setDate(dMax.getDate() + (7 - maxDay));
        }

        return { minDate: dMin, maxDate: dMax };
    }
  }, [filteredProjects, selectedProject, projectTasks, tasks]);

  const timelineWeeks = useMemo(() => {
     const weeks = [];
     let curr = new Date(minDate);
     let weekNum = 1;
     const end = maxDate.getTime();
     
     while (curr.getTime() <= end) {
        const weekStart = new Date(curr);
        const weekEnd = new Date(curr);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const days = [];
        let hasHoliday = false;
        let holidayName = '';
        
        for (let i=0; i<7; i++) {
           const d = new Date(weekStart);
           d.setDate(d.getDate() + i);
           const dStr = d.toISOString().split('T')[0];
           const hol = isHolidayObj(dStr);
           if (hol) {
              hasHoliday = true;
              holidayName = hol.name;
           }
           days.push({
             dateStr: dStr,
             dateObj: d,
             dayIndex: d.getDay(),
             letter: ['D','L','M','M','J','V','S'][d.getDay()],
             isWeekend: d.getDay() === 0 || d.getDay() === 6,
             isHoliday: !!hol
           });
        }
        
        weeks.push({
           weekNumber: weekNum++,
           startStr: `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth()+1).toString().padStart(2, '0')}/${weekStart.getFullYear()}`,
           endStr: `${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth()+1).toString().padStart(2, '0')}/${weekEnd.getFullYear()}`,
           start: weekStart,
           end: weekEnd,
           days,
           hasHoliday,
           holidayName
        });
        
        curr.setDate(curr.getDate() + 7);
     }
     return weeks;
  }, [minDate, maxDate]);

  useEffect(() => {
    if (!loading) {
      const rPanel = document.getElementById('right-panel-scroll');
      if (rPanel) {
        const todayObj = new Date();
        const diffDays = Math.floor((todayObj.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const leftPos = diffDays * DAY_WIDTH;
        
        // Wait for render
        setTimeout(() => {
          const centerOffset = rPanel.clientWidth / 2;
          rPanel.scrollTo({
            left: Math.max(0, leftPos - centerOffset),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [loading, minDate, selectedProjectId]);

  const quarters = useMemo(() => {
     let qCounts = [0, 0, 0, 0];
     timelineWeeks.forEach(w => {
       w.days.forEach(d => {
         const m = d.dateObj.getMonth();
         const q = Math.floor(m / 3);
         qCounts[q]++;
       });
     });
     return [
       { name: "Trimestre 1", days: qCounts[0] },
       { name: "Trimestre 2", days: qCounts[1] },
       { name: "Trimestre 3", days: qCounts[2] },
       { name: "Trimestre 4", days: qCounts[3] },
     ].filter(q => q.days > 0);
  }, [timelineWeeks]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in duration-1000">
       <div className="w-16 h-16 border-8 border-t-emerald-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display">Calcul de la Baseline...</p>
    </div>
  );

  // Helper styles based on image
  const GROUP_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
    '#64748b'  // slate-500
  ];

  return (
    <div ref={ganttRef} className="px-1 xl:px-4 pb-12 pt-4 w-full animate-in fade-in duration-700 bg-slate-50/50">
      {/* Top Header - Modernized */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl mb-4 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-display">
            Planification Baseline
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {selectedProject ? `Détail du projet: ${selectedProject.name}` : 'Vue globale des projets actifs'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-bold font-mono text-slate-600">
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-sans mb-1">Début du projet</span>
              <span className="text-emerald-600">
                {selectedProject ? formatDate(selectedProject.startDate) : (filteredProjects[0] ? formatDate(filteredProjects[0].startDate) : 'N/A')}
              </span>
           </div>
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-sans mb-1">Semaine Actuelle</span>
              <span className="text-blue-600">
                SEMAINE {timelineWeeks.length > 0 ? timelineWeeks.find(w => w.start <= new Date() && w.end >= new Date())?.weekNumber || 4 : 4}
              </span>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-4 px-1 ${exporting ? 'invisible' : ''}`}>
         {/* Selection Dropdown */}
         <div className="relative shrink-0">
           <select
             value={selectedProjectId || 'ALL'}
             onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? null : e.target.value)}
             className="w-full md:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-display appearance-none pr-10 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
           >
             <option value="ALL">📈 Tous les projets (Vue Globale)</option>
             {projects.map((p) => (
               <option key={p.id} value={p.id}>
                 📁 {p.name}
               </option>
             ))}
           </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
               <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
             </svg>
           </div>
         </div>
         {!selectedProject ? (
           <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm w-96 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
             <Search size={16} className="text-slate-400 mr-3" />
             <input type="text" placeholder="Rechercher un projet..." value={search} onChange={e => setSearch(e.target.value)} className="w-full text-xs font-bold text-slate-900 outline-none placeholder-slate-400" />
           </div>
         ) : (
           <button onClick={() => setSelectedProjectId(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-black text-[10px] shadow-sm uppercase tracking-widest font-display transition-colors">
              Retour à la vue globale
           </button>
         )}
         
         <div className="flex items-center gap-2">
            {selectedProject && (
              <>
                <button 
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest font-display flex items-center gap-1.5 transition-colors border border-emerald-200 shadow-sm"
                >
                   <FileSpreadsheet size={14} />
                   Excel
                </button>
                <button 
                  onClick={handleExportImage}
                  disabled={exporting}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl font-black text-[10px] uppercase tracking-widest font-display flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
                >
                   <Download size={14} />
                   {exporting ? 'Export en cours...' : 'Image'}
                </button>
              </>
            )}
            
            <button onClick={() => window.location.href='/tasks'} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-black text-[10px] uppercase tracking-widest font-display flex items-center gap-1.5 transition-colors border border-blue-200 shadow-sm ml-2 mr-2">
               <GitBranch size={14} /> Vue Kanban
            </button>

            {user.role !== 'CLIENT' && (
              <>
                <button 
                   onClick={() => setIsLotModalOpen(true)} 
                   disabled={!selectedProjectId || selectedProjectId === 'ALL'}
                   className={cn("px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest font-display flex items-center gap-1.5 transition-colors border border-emerald-200", (!selectedProjectId || selectedProjectId === 'ALL') && "opacity-50 cursor-not-allowed grayscale")}
                >
                   <Plus size={14} /> Nouveau Groupe
                </button>
                <button 
                   onClick={() => setIsTaskModalOpen(true)} 
                   disabled={!selectedProjectId || selectedProjectId === 'ALL'}
                   className={cn("px-4 py-2 btn-primary rounded-xl font-black text-[10px] uppercase tracking-widest font-display flex items-center gap-1.5", (!selectedProjectId || selectedProjectId === 'ALL') && "opacity-50 cursor-not-allowed")}
                >
                   <Plus size={14} /> Nouvelle Tâche
                </button>
              </>
            )}
         </div>
      </div>
      
      {!selectedProject && (
        <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-2xl flex items-center gap-3 mb-4 mx-1 xl:mx-4">
          <div className="w-6 h-6 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-600 shrink-0">
            <span className="text-xs">⚠️</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-black text-amber-800/90 uppercase tracking-widest font-display">
            Sélectionnez un projet pour débloquer les boutons "Nouvelle Tâche" et "Nouveau Groupe".
          </p>
        </div>
      )}

      {/* Main Gantt Area */}
      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm flex overflow-hidden" style={{ minHeight: '600px' }}>
         
         {/* Left Table Panel */}
         <div className="w-[450px] lg:w-[500px] border-r border-slate-200 flex flex-col shrink-0 bg-white z-20">
            {/* Table Header */}
            <div className="bg-slate-50 text-slate-500 flex text-[9px] font-black uppercase tracking-widest h-14 items-center shrink-0 border-b border-slate-200">
               <div className="w-[200px] lg:w-[220px] px-4 font-display">Tâche / Groupe</div>
               <div className="w-[90px] lg:w-[100px] px-2 font-display text-center">Responsable</div>
               <div className="w-[60px] px-2 font-display text-center">% Avanc.</div>
               <div className="w-[60px] px-2 font-display text-center">Début</div>
               <div className="flex-1 px-2 font-display text-center">Fin</div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10 bg-white" id="left-panel-scroll">
               {!selectedProject ? (
                 // Overview Mode Details
                 filteredProjects.map((p, i) => (
                   <div key={p.id} className="contents">
                      <div 
                         className={cn("flex h-12 items-center border-b border-slate-100 cursor-pointer transition-colors duration-200", hoveredId === p.id ? "bg-blue-50/80" : "hover:bg-blue-50", hoveredId && hoveredId !== p.id ? "opacity-30" : "opacity-100")} 
                         onClick={() => setSelectedProjectId(p.id)}
                         onMouseEnter={() => setHoveredId(p.id)}
                         onMouseLeave={() => setHoveredId(null)}
                      >
                         <div className="w-[200px] lg:w-[220px] px-4 font-bold text-[10px] truncate uppercase text-slate-800 font-display flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                           {p.name}
                         </div>
                         <div className="w-[90px] lg:w-[100px] px-2 text-[9px] font-medium text-slate-500 truncate text-center">{getClientName(p.client)}</div>
                         <div className="w-[60px] px-2 text-[10px] font-bold text-slate-900 text-center">{p.progress}%</div>
                         <div className="w-[60px] px-2 text-[9px] font-mono text-slate-500 text-center">{formatDate(p.startDate)}</div>
                         <div className="flex-1 px-2 text-[9px] font-mono text-slate-500 text-center">{formatDate(p.endDate)}</div>
                      </div>
                   </div>
                 ))
               ) : (
                 // Detailed Project Mode
                 [
                   ...projectLots.map(lot => ({ type: 'lot' as const, lot, tasks: projectTasks.filter(t => t.lotId === lot.id) })),
                   ...projectTasks.filter(t => !t.lotId && !t.parent_task_id && !t.parentTaskId).map(pt => ({ type: 'taskGroup' as const, lot: pt as any, tasks: projectTasks.filter(c => c.parent_task_id === pt.id || c.parentTaskId === pt.id) }))
                 ].map((group, idx) => {
                    const lot = group.lot;
                    const lColor = GROUP_COLORS[idx % GROUP_COLORS.length];
                    const lTasks = group.tasks;
                    return (
                      <div key={lot.id} className="contents">
                         {/* Group Row */}
                         <div 
                            className={cn("flex h-10 items-center border-b border-slate-100 relative z-10 group transition-colors duration-200", hoveredId === lot.id ? "bg-slate-100/80" : "bg-slate-50/80", hoveredId && hoveredId !== lot.id ? "opacity-30" : "opacity-100")}
                            onMouseEnter={() => setHoveredId(lot.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                              if (group.type === 'taskGroup' && user.role !== 'CLIENT') {
                                setSelectedTask(lot as any);
                                setIsTaskModalOpen(true);
                              }
                            }}
                         >
                            <div className="w-[200px] lg:w-[220px] px-4 font-black text-[10px] truncate uppercase text-slate-900 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 shrink-0", group.type === 'lot' ? 'rounded-sm' : 'rounded-full')} style={{ backgroundColor: lColor }}></span>
                                {lot.name}
                              </div>
                              <Settings size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 cursor-pointer transition-opacity" onClick={(e) => { e.stopPropagation(); /* edit lot */ }} />
                            </div>
                            <div className="w-[90px] lg:w-[100px] px-2 text-[9px] truncate text-center"></div>
                            <div className="w-[60px] px-2 text-[10px] font-black text-slate-700 text-center">{lot.progress ?? (lot as any).progress_percentage ?? (lot.status === 'DONE' ? 100 : 0)}%</div>
                            <div className="w-[60px] px-2 text-[9px] font-mono text-slate-500 text-center font-bold">{formatDate(lot.startDate || (lot as any).start_date || (lot as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString()))}</div>
                            <div className="flex-1 px-2 text-[9px] font-mono text-slate-500 text-center font-bold">{formatDate(lot.endDate || (lot as any).end_date || (lot as any).due_date || (lot as any).updated_at || lot.startDate || (lot as any).start_date || (lot as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString()))}</div>
                         </div>
                         {/* Task Rows */}
                         {lTasks.map(task => {
                           const userName = users.find(u => u.uid === task.assigneeId)?.displayName || (task as any).assigneeName || 'Production Team';
                           return (
                             <div 
                               key={task.id} 
                               className={cn("flex h-10 items-center border-b border-slate-50 group transition-colors duration-200", hoveredId === task.id ? "bg-slate-50/80" : "hover:bg-slate-50/50", hoveredId && hoveredId !== task.id ? "opacity-30" : "opacity-100")}
                               onMouseEnter={() => setHoveredId(task.id)}
                               onMouseLeave={() => setHoveredId(null)}
                             >
                                <div className="w-[200px] lg:w-[220px] pl-8 pr-4 font-bold text-[9px] truncate text-slate-600 uppercase flex justify-between items-center cursor-pointer" onClick={() => { if (user.role !== 'CLIENT') { setSelectedTask(task); setIsTaskModalOpen(true); } }}>
                                   {task.name}
                                   {user.role !== 'CLIENT' && <Settings size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-opacity" />}
                                </div>
                                <div className="w-[90px] lg:w-[100px] px-2 text-[9px] truncate text-center text-slate-500 font-medium">{userName}</div>
                                <div className="w-[60px] px-2 text-[10px] text-center text-slate-700 font-bold">{task.progress ?? (task as any).progress_percentage ?? (task.status === 'DONE' ? 100 : 0)}%</div>
                                <div className="w-[60px] px-2 text-[9px] font-mono text-slate-500 text-center">{formatDate(task.startDate || (task as any).start_date || (task as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString()))}</div>
                                <div className="flex-1 px-2 text-[9px] font-mono text-slate-500 text-center">{formatDate(task.endDate || (task as any).end_date || (task as any).due_date || (task as any).updated_at || task.startDate || (task as any).start_date || (task as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString()))}</div>
                             </div>
                           );
                         })}
                      </div>
                    )
                 })
               )}
            </div>
         </div>

         {/* Right Timeline Grid Panel */}
         <div className="flex-1 overflow-x-auto relative no-scrollbar bg-slate-50/30" id="right-panel-scroll" onScroll={(e) => {
             const left = document.getElementById('left-panel-scroll');
             if (left) left.scrollTop = e.currentTarget.scrollTop;
         }}>
             <div className="h-full relative min-w-max pb-10">
                {/* Timeline Header */}
                <div className="sticky top-0 z-30">
                  {/* Top: Quarters */}
                  <div className="flex bg-slate-50 text-slate-800 border-b border-slate-200 h-8 items-center shrink-0">
                    {quarters.map((q, idx) => (
                       <div key={idx} className="border-r border-slate-200 text-center flex items-center justify-center h-full" style={{ width: `${q.days * DAY_WIDTH}px` }}>
                          <span className="text-[10px] font-black uppercase tracking-widest font-display text-slate-600">{q.name}</span>
                       </div>
                    ))}
                  </div>
                  {/* Middle: Week blocks */}
                  <div className="flex bg-white text-slate-900 border-b border-slate-100 h-10 items-center shrink-0">
                     {timelineWeeks.map((week, idx) => (
                       <div key={idx} className="border-r border-slate-100 text-center flex flex-col justify-center h-full" style={{ width: `${WEEK_WIDTH}px` }}>
                          <span className="text-[9px] font-black uppercase tracking-widest font-display text-slate-700">Semaine {week.weekNumber}</span>
                          <span className="text-[8px] font-mono font-medium text-slate-400 mt-0.5">{week.startStr} - {week.endStr}</span>
                       </div>
                     ))}
                  </div>
                  {/* Bottom: Days L M M J V S D */}
                  <div className="flex text-center border-b border-slate-200 shadow-sm shadow-slate-100/50 bg-white h-7 items-center shrink-0">
                     {timelineWeeks.map((week, idx) => {
                       return week.days.map((d, di) => (
                         <div 
                           key={`${idx}-${di}`} 
                           className={cn(
                             "text-[8px] font-black py-1 border-r border-slate-100 h-full flex items-center justify-center shrink-0",
                             d.isHoliday ? "bg-amber-50 text-amber-600 border-amber-100" : (d.isWeekend ? "bg-slate-50 text-slate-400" : "text-slate-500")
                           )}
                           style={{ width: `${DAY_WIDTH}px` }}
                         >
                           {d.letter}
                         </div>
                       ))
                     })}
                  </div>
                  
                  {/* Holiday row label space */}
                  <div className="flex border-b border-slate-100 relative overflow-hidden h-[24px] bg-white shrink-0">
                     {timelineWeeks.map((week, idx) => {
                       if (week.hasHoliday) {
                         return (
                            <div key={`h-${idx}`} className="absolute top-0 bottom-0 flex items-center justify-center pt-0.5" 
                                 style={{ left: `${idx * WEEK_WIDTH}px`, width: `${WEEK_WIDTH}px` }}>
                               <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                 {week.holidayName}
                               </span>
                            </div>
                         )
                       }
                       return null;
                     })}
                  </div>
                </div>

                {/* Timeline Grid Background */}
                <div className="absolute top-[124px] left-0 right-0 bottom-0 pointer-events-none flex">
                   {timelineWeeks.map((week, idx) => (
                     week.days.map((d, di) => (
                       <div 
                         key={`bg-${idx}-${di}`} 
                         className={cn(
                           "border-r border-slate-100/50 h-full",
                           d.isHoliday ? "bg-amber-50/40" : (d.isWeekend ? "bg-slate-100/30" : "bg-transparent")
                         )}
                         style={{ width: `${DAY_WIDTH}px` }}
                       />
                     ))
                   ))}
                </div>

                {/* TODAY Line */}
                {(() => {
                  const todayObj = new Date();
                  const diffDays = Math.floor((todayObj.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                  const leftPos = diffDays * DAY_WIDTH + (DAY_WIDTH / 2);
                  if (leftPos >= 0) {
                    return (
                       <div className="absolute top-[124px] bottom-0 z-20 pointer-events-none" style={{ left: `${leftPos}px` }}>
                          <div className="w-[1px] h-full bg-red-400"></div>
                          {/* Box at very bottom */}
                          <div className="absolute top-[350px] -translate-x-1/2 mt-10 bg-white border border-red-200 text-red-500 rounded-lg shadow-sm font-black text-[9px] text-center px-2 py-1 whitespace-nowrap uppercase tracking-widest font-display">
                             Aujourd'hui<br/><span className="font-mono mt-0.5 block">{formatDate(todayObj.toISOString())}</span>
                          </div>
                       </div>
                    )
                  }
                  return null;
                })()}

                {/* Bars Area */}
                <div className="pt-0 relative z-10 w-full" style={{ paddingBottom: '100px' }}>
                  {!selectedProject ? (
                    // Overview mode bars
                    filteredProjects.map((p, i) => {
                      const projStart = new Date(p.startDate);
                      const projEnd = new Date(p.endDate);
                      const startDiff = (projStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                      const durDiff = (projEnd.getTime() - projStart.getTime()) / (1000 * 60 * 60 * 24) || 1;
                      const left = startDiff * DAY_WIDTH;
                      const width = durDiff * DAY_WIDTH;
                      
                      return (
                        <div 
                          key={p.id} 
                          className={cn("h-12 border-b border-transparent relative transition-colors duration-200 cursor-pointer hover:bg-blue-50/20", hoveredId === p.id ? "bg-blue-50/50" : "", hoveredId && hoveredId !== p.id ? "opacity-30" : "opacity-100")}
                          onClick={() => setSelectedProjectId(p.id)}
                          onMouseEnter={() => setHoveredId(p.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                           <div 
                             className="absolute top-3.5 h-5 bg-blue-100 rounded-md overflow-hidden group hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all cursor-pointer"
                             style={{ left: `${left}px`, width: `${width}px` }}
                           >
                              <div className="bg-blue-600 rounded-md transition-all h-full" style={{ width: `${p.progress}%` }}></div>
                           </div>
                        </div>
                      )
                    })
                  ) : (
                    // Detail Project Mode Bars
                    [
                      ...projectLots.map(lot => ({ type: 'lot' as const, lot, tasks: projectTasks.filter(t => t.lotId === lot.id) })),
                      ...projectTasks.filter(t => !t.lotId && !t.parent_task_id && !t.parentTaskId).map(pt => ({ type: 'taskGroup' as const, lot: pt as any, tasks: projectTasks.filter(c => c.parent_task_id === pt.id || c.parentTaskId === pt.id) }))
                    ].map((group, idx) => {
                      const lot = group.lot;
                      const lColor = GROUP_COLORS[idx % GROUP_COLORS.length];
                      const lotStartStr = lot.startDate || (lot as any).start_date || (lot as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString());
                      const lotEndStr = lot.endDate || (lot as any).end_date || (lot as any).due_date || (lot as any).updated_at || lotStartStr;
                      const lotProgress = lot.progress ?? (lot as any).progress_percentage ?? (lot.status === 'DONE' ? 100 : 0);

                      const lotStart = new Date(lotStartStr);
                      const lotEnd = new Date(lotEndStr);
                      const lotStartDiff = (lotStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                      const lotDurDiff = ((lotEnd.getTime() - lotStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                      
                      const lTasks = group.tasks;

                      return (
                        <div key={lot.id} className="contents">
                           {/* Group Row Bar */}
                           <div 
                             className={cn("h-10 border-b border-transparent relative z-30 transition-colors duration-200 cursor-pointer", hoveredId === lot.id ? "bg-slate-100/50" : "", hoveredId && hoveredId !== lot.id ? "opacity-30" : "opacity-100")}
                             onMouseEnter={() => setHoveredId(lot.id)}
                             onMouseLeave={() => setHoveredId(null)}
                             onClick={() => {
                               if (group.type === 'taskGroup' && user.role !== 'CLIENT') {
                                 setSelectedTask(lot as any);
                                 setIsTaskModalOpen(true);
                               }
                             }}
                           >
                              {/* Parent roll-up bar */}
                              <div 
                                className="absolute top-4 h-2 rounded-full relative pointer-events-none"
                                style={{ left: `${lotStartDiff * DAY_WIDTH}px`, width: `${lotDurDiff * DAY_WIDTH}px`, backgroundColor: `${lColor}30` }}
                              >
                                 <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${lotProgress}%`, backgroundColor: lColor }}></div>
                                 <div className={cn("absolute top-[2px] -left-1 w-2 h-2", group.type === 'lot' ? "rounded-full" : "rounded-sm")} style={{ backgroundColor: lColor }}></div>
                                 <div className={cn("absolute top-[2px] -right-1 w-2 h-2", group.type === 'lot' ? "rounded-full" : "rounded-sm")} style={{ backgroundColor: lColor }}></div>
                              </div>
                           </div>

                           {/* Task Rows Bars */}
                           {lTasks.map(task => {
                             const tStartStr = task.startDate || (task as any).start_date || (task as any).created_at || (minDate ? minDate.toISOString() : new Date().toISOString());
                             const tEndStr = task.endDate || (task as any).end_date || (task as any).due_date || (task as any).updated_at || tStartStr;
                             const tProgress = task.progress ?? (task as any).progress_percentage ?? (task.status === 'DONE' ? 100 : 0);

                             const tStart = new Date(tStartStr);
                             const tEnd = new Date(tEndStr);
                             const tStartDiff = (tStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                             const tDurDiff = ((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                             
                             return (
                               <div 
                                 key={task.id} 
                                 className={cn("h-10 border-b border-transparent relative transition-colors duration-200", hoveredId === task.id ? "bg-slate-50/50" : "", hoveredId && hoveredId !== task.id ? "opacity-30" : "opacity-100")}
                                 onMouseEnter={() => setHoveredId(task.id)}
                                 onMouseLeave={() => setHoveredId(null)}
                               >
                                  <div 
                                    className="absolute top-2.5 h-5 shadow-sm rounded-md relative group cursor-pointer overflow-hidden ring-1 ring-black/5"
                                    style={{ left: `${tStartDiff * DAY_WIDTH}px`, width: `${tDurDiff * DAY_WIDTH}px`, backgroundColor: `${lColor}20` }}
                                    onClick={() => { if (user.role !== 'CLIENT') { setSelectedTask(task); setIsTaskModalOpen(true); } }}
                                  >
                                     <div className="absolute left-0 top-0 h-full" style={{ width: `${tProgress}%`, backgroundColor: lColor }}></div>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg transition-opacity duration-200">
                                        {task.name} <span className="text-slate-400 font-mono">({tProgress}%)</span>
                                     </div>
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                      )
                    })
                  )}
                </div>
             </div>
         </div>
      </div>

      {/* Legend Area */}
      <div className="bg-white border border-slate-200 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-slate-600 p-6 mt-6 flex flex-wrap items-center shadow-sm w-full gap-8">
         <div className="flex items-center gap-4">
           <span className="text-slate-900 font-display">Légende :</span>
           <div className="flex items-center gap-2">
             <div className="w-6 h-3 rounded-sm bg-blue-100 relative overflow-hidden ring-1 ring-slate-200">
               <div className="absolute top-0 left-0 h-full w-1/2 bg-blue-600"></div>
             </div>
             <span>Avancement / Durée totale</span>
           </div>
           
           <div className="flex items-center gap-2 ml-4">
             <div className="w-6 h-3 rounded-sm bg-amber-50 border border-amber-200"></div>
             <span>Jour Férié (Non travaillé)</span>
           </div>
           
           <div className="flex items-center gap-2 ml-4">
             <div className="w-px h-4 bg-red-400"></div>
             <span className="text-red-500">Aujourd'hui</span>
           </div>
         </div>

         <div className="hidden md:flex ml-auto items-center gap-6 font-mono text-[9px] border-l border-slate-200 pl-6 text-slate-500">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> <span>Début: <strong className="text-slate-800">01/06/2026</strong></span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> <span>Fin: <strong className="text-slate-800">29/06/2026</strong></span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> <span>Livraison: <strong className="text-slate-800">02/07/2026</strong></span></div>
         </div>
      </div>

      {(selectedProject || projects[0]) && (
        <LotModal 
          isOpen={isLotModalOpen}
          onClose={() => setIsLotModalOpen(false)}
          project={selectedProject || projects[0]}
          onSuccess={handlePlanningSuccess}
          user={user}
        />
      )}

      {(selectedProject || projects[0]) && (
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          project={selectedProject || projects[0]}
          task={selectedTask}
          onSuccess={handlePlanningSuccess}
        />
      )}
    </div>
  );
}
