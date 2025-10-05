# DarkCanvas

A simple web interface for Fal.ai image and video generation with multiple AI models and aspect ratio options.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Fal.ai API key (get from [fal.ai/dashboard](https://fal.ai/dashboard))

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/undeadpickle/darkcanvas.git
cd darkcanvas

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your Fal.ai API key:
# VITE_FAL_API_KEY=your_fal_api_key_here

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
1. Get your Fal.ai API key from [fal.ai/dashboard](https://fal.ai/dashboard)
2. Copy `.env.example` to `.env`
3. Add your Fal.ai API key: `VITE_FAL_API_KEY=your_key_here`
4. **Optional**: Add your OpenAI API key for BYOK models: `VITE_OPENAI_API_KEY=your_openai_key_here`
5. Start the dev server with `npm run dev`
6. Open the local URL shown in your terminal (typically http://localhost:5173) and generate images!

## 🏗️ Tech Stack

- **Framework**: Vite + React + TypeScript
- **UI**: shadcn/ui components with default theme
- **Styling**: Tailwind CSS v4 with Inter font
- **API**: @fal-ai/serverless-client
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Card, Select, Slider, Switch)
│   └── generation/      # Image generation components
│       ├── GenerationForm.tsx       # Main form with mode toggle and auto-save
│       ├── ModelSelector.tsx        # Model selection component
│       ├── AspectRatioSelector.tsx  # Aspect ratio selection component
│       ├── GenerationStatus.tsx     # Generation status display
│       ├── ImageUpload.tsx          # File upload orchestrator
│       ├── ImagePreview.tsx         # Image preview component
│       ├── UploadZone.tsx          # Upload area component
│       ├── ImageDisplay.tsx         # Generated image display
│       ├── OpenAIKeyInput.tsx      # OpenAI API key input
│       ├── VideoGenerationForm.tsx  # Video generation form with auto-save
│       └── VideoDisplay.tsx        # Generated video display
├── hooks/
│   └── useGenerationState.ts       # Custom hook for generation state
├── lib/
│   ├── fal.ts          # Fal.ai client (text-to-image, image-to-image & video generation)
│   ├── models.ts       # Model configurations (5 image + 1 video model)
│   ├── image-utils.ts  # Image upload and validation utilities
│   ├── video-utils.ts  # Video download and utility functions
│   ├── error-utils.ts  # User-friendly error message utilities
│   ├── api-types.ts    # API response type definitions
│   ├── logger.ts       # Simple logging
│   ├── storage.ts      # localStorage utilities for preferences (image & video)
│   ├── directory-storage.ts  # IndexedDB for File System API handles
│   ├── file-system.ts  # File System Access API utilities (images & videos)
│   ├── download-utils.ts     # Auto-download functionality (images & videos)
│   └── utils.ts        # Utilities
├── types/              # TypeScript definitions
└── index.css          # Global styles with default theme
```

## 🛠️ Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and workflow.

See [PRD](./docs/darkcanvas-prd.md) for product requirements and architecture.

## 📋 Features

### Text-to-Image Generation
- ✅ 3 AI models: SDXL-Lightning, SeedDream v4, GPT Image 1 (OpenAI DALL-E BYOK)
- ✅ Aspect ratio presets (Square, Landscape, Portrait variations)
- ✅ **Resolution quality toggle** - Choose between High Quality (1920×1080) and Fast Mode (1024×576) for speed/cost control
- ✅ **Advanced parameters** - Seed for reproducibility (0-2147483647), negative prompts for quality control
- ✅ **localStorage persistence** - Seed values automatically saved and restored between sessions
- ✅ PNG format output with safety checker disabled

### Image-to-Image Generation
- ✅ 6 specialized models: SeedDream v4 Edit, Nano-Banana Edit, GPT Image 1 Edit (BYOK), WAN 2.5 Preview, FLUX.1 Dev I2I, Qwen Edit Plus LoRA
- ✅ File upload with preview and validation (PNG, JPG, WebP up to 15MB with automatic compression)
- ✅ Automatic aspect ratio detection - aspect ratio selector updates to match uploaded image dimensions
- ✅ **Resolution quality toggle** - Same high/low quality options for image-to-image generation
- ✅ **Transformation strength** - Universal slider for all I2I models (0.1-1.0) to control how much the image changes
- ✅ **Advanced parameters** - Same seed and negative prompt support as text-to-image for consistent results
- ✅ **Use generated image as source** - "Use in Image-to-Image" button allows seamless iteration

### Video Generation
- ✅ **Veo 3 Fast model** - Google's fast video generation model (4s/6s/8s duration options)
- ✅ **Multiple aspect ratios** - 16:9, 9:16, 1:1 support
- ✅ **Resolution options** - 720p and 1080p quality settings
- ✅ **Audio generation** - Optional audio with 33% cost savings when disabled
- ✅ **Advanced controls** - Prompt enhancement, auto-fix, negative prompts, and seed support
- ✅ **Auto-save with folder selection** - Same enhanced auto-save system as images

### Core Features
- ✅ Consolidated interface with Image/Video tabs
- ✅ Mode toggle between text-to-image and image-to-image within Image tab
- ✅ API key management (secure environment variables)
- ✅ **Enhanced auto-save with folder selection** - Choose custom save location or use Downloads folder
- ✅ **File System Access API integration** - Silent auto-save to selected folders (Chrome 122+)
- ✅ Error handling and loading states
- ✅ Responsive design with shadcn/ui
- ✅ Clean default theme with excellent contrast
- ✅ **Full video generation capability** - Complete video creation workflow
- ✅ Production-ready build with optimized bundle (404KB JS, 30KB CSS)

## 🔑 Environment

API keys are stored securely in environment variables. No backend required.

### Required Variables
- `VITE_FAL_API_KEY` - Your Fal.ai API key (required)

### Optional Variables
- `VITE_OPENAI_API_KEY` - Your OpenAI API key for BYOK models (optional)
  - If not set, you'll need to enter it manually when using OpenAI models
  - If set, it will be pre-loaded automatically for convenience
  - **Important**: OpenAI organization verification is required to use GPT Image models
    - Verify at [OpenAI Organization Settings](https://platform.openai.com/settings/organization/general)
    - Allow up to 15 minutes for verification to take effect

### Security Features
- Environment-based API key storage (not in browser)
- `.env` files automatically ignored by Git
- No localStorage exposure to XSS attacks
- Clear setup instructions for new developers

## 📄 License

Private project.