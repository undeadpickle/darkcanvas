# GPT Image 1 Edit (BYOK)

**Model ID:** `fal-ai/gpt-image-1/edit-image/byok`
**Type:** Image-to-Image
**Cost:** BYOK - Uses your OpenAI billing

## Overview

OpenAI's latest image editing technology with advanced features like transparency support and input fidelity control. Requires your own OpenAI API key.

## Technical Specifications

### Input Parameters
- **image_urls** (required): Input images for editing
- **prompt** (required): Editing instructions
- **openai_api_key** (required): Your OpenAI API key
- **num_images**: 1-4
- **image_size**: "auto", "1024x1024", "1536x1024", "1024x1536"
- **quality**: "auto", "low", "medium", "high"
- **input_fidelity**: "low", "high"
- **background**: "auto", "transparent", "opaque"

### Output Format
Edited images with token usage details

### Resolution Constraints
OpenAI standard sizes

## Universal Parameters Support

This model supports universal parameters implemented in Phase 5.0:

- ✅ **seed**: For reproducible editing results (range: 0-2147483647) - Note: OpenAI models may have limited seed support
- ✅ **negative_prompt**: For filtering unwanted content and improving quality
- ✅ **strength**: Universal transformation slider (0.1-1.0) - lower values preserve original, higher values allow more change
- ✅ **localStorage persistence**: Seed values automatically saved between sessions

These parameters are automatically handled by the DarkCanvas interface and don't require manual configuration in the API call.

## Capabilities

- OpenAI's latest image editing technology
- Successor to DALL-E editing capabilities
- Input fidelity control
- Background manipulation (transparency)
- Token usage tracking

## Optimal Use Cases

- When using OpenAI ecosystem
- Professional editing requiring transparency support
- Applications needing input fidelity control
- Enterprise projects with OpenAI partnerships
- High-quality editing with detailed control

## Parameter Recommendations

### Maximum Quality
```typescript
{
  quality: "high",
  input_fidelity: "high"
}
```

### Transparency Support
```typescript
{
  background: "transparent"  // when needed
}
```

### Precision Editing
```typescript
{
  input_fidelity: "high"  // for faithful edits
}
```

### Auto Optimization
```typescript
{
  quality: "auto",
  input_fidelity: "auto",
  background: "auto"  // for general use
}
```

## Performance Characteristics

- **Speed:** Dependent on OpenAI API
- **Quality:** State-of-the-art editing capabilities
- **Features:** Advanced options like transparency and fidelity control
- **Reliability:** Enterprise-grade through OpenAI

## Integration Notes

- Requires OpenAI API key
- Commercial use permitted
- Advanced editing features
- Good for OpenAI ecosystem integration
- Token usage tracking for billing transparency

## Cost Analysis

- **Billing Model:** BYOK (Bring Your Own Key)
- **Tracking:** Token usage reported
- **Advantage:** Direct OpenAI pricing
- **Enterprise:** Good for organizations using OpenAI

## DarkCanvas Usage

Premium image editing option for users with OpenAI accounts. Provides the most advanced editing features including transparency support and precise fidelity control.

## Advanced Features

### Input Fidelity Control
- **High Fidelity:** Preserves original image details more closely
- **Low Fidelity:** Allows more creative transformation

### Background Options
- **Transparent:** Creates images with transparent backgrounds
- **Opaque:** Standard solid background
- **Auto:** Let OpenAI decide based on context

### Quality Settings
- **High:** Maximum quality output
- **Medium:** Balanced quality and speed
- **Low:** Faster processing
- **Auto:** OpenAI optimizes automatically

## Supported Aspect Ratios

- square_hd (1024x1024)
- landscape_4_3 (1536x1024)
- landscape_16_9 (1536x1024)
- portrait_4_3 (1024x1536)
- portrait_16_9 (1024x1536)