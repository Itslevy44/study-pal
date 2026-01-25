import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ShieldAlert, BookOpen, ShieldCheck, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSecurityActive, setIsSecurityActive] = useState(false);

  const refreshUser = () => {
    const session = api.getCurrentUser();
    setUser(session);
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);

    // Strict Security Measures to discourage screenshots and data theft
    const activateSecurity = () => setIsSecurityActive(true);
    const deactivateSecurity = () => setIsSecurityActive(false);
    
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common screenshot and print shortcuts
      const isScreenshot = 
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac
        (e.ctrlKey && e.key === 'p') || // Print
        (e.metaKey && e.key === 'p') || // Print Mac
        (e.ctrlKey && e.shiftKey && e.key === 's') || // Windows Snipping
        (e.metaKey && e.shiftKey && e.key === 's'); // Windows Snipping on Mac keyboard

      if (isScreenshot) {
        e.preventDefault();
        activateSecurity();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        activateSecurity();
      }
    };

    // Events that trigger protection
    window.addEventListener('blur', activateSecurity);
    window.addEventListener('focus', deactivateSecurity);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', activateSecurity);
      window.removeEventListener('focus', deactivateSecurity);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
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
    <div className={`min-h-screen transition-all duration-300 ${isSecurityActive ? 'screenshot-blur pointer-events-none select-none' : ''}`}>
      {user ? (
        user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} onRefresh={refreshUser} />
        )
      ) : (
        <Auth onLogin={(u) => setUser(u)} />
      )}

      {/* Security Overlay - Prevents Screenshotting by hiding content when blurred */}
      {isSecurityActive && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/95 backdrop-blur-3xl pointer-events-auto select-none">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm text-center animate-in zoom-in duration-300 mx-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Protected Content</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed text-sm">
              Study Pal uses advanced encryption and screen protection. Content is hidden when the window is inactive or a capture tool is detected.
            </p>
            
            <button 
              onClick={() => setIsSecurityActive(false)}
              className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw size={18} /> Resume Studying
            </button>

            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">
              <ShieldCheck size={14} className="text-green-500" /> SECURE SESSION ACTIVE
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;