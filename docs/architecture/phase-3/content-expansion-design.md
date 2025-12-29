# Phase 3: Content Expansion - Architecture Design

**Date**: 2025-12-28
**Architect**: zeplar_architect
**Prerequisites**: Phase 2 must be complete with CI/CD and browser testing done

---

## Overview

Phase 3 expands the pattern library from **6 patterns to 16 patterns**, adding 10 new resilience and distributed systems patterns. Each new pattern follows the three-layer structure established in Phase 2 (L1 Concept, L2 Structure, L3 Code).

**Current Patterns (6)**:

1. Circuit Breaker
2. Retry
3. Bulkhead
4. Timeout
5. Cache-Aside
6. Rate Limiting

**New Patterns to Add (10)**:

1. **Fallback** - Provide alternative response when primary fails
2. **Load Shedding** - Reject requests when system overloaded
3. **Throttling** - Limit request rate per client/tenant
4. **Backpressure** - Signal upstream to slow down
5. **Saga Pattern** - Distributed transaction coordination
6. **Event Sourcing** - Store state as sequence of events
7. **CQRS** - Separate read and write models
8. **Outbox Pattern** - Reliable event publishing
9. **Idempotency** - Safe request retry mechanism
10. **Health Check** - Monitor service availability

---

## Pattern Selection Rationale

### Quality Distribution

Following the existing hierarchy structure:

**Reliability Patterns** (4 new):

- Fallback (Quality: Reliability, Strategy: Fault Tolerance)
- Load Shedding (Quality: Reliability, Strategy: Overload Protection)
- Throttling (Quality: Reliability, Strategy: Rate Control)
- Backpressure (Quality: Reliability, Strategy: Flow Control)

**Data Consistency Patterns** (4 new):

- Saga Pattern (Quality: Consistency, Strategy: Distributed Transactions)
- Event Sourcing (Quality: Consistency, Strategy: State Management)
- CQRS (Quality: Consistency, Strategy: Query Optimization)
- Outbox Pattern (Quality: Consistency, Strategy: Event Reliability)

**Operational Patterns** (2 new):

- Idempotency (Quality: Reliability, Strategy: Safe Retries)
- Health Check (Quality: Observability, Strategy: Availability Monitoring)

### Learning Path Progression

**Beginner → Intermediate → Advanced**:

1. **Beginner** (Levels 1-4): Circuit Breaker, Retry, Timeout, Fallback, Rate Limiting, Health Check
2. **Intermediate** (Levels 5-7): Bulkhead, Cache-Aside, Throttling, Backpressure, Load Shedding, Idempotency
3. **Advanced** (Levels 8-10): Saga, Event Sourcing, CQRS, Outbox

---

## Data Structure Specification

### Pattern Schema (Existing)

Each pattern must have:

```typescript
interface Pattern {
  id: string;
  slug: string;
  hierarchy: {
    quality: "reliability" | "consistency" | "observability";
    strategy: string;
    family: string;
    level: number; // 1-10
  };

  // L1: Concept (Phase 1)
  concept: {
    name: string;
    emoji: string;
    tagline: string;
    definition: string;
    problemSolved: string;
    tradeoffs: {
      pros: string[];
      cons: string[];
    };
    relatedPatterns: string[]; // IDs of related patterns
  };

  // L2: Structure (Phase 2)
  structure: {
    participants: Array<{
      name: string;
      role: string;
      responsibilities: string[];
    }>;
    diagram: string; // Mermaid syntax
    flow: Array<{
      step: number;
      actor: string;
      action: string;
      description: string;
    }>;
    invariants: string[];
  };

  // L3: Code Examples (Phase 2)
  codeExamples: Array<{
    id: string;
    language: "typescript" | "go" | "python";
    title: string;
    description: string;
    code: string;
  }>;
}
```

---

## New Pattern Specifications

### 1. Fallback Pattern

**File**: `src/data/patterns/fallback.ts`

