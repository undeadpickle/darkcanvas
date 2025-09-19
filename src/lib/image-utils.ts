// Image upload and processing utilities for DarkCanvas Image-to-Image
import { log } from './logger';
import type { SourceImage } from '@/types';

// Maximum file size in bytes (15MB)
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Supported image formats
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate uploaded image file
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    };
  }

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be a JPEG, PNG, or WebP image'
    };
  }

  return { valid: true };
}

/**
 * Convert file to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => reject(new Error('Failed to load image for dimension detection'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress image to reduce file size for API upload
 */
export function compressImage(file: File, maxSizeKB: number = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1920px width/height for API efficiency)
      const maxDimension = 1920;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Try different quality levels to meet size target
      let quality = 0.9;
      let dataUrl = '';

      const tryCompress = () => {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (dataUrl.length * 3) / 4 / 1024; // Estimate base64 size in KB

        if (sizeKB > maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          tryCompress();
        } else {
          resolve(dataUrl);
        }
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process uploaded file and create SourceImage
 */
export async function processImageFile(file: File): Promise<SourceImage> {
  log.info('Processing image file', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Get image dimensions first
    const dimensions = await getImageDimensions(file);

    // For larger files, use compression to stay under API limits
    let dataUrl: string;
    if (file.size > 5 * 1024 * 1024) { // Files larger than 5MB
      log.info('File is large, applying compression', { originalSize: file.size });
      dataUrl = await compressImage(file, 3000); // Target 3MB compressed (more aggressive)
    } else if (file.size > 3 * 1024 * 1024) { // Files larger than 3MB
      log.info('File is moderately large, applying light compression', { originalSize: file.size });
      dataUrl = await compressImage(file, 2000); // Target 2MB compressed
    } else {
      dataUrl = await fileToDataUrl(file);
    }

    const estimatedSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);

    // Warn if final size might be too large for some models
    if (estimatedSizeKB > 4000) { // > 4MB
      log.warn('Processed image is large and may be rejected by some models', {
        estimatedSizeKB,
        originalSize: file.size
      });
    }

    log.info('Image file processed successfully', {
      filename: file.name,
      originalSize: file.size,
      dimensions,
      dataUrlLength: dataUrl.length,
      estimatedSizeKB
    });

    return {
      url: dataUrl,
      file: file,
      filename: file.name,
      width: dimensions.width,
      height: dimensions.height
    };
  } catch (error) {
    log.error('Failed to process image file', { error, filename: file.name });
    throw new Error('Failed to process image file');
  }
}

/**
 * Create SourceImage from URL
 */
export function createSourceImageFromUrl(url: string): SourceImage {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  log.info('Creating source image from URL', { url });

  return {
    url: url,
    filename: url.split('/').pop() || 'image'
  };
}

/**
 * Get image format info from data URL
 */
export function getImageFormat(dataUrl: string): string {
  const matches = dataUrl.match(/^data:image\/([a-zA-Z]*);base64,/);
  return matches ? matches[1] : 'unknown';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}