
import React, { useState, useEffect } from 'react';
import { User, StudyMaterial, University, PaymentRecord } from '../types';
import { api } from '../services/api';
import Logo from './Logo';
import { 
  Users, 
  FilePlus, 
  LogOut, 
  Trash2, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CheckCircle,
  PlusCircle,
  X,
  UserPlus,
  ShieldAlert,
  School,
  CreditCard,
  Search,
  Calendar,
  Hash
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
  
  // New Material State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'note' | 'past-paper'>('note');
  const [newSchool, setNewSchool] = useState('');
  const [newYear, setNewYear] = useState('First Year');

  // New Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // New University State
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

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    api.addMaterial({
      title: newTitle,
      type: newType,
      school: newSchool,
      year: newYear,
      description: `Academic resource for ${newSchool} students`,
      fileUrl: '#',
      uploadedBy: user.email
    });
    setNewTitle('');
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
    if (confirm('Promote this user to Admin? They will have full system access.')) {
        api.promoteToAdmin(userId);
        refreshData();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col p-6 shadow-2xl">
        <div className="flex items-center gap-3 py-6 mb-8">
          <Logo size="sm" />
          <div>
            <span className="text-xl font-bold text-white tracking-tight block">Study Pal</span>
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} icon={<FileText />} label="Study Materials" />
          <SidebarLink active={activeTab === 'universities'} onClick={() => setActiveTab('universities')} icon={<School />} label="Universities" />
          <SidebarLink active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users />} label="Member Directory" />
          <SidebarLink active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<CreditCard />} label="Payment History" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="mb-6 p-4 bg-slate-800/50 rounded-2xl">
                <p className="text-xs text-slate-500 mb-1">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user.email}</p>
            </div>
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
            >
                <LogOut className="w-4 h-4" />
                Logout System
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-500 text-lg mt-1">
              {activeTab === 'materials' && `Overseeing ${materials.length} shared academic resources`}
              {activeTab === 'universities' && `Managing ${universities.length} registered institutions`}
              {activeTab === 'users' && `Managing ${users.length} registered users and administrators`}
              {activeTab === 'payments' && `Monitoring ${payments.length} successful transactions`}
            </p>
          </div>
          
          <div className="flex gap-4">
            {activeTab === 'users' && (
               <button onClick={() => setShowAdminModal(true)} className="btn-primary">
                 <UserPlus className="w-5 h-5" /> New Admin
               </button>
            )}
            {activeTab === 'materials' && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <PlusCircle className="w-5 h-5" /> Upload Resource
              </button>
            )}
            {activeTab === 'universities' && (
              <button onClick={() => setShowUniModal(true)} className="btn-primary">
                <PlusCircle className="w-5 h-5" /> Add University
              </button>
            )}
          </div>
        </header>

        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {materials.map(m => (
              <div key={m.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDeleteMaterial(m.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-2xl shadow-sm ${m.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {m.type === 'note' ? <BookOpen className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${m.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {m.type === 'note' ? 'Lecture Note' : 'Exam Paper'}
                    </span>
                    <h3 className="font-bold text-xl text-slate-800 mt-2 line-clamp-1">{m.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium">{m.school}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{m.year}</p>
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Added {new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {materials.length === 0 && <EmptyState icon={<FilePlus />} text="No resources yet" description="Start populating the library." />}
          </div>
        )}

        {activeTab === 'universities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {universities.map(u => (
                    <div key={u.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <School className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-xl text-slate-800">{u.name}</h3>
                        </div>
                        <button onClick={() => handleDeleteUni(u.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                {universities.length === 0 && <EmptyState icon={<School />} text="No Universities" description="Add universities so students can register." />}
            </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Identity</th>
                    <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Affiliation</th>
                    <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                    <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {u.email[0].toUpperCase()}
                                </div>
                                <div className="font-bold text-slate-800">{u.email}</div>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-slate-600 font-medium">{u.school}</td>
                        <td className="px-8 py-6">
                            {u.role === 'admin' ? (
                                <Badge color="indigo" label="Admin" icon={<ShieldCheck className="w-3 h-3" />} />
                            ) : u.subscriptionExpiry ? (
                                <Badge color="green" label="Active" icon={<CheckCircle className="w-3 h-3" />} />
                            ) : (
                                <Badge color="amber" label="Unpaid" />
                            )}
                        </td>
                        <td className="px-8 py-6 text-right">
                            {u.role === 'student' && (
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    {!u.subscriptionExpiry && (
                                        <button onClick={() => grantAccess(u.id)} className="text-xs px-4 py-2 bg-green-600 text-white rounded-xl font-bold">Approve</button>
                                    )}
                                    <button onClick={() => promoteUser(u.id)} className="text-xs px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">Promote</button>
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
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Student Email</th>
                            <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">M-Pesa Code</th>
                            <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Amount</th>
                            <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="px-8 py-6 font-bold text-slate-800">{p.userEmail}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-slate-500 font-mono font-bold">
                                        <Hash className="w-3 h-3" />
                                        {p.mpesaCode}
                                    </div>
                                </td>
                                <td className="px-8 py-6 font-black text-indigo-600">KES {p.amount}</td>
                                <td className="px-8 py-6 text-slate-400 text-xs font-bold">{new Date(p.createdAt).toLocaleString()}</td>
                                <td className="px-8 py-6">
                                    <Badge color="green" label="Success" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payments.length === 0 && <div className="p-20 text-center text-slate-400 font-bold">No payments found in history.</div>}
            </div>
        )}

        {/* Modal: Add Material */}
        {showAddModal && (
          <Modal title="Upload Study Material" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddMaterial} className="space-y-6">
                <div>
                  <label className="label">Title</label>
                  <input required className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Physics Revision 2024" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Category</label>
                        <select className="input" value={newType} onChange={e => setNewType(e.target.value as any)}>
                            <option value="note">Study Note</option>
                            <option value="past-paper">Past Paper</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Academic Year</label>
                        <select className="input" value={newYear} onChange={e => setNewYear(e.target.value)}>
                            <option>First Year</option><option>Second Year</option>
                            <option>Third Year</option><option>Fourth Year</option>
                        </select>
                    </div>
                </div>
                <div>
                  <label className="label">Select University</label>
                  <select required className="input" value={newSchool} onChange={e => setNewSchool(e.target.value)}>
                    <option value="">Select a University...</option>
                    {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full btn-submit">Publish to Library</button>
              </form>
          </Modal>
        )}

        {/* Modal: Add Admin */}
        {showAdminModal && (
          <Modal title="Create Admin Account" onClose={() => setShowAdminModal(false)}>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <input type="email" required placeholder="Email Address" className="input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                <input type="password" required placeholder="Temporary Password" className="input" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                <button type="submit" className="w-full btn-submit bg-slate-900">Create Access</button>
              </form>
          </Modal>
        )}

        {/* Modal: Add University */}
        {showUniModal && (
          <Modal title="Register New Institution" onClose={() => setShowUniModal(false)}>
              <form onSubmit={handleAddUni} className="space-y-4">
                <input required placeholder="University Name (e.g. Kenyatta University)" className="input" value={uniName} onChange={e => setUniName(e.target.value)} />
                <button type="submit" className="w-full btn-submit">Save University</button>
              </form>
          </Modal>
        )}
      </main>
    </div>
  );
};

// Internal Components
const SidebarLink = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
        {React.cloneElement(icon, { className: "w-5 h-5" })} {label}
    </button>
);

const EmptyState = ({ icon, text, description }: any) => (
    <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
        <div className="text-slate-200 mx-auto mb-6"> {React.cloneElement(icon, { size: 80, className: "mx-auto" })}</div>
        <h3 className="text-2xl font-bold text-slate-800">{text}</h3>
        <p className="text-slate-500 max-w-xs mx-auto mt-2">{description}</p>
    </div>
);

const Badge = ({ color, label, icon }: any) => (
    <div className={`flex items-center gap-1.5 bg-${color}-50 text-${color}-600 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest w-fit border border-${color}-100`}>
        {icon} {label}
    </div>
);

const Modal = ({ title, onClose, children }: any) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-8 h-8" /></button>
            <h3 className="text-3xl font-black mb-8 text-slate-800">{title}</h3>
            {children}
        </div>
    </div>
);

export default AdminDashboard;
