// Available image generation models for DarkCanvas
// Phase 2: Multiple model support + Image-to-Image

import type { GenerationType } from '@/types';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  costEstimate: string;
  generationType: GenerationType;
  inputFormat: 'image_url' | 'image_urls'; // For I2I models
  requiresOpenAIKey?: boolean; // For BYOK models
  resolutionSupport: 'custom' | 'presets-only' | 'none';
  supportedAspectRatios?: string[]; // Aspect ratio IDs that this model supports
  resolutionConstraints?: {
    minSize?: number;
    maxSize?: number;
    fixedPresets?: string[];
  };
}

// Text-to-Image Models
export const TEXT_TO_IMAGE_MODELS: ModelConfig[] = [
  {
    id: "fal-ai/fast-lightning-sdxl",
    name: "SDXL-Lightning",
    description: "Fast and cheap - great for testing",
    costEstimate: "Free ~$0/image",
    generationType: "text-to-image",
    inputFormat: "image_url", // Not used for T2I
    resolutionSupport: "custom" // No constraints
  },
  {
    id: "fal-ai/bytedance/seedream/v4/text-to-image",
    name: "SeedDream v4",
    description: "Higher quality generation",
    costEstimate: "Low cost ~$0.03/image",
    generationType: "text-to-image",
    inputFormat: "image_url", // Not used for T2I
    resolutionSupport: "custom",
    resolutionConstraints: {
      minSize: 1024,
      maxSize: 4096
    }
  },
  {
    id: "fal-ai/gpt-image-1/text-to-image/byok",
    name: "GPT Image 1 (BYOK)",
    description: "OpenAI's DALL-E - Requires your OpenAI API key",
    costEstimate: "BYOK - Uses your OpenAI billing",
    generationType: "text-to-image",
    inputFormat: "image_url",
    requiresOpenAIKey: true,
    resolutionSupport: "presets-only",
    supportedAspectRatios: ["square_hd", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    resolutionConstraints: {
      fixedPresets: ["auto", "1024x1024", "1536x1024", "1024x1536"]
    }
  }
];

// Image-to-Image Models
export const IMAGE_TO_IMAGE_MODELS: ModelConfig[] = [
  {
    id: "fal-ai/bytedance/seedream/v4/edit",
    name: "SeedDream v4 Edit",
    description: "High-quality image editing and transformation",
    costEstimate: "Low cost ~$0.03/image",
    generationType: "image-to-image",
    inputFormat: "image_urls",
    resolutionSupport: "custom",
    resolutionConstraints: {
      minSize: 1024,
      maxSize: 4096
    }
  },
  {
    id: "fal-ai/nano-banana/edit",
    name: "Nano-Banana Edit",
    description: "Gemini-powered image editing",
    costEstimate: "Higher cost ~$0.039/image",
    generationType: "image-to-image",
    inputFormat: "image_urls",
    resolutionSupport: "none", // Uses source image dimensions
    supportedAspectRatios: [] // Hide aspect ratio selector for this model
  },
  {
    id: "fal-ai/gpt-image-1/edit-image/byok",
    name: "GPT Image 1 Edit (BYOK)",
    description: "OpenAI's image editing - Requires your OpenAI API key",
    costEstimate: "BYOK - Uses your OpenAI billing",
    generationType: "image-to-image",
    inputFormat: "image_urls",
    requiresOpenAIKey: true,
    resolutionSupport: "presets-only",
    supportedAspectRatios: ["square_hd", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    resolutionConstraints: {
      fixedPresets: ["auto", "1024x1024", "1536x1024", "1024x1536"]
    }
  }
];

// Combined model list
export const AVAILABLE_MODELS: ModelConfig[] = [
  ...TEXT_TO_IMAGE_MODELS,
  ...IMAGE_TO_IMAGE_MODELS
];

// Default models
export const DEFAULT_TEXT_TO_IMAGE_MODEL = TEXT_TO_IMAGE_MODELS[0];
export const DEFAULT_IMAGE_TO_IMAGE_MODEL = IMAGE_TO_IMAGE_MODELS[0];

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(model => model.id === id);
}

export function getModelsByType(type: GenerationType): ModelConfig[] {
  return AVAILABLE_MODELS.filter(model => model.generationType === type);
}

// Aspect ratio options for image generation
export interface AspectRatioConfig {
  id: string;
  name: string;
  value: string;
  description: string;
  dimensions: { width: number; height: number };
}

export const ASPECT_RATIOS: AspectRatioConfig[] = [
  {
    id: "portrait_16_9",
    name: "Portrait 9:16",
    value: "portrait_16_9",
    description: "Mobile portrait",
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: "square_hd",
    name: "Square 1:1",
    value: "square_hd",
    description: "Square format",
    dimensions: { width: 1024, height: 1024 }
  },
  {
    id: "landscape_4_3",
    name: "Landscape 4:3",
    value: "landscape_4_3",
    description: "Standard landscape",
    dimensions: { width: 1536, height: 1152 }
  },
  {
    id: "landscape_16_9",
    name: "Landscape 16:9",
    value: "landscape_16_9",
    description: "Widescreen format",
    dimensions: { width: 1920, height: 1080 }
  },
  {
    id: "portrait_4_3",
    name: "Portrait 4:3",
    value: "portrait_4_3",
    description: "Standard portrait",
    dimensions: { width: 1152, height: 1536 }
  }
];

// Default aspect ratio (Portrait 9:16 for mobile-first)
export const DEFAULT_ASPECT_RATIO = ASPECT_RATIOS[0];

/**
 * Get dimensions for a given aspect ratio value
 */
export function getDimensionsFromAspectRatio(aspectRatioValue: string): { width: number; height: number } {
  const aspectRatio = ASPECT_RATIOS.find(r => r.value === aspectRatioValue);
  if (!aspectRatio) {
    // Return default portrait dimensions
    return { width: 1080, height: 1920 };
  }

  return aspectRatio.dimensions;
}

/**
 * Get dimensions for a specific aspect ratio config
 */
export function getDimensionsFromConfig(aspectRatio: AspectRatioConfig): { width: number; height: number } {
  return aspectRatio.dimensions;
}

/**
 * Detect the best matching aspect ratio for given image dimensions
 */
export function detectAspectRatio(width: number, height: number): AspectRatioConfig {
  const ratio = width / height;

  // Define aspect ratio ranges for matching
  const ratioMatches = [
    { config: ASPECT_RATIOS.find(r => r.id === 'square_hd')!, min: 0.9, max: 1.1 }, // 1:1
    { config: ASPECT_RATIOS.find(r => r.id === 'landscape_4_3')!, min: 1.2, max: 1.4 }, // 4:3
    { config: ASPECT_RATIOS.find(r => r.id === 'landscape_16_9')!, min: 1.6, max: 1.9 }, // 16:9
    { config: ASPECT_RATIOS.find(r => r.id === 'portrait_4_3')!, min: 0.7, max: 0.8 }, // 3:4
    { config: ASPECT_RATIOS.find(r => r.id === 'portrait_16_9')!, min: 0.5, max: 0.65 }, // 9:16
  ];

  // Find matching ratio
  for (const match of ratioMatches) {
    if (ratio >= match.min && ratio <= match.max) {
      return match.config;
    }
  }

  // Default to square if no match
  return DEFAULT_ASPECT_RATIO;
}

/**
 * Get valid dimensions for a model, applying constraints if needed
 */
export function getValidDimensions(
  modelId: string,
  requested: { width: number; height: number }
): { width: number; height: number } {
  const model = getModelById(modelId);

  if (!model || model.resolutionSupport === 'none') {
    return requested; // Will be ignored by API anyway
  }

  if (model.resolutionConstraints?.minSize) {
    const minSize = model.resolutionConstraints.minSize;
    const maxSize = model.resolutionConstraints.maxSize || 4096;

    return {
      width: Math.max(minSize, Math.min(maxSize, requested.width)),
      height: Math.max(minSize, Math.min(maxSize, requested.height))
    };
  }

  return requested;
}

/**
 * Check if a model supports custom resolutions
 */
export function supportsCustomResolutions(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.resolutionSupport === 'custom';
}

/**
 * Check if a model supports resolution controls at all
 */
export function supportsResolutionControls(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.resolutionSupport !== 'none';
}

/**
 * Get supported aspect ratios for a model
 */
export function getSupportedAspectRatios(modelId: string): string[] {
  const model = getModelById(modelId);

  // If model has explicit supported aspect ratios, use those
  if (model?.supportedAspectRatios) {
    return model.supportedAspectRatios;
  }

  // If model doesn't support aspect ratio selection (e.g., Nano-Banana), return empty array
  if (model?.resolutionSupport === 'none') {
    return [];
  }

  // Default: support all aspect ratios
  return ASPECT_RATIOS.map(r => r.id);
}

/**
 * Get GPT-compatible size string for aspect ratio
 */
export function getGPTCompatibleSize(aspectRatio: string): string {
  const mapping: Record<string, string> = {
    'square_hd': '1024x1024',
    'landscape_16_9': '1536x1024',
    'landscape_4_3': '1536x1024',
    'portrait_16_9': '1024x1536',
    'portrait_4_3': '1024x1536',
  };
  return mapping[aspectRatio] || 'auto';
}

/**
 * Check if an aspect ratio is supported by a model
 */
export function isAspectRatioSupported(modelId: string, aspectRatioId: string): boolean {
  const supportedRatios = getSupportedAspectRatios(modelId);
  return supportedRatios.includes(aspectRatioId);
}