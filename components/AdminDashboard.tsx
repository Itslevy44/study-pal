
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { User, StudyMaterial, University, PaymentRecord } from '../types';
import { api } from '../services/api';
import Logo from './Logo';
import { 
  Users, 
  LogOut, 
  Trash2, 
  BookOpen, 
  FileText, 
  CheckCircle,
  PlusCircle,
  X,
  UserPlus,
  School,
  CreditCard,
  Menu,
  Upload,
  FileCode,
  FileImage,
  FileArchive,
  Edit3,
  Save,
  Loader2
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
  const [loading, setLoading] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUniModal, setShowUniModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
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
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    const [m, u, unis, p] = await Promise.all([
      api.getMaterials(),
      api.getUsers(),
      api.getUniversities(),
      api.getPayments()
    ]);
    setMaterials(m);
    setUsers(u);
    setUniversities(unis);
    setPayments(p);
    setLoading(false);
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

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert("Select a file.");
    
    setLoading(true);
    await api.addMaterial({
      title: newTitle,
      type: newType,
      school: newSchool,
      year: newYear,
      description: `Academic resource for ${newSchool}`,
      fileUrl: selectedFile.data,
      fileName: selectedFile.name,
      fileExtension: selectedFile.ext,
      uploadedBy: user.email
    });

    setNewTitle('');
    setSelectedFile(null);
    setShowAddModal(false);
    await refreshData();
  };

  const handleEditInit = (m: StudyMaterial) => {
    setCurrentMaterialId(m.id);
    setNewTitle(m.title);
    setNewType(m.type);
    setNewSchool(m.school);
    setNewYear(m.year);
    setShowEditModal(true);
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterialId) return;
    
    setLoading(true);
    const updateData: Partial<StudyMaterial> = {
      title: newTitle, type: newType, school: newSchool, year: newYear
    };
    if (selectedFile) {
      updateData.fileUrl = selectedFile.data;
      updateData.fileName = selectedFile.name;
      updateData.fileExtension = selectedFile.ext;
    }

    await api.updateMaterial(currentMaterialId, updateData);
    setShowEditModal(false);
    await refreshData();
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Delete material?')) {
      setLoading(true);
      await api.deleteMaterial(id);
      await refreshData();
    }
  };

  const grantAccess = async (userId: string) => {
    setLoading(true);
    await api.updateUserSubscription(userId, 4);
    await refreshData();
  };

  const promoteUser = async (userId: string) => {
    if (confirm('Make Admin?')) {
      setLoading(true);
      await api.promoteToAdmin(userId);
      await refreshData();
    }
  };

  const handleDeleteUniversity = async (uniId: string) => {
    if (confirm('Delete this university?')) {
      setLoading(true);
      await api.deleteUniversity(uniId);
      await refreshData();
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
      default: return <FileCode className="text-indigo-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col p-6 shadow-2xl transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3 py-4">
                <Logo size="sm" />
                <div><span className="text-xl font-bold text-white block">Study Pal</span><span className="text-[9px] text-indigo-400 font-black uppercase bg-indigo-500/10 px-2 py-0.5 rounded">Console</span></div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500"><X /></button>
        </div>

        <nav className="flex-1 space-y-1.5">
          <SidebarLink active={activeTab === 'materials'} onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }} icon={<FileText />} label="Resources" />
          <SidebarLink active={activeTab === 'universities'} onClick={() => { setActiveTab('universities'); setIsSidebarOpen(false); }} icon={<School />} label="Universities" />
          <SidebarLink active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} icon={<Users />} label="Member Directory" />
          <SidebarLink active={activeTab === 'payments'} onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }} icon={<CreditCard />} label="Transactions" />
        </nav>
        <button onClick={onLogout} className="mt-auto w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"><LogOut size={16} /> Logout</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Menu /></button>
            <div><h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight capitalize">{activeTab}</h2><p className="text-slate-400 text-sm">Database: Supabase Active</p></div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {activeTab === 'materials' && <button onClick={() => setShowAddModal(true)} className="btn-primary flex-1 md:flex-none"><Upload size={18} /> Upload Resource</button>}
            {activeTab === 'universities' && <button onClick={async () => { const n = prompt('Uni Name:'); if(n){ await api.addUniversity(n); refreshData(); } }} className="btn-primary flex-1 md:flex-none"><PlusCircle size={18} /> New Uni</button>}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="font-bold">Syncing with database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'materials' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col relative group">
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditInit(m)} className="p-2 text-slate-300 hover:text-indigo-600 bg-white rounded-lg shadow-sm border border-slate-100"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteMaterial(m.id)} className="p-2 text-slate-300 hover:text-red-500 bg-white rounded-lg shadow-sm border border-slate-100"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${m.type === 'note' ? 'bg-indigo-50' : 'bg-purple-50'}`}>{getFormatIcon(m.fileExtension)}</div>
                      <div className="flex-1 overflow-hidden"><h3 className="font-bold text-slate-800 line-clamp-1">{m.title}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{m.school}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest"><th className="px-6 py-4">User</th><th className="px-6 py-4">School</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 font-bold">{u.email}</td>
                        <td className="px-6 py-4">{u.school}</td>
                        <td className="px-6 py-4">{u.subscriptionExpiry ? <span className="text-green-600 font-bold">Premium</span> : 'Basic'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => grantAccess(u.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded text-[10px] font-black">GRANT</button>
                            {u.role !== 'admin' && <button onClick={() => promoteUser(u.id)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">ADMIN</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'universities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {universities.map(uni => (
                  <div key={uni.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{uni.name}</h3>
                        <p className="text-sm text-slate-500">{uni.location || 'Location TBD'}</p>
                      </div>
                      <button onClick={() => handleDeleteUniversity(uni.id)} className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {universities.length === 0 && <p className="text-slate-400">No universities yet</p>}
              </div>
            )}
          </>
        )}

        {showAddModal && (
          <Modal title="Upload Resource" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddMaterial} className="space-y-4">
                <input required className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" />
                <select className="input" value={newType} onChange={e => setNewType(e.target.value as any)}><option value="note">Notes</option><option value="past-paper">Past Paper</option></select>
                <select required className="input" value={newSchool} onChange={e => setNewSchool(e.target.value)}><option value="">University...</option>{universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed p-6 rounded-xl flex flex-col items-center cursor-pointer bg-slate-50">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  {selectedFile ? <span className="text-xs font-bold">{selectedFile.name}</span> : <Upload size={24} className="text-slate-300" />}
                </div>
                <button type="submit" disabled={loading} className="btn-submit">{loading ? 'Uploading...' : 'Publish'}</button>
            </form>
          </Modal>
        )}

        {showEditModal && (
          <Modal title="Edit Resource" onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
                <input required className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <select className="input" value={newType} onChange={e => setNewType(e.target.value as any)}><option value="note">Notes</option><option value="past-paper">Past Paper</option></select>
                <select required className="input" value={newSchool} onChange={e => setNewSchool(e.target.value)}>{universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
                <button type="submit" disabled={loading} className="btn-submit">{loading ? 'Updating...' : 'Save Changes'}</button>
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

const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl"><button onClick={onClose} className="absolute top-6 right-6 text-slate-300"><X /></button><h3 className="text-xl font-black mb-6 text-slate-800">{title}</h3>{children}</div></div>
);

export default AdminDashboard;
