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