import { supabase } from '@/lib/supabase/client';
import { compressImageToDataUrl } from '@/lib/utils/image';

export interface UploadProgressCallback {
  (progress: number): void;
}

const BUCKET_NAME = 'store-images';

/**
 * Uploads an image file to Supabase Storage under the specified folder
 * With automatic fallback to high-efficiency compressed base64 data URL if storage is unavailable.
 */
export async function uploadProductImage(
  file: File,
  folder: string = 'products',
  onProgress?: UploadProgressCallback,
  timeoutMs: number = 6000
): Promise<{ downloadUrl: string; storagePath: string }> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('กรุณาอัปโหลดไฟล์รูปภาพที่ถูกต้อง (JPEG, PNG, WEBP, GIF)');
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB');
  }

  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'png';
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `${folder}/${timestamp}_${cleanBaseName}.${fileExt}`;

  if (onProgress) onProgress(20);

  try {
    // Attempt Supabase Storage Upload
    const uploadPromise = supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

    // Timeout protection
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase Storage timeout')), timeoutMs)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    if (error) {
      console.warn('Supabase storage upload returned error, falling back to compressed base64:', error.message);
      const dataUrl = await compressImageToDataUrl(file, 800, 800, 0.75);
      if (onProgress) onProgress(100);
      return { downloadUrl: dataUrl, storagePath: 'base64_fallback' };
    }

    if (onProgress) onProgress(80);

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const downloadUrl = publicUrlData.publicUrl;

    if (onProgress) onProgress(100);
    return { downloadUrl, storagePath: filePath };
  } catch (err: any) {
    console.warn('Storage upload exception, falling back to base64 data URL:', err.message);
    try {
      const dataUrl = await compressImageToDataUrl(file, 800, 800, 0.75);
      if (onProgress) onProgress(100);
      return { downloadUrl: dataUrl, storagePath: 'base64_fallback' };
    } catch (fallbackErr: any) {
      throw new Error(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${err.message}`);
    }
  }
}

/**
 * Deletes an image from Supabase Storage by path or URL
 */
export async function deleteProductImage(imageUrlOrPath: string): Promise<boolean> {
  if (!imageUrlOrPath || imageUrlOrPath.startsWith('data:')) return true;

  try {
    let storagePath = imageUrlOrPath;
    if (imageUrlOrPath.includes(`/${BUCKET_NAME}/`)) {
      const parts = imageUrlOrPath.split(`/${BUCKET_NAME}/`);
      if (parts[1]) {
        storagePath = decodeURIComponent(parts[1].split('?')[0]);
      }
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (error) {
      console.warn('Could not remove image from Supabase storage:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Exception removing image from Supabase Storage:', error);
    return false;
  }
}
