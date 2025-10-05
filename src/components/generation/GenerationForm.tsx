import { useState, useEffect } from 'react';
import { Skull, Loader2, Image as ImageIcon, Type, Folder, FolderOpen, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateImage, generateImageFromImage, isConfigured, getOpenAIKeyFromEnv } from '@/lib/fal';
import { getModelsByType, getModelById, DEFAULT_TEXT_TO_IMAGE_MODEL, DEFAULT_IMAGE_TO_IMAGE_MODEL, ASPECT_RATIOS, DEFAULT_ASPECT_RATIO, detectAspectRatio, getDimensionsFromAspectRatio, getDimensionsFromConfig, getSupportedAspectRatios } from '@/lib/models';
import { ImageUpload } from './ImageUpload';
import { OpenAIKeyInput } from './OpenAIKeyInput';
import { ModelSelector } from './ModelSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { GenerationStatus } from './GenerationStatus';
import { log } from '@/lib/logger';
import { getUserFriendlyError } from '@/lib/error-utils';
import { getAutoDownloadPreference, setAutoDownloadPreference, getUseDirectoryPickerPreference, getDirectoryName } from '@/lib/storage';
import { downloadImages } from '@/lib/download-utils';
import { selectSaveDirectory, getCurrentDirectoryInfo, saveImagesToDirectory, isFileSystemAccessSupported, clearSelectedDirectory } from '@/lib/file-system';
import type { ImageGeneration, GenerationType, SourceImage, GeneratedImage } from '@/types';

interface GenerationFormProps {
  onGeneration: (generation: ImageGeneration) => void;
  externalSourceImage?: GeneratedImage | null;
  onExternalSourceImageProcessed?: () => void;
}

