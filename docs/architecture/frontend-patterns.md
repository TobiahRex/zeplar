# Zeplar Frontend Patterns & Conventions

**Last Updated**: 2025-12-27

This document captures the frontend architectural patterns, coding conventions, and best practices used in the Zeplar codebase.

---

## State Management Patterns

### Current Architecture: Redux Toolkit (NO Sagas)

**⚠️ IMPORTANT DEVIATION**: The current codebase does NOT use Redux Sagas, which deviates from the frontend-engineer ROLE.md standard architecture.

#### Current Pattern (Redux Toolkit Only)

```typescript
// learningSlice.ts
const learningSlice = createSlice({
  name: "learning",
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<string[]>) {
      state.session = {
        isActive: true,
        queue: action.payload,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        results: [],
      };
    },
    // ... other reducers
  },
});
```

**Components dispatch actions directly**:

```typescript
// Component
const dispatch = useAppDispatch();
dispatch(startSession(cardKeys));
```

**NO sagas layer**. All logic is either in:

1. **Reducers** - State transformations
2. **Components** - UI logic and effects
3. **Custom hooks** - Shared logic (e.g., `usePersistence`)

#### When to Migrate to Sagas

**Trigger conditions** (any ONE of these):

- Need to add API calls for backend sync
- Complex async workflows (multi-step orchestration)
- Need request cancellation
- Side effects become difficult to test
- Component logic becomes bloated with business logic

**Migration path**:

1. Add `redux-saga` dependency
2. Create `src/sagas/` directory
3. Create `learningSagas.ts` with worker sagas
4. Move async logic from components to sagas
5. Keep reducers pure
6. Update store configuration with saga middleware

---

## Data Persistence Pattern

### Offline-First with IndexedDB

**Pattern**: Redux ↔ IndexedDB bidirectional sync via custom hook

```typescript
// lib/persistence.ts
export function usePersistence() {
  const dispatch = useAppDispatch();
  const progress = useAppSelector(selectProgress);
  const stats = useAppSelector(selectStats);

  // 1. Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      const [storedProgress, storedStats] = await Promise.all([
        loadAllCardProgress(),
        loadStats(),
      ]);
      dispatch(loadProgress(storedProgress));
      dispatch(loadStats(storedStats));
    }
    hydrate();
  }, [dispatch]);

  // 2. Persist changes to IndexedDB (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAllCardProgress(progress);
    }, 500);
    return () => clearTimeout(timer);
  }, [progress]);
}
```

**Key characteristics**:

- **500ms debounce** on writes to avoid thrashing
- **Bulk operations** for efficiency (`bulkPut`)
- **Hydration on mount** before rendering
- **Date serialization** (ISO strings in DB, Date objects in Redux)

**Dexie schema**:

```typescript
this.version(1).stores({
  cardProgress: "cardKey, nextReviewDate, state",
  stats: "id",
  sessions: "++id, startedAt",
});
```

---

## Component Patterns

### 1. Feature-Based Organization

**Pattern**: Group by feature, not by type

```
features/
└── learning/
    ├── components/
    │   ├── Flashcard/
    │   │   ├── CardFlip.tsx       # Animation wrapper
    │   │   ├── CardFront.tsx      # Question side
    │   │   ├── CardBack.tsx       # Answer side
    │   │   └── RatingButtons.tsx  # Quality rating UI
    │   └── StudySession.tsx       # Feature orchestration
    └── learningSlice.ts           # Feature state
```

**Benefits**:

- Co-located related code
- Easy to find feature-specific logic
- Clear feature boundaries

### 2. Composition Over Configuration

**Pattern**: Small, focused components composed together

```typescript
// CardFlip wraps front/back
<CardFlip
  isFlipped={isFlipped}
  front={<CardFront card={currentCard} onFlip={handleFlip} />}
  back={<CardBack card={currentCard} onRate={handleRate} />}
/>
```

**NOT this**:

```typescript
// ❌ Avoid prop drilling
<Card
  card={currentCard}
  isFlipped={isFlipped}
  onFlip={handleFlip}
  onRate={handleRate}
  showRating={true}
  showHint={false}
  // ... 20 more props
/>
```

### 3. Custom Hooks for Shared Logic

**Pattern**: Extract reusable logic to custom hooks

