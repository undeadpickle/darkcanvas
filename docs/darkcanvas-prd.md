# PRD: DarkCanvas - Fal.ai Model Interface Web App

## 🎯 Goal & Vision
Build a simple web interface to experiment with multiple fal.ai image generation models, allowing easy parameter tweaking and prompt testing for creative projects (especially horror/dark art).

## 🏛️ Development Philosophy
**Lightweight MVP following KISS, YAGNI, and DRY principles**
*See CLAUDE.md for detailed development practices*

## 🎭 User Story
*"As a creative developer, I want a simple web app where I can quickly test different fal.ai models with various parameters, so I can iterate on prompts and compare results without dealing with API code each time."*

## ✨ Core Features

### MVP (Phase 1)
1. **Model Selection** - Dropdown to choose between supported models
2. **Prompt Input** - Text area for image prompts  
3. **Basic Parameters** - Common settings like image size, steps, guidance
4. **Safety Configuration** - Safety checker disabled by default for unrestricted generation
5. **Generate Button** - Trigger image creation
6. **Image Display** - Show generated result with download option
7. **API Key Input** - Secure input for Fal.ai API key

### Nice-to-Have (Phase 2)
- **History** - Save recent generations locally
- **Parameter Presets** - Save/load common configurations
- **Batch Generation** - Multiple images at once
- **Cost Tracking** - Estimate API costs

## 🏗️ Technical Architecture

### Domain Model
```typescript
// Core entities
interface ImageGeneration {
  id: string;
  modelId: string;
  prompt: string;
  parameters: ModelParameters;
  result?: GeneratedImage;
  status: 'pending' | 'generating' | 'complete' | 'error';
  createdAt: Date;
}

interface ModelParameters {
  imageSize: string;
  steps: number;
  guidanceScale: number;
  enableSafetyChecker: boolean;
  // model-specific params...
}

interface FalModel {
  id: string;
  name: string;
  description: string;
  defaultParameters: ModelParameters;
  isTestModel: boolean; // for cheap testing
}
```

### Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with 8pt grid system
- **State**: React hooks
- **API Client**: @fal-ai/serverless-client
- **Storage**: Environment variables (.env files)
- **Logging**: Simple console wrapper for dev/prod
- **Testing**: Vitest for critical paths only
- **API Verification**: ref MCP for current Fal.ai docs

### API Key Management (SECURITY UPDATED 🔒)
- **Environment Variables**: `VITE_FAL_API_KEY` in `.env` file (primary method)
- **Security First**: No browser storage, no XSS exposure
- **Git Safe**: `.env` in `.gitignore`, `.env.example` for setup
- **Developer Friendly**: Clear error messages with setup instructions

## 🎨 Design Direction

### Visual Theme
- **Dark Theme**: Black/dark gray background with red/purple accents
- **Horror Aesthetic**: Gothic fonts, subtle shadows, eerie color palette
- **Clean Interface**: Don't let the theme interfere with usability

### Design System
- **8pt Grid**: All spacing uses multiples of 8px (0.5rem)
  - Micro: 8px (space-2)
  - Small: 16px (space-4)
  - Medium: 24px (space-6)
  - Large: 32px (space-8)
  - XL: 48px (space-12)
  - XXL: 64px (space-16)
- **Component Library**: shadcn/ui components with dark theme customization
- **Responsive Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px

### shadcn Components to Use
- **Form Controls**: Input, Textarea, Select, Slider, Switch
- **Layout**: Card, Separator, ScrollArea
- **Feedback**: Button, Badge, Alert, Skeleton, Progress
- **Overlays**: Dialog, DropdownMenu, Tooltip
- **Display**: Tabs, AspectRatio (for images)

## 📋 User Interface

### Main Screen Layout
```
┌─────────────────────────────────────┐
│ 🎃 DarkCanvas                       │
├─────────────────────────────────────┤
│ Model: [Select] [Badge:Test Mode]   │
│ Prompt: [Textarea]                  │
│ Parameters: Size, Steps, Guidance   │
│ [Generate Button - Red Accent]      │
├─────────────────────────────────────┤
│ [Generated Image Display]           │
│ [Download] [Save to History]        │
└─────────────────────────────────────┘
```

