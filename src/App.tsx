/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserProfile } from './types';
import { StorageService } from './lib/storage';

// Pages
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { TasksPage } from './pages/TasksPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BudgetPage } from './pages/BudgetPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GlobalGantt } from './pages/GlobalGantt';
import { ClientsPage } from './pages/ClientsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ClientPortal } from './pages/ClientPortal';
import { Layout } from './components/Layout';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local user state immediately
    const savedUser = StorageService.getUser();
    if (savedUser) {
        setUser(savedUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!user) return;
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, select, [role="button"], input[type="button"], input[type="submit"]');
      
      if (clickable) {
        let text = clickable.textContent?.trim() || clickable.getAttribute('aria-label') || clickable.getAttribute('title') || 'Action Inconnue';
        if (text.length > 60) text = text.substring(0, 60) + '...';
        const tag = clickable.tagName.toLowerCase();
        
        if (text) {
          StorageService.addActivityLog(user.uid, "Interaction Système", `Cliqué sur ${tag} : "${text}"`);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [user]);

  const handleLogin = async (profile: UserProfile) => {
    StorageService.setUser(profile);
    setUser(profile);
  };
  
  const handlePasswordChanged = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        {user ? (
          user.passwordChangeRequired ? (
            <Route path="*" element={<ChangePasswordPage user={user} onPasswordChanged={handlePasswordChanged} />} />
          ) : (
            <Route element={<Layout user={user} />}>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/projects" element={<ProjectList user={user} />} />
              <Route path="/projects/:id" element={<ProjectDetail user={user} />} />
              <Route path="/clients" element={<ClientsPage user={user} />} />
              <Route path="/tasks" element={<TasksPage user={user} />} />
              <Route path="/resources" element={<ResourcesPage user={user} />} />
              <Route path="/notifications" element={<NotificationsPage user={user} />} />
              <Route path="/profile" element={<ProfilePage user={user} />} />
              <Route path="/budget" element={<BudgetPage user={user} />} />
              <Route path="/reports" element={<ReportsPage user={user} />} />
              <Route path="/reclamations" element={<ClientPortal user={user} />} />
              <Route path="/planning" element={<GlobalGantt user={user} />} />
              <Route path="/settings" element={<SettingsPage user={user} />} />
            </Route>
          )
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
      <Toaster position="top-right" richColors expand={false} closeButton />
    </Router>
  );
}
