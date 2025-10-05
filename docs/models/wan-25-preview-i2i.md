# WAN 2.5 Image-to-Image Model

**Status**: ✅ Integrated and available in DarkCanvas (Phase 4.1)

## Overview

**Model ID**: `fal-ai/wan-25-preview/image-to-image`

WAN 2.5 Image-to-Image is a powerful editing model with unique capabilities including multi-image fusion, batch generation, and built-in prompt expansion. Now integrated into DarkCanvas for scene reimagining and dramatic transformations.

## Technical Specifications

### Input Parameters

| Parameter | Type | Required | Details |
|-----------|------|----------|---------|
| `prompt` | string | Yes | Text describing desired image edit (max 2000 characters) |
| `image_urls` | string[] | Yes | Array of 1-2 image URLs to edit |
| `negative_prompt` | string | No | Content to avoid (max 500 characters) |
| `num_images` | integer | No | Number of images to generate (1-4, default: 1) |
| `image_size` | preset/object | No | Presets: `square`, `landscape`, `portrait`<br>Custom: `{width: number, height: number}` (384-1440px) |
| `seed` | integer | No | For reproducible results |
| `enable_prompt_expansion` | boolean | No | Auto-enhance prompts (default: true) |

### Image Constraints

- **Resolution Range**: 384-5000 pixels per dimension
- **Aspect Ratios**: Flexible (supports custom dimensions)
- **Batch Size**: Up to 4 images per request
- **Input Images**: Accepts 1-2 source images (enables multi-image fusion)
- **Supported Formats**: PNG, JPEG, WebP (input)
- **Output Format**: PNG

### Response Structure

```json
{
  "images": [
    {
      "content_type": "image/png",
      "url": "https://v3.fal.media/files/..."
    }
  ],
  "seeds": [175932751],
  "actual_prompt": "Enhanced prompt text..."
}
```

### Performance

- **Processing Time**: 1-2 minutes per request
- **Cost**: $0.05 per image

## Cost Analysis

**Medium cost ~$0.05/image**

### Comparison to DarkCanvas I2I Models

| Model | Cost/Image | Processing Speed | Unique Feature |
|-------|-----------|------------------|----------------|
| SeedDream v4 Edit | $0.03 | Fast | Best value |
| Nano-Banana Edit | $0.039 | Fast | Google-powered |
| **WAN 2.5 I2I** | **$0.05** | **Slow (1-2min)** | **Multi-image fusion** |

**Cost Impact**: 67% more expensive than SeedDream v4 Edit, 28% more than Nano-Banana Edit

## Use Cases

### Optimal Applications

WAN 2.5 Image-to-Image excels at:

1. **Scene Reimagining**
   - Dramatic environmental changes (weather, time-of-day, atmosphere)
   - Lighting transformations
   - Seasonal variations

2. **Subject-Consistent Editing**
   - Maintains subject identity through transformations
   - Style transfers while preserving composition
   - Creative iterations with high fidelity

3. **Multi-Image Fusion** (Unique)
   - Combine elements from 2 source images
   - Composite editing workflows
   - Image blending and merging

4. **Professional Editing Workflows**
   - Batch generation for variation exploration
   - Reproducible results via seed parameter
   - AI-enhanced prompts for better quality

### Best For

- Creative exploration requiring dramatic transformations
- Professional workflows needing subject consistency
- Projects requiring multi-image fusion (unique capability)
- Batch variation generation (1-4 images per request)

## Parameter Recommendations

### Optimal Settings

```typescript
{
  prompt: "Detailed, specific description of desired changes",
  image_urls: ["https://..."], // Single image for most use cases
  negative_prompt: "low quality, blurry, distorted", // Optional quality guards
  num_images: 1, // Start with 1, increase for variations
  image_size: "landscape", // Use presets for standard ratios
  enable_prompt_expansion: true, // Let model enhance prompts
  seed: undefined // Omit for random, set for reproducibility
}
```

### Quality Tips

- **Prompts**: Use detailed, descriptive language (model excels with complex scene descriptions)
- **Prompt Expansion**: Keep `enable_prompt_expansion: true` for best results
- **Negative Prompts**: Use to avoid unwanted artifacts
- **Aspect Ratios**: Start with presets (`square`, `landscape`, `portrait`) before custom sizes
- **Batch Generation**: Use `num_images: 2-4` to explore variations efficiently
- **Reproducibility**: Set `seed` when you find a good result to recreate variations

