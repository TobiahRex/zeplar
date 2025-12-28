# 3. Redux State Architecture

[← Back to Index](./index.md) | [← Previous: Data Model](./02-data-model.md)

---

## 3.1 State Tree Design Philosophy

> **Principle**: State should be normalized, UI-agnostic, and support arbitrary view compositions.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#6c7086', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart TB
    subgraph ROOT["🏪 Redux Store: RootState"]
        direction LR

        subgraph ENTITIES["📦 entities<br/><em>Normalized Domain Data</em>"]
            E_PAT["patterns<br/><code>Record&lt;id, Pattern&gt;</code>"]
            E_SYS["systems<br/><code>Record&lt;id, RealWorldSystem&gt;</code>"]
            E_IMPL["implementations<br/><code>Record&lt;id, Implementation&gt;</code>"]
        end

        subgraph LEARNING["🎓 learning<br/><em>Spaced Repetition State</em>"]
            L_PROG["cardProgress<br/><code>Record&lt;patternId:layer, CardProgress&gt;</code>"]
            L_SESS["session<br/><code>StudySession | null</code>"]
            L_QUEUE["reviewQueue<br/><code>{due, overdue, new}</code>"]
            L_STATS["stats<br/><code>LearningStats</code>"]
        end

        subgraph EXPLORATION["🔍 exploration<br/><em>Navigation & Filtering</em>"]
            EX_PATH["currentPath<br/><code>HierarchyPath</code>"]
            EX_FILT["filters<br/><code>{qualities, difficulty, search}</code>"]
            EX_EXP["expandedNodes<br/><code>Set&lt;string&gt;</code>"]
            EX_SEL["selectedPatterns<br/><code>string[]</code>"]
        end

        subgraph UI["🎨 ui<br/><em>View Preferences</em>"]
            UI_THEME["theme<br/><code>'dark' | 'light'</code>"]
            UI_MODAL["activeModal<br/><code>ModalType | null</code>"]
            UI_PREFS["preferences<br/><code>{codeLanguage, ...}</code>"]
        end

        subgraph SYNC["☁️ sync<br/><em>Persistence Status</em>"]
            SYNC_LAST["lastSyncedAt<br/><code>number | null</code>"]
            SYNC_PEND["pendingChanges<br/><code>PendingChange[]</code>"]
            SYNC_STAT["syncStatus<br/><code>'idle' | 'syncing' | 'error'</code>"]
        end
    end

    style ROOT fill:#1e1e2e,stroke:#89b4fa,color:#cdd6f4
    style ENTITIES fill:#313244,stroke:#89b4fa,color:#cdd6f4
    style LEARNING fill:#313244,stroke:#a6e3a1,color:#cdd6f4
    style EXPLORATION fill:#313244,stroke:#f9e2af,color:#cdd6f4
    style UI fill:#313244,stroke:#cba6f7,color:#cdd6f4
    style SYNC fill:#313244,stroke:#fab387,color:#cdd6f4
```

---

## 3.2 Full State Interface

```typescript
interface RootState {
  // === DOMAIN DATA (Normalized) ===
  entities: {
    patterns: Record<string, Pattern>;
    systems: Record<string, RealWorldSystem>;
    implementations: Record<string, Implementation>;
  };

  // === LEARNING STATE ===
  learning: {
    // Card progress keyed by `${patternId}:${layer}`
    cardProgress: Record<string, CardProgress>;

    // Current study session
    session: StudySession | null;

    // Review queue (computed but cached)
    reviewQueue: {
      due: string[]; // Card IDs due today
      overdue: string[]; // Past due
      new: string[]; // Never seen
      lastComputed: number; // Timestamp
    };

    // Statistics
    stats: LearningStats;
  };

  // === EXPLORATION STATE ===
  exploration: {
    // Current navigation position in pattern hierarchy
    currentPath: HierarchyPath;

    // Filters and search
    filters: {
      qualities: SystemQuality[];
      difficulty: ("beginner" | "intermediate" | "advanced")[];
      searchQuery: string;
      tags: string[];
    };

    // Expansion state for tree views
    expandedNodes: Set<string>;

    // Selected items for comparison/linking
    selectedPatterns: string[];
    selectedSystems: string[];
  };

  // === UI STATE (Minimal) ===
  ui: {
    theme: "dark" | "light";
    sidebarCollapsed: boolean;
    activeModal: ModalType | null;
    toasts: Toast[];

    // View preferences
    preferences: {
      codeLanguage: string;
      diagramStyle: "mermaid" | "excalidraw";
      cardAnimations: boolean;
    };
  };

