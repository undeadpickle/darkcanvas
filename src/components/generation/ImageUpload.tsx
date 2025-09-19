import { useState, useRef } from 'react';
import { processImageFile } from '@/lib/image-utils';
import { log } from '@/lib/logger';
import { getImageUploadError } from '@/lib/error-utils';
import { ImagePreview } from './ImagePreview';
import { UploadZone } from './UploadZone';
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
      const originalError = err instanceof Error ? err.message : 'Failed to process image';
      const userFriendlyMessage = err instanceof Error ? getImageUploadError(err) : 'Failed to process image';

      setError(userFriendlyMessage);
      log.error('Image processing failed', {
        originalError,
        userMessage: userFriendlyMessage,
        filename: file.name
      });
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
      <>
        <ImagePreview
          currentImage={currentImage}
          onRemove={handleRemove}
          onUploadClick={handleUploadClick}
          disabled={disabled}
        />
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </>
    );
  }

  // Show upload area when no image is selected
  return (
    <>
      <UploadZone
        onUploadClick={handleUploadClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        dragActive={dragActive}
        isProcessing={isProcessing}
        disabled={disabled}
        error={error}
      />
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </>
  );
}