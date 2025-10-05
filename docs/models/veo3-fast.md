# Veo 3 Fast

**Model ID:** `fal-ai/veo3/fast`
**Type:** Text-to-Video
**Cost:** Low-Medium ~$0.20-$0.96/video

## Overview

Google's fast video generation model via fal.ai, providing high-quality video generation with optional audio support and multiple aspect ratios.

## Technical Specifications

### Input Parameters
- **prompt** (required): Descriptive text (minimum 1 character)
- **negative_prompt**: Optional exclusion terms
- **duration**: 4s, 6s, 8s (default: 8s)
- **resolution**: 720p, 1080p
- **aspect_ratio**: 16:9, 9:16, 1:1
- **audio**: Boolean for audio generation
- **seed**: Optional for reproducibility

### Output Format
MP4 video files with optional audio

### Resolution Constraints
720p or 1080p with aspect ratio control

## Capabilities

- Google Veo 3 technology via fal.ai
- Natural motion and realistic animations
- Optional audio generation
- Safety filters for content control
- Multiple aspect ratio support
- Detailed prompt engineering support

## Optimal Use Cases

- Social media content creation (various aspect ratios)
- Short-form video content
- Prototyping video concepts
- Educational and marketing materials
- When audio synchronization is needed

## Parameter Recommendations

### Social Media (TikTok/Instagram)
```typescript
{
  aspect_ratio: "9:16",
  duration: "6s",
  resolution: "1080p",
  audio: true
}
```

### Professional Content
```typescript
{
  resolution: "1080p",
  duration: "8s",
  aspect_ratio: "16:9",
  audio: true
}
```

### Quick Tests/Cost Efficiency
```typescript
{
  resolution: "720p",
  duration: "4s",
  audio: false
}
```

### Detailed Prompts
Include: subject, context, action, style, camera motion
```typescript
{
  prompt: "A majestic eagle soaring over mountain peaks at sunset, cinematic style, slow camera pan following the eagle's flight"
}
```

## Performance Characteristics

- **Speed:** 60-80% faster than standard Veo 3
- **Quality:** High-quality video generation
- **Cost Efficiency:** More economical than full Veo 3
- **Audio Sync:** Good audio-visual synchronization

## Integration Notes

- Google technology hosted by fal.ai
- Commercial use permitted
- Safety filters prevent inappropriate content
- Supports detailed prompt structures for best results
- Good for production video applications

## Cost Analysis

### Without Audio
- **Rate:** $0.10 per second
- **4s video:** $0.40
- **6s video:** $0.60
- **8s video:** $0.80

### With Audio
- **Rate:** $0.15 per second
- **4s video:** $0.60
- **6s video:** $0.90
- **8s video:** $1.20

### Cost Examples
- 8s video without audio: $0.80
- 6s video with audio: $0.90
- 4s video with audio: $0.60

## DarkCanvas Usage

Our only video generation model, providing excellent quality and cost balance. Perfect for users wanting to create short-form video content with professional quality.

## Supported Configurations

### Duration Options
- **4s:** Quick, cost-effective
- **6s:** Good for social media
- **8s:** Maximum length, best for complete scenes

### Resolution Options
- **720p:** Cost-effective, good quality
- **1080p:** High definition, professional quality

### Aspect Ratios
- **16:9:** Landscape, traditional video format
- **9:16:** Portrait, social media (TikTok, Instagram Stories)
- **1:1:** Square, social media posts

### Audio Support
- **With Audio:** Full multimedia experience, higher cost
- **Without Audio:** Silent video, lower cost

## Prompt Engineering Tips

For best results, include:
1. **Subject:** What/who is in the video
2. **Context:** Setting and environment
3. **Action:** What happens in the video
4. **Style:** Visual style (cinematic, cartoon, realistic)
5. **Camera Movement:** Pan, zoom, static, etc.