# 13. 3D Distribution Strategy: Layers as Z-Index

[← Back to Index](./index.md)

---

## The Problem: 600 Cards Per Pattern is Terrifying

With combinatorial card generation (6 layers × 4 domains × ~5 facets × ~5 question types), we could generate **600+ cards per pattern**. With 50+ patterns, that's potentially 30,000+ cards.

**The risk**: Getting stuck too deep in one pattern before seeing others. Spending 2 hours on Circuit Breaker Layer 3 while never touching Retry Layer 1.

---

## The Solution: Layers ARE the Z-Index

The insight: **The existing 6-layer hierarchy naturally provides the Z-axis for progressive depth.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    3D LEARNING CUBE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         Z = Layer 6 (Intense)                    │
│                        ╱                                         │
│                       ╱   System Composition                     │
│                      ╱    Reverse-engineer Netflix               │
│                     ╱                                            │
│                    ╱                                             │
│                   ╱  Z = Layer 4-5 (Moderate+)                   │
│                  ╱   System Integration, Tech Mapping            │
│                 ╱                                                │
│                ╱                                                 │
│               ╱  Z = Layer 3 (Moderate)                          │
│              ╱   Code Expression, Action-Reason                  │
│             ╱                                                    │
│            ╱                                                     │
│           ╱  Z = Layer 1-2 (Gentle)                              │
│          ╱   Concepts, Structure, Diagrams                       │
│         ╱                                                        │
│        ╱_________________________________________________        │
│       ╱                                                 ╱        │
│      ╱  X = Patterns (horizontal)                      ╱         │
│     ╱   Circuit Breaker │ Retry │ Cache │ Saga │ ... ╱          │
│    ╱_________________________________________________╱           │
│   │                                                   │          │
│   │  Y = SBVP Domains (vertical)                      │          │
│   │  Structure │ Behavior │ Visualization │ Philosophy│          │
│   │___________________________________________________|          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Journey: Gentle to Intense

### Phase 1: Survey the Landscape (Z=1)

**Goal**: Touch every pattern at its gentlest layer before going deep on any.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#6c7086', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart LR
    subgraph Z1["Z=1: CONCEPT LAYER (Gentle)"]
        direction TB

        P1["Circuit Breaker<br/>L1: What is it?"]
        P2["Retry<br/>L1: What is it?"]
        P3["Cache-Aside<br/>L1: What is it?"]
        P4["Saga<br/>L1: What is it?"]
        P5["...50+ patterns<br/>L1: What is it?"]
    end

    P1 --> P2 --> P3 --> P4 --> P5

    style Z1 fill:#b4befe,stroke:#b4befe,color:#1e1e2e
    style P1 fill:#313244,stroke:#b4befe,color:#cdd6f4
    style P2 fill:#313244,stroke:#b4befe,color:#cdd6f4
    style P3 fill:#313244,stroke:#b4befe,color:#cdd6f4
    style P4 fill:#313244,stroke:#b4befe,color:#cdd6f4
    style P5 fill:#313244,stroke:#b4befe,color:#cdd6f4
```

**Cards at Z=1**:

- "What is Circuit Breaker?"
- "What problem does Retry solve?"
- "Name the pattern: prevents cascading failures"

**Time estimate**: ~15-20 cards per pattern × 50 patterns = ~750-1000 cards
**Intensity**: Low cognitive load, name recognition, problem identification

---

### Phase 2: See the Shapes (Z=2)

**Goal**: Understand structure and behavior diagrams for all patterns.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#6c7086', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart LR
    subgraph Z2["Z=2: STRUCTURE LAYER (Gentle+)"]
        direction TB

        P1["Circuit Breaker<br/>L2: Participants, State Diagram"]
        P2["Retry<br/>L2: Backoff flow"]
        P3["Cache-Aside<br/>L2: Cache vs DB flow"]
        P4["...patterns<br/>L2: Diagrams"]
    end

    P1 --> P2 --> P3 --> P4

    style Z2 fill:#89dceb,stroke:#89dceb,color:#1e1e2e
    style P1 fill:#313244,stroke:#89dceb,color:#cdd6f4
    style P2 fill:#313244,stroke:#89dceb,color:#cdd6f4
    style P3 fill:#313244,stroke:#89dceb,color:#cdd6f4
    style P4 fill:#313244,stroke:#89dceb,color:#cdd6f4
```

**Cards at Z=2**:

