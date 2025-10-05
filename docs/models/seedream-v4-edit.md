# SeedDream v4 Edit

**Model ID:** `fal-ai/bytedance/seedream/v4/edit`
**Type:** Image-to-Image
**Cost:** Low cost ~$0.03/image

## Overview

High-quality image editing and transformation with unified generation and editing architecture. Supports multiple image inputs and bilingual prompts.

## Technical Specifications

### Input Parameters
- **prompt** (required): Max 5000 characters
- **image_urls** (required): Array of image URLs (up to 10)
- **width**: 1024-4096 pixels
- **height**: 1024-4096 pixels
- **num_images**: 1-6
- **seed**: Optional for reproducibility
- **enable_safety_checker**: Boolean (default: true)

### Output Format
PNG images with editing metadata

### Resolution Constraints
1024px to 4096px, maintains aspect ratios

## Capabilities

- Unified generation and editing architecture
- Multiple image input support (up to 10 images)
- Bilingual prompt understanding (Chinese and English)
- High-quality transformations
- Preserves image quality during editing

## Optimal Use Cases

- Complex image editing requiring multiple reference images
- Artistic style transfers and transformations
- Professional photo editing and enhancement
- Multilingual projects
- When high-quality editing is required

## Parameter Recommendations

### Multiple References
```typescript
{
  image_urls: ["url1", "url2", "url3"]  // 2-3 images for complex edits
}
```

### High Quality
```typescript
{
  width: 2048,
  height: 2048  // minimum for quality
}
```

### Iterative Editing
```typescript
{
  seed: 12345  // consistent seeds for step-by-step refinement
}
```

### Safety (Production)
```typescript
{
  enable_safety_checker: true  // keep enabled for production use
}
```

## Performance Characteristics

- **Speed:** Fast processing even with multiple inputs
- **Quality:** Excellent editing fidelity
- **Flexibility:** Supports complex multi-image operations
- **Consistency:** Good at maintaining image coherence

## Integration Notes

- Supports multiple simultaneous image inputs
- Good for iterative editing workflows
- Handles various image formats as input
- Maintains high quality through editing process
- Same architecture as text-to-image variant

## Cost Analysis

- **Cost:** $0.03 per generated image
- **Value:** Same cost as text-to-image variant
- **Efficiency:** Multiple inputs don't increase cost
- **Production:** Cost-effective for professional editing

## DarkCanvas Usage

Our primary image-to-image model offering excellent quality and versatility. Perfect for the "Use in Image-to-Image" workflow where users iterate on generated images.

## Multi-Image Workflow

This model excels at combining multiple reference images:
1. Upload 2-3 reference images
2. Describe desired changes in prompt
3. Model intelligently combines and edits based on all inputs
4. Maintains high quality throughout transformation