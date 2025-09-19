import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UploadZoneProps {
  onUploadClick: () => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  dragActive: boolean;
  isProcessing: boolean;
  disabled?: boolean;
  error?: string | null;
}

export function UploadZone({
  onUploadClick,
  onDrop,
  onDragOver,
  onDragLeave,
  dragActive,
  isProcessing,
  disabled = false,
  error
}: UploadZoneProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
            `}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={onUploadClick}
          >
            <div className="flex flex-col items-center space-y-4">
              {isProcessing ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Processing image...</p>
                    <p className="text-xs text-muted-foreground">
                      This may take a moment
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drop an image here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or WebP up to 15MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Manual Upload Button */}
          {!isProcessing && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onUploadClick}
              disabled={disabled}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}