- "What are the 3 states of Circuit Breaker?"
- "Order these Retry steps correctly"
- "Match diagram to pattern"

**Prerequisite**: 80%+ mastery at Z=1 for this pattern
**Intensity**: Visual recognition, sequence understanding

---

### Phase 3: Read the Code (Z=3)

**Goal**: Understand implementations with Context Dilation and Action-Reason.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#6c7086', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart LR
    subgraph Z3["Z=3: CODE LAYER (Moderate)"]
        direction TB

        P1["Circuit Breaker<br/>L3: TypeScript impl"]
        P2["Retry<br/>L3: Exponential backoff"]
        P3["...patterns<br/>L3: Real code"]
    end

    P1 --> P2 --> P3

    style Z3 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style P1 fill:#313244,stroke:#a6e3a1,color:#cdd6f4
    style P2 fill:#313244,stroke:#a6e3a1,color:#cdd6f4
    style P3 fill:#313244,stroke:#a6e3a1,color:#cdd6f4
```

**Cards at Z=3** (using the Trifecta):

- Context Dilation: "At what zoom level is this code?"
- Action-Reason: "WHY do lines 12-18 exist?"
- Raw Code: "Complete this implementation"

**Prerequisite**: 80%+ mastery at Z=2 for this pattern
**Intensity**: Code reading, reasoning about implementation choices

---

### Phase 4: Place in Systems (Z=4)

**Goal**: Understand where patterns live in real architectures.

**Cards at Z=4**:

- "Where would you use Circuit Breaker in a microservices arch?"
- "Which patterns would you combine with Retry?"

**Prerequisite**: 80%+ mastery at Z=3 for this pattern
**Intensity**: Architectural thinking

---

### Phase 5: Map to Tools (Z=5)

**Goal**: Connect patterns to real technologies.

**Cards at Z=5**:

- "What pattern does Resilience4j implement?"
- "Which Redis feature implements Cache-Aside?"

**Prerequisite**: 80%+ mastery at Z=4 for this pattern
**Intensity**: Technology ecosystem knowledge

---

### Phase 6: Reverse Engineer Systems (Z=6)

**Goal**: Decompose real systems into their pattern compositions.

**Cards at Z=6**:

- "What patterns does Netflix use for fault tolerance?"
- "Identify 5 patterns in this Uber architecture diagram"

**Prerequisite**: 80%+ mastery at Z=5 for multiple patterns
**Intensity**: Full system decomposition, synthesis

---

## Distribution Algorithm

```typescript
interface CardDistribution {
  // Ensure breadth before depth
  minPatternsBefore NextLayer: number;  // e.g., 10 patterns at L1 before any L2

  // Layer unlock gates
  layerUnlockThreshold: number;          // 0.8 = 80% mastery required

  // SBVP rotation within layer
  rotateDomains: boolean;                // Cycle S→B→V→P within each layer
}

