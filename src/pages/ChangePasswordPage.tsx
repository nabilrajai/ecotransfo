import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Globe, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../lib/storage';
import { LOGO_URL } from '../constants';
import { api } from '../lib/api';

interface ChangePasswordPageProps {
  user: UserProfile;
  onPasswordChanged: (updatedUser: UserProfile) => void;
}

export function ChangePasswordPage({ user, onPasswordChanged }: ChangePasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
        // API Call
        await api.post('/update-password-first-login', { user_id: user.uid, new_password: newPassword });
        
        const updatedUser = { ...user, passwordChangeRequired: false };
        StorageService.saveUserProfile(updatedUser);
        onPasswordChanged(updatedUser);
        navigate('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur lors de la mise à jour du mot de passe: " + (err.message || ''));
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

        {/* Change Password Card */}
        <div className="bg-white rounded-[36px] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.1)] p-8 md:p-10 border border-slate-100 relative group animate-in fade-in zoom-in-95 duration-700">
          <div className="mb-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
               <Lock size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest font-display">Mise à jour Requise</h4>
              <p className="text-[10px] font-medium text-amber-700/85 leading-relaxed mt-1 font-display">Veuillez obligatoirement définir votre nouveau mot de passe de compte pour accéder au portail.</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-display">Compte Utilisateur</h4>
              <p className="text-xs font-bold text-slate-800 leading-relaxed mt-1 font-mono">{user.email}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-display italic">Nouveau mot de passe</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 pointer-events-none">
                   <Lock size={18} />
                </div>
                <input 
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[13px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 transition-all outline-none font-display shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-display italic">Confirmez votre nouveau mot de passe</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 pointer-events-none">
                   <Lock size={18} />
                </div>
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[13px] font-bold text-slate-950 focus:bg-white focus:border-blue-500 transition-all outline-none font-display shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 rounded-[20px] text-[11px] font-black tracking-[0.2em] shadow-2xl shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 transition-all font-display uppercase mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-3 justify-center">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Mise à jour...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                   <Save size={20} />
                   <span>Valider & Accéder</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-display italic group">
            <Globe size={14} className="group-hover:rotate-12 transition-transform" />
            <span>Sécurité du portail</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-display">© 2026 ECO TRANSFO S.A.</p>
        </div>
      </div>
    </div>
  );
}
