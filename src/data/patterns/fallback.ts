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
          "Enterprise-grade fallback implementation orchestrating circuit breaker, cache-aside, backup services, and static defaults to provide graceful degradation across multiple failure scenarios",
        prerequisites: [
          "Circuit breaker pattern",
          "Cache-aside pattern",
          "Error handling and classification",
          "Distributed systems resilience",
          "Graceful degradation principles",
        ],
        systemPosition:
          "Service resilience and orchestration layer positioned between client applications and external dependencies, coordinating fallback strategies to maintain availability during primary service failures",
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
          lines: [12, 17],
          label:
            "RecommendationResponse type with source tracking and degradation flag",
          sbvpDomain: "structure",
        },
        {
          lines: [84, 95],
          label:
            "Circuit breaker configuration with fallback function integration",
          sbvpDomain: "structure",
        },
        {
          lines: [127, 133],
          label:
            "Primary service call with success caching for future fallback",
          sbvpDomain: "behavior",
        },
        {
          lines: [143, 161],
          label:
            "Fallback Strategy 1: Return cached recommendations when available",
          sbvpDomain: "behavior",
        },
        {
          lines: [163, 185],
          label: "Fallback Strategy 2: Query backup service for popular items",
          sbvpDomain: "behavior",
        },
        {
          lines: [187, 200],
          label: "Fallback Strategy 3: Return static defaults as last resort",
          sbvpDomain: "behavior",
        },
        {
          lines: [74, 87],
          label:
            "Static default recommendations preventing complete feature failure",
          sbvpDomain: "philosophy",
        },
        {
          lines: [225, 243],
          label:
            "Express API endpoint with fallback protection and degraded response handling",
          sbvpDomain: "structure",
        },
        {
          lines: [143, 200],
          label:
            "Graceful degradation philosophy: provide partial functionality over complete failure",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Fallback patterns are typically implemented at the service resilience layer, positioned between client applications and external dependencies. In microservices architectures, fallbacks wrap remote service calls (HTTP clients, gRPC stubs, message queue publishers) to provide alternative responses when dependencies fail. API gateways like Netflix Zuul and Kong implement fallback at the edge, returning cached responses or static content when backend services timeout. Spring Cloud Netflix's Hystrix pioneered this placement by wrapping every @HystrixCommand method with fallback logic, allowing developers to specify fallback methods (fallbackMethod = 'getCachedRecommendations') that execute when primary methods throw exceptions or exceed timeouts. Modern frameworks like Resilience4j, Polly (.NET), and failsafe-go follow similar patterns: decorators or middleware that intercept failures and delegate to fallback functions. The placement is critical—fallbacks must execute AFTER retries and circuit breakers have exhausted their strategies. Typical call flow: Client → Timeout → Retry (3 attempts) → Circuit Breaker (fail fast if open) → Fallback (cached/default/backup). Fallbacks are also placed at the data layer: when primary databases fail, applications fall back to read replicas; when Redis caches miss, applications fall back to database queries; when real-time analytics fail, dashboards fall back to batch-processed data from overnight jobs. Frontend applications implement fallback at the UI component level—if user profile service fails, show generic avatar and 'Guest' name instead of breaking the page. The architectural sweet spot is placing fallbacks close to failure points but with access to alternative data sources (caches, backups, static content).",

      "In content delivery and recommendation systems, fallback patterns sit at the content selection layer between personalization engines and content rendering. Netflix's homepage rendering implements multi-tier fallbacks: when the primary recommendation engine (machine learning model with <200ms SLA) times out, fall back to cached recommendations from the last successful call (up to 5 minutes old); if cache misses, fall back to popular titles for the user's demographic (genre, region, language); if that fails, fall back to globally popular titles (trending content). This placement enables Netflix to maintain a functional homepage even when recommendation infrastructure is degraded. E-commerce product pages use similar patterns: Amazon's 'Customers who bought this also bought' section falls back through multiple tiers: real-time collaborative filtering → cached recommendations → category bestsellers → generic popular products. The fallback placement is in the recommendation service's API gateway, which orchestrates these tiers and adds metadata to responses (source: 'primary'|'cache'|'popular'|'default', staleness: '5min') enabling clients to adjust UI accordingly. Spotify's Discover Weekly falls back to user's saved songs shuffled when personalization fails. The pattern extends to search: when Elasticsearch clusters are overloaded, search services fall back to cached popular queries, simplified search algorithms (exact match only, no ranking), or even a 'try again later' message with recently viewed items. The placement at the content selection boundary allows graceful degradation without breaking user experience—stale personalization is better than blank pages.",

      "Payment processing and financial transaction systems implement fallback at the payment gateway layer, between checkout flows and payment processors. Stripe's payment processing uses fallback chains: primary processor (Visa network) → backup processor (alternative Visa gateway) → delayed processing (queue transaction for retry) → manual intervention queue. The fallback placement is in Stripe's payment orchestration layer, which maintains connections to multiple processors and routes transactions based on success rates and latency. When the primary processor experiences downtime (rare but catastrophic for merchants), the fallback layer automatically retries with backup processors within milliseconds, maintaining checkout success rates above 99.5%. PayPal implements geographic fallbacks: if the US data center payment processor fails, route transactions to EU processors, accepting higher latency (200ms vs 50ms) to maintain availability. The architectural boundary is critical—fallbacks must execute BEFORE transaction state is committed to prevent duplicate charges. Typical flow: Validate payment → Attempt primary processor (5s timeout) → On failure, fallback to backup processor (3s timeout) → On failure, queue for delayed retry → Update order status to 'payment pending' → Notify customer. This placement prevents the catastrophic scenario where customers see payment errors despite successful charges. Cryptocurrency exchanges use fallback patterns for price oracles: primary price feed (real-time market data) → backup exchanges → time-weighted average of recent trades → last known price with staleness warning. The fallback layer sits between trading algorithms and market data feeds, ensuring trading decisions use best available data even during feed disruptions.",

      "Monitoring and observability systems place fallback patterns at the metrics aggregation layer, between data collection agents and visualization dashboards. Datadog and New Relic implement fallback when real-time metric streams fail: fall back to 1-minute aggregated data (instead of 10-second granularity), fall back to sampled data (1% of traces instead of 100%), or fall back to log-derived metrics when agents are unreachable. Prometheus implements fallback at the query layer: when federation endpoints timeout, fall back to local data; when queries exceed resource limits, fall back to downsampled data or pre-aggregated recording rules. This placement ensures observability remains available during the very incidents it's needed to debug—monitoring infrastructure degrading doesn't mean losing all visibility. Grafana dashboards use fallback for panel rendering: when primary data source (Prometheus) fails, fall back to secondary data source (CloudWatch), fall back to cached panel results (last 5 minutes), or show 'data unavailable' placeholder instead of breaking the entire dashboard. The architectural placement is at the query proxy layer, which maintains connections to multiple data sources and executes fallback logic transparently. During incident response, having degraded monitoring (1-minute metrics) is far superior to no monitoring, enabling teams to maintain situational awareness while restoring full observability. Log aggregation systems like Splunk implement fallback when ingestion pipelines overload: fall back to sampling (ingest 10% of logs), fall back to dropping low-priority logs (debug/trace), fall back to queueing with backpressure signals to log producers.",

      "Database access layers and ORMs implement fallback at the connection pool and query execution layer. When primary database connections fail, applications fall back through multiple strategies: retry with exponential backoff → fall back to read replica (stale by <1s due to replication lag) → fall back to cached query results → return degraded response with 'data temporarily unavailable' message. Hibernate and Entity Framework place fallbacks at the transaction boundary: when optimistic locking conflicts occur (StaleObjectStateException), fall back to pessimistic locking; when transactions timeout, fall back to smaller batch sizes or read-only queries. PostgreSQL connection poolers like PgBouncer implement fallback at the routing layer: when primary database is unreachable, route read queries to replicas and queue write queries for later execution. MongoDB's driver implements automatic fallback: when primary replica set member is unavailable, fall back to secondary members (with eventual consistency tradeoffs), fall back to local cached documents (for read-heavy workloads), or reject writes gracefully instead of hanging indefinitely. The placement at the data access layer is critical because it enables application-level code to remain unaware of database failures—the DAL handles degradation transparently. NoSQL databases like Cassandra implement multi-datacenter fallback: when local datacenter is unavailable, fall back to remote datacenter (accepting higher latency 100ms → 500ms), fall back to LOCAL_QUORUM instead of QUORUM reads (accepting lower consistency for availability). The architectural boundary is the client driver and connection pool, which must manage failover, retry, and degraded consistency modes while presenting consistent interfaces to application code.",
    ],
    architecturalBoundaries: [
      "Service Resilience Layer (Between Client and Remote Services) - Fallback wraps HTTP clients, gRPC stubs, and SDK calls to external services. When service.getRecommendations() throws exception or times out, fallback handler returns cached recommendations instead. Implemented via decorators (@Fallback in Spring, .with(Fallback::of) in Resilience4j), middleware (Express.js error handlers), or SDK features (AWS SDK automatic retry with fallback regions). Critical boundary: fallback must execute AFTER retries exhausted but BEFORE error propagates to user. Typical stack: Client request → API Gateway → Service call → Timeout → Retry (3x) → Circuit breaker check → Fallback (cache/default) → Response. Fallback placement here prevents cascade failures—Service A calling Service B doesn't fail when B is down. Used in: Netflix Zuul (edge fallback), Spring Cloud Gateway (reactive fallback), Kong API Gateway (custom plugin fallbacks).",

      "Content Selection Layer (Between Personalization Engine and Content Rendering) - Fallback sits between ML models/recommendation engines and UI components. When personalization service fails to return recommendations within SLA (<200ms), fallback layer returns popular items or cached results. Architectural pattern: Recommendation Orchestrator queries primary model, catches failures, delegates to fallback tier (cache → popular → default), returns response with metadata (source: 'cache', staleness: '5min'). Client uses metadata to adjust UI ('showing popular items'). Boundary is critical for graceful degradation—recommendation failures shouldn't break product pages. Implementation: Backend-for-Frontend (BFF) pattern where BFF orchestrates fallbacks, shielding frontend from complexity. Used in: Netflix homepage (multi-tier recommendation fallback), Amazon product pages (collaborative filtering → bestsellers), Spotify playlists (personalized → popular in genre).",

      "Payment Gateway Layer (Between Checkout and Payment Processors) - Fallback orchestrates primary and backup payment processors. When Stripe's primary Visa gateway fails, payment orchestrator falls back to backup gateway, queues transaction for delayed processing, or escalates to manual review. Architectural boundary: MUST prevent duplicate charges—fallback executes only after confirming primary failure. Typical flow: Validate payment → Attempt primary (5s timeout) → On failure, check idempotency key → Fallback to backup processor (3s timeout) → On failure, queue for retry → Update order status 'payment pending'. Placement ensures transactional integrity—fallback doesn't execute if primary succeeded but response was lost. Used in: Stripe (multi-processor fallback), PayPal (geo-distributed processor fallback), Square (backup gateway fallback).",

      "Metrics Aggregation Layer (Between Data Collectors and Dashboards) - Fallback handles metric stream failures by degrading granularity or data sources. When 10-second real-time metrics fail, fall back to 1-minute aggregated data; when primary Prometheus fails, fall back to secondary CloudWatch; when all fail, show cached panel data with staleness warning. Boundary is query proxy between dashboards (Grafana, Datadog UI) and data sources (Prometheus, InfluxDB, CloudWatch). Fallback allows observability during incidents—degraded monitoring better than none when debugging outages. Implementation: Query federation with fallback logic in proxy layer. Used in: Grafana (multi-datasource fallback), Datadog (metric stream fallback), Prometheus (federation fallback).",
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
      "graceful-degradation",
      "backup-services",
    ],
  },

  implementations: [
    {
      id: "resilience4j-fallback",
      name: "Resilience4j Fallback (Java)",
      type: "library",
      languages: ["java"],
      description:
        "Resilience4j is a lightweight fault tolerance library for Java that provides fallback decorators. Fallback executes alternative logic when decorated methods throw exceptions or are rejected by circuit breakers. Integrates seamlessly with Spring Boot, CompletableFuture, and reactive streams.",
      links: {
        docs: "https://resilience4j.readme.io/docs/fallback",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.decorators.Decorators;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

public class RecommendationService {
    private final CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("recommendations");
    private final RecommendationClient client = new RecommendationClient();
    private final Cache<String, List<Product>> cache = new CaffeineCache<>();

    /**
     * Get recommendations with circuit breaker and fallback protection.
     * Fallback chain: cache -> popular items -> empty list
     */
    public List<Product> getRecommendations(String userId) {
        // Decorate supplier with circuit breaker and fallback
        Supplier<List<Product>> decoratedSupplier = Decorators
            .ofSupplier(() -> client.fetchRecommendations(userId))
            .withCircuitBreaker(circuitBreaker)
            // Primary fallback: return cached recommendations
            .withFallback(
                List.of(Exception.class),
                (exception) -> {
                    log.warn("Primary service failed, using cache fallback", exception);
                    return getCachedRecommendations(userId);
                }
            )
            .decorate();

        try {
            return decoratedSupplier.get();
        } catch (Exception e) {
            // Secondary fallback: return popular items
            log.error("Cache fallback failed, using popular items", e);
            return getPopularItems();
        }
    }

    /**
     * Async version using CompletableFuture with fallback chain.
     */
    public CompletableFuture<List<Product>> getRecommendationsAsync(String userId) {
        return CompletableFuture
            .supplyAsync(() -> client.fetchRecommendations(userId))
            .handle((result, exception) -> {
                if (exception != null) {
                    // Fallback to cache
                    log.warn("Primary service failed, using cache", exception);
                    return getCachedRecommendations(userId);
                }
                // Success: cache result for future fallbacks
                cache.put(userId, result);
                return result;
            })
            .exceptionally(exception -> {
                // Cache failed, fallback to popular items
                log.error("Cache failed, using popular items", exception);
                return getPopularItems();
            });
    }

    private List<Product> getCachedRecommendations(String userId) {
        return cache.getOrDefault(userId, List.of());
    }

    private List<Product> getPopularItems() {
        return List.of(
            new Product("popular-1", "Bestseller Product", 29.99),
            new Product("popular-2", "Trending Item", 39.99)
        );
    }
}

// Spring Boot integration with @CircuitBreaker and @Fallback
import org.springframework.stereotype.Service;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

@Service
public class ProductService {

    @CircuitBreaker(name = "productService", fallbackMethod = "getProductFallback")
    public Product getProduct(String productId) {
        // Primary service call that may fail
        return productClient.fetchProduct(productId);
    }

    // Fallback method (must have same signature + Throwable parameter)
    private Product getProductFallback(String productId, Throwable throwable) {
        log.warn("Product service failed for {}, using fallback", productId, throwable);

        // Try cache first
        Product cached = cache.get(productId);
        if (cached != null) {
            return cached;
        }

        // Return default product
        return new Product(productId, "Product Unavailable", 0.0);
    }
}`,
    },
    {
      id: "polly-fallback",
      name: "Polly Fallback (.NET/C#)",
      type: "library",
      languages: ["csharp"],
      description:
        "Polly is a .NET resilience library providing fallback policies. Fallback can be combined with circuit breakers, retries, and timeouts to create comprehensive resilience strategies. Supports synchronous and asynchronous operations.",
      links: {
        docs: "https://github.com/App-vNext/Polly#fallback",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `using Polly;
using Polly.Fallback;
using Polly.CircuitBreaker;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

public class RecommendationService
{
    private readonly HttpClient _httpClient;
    private readonly ICache<string, List<Product>> _cache;
    private readonly IAsyncPolicy<List<Product>> _policy;

    public RecommendationService(HttpClient httpClient, ICache cache)
    {
        _httpClient = httpClient;
        _cache = cache;

        // Build comprehensive policy: Circuit Breaker + Timeout + Fallback
        var circuitBreaker = Policy
            .HandleResult<List<Product>>(r => r == null || r.Count == 0)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30)
            );

        var timeout = Policy
            .TimeoutAsync<List<Product>>(TimeSpan.FromSeconds(5));

        var fallback = Policy<List<Product>>
            .Handle<Exception>()
            .FallbackAsync(
                fallbackAction: async (context, cancellationToken) =>
                {
                    var userId = context["userId"] as string;

                    // Fallback tier 1: Cached recommendations
                    var cached = await _cache.GetAsync(userId);
                    if (cached != null && cached.Count > 0)
                    {
                        Console.WriteLine($"Using cached recommendations for {userId}");
                        return cached;
                    }

                    // Fallback tier 2: Popular items
                    Console.WriteLine($"Cache miss, using popular items for {userId}");
                    return await GetPopularItemsAsync();
                },
                onFallbackAsync: async (result, context) =>
                {
                    Console.WriteLine($"Fallback triggered: {result.Exception?.Message}");
                    await Task.CompletedTask;
                }
            );

        // Combine policies: Fallback wraps circuit breaker and timeout
        _policy = fallback.WrapAsync(circuitBreaker).WrapAsync(timeout);
    }

    public async Task<List<Product>> GetRecommendationsAsync(string userId)
    {
        var context = new Context { ["userId"] = userId };

        try
        {
            var recommendations = await _policy.ExecuteAsync(async (ctx) =>
            {
                // Primary service call
                var response = await _httpClient.GetAsync(
                    $"https://api.example.com/recommendations/{userId}"
                );
                response.EnsureSuccessStatusCode();

                var products = await response.Content.ReadAsAsync<List<Product>>();

                // Cache successful result
                await _cache.SetAsync(userId, products, TimeSpan.FromMinutes(10));

                return products;
            }, context);

            return recommendations;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"All fallback strategies failed: {ex.Message}");
            // Last resort: static defaults
            return GetDefaultProducts();
        }
    }

    private async Task<List<Product>> GetPopularItemsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync(
                "https://api.example.com/popular?limit=5",
                timeout: TimeSpan.FromSeconds(2)
            );
            return await response.Content.ReadAsAsync<List<Product>>();
        }
        catch
        {
            return GetDefaultProducts();
        }
    }

    private List<Product> GetDefaultProducts()
    {
        return new List<Product>
        {
            new Product { Id = "default-1", Name = "Bestseller", Price = 29.99m },
            new Product { Id = "default-2", Name = "Popular Choice", Price = 39.99m }
        };
    }
}`,
    },
    {
      id: "hystrix-fallback",
      name: "Netflix Hystrix Fallback (Java)",
      type: "library",
      languages: ["java"],
      description:
        "Hystrix (now in maintenance mode, succeeded by Resilience4j) pioneered the fallback pattern in microservices. @HystrixCommand annotation wraps methods with circuit breaker and fallback logic. Fallback methods execute when primary methods fail or circuit is open.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki/How-To-Use#fallback",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

@Service
public class RecommendationService {

    @Autowired
    private RecommendationClient recommendationClient;

    @Autowired
    private CacheManager cacheManager;

    /**
     * Hystrix command with circuit breaker and fallback.
     * When primary method fails or circuit is open, fallback executes.
     */
    @HystrixCommand(
        commandKey = "getRecommendations",
        fallbackMethod = "getRecommendationsFallback",
        commandProperties = {
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "5000"),
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20"),
            @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50"),
            @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "30000")
        }
    )
    public List<Product> getRecommendations(String userId) {
        // Primary service call
        List<Product> recommendations = recommendationClient.fetchRecommendations(userId);

        // Cache successful result
        cacheManager.put(userId, recommendations);

        return recommendations;
    }

    /**
     * Fallback method 1: Try cached recommendations
     * Must have same signature as primary method (can add Throwable parameter)
     */
    private List<Product> getRecommendationsFallback(String userId, Throwable throwable) {
        logger.warn("Primary recommendations failed for user {}: {}",
            userId, throwable.getMessage());

        // Try cache
        Cache.ValueWrapper cached = cacheManager.get(userId);
        if (cached != null && cached.get() != null) {
            logger.info("Returning cached recommendations for user {}", userId);
            return (List<Product>) cached.get();
        }

        // Cache miss, delegate to next fallback tier
        return getPopularItemsFallback(userId, throwable);
    }

    /**
     * Fallback method 2: Popular items
     */
    @HystrixCommand(
        commandKey = "getPopularItems",
        fallbackMethod = "getDefaultProductsFallback",
        commandProperties = {
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "2000")
        }
    )
    private List<Product> getPopularItemsFallback(String userId, Throwable throwable) {
        logger.info("Cache miss, fetching popular items for user {}", userId);
        return recommendationClient.fetchPopularItems(5);
    }

    /**
     * Fallback method 3: Static defaults (last resort)
     */
    private List<Product> getDefaultProductsFallback(String userId, Throwable throwable) {
        logger.error("All fallback strategies failed for user {}, using defaults", userId);

        return Arrays.asList(
            new Product("default-1", "Bestseller Product", 29.99),
            new Product("default-2", "Popular Choice", 39.99)
        );
    }
}`,
    },
    {
      id: "nodejs-fallback",
      name: "Node.js Fallback with Axios and Circuit Breaker",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Node.js fallback implementation using axios for HTTP requests, node-cache for caching, and opossum circuit breaker. Demonstrates async/await fallback chains and error handling in JavaScript/TypeScript ecosystems.",
      links: {
        docs: "https://www.npmjs.com/package/opossum",
      },
      codeSnippet: `import axios from 'axios';
import CircuitBreaker from 'opossum';
import NodeCache from 'node-cache';

interface Product {
  id: string;
  name: string;
  price: number;
}

class RecommendationService {
  private cache: NodeCache;
  private breaker: CircuitBreaker;

  constructor() {
    // Initialize cache with 10-minute TTL
    this.cache = new NodeCache({ stdTTL: 600 });

    // Configure circuit breaker with fallback
    this.breaker = new CircuitBreaker(
      async (userId: string) => this.fetchPrimaryRecommendations(userId),
      {
        timeout: 5000, // 5 second timeout
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        fallback: async (userId: string) => this.executeFallbackChain(userId),
      }
    );

    // Monitor circuit breaker events
    this.breaker.on('open', () => console.warn('Circuit OPEN - using fallback'));
    this.breaker.on('halfOpen', () => console.info('Circuit HALF-OPEN - testing'));
    this.breaker.on('close', () => console.info('Circuit CLOSED - healthy'));
  }

  /**
   * Public API: Get recommendations with full fallback protection
   */
  async getRecommendations(userId: string): Promise<{
    recommendations: Product[];
    source: 'primary' | 'cache' | 'popular' | 'default';
    degraded: boolean;
  }> {
    try {
      const recommendations = await this.breaker.fire(userId);
      return {
        recommendations,
        source: 'primary',
        degraded: false,
      };
    } catch (error) {
      console.error(\`All fallback strategies failed for \${userId}\`, error);
      return {
        recommendations: this.getDefaultProducts(),
        source: 'default',
        degraded: true,
      };
    }
  }

  /**
   * Primary service call
   */
  private async fetchPrimaryRecommendations(userId: string): Promise<Product[]> {
    const response = await axios.get<{ data: Product[] }>(
      \`https://api.example.com/recommendations/\${userId}\`,
      { timeout: 5000 }
    );

    // Cache successful response
    this.cache.set(userId, response.data.data);

    return response.data.data;
  }

  /**
   * Fallback chain: cache -> popular items -> defaults
   */
  private async executeFallbackChain(userId: string): Promise<Product[]> {
    // Tier 1: Cached recommendations
    const cached = this.cache.get<Product[]>(userId);
    if (cached && cached.length > 0) {
      console.info(\`Using cached recommendations for \${userId}\`);
      return cached;
    }

    // Tier 2: Popular items
    try {
      const popular = await this.fetchPopularItems();
      if (popular.length > 0) {
        console.info(\`Using popular items for \${userId}\`);
        return popular;
      }
    } catch (error) {
      console.error(\`Popular items failed for \${userId}\`, error);
    }

    // Tier 3: Static defaults
    console.warn(\`Using default products for \${userId}\`);
    return this.getDefaultProducts();
  }

  /**
   * Backup service: popular items
   */
  private async fetchPopularItems(): Promise<Product[]> {
    const response = await axios.get<{ data: Product[] }>(
      'https://api.example.com/popular',
      { timeout: 2000, params: { limit: 5 } }
    );
    return response.data.data;
  }

  /**
   * Last resort: static defaults
   */
  private getDefaultProducts(): Product[] {
    return [
      { id: 'default-1', name: 'Bestseller', price: 29.99 },
      { id: 'default-2', name: 'Popular Choice', price: 39.99 },
    ];
  }
}

export default RecommendationService;`,
    },
    {
      id: "go-fallback",
      name: "Go Fallback with Failsafe-go",
      type: "library",
      languages: ["go"],
      description:
        "Go fallback implementation using failsafe-go library for circuit breakers and retries. Demonstrates idiomatic Go error handling with fallback chains using functional options pattern.",
      links: {
        github: "https://github.com/failsafe-go/failsafe-go",
      },
      codeSnippet: `package main

import (
    "context"
    "fmt"
    "time"

    "github.com/failsafe-go/failsafe-go"
    "github.com/failsafe-go/failsafe-go/circuitbreaker"
    "github.com/patrickmn/go-cache"
)

type Product struct {
    ID    string
    Name  string
    Price float64
}

type RecommendationService struct {
    client      *http.Client
    cache       *cache.Cache
    breaker     circuitbreaker.CircuitBreaker[[]Product]
    fallbackExec failsafe.Executor[[]Product]
}

func NewRecommendationService() *RecommendationService {
    // Initialize cache with 10-minute default expiration
    c := cache.New(10*time.Minute, 1*time.Minute)

    // Configure circuit breaker
    breaker := circuitbreaker.Builder[[]Product]().
        WithDelay(30 * time.Second).
        OnFailure(50, 100).  // Open after 50% failure rate
        Build()

    // Configure fallback executor
    fallback := failsafe.NewExecutor[[]Product](breaker).
        WithFallback(func(exec failsafe.Execution[[]Product]) ([]Product, error) {
            userID := exec.Context().Value("userID").(string)
            return executeFallbackChain(c, userID)
        })

    return &RecommendationService{
        client:       &http.Client{Timeout: 5 * time.Second},
        cache:        c,
        breaker:      breaker,
        fallbackExec: fallback,
    }
}

// GetRecommendations returns recommendations with full fallback protection
func (s *RecommendationService) GetRecommendations(ctx context.Context, userID string) ([]Product, error) {
    ctx = context.WithValue(ctx, "userID", userID)

    // Execute with circuit breaker and fallback
    recommendations, err := s.fallbackExec.GetWithExecution(func(exec failsafe.Execution[[]Product]) ([]Product, error) {
        return s.fetchPrimaryRecommendations(ctx, userID)
    })

    if err != nil {
        // All fallbacks failed
        return s.getDefaultProducts(), nil
    }

    return recommendations, nil
}

// fetchPrimaryRecommendations calls primary service
func (s *RecommendationService) fetchPrimaryRecommendations(ctx context.Context, userID string) ([]Product, error) {
    req, err := http.NewRequestWithContext(
        ctx,
        "GET",
        fmt.Sprintf("https://api.example.com/recommendations/%s", userID),
        nil,
    )
    if err != nil {
        return nil, err
    }

    resp, err := s.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("status %d", resp.StatusCode)
    }

    var result struct {
        Data []Product \`json:"data"\`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    // Cache successful result
    s.cache.Set(userID, result.Data, cache.DefaultExpiration)

    return result.Data, nil
}

// executeFallbackChain implements multi-tier fallback
func executeFallbackChain(c *cache.Cache, userID string) ([]Product, error) {
    // Tier 1: Cached recommendations
    if cached, found := c.Get(userID); found {
        fmt.Printf("Using cached recommendations for %s\\n", userID)
        return cached.([]Product), nil
    }

    // Tier 2: Popular items
    popular, err := fetchPopularItems()
    if err == nil && len(popular) > 0 {
        fmt.Printf("Using popular items for %s\\n", userID)
        return popular, nil
    }

    // Tier 3: Return error to trigger final default fallback
    return nil, fmt.Errorf("all fallback tiers failed")
}

func fetchPopularItems() ([]Product, error) {
    client := &http.Client{Timeout: 2 * time.Second}
    resp, err := client.Get("https://api.example.com/popular?limit=5")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result struct {
        Data []Product \`json:"data"\`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return result.Data, nil
}

func (s *RecommendationService) getDefaultProducts() []Product {
    return []Product{
        {ID: "default-1", Name: "Bestseller", Price: 29.99},
        {ID: "default-2", Name: "Popular Choice", Price: 39.99},
    }
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-zuul-fallback",
      systemName: "Netflix Zuul API Gateway Fallback",
      howUsed:
        "Netflix's Zuul API gateway implements comprehensive fallback patterns to maintain availability when backend microservices fail. When Zuul proxies requests to backend services (user profiles, recommendations, video metadata), each service call is wrapped with Hystrix circuit breakers and fallback logic. For the Netflix homepage, Zuul orchestrates calls to 50+ microservices—if any fail, fallbacks execute: recommendation service timeout → return cached recommendations (up to 5 minutes old); user profile service down → show generic profile with default avatar; video metadata missing → show title and thumbnail only (skip cast, synopsis). The fallback strategy is hierarchical: primary service (circuit closed) → retry (3 attempts with exponential backoff) → circuit breaker trips (after 50% error rate) → fallback (cache → backup service → static content). Zuul's fallback configuration is service-specific: critical services (authentication, billing) have no fallback (fail explicitly), optional services (recommendations, personalization) degrade gracefully with cached or generic content. During the 2015 AWS outage that affected Netflix's primary region, Zuul's fallback mechanisms enabled 90% of homepage functionality by serving cached recommendations, popular titles, and generic content while primary services recovered. The pattern prevented complete outage—users saw functional (if degraded) pages instead of error messages. Fallback metadata is included in responses (X-Fallback-Source: cache, X-Degraded: true) enabling client applications to adjust UI with 'showing older recommendations' messages. Netflix measures fallback effectiveness via metrics: fallback activation rate (should be <5% during normal operation), cache hit rate for fallbacks (>80%), user engagement during degraded mode (monitored for impact of stale content). Pattern composition: Fallback + Circuit Breaker + Retry + Cache-Aside + Service-Specific Timeout. Impact: Maintained 99.9% homepage availability despite frequent microservice failures; reduced user-visible errors by 95%; enabled graceful degradation of non-critical features without breaking core video playback.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "amazon-product-recommendations",
      systemName: "Amazon Product Recommendation Fallback",
      howUsed:
        "Amazon's product pages implement multi-tier fallback for the 'Customers who bought this also bought' recommendation section. The primary recommendation engine uses real-time collaborative filtering analyzing recent purchase patterns, browsing history, and item similarity—this ML model has strict latency requirements (<200ms P99) and occasionally times out during high traffic. When primary recommendations fail, Amazon's fallback chain executes: Tier 1 - Cached recommendations from the last successful call (staleness up to 10 minutes acceptable for recommendations); Tier 2 - Category-based popular items ('bestsellers in Electronics' for electronics products); Tier 3 - Store-wide popular items (trending products across all categories); Tier 4 - Items from the same manufacturer or brand. Each fallback tier has decreasing personalization but increasing availability—cached recommendations are best (personalized, recent) while store-wide popular items are least personalized but always available. The fallback placement is in Amazon's Backend-for-Frontend (BFF) service that orchestrates product page rendering. During Amazon Prime Day 2022, when recommendation services experienced 10x traffic surge causing widespread timeouts, fallback mechanisms served 85% of recommendation requests from cache and popular items, maintaining product discovery functionality crucial for sales. Amazon tracks fallback quality metrics: conversion rate of fallback recommendations vs primary (fallback conversions are 60-70% of primary, acceptable tradeoff for availability); customer engagement with degraded content (click-through rates remain high even for cached recommendations). The system also implements smart cache warming—popular product recommendations are pre-cached during off-peak hours and refreshed every 5 minutes, ensuring cache fallback has high hit rates. Amazon's approach treats recommendations as optional enhancement, not critical feature—checkout, pricing, and inventory checks never use fallback (fail explicitly if primary fails). Pattern composition: Fallback + Multi-Tier Cache + Popular Item Backup + Real-Time ML + Cache Warming. Impact: Maintained product discovery during Prime Day traffic spikes; reduced recommendation-related errors from 15% to <1%; enabled A/B testing of recommendation algorithms without risking revenue (fallback protects against bad model deployments).",
      source:
        "https://www.amazon.science/blog/how-amazon-knows-that-youll-like-a-product-even-before-you-buy-it",
    },
    {
      systemId: "stripe-payment-processor-fallback",
      systemName: "Stripe Payment Processor Fallback",
      howUsed:
        "Stripe's payment processing infrastructure implements fallback across multiple payment processor gateways to maintain 99.99% payment success rates. When Stripe processes a credit card payment, it routes transactions to primary processor gateways (Visa/Mastercard networks via preferred partners). If primary processor experiences downtime, network issues, or unusually high latency (>2s response time), Stripe's payment orchestration layer activates fallback: Primary processor timeout (5s) → Retry same processor (1 attempt with 2s timeout) → Fallback to backup processor gateway (alternate Visa/MC network partner, 3s timeout) → Queue transaction for delayed processing (eventual consistency) → Notify merchant of payment pending status. The fallback strategy includes idempotency protection—before falling back, verify primary didn't silently succeed (check transaction ID with processor). Stripe also implements geographic fallback: US payments normally route to US-based processor; during US processor outage, fall back to EU-based processor accepting higher latency (200ms → 500ms) to maintain availability. The architectural boundary is critical—fallbacks execute AFTER transaction validation but BEFORE committing charge to customer. During a 2021 incident where a major payment processor experienced regional outage, Stripe's fallback mechanisms automatically rerouted 2M transactions to backup processors with <5s total processing time (vs normal 1s), maintaining 99.95% success rate. Stripe's customers (Shopify, DoorDash, Lyft) experienced zero downtime because fallback was transparent—from merchant perspective, payment succeeded normally. Stripe monitors fallback metrics rigorously: fallback activation rate per processor (alert if >5%), success rate of fallback transactions (must be >99%), latency increase during fallback (acceptable up to 3x baseline). The system also tracks false positives—instances where primary would have succeeded but timeout triggered fallback—and adjusts timeout thresholds dynamically based on processor SLAs. Stripe's approach treats payment processors as interchangeable commodities via fallback abstraction—merchants don't configure processors, Stripe's orchestration layer handles failover automatically. Pattern composition: Fallback + Idempotency + Geographic Routing + Transaction Queuing + Automatic Retry. Impact: Maintained 99.99% payment availability despite processor outages; prevented $500M in lost transaction volume during incident; reduced merchant payment errors by 40% through automatic processor failover.",
      source: "https://stripe.com/blog/payment-api-design",
    },
    {
      systemId: "datadog-metrics-fallback",
      systemName: "Datadog Metrics Aggregation Fallback",
      howUsed:
        "Datadog's observability platform implements fallback for metric streams when real-time data collection fails. Datadog agents running on customer infrastructure send metrics to ingestion endpoints every 10 seconds (default). When ingestion fails (network partition, backend overload, datacenter outage), agents buffer metrics locally and fallback activates: Primary path: Agent → Ingestion API → Real-time stream → Dashboard (10s latency); Fallback path 1: Agent local buffer (1-hour capacity) → Batch upload when connectivity restored → Historical backfill; Fallback path 2: Agent → Secondary ingestion endpoint (different region) → Increased latency (50ms → 300ms); Fallback path 3: Dashboard falls back to 1-minute rollup data (instead of 10-second granularity) → Reduced resolution but maintained visibility. On the query side, when Datadog's dashboard queries time out (complex aggregations across millions of time series), query layer falls back: Real-time query (5s timeout) → Pre-aggregated 1-minute rollups → Pre-computed metrics (recording rules) → Cached query results (last 5 minutes) → 'Data temporarily unavailable' with last known state. The architectural placement is at the query federation layer—dashboards query through a proxy that implements fallback logic transparently. During a 2022 incident where Datadog's primary US region experienced degradation, fallback mechanisms maintained observability for 99% of customers: agents routed to EU region (increased latency), dashboards showed 1-minute data (vs 10-second), and historical data was backfilled during recovery. The fallback prevented the catastrophic scenario where monitoring infrastructure fails during incidents it's needed to debug—degraded monitoring is far superior to no monitoring when troubleshooting outages. Datadog also implements intelligent metric sampling as fallback: when ingestion is overwhelmed (10M metrics/sec sustained), sample to 10% of metrics (keeping high-cardinality important tags), fall back to log-derived metrics (slower but available), or show 'data delayed' indicator in dashboards. Metrics quality during fallback: 1-minute rollups provide 95% of troubleshooting value compared to 10-second data; regional failover adds <500ms latency; sampling maintains SLI/SLO tracking accuracy. Pattern composition: Fallback + Local Buffering + Regional Routing + Data Sampling + Query Downsampling + Pre-Aggregation. Impact: Maintained monitoring availability during incidents when observability is most critical; prevented 'monitoring blind spots' during infrastructure failures; enabled graceful degradation (reduced resolution) instead of complete data loss.",
      source: "https://www.datadoghq.com/blog/engineering/introducing-husky/",
    },
    {
      systemId: "github-mysql-fallback",
      systemName: "GitHub MySQL Read Replica Fallback",
      howUsed:
        "GitHub's database infrastructure implements fallback from primary MySQL databases to read replicas when primary experiences degradation. GitHub's application tier normally reads from primary databases for strong consistency, but falls back to read replicas (stale by <1s due to replication lag) when primary is overloaded or unavailable. The fallback strategy is query-dependent: Critical writes (git push, PR merge, issue creation) → Always primary, fail explicitly if unavailable; User-facing reads (repository browsing, issue lists, PR details) → Primary preferred, fall back to replica if primary timeout >500ms; Background operations (email notifications, webhooks) → Replica preferred, fall back to delayed queue if replica unavailable. GitHub's data access layer (ActiveRecord with custom extensions) implements automatic fallback: application code calls Repository.find(id) which routes to primary; if primary responds slowly (P95 >300ms detected via sliding window), routing layer falls back to replica for that specific query type. During GitHub's 2018 database incident where primary MySQL cluster lost quorum, fallback mechanisms enabled read-only mode for 30 minutes while primary recovered: users could browse code, read issues, and view PRs (from replicas) but couldn't push or create issues (write operations failed gracefully with 'temporarily read-only' message). The fallback prevented complete GitHub unavailability, maintaining 80% of user functionality during the incident. GitHub tracks replica lag metrics—if lag exceeds 5s, fallback is disabled (unacceptably stale data) and applications wait for primary or show 'database maintenance' message. The system also implements replica health checks: before falling back, verify replica is <2s behind and successfully replicating; unhealthy replicas are excluded from fallback pool. GitHub's approach balances consistency and availability—critical writes never use fallback (strong consistency required), reads accept eventual consistency during degradation. Pattern composition: Fallback + Read Replica + Query Routing + Replication Lag Detection + Graceful Degradation. Impact: Maintained read functionality during primary database incident; reduced user-visible errors by 70%; enabled 'read-only mode' as fallback state instead of complete outage; facilitated database maintenance without full downtime.",
      source:
        "https://github.blog/2018-10-30-oct21-post-incident-analysis/ (GitHub MySQL Incident)",
    },
  ],

  references: [
    {
      title: "Resilience4j Fallback Documentation",
      url: "https://resilience4j.readme.io/docs/fallback",
      type: "documentation",
      author: "Resilience4j Authors",
    },
    {
      title:
        "Netflix Hystrix: Fault Tolerance in a High Volume Distributed System",
      url: "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
      type: "article",
      author: "Netflix Technology Blog",
    },
    {
      title: "Polly Fallback Policies (.NET)",
      url: "https://github.com/App-vNext/Polly#fallback",
      type: "documentation",
      author: "Polly-Contrib",
    },
    {
      title:
        "Release It! - Design and Deploy Production-Ready Software (Chapter on Stability Patterns)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title:
        "AWS Well-Architected Framework - Reliability Pillar (Graceful Degradation)",
      url: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
  ],

  philosophy: {
    coreProblem:
      "Service failures in distributed systems cause complete feature unavailability and poor user experience when applications have no alternative responses, leading to error pages, broken functionality, and cascade failures across dependent services",
    designPrinciple:
      "Provide alternative responses of decreasing quality (cached data, popular items, static defaults) when primary operations fail, enabling graceful degradation where partial functionality is maintained instead of complete failure",
    historicalContext:
      "Fallback patterns emerged from early e-commerce and content delivery systems where availability directly impacted revenue. Amazon pioneered multi-tier fallback for product recommendations in the early 2000s, discovering that showing cached or generic recommendations was far superior to blank product pages—even stale personalization maintained user engagement and conversion rates. Netflix popularized fallback patterns in microservices with their Hystrix library (2011), implementing systematic fallbacks across hundreds of services powering video streaming. Hystrix introduced the @HystrixCommand annotation making fallback a first-class pattern in Spring applications, demonstrating that graceful degradation should be default behavior, not exception handling. The pattern became essential during the rise of microservices (2010s) when applications calling 50+ services couldn't afford all-or-nothing availability—any single service failure breaking the entire application was unacceptable. Modern implementations distinguish fallback quality tiers: Netflix's homepage has 5 fallback tiers for recommendations (primary ML model → cached personalized → popular in genre → popular globally → static 'trending' content). Cloud-native architectures now treat fallback as infrastructure concern—service meshes (Istio, Linkerd), API gateways (Kong, Zuul), and resilience libraries (Resilience4j, Polly) provide fallback as configurable policies rather than ad-hoc error handling. The pattern's evolution reflects a shift from 'fail fast' (return errors immediately) to 'degrade gracefully' (provide best available alternative) as the dominant philosophy for user-facing systems.",
    alternativesRejected: [
      "Fail Fast (No Fallback) - Return errors immediately when primary fails. Results in poor user experience (error pages instead of content), cascade failures (upstream services fail when dependencies fail), and all-or-nothing availability (99.9% service availability × 50 services = 95% overall availability). Only appropriate for critical operations where incorrect data is worse than no data (payments, authentication).",
      "Infinite Retry Without Fallback - Keep retrying primary service until success or timeout. Wastes resources on struggling services (retry storms), delays failure detection (user waits for timeout), and doesn't protect user experience (still shows error after retries exhausted). Fallback should execute AFTER retries exhausted.",
      "Always Use Fallback - Skip primary and always return cached/default data. Defeats purpose of real-time services, provides stale data when fresh data available, and hides primary service failures from monitoring. Fallback should be exception, not default behavior.",
      "Undifferentiated Fallback - Same fallback for all failure types. Timeouts may benefit from cached data, but validation errors should not (incorrect request shouldn't return stale data). Different failure types require different fallback strategies.",
      "Silent Fallback - Return fallback data without signaling degradation. Misleads users (they think data is fresh/personalized when it's stale/generic), prevents client-side adaptation (UI can't show 'showing older recommendations'), and hides incidents from monitoring. Fallback should include metadata (source, staleness, degraded flag).",
      "Fallback Without Circuit Breaker - Attempt primary on every request even during sustained failure. Overwhelms struggling services with traffic, increases latency (waiting for timeout on every request), and wastes resources. Circuit breaker should skip primary during outages, immediately using fallback.",
    ],
    mentalModel:
      "Fallback is like a restaurant with a primary menu and backup options. If the chef can't prepare your first choice (salmon is out), the waiter offers alternatives in decreasing preference: similar dish from today's specials (cached recent menu), popular house specialty (generic recommendation), or vegetarian option that's always available (static default). You get a meal (functionality maintained) even if not your first choice (degraded experience). The key insight: some food is better than leaving hungry (some content better than error page), and alternatives should be ready before the kitchen runs out (fallback prepared in advance, not improvised during failure).",
  },

  visualization: {
    staticDiagram: `graph TB
    Request[Client Request] --> Primary{Primary Service}

    Primary -->|Success| Cache[Update Cache]
    Cache --> Response[Return Fresh Data ✓]

    Primary -->|Timeout/Error| Retry{Retry 3x?}
    Retry -->|Still Failing| CB{Circuit Breaker}

    CB -->|Closed| Attempt[Attempt Primary]
    Attempt -->|Fail| FallbackTier1{Fallback Tier 1}

    CB -->|Open| FallbackTier1

    FallbackTier1 -->|Cache Hit| CachedData[Return Cached Data ⚠️]
    FallbackTier1 -->|Cache Miss| FallbackTier2{Fallback Tier 2}

    FallbackTier2 -->|Success| BackupData[Return Backup Service Data ⚠️]
    FallbackTier2 -->|Fail| FallbackTier3{Fallback Tier 3}

    FallbackTier3 --> DefaultData[Return Static Defaults ⚠️]

    CachedData --> DegradedResponse[Degraded Response]
    BackupData --> DegradedResponse
    DefaultData --> DegradedResponse

    DegradedResponse --> Client[Client with Degradation Flag]

    style Primary fill:#e1f5e1
    style Response fill:#90ee90
    style DegradedResponse fill:#fff4e1
    style DefaultData fill:#ffe1e1
    style CB fill:#e1e5ff`,
    realWorldAnalogy:
      "Fallback is like a news website during breaking news. Primary system: reporters write fresh articles with latest updates (real-time content). Tier 1 fallback: if reporter feed fails, show cached articles from 5 minutes ago (recent but slightly stale). Tier 2 fallback: show related articles from archives on the same topic (relevant but not breaking news). Tier 3 fallback: show top headlines from today (generic news content). Users get news content (functionality maintained) even if not the freshest updates (degraded experience). The site remains usable instead of showing 'news unavailable' error page.",
    useCases: [
      {
        domain: "E-Commerce Product Recommendations",
        scenario:
          "Amazon product pages show 'Customers who bought this also bought' recommendations. When primary ML recommendation engine times out (>200ms), fall back to: cached recommendations (10 min old) → category bestsellers → store-wide popular items. Maintains product discovery even during recommendation service outages.",
        patternRole:
          "Multi-tier fallback ensures product pages always show recommendations, maintaining user engagement and conversion rates during service degradation.",
        companies: ["Amazon", "eBay", "Walmart", "Shopify"],
      },
      {
        domain: "Streaming Video Metadata",
        scenario:
          "Netflix homepage loads video metadata (title, cast, synopsis, thumbnail) for each row of recommendations. When metadata service fails, fall back to: cached metadata → minimal metadata (title + thumbnail only) → placeholder cards. Prevents blank homepage, maintains browsing functionality.",
        patternRole:
          "Graceful degradation of video metadata allows homepage to render with reduced information rather than failing completely when metadata service is unavailable.",
        companies: ["Netflix", "YouTube", "Hulu", "Disney+"],
      },
      {
        domain: "Payment Processing",
        scenario:
          "Stripe payment gateway routes credit card transactions to primary processor. On timeout/failure, fall back to: retry primary (1 attempt) → backup processor gateway → queue for delayed processing. Maintains 99.99% payment success rate during processor outages.",
        patternRole:
          "Payment processor fallback prevents lost revenue from checkout failures, automatically routing to backup gateways when primary processors are unavailable.",
        companies: ["Stripe", "PayPal", "Square", "Adyen"],
      },
      {
        domain: "User Authentication and Profiles",
        scenario:
          "Social media platforms load user profiles showing avatar, name, bio, follower count. When profile service fails, fall back to: cached profile data → generic avatar + username only → 'Profile Unavailable' placeholder. Maintains app functionality without blocking all features.",
        patternRole:
          "Profile fallback prevents authentication failures from breaking entire application, allowing users to continue browsing/posting even when profile service is degraded.",
        companies: ["Twitter", "Facebook", "LinkedIn", "Instagram"],
      },
      {
        domain: "Search and Discovery",
        scenario:
          "E-commerce search queries Elasticsearch for product results. When Elasticsearch times out (high load, cluster degradation), fall back to: cached popular queries → simplified exact-match search → show recently viewed items. Maintains search functionality during search infrastructure issues.",
        patternRole:
          "Search fallback ensures users can find products even when advanced search features (fuzzy matching, ranking) are unavailable, preventing complete loss of discovery.",
        companies: ["Amazon", "eBay", "Etsy", "Home Depot"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "graceful-degradation",
    "circuit-breaker",
    "caching",
    "resilience",
    "error-handling",
    "availability",
  ],
  difficulty: "intermediate",
};
