import type { Pattern } from "../schema";

export const fallback: Pattern = {
  id: "fallback",
  slug: "fallback",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🎯 Recovery Strategies → 🔄 Fallback",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Recovery Strategies",
    level: 4,
  },

  concept: {
    name: "Fallback",
    emoji: "🔄",
    tagline: "Graceful degradation through alternative responses",
    definition:
      "The Fallback pattern provides alternative responses or degraded functionality when primary operations fail, enabling graceful degradation rather than complete system failure. When a service call fails—whether due to timeouts, errors, or circuit breaker activation—the fallback mechanism substitutes a predetermined alternative: cached data, default values, simplified responses, or redirect to secondary services. This pattern operates at multiple levels: individual method calls return fallback values, failed microservice requests route to backup instances, and entire system tiers degrade to read-only mode when databases become unavailable. Fallbacks are typically combined with circuit breakers and retries—after exhausting retry attempts and tripping the circuit, the fallback executes as the final recovery step. Common fallback strategies include: returning cached responses (stale data better than no data), providing static defaults (empty lists, placeholder messages), using simplified algorithms (approximate results instead of exact computations), serving degraded UI (hide personalization, show basic content), and queueing requests for later processing (eventual consistency). The key insight is that many system features are not strictly required for core functionality—recommendations can fail without breaking checkout, personalization can degrade to generic content, and real-time analytics can fall back to batch processing. This pattern enables systems to maintain availability and user experience even during partial failures.",
    problemSolved:
      "Without fallback mechanisms, any service failure cascades into user-visible errors, causing complete feature unavailability. When a recommendation engine crashes, the entire product page fails to render. When analytics are down, dashboards show empty screens. When personalization fails, users see broken layouts. Fallback patterns prevent this all-or-nothing behavior by providing context-aware alternatives. The problem is particularly acute in microservices architectures where applications depend on dozens of services—Netflix calls 50+ services to render a video page; if every failure broke the page, availability would collapse. Fallback enables Netflix to show a page with generic recommendations (from cache) when the personalization service fails, maintaining core functionality while degrading non-critical features. Similarly, e-commerce sites can complete checkout even when inventory checks timeout by optimistically accepting orders and reconciling stock later. Fallbacks also address the cascade failure problem: when Service A depends on Service B, B's failure should not propagate to A's callers. By returning fallback responses, Service A isolates the failure and prevents system-wide outages. Additionally, fallbacks improve resilience during deployments, infrastructure failures, and traffic spikes—when new service versions have bugs, old cached responses provide continuity; when databases overload, applications serve stale data rather than error pages.",
    tradeoffs: {
      pros: [
        "Maintains partial functionality during failures instead of complete outage",
        "Improves user experience by serving degraded content over error pages",
        "Prevents cascade failures from propagating through dependent services",
        "Enables graceful degradation of non-critical features (recommendations, personalization)",
        "Reduces error rates and maintains availability during infrastructure issues",
        "Provides time for underlying failures to resolve while serving cached data",
      ],
      cons: [
        "Stale or inaccurate fallback data can mislead users or cause business issues",
        "Adds complexity in determining appropriate fallback strategies per endpoint",
        "Can mask underlying problems if fallbacks trigger too frequently",
        "Requires careful design to avoid inconsistent state between primary and fallback responses",
        "Increases code complexity with dual code paths (success and fallback)",
        "Difficult to test all fallback scenarios comprehensively",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "retry",
      "timeout",
      "cache-aside",
      "graceful-degradation",
      "bulkhead",
      "health-check",
      "rate-limiting",
    ],
  },

  structure: {
    participants: [
      {
        name: "Primary Service",
        role: "Primary Operation Source",
        responsibilities: [
          "Execute primary business logic when healthy",
          "Return authoritative, real-time responses",
          "Signal failures via exceptions or error responses",
          "Provide metrics on failure rates and latency",
        ],
      },
      {
        name: "Fallback Handler",
        role: "Failure Recovery Coordinator",
        responsibilities: [
          "Detect primary operation failures (exceptions, timeouts, circuit open)",
          "Select appropriate fallback strategy based on context",
          "Execute fallback operation and return alternative response",
          "Log fallback activations for monitoring and alerting",
        ],
      },
      {
        name: "Fallback Data Source",
        role: "Alternative Response Provider",
        responsibilities: [
          "Provide cached responses from previous successful calls",
          "Return static default values or placeholder content",
          "Serve data from secondary services or backup databases",
          "Generate simplified or approximate results",
        ],
      },
      {
        name: "Client Application",
        role: "Service Consumer",
        responsibilities: [
          "Invoke primary service with fallback protection",
          "Accept fallback responses and render degraded UI if needed",
          "Handle both fresh and stale data appropriately",
          "Provide user feedback when operating in degraded mode",
        ],
      },
      {
        name: "Monitoring System",
        role: "Fallback Metrics Collector",
        responsibilities: [
          "Track fallback invocation rates and trends",
          "Alert when fallback usage exceeds thresholds",
          "Measure staleness of cached fallback data",
          "Correlate fallback events with primary service health",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant FallbackHandler as Fallback Handler
    participant Primary as Primary Service
    participant Cache as Cache
    participant Backup as Backup Service

    Note over Client,Backup: Normal Operation - Primary Success
    Client->>FallbackHandler: Request product recommendations
    FallbackHandler->>Primary: Get recommendations(userId)
    Primary-->>FallbackHandler: Success: [product1, product2, product3]
    FallbackHandler->>Cache: Store response (TTL: 10min)
    FallbackHandler-->>Client: Return fresh recommendations

    Note over Client,Backup: Failure Scenario - Primary Timeout
    Client->>FallbackHandler: Request product recommendations
    FallbackHandler->>Primary: Get recommendations(userId)
    Primary--xFallbackHandler: Timeout (5s)
    FallbackHandler->>Cache: Check for cached response
    Cache-->>FallbackHandler: Return cached recommendations (5 min old)
    FallbackHandler-->>Client: Return stale recommendations
    Note over Client: User sees slightly outdated but functional recommendations

    Note over Client,Backup: Primary Down - Circuit Open
    Client->>FallbackHandler: Request product recommendations
    FallbackHandler->>FallbackHandler: Circuit Breaker OPEN
    Note over FallbackHandler: Skip primary call
    FallbackHandler->>Cache: Check for cached response
    Cache--xFallbackHandler: Cache miss (expired)
    FallbackHandler->>Backup: Get generic popular items
    Backup-->>FallbackHandler: [bestseller1, bestseller2]
    FallbackHandler-->>Client: Return generic recommendations
    Note over Client: User sees popular items instead of personalized`,
    flow: [
      {
        step: 1,
        actor: "Client Application",
        action: "Invoke Protected Operation",
        description:
          "Client calls service method wrapped with fallback protection",
      },
      {
        step: 2,
        actor: "Fallback Handler",
        action: "Attempt Primary Operation",
        description:
          "Execute primary service call with timeout and error handling",
      },
      {
        step: 3,
        actor: "Primary Service",
        action: "Process Request",
        description:
          "Primary service attempts to fulfill request with real-time data",
      },
      {
        step: 4,
        actor: "Primary Service",
        action: "Return Result or Fail",
        description:
          "Primary either returns successful response or signals failure (exception, timeout, HTTP 5xx)",
      },
      {
        step: 5,
        actor: "Fallback Handler",
        action: "Detect Failure",
        description:
          "Handler catches exception, timeout, or circuit breaker open state",
      },
      {
        step: 6,
        actor: "Fallback Handler",
        action: "Select Fallback Strategy",
        description:
          "Determine appropriate fallback: cached data, default value, backup service, or degraded response",
      },
      {
        step: 7,
        actor: "Fallback Data Source",
        action: "Provide Alternative",
        description:
          "Return cached response, static default, or data from backup source",
      },
      {
        step: 8,
        actor: "Fallback Handler",
        action: "Return Fallback Response",
        description:
          "Deliver alternative response to client with metadata indicating degraded mode",
      },
      {
        step: 9,
        actor: "Monitoring System",
        action: "Record Fallback Event",
        description:
          "Log fallback activation, increment metrics, trigger alerts if threshold exceeded",
      },
      {
        step: 10,
        actor: "Client Application",
        action: "Render Degraded UI",
        description:
          "Display fallback content to user, optionally showing degraded mode indicator",
      },
    ],
    invariants: [
      "Fallback response must be type-compatible with primary response",
      "Fallback must not propagate primary service failures to client",
      "Fallback data staleness must be tracked and limited",
      "Fallback invocations must be logged for monitoring",
      "Primary operation must be attempted before fallback (unless circuit open)",
      "Fallback strategies must not introduce new failure modes",
    ],
  },

  codeExamples: [
    {
      id: "fallback-typescript-comprehensive",
      language: "typescript",
      title: "Production TypeScript Fallback with Circuit Breaker",
      description:
        "Comprehensive fallback implementation with circuit breaker integration, cache fallback, and monitoring",
      code: `import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import CircuitBreaker from 'opossum';

// ============================================================
// Types and Configuration
// ============================================================

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface RecommendationResponse {
  recommendations: Product[];
  source: 'primary' | 'cache' | 'default' | 'backup';
  timestamp: string;
  degraded: boolean;
}

// ============================================================
// Cache Configuration for Fallback Data
// ============================================================
// ACTION: Initialize cache for storing successful responses
// REASON: Cache enables fallback to recent data when primary fails
//         Stale data better than no data for non-critical features
// TTL: 10 minutes - balance between freshness and availability
// ============================================================
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Performance optimization - don't clone objects
});

// ============================================================
// Primary Service: Product Recommendations API
// ============================================================
// ACTION: Define primary service that may fail
// REASON: Real-world services fail due to timeouts, errors, overload
//         This is the "happy path" that we want to protect with fallbacks
// ============================================================
class RecommendationService {
  private baseURL = process.env.RECOMMENDATION_API_URL || 'http://api.example.com';

  // ACTION: Fetch personalized recommendations from primary service
  // REASON: Primary service provides real-time, personalized results
  //         This is the authoritative source of truth when healthy
  async getRecommendations(userId: string): Promise<Product[]> {
    try {
      const response = await axios.get<{ data: Product[] }>(
        \`\${this.baseURL}/recommendations/\${userId}\`,
        {
          timeout: 5000, // 5 second timeout
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error) {
      // ACTION: Transform axios errors into domain errors
      // REASON: Provide clear error context for fallback handler
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error(\`Recommendation service timeout: \${userId}\`);
        }
        if (axiosError.response?.status >= 500) {
          throw new Error(\`Recommendation service error: \${axiosError.response.status}\`);
        }
      }
      throw error;
    }
  }
}

// ============================================================
// Fallback Data Sources
// ============================================================

// ACTION: Define static fallback data for worst-case scenarios
// REASON: When cache AND backup fail, return safe defaults
//         Prevents complete feature failure
// CONTEXT: E-commerce sites show "popular items" when personalization fails
//          Better to show generic products than empty page
const DEFAULT_RECOMMENDATIONS: Product[] = [
  {
    id: 'default-1',
    name: 'Bestseller Product',
    price: 29.99,
    image: '/images/bestseller.jpg',
  },
  {
    id: 'default-2',
    name: 'Popular Choice',
    price: 39.99,
    image: '/images/popular.jpg',
  },
];

// ACTION: Implement backup service for secondary fallback
// REASON: When primary fails, try backup before falling back to cache/defaults
//         Backup provides recent (if not real-time) data
class BackupRecommendationService {
  async getPopularItems(limit: number = 5): Promise<Product[]> {
    try {
      // ACTION: Query backup database or service for popular items
      // REASON: Popular items change slowly, safe to cache for hours
      //         Provides better UX than static defaults
      const response = await axios.get<{ data: Product[] }>(
        \`\${process.env.BACKUP_API_URL}/popular\`,
        {
          params: { limit },
          timeout: 2000, // Faster timeout for backup
        }
      );

      return response.data.data;
    } catch (error) {
      // ACTION: Backup service failure returns empty array
      // REASON: Signals to fallback handler to try next strategy
      console.error('Backup service failed:', error);
      return [];
    }
  }
}

// ============================================================
// Fallback Handler with Circuit Breaker Integration
// ============================================================
// ACTION: Implement comprehensive fallback with multiple strategies
// REASON: Layered fallbacks provide resilience at different failure levels
//         Circuit breaker prevents overwhelming failed primary service
// ============================================================
class RecommendationFallbackHandler {
  private primaryService = new RecommendationService();
  private backupService = new BackupRecommendationService();
  private circuitBreaker: CircuitBreaker;

  constructor() {
    // ACTION: Configure circuit breaker for primary service
    // REASON: Circuit breaker prevents retry storms during sustained failures
    //         After threshold failures, skip primary and go straight to fallback
    // CONFIGURATION:
    //   - timeout: 5000ms (matches service timeout)
    //   - errorThresholdPercentage: 50 (open after 50% errors)
    //   - resetTimeout: 30000ms (try primary again after 30s)
    this.circuitBreaker = new CircuitBreaker(
      async (userId: string) => this.primaryService.getRecommendations(userId),
      {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        name: 'recommendations-circuit',
        // ACTION: Enable fallback on circuit open
        // REASON: When circuit opens, immediately use fallback without attempting primary
        fallback: async (userId: string) => this.executeFallback(userId),
      }
    );

    // ACTION: Monitor circuit breaker events
    // REASON: Visibility into when circuit trips helps ops team respond
    this.circuitBreaker.on('open', () => {
      console.warn('Recommendations circuit breaker OPEN - using fallbacks');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.info('Recommendations circuit breaker HALF-OPEN - testing recovery');
    });

    this.circuitBreaker.on('close', () => {
      console.info('Recommendations circuit breaker CLOSED - primary service healthy');
    });
  }

  // ============================================================
  // Primary Method: Get Recommendations with Fallback Protection
  // ============================================================
  // ACTION: Main entry point with circuit breaker protection
  // REASON: Circuit breaker handles primary call, fallback, and failure tracking
  async getRecommendations(userId: string): Promise<RecommendationResponse> {
    const cacheKey = \`recommendations:\${userId}\`;

    try {
      // ACTION: Attempt primary service call via circuit breaker
      // REASON: Circuit breaker manages retries, timeouts, and fallback triggers
      //         If circuit open, fallback executes immediately
      const recommendations = await this.circuitBreaker.fire(userId);

      // ACTION: Cache successful response for future fallback
      // REASON: Recent successful response is best fallback data
      //         Cache updates continuously during healthy operation
      cache.set(cacheKey, {
        data: recommendations,
        timestamp: new Date().toISOString(),
      });

      return {
        recommendations,
        source: 'primary',
        timestamp: new Date().toISOString(),
        degraded: false,
      };
    } catch (error) {
      // ACTION: Primary failed - execute fallback strategies
      // REASON: Circuit breaker fallback delegates to layered fallback logic
      console.error(\`Primary recommendations failed for user \${userId}:\`, error);

      return this.executeFallback(userId);
    }
  }

  // ============================================================
  // Fallback Strategy Execution
  // ============================================================
  // ACTION: Execute layered fallback strategies in priority order
  // REASON: Try best available alternative before degrading to defaults
  // STRATEGY PRIORITY:
  //   1. Cached data (recent personalized recommendations)
  //   2. Backup service (popular items)
  //   3. Static defaults (generic products)
  // ============================================================
  private async executeFallback(userId: string): Promise<RecommendationResponse> {
    const cacheKey = \`recommendations:\${userId}\`;

    // ============================================================
    // Fallback Strategy 1: Return Cached Recommendations
    // ============================================================
    // ACTION: Check cache for recent successful response
    // REASON: Cached data is personalized (better UX than generic)
    //         Stale personalized > fresh generic for recommendations
    // ACCEPTABLE STALENESS: Up to 10 minutes for recommendations
    const cached = cache.get<{ data: Product[]; timestamp: string }>(cacheKey);
    if (cached && cached.data.length > 0) {
      console.info(\`Using cached recommendations for user \${userId} (age: \${this.getCacheAge(cached.timestamp)})\`);

      return {
        recommendations: cached.data,
        source: 'cache',
        timestamp: cached.timestamp,
        degraded: true, // Signal to client that data is stale
      };
    }

    // ============================================================
    // Fallback Strategy 2: Backup Service - Popular Items
    // ============================================================
    // ACTION: Fetch popular items from backup service
    // REASON: Popular items provide relevant (if not personalized) content
    //         Better than static defaults
    console.warn(\`Cache miss for user \${userId}, trying backup service\`);

    try {
      const popularItems = await this.backupService.getPopularItems(5);

      if (popularItems.length > 0) {
        console.info(\`Using backup popular items for user \${userId}\`);

        return {
          recommendations: popularItems,
          source: 'backup',
          timestamp: new Date().toISOString(),
          degraded: true,
        };
      }
    } catch (error) {
      console.error(\`Backup service failed for user \${userId}:\`, error);
    }

    // ============================================================
    // Fallback Strategy 3: Static Defaults
    // ============================================================
    // ACTION: Return static default recommendations
    // REASON: Last resort - ensure feature doesn't break completely
    //         Empty recommendations would show blank page
    // TRADEOFF: Generic products are suboptimal but better than error
    console.warn(\`All fallback strategies exhausted for user \${userId}, using defaults\`);

    return {
      recommendations: DEFAULT_RECOMMENDATIONS,
      source: 'default',
      timestamp: new Date().toISOString(),
      degraded: true,
    };
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private getCacheAge(timestamp: string): string {
    const age = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(age / 60000);
    return \`\${minutes} min\`;
  }

  // ACTION: Expose circuit breaker stats for monitoring
  // REASON: Ops team needs visibility into fallback frequency and health
  getCircuitBreakerStats() {
    return {
      state: this.circuitBreaker.opened ? 'OPEN' : this.circuitBreaker.halfOpen ? 'HALF-OPEN' : 'CLOSED',
      stats: this.circuitBreaker.stats,
    };
  }
}

// ============================================================
// Express API Integration
// ============================================================

import express, { Request, Response } from 'express';

const app = express();
const fallbackHandler = new RecommendationFallbackHandler();

// ACTION: Expose recommendations endpoint with fallback protection
// REASON: Client receives recommendations even when primary service fails
//         Degraded flag signals client to show "showing older recommendations" message
app.get('/api/recommendations/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await fallbackHandler.getRecommendations(userId);

    // ACTION: Return 200 even for degraded responses
    // REASON: Fallback is successful operation, not an error
    //         Client uses 'degraded' flag to adjust UI
    res.status(200).json(result);

    // Optional: Add custom header for degraded responses
    if (result.degraded) {
      res.setHeader('X-Degraded-Response', 'true');
      res.setHeader('X-Response-Source', result.source);
    }
  } catch (error) {
    // ACTION: Return 500 only if all fallback strategies fail
    // REASON: Complete fallback failure is genuine error
    console.error('All fallback strategies failed:', error);
    res.status(500).json({
      error: 'Recommendations temporarily unavailable',
      message: 'Please try again later',
    });
  }
});

// ACTION: Health endpoint exposing circuit breaker state
// REASON: Load balancer and monitoring can check fallback health
app.get('/health/recommendations', (req: Request, res: Response) => {
  const stats = fallbackHandler.getCircuitBreakerStats();

  // ACTION: Return 200 if circuit closed, 503 if open
  // REASON: Circuit open means primary service down (degraded mode)
  //         503 signals to load balancer to route traffic elsewhere
  const statusCode = stats.state === 'CLOSED' ? 200 : 503;

  res.status(statusCode).json({
    service: 'recommendations',
    circuitBreakerState: stats.state,
    stats: stats.stats,
    timestamp: new Date().toISOString(),
  });
});

// ACTION: Metrics endpoint for observability
// REASON: Ops team monitors fallback usage trends
app.get('/metrics/recommendations', (req: Request, res: Response) => {
  const stats = fallbackHandler.getCircuitBreakerStats();

  res.json({
    circuitBreaker: stats,
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats(),
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Recommendations API with fallback running on port \${PORT}\`);
});

export { RecommendationFallbackHandler };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade fallback implementation with circuit breaker integration, layered fallback strategies (cache → backup → defaults), and comprehensive monitoring",
        prerequisites: [
          "Circuit breaker pattern",
          "Caching strategies",
          "Error handling",
          "Distributed systems concepts",
        ],
        systemPosition:
          "Service resilience layer protecting client applications from primary service failures in microservices architecture",
      },
      annotations: [
        {
          id: "fb-cache-fallback",
          lines: [143, 161],
          action:
            "Check cache for recent successful response as first fallback strategy",
          reason:
            "Cached data provides best fallback—personalized to user, recently fresh (stale by minutes not days). Stale personalized recommendations better UX than fresh generic products. Acceptable staleness for non-critical features like recommendations: 10 minutes. Critical features (pricing, inventory) require shorter TTLs or skip cache fallback.",
          contextLevel: "module",
          relatedConcepts: ["cache-aside", "stale-while-revalidate", "ttl"],
        },
        {
          id: "fb-backup-service",
          lines: [163, 185],
          action:
            "Fallback to backup service returning popular items when cache misses",
          reason:
            "Backup service provides second-tier fallback—data is relevant (if not personalized). Popular items appropriate for anonymous/new users anyway. Backup may be read-replica, different database, or simplified service with lower latency/higher availability than primary. Faster timeout (2s vs 5s) prevents backup from blocking fallback chain.",
          contextLevel: "system",
          relatedConcepts: [
            "backup-services",
            "read-replicas",
            "graceful-degradation",
          ],
        },
        {
          id: "fb-static-defaults",
          lines: [187, 200],
          action:
            "Return static default values as last-resort fallback when all strategies fail",
          reason:
            "Static defaults prevent complete feature failure. Empty recommendations would render blank page—bad UX. Generic products at least keep page functional. Tradeoff: suboptimal content vs broken page. Use sparingly—if defaults trigger frequently, indicates systemic issues requiring investigation.",
          contextLevel: "module",
          relatedConcepts: ["default-values", "safe-defaults"],
        },
        {
          id: "fb-circuit-breaker",
          lines: [84, 105],
          action:
            "Integrate circuit breaker to skip primary service when open, immediately using fallback",
          reason:
            "Circuit breaker prevents retry storms during sustained failures. After 50% error rate, circuit opens—stops calling failing primary service, gives it time to recover. During open state, immediately execute fallback without attempting primary. Reduces latency (no timeout wait) and load on struggling service. Automatic recovery via half-open state after 30s.",
          contextLevel: "system",
          relatedConcepts: ["circuit-breaker", "retry-budget", "fail-fast"],
        },
        {
          id: "fb-success-caching",
          lines: [127, 133],
          action:
            "Cache every successful primary response to keep fallback data fresh",
          reason:
            "Continuous cache updates during healthy operation ensure fallback data is recent. When primary fails, cache contains response from minutes ago (not hours/days). Cache-on-success pattern better than cache-on-failure—ensures cache contains only valid data. TTL of 10 minutes balances freshness (recent enough for good UX) vs hit rate (long enough to survive short outages).",
          contextLevel: "module",
          relatedConcepts: ["cache-aside", "write-through", "cache-warming"],
        },
        {
          id: "fb-degraded-signal",
          lines: [144, 161],
          action:
            "Return degraded flag and response source in fallback responses",
          reason:
            "Clients need to know when receiving fallback data to adjust UI. Show 'Showing older recommendations' message when source=cache. Hide personalization features when source=default. Transparency improves user trust—better to show 'generic products due to service issues' than pretend they're personalized. Degraded flag also enables client-side retry logic.",
          contextLevel: "module",
          relatedConcepts: ["api-contracts", "transparency", "user-feedback"],
        },
        {
          id: "fb-monitoring",
          lines: [107, 115],
          action:
            "Emit circuit breaker events for monitoring fallback frequency and patterns",
          reason:
            "Fallback activations are leading indicators of service health issues. High fallback rate (>10% of requests) indicates primary service degradation—requires investigation. Circuit opening is critical alert—primary service down. Metrics enable proactive response before users notice failures. Correlate fallback spikes with deployments, traffic patterns, infrastructure changes.",
          contextLevel: "system",
          relatedConcepts: [
            "observability",
            "proactive-monitoring",
            "alerting",
          ],
        },
        {
          id: "fb-http-status",
          lines: [225, 237],
          action:
            "Return HTTP 200 for successful fallback, 503 only if all strategies fail",
          reason:
            "Fallback is successful operation from client perspective—user gets content, page renders. HTTP 500/503 should indicate complete failure (all fallbacks exhausted). Degraded responses use custom headers (X-Degraded-Response) for machine-readable degradation signal. This prevents load balancers from removing healthy instances serving fallback content.",
          contextLevel: "module",
          relatedConcepts: [
            "http-status-codes",
            "semantic-http",
            "load-balancing",
          ],
        },
      ],
      highlights: [
        {
          lines: [84, 115],
          label: "Circuit breaker integration with fallback",
          sbvpDomain: "structure",
        },
        {
          lines: [143, 200],
          label: "Layered fallback strategies (cache → backup → defaults)",
          sbvpDomain: "behavior",
        },
        {
          lines: [225, 251],
          label: "API integration with degraded response handling",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservices API gateways wrapping downstream services",
      "Frontend backends serving UI data with fallback to cached content",
      "Recommendation engines falling back to popular items",
      "Personalization services degrading to anonymous experience",
      "Real-time analytics falling back to batch-processed data",
      "Payment gateways retrying with backup processors",
      "Search services falling back to cached results or simplified algorithms",
    ],
    interactsWith: [
      "circuit-breaker",
      "retry",
      "timeout",
      "cache-aside",
      "load-balancing",
      "health-check",
      "monitoring",
      "alerting",
    ],
    architecturalBoundaries: [
      "Between service layer and client applications",
      "Between primary and backup services",
      "Between real-time and cached data sources",
      "Between personalized and generic content delivery",
    ],
  },
};
