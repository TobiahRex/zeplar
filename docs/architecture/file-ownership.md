# Zeplar File Ownership Map

**Last Updated**: 2025-12-27

This document maps directories and files to their responsible roles. For the Zeplar project (frontend-only), the **frontend-engineer** role owns most of the codebase.

## Ownership Legend

- 🟢 **Frontend Engineer** - Primary owner, can modify directly
- 🟡 **Architect** - Requires architectural review before major changes
- 🔵 **Test Engineer** - Testing infrastructure and test files
- 🟠 **Documentation Specialist** - Documentation files
- 🔴 **Data Layer Engineer** - Data schemas and persistence layer

---

## Directory Ownership

### `/src/app/` - Core Application Setup

**Owner**: 🟡 Architect (with 🟢 Frontend Engineer implementation)

- `hooks.ts` - 🟢 Typed Redux hooks (frontend-engineer)
- `router.tsx` - 🟡 Routing configuration (requires architect approval for new routes)
- `store.ts` - 🟡 Redux store setup (requires architect approval for middleware/enhancers)

**Rationale**: Core app configuration affects architecture. Frontend Engineer implements, but Architect approves structure.

---

### `/src/components/` - UI Components

**Owner**: 🟢 Frontend Engineer

#### `/src/components/ui/` - Base UI Primitives

- `badge.tsx` - 🟢 Badge component
- `button.tsx` - 🟢 Button component
- `card.tsx` - 🟢 Card component
- `progress.tsx` - 🟢 Progress bar component
- `tabs.tsx` - 🟢 Tabs component

**Rationale**: Presentational components, full frontend ownership.

#### `/src/components/code/` - Code Editor Components

**Owner**: 🟢 Frontend Engineer

**Rationale**: CodeMirror integration, frontend concerns.

#### `/src/components/diagrams/` - Diagram Components

**Owner**: 🟢 Frontend Engineer

**Rationale**: Mermaid rendering, frontend concerns.

#### `/src/components/layout/` - Layout Components

**Owner**: 🟢 Frontend Engineer

**Rationale**: Page layouts, navigation, frontend concerns.

---

### `/src/data/` - Static Application Data

**Owner**: 🔴 Data Layer Engineer (with 🟢 Frontend Engineer for read-only access)

#### `/src/data/schema.ts` - Zod Schema Definitions

**Owner**: 🔴 Data Layer Engineer

**Rationale**: Schema changes affect data integrity. Requires data layer approval.

#### `/src/data/patterns/` - Pattern Data Files

**Owner**: 🔴 Data Layer Engineer (content) + 🟢 Frontend Engineer (TypeScript types)

- `index.ts` - 🟢 Pattern utilities and exports (frontend)
- `bulkhead.ts` - 🔴 Pattern data (data layer)
- `cache-aside.ts` - 🔴 Pattern data (data layer)
- `circuit-breaker.ts` - 🔴 Pattern data (data layer)
- `rate-limiting.ts` - 🔴 Pattern data (data layer)
- `retry.ts` - 🔴 Pattern data (data layer)
- `timeout.ts` - 🔴 Pattern data (data layer)

**Rationale**: Pattern content is data layer responsibility. Frontend consumes via utilities.

#### `/src/data/systems/` - System Architecture Data

**Owner**: 🔴 Data Layer Engineer

**Rationale**: System data is data layer responsibility.

---

### `/src/features/` - Feature Modules

**Owner**: 🟢 Frontend Engineer

#### `/src/features/learning/` - Spaced Repetition Learning

**Owner**: 🟢 Frontend Engineer

- `learningSlice.ts` - 🟢 Redux slice (frontend)
- `components/StudySession.tsx` - 🟢 Study orchestration (frontend)
- `components/Flashcard/*.tsx` - 🟢 Flashcard UI components (frontend)

**Rationale**: Feature UI and state management is frontend responsibility.

#### `/src/features/exploration/` - Pattern Exploration (Future)

**Owner**: 🟢 Frontend Engineer

#### `/src/features/patterns/` - Pattern Browsing (Future)

**Owner**: 🟢 Frontend Engineer

#### `/src/features/systems/` - System Exploration (Future)

**Owner**: 🟢 Frontend Engineer

---

### `/src/lib/` - Utility Libraries

**Owner**: Mixed ownership

- `cardGenerator.ts` - 🟢 Frontend Engineer (generates flashcards from patterns)
- `db.ts` - 🔴 Data Layer Engineer (IndexedDB operations, schema changes)
- `persistence.ts` - 🟢 Frontend Engineer (React hook for persistence)
- `sm2.ts` - 🔴 Data Layer Engineer (algorithm implementation) + 🟢 Frontend Engineer (UI integration)
- `utils.ts` - 🟢 Frontend Engineer (general utilities)

**Rationale**: Database operations are data layer. UI utilities are frontend.

---

### `/src/pages/` - Top-Level Pages

**Owner**: 🟢 Frontend Engineer

- `Dashboard.tsx` - 🟢 Home page
- `Study.tsx` - 🟢 Study session page

**Rationale**: Page components are frontend responsibility.

---

### `/src/test/` - Test Configuration

**Owner**: 🔵 Test Engineer

- `setup.ts` - 🔵 Test environment setup

**Rationale**: Testing infrastructure is test engineer responsibility.

---

### Root Configuration Files

**Owner**: 🟡 Architect (with 🟢 Frontend Engineer for minor tweaks)

