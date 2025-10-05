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

### Current Features (Phases 1-4.1 Complete)

**Platform:**
- 3 text-to-image models (SDXL-Lightning, SeedDream v4, GPT Image 1 BYOK)
- 6 image-to-image models (SeedDream Edit, Nano-Banana, GPT Edit BYOK, WAN 2.5, FLUX, Qwen)
- 1 video model (Veo 3 Fast)
- Image/Video tabs with mode toggle (T2I/I2I)
- Auto-save with folder selection (File System Access API)
- "Use in Image-to-Image" workflow for iteration

### Phase 5.0: Universal Parameters (COMPLETED ✅)

**Core Features:**
- [x] Seed parameter for reproducible generation (T2I & I2I, range: 0-2147483647)
- [x] Negative prompt for quality control (T2I & I2I)
- [x] Universal strength slider for ALL I2I models (0.1-1.0)
- [x] localStorage persistence for seed values across sessions
- [x] Advanced Settings collapsible UI section with clear/reset functionality
- [x] Enhanced API logging with full parameter visibility for debugging

**Testing:**
- Validated SDXL-Lightning, SeedDream v4 (T2I), SeedDream v4 Edit (I2I)
- Verified seed=42069, negative prompts, and strength parameters pass to API correctly
- Confirmed auto-save toggle works, "Use in Image-to-Image" workflow functions
- All parameters visible in console logs (`fullInput` object)

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

**CRITICAL: DO NOT attempt to add models yourself. ALWAYS delegate to the fal-media-specialist sub-agent.**

**When a developer asks to add a new fal.ai model:**

1. **Gather Required Information** (if not provided):
   - Model name or description
   - Model URL (fal.ai page link, e.g., `https://fal.ai/models/fal-ai/flux/dev`)
   - Model type (text-to-image, image-to-image, or video)
   - Purpose/intended use case

2. **Delegate to fal-media-specialist Agent**:
   ```bash
   # Use the Task tool to launch the fal-media-specialist agent
   Task(
     subagent_type: "fal-media-specialist",
     prompt: "Research and document the [model-name] model from fal.ai.
             URL: [model-url]
             Type: [text-to-image/image-to-image/video]

             Follow the workflow in your agent instructions:
             1. Navigate to the fal.ai model page using Chrome DevTools MCP
             2. Extract complete API specifications (model ID, parameters, pricing, input format)
             3. Create model documentation using template from docs/adding-new-models.md
             4. Provide model config for src/lib/models.ts
             5. Provide API integration code if special handling needed
             6. Create testing checklist

             Return: Complete model documentation, code snippets, and implementation plan."
   )
   ```

3. **After Agent Returns - Implementation Checklist**:

   **REQUIRED STEPS (complete ALL before marking task done):**

   - [ ] Review the documentation markdown provided by the agent
   - [ ] **CREATE MODEL DOCUMENTATION FILE**: Use the Write tool to create `docs/models/[model-name].md` with the content provided by the agent
   - [ ] Implement code changes to `src/lib/models.ts` (add model config)
   - [ ] Implement code changes to `src/lib/fal.ts` (if special handling needed)
   - [ ] Test using Chrome DevTools MCP with the agent's checklist
   - [ ] Verify universal parameters work (seed, negative_prompt, strength for I2I)
   - [ ] Update CLAUDE.md (add new Phase section for the model)
   - [ ] Update README.md (increment model count in features)

   **File Creation is MANDATORY**: Every new model MUST have documentation in `docs/models/[model-name].md`. This is not optional - it's a required deliverable for model integration.

**Why Delegate?**
- The fal-media-specialist agent has browser automation tools (Chrome DevTools MCP)
- It's specifically trained to research fal.ai documentation and extract specs
- It follows the complete template from `docs/adding-new-models.md`
- It ensures consistency with existing model implementations
- You focus on code implementation and testing, not research

**Universal Parameters (Phase 5.0):**
All new models automatically support:
- `seed` (0-2147483647) for reproducibility
- `negative_prompt` for quality control
- `strength` (0.1-1.0) for I2I models
These are handled automatically - just verify the model supports them in fal.ai docs.

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
_Current Phase: 5.0 (COMPLETED ✅) - Universal Parameters_
_Updated: October 5, 2025_
_Status: Complete image and video generation platform with 7 total models (3 text-to-image + 4 image-to-image + 1 video), advanced parameter controls (seed, negative prompt, strength), localStorage persistence, and full auto-save capabilities with seamless iteration workflow_
_GitHub: https://github.com/undeadpickle/darkcanvas_
