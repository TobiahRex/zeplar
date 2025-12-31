import type { Pattern } from "../schema";

export const activeActive: Pattern = {
  id: "active-active",
  slug: "active-active",
  corpusPath:
    "🛡️ RELIABILITY → 📋 Redundancy → Hot/Warm/Cold Standby → 🔥 Active-Active",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Standby",
    level: 4,
  },

  concept: {
    name: "Active-Active",
    emoji: "🔥",
    tagline: "All nodes serve traffic",
    definition:
      "The Active-Active pattern deploys multiple identical instances of a system where all instances simultaneously process live traffic, providing both high availability and horizontal scalability. Unlike active-passive where standby nodes sit idle, every node in an active-active configuration actively serves requests concurrently. Think of it like multiple cashiers working simultaneously at a supermarket—all are actively serving customers rather than some waiting as backups. Load balancers distribute incoming requests across healthy nodes using algorithms like round-robin, least connections, or consistent hashing. If one node fails, the load balancer automatically redirects traffic to remaining healthy instances with minimal disruption. The pattern requires stateless application design or sophisticated state synchronization mechanisms: session data must be shared through external stores (Redis, databases), database writes must coordinate across instances, and caching layers must handle invalidation across the fleet. Active-active deployments achieve zero-downtime deployments through rolling updates, provide linear horizontal scalability by adding nodes, and maximize resource utilization since all capacity actively serves traffic. The configuration is particularly effective for stateless services, read-heavy workloads, and systems where eventual consistency is acceptable.",
    problemSolved:
      "Traditional single-instance deployments create availability and capacity bottlenecks. When the sole instance fails, the entire service goes down until recovery. When traffic spikes, a single instance hits resource limits and cannot scale horizontally. Active-passive configurations improve availability but waste standby capacity—50% of resources sit idle waiting for failures. These limitations become critical at scale: a service handling millions of requests per second cannot tolerate single points of failure or inefficient resource usage. Active-Active solves these problems by distributing load across multiple instances that all actively process requests. If one instance fails, traffic immediately flows to the remaining healthy nodes with no manual failover—users experience zero downtime. During traffic spikes, capacity scales horizontally by adding instances to the pool. Resources are fully utilized since no capacity sits idle as standby. The pattern enables continuous deployment through rolling updates: instances are updated one at a time while others continue serving traffic, eliminating deployment windows.",
    tradeoffs: {
      pros: [
        "Zero downtime during node failures—automatic traffic redistribution",
        "Horizontal scalability by adding instances to the active pool",
        "Full resource utilization—no idle standby capacity",
        "Enables rolling deployments without service interruption",
        "Higher aggregate throughput compared to active-passive",
      ],
      cons: [
        "Requires sophisticated state management across instances",
        "Complex data consistency challenges for write-heavy workloads",
        "Load balancer becomes critical single point of failure",
        "Session affinity can lead to unbalanced load distribution",
        "Higher infrastructure costs from running multiple active instances",
      ],
    },
    relatedPatterns: [
      "active-passive",
      "load-balancing",
      "session-replication",
      "stateless-services",
      "consistent-hashing",
      "health-check",
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
      id: "active-active-ts-basic",
      language: "typescript",
      title: "Active-Active Load Balancing with Health Checks",
      description:
        "TypeScript implementation of active-active deployment with round-robin load balancing, health checking, automatic failover, and stateless service design",
      code: `interface ServiceInstance {
  id: string;
  host: string;
  port: number;
  healthy: boolean;
  lastHealthCheck: number;
  requestCount: number;
  errorCount: number;
}

interface LoadBalancerConfig {
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  unhealthyThreshold: number; // Consecutive failures before marking unhealthy
  healthyThreshold: number; // Consecutive successes before marking healthy
}

type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'random';

/**
 * Active-Active Load Balancer
 * Distributes traffic across multiple healthy instances with automatic failover
 */
class ActiveActiveLoadBalancer {
  private instances: Map<string, ServiceInstance> = new Map();
  private currentIndex = 0; // For round-robin
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private config: LoadBalancerConfig,
    private strategy: LoadBalancingStrategy = 'round-robin'
  ) {}

  /**
   * Register a new service instance in the active pool
   */
  registerInstance(host: string, port: number): string {
    const id = \`\${host}:\${port}\`;

    const instance: ServiceInstance = {
      id,
      host,
      port,
      healthy: true, // Assume healthy until proven otherwise
      lastHealthCheck: Date.now(),
      requestCount: 0,
      errorCount: 0,
    };

    this.instances.set(id, instance);

    // Start health checking this instance
    this.startHealthChecks(instance);

    console.log(\`Registered instance \${id} in active pool\`);

    return id;
  }

  /**
   * Deregister an instance (e.g., during graceful shutdown)
   */
  deregisterInstance(instanceId: string): void {
    const timer = this.healthCheckTimers.get(instanceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(instanceId);
    }

    this.instances.delete(instanceId);
    console.log(\`Deregistered instance \${instanceId}\`);
  }

  /**
   * Get next healthy instance based on load balancing strategy
   */
  getNextInstance(): ServiceInstance | null {
    const healthyInstances = this.getHealthyInstances();

    if (healthyInstances.length === 0) {
      console.error('No healthy instances available!');
      return null;
    }

    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobinSelect(healthyInstances);
      case 'least-connections':
        return this.leastConnectionsSelect(healthyInstances);
      case 'random':
        return this.randomSelect(healthyInstances);
      default:
        return this.roundRobinSelect(healthyInstances);
    }
  }

  /**
   * Round-robin: Cycle through instances sequentially
   */
  private roundRobinSelect(instances: ServiceInstance[]): ServiceInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  /**
   * Least connections: Pick instance with fewest active requests
   */
  private leastConnectionsSelect(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, current) =>
      current.requestCount < min.requestCount ? current : min
    );
  }

  /**
   * Random: Pick random instance for maximum load distribution
   */
  private randomSelect(instances: ServiceInstance[]): ServiceInstance {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  /**
   * Get all currently healthy instances
   */
  private getHealthyInstances(): ServiceInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.healthy
    );
  }

  /**
   * Start periodic health checks for an instance
   */
  private startHealthChecks(instance: ServiceInstance): void {
    const timer = setInterval(async () => {
      await this.performHealthCheck(instance);
    }, this.config.healthCheckIntervalMs);

    this.healthCheckTimers.set(instance.id, timer);
  }

  /**
   * Perform health check on a single instance
   */
  private async performHealthCheck(instance: ServiceInstance): Promise<void> {
    try {
      const isHealthy = await this.checkInstanceHealth(instance);

      if (isHealthy && !instance.healthy) {
        instance.healthy = true;
        console.log(\`Instance \${instance.id} recovered - marking healthy\`);
      } else if (!isHealthy && instance.healthy) {
        instance.healthy = false;
        console.error(\`Instance \${instance.id} failed health check - marking unhealthy\`);
      }

      instance.lastHealthCheck = Date.now();
    } catch (error) {
      console.error(\`Health check error for \${instance.id}:\`, error);
      instance.healthy = false;
    }
  }

  /**
   * Check if instance is responding to health checks
   */
  private async checkInstanceHealth(
    instance: ServiceInstance
  ): Promise<boolean> {
    // Simulate health check HTTP request with timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false); // Timeout = unhealthy
      }, this.config.healthCheckTimeoutMs);

      // Simulate health check (in real implementation, make HTTP request)
      this.simulateHealthCheckRequest(instance)
        .then((healthy) => {
          clearTimeout(timeout);
          resolve(healthy);
        })
        .catch(() => {
          clearTimeout(timeout);
          resolve(false);
        });
    });
  }

  /**
   * Simulate health check request (replace with actual HTTP in production)
   */
  private async simulateHealthCheckRequest(
    instance: ServiceInstance
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simulate 5% health check failure rate
    return Math.random() > 0.05;
  }

  /**
   * Record successful request for metrics
   */
  recordSuccess(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.requestCount--;
    }
  }

  /**
   * Record failed request - may mark instance unhealthy
   */
  recordFailure(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.requestCount--;
      instance.errorCount++;

      // High error rate - mark unhealthy
      if (instance.errorCount > this.config.unhealthyThreshold) {
        instance.healthy = false;
        console.error(
          \`Instance \${instanceId} exceeded error threshold - marking unhealthy\`
        );
      }
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats(): {
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    instances: ServiceInstance[];
  } {
    const instances = Array.from(this.instances.values());
    const healthy = instances.filter((i) => i.healthy);

    return {
      totalInstances: instances.length,
      healthyInstances: healthy.length,
      unhealthyInstances: instances.length - healthy.length,
      instances,
    };
  }
}

// ============================================================================
// Example: Stateless API Service with Active-Active Deployment
// ============================================================================

/**
 * Stateless service request handler
 * All instances can handle any request (no session affinity required)
 */
class StatelessApiService {
  constructor(private instanceId: string) {}

  async handleRequest(requestId: string): Promise<{ data: string }> {
    // Simulate request processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate occasional failures (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error(\`Request processing failed on \${this.instanceId}\`);
    }

    return {
      data: \`Request \${requestId} processed by \${this.instanceId}\`,
    };
  }
}

/**
 * Application Gateway that load balances across active instances
 */
class ApiGateway {
  private loadBalancer: ActiveActiveLoadBalancer;
  private services: Map<string, StatelessApiService> = new Map();

  constructor() {
    this.loadBalancer = new ActiveActiveLoadBalancer(
      {
        healthCheckIntervalMs: 5000, // Check every 5 seconds
        healthCheckTimeoutMs: 2000, // 2 second timeout
        unhealthyThreshold: 3, // 3 errors = unhealthy
        healthyThreshold: 2, // 2 successes = healthy
      },
      'round-robin'
    );

    this.deployInstances();
  }

  /**
   * Deploy multiple active instances
   */
  private deployInstances(): void {
    // Deploy 3 active instances
    const instances = [
      { host: 'api-1.example.com', port: 8080 },
      { host: 'api-2.example.com', port: 8080 },
      { host: 'api-3.example.com', port: 8080 },
    ];

    for (const { host, port } of instances) {
      const instanceId = this.loadBalancer.registerInstance(host, port);
      this.services.set(instanceId, new StatelessApiService(instanceId));
    }

    console.log('Deployed 3 active instances');
  }

  /**
   * Handle incoming request with automatic load balancing and failover
   */
  async handleRequest(requestId: string): Promise<{ data: string }> {
    const instance = this.loadBalancer.getNextInstance();

    if (!instance) {
      throw new Error('No healthy instances available');
    }

    const service = this.services.get(instance.id);
    if (!service) {
      throw new Error(\`Service not found for instance \${instance.id}\`);
    }

    try {
      instance.requestCount++; // Track active requests

      const result = await service.handleRequest(requestId);

      this.loadBalancer.recordSuccess(instance.id);

      return result;
    } catch (error) {
      console.error(\`Request \${requestId} failed on \${instance.id}\`, error);

      this.loadBalancer.recordFailure(instance.id);

      // Automatic retry on different instance
      console.log(\`Retrying request \${requestId} on different instance...\`);
      return this.handleRequest(requestId);
    }
  }

  /**
   * Get current system stats
   */
  getStats() {
    return this.loadBalancer.getStats();
  }
}

// ============================================================================
// Simulation: Active-Active in Action
// ============================================================================

async function simulateTraffic() {
  const gateway = new ApiGateway();

  console.log('\\n=== Starting Active-Active Load Balancing ===\\n');

  // Simulate 50 concurrent requests
  const requests = Array.from({ length: 50 }, (_, i) => i);

  const results = await Promise.allSettled(
    requests.map((i) =>
      gateway.handleRequest(\`req-\${i}\`).then((result) => {
        console.log(\`Success: \${result.data}\`);
      })
    )
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(\`\\n=== Results ===\`);
  console.log(\`Successful: \${successful}\`);
  console.log(\`Failed: \${failed}\`);

  const stats = gateway.getStats();
  console.log(\`\\n=== Load Balancer Stats ===\`);
  console.log(\`Total Instances: \${stats.totalInstances}\`);
  console.log(\`Healthy: \${stats.healthyInstances}\`);
  console.log(\`Unhealthy: \${stats.unhealthyInstances}\`);

  console.log(\`\\n=== Instance Details ===\`);
  stats.instances.forEach((instance) => {
    console.log(
      \`\${instance.id}: \${instance.healthy ? 'HEALTHY' : 'UNHEALTHY'} - \` +
        \`Requests: \${instance.requestCount}, Errors: \${instance.errorCount}\`
    );
  });
}

simulateTraffic();`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Active-Active load balancing system with health checking, automatic failover, and multiple load balancing strategies. Covers instance registration, health monitoring, request distribution, and failure recovery.",
        prerequisites: [
          "Understanding of load balancing algorithms (round-robin, least connections)",
          "Knowledge of health checks and heartbeat mechanisms",
          "Familiarity with stateless service design and horizontal scaling",
          "Concept of high availability and fault tolerance",
        ],
        systemPosition:
          "Sits at the infrastructure layer between clients and service instances. Acts as an API gateway or load balancer distributing traffic across active instances. Used in cloud deployments with auto-scaling groups, Kubernetes services, and service mesh architectures.",
      },
      annotations: [
        {
          id: "active-active-instance-registration",
          lines: [35, 57],
          action:
            "Register new service instance in the active pool and start health checks",
          reason:
            "Registration makes the instance immediately available to receive traffic—it's added to the active pool, not kept as standby. All instances start healthy (optimistic assumption) and begin receiving requests immediately. This contrasts with active-passive where new instances sit idle until needed. The automatic health check startup ensures the instance is continuously monitored. This pattern enables horizontal scaling: add capacity by registering more instances, all actively serving traffic from the moment they register.",
          contextLevel: "module",
          relatedConcepts: [
            "service-discovery",
            "horizontal-scaling",
            "zero-downtime-deployment",
          ],
        },
        {
          id: "active-active-round-robin",
          lines: [96, 100],
          action:
            "Distribute requests sequentially across instances using modulo arithmetic",
          reason:
            "Round-robin is the simplest load balancing strategy: cycle through instances in order, wrapping around via modulo. This ensures even distribution over time—if you have 3 instances, they each get 33% of traffic. The strategy is stateless (just an incrementing counter) and fast (no complex calculations). Round-robin works best for stateless services where request cost is uniform. The modulo operation (currentIndex % instances.length) handles the wrap-around: after instance 2, go back to instance 0.",
          contextLevel: "local",
          relatedConcepts: [
            "load-distribution",
            "round-robin-algorithm",
            "stateless-routing",
          ],
        },
        {
          id: "active-active-least-connections",
          lines: [105, 109],
          action:
            "Route request to instance with fewest active connections using reduce",
          reason:
            "Least connections is smarter than round-robin: it accounts for current load. If instance A has 5 active requests and instance B has 2, route to B. This prevents overloading slow instances—if one instance processes requests slowly, it accumulates connections and gets fewer new requests. The reduce operation finds the minimum requestCount across all healthy instances. This strategy is ideal when request processing time varies significantly, ensuring balanced actual load (not just request count).",
          contextLevel: "local",
          relatedConcepts: [
            "adaptive-load-balancing",
            "connection-tracking",
            "load-awareness",
          ],
        },
        {
          id: "active-active-health-filtering",
          lines: [119, 123],
          action: "Filter instances to only return healthy ones for routing",
          reason:
            "Health filtering is critical for automatic failover. When an instance fails health checks (healthy=false), it's excluded from routing—traffic automatically flows to remaining healthy instances with zero manual intervention. This implements the 'active' part of active-active: all healthy instances serve traffic. If 1 of 3 instances fails, the remaining 2 automatically absorb its traffic. Without health filtering, the load balancer would route requests to failed instances, causing user-visible errors.",
          contextLevel: "module",
          relatedConcepts: [
            "automatic-failover",
            "health-based-routing",
            "circuit-breaker",
          ],
        },
        {
          id: "active-active-health-checks",
          lines: [130, 138],
          action:
            "Periodically check each instance health on configurable interval",
          reason:
            "Continuous health checking detects failures quickly and enables automatic recovery. The interval (e.g., every 5 seconds) balances detection speed against overhead—faster intervals detect failures sooner but create more health check traffic. Each instance gets its own timer, running independently. Health checks answer: 'Is this instance still able to serve traffic?' If health checks fail, the instance is marked unhealthy and removed from rotation automatically. When it recovers, it's automatically re-added. This creates self-healing infrastructure.",
          contextLevel: "module",
          relatedConcepts: [
            "health-monitoring",
            "failure-detection",
            "self-healing-systems",
          ],
        },
        {
          id: "active-active-health-check-timeout",
          lines: [164, 180],
          action:
            "Implement health check with timeout to detect unresponsive instances",
          reason:
            "Timeouts prevent health checks from blocking indefinitely on hung instances. If an instance doesn't respond within the timeout (e.g., 2 seconds), it's marked unhealthy—slow is effectively down from a health perspective. The timeout is implemented via Promise.race pattern: whichever completes first (health check or timeout) determines the outcome. Without timeouts, a partially-failed instance (accepting connections but not responding) would block health checks, delaying failure detection and causing cascading slowness.",
          contextLevel: "module",
          relatedConcepts: [
            "timeout-pattern",
            "failure-detection",
            "partial-failure",
          ],
        },
        {
          id: "active-active-failure-tracking",
          lines: [208, 223],
          action:
            "Track error count and mark instance unhealthy after exceeding threshold",
          reason:
            "Error-based health degradation complements periodic health checks: if an instance starts failing requests (even if health checks pass), mark it unhealthy. The threshold (e.g., 3 consecutive errors) prevents flapping from transient failures—one error doesn't kill the instance. This implements proactive failure detection: don't wait for the next health check interval, react immediately to request failures. The pattern catches failures health checks might miss (e.g., application errors vs. HTTP 200 responses).",
          contextLevel: "module",
          relatedConcepts: [
            "error-budget",
            "adaptive-health",
            "failure-threshold",
          ],
        },
        {
          id: "active-active-automatic-retry",
          lines: [299, 312],
          action:
            "Retry failed request on different instance for automatic failover",
          reason:
            "Automatic retry on failure provides seamless failover: if instance A fails, immediately retry on instance B. The user never sees the failure—from their perspective, the request succeeded (albeit with higher latency). This is the killer feature of active-active: no manual failover, no user impact. The retry calls handleRequest() recursively, which picks a different instance (because A is now marked unhealthy). Without automatic retry, a failed request would return an error despite having healthy instances available.",
          contextLevel: "system",
          relatedConcepts: [
            "transparent-failover",
            "retry-pattern",
            "resilience",
          ],
        },
        {
          id: "active-active-stateless-design",
          lines: [247, 261],
          action:
            "Implement stateless service where any instance can handle any request",
          reason:
            "Statelessness is essential for active-active: if instances stored session state, you'd need sticky sessions (request affinity), limiting load balancing effectiveness. Stateless design means request N can go to instance A, request N+1 to instance B—no constraints. State lives in external stores (Redis, databases) accessible to all instances. This enables true horizontal scaling: add instances without coordination or state migration. The handleRequest method has no instance-specific state—it processes requests purely from inputs, enabling any instance to handle any request.",
          contextLevel: "system",
          relatedConcepts: [
            "stateless-services",
            "horizontal-scalability",
            "shared-nothing-architecture",
          ],
        },
        {
          id: "active-active-zero-downtime",
          lines: [272, 285],
          action: "Deploy multiple instances concurrently all serving traffic",
          reason:
            "Zero-downtime deployment is a key benefit of active-active. To deploy a new version: 1) deploy new instances alongside old, 2) register new instances in load balancer, 3) deregister old instances, 4) wait for old instances to drain connections, 5) shut down old instances. At no point is the service unavailable—some instances are always serving traffic. This example shows the foundation: multiple instances all active. Production deployments extend this with rolling updates, blue-green deployments, or canary releases.",
          contextLevel: "system",
          relatedConcepts: [
            "zero-downtime-deployment",
            "rolling-updates",
            "blue-green-deployment",
          ],
        },
      ],
      highlights: [
        {
          lines: [35, 57],
          sbvpDomain: "behavior",
          label: "Instance Registration with Automatic Health Check Startup",
        },
        {
          lines: [119, 123],
          sbvpDomain: "philosophy",
          label: "Health Filtering Enables Automatic Failover",
        },
        {
          lines: [96, 100],
          sbvpDomain: "behavior",
          label: "Round-Robin Load Distribution Algorithm",
        },
        {
          lines: [105, 109],
          sbvpDomain: "behavior",
          label: "Least Connections: Adaptive Load Balancing",
        },
        {
          lines: [164, 180],
          sbvpDomain: "behavior",
          label: "Health Check with Timeout Protection",
        },
        {
          lines: [299, 312],
          sbvpDomain: "philosophy",
          label: "Transparent Automatic Retry on Failure",
        },
        {
          lines: [247, 261],
          sbvpDomain: "structure",
          label: "Stateless Service Design for Horizontal Scaling",
        },
      ],
    },
  ],
};
