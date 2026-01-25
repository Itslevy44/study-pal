
import React, { useState, useEffect } from 'react';
import { User, UserRole, University } from '../types';
import { api } from '../services/api';
import Logo from './Logo';
import { LogIn, UserPlus, Mail, Lock, School, Calendar } from 'lucide-react';

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
  const [universities, setUniversities] = useState<University[]>([]);

  useEffect(() => {
    setUniversities(api.getUniversities());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = api.login(email, password);
      if (user) {
        api.setCurrentUser(user);
        onLogin(user);
      } else {
        setError('Invalid credentials. Check your email/password.');
      }
    } else {
      if (!email || !password || !school) {
        setError('Please fill all fields');
        return;
      }
      const newUser = api.register({
        email,
        password,
        school,
        year,
        role: 'student' as UserRole
      });
      api.setCurrentUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 hover:scale-110 transition-transform cursor-pointer">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Study Pal</h1>
            <p className="text-slate-400 mt-2 font-medium">
              {isLogin ? 'Welcome back, Scholar!' : 'Join the hub of knowledge'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input type="email" placeholder="University Email" className="input-auth" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input type="password" placeholder="Password" className="input-auth" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                <div className="relative group">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <select required className="input-auth appearance-none font-bold" value={school} onChange={(e) => setSchool(e.target.value)}>
                    <option value="">Select University...</option>
                    {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <select className="input-auth appearance-none font-bold" value={year} onChange={(e) => setYear(e.target.value)}>
                    <option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option><option>Postgraduate</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 mt-4">
              {isLogin ? <><LogIn className="w-6 h-6" /> Sign In</> : <><UserPlus className="w-6 h-6" /> Create Account</>}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:text-indigo-800 transition-all">
              {isLogin ? "New scholar? Create an account" : "Already registered? Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
