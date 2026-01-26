
import { createClient } from '@supabase/supabase-js';
import { User, StudyMaterial, TaskItem, PaymentRecord, University, UserRole } from '../types';

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Fallback session storage for the current logged-in user
const SESSION_KEY = 'studypal_session';

export const api = {
  // Auth Session (Local only for persistence)
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  },
  
  // Users
  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });
    
    if (authError) throw new Error(authError.message);
    if (!authData.user?.id) throw new Error('Auth signup failed');
    
    // Step 2: Sign in the user immediately to get an active session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    });
    
    if (signInError) {
      console.warn('Could not auto-login after signup:', signInError.message);
      // Continue anyway - the user can log in manually
    }
    
    // Step 3: Insert user profile with the auth user ID
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: userData.email,
        school: userData.school,
        year: userData.year,
        role: 'student'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error registering user:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  login: async (email: string, pass: string): Promise<User | null> => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Static Admin Override - use a valid UUID
    if (email === 'levykirui093@gmail.com' && pass === 'levy4427') {
        return { id: '00000000-0000-0000-0000-000000000001', email, role: 'admin', school: 'System', year: 'Master' } as User;
    }

    // For regular users, use Supabase Auth
    if (!supabase) return null;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    
    if (error) return null;
    
    // Get user profile from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return userError ? null : userData;
  },

  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    return error ? [] : data;
  },

  promoteToAdmin: async (userId: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
  },

  // Universities
  getUniversities: async (): Promise<University[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('universities').select('*').order('name');
    return error ? [] : data;
  },

  addUniversity: async (name: string, location?: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('universities').insert([{ name, location: location || '' }]);
  },

  updateUniversity: async (id: string, name: string, location?: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('universities').update({ name, location: location || '' }).eq('id', id);
  },

  deleteUniversity: async (id: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('universities').delete().eq('id', id);
  },

  // Materials
  getMaterials: async (): Promise<StudyMaterial[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('study_materials').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
    // Map snake_case from database to camelCase for frontend
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      fileUrl: item.file_url,
      fileName: item.file_name,
      fileExtension: item.file_extension,
      school: item.school,
      year: item.year,
      description: item.description,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at
    }));
  },

  addMaterial: async (material: Omit<StudyMaterial, 'id' | 'createdAt'>): Promise<void> => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.from('study_materials').insert([{
      title: material.title,
      type: material.type,
      file_url: material.fileUrl,
      file_name: material.fileName,
      file_extension: material.fileExtension,
      school: material.school,
      year: material.year,
      description: material.description,
      uploaded_by: material.uploadedBy,
      created_at: new Date().toISOString()
    }]).select();
    
    if (error) {
      console.error('Supabase error adding material:', error);
      throw new Error(error.message);
    }
    
    console.log('Material added successfully:', data);
  },

  updateMaterial: async (id: string, material: Partial<StudyMaterial>): Promise<void> => {
    if (!supabase) return;
    const updateData: any = {};
    if (material.title !== undefined) updateData.title = material.title;
    if (material.type !== undefined) updateData.type = material.type;
    if (material.school !== undefined) updateData.school = material.school;
    if (material.year !== undefined) updateData.year = material.year;
    if (material.description !== undefined) updateData.description = material.description;
    if (material.fileUrl !== undefined) updateData.file_url = material.fileUrl;
    if (material.fileName !== undefined) updateData.file_name = material.fileName;
    if (material.fileExtension !== undefined) updateData.file_extension = material.fileExtension;
    
    const { error } = await supabase.from('study_materials').update(updateData).eq('id', id);
    if (error) {
      console.error('Error updating material:', error);
      throw new Error(error.message);
    }
  },

  deleteMaterial: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) {
      console.error('Error deleting material:', error);
      throw new Error(error.message);
    }
  },

  // Tasks
  getTasks: async (userId: string): Promise<TaskItem[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data || [];
  },

  saveTask: async (task: Omit<TaskItem, 'id'>): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').insert([{
      user_id: task.userId,
      title: task.title,
      content: task.content,
      type: task.type,
      priority: task.priority || 'medium',
      due_date: task.dueDate || null,
      completed: task.completed || false
    }]);
    if (error) {
      console.error('Error saving task:', error);
      throw new Error(error.message);
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('tasks').delete().eq('id', id);
  },

  // Payments
  getPayments: async (): Promise<PaymentRecord[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    return error ? [] : data;
  },

  recordPayment: async (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    if (!supabase) return;
    await supabase.from('payments').insert([{
      ...payment,
      status: 'success',
      created_at: new Date().toISOString()
    }]);
  },

  // Profile Management
  updateProfile: async (userId: string, updates: Partial<User>): Promise<void> => {
    if (!supabase) return;
    
    // Map camelCase to snake_case for database
    const updateData: any = {};
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.school !== undefined) updateData.school = updates.school;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.subscriptionExpiry !== undefined) updateData.subscription_expiry = updates.subscriptionExpiry;
    
    const { error } = await supabase.from('users').update(updateData).eq('id', userId);
    if (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.message);
    }
    
    // Update local session if it's the current user
    const current = api.getCurrentUser();
    if (current && current.id === userId) {
      api.setCurrentUser({ ...current, ...updates });
    }
  },

  updateUserSubscription: async (userId: string, months: number): Promise<void> => {
    if (!supabase) return;
    const now = new Date();
    const expiry = new Date(now.setMonth(now.getMonth() + months)).toISOString();
    
    const { error } = await supabase.from('users').update({ subscription_expiry: expiry }).eq('id', userId);
    if (error) {
      console.error('Error updating subscription:', error);
      throw new Error(error.message);
    }
    
    const current = api.getCurrentUser();
    if (current && current.id === userId) {
      api.setCurrentUser({ ...current, subscriptionExpiry: expiry });
    }
  },

  // In-App (Offline) Storage - Still uses LocalStorage as it's for "offline" access
  saveOffline: (userId: string, material: StudyMaterial) => {
    const key = `studypal_offline_${userId}`;
    const data = localStorage.getItem(key);
    const offline: StudyMaterial[] = data ? JSON.parse(data) : [];
    if (!offline.some(m => m.id === material.id)) {
      offline.push(material);
      localStorage.setItem(key, JSON.stringify(offline));
    }
  },

  getOffline: (userId: string): StudyMaterial[] => {
    const key = `studypal_offline_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  removeOffline: (userId: string, materialId: string) => {
    const key = `studypal_offline_${userId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const offline: StudyMaterial[] = JSON.parse(data);
      const filtered = offline.filter(m => m.id !== materialId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  }
};
