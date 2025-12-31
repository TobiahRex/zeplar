import type { Pattern } from "../schema";

export const pluginArchitecture: Pattern = {
  id: "plugin-architecture",
  slug: "plugin-architecture",
  corpusPath: "🔧 MAINTAINABILITY → 📦 Modularity → 🔌 Plugin Architecture",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Modularity",
    level: 4,
  },

  concept: {
    name: "Plugin Architecture",
    emoji: "🔌",
    tagline: "Extensible via plugins",
    definition:
      "Plugin Architecture structures applications around a minimal core system that loads and coordinates dynamically discoverable extension modules (plugins), enabling third-party customization without modifying the core codebase. Like electrical outlets that accept any compatible device, the core defines standard interfaces (plugin contracts) that extensions implement, then discovers and loads plugins at runtime. Classic examples include WordPress plugins, browser extensions, Webpack loaders, and IDE extensions. The architecture separates the application into three layers: the core (minimal host application providing infrastructure), plugin contracts (interfaces, hooks, event buses), and plugins (independent modules implementing contracts). Plugins register with the core through manifest files (package.json, plugin.xml) or discovery conventions (scanning a plugins/ directory for classes implementing IPlugin interface). The core provides an extension point mechanism—designated places where plugins can inject behavior: lifecycle hooks (beforeRequest, afterResponse), data transformations (Webpack loaders), UI components (VSCode sidebar panels), or completely new features (Babel transforms). Advanced implementations include plugin dependency management (pluginA requires pluginB@^2.0), sandboxing (limit plugin access to core APIs), and hot-reloading (update plugins without restarting). The key insight is that plugin architectures invert dependencies—the core depends on abstractions (interfaces), while concrete implementations (plugins) depend on the core, enabling the open-closed principle at the architectural level.",
    problemSolved:
      "Monolithic applications become unmaintainable when they try to satisfy every user's needs through configuration flags and feature toggles, resulting in bloated codebases where every edge case adds complexity for all users. Plugin architecture solves this by separating the core product from customizations—the core stays lean and focused while plugins add specialized features only for users who need them. This addresses the extensibility problem: when users need custom behavior (special authentication, proprietary data formats, domain-specific workflows), they can build plugins without forking the entire codebase or waiting for the core team to implement niche features. Plugins also enable ecosystem growth—third-party developers can extend the platform without access to core source code, creating network effects (Shopify's app store, WordPress plugins). Additionally, the pattern solves the update problem: when the core evolves, well-designed plugin contracts ensure backward compatibility so plugins don't break with every release. This is crucial for platforms like VSCode where thousands of community extensions would shatter if Microsoft couldn't update the editor. Finally, plugins enable experimentation—teams can test new features as plugins before deciding whether to merge into core.",
    tradeoffs: {
      pros: [
        "Enables third-party extensibility without modifying or forking core codebase",
        "Keeps core application lean and focused while allowing specialized features via plugins",
        "Creates ecosystem opportunities where community contributors add value",
        "Facilitates A/B testing and experimentation through plugin activation/deactivation",
        "Enables customization per customer or deployment without branching core code",
        "Supports incremental feature rollout by releasing capabilities as opt-in plugins",
      ],
      cons: [
        "Requires stable, well-designed plugin contracts that are hard to change without breaking ecosystem",
        "Adds complexity in plugin discovery, loading, versioning, and dependency resolution",
        "Security risks when third-party plugins have access to core system resources",
        "Performance overhead from dynamic loading and interface indirection",
        "Debugging becomes difficult when issues span core and multiple plugin interactions",
        "Versioning challenges when core updates require coordinated plugin updates across ecosystem",
      ],
    },
    relatedPatterns: [
      "dependency-injection",
      "microservices",
      "event-driven-architecture",
      "adapter-pattern",
      "strategy-pattern",
      "inversion-of-control",
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
      id: "plugin-architecture-ts-basic",
      language: "typescript",
      title: "TODO: Plugin Architecture Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Plugin Architecture
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