  // === SYNC STATE ===
  sync: {
    lastSyncedAt: number | null;
    pendingChanges: PendingChange[];
    syncStatus: "idle" | "syncing" | "error";
  };
}
```

---

## 3.3 Normalized Entity Pattern

```typescript
// Patterns are normalized - relationships are IDs, not nested objects
// This enables:
// 1. Single source of truth
// 2. Efficient updates
// 3. Flexible querying
// 4. Memory efficiency

// Example: Fetching a pattern with its implementations
const selectPatternWithImplementations = createSelector(
  [
    (state: RootState) => state.entities.patterns,
    (state: RootState) => state.entities.implementations,
    (_: RootState, patternId: string) => patternId,
  ],
  (patterns, implementations, patternId) => {
    const pattern = patterns[patternId];
    if (!pattern) return null;

    return {
      ...pattern,
      implementations: pattern.implementations
        .map((implId) => implementations[implId])
        .filter(Boolean),
    };
  },
);
```

---

## 3.4 Slice Structure

```typescript
// src/store/slices/

// 1. entitiesSlice.ts - Normalized domain data
// 2. learningSlice.ts - Spaced repetition state
// 3. explorationSlice.ts - Navigation and filtering
// 4. uiSlice.ts - UI preferences and ephemeral state
// 5. syncSlice.ts - Persistence and sync status
```

---

## 3.5 Key Selectors (Derived State)

```typescript
// === LEARNING SELECTORS ===

// Get all cards due for review today
export const selectDueCards = createSelector(
  [selectAllCardProgress],
  (progress) => {
    const now = new Date();
    return Object.values(progress)
      .filter((card) => new Date(card.nextReviewDate) <= now)
      .sort(
        (a, b) =>
          new Date(a.nextReviewDate).getTime() -
          new Date(b.nextReviewDate).getTime(),
      );
  },
);

// Get mastery level for a pattern (aggregate of all layers)
export const selectPatternMastery = createSelector(
  [
    (state: RootState) => state.learning.cardProgress,
    (_: RootState, patternId: string) => patternId,
  ],
  (progress, patternId) => {
    const layers = [1, 2, 3, 4, 5, 6] as const;
    const layerProgress = layers.map((layer) => {
      const key = `${patternId}:${layer}`;
      return progress[key];
    });

    return {
      overall: calculateOverallMastery(layerProgress),
      byLayer: layerProgress.reduce(
        (acc, p, i) => {
          acc[layers[i]] = p ? calculateLayerMastery(p) : 0;
          return acc;
        },
        {} as Record<number, number>,
      ),
    };
  },
);

// === EXPLORATION SELECTORS ===

// Get patterns filtered by current exploration state
export const selectFilteredPatterns = createSelector(
  [selectAllPatterns, selectExplorationFilters],
  (patterns, filters) => {
    return patterns.filter((pattern) => {
      if (
        filters.qualities.length > 0 &&
        !filters.qualities.includes(pattern.hierarchy.quality)
      ) {
        return false;
      }
      if (
        filters.difficulty.length > 0 &&
        !filters.difficulty.includes(pattern.difficulty)
      ) {
        return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          pattern.concept.name.toLowerCase().includes(query) ||
          pattern.concept.tagline.toLowerCase().includes(query) ||
          pattern.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  },
);

// Build hierarchy tree for navigation
export const selectPatternHierarchy = createSelector(
  [selectAllPatterns],
  (patterns) => {
    // Build tree: Quality -> Strategy -> Family -> Pattern
    return buildHierarchyTree(patterns);
  },
);

// === GRAPH SELECTORS (for visualization) ===

// Get pattern relationship graph
export const selectPatternGraph = createSelector(
  [selectAllPatterns, selectAllSystems],
  (patterns, systems) => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add pattern nodes
    patterns.forEach((p) => {
      nodes.push({
        id: p.id,
        type: "pattern",
        label: p.concept.name,
        data: p,
      });

      // Add edges to related patterns
      p.concept.relatedPatterns.forEach((relatedId) => {
        edges.push({
          source: p.id,
          target: relatedId,
          type: "related",
        });
      });
    });

    // Add system nodes and usage edges
    systems.forEach((s) => {
      nodes.push({
        id: s.id,
        type: "system",
        label: s.name,
        data: s,
      });

      s.patternUsage.forEach((usage) => {
        edges.push({
          source: s.id,
          target: usage.patternId,
          type: "uses",
          label: usage.component,
        });
      });
    });

    return { nodes, edges };
  },
);
```

---

[Next: Spaced Repetition →](./04-spaced-repetition.md)