## Special Features

### 1. Multi-Image Input (Unique)

Only I2I model in DarkCanvas ecosystem supporting 2 source images:

```typescript
{
  image_urls: [
    "https://source-image-1.png",
    "https://source-image-2.png"
  ],
  prompt: "Combine elements from both images..."
}
```

**Use Cases**:
- Image fusion and composite editing
- Blending styles from multiple sources
- Complex editing requiring reference images

### 2. Built-in Prompt Expansion

AI automatically enhances user prompts for better results:

```typescript
// User input
{ prompt: "make it rainy" }

// Model expands to
{ actual_prompt: "Transform the scene into a rainy atmosphere with dramatic clouds, wet surfaces reflecting light, and moody lighting..." }
```

**Benefits**:
- Better results from simple prompts
- Automatic quality improvements
- Can be disabled via `enable_prompt_expansion: false`

### 3. Batch Generation

Generate 1-4 variations per request:

```typescript
{
  num_images: 4, // Generate 4 variations
  seed: 12345 // Optional: same seed for consistent variations
}
```

**Benefits**:
- Explore multiple options in single API call
- Cost-effective variation generation
- Faster iteration workflow

### 4. Flexible Resolution

Wide resolution range (384-5000 pixels):

```typescript
// Preset
{ image_size: "landscape" }

// Custom high-res
{ image_size: { width: 2048, height: 1536 } }
```

## Integration Considerations

### API Format Differences

**Critical**: WAN 2.5 uses `image_urls` array format, unlike our current I2I models:

```typescript
// Current models (SeedDream v4 Edit, Nano-Banana Edit)
interface CurrentI2IInput {
  prompt: string;
  image_url: string; // Single URL as string
  // ...
}

// WAN 2.5 requires
interface WAN25Input {
  prompt: string;
  image_urls: string[]; // Array of 1-2 URLs
  // ...
}
```

### Integration Status (Phase 4.1)

**✅ Successfully integrated into DarkCanvas!**

Changes made:

1. **Updated `src/lib/models.ts`** ([models.ts:110-122](../../src/lib/models.ts#L110-L122)):
   - Added WAN 2.5 Preview model config with `image_urls` format flag
   - Resolution constraints: 384-5000px with custom dimension support
   - Cost displayed as "Medium cost ~$0.05/image"

2. **No changes to `src/lib/fal.ts` required**:
   - Existing dual-format handler already supports `image_urls` array format
   - Automatically detects model's `inputFormat` from config
   - Works seamlessly with current I2I implementation

3. **UI Integration**:
   - Available in Image-to-Image model dropdown
   - Description: "Scene reimagining & dramatic transformations"
   - Works with existing aspect ratio selector
   - Transformation strength slider supported

### Implementation Notes

- **Simple integration**: Only required adding model config to `models.ts`
- **No breaking changes**: Existing `image_urls` handler worked perfectly
- **UI ready**: No component changes needed
- **Current limitations**: Single image input only (multi-image fusion not implemented)
- **Future enhancements**: Could add batch generation UI (`num_images: 1-4`) if requested

## Example API Call

```typescript
import { fal } from "@/lib/fal";

const result = await fal.subscribe("fal-ai/wan-25-preview/image-to-image", {
  input: {
    prompt: "Transform this sunny beach into a dramatic stormy scene with dark clouds and crashing waves",
    image_urls: ["https://example.com/beach.jpg"],
    negative_prompt: "low quality, blurry, distorted",
    num_images: 2, // Generate 2 variations
    image_size: "landscape",
    enable_prompt_expansion: true,
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      console.log("Progress:", update.logs);
    }
  },
});

console.log("Generated images:", result.images);
console.log("Expanded prompt:", result.actual_prompt);
console.log("Seeds:", result.seeds);
```

## Links

- **Model Page**: https://fal.ai/models/fal-ai/wan-25-preview/image-to-image
- **API Documentation**: https://fal.ai/models/fal-ai/wan-25-preview/image-to-image/api
- **Pricing**: https://fal.ai/pricing

---

**Last Updated**: October 4, 2025
**Research Status**: Complete
**Integration Status**: ✅ Integrated in Phase 4.1
**Available In**: DarkCanvas Image-to-Image model selector
