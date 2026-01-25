
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ShieldAlert, BookOpen } from 'lucide-react';

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

    // Anti-screenshot security measures
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contextmenu', handleContextMenu);
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
        <p className="mt-2 opacity-80">Loading your knowledge hub...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${isWindowBlurred ? 'screenshot-blur pointer-events-none' : ''}`}>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center">
            <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Security Protection</h2>
            <p className="mt-2 text-slate-600">Please stay active in the browser window to view study materials. Content protection is enabled.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
