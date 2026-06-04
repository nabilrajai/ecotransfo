import { useState, FormEvent } from 'react';
import { Mail, LogIn, Globe, ShieldCheck, Lock, User } from 'lucide-react';
import { LOGO_URL } from '../constants';
import { UserProfile } from '../types';
import { StorageService } from '../lib/storage';
import { api } from '../lib/api';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isRegistering) {
        // API: Register
        const response = await api.post('/register', { name, email, password });
        setErrorMsg('Inscription réussie. Veuillez attendre l\'approbation de l\'administrateur.');
        setIsRegistering(false); 
      } else {
        // API: Login
        const data = await api.post('/login', { email, password });
        
        if (data.must_change_password) {
            const userProfile: UserProfile = {
              uid: String(data.user_id),
              displayName: email.split('@')[0] || 'Utilisateur',
              email: email,
              role: 'EMPLOYEE',
              passwordChangeRequired: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              token: data.token || data.access_token || ''
            };
            onLogin(userProfile);
        } else {
            const token = data.token || data.access_token || data.plainTextToken || (data.data && data.data.token) || (data.data && data.data.access_token) || (data.user && data.user.token);
            console.log("Login successful, token present?", !!token, "Raw data keys:", Object.keys(data));
            
            if (!token) {
              console.warn("L'API de connexion n'a pas renvoyé de jeton (token). L'application tentera d'utiliser les cookies de session.");
            }
            
            const userProfile: UserProfile = {
              uid: String(data.user.id),
              displayName: data.user.name || email.split('@')[0],
              email: data.user.email,
              role: (data.user.role === 'PROJECT_MANAGER' || data.user.role === 'CLIENT' || data.user.role === 'OWNER' || data.user.role === 'FINANCE' || data.user.role === 'HR') ? data.user.role : 'EMPLOYEE',
              passwordChangeRequired: false,
              createdAt: data.user.created_at || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              token: token || ''
            };
            StorageService.saveUserProfile(userProfile);
            onLogin(userProfile);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 opacity-[0.02] skew-x-12 translate-x-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-blue-600 opacity-[0.02] -skew-x-12 -translate-x-32 pointer-events-none"></div>
      
      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-6 mb-6 bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-50 transition-transform hover:scale-105 duration-500">
             <img src={LOGO_URL} alt="Eco Transfo Logo" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-display leading-tight">Eco Transfo <span className="text-blue-600 italic">EPPM</span></h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px] font-display italic">Portail Client & Gestion de Projets</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[36px] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.1)] p-8 md:p-10 border border-slate-100 relative group">
          <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
               <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest font-display">Authentification Sécurisée</h4>
              <p className="text-[10px] font-medium text-blue-600/80 leading-relaxed mt-1 font-display">Connectez-vous à la plateforme de production.</p>
            </div>
          </div>

          {errorMsg && (
            <div className={`mb-4 p-3 border ${errorMsg.includes('succès') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'} text-xs rounded-xl`}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-display italic">Nom complet</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 pointer-events-none">
                     <User size={18} />
                  </div>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[13px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 transition-all outline-none font-display shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-display italic">Email</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 pointer-events-none">
                   <Mail size={18} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@ecotransfo.ma"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[13px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 transition-all outline-none font-display shadow-sm"
                />
              </div>
            </div>

            {/* Password Field - Always visible */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-display italic">Mot de passe</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 pointer-events-none">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[13px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 transition-all outline-none font-display shadow-sm"
                />
              </div>
            </div>

            {!isRegistering && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={async () => {
                        if (!email) { setErrorMsg("Veuillez entrer votre email d'abord."); return; }
                        setLoading(true);
                        try {
                            await api.post('/forgot-password', { email });
                            setErrorMsg("Mot de passe envoyé par email avec succès.");
                        } catch (err: any) {
                            setErrorMsg(err.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-blue-600 uppercase font-display"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 rounded-[20px] text-[11px] font-black tracking-[0.2em] shadow-2xl shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 transition-all font-display uppercase mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-3 justify-center">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Connexion en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                   <LogIn size={20} />
                   <span>{isRegistering ? "S'inscrire" : "Se connecter"}</span>
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
             <button
               type="button"
               onClick={() => setIsRegistering(!isRegistering)}
               className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest font-display transition-colors bg-transparent border-none cursor-pointer p-2"
             >
               {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
             </button>
          </div>


        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-display italic group">
            <Globe size={14} className="group-hover:rotate-12 transition-transform" />
            <span>Environnement de production</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-display">© 2026 ECO TRANSFO S.A.</p>
        </div>
      </div>
    </div>
  );
}
