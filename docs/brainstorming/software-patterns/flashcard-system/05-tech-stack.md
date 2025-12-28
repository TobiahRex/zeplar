# 5. Technology Stack

[← Back to Index](./index.md) | [← Previous: Spaced Repetition](./04-spaced-repetition.md)

---

## 5.1 Core Stack

| Category      | Technology                | Rationale                                   |
| ------------- | ------------------------- | ------------------------------------------- |
| **Framework** | React 18                  | Component model, hooks, concurrent features |
| **Build**     | Vite                      | Fast HMR, modern bundling, ESM-native       |
| **State**     | Redux Toolkit + RTK Query | Normalized state, middleware, caching       |
| **Routing**   | React Router v6           | Standard, supports nested routes            |
| **Styling**   | Tailwind CSS + shadcn/ui  | Utility-first, accessible components        |
| **Language**  | TypeScript                | Type safety for complex data model          |

---

## 5.2 Learning Experience Libraries

| Library                        | Purpose                                 |
| ------------------------------ | --------------------------------------- |
| **@uiw/react-codemirror**      | Code editor with syntax highlighting    |
| **mermaid**                    | Diagram rendering from text             |
| **framer-motion**              | Smooth card flip animations             |
| **@xyflow/react** (React Flow) | Interactive pattern relationship graphs |
| **@tanstack/react-virtual**    | Virtual scrolling for large lists       |
| **monaco-editor**              | Full IDE experience for code challenges |

---

## 5.3 Persistence & Sync

| Library           | Purpose                                 |
| ----------------- | --------------------------------------- |
| **Dexie.js**      | IndexedDB wrapper with advanced queries |
| **redux-persist** | Automatic state hydration               |
| **idb**           | Lightweight IndexedDB alternative       |

---

## 5.4 3D Visualization

| Library                         | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| **React Three Fiber**           | React renderer for Three.js                |
| **@react-three/drei**           | Useful helpers (OrbitControls, Text, etc.) |
| **@react-three/postprocessing** | Bloom, glow effects                        |
| **Lottie / Rive**               | 2D animated icons within 3D scene          |
| **Framer Motion 3D**            | Declarative animations                     |
| **Zustand**                     | Lightweight state for animation variables  |

---

## 5.5 Optional Enhancements

| Library                    | Purpose                           |
| -------------------------- | --------------------------------- |
| **@excalidraw/excalidraw** | Hand-drawn style diagrams         |
| **Sandpack**               | Live code execution in browser    |
| **use-sound**              | Audio feedback for reviews        |
| **canvas-confetti**        | Celebration on mastery milestones |

---

## 5.6 Development Tools

| Tool                  | Purpose                     |
| --------------------- | --------------------------- |
| **ESLint + Prettier** | Code quality and formatting |
| **Vitest**            | Fast unit testing           |
| **Playwright**        | E2E testing                 |
| **Storybook**         | Component development       |
| **Redux DevTools**    | State debugging             |

---

[Next: App Architecture →](./06-app-architecture.md)
