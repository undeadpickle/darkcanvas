import { useState, useEffect } from 'react';
import { Skull } from 'lucide-react';
import { log } from './lib/logger';
import { configureFal, isConfigured } from './lib/fal';
import { GenerationForm } from './components/generation/GenerationForm';
import { ImageDisplay } from './components/generation/ImageDisplay';
import type { ImageGeneration } from './types';

function App() {
  const [currentGeneration, setCurrentGeneration] = useState<ImageGeneration | null>(null);

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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <Skull className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold">DarkCanvas</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            AI Image Generation Interface
          </p>
          <p className="text-sm text-muted-foreground">
            Phase 1 MVP • SDXL-Lightning • Default Theme
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {/* Generation Form */}
          <GenerationForm onGeneration={handleGeneration} />

          {/* Image Display */}
          <ImageDisplay generation={currentGeneration} />
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