```typescript
{
  id: "fallback",
  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Degradation",
    level: 3,
  },
  concept: {
    name: "Fallback",
    emoji: "🪂",
    tagline: "Graceful degradation when primary fails",
    definition: "Provides alternative responses when primary operations fail",
    problemSolved: "When primary service fails, return cached/default data instead of error",
    tradeoffs: {
      pros: [
        "Improves user experience during failures",
        "Enables graceful degradation",
        "Reduces blast radius of failures"
      ],
      cons: [
        "May return stale data",
        "Adds complexity to error handling",
        "Requires maintenance of fallback logic"
      ]
    },
    relatedPatterns: ["circuit-breaker", "cache-aside", "retry"]
  },
  structure: {
    participants: [
      {
        name: "Primary Service",
        role: "Main Operation",
        responsibilities: ["Execute primary operation", "May fail or timeout"]
      },
      {
        name: "Fallback Handler",
        role: "Alternative Provider",
        responsibilities: ["Detect primary failure", "Execute fallback strategy"]
      },
      {
        name: "Fallback Source",
        role: "Backup Data",
        responsibilities: ["Cache", "Default values", "Secondary service"]
      }
    ],
    diagram: `graph TB
      Request --> Primary[Try Primary Service]
      Primary -->|Success| Response
      Primary -->|Failure| Fallback[Fallback Handler]
      Fallback --> Cache[Check Cache]
      Cache --> Default[Use Default]
      Default --> Response`,
    flow: [
      { step: 1, actor: "Client", action: "Request", description: "Initiate operation" },
      { step: 2, actor: "Primary Service", action: "Execute", description: "Attempt primary operation" },
      { step: 3, actor: "Fallback Handler", action: "Detect Failure", description: "Catch error/timeout" },
      { step: 4, actor: "Fallback Source", action: "Provide Alternative", description: "Return cached/default data" }
    ],
    invariants: [
      "Fallback must not throw errors",
      "Fallback response type must match primary",
      "Fallback should be faster than primary"
    ]
  },
  codeExamples: [
    {
      id: "fallback-ts-basic",
      language: "typescript",
      title: "Basic Fallback Implementation",
      description: "Try primary, fall back to cache on failure",
      code: `async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    console.warn('Primary failed, using fallback', error);
    return await fallback();
  }
}

