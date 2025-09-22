// File System Access API utilities for DarkCanvas
// Phase 4.1: Enhanced auto-save with folder selection

import { log } from './logger';
import {
  saveDirectoryHandle,
  getDirectoryHandle,
  getDirectoryMetadata,
  checkDirectoryPermission,
  requestDirectoryPermission,
  clearDirectoryHandle,
  isFileSystemAccessSupported,
  type DirectoryMetadata
} from './directory-storage';
import {
  setUseDirectoryPickerPreference,
  setDirectoryName,
  clearDirectoryPreferences
} from './storage';

export { isFileSystemAccessSupported };

/**
 * Show directory picker and save the selected directory
 * @returns Promise<string | null> - Directory name if successful, null if cancelled
 */
export async function selectSaveDirectory(): Promise<string | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported');
  }

  try {
    // Show directory picker
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });

    // Request permission immediately
    const permission = await dirHandle.requestPermission({ mode: 'readwrite' });

    if (permission !== 'granted') {
      log.warn('Directory permission not granted', { permission });
      return null;
    }

    // Save the directory handle
    await saveDirectoryHandle(dirHandle);

    // Save preferences
    setUseDirectoryPickerPreference(true);
    setDirectoryName(dirHandle.name);

    log.info('Directory selected successfully', {
      name: dirHandle.name,
      permission
    });

    return dirHandle.name;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      log.info('Directory selection cancelled by user');
      return null;
    }

    log.error('Failed to select directory', { error });
    throw error;
  }
}

/**
 * Get information about the currently selected directory
 */
export async function getCurrentDirectoryInfo(): Promise<{
  name: string | null;
  hasPermission: boolean;
  permissionState: PermissionState | null;
} | null> {
  try {
    const metadata = await getDirectoryMetadata();
    if (!metadata) {
      return null;
    }

    const permission = await checkDirectoryPermission();

    return {
      name: metadata.name,
      hasPermission: permission === 'granted',
      permissionState: permission
    };
  } catch (error) {
    log.error('Failed to get directory info', { error });
    return null;
  }
}

/**
 * Ensure we have permission for the selected directory
 * @returns Promise<boolean> - true if permission granted
 */
export async function ensureDirectoryPermission(): Promise<boolean> {
  try {
    const permission = await checkDirectoryPermission();

    if (permission === 'granted') {
      return true;
    }

    if (permission === 'prompt') {
      const newPermission = await requestDirectoryPermission();
      return newPermission === 'granted';
    }

    // Permission denied
    return false;
  } catch (error) {
    log.error('Failed to ensure directory permission', { error });
    return false;
  }
}

/**
 * Save an image to the selected directory
 * @param imageUrl - URL of the image to save
 * @param filename - Name to save the file as
 * @returns Promise<boolean> - true if successful
 */
export async function saveImageToDirectory(
  imageUrl: string,
  filename: string
): Promise<boolean> {
  try {
    const dirHandle = await getDirectoryHandle();
    if (!dirHandle) {
      throw new Error('No directory selected');
    }

    // Ensure we have permission
    const hasPermission = await ensureDirectoryPermission();
    if (!hasPermission) {
      throw new Error('No permission to write to directory');
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBlob = await response.blob();

    // Create file handle
    const fileHandle = await dirHandle.getFileHandle(filename, {
      create: true
    });

    // Write the image
    const writable = await fileHandle.createWritable();
    await writable.write(imageBlob);
    await writable.close();

    log.info('Image saved to directory successfully', {
      filename,
      directory: dirHandle.name,
      size: imageBlob.size
    });

    return true;
  } catch (error) {
    log.error('Failed to save image to directory', { error, filename });
    return false;
  }
}

/**
 * Save multiple images to the selected directory
 * @param images - Array of image objects with url property
 * @param prompt - The prompt used for naming
 * @param modelId - The model ID used for naming
 * @returns Promise<number> - Number of images successfully saved
 */
export async function saveImagesToDirectory(
  images: Array<{ url: string }>,
  prompt: string,
  modelId: string
): Promise<number> {
  let successCount = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Create filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const cleanPrompt = prompt.slice(0, 30).replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
    const modelName = modelId.split('/').pop() || 'unknown';
    const indexSuffix = images.length > 1 ? `_${i + 1}` : '';
    const filename = `darkcanvas_${modelName}_${cleanPrompt}${indexSuffix}_${timestamp}.png`;

    const success = await saveImageToDirectory(image.url, filename);
    if (success) {
      successCount++;
    }

    // Small delay between saves
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return successCount;
}

/**
 * Clear the selected directory and reset to download mode
 */
export async function clearSelectedDirectory(): Promise<void> {
  try {
    await clearDirectoryHandle();
    clearDirectoryPreferences();

    log.info('Selected directory cleared');
  } catch (error) {
    log.error('Failed to clear selected directory', { error });
    throw error;
  }
}

/**
 * Check if we have a valid directory selected and ready to use
 */
export async function isDirectoryReady(): Promise<boolean> {
  try {
    const handle = await getDirectoryHandle();
    if (!handle) {
      return false;
    }

    const permission = await checkDirectoryPermission();
    return permission === 'granted';
  } catch (error) {
    log.error('Failed to check if directory is ready', { error });
    return false;
  }
}