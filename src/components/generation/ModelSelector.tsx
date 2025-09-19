import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ModelConfig } from '@/lib/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  availableModels: ModelConfig[];
  currentModel?: ModelConfig | null;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  availableModels,
  currentModel,
  disabled = false
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="model" className="text-sm font-medium text-muted-foreground">
        Model
      </label>
      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <span className="font-medium">{model.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentModel && (
        <p className="text-xs text-muted-foreground mt-1">
          {currentModel.description} • {currentModel.costEstimate}
        </p>
      )}
    </div>
  );
}