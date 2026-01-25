
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
  fileUrl: string;
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
