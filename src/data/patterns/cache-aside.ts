import type { Pattern } from "../schema";

export const cacheAside: Pattern = {
  id: "cache-aside",
  slug: "cache-aside",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Cache-Aside",
    emoji: "📦",
    tagline: "Load on demand, cache for speed",
    definition:
      "A caching pattern where the application is responsible for reading from and writing to the cache. Data is loaded into the cache on demand: if not found in cache, load from the data store, then populate the cache.",
    problemSolved:
      "Repeatedly fetching the same data from a slow data store wastes resources and increases latency. Cache-Aside stores frequently accessed data in fast memory for quick retrieval.",
    tradeoffs: {
      pros: [
        "Reduces load on the primary data store",
        "Dramatically improves read latency for cached data",
        "Application controls caching logic precisely",
        "Cache failures do not prevent data access",
      ],
      cons: [
        "Data can become stale (cache invalidation is hard)",
        "First request always hits the database (cold cache)",
        "Adds complexity to application code",
        "Requires careful TTL tuning",
      ],
    },
    relatedPatterns: [
      "write-through",
      "write-behind",
      "read-through",
      "refresh-ahead",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Cache Controller",
        responsibilities: [
          "Check cache before querying data store",
          "Populate cache after data store fetch",
          "Invalidate cache when data changes",
        ],
      },
      {
        name: "Cache",
        role: "Fast Storage",
        responsibilities: [
          "Store key-value pairs in memory",
          "Provide fast O(1) lookups",
          "Expire entries based on TTL",
        ],
      },
      {
        name: "Data Store",
        role: "Source of Truth",
        responsibilities: [
          "Persist all data durably",
          "Handle writes and complex queries",
          "Serve cache misses",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Cache as Cache
    participant DB as Database

    App->>Cache: GET key
    alt Cache Hit
        Cache-->>App: Return data
    else Cache Miss
        Cache-->>App: null
        App->>DB: Query data
        DB-->>App: Return data
        App->>Cache: SET key = data
    end`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Check Cache",
        description: "Look up the requested data in the cache by key",
      },
      {
        step: 2,
        actor: "Cache",
        action: "Return or Miss",
        description: "Return cached data if exists, otherwise indicate miss",
      },
      {
        step: 3,
        actor: "Application",
        action: "Query Database",
        description: "On cache miss, fetch data from the primary data store",
      },
      {
        step: 4,
        actor: "Application",
        action: "Populate Cache",
        description: "Store the fetched data in cache with appropriate TTL",
      },
      {
        step: 5,
        actor: "Application",
        action: "Return Data",
        description: "Return data to the caller (from cache or database)",
      },
    ],
    invariants: [
      "Cache miss must always fall back to data store",
      "Cache should never be the only copy of data",
      "Write operations should invalidate or update cache",
      "TTL should be set to balance freshness and performance",
    ],
  },

  codeExamples: [
    {
      id: "cache-aside-typescript",
      language: "typescript",
      title: "Cache-Aside with Generic Repository",
      description:
        "A generic cache-aside implementation that wraps any data fetcher",
      code: `interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class CacheAsideRepository<T> {
  constructor(
    private cache: Cache<T>,
    private dataStore: {
      fetch: (id: string) => Promise<T>;
      save: (id: string, data: T) => Promise<void>;
    },
    private ttlSeconds: number = 300
  ) {}

  async get(id: string): Promise<T> {
    // Step 1: Check cache first
    const cached = await this.cache.get(id);
    if (cached !== null) {
      return cached;
    }

    // Step 2: Cache miss - fetch from data store
    const data = await this.dataStore.fetch(id);

    // Step 3: Populate cache for next time
    await this.cache.set(id, data, this.ttlSeconds);

    return data;
  }

  async save(id: string, data: T): Promise<void> {
    // Write to data store first (source of truth)
    await this.dataStore.save(id, data);

    // Invalidate cache to ensure consistency
    await this.cache.delete(id);
  }
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "A repository class implementing cache-aside for any entity type",
        prerequisites: [
          "TypeScript generics",
          "Async/await",
          "Repository pattern",
        ],
        systemPosition: "Data access layer between service logic and database",
      },
      annotations: [
        {
          id: "cache-check",
          lines: [17, 21],
          action: "Check cache before hitting the database",
          reason:
            "Cache hits are orders of magnitude faster than database queries—always try cache first",
          contextLevel: "local",
        },
        {
          id: "cache-miss",
          lines: [23, 24],
          action: "Fetch from data store on cache miss",
          reason:
            "The database is the source of truth; cache is just an optimization layer",
          contextLevel: "local",
        },
        {
          id: "cache-populate",
          lines: [26, 27],
          action: "Store fetched data in cache with TTL",
          reason:
            "Subsequent requests for this data will hit the cache instead of the database",
          contextLevel: "local",
          relatedConcepts: ["ttl", "cache-warming"],
        },
        {
          id: "write-invalidate",
          lines: [35, 36],
          action: "Delete from cache after writing to database",
          reason:
            "Invalidation ensures the next read fetches fresh data; prevents serving stale data",
          contextLevel: "module",
          relatedConcepts: ["cache-invalidation", "consistency"],
        },
      ],
      highlights: [
        {
          lines: [17, 27],
          label: "Read path: check cache, fallback to DB, populate cache",
          sbvpDomain: "behavior",
        },
        {
          lines: [31, 36],
          label: "Write path: update DB, invalidate cache",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Service Layer",
      "Data Access Layer",
      "API Handlers",
      "Read Replicas",
    ],
    interactsWith: [
      "write-through",
      "circuit-breaker",
      "rate-limiting",
      "database-connection-pool",
    ],
    architecturalBoundaries: [
      "Between application and database",
      "Between services and external APIs",
      "At API gateway for response caching",
    ],
  },

  implementations: [
    {
      id: "redis",
      name: "Redis",
      type: "service",
      languages: ["any"],
      description:
        "In-memory data store commonly used as cache with TTL support",
      links: {
        docs: "https://redis.io/docs/",
        github: "https://github.com/redis/redis",
      },
    },
    {
      id: "memcached",
      name: "Memcached",
      type: "service",
      languages: ["any"],
      description: "High-performance distributed memory caching system",
      links: {
        docs: "https://memcached.org/",
        github: "https://github.com/memcached/memcached",
      },
    },
    {
      id: "node-cache",
      name: "node-cache",
      type: "library",
      languages: ["javascript", "typescript"],
      description: "Simple in-process caching module for Node.js",
      links: {
        npm: "https://www.npmjs.com/package/node-cache",
        github: "https://github.com/node-cache/node-cache",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "facebook",
      systemName: "Facebook",
      howUsed:
        "Memcached sits in front of MySQL for user profile data, timeline, and social graph queries",
      source:
        "https://engineering.fb.com/2013/06/25/core-data/scaling-memcache-at-facebook/",
    },
    {
      systemId: "twitter",
      systemName: "Twitter",
      howUsed:
        "Redis caches timeline data and user sessions to handle millions of requests per second",
    },
  ],

  philosophy: {
    coreProblem:
      "Databases are slow and expensive to scale; memory is fast but limited and volatile",
    designPrinciple:
      "Keep hot data in fast storage while using durable storage as the source of truth",
    historicalContext:
      "Caching became essential as web applications scaled beyond what single databases could handle in the 2000s",
    alternativesRejected: [
      "No caching - databases become bottleneck",
      "Write-through only - complex for read-heavy workloads",
      "Cache as source of truth - data loss on cache failure",
    ],
    mentalModel:
      "Like keeping frequently used tools on your workbench instead of walking to the toolshed every time. The toolshed (database) has everything, but the workbench (cache) has what you need right now.",
  },

  visualization: {
    staticDiagram: `flowchart LR
    A[Request] --> B{In Cache?}
    B -->|Yes| C[Return Cached]
    B -->|No| D[Query DB]
    D --> E[Store in Cache]
    E --> F[Return Data]`,
    realWorldAnalogy:
      "Cache-Aside is like keeping a copy of your favorite recipes on the kitchen counter. When you want to cook, you check the counter first. If the recipe is not there, you go get it from the cookbook shelf, then leave a copy on the counter for next time.",
    useCases: [
      {
        domain: "Social Media",
        scenario:
          "User profile data is requested millions of times per day. Cache-Aside stores profiles in Redis, reducing database load by 99%.",
        patternRole:
          "Enables sub-millisecond response times for profile lookups",
        companies: ["Facebook", "Twitter", "Instagram"],
      },
      {
        domain: "E-commerce",
        scenario:
          "Product catalog pages are viewed far more often than updated. Cache-Aside serves product details from memory, hitting the database only for cache misses.",
        patternRole:
          "Handles traffic spikes during sales without database overload",
        companies: ["Amazon", "eBay", "Shopify"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "read-optimization",
    "scalability",
    "latency",
  ],
  difficulty: "beginner",
};
