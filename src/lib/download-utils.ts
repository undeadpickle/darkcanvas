// Download utilities for DarkCanvas
// Phase 4.0: Simple auto-download functionality

import { log } from './logger';

/**
 * Download an image with a descriptive filename
 * @param url - The image URL to download
 * @param prompt - The prompt used to generate the image
 * @param modelId - The model ID used for generation
 */
export const downloadImage = async (
  url: string,
  prompt: string,
  modelId: string
): Promise<void> => {
  try {
    // Create descriptive filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const cleanPrompt = prompt.slice(0, 30).replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
    const modelName = modelId.split('/').pop() || 'unknown';
    const filename = `darkcanvas_${modelName}_${cleanPrompt}_${timestamp}.png`;

    log.info('Downloading image', { filename, url: url.substring(0, 50) + '...' });

    // Create and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    log.info('Image download triggered successfully', { filename });
  } catch (error) {
    log.error('Failed to download image', { error, url, prompt, modelId });
    throw error;
  }
};

/**
 * Download multiple images in sequence
 * @param images - Array of image objects with url property
 * @param prompt - The prompt used to generate the images
 * @param modelId - The model ID used for generation
 */
export const downloadImages = async (
  images: Array<{ url: string }>,
  prompt: string,
  modelId: string
): Promise<void> => {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const indexedPrompt = images.length > 1 ? `${prompt}_${i + 1}` : prompt;
    await downloadImage(image.url, indexedPrompt, modelId);

    // Small delay between downloads to avoid overwhelming the browser
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

/**
 * Download a video with a descriptive filename
 * @param url - The video URL to download
 * @param prompt - The prompt used to generate the video
 * @param modelId - The model ID used for generation
 * @param video - The video metadata for filename generation
 */
export const downloadVideoWithFilename = async (
  url: string,
  prompt: string,
  modelId: string,
  video: { duration: string; resolution: string; aspectRatio: string }
): Promise<void> => {
  try {
    // Create descriptive filename using same pattern as images but with video metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const cleanPrompt = prompt.slice(0, 30).replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
    const modelName = modelId.split('/').pop() || 'unknown';
    const filename = `darkcanvas_${modelName}_${cleanPrompt}_${video.duration}_${video.resolution}_${timestamp}.mp4`;

    log.info('Downloading video', { filename, url: url.substring(0, 50) + '...' });

    // Create and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    log.info('Video download triggered successfully', { filename });
  } catch (error) {
    log.error('Failed to download video', { error, url, prompt, modelId });
    throw error;
  }
};

/**
 * Download multiple videos in sequence
 * @param videos - Array of video objects with url, duration, resolution, aspectRatio properties
 * @param prompt - The prompt used to generate the videos
 * @param modelId - The model ID used for generation
 */
export const downloadVideos = async (
  videos: Array<{ url: string; duration: string; resolution: string; aspectRatio: string }>,
  prompt: string,
  modelId: string
): Promise<void> => {
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const indexedPrompt = videos.length > 1 ? `${prompt}_${i + 1}` : prompt;
    await downloadVideoWithFilename(video.url, indexedPrompt, modelId, video);

    // Small delay between downloads to avoid overwhelming the browser
    if (i < videos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};