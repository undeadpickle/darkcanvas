// Local storage utilities for DarkCanvas preferences
// Phase 4.0: Simple auto-download preference storage

export const STORAGE_KEYS = {
  AUTO_DOWNLOAD: 'darkcanvas_auto_download',
  USE_DIRECTORY_PICKER: 'darkcanvas_use_directory_picker',
  DIRECTORY_NAME: 'darkcanvas_directory_name'
} as const;

/**
 * Get the auto-download preference from localStorage
 * @returns boolean - true if auto-download is enabled, false otherwise
 */
export const getAutoDownloadPreference = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTO_DOWNLOAD) === 'true';
  } catch (error) {
    // Handle cases where localStorage is not available
    return false;
  }
};

/**
 * Set the auto-download preference in localStorage
 * @param enabled - whether auto-download should be enabled
 */
export const setAutoDownloadPreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_DOWNLOAD, String(enabled));
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Failed to save auto-download preference:', error);
  }
};

/**
 * Get whether to use directory picker instead of download dialog
 * @returns boolean - true if directory picker should be used
 */
export const getUseDirectoryPickerPreference = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.USE_DIRECTORY_PICKER) === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Set the directory picker preference
 * @param enabled - whether to use directory picker
 */
export const setUseDirectoryPickerPreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USE_DIRECTORY_PICKER, String(enabled));
  } catch (error) {
    console.warn('Failed to save directory picker preference:', error);
  }
};

/**
 * Get the saved directory name for display purposes
 * @returns string - the directory name or null
 */
export const getDirectoryName = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DIRECTORY_NAME);
  } catch (error) {
    return null;
  }
};

/**
 * Set the directory name for display purposes
 * @param name - the directory name
 */
export const setDirectoryName = (name: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DIRECTORY_NAME, name);
  } catch (error) {
    console.warn('Failed to save directory name:', error);
  }
};

/**
 * Clear directory-related preferences
 */
export const clearDirectoryPreferences = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USE_DIRECTORY_PICKER);
    localStorage.removeItem(STORAGE_KEYS.DIRECTORY_NAME);
  } catch (error) {
    console.warn('Failed to clear directory preferences:', error);
  }
};