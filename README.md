# DarkCanvas

A simple web interface for Fal.ai image generation with multiple AI models and aspect ratio options.

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
1. Get your API key from [fal.ai/dashboard](https://fal.ai/dashboard)
2. Copy `.env.example` to `.env`
3. Add your API key: `VITE_FAL_API_KEY=your_key_here`
4. Start the dev server with `npm run dev`
5. Open the local URL shown in your terminal (typically http://localhost:5173) and generate images!

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
│   ├── ui/              # shadcn/ui components (Button, Card, Select, Slider)
│   └── generation/      # Image generation components
│       ├── GenerationForm.tsx    # Main form with mode toggle
│       ├── ImageUpload.tsx       # File upload for image-to-image
│       └── ImageDisplay.tsx      # Generated image display
├── lib/
│   ├── fal.ts          # Fal.ai client (text-to-image & image-to-image)
│   ├── models.ts       # Model configurations (4 total models)
│   ├── image-utils.ts  # Image upload and validation utilities
│   ├── logger.ts       # Simple logging
│   └── utils.ts        # Utilities
├── types/              # TypeScript definitions
└── index.css          # Global styles with default theme
```

## 🛠️ Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and workflow.

See [PRD](./docs/darkcanvas-prd.md) for product requirements and architecture.

## 📋 Features

### Text-to-Image Generation
- ✅ Multiple AI model support (SDXL-Lightning, SeedDream v4)
- ✅ Aspect ratio presets (Square, Landscape, Portrait variations)
- ✅ PNG format output with safety checker disabled

### Image-to-Image Generation
- ✅ 2 specialized models (SeedDream v4 Edit, Nano-Banana Edit)
- ✅ File upload with preview and validation (PNG, JPG, WebP up to 15MB with automatic compression)
- ✅ Same aspect ratio support as text-to-image

### Core Features
- ✅ Consolidated interface with Image/Video tabs
- ✅ Mode toggle between text-to-image and image-to-image within Image tab
- ✅ API key management (secure environment variables)
- ✅ Image download functionality
- ✅ Error handling and loading states
- ✅ Responsive design with shadcn/ui
- ✅ Clean default theme with excellent contrast
- ✅ Video placeholder tab for future features

## 🔑 Environment

API key is stored securely in environment variables. No backend required.

### Security Features
- Environment-based API key storage (not in browser)
- `.env` files automatically ignored by Git
- No localStorage exposure to XSS attacks
- Clear setup instructions for new developers

## 📄 License

Private project.