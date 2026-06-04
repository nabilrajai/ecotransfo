import { Project, ProjectDocument } from '../../types';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  File as FileIcon, 
  MoreVertical, 
  Download, 
  Upload, 
  Search,
  Plus,
  Folder,
  Shield,
  Activity,
  Filter,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../../lib/storage';

export function ProjectDocuments({ project, user }: { project: Project; user?: any }) {
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = () => {
    try {
      const docs = StorageService.getDocuments(project.id);
      setDocuments(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [project.id]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const type = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const size = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const user = StorageService.getUser();
      const author = user?.displayName || user?.email?.split('@')[0] || 'Unknown';
      const refCode = `DOC-${type}-${Math.floor(100 + Math.random() * 900)}`;

      StorageService.saveDocument({
        projectId: project.id,
        name: file.name,
        type,
        size,
        author,
        ref: refCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ProjectDocument);
      
      fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error uploading document:", err);
    }
  };

  const handleDelete = (docId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      try {
        StorageService.deleteDocument(docId);
        fetchDocuments();
      } catch (err) {
        console.error("Error deleting document:", err);
      }
    }
  };

  const filteredDocs = documents.filter(doc => 
    (doc.name || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (doc.ref || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (doc.type || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />

      {/* Search & Actions - Industrial Header */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
        <div className="friendly-card shadow-sm border-slate-100 relative flex-1 group overflow-hidden bg-white ring-1 ring-slate-100">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-all duration-300" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, référence ou extension..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-300 font-display"
          />
        </div>
        <div className="flex items-center gap-4">
           <button className="h-full px-8 bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-3 font-display">
              <Filter size={16} /> Filtres Archives
           </button>
           {user?.role !== 'CLIENT' && (
             <button 
               onClick={handleUploadClick}
               className="btn-primary py-4 px-10 shadow-blue-500/10 font-display text-[10px] tracking-widest group"
             >
               <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
               <span>Transférer G0</span>
             </button>
           )}
        </div>
      </div>

      {/* Directory Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <FolderCard name="Technique & Ingénierie" count={filteredDocs.filter(d => ['PDF', 'CAD', 'DWG'].includes(d.type)).length} icon={Shield} color="bg-blue-50 text-blue-600" />
         <FolderCard name="Administratif & Légal" count={filteredDocs.filter(d => ['DOCX', 'TXT'].includes(d.type)).length} icon={Activity} color="bg-amber-50 text-amber-600" />
         <FolderCard name="Système Qualité ISO" count={filteredDocs.filter(d => ['ZIP', 'JPG', 'PNG'].includes(d.type)).length} icon={ImageIcon} color="bg-emerald-50 text-emerald-600" />
         <FolderCard name="Engagements Compta" count={filteredDocs.filter(d => ['XLSX', 'CSV'].includes(d.type)).length} icon={FileCode} color="bg-slate-50 text-slate-600" />
      </div>

      {/* Master Document Ledger */}
      <div className="friendly-card overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between font-display">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                  <FileText size={20} />
               </div>
               Grand Livre Documentaire (v4.0)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">Total: {filteredDocs.length} Objets Indexés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] font-display">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identité du Document</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Volume</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auteur / Valideur</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Version</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <AnimatePresence>
                {filteredDocs.map((docItem) => (
                  <motion.tr 
                    key={docItem.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-slate-50/50 transition-all group cursor-default"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-6">
                         <FileIconType type={docItem.type} />
                         <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-50/50 px-2.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0">{docItem.ref}</span>
                              <p className="font-extrabold text-slate-900 text-xs uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors uppercase">{docItem.name}</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic translate-y-0.5 font-display">{docItem.type} OPERATIONAL BLOB • ISO9001</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{docItem.size}</span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                         <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[11px] font-black text-white uppercase shadow-lg group-hover:scale-110 transition-transform">
                           {docItem.author.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{docItem.author}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{formatDate(docItem.createdAt)}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 tracking-widest">STABLE</span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <button className="h-11 w-11 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm">
                          <Download size={18} />
                        </button>
                        {user?.role !== 'CLIENT' && (
                          <button 
                            onClick={() => handleDelete(docItem.id)}
                            className="h-11 w-11 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <button className="h-11 w-11 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredDocs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <FileIcon size={48} className="opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">Aucun document trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FolderCard({ name, count, icon: Icon, color }: { name: string, count: number, icon: any, color: string }) {
  return (
    <div className="friendly-card p-8 border-slate-100 hover:border-blue-500 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden shadow-sm">
       <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 group-hover:scale-[2] pointer-events-none">
          <Icon size={120} />
       </div>
       <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-sm relative z-10", color)}>
         <Folder size={28} className="group-hover:rotate-12 transition-transform" />
       </div>
       <div className="relative z-10 w-full">
          <h4 className="font-extrabold text-slate-900 text-xs mb-3 uppercase tracking-widest font-display line-clamp-1">{name}</h4>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100">
             <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
             {count} Objets
          </div>
       </div>
    </div>
  );
}

function FileIconType({ type }: { type: string }) {
  if (type === 'PDF') return <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-500"><FileText size={22} /></div>;
  if (type === 'IMG' || type === 'ZIP' || type === 'JPG' || type === 'PNG') return <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-500"><ImageIcon size={22} /></div>;
  if (type === 'XLSX' || type === 'CSV') return <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-500"><FileCode size={22} /></div>;
  return <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-500"><FileIcon size={22} /></div>;
}
