# Qwen Image Edit Plus LoRA

**Model ID:** `fal-ai/qwen-image-edit-plus-lora`
**Type:** Image-to-Image with LoRA Support
**Cost:** Medium cost ~$0.04/megapixel (~$0.04-0.05/image typical)

## Overview

Advanced image editing model with LoRA (Low-Rank Adaptation) support for custom style fine-tuning. Offers high-quality editing with the ability to apply up to 3 custom LoRA weights for specialized styles and effects.

**Key Features:**
- LoRA support for custom style integration
- Wide resolution support (up to 14,142 pixels)
- Configurable inference quality
- Seed-based reproducibility
- **Safety filters disabled by default in DarkCanvas** (no content restrictions)

## Technical Specifications

### Input Parameters

#### Required
- **prompt** (string): Description of desired edits (max 5000 characters recommended)
- **image_urls** (array): Array of image URLs to edit

#### Optional
- **num_inference_steps** (integer): 2-50 steps (default: 28)
  - Lower values (2-10): Faster, less refined
  - Medium values (15-30): Balanced quality/speed
  - Higher values (30-50): Best quality, slower
- **guidance_scale** (float): 0-20 (default: 4)
  - Controls prompt adherence strength
  - Lower: More creative/loose interpretation
  - Higher: Stricter prompt following
- **num_images** (integer): 1-4 images per request (default: 1)
- **negative_prompt** (string): Elements to avoid in output
- **loras** (array): Up to 3 LoRA weight configurations
  - Format: `[{ "path": "lora_path", "scale": 0.0-1.0 }]`
  - Scale controls LoRA influence strength
- **seed** (integer): For reproducible generations
- **output_format** (string): "jpeg" or "png" (default: "png")
- **enable_safety_checker** (boolean): Default: **false** in DarkCanvas

### Output Format
PNG or JPEG images with editing metadata

### Resolution Constraints
- **Maximum**: 14,142 pixels per dimension
- **Default**: 512x512
- **Supported**: Custom dimensions with aspect ratio flexibility

### Image Size Options
Supports both preset strings and custom dimensions:
- Presets: `"square"`, `"portrait"`, `"landscape"`
- Custom: `{ width: number, height: number }`

## Capabilities

### Core Features
- **LoRA Integration**: Apply custom trained LoRAs for specialized styles
- **High-Quality Editing**: Advanced image transformation capabilities
- **Flexible Resolution**: Supports very high resolution outputs
- **Batch Generation**: Create 1-4 variations per request
- **Reproducible Results**: Seed-based consistency

### LoRA Support (Advanced)
The model supports up to 3 simultaneous LoRA weights:

```typescript
{
  loras: [
    { path: "style_lora_path", scale: 0.8 },
    { path: "subject_lora_path", scale: 0.6 },
    { path: "detail_lora_path", scale: 0.4 }
  ]
}
```

**LoRA Scale Guidelines:**
- 0.0-0.3: Subtle influence
- 0.4-0.7: Moderate influence
- 0.8-1.0: Strong influence

## Optimal Use Cases

### Best Applications
1. **Custom Style Applications**
   - Apply trained LoRAs for specific artistic styles
   - Character consistency across generations
   - Brand-specific visual treatments

2. **High-Quality Transformations**
   - Professional photo editing
   - Artistic style transfers
   - Detail-preserving modifications

3. **Creative Iteration**
   - Generate multiple variations (1-4 per request)
   - Seed-based reproducible edits
   - Fine-tuned prompt guidance control

4. **Uncensored Content**
   - No safety filters or content restrictions
   - Adult content generation supported
   - Gore and mature themes allowed

### Compared to Other DarkCanvas Models

| Model | Cost/Image | LoRA Support | Safety Filters | Best For |
|-------|-----------|--------------|----------------|----------|
| SeedDream v4 Edit | $0.03 | ❌ | Optional | General editing, best value |
| Nano-Banana Edit | $0.039 | ❌ | Optional | Google-powered quality |
| FLUX.1 Dev I2I | $0.04/MP | ✅ | None | Controlnets + LoRAs |
| **Qwen Edit Plus** | **$0.04/MP** | **✅** | **None** | **Custom styles + high quality** |
| WAN 2.5 Preview | $0.05 | ❌ | Optional | Scene reimagining |

## Parameter Recommendations

### Standard Quality (Fast)
```typescript
{
  prompt: "Your detailed edit description",
  image_urls: ["https://source-image.png"],
  num_inference_steps: 20,
  guidance_scale: 4,
  num_images: 1,
  enable_safety_checker: false // DarkCanvas default
}
```

### High Quality (Best)
```typescript
{
  prompt: "Your detailed edit description",
  image_urls: ["https://source-image.png"],
  num_inference_steps: 35,
  guidance_scale: 5,
  num_images: 1,
  negative_prompt: "low quality, blurry, distorted, artifacts",
  enable_safety_checker: false
}
```

### With Custom LoRA
```typescript
{
  prompt: "Your detailed edit description",
  image_urls: ["https://source-image.png"],
  num_inference_steps: 28,
  guidance_scale: 4,
  loras: [
    { path: "your_custom_lora", scale: 0.7 }
  ],
  seed: 12345, // For reproducibility
  enable_safety_checker: false
}
```

