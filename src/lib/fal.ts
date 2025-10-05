import * as fal from "@fal-ai/serverless-client";
import { log } from "./logger";
import { DEFAULT_TEXT_TO_IMAGE_MODEL, getModelById, getDimensionsFromAspectRatio, getValidDimensions, getGPTCompatibleSize } from "./models";
import type { SourceImage, OpenAIUsage, GeneratedVideo, VideoGenerationSettings } from "@/types";
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

// Get correct dimensions for aspect ratio, with fallback to portrait
function getCorrectDimensions(aspectRatio?: string): { width: number; height: number } {
  if (aspectRatio) {
    return getDimensionsFromAspectRatio(aspectRatio);
  }
  return { width: 1080, height: 1920 }; // Default to portrait 9:16
}

// Prepare image_size parameter based on model capabilities
function prepareImageSize(modelId: string, request: GenerationRequest | ImageToImageRequest): unknown {
  // Nano-Banana: Don't send image_size at all (uses source image dimensions)
  if (modelId.includes('nano-banana')) {
    return undefined;
  }

  // OpenAI models: Use preset strings only
  if (modelId.includes('gpt-image-1')) {
    return getGPTCompatibleSize(request.imageSize || 'square_hd');
  }

  // Models with custom dimension support (SDXL-Lightning, SeedDream)
  if (request.customDimensions) {
    // Apply model-specific constraints
    const validDimensions = getValidDimensions(modelId, request.customDimensions);
    return validDimensions;
  }

  // Fallback to preset string
  return request.imageSize || 'square_hd';
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
  customDimensions?: { width: number; height: number }; // Custom resolution
  numImages?: number;
  enableSafetyChecker?: boolean;
  numInferenceSteps?: number;
  imageFormat?: string;
  openaiApiKey?: string; // For BYOK models
  aspectRatio?: string; // To track the aspect ratio used during generation
  seed?: number; // For reproducible results (0-2147483647)
  negativePrompt?: string; // Content to avoid in generation
}