// Usage
const userData = await withFallback(
  () => api.fetchUser(userId),
  () => cache.get(\`user:\${userId}\`)
);`
    }
  ]
}
```

### 2. Load Shedding Pattern

**Level**: 6 (Intermediate)
**Quality**: Reliability
**Strategy**: Overload Protection
**Problem**: System overwhelmed with requests, approaching failure
**Solution**: Reject low-priority requests to protect core functionality

**Key L2 Participants**:

- Load Monitor (tracks system health metrics)
- Request Classifier (assigns priority)
- Shedding Strategy (decides what to reject)

**L3 Code Example**: Priority-based request queue with rejection thresholds

### 3. Throttling Pattern

**Level**: 5 (Intermediate)
**Quality**: Reliability
**Strategy**: Rate Control
**Problem**: Need to limit request rate per client/tenant
**Solution**: Track request windows and reject over-limit requests

**Key L2 Participants**:

- Rate Limiter (tracks windows and counts)
- Token Bucket / Sliding Window (algorithm)
- Client Identifier (key for tracking)

**L3 Code Example**: Token bucket implementation with refill rate

### 4. Backpressure Pattern

**Level**: 7 (Intermediate)
**Quality**: Reliability
**Strategy**: Flow Control
**Problem**: Downstream can't keep up with upstream rate
**Solution**: Signal upstream to slow down (reactive streams)

**Key L2 Participants**:

- Publisher (produces items)
- Subscriber (consumes items, signals demand)
- Backpressure Signal (request(n) mechanism)

**L3 Code Example**: Reactive stream with demand-based flow control

### 5. Saga Pattern

**Level**: 8 (Advanced)
**Quality**: Consistency
**Strategy**: Distributed Transactions
**Problem**: Need atomicity across multiple microservices
**Solution**: Choreographed compensating transactions

**Key L2 Participants**:

- Saga Coordinator (orchestrates steps)
- Service Participants (execute local transactions)
- Compensating Actions (undo on failure)

**L3 Code Example**: Order saga with payment, inventory, shipping steps

### 6. Event Sourcing Pattern

**Level**: 9 (Advanced)
**Quality**: Consistency
**Strategy**: State Management
**Problem**: Lost audit trail, can't replay state
**Solution**: Store all state changes as immutable events

**Key L2 Participants**:

- Event Store (append-only log)
- Aggregate (rebuilds state from events)
- Event Handler (processes events)

**L3 Code Example**: Bank account with deposit/withdraw events

### 7. CQRS Pattern

**Level**: 8 (Advanced)
**Quality**: Consistency
**Strategy**: Query Optimization
**Problem**: Read and write models have different requirements
**Solution**: Separate command (write) and query (read) models

**Key L2 Participants**:

- Command Handler (writes)
- Query Handler (reads)
- Read Model (optimized projections)

**L3 Code Example**: Product catalog with denormalized read views

### 8. Outbox Pattern

**Level**: 7 (Advanced)
**Quality**: Consistency
**Strategy**: Event Reliability
**Problem**: Database commit + event publish must be atomic
**Solution**: Write events to outbox table in same transaction

**Key L2 Participants**:

- Outbox Table (transactional event queue)
- Publisher (polls outbox, sends events)
- Message Broker (receives published events)

**L3 Code Example**: Order created → outbox entry → event published

### 9. Idempotency Pattern

**Level**: 5 (Intermediate)
**Quality**: Reliability
**Strategy**: Safe Retries
**Problem**: Retries may cause duplicate side effects
**Solution**: Track request IDs and deduplicate

**Key L2 Participants**:

- Idempotency Key (unique request ID)
- Deduplication Store (tracks processed keys)
- Handler (checks before executing)

**L3 Code Example**: Payment processing with idempotency key

### 10. Health Check Pattern

**Level**: 2 (Beginner)
**Quality**: Observability
**Strategy**: Availability Monitoring
**Problem**: Need to know if service is healthy
**Solution**: Expose /health endpoint with dependency checks

**Key L2 Participants**:

- Health Endpoint (HTTP endpoint)
- Dependency Checkers (DB, cache, external APIs)
- Health Aggregator (combines results)

**L3 Code Example**: Express /health endpoint with DB ping

---

## Implementation Strategy

### Phase 3 Breakdown

**Phase 3.1: Content Creation** (Backend Engineer)

- Create 10 new pattern files in `src/data/patterns/`
- Follow existing schema exactly
- Each pattern must have concept, structure, codeExamples
- Update `src/data/patterns/index.ts` to export new patterns
- **Deliverable**: 10 new pattern files, total 16 patterns

**Phase 3.2: Card Generation** (Backend Engineer)

- Card generators already support multi-pattern data (Phase 2)
- No code changes needed - generators auto-create cards from pattern data
- Verify 90 cards generated per new pattern (30 L1 + 30 L2 + 30 L3)
- **Expected Total**: 16 patterns × 90 cards = 1,440 cards
- **Deliverable**: Confirmation that card count = 1,440

**Phase 3.3: UI/UX Enhancements** (Frontend Engineer)

- Update dashboard to show all 16 patterns
- Ensure pattern list scrolls properly (6 → 16 patterns)
- Add pattern categories filter (Reliability, Consistency, Observability)
- Add difficulty level badges (Beginner, Intermediate, Advanced)
- **Deliverable**: Enhanced dashboard with category filters

**Phase 3.4: Verification** (Test Engineer)

- Verify all 16 patterns load correctly
- Verify card generators produce 1,440 cards
- Verify mastery calculations work with expanded pattern set
- Verify layer unlocks work for all patterns
- Run full test suite (expect ~200+ tests)
- **Deliverable**: Verification report with test results

---

## Testing Strategy

### Unit Tests (Backend Engineer)

```typescript
// src/lib/cardGenerator/cardGenerator.test.ts

