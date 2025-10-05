import { useState, useEffect } from 'react';
import { Loader2, Video, Volume2, VolumeX, Settings, Type, Image as ImageIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Folder, FolderOpen, X } from 'lucide-react';
import { generateVideo, generateVideoFromImage, isConfigured } from '@/lib/fal';
import { VIDEO_MODELS, calculateVideoCost } from '@/lib/models';
import { ImageUpload } from './ImageUpload';
import { log } from '@/lib/logger';
import { getUserFriendlyError } from '@/lib/error-utils';
import { getAutoDownloadPreference, setAutoDownloadPreference, getUseDirectoryPickerPreference, getDirectoryName } from '@/lib/storage';
import { downloadVideos } from '@/lib/download-utils';
import { selectSaveDirectory, getCurrentDirectoryInfo, saveVideosToDirectory, isFileSystemAccessSupported, clearSelectedDirectory } from '@/lib/file-system';
import type { VideoGeneration, SourceImage } from '@/types';

interface VideoGenerationFormProps {
  onGeneration: (generation: VideoGeneration) => void;
}

export function VideoGenerationForm({ onGeneration }: VideoGenerationFormProps) {
  const [generationType, setGenerationType] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [duration, setDuration] = useState<'3s' | '4s' | '5s' | '6s' | '7s' | '8s' | '9s' | '10s' | '11s' | '12s'>('5s');
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<'21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto'>('auto');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [autoFix, setAutoFix] = useState(true);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  const [useDirectoryPicker, setUseDirectoryPicker] = useState(false);
  const [selectedDirectoryName, setSelectedDirectoryName] = useState<string | null>(null);
  const [fileSystemSupported, setFileSystemSupported] = useState(false);

  // Get current model based on generation type
  const currentModel = VIDEO_MODELS.find(m => m.generationType === generationType);

  // Clear error when prompt changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [prompt, error]);

  // Load auto-download preference from localStorage on mount
  useEffect(() => {
    const autoDownloadEnabled = getAutoDownloadPreference();
    setAutoDownload(autoDownloadEnabled);
  }, []);

  // Save auto-download preference when it changes
  useEffect(() => {
    setAutoDownloadPreference(autoDownload);
  }, [autoDownload]);

  // Check File System Access API support and load directory preferences
  useEffect(() => {
    const supported = isFileSystemAccessSupported();
    setFileSystemSupported(supported);

    if (supported) {
      // Load directory preferences
      const useDirectory = getUseDirectoryPickerPreference();
      const directoryName = getDirectoryName();

      setUseDirectoryPicker(useDirectory);
      setSelectedDirectoryName(directoryName);

      // Check if we have a valid directory
      if (useDirectory && directoryName) {
        getCurrentDirectoryInfo().then(info => {
          if (!info) {
            // Directory handle lost, reset preferences
            setUseDirectoryPicker(false);
            setSelectedDirectoryName(null);
          }
        }).catch(() => {
          // Error getting directory info, reset preferences
          setUseDirectoryPicker(false);
          setSelectedDirectoryName(null);
        });
      }
    }
  }, []);

  // Handle generation type change
  const handleGenerationTypeChange = (type: 'text-to-video' | 'image-to-video') => {
    setGenerationType(type);
    setError(null);

    // Update settings based on new model
    if (type === 'text-to-video') {
      // Veo 3 defaults
      setDuration('8s');
      setResolution('720p');
      setAspectRatio('16:9');
      setSourceImage(null);
    } else {
      // Seedance defaults
      setDuration('5s');
      setResolution('1080p');
      setAspectRatio('auto');
    }
  };

  // Handle image selection
  const handleImageSelect = (image: SourceImage | null) => {
    setSourceImage(image);
  };

  // Calculate cost estimate
  const costEstimate = generationType === 'text-to-video'
    ? calculateVideoCost(duration, generateAudio)
    : { min: 0.62, max: 0.62 }; // Seedance fixed cost

  // Handle folder selection
  const handleSelectFolder = async () => {
    if (!fileSystemSupported) {
      setError('File System Access API not supported in this browser');
      return;
    }

    try {
      const directoryName = await selectSaveDirectory();
      if (directoryName) {
        setSelectedDirectoryName(directoryName);
        setUseDirectoryPicker(true);
        setAutoDownload(true); // Enable auto-save when folder is selected
        log.info('Folder selected for video auto-save', { directoryName });
      }
    } catch (error) {
      log.error('Failed to select folder', { error });
      setError('Failed to select folder. Please try again.');
    }
  };

  // Handle clearing the selected folder
  const handleClearFolder = async () => {
    try {
      await clearSelectedDirectory();
      setSelectedDirectoryName(null);
      setUseDirectoryPicker(false);
      log.info('Selected folder cleared');
    } catch (error) {
      log.error('Failed to clear folder', { error });
      setError('Failed to clear folder selection.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a video description');
      return;
    }

    if (generationType === 'image-to-video' && !sourceImage) {
      setError('Please upload a source image for image-to-video generation');
      return;
    }

    if (!isConfigured()) {
      setError('Please configure your Fal.ai API key in the .env file');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const generationId = `video_${Date.now()}`;
    const modelId = currentModel?.id || VIDEO_MODELS[0].id;

    // Create initial generation object
    const generation: VideoGeneration = {
      id: generationId,
      prompt: prompt.trim(),
      modelId,
      generationType,
      sourceImage: sourceImage || undefined,
      status: 'generating',
      settings: {
        duration,
        resolution,
        aspectRatio,
        generateAudio: generationType === 'text-to-video' ? generateAudio : false,
        enhancePrompt: generationType === 'text-to-video' ? enhancePrompt : false,
        autoFix: generationType === 'text-to-video' ? autoFix : false,
        cameraFixed: generationType === 'image-to-video' ? cameraFixed : undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed.trim() ? parseInt(seed.trim()) : undefined,
        sourceImage: sourceImage || undefined
      },
      createdAt: new Date()
    };

    onGeneration(generation);

    try {
      let video;

      if (generationType === 'text-to-video') {
        log.info('Starting text-to-video generation', {
          prompt: prompt.trim(),
          duration,
          resolution,
          aspectRatio,
          generateAudio
        });

        video = await generateVideo(prompt.trim(), {
          duration,
          resolution,
          aspectRatio,
          generateAudio,
          enhancePrompt,
          autoFix,
          negativePrompt: negativePrompt.trim() || undefined,
          seed: seed.trim() ? parseInt(seed.trim()) : undefined
        });
      } else {
        // Image-to-video generation
        if (!sourceImage) {
          throw new Error('Source image is required for image-to-video generation');
        }

        log.info('Starting image-to-video generation', {
          prompt: prompt.trim(),
          sourceImage: sourceImage.url,
          duration,
          resolution,
          aspectRatio,
          cameraFixed
        });

        video = await generateVideoFromImage(prompt.trim(), sourceImage, {
          duration,
          resolution,
          aspectRatio,
          cameraFixed,
          seed: seed.trim() ? parseInt(seed.trim()) : undefined
        });
      }

      const completedGeneration: VideoGeneration = {
        ...generation,
        video,
        status: 'complete'
      };

      onGeneration(completedGeneration);

      log.info('Video generation completed', {
        id: generationId,
        type: generationType,
        url: video.url
      });

      // Auto-save if enabled
      if (autoDownload) {
        try {
          // Create video array in expected format for save functions
          const videoArray = [{
            url: video.url,
            duration: video.duration,
            resolution: video.resolution,
            aspectRatio: video.aspectRatio
          }];

          // Use directory saving if available and folder is selected
          if (useDirectoryPicker && selectedDirectoryName) {
            const savedCount = await saveVideosToDirectory(videoArray, prompt.trim(), modelId);
            log.info('Auto-saved video to directory', {
              count: savedCount,
              total: videoArray.length,
              directory: selectedDirectoryName,
              model: modelId
            });

            // If video wasn't saved, fall back to download
            if (savedCount < videoArray.length) {
              await downloadVideos(videoArray, prompt.trim(), modelId);
              log.info('Fell back to download for video', {
                downloadedCount: videoArray.length - savedCount
              });
            }
          } else {
            // Fall back to download dialog method
            await downloadVideos(videoArray, prompt.trim(), modelId);
            log.info('Auto-downloaded generated video', {
              count: videoArray.length,
              model: modelId
            });
          }
        } catch (saveError) {
          log.error('Failed to auto-save video', { saveError });
          // Don't show error to user - generation was successful, save failure is secondary
        }
      }

    } catch (err) {
      log.error('Video generation failed', { error: err, prompt, type: generationType });

      const errorMessage = getUserFriendlyError(err as Error);
      setError(errorMessage);

      const failedGeneration: VideoGeneration = {
        ...generation,
        status: 'error',
        error: errorMessage
      };

      onGeneration(failedGeneration);
    } finally {
      setIsGenerating(false);
    }
  };

  const supportedDurations = currentModel?.videoConfig?.durations || [];
  const supportedResolutions = currentModel?.videoConfig?.resolutions || [];
  const supportedAspectRatios = currentModel?.videoConfig?.aspectRatios || [];

  return (
    <div className="space-y-6">
      {/* Generation Mode Tabs */}
      <Tabs value={generationType} onValueChange={(value) => handleGenerationTypeChange(value as 'text-to-video' | 'image-to-video')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-video" className="flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Text-to-Video</span>
          </TabsTrigger>
          <TabsTrigger value="image-to-video" className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4" />
            <span>Image-to-Video</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text-to-video" className="space-y-6 mt-6">
          {/* Text-to-Video specific UI */}
        </TabsContent>

        <TabsContent value="image-to-video" className="space-y-6 mt-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Source Image
            </label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={sourceImage}
              disabled={isGenerating}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Description (shared) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {generationType === 'text-to-video' ? 'Video Description' : 'Motion Description'}
        </label>
        <Textarea
          placeholder={
            generationType === 'text-to-video'
              ? "Describe the video you want to generate..."
              : "Describe how you want the image to move and animate..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">
          {generationType === 'text-to-video'
            ? 'Be specific about actions, scenes, and visual details for best results'
            : 'Describe camera movements, object motions, and transformations'}
        </p>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Duration</label>
        <Select value={duration} onValueChange={(value: any) => setDuration(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedDurations.map((dur) => (
              <SelectItem key={dur} value={dur}>
                {dur} ({parseInt(dur)} seconds)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Resolution</label>
        <Select value={resolution} onValueChange={(value: any) => setResolution(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedResolutions.map((res) => (
              <SelectItem key={res} value={res}>
                {res} {res === '480p' ? '(854×480)' : res === '720p' ? '(1280×720)' : '(1920×1080)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Aspect Ratio</label>
        <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedAspectRatios.map((ratio) => (
              <SelectItem key={ratio} value={ratio}>
                {ratio} {ratio === 'auto' ? '(Auto-detect)' : ratio === '16:9' ? '(Landscape)' : ratio === '9:16' ? '(Portrait)' : ratio === '1:1' ? '(Square)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Toggle (Text-to-Video only) */}
      {generationType === 'text-to-video' && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              {generateAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Generate Audio
            </label>
            <p className="text-xs text-muted-foreground">
              {generateAudio ? 'Include audio (higher cost)' : 'No audio (33% cheaper)'}
            </p>
          </div>
          <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} />
        </div>
      )}

      {/* Camera Fixed Toggle (Image-to-Video only) */}
      {generationType === 'image-to-video' && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Fixed Camera
            </label>
            <p className="text-xs text-muted-foreground">
              {cameraFixed ? 'Static camera position' : 'Allow camera movement'}
            </p>
          </div>
          <Switch checked={cameraFixed} onCheckedChange={setCameraFixed} />
        </div>
      )}

      {/* Cost Estimate */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium">Estimated Cost</div>
        <div className="text-lg font-bold text-primary">
          {generationType === 'text-to-video'
            ? `$${costEstimate.min} - $${costEstimate.max}`
            : `~$${costEstimate.min}`
          }
        </div>
        <div className="text-xs text-muted-foreground">
          {generationType === 'text-to-video'
            ? `${duration} video ${generateAudio ? 'with audio' : 'without audio'}`
            : `${duration} at ${resolution}`
          }
        </div>
      </div>

      {/* Advanced Settings (Text-to-Video only) */}
      {generationType === 'text-to-video' && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>

          {showAdvanced && (
            <div className="space-y-4 border rounded-lg p-4">
              {/* Enhance Prompt */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Enhance Prompt</label>
                  <p className="text-xs text-muted-foreground">
                    AI-powered prompt improvement
                  </p>
                </div>
                <Switch checked={enhancePrompt} onCheckedChange={setEnhancePrompt} />
              </div>

              {/* Auto Fix */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Auto Fix</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically fix content policy issues
                  </p>
                </div>
                <Switch checked={autoFix} onCheckedChange={setAutoFix} />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Negative Prompt (Optional)</label>
                <Textarea
                  placeholder="Describe what you don't want in the video..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Seed (Optional)</label>
                <input
                  type="number"
                  placeholder="Random seed for reproducible results"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seed for Image-to-Video */}
      {generationType === 'image-to-video' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Seed (Optional)</label>
          <input
            type="number"
            placeholder="Random seed for reproducible results"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      {/* Auto-Save Settings */}
      <div className="space-y-4 pt-4 border-t border-muted/20">
        <h3 className="text-sm font-medium flex items-center space-x-2">
          <Folder className="w-4 h-4" />
          <span>Auto-Save Settings</span>
        </h3>

        {/* Auto-Save Settings */}
        <div className="space-y-3">
          {/* Auto-save toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-download-video"
              checked={autoDownload}
              onCheckedChange={setAutoDownload}
              disabled={isGenerating}
            />
            <label htmlFor="auto-download-video" className="text-sm text-muted-foreground cursor-pointer">
              Auto-save videos
            </label>
          </div>

          {/* Folder selection (only show if File System API is supported and auto-save is enabled) */}
          {fileSystemSupported && autoDownload && (
            <div className="ml-6 space-y-2">
              {!useDirectoryPicker || !selectedDirectoryName ? (
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Save to Downloads (default)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectFolder}
                    disabled={isGenerating}
                    className="h-6 px-2 text-xs"
                  >
                    Choose Folder
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{selectedDirectoryName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFolder}
                    disabled={isGenerating}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Fallback message for unsupported browsers */}
          {!fileSystemSupported && autoDownload && (
            <div className="ml-6 text-sm text-muted-foreground">
              <Folder className="w-4 h-4 inline mr-1" />
              Videos will be saved to your Downloads folder
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim() || (generationType === 'image-to-video' && !sourceImage)}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Video...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Generate Video
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="p-4 bg-muted border rounded-md">
          <p className="text-sm text-muted-foreground">
            {generationType === 'text-to-video'
              ? 'Generating your video... This may take 30 seconds to 2 minutes.'
              : 'Animating your image... This may take 30 seconds to 1 minute.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
