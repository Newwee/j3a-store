import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Uploads an image file to Firebase Storage under the products directory
 * @param file The File object from input
 * @param path Optional custom directory path (default: 'products')
 * @param onProgress Optional callback receiving 0-100 percentage
 * @returns Promise resolving to public download URL and storage path
 */
export async function uploadProductImage(
  file: File,
  folder: string = 'products',
  onProgress?: UploadProgressCallback,
  timeoutMs: number = 4000
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Please verify your environment variables.');
  }

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
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const storagePath = `${folder}/${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    let isSettled = false;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {}
          reject(new Error('Firebase Storage connection timed out (CORS or network policy).'));
        }
      }, timeoutMs);
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        if (timer) clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          console.warn('Firebase Storage upload error (e.g. CORS preflight failed):', error);
          reject(new Error(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${error.message}`));
        }
      },
      async () => {
        if (timer) clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadUrl, storagePath });
          } catch (urlError) {
            reject(urlError);
          }
        }
      }
    );
  });
}

/**
 * Deletes an image from Firebase Storage by URL or path
 */
export async function deleteProductImage(imageUrlOrPath: string): Promise<boolean> {
  if (!storage || !imageUrlOrPath) return false;

  try {
    // If it's a full Firebase Storage download URL, get reference from URL
    let storageRef;
    if (imageUrlOrPath.startsWith('http')) {
      // Firebase Storage URLs contain /o/<path>?alt=media
      const match = imageUrlOrPath.match(/\/o\/([^?]+)/);
      if (match && match[1]) {
        const decodedPath = decodeURIComponent(match[1]);
        storageRef = ref(storage, decodedPath);
      } else {
        return false;
      }
    } else {
      storageRef = ref(storage, imageUrlOrPath);
    }

    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.warn('Could not delete image from Firebase Storage:', error);
    return false;
  }
}
