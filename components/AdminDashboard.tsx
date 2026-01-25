
import React, { useState, useEffect, useRef } from 'react';
import { User, StudyMaterial, University, PaymentRecord } from '../types';
import { api } from '../services/api';
import Logo from './Logo';
import { 
  Users, 
  LogOut, 
  Trash2, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CheckCircle,
  PlusCircle,
  X,
  UserPlus,
  School,
  CreditCard,
  Hash,
  Menu,
  ChevronRight,
  Upload,
  FileCode,
  FileImage,
  FileArchive,
  FileBadge
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'materials' | 'universities' | 'payments'>('materials');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUniModal, setShowUniModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // New Material State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'note' | 'past-paper'>('note');
  const [newSchool, setNewSchool] = useState('');
  const [newYear, setNewYear] = useState('First Year');
  const [selectedFile, setSelectedFile] = useState<{data: string, name: string, ext: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [uniName, setUniName] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMaterials(api.getMaterials());
    setUsers(api.getUsers());
    setUniversities(api.getUniversities());
    setPayments(api.getPayments());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        setSelectedFile({
          data: reader.result as string,
          name: file.name,
          ext: ext
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    api.addMaterial({
      title: newTitle,
      type: newType,
      school: newSchool,
      year: newYear,
      description: `Academic resource for ${newSchool} students`,
      fileUrl: selectedFile.data,
      fileName: selectedFile.name,
      fileExtension: selectedFile.ext,
      uploadedBy: user.email
    });

    setNewTitle('');
    setSelectedFile(null);
    setShowAddModal(false);
    refreshData();
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPass) return;
    api.addAdmin(adminEmail, adminPass);
    setAdminEmail('');
    setAdminPass('');
    setShowAdminModal(false);
    refreshData();
  };

  const handleAddUni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniName) return;
    api.addUniversity(uniName);
    setUniName('');
    setShowUniModal(false);
    refreshData();
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Delete this material?')) {
      api.deleteMaterial(id);
      refreshData();
    }
  };

  const handleDeleteUni = (id: string) => {
    if (confirm('Remove this university?')) {
        api.deleteUniversity(id);
        refreshData();
    }
  };

  const grantAccess = (userId: string) => {
    api.updateUserSubscription(userId, 4);
    refreshData();
  };

  const promoteUser = (userId: string) => {
    if (confirm('Promote this user to Admin?')) {
        api.promoteToAdmin(userId);
        refreshData();
    }
  };

  const getFormatIcon = (ext: string) => {
    switch(ext) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'doc':
      case 'docx': return <FileText className="text-blue-500" />;
      case 'jpg':
      case 'png':
      case 'jpeg': return <FileImage className="text-emerald-500" />;
      case 'zip':
      case 'rar': return <FileArchive className="text-amber-600" />;
      case 'txt': return <FileText className="text-slate-500" />;
      default: return <FileCode className="text-indigo-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col p-6 shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3 py-4">
                <Logo size="sm" />
                <div>
                    <span className="text-xl font-bold text-white tracking-tight block">Study Pal</span>
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Console</span>
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500"><X /></button>
        </div>

        <nav className="flex-1 space-y-1.5">
          <SidebarLink active={activeTab === 'materials'} onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }} icon={<FileText />} label="Resources" />
          <SidebarLink active={activeTab === 'universities'} onClick={() => { setActiveTab('universities'); setIsSidebarOpen(false); }} icon={<School />} label="Universities" />
          <SidebarLink active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} icon={<Users />} label="Member Directory" />
          <SidebarLink active={activeTab === 'payments'} onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }} icon={<CreditCard />} label="Transactions" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
                <LogOut className="w-4 h-4" /> Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-600">
                <Menu />
            </button>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight capitalize">{activeTab}</h2>
              <p className="text-slate-400 text-sm font-medium mt-0.5">Admin Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {activeTab === 'users' && <button onClick={() => setShowAdminModal(true)} className="btn-primary flex-1 md:flex-none"><UserPlus size={18} /> Add Admin</button>}
            {activeTab === 'materials' && <button onClick={() => setShowAddModal(true)} className="btn-primary flex-1 md:flex-none"><Upload size={18} /> Upload Resource</button>}
            {activeTab === 'universities' && <button onClick={() => setShowUniModal(true)} className="btn-primary flex-1 md:flex-none"><PlusCircle size={18} /> New Uni</button>}
          </div>
        </header>

        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map(m => (
              <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col relative group">
                <button onClick={() => handleDeleteMaterial(m.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${m.type === 'note' ? 'bg-indigo-50' : 'bg-purple-50'}`}>
                    {getFormatIcon(m.fileExtension)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-slate-800 line-clamp-1 pr-6">{m.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.school}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px]">{m.fileExtension}</span>
                    <span>Year {m.year}</span>
                  </div>
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {materials.length === 0 && <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">No resources found.</div>}
          </div>
        )}

        {/* ... Universities, Users, Payments tables remain the same ... */}
        {activeTab === 'universities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {universities.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><School size={20} /></div>
                            <h3 className="font-bold text-slate-800">{u.name}</h3>
                        </div>
                        <button onClick={() => handleDeleteUni(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Scholar</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Institution</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 truncate max-w-[150px]">{u.email}</div>
                            <div className="text-[10px] text-indigo-500 font-bold uppercase">{u.role}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{u.school}</td>
                        <td className="px-6 py-4">
                            {u.role === 'admin' ? <Badge color="indigo" label="Admin" /> : 
                             u.subscriptionExpiry ? <Badge color="green" label="Active" /> : 
                             <Badge color="amber" label="Unpaid" />}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                            {u.role === 'student' && (
                                <div className="flex justify-end gap-2">
                                    {!u.subscriptionExpiry && <button onClick={() => grantAccess(u.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black">ACTIVATE</button>}
                                    <button onClick={() => promoteUser(u.id)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">ADMIN</button>
                                </div>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Email</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Code</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Amount</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 font-bold text-slate-800">{p.userEmail}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.mpesaCode}</td>
                                    <td className="px-6 py-4 font-black">KES {p.amount}</td>
                                    <td className="px-6 py-4 text-slate-400 text-[10px]">{new Date(p.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <Modal title="Upload Resource" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="label">Resource Title</label>
                  <input required className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Unit 1 Introduction" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type</label>
                      <select className="input" value={newType} onChange={e => setNewType(e.target.value as any)}>
                        <option value="note">Notes</option>
                        <option value="past-paper">Past Paper</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Year</label>
                      <select className="input" value={newYear} onChange={e => setNewYear(e.target.value)}>
                        <option>First Year</option>
                        <option>Second Year</option>
                        <option>Third Year</option>
                        <option>Fourth Year</option>
                      </select>
                    </div>
                </div>

                <div>
                  <label className="label">University</label>
                  <select required className="input" value={newSchool} onChange={e => setNewSchool(e.target.value)}>
                    <option value="">Select University...</option>
                    {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">File (PDF, DOCX, Images, etc.)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 transition-all bg-slate-50"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.txt"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center text-center">
                        <CheckCircle className="text-green-500 w-8 h-8" />
                        <span className="text-xs font-bold text-slate-700 mt-2 truncate max-w-[200px]">{selectedFile.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black">{selectedFile.ext}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-300 w-8 h-8" />
                        <span className="text-xs font-bold text-slate-500">Click to browse files</span>
                        <span className="text-[10px] text-slate-300 font-medium">PDF, Word, Images up to 10MB</span>
                      </>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full btn-submit flex items-center justify-center gap-2">
                  <Upload size={18} /> Publish Resource
                </button>
            </form>
          </Modal>
        )}

        {showAdminModal && (
          <Modal title="New Administrator" onClose={() => setShowAdminModal(false)}>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <input type="email" required placeholder="Email Address" className="input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                <input type="password" required placeholder="Password" className="input" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                <button type="submit" className="w-full btn-submit">Grant Admin Access</button>
              </form>
          </Modal>
        )}

        {showUniModal && (
          <Modal title="Register University" onClose={() => setShowUniModal(false)}>
              <form onSubmit={handleAddUni} className="space-y-4">
                <input required placeholder="Name of Institution" className="input" value={uniName} onChange={e => setUniName(e.target.value)} />
                <button type="submit" className="w-full btn-submit">Add University</button>
              </form>
          </Modal>
        )}
      </main>
    </div>
  );
};

const SidebarLink = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
        {React.cloneElement(icon, { size: 18 })} {label}
    </button>
);

const Badge = ({ color, label }: any) => (
    <div className={`bg-${color}-50 text-${color}-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-${color}-100 w-fit`}>
        {label}
    </div>
);

const Modal = ({ title, onClose, children }: any) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in duration-200">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X /></button>
            <h3 className="text-xl font-black mb-6 text-slate-800">{title}</h3>
            {children}
        </div>
    </div>
);

export default AdminDashboard;
