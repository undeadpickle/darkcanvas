import { useState, useEffect } from 'react';
import { getOpenAIKeyFromEnv } from '@/lib/fal';
import { getModelsByType, getModelById, DEFAULT_TEXT_TO_IMAGE_MODEL, DEFAULT_IMAGE_TO_IMAGE_MODEL, DEFAULT_ASPECT_RATIO, detectAspectRatio } from '@/lib/models';
import { log } from '@/lib/logger';
import type { GenerationType, SourceImage, GeneratedImage } from '@/types';

interface UseGenerationStateProps {
  externalSourceImage?: GeneratedImage | null;
  onExternalSourceImageProcessed?: () => void;
}

export function useGenerationState({
  externalSourceImage,
  onExternalSourceImageProcessed
}: UseGenerationStateProps = {}) {
  // Core state
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_TEXT_TO_IMAGE_MODEL.id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(DEFAULT_ASPECT_RATIO.value);
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [strength, setStrength] = useState([0.8]); // Slider expects array
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize OpenAI API key from environment on mount
  useEffect(() => {
    const envKey = getOpenAIKeyFromEnv();
    if (envKey) {
      setOpenaiApiKey(envKey);
      log.info('OpenAI API key loaded from environment');
    }
  }, []);

  // Handle external source image (from "Use in Image-to-Image" button)
  useEffect(() => {
    if (externalSourceImage) {
      // Switch to image-to-image mode
      setGenerationType('image-to-image');
      setSelectedModel(DEFAULT_IMAGE_TO_IMAGE_MODEL.id);

      // Convert GeneratedImage to SourceImage
      const sourceImageFromGenerated: SourceImage = {
        url: externalSourceImage.url,
        width: externalSourceImage.width,
        height: externalSourceImage.height,
        filename: `generated-${Date.now()}.png`
      };

      // Set as source image
      setSourceImage(sourceImageFromGenerated);

      // Auto-detect aspect ratio
      const detectedRatio = detectAspectRatio(externalSourceImage.width, externalSourceImage.height);
      setSelectedAspectRatio(detectedRatio.value);

      log.info('External source image processed', {
        dimensions: `${externalSourceImage.width}x${externalSourceImage.height}`,
        detectedRatio: detectedRatio.name
      });

      // Notify that the external source image has been processed
      onExternalSourceImageProcessed?.();
    }
  }, [externalSourceImage, onExternalSourceImageProcessed]);

  // Get available models for the current generation type
  const availableModels = getModelsByType(generationType);

  // Get the currently selected model info
  const currentModel = getModelById(selectedModel);

  // Handle generation type change
  const handleGenerationTypeChange = (type: GenerationType) => {
    setGenerationType(type);
    setError(null);

    // Reset model selection to default for the new type
    if (type === 'text-to-image') {
      setSelectedModel(DEFAULT_TEXT_TO_IMAGE_MODEL.id);
      setSourceImage(null); // Clear source image for T2I
    } else {
      setSelectedModel(DEFAULT_IMAGE_TO_IMAGE_MODEL.id);
    }
  };

  // Handle image selection with automatic aspect ratio detection
  const handleImageSelect = (newSourceImage: SourceImage | null) => {
    setSourceImage(newSourceImage);

    // Only auto-update aspect ratio in image-to-image mode
    if (generationType === 'image-to-image') {
      if (newSourceImage?.width && newSourceImage?.height) {
        // Auto-detect aspect ratio when image is uploaded
        const detectedRatio = detectAspectRatio(newSourceImage.width, newSourceImage.height);
        setSelectedAspectRatio(detectedRatio.value);

        log.info('Auto-detected aspect ratio for uploaded image', {
          dimensions: `${newSourceImage.width}x${newSourceImage.height}`,
          ratio: newSourceImage.width / newSourceImage.height,
          selectedRatio: detectedRatio.name
        });
      } else {
        // Reset to default square ratio when image is removed
        setSelectedAspectRatio(DEFAULT_ASPECT_RATIO.value);

        log.info('Reset aspect ratio to default after image removal', {
          selectedRatio: DEFAULT_ASPECT_RATIO.name
        });
      }
    }
  };

  // Check if current model supports strength parameter (WAN models)
  const supportsStrength = selectedModel.includes('wan') && generationType === 'image-to-image';

  return {
    // State
    generationType,
    prompt,
    selectedModel,
    selectedAspectRatio,
    sourceImage,
    strength,
    openaiApiKey,
    isGenerating,
    error,

    // Computed
    availableModels,
    currentModel,
    supportsStrength,

    // Setters
    setPrompt,
    setSelectedModel,
    setSelectedAspectRatio,
    setStrength,
    setOpenaiApiKey,
    setIsGenerating,
    setError,

    // Handlers
    handleGenerationTypeChange,
    handleImageSelect
  };
}