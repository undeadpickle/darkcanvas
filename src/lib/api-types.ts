// Type definitions for Fal.ai API responses and errors

export interface FalApiErrorDetail {
  type: string;
  msg: string;
}

export interface FalApiError {
  detail?: FalApiErrorDetail[] | string;
  body?: {
    detail?: string;
  };
  status?: number;
  message?: string;
}

export interface FalImageResponse {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

export interface FalGenerationResponse {
  images?: FalImageResponse[];
  image?: FalImageResponse;
  timings?: Record<string, number>;
  seed?: number;
  prompt?: string;
  // OpenAI BYOK specific fields
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_tokens_details?: {
      image_tokens: number;
      text_tokens: number;
    };
  };
  // SeedDream specific fields
  results?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}