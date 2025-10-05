# Nano-Banana Edit

**Model ID:** `fal-ai/nano-banana/edit`
**Type:** Image-to-Image
**Cost:** Higher cost ~$0.039/image

## Overview

Google-powered image editing technology with simultaneous multi-image editing capabilities and high concurrency support.

## Technical Specifications

### Input Parameters
- **prompt** (required): 3-5000 characters
- **image_urls** (required): 1-10 image URLs
- **num_images**: 1-4
- Format support: JPEG, PNG output

### Output Format
JPEG/PNG with editing description

### Resolution Constraints
Maintains input resolution, flexible sizing

## Capabilities

- Google-powered image editing technology
- Simultaneous multi-image editing
- Descriptive edit feedback
- Sync mode for direct data URI return
- High concurrency support (30 simultaneous requests)

## Optimal Use Cases

- Quick image edits and modifications
- Batch editing operations
- When Google's editing algorithms are preferred
- Applications requiring high concurrency
- Simple to moderate editing tasks

## Parameter Recommendations

### Batch Editing
```typescript
{
  num_images: 4  // for maximum output
}
```

### Quality Control
```typescript
{
  prompt: "Clear, specific instructions (3-5000 chars)"
}
```

### Multiple Inputs
```typescript
{
  image_urls: ["url1", "url2", ...] // up to 10 input images for context
}
```

### Sync Mode
```typescript
{
  // Enable for immediate data return in applications
  sync: true
}
```

## Performance Characteristics

- **Speed:** Good performance with high concurrency
- **Quality:** Google-grade editing algorithms
- **Scalability:** 30 max concurrent requests
- **Timeout:** 1-hour request timeout for complex operations

## Integration Notes

- Powered by Google's image editing technology
- High concurrency support for production use
- Returns descriptive edit explanations
- Good for applications requiring Google's algorithms
- Maintains source image dimensions

## Cost Analysis

- **Cost:** $0.039 per image
- **Budget Example:** $1.00 = ~25 edits
- **Value:** Competitive for Google-powered editing
- **Concurrency:** High throughput capabilities

## DarkCanvas Usage

Alternative image-to-image model leveraging Google's editing technology. Best for users who prefer Google's approach or need high-concurrency editing operations.

## Special Features

- **Descriptive Feedback:** Model provides explanations of edits made
- **High Concurrency:** Supports up to 30 simultaneous requests
- **Google Technology:** Leverages Google's advanced image processing
- **Flexible Input:** Accepts 1-10 input images for context

## Resolution Handling

Unlike other models, Nano-Banana maintains the input image's resolution rather than allowing custom output dimensions. This makes it ideal for preserving original image quality and dimensions during editing.