function getNextCard(
  progress: CardProgress[],
  config: CardDistribution
): CardKey {
  // 1. Find all eligible cards (layer unlocked, not yet due)
  const eligible = getEligibleCards(progress);

  // 2. Prioritize by Z-level (lower Z = higher priority for new users)
  const byLayer = groupByLayer(eligible);

  // 3. Within each layer, ensure SBVP rotation
  const withDomainBalance = balanceDomains(byLayer);

  // 4. Within each domain, ensure pattern breadth
  const withPatternBreadth = balancePatterns(withDomainBalance);

  // 5. Apply SM-2 priority (due > overdue > new)
  return applySpacedRepetition(withPatternBreadth);
}
```

---

## Visualization: The Journey Through the Cube

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#cdd6f4', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart TD
    subgraph JOURNEY["🧭 THE LEARNING JOURNEY"]
        direction TB

        subgraph PHASE1["Phase 1: Survey (Weeks 1-4)"]
            P1_DESC["Touch all patterns at L1<br/>Build vocabulary<br/>~750 cards"]
        end

        subgraph PHASE2["Phase 2: Structure (Weeks 5-8)"]
            P2_DESC["See all diagrams at L2<br/>Build visual intuition<br/>~1000 cards"]
        end

        subgraph PHASE3["Phase 3: Code (Weeks 9-16)"]
            P3_DESC["Read implementations at L3<br/>Build code literacy<br/>~1500 cards"]
        end

        subgraph PHASE4["Phase 4: Systems (Weeks 17-24)"]
            P4_DESC["Place in architectures at L4<br/>Build system thinking<br/>~1000 cards"]
        end

        subgraph PHASE5["Phase 5: Tools (Weeks 25-32)"]
            P5_DESC["Map to technologies at L5<br/>Build practical knowledge<br/>~800 cards"]
        end

        subgraph PHASE6["Phase 6: Mastery (Weeks 33+)"]
            P6_DESC["Decompose real systems at L6<br/>Build synthesis ability<br/>~500 cards"]
        end
    end

    PHASE1 --> PHASE2 --> PHASE3 --> PHASE4 --> PHASE5 --> PHASE6

    style PHASE1 fill:#b4befe,stroke:#b4befe,color:#1e1e2e
    style PHASE2 fill:#89dceb,stroke:#89dceb,color:#1e1e2e
    style PHASE3 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style PHASE4 fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style PHASE5 fill:#fab387,stroke:#fab387,color:#1e1e2e
    style PHASE6 fill:#f38ba8,stroke:#f38ba8,color:#1e1e2e

    style P1_DESC fill:#313244,stroke:#b4befe,color:#cdd6f4
    style P2_DESC fill:#313244,stroke:#89dceb,color:#cdd6f4
    style P3_DESC fill:#313244,stroke:#a6e3a1,color:#cdd6f4
    style P4_DESC fill:#313244,stroke:#f9e2af,color:#cdd6f4
    style P5_DESC fill:#313244,stroke:#fab387,color:#cdd6f4
    style P6_DESC fill:#313244,stroke:#f38ba8,color:#cdd6f4

    style JOURNEY fill:#1e1e2e,stroke:#89b4fa,color:#cdd6f4
```

---

## Key Principles

### 1. Breadth Before Depth

Never let a user go to L2 on Pattern A until they've seen L1 on at least N patterns.

```typescript
const MIN_PATTERNS_BEFORE_DEPTH = 10;

function canAdvanceToNextLayer(
  patternId: string,
  currentLayer: number,
  allProgress: CardProgress[],
): boolean {
  // Rule 1: Must have 80%+ mastery at current layer
  const currentMastery = getMastery(patternId, currentLayer, allProgress);
  if (currentMastery < 0.8) return false;

  // Rule 2: Must have seen N patterns at current layer
  const patternsAtCurrentLayer = countPatternsWithProgress(
    currentLayer,
    allProgress,
  );
  if (patternsAtCurrentLayer < MIN_PATTERNS_BEFORE_DEPTH) return false;

  return true;
}
```

### 2. SBVP Rotation

Within each layer, cycle through domains to avoid fatigue:

```
Session cards: CB-L1-Structure → Retry-L1-Behavior → Cache-L1-Viz → Saga-L1-Philosophy → ...
```

### 3. Interleaving

Mix patterns within a session rather than blocking:

```
❌ Bad:  CB, CB, CB, CB, CB, Retry, Retry, Retry, Retry, Retry
✅ Good: CB, Retry, Cache, Saga, Bulkhead, CB, Retry, Cache, ...
```

### 4. Just-In-Time Depth

Only generate deeper cards when the user is ready:

```typescript
// Cards are generated lazily
function generateCardsForPattern(patternId: string, layer: number) {
  // Only called when user unlocks this layer for this pattern
  return generateLayerCards(patternId, layer);
}
```

---

## Metrics to Track

| Metric                 | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| **Layer Distribution** | % of time spent at each Z-level               |
| **Pattern Breadth**    | # of unique patterns touched per session      |
| **SBVP Balance**       | Time in each domain                           |
| **Depth Velocity**     | How fast users progress through layers        |
| **Stuck Detection**    | Flag if >5 sessions without layer advancement |

---

## Summary

The 3D cube model with **Layers as Z-Index** provides:

1. **Natural intensity gradient**: L1 is always gentle, L6 is always intense
2. **Breadth-first exposure**: See all patterns at surface level before diving
3. **Progressive unlocking**: Gates prevent premature depth
4. **Interleaved learning**: Mix patterns and domains for better retention
5. **Manageable chunks**: ~750-1500 cards per phase, not 30,000 at once

The journey goes from "I've heard of all these patterns" (L1) to "I can decompose any system into its patterns" (L6) over ~6-9 months of consistent practice.

---

[← Back to Index](./index.md) | [Next: Open Questions →](./99-open-questions.md)
