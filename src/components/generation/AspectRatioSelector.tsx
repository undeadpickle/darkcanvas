import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AspectRatioConfig } from '@/lib/models';

interface AspectRatioSelectorProps {
  selectedAspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  aspectRatios: AspectRatioConfig[];
  disabled?: boolean;
}

export function AspectRatioSelector({
  selectedAspectRatio,
  onAspectRatioChange,
  aspectRatios,
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
          {aspectRatios.map((ratio) => (
            <SelectItem key={ratio.id} value={ratio.value}>
              <span>{ratio.name} ({ratio.description})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}