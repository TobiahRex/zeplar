# Zeplar

> A React application for deep, systematic learning of software patterns through progressive layers and spaced repetition.

**Zeplar** = Z-layers of pattern mastery. From concept to system composition.

---

## System Design Documentation

This design is modular. Each section focuses on a specific aspect of the system.

### Core Architecture

| Doc                                                  | Description                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [01. Vision & Philosophy](./01-vision-philosophy.md) | Learning pyramid, SBVP meta-domains, spaced repetition integration                 |
| [02. Data Model](./02-data-model.md)                 | Pattern entity, System entity, Layer 3 trifecta, DSL grammar, Flashcard generation |
| [03. Redux Architecture](./03-redux-architecture.md) | Normalized state tree, slices, selectors                                           |
| [04. Spaced Repetition](./04-spaced-repetition.md)   | SM-2 algorithm, layer progression logic                                            |

### Implementation

| Doc                                              | Description                                            |
| ------------------------------------------------ | ------------------------------------------------------ |
| [05. Tech Stack](./05-tech-stack.md)             | Core libraries, learning experience tools, persistence |
| [06. App Architecture](./06-app-architecture.md) | Directory structure, key component patterns            |
| [07. User Flows](./07-user-flows.md)             | Study session flow, exploration flow                   |
| [08. Data Pipeline](./08-data-pipeline.md)       | Corpus to flashcards transformation                    |
| [09. MVP Scope](./09-mvp-scope.md)               | Phased implementation plan                             |

### Features

| Doc                                                        | Description                                      |
| ---------------------------------------------------------- | ------------------------------------------------ |
| [10. Session Visualization](./10-session-visualization.md) | GitHub-style heatmap, streak tracking            |
| [11. 3D Visualizations](./11-3d-visualizations.md)         | Tumbler paradigm, animation data model           |
| [12. Persistence](./12-persistence.md)                     | IndexedDB via Dexie.js, sync strategy            |
| [13. Distribution Strategy](./13-distribution-strategy.md) | **Layers as Z-Index: gentle to intense journey** |

### Meta

| Doc                                                   | Description                               |
| ----------------------------------------------------- | ----------------------------------------- |
| [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md) | **Active build tracker with checkpoints** |
| [99. Open Questions](./99-open-questions.md)          | Decisions pending discussion              |

---

## Quick Reference: The Learning Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    3D LEARNING CUBE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   X-axis: Patterns (Circuit Breaker, Retry, Cache-Aside, ...)   │
│   Y-axis: SBVP Domains (Structure, Behavior, Viz, Philosophy)   │
│   Z-axis: Layers 1→6 (Concept → System Composition)             │
│                                                                  │
│   Journey: Start at Z=1 (gentle), progress to Z=6 (intense)     │
│   Distribution: All patterns exposed at each Z-level before     │
│                 advancing deeper                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Six Layers (Z-Axis)

| Z   | Layer       | Intensity | Focus                                |
| --- | ----------- | --------- | ------------------------------------ |
| 1   | Concept     | Gentle    | What is it? Why does it exist?       |
| 2   | Structure   | Gentle+   | Components, diagrams, flow           |
| 3   | Code        | Moderate  | Implementation, action-reason pairs  |
| 4   | System      | Moderate+ | Architectural placement, integration |
| 5   | Technology  | Intense   | Tools: Redis, Kafka, K8s mappings    |
| 6   | Composition | Intense   | Netflix, Uber decomposition          |

### The Four Meta-Domains (Y-Axis)

- **S**tructure: What are the components?
- **B**ehavior: How do they interact?
- **V**isualization: How can we see it?
- **P**hilosophy: Why does it work this way?

---

## Tech Stack Summary

| Category    | Choice                    |
| ----------- | ------------------------- |
| Framework   | React 18 + TypeScript     |
| Build       | Vite                      |
| State       | Redux Toolkit + RTK Query |
| Persistence | IndexedDB via Dexie.js    |
| 3D          | React Three Fiber         |
| Styling     | Tailwind + shadcn/ui      |

---

_This is a living design. See [Open Questions](./99-open-questions.md) for pending decisions._