### Component Approach
- Use shadcn/ui components directly (Card, Button, Input, etc.)
- Apply 8pt grid consistently (p-8, space-y-6, etc.)
- Dark theme with red/purple accents via Tailwind
- *See CLAUDE.md for component patterns*

## 🚀 Implementation Phases

### Phase 1: Foundation & Basic Generation (MVP)
**Goal**: Ship working image generator in 1 week
- Verify Fal.ai API with ref MCP
- Basic project setup (Vite, React, TypeScript, shadcn/ui)
- Single model support (SDXL-Lightning - cheapest)
- Core UI: prompt input, generate button, image display
- API key management with secure environment variables
- Simple error handling and loading states
- Deploy to production (Vercel/Netlify)

### Phase 2: Multi-Model Support
**Goal**: Support all target models with their specific parameters
- Model selector with shadcn Select and Badge components
- Model-specific parameter controls with shadcn form components
- Parameter validation with shadcn form states
- Test mode toggle with shadcn Switch
- Model info with shadcn Tooltip

### Phase 3: Enhanced Parameters & UX
**Goal**: Make parameter tweaking smooth and intuitive
- Advanced controls with shadcn Slider, NumberInput
- Parameter presets with shadcn DropdownMenu
- Real-time validation feedback
- Progress indicator with shadcn Progress
- Toast notifications for actions

### Phase 4: History & Persistence
**Goal**: Remember and manage previous generations
- History gallery with shadcn ScrollArea
- Image cards with shadcn AspectRatio
- Actions with shadcn ContextMenu
- Export/import with shadcn Dialog
- Cost display with shadcn Badge

### Phase 5: Polish & Optimization
**Goal**: Production-ready with great UX
- Responsive grid refinements
- Keyboard shortcuts with shadcn Command
- Batch UI with shadcn Tabs
- Theme customization with CSS variables
- Loading optimizations

## 🤖 Supported Models
*Verify current endpoints/pricing with ref MCP before implementing*

### Primary Models
1. **SDXL-Lightning** - Cheap test model (~$0.003/image) - Phase 1
2. **fal-ai/flux/srpo** - High-quality flux variant - Phase 2
3. **fal-ai/bytedance/seedream/v4/text-to-image** - Advanced - Phase 2
4. **fal-ai/nano-banana** - Fast, lightweight option - Phase 2

### Model-Specific Parameters
- Each model will have its own parameter schema
- Common parameters (safety, size) shared across models
- Model-specific controls shown/hidden based on selection

## 📊 Success Metrics
**MVP (Phase 1)**: Live in production within 1 week, generates images successfully
**Future (Phase 2+)**: Multi-model support, cost tracking, personal usage

## ⚠️ Out of Scope for MVP
*See CLAUDE.md for detailed anti-patterns*
- Multiple models, authentication, database, CI/CD
- Perfect test coverage, complex state management
- Analytics, monitoring, PWA features
- Focus: One model, one user, one goal

## 📁 Project Structure
```
darkcanvas/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/       # App layout
│   │   └── generation/   # Image generation UI
│   ├── lib/
│   │   ├── fal.ts       # Fal.ai client
│   │   ├── models.ts    # Model configs
│   │   ├── logger.ts    # Simple logger
│   │   └── utils.ts     # Utilities
│   ├── hooks/           # React hooks
│   ├── types/           # TypeScript types
│   └── styles/
│       └── globals.css  # Tailwind + theme
├── tests/               # Critical path tests only
├── public/
└── package.json
```

## 🎯 Next Steps
1. Initialize: `npm create vite@latest darkcanvas -- --template react-ts`
2. Add shadcn/ui and configure dark theme
3. Verify Fal.ai API docs with ref MCP
4. Build MVP: single model, basic UI
5. Deploy to Vercel/Netlify
6. Iterate based on actual usage

*See CLAUDE.md for detailed development workflow*

## 🎯 Status Update

**Phase 1 MVP: COMPLETED ✅**

- ✅ All core features implemented and working
- ✅ Security upgraded to environment variables
- ✅ Clean shadcn/ui default theme for accessibility
- ✅ GitHub repository: https://github.com/undeadpickle/darkcanvas
- ✅ Ready for deployment to production

Ready for Phase 2 or production deployment! 🎨🌑