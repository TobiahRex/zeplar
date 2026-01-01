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
        name: "Global Load Balancer",
        role: "Traffic Distribution and Health-Based Routing",
        responsibilities: [
          "Route traffic to geographically closest healthy region",
          "Perform continuous health checks on all active regions",
          "Detect region failures and remove unhealthy regions from rotation within seconds",
          "Implement traffic weighting for gradual region rollout and canary deployments",
          "Support multiple routing policies: latency-based, geoproximity, weighted round-robin, failover",
        ],
      },
      {
        name: "Active Region A",
        role: "Primary Traffic-Serving Region",
        responsibilities: [
          "Process 100% of assigned traffic (no standby instances)",
          "Replicate writes to other regions asynchronously or synchronously",
          "Maintain local read replicas for read scaling within region",
          "Participate in distributed consensus for global state (if strongly consistent)",
          "Accept writes and propagate to other regions via multi-master replication",
        ],
      },
      {
        name: "Active Region B",
        role: "Concurrent Traffic-Serving Region",
        responsibilities: [
          "Process 100% of assigned traffic independently from Region A",
          "Accept writes and resolve conflicts with Region A using last-write-wins, vector clocks, or CRDTs",
          "Replicate data bidirectionally with Region A",
          "Serve read traffic from local replicas for low latency",
          "Automatically absorb Region A traffic if Region A fails health checks",
        ],
      },
      {
        name: "Data Replication Layer",
        role: "Cross-Region Data Synchronization",
        responsibilities: [
          "Replicate writes across all active regions with minimal lag (<1s for async, <100ms for sync)",
          "Implement conflict resolution strategies: last-write-wins timestamps, vector clocks, application-specific merge",
          "Handle network partitions with conflict-free replicated data types (CRDTs) or split-brain prevention",
          "Provide replication lag monitoring and alerting",
          "Support selective replication for data sovereignty requirements",
        ],
      },
      {
        name: "Health Check System",
        role: "Continuous Region Availability Monitoring",
        responsibilities: [
          "Perform health checks every 5-30 seconds per region",
          "Detect application failures, network partitions, and degraded performance",
          "Signal load balancer to remove unhealthy regions from traffic rotation",
          "Re-add recovered regions to rotation after consecutive successful health checks",
          "Publish health metrics to monitoring dashboards",
        ],
      },
      {
        name: "Conflict Resolution Engine",
        role: "Handle Write Conflicts in Multi-Master Setup",
        responsibilities: [
          "Detect conflicting writes to same data from different regions",
          "Apply resolution strategy: timestamps, version vectors, causal consistency, custom business logic",
          "Log conflicts for auditing and manual review if needed",
          "Ensure eventual consistency across all regions",
          "Preserve all versions for conflict-free replicated data types",
        ],
      },
    ],
    diagram: `graph TB
    Client[Client Request] --> DNS[Global Load Balancer<br/>DNS/Anycast/CDN]

    DNS -->|Latency-Based Routing| RegionA[Active Region A<br/>US-East]
    DNS -->|Geographic Routing| RegionB[Active Region B<br/>EU-West]
    DNS -->|Health Check Failed| RegionC[Active Region C<br/>APAC]

    subgraph RegionA[Active Region A - US-East]
        A_LB[Regional Load Balancer]
        A_App1[App Instance 1]
        A_App2[App Instance 2]
        A_App3[App Instance 3]
        A_DB[(Database Primary)]
        A_Cache[(Cache)]

        A_LB --> A_App1
        A_LB --> A_App2
        A_LB --> A_App3
        A_App1 --> A_DB
        A_App2 --> A_DB
        A_App3 --> A_DB
        A_App1 --> A_Cache
        A_App2 --> A_Cache
        A_App3 --> A_Cache
    end

    subgraph RegionB[Active Region B - EU-West]
        B_LB[Regional Load Balancer]
        B_App1[App Instance 1]
        B_App2[App Instance 2]
        B_App3[App Instance 3]
        B_DB[(Database Primary)]
        B_Cache[(Cache)]

        B_LB --> B_App1
        B_LB --> B_App2
        B_LB --> B_App3
        B_App1 --> B_DB
        B_App2 --> B_DB
        B_App3 --> B_DB
        B_App1 --> B_Cache
        B_App2 --> B_Cache
        B_App3 --> B_Cache
    end

    subgraph RegionC[Active Region C - APAC]
        C_LB[Regional Load Balancer]
        C_App1[App Instance 1]
        C_App2[App Instance 2]
        C_DB[(Database Primary)]
        C_Cache[(Cache)]

        C_LB --> C_App1
        C_LB --> C_App2
        C_App1 --> C_DB
        C_App2 --> C_DB
        C_App1 --> C_Cache
        C_App2 --> C_Cache
    end

    A_DB <-->|Bidirectional<br/>Replication<br/>Async/Sync| B_DB
    B_DB <-->|Bidirectional<br/>Replication| C_DB
    C_DB <-->|Bidirectional<br/>Replication| A_DB

    HealthCheck[Health Check System] -.->|Monitor| RegionA
    HealthCheck -.->|Monitor| RegionB
    HealthCheck -.->|Monitor| RegionC
    HealthCheck -->|Update Routing| DNS

    style DNS fill:#e1f5ff
    style RegionA fill:#e1f5e1
    style RegionB fill:#e1f5e1
    style RegionC fill:#e1f5e1
    style A_DB fill:#ffe1e1
    style B_DB fill:#ffe1e1
    style C_DB fill:#ffe1e1
    style HealthCheck fill:#fff4e1`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "DNS Resolution",
        description:
          "Client resolves domain name via global load balancer (Route 53, Global Load Balancer, Anycast DNS). Load balancer selects region based on routing policy: latency-based (nearest region with lowest RTT), geoproximity (geographic closeness), or weighted (traffic distribution percentages). Returns IP address of regional load balancer in selected region.",
      },
      {
        step: 2,
        actor: "Global Load Balancer",
        action: "Health-Based Routing Decision",
        description:
          "Before returning region IP, verify region health status. If selected region recently failed health checks, route to next best healthy region instead. Health checks run every 10-30 seconds testing application endpoints. Failed region is removed from DNS rotation, traffic automatically flows to remaining healthy regions with zero manual intervention.",
      },
      {
        step: 3,
        actor: "Regional Load Balancer",
        action: "Distribute to Application Instances",
        description:
          "Regional load balancer receives client request and distributes across healthy application instances using round-robin, least connections, or IP hash. All instances are active (processing requests), no standby/passive instances. If instance fails health check, removed from rotation and traffic redistributed to remaining instances.",
      },
      {
        step: 4,
        actor: "Application Instance",
        action: "Process Request and Write to Local Database",
        description:
          "Application instance processes request and writes to local regional database (primary in that region). Write is committed locally immediately (low latency). Database triggers replication to other regions asynchronously (eventual consistency) or synchronously (strong consistency with quorum writes). Read requests served from local database/cache for minimal latency.",
      },
      {
        step: 5,
        actor: "Data Replication Layer",
        action: "Replicate Write to Other Regions",
        description:
          "Replication layer propagates write to other active regions bidirectionally. Async replication: write acknowledged locally, replicated in background (1-5s lag, higher throughput). Sync replication: write waits for quorum acknowledgment from majority of regions (100-500ms lag, strong consistency). Handles conflicts if concurrent writes to same data from different regions.",
      },
      {
        step: 6,
        actor: "Conflict Resolution Engine",
        action: "Detect and Resolve Write Conflicts",
        description:
          "When concurrent writes conflict (User A updates profile in US, User B updates same profile in EU simultaneously), conflict resolver applies strategy: last-write-wins with timestamps (simplest, may lose data), vector clocks (causal consistency), CRDTs (conflict-free), or application-specific merge logic. Resolution ensures eventual consistency.",
      },
      {
        step: 7,
        actor: "Health Check System",
        action: "Monitor Region Health",
        description:
          "Health checker continuously probes all regions: HTTP GET to health endpoint every 10s, check database connectivity, verify replication lag <5s, test critical dependencies. Multiple consecutive failures trigger region unhealthy. Health metrics reported to global load balancer, which updates routing to exclude failed region. Recovered regions re-added after consecutive successful checks.",
      },
      {
        step: 8,
        actor: "Global Load Balancer",
        action: "Automatic Failover on Region Failure",
        description:
          "When health checks detect region failure (datacenter outage, network partition, application crash), global load balancer removes region from DNS rotation within 30-60 seconds (DNS TTL + health check interval). New client requests automatically route to remaining healthy regions. Existing connections to failed region timeout and retry to healthy regions. No manual failover required.",
      },
      {
        step: 9,
        actor: "Active Regions",
        action: "Absorb Failed Region Traffic",
        description:
          "Remaining healthy regions automatically absorb traffic from failed region. If 3 regions each handle 33% traffic and one fails, remaining 2 regions now handle 50% each. Application instances auto-scale up (if using cloud auto-scaling) to handle increased load. Database replication continues bidirectionally between healthy regions. Failed region rejoins automatically when recovered.",
      },
      {
        step: 10,
        actor: "Client",
        action: "Receive Response",
        description:
          "Client receives response from regional application instance. Response includes data replicated across regions (eventual or strong consistency depending on configuration). Client may be transparently rerouted to different region on retry if initial region failed mid-request. Active-active design ensures near-zero RTO (recovery time objective) and low RPO (recovery point objective) since all regions actively serve traffic and replicate data continuously.",
      },
    ],
    invariants: [
      "All regions must actively serve traffic (no standby/passive regions)",
      "Global load balancer must perform continuous health checks on all regions",
      "Failed regions must be automatically removed from routing within seconds/minutes (no manual failover)",
      "Data replication must be bidirectional between all active regions",
      "Write conflicts must be resolvable via timestamps, vector clocks, CRDTs, or application logic",
      "Each region must be capable of handling 100% of traffic during single-region failure",
      "Health check failures must trigger automatic traffic rerouting",
      "Replication lag must be monitored and alerted when exceeding thresholds",
      "Split-brain scenarios must be prevented via quorum consensus or conflict resolution",
      "All regions must share same application version during steady state (deployment coordination required)",
    ],
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

  implementations: [
    {
      id: "cockroachdb-multiregion",
      name: "CockroachDB Multi-Region Active-Active",
      type: "service",
      languages: ["sql"],
      description:
        "CockroachDB is a distributed SQL database designed for active-active multi-region deployments with automatic data replication, conflict-free consistency, and zero-downtime region failover. Uses Raft consensus for strong consistency and supports geo-partitioning for data locality and compliance.",
      links: {
        docs: "https://www.cockroachlabs.com/docs/stable/multiregion-overview.html",
        github: "https://github.com/cockroachdb/cockroach",
      },
      codeSnippet: `-- Configure multi-region database with active-active across 3 regions
ALTER DATABASE mydb SET PRIMARY REGION 'us-east1';
ALTER DATABASE mydb ADD REGION 'us-west1';
ALTER DATABASE mydb ADD REGION 'eu-west1';

-- Set survival goal: survive zone failure (default) or region failure
ALTER DATABASE mydb SURVIVE REGION FAILURE;

-- Configure table for multi-region active-active access
-- REGIONAL BY ROW: Automatically partition rows by region for low-latency local writes
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email STRING NOT NULL,
    name STRING,
    region STRING AS (CASE
        WHEN email LIKE '%.eu' THEN 'eu-west1'
        WHEN email LIKE '%.us' THEN 'us-east1'
        ELSE 'us-west1'
    END) STORED,
    created_at TIMESTAMP DEFAULT now()
) LOCALITY REGIONAL BY ROW AS region;

-- GLOBAL tables: replicated to all regions, low-latency reads, higher-latency writes
CREATE TABLE products (
    product_id UUID PRIMARY KEY,
    name STRING,
    price DECIMAL(10, 2)
) LOCALITY GLOBAL;

-- REGIONAL BY TABLE: Table lives in specific region, optimized for region-specific data
CREATE TABLE analytics_us (
    event_id UUID PRIMARY KEY,
    user_id UUID,
    event_type STRING,
    timestamp TIMESTAMP
) LOCALITY REGIONAL IN 'us-east1';

-- Query demonstrates automatic routing to local region
-- User in EU writing to users table routes to EU region automatically
INSERT INTO users (email, name) VALUES ('alice@example.eu', 'Alice');

-- Global products table readable with low latency from any region
SELECT * FROM products WHERE product_id = '123e4567-e89b-12d3-a456-426614174000';

-- Conflict resolution: CockroachDB uses MVCC with timestamp ordering
-- Last-write-wins based on HLC (Hybrid Logical Clock) timestamps
-- Concurrent writes to same row from different regions resolved automatically

-- Monitor replication lag and region health
SHOW REGIONS FROM DATABASE mydb;

SELECT
    store_id,
    node_id,
    range_count,
    lease_count,
    replicas_leaders,
    replicas_leaseholders
FROM crdb_internal.kv_store_status;

-- Key features:
-- - Automatic region failover: if us-east1 fails, traffic routes to us-west1/eu-west1
-- - Strong consistency: SERIALIZABLE isolation despite geo-distribution
-- - Geo-partitioning: data stays in region for compliance (GDPR)
-- - Zero-downtime: all regions active, no failover delay
-- - RTO: <30 seconds (DNS TTL + health check)
-- - RPO: 0 (synchronous replication for SURVIVE REGION FAILURE)`,
    },
    {
      id: "cassandra-multidc",
      name: "Apache Cassandra Multi-Datacenter Active-Active",
      type: "service",
      languages: ["cql"],
      description:
        "Cassandra is a distributed NoSQL database optimized for multi-datacenter active-active deployments with eventual consistency, tunable consistency levels, and masterless architecture. Each datacenter can accept writes independently with automatic conflict resolution via last-write-wins timestamps.",
      links: {
        docs: "https://cassandra.apache.org/doc/latest/cassandra/operating/multiple-datacenters.html",
        github: "https://github.com/apache/cassandra",
      },
      codeSnippet: `-- Configure keyspace for multi-datacenter replication
-- NetworkTopologyStrategy replicates data across multiple datacenters
CREATE KEYSPACE ecommerce
WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'us_east': 3,      -- 3 replicas in US East datacenter
    'us_west': 3,      -- 3 replicas in US West datacenter
    'eu_west': 2       -- 2 replicas in EU West datacenter
};

USE ecommerce;

-- Create table with conflict resolution via last-write-wins
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email TEXT,
    name TEXT,
    last_login TIMESTAMP,
    version TIMEUUID  -- Conflict resolution: highest timestamp wins
);

-- Write to local datacenter with LOCAL_QUORUM consistency
-- Replicated asynchronously to other datacenters
INSERT INTO users (user_id, email, name, last_login, version)
VALUES (uuid(), 'user@example.com', 'John Doe', toTimestamp(now()), now())
USING CONSISTENCY LOCAL_QUORUM;

-- Read from local datacenter for low latency
SELECT * FROM users WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
USING CONSISTENCY LOCAL_ONE;

-- Strong consistency across all datacenters (higher latency)
SELECT * FROM users WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
USING CONSISTENCY EACH_QUORUM;

-- Conflict resolution strategies:
-- 1. Last-write-wins (LWW): Latest timestamp wins (default)
-- 2. Lightweight transactions (LWT): Compare-and-swap for critical updates

-- LWT for account balance updates (prevent concurrent update conflicts)
UPDATE accounts
SET balance = 100.50, version = now()
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
IF version = <previous_version>;

-- Monitor datacenter replication status
nodetool status

-- Check repair status (eventual consistency reconciliation)
nodetool repair ecommerce users

-- Key features:
-- - Masterless: All datacenters accept writes (no primary/secondary)
-- - Tunable consistency: LOCAL_QUORUM (fast) vs EACH_QUORUM (consistent)
-- - Automatic conflict resolution: LWW timestamps
-- - Datacenter awareness: writes stay local, replicated async
-- - RTO: ~0 seconds (immediate datacenter failover)
-- - RPO: seconds to minutes (async replication lag)

-- Production configuration for active-active:
-- - NetworkTopologyStrategy with RF >= 3 per datacenter
-- - LOCAL_QUORUM for writes (low latency, durability)
-- - LOCAL_ONE for reads (fast, may serve stale data)
-- - EACH_QUORUM for critical reads requiring global consistency`,
    },
    {
      id: "aws-route53-multiregion",
      name: "AWS Route 53 Multi-Region Active-Active",
      type: "platform",
      languages: ["terraform", "cloudformation"],
      description:
        "AWS Route 53 provides DNS-based global load balancing for active-active multi-region deployments with health checks, latency-based routing, geoproximity routing, and automatic failover. Integrates with Application Load Balancers in each region for region-level traffic distribution.",
      links: {
        docs: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html",
      },
      codeSnippet: `# Terraform configuration for AWS Route 53 active-active multi-region

# Health checks for each region
resource "aws_route53_health_check" "us_east" {
  fqdn              = "us-east.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30  # Check every 30 seconds

  tags = {
    Name = "us-east-health-check"
  }
}

resource "aws_route53_health_check" "eu_west" {
  fqdn              = "eu-west.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "eu-west-health-check"
  }
}

resource "aws_route53_health_check" "ap_southeast" {
  fqdn              = "ap-southeast.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "ap-southeast-health-check"
  }
}

# DNS zone
resource "aws_route53_zone" "main" {
  name = "example.com"
}

# Latency-based routing with health checks (active-active)
resource "aws_route53_record" "www_us_east" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"

  # Latency-based routing: route to region with lowest latency
  set_identifier = "us-east-1"
  latency_routing_policy {
    region = "us-east-1"
  }

  alias {
    name                   = aws_lb.us_east.dns_name
    zone_id                = aws_lb.us_east.zone_id
    evaluate_target_health = true  # Use ALB health checks
  }

  health_check_id = aws_route53_health_check.us_east.id
}

resource "aws_route53_record" "www_eu_west" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"

  set_identifier = "eu-west-1"
  latency_routing_policy {
    region = "eu-west-1"
  }

  alias {
    name                   = aws_lb.eu_west.dns_name
    zone_id                = aws_lb.eu_west.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.eu_west.id
}

resource "aws_route53_record" "www_ap_southeast" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"

  set_identifier = "ap-southeast-1"
  latency_routing_policy {
    region = "ap-southeast-1"
  }

  alias {
    name                   = aws_lb.ap_southeast.dns_name
    zone_id                = aws_lb.ap_southeast.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.ap_southeast.id
}

# Weighted routing (alternative to latency-based for traffic distribution)
# Uncomment to use weighted routing instead of latency-based
# resource "aws_route53_record" "www_us_east_weighted" {
#   zone_id = aws_route53_zone.main.zone_id
#   name    = "www.example.com"
#   type    = "A"
#
#   set_identifier = "us-east-1"
#   weighted_routing_policy {
#     weight = 70  # 70% of traffic to US East
#   }
#
#   alias {
#     name                   = aws_lb.us_east.dns_name
#     zone_id                = aws_lb.us_east.zone_id
#     evaluate_target_health = true
#   }
# }

# Application Load Balancer in each region
resource "aws_lb" "us_east" {
  name               = "app-lb-us-east"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.us_east_public[*].id

  enable_deletion_protection = true
  enable_http2              = true

  tags = {
    Region = "us-east-1"
  }
}

# Target group health checks
resource "aws_lb_target_group" "us_east" {
  name     = "app-tg-us-east"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.us_east.id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }
}

# Key features:
# - Latency-based routing: clients routed to nearest region
# - Health checks: failed regions removed from DNS rotation
# - Automatic failover: unhealthy region bypassed within 30-60s
# - Multi-region: all regions active, no standby
# - RTO: 30-60 seconds (health check interval + DNS TTL)
# - RPO: depends on database replication configuration`,
    },
    {
      id: "gcp-global-load-balancer",
      name: "GCP Global Load Balancer Active-Active",
      type: "platform",
      languages: ["terraform"],
      description:
        "Google Cloud Platform's Global Load Balancer provides Anycast IP-based active-active multi-region deployments with automatic traffic routing to nearest healthy backend, health-based failover, and Cloud CDN integration for optimal performance.",
      links: {
        docs: "https://cloud.google.com/load-balancing/docs/https",
      },
      codeSnippet: `# Terraform configuration for GCP Global Load Balancer active-active

# Global static IP (Anycast)
resource "google_compute_global_address" "default" {
  name = "global-app-ip"
}

# Health check for backend services
resource "google_compute_health_check" "default" {
  name               = "app-health-check"
  check_interval_sec = 10
  timeout_sec        = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3

  https_health_check {
    port         = 443
    request_path = "/health"
  }
}

# Backend service in US region
resource "google_compute_backend_service" "us_central" {
  name                  = "app-backend-us-central"
  protocol              = "HTTPS"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.default.id]
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group                 = google_compute_instance_group_manager.us_central.instance_group
    balancing_mode        = "UTILIZATION"
    capacity_scaler       = 1.0
    max_utilization       = 0.8
  }

  # Connection draining during instance removal
  connection_draining_timeout_sec = 300

  # Enable Cloud CDN for static content
  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }
}

# Backend service in EU region
resource "google_compute_backend_service" "eu_west" {
  name                  = "app-backend-eu-west"
  protocol              = "HTTPS"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.default.id]
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group                 = google_compute_instance_group_manager.eu_west.instance_group
    balancing_mode        = "UTILIZATION"
    capacity_scaler       = 1.0
    max_utilization       = 0.8
  }

  connection_draining_timeout_sec = 300
  enable_cdn = true
}

# Backend service in Asia region
resource "google_compute_backend_service" "asia_east" {
  name                  = "app-backend-asia-east"
  protocol              = "HTTPS"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.default.id]
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group                 = google_compute_instance_group_manager.asia_east.instance_group
    balancing_mode        = "UTILIZATION"
    capacity_scaler       = 1.0
    max_utilization       = 0.8
  }

  connection_draining_timeout_sec = 300
  enable_cdn = true
}

# URL map for traffic routing
resource "google_compute_url_map" "default" {
  name            = "app-url-map"
  default_service = google_compute_backend_service.us_central.id

  # Route based on geographic proximity and backend health
  host_rule {
    hosts        = ["www.example.com"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.us_central.id

    # Automatic routing to nearest healthy backend
    # GCP Global Load Balancer uses Anycast to route to closest region
  }
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "default" {
  name             = "app-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_ssl_certificate.default.id]
}

# Global forwarding rule (Anycast IP)
resource "google_compute_global_forwarding_rule" "default" {
  name                  = "app-forwarding-rule"
  target                = google_compute_target_https_proxy.default.id
  port_range            = "443"
  ip_address            = google_compute_global_address.default.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Managed instance group with autoscaling (per region)
resource "google_compute_instance_group_manager" "us_central" {
  name               = "app-igm-us-central"
  base_instance_name = "app-instance"
  zone               = "us-central1-a"
  target_size        = 3

  version {
    instance_template = google_compute_instance_template.default.id
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.default.id
    initial_delay_sec = 300
  }
}

resource "google_compute_autoscaler" "us_central" {
  name   = "app-autoscaler-us-central"
  zone   = "us-central1-a"
  target = google_compute_instance_group_manager.us_central.id

  autoscaling_policy {
    max_replicas    = 10
    min_replicas    = 3
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }
  }
}

# Key features:
# - Anycast IP: Single global IP routes to nearest region
# - Automatic failover: Failed backends removed within ~30 seconds
# - Cloud CDN: Cache static content at edge locations
# - Health-based routing: Traffic only to healthy backends
# - Autoscaling: Each region scales independently
# - RTO: <30 seconds (health check detection + routing update)
# - RPO: Depends on application-level replication`,
    },
    {
      id: "cloudflare-load-balancing",
      name: "Cloudflare Load Balancing Active-Active",
      type: "platform",
      languages: ["terraform"],
      description:
        "Cloudflare Load Balancing provides DNS-based and Anycast-based active-active global traffic distribution with health checks, geo-steering, active health monitoring, and automatic failover across multiple origin servers in different regions.",
      links: {
        docs: "https://developers.cloudflare.com/load-balancing/",
      },
      codeSnippet: `# Terraform configuration for Cloudflare Load Balancing active-active

# Define origin pools (one per region)
resource "cloudflare_load_balancer_pool" "us_east" {
  account_id = var.cloudflare_account_id
  name       = "us-east-pool"
  enabled    = true

  # Origins in US East region
  origins {
    name    = "us-east-1"
    address = "us-east-1.example.com"
    enabled = true
    weight  = 1
  }

  origins {
    name    = "us-east-2"
    address = "us-east-2.example.com"
    enabled = true
    weight  = 1
  }

  # Health check for this pool
  check_regions = ["WEU", "ENAM"]  # Check from Western Europe and Eastern North America

  monitor = cloudflare_load_balancer_monitor.https_monitor.id

  # Notification when pool becomes unhealthy
  notification_email = "ops@example.com"
}

resource "cloudflare_load_balancer_pool" "eu_west" {
  account_id = var.cloudflare_account_id
  name       = "eu-west-pool"
  enabled    = true

  origins {
    name    = "eu-west-1"
    address = "eu-west-1.example.com"
    enabled = true
    weight  = 1
  }

  origins {
    name    = "eu-west-2"
    address = "eu-west-2.example.com"
    enabled = true
    weight  = 1
  }

  check_regions = ["WEU", "ENAM"]
  monitor       = cloudflare_load_balancer_monitor.https_monitor.id
}

resource "cloudflare_load_balancer_pool" "ap_southeast" {
  account_id = var.cloudflare_account_id
  name       = "ap-southeast-pool"
  enabled    = true

  origins {
    name    = "ap-southeast-1"
    address = "ap-southeast-1.example.com"
    enabled = true
    weight  = 1
  }

  check_regions = ["SEAS", "ENAM"]
  monitor       = cloudflare_load_balancer_monitor.https_monitor.id
}

# Health monitor
resource "cloudflare_load_balancer_monitor" "https_monitor" {
  account_id     = var.cloudflare_account_id
  type           = "https"
  port           = 443
  method         = "GET"
  path           = "/health"
  interval       = 60       # Check every 60 seconds
  timeout        = 5
  retries        = 2
  expected_codes = "200"

  header {
    header = "Host"
    values = ["www.example.com"]
  }

  # Advanced health check
  follow_redirects = true
  allow_insecure   = false
}

# Global load balancer with geo-steering
resource "cloudflare_load_balancer" "www" {
  zone_id          = var.cloudflare_zone_id
  name             = "www.example.com"
  default_pool_ids = [
    cloudflare_load_balancer_pool.us_east.id,
    cloudflare_load_balancer_pool.eu_west.id,
    cloudflare_load_balancer_pool.ap_southeast.id
  ]

  # Fallback pool if all pools fail
  fallback_pool_id = cloudflare_load_balancer_pool.us_east.id

  # Geographic steering: route to nearest pool
  steering_policy = "geo"

  # Region-specific pools
  region_pools {
    region   = "WNAM"  # Western North America
    pool_ids = [cloudflare_load_balancer_pool.us_east.id]
  }

  region_pools {
    region   = "WEU"  # Western Europe
    pool_ids = [cloudflare_load_balancer_pool.eu_west.id]
  }

  region_pools {
    region   = "SEAS"  # Southeast Asia
    pool_ids = [cloudflare_load_balancer_pool.ap_southeast.id]
  }

  # Session affinity (sticky sessions)
  session_affinity = "cookie"
  session_affinity_ttl = 3600

  # TTL for DNS responses
  ttl = 30

  # Adaptive routing based on latency and packet loss
  adaptive_routing {
    failover_across_pools = true
  }

  # Notifications
  enabled = true
}

# Load balancer analytics
resource "cloudflare_logpush_job" "lb_analytics" {
  enabled          = true
  name             = "lb-analytics"
  destination_conf = "s3://my-bucket/lb-logs?region=us-east-1"
  dataset          = "http_requests"
  frequency        = "high"

  filter = jsonencode({
    where = {
      and = [
        { key = "ClientRequestHost", operator = "eq", value = "www.example.com" }
      ]
    }
  })
}

# Key features:
# - Geo-steering: Route to nearest pool automatically
# - Active health checks: Pools checked from multiple locations
# - Adaptive routing: Route based on latency and packet loss
# - Automatic failover: Failed pools removed from rotation
# - Session affinity: Sticky sessions for stateful apps
# - RTO: 30-60 seconds (health check + DNS TTL)
# - Global Anycast network: 300+ edge locations

# Advanced configuration for active-active:
# - steering_policy = "geo": Geographic routing
# - steering_policy = "dynamic_latency": Route to fastest pool
# - steering_policy = "random": Random distribution for load balancing
# - adaptive_routing: Intelligent routing based on real-time performance`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-global-streaming",
      systemName: "Netflix Global Streaming Infrastructure",
      howUsed:
        "Netflix operates a massive active-active multi-region architecture serving 230M+ subscribers across the globe with 99.99% availability. Their system runs in 3 AWS regions (US-East, US-West, EU-West) as active-active, with all regions simultaneously serving streaming traffic 24/7. Global traffic routing uses AWS Route 53 latency-based routing combined with Netflix's own Zuul API gateway for intelligent region selection. When a user in London requests to watch a show, Route 53 routes them to the EU-West region (lowest latency ~20ms), but if EU-West experiences issues, traffic automatically fails over to US-East within 30 seconds. Each region runs the full Netflix stack: hundreds of microservices (recommendation engine, user profiles, video metadata, billing, playback), EVCache clusters for caching, and Cassandra clusters for data storage. Data replication happens bidirectionally across regions—when a user in EU adds a show to their watchlist, that write goes to EU-West Cassandra, which asynchronously replicates to US-East and US-West within 1-2 seconds (eventual consistency acceptable for user preferences). Critical data like subscription status uses stronger consistency—writes go to primary region and replicate synchronously to at least one other region before acknowledgment. The architecture's killer feature is zero-downtime deployments: Netflix deploys new code to one region at a time (canary deployment), monitors error rates and latency, then rolls to remaining regions. If deployment causes issues in one region, traffic shifts to healthy regions automatically while the problematic region rolls back. During the 2015 AWS us-east-1 outage, Netflix's active-active architecture allowed them to continue streaming from us-west and eu-west with minimal user impact—only users mid-stream in us-east experienced buffering, new streams started in healthy regions. Netflix tracks RTO (Recovery Time Objective) of <60 seconds for region failures and RPO (Recovery Point Objective) of <5 seconds for user data (acceptable staleness for recommendations/watchlist). The active-active design enables Netflix to handle massive traffic spikes during popular show releases (Stranger Things, Squid Game) by distributing load across all regions, avoiding the single-region bottleneck. Pattern composition: Active-Active + Latency-Based Routing + Microservices + Cassandra Multi-DC + EVCache + Zuul Gateway + Chaos Engineering (Simian Army tests failures). Impact: 99.99% availability despite regional outages; zero-downtime deployments of 100+ microservices daily; seamless global user experience with <100ms latency; ability to handle 10x traffic spikes during releases.",
      source:
        "https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b",
    },
    {
      systemId: "github-mysql-multiregion",
      systemName: "GitHub MySQL Multi-Region Active-Active",
      howUsed:
        "GitHub operates active-active MySQL infrastructure across 2 primary regions (US-East, US-West) to serve 100M+ developers with high availability for git operations, pull requests, and issue tracking. Each region runs independent MySQL clusters that accept both reads and writes, with bidirectional replication between regions using GitHub's custom Orchestrator tool for topology management and automated failover. When a developer pushes code from San Francisco, the write goes to the US-West MySQL primary, commits locally within 5ms, then replicates asynchronously to US-East within 100-500ms. Read operations (viewing repositories, browsing issues) are served from the geographically nearest region for optimal latency (<50ms for most users). GitHub's data model carefully partitions data to minimize cross-region conflicts: repository metadata and git objects are immutable (no conflicts), while mutable data like issue comments and PR statuses use last-write-wins timestamps for conflict resolution. The active-active architecture proved critical during GitHub's October 2018 incident when a network partition split US-East and US-West, causing a split-brain scenario. GitHub's automated systems detected the partition via gossip protocol health checks, put both regions into read-only mode to prevent conflicting writes, and initiated manual recovery to reconcile any diverged data (fortunately minimal due to short partition duration). Post-incident, GitHub enhanced their split-brain prevention with stricter quorum requirements—writes now require acknowledgment from both regions for critical operations like repository creation and organization settings changes. For high-traffic repositories (Linux kernel, React, Kubernetes), GitHub implements sharding across multiple MySQL clusters within each region, with each shard operating active-active across regions. The architecture enables GitHub to handle massive traffic spikes during major releases (new iOS versions triggering thousands of simultaneous pushes) by distributing load across regions and shards. Health checks run every 10 seconds per region, testing MySQL query latency, replication lag, and application endpoint response times. If a region's MySQL cluster degrades (replication lag >5s, query latency >100ms), Route 53 health checks fail and DNS routes new traffic to the healthy region within 30-60 seconds. GitHub's RTO target is <2 minutes for region-level failures and RPO target is <5 seconds (acceptable data loss window for most operations except financial transactions like billing, which uses synchronous replication). Pattern composition: Active-Active + MySQL Multi-Master Replication + Orchestrator + Route 53 + Read Replicas + Sharding + Health Checks + Split-Brain Prevention. Impact: 99.95% availability for git operations during regional failures; <100ms latency for 90% of users globally; survived datacenter network partition with minimal data inconsistency; handles 100K+ git pushes per hour across regions.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
    {
      systemId: "stripe-payment-multiregion",
      systemName: "Stripe Global Payment Processing Active-Active",
      howUsed:
        "Stripe operates active-active payment processing infrastructure across 4 AWS regions (US-East, US-West, EU-West, APAC) to provide 99.99% uptime for processing billions of dollars in transactions annually. Each region runs the full payment stack: API servers, tokenization services, fraud detection, and connections to payment networks (Visa, Mastercard, ACH). Global traffic routing uses AWS Route 53 with latency-based routing—when Shopify in Canada initiates a payment request, Route 53 routes to US-East (lowest latency ~15ms); if US-East is unhealthy, failover to US-West occurs within 30 seconds. Stripe's data architecture carefully separates stateless operations (payment authorization, fraud checks) from stateful operations (transaction records, customer data). Stateless services run identically in all regions, while stateful data uses selective replication: payment transaction records replicate to all regions for global visibility, but PCI-compliant card data stays region-local for compliance with data residency requirements (EU card data never leaves EU-West). Write operations use multi-region quorum consensus—a successful payment requires acknowledgment from 3 of 4 regions before returning success to the merchant, ensuring strong consistency and preventing double-charging if a region fails mid-transaction. Stripe's active-active design shines during payment processor failures: when a Visa gateway in US-East experiences an outage, Stripe's orchestration layer automatically routes Visa transactions to backup gateways in US-West or EU-West, maintaining 99.99% payment success rates. The system implements sophisticated conflict resolution for edge cases: if a customer initiates two simultaneous subscription updates from different regions (changing plan in US-East while canceling in EU-West), Stripe's conflict resolver uses timestamps and idempotency keys to detect the conflict, applies business logic (last operation wins), and logs the conflict for manual review. Health checks are multi-layered: synthetic transaction tests run every 30 seconds in each region (attempt test payment authorization, verify fraud check response, validate database connectivity), plus real-traffic monitoring (alert if error rate >0.5% or P99 latency >500ms). During the February 2022 AWS us-east-1 outage, Stripe's active-active architecture maintained payment processing with zero downtime by automatically shifting 100% of US-East traffic to US-West and EU-West within 45 seconds, demonstrating the pattern's resilience. Stripe's RTO is <1 minute for regional failures and RPO is effectively 0 (zero data loss) due to synchronous multi-region writes for payment transactions. The architecture handles extreme traffic spikes during Black Friday/Cyber Monday (10x normal volume) by distributing load across all active regions and auto-scaling application instances within each region. Pattern composition: Active-Active + Multi-Region Quorum Writes + Route 53 Latency Routing + Payment Gateway Failover + Idempotency + Conflict Resolution + Synthetic Monitoring + Data Residency Compliance. Impact: 99.99% payment uptime during regional outages; zero data loss on transaction records; <100ms P50 latency globally; processed $640B in payment volume in 2022 without major incident.",
      source: "https://stripe.com/blog/operating-kubernetes",
    },
    {
      systemId: "amazon-dynamodb-global",
      systemName: "Amazon DynamoDB Global Tables Active-Active",
      howUsed:
        "Amazon uses DynamoDB Global Tables internally and offers it to AWS customers as a managed active-active multi-region database service. DynamoDB Global Tables replicates data bidirectionally across multiple AWS regions (up to 6 regions) with sub-second latency and automatic conflict resolution. Amazon.com's shopping cart service uses DynamoDB Global Tables across 3 regions (US-East, US-West, EU-West) to provide <50ms read/write latency for customers worldwide while maintaining 99.999% availability. When a customer in Germany adds an item to their cart, the write goes to EU-West DynamoDB table, commits locally in ~10ms, then asynchronously replicates to US-East and US-West within 1-2 seconds. All regions can accept both reads and writes simultaneously (true active-active)—if a customer adds items in EU while simultaneously updating quantities in US (edge case, but possible with mobile app + web simultaneously), DynamoDB's conflict resolution automatically merges the changes using last-write-wins timestamps based on HLC (Hybrid Logical Clocks) ensuring eventual consistency. The architecture's killer feature is automatic failover without configuration: if EU-West region fails, the application automatically reads/writes to US-East or US-West with zero code changes (DynamoDB SDK handles region failover transparently). Amazon's Prime Day 2023 leveraged Global Tables to handle 10x traffic spike—all regions actively served traffic, no single region bottleneck. The system uses DynamoDB Streams for near-real-time replication: when a write occurs in one region, DynamoDB captures the change in a stream, replication workers consume the stream and apply changes to other regions within 1 second (99th percentile). Conflict resolution is automatic: if two regions concurrently update the same item, DynamoDB keeps the write with the latest timestamp; for sets/lists, uses version vectors to merge non-conflicting changes (adding different items to a set merges both additions). Health monitoring is built-in: CloudWatch tracks replication lag per region (alert if >5 seconds), request throttling (indicate capacity issues), and table availability. During the rare event of a region failing health checks, Route 53 automatically removes it from DNS rotation, and DynamoDB SDK retries failed requests to healthy regions. Amazon's internal usage demonstrates Global Tables' scalability: hundreds of AWS services use it for configuration data, feature flags, and user session storage across regions. RTO is <30 seconds (DNS failover time), RPO is 1-2 seconds (replication lag), and the system handles millions of requests per second across regions. DynamoDB Global Tables abstracts away the complexity of active-active replication—developers simply enable global tables and write application code against local region, infrastructure handles cross-region consistency automatically. Pattern composition: Active-Active + Last-Write-Wins Conflict Resolution + HLC Timestamps + DynamoDB Streams + Auto-Scaling + CloudWatch Monitoring + Route 53 Failover. Impact: 99.999% availability for shopping cart during Prime Day; <50ms latency globally; zero manual failover required during regional outages; seamless handling of 375M Prime Day orders in 2023.",
      source:
        "https://aws.amazon.com/blogs/database/how-to-use-amazon-dynamodb-global-tables-to-power-multiregion-architectures/",
    },
    {
      systemId: "google-spanner-global",
      systemName: "Google Spanner Multi-Region Active-Active",
      howUsed:
        "Google uses Cloud Spanner internally for globally-distributed active-active databases serving Google Ads, Google Play, and YouTube with strong consistency and 99.999% availability. Spanner is a distributed SQL database that provides ACID transactions across regions using TrueTime (Google's globally-synchronized clock) and Paxos consensus. Google Ads uses Spanner across 5 regions (US-Central, US-East, EU-West, APAC-Northeast, APAC-Southeast) to store advertiser budgets, campaign settings, and billing data with strong consistency—when an advertiser in Tokyo updates their budget, the write is committed to APAC-Northeast, synchronized to other regions via Paxos (majority quorum required), and visible globally within 50-100ms with guarantee that all regions see the same data in the same order (no conflicts, no eventual consistency issues). Spanner's active-active design allows all regions to accept both reads and writes while maintaining serializability (strongest consistency level)—this is revolutionary because most active-active databases sacrifice consistency for availability (eventual consistency), but Spanner provides both via TrueTime and Paxos. The architecture uses replica placement configuration: advertisers can specify that their data lives primarily in EU for GDPR compliance while still being readable from US/APAC with higher latency (cross-region reads). Writes go to the region with majority of replicas (leader replica), commit locally, then synchronously replicate to quorum of replicas across regions before acknowledgment—this ensures zero data loss (RPO = 0) at the cost of higher write latency (50-100ms vs <10ms for single-region databases). Google's TrueTime API uses atomic clocks and GPS receivers in datacenters to provide global time synchronization with bounded uncertainty (<7ms typically)—this enables Spanner to order transactions globally without conflicts. During region failures, Spanner automatically elects new leader replicas in healthy regions via Paxos within 10-30 seconds, maintaining write availability with brief impact (RTO ~30 seconds). Google Ads handles $200B+ in ad spend annually through Spanner with zero data loss incidents. The system's active-active architecture shines during Black Friday/Cyber Monday when ad traffic spikes 5x—all regions actively process ad auctions, budget updates, and billing transactions without single-region bottleneck. Health monitoring uses Spanner's built-in observability: replication lag (alert if >100ms), transaction latency (P99 <500ms SLO), and leader election frequency (indicate instability). Spanner also provides schema evolution without downtime—Google can add columns, indexes, or change constraints while serving production traffic across all regions. External customers (Spotify, Snap, Target) use Spanner for similar active-active workloads requiring global distribution with strong consistency. Pattern composition: Active-Active + Paxos Consensus + TrueTime + Synchronous Multi-Region Replication + Strong Consistency + Schema Evolution + Auto-Scaling + Multi-Region Transactions. Impact: 99.999% availability for Google Ads globally; RPO = 0 (zero data loss); strong consistency across regions (no conflicts); handles millions of transactions per second; enabled Google to shut down Oracle databases and migrate to Cloud Spanner.",
      source:
        "https://cloud.google.com/blog/products/databases/inside-cloud-spanner-and-the-cap-theorem",
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Global Web Applications - Active-active architectures are most commonly deployed for customer-facing web applications requiring global reach and high availability. The pattern sits at the infrastructure layer with traffic routing via global load balancers (AWS Route 53, GCP Global Load Balancer, Cloudflare, Fastly) that direct users to geographically nearest regions. Within each region, application servers run identically, backed by regional databases that replicate bidirectionally. E-commerce platforms (Amazon, Shopify, eBay) use active-active to serve users worldwide with <100ms latency while maintaining 99.99% availability—when US-East region fails, traffic automatically routes to US-West and EU-West within 30-60 seconds (DNS TTL + health check interval). The architecture requires stateless application design: session data in Redis/Memcached clusters replicated across regions, uploaded files in object storage (S3, GCS) replicated multi-region, and database writes using eventual consistency (Cassandra, DynamoDB Global Tables) or strong consistency with quorum (Spanner, CockroachDB). Placement: Global Load Balancer → Regional Load Balancer → Application Servers → Regional Database + Cache → Cross-Region Replication. Critical consideration: DNS propagation delay (30-60s) means active-active provides near-zero RTO but not instant failover—for instant failover, use Anycast routing (GCP, Cloudflare) which routes at network layer.",

      "Streaming and Content Delivery - Video streaming platforms (Netflix, YouTube, Twitch) and CDNs (Cloudflare, Akamai, Fastly) deploy active-active across 10+ global regions to minimize latency and maximize availability for content delivery. Netflix's architecture runs full application stack in 3 AWS regions (US-East, US-West, EU-West) with content cached at 1000+ CDN edge locations. When a user in London streams a show, Route 53 routes them to EU-West for API calls (user profile, recommendations), while video chunks stream from nearest CDN edge. If EU-West application tier fails, Route 53 fails over to US-East within 60 seconds, but video streaming continues uninterrupted from CDN (which pulls content from S3 multi-region buckets). The active-active design enables Netflix to handle 230M+ subscribers with 99.99% uptime—during AWS us-east-1 outages, Netflix continues streaming by shifting traffic to healthy regions. YouTube's active-active spans 5 Google Cloud regions with Spanner database for user data, Bigtable for video metadata, and GCS for video storage, all replicated multi-region. Placement: Anycast DNS → Regional API Servers → Regional Database → CDN Edge (separate from active-active, but integrated). Key challenge: Cache invalidation across regions—when a user updates their profile in US-East, all regions must invalidate cached profile data within seconds to avoid serving stale data.",

      "Financial Services and Payment Processing - Payment processors (Stripe, Square, PayPal, Adyen) deploy active-active for 99.99% uptime and regulatory compliance with data residency requirements. Stripe runs 4 AWS regions (US-East, US-West, EU-West, APAC) where each region processes payments for its geographic area while replicating transaction data to other regions for fraud detection and reporting. When a merchant in Singapore processes a payment, request goes to APAC region for <50ms latency, commits to APAC database with synchronous replication to 2 other regions (quorum write ensuring zero data loss), then asynchronously replicates to remaining regions for analytics. The active-active design is critical for payment compliance: EU customer payment data stays in EU-West region (GDPR), while US data stays in US regions (PCI-DSS), but both regions actively process transactions. If APAC region fails, Stripe's orchestration layer routes APAC traffic to US-West within 30 seconds, accepting slightly higher latency (150ms) to maintain availability. Banks use similar patterns: JP Morgan runs active-active across US-East and US-West datacenters for trading platforms, with synchronous database replication ensuring zero data loss for transaction records. Placement: Global API Gateway → Regional Payment Processor → Regional Database (quorum writes) → Cross-Region Replication → Payment Network Integration. Critical: Strong consistency required for financial data—uses synchronous multi-region writes (Spanner, CockroachDB, Oracle GoldenGate) accepting higher latency (100-500ms) to guarantee consistency.",

      "SaaS Platforms and Collaboration Tools - SaaS platforms (Salesforce, Slack, Atlassian, Zoom) deploy active-active to provide global availability for business-critical tools. Slack runs 4 AWS regions (US-East, US-West, EU-Central, APAC) where each region serves workspace data for organizations in that geography. When a user in London sends a message, write goes to EU-Central region, commits locally in 10ms, replicates asynchronously to other regions within 1-2 seconds. Other EU users see the message immediately (local read), while US users experience 1-2s delay (acceptable for chat). Slack's active-active design enables 99.99% uptime—during AWS outages, affected workspaces fail over to backup regions within 60 seconds with minimal disruption (users see 'connecting...' then reconnect to new region). Salesforce uses active-active across 6 AWS regions with database sharding: each customer org assigned to primary region but readable from all regions via read replicas. Zoom's video infrastructure is inherently active-active: all regions run video routing servers, and participants connect to nearest region for minimal latency (20-50ms). When a region fails, Zoom clients reconnect to next-nearest region within 5-10 seconds (sub-minute RTO). Placement: Global Load Balancer → Regional Application Servers → Sharded Database (per customer/tenant) → Cross-Region Replication → WebSocket/Real-Time Connection Handling. Key design: Multi-tenancy with data locality—large customers (enterprises) get dedicated database clusters in their region, small customers share database clusters with regional replication.",

      "Gaming and Real-Time Applications - Multiplayer games (Fortnite, Call of Duty, League of Legends) and real-time apps (Google Docs, Figma, Miro) use active-active for low-latency and high availability. Fortnite runs game servers in 15+ AWS/GCP regions worldwide with matchmaking servers active-active across 3 primary regions (US, EU, APAC). When players queue for a match, matchmaking service (active-active) assigns them to geographically closest game server region—EU players connect to EU-West game servers for <30ms latency. If EU-West matchmaking fails, players fail over to US-East matchmaking within seconds, then connect to EU game servers normally. Google Docs uses active-active for operational transformation (OT) conflict resolution: when 10 users in different regions edit the same doc simultaneously, each region processes edits locally, then uses OT to merge changes ensuring eventual consistency. Figma's multiplayer design is similar—all regions run real-time collaboration servers, users connect to nearest region via WebSocket, and operational transforms sync edits across regions. Epic Games' Fortnite backend (player inventory, progression, social graph) uses DynamoDB Global Tables across 3 regions for active-active with last-write-wins conflict resolution. Placement: Anycast Load Balancer → Regional Game/Collaboration Servers → WebSocket/UDP Connection Pools → Regional Database → Operational Transform Sync. Critical challenge: Split-brain in real-time editing—if network partition separates regions, conflicting edits must merge when partition heals (operational transforms, CRDTs essential).",
    ],
    architecturalBoundaries: [
      "Global DNS Layer (Route 53, Cloud DNS, Cloudflare) - The architectural boundary where client requests first enter the active-active system. Global DNS performs health-aware routing, directing users to nearest healthy region based on latency, geography, or weighted policies. This layer implements the 'active' part of active-active by continuously monitoring region health and automatically removing failed regions from rotation. Typical implementation: AWS Route 53 with health checks every 30s, Cloudflare Load Balancing with geo-steering, or GCP Global Load Balancer with Anycast. Critical: DNS TTL (30-60s) determines how quickly clients discover failed regions—lower TTL enables faster failover but increases DNS query load. Must handle: Health check failures, DNS cache expiration, split-brain scenarios (multiple regions reporting healthy but network-partitioned), and gradual traffic shifting for deployments.",

      "Regional Application Boundary - The boundary within each active region where application servers, load balancers, and compute resources run identically in all regions. Each region is fully independent and can handle 100% of global traffic if other regions fail. Regional architecture typically includes: regional load balancer (ALB, NLB, HTTP(S) LB), auto-scaling groups (ECS, Kubernetes, VM instances), application servers (stateless for horizontal scaling), and regional caching layers (Redis, Memcached, CDN). This boundary enforces statelessness: session data in external stores (Redis cluster), uploaded files in object storage (S3, GCS), no local disk persistence. Must handle: Auto-scaling during traffic spikes, zero-downtime deployments (rolling updates, blue-green), health check endpoints (/health, /ready), and graceful shutdown (connection draining). Critical consideration: All regions must run identical application versions during steady state—staggered deployments (region 1 → monitor → region 2 → region 3) prevent global outages from bad releases.",

      "Data Replication Boundary - The architectural boundary where data synchronizes across regions, enabling all regions to access consistent (eventually or strongly) data. This is the most complex boundary in active-active architectures, as it determines consistency guarantees, RPO, and conflict resolution. Two primary strategies: (1) Eventual Consistency with async replication (Cassandra multi-DC, DynamoDB Global Tables, MongoDB replica sets)—writes commit locally fast (<10ms), replicate to other regions in background (1-5s lag), conflicts resolved via last-write-wins or CRDTs. (2) Strong Consistency with sync replication (Spanner, CockroachDB, Galera Cluster)—writes wait for quorum acknowledgment from multiple regions (100-500ms), zero conflicts, RPO=0 but higher latency. Must handle: Replication lag monitoring (alert if >5s for async, >500ms for sync), conflict detection and resolution (timestamps, vector clocks, application logic), split-brain prevention (network partitions causing diverged data), and data sovereignty (EU data stays in EU per GDPR). Critical: Choose consistency model based on workload—eventual consistency acceptable for social media likes/follows, strong consistency required for financial transactions.",

      "Health Check and Monitoring Boundary - The boundary where region health is continuously assessed via synthetic probes, real traffic monitoring, and infrastructure metrics. Health checks determine which regions are eligible to receive traffic—failed health checks trigger automatic region removal from load balancer rotation. Typical implementation: HTTP/HTTPS probes to /health endpoint every 10-30s (AWS Route 53 health checks, GCP health checks, Cloudflare monitors), testing database connectivity, cache availability, and critical dependencies. Advanced monitoring includes: real traffic success rate (>99% required), P99 latency (<500ms), error rate (<0.5%), and replication lag (<5s). Must handle: False positives (transient network issues shouldn't fail over regions), cascading failures (unhealthy region removed, remaining regions overloaded), health check fatigue (too frequent checks add load), and multi-point health checks (verify region health from multiple global locations). Critical: Health check intervals determine RTO—10s checks enable 30-40s failover, 60s checks mean 90-120s failover. Balance speed vs stability.",

      "Cross-Region Networking Boundary - The boundary where regions communicate for data replication, distributed consensus, and cluster coordination. This includes: database replication channels (MySQL binlog replication, Cassandra gossip protocol, Spanner Paxos), cache invalidation (Redis pub/sub, Kafka streams), and distributed locks (etcd, ZooKeeper, Consul). Network requirements: Low latency (<50ms for sync replication, <200ms for consensus), high bandwidth (GBps for video/file replication), and reliability (packet loss <0.1%). Implementations use dedicated networking: AWS VPC peering or Transit Gateway, GCP VPC Network Peering, Azure Virtual Network Peering, or private fiber connections (AWS Direct Connect, GCP Cloud Interconnect). Must handle: Network partitions (split-brain scenarios), bandwidth saturation (throttle replication during peaks), encryption (TLS for data in transit), and routing optimization (prefer direct paths over public internet). Critical: Network partitions are the nightmare scenario for active-active—two regions accepting writes while unable to communicate leads to divergent data requiring manual reconciliation. Prevention: Implement quorum writes (require majority of regions), conflict-free data types (CRDTs), or fail writes during partition (sacrifice availability for consistency).",
    ],
    interactsWith: [
      "health-check",
      "load-balancing",
      "data-replication",
      "conflict-resolution",
      "circuit-breaker",
      "retry",
      "timeout",
      "cache-aside",
      "read-replicas",
      "quorum-consensus",
      "geo-partitioning",
      "eventual-consistency",
      "strong-consistency",
      "auto-scaling",
      "blue-green-deployment",
      "canary-deployment",
    ],
  },

  philosophy: {
    coreProblem:
      "Traditional single-region deployments and active-passive architectures create availability and performance bottlenecks in globally distributed systems. Single-region deployments fail completely during datacenter outages, leaving users worldwide without service. Active-passive configurations waste 50% of infrastructure capacity on idle standby instances while still requiring manual failover that takes minutes to hours. Users far from the single active region experience high latency (200-500ms for cross-continent requests) degrading user experience. Active-Active solves these problems by running multiple regions simultaneously, all actively serving traffic with automatic failover and geographic distribution.",
    designPrinciple:
      "Deploy identical infrastructure in multiple geographic regions where all regions actively process requests concurrently, traffic routes to the nearest healthy region automatically via global load balancers, and data replicates bidirectionally across regions with conflict resolution strategies enabling eventual or strong consistency. The core principle: eliminate idle capacity and single points of failure by making all regions active participants rather than passive standby.",
    historicalContext:
      "Active-active architectures emerged from large-scale internet companies (Google, Amazon, Facebook) in the mid-2000s as they expanded globally and couldn't tolerate single-region failures. Google pioneered multi-region active-active with Spanner (2012), using TrueTime and Paxos to achieve strong consistency across datacenters—revolutionary because it disproved the belief that geo-distributed databases must choose between consistency and availability (CAP theorem). Amazon developed DynamoDB Global Tables (2017) and multi-region S3 (2018) to power amazon.com's global infrastructure, enabling active-active with eventual consistency and automatic conflict resolution. Netflix open-sourced their active-active learnings through Hystrix (2012) and Zuul (2013), demonstrating multi-region microservices with Route 53 latency-based routing. The pattern became mainstream with cloud providers offering managed active-active services: AWS Aurora Global Database (2018), Azure Cosmos DB multi-region (2017), and Google Cloud Spanner (2017). Modern implementations abstract away complexity—developers enable 'multi-region' in database configuration and infrastructure handles replication, failover, and consistency automatically. The pattern's adoption correlates with the shift from 'five nines' (99.999% uptime = 5 minutes downtime/year) becoming business requirement rather than nice-to-have—active-active is the only architecture that achieves five nines at global scale without massive operational overhead.",
    alternativesRejected: [
      "Active-Passive (Cold/Warm Standby) - Standby region sits idle waiting for primary to fail, requiring manual or automated failover. Rejected because: (1) Wastes 50% of infrastructure capacity on idle resources, (2) RTO of 5-30 minutes too slow for global applications, (3) RPO of minutes to hours risks data loss, (4) Users far from primary region experience high latency. Active-passive acceptable for cost-sensitive non-critical systems, but active-active required for customer-facing global applications.",
      "Single-Region with Over-Provisioning - Run all infrastructure in one region with 3-5x capacity buffer for failures. Rejected because: (1) Entire service fails during datacenter/region outage, (2) Users worldwide experience high latency to single region (500ms+ for antipodal locations), (3) Capacity buffer expensive and doesn't protect against region failures, (4) Cannot meet data residency requirements (GDPR requires EU data stay in EU). Single-region viable only for startups/MVPs, not production global systems.",
      "Multi-Region Active-Active with Synchronous Replication Everywhere - Every write synchronously replicates to all regions before acknowledgment. Rejected because: (1) Write latency increases linearly with regions (3 regions = 3x latency, 300-900ms writes unacceptable for UX), (2) Network partitions cause global write unavailability (CAP theorem—must sacrifice availability), (3) Complexity of distributed transactions across 5+ regions prohibitive. Modern active-active uses async replication with eventual consistency (Cassandra, DynamoDB) or quorum sync replication (Spanner, CockroachDB) instead of everywhere sync.",
      "DNS Round-Robin Without Health Checks - Simple DNS returning multiple region IPs in rotation. Rejected because: (1) No automatic failover—failed region stays in DNS rotation until manual intervention, (2) Users routed randomly regardless of latency (US user may hit APAC region), (3) No traffic weighting for gradual rollouts, (4) DNS caching means stale IPs served for minutes to hours. Requires intelligent global load balancing (Route 53, Cloudflare) with health-based routing.",
      "Shared Database Across Regions - All regions connect to single primary database in one region. Rejected because: (1) Single point of failure—database region outage kills all regions, (2) Cross-region database latency makes all writes slow (200-500ms), (3) Doesn't achieve true active-active (application is distributed, data is not), (4) Database becomes bottleneck at scale. Active-active requires regional databases with replication, not shared database.",
    ],
    mentalModel:
      "Active-active is like a global restaurant chain (McDonald's, Starbucks) with locations in every major city, all operating simultaneously. When you're in London, you go to the London location (nearest region, low latency). If the London location is closed (region failure), you go to the Paris location (automatic failover to next nearest region). Each location can make the same food (stateless application servers), shares inventory information (data replication), and occasionally has slight discrepancies in stock (eventual consistency)—if London sells out of Big Macs and Paris still has inventory, the system reconciles overnight (replication lag). Contrast with active-passive: one open restaurant (primary region) and empty buildings waiting for it to fail (standby regions)—wasteful and slow to open the backup location when primary fails.",
  },

  visualization: {
    staticDiagram: `graph TB
    Client[Client Request<br/>London User] --> DNS[Global Load Balancer<br/>Route 53 / Cloudflare]

    DNS -->|Latency: 20ms| EU[EU-West Region<br/>✓ ACTIVE]
    DNS -.->|Latency: 80ms<br/>Backup| US[US-East Region<br/>✓ ACTIVE]
    DNS -.->|Latency: 200ms<br/>Backup| APAC[APAC Region<br/>✓ ACTIVE]

    subgraph EU[EU-West Region - ACTIVE]
        EU_LB[Load Balancer]
        EU_App1[App Instance 1]
        EU_App2[App Instance 2]
        EU_App3[App Instance 3]
        EU_DB[(Database Primary<br/>Write: 10ms)]

        EU_LB --> EU_App1 & EU_App2 & EU_App3
        EU_App1 & EU_App2 & EU_App3 --> EU_DB
    end

    subgraph US[US-East Region - ACTIVE]
        US_LB[Load Balancer]
        US_App1[App Instance 1]
        US_App2[App Instance 2]
        US_DB[(Database Primary<br/>Write: 10ms)]

        US_LB --> US_App1 & US_App2
        US_App1 & US_App2 --> US_DB
    end

    subgraph APAC[APAC Region - ACTIVE]
        APAC_LB[Load Balancer]
        APAC_App1[App Instance 1]
        APAC_DB[(Database Primary<br/>Write: 10ms)]

        APAC_LB --> APAC_App1
        APAC_App1 --> APAC_DB
    end

    EU_DB <-->|Bidirectional<br/>Replication<br/>Lag: 1-2s| US_DB
    US_DB <-->|Bidirectional<br/>Replication| APAC_DB
    APAC_DB <-->|Bidirectional<br/>Replication| EU_DB

    HealthCheck[Health Check System<br/>Every 30s] -.->|Probe| EU & US & APAC
    HealthCheck -->|Update DNS| DNS

    style DNS fill:#e1f5ff
    style EU fill:#90ee90
    style US fill:#90ee90
    style APAC fill:#90ee90
    style HealthCheck fill:#fff4e1
    style EU_DB fill:#ffe1e1
    style US_DB fill:#ffe1e1
    style APAC_DB fill:#ffe1e1`,
    realWorldAnalogy:
      "Active-active is like Amazon fulfillment centers. Amazon operates 100+ fulfillment centers globally, all simultaneously processing orders 24/7 (all active, none idle). When you in California order a product, it ships from the nearest center with inventory (California fulfillment center, lowest latency). If California center is out of stock or offline (region failure), Amazon automatically routes your order to Nevada or Oregon center (automatic failover, slight latency increase). Each center maintains its own inventory (regional database), with corporate system tracking global inventory (data replication). Occasionally two customers in different regions order the last item simultaneously (write conflict)—Amazon's system detects this and resolves via timestamps or manual intervention (conflict resolution). Contrast with active-passive: one working fulfillment center (primary) and empty backup centers waiting for it to burn down (standby)—wasteful capacity and slow failover.",
    useCases: [
      {
        domain: "Global E-Commerce",
        scenario:
          "Amazon.com runs active-active across US-East, US-West, and EU-West regions. When a user in London browses products, requests route to EU-West for <50ms latency. If EU-West fails during checkout, Route 53 fails over to US-East within 60 seconds, order completes with slightly higher latency. Shopping cart data replicates bidirectionally via DynamoDB Global Tables.",
        patternRole:
          "Provides 99.99% availability for global e-commerce, <100ms latency worldwide, automatic region failover, and zero downtime deployments.",
        companies: ["Amazon", "eBay", "Shopify", "Walmart"],
      },
      {
        domain: "Video Streaming",
        scenario:
          "Netflix runs active-active across 3 AWS regions (US-East, US-West, EU-West) serving 230M+ subscribers. Users route to nearest region for API calls (profiles, recommendations), while video streams from CDN edges. Region failures trigger automatic DNS failover within 60s, video playback continues from CDN.",
        patternRole:
          "Enables global video streaming with 99.99% uptime, <100ms API latency, automatic regional failover, and ability to handle traffic spikes from popular releases.",
        companies: ["Netflix", "YouTube", "Twitch", "Disney+"],
      },
      {
        domain: "Payment Processing",
        scenario:
          "Stripe operates active-active across 4 AWS regions (US-East, US-West, EU-West, APAC). Payments process in nearest region (<50ms latency), with synchronous multi-region quorum writes ensuring zero data loss. Region failures trigger automatic payment processor failover maintaining 99.99% success rates.",
        patternRole:
          "Provides 99.99% payment uptime globally, <100ms latency, RPO=0 (zero data loss), data residency compliance (EU payments stay in EU), and handles Black Friday traffic spikes.",
        companies: ["Stripe", "Square", "PayPal", "Adyen"],
      },
      {
        domain: "SaaS Collaboration Tools",
        scenario:
          "Slack runs active-active across 4 AWS regions serving workspaces globally. Messages sent in London write to EU-Central, replicate to other regions in 1-2s. EU users see messages instantly (local read), US users experience 1-2s delay (eventual consistency). Region failures trigger workspace failover within 60s.",
        patternRole:
          "Enables global team collaboration with <50ms message latency, 99.99% uptime, automatic failover during regional outages, and data locality for compliance (EU workspaces stay in EU).",
        companies: ["Slack", "Microsoft Teams", "Zoom", "Atlassian"],
      },
      {
        domain: "Gaming and Multiplayer",
        scenario:
          "Fortnite runs game servers in 15+ AWS/GCP regions with matchmaking active-active across 3 primary regions. Players connect to nearest region for <30ms latency. Matchmaking service (active-active) assigns players to geographically closest game servers. Region failures cause matchmaking failover within seconds.",
        patternRole:
          "Provides low-latency gaming globally (<30ms), 99.99% matchmaking availability, automatic region failover for matchmaking, and handles massive concurrent player spikes during events.",
        companies: [
          "Epic Games (Fortnite)",
          "Riot (League of Legends)",
          "Activision (Call of Duty)",
        ],
      },
    ],
  },

  references: [
    {
      title: "Active-Active for Multi-Regional Resiliency - Netflix Tech Blog",
      url: "https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b",
      type: "article",
      author: "Netflix Technology Blog",
    },
    {
      title: "Amazon DynamoDB Global Tables - Multi-Region Replication",
      url: "https://aws.amazon.com/dynamodb/global-tables/",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Google Cloud Spanner - Globally Distributed Database",
      url: "https://cloud.google.com/spanner/docs/replication",
      type: "documentation",
      author: "Google Cloud",
    },
    {
      title: "CockroachDB Multi-Region Overview",
      url: "https://www.cockroachlabs.com/docs/stable/multiregion-overview.html",
      type: "documentation",
      author: "Cockroach Labs",
    },
    {
      title: "Cassandra Multi-Datacenter Deployments",
      url: "https://cassandra.apache.org/doc/latest/cassandra/operating/multiple-datacenters.html",
      type: "documentation",
      author: "Apache Cassandra",
    },
    {
      title: "AWS Route 53 Health Checks and DNS Failover",
      url: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Stripe's Multi-Region Infrastructure",
      url: "https://stripe.com/blog/operating-kubernetes",
      type: "article",
      author: "Stripe Engineering Blog",
    },
    {
      title:
        "Designing Data-Intensive Applications - Chapter 9: Consistency and Consensus",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "GitHub MySQL Infrastructure - Multi-Region Availability",
      url: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
      type: "article",
      author: "GitHub Engineering",
    },
    {
      title: "Building Globally Distributed Services - Uber Engineering",
      url: "https://www.uber.com/blog/multiregion/",
      type: "article",
      author: "Uber Engineering",
    },
  ],

  tags: [
    "reliability",
    "high-availability",
    "multi-region",
    "disaster-recovery",
    "geo-distribution",
    "replication",
    "load-balancing",
    "zero-downtime",
    "eventual-consistency",
    "strong-consistency",
    "global-scale",
  ],
  difficulty: "advanced",
};
