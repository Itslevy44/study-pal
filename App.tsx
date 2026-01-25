
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ShieldAlert, BookOpen, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  const refreshUser = () => {
    const session = api.getCurrentUser();
    setUser(session);
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);

    // Strict Security Measures
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    // Attempt to detect common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrtSc, Windows + S, Cmd+Shift+4 etc (Partial blocking only)
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 3000);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setIsWindowBlurred(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleLogout = () => {
    api.setCurrentUser(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white">
        <BookOpen className="w-16 h-16 animate-bounce mb-4" />
        <h1 className="text-3xl font-bold">Study Pal</h1>
        <p className="mt-2 opacity-80">Securing your workspace...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${isWindowBlurred ? 'screenshot-blur pointer-events-none select-none' : ''}`}>
      {user ? (
        user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} onRefresh={refreshUser} />
        )
      ) : (
        <Auth onLogin={(u) => setUser(u)} />
      )}

      {/* Security Overlay for blurred state */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Protected Content</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed">
              Screenshot prevention is active. To continue studying, please keep the Study Pal window focused and active.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">
              <ShieldCheck size={14} className="text-green-500" /> Secure Session Verified
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
