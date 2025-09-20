import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AspectRatioConfig } from '@/lib/models';
import { getDimensionsForQuality } from '@/lib/models';

interface AspectRatioSelectorProps {
  selectedAspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  aspectRatios: AspectRatioConfig[];
  useHighResolution?: boolean;
  disabled?: boolean;
}

export function AspectRatioSelector({
  selectedAspectRatio,
  onAspectRatioChange,
  aspectRatios,
  useHighResolution = true,
  disabled = false
}: AspectRatioSelectorProps) {
  const quality = useHighResolution ? 'high' : 'low';

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
            const dimensions = getDimensionsForQuality(ratio, quality);
            return (
              <SelectItem key={ratio.id} value={ratio.value}>
                <span>{ratio.name} • {dimensions.width}×{dimensions.height}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}