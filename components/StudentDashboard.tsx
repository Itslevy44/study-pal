import React, { useState, useEffect, useCallback } from 'react';
import { User, StudyMaterial, TaskItem } from '../types';
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
  ShieldCheck,
  Smartphone,
  ClipboardCheck,
  DownloadCloud,
  LayoutGrid,
  FileText,
  X,
  Download,
  Eye,
  FileSearch,
  CheckCircle2,
  Settings,
  Shield
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
  const [search, setSearch] = useState('');
  const [mpesaMessage, setMpesaMessage] = useState('');
  
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [taskType, setTaskType] = useState<'note' | 'timetable'>('note');

  const [showPayment, setShowPayment] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // FIX: Define isSubscribed here so it's available in the component scope
  const isSubscribed = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : false;

  // Robust history management for the viewer to prevent freezes
  const closeViewer = useCallback(() => {
    setViewingMaterial(null);
  }, []);

  useEffect(() => {
    refreshData();
    
    const handlePopState = (event: PopStateEvent) => {
      // If we're moving back and the viewer was open, close it
      closeViewer();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeViewer]);

  const refreshData = () => {
    setMaterials(api.getMaterials());
    setOfflineMaterials(api.getOffline(user.id));
    setTasks(api.getTasks(user.id));
  };

  const handleAskAI = async () => {
    if (!query) return;
    setAiLoading(true);
    const context = materials.map(m => m.title).join(', ');
    const res = await getStudyHelp(query, context);
    setAiResponse(res);
    setAiLoading(false);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim() || !taskContent.trim()) {
      alert('Please fill in both title and details.');
      return;
    }
    api.saveTask({
      userId: user.id,
      title: taskTitle,
      content: taskContent,
      type: taskType
    });
    setTaskTitle('');
    setTaskContent('');
    setTaskType('note');
    setShowTaskModal(false);
    refreshData();
  };

  const handleOpenMaterial = (m: StudyMaterial) => {
    setViewingMaterial(m);
    // Push state so back button closes the modal instead of leaving the app
    window.history.pushState({ viewer: true }, '');
  };

  const handleCloseViewerBtn = () => {
    if (viewingMaterial) {
      // Trigger popstate naturally
      window.history.back();
    }
  };

  const handleSaveToApp = (material: StudyMaterial) => {
    api.saveOffline(user.id, material);
    setOfflineMaterials(api.getOffline(user.id));
    alert(`${material.title} saved in-app.`);
  };

  const handleRemoveOffline = (id: string) => {
    api.removeOffline(user.id, id);
    setOfflineMaterials(api.getOffline(user.id));
  };

  const verifyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaMessage.trim()) return;
    api.updateUserSubscription(user.id, 4);
    setShowPayment(false);
    if (onRefresh) onRefresh();
    alert(`Verified! Premium access granted.`);
  };

  const filteredMaterials = (materialsList: StudyMaterial[]) => materialsList.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo size="sm" />
          <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">Study Pal</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isSubscribed && (
            <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black tracking-widest uppercase animate-pulse">
              <Crown className="w-3 h-3" /> Upgrade
            </button>
          )}
          <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 truncate max-w-[120px]">{user.email.split('@')[0]}</p>
              <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-black">{user.year}</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <UserCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <nav className="w-full md:w-64 bg-white md:border-r border-slate-200 flex md:flex-col fixed bottom-0 left-0 md:static z-40 h-16 md:h-full justify-around md:justify-start md:pt-8 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] md:shadow-none">
          <NavButton active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} icon={<LayoutGrid />} label="Hub" />
          <NavButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} icon={<DownloadCloud />} label="Saved" />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Calendar />} label="Space" />
          <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare />} label="Tutor" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle />} label="Me" />
          <button onClick={onLogout} className="hidden md:flex items-center gap-3 px-8 py-4 text-red-500 hover:bg-red-50 mt-auto mb-10 mx-4 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </nav>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 p-4 sm:p-6 lg:p-10 no-scrollbar">
          {activeTab === 'hub' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-3">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">University Library</h2>
                <div className="mt-5 relative max-w-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input type="text" placeholder="Search resources..." className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-medium shadow-sm focus:border-indigo-500" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredMaterials(materials).map(m => (
                  <MaterialCard 
                    key={m.id} 
                    material={m} 
                    isSubscribed={isSubscribed} 
                    onOpen={() => handleOpenMaterial(m)}
                    onSave={() => handleSaveToApp(m)}
                    onUpgrade={() => setShowPayment(true)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-3">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Saved Resources</h2>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredMaterials(offlineMaterials).map(m => (
                  <MaterialCard 
                    key={m.id} 
                    material={m} 
                    isSubscribed={true} 
                    onOpen={() => handleOpenMaterial(m)}
                    onRemove={() => handleRemoveOffline(m.id)}
                    isSaved={true}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3">
               <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Study Space</h2>
                <button onClick={() => setShowTaskModal(true)} className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-xl active:scale-90"><PlusCircle /></button>
              </div>
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start gap-4 group">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${task.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}><MessageSquare size={18} /></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-800 truncate">{task.title}</h4>
                        <button onClick={() => { if(confirm('Delete?')) { api.deleteTask(task.id); refreshData(); } }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                      </div>
                      <p className="text-slate-500 text-sm mt-1 whitespace-pre-wrap">{task.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
             <div className="max-w-3xl mx-auto h-full flex flex-col animate-in fade-in">
                <h2 className="text-2xl font-black text-slate-800 mb-6">AI Tutor</h2>
                <div className="flex-1 overflow-y-auto mb-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-[250px]">
                    {aiResponse ? (
                      <div className="bg-slate-50 p-5 rounded-xl font-medium text-slate-700 leading-relaxed text-sm sm:text-base">{aiResponse}</div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <Shield size={48} className="mb-4" />
                        <p className="font-bold">Ask me anything about your units!</p>
                      </div>
                    )}
                </div>
                <div className="relative mb-6">
                    <textarea placeholder="Ask your tutor..." className="w-full pl-5 pr-14 py-4 bg-white border-2 border-slate-100 rounded-xl shadow-lg h-24 font-medium resize-none" value={query} onChange={e => setQuery(e.target.value)} />
                    <button onClick={handleAskAI} disabled={aiLoading || !query.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-lg disabled:bg-slate-200 transition-all active:scale-95">
                        {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-6 mb-10">
                      <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600"><UserCircle size={48} /></div>
                      <div>
                          <h3 className="text-xl font-black text-slate-800 truncate">{user.email}</h3>
                          <p className="text-slate-400 font-bold mt-1 text-xs">{user.school} • Year {user.year}</p>
                      </div>
                  </div>
                  <div className="space-y-3">
                      <button className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-sm font-bold text-slate-700">
                        <div className="flex items-center gap-3"><Settings size={18} /> Account Settings</div>
                      </button>
                      <button className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-sm font-bold text-slate-700">
                        <div className="flex items-center gap-3"><Shield size={18} /> Security & Privacy</div>
                      </button>
                      <button onClick={onLogout} className="w-full mt-4 py-4 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-100">Sign Out</button>
                  </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Resource Viewer Modal - Intensive Anti-Screenshot protection */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in fade-in duration-300 overflow-hidden select-none">
          <div className="w-full h-full flex flex-col relative">
            
            {/* Dynamic Watermark Layer - Moves slightly or repeats many times */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.05] select-none flex flex-wrap gap-12 items-center justify-center rotate-12 overflow-hidden">
              {Array(100).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-black text-white whitespace-nowrap uppercase tracking-widest">{user.email}</span>
                  <span className="text-[10px] text-indigo-400 font-black">STUDY PAL SECURE</span>
                </div>
              ))}
            </div>

            <header className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-50">
              <div className="flex items-center gap-4 text-white">
                <div className="p-2.5 bg-white/5 rounded-lg"><BookOpen size={20} /></div>
                <div>
                  <h3 className="font-black text-lg truncate leading-tight">{viewingMaterial.title}</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Protected Viewer • No Capture Allowed</p>
                </div>
              </div>
              <button 
                onClick={handleCloseViewerBtn} 
                className="p-3 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-full"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-0 select-none no-scrollbar">
              {['pdf'].includes(viewingMaterial.fileExtension.toLowerCase()) ? (
                <iframe src={viewingMaterial.fileUrl} className="w-full h-full border-none" title={viewingMaterial.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={viewingMaterial.fileUrl} 
                    alt={viewingMaterial.title} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
                    onContextMenu={e => e.preventDefault()}
                    onDragStart={e => e.preventDefault()}
                  />
                </div>
              )}
            </div>

            <footer className="bg-slate-900 p-4 border-t border-white/10 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-center gap-3 text-white/60 font-black text-[9px] uppercase tracking-[0.3em]">
                  <Shield size={16} className="text-amber-500 animate-pulse" /> Content Protected by Study Pal Security Hub
                </div>
            </footer>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setShowPayment(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 p-2"><X size={20} /></button>
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center">Semester Activation</h3>
            <div className="bg-indigo-50 border-2 border-indigo-100 p-5 rounded-2xl text-center mb-6">
              <div className="flex justify-center mb-2 text-indigo-600"><Smartphone size={28} /></div>
              <p className="text-[10px] font-black text-slate-400 mb-1">PAY KES 50 TO</p>
              <p className="text-xl font-black text-slate-800 tracking-widest">0748 717 099</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">LEVY KIRUI</p>
            </div>
            <form onSubmit={verifyPayment} className="space-y-4">
              <label className="label">Paste M-Pesa Message</label>
              <textarea required placeholder="Confirmation message..." className="input h-28 resize-none text-xs" value={mpesaMessage} onChange={e => setMpesaMessage(e.target.value)} />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg active:scale-95 transition-all">ACTIVATE SEMESTER</button>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-6 text-slate-800">Study Space Entry</h3>
            <div className="space-y-4">
                <input required placeholder="Title" className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                <textarea required placeholder="Details..." className="input h-32 resize-none" value={taskContent} onChange={e => setTaskContent(e.target.value)} />
                <div className="flex flex-col gap-1">
                  <label className="label text-[10px]">Entry Type</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTaskType('note')} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${taskType === 'note' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>NOTE</button>
                    <button type="button" onClick={() => setTaskType('timetable')} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${taskType === 'timetable' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>TIMETABLE</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowTaskModal(false)} className="flex-1 text-slate-400 text-[10px] font-black uppercase py-3">Cancel</button>
                    <button onClick={handleSaveTask} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest">Save Entry</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MaterialCard = ({ material, isSubscribed, onOpen, onSave, onUpgrade, isSaved, onRemove }: any) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col hover:shadow-2xl transition-all relative overflow-hidden group border-b-4 border-b-slate-200">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl ${material.type === 'note' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
        {material.type === 'note' ? <BookOpen size={20} /> : <FileText size={20} />}
      </div>
      {!isSubscribed && (
        <div className="bg-slate-100 p-2 rounded-lg text-slate-300">
          <Lock size={16} />
        </div>
      )}
    </div>
    <h4 className="font-black text-slate-800 text-lg mb-1 line-clamp-2 leading-snug">{material.title}</h4>
    <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-wider">{material.school} • Year {material.year}</p>
    
    <div className="flex gap-2 mt-auto">
      <button 
        onClick={() => !isSubscribed ? onUpgrade() : onOpen()} 
        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isSubscribed ? 'bg-slate-900 text-white hover:bg-black shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
      >
        <Eye size={14} /> View
      </button>
      {isSubscribed && !isSaved && (
        <button onClick={onSave} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm" title="Save In-App">
          <Download size={18} />
        </button>
      )}
      {isSaved && (
        <button onClick={onRemove} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm" title="Remove">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  </div>
);

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 md:px-10 py-2 md:py-5 transition-all relative group ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-50 scale-110 shadow-sm' : 'group-hover:bg-slate-50'}`}>{React.cloneElement(icon, { size: 18 })}</div>
    <span className={`text-[8px] md:text-sm font-black uppercase md:capitalize tracking-wider md:tracking-normal ${active ? 'opacity-100' : 'opacity-60 md:opacity-100'}`}>{label}</span>
    {active && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 md:hidden animate-in slide-in-from-top duration-300" />}
    {active && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full animate-in slide-in-from-left duration-300" />}
  </button>
);

const isSubscribedCheck = (user: User) => user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

export default StudentDashboard;