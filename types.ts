
export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  email: string;
  school: string;
  year: string;
  role: UserRole;
  subscriptionExpiry?: string | null; // ISO string
  password?: string;
}

export interface University {
  id: string;
  name: string;
  location?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'note' | 'past-paper';
  fileUrl: string; // This will store base64 data for the demo
  fileName: string;
  fileExtension: string;
  school: string;
  year: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  type: 'note' | 'timetable';
  title: string;
  content: string;
  date?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  phoneNumber: string;
  mpesaCode: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  materialId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  title: string;
  subject: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  day: string;       // Monday, Tuesday, etc.
  location: string;
  color: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  materialId: string;
  duration: number; // in minutes
  startedAt: string;
  completedAt?: string;
}

export interface AnalyticsData {
  userId: string;
  totalStudyTime: number; // minutes
  sessionsCount: number;
  materialsViewed: number;
  averageSessionDuration: number;
  lastActiveDate: string;
}
