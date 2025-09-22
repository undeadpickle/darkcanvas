import { log } from './logger';
import type { GeneratedVideo } from '@/types';

/**
 * Download a video file from a URL
 */
export async function downloadVideo(url: string, filename: string = 'video.mp4'): Promise<void> {
  try {
    log.info('Starting video download', { url, filename });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(downloadUrl);

    log.info('Video download completed', { filename });
  } catch (error) {
    log.error('Video download failed', { error, url, filename });
    throw error;
  }
}

/**
 * Download multiple videos as a zip (future enhancement)
 */
export async function downloadVideos(videos: { url: string; filename: string }[]): Promise<void> {
  // For now, download individually
  for (const video of videos) {
    await downloadVideo(video.url, video.filename);
  }
}

/**
 * Calculate estimated video cost based on duration and audio setting
 */
export function calculateVideoCost(duration: string, hasAudio: boolean): { min: number; max: number } {
  const seconds = parseInt(duration);
  const basePerSecond = hasAudio ? 0.12 : 0.08; // $0.08-0.12/second with audio, 33% less without
  const minPerSecond = hasAudio ? 0.08 : 0.05;

  return {
    min: Math.round(minPerSecond * seconds * 100) / 100,
    max: Math.round(basePerSecond * seconds * 100) / 100
  };
}

/**
 * Format video duration from seconds string to readable format
 */
export function formatVideoDuration(duration: string): string {
  const seconds = parseInt(duration);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get video metadata from URL (basic info)
 */
export async function getVideoMetadata(url: string): Promise<{ size?: number; type?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });

    const size = response.headers.get('content-length');
    const type = response.headers.get('content-type');

    return {
      size: size ? parseInt(size) : undefined,
      type: type || undefined
    };
  } catch (error) {
    log.warn('Failed to get video metadata', { error, url });
    return {};
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Generate filename for video download
 */
export function generateVideoFilename(
  prompt: string,
  generationId: string,
  video: GeneratedVideo
): string {
  // Clean prompt for filename
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const duration = video.duration;
  const resolution = video.resolution;
  const shortId = generationId.substring(-8); // Last 8 chars of generation ID

  return `darkcanvas-${cleanPrompt}-${duration}-${resolution}-${shortId}-${timestamp}.mp4`;
}

/**
 * Copy video URL to clipboard
 */
export async function copyVideoUrlToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    log.info('Video URL copied to clipboard', { url });
  } catch (error) {
    log.error('Failed to copy video URL', { error, url });
    throw new Error('Failed to copy URL to clipboard');
  }
}

/**
 * Check if browser supports video format
 */
export function isVideoFormatSupported(mimeType: string): boolean {
  const video = document.createElement('video');
  return video.canPlayType(mimeType) !== '';
}

/**
 * Validate video URL
 */
export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Preload video for better playback experience
 */
export function preloadVideo(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      log.info('Video preloaded successfully', { url });
      resolve();
    };

    video.onerror = () => {
      log.error('Video preload failed', { url });
      reject(new Error('Failed to preload video'));
    };

    video.src = url;
  });
}