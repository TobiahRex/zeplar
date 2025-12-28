# 99. Open Questions for Discussion

[← Back to Index](./index.md)

---

## Implementation Decisions

### 1. Card Generation Strategy

Should cards be pre-generated and stored, or generated dynamically at review time?

| Approach          | Pros                                           | Cons                               |
| ----------------- | ---------------------------------------------- | ---------------------------------- |
| **Pre-generated** | Faster, predictable, can be curated            | Storage overhead, harder to update |
| **Dynamic**       | More variety, adapts to progress, always fresh | Slower, less predictable           |

**Recommendation**: Hybrid — pre-generate L1-L2, dynamically generate L3-L6 based on user progress.

---

### 2. Code Execution

Should code examples be runnable in-browser (Sandpack), or view-only?

| Approach      | Pros                                     | Cons                                            |
| ------------- | ---------------------------------------- | ----------------------------------------------- |
| **Runnable**  | Interactive learning, immediate feedback | Complex setup, security concerns, larger bundle |
| **View-only** | Simpler, faster, works offline           | Less engaging, can't experiment                 |

**Recommendation**: Start view-only, add Sandpack for L3 code challenges in Phase 3.

---

### 3. AI Integration

Use LLM to generate card variations, explain wrong answers, or create new patterns?

| Use Case                  | Value                   | Risk                           |
| ------------------------- | ----------------------- | ------------------------------ |
| **Generate variations**   | More practice material  | May generate incorrect content |
| **Explain wrong answers** | Personalized feedback   | Latency, cost                  |
| **Create patterns**       | User-submitted patterns | Quality control                |

**Recommendation**: Defer to Phase 7+. Focus on curated content first.

---

### 4. Multiplayer/Social Features

Any interest in shared decks, leaderboards, or collaborative editing?

| Feature                   | Value                      | Complexity                        |
| ------------------------- | -------------------------- | --------------------------------- |
| **Shared decks**          | Community content          | Auth, permissions, moderation     |
| **Leaderboards**          | Gamification, motivation   | Requires server, privacy concerns |
| **Collaborative editing** | Crowd-sourced improvements | Merge conflicts, quality          |

**Recommendation**: Start single-player. Social features are Phase 8+.

---

### 5. Import/Export

Support Anki format for interoperability?

| Format           | Pros                         | Cons                              |
| ---------------- | ---------------------------- | --------------------------------- |
| **Anki (.apkg)** | Large existing user base     | Complex format, SQLite inside ZIP |
| **JSON export**  | Simple, readable             | Not compatible with other tools   |
| **Markdown**     | Human-readable, git-friendly | Loses metadata                    |

**Recommendation**: JSON export/import for MVP. Anki export in Phase 5.

---

### 6. Gamification Level

Streaks, badges, XP system? Or keep it minimal?

| Approach              | Pros                            | Cons                                 |
| --------------------- | ------------------------------- | ------------------------------------ |
| **Minimal**           | Clean, focused, no distractions | Less motivation for some users       |
| **Full gamification** | Engagement, habit formation     | Can feel gimmicky, rewards hack-able |

**Recommendation**: Minimal core (streaks + heatmap) with optional XP toggle.

---

## Data Questions

### 7. Pattern Corpus Completeness

Current corpus has ~200 patterns across 5 levels. Is this enough?

**Missing categories to consider**:

- API Design patterns (REST, GraphQL, gRPC)
- Event-driven patterns (CQRS, Event Sourcing fully detailed)
- ML/AI patterns (Feature Store, Model Registry)
- Platform patterns (Kubernetes-specific)

---

### 8. Real-World System Coverage

Which companies/systems should be priority for L6?

**Candidates**:

1. Netflix (streaming, recommendations)
2. Uber (real-time, geo-distributed)
3. Stripe (payments, reliability)
4. Discord (real-time, scale)
5. Shopify (e-commerce, multi-tenant)

---

## Technical Questions

### 9. Offline-First vs Online-First

| Approach          | Pros                   | Cons              |
| ----------------- | ---------------------- | ----------------- |
| **Offline-first** | Works anywhere, fast   | Sync complexity   |
| **Online-first**  | Simple, always current | Requires internet |

**Current decision**: Offline-first with IndexedDB, optional cloud sync later.

---

### 10. State Management Complexity

Redux Toolkit is chosen, but is it overkill for initial MVP?

| Alternative       | Pros                        | Cons                   |
| ----------------- | --------------------------- | ---------------------- |
| **Zustand**       | Simpler, less boilerplate   | Less ecosystem         |
| **Jotai**         | Atomic, React-native feel   | Different mental model |
| **Redux Toolkit** | Proven, RTK Query, devtools | More setup             |

**Current decision**: Stick with Redux Toolkit for normalized entities and future scale.

---

## User Experience Questions

### 11. Onboarding Flow

How much explanation does a new user need?

Options:

- **Quick start**: Jump into L1 cards immediately
- **Guided tour**: Explain layers, SBVP, spaced repetition
- **Placement test**: Assess existing knowledge, skip to appropriate layer

---

### 12. Session Length

What's the ideal session?

| Duration   | Cards     | Good for        |
| ---------- | --------- | --------------- |
| **5 min**  | ~10 cards | Commute, break  |
| **15 min** | ~30 cards | Morning routine |
| **30 min** | ~60 cards | Deep study      |

**Question**: Should sessions be timed or card-count based?

---

## Design Questions

### 13. Mobile-First or Desktop-First?

| Approach          | Pros                      | Cons                        |
| ----------------- | ------------------------- | --------------------------- |
| **Mobile-first**  | Portable, habit-forming   | Code readability challenges |
| **Desktop-first** | Better for code, diagrams | Less convenient             |

**Recommendation**: Desktop-first for MVP (code-heavy L3), responsive mobile in Phase 5.

---

### 14. Dark/Light Theme

Current design uses Catppuccin Mocha (dark). Support light mode?

**Recommendation**: Dark-only for MVP. Theme toggle in Phase 5.

---

## Feedback Wanted

Please add comments or create issues for:

1. Which questions should be prioritized?
2. Additional questions not covered?
3. Strong opinions on any of the above?

---

_This document captures open decisions. As decisions are made, they should be documented in the relevant section docs._

[← Back to Index](./index.md)
