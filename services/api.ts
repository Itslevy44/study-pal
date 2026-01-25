
import { User, StudyMaterial, TaskItem, PaymentRecord, University } from '../types';

// Mock DB keys
const STORAGE_KEYS = {
  USERS: 'studypal_users',
  MATERIALS: 'studypal_materials',
  TASKS: 'studypal_tasks',
  PAYMENTS: 'studypal_payments',
  CURRENT_USER: 'studypal_session',
  UNIVERSITIES: 'studypal_universities',
  OFFLINE_STORAGE: 'studypal_offline_v1'
};

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // Auth
  getCurrentUser: (): User | null => getFromStorage(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => saveToStorage(STORAGE_KEYS.CURRENT_USER, user),
  
  register: (userData: Omit<User, 'id'>): User => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  login: (email: string, pass: string): User | null => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    
    // Default admin check
    if (email === 'levykirui093@gmail.com' && pass === 'levy4427') {
        const admin = { id: 'admin-0', email, role: 'admin', school: 'System', year: 'Master' } as User;
        return admin;
    }
    
    return users.find(u => u.email === email && u.password === pass) || null;
  },

  // Universities
  getUniversities: (): University[] => getFromStorage(STORAGE_KEYS.UNIVERSITIES, []),
  addUniversity: (name: string) => {
    const unis = getFromStorage<University[]>(STORAGE_KEYS.UNIVERSITIES, []);
    const newUni = { id: Math.random().toString(36).substr(2, 9), name };
    unis.push(newUni);
    saveToStorage(STORAGE_KEYS.UNIVERSITIES, unis);
    return newUni;
  },
  deleteUniversity: (id: string) => {
    const unis = getFromStorage<University[]>(STORAGE_KEYS.UNIVERSITIES, []);
    saveToStorage(STORAGE_KEYS.UNIVERSITIES, unis.filter(u => u.id !== id));
  },

  // Materials
  getMaterials: (): StudyMaterial[] => getFromStorage(STORAGE_KEYS.MATERIALS, []),
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'createdAt'>) => {
    const items = getFromStorage<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);
    const newItem = { 
      ...material, 
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    saveToStorage(STORAGE_KEYS.MATERIALS, items);
    return newItem;
  },
  deleteMaterial: (id: string) => {
    const items = getFromStorage<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);
    saveToStorage(STORAGE_KEYS.MATERIALS, items.filter(i => i.id !== id));
  },

  // In-App (Offline) Storage
  saveOffline: (userId: string, material: StudyMaterial) => {
    const offline = getFromStorage<Record<string, StudyMaterial[]>>(STORAGE_KEYS.OFFLINE_STORAGE, {});
    if (!offline[userId]) offline[userId] = [];
    if (!offline[userId].some(m => m.id === material.id)) {
      offline[userId].push(material);
      saveToStorage(STORAGE_KEYS.OFFLINE_STORAGE, offline);
    }
  },
  getOffline: (userId: string): StudyMaterial[] => {
    const offline = getFromStorage<Record<string, StudyMaterial[]>>(STORAGE_KEYS.OFFLINE_STORAGE, {});
    return offline[userId] || [];
  },
  removeOffline: (userId: string, materialId: string) => {
    const offline = getFromStorage<Record<string, StudyMaterial[]>>(STORAGE_KEYS.OFFLINE_STORAGE, {});
    if (offline[userId]) {
      offline[userId] = offline[userId].filter(m => m.id !== materialId);
      saveToStorage(STORAGE_KEYS.OFFLINE_STORAGE, offline);
    }
  },

  // Tasks
  getTasks: (userId: string): TaskItem[] => {
    const all = getFromStorage<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    return all.filter(t => t.userId === userId);
  },
  saveTask: (task: Omit<TaskItem, 'id'>) => {
    const all = getFromStorage<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
    all.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, all);
    return newTask;
  },
  deleteTask: (id: string) => {
    const all = getFromStorage<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    saveToStorage(STORAGE_KEYS.TASKS, all.filter(t => t.id !== id));
  },

  // Payments
  getPayments: (): PaymentRecord[] => getFromStorage(STORAGE_KEYS.PAYMENTS, []),
  isMpesaCodeUsed: (code: string): boolean => {
    const payments = getFromStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
    return payments.some(p => p.mpesaCode === code);
  },
  recordPayment: (userId: string, email: string, amount: number, phone: string, mpesaCode: string) => {
    const payments = getFromStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
    const newPayment: PaymentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        userEmail: email,
        amount,
        phoneNumber: phone,
        mpesaCode,
        status: 'success',
        createdAt: new Date().toISOString()
    };
    payments.push(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },

  // Users Management
  getUsers: (): User[] => getFromStorage(STORAGE_KEYS.USERS, []),
  updateUserSubscription: (userId: string, months: number) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const now = new Date();
    const expiry = new Date(now.setMonth(now.getMonth() + months)).toISOString();
    const updated = users.map(u => u.id === userId ? { ...u, subscriptionExpiry: expiry } : u);
    saveToStorage(STORAGE_KEYS.USERS, updated);
    
    const current = api.getCurrentUser();
    if (current && current.id === userId) {
        api.setCurrentUser({ ...current, subscriptionExpiry: expiry });
    }
  },

  promoteToAdmin: (userId: string) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const updated = users.map(u => u.id === userId ? { ...u, role: 'admin' as const } : u);
    saveToStorage(STORAGE_KEYS.USERS, updated);
  },

  addAdmin: (email: string, pass: string) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const newAdmin: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password: pass,
      role: 'admin',
      school: 'Administration',
      year: 'N/A'
    };
    users.push(newAdmin);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newAdmin;
  },

  updateProfile: (userId: string, data: Partial<User>) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const updated = users.map(u => u.id === userId ? { ...u, ...data } : u);
    saveToStorage(STORAGE_KEYS.USERS, updated);
    const current = api.getCurrentUser();
    if (current && current.id === userId) {
        api.setCurrentUser({ ...current, ...data });
    }
  }
};
