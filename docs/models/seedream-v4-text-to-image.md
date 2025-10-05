# SeedDream v4 Text-to-Image

**Model ID:** `fal-ai/bytedance/seedream/v4/text-to-image`
**Type:** Text-to-Image
**Cost:** Low cost ~$0.03/image

## Overview

High-quality artistic generation with unified architecture for generation and editing. Features bilingual support and enhanced aesthetic capabilities.

## Technical Specifications

### Input Parameters
- **prompt** (required): Text description, max 5000 characters
- **width**: 1024-4096 pixels
- **height**: 1024-4096 pixels
- **num_images**: 1-6
- **seed**: Optional for reproducibility
- **enable_safety_checker**: Boolean (default: true)

### Output Format
PNG images with seed metadata

### Resolution Constraints
Flexible sizing from 1024px to 4096px

## Universal Parameters Support

This model supports all universal parameters implemented in Phase 5.0:

- ✅ **seed**: For reproducible generation (range: 0-2147483647)
- ✅ **negative_prompt**: For filtering unwanted content and improving quality
- ✅ **localStorage persistence**: Seed values automatically saved between sessions

These parameters are automatically handled by the DarkCanvas interface and don't require manual configuration in the API call.

## Capabilities

- Unified architecture for generation and editing
- Bilingual support (Chinese and English)
- Enhanced aesthetic capabilities
- Strong instruction following
- Fast generation (~3 seconds)

## Optimal Use Cases

- High-quality artistic generation
- Bilingual projects requiring Chinese text understanding
- When aesthetic quality is paramount
- Professional content creation
- Applications requiring precise instruction following

## Parameter Recommendations

### High Quality
```typescript
{
  width: 2048,
  height: 2048  // or higher
}
```

### Speed Balance
```typescript
{
  width: 1024,
  height: 1024
}
```

### Batch Creation
```typescript
{
  num_images: 3-6  // for variety
}
```

### Consistency
```typescript
{
  seed: 12345  // specific seeds for reproducible results
}
```

### Safety (Production)
```typescript
{
  enable_safety_checker: true  // keep enabled for production
}
```

## Performance Characteristics

- **Speed:** Fast (~3 seconds per image)
- **Quality:** High aesthetic quality
- **Instruction Adherence:** Excellent
- **Language Support:** English + Chinese

## Integration Notes

- Requires API authentication
- Higher quality option than free models
- Good balance of cost, speed, and quality
- Suitable for production applications
- Enhanced for aesthetic and artistic content

## Cost Analysis

- **Cost:** $0.03 per generated image
- **Example:** 100 images = $3.00
- **Value:** Excellent quality-to-cost ratio
- **Production:** Cost-effective for professional use

## DarkCanvas Usage

This model provides our best balance of quality and cost for production text-to-image generation. Use when quality is important but budget constraints exist.