```typescript
// lib/persistence.ts
export function usePersistence() {
  // Complex hydration & persistence logic
  return { isHydrated: isHydrated.current };
}

// App.tsx
export default function App() {
  usePersistence(); // Clean API
  // ...
}
```

**Benefits**:

- Testable in isolation
- Reusable across components
- Hides complexity

### 4. Typed Redux Hooks

**Pattern**: Pre-typed hooks for type safety

```typescript
// app/hooks.ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Usage**:

```typescript
// ✅ Typed automatically
const session = useAppSelector(selectSession);

// ❌ NOT this (requires manual typing)
const session = useSelector((state: RootState) => state.learning.session);
```

---

## Selector Patterns

### Memoized Selectors

**Pattern**: Export selectors from slice files

```typescript
// learningSlice.ts
export const selectProgress = (state: { learning: LearningState }) =>
  state.learning.progress;

export const selectCurrentCardKey = (state: { learning: LearningState }) => {
  const { session } = state.learning;
  if (!session.isActive || session.currentIndex >= session.queue.length) {
    return null;
  }
  return session.queue[session.currentIndex];
};
```

**Benefits**:

- Co-located with state shape
- Type-safe
- Easy to test
- Derive data once, use many times

**NOT this**:

```typescript
// ❌ Avoid inline selectors in components
const currentCard =
  session.isActive && session.currentIndex < session.queue.length
    ? session.queue[session.currentIndex]
    : null;
```

---

## UI Component Patterns

### shadcn/ui Pattern

**Pattern**: Radix UI primitives + Tailwind + CVA (class-variance-authority)

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

**Usage**:

```typescript
<Button variant="destructive" size="lg">Delete</Button>
```

**Benefits**:

- Consistent variants
- Type-safe props
- Easy to extend
- Tailwind utility classes

---

## Animation Patterns

### Framer Motion for Transitions

**Pattern**: Declarative animations with `motion` components

```typescript
// CardFlip.tsx
<motion.div
  animate={{ rotateY: isFlipped ? 180 : 0 }}
  transition={{ duration: 0.6, type: 'spring' }}
>
  {isFlipped ? back : front}
</motion.div>
```

**When to use**:

- Page transitions
- Card flips
- List animations
- Gesture-based interactions

**When NOT to use**:

- Simple hover effects (use CSS)
- Loading spinners (use CSS)
- Trivial transitions (use Tailwind)

---

## Data Modeling Patterns

### 1. Zod for Runtime Validation

**Pattern**: Define schemas with Zod, infer TypeScript types

```typescript
// data/schema.ts
export const PatternSchema = z.object({
  id: z.string(),
  concept: ConceptSchema,
  // ...
});

export type Pattern = z.infer<typeof PatternSchema>;
```

**Benefits**:

- Runtime validation
- Single source of truth for types
- Parse external data safely
- Great error messages

### 2. Hierarchical Data Structure

**Pattern**: 6-layer progressive disclosure

```
Pattern
├── Layer 1: Concept (what it is, why it exists)
├── Layer 2: Structure (participants, flow, invariants)
├── Layer 3: Code (annotated examples)
├── Layer 4: System Context (where it lives)
├── Layer 5: Technology Mapping (libraries, frameworks)
└── Layer 6: System Composition (real-world usage)
```

**Unlocking**: Master L1 before L2, L2 before L3, etc.

### 3. Unique Key Generation

**Pattern**: Composite keys for flashcards

```typescript
// Format: {patternId}:L{layer}:{questionType}
const cardKey = `circuit-breaker:L1:definition`;

// Parse back to components
const { patternId, layer, questionType } = parseCardKey(cardKey);
```

**Benefits**:

- Deterministic (no DB needed)
- Human-readable
- Encodes hierarchy

---

## Styling Patterns

### Tailwind Utility-First

**Pattern**: Compose styles with utility classes

```typescript
<div className="min-h-screen bg-background p-8">
  <div className="max-w-4xl mx-auto space-y-8">
    <h1 className="text-4xl font-bold tracking-tight">Zeplar</h1>
  </div>