export function GenerationForm({ onGeneration, externalSourceImage, onExternalSourceImageProcessed }: GenerationFormProps) {
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_TEXT_TO_IMAGE_MODEL.id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(DEFAULT_ASPECT_RATIO.value);
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [strength, setStrength] = useState([0.8]); // Slider expects array
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  const [useDirectoryPicker, setUseDirectoryPicker] = useState(false);
  const [selectedDirectoryName, setSelectedDirectoryName] = useState<string | null>(null);
  const [fileSystemSupported, setFileSystemSupported] = useState(false);

  // Advanced parameters (Phase 1: Quick Wins)
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Initialize OpenAI API key from environment on mount
  useEffect(() => {
    const envKey = getOpenAIKeyFromEnv();
    if (envKey) {
      setOpenaiApiKey(envKey);
      log.info('OpenAI API key loaded from environment');
    }
  }, []);

  // Load auto-download preference from localStorage on mount
  useEffect(() => {
    const autoDownloadEnabled = getAutoDownloadPreference();
    setAutoDownload(autoDownloadEnabled);
  }, []);

  // Save auto-download preference when it changes
  useEffect(() => {
    setAutoDownloadPreference(autoDownload);
  }, [autoDownload]);

  // Load seed from localStorage on mount
  useEffect(() => {
    const savedSeed = localStorage.getItem('darkcanvas_last_seed');
    if (savedSeed) {
      const seedNum = parseInt(savedSeed);
      if (!isNaN(seedNum) && seedNum >= 0 && seedNum <= 2147483647) {
        setSeed(seedNum);
        log.info('Loaded saved seed from localStorage', { seed: seedNum });
      }
    }
  }, []);

  // Save seed to localStorage when it changes
  useEffect(() => {
    if (seed !== undefined) {
      localStorage.setItem('darkcanvas_last_seed', seed.toString());
      log.info('Saved seed to localStorage', { seed });
    } else {
      localStorage.removeItem('darkcanvas_last_seed');
    }
  }, [seed]);

  // Check File System Access API support and load directory preferences
  useEffect(() => {
    const supported = isFileSystemAccessSupported();
    setFileSystemSupported(supported);

    if (supported) {
      // Load directory picker preference
      const useDirectory = getUseDirectoryPickerPreference();
      setUseDirectoryPicker(useDirectory);

      // Load directory name
      const directoryName = getDirectoryName();
      setSelectedDirectoryName(directoryName);

      // Check current directory info
      getCurrentDirectoryInfo().then(info => {
        if (info && info.hasPermission) {
          setSelectedDirectoryName(info.name);
          setUseDirectoryPicker(true);
        } else if (info && !info.hasPermission && info.permissionState === 'prompt') {
          // Directory was selected before but permission lost, keep name but disable functionality
          setSelectedDirectoryName(info.name);
          setUseDirectoryPicker(false);
        }
      }).catch(error => {
        log.error('Failed to check directory info on mount', { error });
      });
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

      // Use stored aspect ratio if available, otherwise detect from dimensions
      let aspectRatioToUse: string;
      if (externalSourceImage.aspectRatio) {
        // Use the stored aspect ratio from the original generation
        aspectRatioToUse = externalSourceImage.aspectRatio;

        // Update the source image dimensions to match the aspect ratio (for consistency)
        const correctDimensions = getDimensionsFromAspectRatio(externalSourceImage.aspectRatio);
        sourceImageFromGenerated.width = correctDimensions.width;
        sourceImageFromGenerated.height = correctDimensions.height;

        log.info('Using stored aspect ratio from external source image', {
          aspectRatio: externalSourceImage.aspectRatio,
          correctedDimensions: `${correctDimensions.width}x${correctDimensions.height}`
        });
      } else {
        // Fall back to detecting aspect ratio from dimensions (backward compatibility)
        const detectedRatio = detectAspectRatio(externalSourceImage.width, externalSourceImage.height);
        aspectRatioToUse = detectedRatio.value;

        log.info('Detected aspect ratio from external source image dimensions', {
          dimensions: `${externalSourceImage.width}x${externalSourceImage.height}`,
          detectedRatio: detectedRatio.name
        });
      }

      setSelectedAspectRatio(aspectRatioToUse);

      // Notify that the external source image has been processed
      onExternalSourceImageProcessed?.();
    }
  }, [externalSourceImage, onExternalSourceImageProcessed]);

  // Get available models for the current generation type
  const availableModels = getModelsByType(generationType);

  // Get the currently selected model info
  const currentModel = getModelById(selectedModel);

  // Get the currently selected aspect ratio config
  const currentAspectRatio = ASPECT_RATIOS.find(r => r.value === selectedAspectRatio) || DEFAULT_ASPECT_RATIO;

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
  const handleImageSelect = (sourceImage: SourceImage | null) => {
    setSourceImage(sourceImage);

    // Only auto-update aspect ratio in image-to-image mode
    if (generationType === 'image-to-image') {
      if (sourceImage?.width && sourceImage?.height) {
        // Auto-detect aspect ratio when image is uploaded
        const detectedRatio = detectAspectRatio(sourceImage.width, sourceImage.height);
        setSelectedAspectRatio(detectedRatio.value);

        log.info('Auto-detected aspect ratio for uploaded image', {
          dimensions: `${sourceImage.width}x${sourceImage.height}`,
          ratio: sourceImage.width / sourceImage.height,
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

  // Handle folder selection
  const handleSelectFolder = async () => {
    if (!fileSystemSupported) {
      setError('File System Access API not supported in this browser');
      return;
    }

    try {
      const directoryName = await selectSaveDirectory();
      if (directoryName) {
        setSelectedDirectoryName(directoryName);
        setUseDirectoryPicker(true);
        setAutoDownload(true); // Enable auto-save when folder is selected
        log.info('Folder selected for auto-save', { directoryName });
      }
    } catch (error) {
      log.error('Failed to select folder', { error });
      setError('Failed to select folder. Please try again.');
    }
  };

  // Handle clearing the selected folder
  const handleClearFolder = async () => {
    try {
      await clearSelectedDirectory();
      setSelectedDirectoryName(null);
      setUseDirectoryPicker(false);
      log.info('Selected folder cleared');
    } catch (error) {
      log.error('Failed to clear folder', { error });
      setError('Failed to clear folder selection.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (generationType === 'image-to-image' && !sourceImage) {
      setError('Please upload a source image for image-to-image generation');
      return;
    }

    if (!isConfigured()) {
      setError('Please set VITE_FAL_API_KEY in your .env file');
      return;
    }

    // Check for OpenAI key if BYOK model is selected
    if (currentModel?.requiresOpenAIKey) {
      if (!openaiApiKey.trim()) {
        setError('Please provide your OpenAI API key for this BYOK model');
        return;
      }
      if (!openaiApiKey.startsWith('sk-')) {
        setError('Invalid OpenAI API key format. Keys should start with "sk-"');
        return;
      }
    }

    setIsGenerating(true);
    setError(null);

    const generationId = `gen_${Date.now()}`;

    // Create pending generation
    const generation: ImageGeneration = {
      id: generationId,
      prompt: prompt.trim(),
      modelId: selectedModel,
      generationType,
      sourceImage: sourceImage || undefined,
      strength: generationType === 'image-to-image' ? strength[0] : undefined,
      images: [],
      status: 'generating',
      createdAt: new Date(),
    };

    onGeneration(generation);

    try {
      log.info('Starting generation', {
        prompt: prompt.trim(),
        type: generationType,
        model: selectedModel
      });

      // Get the dimensions for the selected aspect ratio
      const dimensions = getDimensionsFromConfig(currentAspectRatio);

      let result;

      if (generationType === 'text-to-image') {
        result = await generateImage({
          prompt: prompt.trim(),
          modelId: selectedModel,
          imageSize: selectedAspectRatio,
          customDimensions: dimensions,
          numImages: 1,
          enableSafetyChecker: false,
          numInferenceSteps: 4,
          imageFormat: 'png',
          openaiApiKey: currentModel?.requiresOpenAIKey ? openaiApiKey : undefined,
          aspectRatio: selectedAspectRatio,
          seed: seed,
          negativePrompt: negativePrompt.trim() || undefined,
        });
      } else {
        // Image-to-image generation
        if (!sourceImage) {
          throw new Error('Source image is required for image-to-image generation');
        }

        result = await generateImageFromImage({
          prompt: prompt.trim(),
          sourceImage,
          modelId: selectedModel,
          strength: strength[0],
          imageSize: selectedAspectRatio,
          customDimensions: dimensions,
          numImages: 1,
          enableSafetyChecker: false,
          numInferenceSteps: 4,
          imageFormat: 'png',
          openaiApiKey: currentModel?.requiresOpenAIKey ? openaiApiKey : undefined,
          aspectRatio: selectedAspectRatio,
          seed: seed,
          negativePrompt: negativePrompt.trim() || undefined,
        });
      }

      const completedGeneration: ImageGeneration = {
        ...generation,
        images: result.images,
        status: 'complete',
        seed: result.seed || seed,
        negativePrompt: negativePrompt.trim() || undefined,
        usage: result.usage, // Include usage data for BYOK models
        aspectRatio: result.aspectRatio || selectedAspectRatio, // Include aspect ratio used for generation
      };

      onGeneration(completedGeneration);

      log.info('Generation completed successfully', {
        id: generationId,
        type: generationType,
        imageCount: result.images.length
      });

      // Auto-save if enabled
      if (autoDownload && result.images.length > 0) {
        try {
          // Use directory saving if available and folder is selected
          if (useDirectoryPicker && selectedDirectoryName) {
            const savedCount = await saveImagesToDirectory(result.images, prompt.trim(), selectedModel);
            log.info('Auto-saved images to directory', {
              count: savedCount,
              total: result.images.length,
              directory: selectedDirectoryName,
              model: selectedModel
            });

            // If not all images were saved, fall back to download
            if (savedCount < result.images.length) {
              const failedImages = result.images.slice(savedCount);
              await downloadImages(failedImages, prompt.trim(), selectedModel);
              log.info('Fell back to download for remaining images', {
                downloadedCount: failedImages.length
              });
            }
          } else {
            // Fall back to download dialog method
            await downloadImages(result.images, prompt.trim(), selectedModel);
            log.info('Auto-downloaded generated images', {
              count: result.images.length,
              model: selectedModel
            });
          }
        } catch (saveError) {
          log.error('Failed to auto-save images', { saveError });
          // Don't show error to user - generation was successful, save failure is secondary
        }
      }

    } catch (err) {
      const originalError = err instanceof Error ? err.message : 'Generation failed';
      const userFriendlyMessage = err instanceof Error ? getUserFriendlyError(err) : 'Generation failed';

      // Log the original technical error for debugging
      log.error('Generation failed (technical details)', {
        id: generationId,
        type: generationType,
        originalError,
        userMessage: userFriendlyMessage
      });

      // Show user-friendly message
      setError(userFriendlyMessage);

      const failedGeneration: ImageGeneration = {
        ...generation,
        status: 'error',
        error: originalError, // Store technical error for internal use
      };

      onGeneration(failedGeneration);
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfiguredState = isConfigured();

  // All I2I models support strength parameter
  const supportsStrength = generationType === 'image-to-image';

  return (
    <div className="space-y-6">
        {/* Configuration Warning */}
        {!isConfiguredState && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Setup Required:</strong> Please set <code>VITE_FAL_API_KEY</code> in your <code>.env</code> file.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Get your API key from <a href="https://fal.ai/dashboard" target="_blank" rel="noopener noreferrer" className="underline">fal.ai/dashboard</a>
            </p>
          </div>
        )}

        {/* Generation Mode Tabs */}
        <Tabs value={generationType} onValueChange={(value) => handleGenerationTypeChange(value as GenerationType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text-to-image" className="flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span>Text-to-Image</span>
            </TabsTrigger>
            <TabsTrigger value="image-to-image" className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Image-to-Image</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text-to-image" className="space-y-6 mt-6">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              currentModel={currentModel}
              disabled={isGenerating}
            />
            {/* Hide aspect ratio selector for models that don't support it (e.g., Nano-Banana) */}
            {getSupportedAspectRatios(selectedModel).length > 0 && (
              <AspectRatioSelector
                selectedAspectRatio={selectedAspectRatio}
                onAspectRatioChange={setSelectedAspectRatio}
                aspectRatios={ASPECT_RATIOS}
                selectedModelId={selectedModel}
                disabled={isGenerating}
              />
            )}
          </TabsContent>

          <TabsContent value="image-to-image" className="space-y-6 mt-6">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              currentModel={currentModel}
              disabled={isGenerating}
            />
            {/* Hide aspect ratio selector for models that don't support it (e.g., Nano-Banana) */}
            {getSupportedAspectRatios(selectedModel).length > 0 && (
              <AspectRatioSelector
                selectedAspectRatio={selectedAspectRatio}
                onAspectRatioChange={setSelectedAspectRatio}
                aspectRatios={ASPECT_RATIOS}
                selectedModelId={selectedModel}
                disabled={isGenerating}
              />
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Source Image
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={sourceImage}
                disabled={isGenerating}
              />
            </div>

            {/* Strength Slider (All I2I models) */}
            {supportsStrength && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Transformation Strength: {strength[0].toFixed(1)}
                </label>
                <div className="px-2">
                  <Slider
                    value={strength}
                    onValueChange={setStrength}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                    disabled={isGenerating}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower values preserve the original image, higher values allow more transformation
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>


        {/* Prompt Input */}
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium text-muted-foreground">
            Prompt
          </label>
          <Textarea
            id="prompt"
            placeholder={
              generationType === 'text-to-image'
                ? "Describe the image you want to create..."
                : "Describe how you want to transform the source image..."
            }
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error && e.target.value.trim()) {
                setError(null);
              }
            }}
            rows={4}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-muted-foreground hover:text-foreground"
            disabled={isGenerating}
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>

          {showAdvancedSettings && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              {/* Seed Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Seed (Optional)
                  </label>
                  {seed !== undefined && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSeed(undefined)}
                      className="h-6 px-2 text-xs"
                      disabled={isGenerating}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="Leave empty for random (0-2147483647)"
                  value={seed ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setSeed(undefined);
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num >= 0 && num <= 2147483647) {
                        setSeed(num);
                      }
                    }
                  }}
                  disabled={isGenerating}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Use the same seed to reproduce exact results. Leave empty for random generation.
                </p>
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Negative Prompt (Optional)
                </label>
                <Textarea
                  placeholder="Describe what you don't want in the image (e.g., low quality, blurry, distorted)"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Specify unwanted elements to improve generation quality
                </p>
              </div>
            </div>
          )}
        </div>

        {/* OpenAI Key Input (for BYOK models) */}
        {currentModel?.requiresOpenAIKey && (
          <OpenAIKeyInput
            value={openaiApiKey}
            onChange={setOpenaiApiKey}
            required={true}
            isFromEnvironment={!!getOpenAIKeyFromEnv()}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {error.includes('organization must be verified') && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-destructive/80">
                  To use OpenAI models, your organization needs to be verified:
                </p>
                <ol className="text-xs text-destructive/80 list-decimal list-inside space-y-1">
                  <li>Go to <a
                    href="https://platform.openai.com/settings/organization/general"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-destructive"
                  >
                    OpenAI Organization Settings
                  </a></li>
                  <li>Click "Verify Organization"</li>
                  <li>Wait up to 15 minutes for access to propagate</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Auto-Save Settings */}
        <div className="space-y-3">
          {/* Auto-save toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-download"
              checked={autoDownload}
              onCheckedChange={setAutoDownload}
              disabled={isGenerating}
            />
            <label htmlFor="auto-download" className="text-sm text-muted-foreground cursor-pointer">
              Auto-save images
            </label>
          </div>

          {/* Folder selection (only show if File System API is supported and auto-save is enabled) */}
          {fileSystemSupported && autoDownload && (
            <div className="ml-6 space-y-2">
              {!useDirectoryPicker || !selectedDirectoryName ? (
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Save to Downloads (default)</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectFolder}
                    disabled={isGenerating}
                  >
                    Choose Folder
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-foreground">Save to: {selectedDirectoryName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectFolder}
                    disabled={isGenerating}
                  >
                    Change
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFolder}
                    disabled={isGenerating}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Fallback message for unsupported browsers */}
          {!fileSystemSupported && autoDownload && (
            <div className="ml-6 text-sm text-muted-foreground">
              <Folder className="w-4 h-4 inline mr-1" />
              Images will be saved to your Downloads folder
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="default"
          size="lg"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Skull className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {/* Status */}
        <GenerationStatus
          isConfigured={isConfiguredState}
          generationType={generationType}
          selectedModel={currentModel}
          selectedAspectRatio={ASPECT_RATIOS.find(r => r.value === selectedAspectRatio)}
          strength={strength[0]}
          supportsStrength={supportsStrength}
        />
    </div>
  );
}