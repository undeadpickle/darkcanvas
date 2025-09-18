import { useState } from 'react';
import { Eye, EyeOff, Key, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OpenAIKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function OpenAIKeyInput({ value, onChange, required = false }: OpenAIKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  const validateKey = (key: string): boolean => {
    return key.startsWith('sk-') && key.length > 10;
  };

  const isValid = !value || validateKey(value);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="openai-key" className="flex items-center space-x-2 text-sm font-medium">
          <Key className="w-4 h-4" />
          <span>OpenAI API Key</span>
          {required && <span className="text-destructive">*</span>}
        </label>
        <Button
          variant="link"
          size="sm"
          asChild
          className="h-auto p-0 text-xs text-muted-foreground"
        >
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1"
          >
            <span>Get API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>

      <div className="relative">
        <Input
          id="openai-key"
          type={showKey ? "text" : "password"}
          placeholder="sk-..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-20 ${!isValid ? 'border-destructive' : ''}`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto p-1 hover:bg-destructive/10"
            >
              <X className="w-3 h-3" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            className="h-auto p-1"
          >
            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {!isValid && value && (
        <p className="text-xs text-destructive">
          OpenAI API keys should start with "sk-" and be at least 10 characters long
        </p>
      )}

      <div className="bg-muted/50 p-3 rounded border text-xs space-y-2">
        <div className="flex items-start space-x-2">
          <Key className="w-3 h-3 mt-0.5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">BYOK (Bring Your Own Key)</p>
            <p className="text-muted-foreground">
              This model requires your own OpenAI API key. You'll be billed directly by OpenAI based on your usage.
            </p>
          </div>
        </div>

        <div className="border-t pt-2 space-y-1">
          <p className="font-medium text-orange-600">Security Warning:</p>
          <ul className="text-muted-foreground space-y-0.5 ml-4 list-disc">
            <li>Never share your API key with others</li>
            <li>Key is only stored temporarily in memory</li>
            <li>Consider using restricted keys with limited permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}