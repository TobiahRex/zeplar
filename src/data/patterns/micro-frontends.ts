import type { Pattern } from "../schema";

export const microFrontends: Pattern = {
  id: "micro-frontends",
  slug: "micro-frontends",
  corpusPath: "🔧 MAINTAINABILITY → 📦 Modularity → 🌐 Micro-Frontends",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Modularity",
    level: 4,
  },

  concept: {
    name: "Micro-Frontends",
    emoji: "🌐",
    tagline: "Frontend microservices",
    definition:
      "Micro-Frontends extend microservices principles to frontend applications by splitting user interfaces into independently developed, deployed, and owned vertical slices that compose into a cohesive user experience. Like separate apps coexisting on a smartphone where each is developed by different teams but shares a consistent platform, micro-frontends let teams build complete features—from database to UI—without touching shared frontend codebases. Each team owns an isolated UI segment: the product catalog team builds the product browser, the checkout team owns the cart and payment flow, and the user profile team manages account settings. These fragments integrate through various composition techniques: build-time (npm packages), runtime (module federation, single-spa), edge-side (ESI, Cloudflare Workers), or iframe-based isolation. Modern implementations use Webpack Module Federation for sharing dependencies, custom elements for framework-agnostic components, or server-side routing where the reverse proxy directs /products to Product MFE and /checkout to Checkout MFE. The pattern emphasizes vertical ownership—teams control their entire stack without coordinating frontend changes. Communication between micro-frontends happens through URL navigation, shared state management (broadcast channels, custom events), or backend coordination. The key insight: just as microservices prevent backend teams from blocking each other, micro-frontends prevent frontend monoliths from becoming organizational bottlenecks.",
    problemSolved:
      "Large frontend codebases become unmaintainable bottlenecks when multiple teams contribute to a single React/Angular application—merge conflicts multiply, build times balloon to 20+ minutes, and deploying one feature risks breaking others. Teams wait days for code reviews from overburdened frontend architects, and onboarding requires understanding the entire application. Micro-frontends solve this by giving teams end-to-end ownership: the search team builds the search UI, deploys it independently, and doesn't touch anyone else's code. This eliminates coordination overhead and enables parallel development. The pattern also addresses technology lock-in—when your SPA was built in Angular 5 years ago but the team wants to use React for new features, micro-frontends let you migrate incrementally rather than rewriting everything. Teams can experiment with new frameworks or upgrade dependencies independently. Additionally, micro-frontends enable granular deployments—updating the checkout flow doesn't require redeploying the entire application, reducing deployment risk. However, micro-frontends introduce challenges: bundle size duplication (three MFEs each loading React), styling consistency across teams, navigation coordination, and ensuring cohesive UX when teams work in silos. The pattern works best for large organizations with multiple frontend teams, not small startups.",
    tradeoffs: {
      pros: [
        "Enables independent deployment of UI features without coordinating across teams",
        "Supports technology diversity—teams can use React, Vue, Svelte in different micro-frontends",
        "Prevents frontend codebase from becoming organizational bottleneck in large teams",
        "Facilitates incremental migration from legacy frameworks to modern ones",
        "Improves team autonomy with end-to-end ownership from backend to UI",
        "Enables experimentation with new technologies in isolated micro-frontends",
      ],
      cons: [
        "Bundle size bloat when multiple micro-frontends load duplicate dependencies (React, lodash)",
        "Consistency challenges—maintaining cohesive UX, design system, and navigation across teams",
        "Increased complexity in build tooling, deployment pipelines, and runtime integration",
        "Performance overhead from loading multiple JavaScript bundles and orchestration code",
        "Difficult inter-MFE communication—teams resort to hacky global state or URL params",
        "Requires mature frontend architecture skills—premature micro-frontends often create chaos",
      ],
    },
    relatedPatterns: [
      "microservices",
      "module-federation",
      "web-components",
      "monorepo",
      "design-systems",
      "single-spa",
    ],
  },

  structure: {
    participants: [
      {
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
  },

  codeExamples: [
    {
      id: "micro-frontends-ts-basic",
      language: "typescript",
      title: "TODO: Micro-Frontends Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Micro-Frontends
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