- `vite.config.ts` - 🟡 Vite build configuration
- `vitest.config.ts` - 🔵 Test runner configuration
- `tsconfig.json` - 🟡 TypeScript configuration
- `tsconfig.app.json` - 🟡 App-specific TypeScript config
- `tsconfig.node.json` - 🟡 Node-specific TypeScript config
- `eslint.config.js` - 🟡 Linting rules
- `package.json` - 🟡 Dependencies (require architect approval for new deps)
- `components.json` - 🟢 shadcn/ui configuration

**Rationale**: Build and tooling configuration affects architecture.

---

### `/docs/` - Documentation

**Owner**: 🟠 Documentation Specialist (with 🟢 Frontend Engineer for technical docs)

- `docs/architecture/` - 🟠 + 🟢 Shared (technical architecture docs)
- `docs/brainstorming/` - 🟠 Documentation Specialist
- `docs/plans/` - 🟡 Architect
- `docs/projects/` - 🟠 Documentation Specialist

**Rationale**: Documentation Specialist owns structure, Frontend Engineer contributes technical content.

---

## Modification Guidelines

### Frontend Engineer Can Directly Modify:

✅ All files in `/src/components/` (except schema-related)
✅ All files in `/src/features/`
✅ All files in `/src/pages/`
✅ UI-related utilities in `/src/lib/` (`cardGenerator.ts`, `persistence.ts`, `utils.ts`)
✅ Minor dependency updates (patch versions)

### Requires Architect Approval:

⚠️ Adding new Redux middleware or enhancers
⚠️ Changing routing structure
⚠️ Adding major new dependencies
⚠️ Modifying build configuration (`vite.config.ts`, `tsconfig.json`)
⚠️ Creating new state management patterns

**Process**: Use `propose_request()` to architect for review.

### Requires Data Layer Engineer Approval:

⚠️ Changes to `/src/data/schema.ts`
⚠️ IndexedDB schema changes in `/src/lib/db.ts`
⚠️ SM-2 algorithm changes in `/src/lib/sm2.ts`
⚠️ Pattern data structure changes

**Process**: Create request to `data-layer-engineer` role (if exists) or propose to architect.

### Requires Test Engineer Coordination:

⚠️ Changes to test infrastructure (`/src/test/setup.ts`, `vitest.config.ts`)
⚠️ Adding new testing libraries

**Process**: Create request to `test-engineer` role.

---

## File Naming Conventions

### Components

- **PascalCase** for React components: `StudySession.tsx`, `CardFlip.tsx`
- **Features**: Nested under `/src/features/{feature}/components/`
- **Shared UI**: Nested under `/src/components/ui/`

### Utilities

- **camelCase** for utility files: `cardGenerator.ts`, `sm2.ts`
- **Located in**: `/src/lib/`

### Data Files

- **kebab-case** for data files: `circuit-breaker.ts`, `cache-aside.ts`
- **Located in**: `/src/data/patterns/`

### Types & Schemas

- **PascalCase** for type/schema files: `schema.ts`
- **Export types** from `/src/data/schema.ts`

### Tests

- **Co-located** with source files: `Component.test.tsx`
- **Test utilities** in `/src/test/`

---

## Coordination Requirements

### When Adding New Features

1. ✅ Frontend Engineer: Create UI components and state management
2. ⚠️ Propose to Architect if:
   - New routing required
   - New state management pattern
   - Significant architecture change
3. 🔄 Coordinate with Data Layer Engineer if:
   - New data structures needed
   - IndexedDB schema changes
4. 🔄 Coordinate with Test Engineer for:
   - E2E test coverage
   - Integration tests

### When Modifying Core Patterns

1. ⚠️ Propose to Architect:
   - State management architecture changes
   - New libraries or frameworks
   - Performance optimization strategies
2. 🔴 Requires Data Layer Engineer:
   - Pattern schema changes
   - Database migrations

### When Fixing Bugs

1. ✅ Frontend Engineer: Direct fix for UI bugs
2. 🔄 Coordinate if bug is in:
   - Data layer (`sm2.ts`, `db.ts`, schema)
   - Test infrastructure
   - Build configuration

---

## Quick Reference

| Directory          | Primary Owner            | Can Modify Directly?         |
| ------------------ | ------------------------ | ---------------------------- |
| `/src/app/`        | Architect                | ⚠️ Propose major changes     |
| `/src/components/` | Frontend Engineer        | ✅ Yes                       |
| `/src/data/`       | Data Layer Engineer      | ❌ Read-only for frontend    |
| `/src/features/`   | Frontend Engineer        | ✅ Yes                       |
| `/src/lib/`        | Mixed                    | ⚠️ Depends on file           |
| `/src/pages/`      | Frontend Engineer        | ✅ Yes                       |
| `/src/test/`       | Test Engineer            | ⚠️ Coordinate changes        |
| Root configs       | Architect                | ⚠️ Propose major changes     |
| `/docs/`           | Documentation Specialist | 🔄 Contribute technical docs |

---

## Conflict Resolution

If ownership is unclear:

1. **Default to Architect** for architectural decisions
2. **Default to Frontend Engineer** for UI/UX decisions
3. **Default to Data Layer Engineer** for schema/algorithm decisions
4. **Use `propose_request()`** when in doubt

**Golden Rule**: When uncertain, err on the side of coordination. Better to over-communicate than to create conflicts.
