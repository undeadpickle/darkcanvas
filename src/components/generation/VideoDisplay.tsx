import { useState, useRef } from 'react';
import { Download, ExternalLink, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { log } from '@/lib/logger';
import type { VideoGeneration } from '@/types';

interface VideoDisplayProps {
  generation: VideoGeneration | null;
}

export function VideoDisplay({ generation }: VideoDisplayProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = async () => {
    if (!generation?.video?.url) return;

    try {
      log.info('Starting video download', { url: generation.video.url });

      // Create download blob URL if not already cached
      if (!downloadUrl) {
        const response = await fetch(generation.video.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `darkcanvas-video-${generation.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        log.info('Video download initiated');
      } else {
        // Use cached blob URL
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `darkcanvas-video-${generation.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      log.error('Video download failed', { error });
    }
  };

  const handleOpenInNewTab = () => {
    if (generation?.video?.url) {
      window.open(generation.video.url, '_blank');
    }
  };

  const formatDuration = (duration: string) => {
    const seconds = parseInt(duration);
    return `${seconds}s`;
  };

  const getVideoMetadata = () => {
    if (!generation?.video) return null;

    return {
      duration: formatDuration(generation.video.duration),
      resolution: generation.video.resolution,
      aspectRatio: generation.video.aspectRatio
    };
  };

  // Show placeholder when no generation
  if (!generation) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Play className="w-6 h-6 text-primary" />
            <span>Video Generation</span>
          </CardTitle>
          <CardDescription>
            Your generated videos will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-16">
          <div className="space-y-4">
            <Play className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Ready to Generate</h3>
            <p className="text-muted-foreground">
              Enter a video description and click "Generate Video" to create your first AI video.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show generating state
  if (generation.status === 'generating') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Play className="w-6 h-6 text-primary animate-pulse" />
            <span>Generating Video</span>
          </CardTitle>
          <CardDescription>
            Please wait while your video is being created...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-16">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-medium">Creating Your Video</h3>
            <p className="text-muted-foreground">
              "{generation.prompt}"
            </p>
            <p className="text-xs text-muted-foreground">
              Video generation usually takes 30 seconds to 2 minutes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (generation.status === 'error') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Play className="w-6 h-6 text-destructive" />
            <span>Generation Failed</span>
          </CardTitle>
          <CardDescription>
            There was an error generating your video
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-16">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">Generation Failed</h3>
            <p className="text-muted-foreground">
              "{generation.prompt}"
            </p>
            {generation.error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {generation.error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completed video
  if (generation.status === 'complete' && generation.video) {
    const metadata = getVideoMetadata();

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-6 h-6 text-primary" />
              <span>Generated Video</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            "{generation.prompt}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={generation.video.url}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            />
          </div>

          {/* Video Metadata */}
          {metadata && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{metadata.duration}</span>
                </div>
                <span>•</span>
                <span>{metadata.resolution}</span>
                <span>•</span>
                <span>{metadata.aspectRatio}</span>
              </div>
              <div className="text-xs">
                MP4 Video
              </div>
            </div>
          )}

          {/* Generation Info */}
          <div className="text-xs text-muted-foreground text-center">
            Generated on {generation.createdAt.toLocaleDateString()} at {generation.createdAt.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="text-center py-16">
        <p className="text-muted-foreground">Unknown generation status</p>
      </CardContent>
    </Card>
  );
}