</div>
```

**Conventions**:

- Use semantic color tokens (`bg-background`, `text-primary`)
- Use spacing scale (`space-y-4`, `p-8`)
- Use responsive prefixes (`md:grid-cols-2`)
- Use dark mode prefix (`dark:bg-slate-900`)

### Class Merging with `cn()`

**Pattern**: Merge Tailwind classes safely

```typescript
// lib/utils.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn("base-classes", variant === "large" && "text-lg")} />
```

**Benefits**:

- Handles class conflicts (e.g., `p-4` + `p-8` → `p-8`)
- Conditional classes
- Type-safe

---

## Testing Patterns

### Current State: Minimal Tests

**⚠️ WARNING**: The codebase currently has NO test files.

### Recommended Testing Strategy (Future)

#### 1. Component Tests (Vitest + Testing Library)

```typescript
// StudySession.test.tsx
describe('StudySession', () => {
  it('flips card on space key press', async () => {
    const { getByText } = render(<StudySession />, {
      preloadedState: mockState
    })

    fireEvent.keyDown(window, { code: 'Space' })

    expect(getByText('Answer side')).toBeInTheDocument()
  })
})
```

#### 2. Selector Tests

```typescript
// learningSlice.test.ts
describe("selectCurrentCardKey", () => {
  it("returns null when session is not active", () => {
    const state = { learning: { session: { isActive: false } } };
    expect(selectCurrentCardKey(state)).toBeNull();
  });
});
```

#### 3. Reducer Tests

```typescript
describe("learningSlice", () => {
  it("starts a new session", () => {
    const state = learningReducer(undefined, startSession(["card1", "card2"]));
    expect(state.session.isActive).toBe(true);
    expect(state.session.queue).toEqual(["card1", "card2"]);
  });
});
```

#### 4. SM-2 Algorithm Tests

```typescript
describe("calculateSM2", () => {
  it("increases interval on correct answer", () => {
    const result = calculateSM2(initialProgress, 5);
    expect(result.interval).toBeGreaterThan(initialProgress.interval);
  });
});
```

---

## Performance Patterns

### Current Optimizations

1. **Debounced saves** - 500ms delay on IndexedDB writes
2. **Memoized selectors** - Derive data once
3. **Vite code splitting** - Automatic chunk splitting
4. **React 19 batching** - Automatic state update batching

### Future Optimizations

1. **React.memo** for expensive components

   ```typescript
   export const PatternCard = memo(({ pattern }) => {
     /* ... */
   });
   ```

2. **Virtualization** for long lists

   ```typescript
   import { useVirtualizer } from "@tanstack/react-virtual";
   ```

3. **Lazy loading** for code examples

   ```typescript
   const CodeEditor = lazy(() => import("./CodeEditor"));
   ```

4. **Service worker** for offline caching
   ```typescript
   // vite-plugin-pwa
   ```

---

## Error Handling Patterns

### Current State: Minimal Error Handling

**⚠️ GAP**: No error boundaries, no global error handling

### Recommended Patterns (Future)

#### 1. Error Boundaries

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

#### 2. Try-Catch in Async Operations

```typescript
// lib/persistence.ts
try {
  await saveAllCardProgress(progress);
} catch (error) {
  console.error("Failed to save progress:", error);
  // Show toast notification
}
```

#### 3. Validation with Zod

```typescript
const result = PatternSchema.safeParse(data);
if (!result.success) {
  console.error("Invalid pattern data:", result.error);
  return null;
}
```

---

## Accessibility Patterns

### Current State: Basic Semantic HTML

**Gaps**:

- No ARIA labels
- No focus management
- No screen reader announcements
- No reduced motion support

### Recommended Patterns (Future)

#### 1. ARIA Labels

```typescript
<Button aria-label="Show answer" onClick={handleFlip}>
  Reveal
</Button>
```

#### 2. Keyboard Navigation

```typescript
// StudySession.tsx - Already implemented ✅
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") handleFlip();
    if (e.key >= "1" && e.key <= "6") handleRate(parseInt(e.key));
    if (e.code === "Escape") handleEndSession();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

#### 3. Focus Management

```typescript
import { useFocusTrap } from '@/hooks/useFocusTrap'

function Modal() {
  const modalRef = useFocusTrap()
  return <div ref={modalRef}>...</div>
}
```

#### 4. Screen Reader Announcements

```typescript
<div aria-live="polite" aria-atomic="true">
  Card {current} of {total}
</div>
```

#### 5. Reduced Motion

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

<motion.div
  animate={{ rotateY: isFlipped ? 180 : 0 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.6,
    type: 'spring'
  }}
