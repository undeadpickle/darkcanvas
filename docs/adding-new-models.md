# Adding New Models to DarkCanvas

This guide explains how to add new fal.ai models to DarkCanvas, including proper documentation, code integration, and testing.

## ⭐ Complete Integration Example

**Want to see a working example?** Review the **WAN 2.5 Preview integration (Phase 4.1)** as a reference:
- Documentation: [docs/models/wan-25-preview-i2i.md](models/wan-25-preview-i2i.md)
- Model config: [src/lib/models.ts:110-122](../src/lib/models.ts#L110-L122)
- No API changes needed (used existing `image_urls` handler)
- Complete testing documented in Phase 4.1 notes

This is the gold standard for model integration - follow this pattern.

## Prerequisites

- Access to fal.ai model documentation
- Understanding of the model's input/output format
- Chrome DevTools MCP for researching model specifications

## Step-by-Step Process

### 1. Research the Model

Use the `.claude/agents/fal-media-specialist.md` agent to research the model:

```bash
# In Claude Code
"I need to add [model-name] from fal.ai. Please research the model documentation,
pricing, parameters, and provide implementation recommendations."
```

**Research Checklist:**
- [ ] Model ID (e.g., `fal-ai/flux/dev/image-to-image`)
- [ ] Model type (text-to-image, image-to-image, or video)
- [ ] Pricing (cost per generation)
- [ ] Input format (`image_url` vs `image_urls` for I2I models)
- [ ] Supported parameters (seed, negative_prompt, strength, etc.)
- [ ] Resolution constraints and aspect ratio support
- [ ] Optimal use cases and parameter recommendations

### 2. Create Model Documentation

Create a new file in `docs/models/[model-name].md` following this template:

```markdown
# [Model Name]

**Model ID:** `fal-ai/model-id-here`
**Type:** Text-to-Image | Image-to-Image | Video
**Cost:** $X.XX per [image/video]

## Overview

Brief description of the model's purpose and capabilities.

## Technical Specifications

### Input Parameters
- **prompt** (required): Description
- **image_url** or **image_urls** (I2I only): Source image format
- **seed** (optional): 0-2147483647 for reproducibility
- **negative_prompt** (optional): Quality control
- **strength** (I2I only): 0.1-1.0 transformation control
- **[model-specific params]**: Description

### Output Format
Description of output structure

### Resolution Constraints
Supported resolutions and aspect ratios

## Universal Parameters Support

This model supports all universal parameters implemented in Phase 5.0:

- ✅ **seed**: For reproducible generation (range: 0-2147483647)
- ✅ **negative_prompt**: For filtering unwanted content
- ✅ **strength** (I2I only): Universal slider control (0.1-1.0)

## Capabilities

- Feature 1
- Feature 2
- Feature 3

## Optimal Use Cases

- Use case 1
- Use case 2
- Use case 3

## Parameter Recommendations

### Balanced Quality/Speed
\`\`\`typescript
{
  num_inference_steps: 28,
  guidance_scale: 3.5
}
\`\`\`

### Maximum Quality
\`\`\`typescript
{
  num_inference_steps: 40,
  guidance_scale: 4.5
}
\`\`\`

## Integration Notes

- Important implementation details
- Special handling requirements
- Common pitfalls to avoid

## Cost Analysis

- Base cost: $X.XX per generation
- Cost-saving strategies
- Optimal parameter combinations for budget

## Example API Call

\`\`\`typescript
const result = await fal.subscribe('fal-ai/model-id', {
  input: {
    prompt: "example prompt",
    seed: 42069,
    negative_prompt: "low quality, blurry",
    // model-specific params
  },
  logs: true,
  onQueueUpdate: (update) => {
    console.log('Generation progress:', update);
  }
});
\`\`\`
```

### 3. Update Model Configuration

Add the model to `src/lib/models.ts`:

**For Text-to-Image models:**

```typescript
export const TEXT_TO_IMAGE_MODELS: ModelConfig[] = [
  // ... existing models
  {
    id: 'fal-ai/your-model-id',
    name: 'Model Display Name',
    description: 'Brief description for UI',
    cost: 'Cost level ~$0.XX/image', // Use exact format!
    category: 'text-to-image',
    // Add any model-specific flags
  }
];
```

**For Image-to-Image models:**

```typescript
export const IMAGE_TO_IMAGE_MODELS: ModelConfig[] = [
  // ... existing models
  {
    id: 'fal-ai/your-model-id',
    name: 'Model Display Name',
    description: 'Brief description for UI',
    cost: 'Cost level ~$0.XX/image',
    category: 'image-to-image',
    inputFormat: 'image_url' | 'image_urls', // CRITICAL: Check model docs!
    // Add any model-specific flags
  }
];
```

**Cost Format Examples:**
- `"Free ~$0/image"` (SDXL Lightning)
- `"Low cost ~$0.03/image"` (SeedDream)
- `"Medium cost ~$0.05/image"` (WAN v2.5)
- `"Higher cost ~$0.039/image"` (Nano-Banana)

### 4. Update API Integration

**For Text-to-Image models**, add model-specific logic to `src/lib/fal.ts` in the `generateImage()` function:

```typescript
// Around line 150 in generateImage()
if (modelId.includes('your-model-identifier')) {
  // Model-specific parameters
  input.num_inference_steps = 28; // Adjust based on model docs
  input.guidance_scale = 3.5;
  // Add any other model-specific params
}
```

**For Image-to-Image models**, add to `generateImageFromImage()` function:

```typescript
// Around line 450 in generateImageFromImage()
if (modelId.includes('your-model-identifier')) {
  // Model-specific parameters
  input.num_inference_steps = 35;
  input.guidance_scale = 5.0;
  // Add any other model-specific params
}
```

### 5. Universal Parameters (Already Implemented)

All models automatically receive these parameters from Phase 5.0:

```typescript
// Automatically added to ALL models:
if (request.seed !== undefined) {
  input.seed = request.seed;
}
if (request.negativePrompt) {
  input.negative_prompt = request.negativePrompt;
}
// For I2I models:
if (request.strength !== undefined) {
  input.strength = request.strength;
}
```

**No additional code needed** - just verify the model supports these parameters in the API docs.

### 6. Test the Integration

Use Chrome DevTools MCP for comprehensive testing:

```bash
# In Claude Code
"Test the new [model-name] model with seed 42069, negative prompt 'low quality',
and verify all parameters are correctly passed to the API."
```

**Test Checklist:**
- [ ] Model appears in dropdown selector
- [ ] Cost is displayed correctly
- [ ] Generation works with basic prompt
- [ ] Seed parameter is passed to API (check console logs)
- [ ] Negative prompt is passed to API
- [ ] Strength slider works (I2I only)
- [ ] Generated image displays correctly
- [ ] Seed is shown in result metadata
- [ ] "Use in Image-to-Image" button works (if T2I)
- [ ] Auto-save functionality works
- [ ] Error handling works (test with invalid parameters)

### 7. Update Documentation

Update these files to reflect the new model:

- [ ] `CLAUDE.md` - Add to current phase or create new phase section
- [ ] `README.md` - Update model count in features section
- [ ] Model count in project status footer

## Common Patterns

### Input Format Detection (I2I Models)

The system automatically handles two input formats:

**Single image URL** (FLUX, WAN models):
```typescript
inputFormat: 'image_url'
// Results in: input.image_url = request.sourceImage.url
```

**Array of image URLs** (SeedDream, Nano-Banana):
```typescript
inputFormat: 'image_urls'
// Results in: input.image_urls = [request.sourceImage.url]
```

**CRITICAL**: Always verify the correct format in fal.ai documentation!

### Model-Specific Parameter Handling

Some models require special parameter configurations:

**WAN models** (high quality requirements):
```typescript
if (modelId.includes('wan')) {
  input.num_inference_steps = 27; // WAN needs 27 steps
  input.guidance_scale = 3.5;
  input.guidance_scale_2 = 4;
  input.shift = 2;
  input.acceleration = "regular";
}
```

**FLUX models** (different output format):
```typescript
if (modelId.includes('flux')) {
  input.output_format = request.imageFormat || "png"; // NOT 'format'
  input.num_inference_steps = 40;
  input.guidance_scale = 4.5;
}
```

**GPT/OpenAI models** (BYOK):
```typescript
if (modelId.includes('gpt-image-1')) {
  input = {
    prompt: request.prompt.trim(),
    openai_api_key: request.openaiApiKey.trim(),
    image_size: input.image_size || 'auto'
  };
}
```

## Debugging

### Enhanced Logging

Phase 5.0 added comprehensive parameter logging:

```typescript
// T2I logging (around line 191):
log.info('Starting fal.ai API request', {
  modelId,
  customDimensions: request.customDimensions,
  aspectRatio: request.aspectRatio,
  seed: input.seed,
  negative_prompt: input.negative_prompt,
  fullInput: input // Full payload for debugging
});

// I2I logging (around line 511):
log.info('Starting fal.ai I2I API request', {
  modelId: request.modelId,
  strength: input.strength,
  seed: input.seed,
  negative_prompt: input.negative_prompt,
  fullInput: input
});
```

Check browser console for these logs to verify parameters are being passed correctly.

### Common Issues

**Issue**: Model not appearing in dropdown
- **Fix**: Check `models.ts` - ensure model is added to correct array (T2I vs I2I)

**Issue**: Parameters not being passed to API
- **Fix**: Check console logs for `fullInput` object - verify parameters are present

**Issue**: API returns error about invalid parameter
- **Fix**: Check fal.ai docs - model may not support that parameter

**Issue**: Image not displaying after generation
- **Fix**: Check response parsing logic in `fal.ts` - different models return different formats

**Issue**: Seed not matching in results
- **Fix**: Verify model supports seed parameter in fal.ai docs

## Best Practices

1. **Always research first**: Use fal-media-specialist agent to get current specs
2. **Test thoroughly**: Use Chrome DevTools MCP for automated testing
3. **Document everything**: Create comprehensive model documentation
4. **Follow existing patterns**: Look at similar model implementations
5. **Verify pricing**: Ensure cost strings match the exact format used in other models
6. **Check inputFormat**: Critical for I2I models - wrong format = API errors
7. **Test universal parameters**: Verify seed, negative_prompt, and strength work
8. **Update all docs**: Don't forget CLAUDE.md, README.md, and project status

## 📚 Lessons Learned (From 7+ Model Integrations)

### Critical Success Factors

**1. inputFormat Detection is EVERYTHING (I2I models)**
- **Lesson**: 90% of I2I integration bugs come from wrong `inputFormat`
- **Solution**: First thing to verify in fal.ai docs - `image_url` vs `image_urls`
- **Real Example**: WAN 2.5 worked instantly because we correctly identified `image_urls` format

**2. Test Universal Parameters Early**
- **Lesson**: Assuming seed/negative_prompt work without testing = production bugs
- **Solution**: Chrome DevTools MCP test with seed=42069 immediately after integration
- **Real Example**: Phase 5.0 testing caught issues before they reached users

**3. Cost String Format Must Be Exact**
- **Lesson**: Inconsistent cost strings confuse users and break UI expectations
- **Solution**: Always use format: `"Cost level ~$0.XX/image"` (check existing models)
- **Real Example**: All 9 models follow exact same format for consistency

**4. Model-Specific Quirks Are Non-Negotiable**
- **Lesson**: WAN needs exactly 27 steps, FLUX uses `output_format` - no shortcuts
- **Solution**: Document all quirks in model docs and code comments
- **Real Example**: See Model Quirks Database below

### What Worked Well

✅ **fal-media-specialist agent** - Browser automation saves hours of manual research
✅ **Template-driven docs** - Consistency across all 9 model docs
✅ **Chrome DevTools MCP testing** - Catches parameter issues immediately
✅ **Universal parameters** - Automatic seed/negative_prompt support = zero extra work
✅ **Dual format handler** - `image_url` vs `image_urls` handled once, works for all

### Common Mistakes (Avoid These)

❌ **Not reading fal.ai docs thoroughly** → Missing critical parameters
❌ **Copying code without understanding** → Wrong inputFormat breaks I2I
❌ **Skipping Chrome DevTools testing** → Bugs reach production
❌ **Forgetting to update README.md** → Model count becomes inaccurate
❌ **Not documenting quirks** → Future developers repeat same mistakes

### Time Savers

⚡ **Use existing model as template** - Copy similar model's code structure
⚡ **Test with known-good params** - seed=42069, negative_prompt="low quality"
⚡ **Browser automation research** - 5 minutes vs 30 minutes manual browsing
⚡ **Universal params are free** - Already implemented, just verify support

## 🔧 Model Quirks Database

Critical model-specific requirements discovered during integration:

### WAN Models
```typescript
// REQUIRED: Exactly 27 inference steps for proper quality
input.num_inference_steps = 27;
input.guidance_scale = 3.5;
input.guidance_scale_2 = 4;  // WAN-specific parameter
input.shift = 2;              // WAN-specific parameter
input.acceleration = "regular"; // WAN-specific parameter
```
**Why**: WAN architecture requires these exact values for optimal quality

### FLUX Models
```typescript
// CRITICAL: Uses 'output_format' not 'format'
input.output_format = "png";  // NOT input.format!
```
**Why**: FLUX API has different parameter naming than other models

### GPT/OpenAI Models (BYOK)
```typescript
// CRITICAL: Completely different input structure
input = {
  prompt: request.prompt.trim(),
  openai_api_key: request.openaiApiKey.trim(), // Required!
  image_size: input.image_size || 'auto'
};
// No other parameters accepted
```
**Why**: OpenAI BYOK models have minimal, specific parameter sets

### SeedDream & Nano-Banana Models
```typescript
// CRITICAL: Array format for image URLs
input.image_urls = [request.sourceImage.url];  // Array, not string!
inputFormat: 'image_urls' // Must be set in models.ts
```
**Why**: These models accept multiple input images for context

### Qwen Models
```typescript
// Uses output_format like FLUX
input.output_format = "png";
// High default steps for quality
input.num_inference_steps = 35;
```
**Why**: Quality-focused model with different defaults

### Resolution Constraints by Model

| Model | Min | Max | Notes |
|-------|-----|-----|-------|
| SDXL-Lightning | Presets only | Presets only | No custom dimensions |
| SeedDream | 1024px | 4096px | Flexible aspect ratios |
| WAN 2.5 | 384px | 5000px | Widest range supported |
| FLUX | Presets | Custom | Model-dependent |
| GPT Image 1 | OpenAI presets | OpenAI presets | Fixed sizes only |
| Qwen | Custom | 14,142px | Highest resolution support |

## Example: Adding a New Model

See the WAN 2.5 Preview integration (Phase 4.1) as a reference:

1. **Documentation**: `docs/models/wan-25-preview-i2i.md`
2. **Configuration**: Added to `IMAGE_TO_IMAGE_MODELS` in `models.ts`
3. **API Logic**: Model-specific parameters in `generateImageFromImage()`
4. **Testing**: Comprehensive Chrome DevTools MCP testing
5. **Docs Updated**: CLAUDE.md Phase 4.1 section, README.md model count

## Questions?

If you encounter issues or need clarification:

1. Check existing model implementations for patterns
2. Review fal.ai model documentation thoroughly
3. Use the fal-media-specialist agent for research
4. Test with Chrome DevTools MCP for debugging
5. Check console logs for parameter visibility
