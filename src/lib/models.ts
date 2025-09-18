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
}

// Text-to-Image Models
export const TEXT_TO_IMAGE_MODELS: ModelConfig[] = [
  {
    id: "fal-ai/fast-lightning-sdxl",
    name: "SDXL-Lightning",
    description: "Fast and cheap - great for testing",
    costEstimate: "Free ~$0/image",
    generationType: "text-to-image",
    inputFormat: "image_url" // Not used for T2I
  },
  {
    id: "fal-ai/bytedance/seedream/v4/text-to-image",
    name: "SeedDream v4",
    description: "Higher quality generation",
    costEstimate: "Low cost ~$0.03/image",
    generationType: "text-to-image",
    inputFormat: "image_url" // Not used for T2I
  },
  {
    id: "fal-ai/gpt-image-1/text-to-image/byok",
    name: "GPT Image 1 (BYOK)",
    description: "OpenAI's DALL-E - Requires your OpenAI API key",
    costEstimate: "BYOK - Uses your OpenAI billing",
    generationType: "text-to-image",
    inputFormat: "image_url",
    requiresOpenAIKey: true
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
    inputFormat: "image_urls"
  },
  {
    id: "fal-ai/nano-banana/edit",
    name: "Nano-Banana Edit",
    description: "Gemini-powered image editing",
    costEstimate: "Higher cost ~$0.039/image",
    generationType: "image-to-image",
    inputFormat: "image_urls"
  },
  {
    id: "fal-ai/gpt-image-1/edit-image/byok",
    name: "GPT Image 1 Edit (BYOK)",
    description: "OpenAI's image editing - Requires your OpenAI API key",
    costEstimate: "BYOK - Uses your OpenAI billing",
    generationType: "image-to-image",
    inputFormat: "image_urls",
    requiresOpenAIKey: true
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
}

export const ASPECT_RATIOS: AspectRatioConfig[] = [
  {
    id: "square_hd",
    name: "Square 1:1",
    value: "square_hd",
    description: "1024×1024"
  },
  {
    id: "landscape_4_3",
    name: "Landscape 4:3",
    value: "landscape_4_3",
    description: "1365×1024"
  },
  {
    id: "landscape_16_9",
    name: "Landscape 16:9",
    value: "landscape_16_9",
    description: "1920×1080"
  },
  {
    id: "portrait_4_3",
    name: "Portrait 4:3",
    value: "portrait_4_3",
    description: "1024×1365"
  },
  {
    id: "portrait_16_9",
    name: "Portrait 9:16",
    value: "portrait_16_9",
    description: "1080×1920"
  }
];

// Default aspect ratio
export const DEFAULT_ASPECT_RATIO = ASPECT_RATIOS[0];