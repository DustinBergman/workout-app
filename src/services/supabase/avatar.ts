import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';

// Constants
const BUCKET_NAME = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadAvatarResult {
  url: string | null;
  error: Error | null;
}

export interface ValidateFileResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file before upload
 */
export const validateAvatarFile = (file: File): ValidateFileResult => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, WebP, or GIF image' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }
  return { valid: true };
};

/**
 * Delete existing avatar files for a user
 */
const deleteExistingAvatar = async (userId: string): Promise<void> => {
  // List all files in user's avatar folder
  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId);

  if (files && files.length > 0) {
    const filesToDelete = files.map((file) => `${userId}/${file.name}`);
    await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
  }
};

/**
 * Upload avatar image to Supabase Storage
 */
export const uploadAvatar = async (file: File): Promise<UploadAvatarResult> => {
  const user = await getAuthUser();
  if (!user) {
    return { url: null, error: new Error('Not authenticated') };
  }

  // Validate file
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    return { url: null, error: new Error(validation.error) };
  }

  // Generate file path: avatars/{userId}/avatar.{extension}
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${user.id}/avatar.${fileExt}`;

  // Delete existing avatar first (if any)
  await deleteExistingAvatar(user.id);

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Add cache-busting parameter
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id);

  if (updateError) {
    return { url: null, error: updateError };
  }

  return { url, error: null };
};

/**
 * Delete user's avatar completely
 */
export const deleteAvatar = async (): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  // Delete from storage
  await deleteExistingAvatar(user.id);

  // Clear avatar_url from profile
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);

  return { error };
};
