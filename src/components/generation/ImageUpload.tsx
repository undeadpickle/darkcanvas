import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { processImageFile, formatFileSize } from '@/lib/image-utils';
import { log } from '@/lib/logger';
import type { SourceImage } from '@/types';

interface ImageUploadProps {
  onImageSelect: (sourceImage: SourceImage | null) => void;
  currentImage?: SourceImage | null;
  disabled?: boolean;
}

export function ImageUpload({ onImageSelect, currentImage, disabled = false }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled) return;

    setIsProcessing(true);
    setError(null);

    try {
      log.info('User selected image file', { filename: file.name });
      const sourceImage = await processImageFile(file);
      onImageSelect(sourceImage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      log.error('Image processing failed', { error: errorMessage, filename: file.name });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleRemove = () => {
    onImageSelect(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Show image preview if we have a current image
  if (currentImage) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={currentImage.url}
                alt="Source image"
                className="w-full h-48 object-contain rounded-md border bg-muted"
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Image Info */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <FileImage className="w-4 h-4" />
                <span>{currentImage.filename || 'Uploaded image'}</span>
              </div>
              {currentImage.file && (
                <span>{formatFileSize(currentImage.file.size)}</span>
              )}
            </div>

            {/* Change Image Button */}
            {!disabled && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleUploadClick}
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            )}

            {/* Hidden file input */}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upload area when no image is selected
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
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
                      PNG, JPG, or WebP up to 5MB
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
              onClick={handleUploadClick}
              disabled={disabled}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}

          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}