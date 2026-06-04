import React, { useState, useEffect } from 'react';
import { Task, Project, Lot, UserProfile, TaskComment, TaskAttachment } from '../types';
import { X, Shield, Calendar, Activity, CheckSquare, MessageSquare, Paperclip, Send, Trash2, User } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  lot?: Lot | null;
  task?: Task | null;
  onSuccess: () => void;
  initialParentTaskId?: string;
  isGroupCreation?: boolean;
}

export function TaskModal({ isOpen, onClose, project, lot, task, onSuccess, initialParentTaskId, isGroupCreation }: TaskModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'TODO' as Task['status'],
    priority: 'MEDIUM' as Task['priority'],
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    assigneeId: '',
    dependencies: [] as string[],
    comments: [] as TaskComment[],
    attachments: [] as any[],
    parentTaskId: '',
  });
  const [newComment, setNewComment] = useState('');
  const [quickSubtaskName, setQuickSubtaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'attachments'>('info');

  useEffect(() => {
    const u = StorageService.getUser();
    setUser(u);
    const uList = StorageService.getUsers();
    setUsers(uList || []);
    if (isOpen && project) {
      api.get('/tasks').then((data) => {
        const pTasks = (Array.isArray(data) ? data : []).filter((t: any) => String(t.project_id || t.projectId) === String(project.id));
        const normalized = pTasks.map((t: any) => ({
          ...t,
          id: String(t.id),
          startDate: t.start_date || t.startDate || t.created_at,
          endDate: t.end_date || t.endDate || t.due_date || t.updated_at
        }));
        setAvailableTasks(normalized.filter((t: any) => t.id !== task?.id));
      });
    }
  }, [isOpen, project?.id, task?.id]);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        progress: task.progress || 0,
        startDate: task.startDate || new Date().toISOString().split('T')[0],
        endDate: task.endDate || new Date().toISOString().split('T')[0],
        assigneeId: task.assigneeId || '',
        dependencies: task.dependencies || [],
        comments: task.comments || [],
        attachments: task.attachments || [],
        parentTaskId: task.parentTaskId || (task.parent_task_id ? String(task.parent_task_id) : ''),
      });
    } else {
      setFormData({
        name: isGroupCreation ? 'GROUPE - ' : '',
        description: isGroupCreation ? 'Groupe de tâches / Livrable principal' : '',
        status: 'TODO',
        priority: 'MEDIUM',
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        assigneeId: '',
        dependencies: [],
        comments: [],
        attachments: [],
        parentTaskId: initialParentTaskId || '',
      });
    }
  }, [task, isOpen, initialParentTaskId, isGroupCreation]);

  const canEditMain = true; // Permettre la modification par tous les rôles autorisés (Owner, PM, Employee, etc.)
  const canUpdateStatus = true;
  const canComment = true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        start_date: formData.startDate,
        end_date: formData.endDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        project_id: project.id,
        assigned_to_user_id: formData.assigneeId || task?.assigneeId || user?.uid || '',
        comments: formData.comments,
        attachments: formData.attachments,
        parent_task_id: formData.parentTaskId || null,
        parentTaskId: formData.parentTaskId || undefined,
      };

      if (task?.id) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      
      toast.success(task ? "Tâche mise à jour" : "Tâche créée", {
        description: `"${formData.name}" a été enregistré avec succès.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast.error("Erreur de sauvegarde", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task?.id) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette tâche ? Cette action est irréversible.")) {
      try {
        setLoading(true);
        await api.delete(`/tasks/${task.id}`);
        toast.success("Tâche supprimée avec succès", {
          description: `"${formData.name}" a été correctement supprimé.`,
        });
        onSuccess();
        onClose();
      } catch (err: any) {
        console.error("Error deleting task:", err);
        toast.error("Erreur de suppression de la tâche", {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    
    const comment: TaskComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      userName: user.displayName,
      content: newComment,
      createdAt: new Date().toISOString()
    };
    
    setFormData(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }));
    setNewComment('');
  };

  const deleteComment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== id)
    }));
  };

  const handleAddQuickSubtask = async () => {
    if (!quickSubtaskName.trim() || !project || !task) return;
    try {
      setLoading(true);
      const payload = {
        name: quickSubtaskName.trim(),
        description: 'Sous-tâche de: ' + task.name,
        status: 'TODO' as Task['status'],
        priority: 'MEDIUM' as Task['priority'],
        progress: 0,
        start_date: task.startDate,
        end_date: task.endDate,
        startDate: task.startDate,
        endDate: task.endDate,
        project_id: project.id,
        parent_task_id: task.id,
        parentTaskId: task.id,
      };
      await api.post('/tasks', payload);
      const data = await api.get('/tasks');
      const pTasks = (Array.isArray(data) ? data : []).filter((t: any) => String(t.project_id || t.projectId) === String(project.id));
      const normalized = pTasks.map((t: any) => ({
        ...t,
        id: String(t.id),
        startDate: t.start_date || t.startDate || t.created_at,
        endDate: t.end_date || t.endDate || t.due_date || t.updated_at
      }));
      setAvailableTasks(normalized.filter((t: any) => t.id !== task?.id));
      setQuickSubtaskName('');
      toast.success("Sous-tâche ajoutée au groupe!");
    } catch(err: any) {
      toast.error("Erreur lors de la création de la sous-tâche.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white md:rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 h-full md:max-h-[90vh] flex flex-col"
      >
        <div className="bg-slate-50 px-6 py-6 md:px-10 md:py-8 flex justify-between items-center border-b border-slate-100">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                    <CheckSquare size={18} />
                 </div>
                 <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter font-display">
                    {task ? 'Édition' : (isGroupCreation ? 'Nouveau Groupe de Tâches' : 'Nouvelle Tâche / Unité')}
                 </h2>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display italic truncate max-w-[200px]">
                 {lot ? `Lot: ${lot.name}` : `Project: ${project?.name || ''}`}
              </p>
           </div>
           <button type="button" onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <X size={20} className="md:w-6 md:h-6" />
           </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/30 shrink-0 overflow-x-auto no-scrollbar">
          <button 
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn("flex-1 px-4 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest font-display border-b-2 transition-all whitespace-nowrap", activeTab === 'info' ? "border-blue-500 text-blue-600 bg-white shadow-sm" : "border-transparent text-slate-400 hover:text-slate-600")}
          >Général</button>
          <button 
            type="button"
            onClick={() => setActiveTab('comments')}
            className={cn("flex-1 px-4 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest font-display border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap", activeTab === 'comments' ? "border-blue-500 text-blue-600 bg-white shadow-sm" : "border-transparent text-slate-400 hover:text-slate-600")}
          >
            Commentaires 
            {formData.comments.length > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px]">{formData.comments.length}</span>}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={cn("flex-1 px-4 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest font-display border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap", activeTab === 'attachments' ? "border-blue-500 text-blue-600 bg-white shadow-sm" : "border-transparent text-slate-400 hover:text-slate-600")}
          >Pièces Jointes</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-8">
                    {/* Main Info */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                        Désignation de la Tâche <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        disabled={!canEditMain}
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display disabled:opacity-60"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                        Description Détaillée
                      </label>
                      <textarea
                        rows={3}
                        disabled={!canEditMain}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display resize-none disabled:opacity-60"
                        placeholder="Détaillez les objectifs et contraintes..."
                      />
                    </div>

                    {/* Assignee */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                        Responsable / Assigné
                      </label>
                      <div className="relative group">
                        <User size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select
                          disabled={!canEditMain}
                          value={formData.assigneeId}
                          onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display appearance-none disabled:opacity-60"
                        >
                          <option value="">Non assigné (Production Team)</option>
                          {users.map(u => (
                            <option key={u.uid} value={u.uid}>{u.displayName || u.email || u.uid}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                          Date de Début
                        </label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="date"
                            disabled={!canEditMain}
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all font-display disabled:opacity-60"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                          Date de Fin
                        </label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="date"
                            disabled={!canEditMain}
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all font-display disabled:opacity-60"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                          État d'avancement
                        </label>
                        <div className="relative group">
                          <Activity size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select
                            value={formData.status}
                            disabled={!canUpdateStatus}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display appearance-none disabled:opacity-60"
                          >
                            <option value="TODO">EN ATTENTE</option>
                            <option value="IN_PROGRESS">EN COURS</option>
                            <option value="DONE">TERMINÉ</option>
                            <option value="BLOCKED">BLOQUÉ</option>
                            <option value="REVIEW">EN REVUE</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                          Niveau de Priorité
                        </label>
                        <div className="relative group">
                          <Shield size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select
                            value={formData.priority}
                            disabled={!canEditMain}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display appearance-none disabled:opacity-60"
                          >
                            <option value="LOW">BASSE</option>
                            <option value="MEDIUM">MOYENNE</option>
                            <option value="HIGH">HAUTE</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                          Progression
                        </label>
                        <span className="text-xs font-black text-blue-600 font-display">{formData.progress}%</span>
                      </div>
                      <input 
                        type="range" 
                        disabled={!canUpdateStatus}
                        min="0" max="100" step="5"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-40"
                      />
                    </div>

                    {/* Dependencies */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                        Liaisons de Dépendances
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.dependencies.map(depId => {
                          const depTask = availableTasks.find(t => t.id === depId);
                          return (
                            <div key={depId} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-bold text-blue-600 uppercase">
                              {depTask?.name || 'ID: ' + String(depId).slice(0, 4)}
                              {canEditMain && (
                                <button type="button" onClick={() => setFormData({ ...formData, dependencies: formData.dependencies.filter(id => id !== depId) })}>
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {canEditMain && (
                        <select
                          onChange={(e) => {
                            if (e.target.value && !formData.dependencies.includes(e.target.value)) {
                              setFormData({ ...formData, dependencies: [...formData.dependencies, e.target.value] });
                            }
                            e.target.value = '';
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all font-display"
                        >
                          <option value="">Ajouter une dépendance...</option>
                          {availableTasks.filter(t => !formData.dependencies.includes(t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Tâche Parente (Lien de groupe) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                        {!isGroupCreation && "Groupe de Tâche / Tâche Parente"}
                      </label>
                      <select
                        disabled={!canEditMain}
                        value={formData.parentTaskId}
                        onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                        className={isGroupCreation ? "hidden" : "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display appearance-none disabled:opacity-60"}
                      >
                        <option value="">Aucune tâche parente (Tâche principale)</option>
                        {availableTasks.filter(t => !t.parentTaskId && !t.parent_task_id).map(t => (
                          <option key={t.id} value={t.id}>▶ GROUPE : {t.name} (Ref: #{String(t.id).slice(0, 5)})</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider italic">
                        {!isGroupCreation && "Lier cette tâche à une autre pour créer des sous-groupes ou hiérarchies de livrables."}
                      </p>
                    </div>

                    {/* Sous-tâches dépendantes (Subtasks) */}
                    {task?.id && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center justify-between">
                          <span>Sous-tâches associées (Membres du groupe)</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold">
                            {availableTasks.filter(t => t.parentTaskId === task.id || String(t.parent_task_id) === String(task.id)).length} Sous-tâches
                          </span>
                        </label>
                        
                        <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                          {availableTasks.filter(t => t.parentTaskId === task.id || String(t.parent_task_id) === String(task.id)).length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic py-2">Aucune sous-tâche pour le moment.</p>
                          ) : (
                            availableTasks.filter(t => t.parentTaskId === task.id || String(t.parent_task_id) === String(task.id)).map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-900 uppercase tracking-tight font-display">{sub.name}</p>
                                  <span className="text-[8px] font-bold text-slate-400 tracking-widest">SUB-ID: #{String(sub.id).slice(0, 5)}</span>
                                </div>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest border font-display",
                                  sub.status === 'DONE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                  sub.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                  sub.status === 'REVIEW' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                )}>
                                  {sub.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Quick subtask injector */}
                        <div className="flex gap-2 items-center pt-2">
                          <input
                            type="text"
                            placeholder="Nom de la sous-tâche rapide..."
                            value={quickSubtaskName}
                            onChange={(e) => setQuickSubtaskName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddQuickSubtask();
                              }
                            }}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                          />
                          <button
                            type="button"
                            onClick={handleAddQuickSubtask}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest font-display transition-all"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div 
                  key="comments"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="space-y-6 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                    {formData.comments.length === 0 ? (
                      <div className="py-12 text-center space-y-4">
                        <MessageSquare size={32} className="mx-auto text-slate-100" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Aucun flux de communication</p>
                      </div>
                    ) : (
                      formData.comments.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 uppercase font-black text-[10px] text-slate-400">
                            {comment.userName.charAt(0)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-900 uppercase font-display">{comment.userName}</p>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-bold text-slate-400 font-display">{formatDate(comment.createdAt)}</span>
                                {(comment.userId === user?.uid || canEditMain) && (
                                  <button onClick={() => deleteComment(comment.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {canComment && (
                    <div className="pt-6 border-t border-slate-100">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display resize-none"
                          placeholder="Votre message technique..."
                        />
                        <button 
                          type="button"
                          onClick={handleAddComment}
                          className="absolute right-3 bottom-3 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-200"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'attachments' && (
                <motion.div 
                  key="attachments"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {formData.attachments.length === 0 ? (
                      <div className="col-span-2 py-12 text-center space-y-4">
                        <Paperclip size={32} className="mx-auto text-slate-100" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Aucun document technique joint</p>
                      </div>
                    ) : (
                      formData.attachments.map((file, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                              <Paperclip size={14} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{file.name}</span>
                          </div>
                          <button type="button" className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {canEditMain && (
                    <div 
                      className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-all cursor-pointer group"
                      onClick={() => {
                        const name = prompt("Nom du fichier à simuler (ex: plan_g2.pdf)");
                        if (name && user) {
                          const newAttachment: TaskAttachment = {
                            id: Math.random().toString(36).substr(2, 9),
                            name,
                            url: '#',
                            type: name.split('.').pop() || 'unknown',
                            size: '1.2 MB',
                            uploadedBy: user.uid,
                            createdAt: new Date().toISOString()
                          };
                          setFormData(prev => ({ ...prev, attachments: [...prev.attachments, newAttachment] }));
                        }
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all">
                        <Paperclip size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-display">Déposer ou lier un fichier</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div className="p-10 gap-4 flex border-t border-slate-100 bg-white z-10 shrink-0 flex-wrap md:flex-nowrap">
          {task?.id && (
            <button
              type="button"
              onClick={handleDeleteTask}
              disabled={loading}
              className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all font-display flex items-center justify-center gap-2 border border-rose-100"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all font-display"
          >
            Fermer
          </button>
          <button
            form="task-form"
            type="submit"
            disabled={loading}
            className={cn(
              "flex-[2] py-5 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50 font-display",
              (!canEditMain && !canUpdateStatus) && "hidden"
            )}
          >
            {loading ? 'Sychronisation...' : 'Valider les modifications'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
