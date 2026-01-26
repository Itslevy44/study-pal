
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
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  login: async (email: string, pass: string): Promise<User | null> => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Static Admin Override
    if (email === 'levykirui093@gmail.com' && pass === 'levy4427') {
        return { id: 'admin-0', email, role: 'admin', school: 'System', year: 'Master' } as User;
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
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    return error ? [] : data;
  },

  addMaterial: async (material: Omit<StudyMaterial, 'id' | 'createdAt'>): Promise<void> => {
    if (!supabase) return;
    await supabase.from('materials').insert([{
      ...material,
      created_at: new Date().toISOString()
    }]);
  },

  updateMaterial: async (id: string, data: Partial<StudyMaterial>): Promise<void> => {
    if (!supabase) return;
    await supabase.from('materials').update(data).eq('id', id);
  },

  deleteMaterial: async (id: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('materials').delete().eq('id', id);
  },

  // Tasks
  getTasks: async (userId: string): Promise<TaskItem[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('tasks').select('*').eq('userId', userId);
    return error ? [] : data;
  },

  saveTask: async (task: Omit<TaskItem, 'id'>): Promise<void> => {
    if (!supabase) return;
    await supabase.from('tasks').insert([task]);
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
  updateProfile: async (userId: string, data: Partial<User>): Promise<void> => {
    if (!supabase) return;
    await supabase.from('users').update(data).eq('id', userId);
    
    // Update local session if it's the current user
    const current = api.getCurrentUser();
    if (current && current.id === userId) {
      api.setCurrentUser({ ...current, ...data });
    }
  },

  updateUserSubscription: async (userId: string, months: number): Promise<void> => {
    if (!supabase) return;
    const now = new Date();
    const expiry = new Date(now.setMonth(now.getMonth() + months)).toISOString();
    await supabase.from('users').update({ subscriptionExpiry: expiry }).eq('id', userId);
    
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
