import * as fal from "@fal-ai/serverless-client";
import { log } from "./logger";
import { DEFAULT_TEXT_TO_IMAGE_MODEL, getModelById } from "./models";
import type { SourceImage } from "@/types";

// Get API key from environment variable
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!apiKey || apiKey === 'your_fal_api_key_here') {
    throw new Error('Please set VITE_FAL_API_KEY in your .env file');
  }
  return apiKey;
}

// Configure fal client with API key from environment
// NOTE: For production, API calls should go through a backend proxy to keep credentials secure
// This client-side approach is acceptable for MVP/development but not recommended for production
export function configureFal() {
  const apiKey = getApiKey();
  fal.config({
    credentials: apiKey,
  });
  log.info('Fal.ai client configured from environment');
}

export interface GenerationRequest {
  prompt: string;
  modelId?: string;
  imageSize?: string;
  numImages?: number;
  enableSafetyChecker?: boolean;
  numInferenceSteps?: number;
  imageFormat?: string;
}

export interface ImageToImageRequest {
  prompt: string;
  sourceImage: SourceImage;
  modelId: string;
  strength?: number;
  imageSize?: string;
  numImages?: number;
  enableSafetyChecker?: boolean;
  numInferenceSteps?: number;
  imageFormat?: string;
}

export interface GenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  timings: Record<string, number>;
  seed: number;
}

// Generate image using specified model
export async function generateImage(request: GenerationRequest): Promise<GenerationResult> {
  // Ensure client is configured
  configureFal();

  const modelId = request.modelId || DEFAULT_TEXT_TO_IMAGE_MODEL.id;

  log.info('Starting image generation', {
    prompt: request.prompt,
    model: modelId
  });

  try {
    // Prepare input with base parameters
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      image_size: request.imageSize || "square_hd",
      num_images: request.numImages || 1,
      enable_safety_checker: false, // Always disabled for uncensored generation
      format: request.imageFormat || "png", // Always PNG format
      sync_mode: true,
    };

    // Add model-specific parameters
    if (modelId.includes('wan/v2.2')) {
      // WAN v2.2 specific parameters for optimal quality
      input.num_inference_steps = 27; // WAN needs 27 steps for proper quality
      input.guidance_scale = 3.5;
      input.guidance_scale_2 = 4;
      input.shift = 2;
      input.acceleration = "regular";
    } else {
      // For other models (SDXL-Lightning, SeedDream), use fast settings
      input.num_inference_steps = request.numInferenceSteps || 4;
    }

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        log.info('Queue update', update);
      },
    });

    // Log raw result to understand different model response structures
    log.info('Raw generation result', { result, model: modelId });

    const typedResult = result as GenerationResult;

    // Handle different response structures from different models
    if (!typedResult.images || !Array.isArray(typedResult.images)) {
      log.info('Converting response structure', {
        model: modelId,
        hasImages: !!typedResult.images,
        imagesType: typeof typedResult.images
      });

      // Try to find images in different possible locations
      const resultAny = result as Record<string, unknown>;
      let images: Array<{ url: string; width: number; height: number }> = [];

      if (resultAny.image) {
        // Handle single image object (WAN model format)
        if (typeof resultAny.image === 'object' && resultAny.image !== null && 'url' in resultAny.image) {
          const imageObj = resultAny.image as Record<string, unknown>;
          images = [{
            url: imageObj.url as string,
            width: (imageObj.width as number) || 1024,
            height: (imageObj.height as number) || 1024
          }];
        } else if (typeof resultAny.image === 'string') {
          // Handle single image URL string
          images = [{ url: resultAny.image, width: 1024, height: 1024 }];
        }
      } else if (resultAny.output) {
        // Handle output field
        const output = resultAny.output;
        if (Array.isArray(output)) {
          images = output.map(img =>
            typeof img === 'string' ? { url: img, width: 1024, height: 1024 } : img
          );
        } else if (typeof output === 'string') {
          images = [{ url: output, width: 1024, height: 1024 }];
        }
      } else if (resultAny.url) {
        // Handle direct URL field
        images = [{ url: resultAny.url as string, width: 1024, height: 1024 }];
      }

      if (images.length > 0) {
        typedResult.images = images;
        log.info('Converted response to expected format', { imageCount: images.length, model: modelId });
      } else {
        throw new Error(`Model ${modelId} returned unexpected response structure. Expected 'images' array but got: ${JSON.stringify(result)}`);
      }
    }

    log.info('Image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: modelId
    });

    return typedResult;
  } catch (error) {
    log.error('Image generation failed', { model: modelId, error });
    throw error;
  }
}

