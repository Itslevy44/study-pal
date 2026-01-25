import { supabase } from './supabaseClient';
import { StudyMaterial, User, TaskItem, University, Note, ScheduleItem, StudySession, AnalyticsData } from '../types';
import * as storageService from './storageService';

// Auth Methods
export const authApi = {
  async register(email: string, password: string, school: string, year: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email,
            password,
            school,
            year,
            role: 'student'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        return { user: userData, error: null };
      }

      return { user: null, error: 'Failed to create user' };
    } catch (error: any) {
      return { user: null, error: error.message || error };
    }
  },

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      return { user: userData, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || error };
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }
};

// Materials Methods
export const materialsApi = {
  async getMaterials(): Promise<StudyMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  async addMaterial(material: Omit<StudyMaterial, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .insert([{
          title: material.title,
          type: material.type,
          file_url: material.fileUrl,
          file_name: material.fileName,
          file_extension: material.fileExtension,
          school: material.school,
          year: material.year,
          description: material.description,
          uploaded_by: material.uploadedBy
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding material:', error);
      return null;
    }
  },

  async uploadMaterialWithFile(
    file: File,
    material: { title: string; type: string; school: string; year: string; description: string; uploadedBy: string }
  ) {
    try {
      // Upload file to Supabase Storage
      const uploadResult = await storageService.uploadFile(
        file,
        material.uploadedBy,
        material.title
      );

      if (!uploadResult) {
        throw new Error('File upload failed');
      }

      // Create material record in database
      const { data, error } = await supabase
        .from('study_materials')
        .insert([{
          title: material.title,
          type: material.type,
          file_url: uploadResult.url,
          file_name: file.name,
          file_extension: file.name.split('.').pop() || '',
          file_size: file.size,
          school: material.school,
          year: material.year,
          description: material.description,
          uploaded_by: material.uploadedBy
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading material:', error);
      return null;
    }
  },

  async updateMaterial(id: string, updates: Partial<StudyMaterial>) {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating material:', error);
      return null;
    }
  },

  async deleteMaterial(id: string) {
    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  },

  async searchMaterials(query: string): Promise<StudyMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,school.ilike.%${query}%,type.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching materials:', error);
      return [];
    }
  }
};

// Favorites Methods
export const favoritesApi = {
  async addFavorite(userId: string, materialId: string) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, material_id: materialId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return null;
    }
  },

  async removeFavorite(userId: string, materialId: string) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('material_id', materialId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },

  async getFavorites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('material_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(f => f.material_id);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }
};

// Ratings Methods
export const ratingsApi = {
  async ratingMaterial(userId: string, materialId: string, rating: number) {
    try {
      const { data, error } = await supabase
        .from('material_ratings')
        .upsert([{ user_id: userId, material_id: materialId, rating }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rating material:', error);
      return null;
    }
  },

  async getMaterialRating(materialId: string) {
    try {
      const { data, error } = await supabase
        .from('material_ratings')
        .select('rating')
        .eq('material_id', materialId);

      if (error) throw error;
      if (!data || data.length === 0) return 0;
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return Math.round(avg * 10) / 10;
    } catch (error) {
      console.error('Error getting rating:', error);
      return 0;
    }
  }
};

// Tasks Methods
export const tasksApi = {
  async getTasks(userId: string): Promise<TaskItem[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async addTask(userId: string, task: Omit<TaskItem, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: userId,
          type: task.type,
          title: task.title,
          content: task.content,
          date: task.date
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  },

  async updateTask(taskId: string, updates: Partial<TaskItem>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  },

  async deleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }
};

// Notes Methods
export const notesApi = {
  async addNote(userId: string, materialId: string, content: string): Promise<Note | null> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ user_id: userId, material_id: materialId, content }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      return null;
    }
  },

  async getNotes(userId: string, materialId: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  async updateNote(noteId: string, content: string) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ content, updated_at: new Date() })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  },

  async deleteNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }
};

// Schedule Methods
export const scheduleApi = {
  async addScheduleItem(userId: string, item: Omit<ScheduleItem, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .insert([{
          user_id: userId,
          title: item.title,
          subject: item.subject,
          start_time: item.startTime,
          end_time: item.endTime,
          day: item.day,
          location: item.location,
          color: item.color
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding schedule item:', error);
      return null;
    }
  },

  async getSchedule(userId: string): Promise<ScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  },

  async updateScheduleItem(itemId: string, updates: Partial<ScheduleItem>) {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating schedule item:', error);
      return null;
    }
  },

  async deleteScheduleItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      return false;
    }
  }
};

// Study Sessions & Analytics Methods
export const analyticsApi = {
  async startStudySession(userId: string, materialId: string) {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert([{
          user_id: userId,
          material_id: materialId,
          started_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  },

  async endStudySession(sessionId: string, duration: number) {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .update({ 
          completed_at: new Date(),
          duration 
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error ending session:', error);
      return null;
    }
  },

  async getAnalytics(userId: string): Promise<AnalyticsData | null> {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create analytics record if doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('analytics_data')
          .insert([{
            user_id: userId,
            total_study_time: 0,
            sessions_count: 0,
            materials_viewed: 0,
            average_session_duration: 0
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  async updateAnalytics(userId: string, updates: Partial<AnalyticsData>) {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating analytics:', error);
      return null;
    }
  }
};

// User Methods
export const usersApi = {
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  async updateUserSubscription(userId: string, expiryDate: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ subscription_expiry: expiryDate })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return null;
    }
  },

  async promoteToAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error promoting user:', error);
      return null;
    }
  }
};

// Universities Methods
export const universitiesApi = {
  async getUniversities(): Promise<University[]> {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching universities:', error);
      return [];
    }
  },

  async addUniversity(university: Omit<University, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('universities')
        .insert([{ name: university.name, location: university.location }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding university:', error);
      return null;
    }
  }
};

// Payments Methods
export const paymentsApi = {
  async addPayment(userId: string, amount: number, currency: string, paymentMethod: string, reference: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          user_id: userId,
          amount,
          currency,
          payment_method: paymentMethod,
          transaction_reference: reference,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding payment:', error);
      return null;
    }
  },

  async getPayments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }
};

// Default export for compatibility
export default {
  auth: authApi,
  materials: materialsApi,
  favorites: favoritesApi,
  ratings: ratingsApi,
  tasks: tasksApi,
  notes: notesApi,
  schedule: scheduleApi,
  analytics: analyticsApi,
  users: usersApi,
  universities: universitiesApi,
  payments: paymentsApi
};
