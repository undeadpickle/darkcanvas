import { useState } from 'react';
import { Skull, Loader2, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { generateImage, generateImageFromImage, isConfigured } from '@/lib/fal';
import { getModelsByType, DEFAULT_TEXT_TO_IMAGE_MODEL, DEFAULT_IMAGE_TO_IMAGE_MODEL, ASPECT_RATIOS, DEFAULT_ASPECT_RATIO } from '@/lib/models';
import { ImageUpload } from './ImageUpload';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available models for the current generation type
  const availableModels = getModelsByType(generationType);

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
        });
      }

      const completedGeneration: ImageGeneration = {
        ...generation,
        images: result.images,
        status: 'complete',
        seed: result.seed,
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Skull className="w-6 h-6 text-primary" />
          <span>Generate Image</span>
        </CardTitle>
        <CardDescription>
          Create images with AI - text-to-image or image-to-image
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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

        {/* Generation Type Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Generation Mode
          </label>
          <div className="flex space-x-2">
            <Button
              variant={generationType === 'text-to-image' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleGenerationTypeChange('text-to-image')}
            >
              <Type className="w-4 h-4 mr-2" />
              Text-to-Image
            </Button>
            <Button
              variant={generationType === 'image-to-image' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleGenerationTypeChange('image-to-image')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Image-to-Image
            </Button>
          </div>
        </div>

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
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description} • {model.costEstimate}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Image Upload (Image-to-Image only) */}
        {generationType === 'image-to-image' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Source Image
            </label>
            <ImageUpload
              onImageSelect={setSourceImage}
              currentImage={sourceImage}
              disabled={isGenerating}
            />
          </div>
        )}

        {/* Strength Slider (Image-to-Image with WAN models only) */}
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
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
      </CardContent>
    </Card>
  );
}