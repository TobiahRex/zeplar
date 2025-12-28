# Implementation Roadmap: Zeplar

> Living document tracking our build progress. Update checkboxes as we complete items.

---

## Current Status

| Phase                | Status         | Progress |
| -------------------- | -------------- | -------- |
| Phase 0: Foundation  | 🔵 Not Started | 0%       |
| Phase 1: Core Loop   | ⚪ Blocked     | -        |
| Phase 2: Multi-Layer | ⚪ Blocked     | -        |
| Phase 3: Exploration | ⚪ Blocked     | -        |
| Phase 4: Connections | ⚪ Blocked     | -        |
| Phase 5: Polish      | ⚪ Blocked     | -        |
| Phase 6: 3D Viz      | ⚪ Blocked     | -        |

**Legend**: 🟢 Complete | 🟡 In Progress | 🔵 Not Started | ⚪ Blocked

---

## Phase 0: Foundation

> **Goal**: Scaffolded app with data ready to consume.

### 0.1 Project Scaffold

- [ ] Initialize Vite + React + TypeScript project
  ```bash
  npm create vite@latest zeplar -- --template react-ts
  ```
- [ ] Install core dependencies
  ```bash
  npm install @reduxjs/toolkit react-redux react-router-dom dexie
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Install UI dependencies
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card tabs progress
  ```
- [ ] Install learning experience libraries
  ```bash
  npm install @uiw/react-codemirror @codemirror/lang-typescript
  npm install mermaid framer-motion
  ```
- [ ] Configure path aliases in `tsconfig.json` and `vite.config.ts`
- [ ] Set up directory structure per [06-app-architecture.md](./06-app-architecture.md)

**Checkpoint 0.1**: `npm run dev` shows blank React app with Tailwind working.

---

### 0.2 Pattern Data Transformation

- [ ] Create transformation script `scripts/transform-corpus.ts`
- [ ] Parse `patterns-corpus.md` hierarchy (Level 1-5)
- [ ] Generate JSON for first 3 patterns (minimal viable set):
  - [ ] **Circuit Breaker** — State machine, 3 states, clear transitions
  - [ ] **Retry** — Behavioral, backoff strategies, complements Circuit Breaker
  - [ ] **Cache-Aside** — Different category (Performance), read/write flow
- [ ] Create Zod schemas for validation (`src/data/schema.ts`)
- [ ] Write pattern JSON files to `src/data/patterns/`

**Checkpoint 0.2**: `npm run transform` generates valid JSON. Can import and log patterns in app.

---

### 0.3 Redux Store Setup

- [ ] Create store configuration (`src/app/store.ts`)
- [ ] Create typed hooks (`src/app/hooks.ts`)
- [ ] Create slices:
  - [ ] `entitiesSlice.ts` - patterns, systems, implementations
  - [ ] `learningSlice.ts` - cardProgress, session, reviewQueue
  - [ ] `explorationSlice.ts` - filters, navigation
  - [ ] `uiSlice.ts` - theme, modals, preferences
- [ ] Create basic selectors
- [ ] Wrap app in `<Provider>`

**Checkpoint 0.3**: Redux DevTools shows state tree. Can dispatch actions and see updates.

---

### 0.4 Persistence Layer

- [ ] Set up Dexie database (`src/lib/db.ts`)
- [ ] Define tables: sessions, dailyAggregates, cardProgress, settings
- [ ] Create persistence middleware or use dexie-react-hooks
- [ ] Implement hydration on app load
- [ ] Test: close app, reopen, state persists

**Checkpoint 0.4**: Progress survives browser refresh and tab close.

---

## Phase 1: Core Learning Loop

> **Goal**: Users can study L1 flashcards with spaced repetition.

### 1.1 SM-2 Algorithm

- [ ] Implement `calculateSM2()` function (`src/lib/sm2.ts`)
- [ ] Write unit tests for SM-2 edge cases
- [ ] Implement `canUnlockNextLayer()`
- [ ] Implement `getRecommendedCards()`

**Checkpoint 1.1**: Unit tests pass. Given mock progress data, algorithm returns correct intervals.

---

### 1.2 Card Generation (L1 Only)

- [ ] Create card generator (`src/lib/cardGenerator.ts`)
- [ ] Generate L1 question types:
  - [ ] `definition` - "What is Circuit Breaker?"
  - [ ] `problem-identification` - "What problem does X solve?"
  - [ ] `pattern-recognition` - "Which pattern is this describing?"
  - [ ] `tradeoff-analysis` - "What are the tradeoffs?"
- [ ] Store generated cards or generate on-demand (decide: **pre-generate L1**)

**Checkpoint 1.2**: Can generate 4+ card variants per pattern. Cards have front/back content.

---

### 1.3 Flashcard UI

- [ ] Create `<CardFlip>` component with framer-motion
- [ ] Create `<CardFront>` - shows question
- [ ] Create `<CardBack>` - shows answer + rating buttons
- [ ] Create `<RatingButtons>` - 0-5 scale with labels
- [ ] Create `<StudySession>` container component
- [ ] Wire up to Redux: dispatch `submitReview` action

