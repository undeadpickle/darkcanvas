import { useState, useEffect } from 'react';
import { Skull, Loader2, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateImage, generateImageFromImage, isConfigured, getOpenAIKeyFromEnv } from '@/lib/fal';
import { getModelsByType, getModelById, DEFAULT_TEXT_TO_IMAGE_MODEL, DEFAULT_IMAGE_TO_IMAGE_MODEL, ASPECT_RATIOS, DEFAULT_ASPECT_RATIO, detectAspectRatio } from '@/lib/models';
import { ImageUpload } from './ImageUpload';
import { OpenAIKeyInput } from './OpenAIKeyInput';
import { log } from '@/lib/logger';
import type { ImageGeneration, GenerationType, SourceImage } from '@/types';

interface GenerationFormProps {
  onGeneration: (generation: ImageGeneration) => void;
}

export function GenerationForm({ onGeneration }: GenerationFormProps) {
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

      let result;

      if (generationType === 'text-to-image') {
        result = await generateImage({
          prompt: prompt.trim(),
          modelId: selectedModel,
          imageSize: selectedAspectRatio,
          numImages: 1,
          enableSafetyChecker: false,
          numInferenceSteps: 4,
          imageFormat: 'png',
          openaiApiKey: currentModel?.requiresOpenAIKey ? openaiApiKey : undefined,
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
          numImages: 1,
          enableSafetyChecker: false,
          numInferenceSteps: 4,
          imageFormat: 'png',
          openaiApiKey: currentModel?.requiresOpenAIKey ? openaiApiKey : undefined,
        });
      }

      const completedGeneration: ImageGeneration = {
        ...generation,
        images: result.images,
        status: 'complete',
        seed: result.seed,
        usage: result.usage, // Include usage data for BYOK models
      };

      onGeneration(completedGeneration);

      log.info('Generation completed successfully', {
        id: generationId,
        type: generationType,
        imageCount: result.images.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);

      const failedGeneration: ImageGeneration = {
        ...generation,
        status: 'error',
        error: errorMessage,
      };

      onGeneration(failedGeneration);

      log.error('Generation failed', {
        id: generationId,
        type: generationType,
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfiguredState = isConfigured();

  // Check if current model supports strength parameter (WAN models)
  const supportsStrength = selectedModel.includes('wan') && generationType === 'image-to-image';

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
            {/* Model Selector */}
            <div className="space-y-2">
              <label htmlFor="model" className="text-sm font-medium text-muted-foreground">
                Model
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="font-medium">{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentModel && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentModel.description} • {currentModel.costEstimate}
                </p>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label htmlFor="aspect-ratio" className="text-sm font-medium text-muted-foreground">
                Aspect Ratio
              </label>
              <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.id} value={ratio.value}>
                      <span>{ratio.name} ({ratio.description})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="image-to-image" className="space-y-6 mt-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label htmlFor="model" className="text-sm font-medium text-muted-foreground">
                Model
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="font-medium">{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentModel && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentModel.description} • {currentModel.costEstimate}
                </p>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label htmlFor="aspect-ratio" className="text-sm font-medium text-muted-foreground">
                Aspect Ratio
              </label>
              <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.id} value={ratio.value}>
                      <span>{ratio.name} ({ratio.description})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Strength Slider (WAN models only) */}
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
          />
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
        {isConfiguredState && (
          <p className="text-xs text-center text-muted-foreground">
            Mode: {generationType} • Model: {availableModels.find(m => m.id === selectedModel)?.name}
            • {ASPECT_RATIOS.find(r => r.value === selectedAspectRatio)?.description}
            {supportsStrength && ` • Strength: ${strength[0].toFixed(1)}`}
            • PNG format
          </p>
        )}
    </div>
  );
}