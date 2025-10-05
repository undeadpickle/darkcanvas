# CLAUDE.md

<!-- Claude Code automatically reads this file for project context and guidelines -->

## 🎯 Project: DarkCanvas - Fal.ai Image Generation Interface

**MVP Goal: Ship working image generator in 1 week**

## Core Philosophy: KISS → YAGNI → DRY

**Ship fast, iterate based on actual usage**

### Development Principles

- **KISS**: Choose boring technology that works
- **YAGNI**: Build only what's needed for current phase
- **DRY**: Extract patterns only after they appear 2-3 times
- **MVP First**: Working > Perfect

## 🤖 Using Claude Code (Agentic Terminal Tool)

### Sub-Agents Feature (Aug 2025)

**TL;DR: Claude Code can spawn specialized sub-agents for complex tasks**

**What**: Independent AI agents with focused expertise and separate context
**When**: Multi-file refactors, parallel exploration, complex debugging
**For DarkCanvas MVP**: Probably YAGNI - our scope is too simple

If needed: `/agents` in Claude Code creates them automatically

### When to Use Claude Code vs This Chat

**Claude Code** (`claude` in terminal):

- Multi-file edits and refactoring
- Running tests and debugging
- Exploring unfamiliar codebases
- Batch operations across files

**This Chat Interface**:

- Planning and architecture decisions
- Creating initial artifacts/templates
- Understanding concepts
- Reviewing approach before implementation

### Claude Code Best Practices for DarkCanvas

```bash
# Basic workflow
cd darkcanvas
claude  # Interactive mode

# Headless mode for specific tasks
claude -p "Convert the API key dialog to use shadcn Dialog component"

# TDD approach (great for MVPs!)
claude -p "Write tests for image generation with mock Fal.ai responses"
# Review tests, then:
claude -p "Now implement the code to pass these tests"
```

**[Chrome DevTools MCP]** Use Chrome DevTools MCP for browser automation, console inspection, performance analysis, and debugging. Official MCP server from Google Chrome team - no extensions needed. https://github.com/ChromeDevTools/chrome-devtools-mcp

```bash
# Installation: Add to your MCP config (automatically available in Claude Code)
# No server needed - runs directly via npx
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest"]
  }
}
```

### Effective Prompting for Claude Code

1. **Be explicit about constraints**: "Using only shadcn/ui components..."
2. **Reference the docs**: "Following our PRD and CLAUDE.md guidelines..."
3. **Ask for exploration first**: "What's the current structure of the generation module?"
4. **Use TDD for critical paths**: Write tests first, then implementation

### ⚠️ Claude Code Limitations for MVP

- Don't let it over-engineer (remind it about YAGNI)
- Always verify it's using Phase 1 scope only
- Check that it's not adding unnecessary dependencies
- Review before letting it commit (especially early on)

## Core Workflow: EXPLORE → PLAN → EXECUTE

### 1. EXPLORE Phase

- **FIRST**: Use ref MCP to verify current Fal.ai API documentation
- Read existing files to understand patterns
- Check docs/darkcanvas-prd.md for feature scope (stick to Phase 1!)
- Identify which shadcn/ui components to use

### 2. PLAN Phase

**Remember: We're shipping in 1 week, not building for enterprise**

- Break into small, shippable pieces
- Risk assessment for DarkCanvas:
  - **Low risk (1-2 files):** Just code it
  - **Medium risk (3+ files):** Quick plan, then code
  - **High risk (architecture):** Stop - probably YAGNI
- If plan takes >30 min, you're overthinking

### 3. EXECUTE Phase

- Follow plan, but pivot fast if blocked
- Test only critical paths (API key, generation)
- Use console.log for debugging (we have a simple logger)
- **[Chrome DevTools MCP]** When console.log isn't enough, use Chrome DevTools MCP to inspect browser state, analyze performance, capture screenshots, and debug runtime issues directly.
- Commit when it works, not when it's perfect