**Checkpoint 1.3**: Can flip card, rate it, see next card. Feels smooth.

---

### 1.4 Session Flow

- [ ] Create `<StudyPage>` route
- [ ] Implement session queue builder
- [ ] Show progress indicator (cards remaining)
- [ ] Implement session summary screen
- [ ] Record session to IndexedDB

**Checkpoint 1.4**: Complete a 10-card study session. Session appears in DB.

---

### 1.5 Progress Dashboard

- [ ] Create `<DashboardPage>` route
- [ ] Show cards due today count
- [ ] Show current streak
- [ ] Show basic heatmap (last 7 days)
- [ ] Show per-pattern progress (L1 mastery %)

**Checkpoint 1.5**: Dashboard reflects actual study progress. Streak increments correctly.

---

### Phase 1 Complete Criteria

- [ ] Can study L1 cards for 10 patterns
- [ ] SM-2 schedules reviews correctly
- [ ] Progress persists across sessions
- [ ] Dashboard shows meaningful stats
- [ ] Heatmap tracks daily activity

**🎯 Phase 1 Demo**: Record a 2-minute video showing the core loop.

---

## Phase 2: Multi-Layer Cards

> **Goal**: Unlock and study L2-L3 cards with progression gates.

### 2.1 Layer 2: Structure Cards

- [ ] Add L2 content to pattern JSON:
  - [ ] Participants array
  - [ ] Mermaid diagram
  - [ ] Flow steps
  - [ ] Invariants
- [ ] Create `<MermaidRenderer>` component
- [ ] Generate L2 question types:
  - [ ] `participant-identification`
  - [ ] `flow-ordering` (drag-and-drop or multiple choice)
  - [ ] `diagram-completion`

**Checkpoint 2.1**: L2 cards render diagrams correctly. Can answer structure questions.

---

### 2.2 Layer 3: Code Cards

- [ ] Add L3 content to pattern JSON:
  - [ ] Code examples with contextDilation
  - [ ] ActionReason annotations
  - [ ] Highlights
- [ ] Create `<CodeHighlighter>` component (CodeMirror read-only)
- [ ] Create `<AnnotationOverlay>` for action-reason pairs
- [ ] Generate L3 question types:
  - [ ] `context-level-identification`
  - [ ] `action-identification`
  - [ ] `reason-identification`
  - [ ] `code-identification`

**Checkpoint 2.2**: L3 cards show syntax-highlighted code with annotations.

---

### 2.3 Layer Progression

- [ ] Implement unlock gates in UI
- [ ] Show locked layers with lock icon
- [ ] Show unlock requirements ("Need 80% mastery at L1")
- [ ] Celebrate layer unlock (confetti? toast?)
- [ ] Update selectors to filter by unlocked layers

**Checkpoint 2.3**: Cannot access L2 until L1 mastery >= 80%. Unlock feels rewarding.

---

### 2.4 Card Type Variations

- [ ] Implement multiple choice renderer
- [ ] Implement free-text input (for code completion)
- [ ] Implement ordering/sorting UI
- [ ] Add hints system (progressive reveal)

**Checkpoint 2.4**: Different question types render appropriately.

---

### Phase 2 Complete Criteria

- [ ] L1 → L2 → L3 progression works
- [ ] Each layer has distinct card types
- [ ] Code cards are readable and annotated
- [ ] Diagrams render correctly

---

## Phase 3: Exploration

> **Goal**: Browse and search patterns outside study mode.

### 3.1 Pattern Hierarchy Browser

- [ ] Create `<ExplorePage>` route
- [ ] Create `<HierarchyTree>` component
  - [ ] Expandable: Quality → Strategy → Family → Pattern
  - [ ] Show mastery indicators on each node
- [ ] Implement tree navigation in Redux

**Checkpoint 3.1**: Can click through hierarchy. Tree expands/collapses.

---

### 3.2 Search & Filter

- [ ] Create `<SearchBar>` with debounced input
- [ ] Create `<FilterPanel>`
  - [ ] Filter by quality (Performance, Reliability, etc.)
  - [ ] Filter by difficulty
  - [ ] Filter by tags
- [ ] Implement filtered selectors

**Checkpoint 3.2**: Search "circuit" finds Circuit Breaker. Filters narrow results.

---

### 3.3 Pattern Detail Page

- [ ] Create `<PatternPage>` route with tabs
- [ ] Tab: Concept (L1 content)
- [ ] Tab: Structure (L2 content + diagram)
- [ ] Tab: Code (L3 content + examples)
- [ ] Tab: System (L4 - placeholder for now)
- [ ] Tab: Tech (L5 - placeholder for now)
- [ ] Tab: Used By (L6 - placeholder for now)
- [ ] Show progress indicator per layer
- [ ] "Study This Pattern" button

**Checkpoint 3.3**: Can view full pattern details. Tabs switch content.

---

### Phase 3 Complete Criteria

