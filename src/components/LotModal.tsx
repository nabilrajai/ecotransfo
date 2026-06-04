import React, { useState, useEffect } from 'react';
import { Lot, Project, UserProfile } from '../types';
import { X, Shield, Calendar, Target, DollarSign, Activity, Users, Plus } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { TaskModal } from './TaskModal';
import { toast } from 'sonner';

interface LotModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  lot?: Lot | null;
  onSuccess: () => void;
  user: UserProfile;
}

export function LotModal({ isOpen, onClose, project, lot, onSuccess, user }: LotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING' as Lot['status'],
    progress: 0,
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    assignedUsers: '' 
  });
  const [loading, setLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (lot) {
      setFormData({
        name: lot.name || '',
        description: lot.description || '',
        status: lot.status || 'PLANNING',
        progress: lot.progress || 0,
        budget: lot.budget || 0,
        startDate: lot.startDate || new Date().toISOString().split('T')[0],
        endDate: lot.endDate || new Date().toISOString().split('T')[0],
        assignedUsers: lot.assignedUsers ? lot.assignedUsers.join(', ') : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'PLANNING',
        progress: 0,
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        assignedUsers: ''
      });
    }
  }, [lot, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);
    
    // Parse assigned users
    const usersArray = formData.assignedUsers.split(',').map(u => u.trim()).filter(Boolean);

    try {
      StorageService.saveLot({
        ...formData,
        id: lot?.id,
        assignedUsers: usersArray,
        projectId: project.id,
      });
      toast.success(lot ? "Lot mis à jour" : "Lot initialisé", {
        description: `Le lot "${formData.name}" a été enregistré avec succès.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving lot:", error);
      toast.error("Erreur de sauvegarde", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewWork = () => {
    setIsTaskModalOpen(true);
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        project={project}
        lot={lot}
        onSuccess={() => {
           setIsTaskModalOpen(false);
           onSuccess(); // maybe refresh parent lists
        }}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="bg-slate-50 px-10 py-8 flex justify-between items-center border-b border-slate-100">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <Shield size={18} />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter font-display">
                    {lot ? 'Édition du Lot' : 'Nouveau Lot Technique'}
                 </h2>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display italic">Project: {project.name}</p>
           </div>
           <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <X size={24} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
           <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                    Désignation du Lot <span className="text-rose-500">*</span>
                 </label>
                 <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Génie Civil - Lot 01"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                    Description & Objectifs
                 </label>
                 <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Détails techniques du package..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display resize-none"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                    <Users size={14} className="text-blue-500" /> Membres Assignés (Noms ou Emails)
                 </label>
                 <input
                    type="text"
                    value={formData.assignedUsers}
                    onChange={(e) => setFormData({ ...formData, assignedUsers: e.target.value })}
                    placeholder="Ex: Jean Dupont, jean@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                 />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                       <Calendar size={14} className="text-blue-500" /> Date de Début
                    </label>
                    <input
                       required
                       type="date"
                       value={formData.startDate}
                       onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                       <Calendar size={14} className="text-rose-500" /> Date d'Échéance
                    </label>
                    <input
                       required
                       type="date"
                       value={formData.endDate}
                       onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                       <Target size={14} className="text-blue-500" /> État Initial
                    </label>
                    <select
                       value={formData.status}
                       onChange={(e) => setFormData({ ...formData, status: e.target.value as Lot['status'] })}
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display appearance-none"
                    >
                       <option value="PLANNING">PLANIFICATION</option>
                       <option value="ACTIVE">EN EXÉCUTION</option>
                       <option value="COMPLETED">CLÔTURÉ</option>
                       <option value="ON_HOLD">EN ATTENTE</option>
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                       <DollarSign size={14} className="text-emerald-500" /> Budget Alloué (MAD)
                    </label>
                    <input
                       type="number"
                       value={formData.budget}
                       onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-display"
                    />
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                       <Activity size={14} className="text-blue-500" /> Progression du Lot
                    </label>
                    <span className="text-sm font-black text-blue-600">{formData.progress}%</span>
                 </div>
                 <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                 />
              </div>
           </div>

           <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
              {lot && (
                <button
                   type="button"
                   onClick={handleAddNewWork}
                   className="w-full sm:w-auto py-5 px-6 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-300 transition-all font-display flex items-center gap-2 justify-center"
                >
                   <Plus size={16} /> Ajouter du Travail
                </button>
              )}
              <div className="flex-1 flex gap-4">
                <button
                   type="button"
                   onClick={onClose}
                   className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all font-display"
                >
                   Annuler
                </button>
                <button
                   type="submit"
                   disabled={loading}
                   className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50 font-display"
                >
                   {loading ? 'Traitement...' : lot ? 'Mettre à jour le Lot' : 'Initialiser le Lot'}
                </button>
              </div>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
