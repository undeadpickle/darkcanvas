import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SourceImage } from '@/types';

interface ImagePreviewProps {
  currentImage: SourceImage;
  onRemove: () => void;
  onUploadClick: () => void;
  disabled?: boolean;
}

export function ImagePreview({
  currentImage,
  onRemove,
  onUploadClick,
  disabled = false
}: ImagePreviewProps) {
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
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={onRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>


          {/* Change Image Button */}
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onUploadClick}
            >
              <Upload className="w-4 h-4 mr-2" />
              Change Image
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}