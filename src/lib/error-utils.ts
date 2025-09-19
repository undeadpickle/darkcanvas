// User-friendly error message utilities
// Converts technical error messages to simple, actionable user messages

export function getUserFriendlyError(error: Error): string {
  const message = error.message.toLowerCase();

  // Network connectivity issues
  if (message.includes('network') ||
      message.includes('net::err') ||
      message.includes('fetch')) {
    return 'Network connection interrupted. Please try again.';
  }

  // API key authentication issues
  if (message.includes('api key') ||
      message.includes('unauthorized') ||
      message.includes('invalid key') ||
      message.includes('authentication')) {
    return 'API key issue. Check your Fal.ai key in settings.';
  }

  // OpenAI specific errors (keep detailed for organization verification)
  if (message.includes('organization must be verified')) {
    return error.message; // Keep the detailed OpenAI message as is
  }

  // OpenAI key issues
  if (message.includes('openai') &&
      (message.includes('key') || message.includes('invalid'))) {
    return 'OpenAI API key issue. Check your key format or permissions.';
  }

  // Server overload or queue issues
  if (message.includes('busy') ||
      message.includes('queue') ||
      message.includes('timeout') ||
      message.includes('503') ||
      message.includes('502')) {
    return 'Service temporarily busy. Please wait a moment and retry.';
  }

  // Rate limiting
  if (message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')) {
    return 'Too many requests. Please wait a minute before trying again.';
  }

  // Image processing issues
  if (message.includes('image') &&
      (message.includes('size') ||
       message.includes('format') ||
       message.includes('corrupt'))) {
    return 'Image issue. Try a different image or check the file size.';
  }

  // Model or parameter issues
  if (message.includes('model') ||
      message.includes('parameter') ||
      message.includes('invalid input')) {
    return 'Invalid settings. Please check your model and parameters.';
  }

  // Payload too large errors (HTTP 413)
  if (message.includes('413') ||
      message.includes('payload too large') ||
      message.includes('content too large') ||
      message.includes('request entity too large')) {
    return 'Image too large. Please use a smaller image (under 5MB) or compress it first.';
  }

  // Generic server errors
  if (message.includes('500') ||
      message.includes('internal server') ||
      message.includes('server error')) {
    return 'Server error. Please try again in a few minutes.';
  }

  // Validation errors (prompt, etc.)
  if (message.includes('prompt') ||
      message.includes('required') ||
      message.includes('missing')) {
    return 'Missing required information. Please check your inputs.';
  }

  // Payment or billing issues
  if (message.includes('billing') ||
      message.includes('payment') ||
      message.includes('insufficient')) {
    return 'Account or billing issue. Please check your Fal.ai account.';
  }

  // Default fallback for unknown errors
  return 'Something went wrong. Please try again or check your connection.';
}

// For image upload specific errors
export function getImageUploadError(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('size') || message.includes('large') ||
      message.includes('413') || message.includes('payload too large')) {
    return 'Image too large. Please use an image under 15MB.';
  }

  if (message.includes('format') || message.includes('type')) {
    return 'Unsupported image format. Please use PNG, JPG, or WebP.';
  }

  if (message.includes('corrupt') || message.includes('invalid')) {
    return 'Image file corrupted. Please try a different image.';
  }

  if (message.includes('network') || message.includes('upload')) {
    return 'Upload failed. Please check your connection and try again.';
  }

  // Fallback for image upload errors
  return 'Could not process image. Please try a different file.';
}