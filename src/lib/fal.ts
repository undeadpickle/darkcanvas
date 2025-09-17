import * as fal from "@fal-ai/serverless-client";
import { log } from "./logger";

// Get API key from environment variable
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!apiKey || apiKey === 'your_fal_api_key_here') {
    throw new Error('Please set VITE_FAL_API_KEY in your .env file');
  }
  return apiKey;
}

// Configure fal client with API key from environment
export function configureFal() {
  const apiKey = getApiKey();
  fal.config({
    credentials: apiKey,
  });
  log.info('Fal.ai client configured from environment');
}

// SDXL-Lightning model configuration (cheapest for testing)
const SDXL_LIGHTNING_MODEL = "fal-ai/fast-lightning-sdxl";

export interface GenerationRequest {
  prompt: string;
  imageSize?: string;
  numImages?: number;
  safetyChecker?: boolean;
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

// Generate image using SDXL-Lightning
export async function generateImage(request: GenerationRequest): Promise<GenerationResult> {
  // Ensure client is configured
  configureFal();

  log.info('Starting image generation', { prompt: request.prompt });

  try {
    const result = await fal.subscribe(SDXL_LIGHTNING_MODEL, {
      input: {
        prompt: request.prompt,
        image_size: request.imageSize || "square_hd", // 1024x1024
        num_images: request.numImages || 1,
        safety_checker: request.safetyChecker ?? true,
        sync_mode: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        log.info('Queue update', update);
      },
    });

    const typedResult = result as GenerationResult;

    log.info('Image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed
    });

    return typedResult;
  } catch (error) {
    log.error('Image generation failed', error);
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