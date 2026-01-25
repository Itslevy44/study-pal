
import React, { useState, useEffect } from 'react';
import { User, UserRole, University } from '../types';
import { authApi, universitiesApi } from '../services/supabaseApi';
import Logo from './Logo';
import { LogIn, UserPlus, Mail, Lock, School, Calendar, ChevronRight, Loader } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [year, setYear] = useState('First Year');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      const unis = await universitiesApi.getUniversities();
      setUniversities(unis);
    };
    fetchUniversities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }

      if (!school) {
        setError('Please select your institution.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { user, error } = await authApi.login(email, password);
        if (error) {
          setError('Invalid email or password.');
          setLoading(false);
          return;
        }
        if (user) {
          onLogin(user);
        }
      } else {
        if (!year) {
          setError('Please select your year.');
          setLoading(false);
          return;
        }
        const { user, error } = await authApi.register(email, password, school, year);
        if (error) {
          setError('Registration failed. Email may already exist.');
          setLoading(false);
          return;
        }
        if (user) {
          onLogin(user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-slate-100">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-4"><Logo size="md" /></div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Study Pal</h1>
            <p className="text-slate-400 mt-1 font-bold text-xs uppercase tracking-widest">
              {isLogin ? 'Sign in to your hub' : 'Create your scholar account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 animate-in fade-in zoom-in">
                {error}
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="email" placeholder="Email Address" className="input-auth" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="password" placeholder="Password" className="input-auth" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <select required className="input-auth appearance-none font-bold" value={school} onChange={(e) => setSchool(e.target.value)}>
                <option value="">Select Institution...</option>
                {universities.length === 0 ? (
                  <option disabled>Loading institutions...</option>
                ) : (
                  universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)
                )}
              </select>
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <select className="input-auth appearance-none font-bold" value={year} onChange={(e) => setYear(e.target.value)}>
                    <option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 disabled:bg-indigo-400 shadow-lg transition-all flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader size={20} className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
              <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Join Now')}</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
              {isLogin ? "Need an account? Sign up" : "Existing member? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
