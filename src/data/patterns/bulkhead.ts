import type { Pattern } from "../schema";

export const bulkhead: Pattern = {
  id: "bulkhead",
  slug: "bulkhead",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkheads",
    level: 4,
  },

  concept: {
    name: "Bulkhead",
    emoji: "🧱",
    tagline: "Isolate failures to contain the blast radius",
    definition:
      "A pattern that isolates components or resources into separate pools, preventing a failure in one area from cascading and consuming all available resources.",
    problemSolved:
      "When all requests share the same resource pool (threads, connections), one slow or failing dependency can exhaust the entire pool, bringing down unrelated functionality.",
    tradeoffs: {
      pros: [
        "Contains failures to isolated compartments",
        "Ensures critical paths have dedicated resources",
        "Prevents noisy neighbor problems",
        "Enables graceful degradation of non-critical features",
      ],
      cons: [
        "Reduces overall resource efficiency (dedicated pools may be underutilized)",
        "Adds complexity in resource management",
        "Requires careful sizing of each compartment",
        "Can mask underlying issues if not monitored",
      ],
    },
    relatedPatterns: ["circuit-breaker", "timeout", "rate-limiting", "queue"],
  },

  structure: {
    participants: [
      {
        name: "Bulkhead",
        role: "Resource Isolator",
        responsibilities: [
          "Maintain separate resource pools per dependency",
          "Enforce limits on concurrent access",
          "Reject requests when pool is exhausted",
        ],
      },
      {
        name: "Resource Pool",
        role: "Isolated Compartment",
        responsibilities: [
          "Manage a fixed set of resources (threads, connections)",
          "Track available and in-use resources",
          "Queue or reject when at capacity",
        ],
      },
      {
        name: "Client",
        role: "Consumer",
        responsibilities: [
          "Request resources from appropriate pool",
          "Handle rejection gracefully",
          "Release resources when done",
        ],
      },
    ],
    diagram: `flowchart LR
    subgraph Client
        R1[Request A]
        R2[Request B]
        R3[Request C]
    end

    subgraph Bulkheads
        P1[Pool: Service A<br/>3/5 threads]
        P2[Pool: Service B<br/>2/3 threads]
        P3[Pool: Database<br/>8/10 connections]
    end

    R1 --> P1
    R2 --> P2
    R3 --> P3`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request Resource",
        description: "Client requests a resource for a specific dependency",
      },
      {
        step: 2,
        actor: "Bulkhead",
        action: "Check Pool",
        description: "Check if resources are available in the isolated pool",
      },
      {
        step: 3,
        actor: "Bulkhead",
        action: "Allocate or Reject",
        description:
          "Grant resource if available, reject or queue if exhausted",
      },
      {
        step: 4,
        actor: "Client",
        action: "Use Resource",
        description: "Execute operation using the allocated resource",
      },
      {
        step: 5,
        actor: "Client",
        action: "Release",
        description: "Return resource to the pool when done",
      },
    ],
    invariants: [
      "Each pool has a fixed maximum size",
      "Resources are only borrowed, never shared across pools",
      "Pool exhaustion does not affect other pools",
      "Released resources return to their original pool",
    ],
  },

  codeExamples: [
    {
      id: "bulkhead-typescript",
      language: "typescript",
      title: "Semaphore-based Bulkhead",
      description: "A simple bulkhead using semaphores to limit concurrency",
      code: `class Bulkhead {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(private maxConcurrent: number) {
    this.permits = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  private release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

// Usage: separate bulkheads per dependency
const paymentBulkhead = new Bulkhead(5);
const inventoryBulkhead = new Bulkhead(10);

// Payment issues won't exhaust inventory capacity
await paymentBulkhead.execute(() => paymentService.charge(order));
await inventoryBulkhead.execute(() => inventoryService.reserve(items));`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope: "A reusable bulkhead class that limits concurrent executions",
        prerequisites: ["Promises", "Async/await", "Semaphores"],
        systemPosition: "Wraps calls to external services in service layer",
      },
      annotations: [
        {
          id: "bulkhead-permits",
          lines: [2, 2],
          action: "Track available permits (slots)",
          reason:
            "Permits represent the current capacity; when zero, new requests must wait",
          contextLevel: "local",
        },
        {
          id: "bulkhead-acquire",
          lines: [14, 23],
          action: "Acquire a permit before executing",
          reason:
            "If permits available, proceed immediately; otherwise queue the request",
          contextLevel: "local",
          relatedConcepts: ["semaphore"],
        },
        {
          id: "bulkhead-release",
          lines: [25, 32],
          action: "Release permit and wake waiting requests",
          reason:
            "Ensures resources are returned and queued requests can proceed",
          contextLevel: "local",
        },
        {
          id: "bulkhead-usage",
          lines: [36, 37],
          action: "Create separate bulkheads per dependency",
          reason:
            "Isolation means payment failures cannot consume inventory capacity",
          contextLevel: "system",
          relatedConcepts: ["fault-isolation"],
        },
      ],
      highlights: [
        {
          lines: [14, 32],
          label: "Semaphore-style acquire/release",
          sbvpDomain: "behavior",
        },
        {
          lines: [36, 41],
          label: "Isolated pools per service",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Service Layer",
      "HTTP Client",
      "Database Connection Pool",
      "Thread Pool Executor",
    ],
    interactsWith: ["circuit-breaker", "timeout", "retry", "rate-limiting"],
    architecturalBoundaries: [
      "Per-dependency thread pools",
      "Per-tenant resource quotas",
      "Per-service connection limits",
    ],
  },

  implementations: [
    {
      id: "resilience4j-bulkhead",
      name: "Resilience4j Bulkhead",
      type: "library",
      languages: ["java", "kotlin"],
      description: "Semaphore and thread pool bulkhead implementations",
      links: {
        docs: "https://resilience4j.readme.io/docs/bulkhead",
        github: "https://github.com/resilience4j/resilience4j",
      },
    },
    {
      id: "polly-bulkhead",
      name: "Polly Bulkhead",
      type: "library",
      languages: ["csharp"],
      description: ".NET bulkhead policy for isolation",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki/Bulkhead",
        github: "https://github.com/App-vNext/Polly",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix",
      systemName: "Netflix",
      howUsed:
        "Hystrix used thread pool isolation to prevent failures in one service from affecting others",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "aws",
      systemName: "AWS",
      howUsed:
        "Lambda uses concurrency limits per function to isolate workloads",
    },
  ],

  philosophy: {
    coreProblem:
      "Shared resource pools create coupling where one failure can cascade to exhaust all resources",
    designPrinciple:
      "Partition resources so that failures are contained within boundaries, like watertight compartments in a ship",
    historicalContext:
      "Named after ship bulkheads—watertight walls that prevent a hull breach from sinking the entire vessel",
    alternativesRejected: [
      "Shared pools - efficient but vulnerable to cascading failures",
      "Unlimited resources - expensive and can lead to runaway resource consumption",
      "Static allocation - inflexible to changing workloads",
    ],
    mentalModel:
      "Like watertight compartments in a ship: if one floods, the others stay dry and the ship stays afloat",
  },

  visualization: {
    staticDiagram: `flowchart TB
    subgraph Ship
        C1[Compartment 1<br/>FLOODED]
        C2[Compartment 2<br/>OK]
        C3[Compartment 3<br/>OK]
    end
    style C1 fill:#f38ba8`,
    realWorldAnalogy:
      "Bulkheads are like the watertight compartments in a ship. If the hull is breached and one compartment floods, the bulkhead walls prevent water from spreading to other compartments, keeping the ship afloat.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "The payment service becomes slow. With bulkheads, only the 5 threads allocated to payments are blocked—the 20 threads for product catalog continue serving requests.",
        patternRole: "Prevents slow payments from affecting product browsing",
        companies: ["Amazon", "Shopify"],
      },
      {
        domain: "Cloud",
        scenario:
          "A noisy tenant runs expensive queries. With per-tenant connection pools, they only exhaust their own quota while other tenants continue normally.",
        patternRole: "Enables fair multi-tenant resource sharing",
        companies: ["AWS", "Azure", "Salesforce"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "resource-management",
    "resilience",
  ],
  difficulty: "intermediate",
};
