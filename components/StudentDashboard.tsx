
import React, { useState, useEffect } from 'react';
import { User, StudyMaterial, TaskItem } from '../types';
import { api } from '../services/api';
import { getStudyHelp } from '../services/geminiService';
import Logo from './Logo';
import { 
  BookOpen, 
  FileText, 
  PlusCircle, 
  Lock, 
  Crown, 
  Search, 
  Bell, 
  UserCircle,
  LogOut,
  Calendar,
  MessageSquare,
  Send,
  Download,
  Trash2,
  X,
  ShieldCheck,
  Smartphone,
  ClipboardCheck,
  DownloadCloud
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
  
  // AI State
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Task State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [taskType, setTaskType] = useState<'note' | 'timetable'>('note');

  // Subscription State
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
    api.deleteTask(id);
    refreshData();
  };

  const verifyPayment = (e: React.MouseEvent) => {
    // Prevent any default behavior that might interfere
    e.preventDefault();
    e.stopPropagation();

    console.log("Verifying payment message:", mpesaMessage);

    if (!mpesaMessage || mpesaMessage.trim().length < 20) {
      return alert('Please paste the complete M-Pesa confirmation message.');
    }

    // Robust Regex to handle variations in M-Pesa messages
    // Pattern 1: Starts with code, then Confirmed.
    // Pattern 2: Anywhere in the string find 10 alphanumeric chars followed by confirmed or amount
    const cleanMessage = mpesaMessage.trim();
    const codeRegex = /\b([A-Z0-9]{10})\b/i;
    const amountRegex = /(?:KES|Ksh)\s*([\d,]+(?:\.\d{2})?)/i;

    const codeMatch = cleanMessage.match(codeRegex);
    const amountMatch = cleanMessage.match(amountRegex);

    if (!codeMatch) {
      return alert('Verification Error: No valid M-Pesa transaction code found. Please ensure you copied the full message correctly.');
    }

    const code = codeMatch[1].toUpperCase();
    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : "0";
    const amount = parseFloat(amountStr);

    console.log("Extracted Code:", code, "Extracted Amount:", amount);

    if (amount < 50 && amount !== 0) { // Some messages might hide amount but have code
      return alert(`Detected amount: KES ${amount}. A minimum of KES 50 is required for full semester access.`);
    }

    if (api.isMpesaCodeUsed(code)) {
      return alert('This M-Pesa code has already been used to activate an account.');
    }

    // SUCCESS: Record and Activate
    try {
        api.recordPayment(user.id, user.email, Math.max(amount, 50), 'Direct Transfer', code);
        api.updateUserSubscription(user.id, 4);
        
        setShowPayment(false);
        setMpesaMessage('');
        
        if (onRefresh) onRefresh();
        
        alert(`Academic Hub Unlocked! Transaction ${code} verified successfully.`);
    } catch (err) {
        console.error("Activation failed", err);
        alert("An error occurred during activation. Please try again.");
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Study Pal</h1>
        </div>
        <div className="flex items-center gap-6">
          {!isSubscribed && (
            <button onClick={() => setShowPayment(true)} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase animate-pulse shadow-lg">
              <Crown className="w-4 h-4" /> Upgrade Plan
            </button>
          )}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800">{user.email.split('@')[0]}</p>
              <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-black">{user.year}</p>
            </div>
            <div className="w-11 h-11 bg-slate-100 rounded-2xl border-2 border-slate-50 flex items-center justify-center text-slate-400">
              <UserCircle className="w-7 h-7" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-full md:w-72 bg-white md:border-r border-slate-200 flex md:flex-col fixed bottom-0 left-0 md:static z-20 h-20 md:h-full justify-around md:justify-start md:pt-12 shadow-2xl md:shadow-none">
          <NavButton active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} icon={<BookOpen />} label="Resource Hub" />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Calendar />} label="Study Space" />
          <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare />} label="AI Tutor" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle />} label="Settings" />
          <button onClick={onLogout} className="hidden md:flex items-center gap-3 px-8 py-4 text-red-500 hover:bg-red-50 mt-auto mb-24 mx-6 rounded-2xl transition-all font-bold">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </nav>

        <main className="flex-1 overflow-y-auto pb-32 md:pb-12 p-8 md:p-14">
          {activeTab === 'hub' && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-14">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Resource Hub</h2>
                <div className="mt-10 relative max-w-2xl">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                  <input type="text" placeholder="Search resources..." className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-medium text-slate-700" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              {!isSubscribed && (
                <div className="bg-indigo-700 rounded-[2.5rem] p-10 text-white mb-14 shadow-2xl flex items-center justify-between gap-10">
                  <div>
                    <h3 className="text-3xl font-black mb-3">Academic Excellence Awaits</h3>
                    <p className="opacity-80 max-w-md">Unlock all past papers for KES 50.</p>
                  </div>
                  <button onClick={() => setShowPayment(true)} className="bg-white text-indigo-700 px-10 py-5 rounded-[1.25rem] font-black shadow-xl">Unlock Now</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMaterials.map(m => (
                  <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:shadow-2xl transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-5 rounded-2xl ${m.type === 'note' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}><BookOpen /></div>
                      {!isSubscribed && <Lock className="text-slate-200" />}
                    </div>
                    <h4 className="font-black text-xl text-slate-800 mb-3">{m.title}</h4>
                    <p className="text-sm font-bold text-slate-400 mb-8">{m.school} • Year {m.year}</p>
                    <button onClick={() => !isSubscribed ? setShowPayment(true) : alert('Viewing...')} className={`w-full mt-auto py-5 rounded-[1.25rem] font-black uppercase text-sm ${isSubscribed ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
                      {isSubscribed ? 'View Document' : 'Unlock Access'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-4xl mx-auto">
               <div className="flex justify-between items-end mb-14">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Study Space</h2>
                <button onClick={() => setShowTaskModal(true)} className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-2xl"><PlusCircle /></button>
              </div>
              <div className="space-y-6">
                {tasks.map(task => (
                  <div key={task.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start gap-6 group">
                    <div className={`p-4 rounded-2xl ${task.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}><MessageSquare /></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-black text-xl text-slate-800">{task.title}</h4>
                        <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <p className="text-slate-500 font-medium mt-3 whitespace-pre-wrap">{task.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
             <div className="max-w-4xl mx-auto h-full flex flex-col">
                <h2 className="text-4xl font-black text-slate-800 mb-10">AI Tutor</h2>
                <div className="flex-1 overflow-y-auto mb-10 bg-white rounded-[2.5rem] p-10 shadow-sm min-h-[400px]">
                    {aiResponse && <div className="bg-slate-50 p-8 rounded-[2rem] font-medium text-lg leading-relaxed">{aiResponse}</div>}
                </div>
                <div className="relative">
                    <textarea placeholder="Type your academic question..." className="w-full pl-8 pr-20 py-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl h-24 font-bold text-slate-700" value={query} onChange={e => setQuery(e.target.value)} />
                    <button onClick={handleAskAI} disabled={aiLoading || !query} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-2xl">
                        {aiLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Send />}
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white rounded-[3rem] p-12 shadow-sm">
                  <div className="flex justify-between items-start mb-12">
                      <div>
                          <h3 className="text-3xl font-black text-slate-800">{user.email}</h3>
                          <p className="text-slate-400 font-bold mt-1 text-lg">{user.school} • {user.year}</p>
                      </div>
                      {isSubscribed && <Badge color="green" label="Premium" />}
                  </div>
                  <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-[2rem] text-center grid grid-cols-2 gap-8">
                          <div><p className="text-3xl font-black">{tasks.length}</p><p className="text-xs uppercase font-bold text-slate-400">Tasks</p></div>
                          <div><p className="text-3xl font-black">{isSubscribed ? 'Active' : 'Unpaid'}</p><p className="text-xs uppercase font-bold text-slate-400">Account</p></div>
                      </div>
                      <button onClick={onLogout} className="w-full py-6 bg-red-50 text-red-600 font-black text-lg rounded-[1.5rem] flex items-center justify-center gap-3">
                          <LogOut /> Sign Out
                      </button>
                  </div>
              </div>

              {/* Install Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-10 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-black mb-1">Study Pal for Android</h4>
                  <p className="text-sm opacity-80">Install the app on your home screen for quick access.</p>
                </div>
                <button 
                  onClick={() => alert('Tap your browser menu (3 dots) and select "Install app" to add Study Pal to your home screen.')}
                  className="bg-white text-indigo-600 p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <DownloadCloud className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-800 mb-6 text-center">Activate Semester</h3>
            
            <div className="space-y-6">
              <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2rem] text-center">
                <div className="flex justify-center mb-4">
                  <Smartphone className="w-10 h-10 text-indigo-600" />
                </div>
                <p className="text-xs font-black uppercase text-slate-400 mb-2">Send KES 50 to</p>
                <p className="text-3xl font-black text-slate-800 tracking-widest">0748 717 099</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">LEVY KIRUI</p>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-4">Paste M-Pesa Confirmation Message</label>
                <textarea 
                  placeholder="Paste the full M-Pesa message here..." 
                  className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 outline-none focus:border-indigo-500 font-medium text-sm text-slate-600 h-32 resize-none"
                  value={mpesaMessage}
                  onChange={e => setMpesaMessage(e.target.value)}
                />
              </div>

              <button 
                onClick={verifyPayment}
                className="w-full py-5 bg-indigo-600 text-white font-black text-lg rounded-[1.5rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <ClipboardCheck className="w-6 h-6" />
                VERIFY & ACTIVATE
              </button>

              <button 
                onClick={() => setShowPayment(false)} 
                className="w-full text-slate-400 font-bold text-sm"
              >
                Maybe Later
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-3 text-[10px] text-slate-300 font-black uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4" />
               Manual Message Verification
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-lg shadow-2xl">
            <h3 className="text-3xl font-black mb-8 text-slate-800">Add Entry</h3>
            <div className="space-y-6">
                <div className="flex gap-4">
                  <button onClick={() => setTaskType('note')} className={`flex-1 py-4 rounded-xl font-black border-2 ${taskType === 'note' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-100'}`}>Note</button>
                  <button onClick={() => setTaskType('timetable')} className={`flex-1 py-4 rounded-xl font-black border-2 ${taskType === 'timetable' ? 'bg-green-50 border-green-500 text-green-600' : 'border-slate-100'}`}>Schedule</button>
                </div>
                <input placeholder="Title..." className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                <textarea placeholder="Details..." className="w-full px-6 py-4 bg-slate-50 rounded-xl h-40" value={taskContent} onChange={e => setTaskContent(e.target.value)} />
                <div className="flex gap-4">
                    <button onClick={() => setShowTaskModal(false)} className="flex-1 text-slate-400 font-bold">Cancel</button>
                    <button onClick={handleSaveTask} className="flex-2 py-5 bg-indigo-600 text-white rounded-xl font-black">Save Entry</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-5 px-8 py-5 transition-all relative ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
    <div className={`p-3 rounded-2xl ${active ? 'bg-indigo-50' : ''}`}>{React.cloneElement(icon, { size: 24 })}</div>
    <span className={`text-[10px] md:text-base font-black ${active ? 'opacity-100' : 'opacity-0 md:opacity-70'}`}>{label}</span>
  </button>
);

const Badge = ({ color, label }: any) => (
    <div className={`bg-${color}-50 text-${color}-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-${color}-100`}>
        {label}
    </div>
);

export default StudentDashboard;
