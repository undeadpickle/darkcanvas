# GPT Image 1 Text-to-Image (BYOK)

**Model ID:** `fal-ai/gpt-image-1/text-to-image/byok`
**Type:** Text-to-Image
**Cost:** BYOK - Uses your OpenAI billing

## Overview

OpenAI's latest image generation technology, successor to DALL-E 2 and DALL-E 3. Requires your own OpenAI API key.

## Technical Specifications

### Input Parameters
- **prompt** (required): Max 32,000 characters
- **openai_api_key** (required): Your OpenAI API key
- **num_images**: 1-4 (default: 1)
- **image_size**: "auto", "1024x1024", "1536x1024", "1024x1536"
- **background**: "auto", "transparent", "opaque"
- **quality**: "auto", "low", "medium", "high"

### Output Format
PNG images with usage metadata

### Resolution Constraints
Fixed OpenAI standard sizes

## Capabilities

- OpenAI's latest image generation technology
- Successor to DALL-E 2 and DALL-E 3
- Natively multimodal language model
- Support for transparent backgrounds
- Quality control options

## Optimal Use Cases

- When you already have OpenAI credits/subscription
- Applications requiring OpenAI ecosystem integration
- High-quality professional content creation
- When transparency support is needed
- Enterprise applications with OpenAI partnerships

## Parameter Recommendations

### Maximum Quality
```typescript
{
  quality: "high",
  image_size: "1536x1024"
}
```

### Transparency Needs
```typescript
{
  background: "transparent"
}
```

### Batch Generation
```typescript
{
  num_images: 4  // for variety
}
```

### Auto Settings
```typescript
{
  quality: "auto",
  image_size: "auto",
  background: "auto"  // let OpenAI optimize
}
```

## Performance Characteristics

- **Speed:** Dependent on OpenAI API performance
- **Quality:** State-of-the-art image generation
- **Reliability:** Enterprise-grade through OpenAI
- **Features:** Advanced capabilities like transparency

## Integration Notes

- Requires valid OpenAI API key
- Commercial use allowed
- Usage tracked through OpenAI billing
- Good for OpenAI ecosystem integration
- No additional markup from fal.ai

## Cost Analysis

- **Billing Model:** BYOK (Bring Your Own Key)
- **Advantage:** No additional markup from fal.ai
- **Consideration:** Requires existing OpenAI account
- **Enterprise:** Good for organizations already using OpenAI

## DarkCanvas Usage

Perfect for users who already have OpenAI accounts and want to leverage their existing credits. Provides the highest quality text-to-image generation with advanced features like transparency support.

## Supported Aspect Ratios

- square_hd (1024x1024)
- landscape_4_3 (1536x1024)
- landscape_16_9 (1536x1024)
- portrait_4_3 (1024x1536)
- portrait_16_9 (1024x1536)