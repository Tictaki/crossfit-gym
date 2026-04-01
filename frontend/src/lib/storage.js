import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to a Supabase bucket and returns the public URL.
 * 
 * @param {File|Blob|Buffer} file - The file to upload
 * @param {string} bucket - The bucket name (e.g., 'members', 'products', 'settings')
 * @param {string} originalName - Original filename to extract extension
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadFile(file, bucket, originalName) {
  const supabase = createClient();
  
  const fileExt = originalName.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Convert to ArrayBuffer if it's a File/Blob (common in Next.js request.formData())
  let fileBody = file;
  if (file instanceof Blob) {
    fileBody = await file.arrayBuffer();
  }

  const options = {
    cacheControl: '3600',
    upsert: false
  };

  if (file.type) {
    options.contentType = file.type;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, options);

  if (error) {
    console.error(`Error uploading to bucket ${bucket}:`, error);
    throw new Error(`Falha no upload para o storage: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Replaces an existing file in storage.
 * 
 * @param {string} oldUrl - Full URL to the old file
 * @param {File|Blob|Buffer} newFile - The new file
 * @param {string} bucket - The bucket name
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} - New public URL
 */
export async function replaceFile(oldUrl, newFile, bucket, originalName) {
  // If we have an old URL, try to extract the file path and delete it
  if (oldUrl && oldUrl.includes(bucket)) {
    try {
      const supabase = createClient();
      const fileName = oldUrl.split('/').pop();
      await supabase.storage.from(bucket).remove([fileName]);
    } catch (e) {
      console.warn('Could not delete old file, continuing with upload:', e);
    }
  }

  return uploadFile(newFile, bucket, originalName);
}

/**
 * Deletes a file from storage given its URL.
 * 
 * @param {string} url - Public URL of the file
 * @param {string} bucket - The bucket name
 */
export async function deleteFile(url, bucket) {
  if (!url || !url.includes(bucket)) return;
  
  try {
    const supabase = createClient();
    const fileName = url.split('/').pop();
    const { error } = await supabase.storage.from(bucket).remove([fileName]);
    if (error) console.error(`Error deleting file from ${bucket}:`, error);
  } catch (e) {
    console.error(`Exception deleting file from ${bucket}:`, e);
  }
}
