import { useState, useEffect } from 'react';
import { Skull, Image as ImageIcon, Video } from 'lucide-react';
import { log } from './lib/logger';
import { configureFal, isConfigured } from './lib/fal';
import { GenerationForm } from './components/generation/GenerationForm';
import { ImageDisplay } from './components/generation/ImageDisplay';
import { VideoDisplay } from './components/generation/VideoDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import type { ImageGeneration, GeneratedImage } from './types';

function App() {
  const [currentGeneration, setCurrentGeneration] = useState<ImageGeneration | null>(null);
  const [externalSourceImage, setExternalSourceImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    log.info('DarkCanvas app initialized');

    // Try to configure fal client from environment
    if (isConfigured()) {
      configureFal();
      log.info('Fal.ai client configured from environment');
    } else {
      log.warn('Fal.ai API key not configured - check .env file');
    }
  }, []);

  const handleGeneration = (generation: ImageGeneration) => {
    setCurrentGeneration(generation);
  };

  const handleUseAsSource = (image: GeneratedImage) => {
    setExternalSourceImage(image);
    log.info('Image selected for use as source', {
      width: image.width,
      height: image.height
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <Skull className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold">DarkCanvas</h1>
          </div>
        </header>

        {/* Main Content with Tabs */}
        <main className="space-y-8">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="image" className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Video</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-8 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generation Form */}
                <div>
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
                    <CardContent>
                      <GenerationForm
                        onGeneration={handleGeneration}
                        externalSourceImage={externalSourceImage}
                        onExternalSourceImageProcessed={() => setExternalSourceImage(null)}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Image Display */}
                <div>
                  <ImageDisplay
                    generation={currentGeneration}
                    onUseAsSource={handleUseAsSource}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-8 mt-8">
              <VideoDisplay />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-8 border-t">
          <p>DarkCanvas • Built with Vite + React + TypeScript + shadcn/ui + Fal.ai</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
