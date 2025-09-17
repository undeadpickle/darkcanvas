# DarkCanvas

A simple web interface for Fal.ai image generation using SDXL-Lightning model.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Fal.ai API key

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Setup
1. Open http://localhost:5173
2. Enter your Fal.ai API key when prompted
3. Enter a prompt and click "Generate Image"

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
│   ├── ui/              # shadcn/ui components
│   └── generation/      # Image generation components
├── lib/
│   ├── fal.ts          # Fal.ai client setup
│   ├── logger.ts       # Simple logging
│   └── utils.ts        # Utilities
├── types/              # TypeScript definitions
└── index.css          # Global styles with default theme
```

## 🛠️ Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and workflow.

See [PRD](./docs/darkcanvas-prd.md) for product requirements and architecture.

## 📋 Features

- ✅ SDXL-Lightning image generation
- ✅ API key management (localStorage)
- ✅ Image download functionality
- ✅ Error handling and loading states
- ✅ Responsive design with shadcn/ui
- ✅ Clean default theme with excellent contrast

## 🔑 Environment

API key is stored securely in browser localStorage. No backend required.

## 📄 License

Private project.