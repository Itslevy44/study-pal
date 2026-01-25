import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { User, StudyMaterial, University } from '../types';
import { materialsApi, usersApi, universitiesApi } from '../services/supabaseApi';
import * as storageService from '../services/storageService';
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
  Menu,
  Upload,
  Edit3,
  AlertCircle,
  Loader
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'users' | 'universities'>('materials');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUniModal, setShowUniModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Material State
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'note' | 'past-paper' | 'lecture' | 'assignment'>('note');
  const [newSchool, setNewSchool] = useState('');
  const [newYear, setNewYear] = useState('First Year');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uniName, setUniName] = useState('');
  const [uniLocation, setUniLocation] = useState('');

  useEffect(() => {
    storageService.initializeStorage();
    refreshData();
  }, []);

  const refreshData = async () => {
    const mats = await materialsApi.getMaterials();
    const usrs = await usersApi.getUsers();
    const unis = await universitiesApi.getUniversities();
    setMaterials(mats);
    setUsers(usrs);
    setUniversities(unis);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newTitle || !newSchool) {
      setUploadError('Please fill in all fields and select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      // Simulate progress
      setUploadProgress(30);
      
      // Upload file to Supabase Storage
      const result = await materialsApi.uploadMaterialWithFile(
        selectedFile,
        {
          title: newTitle,
          type: newType,
          school: newSchool,
          year: newYear,
          description: newDescription,
          uploadedBy: user.id || user.email
        }
      );

      setUploadProgress(90);

      if (result) {
        setUploadProgress(100);
        setNewTitle('');
        setNewDescription('');
        setSelectedFile(null);
        setShowAddModal(false);
        
        setTimeout(() => {
          setUploadProgress(0);
          refreshData();
        }, 500);
      } else {
        setUploadError('Failed to upload material. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditInit = (m: StudyMaterial) => {
    setCurrentMaterialId(m.id);
    setNewTitle(m.title);
    setNewType(m.type);
    setNewSchool(m.school);
    setNewYear(m.year);
    setNewDescription(m.description || '');
    setSelectedFile(null);
    setUploadError('');
    setShowEditModal(true);
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterialId) return;

    setIsUploading(true);
    setUploadProgress(30);

    try {
      let updates: Partial<StudyMaterial> = {
        title: newTitle,
        type: newType,
        school: newSchool,
        year: newYear,
        description: newDescription
      };

      // If a new file is selected, upload it
      if (selectedFile) {
        setUploadProgress(50);
        const uploadResult = await storageService.uploadFile(
          selectedFile,
          user.id || user.email,
          newTitle
        );

        if (uploadResult) {
          updates.fileUrl = uploadResult.url;
          updates.fileName = selectedFile.name;
          updates.fileExtension = selectedFile.name.split('.').pop() || '';
        }
      }

      setUploadProgress(80);
      await materialsApi.updateMaterial(currentMaterialId, updates);
      
      setUploadProgress(100);
      setShowEditModal(false);
      setCurrentMaterialId(null);
      
      setTimeout(() => {
        setUploadProgress(0);
        refreshData();
      }, 500);
    } catch (error) {
      console.error('Update error:', error);
      setUploadError('Error updating material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddUni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniName) return;
    
    await universitiesApi.addUniversity({
      name: uniName,
      location: uniLocation
    });
    
    setUniName('');
    setUniLocation('');
    setShowUniModal(false);
    refreshData();
  };

  const handleDeleteMaterial = async (id: string, fileUrl?: string) => {
    if (confirm('Delete this material and its associated file?')) {
      try {
        // Delete file from storage if it exists
        if (fileUrl) {
          const filePath = fileUrl.split('/').pop();
          if (filePath) {
            await storageService.deleteFile(filePath);
          }
        }
        
        await materialsApi.deleteMaterial(id);
        refreshData();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete material');
      }
    }
  };

  const promoteUser = async (userId: string) => {
    if (confirm('Promote this user to Admin?')) {
      await usersApi.promoteToAdmin(userId);
      refreshData();
    }
  };

  const getFormatIcon = (ext: string) => {
    switch(ext?.toLowerCase()) {
      case 'pdf': return <FileText className="text-red-500" size={20} />;
      case 'doc':
      case 'docx': return <FileText className="text-blue-500" size={20} />;
      case 'jpg':
      case 'png':
      case 'gif': return <FileText className="text-green-500" size={20} />;
      default: return <FileText className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} md:w-64 bg-indigo-700 text-white transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6">
          <Logo />
          <p className="mt-2 text-indigo-200 text-sm">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {(['materials', 'users', 'universities'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab ? 'bg-indigo-900' : 'hover:bg-indigo-600'
              }`}
            >
              {tab === 'materials' && <BookOpen className="inline mr-2" size={18} />}
              {tab === 'users' && <Users className="inline mr-2" size={18} />}
              {tab === 'universities' && <School className="inline mr-2" size={18} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="m-4 w-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'materials' && 'Study Materials'}
              {activeTab === 'users' && 'Users Management'}
              {activeTab === 'universities' && 'Universities'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div>
              <button
                onClick={() => {
                  setNewTitle('');
                  setNewDescription('');
                  setNewSchool('');
                  setNewType('note');
                  setSelectedFile(null);
                  setUploadError('');
                  setShowAddModal(true);
                }}
                className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Add New Material
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(m => (
                  <div key={m.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {getFormatIcon(m.fileExtension)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 dark:text-white truncate">{m.title}</h3>
                          <p className="text-xs text-gray-500">{m.school} • {m.year}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{m.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditInit(m)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id, m.fileUrl)}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-white">Email</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-white">School</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-white">Year</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-white">Role</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-3 text-gray-800 dark:text-white">{u.email}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{u.school}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{u.year}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                            u.role === 'admin' 
                              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {u.role?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => promoteUser(u.id)}
                              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                            >
                              Make Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Universities Tab */}
          {activeTab === 'universities' && (
            <div>
              <button
                onClick={() => setShowUniModal(true)}
                className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Add University
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {universities.map(uni => (
                  <div key={uni.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <School size={24} className="text-indigo-600 mb-2" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{uni.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{uni.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Material Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {showEditModal ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setUploadError('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={showEditModal ? handleUpdateMaterial : handleAddMaterial} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded text-red-700 dark:text-red-200 flex items-start gap-2">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <p>{uploadError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Material title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="note">Note</option>
                    <option value="past-paper">Past Paper</option>
                    <option value="lecture">Lecture</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Year</label>
                  <select
                    value={newYear}
                    onChange={e => setNewYear(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>First Year</option>
                    <option>Second Year</option>
                    <option>Third Year</option>
                    <option>Fourth Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">School</label>
                <input
                  type="text"
                  value={newSchool}
                  onChange={e => setNewSchool(e.target.value)}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., School of Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Description</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief description of the material"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">
                  File {showEditModal ? '(Optional - leave empty to keep current file)' : '(Required)'}
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.png,.gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed dark:border-gray-600 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <Upload size={20} className="text-indigo-600" />
                    <span className="text-gray-700 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Click to select file'}
                    </span>
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Loader size={16} className="animate-spin" />
                      Uploading...
                    </span>
                    <span className="text-gray-700 dark:text-white font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      {showEditModal ? 'Update Material' : 'Upload Material'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setUploadError('');
                  }}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add University Modal */}
      {showUniModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add University</h2>
              <button
                onClick={() => setShowUniModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUni} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Name</label>
                <input
                  type="text"
                  value={uniName}
                  onChange={e => setUniName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="University name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Location</label>
                <input
                  type="text"
                  value={uniLocation}
                  onChange={e => setUniLocation(e.target.value)}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City, Country"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Add University
                </button>
                <button
                  type="button"
                  onClick={() => setShowUniModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
