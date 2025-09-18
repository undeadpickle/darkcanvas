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
- Git operations and PR creation
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

### Effective Prompting for Claude Code

1. **Be explicit about constraints**: "Using only shadcn/ui components..."
2. **Reference the docs**: "Following our PRD and CLAUDE.md guidelines..."
3. **Ask for exploration first**: "What's the current structure of the generation module?"
4. **Use TDD for critical paths**: Write tests first, then implementation

### Git Worktrees for Parallel Work

```bash
# Work on multiple features simultaneously
git worktree add ../darkcanvas-api-key feature/api-key
git worktree add ../darkcanvas-generation feature/generation
# Run separate Claude sessions in each
```

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
- [x] 2 specialized I2I models (SeedDream v4 Edit, Nano-Banana Edit)
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

### What NOT to Build (YAGNI)

❌ History/gallery (Phase 3)
❌ Parameter presets (Phase 3)
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

### Adding New Fal.ai Models

**ALWAYS get accurate pricing before adding models.**

1. **Get Pricing**: Navigate to `https://fal.ai/models/[model-id]` with Playwright
2. **Look for**: "Your request will cost $X per image" text
3. **Update models.ts** with exact format: `"Cost level ~$0.XX/image"`
4. **Test API**: Verify the model works and check for special parameters

**Cost Format Examples:**

- `"Free ~$0/image"` (SDXL Lightning)
- `"Low cost ~$0.03/image"` (SeedDream)
- `"Medium cost ~$0.05/image"` (WAN v2.2)
- `"Higher cost ~$0.039/image"` (Nano-Banana)

### Browser Automation

Use Playwright for all browser research:

```bash
mcp__playwright__browser_navigate
mcp__playwright__browser_snapshot
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

## Git Workflow

```bash
# Simple commits, often
git add .
git commit -m "feat: generate button works"
git push

# Not this
git commit -m "feat: implement abstract generation service with strategy pattern and dependency injection for future extensibility"
```

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
_Current Phase: 3.0 (COMPLETED ✅) - Consolidated UI with Video Placeholder_
_Updated: September 18, 2025_
_Status: 5 total models (3 text-to-image + 2 image-to-image) including OpenAI BYOK models - removed problematic WAN models_
_GitHub: https://github.com/undeadpickle/darkcanvas_
