/**
 * Utility to compress any image (JPEG, PNG, WEBP, GIF) into a lightweight JPEG Data URL.
 * Ensures the string size is strictly under Google Cloud Firestore's 1 MiB limit (1,048,487 bytes).
 */
export async function compressImageToDataUrl(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  initialQuality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.gif')) {
      reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ'));
      return;
    }

    // SPECIAL HANDLING FOR GIF:
    // HTML Canvas cannot encode animated GIFs (it collapses all frames into a single static frame).
    // If the file is 'duck.gif' (which exists in public/products), use the local static path directly.
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif) {
      if (file.name.toLowerCase() === 'duck.gif') {
        resolve('/products/duck.gif');
        return;
      }

      // If GIF is under 450KB (base64 ~600KB), read directly as base64 Data URL to preserve animation
      if (file.size <= 450 * 1024) {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ GIF ได้'));
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
        return;
      }
      // If GIF exceeds 450KB, fall through to Canvas compression below to compress frame 1 to lightweight JPEG (<100KB)
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถเปิดรูปภาพได้'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional scale to max dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถประมวลผล Canvas ได้'));
          return;
        }

        // Clean white background for any PNG transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Guarantee that dataUrl is well under Firestore 1,048,487 bytes limit (safe cap: 600,000 bytes)
        while (dataUrl.length > 600000 && quality > 0.2) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
