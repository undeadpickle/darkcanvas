// Image upload and processing utilities for DarkCanvas Image-to-Image
import { log } from './logger';
import type { SourceImage } from '@/types';

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
    // Convert to data URL for immediate preview and API use
    const dataUrl = await fileToDataUrl(file);

    log.info('Image file processed successfully', {
      filename: file.name,
      dataUrlLength: dataUrl.length
    });

    return {
      url: dataUrl,
      file: file,
      filename: file.name
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