## DarkCanvas Specific Guidelines

### Tech Stack Reminders

- **UI**: Use shadcn/ui components (already styled)
- **Styling**: Tailwind with 8pt grid (space-2, space-4, space-6, space-8)
- **State**: React hooks only (no Redux for MVP)
- **API**: @fal-ai/serverless-client
- **Testing**: Vitest but only 2-3 critical tests
- **Logging**: Use our simple logger (lib/logger.ts)

### Phase 1 MVP Scope (COMPLETED ✅)

- [x] Single model support (SDXL-Lightning)
- [x] Basic prompt input
- [x] Generate button
- [x] Display image result
- [x] API key management (secure environment variables)
- [x] Simple error handling

### Phase 2 Scope (COMPLETED ✅)

- [x] Multiple model support (SDXL-Lightning, SeedDream v4)
- [x] Model selector dropdown with descriptions and costs
- [x] Aspect ratio presets (Square, Landscape, Portrait variations)
- [x] PNG format output with safety checker disabled
- [x] Robust response handling for different model formats

### Phase 2.5: Image-to-Image (COMPLETED ✅)

- [x] Mode toggle between text-to-image and image-to-image generation
- [x] 4 specialized I2I models (SeedDream v4 Edit, Nano-Banana Edit, GPT Image 1 Edit BYOK, WAN 2.5 Preview)
- [x] Image upload component with file validation (PNG, JPG, WebP up to 15MB with auto-compression)
- [x] Unified API handling for different model input formats (image_url vs image_urls)
- [x] Aspect ratio support for both generation modes

### Phase 3.0: Consolidated UI (COMPLETED ✅)

- [x] Top-level tabs (Image/Video) for future video features
- [x] Consolidated text-to-image and image-to-image under single "Image" tab
- [x] Fixed image upload functionality (replaced shadcn Input with native HTML input)
- [x] Removed problematic WAN models for better reliability
- [x] Added Video placeholder tab for future development
- [x] Fixed build errors in image response handling logic

### Phase 3.1: Use Generated Images as Source (COMPLETED ✅)

- [x] "Use in Image-to-Image" button on generated image results
- [x] Automatic mode switching from text-to-image to image-to-image
- [x] Seamless image iteration workflow for creative exploration
- [x] Auto-population of source image with aspect ratio detection

### Phase 4.0: Video Generation with Auto-Save (COMPLETED ✅)

- [x] Veo 3 Fast video generation model integration
- [x] Video tab with 4s/6s/8s duration options
- [x] 720p/1080p resolution support
- [x] Optional audio generation
- [x] File System Access API auto-save for images and videos
- [x] Folder selection for organized output management

### Phase 4.1: WAN 2.5 Preview Integration (COMPLETED ✅)

- [x] Added WAN 2.5 Preview I2I model to model selection
- [x] Full documentation in `docs/models/wan-25-preview-i2i.md`
- [x] Support for scene reimagining and dramatic transformations
- [x] Resolution constraints (384-5000px) with custom dimension support
- [x] Works with existing `image_urls` array format handler

### What NOT to Build (YAGNI)

❌ Perfect error handling
❌ Analytics
❌ User accounts
❌ Backend API

## Code Standards for DarkCanvas

### Simplicity Rules

```typescript
// YES - Simple and works
const generateImage = async (prompt: string) => {
  log.info("Generating image", { prompt });
  return await fal.generate(prompt);
};

// NO - Over-engineered for MVP
class ImageGenerationService {
  constructor(private strategy: GenerationStrategy) {}
  // ... 100 lines of abstraction
}
```

### Component Patterns

```tsx
// Use shadcn/ui components directly
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Keep components simple
export function GenerateButton({ onClick, loading }: Props) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="destructive" // Horror theme!
      className="w-full"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Skull />}
      Generate Nightmare
    </Button>
  );
}
```

### Testing Approach

