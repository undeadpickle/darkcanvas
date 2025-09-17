// Core types for DarkCanvas Phase 1 MVP

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  images: GeneratedImage[];
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  seed?: number;
  createdAt: Date;
}

export interface GenerationFormData {
  prompt: string;
  apiKey?: string;
}