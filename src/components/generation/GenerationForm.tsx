import { useState } from 'react';
import { Skull, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateImage, isConfigured } from '@/lib/fal';
import { log } from '@/lib/logger';
import type { ImageGeneration } from '@/types';

interface GenerationFormProps {
  onGeneration: (generation: ImageGeneration) => void;
}

export function GenerationForm({ onGeneration }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
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
      images: [],
      status: 'generating',
      createdAt: new Date(),
    };

    onGeneration(generation);

    try {
      log.info('Starting generation', { prompt: prompt.trim() });

      const result = await generateImage({
        prompt: prompt.trim(),
        imageSize: 'square_hd',
        numImages: 1,
        safetyChecker: true,
      });

      const completedGeneration: ImageGeneration = {
        ...generation,
        images: result.images,
        status: 'complete',
        seed: result.seed,
      };

      onGeneration(completedGeneration);

      log.info('Generation completed successfully', {
        id: generationId,
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

      log.error('Generation failed', { id: generationId, error: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfiguredState = isConfigured();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Skull className="w-6 h-6 text-primary" />
          <span>Generate Image</span>
        </CardTitle>
        <CardDescription>
          Create images with SDXL-Lightning model
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

        {/* Prompt Input */}
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium text-muted-foreground">
            Prompt
          </label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to create..."
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
            Using SDXL-Lightning • ~$0.003 per image
          </p>
        )}
      </CardContent>
    </Card>
  );
}