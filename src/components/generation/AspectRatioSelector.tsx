import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AspectRatioConfig } from '@/lib/models';
import { getDimensionsFromConfig, isAspectRatioSupported } from '@/lib/models';

interface AspectRatioSelectorProps {
  selectedAspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  aspectRatios: AspectRatioConfig[];
  selectedModelId: string;
  disabled?: boolean;
}

export function AspectRatioSelector({
  selectedAspectRatio,
  onAspectRatioChange,
  aspectRatios,
  selectedModelId,
  disabled = false
}: AspectRatioSelectorProps) {

  return (
    <div className="space-y-2">
      <label htmlFor="aspect-ratio" className="text-sm font-medium text-muted-foreground">
        Aspect Ratio
      </label>
      <Select value={selectedAspectRatio} onValueChange={onAspectRatioChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select aspect ratio" />
        </SelectTrigger>
        <SelectContent>
          {aspectRatios.map((ratio) => {
            const dimensions = getDimensionsFromConfig(ratio);
            const isSupported = isAspectRatioSupported(selectedModelId, ratio.id);
            return (
              <SelectItem
                key={ratio.id}
                value={ratio.value}
                disabled={!isSupported}
              >
                <span className={!isSupported ? 'text-muted-foreground opacity-50' : ''}>
                  {ratio.name} • {dimensions.width}×{dimensions.height}
                  {!isSupported && ' (Not supported)'}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}