// Generate image from source image using specified model
export async function generateImageFromImage(request: ImageToImageRequest): Promise<GenerationResult> {
  // Ensure client is configured
  configureFal();

  const modelConfig = getModelById(request.modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${request.modelId}`);
  }

  log.info('Starting image-to-image generation', {
    prompt: request.prompt,
    model: request.modelId,
    sourceImageSize: request.sourceImage.file?.size,
    strength: request.strength
  });

  try {
    // Prepare input based on model's input format
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      enable_safety_checker: request.enableSafetyChecker ?? false,
      format: request.imageFormat || "png",
      sync_mode: true,
    };

    // Add image input based on model format
    if (modelConfig.inputFormat === 'image_url') {
      // Single image URL (WAN model)
      input.image_url = request.sourceImage.url;
      if (request.strength !== undefined) {
        input.strength = request.strength;
      }
    } else {
      // Array of image URLs (SeedDream, Nano-Banana)
      input.image_urls = [request.sourceImage.url];
    }

    // Add WAN v2.2 specific parameters (required for proper operation)
    if (request.modelId.includes('wan/v2.2')) {
      input.guidance_scale = 3.5;
      input.guidance_scale_2 = 4;
      input.shift = 2;
      input.acceleration = "regular";
      input.num_inference_steps = 27; // WAN needs higher steps than default 4
    }

    // Add optional parameters
    if (request.imageSize) {
      input.image_size = request.imageSize;
    }
    if (request.numImages) {
      input.num_images = request.numImages;
    }
    if (request.numInferenceSteps && !request.modelId.includes('wan/v2.2')) {
      // Only apply custom inference steps for non-WAN models
      input.num_inference_steps = request.numInferenceSteps;
    }

    const result = await fal.subscribe(request.modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        log.info('Queue update', update);
      },
    });

    // Log raw result to understand different model response structures
    log.info('Raw I2I generation result', { result, model: request.modelId });

    const typedResult = result as GenerationResult;

    // Handle different response structures from different models (reuse existing logic)
    if (!typedResult.images || !Array.isArray(typedResult.images)) {
      log.info('Converting I2I response structure', {
        model: request.modelId,
        hasImages: !!typedResult.images,
        imagesType: typeof typedResult.images
      });

      // Try to find images in different possible locations
      const resultAny = result as Record<string, unknown>;
      let images: Array<{ url: string; width: number; height: number }> = [];

      if (resultAny.image) {
        // Handle single image object (WAN model format)
        if (typeof resultAny.image === 'object' && resultAny.image !== null && 'url' in resultAny.image) {
          const imageObj = resultAny.image as Record<string, unknown>;
          images = [{
            url: imageObj.url as string,
            width: (imageObj.width as number) || 1024,
            height: (imageObj.height as number) || 1024
          }];
        } else if (typeof resultAny.image === 'string') {
          // Handle single image URL string
          images = [{ url: resultAny.image, width: 1024, height: 1024 }];
        }
      } else if (resultAny.output) {
        // Handle output field
        const output = resultAny.output;
        if (Array.isArray(output)) {
          images = output.map(img =>
            typeof img === 'string' ? { url: img, width: 1024, height: 1024 } : img
          );
        } else if (typeof output === 'string') {
          images = [{ url: output, width: 1024, height: 1024 }];
        }
      } else if (resultAny.url) {
        // Handle direct URL field
        images = [{ url: resultAny.url as string, width: 1024, height: 1024 }];
      }

      if (images.length > 0) {
        typedResult.images = images;
        log.info('Converted I2I response to expected format', { imageCount: images.length, model: request.modelId });
      } else {
        throw new Error(`Model ${request.modelId} returned unexpected response structure. Expected 'images' array but got: ${JSON.stringify(result)}`);
      }
    }

    log.info('Image-to-image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: request.modelId
    });

    return typedResult;
  } catch (error) {
    log.error('Image-to-image generation failed', { model: request.modelId, error });
    throw error;
  }
}

// Check if API key is configured
export function isConfigured(): boolean {
  try {
    getApiKey();
    return true;
  } catch {
    return false;
  }
}