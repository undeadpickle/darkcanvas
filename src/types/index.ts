// Core types for DarkCanvas Phase 1 MVP + Image-to-Image

export type GenerationType = 'text-to-image' | 'image-to-image';

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export interface SourceImage {
  url: string;
  file?: File;
  filename?: string;
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
  strength?: number; // For image-to-image transformation intensity
  createdAt: Date;
}

export interface GenerationFormData {
  prompt: string;
  apiKey?: string;
}