import { supabase } from './supabaseClient';

const BUCKET_NAME = 'study-materials';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Initialize bucket (run once)
export const initializeStorage = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain'
        ]
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('Storage bucket created successfully');
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Upload file to Supabase Storage
export const uploadFile = async (
  file: File,
  userId: string,
  materialTitle: string
): Promise<{ path: string; url: string } | null> => {
  try {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Create unique file path: userId/materialTitle/timestamp-filename
    const timestamp = Date.now();
    const fileName = file.name.replace(/\s+/g, '-');
    const filePath = `${userId}/${materialTitle}/${timestamp}-${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Download file
export const downloadFile = async (filePath: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

// Get public URL for file
export const getFileUrl = (filePath: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
};

// Delete file
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// List files in user folder
export const listUserFiles = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

// Get file metadata
export const getFileMetadata = async (filePath: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .info(filePath);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
};

export default {
  initializeStorage,
  uploadFile,
  downloadFile,
  getFileUrl,
  deleteFile,
  listUserFiles,
  getFileMetadata
};
