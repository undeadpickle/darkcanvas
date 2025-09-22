import { useState, useEffect } from 'react';
import { Loader2, Video, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, FolderOpen, X } from 'lucide-react';
import { generateVideo, isConfigured } from '@/lib/fal';
import { DEFAULT_VIDEO_MODEL, calculateVideoCost, getSupportedVideoDurations, getSupportedVideoResolutions, getSupportedVideoAspectRatios } from '@/lib/models';
import { log } from '@/lib/logger';
import { getUserFriendlyError } from '@/lib/error-utils';
import { getAutoDownloadPreference, setAutoDownloadPreference, getUseDirectoryPickerPreference, getDirectoryName } from '@/lib/storage';
import { downloadVideos } from '@/lib/download-utils';
import { selectSaveDirectory, getCurrentDirectoryInfo, saveVideosToDirectory, isFileSystemAccessSupported, clearSelectedDirectory } from '@/lib/file-system';
import type { VideoGeneration } from '@/types';

interface VideoGenerationFormProps {
  onGeneration: (generation: VideoGeneration) => void;
}

export function VideoGenerationForm({ onGeneration }: VideoGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('8s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [autoFix, setAutoFix] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);
  const [useDirectoryPicker, setUseDirectoryPicker] = useState(false);
  const [selectedDirectoryName, setSelectedDirectoryName] = useState<string | null>(null);
  const [fileSystemSupported, setFileSystemSupported] = useState(false);

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

  // Calculate cost estimate
  const costEstimate = calculateVideoCost(duration, generateAudio);

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

    if (!isConfigured()) {
      setError('Please configure your Fal.ai API key in the .env file');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const generationId = `video_${Date.now()}`;

    // Create initial generation object
    const generation: VideoGeneration = {
      id: generationId,
      prompt: prompt.trim(),
      modelId: DEFAULT_VIDEO_MODEL.id,
      generationType: 'text-to-video',
      status: 'generating',
      settings: {
        duration,
        resolution,
        aspectRatio,
        generateAudio,
        enhancePrompt,
        autoFix,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed.trim() ? parseInt(seed.trim()) : undefined
      },
      createdAt: new Date()
    };

    onGeneration(generation);

    try {
      log.info('Starting video generation', {
        prompt: prompt.trim(),
        duration,
        resolution,
        aspectRatio,
        generateAudio
      });

      const video = await generateVideo(prompt.trim(), {
        duration,
        resolution,
        aspectRatio,
        generateAudio,
        enhancePrompt,
        autoFix,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed.trim() ? parseInt(seed.trim()) : undefined
      });

      const completedGeneration: VideoGeneration = {
        ...generation,
        video,
        status: 'complete'
      };

      onGeneration(completedGeneration);

      log.info('Video generation completed', {
        id: generationId,
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
            const savedCount = await saveVideosToDirectory(videoArray, prompt.trim(), DEFAULT_VIDEO_MODEL.id);
            log.info('Auto-saved video to directory', {
              count: savedCount,
              total: videoArray.length,
              directory: selectedDirectoryName,
              model: DEFAULT_VIDEO_MODEL.id
            });

            // If video wasn't saved, fall back to download
            if (savedCount < videoArray.length) {
              await downloadVideos(videoArray, prompt.trim(), DEFAULT_VIDEO_MODEL.id);
              log.info('Fell back to download for video', {
                downloadedCount: videoArray.length - savedCount
              });
            }
          } else {
            // Fall back to download dialog method
            await downloadVideos(videoArray, prompt.trim(), DEFAULT_VIDEO_MODEL.id);
            log.info('Auto-downloaded generated video', {
              count: videoArray.length,
              model: DEFAULT_VIDEO_MODEL.id
            });
          }
        } catch (saveError) {
          log.error('Failed to auto-save video', { saveError });
          // Don't show error to user - generation was successful, save failure is secondary
        }
      }

    } catch (err) {
      log.error('Video generation failed', { error: err, prompt });

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

  const supportedDurations = getSupportedVideoDurations(DEFAULT_VIDEO_MODEL.id);
  const supportedResolutions = getSupportedVideoResolutions(DEFAULT_VIDEO_MODEL.id);
  const supportedAspectRatios = getSupportedVideoAspectRatios(DEFAULT_VIDEO_MODEL.id);

  return (
    <div className="space-y-6">
      {/* Video Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Video Description</label>
        <Textarea
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about actions, scenes, and visual details for best results
        </p>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Duration</label>
        <Select value={duration} onValueChange={(value: '4s' | '6s' | '8s') => setDuration(value)}>
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
        <Select value={resolution} onValueChange={(value: '720p' | '1080p') => setResolution(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedResolutions.map((res) => (
              <SelectItem key={res} value={res}>
                {res} {res === '720p' ? '(1280×720)' : '(1920×1080)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Aspect Ratio</label>
        <Select value={aspectRatio} onValueChange={(value: '16:9' | '9:16' | '1:1') => setAspectRatio(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedAspectRatios.map((ratio) => (
              <SelectItem key={ratio} value={ratio}>
                {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '9:16' ? '(Portrait)' : '(Square)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Toggle */}
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

      {/* Cost Estimate */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium">Estimated Cost</div>
        <div className="text-lg font-bold text-primary">
          ${costEstimate.min} - ${costEstimate.max}
        </div>
        <div className="text-xs text-muted-foreground">
          {duration} video {generateAudio ? 'with audio' : 'without audio'}
        </div>
      </div>

      {/* Advanced Settings */}
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
        disabled={isGenerating || !prompt.trim()}
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
            Generating your video... This may take 30 seconds to 2 minutes.
          </p>
        </div>
      )}
    </div>
  );
}