/>
```

---

## File Organization Conventions

### Import Order

```typescript
// 1. External dependencies
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal absolute imports (aliased with @)
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { selectSession } from "@/features/learning/learningSlice";

// 3. Types
import type { Quality } from "@/lib/sm2";
```

### Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage**:

```typescript
import { Button } from "@/components/ui/button"; // ✅
import { Button } from "../../../components/ui/button"; // ❌
```

---

## Naming Conventions

### Components

- **PascalCase**: `StudySession.tsx`, `CardFlip.tsx`
- **Descriptive**: `RatingButtons.tsx` not `Buttons.tsx`

### Functions

- **camelCase**: `generateAllL1Cards`, `calculateSM2`
- **Verb prefixes**: `get`, `set`, `handle`, `calculate`, `generate`

### Constants

- **SCREAMING_SNAKE_CASE** for true constants: `const MAX_TURNS = 10`
- **camelCase** for objects: `const qualityColors = { ... }`

### Types & Interfaces

- **PascalCase**: `Pattern`, `CardProgress`, `StudySession`
- **Prefix interfaces** with `I` only if ambiguous with a value

### Files

- **Components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`
- **Data**: `kebab-case.ts`

---

## Git Commit Conventions

**Format** (from CLAUDE.md):

```
<TOPIC> | <DESCRIPTION>

CONTEXT:
- Context point 1
- Context point 2

MAIN:
- Passive voice change description
- Another change description
```

**Example**:

```
Feature | Add study session keyboard shortcuts

CONTEXT:
- Users requested faster navigation during study
- Space bar and number keys improve flow

MAIN:
- Adds Space to flip card
- Adds 1-6 keys to rate quality
- Adds Escape key to end session
```

---

## Decision Log

### Why NO Redux Sagas?

**Decision**: Start with Redux Toolkit only, add sagas later if needed

**Rationale**:

- No API calls yet (offline-first)
- Simple async flows (useEffect sufficient)
- Reduced bundle size
- Faster iteration

**Revisit when**:

- Adding backend sync
- Complex multi-step workflows
- Need request cancellation

### Why IndexedDB over LocalStorage?

**Decision**: Use Dexie (IndexedDB wrapper)

**Rationale**:

- Larger storage quota (no 5MB limit)
- Structured queries (by `nextReviewDate`, `state`)
- Better performance for bulk operations
- Support for complex data types

### Why Tailwind over CSS Modules?

**Decision**: Tailwind CSS with utility-first approach

**Rationale**:

- Faster iteration (no context switching)
- Consistent design tokens
- Smaller bundle (purged unused classes)
- shadcn/ui ecosystem compatibility

### Why Framer Motion over CSS Animations?

**Decision**: Framer Motion for complex animations, CSS for simple ones

**Rationale**:

- Declarative animation API
- Gesture support
- Better spring physics
- React-friendly

**Use CSS for**: Hovers, simple fades, loading spinners

---

## Future Architecture Considerations

### Multi-Device Sync

**When to implement**: User requests or multiple-device usage data

**Approach**:

1. Add backend API (coordinate with backend-engineer)
2. Implement conflict resolution (CRDTs or last-write-wins)
3. Use Redux Sagas for sync orchestration
4. Add optimistic updates
5. Handle offline queue

### Collaborative Learning

**When to implement**: User requests sharing or community features

**Approach**:

1. Add user accounts & auth
2. Pattern submission/review system
3. Shared pattern libraries
4. Social features (leaderboards, streaks)

### Advanced Analytics

**When to implement**: Users want to track learning effectiveness

**Approach**:

1. Add analytics dashboard
2. Track learning velocity
3. Predict mastery timeline
4. Identify weak areas
5. Suggest review schedule adjustments

---

## Summary

**Current Architecture**: Simple, offline-first, Redux Toolkit only

**Strengths**:

- ✅ Clean separation of concerns
- ✅ Type-safe with TypeScript
- ✅ Offline-first with IndexedDB
- ✅ Solid component patterns
- ✅ Good DX with Vite

**Gaps**:

- ⚠️ No Redux Sagas (plan to add)
- ⚠️ No tests (critical gap)
- ⚠️ Limited error handling
- ⚠️ Minimal accessibility
- ⚠️ No analytics

**Next Steps**:

1. Add comprehensive test coverage
2. Implement accessibility features
3. Add error boundaries
4. Consider Redux Sagas for future async needs
5. Improve documentation
