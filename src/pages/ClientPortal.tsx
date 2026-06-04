import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserProfile, Project } from '../types';
import { MessageSquare, Plus, AlertCircle, Activity, Save, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';

interface ClientPortalProps {
  user: UserProfile;
}

export function ClientPortal({ user }: ClientPortalProps) {
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', projectId: '' });

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects');
      setProjects(pRes);
      // Wait for feedback endpoint if it exists or use tasks as feedback?
      // Mocking for now since there's no official reclamations endpoint in db
      const rData = await api.get('/dashboard');
      setReclamations([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    try {
      // Mocked
      const newRec = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        projectId: formData.projectId,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      setReclamations(prev => [newRec, ...prev]);
      setIsModalOpen(false);
      toast.success("Réclamation soumise avec succès");
    } catch (e) {
      toast.error("Erreur lors de la soumission");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-display">
            <MessageSquare className="text-rose-600" size={32} />
            MES RÉCLAMATIONS
          </h1>
          <p className="text-slate-500 font-medium mt-1">Suivi de vos commentaires et requêtes de support.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-3 px-6 flex items-center gap-2 rounded-2xl shadow-xl shadow-rose-200 bg-rose-600 hover:bg-rose-700 border-rose-500"
        >
          <Plus size={18} />
          NOUVELLE RÉCLAMATION
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="friendly-card p-6 bg-white shrink">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
               <Activity size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display mb-1">Total</p>
            <p className="text-3xl font-black text-slate-900">{reclamations.length}</p>
         </div>
         <div className="friendly-card p-6 bg-white shrink">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
               <AlertCircle size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display mb-1">En attente</p>
            <p className="text-3xl font-black text-slate-900">{reclamations.filter(r => r.status === 'OPEN').length}</p>
         </div>
      </div>

      <div className="friendly-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-display">Historique</h3>
        </div>
        {reclamations.length === 0 ? (
           <div className="p-16 text-center text-slate-400">
               <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="font-bold text-sm uppercase tracking-widest">Aucune réclamation enregistrée</p>
           </div>
        ) : (
           <div className="divide-y divide-slate-100">
              {reclamations.map((rec, i) => (
                 <div key={i} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                       <p className="font-bold text-slate-900 mb-1">{rec.title}</p>
                       <p className="text-xs text-slate-500">{rec.description}</p>
                       <div className="flex items-center gap-3 mt-3">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", rec.status === 'OPEN' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                             {rec.status === 'OPEN' ? 'En cours' : 'Traité'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{formatDate(rec.createdAt)}</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest font-display">Ajouter une Réclamation</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                 <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Titre / Sujet</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Projet Concerne</label>
                <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                   <option value="">Sélectionner</option>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Description</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold resize-none" />
              </div>
              <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-rose-700 transition-colors flex justify-center items-center gap-2">
                 <Save size={16} /> Soumettre
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