export interface ImageToImageRequest {
  prompt: string;
  sourceImage: SourceImage;
  modelId: string;
  strength?: number;
  imageSize?: string;
  customDimensions?: { width: number; height: number }; // Custom resolution
  numImages?: number;
  enableSafetyChecker?: boolean;
  numInferenceSteps?: number;
  imageFormat?: string;
  openaiApiKey?: string; // For BYOK models
  aspectRatio?: string; // To track the aspect ratio used during generation
  seed?: number; // For reproducible results (0-2147483647)
  negativePrompt?: string; // Content to avoid in generation
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
  aspectRatio?: string; // The aspect ratio used during generation
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
      num_images: request.numImages || 1,
      enable_safety_checker: false, // Always disabled for uncensored generation
      format: request.imageFormat || "png", // Always PNG format
      sync_mode: true,
    };

    // Add universal optional parameters
    if (request.seed !== undefined) {
      input.seed = request.seed;
    }
    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt;
    }

    // Set image_size based on model capabilities
    const imageSize = prepareImageSize(modelId, request);
    if (imageSize !== undefined) {
      input.image_size = imageSize;
    }

    // Add model-specific parameters
    if (modelId.includes('wan/v2.2')) {
      // WAN v2.2 specific parameters for optimal quality
      input.num_inference_steps = 27; // WAN needs 27 steps for proper quality
      input.guidance_scale = 3.5;
      input.guidance_scale_2 = 4;
      input.shift = 2;
      input.acceleration = "regular";
    } else if (modelId.includes('gpt-image-1')) {
      log.info('GPT IMAGE 1 model detected', { modelId });

      // GPT Image 1 specific parameters
      if (!request.openaiApiKey) {
        throw new Error('OpenAI API key is required for GPT Image 1 models');
      }

      log.info('OpenAI API key validation', {
        hasKey: !!request.openaiApiKey,
        keyLength: request.openaiApiKey?.length,
        validFormat: request.openaiApiKey?.startsWith('sk-'),
        promptLength: request.prompt?.length
      });

      // Validate OpenAI key format more strictly
      if (!request.openaiApiKey?.startsWith('sk-') || request.openaiApiKey.length < 40) {
        throw new Error('Invalid OpenAI API key format. Key must start with "sk-" and be at least 40 characters long.');
      }

      // Use GPT-specific parameters (image_size already set by prepareImageSize)
      input = {
        prompt: request.prompt.trim(),
        openai_api_key: request.openaiApiKey.trim(),
        image_size: input.image_size || 'auto' // Use the size set by prepareImageSize
      };

      log.info('GPT model input prepared', { inputKeys: Object.keys(input) });
    } else {
      // For other models (SDXL-Lightning, SeedDream), use fast settings
      input.num_inference_steps = request.numInferenceSteps || 4;
    }

    // Log generation request details
    log.info('Starting fal.ai API request', {
      modelId,
      customDimensions: request.customDimensions,
      aspectRatio: request.aspectRatio,
      seed: input.seed,
      negative_prompt: input.negative_prompt,
      fullInput: input
    });

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        log.info('Generation queue update', update);
      },
    });

    log.info('Generation completed', { hasResult: !!result, model: modelId });

    const typedResult = result as GenerationResult;

    // Always ensure images have dimensions (handles SeedDream and other models)
    if (typedResult.images && Array.isArray(typedResult.images)) {
      const correctDimensions = getCorrectDimensions(request.aspectRatio);
      typedResult.images = typedResult.images.map(img => ({
        url: typeof img === 'string' ? img : img.url,
        width: img.width || correctDimensions.width,
        height: img.height || correctDimensions.height
      }));
    }

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

      // Special handling for GPT models
      if (modelId.includes('gpt-image-1')) {
        log.info('Processing GPT Image 1 response');

        // GPT models should return { images: [{ url: "..." }], usage: {...} }
        if (resultAny.images && Array.isArray(resultAny.images)) {
          log.info('Found GPT images array', { imageCount: resultAny.images.length });
          const correctDimensions = getCorrectDimensions(request.aspectRatio);
          images = resultAny.images.map((img: FalImageResponse | string) => ({
            url: typeof img === 'string' ? img : img.url,
            width: typeof img === 'string' ? correctDimensions.width : (img.width || correctDimensions.width),
            height: typeof img === 'string' ? correctDimensions.height : (img.height || correctDimensions.height)
          }));
        } else {
          log.warn('GPT images not found in expected format', { availableFields: Object.keys(resultAny) });
        }
      } else {
        // Handle other model formats
        const correctDimensions = getCorrectDimensions(request.aspectRatio);
        if (resultAny.image) {
          // Handle single image object (WAN model format)
          if (typeof resultAny.image === 'object' && resultAny.image !== null && 'url' in resultAny.image) {
            const imageObj = resultAny.image as Record<string, unknown>;
            images = [{
              url: imageObj.url as string,
              width: (imageObj.width as number) || correctDimensions.width,
              height: (imageObj.height as number) || correctDimensions.height
            }];
          } else if (typeof resultAny.image === 'string') {
            // Handle single image URL string
            images = [{ url: resultAny.image, width: correctDimensions.width, height: correctDimensions.height }];
          }
        } else if (resultAny.output) {
        // Handle output field
        const output = resultAny.output;
        if (Array.isArray(output)) {
          images = output.map(img =>
            typeof img === 'string' ? { url: img, width: correctDimensions.width, height: correctDimensions.height } : img
          );
        } else if (typeof output === 'string') {
          images = [{ url: output, width: correctDimensions.width, height: correctDimensions.height }];
        }
        } else if (resultAny.url) {
          // Handle direct URL field
          images = [{ url: resultAny.url as string, width: correctDimensions.width, height: correctDimensions.height }];
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

    // Include the aspect ratio used for generation
    if (request.aspectRatio) {
      typedResult.aspectRatio = request.aspectRatio;
    }

    log.info('Image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: modelId,
      hasUsage: !!typedResult.usage,
      aspectRatio: typedResult.aspectRatio
    });

    return typedResult;
  } catch (error) {
    log.error('Generation error occurred', { error: error instanceof Error ? error.message : String(error) });

    // Log more detailed error information
    log.error('Image generation failed', {
      model: modelId,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    // Enhanced error handling for OpenAI models
    if (modelId.includes('gpt-image-1')) {
      log.info('Analyzing GPT model error for specific error types');

      // Check if error is a fal.ai API error with response details
      const typedError = error as FalApiError;
      if (typedError.body || typedError.response) {
        try {
          const responseBody = typedError.body || typedError.response;
          let parsedError;

          if (typeof responseBody === 'string') {
            parsedError = JSON.parse(responseBody);
          } else {
            parsedError = responseBody;
          }

          log.info('Parsed API error response', { errorDetails: parsedError });

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
          log.warn('Could not parse error response', { parseError });
        }
      }

      // Try to extract any partial result data if available
      if (typedError.data || typedError.result) {
        log.info('Error contains partial data', { data: typedError.data || typedError.result });
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
      sync_mode: true,
    };

    // Add universal optional parameters
    if (request.seed !== undefined) {
      input.seed = request.seed;
    }
    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt;
    }

    // Add format parameter (FLUX uses output_format, others use format)
    if (request.modelId.includes('flux')) {
      input.output_format = request.imageFormat || "png";
    } else {
      input.format = request.imageFormat || "png";
    }

    // Add image input based on model format
    if (modelConfig.inputFormat === 'image_url') {
      // Single image URL (FLUX, WAN models)
      input.image_url = request.sourceImage.url;
      if (request.strength !== undefined) {
        input.strength = request.strength;
      }
    } else {
      // Array of image URLs (SeedDream, Nano-Banana)
      input.image_urls = [request.sourceImage.url];
      // Add strength for models that support it (e.g., SeedDream Edit)
      if (request.strength !== undefined) {
        input.strength = request.strength;
      }
    }

    // Add model-specific parameters
    if (request.modelId.includes('flux')) {
      // FLUX specific parameters - using documented defaults for optimal quality
      input.num_inference_steps = request.numInferenceSteps || 40; // Official default (was 28)
      input.guidance_scale = 4.5; // Official default (was 3.5)

      // Quality guard negative prompt - prevents grainy/compressed artifacts
      input.negative_prompt = "low quality, blurry, grainy, distorted, artifacts, compression";

      // strength already set above if provided

      // Set image_size for aspect ratio support
      const imageSize = prepareImageSize(request.modelId, request);
      if (imageSize !== undefined) {
        input.image_size = imageSize;
      }
    } else if (request.modelId.includes('qwen-image-edit-plus-lora')) {
      // Qwen Edit Plus LoRA specific parameters
      // Using "High Quality (Best)" preset from docs for better image quality
      input.num_inference_steps = request.numInferenceSteps || 35; // High quality (vs 28 default)
      input.guidance_scale = 5; // Sharper prompt adherence (vs 4 default)
      input.enable_safety_checker = false; // ALWAYS disabled for uncensored content
      input.output_format = request.imageFormat || "png"; // png or jpeg

      // Quality guard negative prompt - prevents grainy/compressed artifacts
      input.negative_prompt = "low quality, blurry, distorted, artifacts, compression";

      // Set image_size for aspect ratio support
      const imageSize = prepareImageSize(request.modelId, request);
      if (imageSize !== undefined) {
        input.image_size = imageSize;
      }

      // Note: Additional optional parameters available but not exposed in UI:
      // - num_images: 1-4 (batch generation) - already handled above
      // - seed: integer (reproducibility) - could add seed tracking
      // - loras: array (up to 3 custom LoRAs) - advanced feature for future
    } else if (request.modelId.includes('wan/v2.2')) {
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


      // The GPT edit model uses image_urls (array) format
      // Ensure we use the correct format regardless of what was set earlier
      if (input.image_url) {
        delete input.image_url;
      }
      input.image_urls = [request.sourceImage.url];

      input.num_images = request.numImages || 1;
      input.quality = 'auto';
      input.input_fidelity = 'low'; // Default to low for more creative edits
      input.openai_api_key = request.openaiApiKey;

      // Use GPT-specific size mapping
      input.image_size = getGPTCompatibleSize(request.imageSize || 'square_hd');
    } else {
      // For non-GPT models, use the universal image_size preparation
      const imageSize = prepareImageSize(request.modelId, request);
      if (imageSize !== undefined) {
        input.image_size = imageSize;
      }
    }
    if (request.numImages) {
      input.num_images = request.numImages;
    }
    if (request.numInferenceSteps && !request.modelId.includes('wan/v2.2') && !request.modelId.includes('gpt-image-1')) {
      // Only apply custom inference steps for non-WAN and non-GPT models
      input.num_inference_steps = request.numInferenceSteps;
    }

    // Log I2I request details with all parameters
    log.info('Starting fal.ai I2I API request', {
      modelId: request.modelId,
      strength: input.strength,
      seed: input.seed,
      negative_prompt: input.negative_prompt,
      fullInput: input
    });

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

    // Always ensure images have dimensions (handles SeedDream and other models)
    if (typedResult.images && Array.isArray(typedResult.images)) {
      const correctDimensions = getCorrectDimensions(request.aspectRatio);
      typedResult.images = typedResult.images.map(img => ({
        url: typeof img === 'string' ? img : img.url,
        width: img.width || correctDimensions.width,
        height: img.height || correctDimensions.height
      }));
    }

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

      const correctDimensions = getCorrectDimensions(request.aspectRatio);
      if (resultAny.image) {
        // Handle single image object (WAN model format)
        if (typeof resultAny.image === 'object' && resultAny.image !== null && 'url' in resultAny.image) {
          const imageObj = resultAny.image as Record<string, unknown>;
          images = [{
            url: imageObj.url as string,
            width: (imageObj.width as number) || correctDimensions.width,
            height: (imageObj.height as number) || correctDimensions.height
          }];
        } else if (typeof resultAny.image === 'string') {
          // Handle single image URL string
          images = [{ url: resultAny.image, width: correctDimensions.width, height: correctDimensions.height }];
        }
      } else if (resultAny.output) {
        // Handle output field
        const output = resultAny.output;
        if (Array.isArray(output)) {
          images = output.map(img =>
            typeof img === 'string' ? { url: img, width: correctDimensions.width, height: correctDimensions.height } : img
          );
        } else if (typeof output === 'string') {
          images = [{ url: output, width: correctDimensions.width, height: correctDimensions.height }];
        }
      } else if (resultAny.url) {
        // Handle direct URL field
        images = [{ url: resultAny.url as string, width: correctDimensions.width, height: correctDimensions.height }];
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

    // Include the aspect ratio used for generation
    if (request.aspectRatio) {
      typedResult.aspectRatio = request.aspectRatio;
    }

    log.info('Image-to-image generation completed', {
      imageCount: typedResult.images?.length || 0,
      seed: typedResult.seed,
      model: request.modelId,
      hasUsage: !!typedResult.usage,
      aspectRatio: typedResult.aspectRatio
    });

    return typedResult;
  } catch (error) {
    log.error('Image-to-image generation failed', { model: request.modelId, error });

    // Enhanced error handling for OpenAI models
    if (request.modelId.includes('gpt-image-1')) {
      log.info('Analyzing GPT I2I model error for specific error types');

      // Check if error is a fal.ai API error with response details
      const typedError = error as FalApiError;
      if (typedError.body || typedError.response) {
        try {
          const responseBody = typedError.body || typedError.response;
          let parsedError;

          if (typeof responseBody === 'string') {
            parsedError = JSON.parse(responseBody);
          } else {
            parsedError = responseBody;
          }

          log.info('Parsed I2I API error response', { errorDetails: parsedError });

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
          log.warn('Could not parse I2I error response', { parseError });
        }
      }
    }

    throw error;
  }
}

// Generate video from image using fal.ai Seedance model
export async function generateVideoFromImage(
  prompt: string,
  sourceImage: SourceImage,
  settings?: Partial<VideoGenerationSettings>
): Promise<GeneratedVideo> {
  log.info('Starting image-to-video generation', { prompt, sourceImage, settings });

  try {
    const apiKey = getApiKey();
    fal.config({ credentials: apiKey });

    const finalSettings: Partial<VideoGenerationSettings> = {
      duration: settings?.duration || "5s",
      resolution: settings?.resolution || "1080p",
      aspectRatio: settings?.aspectRatio || "auto",
      cameraFixed: settings?.cameraFixed ?? false,
      ...settings
    };

    log.info('Image-to-video generation request', {
      prompt,
      sourceImageUrl: sourceImage.url,
      settings: finalSettings
    });

    const result = await fal.subscribe("fal-ai/bytedance/seedance/v1/pro/image-to-video", {
      input: {
        prompt,
        image_url: sourceImage.url,
        duration: parseInt(finalSettings.duration?.replace('s', '') || '5'),
        resolution: finalSettings.resolution,
        aspect_ratio: finalSettings.aspectRatio,
        enable_safety_checker: false, // ALWAYS disabled for uncensored content
        camera_fixed: finalSettings.cameraFixed,
        seed: finalSettings.seed
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          logs.forEach(logEntry => {
            log.info('Image-to-video generation progress', { message: logEntry.message });
          });
        }
      }
    });

    log.info('Image-to-video generation result', { result });

    // Handle the video response
    const resultData = result as { video?: { url: string } };

    if (!resultData.video?.url) {
      throw new Error('No video returned from API');
    }

    const generatedVideo: GeneratedVideo = {
      url: resultData.video.url,
      duration: finalSettings.duration || "5s",
      resolution: finalSettings.resolution || "1080p",
      aspectRatio: finalSettings.aspectRatio || "auto"
    };

    log.info('Image-to-video generation completed successfully', {
      url: generatedVideo.url,
      duration: generatedVideo.duration,
      resolution: generatedVideo.resolution,
      aspectRatio: generatedVideo.aspectRatio
    });

    return generatedVideo;

  } catch (error) {
    log.error('Image-to-video generation failed', { error, prompt });

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Fal.ai API key. Please check your .env file.');
      }

      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('Insufficient credits or billing issue. Please check your Fal.ai account.');
      }

      if (error.message.includes('content policy')) {
        throw new Error('Video generation failed due to content policy restrictions. Please modify your prompt.');
      }
    }

    throw error;
  }
}

