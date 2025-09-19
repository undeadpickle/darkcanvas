# DarkCanvas Refactoring Analysis
Generated: 19-09-2025 12:15:00

## Executive Summary
DarkCanvas codebase shows signs of rapid MVP development with opportunities for component extraction, TypeScript improvements, and architectural organization. Two files exceed 400 lines (fal.ts: 527, GenerationForm.tsx: 495) and require immediate splitting.

## Current State
- Total components: 22 TypeScript files
- Largest file: src/lib/fal.ts (527 lines)
- TypeScript coverage: ~98% typed (5 `any` types found)
- Key issues:
  1. Monolithic components with mixed concerns
  2. Missing custom hooks for complex state logic
  3. Duplicate JSX patterns across form components

## Refactoring Opportunities

### High Priority

#### 1. **src/lib/fal.ts**
- Current: 527 lines, handles all API logic
- Issue: Mixed responsibilities - configuration, text-to-image, image-to-image, error handling all in one file
- Solution: Extract into separate modules by responsibility
- Example:
  ```typescript
  // Before: Single file with everything
  // src/lib/fal.ts (527 lines)

  // After: Split by concern
  // src/lib/api/config.ts (30 lines)
  // src/lib/api/text-to-image.ts (150 lines)
  // src/lib/api/image-to-image.ts (150 lines)
  // src/lib/api/error-handler.ts (100 lines)
  // src/lib/api/index.ts (20 lines - exports)
  ```

#### 2. **src/components/generation/GenerationForm.tsx**
- Current: 495 lines, complex state management and UI
- Issue: Handles both T2I and I2I logic, external image processing, model selection, validation, and rendering
- Solution: Extract hooks and sub-components
- Example:
  ```typescript
  // Extract custom hooks
  // src/hooks/useGenerationState.ts
  export function useGenerationState() {
    const [generationType, setGenerationType] = useState<GenerationType>('text-to-image');
    const [prompt, setPrompt] = useState('');
    // ... other state logic
    return { generationType, prompt, ... };
  }

  // Extract sub-components
  // src/components/generation/ModelSelector.tsx
  // src/components/generation/AspectRatioSelector.tsx
  // src/components/generation/GenerationStatus.tsx
  ```

#### 3. **Duplicate Model/Aspect Ratio Selectors**
- Current: Same Select pattern repeated twice in GenerationForm (lines 279-320 and 324-365)
- Issue: Violates DRY principle
- Solution: Extract shared selector components
- Example:
  ```typescript
  // src/components/generation/ConfigSelectors.tsx
  export function ModelSelector({ value, onChange, models }) {
    return (
      <div className="space-y-2">
        <label>Model</label>
        <Select value={value} onValueChange={onChange}>
          {/* ... */}
        </Select>
      </div>
    );
  }
  ```

### Medium Priority

#### 1. **TypeScript `any` Types**
- Current: 5 instances in src/lib/fal.ts
- Issue: Loss of type safety in error handling
- Solution: Create proper error types
- Example:
  ```typescript
  // Before
  const errorAny = error as any;

  // After
  interface FalApiError {
    detail?: Array<{ type: string; msg: string }>;
    body?: { detail?: string };
  }
  const typedError = error as FalApiError;
  ```

#### 2. **Image Upload Component**
- Current: 227 lines with nested conditional rendering
- Issue: Complex preview/upload state logic
- Solution: Split into UploadZone and ImagePreview components
- Example:
  ```typescript
  // src/components/generation/ImagePreview.tsx
  // src/components/generation/UploadZone.tsx
  ```

#### 3. **Missing Hooks Directory**
- Current: No dedicated hooks directory
- Issue: Complex state logic mixed with components
- Solution: Create hooks/ directory with custom hooks
- Structure:
  ```
  src/hooks/
  ├── useImageGeneration.ts
  ├── useModelSelection.ts
  ├── useImageUpload.ts
  └── useOpenAIKey.ts
  ```

### Low Priority

#### 1. **Error Boundary Implementation**
- Current: No error boundaries
- Issue: Runtime errors crash entire app
- Solution: Add ErrorBoundary wrapper component

#### 2. **Constants Extraction**
- Current: Magic numbers and strings scattered
- Issue: Hard to maintain and update
- Solution: Create constants file
- Example:
  ```typescript
  // src/constants/generation.ts
  export const GENERATION_DEFAULTS = {
    INFERENCE_STEPS: 4,
    STRENGTH_DEFAULT: 0.8,
    MAX_IMAGE_SIZE_MB: 15,
  };
  ```

## Implementation Plan

### Phase 1: Component Extraction (2-3 hours)
- [ ] Split GenerationForm into smaller components
  - [ ] Extract ModelSelector component
  - [ ] Extract AspectRatioSelector component
  - [ ] Extract GenerationStatus component
  - [ ] Extract OpenAI key validation logic
- [ ] Split ImageUpload into preview/upload components
- [ ] Create shared form field wrapper components

### Phase 2: Type Safety (1-2 hours)
- [ ] Replace 5 `any` types with proper interfaces
- [ ] Create FalApiError interface
- [ ] Add strict mode to tsconfig.json
- [ ] Define proper return types for all functions

### Phase 3: Architecture (3-4 hours)
- [ ] Create hooks directory structure
- [ ] Extract useGenerationState hook
- [ ] Extract useImageUpload hook
- [ ] Extract useModelSelection hook
- [ ] Split fal.ts into modular API structure
- [ ] Implement proper error boundaries
- [ ] Extract constants to dedicated files

### Phase 4: Code Quality (1 hour)
- [ ] Remove duplicate selector patterns
- [ ] Consolidate validation logic
- [ ] Standardize error handling patterns
- [ ] Add JSDoc comments for complex functions

## Risk Assessment
- **Breaking changes**: Medium risk - Component prop interfaces will change
- **Testing gaps**: High risk - No test coverage for refactored code
- **Performance concerns**: Low risk - Refactoring should improve performance

## Success Metrics
- All components < 200 lines
- Zero `any` types remaining
- Clear separation of UI and business logic
- Improved type safety throughout
- Consistent error handling patterns
- Reusable custom hooks extracted

## Recommended Execution Order
1. **Start with GenerationForm** - Highest impact, most complex
2. **Then fal.ts** - Critical for maintainability
3. **Create hooks directory** - Foundation for better architecture
4. **Fix TypeScript issues** - Quick wins for type safety
5. **Extract constants** - Low risk, high value

## Notes
- Codebase follows MVP principles (KISS, YAGNI) appropriately
- shadcn/ui components are well integrated
- Good use of TypeScript overall
- Logger utility is simple and effective
- API key management could be more secure but acceptable for MVP

## Deferred Items (Future Phases)
- Unit test coverage
- E2E testing setup
- Storybook for component development
- API response caching layer
- WebSocket support for real-time generation updates
- Comprehensive error tracking/monitoring