import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ShieldAlert, BookOpen, ShieldCheck, RefreshCw, Download, X } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSecurityActive, setIsSecurityActive] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const refreshUser = () => {
    const session = api.getCurrentUser();
    setUser(session);
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Show success message
      alert('Study Pal has been installed successfully!');
    };

    const checkIfInstalled = async () => {
      // Check if app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running as standalone/installed');
      }
    };

    // Strict Security Measures to discourage screenshots and data theft
    const activateSecurity = () => {
      // Don't blur if we are just switching focus to an internal iframe (like the PDF viewer)
      // or if the window is still actually visible to the user.
      if (document.activeElement?.tagName === 'IFRAME') return;
      if (document.visibilityState === 'visible') return;
      
      setIsSecurityActive(true);
    };

    const deactivateSecurity = () => setIsSecurityActive(false);
    
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common screenshot and print shortcuts
      const isScreenshot = 
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && e.key === 's');

      if (isScreenshot) {
        e.preventDefault();
        setIsSecurityActive(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsSecurityActive(true);
      }
    };

    // Events that trigger protection
    window.addEventListener('blur', activateSecurity);
    window.addEventListener('focus', deactivateSecurity);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check if already installed on mount
    checkIfInstalled();

    return () => {
      window.removeEventListener('blur', activateSecurity);
      window.removeEventListener('focus', deactivateSecurity);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLogout = () => {
    api.setCurrentUser(null);
    setUser(null);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('PWA installed successfully');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Installation error:', error);
      }
    } else {
      console.warn('No deferred prompt available');
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
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
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Install Study Pal</p>
                <p className="text-xs opacity-90">Access your study materials offline</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismissInstall}
                className="p-2 hover:bg-indigo-600/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {user ? (
        user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} onRefresh={refreshUser} />
        )
      ) : (
        <Auth onLogin={(u) => setUser(u)} />
      )}

      {/* Security Overlay - Prevents Screenshotting by hiding content when hidden/blurred */}
      {isSecurityActive && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/95 backdrop-blur-3xl pointer-events-auto select-none">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm text-center animate-in zoom-in duration-300 mx-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Alert</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed text-sm">
              Study Pal has hidden content for your security. Please ensure you are not sharing your screen or trying to capture restricted materials.
            </p>
            
            <button 
              onClick={() => setIsSecurityActive(false)}
              className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw size={18} /> Resume My Session
            </button>

            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">
              <ShieldCheck size={14} className="text-green-500" /> ENCRYPTED CONNECTION
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;