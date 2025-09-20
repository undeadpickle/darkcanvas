import { Gem, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { AspectRatioConfig } from '@/lib/models';
import { getDimensionsForQuality } from '@/lib/models';

interface ResolutionToggleProps {
  useHighResolution: boolean;
  onToggle: (enabled: boolean) => void;
  selectedAspectRatio: AspectRatioConfig | null;
  disabled?: boolean;
}

export function ResolutionToggle({
  useHighResolution,
  onToggle,
  selectedAspectRatio,
  disabled = false
}: ResolutionToggleProps) {
  const currentDimensions = selectedAspectRatio
    ? getDimensionsForQuality(selectedAspectRatio, useHighResolution ? 'high' : 'low')
    : { width: 1024, height: 1024 };

  return (
    <div className="space-y-2">
      <label htmlFor="resolution-quality" className="text-sm font-medium text-muted-foreground">
        Resolution Quality
      </label>
      <div className="flex items-center justify-between p-3 border rounded-md bg-background">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {useHighResolution ? (
              <Gem className="w-4 h-4 text-primary" />
            ) : (
              <Zap className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {useHighResolution ? 'High Quality' : 'Fast Mode'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentDimensions.width}×{currentDimensions.height}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-right text-muted-foreground">
            {useHighResolution ? (
              <div>
                <div>Maximum quality</div>
                <div>Slower generation</div>
              </div>
            ) : (
              <div>
                <div>Fast generation</div>
                <div>More economical</div>
              </div>
            )}
          </div>
          <Switch
            id="resolution-quality"
            checked={useHighResolution}
            onCheckedChange={onToggle}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}