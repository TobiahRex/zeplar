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

  implementations: [
    {
      id: "spring-boot-actuator",
      name: "Spring Boot Actuator",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Production-grade health checking for Spring Boot applications with built-in liveness and readiness endpoints. Starting with Spring Boot 2.3, Actuator automatically exposes /actuator/health/liveness and /actuator/health/readiness endpoints for Kubernetes probes. Supports health indicators for common dependencies (database, Redis, Kafka, RabbitMQ, disk space) and custom health indicators via HealthIndicator interface. Provides health groups for composing multiple indicators and conditional health checks based on application lifecycle.",
      links: {
        docs: "https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html",
        github: "https://github.com/spring-projects/spring-boot",
      },
      codeSnippet: `// Enable health endpoints in application.properties
management.endpoint.health.probes.enabled=true
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true
management.endpoints.web.exposure.include=health,info

// Custom health indicator
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Autowired
    private DataSource dataSource;

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT 1");
            return rs.next()
                ? Health.up().withDetail("database", "PostgreSQL").build()
                : Health.down().withDetail("error", "Query failed").build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}

// Kubernetes deployment manifest
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5`,
    },
    {
      id: "fastapi-health",
      name: "FastAPI Health Check Libraries",
      type: "library",
      languages: ["python"],
      description:
        "Health check libraries for FastAPI including fastapi-healthcheck and fastapi-healthchecks. Provides configurable liveness and readiness endpoints with support for PostgreSQL, Redis, and custom dependency checks. Async-first design integrates seamlessly with FastAPI's async capabilities. Supports health check caching to reduce dependency load and structured responses compatible with Kubernetes probes.",
      links: {
        docs: "https://kludex.github.io/fastapi-health/",
        github: "https://github.com/Kludex/fastapi-health",
      },
      codeSnippet: `from fastapi import FastAPI
from fastapi_healthcheck import HealthCheckFactory, healthCheckRoute

app = FastAPI()

# Add health check with dependency checks
_healthChecks = HealthCheckFactory()

# Database health check
@_healthChecks.add_check
def check_database():
    try:
        # Execute simple query
        result = db.execute("SELECT 1")
        return True
    except Exception:
        return False

# Redis health check
@_healthChecks.add_check
def check_redis():
    try:
        redis_client.ping()
        return True
    except Exception:
        return False

# Mount health endpoint
app.add_api_route('/health', healthCheckRoute(factory=_healthChecks))

# Kubernetes deployment
# livenessProbe:
#   httpGet:
#     path: /health
#     port: 8000
#   periodSeconds: 10
# readinessProbe:
#   httpGet:
#     path: /health
#     port: 8000
#   periodSeconds: 5`,
    },
    {
      id: "express-terminus",
      name: "Terminus (Express.js)",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Graceful shutdown and health checks for Express.js and Koa applications. Provides /health/live and /health/ready endpoints with customizable health checks. Supports beforeShutdown hooks for cleanup operations, health signal propagation during shutdown, and configurable health check timeouts. Integrates with Kubernetes probes and AWS ELB health checks.",
      links: {
        docs: "https://github.com/godaddy/terminus",
        github: "https://github.com/godaddy/terminus",
        npm: "https://www.npmjs.com/package/@godaddy/terminus",
      },
      codeSnippet: `const express = require('express');
const http = require('http');
const { createTerminus } = require('@godaddy/terminus');

const app = express();

// Health check functions
async function onHealthCheck() {
  // Check database
  await db.query('SELECT 1');
  // Check Redis
  await redis.ping();
  // All checks passed
  return Promise.resolve();
}

async function onSignal() {
  console.log('Server shutting down...');
  await db.close();
  await redis.disconnect();
}

const server = http.createServer(app);

createTerminus(server, {
  healthChecks: {
    '/health/live': onHealthCheck,
    '/health/ready': onHealthCheck,
  },
  onSignal,
  timeout: 10000,  // Shutdown timeout
  logger: console.log,
});

server.listen(3000);`,
    },
    {
      id: "py-healthcheck",
      name: "py-healthcheck (Flask/Tornado)",
      type: "library",
      languages: ["python"],
      description:
        "Health check library for Flask and Tornado applications. Provides /health endpoint with support for custom health check functions. Features health check result caching (27 seconds for success, 9 seconds for failures) to reduce dependency load. Returns JSON response with status and individual check results. Simple integration via decorator pattern.",
      links: {
        docs: "https://pypi.org/project/py-healthcheck/",
        github: "https://github.com/Runscope/healthcheck",
      },
      codeSnippet: `from flask import Flask
from healthcheck import HealthCheck

app = Flask(__name__)
health = HealthCheck()

# Database health check
def database_check():
    try:
        db.execute('SELECT 1')
        return True, "Database OK"
    except Exception as e:
        return False, str(e)

# Redis health check
def redis_check():
    try:
        redis_client.ping()
        return True, "Redis OK"
    except Exception as e:
        return False, str(e)

health.add_check(database_check)
health.add_check(redis_check)

# Add health endpoint
app.add_url_rule("/health", "healthcheck", view_func=health.run)

# Response format:
# {
#   "status": "success",
#   "results": [
#     {"checker": "database_check", "output": "Database OK", "passed": true},
#     {"checker": "redis_check", "output": "Redis OK", "passed": true}
#   ]
# }`,
    },
    {
      id: "go-health",
      name: "Go Health Check Libraries",
      type: "library",
      languages: ["go"],
      description:
        "Health check libraries for Go including health by alexliesenfeld and healthcheck. Provides composable health checks for databases, HTTP endpoints, and custom dependencies. Supports periodic background health checking with configurable intervals, health check timeouts, and concurrent execution. Integrates with standard library http.Handler for easy mounting in existing applications.",
      links: {
        docs: "https://github.com/alexliesenfeld/health",
        github: "https://github.com/alexliesenfeld/health",
      },
      codeSnippet: `package main

import (
    "context"
    "database/sql"
    "net/http"
    "time"

    "github.com/alexliesenfeld/health"
)

func main() {
    db, _ := sql.Open("postgres", "...")

    // Create health checker
    checker := health.NewChecker(
        // Database health check
        health.WithCheck(health.Check{
            Name: "database",
            Check: func(ctx context.Context) error {
                return db.PingContext(ctx)
            },
            Timeout:        2 * time.Second,
            MaxTimeInError: 30 * time.Second,
        }),

        // Redis health check
        health.WithCheck(health.Check{
            Name: "redis",
            Check: func(ctx context.Context) error {
                return redisClient.Ping(ctx).Err()
            },
            Timeout: 1 * time.Second,
        }),
    )

    // Mount health endpoints
    http.Handle("/health/live", health.NewHandler(checker))
    http.Handle("/health/ready", health.NewHandler(checker))

    http.ListenAndServe(":8080", nil)
}`,
    },
    {
      id: "aws-elb-health-check",
      name: "AWS Elastic Load Balancer Health Checks",
      type: "service",
      languages: ["any"],
      description:
        "Built-in health checking for AWS Application Load Balancer (ALB), Network Load Balancer (NLB), and Classic Load Balancer. Supports HTTP, HTTPS, TCP, and SSL health checks with configurable interval (5-300 seconds), timeout (2-120 seconds), healthy/unhealthy thresholds. Features active health checks (periodic probing) and passive health checks (monitoring actual traffic responses). Integrates with Auto Scaling to replace unhealthy instances automatically.",
      links: {
        docs: "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html",
      },
      codeSnippet: `# Terraform configuration for ALB health check
resource "aws_lb_target_group" "app" {
  name     = "app-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# CloudFormation configuration
HealthCheckPath: /health
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
Matcher:
  HttpCode: 200`,
    },
    {
      id: "gcp-health-check",
      name: "Google Cloud Load Balancer Health Checks",
      type: "service",
      languages: ["any"],
      description:
        "Configurable health checks for Google Cloud load balancers with support for HTTP, HTTPS, TCP, SSL, and HTTP/2 protocols. Features include regional and global health checks, configurable check intervals (1-300 seconds), timeout durations, and healthy/unhealthy thresholds. Supports legacy health checks for backward compatibility and autohealing for managed instance groups. Provides detailed health check logging for debugging.",
      links: {
        docs: "https://cloud.google.com/load-balancing/docs/health-check-concepts",
      },
      codeSnippet: `# gcloud command to create health check
gcloud compute health-checks create http app-health-check \\
    --port=8080 \\
    --request-path=/health \\
    --check-interval=10s \\
    --timeout=5s \\
    --healthy-threshold=2 \\
    --unhealthy-threshold=3

# Terraform configuration
resource "google_compute_health_check" "app" {
  name                = "app-health-check"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}`,
    },
    {
      id: "kubernetes-probes",
      name: "Kubernetes Health Probes",
      type: "platform",
      languages: ["any"],
      description:
        "Native health checking in Kubernetes with three probe types: liveness (restart unhealthy containers), readiness (remove from service endpoints), and startup (delay liveness checks for slow-starting containers). Supports HTTP GET, TCP socket, and exec command probe mechanisms. Configurable parameters include initialDelaySeconds, periodSeconds, timeoutSeconds, successThreshold, and failureThreshold. Probes enable self-healing and zero-downtime deployments.",
      links: {
        docs: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
      },
      codeSnippet: `apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:1.0
    ports:
    - containerPort: 8080

    # Liveness probe - restart if fails
    livenessProbe:
      httpGet:
        path: /health/live
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3

    # Readiness probe - remove from service if fails
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2

    # Startup probe - protect slow starts
    startupProbe:
      httpGet:
        path: /health/startup
        port: 8080
      periodSeconds: 5
      failureThreshold: 30  # Allow up to 150s startup time`,
    },
    {
      id: "consul-health-check",
      name: "HashiCorp Consul Health Checks",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh health checking and service discovery with Consul. Supports multiple check types: HTTP, TCP, script, TTL, Docker, and gRPC. Health checks integrate with service catalog to automatically route traffic away from unhealthy instances. Features include check intervals, deregister_critical_service_after for automatic cleanup, and health check passing/warning/critical states. Enables sophisticated service mesh topologies with automatic failover.",
      links: {
        docs: "https://developer.hashicorp.com/consul/docs/services/configuration/checks-configuration-reference",
        github: "https://github.com/hashicorp/consul",
      },
      codeSnippet: `{
  "service": {
    "name": "web",
    "port": 8080,
    "checks": [
      {
        "name": "HTTP Health Check",
        "http": "http://localhost:8080/health",
        "interval": "10s",
        "timeout": "2s"
      },
      {
        "name": "TCP Port Check",
        "tcp": "localhost:8080",
        "interval": "10s",
        "timeout": "1s"
      },
      {
        "name": "Script Check",
        "args": ["/usr/local/bin/check-app.sh"],
        "interval": "30s",
        "timeout": "5s"
      }
    ],
    "deregister_critical_service_after": "90m"
  }
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-eureka",
      systemName: "Netflix Microservices with Eureka",
      howUsed:
        "Netflix operates thousands of microservices handling billions of requests daily, using Eureka service discovery for health-based traffic routing. Each microservice exposes /health endpoints that Eureka polls every 30 seconds to maintain service registry health. When instances become unhealthy (failing 3 consecutive health checks), Eureka removes them from the registry, preventing new requests from routing to failing instances. Netflix's health checks validate critical dependencies: Cassandra database connectivity, Redis cache availability, and downstream API reachability. The architecture distinguishes between liveness (is the JVM responsive?) and readiness (can it serve traffic?). Pattern composition: Health Checks + Service Discovery (Eureka) + Circuit Breaker (Hystrix prevents cascading failures) + Load Balancing (Ribbon uses health data for routing) + Auto Scaling (unhealthy instances trigger replacements). Rationale: With thousands of ephemeral instances launching and terminating constantly, manual health monitoring is impossible. Automated health checks enable self-healing infrastructure where failing instances are detected and replaced within minutes without human intervention. During regional AWS outages, health checks detect degraded instances and shift traffic to healthy regions, maintaining 99.99% uptime. Impact: Reduced mean time to detection (MTTD) from hours to seconds; enabled zero-downtime deployments by validating new versions before switching traffic; prevented cascading failures during dependency outages by removing unhealthy instances before user impact; supported 1000+ production deployments per day with automated health validation preventing bad releases from reaching users.",
      source:
        "https://netflixtechblog.com/netflix-oss-and-spring-boot-coming-full-circle-4855947713a0",
    },
    {
      systemId: "kubernetes-production",
      systemName: "Kubernetes Self-Healing Infrastructure",
      howUsed:
        "Kubernetes uses health checks (liveness, readiness, startup probes) as the foundation for self-healing container orchestration across millions of production clusters. Liveness probes detect crashed, deadlocked, or hung containers and trigger automatic restarts—Shopify runs 100,000+ containers with liveness probes preventing manual intervention for common failure modes like memory leaks and deadlocks. Readiness probes control traffic flow: during rolling updates, new pods must pass readiness checks before receiving traffic, enabling zero-downtime deployments. Startup probes protect slow-starting applications (Java apps with 60+ second startup times) by delaying liveness checks until initialization completes. Health checks integrate with Services and Ingress controllers: unhealthy pods are removed from endpoint lists, preventing load balancers from routing to failed instances. Pattern composition: Health Checks + Rolling Updates (progressive deployment with validation) + HorizontalPodAutoscaler (scale based on health + metrics) + PodDisruptionBudgets (maintain minimum healthy pods during disruptions). Rationale: Container orchestration at scale requires automated failure detection and recovery. Manual monitoring cannot track health across thousands of ephemeral pods launching, crashing, and relocating constantly. Health checks enable Kubernetes' self-healing promise: detect failures in seconds, restart unhealthy pods automatically, prevent traffic to instances not ready, and maintain SLAs without operator intervention. Impact: Shopify achieved 99.98% uptime across 100,000+ pods using health checks for automatic failure recovery; reduced incident response time by 90% by eliminating manual restarts; enabled safe deployments of 50,000+ releases per day with health-check-gated rollouts preventing bad versions from impacting users; handled infrastructure failures (node crashes, network partitions) transparently by detecting and replacing unhealthy pods within 30 seconds.",
      source:
        "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
    },
    {
      systemId: "aws-elb-autoscaling",
      systemName: "AWS Auto Scaling with ELB Health Checks",
      howUsed:
        "AWS Elastic Load Balancer (ELB) health checks enable self-healing auto-scaling groups serving millions of customers including Airbnb, Lyft, and Slack. ELB performs HTTP health checks every 30 seconds against /health endpoints on EC2 instances in target groups. Instances failing 2 consecutive checks (unhealthy threshold) are marked unhealthy and removed from load balancer rotation—no new connections are routed, existing connections drain gracefully. Auto Scaling integrates with ELB health: when instances become unhealthy, Auto Scaling terminates them and launches replacements to maintain desired capacity. Health checks validate application-level functionality, not just instance reachability: database connectivity, cache availability, downstream API responsiveness. Pattern composition: Health Checks + Elastic Load Balancing (distribute traffic to healthy instances) + Auto Scaling (replace unhealthy instances) + CloudWatch Alarms (aggregate health metrics for alerting) + Multi-AZ Deployment (health checks detect AZ failures and shift traffic). Rationale: EC2 instance health is not binary—instances can be running but application-level failures (database connection exhaustion, memory leaks, dependency outages) prevent serving traffic. Health checks detect these failure modes, preventing user-facing errors. Auto Scaling combined with health checks provides self-healing: failing instances are automatically replaced, maintaining capacity and availability without manual intervention. Impact: Airbnb scaled to 150M users with 99.9% uptime using ELB health checks for automatic failure detection; reduced incident response time from 15 minutes (manual detection) to 1 minute (automated health checks); prevented cascading failures during AWS AZ outages by detecting and removing degraded instances; enabled zero-downtime deployments by validating new AMIs via health checks before switching traffic.",
      source:
        "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html",
    },
    {
      systemId: "spring-boot-production",
      systemName: "Spring Boot Applications with Actuator",
      howUsed:
        "Spring Boot Actuator provides production-grade health checking for millions of Java applications including those at Stripe, Booking.com, and LinkedIn. Actuator exposes /actuator/health/liveness and /actuator/health/readiness endpoints that Kubernetes, AWS ELB, and Azure health probes use for traffic management. Health indicators validate critical dependencies: database connection pools (DataSourceHealthIndicator), Redis cache (RedisHealthIndicator), disk space (DiskSpaceHealthIndicator), and custom application logic. Liveness checks are lightweight (process responsiveness only) to avoid false positives that trigger unnecessary restarts, while readiness checks comprehensively validate all dependencies before accepting traffic. Actuator supports health groups for composing multiple indicators and conditional health checks that activate based on application lifecycle events. Pattern composition: Health Checks + Spring Boot Actuator (unified monitoring) + Micrometer Metrics (health trends) + Kubernetes Probes (orchestration integration) + Circuit Breaker (Resilience4j coordinates with health state). Rationale: Enterprise Java applications run in complex environments with numerous dependencies (databases, message queues, APIs). Manual health validation is error-prone and slow. Actuator provides standardized, extensible health checking that integrates with cloud-native infrastructure, enabling automated deployment validation, traffic management, and failure recovery. The framework-level integration ensures consistent health checking across all Spring Boot applications in an organization. Impact: Stripe processes billions of API requests daily with 99.99% uptime using Actuator health checks for deployment validation and traffic routing; reduced false positive restarts by 80% using separate liveness (simple) and readiness (comprehensive) probes; detected and recovered from database connection pool exhaustion within seconds via automatic traffic removal; enabled safe Kubernetes deployments with health-check-gated rollouts preventing regressions from reaching production.",
      source:
        "https://spring.io/blog/2020/03/25/liveness-and-readiness-probes-with-spring-boot/",
    },
    {
      systemId: "google-cloud-production",
      systemName: "Google Cloud Platform Health Checks",
      howUsed:
        "Google Cloud Platform health checks enable self-healing infrastructure for companies including Spotify, Snap, and Twitter running on GCP. Cloud Load Balancing uses health checks to route traffic only to healthy backend instances across regions and zones. Health checks support HTTP, HTTPS, TCP, SSL, and HTTP/2 protocols with configurable intervals (1-300 seconds), timeouts, and healthy/unhealthy thresholds. GCP distinguishes between regional health checks (single region load balancers) and global health checks (cross-region load balancing) for geographic failover. Managed instance groups integrate with health checks for autohealing: instances failing health checks are automatically deleted and recreated, maintaining fleet health without operator intervention. Health checks enable blue-green and canary deployments: new versions are deployed to separate instance groups, validated via health checks, and promoted to production only after passing health thresholds. Pattern composition: Health Checks + Cloud Load Balancing (global traffic distribution) + Managed Instance Groups (autohealing) + Cloud Monitoring (health metrics aggregation) + Multi-Region Deployment (health-based geographic failover). Rationale: GCP's global infrastructure spans 35+ regions—manual health monitoring across thousands of instances is impossible. Automated health checks enable intelligent traffic routing (avoid unhealthy zones), self-healing (replace failing instances), and safe deployments (validate before promoting). Health checks form the foundation of GCP's high-availability promise, detecting and recovering from failures at infrastructure and application layers. Impact: Spotify serves 500M users with 99.9% uptime using GCP health checks for automatic failover across regions; reduced incident response time from 10 minutes to 30 seconds by automating detection and traffic shifting; prevented cascading failures during zonal outages by health-check-driven traffic migration; enabled 10,000+ weekly deployments with health-validated canary releases preventing bad code from impacting users.",
      source:
        "https://cloud.google.com/load-balancing/docs/health-check-concepts",
    },
  ],

  tags: [
    "reliability",
    "observability",
    "health-monitoring",
    "kubernetes",
    "self-healing",
    "load-balancing",
  ],
  difficulty: "intermediate",
};
