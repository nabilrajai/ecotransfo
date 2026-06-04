import { Project, UserProfile, ProjectMessage } from '../../types';
import { Send, Hash, AtSign, Smile, Paperclip, MoreVertical, Shield, Activity, Target } from 'lucide-react';
import { useState, FormEvent, useEffect, useRef } from 'react';
import { cn, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../../lib/storage';

export function ProjectDiscussions({ project, user }: { project: Project, user: UserProfile }) {
  const [message, setMessage] = useState('');
  const [discussions, setDiscussions] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    try {
      const msgs = StorageService.getMessages(project.id);
      setDiscussions(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [project.id]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const content = message.trim();
    if (!content) return;

    try {
      StorageService.saveMessage({
        projectId: project.id,
        userId: user.uid,
        userName: user.displayName,
        userRole: user.role || 'Member',
        userAvatar: user.photoURL || user.displayName.charAt(0),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ProjectMessage);
      
      setMessage('');
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="friendly-card overflow-hidden flex flex-col h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-xl border-slate-200">
       {/* Channel Header */}
       <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl group-hover:scale-105 transition-transform">
                <Hash size={24} />
             </div>
             <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-display">Flux de Coordination G0</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-display">Canal opérationnel de supervision • ID-SEC-#281</p>
             </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex -space-x-3">
                {['NR', 'SM', 'DA', 'YB'].map((init, idx) => (
                  <div key={init} className={cn(
                     "w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black text-white uppercase ring-4 ring-slate-50 relative shadow-lg hover:-translate-y-1 transition-transform cursor-pointer", 
                     idx % 2 === 0 ? "bg-slate-900" : "bg-blue-600",
                     idx === 0 && "z-10"
                  )}>
                     {init}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase shadow-sm">+4</div>
             </div>
             <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm">
                <MoreVertical size={18} />
             </button>
          </div>
       </div>

       {/* Chat Area - Industrial Staggered */}
       <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-10 bg-[linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:100%_40px] scroll-smooth"
       >
          <AnimatePresence>
            {discussions.map((chat, idx) => (
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={chat.id} 
                className="flex gap-6 group"
               >
                  <div className="w-12 h-12 rounded-[20px] bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-[11px] font-black text-slate-900 shrink-0 uppercase relative ring-1 ring-slate-50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 font-display">
                     {chat.userAvatar}
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                     <div className="flex items-center gap-4">
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-tight font-display">{chat.userName}</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100 font-display italic">{chat.userRole}</span>
                        <span className="text-[10px] font-bold text-slate-300 ml-auto font-display italic">{chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                     </div>
                     <div className={cn(
                       "bg-white rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border-l-[4px] p-6 shadow-sm border border-slate-100 relative group-hover:shadow-md transition-all duration-300 group-hover:bg-slate-50/30",
                       chat.userId === user.uid ? "border-l-blue-600 bg-blue-50/10" : "border-l-slate-900"
                     )}>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed font-display">{chat.content}</p>
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                           <Activity size={14} className="text-blue-400" />
                        </div>
                     </div>
                  </div>
               </motion.div>
            ))}
          </AnimatePresence>
          {discussions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
               <Hash size={48} className="opacity-10" />
               <p className="text-xs font-bold uppercase tracking-widest">Commencez la discussion...</p>
            </div>
          )}
          <div className="text-center py-10 relative">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100 border-dashed"></div>
             <span className="relative bg-white px-10 text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] italic font-display translate-y-[-1px]">Archive Synchronisée (Cycle 24h)</span>
          </div>
       </div>

       {/* Input Area - Command Center Style */}
       <div className="p-8 bg-slate-50/50 border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="bg-white rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all flex flex-col group">
             <div className="flex items-center bg-slate-50/50 border-b border-slate-50 px-6 py-3 gap-6">
                <div className="flex gap-2">
                   <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Paperclip size={18} /></button>
                   <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><AtSign size={18} /></button>
                   <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Smile size={18} /></button>
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-display">Terminal Opérationnel</span>
                </div>
             </div>
             <div className="flex items-center bg-white p-2">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder="Rédiger une directive technique ou un point d'avancement..."
                  className="flex-1 bg-transparent border-none border-transparent focus:border-transparent focus:ring-0 px-6 py-6 text-xs font-bold text-slate-900 resize-none min-h-[100px] uppercase tracking-tight placeholder:italic placeholder:font-medium font-display leading-relaxed"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-slate-900 text-white w-24 h-24 rounded-2xl flex items-center justify-center border-none shadow-2xl disabled:opacity-20 hover:bg-blue-600 transition-all active:scale-95 group shrink-0 m-2"
                >
                   <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
             </div>
          </form>
       </div>
    </div>
  );
}
