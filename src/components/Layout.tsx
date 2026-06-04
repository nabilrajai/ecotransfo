import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Bell, 
  User as UserIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  Search,
  Wallet,
  Menu,
  X,
  Layers,
  PieChart,
  BarChart3,
  FileText,
  Activity,
  Box,
  Building2,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { StorageService } from '../lib/storage';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { LOGO_URL } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: UserProfile;
}

export function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = user.role === 'CLIENT' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderKanban, label: 'Projets', path: '/projects' },
    { icon: Layers, label: 'Planning Stratégique', path: '/planning' },
    { icon: CheckSquare, label: 'Tâches', path: '/tasks' },
    { icon: MessageSquare, label: 'Réclamations', path: '/reclamations' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderKanban, label: 'Projets', path: '/projects' },
    { icon: Building2, label: 'Clients & KPIs', path: '/clients' },
    { icon: Layers, label: 'Planning Stratégique', path: '/planning' },
    { icon: CheckSquare, label: 'Tâches', path: '/tasks' },
    { icon: Wallet, label: 'Budget & Finance', path: '/budget' },
    { icon: Users, label: 'Ressources', path: '/resources' },
    { icon: FileText, label: 'Rapports', path: '/reports' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Administration', path: '/settings' },
  ];

  const handleLogout = () => {
    // Trigger Firebase signout without blocking redirection
    auth.signOut().catch(err => {
      console.error("Erreur déconnexion Firebase:", err);
    });
    StorageService.setUser(null);
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white transition-all duration-300 border-r border-slate-200 relative z-50",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100">
          <img src={LOGO_URL} alt="EcoTransfo" className={cn("transition-all duration-300", sidebarOpen ? "h-10" : "h-8")} />
          {sidebarOpen && (
            <div className="overflow-hidden">
               <p className="font-bold text-slate-900 text-sm tracking-tight leading-none uppercase font-display">ECOTRANSFO</p>
               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Management Platform</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group relative font-semibold text-sm",
                  isActive 
                    ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-20 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 z-[60] pointer-events-none whitespace-nowrap shadow-2xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all group",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-4 top-10 bg-white border border-slate-200 text-slate-400 p-1.5 rounded-full shadow-md z-[60] hover:text-blue-600 active:scale-95 transition-all"
        >
          <ChevronRight size={14} className={cn("transition-transform", sidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 border-r border-slate-100 flex flex-col md:hidden"
            >
              <div className="p-8 flex items-center justify-between border-b border-slate-50">
                <img src={LOGO_URL} alt="Eco Transfo" className="h-12 w-auto" />
                <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1 mt-8">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 rounded-3xl transition-all",
                        isActive 
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-200" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon size={22} className={isActive ? "text-white" : "text-slate-400"} />
                      <span className="font-bold text-lg">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-8 border-t border-slate-50">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full px-5 py-4 rounded-3xl text-rose-600 bg-rose-50 font-bold hover:bg-rose-100 transition-all"
                >
                  <LogOut size={22} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 md:px-12 shrink-0 relative z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100/50">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest font-display">Opérations Actives</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
              </Link>
            </div>
            
            <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

            <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-2xl transition-all group">
              <div className="text-right hidden sm:block leading-none">
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase font-display tracking-tight">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{user.role}</p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm object-cover group-hover:border-blue-200 transition-all" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:bg-blue-600 group-hover:scale-105 transition-all">
                  {user.displayName.charAt(0)}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="mt-12 py-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[10px]">ET</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-display">© 2026 ECO TRANSFO S.A. • Tous droits réservés</p>
             </div>
             <div className="flex items-center gap-6">
                <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest font-display">Documentation</a>
                <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest font-display">Support Technique</a>
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-mono font-bold text-slate-400 uppercase">v2.6.0-stable</div>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
