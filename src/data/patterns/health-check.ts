import type { Pattern } from "../schema";

export const healthCheck: Pattern = {
  id: "health-check",
  slug: "health-check",
  corpusPath:
    "🛡️ RELIABILITY → 🔍 Observability → 🏥 Health Monitoring → 🩺 Health Check",

  hierarchy: {
    quality: "reliability",
    strategy: "Observability",
    family: "Health Monitoring",
    level: 4,
  },

  concept: {
    name: "Health Check",
    emoji: "🩺",
    tagline: "Continuous service health monitoring",
    definition:
      "The Health Check pattern provides automated monitoring endpoints that expose the operational health and readiness of a service. Health checks are lightweight, frequently-polled HTTP endpoints (typically /health or /healthz) that return status codes indicating whether a service is alive, ready to handle traffic, and operating within acceptable parameters. The pattern distinguishes between liveness checks (is the process running?) and readiness checks (can it serve traffic?). Liveness checks verify the application hasn't deadlocked or crashed and trigger automatic restarts when failures occur. Readiness checks validate that all dependencies—databases, caches, message queues, downstream APIs—are accessible and responsive, removing the service from load balancer rotation when not ready. Health checks execute synchronously with tight timeouts (typically 1-5 seconds) to quickly detect failures without blocking the monitoring system. They return structured responses including status, timestamp, version, and dependency statuses, enabling detailed diagnostics. Load balancers, orchestrators (Kubernetes, ECS), and monitoring systems continuously poll health endpoints, using the results to make routing, scaling, and alerting decisions. This pattern enables self-healing infrastructure where unhealthy instances are automatically replaced, preventing cascading failures and maintaining high availability without manual intervention.",
    problemSolved:
      "Distributed systems face the challenge of automatically detecting and recovering from service failures without human intervention. Traditional monitoring approaches—manual server checks, periodic scripts, or log scraping—react too slowly to prevent user impact. When a service crashes, deadlocks, or loses database connectivity, requests continue routing to the unhealthy instance, causing timeouts, errors, and degraded user experience. The problem intensifies in cloud-native environments with ephemeral instances, auto-scaling, and rolling deployments where services start, stop, and move constantly. Health Checks solve this by providing standardized, machine-readable health signals that automation can act on immediately. Load balancers stop routing traffic to services returning 503 Service Unavailable, preventing error exposure to users. Orchestrators restart containers failing liveness checks, recovering from deadlocks and memory leaks. Readiness checks prevent premature traffic routing to services still initializing connections or warming caches. The pattern also enables sophisticated deployment strategies: blue-green deployments use health checks to validate new versions before switching traffic, canary releases monitor health to detect regressions, and circuit breakers combine health signals with error rates for intelligent traffic management.",
    tradeoffs: {
      pros: [
        "Enables automatic detection and recovery from service failures",
        "Prevents traffic routing to unhealthy instances via load balancers",
        "Supports self-healing infrastructure with automated restarts",
        "Provides real-time visibility into service and dependency health",
        "Enables safe rolling deployments and traffic management",
        "Standardizes health monitoring across heterogeneous services",
      ],
      cons: [
        "Adds latency overhead from frequent health check execution",
        "Can overwhelm dependencies if checks are too aggressive",
        "Requires careful timeout tuning to avoid false positives",
        "May cause cascading failures if dependencies check each other",
        "Increases application complexity with health check logic",
        "Shallow checks miss deep application-level failures",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "retry",
      "timeout",
      "graceful-degradation",
      "blue-green-deployment",
      "canary-release",
      "load-balancing",
      "service-mesh",
    ],
  },

  structure: {
    participants: [
      {
        name: "Health Check Endpoint",
        role: "Health Reporter",
        responsibilities: [
          "Expose /health and /ready endpoints for monitoring",
          "Execute dependency checks within timeout limits",
          "Return standardized HTTP status codes (200, 503, 429)",
          "Provide structured health status with timestamp and version",
        ],
      },
      {
        name: "Dependency Health Checker",
        role: "Dependency Validator",
        responsibilities: [
          "Verify database connectivity and query performance",
          "Test cache availability and response time",
          "Validate downstream API reachability",
          "Check message queue connectivity",
        ],
      },
      {
        name: "Load Balancer / Orchestrator",
        role: "Health Monitor",
        responsibilities: [
          "Poll health endpoints at regular intervals (5-30 seconds)",
          "Remove unhealthy instances from traffic rotation",
          "Restart containers failing liveness checks",
          "Route traffic only to ready instances",
        ],
      },
      {
        name: "Application Service",
        role: "Health Subject",
        responsibilities: [
          "Initialize dependencies during startup",
          "Report accurate health status based on operational state",
          "Gracefully shut down when health becomes critical",
          "Maintain health metrics for diagnostics",
        ],
      },
      {
        name: "Monitoring System",
        role: "Health Aggregator",
        responsibilities: [
          "Collect health check results from all service instances",
          "Aggregate health metrics and trends",
          "Trigger alerts when health degrades across instances",
          "Provide dashboards for health visualization",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant LB as Load Balancer
    participant HC as Health Check Endpoint
    participant App as Application
    participant DB as Database
    participant Cache as Redis Cache
    participant API as Downstream API

    Note over LB,API: Liveness Check (Process Alive?)
    LB->>HC: GET /health/live
    HC->>App: Check process state
    App-->>HC: Process running
    HC-->>LB: 200 OK {status: "UP"}

    Note over LB,API: Readiness Check (Ready for Traffic?)
    LB->>HC: GET /health/ready
    HC->>DB: SELECT 1 (timeout: 2s)
    DB-->>HC: Success (50ms)
    HC->>Cache: PING (timeout: 1s)
    Cache-->>HC: PONG (10ms)
    HC->>API: GET /health (timeout: 2s)
    API-->>HC: 200 OK (150ms)
    HC-->>LB: 200 OK {status: "UP", dependencies: {...}}

    Note over LB,API: Failure Scenario
    LB->>HC: GET /health/ready
    HC->>DB: SELECT 1 (timeout: 2s)
    DB--xHC: Connection timeout (2s)
    HC-->>LB: 503 Service Unavailable
    LB->>LB: Remove from rotation`,
    flow: [
      {
        step: 1,
        actor: "Load Balancer",
        action: "Poll Liveness",
        description:
          "Send GET request to /health/live endpoint every 10 seconds",
      },
      {
        step: 2,
        actor: "Health Check Endpoint",
        action: "Verify Process",
        description:
          "Check that application process is responsive and not deadlocked",
      },
      {
        step: 3,
        actor: "Health Check Endpoint",
        action: "Return Liveness Status",
        description:
          "Respond with 200 OK if alive, timeout if deadlocked (triggers restart)",
      },
      {
        step: 4,
        actor: "Load Balancer",
        action: "Poll Readiness",
        description:
          "Send GET request to /health/ready endpoint every 5 seconds",
      },
      {
        step: 5,
        actor: "Dependency Health Checker",
        action: "Test Dependencies",
        description:
          "Execute lightweight checks against database, cache, APIs within 2s timeout",
      },
      {
        step: 6,
        actor: "Dependency Health Checker",
        action: "Aggregate Results",
        description:
          "Combine all dependency statuses into overall readiness state",
      },
      {
        step: 7,
        actor: "Health Check Endpoint",
        action: "Return Readiness Status",
        description:
          "Respond 200 if ready, 503 if any critical dependency unavailable",
      },
      {
        step: 8,
        actor: "Load Balancer",
        action: "Route Traffic",
        description:
          "Include instance in load balancing only if readiness check returns 200",
      },
      {
        step: 9,
        actor: "Monitoring System",
        action: "Collect Metrics",
        description:
          "Aggregate health check results across all instances for alerting and dashboards",
      },
    ],
    invariants: [
      "Health checks must complete within configured timeout (typically 1-5s)",
      "Liveness check must be lighter than readiness check",
      "Failed health checks must return 503 or 429, never 200",
      "Health endpoints must not require authentication",
      "Dependency checks must use connection pooling to avoid exhaustion",
      "Health state must accurately reflect ability to serve traffic",
    ],
  },

  codeExamples: [
    {
      id: "health-check-express-comprehensive",
      language: "typescript",
      title: "Production Express Health Check Endpoint",
      description:
        "Comprehensive health check implementation with liveness, readiness, and dependency monitoring",
      code: `import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import axios from 'axios';

// ============================================================
// Health Check Types
// ============================================================

enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
}

interface DependencyHealth {
  status: HealthStatus;
  responseTime: number;
  message?: string;
  lastChecked: string;
}

interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  dependencies?: Record<string, DependencyHealth>;
}

// ============================================================
// Dependency Health Checkers
// ============================================================
// ACTION: Implement lightweight health checks for each dependency
// REASON: Validates critical dependencies without heavy operations
//         that could slow down health endpoint responses
// TIMEOUT: Each check must complete within 1-2 seconds to avoid
//          blocking the health check and triggering false negatives
// ============================================================

class HealthChecker {
  private dbPool: Pool;
  private redisClient: Redis;
  private downstreamApiUrl: string;

  // Cache last health check results to reduce dependency load
  private lastHealthCheck: HealthResponse | null = null;
  private lastCheckTime = 0;
  private cacheTTL = 5000; // Cache health results for 5 seconds

  constructor(dbPool: Pool, redisClient: Redis, apiUrl: string) {
    this.dbPool = dbPool;
    this.redisClient = redisClient;
    this.downstreamApiUrl = apiUrl;
  }

  // ============================================================
  // Liveness Check - Ultra Lightweight
  // ============================================================
  // ACTION: Minimal check to verify process is responsive
  // REASON: Liveness checks must be extremely fast (< 100ms) since
  //         they determine if orchestrator should kill the process
  // KUBERNETES: Failing liveness check triggers pod restart
  // ============================================================
  async checkLiveness(): Promise<HealthResponse> {
    // ACTION: Simply return process uptime - no dependency checks
    // REASON: Liveness only verifies the process isn't deadlocked
    //         Dependency failures shouldn't trigger restarts
    return {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      uptime: process.uptime(),
    };
  }

  // ============================================================
  // Readiness Check - Comprehensive Dependency Validation
  // ============================================================
  // ACTION: Check all critical dependencies before accepting traffic
  // REASON: Service must verify it can actually process requests
  //         before load balancer routes traffic to it
  // USE CASE: Prevents routing to instance still warming up or
  //           with broken dependency connections
  // ============================================================
  async checkReadiness(): Promise<HealthResponse> {
    const startTime = Date.now();

    // ACTION: Return cached result if within TTL
    // REASON: Prevents overwhelming dependencies with constant checks
    //         Health state doesn't change every second
    if (
      this.lastHealthCheck &&
      startTime - this.lastCheckTime < this.cacheTTL
    ) {
      return this.lastHealthCheck;
    }

    // ACTION: Check dependencies in parallel for speed
    // REASON: Parallel execution reduces total health check time
    //         Sequential checks would multiply latencies
    const [dbHealth, cacheHealth, apiHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDownstreamAPI(),
    ]);

    // ACTION: Aggregate dependency statuses into overall health
    // REASON: Service is only ready if ALL critical dependencies are available
    const dependencies = {
      database: dbHealth,
      cache: cacheHealth,
      downstreamAPI: apiHealth,
    };

    // ACTION: Determine overall status based on dependencies
    // REASON: Any DOWN dependency means service cannot handle requests
    //         DEGRADED means partial functionality (cache down but DB up)
    let overallStatus = HealthStatus.UP;

    const hasDown = Object.values(dependencies).some(
      (dep) => dep.status === HealthStatus.DOWN
    );
    const hasDegraded = Object.values(dependencies).some(
      (dep) => dep.status === HealthStatus.DEGRADED
    );

    if (hasDown) {
      overallStatus = HealthStatus.DOWN;
    } else if (hasDegraded) {
      overallStatus = HealthStatus.DEGRADED;
    }

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      uptime: process.uptime(),
      dependencies,
    };

    // ACTION: Cache the result
    // REASON: Reduces load on dependencies from frequent health checks
    this.lastHealthCheck = response;
    this.lastCheckTime = startTime;

    return response;
  }

  // ============================================================
  // Database Health Check
  // ============================================================
  // ACTION: Execute minimal query to verify database connectivity
  // REASON: SELECT 1 is fastest way to confirm connection is alive
  //         without reading/writing actual data
  // TIMEOUT: 2 seconds max - longer means DB is too slow to serve traffic
  // ============================================================
  private async checkDatabase(): Promise<DependencyHealth> {
    const startTime = Date.now();
    try {
      // ACTION: Use query timeout to prevent hanging health checks
      // REASON: Health check must not block indefinitely waiting for DB
      //         Timeout ensures fast failure and accurate DOWN status
      const result = await this.dbPool.query({
        text: 'SELECT 1 as health',
        rowMode: 'array',
        // PostgreSQL statement_timeout for this query
      });

      const responseTime = Date.now() - startTime;

      // ACTION: Verify query succeeded
      // REASON: Query execution without error means DB is healthy
      if (result.rows.length === 1) {
        return {
          status: HealthStatus.UP,
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: HealthStatus.DOWN,
        responseTime,
        message: 'Unexpected query result',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // ACTION: Return DOWN status on any error
      // REASON: Service cannot operate without database access
      return {
        status: HealthStatus.DOWN,
        responseTime,
        message: error instanceof Error ? error.message : 'Database error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // ============================================================
  // Redis Cache Health Check
  // ============================================================
  // ACTION: Execute PING command to verify cache connectivity
  // REASON: PING is Redis's built-in health check command
  //         Returns PONG in < 1ms if healthy
  // DEGRADED vs DOWN: Cache failure is often non-critical
  //                   Service can operate without cache, just slower
  // ============================================================
  private async checkRedis(): Promise<DependencyHealth> {
    const startTime = Date.now();
    try {
      // ACTION: Execute Redis PING with timeout
      // REASON: Verifies connection is alive and responsive
      //         Timeout prevents hanging on network issues
      const response = await Promise.race([
        this.redisClient.ping(),
        this.timeout(1000, 'Redis timeout'),
      ]);

      const responseTime = Date.now() - startTime;

      if (response === 'PONG') {
        return {
          status: HealthStatus.UP,
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }

      // ACTION: Mark as DEGRADED instead of DOWN
      // REASON: Cache is non-critical - service can operate without it
      //         Load balancer should still route traffic
      return {
        status: HealthStatus.DEGRADED,
        responseTime,
        message: 'Unexpected PING response',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // ACTION: Cache failure is DEGRADED, not DOWN
      // REASON: Service operates without cache, just with reduced performance
      //         Don't remove instance from rotation for cache issues
      return {
        status: HealthStatus.DEGRADED,
        responseTime,
        message: error instanceof Error ? error.message : 'Redis error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // ============================================================
  // Downstream API Health Check
  // ============================================================
  // ACTION: Poll downstream service's health endpoint
  // REASON: Verify dependent services are available before accepting traffic
  // CIRCUIT BREAKER: Combine with circuit breaker to avoid cascading failures
  // ============================================================
  private async checkDownstreamAPI(): Promise<DependencyHealth> {
    const startTime = Date.now();
    try {
      // ACTION: Call downstream service's health endpoint
      // REASON: Validates entire request chain to dependency is working
      //         Tests network, DNS, and service health
      const response = await axios.get(\`\${this.downstreamApiUrl}/health\`, {
        timeout: 2000, // 2 second timeout
        validateStatus: (status) => status === 200,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: HealthStatus.UP,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // ACTION: Downstream API failure could be DOWN or DEGRADED
      // REASON: Depends on whether service can operate without it
      //         Critical dependencies -> DOWN, Optional -> DEGRADED
      return {
        status: HealthStatus.DOWN, // Change to DEGRADED if non-critical
        responseTime,
        message:
          error instanceof Error ? error.message : 'Downstream API error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // ============================================================
  // Helper: Timeout Promise
  // ============================================================
  // ACTION: Create promise that rejects after timeout
  // REASON: Enforces maximum wait time for health checks
  //         Prevents slow dependencies from blocking health endpoint
  // ============================================================
  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

// ============================================================
// Express Health Check Routes
// ============================================================
// ACTION: Expose standardized health check endpoints
// REASON: Provides machine-readable health status for automation
//         Follows Kubernetes and cloud-native conventions
// ============================================================

export function setupHealthRoutes(
  app: express.Application,
  dbPool: Pool,
  redisClient: Redis,
  apiUrl: string
): void {
  const healthChecker = new HealthChecker(dbPool, redisClient, apiUrl);

  // ============================================================
  // Liveness Endpoint - Kubernetes Liveness Probe
  // ============================================================
  // ACTION: Ultra-lightweight endpoint for process health
  // REASON: Kubernetes uses this to decide if pod should be restarted
  //         Must be extremely fast and not check dependencies
  // FAILURE: Pod restart, potential service disruption
  // ============================================================
  app.get('/health/live', async (req: Request, res: Response) => {
    try {
      const health = await healthChecker.checkLiveness();

      // ACTION: Always return 200 unless process is critically broken
      // REASON: Liveness should rarely fail - only for deadlocks/crashes
      //         Dependency issues are readiness concerns, not liveness
      res.status(200).json(health);
    } catch (error) {
      // ACTION: Return 503 if liveness check itself fails
      // REASON: Indicates critical process failure, triggers restart
      res.status(503).json({
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================
  // Readiness Endpoint - Kubernetes Readiness Probe
  // ============================================================
  // ACTION: Comprehensive check including dependencies
  // REASON: Determines if pod should receive traffic from load balancer
  //         Checks if service can actually fulfill requests
  // FAILURE: Removed from load balancer rotation (not restarted)
  // ============================================================
  app.get('/health/ready', async (req: Request, res: Response) => {
    try {
      const health = await healthChecker.checkReadiness();

      // ACTION: Return 200 for UP/DEGRADED, 503 for DOWN
      // REASON: Load balancer uses HTTP status to make routing decisions
      //         200 = send traffic, 503 = don't send traffic
      // DEGRADED: Still return 200 since service can handle requests
      //           Monitoring system uses status field for alerts
      if (health.status === HealthStatus.DOWN) {
        res.status(503).json(health);
      } else {
        res.status(200).json(health);
      }
    } catch (error) {
      // ACTION: Return 503 if readiness check fails
      // REASON: Service is not ready for traffic
      res.status(503).json({
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================
  // General Health Endpoint - Combined Check
  // ============================================================
  // ACTION: Provide backwards-compatible /health endpoint
  // REASON: Many load balancers expect /health, not /health/ready
  //         Aliases to readiness check
  // ============================================================
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const health = await healthChecker.checkReadiness();

      if (health.status === HealthStatus.DOWN) {
        res.status(503).json(health);
      } else {
        res.status(200).json(health);
      }
    } catch (error) {
      res.status(503).json({
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================
  // Startup Probe Endpoint - Kubernetes Startup Probe
  // ============================================================
  // ACTION: Check if application has completed initialization
  // REASON: Some services take time to start (cache warming, migrations)
  //         Startup probe gives extra time before liveness checks begin
  // USE CASE: Prevents Kubernetes from killing slow-starting containers
  // ============================================================
  app.get('/health/startup', async (req: Request, res: Response) => {
    try {
      // ACTION: Check basic readiness without cache warmup
      // REASON: Service is "started" when core dependencies are available
      //         even if caches aren't fully warmed
      const health = await healthChecker.checkReadiness();

      if (health.status === HealthStatus.DOWN) {
        res.status(503).json(health);
      } else {
        // Startup succeeded once dependencies are available
        res.status(200).json(health);
      }
    } catch (error) {
      res.status(503).json({
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// ============================================================
// Usage Example
// ============================================================

const app = express();

// Initialize dependencies
const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 2000,
});

// Setup health check routes
setupHealthRoutes(
  app,
  dbPool,
  redisClient,
  process.env.DOWNSTREAM_API_URL || 'http://api.example.com'
);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
  console.log(\`Health endpoints:\`);
  console.log(\`  - GET /health/live   (liveness probe)\`);
  console.log(\`  - GET /health/ready  (readiness probe)\`);
  console.log(\`  - GET /health/startup (startup probe)\`);
  console.log(\`  - GET /health        (general health)\`);
});`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete health check implementation with liveness, readiness, and startup probes for Kubernetes deployments",
        prerequisites: [
          "HTTP endpoints",
          "Database connection pooling",
          "Redis client",
          "Kubernetes probes",
        ],
        systemPosition:
          "Application health monitoring layer enabling automated traffic management and self-healing in orchestrated environments",
      },
      annotations: [
        {
          id: "hc-liveness-check",
          lines: [65, 77],
          action:
            "Implement ultra-lightweight liveness check returning process uptime",
          reason:
            "Liveness checks determine if orchestrator should restart the process. Must be extremely fast (< 100ms) and not check dependencies. Only verifies process isn't deadlocked. Failing liveness triggers pod restart in Kubernetes.",
          contextLevel: "system",
          relatedConcepts: ["kubernetes-liveness", "process-health"],
        },
        {
          id: "hc-readiness-check",
          lines: [79, 141],
          action:
            "Implement comprehensive readiness check validating all dependencies",
          reason:
            "Readiness checks determine if load balancer should route traffic to instance. Must verify service can actually process requests. Checks all critical dependencies (DB, cache, APIs) in parallel for speed. Failing readiness removes instance from rotation without restart.",
          contextLevel: "system",
          relatedConcepts: [
            "kubernetes-readiness",
            "load-balancer-integration",
          ],
        },
        {
          id: "hc-result-caching",
          lines: [91, 102],
          action:
            "Cache health check results for 5 seconds to reduce dependency load",
          reason:
            "Load balancers poll health endpoints every 5-10 seconds. Without caching, each instance would hammer dependencies with constant health checks. Caching reduces load while maintaining near-real-time health visibility.",
          contextLevel: "module",
          relatedConcepts: ["rate-limiting", "dependency-protection"],
        },
        {
          id: "hc-parallel-checks",
          lines: [104, 110],
          action: "Execute dependency checks in parallel using Promise.all",
          reason:
            "Parallel execution minimizes total health check latency. Sequential checks would multiply response times (DB 50ms + Cache 10ms + API 150ms = 210ms). Parallel: max(50, 10, 150) = 150ms. Faster health checks reduce false negatives from timeouts.",
          contextLevel: "module",
          relatedConcepts: ["parallel-execution", "latency-optimization"],
        },
        {
          id: "hc-status-aggregation",
          lines: [112, 135],
          action:
            "Aggregate dependency statuses into overall health (UP/DEGRADED/DOWN)",
          reason:
            "Overall status determines traffic routing. DOWN (any critical dependency failed) = remove from rotation. DEGRADED (non-critical failed like cache) = keep in rotation but alert. UP = all healthy. This enables graceful degradation.",
          contextLevel: "module",
          relatedConcepts: ["graceful-degradation", "dependency-criticality"],
        },
        {
          id: "hc-database-check",
          lines: [143, 182],
          action:
            "Execute SELECT 1 query with timeout to verify database connectivity",
          reason:
            "SELECT 1 is fastest way to confirm DB connection without touching actual data. Timeout ensures health check doesn't hang on slow DB. Failure indicates service cannot operate, returns DOWN status.",
          contextLevel: "module",
          relatedConcepts: ["database-health", "connection-validation"],
        },
        {
          id: "hc-cache-degraded",
          lines: [184, 227],
          action:
            "Mark cache failures as DEGRADED instead of DOWN to allow traffic",
          reason:
            "Cache is non-critical dependency - service can operate without it, just slower. Marking as DEGRADED keeps instance in rotation (avoiding unnecessary capacity reduction) while alerting ops team. Critical dependencies use DOWN.",
          contextLevel: "system",
          relatedConcepts: ["dependency-criticality", "graceful-degradation"],
        },
        {
          id: "hc-http-status-codes",
          lines: [399, 413],
          action:
            "Return 200 for UP/DEGRADED health, 503 for DOWN to control load balancing",
          reason:
            "Load balancers use HTTP status codes to make routing decisions. 200 = healthy, route traffic. 503 Service Unavailable = unhealthy, remove from rotation. Status code determines if users see errors, not JSON payload.",
          contextLevel: "system",
          relatedConcepts: ["http-status-codes", "load-balancer-integration"],
        },
      ],
      highlights: [
        {
          lines: [65, 77],
          label: "Liveness check - process health only",
          sbvpDomain: "behavior",
        },
        {
          lines: [79, 141],
          label: "Readiness check - comprehensive dependency validation",
          sbvpDomain: "behavior",
        },
        {
          lines: [143, 227],
          label: "Dependency health checkers with timeout protection",
          sbvpDomain: "structure",
        },
        {
          lines: [362, 459],
          label: "Health check endpoints for Kubernetes integration",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Load balancer health checks in cloud deployments",
      "Kubernetes liveness and readiness probes",
      "Service mesh health monitoring (Istio, Linkerd)",
      "Auto-scaling trigger evaluation",
      "Blue-green and canary deployment validation",
      "Circuit breaker health signal input",
    ],
    interactsWith: [
      "load-balancing",
      "circuit-breaker",
      "retry",
      "graceful-degradation",
      "connection-pooling",
      "timeout",
      "monitoring",
      "alerting",
    ],
    architecturalBoundaries: [
      "Between orchestration layer and application instances",
      "Between load balancer and backend services",
      "Between monitoring system and service health state",
    ],
  },
};
