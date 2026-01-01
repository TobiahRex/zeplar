import type { Pattern } from "../schema";

export const fixedInterval: Pattern = {
  id: "fixed-interval",
  slug: "fixed-interval",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retry → 🔢 Fixed Interval",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retry",
    level: 4,
  },

  concept: {
    name: "Fixed Interval",
    emoji: "🔢",
    tagline: "Constant delay",
    definition:
      "Fixed Interval Retry is a retry strategy that waits a constant, unchanging duration between retry attempts, providing predictable retry behavior with uniform spacing between operations. Like a metronome that maintains steady rhythm regardless of musical tempo changes, fixed interval retries use the same delay for every attempt: 1 second, then 1 second, then 1 second. When an operation fails, the retry handler waits exactly the configured interval before attempting again, repeating this pattern until success or maximum attempts are exhausted. This contrasts with exponential backoff (increasing delays) or immediate retry (zero delay). The pattern provides deterministic, predictable retry timing that simplifies capacity planning and makes retry behavior easy to reason about. It's particularly effective when failures are truly random and uncorrelated with system load—network packet loss, transient service blips, or brief availability gaps. However, fixed intervals can be problematic during sustained outages because they maintain constant retry pressure on struggling services rather than giving them progressively more recovery time. Implementation typically pairs fixed intervals with jitter (randomized delay variation) to prevent retry synchronization across multiple clients.",
    problemSolved:
      "Some failure scenarios benefit from consistent, predictable retry timing rather than adaptive backoff strategies. When failures are caused by brief, random transient issues like network packet drops or momentary service unavailability, there's no benefit to increasing delays between retries—the service will recover based on its own timeline, not retry frequency. In these cases, exponential backoff's progressively longer delays unnecessarily extend total recovery time. Fixed interval retries ensure attempts happen at regular intervals, maximizing the chance of quick recovery when the transient issue resolves. Additionally, fixed intervals provide operational predictability: capacity planning can account for constant retry load, monitoring dashboards show steady retry rates, and SLA calculations use deterministic retry timings. The pattern is also simpler to implement and debug than sophisticated backoff algorithms, reducing complexity in systems where retry behavior doesn't significantly impact backend load.",
    tradeoffs: {
      pros: [
        "Simple implementation and easy to understand behavior",
        "Predictable retry timing for capacity planning and monitoring",
        "Fast recovery when transient issues resolve quickly",
        "No accumulating delays like exponential backoff",
        "Deterministic total retry duration for fixed attempt counts",
      ],
      cons: [
        "Maintains constant load on struggling services during outages",
        "Can contribute to retry storms if many clients retry simultaneously",
        "No adaptive behavior for different failure types or durations",
        "May waste resources retrying operations doomed to fail",
        "Lacks the graceful degradation of exponential backoff strategies",
      ],
    },
    relatedPatterns: [
      "retry",
      "exponential-backoff",
      "jitter",
      "circuit-breaker",
      "retry-budget",
      "linear-backoff",
    ],
  },

  structure: {
    participants: [
      {
        name: "Retry Coordinator",
        role: "Retry Orchestrator",
        responsibilities: [
          "Track retry attempt count",
          "Wait fixed interval between attempts",
          "Enforce maximum retry limit",
          "Return final result or error",
        ],
      },
      {
        name: "Delay Timer",
        role: "Fixed Interval Provider",
        responsibilities: [
          "Provide constant delay duration",
          "Add optional jitter to prevent synchronization",
          "Ensure non-blocking waits",
        ],
      },
      {
        name: "Operation Executor",
        role: "Task Performer",
        responsibilities: [
          "Execute the retry-able operation",
          "Report success or failure",
          "Handle operation-specific errors",
        ],
      },
    ],
    diagram: `graph TB
    Start([Attempt Operation]) --> Try[Execute Operation]
    Try --> Success{Success?}
    Success -->|Yes| Return([Return Result])
    Success -->|No| CheckMax{Max Attempts<br/>Reached?}
    CheckMax -->|Yes| Fail([Throw Error])
    CheckMax -->|No| Wait[⏱️ Wait Fixed Interval<br/>+ Optional Jitter]
    Wait --> Inc[Increment Attempt]
    Inc --> Try

    style Start fill:#e1f5e1
    style Return fill:#e1f5e1
    style Fail fill:#ffe1e1
    style Wait fill:#fff4e1`,
    flow: [
      {
        step: 1,
        actor: "Retry Coordinator",
        action: "Initialize",
        description: "Set attempt counter to 0, prepare for retry loop",
      },
      {
        step: 2,
        actor: "Operation Executor",
        action: "Execute",
        description: "Attempt the operation and capture result or error",
      },
      {
        step: 3,
        actor: "Retry Coordinator",
        action: "Check Result",
        description:
          "If success, return result immediately. If failure and under retry limit, continue.",
      },
      {
        step: 4,
        actor: "Delay Timer",
        action: "Wait",
        description:
          "Sleep for fixed interval (e.g., 1000ms) plus optional jitter",
      },
      {
        step: 5,
        actor: "Retry Coordinator",
        action: "Retry",
        description: "Increment attempt counter and return to step 2",
      },
    ],
    invariants: [
      "Delay between attempts must be constant (same value for all retries)",
      "Jitter, if used, must be bounded and repeatable",
      "Retry attempts must not exceed configured maximum",
      "First attempt should execute immediately without delay",
      "Last retry attempt should not be followed by a delay",
    ],
  },

  codeExamples: [
    {
      id: "fixed-interval-ts-basic",
      language: "typescript",
      title: "Fixed Interval Retry with Configurable Delay",
      description:
        "A retry mechanism that waits a constant duration between attempts, providing predictable retry behavior for transient failures with optional jitter to prevent thundering herd.",
      code: `// Fixed Interval Retry Implementation
// Constant delay between retry attempts for predictable behavior

type RetryableOperation<T> = () => Promise<T>;

interface RetryConfig {
  maxAttempts: number;
  intervalMs: number;
  jitterMs?: number; // Optional randomization to prevent thundering herd
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  attempts: number;
  totalTime: number;
  errors: Error[];
}

// Fixed interval retry executor
class FixedIntervalRetry {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig) {
    this.config = {
      maxAttempts: config.maxAttempts,
      intervalMs: config.intervalMs,
      jitterMs: config.jitterMs ?? 0,
      onRetry: config.onRetry ?? (() => {}),
    };
  }

  async execute<T>(operation: RetryableOperation<T>): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      attempt++;

      try {
        console.log(\`[ATTEMPT \${attempt}/\${this.config.maxAttempts}] Executing...\`);

        const data = await operation();

        const totalTime = Date.now() - startTime;
        console.log(\`[SUCCESS] Completed on attempt \${attempt} (total: \${totalTime}ms)\`);

        return {
          success: true,
          data,
          attempts: attempt,
          totalTime,
          errors,
        };
      } catch (error) {
        const err = error as Error;
        errors.push(err);
        console.log(\`[FAILURE] Attempt \${attempt} failed: \${err.message}\`);

        // If this was the last attempt, don't wait
        if (attempt >= this.config.maxAttempts) {
          console.log(\`[EXHAUSTED] All \${this.config.maxAttempts} attempts failed\`);
          break;
        }

        // Calculate delay: fixed interval + optional jitter
        const jitter = this.config.jitterMs
          ? Math.random() * this.config.jitterMs
          : 0;
        const delay = this.config.intervalMs + jitter;

        console.log(\`[WAIT] Waiting \${Math.round(delay)}ms before retry...\`);

        // Notify callback
        this.config.onRetry(attempt, err);

        // Wait fixed interval before next attempt
        await this.sleep(delay);
      }
    }

    const totalTime = Date.now() - startTime;
    return {
      success: false,
      attempts: attempt,
      totalTime,
      errors,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Demo service with various failure modes
class UnreliableService {
  private callCount = 0;
  private readonly failureMode: "transient" | "sustained" | "intermittent";

  constructor(failureMode: "transient" | "sustained" | "intermittent") {
    this.failureMode = failureMode;
  }

  async fetch(): Promise<string> {
    this.callCount++;

    switch (this.failureMode) {
      case "transient":
        // Fails first 2 attempts, then succeeds
        if (this.callCount <= 2) {
          throw new Error("Network timeout");
        }
        return "Success: data retrieved";

      case "sustained":
        // Always fails (simulates outage)
        throw new Error("Service unavailable");

      case "intermittent":
        // Randomly fails 50% of the time
        if (Math.random() < 0.5) {
          throw new Error("Temporary glitch");
        }
        return "Success: data retrieved";

      default:
        return "Success: data retrieved";
    }
  }

  reset(): void {
    this.callCount = 0;
  }
}

// Helper function for creating retry operations
async function withFixedRetry<T>(
  operation: RetryableOperation<T>,
  config: RetryConfig
): Promise<RetryResult<T>> {
  const retry = new FixedIntervalRetry(config);
  return retry.execute(operation);
}

// Demo scenarios
async function demo() {
  console.log("\\n🔢 Fixed Interval Retry Demo\\n");

  // Scenario 1: Transient failure (recovers after 2 attempts)
  console.log("=== Scenario 1: Transient Failure ===");
  console.log("Service fails twice, then recovers\\n");

  const service1 = new UnreliableService("transient");
  const result1 = await withFixedRetry(() => service1.fetch(), {
    maxAttempts: 5,
    intervalMs: 500,
    onRetry: (attempt, error) => {
      console.log(\`  → Retry callback: attempt \${attempt}, error: \${error.message}\`);
    },
  });

  console.log("\\nResult:", {
    success: result1.success,
    attempts: result1.attempts,
    totalTime: \`\${result1.totalTime}ms\`,
  });

  // Scenario 2: With jitter to prevent thundering herd
  console.log("\\n\\n=== Scenario 2: Fixed Interval + Jitter ===");
  console.log("Adds randomization to prevent synchronized retries\\n");

  const service2 = new UnreliableService("transient");
  const result2 = await withFixedRetry(() => service2.fetch(), {
    maxAttempts: 5,
    intervalMs: 500,
    jitterMs: 200, // Add 0-200ms random jitter
  });

  console.log("\\nResult:", {
    success: result2.success,
    attempts: result2.attempts,
    totalTime: \`\${result2.totalTime}ms\`,
  });

  // Scenario 3: Sustained failure (service down)
  console.log("\\n\\n=== Scenario 3: Sustained Failure ===");
  console.log("Service is down, all retries fail\\n");

  const service3 = new UnreliableService("sustained");
  const result3 = await withFixedRetry(() => service3.fetch(), {
    maxAttempts: 3,
    intervalMs: 300,
  });

  console.log("\\nResult:", {
    success: result3.success,
    attempts: result3.attempts,
    totalTime: \`\${result3.totalTime}ms\`,
    errorCount: result3.errors.length,
  });

  // Scenario 4: Compare timing predictability
  console.log("\\n\\n=== Scenario 4: Predictable Timing ===");
  console.log("Fixed interval provides deterministic retry schedule\\n");

  const service4 = new UnreliableService("sustained");
  const config = { maxAttempts: 4, intervalMs: 400 };

  console.log(\`Configuration: \${config.maxAttempts} attempts, \${config.intervalMs}ms interval\`);
  console.log(
    \`Expected total time: ~\${(config.maxAttempts - 1) * config.intervalMs}ms (for delays)\`
  );
  console.log("Expected schedule: 0ms, 400ms, 800ms, 1200ms\\n");

  const result4 = await withFixedRetry(() => service4.fetch(), config);

  console.log(\`\\nActual total time: \${result4.totalTime}ms\`);
  console.log(
    "Notice how timing is predictable - ideal for capacity planning!"
  );

  // Scenario 5: Demonstrate use case - health check
  console.log("\\n\\n=== Scenario 5: Health Check Use Case ===");
  console.log("Fixed interval ideal for periodic health checks\\n");

  let healthCheckCount = 0;
  const healthCheck = async (): Promise<string> => {
    healthCheckCount++;
    console.log(\`[HEALTH CHECK \${healthCheckCount}] Checking service status...\`);

    if (healthCheckCount <= 2) {
      throw new Error("Service not ready");
    }
    return "Service healthy";
  };

  const result5 = await withFixedRetry(healthCheck, {
    maxAttempts: 5,
    intervalMs: 600,
  });

  console.log("\\n✅ Benefits of Fixed Interval:");
  console.log("  1. Simple to implement and understand");
  console.log("  2. Predictable retry schedule for monitoring");
  console.log("  3. Fast recovery when transient issues resolve");
  console.log("  4. Deterministic total time for fixed attempts");
  console.log("  5. Works well for brief, random failures");

  console.log("\\n⚠️  Drawbacks of Fixed Interval:");
  console.log("  1. Maintains pressure on struggling services");
  console.log("  2. Can cause retry storms without jitter");
  console.log("  3. No adaptive behavior for different failure types");
  console.log(
    "  4. May waste resources on operations destined to fail"
  );
}

// Run demo
demo().catch(console.error);`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Health Check Polling - Fixed interval retries are commonly used in health check systems that poll service endpoints at regular intervals to detect availability; when a monitoring system checks if a database is healthy every 30 seconds, it uses fixed interval polling to retry failed health checks—if the first check fails due to temporary network blip, it retries after exactly 30 seconds rather than backing off; this placement ensures consistent monitoring coverage and predictable alert timing; health check systems like Kubernetes liveness/readiness probes, Consul health checks, and custom monitoring scripts all use fixed intervals because service availability is independent of check frequency—waiting longer doesn't make the service more likely to be healthy.",
      "Periodic Task Schedulers - Cron jobs and scheduled task systems implement fixed interval retries for failed task executions; when a nightly ETL job fails at 2:00 AM due to database lock timeout, the scheduler retries after a fixed interval (e.g., 5 minutes) rather than exponentially backing off; this placement maintains predictable task execution windows and prevents schedule drift—if a daily job uses exponential backoff, failed jobs could eventually be delayed by hours; task scheduling frameworks like Quartz, Celery Beat, and AWS EventBridge use fixed intervals to ensure tasks complete within their allotted time windows.",
      "Database Connection Retry - Some database drivers and connection pools use fixed interval retries when attempting to establish initial connections during application startup; when an application starts and tries to connect to a database that's not yet ready (container still initializing, DNS not propagated), the driver retries every 2 seconds for up to 30 seconds; this placement provides predictable startup behavior and bounded startup time—critical for container orchestration health checks that timeout after 60 seconds; database drivers for PostgreSQL, MySQL, and MongoDB support fixed interval connection retry configuration.",
      "API Client Request Retry for Idempotent Operations - HTTP clients use fixed interval retries for idempotent requests (GET, PUT, DELETE) to external APIs when the operation's outcome doesn't depend on retry timing; when fetching user profile data from an external API, the client retries failed requests every 1 second because the profile data is either available or not—waiting longer doesn't change the likelihood of success; this placement balances quick recovery from transient network issues with simplicity; API client libraries often default to fixed intervals for GET requests while using exponential backoff for non-idempotent POST requests.",
      "Message Queue Visibility Timeout Retry - Message queue consumers use fixed interval retries implicitly through visibility timeouts; when an SQS consumer fails to process a message, the message becomes visible again after a fixed timeout (e.g., 30 seconds), effectively implementing fixed interval retry; this placement is enforced by the queue infrastructure rather than application code, providing built-in retry semantics; the fixed interval ensures messages are retried regularly without accumulating delays that would create processing backlogs during transient failures.",
    ],
    architecturalBoundaries: [
      "External Service Polling Boundary - Fixed interval operates at the boundary where systems poll external services for status updates, health checks, or data availability; this boundary is characterized by the polling system having no direct notification mechanism from the external service, requiring regular checks; when a client polls an async job status endpoint every 5 seconds until the job completes, fixed interval ensures consistent check frequency; this boundary differs from event-driven architectures where exponential backoff would be more appropriate; the polling boundary benefits from predictable check timing for capacity planning and consistent user experience (progress bars update at regular intervals).",
      "Initial Connection Establishment Boundary - Fixed interval sits at the boundary of initial connection setup to databases, message brokers, or external services during application bootstrap; this boundary is distinct from operational retries because failures here prevent the application from starting, requiring bounded retry windows; when a Spring Boot application retries Redis connection during startup, fixed interval (2s, 2s, 2s) provides predictable startup time within container health check windows (default 30s timeout); this boundary requires fast failure detection and bounded total retry time, making fixed intervals more suitable than exponential backoff which could exceed health check timeouts.",
      "Scheduled Task Execution Boundary - Fixed interval operates at the boundary between task schedulers and task execution, managing retries for failed scheduled jobs; this boundary is unique because tasks have time windows (hourly, daily, monthly) that retries must respect; when a cron job scheduled for 3:00 AM fails, fixed interval retry (10min, 10min, 10min) ensures the job completes before the next day's execution at 3:00 AM; this boundary requires retry timing that doesn't cause schedule overlap or drift, making fixed intervals essential for maintaining predictable scheduling.",
      "Idempotent Operation Retry Boundary - Fixed interval bridges the boundary between application logic and external systems for operations guaranteed to be idempotent; this boundary is characterized by operations whose outcome is independent of retry timing; when fetching a user's account balance from a banking API, the balance is either available or not—exponential backoff doesn't improve success probability but delays recovery from transient failures; this boundary benefits from fixed intervals because retry timing doesn't affect backend load (reads don't accumulate like writes) and faster retries improve user experience for transient issues.",
    ],
    interactsWith: [
      "retry",
      "jitter",
      "exponential-backoff",
      "circuit-breaker",
      "timeout",
      "health-check",
    ],
  },

  implementations: [
    {
      id: "kubernetes-probe",
      name: "Kubernetes Liveness/Readiness Probes",
      type: "platform",
      languages: ["any"],
      description:
        "Container health checks with fixed interval polling. Configurable period (default 10s) for retrying failed probes to determine container health status.",
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
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10        # Fixed 10s interval between checks
      timeoutSeconds: 5
      successThreshold: 1
      failureThreshold: 3      # Retry 3 times before restart
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5          # Fixed 5s interval
      failureThreshold: 3`,
    },
    {
      id: "spring-retry-fixed",
      name: "Spring Retry Fixed Backoff",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring framework retry module with fixed backoff policy. Annotation-based configuration for constant delay between retry attempts.",
      links: {
        docs: "https://docs.spring.io/spring-retry/docs/current/reference/html5/",
        github: "https://github.com/spring-projects/spring-retry",
      },
      codeSnippet: `@Service
public class DataService {

    @Retryable(
        value = {TransientDataAccessException.class},
        maxAttempts = 5,
        backoff = @Backoff(delay = 1000)  // Fixed 1 second delay
    )
    public Data fetchData(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new TransientDataAccessException("Not found"));
    }

    @Recover
    public Data recover(TransientDataAccessException e, String id) {
        return getCachedData(id);
    }
}`,
    },
    {
      id: "celery-retry",
      name: "Celery Task Retry",
      type: "library",
      languages: ["python"],
      description:
        "Python distributed task queue with configurable retry delays. Supports fixed countdown for constant interval between task retry attempts.",
      links: {
        docs: "https://docs.celeryq.dev/en/stable/userguide/tasks.html#retrying",
      },
      codeSnippet: `from celery import Task

class DatabaseTask(Task):
    autoretry_for = (DatabaseError,)
    retry_kwargs = {'max_retries': 5}
    retry_backoff = False  # Disable exponential backoff
    default_retry_delay = 30  # Fixed 30 second delay

@app.task(bind=True, base=DatabaseTask)
def process_record(self, record_id):
    try:
        return process(record_id)
    except TemporaryError as exc:
        # Retry with fixed 60 second delay
        raise self.retry(exc=exc, countdown=60)`,
    },
    {
      id: "consul-health",
      name: "Consul Health Checks",
      type: "service",
      languages: ["any"],
      description:
        "Service discovery health checking with fixed interval polling. Configurable check intervals for monitoring service availability.",
      links: {
        docs: "https://www.consul.io/docs/discovery/checks",
      },
      codeSnippet: `{
  "service": {
    "name": "web",
    "port": 8080,
    "check": {
      "http": "http://localhost:8080/health",
      "interval": "10s",        # Fixed 10 second interval
      "timeout": "2s"
    }
  }
}

# Or with retry behavior
{
  "check": {
    "id": "api-check",
    "http": "http://localhost:8080/api/health",
    "interval": "30s",          # Check every 30 seconds
    "timeout": "5s",
    "success_before_passing": 3,  # Retry 3 times before marking healthy
    "failures_before_critical": 2  # Fixed interval retries
  }
}`,
    },
    {
      id: "axios-retry-fixed",
      name: "axios-retry with Fixed Delay",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios HTTP client retry plugin supporting fixed delay configuration. Custom retry delay function for constant intervals.",
      links: {
        github: "https://github.com/softonic/axios-retry",
        npm: "https://www.npmjs.com/package/axios-retry",
      },
      codeSnippet: `import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure with fixed delay
axiosRetry(axios, {
  retries: 5,
  retryDelay: () => 1000, // Always return 1000ms
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

// Or with jitter to prevent thundering herd
axiosRetry(axios, {
  retries: 3,
  retryDelay: () => {
    const baseDelay = 2000; // 2 second fixed delay
    const jitter = Math.random() * 500; // 0-500ms jitter
    return baseDelay + jitter;
  }
});`,
    },
  ],

  usedInSystems: [
    {
      systemId: "kubernetes-probes",
      systemName: "Kubernetes Health Probes",
      howUsed:
        "Kubernetes uses fixed interval health probes (liveness, readiness, startup) to monitor container health at consistent intervals. When a liveness probe fails, Kubernetes retries every periodSeconds (default 10s) up to failureThreshold times before restarting the container. The fixed interval ensures predictable health check overhead and deterministic time-to-restart calculations—if a container's probe fails 3 times with 10s intervals, Kubernetes restarts it after 30 seconds. This predictability is critical for capacity planning (health check traffic is constant) and SLA compliance (restart time is bounded). Pattern composition: Fixed Interval Health Checks + Failure Threshold + Container Restart. Rationale: Container health is binary (healthy/unhealthy) and independent of check frequency—exponential backoff would delay restart decisions without improving accuracy. Impact: Enabled Google, Microsoft, and AWS to run billions of containers with predictable health monitoring; standard practice across all Kubernetes distributions; fixed intervals prevent probe timing drift that would complicate capacity planning and SLA calculations.",
      source:
        "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
    },
    {
      systemId: "consul-service-mesh",
      systemName: "HashiCorp Consul Service Discovery",
      howUsed:
        "Consul implements fixed interval health checks for monitoring registered services in its service mesh. Each service registers health check endpoints that Consul agents poll at fixed intervals (default 30s). When a check fails, Consul marks the service as critical after multiple consecutive failures (configurable threshold), all at fixed intervals. The consistent polling frequency ensures service status transitions are predictable and dashboards show reliable metrics. During network partitions, fixed intervals prevent health check storms that exponential backoff would cause when thousands of services simultaneously retry checks. Pattern composition: Fixed Interval Polling + Distributed Health Checks + Consensus-Based Status. Rationale: Service availability detection requires consistent sampling frequency—variable intervals would make it impossible to distinguish between slow services and network issues. Impact: Deployed across 100k+ production Consul clusters; enabled Netflix, Target, and Adobe to maintain service mesh health at scale; fixed intervals provide deterministic failure detection windows critical for automated failover SLAs.",
      source: "https://www.consul.io/docs/discovery/checks",
    },
    {
      systemId: "celery-tasks",
      systemName: "Celery Distributed Task Queue",
      howUsed:
        "Celery task queue uses fixed interval retries for failed background jobs when tasks have specific time windows or SLA requirements. When a periodic task (nightly report generation, hourly data sync) fails, Celery retries with fixed countdown delays to ensure completion within the task's schedule window. A daily ETL job scheduled for 2 AM with 5-minute fixed interval retries will complete by 2:30 AM at latest (6 attempts × 5min), preventing overlap with the next day's run. Exponential backoff would risk schedule drift where failed jobs eventually run hours late. Pattern composition: Fixed Interval Task Retry + Dead Letter Queue + Task Result Backend. Rationale: Scheduled tasks have hard deadlines and time windows that require bounded retry timing; task success probability is often independent of retry spacing (database lock released, external API recovers). Impact: Powers background job processing for Instagram, Mozilla, and Robinhood handling millions of tasks daily; fixed intervals prevent task schedule drift that would break dependent workflows; maintains predictable queue depth for capacity planning.",
      source:
        "https://docs.celeryq.dev/en/stable/userguide/tasks.html#retrying",
    },
    {
      systemId: "aws-rds-failover",
      systemName: "AWS RDS Multi-AZ Failover Detection",
      howUsed:
        "AWS RDS Multi-AZ deployments use fixed interval health checks to detect primary database failures and trigger automatic failover. RDS monitors the primary instance with health checks at fixed 10-second intervals across multiple dimensions (replication lag, I/O responsiveness, instance health). When health checks fail consecutively for ~30 seconds (3 consecutive failures), RDS promotes the standby replica to primary. The fixed interval ensures predictable failover detection time (30-40 seconds) that customers can rely on for RDS SLA (99.95% availability). Variable check intervals would make it impossible to guarantee consistent failover timing. Pattern composition: Fixed Interval Health Checks + Multi-AZ Replication + Automatic Failover + DNS Update. Rationale: Database availability is binary (responding/not responding) and time-sensitive—exponential backoff would delay critical failover decisions and violate SLAs; fixed intervals provide deterministic worst-case detection time. Impact: Manages automatic failover for millions of RDS databases; enables AWS to guarantee sub-minute failover SLAs; fixed intervals ensure failover timing is predictable for customer disaster recovery planning.",
      source:
        "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html",
    },
    {
      systemId: "datadog-monitoring",
      systemName: "Datadog Infrastructure Monitoring",
      howUsed:
        "Datadog uses fixed interval polling for collecting infrastructure metrics from servers, containers, and services. Agents collect metrics (CPU, memory, disk, custom metrics) at fixed 10-second intervals and retry failed collections with the same interval. When network issues prevent metric submission, the agent retries every 10 seconds to maintain consistent metric granularity and avoid metric gaps in dashboards. Fixed intervals ensure timeseries data points are evenly spaced, enabling accurate rate calculations and predictable dashboard updates. Exponential backoff would create variable metric spacing that would break aggregations and percentile calculations. Pattern composition: Fixed Interval Metric Collection + Local Buffering + Batch Submission + Retry. Rationale: Monitoring systems require uniform time-series sampling to enable accurate math (derivatives, integrals, percentiles); variable polling intervals would corrupt timeseries analysis and make metrics unreliable. Impact: Monitors 500B+ metrics per day across 20k+ customers; fixed intervals maintain metric accuracy for alerting and SLO tracking; enables sub-second anomaly detection through consistent sampling frequency.",
      source: "https://docs.datadoghq.com/agent/",
    },
  ],

  references: [
    {
      title: "Kubernetes Configure Liveness and Readiness Probes",
      url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
      type: "documentation",
      author: "Kubernetes",
    },
    {
      title: "Consul Health Checks Documentation",
      url: "https://www.consul.io/docs/discovery/checks",
      type: "documentation",
      author: "HashiCorp",
    },
    {
      title: "Celery - Retrying Tasks",
      url: "https://docs.celeryq.dev/en/stable/userguide/tasks.html#retrying",
      type: "documentation",
      author: "Celery Project",
    },
    {
      title: "Spring Retry - Backoff Policies",
      url: "https://docs.spring.io/spring-retry/docs/current/reference/html5/",
      type: "documentation",
      author: "Spring Framework",
    },
    {
      title: "Release It! - Stability Patterns",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
  ],

  philosophy: {
    coreProblem:
      "When failures are random and uncorrelated with system load, variable retry delays unnecessarily extend recovery time without providing benefits",
    designPrinciple:
      "Use constant retry intervals for predictable, fast recovery from transient failures when retry timing doesn't affect backend load",
    historicalContext:
      "Fixed interval retries originated in polling-based systems (monitoring, health checks) where consistent sampling frequency was required for accurate status detection and metric collection",
    alternativesRejected: [
      "Exponential backoff - adds unnecessary delays for random transient failures",
      "Immediate retry - creates thundering herd without giving transient issues time to resolve",
      "Linear backoff - adds complexity without significant benefits for true transient failures",
      "Random delays only - loses predictability needed for capacity planning and SLAs",
    ],
    mentalModel:
      "Like checking your mailbox: you check every day at the same time (fixed interval) because mail delivery is independent of when you check—checking less frequently (exponential backoff) doesn't make mail more likely to arrive, it just delays when you receive it",
  },

  visualization: {
    staticDiagram: `graph LR
    A[Attempt 1<br/>0ms] --> B{Success?}
    B -->|Fail| C[Wait 1000ms]
    C --> D[Attempt 2<br/>1000ms]
    D --> E{Success?}
    E -->|Fail| F[Wait 1000ms]
    F --> G[Attempt 3<br/>2000ms]
    G --> H{Success?}
    H -->|Fail| I[Wait 1000ms]
    I --> J[Attempt 4<br/>3000ms]
    B -->|Yes| K[Success]
    E -->|Yes| K
    H -->|Yes| K

    style A fill:#e1f5e1
    style D fill:#fff4e1
    style G fill:#fff4e1
    style J fill:#fff4e1
    style C fill:#ffeb3b
    style F fill:#ffeb3b
    style I fill:#ffeb3b
    style K fill:#90ee90`,
    realWorldAnalogy:
      "Fixed interval retry is like a parking meter checker who walks the same route every hour at the same pace—not faster when cars are scarce, not slower when the lot is full. The consistent timing makes it easy to predict when they'll arrive and plan accordingly.",
    useCases: [
      {
        domain: "Health Monitoring",
        scenario:
          "Kubernetes checks container health every 10 seconds with fixed intervals to detect failures consistently",
        patternRole:
          "Provides predictable health check timing and deterministic failure detection windows",
        companies: ["Kubernetes", "Consul", "Datadog"],
      },
      {
        domain: "Task Scheduling",
        scenario:
          "Cron jobs retry failed executions at fixed intervals to complete within schedule windows",
        patternRole:
          "Ensures tasks complete within time windows without schedule drift",
        companies: ["Celery", "Quartz", "AWS EventBridge"],
      },
      {
        domain: "Polling Systems",
        scenario:
          "Client polls async job status every 5 seconds until completion",
        patternRole:
          "Maintains consistent polling frequency for predictable user experience",
        companies: ["AWS", "Stripe", "GitHub Actions"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "retry",
    "fixed-delay",
    "health-checks",
    "polling",
  ],
  difficulty: "beginner",
};