```typescript
// Only test what breaks in production
describe("Critical Paths", () => {
  test("API key environment setup", () => {
    // User WILL see errors if environment not configured
  });

  test("Generation error handling", () => {
    // User WILL see white screen if this breaks
  });
});

// Skip these for MVP:
// - Component rendering
// - Style tests
// - Edge cases that won't happen
```

### When Stuck

1. Can this wait until Phase 2?
2. What's the simplest thing that works?
3. Would console.log solve this faster than complex debugging?
4. Ship it broken (but working) vs perfect (but not shipped)

## 🔍 Research & Integration Best Practices

### Model Documentation Reference

**ALWAYS consult our comprehensive model documentation when working with fal.ai models.**

All current models have detailed documentation in `docs/models/`:
- `fast-lightning-sdxl.md` - Free SDXL model specs and usage
- `seedream-v4-text-to-image.md` - High-quality T2I model details
- `gpt-image-1-text-to-image.md` - OpenAI BYOK T2I specifications
- `seedream-v4-edit.md` - Primary I2I model documentation
- `nano-banana-edit.md` - Google-powered I2I editing specs
- `gpt-image-1-edit.md` - OpenAI BYOK I2I editing details
- `veo3-fast.md` - Video generation model specifications

Each file contains technical specs, optimal use cases, parameter recommendations, cost analysis, and integration notes.

### Adding New Fal.ai Models

**Use the fal-media-specialist agent for all model research and documentation.**

1. **Research with Agent**: Use `.claude/agents/fal-media-specialist.md` to get current specs/pricing
2. **Update models.ts** with exact format: `"Cost level ~$0.XX/image"`
3. **Create Documentation**: Agent should generate new model MD file in `docs/models/`
4. **Test API**: Verify the model works and check for special parameters

**Cost Format Examples:**

- `"Free ~$0/image"` (SDXL Lightning)
- `"Low cost ~$0.03/image"` (SeedDream)
- `"Medium cost ~$0.05/image"` (WAN v2.2)
- `"Higher cost ~$0.039/image"` (Nano-Banana)

### Browser Automation

Use Chrome DevTools MCP for all browser automation and research:

**Installation** (add to MCP config):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

**Common Tasks**:
- Navigate to URLs: Use `navigate_page` tool
- Capture screenshots: Built into navigation tools
- Performance analysis: Use `performance_analyze_insight`
- Console inspection: Chrome DevTools Protocol provides full access
- Network monitoring: Available via CDP integration
- Responsive testing: Use `resize_page` tool

**Example**:
```bash
# Research fal.ai model documentation
navigate_page to https://fal.ai/models/fal-ai/flux
performance_analyze_insight to check page performance
```

## Anti-Patterns to Avoid

**NEVER in Phase 1:**

- Create abstract base classes
- Add "clever" TypeScript generics
- Build for "future scale"
- Add dependencies beyond PRD tech stack
- Spend >2 hours on any single feature
- Write documentation beyond code comments

**Red Flags You're Over-Engineering:**

- File has >100 lines
- Component has >3 levels of nesting
- You're creating a "system" or "framework"
- You're thinking about "other users"
- You haven't committed in 2+ hours

## Quick Command Reference

```bash
# Start dev
npm run dev

# Run critical tests only
npm test critical/

# Quick deploy check
npm run build && npm run preview

# When context gets messy
/clear
```

---

_Project: DarkCanvas_
_Goal: Ship MVP in 1 week_
_Current Phase: 4.1 (COMPLETED ✅) - WAN 2.5 Preview Integration_
_Updated: October 4, 2025_
_Status: Complete image and video generation platform with 7 total models (3 text-to-image + 4 image-to-image + 1 video) including OpenAI BYOK models, WAN 2.5 scene reimagining, full auto-save capabilities, and seamless iteration workflow_
_GitHub: https://github.com/undeadpickle/darkcanvas_
