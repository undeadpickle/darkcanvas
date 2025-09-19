import type { GenerationType } from '@/types';
import type { ModelConfig, AspectRatioConfig } from '@/lib/models';

interface GenerationStatusProps {
  isConfigured: boolean;
  generationType: GenerationType;
  selectedModel: ModelConfig | undefined;
  selectedAspectRatio: AspectRatioConfig | undefined;
  strength?: number;
  supportsStrength: boolean;
}

export function GenerationStatus({
  isConfigured,
  generationType,
  selectedModel,
  selectedAspectRatio,
  strength,
  supportsStrength
}: GenerationStatusProps) {
  if (!isConfigured) return null;

  return (
    <p className="text-xs text-center text-muted-foreground">
      Mode: {generationType} • Model: {selectedModel?.name}
      • {selectedAspectRatio?.description}
      {supportsStrength && strength !== undefined && ` • Strength: ${strength.toFixed(1)}`}
      • PNG format
    </p>
  );
}