- [ ] Can browse all patterns via hierarchy
- [ ] Search works across name, tagline, tags
- [ ] Pattern detail shows all available content
- [ ] Can jump from explore to study

---

## Phase 4: Connections (L4-L6)

> **Goal**: System context, technology mapping, real-world composition.

### 4.1 Layer 4: System Context

- [ ] Add L4 content to patterns:
  - [ ] typicalPlacement
  - [ ] interactsWith (related patterns)
  - [ ] architecturalBoundaries
- [ ] Create `<ArchitectureDiagram>` showing pattern placement
- [ ] Generate L4 question types

### 4.2 Layer 5: Technology Mapping

- [ ] Add implementations data to patterns
- [ ] Create `<TechCard>` component (logo + snippet)
- [ ] Generate L5 question types:
  - [ ] `tech-to-pattern`
  - [ ] `pattern-to-tech`

### 4.3 Layer 6: System Composition

- [ ] Create `systems/*.json` data files (Netflix, Uber, etc.)
- [ ] Create `<SystemPage>` route
- [ ] Create `<PatternGraph>` using React Flow
- [ ] Generate L6 question types:
  - [ ] `system-decomposition`
  - [ ] `reverse-engineering`

### Phase 4 Complete Criteria

- [ ] Full L1-L6 progression available
- [ ] Interactive pattern graph
- [ ] Real-world system examples

---

## Phase 5: Polish

> **Goal**: Production-ready UX.

### 5.1 Animations & Feedback

- [ ] Card flip animation polish
- [ ] Page transitions
- [ ] Loading states
- [ ] Toast notifications
- [ ] Confetti on milestones

### 5.2 Statistics & Insights

- [ ] Full heatmap (52 weeks)
- [ ] Layer distribution chart
- [ ] SBVP balance chart
- [ ] Prediction: "At this pace, L6 in X weeks"

### 5.3 Keyboard Shortcuts

- [ ] Space: flip card
- [ ] 1-5: rate card
- [ ] N: next card
- [ ] Esc: exit session

### 5.4 Responsive Design

- [ ] Mobile flashcard UI
- [ ] Tablet layout
- [ ] Touch gestures (swipe to rate?)

### 5.5 Theme

- [ ] Dark mode (default)
- [ ] Light mode toggle
- [ ] Persist preference

---

## Phase 6: 3D Visualizations

> **Goal**: Immersive state machine animations.

### 6.1 Three.js Integration

- [ ] Install React Three Fiber
- [ ] Create `<Visualization3D>` wrapper
- [ ] Set up scene, camera, lights

### 6.2 Tumbler Component

- [ ] Create `<StateTumbler>` component
- [ ] Render state cards on 3D carousel
- [ ] Implement rotation animations

### 6.3 Animation System

- [ ] Parse timeline from PatternVisualization data
- [ ] Implement increment, transition, highlight actions
- [ ] Add narration text overlay
- [ ] Play/pause controls

### 6.4 Per-Pattern Visualizations

- [ ] Author Circuit Breaker visualization
- [ ] Author Saga visualization
- [ ] Author Retry visualization

---

## Technical Decisions Log

| Decision         | Choice                                  | Rationale                                     | Date       |
| ---------------- | --------------------------------------- | --------------------------------------------- | ---------- |
| Initial patterns | 3 (Circuit Breaker, Retry, Cache-Aside) | Minimal set to validate design before scaling | 2024-12-26 |
| Card generation  | Pre-generate L1-L2, dynamic L3+         | Faster iteration, L3 depends on code examples | 2024-12-26 |
| State management | Redux Toolkit                           | Normalized entities, good devtools            | 2024-12-26 |
| Persistence      | Dexie.js (IndexedDB)                    | Structured, persistent, offline-first         | 2024-12-26 |
| Styling          | Tailwind + shadcn/ui                    | Fast, accessible, consistent                  | 2024-12-26 |
| 3D Library       | React Three Fiber                       | React integration, declarative                | 2024-12-26 |

---

## Risk Register

| Risk                                | Impact         | Mitigation                                         |
| ----------------------------------- | -------------- | -------------------------------------------------- |
| Pattern data takes too long         | Blocks Phase 1 | Start with 5 patterns, expand later                |
| L3 code examples are hard to author | Blocks Phase 2 | Use existing open-source examples, add annotations |
| 3D viz too complex                  | Delays Phase 6 | Can ship without it; add as enhancement            |
| Mobile UX poor for code             | Hurts adoption | Desktop-first, mobile as read-only                 |

---

## Next Actions

1. [ ] **Scaffold project** (Phase 0.1)
2. [ ] **Transform 3 patterns** (Phase 0.2) — Circuit Breaker, Retry, Cache-Aside
3. [ ] **Set up Redux store** (Phase 0.3)

---

## Session Log

| Date       | What We Did                            | Next          |
| ---------- | -------------------------------------- | ------------- |
| 2024-XX-XX | Created design docs, modular structure | Start Phase 0 |

---

_Update this document as we progress. Check boxes, log decisions, note blockers._
