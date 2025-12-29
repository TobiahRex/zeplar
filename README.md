# Zeplar

A spaced-repetition learning platform for mastering system design patterns through multi-layered flashcards.

## Overview

Zeplar teaches system design patterns using a 6-layer content model (L1-L6) that progressively deepens understanding from conceptual foundations to real-world system composition.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Content Quality Tooling

Zeplar includes automated tooling to ensure content quality, track progress, and validate pattern completeness across all 6 layers.

### Available Commands

#### 1. Completeness Checker

Evaluates patterns against quality standards and generates completeness scores (0-100%).

```bash
# Check all patterns
npm run check:completeness

# Check specific pattern
npm run check:completeness circuit-breaker
```

**Scoring Rubric:**

- **L1 (20pts)**: Definition ≥150 words, problem solved ≥100 words, 3+ pros, 3+ cons, 3+ related patterns
- **L2 (20pts)**: 3+ participants, 5+ flow steps, real Mermaid diagram, 3+ invariants
- **L3 (20pts)**: 2+ code examples, ≥100 lines of code, complete Layer 3 Trifecta
- **L4 (20pts)**: 2+ placement scenarios, 2+ architectural boundaries
- **L5 (10pts)**: 5+ technology implementations
- **L6 (10pts)**: 2+ real-world case studies

**Output:**

- JSON report saved to `scripts/reports/completeness-{timestamp}.json`
- Console summary with average scores by layer and quality
- Completion tier breakdown (Excellent/Good/Partial/Minimal)

#### 2. Mermaid Diagram Validator

Validates all Mermaid diagrams for syntax correctness and accessibility.

```bash
# Validate all diagrams
npm run validate:diagrams

# Validate specific pattern
npm run validate:diagrams cache-aside
```

**Checks:**

- Valid Mermaid syntax (graph types, balanced brackets/braces)
- High-contrast colors (accessibility)
- No placeholder content (TODO/TBD/Placeholder)

**Output:**

- JSON report saved to `scripts/reports/diagram-validation-{timestamp}.json`
- List of diagrams with syntax errors or warnings
- Exit code 1 if errors found (suitable for CI/CD)

#### 3. Code Example Test Runner

Tests code examples for compilation/runtime correctness.

```bash
# Test all code examples
npm run test:code-examples

# Test specific pattern
npm run test:code-examples retry
```

**Supported Languages:**

- **TypeScript**: Full compilation testing (required)
- **Python**: Syntax validation with `py_compile` (optional)
- **Go**: Planned (requires Go toolchain)
- **Java**: Planned (requires JDK)

**Behavior:**

- Skips examples marked `runnable: false`
- Skips code snippets <50 characters
- Creates temporary files in `.test-temp/` for testing
- Reports pass/fail/skip status for each example

**Output:**

- JSON report saved to `scripts/reports/code-examples-{timestamp}.json`
- Summary of tested/passed/failed/skipped examples
- Detailed error messages for failed examples

#### 4. Content Quality Dashboard

Generates a static HTML dashboard with interactive visualizations.

```bash
# Generate dashboard
npm run dashboard:generate
```

**Features:**

- Overall completeness gauge
- Completeness by layer (bar chart)
- Completeness by quality category (radar chart)
- Completion tier distribution (doughnut chart)
- Top 20 and bottom 20 patterns
- Last updated timestamp

**Output:**

- Dashboard saved to `dashboard/content-quality.html`
- Opens in browser with `open dashboard/content-quality.html`

#### 5. Run All Quality Checks

Execute all quality tools in sequence and generate dashboard.

```bash
npm run quality:check
```

This runs:

1. `check:completeness` - Evaluate all patterns
2. `validate:diagrams` - Validate Mermaid diagrams
3. `test:code-examples` - Test code compilation
4. `dashboard:generate` - Create visual dashboard

### Interpreting Results

**Completion Tiers:**

- ✅ **Excellent (80-100%)**: Production-ready, all layers complete
- 👍 **Good (60-79%)**: Nearly complete, minor enhancements needed
- ⚠️ **Partial (40-59%)**: Partial content, requires significant work
- ❌ **Minimal (0-39%)**: Skeletal content, needs full authoring

**Layer Scores:**

- **L1-L2**: Conceptual foundation (40 points combined)
- **L3-L4**: Code and architecture (40 points combined)
- **L5-L6**: Technology and real-world systems (20 points combined)

### CI/CD Integration

Add to `.github/workflows/quality.yml`:

```yaml
name: Content Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run quality:check
```

### Report Storage

All reports are saved to `scripts/reports/`:

- `completeness-{timestamp}.json`
- `diagram-validation-{timestamp}.json`
- `code-examples-{timestamp}.json`

Dashboard reads the latest completeness report automatically.

---

## Development Stack

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
