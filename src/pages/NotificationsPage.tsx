import { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import { AppNotification } from '../types';
import { Bell, Check, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    try {
      const data = StorageService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    try {
      const notifs = StorageService.getNotifications();
      const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('ecotransfo_notifications', JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotif = (id: string) => {
    try {
      const notifs = StorageService.getNotifications().filter(n => n.id !== id);
      localStorage.setItem('ecotransfo_notifications', JSON.stringify(notifs));
      setNotifications(notifs);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = () => {
    try {
      const notifs = StorageService.getNotifications().map(n => ({ ...n, read: true }));
      localStorage.setItem('ecotransfo_notifications', JSON.stringify(notifs));
      setNotifications(notifs);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in duration-1000">
       <div className="relative">
          <div className="w-16 h-16 border-8 border-slate-50 rounded-full"></div>
          <div className="w-16 h-16 border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
       </div>
       <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display">Synchronisation des alertes...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                 <Bell size={16} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-display italic">Centre de Messagerie</p>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase font-display">Alertes & <span className="text-blue-600 italic">Logs</span></h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest font-display italic">Restez informé des activités critiques en temps réel.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="px-8 py-4 bg-white border border-slate-100 rounded-[28px] text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all font-display shadow-sm"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {notifications.map((n, idx) => (
            <motion.div 
              layout
              key={n.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
              className="friendly-card p-1 group relative transition-all duration-500 hover:shadow-2xl overflow-hidden"
            >
              <div className={cn(
                 "p-8 bg-white border-slate-50 flex items-start gap-6 transition-all",
                 n.read ? "opacity-60 grayscale-[0.5]" : "opacity-100"
              )}>
                 <div className={cn(
                   "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500",
                   n.type === 'ERROR' ? "bg-rose-500 text-white shadow-rose-200" :
                   n.type === 'SUCCESS' ? "bg-emerald-500 text-white shadow-emerald-200" :
                   n.type === 'WARNING' ? "bg-amber-500 text-white shadow-amber-200" : "bg-blue-500 text-white shadow-blue-200"
                 )}>
                   {n.type === 'ERROR' && <AlertCircle size={24} />}
                   {n.type === 'SUCCESS' && <CheckCircle2 size={24} />}
                   {n.type === 'WARNING' && <AlertTriangle size={24} />}
                   {n.type === 'INFO' && <Info size={24} />}
                 </div>

                 <div className="flex-1 space-y-2">
                   <div className="flex items-center justify-between">
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight font-display">{n.title}</h4>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-display italic group-hover:text-blue-500 transition-colors">{formatDate(n.createdAt)}</span>
                   </div>
                   <p className="text-[13px] font-medium text-slate-500 leading-relaxed max-w-2xl font-display">{n.message}</p>
                   
                   <div className="pt-4 flex items-center gap-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                     {!n.read && (
                       <button onClick={() => markAsRead(n.id)} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 font-display italic">
                         <Check size={14} /> Marquer comme lu
                       </button>
                     )}
                     <button onClick={() => deleteNotif(n.id)} className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 font-display italic">
                       <Trash2 size={14} /> Supprimer
                     </button>
                   </div>
                 </div>

                 {!n.read && (
                    <div className="absolute top-8 right-8 flex flex-col items-center gap-1 animate-pulse">
                       <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50"></div>
                       <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest font-display">Nouveau</span>
                    </div>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100 border-dashed animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
               <Bell size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] font-display italic">Aucune alerte pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
