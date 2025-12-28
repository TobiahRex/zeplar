import type { Pattern } from "../schema";

export const rateLimiting: Pattern = {
  id: "rate-limiting",
  slug: "rate-limiting",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Rate Limiting",
    emoji: "🚦",
    tagline: "Control the flow to protect the system",
    definition:
      "A pattern that restricts the number of requests a client can make within a time window, protecting services from overload and ensuring fair resource distribution.",
    problemSolved:
      "Without limits, a single client (or bot, or bug) can flood a service with requests, consuming all resources and denying service to legitimate users.",
    tradeoffs: {
      pros: [
        "Protects services from overload and abuse",
        "Ensures fair access across clients",
        "Prevents runaway costs from API abuse",
        "Enables predictable capacity planning",
      ],
      cons: [
        "Can reject legitimate traffic during spikes",
        "Adds latency for limit checking",
        "Requires distributed state for multi-node systems",
        "Complex to tune limits appropriately",
      ],
    },
    relatedPatterns: [
      "throttling",
      "token-bucket",
      "leaky-bucket",
      "circuit-breaker",
    ],
  },

  structure: {
    participants: [
      {
        name: "Rate Limiter",
        role: "Traffic Controller",
        responsibilities: [
          "Track request counts per client/key",
          "Enforce rate limits and reject excess",
          "Reset counters at window boundaries",
        ],
      },
      {
        name: "Counter Store",
        role: "State Manager",
        responsibilities: [
          "Store request counts per key",
          "Support atomic increment operations",
          "Handle TTL/expiration",
        ],
      },
      {
        name: "Client",
        role: "Requester",
        responsibilities: [
          "Include identification (API key, IP, user ID)",
          "Handle rate limit responses (429 Too Many Requests)",
          "Implement backoff when limited",
        ],
      },
    ],
    diagram: `flowchart TD
    A[Request] --> B{Check Rate Limit}
    B -->|Under Limit| C[Increment Counter]
    C --> D[Process Request]
    D --> E[Return Response]
    B -->|Over Limit| F[Return 429]
    F --> G[Include Retry-After header]`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send Request",
        description: "Client sends request with identifying information",
      },
      {
        step: 2,
        actor: "Rate Limiter",
        action: "Check Limit",
        description: "Look up current count for this client in the window",
      },
      {
        step: 3,
        actor: "Rate Limiter",
        action: "Decision",
        description:
          "If under limit, increment and allow; if over, reject with 429",
      },
      {
        step: 4,
        actor: "Client",
        action: "Handle Response",
        description: "Process successful response or backoff on 429",
      },
    ],
    invariants: [
      "Request count must not exceed limit within window",
      "Counter must reset at window boundary",
      "Limit checks must be atomic (no race conditions)",
      "429 response must include rate limit headers",
    ],
  },

  codeExamples: [
    {
      id: "rate-limit-typescript",
      language: "typescript",
      title: "Sliding Window Rate Limiter",
      description: "A simple in-memory rate limiter using sliding window log",
      code: `interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps and filter to current window
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    const allowed = timestamps.length < this.limit;

    if (allowed) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
    }

    return {
      allowed,
      remaining: Math.max(0, this.limit - timestamps.length),
      resetAt: timestamps.length > 0
        ? timestamps[0] + this.windowMs
        : now + this.windowMs,
    };
  }
}

// Usage
const limiter = new RateLimiter(100, 60_000); // 100 req/min

function handleRequest(userId: string) {
  const result = limiter.check(userId);

  if (!result.allowed) {
    return {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': result.remaining,
        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000),
      },
    };
  }

  // Process request...
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope: "A sliding window rate limiter tracking requests per key",
        prerequisites: ["Sliding window algorithm", "HTTP status codes"],
        systemPosition: "API Gateway or middleware layer",
      },
      annotations: [
        {
          id: "rate-limit-storage",
          lines: [8, 8],
          action: "Store request timestamps per key",
          reason:
            "Sliding window log algorithm needs to track when each request occurred",
          contextLevel: "local",
        },
        {
          id: "rate-limit-filter",
          lines: [20, 21],
          action: "Filter timestamps to current window only",
          reason:
            "Removes old requests outside the sliding window, accurately counting recent activity",
          contextLevel: "local",
          relatedConcepts: ["sliding-window"],
        },
        {
          id: "rate-limit-check",
          lines: [23, 27],
          action: "Allow if under limit, record the request",
          reason:
            "Only add timestamp if request is allowed—rejected requests should not count against limit",
          contextLevel: "local",
        },
        {
          id: "rate-limit-headers",
          lines: [44, 48],
          action: "Return 429 with rate limit headers",
          reason:
            "Standard headers tell clients how many requests remain and when to retry",
          contextLevel: "module",
          relatedConcepts: ["http-429", "retry-after"],
        },
      ],
      highlights: [
        {
          lines: [20, 27],
          label: "Sliding window logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [44, 48],
          label: "Rate limit response headers",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "API Gateway",
      "Load Balancer",
      "Application Middleware",
      "CDN Edge",
    ],
    interactsWith: ["circuit-breaker", "throttling", "queue", "cache-aside"],
    architecturalBoundaries: [
      "Public API endpoints",
      "Inter-service calls",
      "Database queries",
      "Third-party API calls",
    ],
  },

  implementations: [
    {
      id: "redis-rate-limit",
      name: "Redis Rate Limiting",
      type: "service",
      languages: ["any"],
      description: "Use Redis INCR with TTL for distributed rate limiting",
      links: {
        docs: "https://redis.io/commands/incr/",
      },
    },
    {
      id: "express-rate-limit",
      name: "express-rate-limit",
      type: "library",
      languages: ["javascript", "typescript"],
      description: "Basic rate limiting middleware for Express.js",
      links: {
        npm: "https://www.npmjs.com/package/express-rate-limit",
        github: "https://github.com/express-rate-limit/express-rate-limit",
      },
    },
    {
      id: "kong-rate-limit",
      name: "Kong Rate Limiting",
      type: "platform",
      languages: ["any"],
      description: "API Gateway plugin for rate limiting",
      links: {
        docs: "https://docs.konghq.com/hub/kong-inc/rate-limiting/",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "github",
      systemName: "GitHub",
      howUsed:
        "GitHub API limits authenticated requests to 5,000/hour and unauthenticated to 60/hour",
      source: "https://docs.github.com/en/rest/rate-limit",
    },
    {
      systemId: "stripe",
      systemName: "Stripe",
      howUsed:
        "Stripe API uses rate limiting to protect against abuse, with limits varying by endpoint",
      source: "https://stripe.com/docs/rate-limits",
    },
    {
      systemId: "twitter",
      systemName: "Twitter/X",
      howUsed:
        "Twitter API enforces per-endpoint rate limits with 15-minute windows",
    },
  ],

  philosophy: {
    coreProblem:
      "Without limits, a system can be overwhelmed by excessive requests, whether malicious or accidental",
    designPrinciple:
      "Protect shared resources by limiting how much any single client can consume",
    historicalContext:
      "Rate limiting became essential with public APIs, where abuse and bots can easily overwhelm services",
    alternativesRejected: [
      "No limits - vulnerable to abuse and overload",
      "Hard blocking - too aggressive, punishes legitimate spikes",
      "Queue everything - unbounded queues lead to memory exhaustion",
    ],
    mentalModel:
      "Like a water faucet with a flow restrictor: no matter how hard you turn the handle, only so much water can flow per second",
  },

  visualization: {
    staticDiagram: `flowchart LR
    subgraph Requests
        R1[100 req/s]
        R2[50 req/s]
        R3[200 req/s]
    end
    L[Rate Limiter<br/>100 req/s max]
    subgraph Output
        O1[100 req/s ✓]
        O2[50 req/s ✓]
        O3[100 req/s ✓<br/>100 rejected]
    end
    R1 --> L --> O1
    R2 --> L --> O2
    R3 --> L --> O3`,
    realWorldAnalogy:
      "Rate limiting is like a nightclub with a capacity limit. Even if 500 people want to enter, only 200 can be inside at once. New arrivals must wait for others to leave.",
    useCases: [
      {
        domain: "APIs",
        scenario:
          "A developer accidentally deploys code that polls an API in a tight loop. Rate limiting caps them at 100 requests/minute, protecting the service.",
        patternRole: "Prevents accidental or malicious overload",
        companies: ["GitHub", "Stripe", "Twilio"],
      },
      {
        domain: "E-commerce",
        scenario:
          "During a flash sale, bots attempt to buy all inventory. Rate limiting per IP ensures human customers get a fair chance.",
        patternRole: "Enables fair access during high-demand events",
        companies: ["Nike", "Ticketmaster"],
      },
    ],
  },

  tags: ["performance", "reliability", "api", "throttling", "protection"],
  difficulty: "intermediate",
};