describe("Phase 3: Card Generation for 16 Patterns", () => {
  it("generates L1 cards for all 16 patterns", () => {
    const cards = generateAllL1Cards(allPatterns);
    expect(cards).toHaveLength(16 * 30); // 480 L1 cards
  });

  it("generates L2 cards for all 16 patterns", () => {
    const cards = generateAllL2Cards(allPatterns);
    expect(cards).toHaveLength(16 * 30); // 480 L2 cards
  });

  it("generates L3 cards for all 16 patterns", () => {
    const cards = generateAllL3Cards(allPatterns);
    expect(cards).toHaveLength(16 * 30); // 480 L3 cards
  });

  it("total card count is 1,440", () => {
    const allCards = generateAllCards(allPatterns);
    expect(allCards).toHaveLength(1440);
  });
});
```

### Integration Tests (Test Engineer)

- Load app with 16 patterns
- Verify dashboard shows all patterns
- Verify category filters work
- Verify mastery calculations with large pattern set
- Performance test: ensure <2s load time with 1,440 cards

---

## Data Quality Requirements

Each new pattern must include:

**L1 Content**:

- [ ] Clear, beginner-friendly definition
- [ ] Concrete problem statement with real-world example
- [ ] 3-4 pros and cons
- [ ] At least 2 related patterns
- [ ] Appropriate emoji and tagline

**L2 Content**:

- [ ] 2-4 participants with clear roles and responsibilities
- [ ] Mermaid diagram (state, sequence, or flowchart)
- [ ] 4-6 flow steps with actor/action/description
- [ ] 2-4 invariants (non-negotiable rules)

**L3 Content**:

- [ ] At least 1 TypeScript code example
- [ ] Code is runnable (no pseudocode)
- [ ] Includes error handling
- [ ] Comments explain key decisions
- [ ] Example is 30-60 lines (readable, not overwhelming)

---

## Performance Considerations

### Card Generation

**Current**: 6 patterns × 90 cards = 540 cards
**Phase 3**: 16 patterns × 90 cards = 1,440 cards

**Impact Analysis**:

- Memory: 1,440 cards × 2KB avg = ~3MB (acceptable)
- Initial load: Card generation done once at app start (~100ms)
- IndexedDB: No performance impact (indexed queries)

**Optimization**: No changes needed. Current architecture scales to 1,440 cards.

### Dashboard Rendering

**Concern**: Dashboard shows per-pattern mastery for all patterns

**Current**: 6 pattern widgets
**Phase 3**: 16 pattern widgets

**Solution**: Frontend Engineer adds virtualized scrolling or pagination

---

## UI/UX Mockups

### Dashboard with 16 Patterns

```
┌─────────────────────────────────────────┐
│  Cards Due Today: 42         Start →    │
├─────────────────────────────────────────┤
│  Filter: [All] [Reliability] [Consistency] [Observability]  │
│  Level:  [All] [Beginner] [Intermediate] [Advanced]          │
├─────────────────────────────────────────┤
│  🔌 Circuit Breaker    ████████░░  80%  │
│  🔁 Retry              ██████░░░░  60%  │
│  🚪 Bulkhead           ███░░░░░░░  30%  │
│  ⏱️  Timeout            ██████░░░░  60%  │
│  💾 Cache-Aside        █████░░░░░  50%  │
│  🚦 Rate Limiting      ████░░░░░░  40%  │
│  🪂 Fallback           ██░░░░░░░░  20%  │
│  📊 Load Shedding      ░░░░░░░░░░   0%  │
│  🎛️  Throttling         ░░░░░░░░░░   0%  │
│  ⬅️  Backpressure       ░░░░░░░░░░   0%  │
│  🔄 Saga Pattern       ░░░░░░░░░░   0%  │
│  📜 Event Sourcing     ░░░░░░░░░░   0%  │
│  📖 CQRS               ░░░░░░░░░░   0%  │
│  📤 Outbox Pattern     ░░░░░░░░░░   0%  │
│  🔑 Idempotency        ░░░░░░░░░░   0%  │
│  ❤️  Health Check       ░░░░░░░░░░   0%  │
└─────────────────────────────────────────┘
```

---

## Phase 3 Acceptance Criteria

- [ ] **16 pattern files created** in `src/data/patterns/`
- [ ] **All patterns follow schema** (concept, structure, codeExamples)
- [ ] **1,440 cards generated** (16 × 90)
- [ ] **All tests pass** (expect 200+ tests)
- [ ] **Dashboard shows all patterns** with category filters
- [ ] **Performance acceptable** (<2s load time)
- [ ] **Browser tests updated** to verify 16 patterns
- [ ] **Documentation updated** (README shows 16 patterns)

---

## Risks and Mitigation

| Risk                                  | Impact                             | Mitigation                                      |
| ------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Pattern quality varies                | Users confused by unclear patterns | Code review all patterns, ensure consistency    |
| Too many patterns overwhelm users     | Analysis paralysis                 | Add difficulty filters and learning path        |
| Performance degrades with 1,440 cards | Slow app load                      | Monitor bundle size, add lazy loading if needed |
| Card generation bugs at scale         | Broken cards                       | Extensive unit tests for all 16 patterns        |

---

## Success Metrics

**Quantitative**:

- 16 patterns live in production
- 1,440 cards generated correctly
- All tests passing (>200 tests)
- Load time <2 seconds
- Zero TypeScript errors

**Qualitative**:

- Patterns easy to understand (beginner-friendly)
- Code examples runnable and clear
- Dashboard navigable with 16 patterns
- Smooth user experience studying any pattern

---

## Next Steps After Phase 3

**Phase 4 Preview**: Adaptive Learning

- Personalized card scheduling based on user performance
- Difficulty adjustment (harder variants for advanced users)
- Learning path recommendations
- Spaced repetition optimization

**Phase 5 Preview**: Social Features

- Share progress with friends
- Leaderboards and achievements
- Community-contributed patterns
- Code examples from real projects

---

**Document Status**: Ready for review. Awaiting CI/CD and browser testing completion from Phase 2.
