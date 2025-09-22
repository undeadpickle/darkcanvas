// Local storage utilities for DarkCanvas preferences
// Phase 4.0: Simple auto-download preference storage

export const STORAGE_KEYS = {
  AUTO_DOWNLOAD: 'darkcanvas_auto_download',
  USE_DIRECTORY_PICKER: 'darkcanvas_use_directory_picker',
  DIRECTORY_NAME: 'darkcanvas_directory_name',
  VIDEO_GENERATION_PREFERENCES: 'darkcanvas_video_generation_preferences',
  VIDEO_HISTORY: 'darkcanvas_video_history'
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

// Video-specific storage utilities

export interface VideoGenerationPreferences {
  duration: '4s' | '6s' | '8s';
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  generateAudio: boolean;
  enhancePrompt: boolean;
  autoFix: boolean;
}

export interface VideoHistoryItem {
  id: string;
  prompt: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  aspectRatio: string;
  createdAt: string;
}

/**
 * Get video generation preferences from localStorage
 */
export const getVideoGenerationPreferences = (): VideoGenerationPreferences | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VIDEO_GENERATION_PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load video generation preferences:', error);
    return null;
  }
};

/**
 * Set video generation preferences in localStorage
 */
export const setVideoGenerationPreferences = (preferences: VideoGenerationPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.VIDEO_GENERATION_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save video generation preferences:', error);
  }
};

/**
 * Get video history from localStorage
 */
export const getVideoHistory = (): VideoHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VIDEO_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load video history:', error);
    return [];
  }
};

/**
 * Add a video to history
 */
export const saveVideoToHistory = (video: VideoHistoryItem): void => {
  try {
    const history = getVideoHistory();

    // Add new video to beginning of array
    history.unshift(video);

    // Keep only the last 50 videos
    const trimmedHistory = history.slice(0, 50);

    localStorage.setItem(STORAGE_KEYS.VIDEO_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.warn('Failed to save video to history:', error);
  }
};

/**
 * Clear video history
 */
export const clearVideoHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.VIDEO_HISTORY);
  } catch (error) {
    console.warn('Failed to clear video history:', error);
  }
};

/**
 * Remove a specific video from history
 */
export const removeVideoFromHistory = (videoId: string): void => {
  try {
    const history = getVideoHistory();
    const filteredHistory = history.filter(item => item.id !== videoId);
    localStorage.setItem(STORAGE_KEYS.VIDEO_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.warn('Failed to remove video from history:', error);
  }
};