// Generate video using fal.ai veo3/fast model
export async function generateVideo(
  prompt: string,
  settings?: Partial<VideoGenerationSettings>
): Promise<GeneratedVideo> {
  log.info('Starting video generation', { prompt, settings });

  try {
    const apiKey = getApiKey();
    fal.config({ credentials: apiKey });

    const finalSettings: VideoGenerationSettings = {
      duration: settings?.duration || "8s",
      resolution: settings?.resolution || "720p",
      aspectRatio: settings?.aspectRatio || "16:9",
      generateAudio: settings?.generateAudio ?? true,
      enhancePrompt: settings?.enhancePrompt ?? true,
      autoFix: settings?.autoFix ?? true,
      ...settings
    };

    log.info('Video generation request', {
      prompt,
      settings: finalSettings
    });

    const result = await fal.subscribe("fal-ai/veo3/fast", {
      input: {
        prompt,
        duration: finalSettings.duration,
        resolution: finalSettings.resolution,
        aspect_ratio: finalSettings.aspectRatio,
        generate_audio: finalSettings.generateAudio,
        enhance_prompt: finalSettings.enhancePrompt,
        auto_fix: finalSettings.autoFix,
        negative_prompt: finalSettings.negativePrompt,
        seed: finalSettings.seed
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          logs.forEach(logEntry => {
            log.info('Video generation progress', { message: logEntry.message });
          });
        }
      }
    });

    log.info('Video generation result', { result });

    // Handle the video response
    const resultData = result as { video?: { url: string } };

    if (!resultData.video?.url) {
      throw new Error('No video returned from API');
    }

    const generatedVideo: GeneratedVideo = {
      url: resultData.video.url,
      duration: finalSettings.duration,
      resolution: finalSettings.resolution,
      aspectRatio: finalSettings.aspectRatio
    };

    log.info('Video generation completed successfully', {
      url: generatedVideo.url,
      duration: generatedVideo.duration,
      resolution: generatedVideo.resolution,
      aspectRatio: generatedVideo.aspectRatio
    });

    return generatedVideo;

  } catch (error) {
    log.error('Video generation failed', { error, prompt });

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Fal.ai API key. Please check your .env file.');
      }

      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('Insufficient credits or billing issue. Please check your Fal.ai account.');
      }

      if (error.message.includes('content policy')) {
        throw new Error('Video generation failed due to content policy restrictions. Please modify your prompt.');
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