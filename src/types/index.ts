// Core types for DarkCanvas Phase 1 MVP + Image-to-Image + Video Generation

export type GenerationType = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  aspectRatio?: string; // The aspect ratio value used during generation (e.g., "landscape_16_9")
}

export interface SourceImage {
  url: string;
  file?: File;
  filename?: string;
  width?: number;
  height?: number;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  modelId?: string;
  generationType: GenerationType;
  sourceImage?: SourceImage;
  images: GeneratedImage[];
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  seed?: number;
  negativePrompt?: string; // Content to avoid in generation (universal parameter)
  strength?: number; // For image-to-image transformation intensity
  usage?: OpenAIUsage; // For BYOK models
  aspectRatio?: string; // The aspect ratio value used during generation
  createdAt: Date;
}

export interface OpenAIUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
}


export interface GeneratedVideo {
  url: string;
  duration: string;
  resolution: string;
  aspectRatio: string;
}

export interface VideoGenerationSettings {
  duration: '3s' | '4s' | '5s' | '6s' | '7s' | '8s' | '9s' | '10s' | '11s' | '12s';
  resolution: '480p' | '720p' | '1080p';
  aspectRatio: '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto';
  generateAudio: boolean;
  enhancePrompt: boolean;
  autoFix: boolean;
  negativePrompt?: string;
  seed?: number;
  sourceImage?: SourceImage; // For image-to-video generation
  cameraFixed?: boolean; // For Seedance I2V
}

export interface VideoGeneration {
  id: string;
  prompt: string;
  modelId: string;
  generationType: 'text-to-video' | 'image-to-video';
  sourceImage?: SourceImage; // For image-to-video mode
  video?: GeneratedVideo;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  settings: VideoGenerationSettings;
  createdAt: Date;
}

export interface GenerationFormData {
  prompt: string;
  apiKey?: string;
  openaiApiKey?: string; // For BYOK models
}