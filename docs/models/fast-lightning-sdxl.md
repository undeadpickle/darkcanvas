# SDXL-Lightning

**Model ID:** `fal-ai/fast-lightning-sdxl`
**Type:** Text-to-Image
**Cost:** Free ($0 per image)

## Overview

Lightning-fast SDXL generation optimized for speed. This is our free tier model, perfect for development, testing, and rapid prototyping.

## Technical Specifications

### Input Parameters
- **prompt** (required): Text description, supports embeddings
- **image_size**: square_hd (default), square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
- **num_inference_steps**: 1, 2, 4, 8 (default: 4)
- **num_images**: 1-8 (default: 1)
- **seed**: Optional for reproducible results
- **enable_safety_checker**: Boolean (optional)
- **format**: JPEG (default), PNG

### Output Format
JPEG/PNG images with content_type metadata

### Resolution Constraints
Predefined aspect ratios, high-definition options available

## Capabilities

- Lightning-fast SDXL generation optimized for speed
- Real-time image generation capabilities
- Prompt expansion and guidance rescale
- Multiple image generation in single request (up to 8)
- Embedding support for advanced prompting

## Optimal Use Cases

- Rapid prototyping and iteration
- Real-time applications requiring immediate feedback
- Bulk image generation (up to 8 images)
- When speed is prioritized over ultimate quality
- MVP development and testing workflows

## Parameter Recommendations

### Speed Priority
```typescript
{
  num_inference_steps: 1-2
}
```

### Quality Balance
```typescript
{
  num_inference_steps: 4  // default
}
```

### Maximum Quality
```typescript
{
  num_inference_steps: 8
}
```

### Batch Generation
```typescript
{
  num_images: 4-8  // for variety
}
```

### Consistency
```typescript
{
  seed: 12345  // specific seed for reproducible results
}
```

## Performance Characteristics

- **Speed:** Extremely fast (lightning optimized)
- **Quality:** Good SDXL quality with speed optimization
- **Latency:** Near real-time generation
- **Throughput:** High due to optimized inference

## Integration Notes

- No API key required for basic usage
- Supports standard fal.ai SDK integration
- Excellent for MVP development due to free tier
- Consider for high-volume applications
- Perfect for DarkCanvas development phase

## Cost Analysis

- **Development:** Perfect - completely free
- **Production:** Consider for high-volume use cases
- **Testing:** Ideal for all testing scenarios