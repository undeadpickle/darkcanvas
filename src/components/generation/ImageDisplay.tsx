import { Download, Skull, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImageGeneration, GeneratedImage } from '@/types';

interface ImageDisplayProps {
  generation: ImageGeneration | null;
  onUseAsSource?: (image: GeneratedImage) => void;
}

export function ImageDisplay({ generation, onUseAsSource }: ImageDisplayProps) {
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `darkcanvas-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!generation) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-16 text-center">
          <Skull className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No images generated yet...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Skull className="w-4 h-4" />
          <span>Generation Result</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-horror-lg">
        {/* Prompt Display */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Prompt</h3>
          <p className="text-sm bg-muted/50 p-3 rounded border">
            {generation.prompt}
          </p>
        </div>

        {/* Status and Image Display */}
        {generation.status === 'generating' && (
          <div className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating image...</p>
          </div>
        )}

        {generation.status === 'error' && (
          <div className="flex flex-col items-center space-y-4 p-8">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center">
              <p className="text-destructive mb-2">Generation Failed</p>
              <p className="text-sm text-muted-foreground">
                {generation.error || 'Unknown error occurred'}
              </p>
            </div>
          </div>
        )}

        {generation.status === 'complete' && generation.images.length > 0 && (
          <div className="space-y-4">
            {generation.images.map((image, index) => (
              <div key={index} className="space-y-4">
                {/* Image */}
                <div className="relative overflow-hidden rounded-lg border bg-muted/50">
                  <img
                    src={image.url}
                    alt={generation.prompt}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Image Actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="text-xs text-muted-foreground space-y-1 flex-1">
                    <p>Size: {image.width || 1024} × {image.height || 1024}</p>
                    {generation.seed && <p>Seed: {generation.seed}</p>}
                    {generation.usage && (
                      <div className="pt-1 border-t border-muted">
                        <p className="font-medium text-orange-600">OpenAI Usage:</p>
                        <p>Tokens: {generation.usage.total_tokens} ({generation.usage.input_tokens} input + {generation.usage.output_tokens} output)</p>
                        {generation.usage.input_tokens_details && (
                          <p>Input: {generation.usage.input_tokens_details.text_tokens} text + {generation.usage.input_tokens_details.image_tokens} image tokens</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {onUseAsSource && (
                      <Button
                        onClick={() => onUseAsSource({
                          ...image,
                          aspectRatio: generation.aspectRatio // Include the aspect ratio from the generation
                        })}
                        variant="outline"
                        size="sm"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Use in Image-to-Image
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDownload(image.url)}
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}