### Batch Variations
```typescript
{
  prompt: "Your detailed edit description",
  image_urls: ["https://source-image.png"],
  num_images: 4, // Generate 4 variations
  num_inference_steps: 25,
  guidance_scale: 4,
  enable_safety_checker: false
}
```

## Performance Characteristics

- **Speed:** Moderate (28 steps default)
- **Quality:** Excellent with LoRA customization
- **Flexibility:** Highly configurable
- **Resolution:** Supports very high resolutions
- **Consistency:** Good reproducibility with seeds

## Cost Analysis

**Pricing:** $0.035 per megapixel

### Cost Examples by Resolution

| Resolution | Megapixels | Cost/Image |
|-----------|-----------|-----------|
| 512x512 | 0.26 MP | ~$0.009 |
| 1024x1024 | 1.05 MP | ~$0.037 |
| 1536x1536 | 2.36 MP | ~$0.083 |
| 2048x2048 | 4.19 MP | ~$0.147 |

### Comparison
- 33% more expensive than SeedDream v4 Edit at 1024x1024
- Similar cost to FLUX.1 Dev I2I (per megapixel)
- More cost-effective than WAN 2.5 for standard resolutions

**Value Proposition:**
- LoRA support justifies cost increase for custom styles
- Per-megapixel pricing scales fairly with resolution
- Batch generation (4 images) offers good value

## Integration Notes

### DarkCanvas Implementation

**Added in Phase 4.2**

1. **Model Configuration** ([models.ts:132-143](../../src/lib/models.ts#L132-L143)):
   ```typescript
   {
     id: "fal-ai/qwen-image-edit-plus-lora",
     name: "Qwen Edit Plus LoRA",
     description: "LoRA-powered editing with custom styles - No content filters",
     costEstimate: "Medium cost ~$0.04/megapixel",
     generationType: "image-to-image",
     inputFormat: "image_urls",
     resolutionSupport: "custom",
     resolutionConstraints: { maxSize: 14142 }
   }
   ```

2. **API Handler** ([fal.ts:410-416](../../src/lib/fal.ts#L410-L416)):
   - Automatic `image_urls` array format handling
   - Default parameters: 28 steps, guidance_scale 4
   - **Safety checker always disabled** (`enable_safety_checker: false`)
   - LoRA support available (can be added via advanced parameters)

3. **UI Integration:**
   - Available in Image-to-Image model dropdown
   - Works with existing aspect ratio selector
   - Compatible with "Use in Image-to-Image" workflow
   - Future: Could add LoRA selector UI if custom LoRAs become available

### No Breaking Changes
- Uses existing `image_urls` handler (same as SeedDream, Nano-Banana, WAN 2.5)
- Standard I2I interface supports all basic parameters
- Advanced features (LoRA weights) can be added incrementally

## Example API Call

```typescript
import { generateImageFromImage } from "@/lib/fal";

const result = await generateImageFromImage({
  prompt: "Transform into cyberpunk style with neon lighting",
  sourceImage: {
    url: "https://example.com/source.jpg",
    file: sourceFile // File object from upload
  },
  modelId: "fal-ai/qwen-image-edit-plus-lora",
  numInferenceSteps: 28,
  imageSize: "landscape_16_9",
  numImages: 2
});

console.log("Generated images:", result.images);
console.log("Seed:", result.seed);
```

## Quality Tips

### Prompt Engineering
- **Be specific**: Detailed descriptions yield better results
- **Use negative prompts**: Avoid common artifacts with quality guards
- **Test guidance scale**: Adjust 3-6 range for your use case

### Parameter Tuning
- **Start with defaults**: 28 steps, guidance 4
- **Increase steps for quality**: 35-50 for critical work
- **Lower steps for speed**: 15-20 for rapid iteration
- **Use seeds for consistency**: Lock good results, iterate on prompt

### LoRA Usage
- **Single LoRA first**: Test one LoRA before combining
- **Scale carefully**: Start at 0.5-0.7, adjust from there
- **Complementary LoRAs**: Choose LoRAs that enhance each other
- **Document combinations**: Keep notes on successful LoRA mixes

## Safety and Content Policy

### DarkCanvas Configuration
**Safety filters are DISABLED by default** for this model in DarkCanvas:
- No content restrictions or censorship
- Adult content generation supported
- Gore and mature themes allowed
- Uncensored creative freedom

### Manual Control
If you need to enable safety checking for specific use cases, you can override in code:
```typescript
// Enable safety (not recommended for DarkCanvas use cases)
enable_safety_checker: true
```

### Output Flags
- Response includes `has_nsfw_concepts` array
- Lists which generated images contain NSFW content
- Informational only (not blocking)

## Links

- **Model Page**: https://fal.ai/models/fal-ai/qwen-image-edit-plus-lora
- **API Documentation**: https://fal.ai/models/fal-ai/qwen-image-edit-plus-lora/api
- **Pricing**: https://fal.ai/pricing

---

**Last Updated:** October 4, 2025
**Integration Status:** ✅ Integrated in DarkCanvas Phase 4.2
**Available In:** Image-to-Image model selector
**Safety Status:** Filters disabled by default (uncensored)
