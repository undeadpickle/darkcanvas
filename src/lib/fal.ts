import * as fal from "@fal-ai/serverless-client";
import { log } from "./logger";
import { DEFAULT_TEXT_TO_IMAGE_MODEL, getModelById } from "./models";
import type { SourceImage, OpenAIUsage } from "@/types";
import type { FalApiError, FalImageResponse, FalApiErrorDetail } from "./api-types";

// Get API key from environment variable
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!apiKey || apiKey === 'your_fal_api_key_here') {
    throw new Error('Please set VITE_FAL_API_KEY in your .env file');
  }
  return apiKey;
}

// Get OpenAI API key from environment variable (optional)
function getOpenAIApiKey(): string | null {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
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
  openaiApiKey?: string; // For BYOK models
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
  openaiApiKey?: string; // For BYOK models
}

export interface GenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  timings: Record<string, number>;
  seed: number;
  usage?: OpenAIUsage; // For BYOK models
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
    log.info('Starting generateImage function', { modelId, hasOpenAIKey: !!request.openaiApiKey });

    // Prepare input with base parameters
    let input: Record<string, unknown> = {
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
    } else if (modelId.includes('gpt-image-1')) {
      console.log('🔥 GPT IMAGE 1 DETECTED:', modelId);

      // GPT Image 1 specific parameters
      if (!request.openaiApiKey) {
        throw new Error('OpenAI API key is required for GPT Image 1 models');
      }

      console.log('🔑 OpenAI Key provided:', request.openaiApiKey ? 'YES' : 'NO');
      console.log('🔑 OpenAI Key length:', request.openaiApiKey?.length);
      console.log('🔑 OpenAI Key starts with sk-:', request.openaiApiKey?.startsWith('sk-'));
      console.log('📝 Prompt:', request.prompt);
      console.log('📝 Prompt length:', request.prompt?.length);

      // Validate OpenAI key format more strictly
      if (!request.openaiApiKey?.startsWith('sk-') || request.openaiApiKey.length < 40) {
        throw new Error('Invalid OpenAI API key format. Key must start with "sk-" and be at least 40 characters long.');
      }

      // Use absolute minimum required parameters only
      input = {
        prompt: request.prompt.trim(),
        openai_api_key: request.openaiApiKey.trim()
      };

      console.log('📦 Final GPT input:', JSON.stringify(input, null, 2));
    } else {
      // For other models (SDXL-Lightning, SeedDream), use fast settings
      input.num_inference_steps = request.numInferenceSteps || 4;
    }

    // Log the exact input being sent to fal.ai for debugging
    console.log('🚀 SENDING TO FAL.AI:', {
      modelId,
      input: JSON.stringify(input, null, 2)
    });

    console.log('🎯 Attempting fal.subscribe...');

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log('📊 Queue update:', update);
      },
    });

    console.log('✅ fal.subscribe completed:', result);

    // Log raw result to understand different model response structures
    console.log('📋 Raw result structure:', JSON.stringify(result, null, 2));

    const typedResult = result as GenerationResult;

    // Handle different response structures from different models
    if (!typedResult.images || !Array.isArray(typedResult.images)) {
      console.log('🔧 Converting response structure for', modelId);
      console.log('🔧 Original images field:', typedResult.images);
      console.log('🔧 Images type:', typeof typedResult.images);

      // Try to find images in different possible locations
      const resultAny = result as Record<string, unknown>;
      let images: Array<{ url: string; width: number; height: number }> = [];

      // Special handling for GPT models
      if (modelId.includes('gpt-image-1')) {
        console.log('🎨 Processing GPT Image 1 response');

        // GPT models should return { images: [{ url: "..." }], usage: {...} }
        if (resultAny.images && Array.isArray(resultAny.images)) {
          console.log('✅ Found GPT images array:', resultAny.images);
          images = resultAny.images.map((img: FalImageResponse | string) => ({
            url: typeof img === 'string' ? img : img.url,
            width: typeof img === 'string' ? 1024 : (img.width || 1024),
            height: typeof img === 'string' ? 1024 : (img.height || 1024)
          }));
        } else {
          console.log('❌ GPT images not found in expected format');
          console.log('🔍 Available fields:', Object.keys(resultAny));
        }
      } else {
        // Handle other model formats
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
      }

      if (images.length > 0) {
        typedResult.images = images;
        log.info('Converted response to expected format', { imageCount: images.length, model: modelId });
      } else {
        throw new Error(`Model ${modelId} returned unexpected response structure. Expected 'images' array but got: ${JSON.stringify(result)}`);
      }
    }

    // Extract usage information for GPT models
    if (modelId.includes('gpt-image-1')) {
      const resultAny = result as Record<string, unknown>;
      if (resultAny.usage) {
        typedResult.usage = resultAny.usage as OpenAIUsage;
        log.info('GPT model usage', { usage: typedResult.usage, model: modelId });
      }
    }

    log.info('Image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: modelId,
      hasUsage: !!typedResult.usage
    });

    return typedResult;
  } catch (error) {
    console.log('❌ Error in generateImage:', error);

    // Log more detailed error information
    log.error('Image generation failed', {
      model: modelId,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    // Enhanced error handling for OpenAI models
    if (modelId.includes('gpt-image-1')) {
      console.log('🔍 GPT model error - checking for specific error types');

      // Check if error is a fal.ai API error with response details
      const typedError = error as FalApiError;
      if (typedError.body || (typedError as any).response) {
        try {
          const responseBody = typedError.body || (typedError as any).response;
          let parsedError;

          if (typeof responseBody === 'string') {
            parsedError = JSON.parse(responseBody);
          } else {
            parsedError = responseBody;
          }

          console.log('📊 Parsed error response:', parsedError);

          // Check for organization verification error
          if (parsedError.detail && Array.isArray(parsedError.detail)) {
            const orgError = parsedError.detail.find((d: FalApiErrorDetail) =>
              d.msg && d.msg.includes('organization must be verified')
            );

            if (orgError) {
              const enhancedMessage = `OpenAI Organization Verification Required: ${orgError.msg}`;
              throw new Error(enhancedMessage);
            }

            // Handle other detailed errors
            const firstError = parsedError.detail[0];
            if (firstError && firstError.msg) {
              throw new Error(`OpenAI API Error: ${firstError.msg}`);
            }
          }
        } catch (parseError) {
          console.log('📊 Could not parse error response:', parseError);
        }
      }

      // Try to extract any partial result data if available
      if ((typedError as any).data || (typedError as any).result) {
        console.log('📊 Error contains data:', (typedError as any).data || (typedError as any).result);
      }
    }

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

    // Add model-specific parameters
    if (request.modelId.includes('wan/v2.2')) {
      // WAN v2.2 specific parameters (required for proper operation)
      input.guidance_scale = 3.5;
      input.guidance_scale_2 = 4;
      input.shift = 2;
      input.acceleration = "regular";
      input.num_inference_steps = 27; // WAN needs higher steps than default 4
    } else if (request.modelId.includes('gpt-image-1')) {
      // GPT Image 1 Edit specific parameters
      if (!request.openaiApiKey) {
        throw new Error('OpenAI API key is required for GPT Image 1 models');
      }

      // Map aspect ratios to GPT sizes
      const gptSizeMap: Record<string, string> = {
        'square_hd': '1024x1024',
        'landscape_4_3': '1536x1024',
        'landscape_16_9': 'auto',
        'portrait_4_3': '1024x1536',
        'portrait_16_9': 'auto',
      };

      // The GPT edit model uses image_urls (array) format
      // Ensure we use the correct format regardless of what was set earlier
      if (input.image_url) {
        delete input.image_url;
      }
      input.image_urls = [request.sourceImage.url];

      input.image_size = gptSizeMap[request.imageSize || 'square_hd'] || 'auto';
      input.num_images = request.numImages || 1;
      input.quality = 'auto';
      input.input_fidelity = 'low'; // Default to low for more creative edits
      input.openai_api_key = request.openaiApiKey;
    }

    // Add optional parameters (only for non-GPT models since GPT has different size mapping)
    if (request.imageSize && !request.modelId.includes('gpt-image-1')) {
      input.image_size = request.imageSize;
    }
    if (request.numImages) {
      input.num_images = request.numImages;
    }
    if (request.numInferenceSteps && !request.modelId.includes('wan/v2.2') && !request.modelId.includes('gpt-image-1')) {
      // Only apply custom inference steps for non-WAN and non-GPT models
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

    // Extract usage information for GPT models
    if (request.modelId.includes('gpt-image-1')) {
      const resultAny = result as Record<string, unknown>;
      if (resultAny.usage) {
        typedResult.usage = resultAny.usage as OpenAIUsage;
        log.info('GPT model I2I usage', { usage: typedResult.usage, model: request.modelId });
      }
    }

    log.info('Image-to-image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: request.modelId,
      hasUsage: !!typedResult.usage
    });

    return typedResult;
  } catch (error) {
    log.error('Image-to-image generation failed', { model: request.modelId, error });

    // Enhanced error handling for OpenAI models
    if (request.modelId.includes('gpt-image-1')) {
      console.log('🔍 GPT I2I model error - checking for specific error types');

      // Check if error is a fal.ai API error with response details
      const typedError = error as FalApiError;
      if (typedError.body || (typedError as any).response) {
        try {
          const responseBody = typedError.body || (typedError as any).response;
          let parsedError;

          if (typeof responseBody === 'string') {
            parsedError = JSON.parse(responseBody);
          } else {
            parsedError = responseBody;
          }

          console.log('📊 Parsed I2I error response:', parsedError);

          // Check for organization verification error
          if (parsedError.detail && Array.isArray(parsedError.detail)) {
            const orgError = parsedError.detail.find((d: FalApiErrorDetail) =>
              d.msg && d.msg.includes('organization must be verified')
            );

            if (orgError) {
              const enhancedMessage = `OpenAI Organization Verification Required: ${orgError.msg}`;
              throw new Error(enhancedMessage);
            }

            // Handle other detailed errors
            const firstError = parsedError.detail[0];
            if (firstError && firstError.msg) {
              throw new Error(`OpenAI API Error: ${firstError.msg}`);
            }
          }
        } catch (parseError) {
          console.log('📊 Could not parse I2I error response:', parseError);
        }
      }
    }

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

// Get OpenAI API key from environment (returns null if not set)
export function getOpenAIKeyFromEnv(): string | null {
  return getOpenAIApiKey();
}