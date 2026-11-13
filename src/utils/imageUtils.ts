/**
 * Utility functions for local drive image upload, optimization, and compression
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface OptimizedImageResult {
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  fileName: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export function estimateDataUrlBytes(url: string): number {
  if (!url.startsWith('data:')) return url.length;
  const commaIdx = url.indexOf(',');
  if (commaIdx === -1) return url.length;
  const base64Length = url.length - (commaIdx + 1);
  return Math.round((base64Length * 3) / 4);
}

export function estimateImagesPayloadBytes(images: string[]): number {
  return images.reduce((acc, img) => acc + estimateDataUrlBytes(img), 0);
}

/**
 * Optimizes an image selected from the user's local drive by scaling it to e-commerce
 * standard dimensions and converting to modern compressed WebP/JPEG format.
 */
export async function optimizeLocalImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<OptimizedImageResult> {
  const { maxWidth = 960, maxHeight = 1200, quality = 0.78 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error(`File "${file.name}" is not a supported image format.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file "${file.name}" from local drive.`));
    };

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;

      // For SVGs, keep original dataUrl to preserve vectors
      if (file.type === 'image/svg+xml') {
        resolve({
          dataUrl: rawDataUrl,
          originalSize: file.size,
          optimizedSize: file.size,
          fileName: file.name,
          dimensions: { width: 800, height: 800 }
        });
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error(`Failed to decode image "${file.name}".`));
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          resolve({
            dataUrl: rawDataUrl,
            originalSize: file.size,
            optimizedSize: file.size,
            fileName: file.name,
            dimensions: { width: img.width, height: img.height }
          });
          return;
        }

        // Optional smooth image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Attempt WebP first, fallback to JPEG
        let optimizedDataUrl: string;
        try {
          optimizedDataUrl = canvas.toDataURL('image/webp', quality);
          // If browser returns standard png fallback when webp is unsupported
          if (!optimizedDataUrl.startsWith('data:image/webp') && file.type !== 'image/png') {
            optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate approximate size of base64 string
        const base64Length = optimizedDataUrl.length - (optimizedDataUrl.indexOf(',') + 1);
        const approxBytes = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl: optimizedDataUrl,
          originalSize: file.size,
          optimizedSize: approxBytes,
          fileName: file.name,
          dimensions: { width, height }
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Batch processes multiple files from the local drive
 */
export async function processLocalImageFiles(
  files: FileList | File[]
): Promise<OptimizedImageResult[]> {
  const fileArray = Array.from(files);
  const results: OptimizedImageResult[] = [];

  for (const file of fileArray) {
    if (file.type.startsWith('image/')) {
      try {
        const res = await optimizeLocalImage(file);
        results.push(res);
      } catch (err) {
        console.error('Error processing local file:', file.name, err);
      }
    }
  }

  return results;
}
