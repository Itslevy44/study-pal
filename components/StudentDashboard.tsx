
import React, { useState, useEffect, useCallback } from 'react';
import { User, StudyMaterial, TaskItem, University } from '../types';
import { api } from '../services/api';
import { getStudyHelp } from '../services/geminiService';
import Logo from './Logo';
import { 
  BookOpen, 
  PlusCircle, 
  Lock, 
  Crown, 
  Search, 
  UserCircle,
  LogOut,
  Calendar,
  MessageSquare,
  Send,
  Trash2,
  Smartphone,
  DownloadCloud,
  LayoutGrid,
  FileText,
  X,
  Download,
  Eye,
  FileSearch,
  Settings,
  Shield,
  Edit3,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onRefresh?: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onRefresh }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [offlineMaterials, setOfflineMaterials] = useState<StudyMaterial[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<'hub' | 'tasks' | 'ai' | 'profile' | 'saved'>('hub');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'note' | 'past-paper'>('all');
  const [universities, setUniversities] = useState<University[]>([]);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editSchool, setEditSchool] = useState(user.school);
  const [editYear, setEditYear] = useState(user.year);

  const isSubscribed = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : false;

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    const [m, t, u] = await Promise.all([
      api.getMaterials(),
      api.getTasks(user.id),
      api.getUniversities()
    ]);
    setMaterials(m);
    setTasks(t);
    setUniversities(u);
    setOfflineMaterials(api.getOffline(user.id));
    setLoading(false);
  };

  const handleAskAI = async () => {
    if (!query) return;
    setAiLoading(true);
    const context = materials.map(m => m.title).slice(0, 5).join(', ');
    const res = await getStudyHelp(query, context);
    setAiResponse(res);
    setAiLoading(false);
  };

  const handleSaveTask = async () => {
    if (!taskTitle || !taskContent) return;
    await api.saveTask({ userId: user.id, title: taskTitle, content: taskContent, type: 'note' });
    setTaskTitle(''); setTaskContent(''); setShowTaskModal(false);
    await refreshData();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateProfile(user.id, { email: editEmail, school: editSchool, year: editYear });
    setShowEditProfile(false);
    if (onRefresh) onRefresh();
    alert('Profile updated.');
  };

  const verifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateUserSubscription(user.id, 4);
    setShowPayment(false);
    if (onRefresh) onRefresh();
  };

  const filteredMaterials = (list: StudyMaterial[]) => list.filter(m => {
    const s = search.toLowerCase();
    const matchesSearch = m.title.toLowerCase().includes(s) || m.school.toLowerCase().includes(s);
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3"><Logo size="sm" /><h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Study Pal</h1></div>
        <div className="flex items-center gap-3">
          {!isSubscribed && <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse"><Crown className="w-3 h-3" /> Upgrade</button>}
          <div className="flex items-center gap-2 sm:pl-4 sm:border-l cursor-pointer" onClick={() => setActiveTab('profile')}>
            <div className="text-right hidden sm:block"><p className="text-sm font-black text-slate-800">{user.email.split('@')[0]}</p><p className="text-[10px] text-indigo-500 uppercase font-black">{user.year}</p></div>
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><UserCircle className="w-6 h-6" /></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <nav className="w-full md:w-64 bg-white md:border-r flex md:flex-col fixed bottom-0 left-0 md:static z-40 h-16 md:h-full justify-around md:justify-start md:pt-8 shadow-lg md:shadow-none">
          <NavButton active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} icon={<LayoutGrid />} label="Hub" />
          <NavButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} icon={<DownloadCloud />} label="Saved" />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Calendar />} label="Space" />
          <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare />} label="Tutor" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle />} label="Me" />
        </nav>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 p-4 sm:p-10 no-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-300"><Loader2 className="animate-spin mb-4" size={40} /><p className="font-bold">Syncing resources...</p></div>
          ) : (
            <>
              {activeTab === 'hub' && (
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8"><h2 className="text-2xl font-black text-slate-800 mb-5">University Library</h2>
                    <div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" /><input type="text" placeholder="Search..." className="input pl-12" value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <div className="flex gap-2"><FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="All" /><FilterButton active={filterType === 'note'} onClick={() => setFilterType('note')} label="Notes" icon={<BookOpen size={14} />} /><FilterButton active={filterType === 'past-paper'} onClick={() => setFilterType('past-paper')} label="Papers" icon={<FileText size={14} />} /></div></div>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials(materials).map(m => (
                      <MaterialCard key={m.id} material={m} isSubscribed={isSubscribed} onOpen={() => setViewingMaterial(m)} onSave={() => { api.saveOffline(user.id, m); refreshData(); }} onUpgrade={() => setShowPayment(true)} />
                    ))}
                    {filteredMaterials(materials).length === 0 && <div className="col-span-full py-20 text-center"><FileSearch size={48} className="mx-auto text-slate-200 mb-4" /><p className="font-bold text-slate-400">Empty Library</p></div>}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="bg-white rounded-3xl p-8 border">
                    <div className="flex items-center gap-6 mb-10"><div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600"><UserCircle size={48} /></div><div className="flex-1">
                      <h3 className="text-xl font-black text-slate-800 truncate">{user.email}</h3><p className="text-slate-400 font-bold">{user.school} • Year {user.year}</p></div>
                      <button onClick={() => setShowEditProfile(true)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl"><Edit3 size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => setShowEditProfile(true)} className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between font-bold text-sm">
                        <div className="flex items-center gap-3"><Settings size={18} /> Update Info</div><ChevronRight size={18} />
                      </button>
                      <button onClick={onLogout} className="w-full mt-4 py-4 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl">Sign Out</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showEditProfile && (
        <Modal title="Edit Profile" onClose={() => setShowEditProfile(false)}>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <input required type="email" className="input" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            <select required className="input" value={editSchool} onChange={e => setEditSchool(e.target.value)}>{universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
            <select required className="input" value={editYear} onChange={e => setEditYear(e.target.value)}><option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option></select>
            <button type="submit" className="btn-submit">Save Changes</button>
          </form>
        </Modal>
      )}

      {viewingMaterial && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black"><header className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white"><h3 className="font-black truncate">{viewingMaterial.title}</h3><button onClick={() => setViewingMaterial(null)}><X size={24} /></button></header>
          <iframe src={viewingMaterial.fileUrl} className="flex-1 w-full border-none" />
        </div>
      )}

      {showPayment && (
        <Modal title="Activate Premium" onClose={() => setShowPayment(false)}>
          <div className="bg-indigo-50 p-5 rounded-2xl text-center mb-6"><p className="text-xs font-black text-slate-400">PAY KES 50 TO</p><p className="text-xl font-black text-slate-800 tracking-widest">0748 717 099</p></div>
          <form onSubmit={verifyPayment} className="space-y-4"><textarea required placeholder="Paste M-Pesa Message" className="input h-24" /><button type="submit" className="btn-submit">Verify Payment</button></form>
        </Modal>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{icon} {label}</button>
);

const MaterialCard = ({ material, isSubscribed, onOpen, onSave, onUpgrade }: any) => (
  <div className="bg-white rounded-3xl border p-6 flex flex-col hover:shadow-xl transition-all relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4"><div className={`p-4 rounded-2xl ${material.type === 'note' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>{material.type === 'note' ? <BookOpen size={20} /> : <FileText size={20} />}</div>{!isSubscribed && <Lock size={16} className="text-slate-300" />}</div>
    <h4 className="font-black text-slate-800 text-lg mb-1 line-clamp-2">{material.title}</h4><p className="text-[10px] font-bold text-slate-400 mb-8 uppercase">{material.school}</p>
    <div className="flex gap-2 mt-auto"><button onClick={() => isSubscribed ? onOpen() : onUpgrade()} className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${isSubscribed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}><Eye size={14} /> View</button>{isSubscribed && <button onClick={onSave} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Download size={18} /></button>}</div>
  </div>
);

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 md:px-10 py-2 md:py-5 transition-all relative ${active ? 'text-indigo-600' : 'text-slate-400'}`}><div className={`p-2 rounded-xl ${active ? 'bg-indigo-50' : ''}`}>{React.cloneElement(icon, { size: 18 })}</div><span className="text-[8px] md:text-sm font-black uppercase md:capitalize">{label}</span></button>
);

const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"><div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in"><button onClick={onClose} className="absolute top-6 right-6 text-slate-300"><X /></button><h3 className="text-xl font-black mb-6 text-slate-800">{title}</h3>{children}</div></div>
);

export default StudentDashboard;
