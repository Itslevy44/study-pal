import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onRefresh?: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onRefresh }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<'hub' | 'tasks' | 'ai' | 'profile'>('hub');
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
  const isSubscribed = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    setMaterials(api.getMaterials());
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
    if (!taskTitle) return;
    api.saveTask({
      userId: user.id,
      title: taskTitle,
      content: taskContent,
      type: taskType,
      date: new Date().toISOString()
    });
    setTaskTitle('');
    setTaskContent('');
    setShowTaskModal(false);
    refreshData();
  };

  const handleDeleteTask = (id: string) => {
    if(confirm('Delete this entry?')) {
      api.deleteTask(id);
      refreshData();
    }
  };

  const verifyPayment = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    console.log("Verify button clicked. Input:", mpesaMessage);
    
    if (!mpesaMessage || mpesaMessage.trim().length < 15) {
      alert('Please paste a valid and complete M-Pesa confirmation message.');
      return;
    }

    const cleanMessage = mpesaMessage.trim();
    
    // Robust Regex for Kenyan M-Pesa messages
    // Matches 10 character code e.g., RJE32F0ABC, SCL31D9XYZ
    const codeRegex = /\b([A-Z0-9]{10})\b/;
    // Matches amount with KES, Ksh, or Ksh. prefix
    const amountRegex = /(?:KES|Ksh|Ksh\.)\s*([\d,]+\.?\d*)/i;

    const codeMatch = cleanMessage.match(codeRegex);
    const amountMatch = cleanMessage.match(amountRegex);

    console.log("Matches found - Code:", codeMatch?.[1], "Amount:", amountMatch?.[1]);

    if (!codeMatch) {
      alert('Verification Error: Could not find a valid 10-character M-Pesa transaction code. Please ensure you copied the full message.');
      return;
    }

    const code = codeMatch[1].toUpperCase();
    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : "0";
    const amount = parseFloat(amountStr);

    if (amount < 50 && amount !== 0) {
      alert(`The detected amount (KES ${amount}) is below the required KES 50. Please contact support if this is an error.`);
      return;
    }

    if (api.isMpesaCodeUsed(code)) {
      alert('This M-Pesa code has already been used to activate an account. Please use a fresh transaction.');
      return;
    }

    // Success: Record payment and update subscription
    api.recordPayment(user.id, user.email, Math.max(amount, 50), "0748717099", code);
    api.updateUserSubscription(user.id, 4); // 4 months for one semester
    
    setShowPayment(false);
    setMpesaMessage('');
    if (onRefresh) onRefresh();
    
    alert(`Semester Activated Successfully! Transaction ${code} verified. Enjoy full access to Study Pal resources.`);
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header - Sticky and Responsive */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo size="sm" />
          <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">Study Pal</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isSubscribed && (
            <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-[10px] sm:text-xs font-black tracking-widest uppercase animate-pulse shadow-lg">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Upgrade</span>
            </button>
          )}
          <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 truncate max-w-[120px]">{user.email.split('@')[0]}</p>
              <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-black truncate">{user.year}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400">
              <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation - Bottom bar on mobile, Sidebar on desktop */}
        <nav className="w-full md:w-64 bg-white md:border-r border-slate-200 flex md:flex-col fixed bottom-0 left-0 md:static z-40 h-16 md:h-full justify-around md:justify-start md:pt-8 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] md:shadow-none">
          <NavButton active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} icon={<LayoutGrid />} label="Hub" />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Calendar />} label="Space" />
          <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare />} label="Tutor" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle />} label="Profile" />
          <button onClick={onLogout} className="hidden md:flex items-center gap-3 px-8 py-4 text-red-500 hover:bg-red-50 mt-auto mb-10 mx-4 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 p-4 sm:p-6 lg:p-10 no-scrollbar">
          {activeTab === 'hub' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Resource Hub</h2>
                <div className="mt-5 relative max-w-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search past papers, notes..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-medium text-slate-700 shadow-sm focus:border-indigo-500 transition-colors" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              {!isSubscribed && (
                <div className="bg-indigo-600 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
                  <div>
                    <h3 className="text-xl font-black mb-1">Academic Success Plan</h3>
                    <p className="opacity-80 text-sm">Pay KES 50 to unlock all university resources for 4 months.</p>
                  </div>
                  <button onClick={() => setShowPayment(true)} className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-black shadow-lg hover:bg-slate-50 active:scale-95 transition-all">Get Started</button>
                </div>
              )}

              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredMaterials.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex flex-col hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg ${m.type === 'note' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                        {m.type === 'note' ? <BookOpen size={20} /> : <FileText size={20} />}
                      </div>
                      {!isSubscribed && <Lock className="text-slate-200" size={18} />}
                    </div>
                    <h4 className="font-black text-slate-800 mb-1 line-clamp-2 leading-snug">{m.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-wider">{m.school} • Year {m.year}</p>
                    <button 
                      onClick={() => !isSubscribed ? setShowPayment(true) : alert('Displaying document in protected viewer...')} 
                      className={`w-full mt-auto py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors ${isSubscribed ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {isSubscribed ? 'Open Resource' : 'Unlock Now'}
                    </button>
                  </div>
                ))}
                {filteredMaterials.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl bg-white/50">
                    No resources match your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
               <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Study Space</h2>
                <button onClick={() => setShowTaskModal(true)} className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-90"><PlusCircle /></button>
              </div>
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start gap-4 group hover:border-indigo-100 transition-all">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${task.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}><MessageSquare size={18} /></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-800 truncate">{task.title}</h4>
                        <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <p className="text-slate-500 text-sm mt-1 whitespace-pre-wrap line-clamp-4">{task.content}</p>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 opacity-60">
                    <Calendar size={48} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-bold">Your personal study notebook is empty.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
             <div className="max-w-3xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6">AI Tutor</h2>
                <div className="flex-1 overflow-y-auto mb-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 min-h-[250px] no-scrollbar">
                    {aiResponse ? (
                      <div className="bg-slate-50 p-5 rounded-xl font-medium text-slate-700 leading-relaxed text-sm sm:text-base border border-slate-100">{aiResponse}</div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <MessageSquare size={48} className="mb-4" />
                        <p className="font-bold">Ask me complex university questions!</p>
                      </div>
                    )}
                </div>
                <div className="relative mb-6">
                    <textarea 
                      placeholder="Ask your academic tutor..." 
                      className="w-full pl-5 pr-14 py-4 bg-white border-2 border-slate-100 rounded-xl shadow-lg h-24 font-medium text-slate-700 focus:border-indigo-500 transition-all resize-none text-sm sm:text-base" 
                      value={query} 
                      onChange={e => setQuery(e.target.value)} 
                    />
                    <button 
                      onClick={handleAskAI} 
                      disabled={aiLoading || !query.trim()} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-lg disabled:bg-slate-200 transition-all hover:bg-indigo-700 active:scale-90"
                    >
                        {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-8 gap-3">
                      <div className="overflow-hidden">
                          <h3 className="text-lg sm:text-xl font-black text-slate-800 truncate leading-tight">{user.email}</h3>
                          <p className="text-slate-400 font-bold mt-0.5 text-xs tracking-tight">{user.school} • {user.year}</p>
                      </div>
                      {isSubscribed && <div className="flex-shrink-0 bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">Premium</div>}
                  </div>
                  <div className="space-y-4">
                      <div className="p-5 bg-slate-50 rounded-xl grid grid-cols-2 gap-4">
                          <div className="text-center border-r border-slate-200"><p className="text-xl font-black">{tasks.length}</p><p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Stored Items</p></div>
                          <div className="text-center"><p className="text-xl font-black">{isSubscribed ? 'Active' : 'Free'}</p><p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Plan Status</p></div>
                      </div>
                      <button onClick={onLogout} className="w-full py-3.5 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95">
                          <LogOut size={16} /> Sign Out
                      </button>
                  </div>
              </div>

              <div className="bg-indigo-700 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-black mb-0.5">Mobile App</h4>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Install on Home Screen</p>
                </div>
                <button 
                  onClick={() => alert('Add to Home Screen:\n1. Open your browser settings (⋮ or ⎙)\n2. Tap "Install App" or "Add to Home Screen"\n3. Study Pal is now available in your app list!')}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                >
                  <DownloadCloud size={24} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Payment Modal - Full screen mobile, centered desktop */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200 max-h-[95vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 p-2"><X size={20} /></button>
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center">Semester Activation</h3>
            
            <div className="space-y-6">
              <div className="bg-indigo-50 border-2 border-indigo-100 p-5 rounded-xl text-center">
                <div className="flex justify-center mb-2 text-indigo-600"><Smartphone size={28} /></div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Pay KES 50 to</p>
                <p className="text-xl font-black text-slate-800 tracking-widest select-all">0748 717 099</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">LEVY KIRUI</p>
              </div>

              <form onSubmit={verifyPayment} className="space-y-4">
                <label className="label mb-1 px-1">M-Pesa Confirmation Message</label>
                <textarea 
                  required
                  placeholder="Paste the message from M-Pesa here..." 
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 font-medium text-xs text-slate-600 h-28 resize-none shadow-inner"
                  value={mpesaMessage}
                  onChange={e => setMpesaMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-indigo-700"
                >
                  <ClipboardCheck size={20} /> VERIFY & UNLOCK
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 font-medium">Automatic verification usually takes 1-2 seconds after pasting.</p>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-6 text-slate-800">New Entry</h3>
            <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setTaskType('note')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black border-2 transition-all ${taskType === 'note' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>NOTES</button>
                  <button onClick={() => setTaskType('timetable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black border-2 transition-all ${taskType === 'timetable' ? 'bg-green-50 border-green-500 text-green-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>SCHEDULE</button>
                </div>
                <input required placeholder="Entry Title" className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                <textarea required placeholder="Write details here..." className="input h-32 resize-none" value={taskContent} onChange={e => setTaskContent(e.target.value)} />
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowTaskModal(false)} className="flex-1 text-slate-400 text-[10px] font-black uppercase tracking-widest py-3">Cancel</button>
                    <button onClick={handleSaveTask} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">SAVE ENTRY</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 md:px-8 py-2 md:py-4 transition-all relative ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-indigo-50' : ''}`}>{React.cloneElement(icon, { size: 18 })}</div>
    <span className={`text-[8px] md:text-sm font-black uppercase md:capitalize tracking-wider md:tracking-normal ${active ? 'opacity-100' : 'opacity-60 md:opacity-100'}`}>{label}</span>
    {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 md:hidden" />}
  </button>
);

export default StudentDashboard;