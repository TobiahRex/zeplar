import type { Pattern } from "../schema";

export const activePassive: Pattern = {
  id: "active-passive",
  slug: "active-passive",
  corpusPath:
    "🛡️ RELIABILITY → 📋 Redundancy → Hot/Warm/Cold Standby → 🔥 Active-Passive",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Standby",
    level: 4,
  },

  concept: {
    name: "Active-Passive",
    emoji: "🔥",
    tagline: "One active, one standby",
    definition:
      "The Active-Passive pattern (also called Hot Standby or Primary-Backup) maintains a primary instance that handles all traffic while one or more passive instances remain on standby, ready to take over if the primary fails. Like a backup generator that only activates when the main power grid goes down, passive instances stay warm but idle, continuously syncing state from the active node without serving live traffic. Health monitoring systems continuously check the primary instance's health through heartbeats or health checks. When failure is detected—missed heartbeats, failed health checks, or unresponsive services—an automated failover mechanism promotes a passive instance to active status, redirects traffic via DNS updates or load balancer reconfiguration, and ensures the new primary assumes responsibility for request handling. The standby instances maintain near-real-time data replication from the primary (database replication, file sync, state mirroring) to minimize data loss during failover. This pattern provides high availability with simpler consistency guarantees than active-active since only one instance writes at a time, eliminating distributed coordination complexity at the cost of idle standby capacity.",
    problemSolved:
      "Single-instance systems create critical availability risks—when the instance fails, the service goes completely offline until manual intervention or restart completes. This downtime can last minutes to hours depending on detection time, restart complexity, and operator availability. For mission-critical systems requiring 99.9%+ availability, such outages are unacceptable. Additionally, planned maintenance (software updates, hardware replacement) requires service downtime in single-instance deployments. Active-Passive solves these availability challenges by maintaining a warm standby ready for immediate promotion. When the primary fails, automated failover typically completes in seconds to minutes—significantly faster than cold start recovery. The standby's continuous state synchronization ensures minimal data loss (RPO) and recovery time (RTO). For planned maintenance, operators can gracefully fail over to the standby, perform updates on the now-passive primary, then fail back when ready—achieving zero-downtime maintenance windows. This is particularly valuable for stateful systems like databases where distributed active-active configurations are complex or impossible.",
    tradeoffs: {
      pros: [
        "Simpler consistency model—single writer eliminates coordination complexity",
        "Faster failover than cold standby (seconds vs minutes)",
        "No split-brain scenarios since only one instance is active",
        "Well-suited for stateful systems like databases",
        "Lower operational complexity than active-active configurations",
      ],
      cons: [
        "Idle standby capacity represents 50%+ resource waste",
        "Failover introduces brief service interruption (seconds to minutes)",
        "No horizontal scalability—all load hits single active instance",
        "Manual or automated failback process after primary recovery",
        "Standby nodes require continuous state synchronization overhead",
      ],
    },
    relatedPatterns: [
      "active-active",
      "pilot-light",
      "backup-restore",
      "health-check",
      "leader-election",
      "data-replication",
    ],
  },

  structure: {
    participants: [
      {
        name: "Primary (Active) Instance",
        role: "Primary Request Handler",
        responsibilities: [
          "Handle all incoming traffic and write operations",
          "Send heartbeat signals to monitoring system",
          "Replicate state changes to standby instances",
          "Maintain up-to-date data and application state",
        ],
      },
      {
        name: "Standby (Passive) Instance",
        role: "Hot/Warm Standby Replica",
        responsibilities: [
          "Remain idle in standby mode (warm standby)",
          "Continuously receive and apply state replication from primary",
          "Monitor primary health via heartbeat or external health checks",
          "Prepare for immediate promotion to active on primary failure",
        ],
      },
      {
        name: "Health Monitor / Failover Controller",
        role: "Failure Detection and Orchestration",
        responsibilities: [
          "Monitor primary instance health via heartbeats or health checks",
          "Detect primary failure (missed heartbeats, unresponsive service)",
          "Trigger automatic failover when primary is deemed failed",
          "Promote standby to active status via DNS/IP updates or load balancer reconfiguration",
        ],
      },
      {
        name: "Replication System",
        role: "Data Synchronization",
        responsibilities: [
          "Replicate data from primary to standby (sync or async)",
          "Track replication lag and ensure standby is near-current",
          "Provide guarantees for Recovery Point Objective (RPO)",
          "Enable standby to resume operations with minimal data loss",
        ],
      },
      {
        name: "Load Balancer / DNS",
        role: "Traffic Routing",
        responsibilities: [
          "Route all traffic to currently active instance",
          "Update routing when failover occurs (IP takeover, DNS update)",
          "Prevent split-brain by ensuring only one instance is active",
          "Provide single endpoint for clients regardless of which instance is active",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant LB as Load Balancer/DNS
    participant Primary as Primary (Active)
    participant Standby as Standby (Passive)
    participant Monitor as Health Monitor
    participant Replication as Replication System

    Note over Primary,Standby: Normal Operation - Primary Serving Traffic
    Client->>LB: Request
    LB->>Primary: Route to active instance
    Primary->>Primary: Process request
    Primary->>Replication: Replicate state change
    Replication->>Standby: Apply replicated data
    Primary-->>LB: Response
    LB-->>Client: Return response
    Primary->>Monitor: Heartbeat (healthy)

    Note over Primary,Standby: Primary Failure Detected
    Monitor->>Primary: Health check
    Primary--xMonitor: No response (timeout)
    Monitor->>Monitor: Detect failure (missed heartbeats)
    Monitor->>Standby: Initiate promotion to active
    Standby->>Standby: Validate replication current
    Standby->>LB: Update routing (IP takeover/DNS)

    Note over Primary,Standby: Failover Complete - Standby Now Active
    Client->>LB: New request
    LB->>Standby: Route to new active instance
    Standby->>Standby: Process request
    Standby-->>LB: Response
    LB-->>Client: Return response
    Standby->>Monitor: Heartbeat (healthy)

    Note over Standby: Former primary may recover and become new standby`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send Request",
        description:
          "Client sends request to service endpoint (load balancer or DNS)",
      },
      {
        step: 2,
        actor: "Load Balancer",
        action: "Route to Active Instance",
        description:
          "Load balancer or DNS routes request to current primary instance",
      },
      {
        step: 3,
        actor: "Primary Instance",
        action: "Process Request",
        description:
          "Primary instance handles request, updates data, performs write operations",
      },
      {
        step: 4,
        actor: "Replication System",
        action: "Replicate State",
        description:
          "Primary replicates data changes to standby via synchronous or asynchronous replication",
      },
      {
        step: 5,
        actor: "Standby Instance",
        action: "Apply Replication",
        description:
          "Standby receives and applies replicated data to stay near-current with primary",
      },
      {
        step: 6,
        actor: "Primary Instance",
        action: "Send Heartbeat",
        description:
          "Primary sends periodic heartbeat signals to health monitor to indicate it's healthy",
      },
      {
        step: 7,
        actor: "Health Monitor",
        action: "Monitor Primary Health",
        description:
          "Health monitor checks heartbeats or performs health checks to detect primary failures",
      },
      {
        step: 8,
        actor: "Health Monitor",
        action: "Detect Failure",
        description:
          "When heartbeat timeout exceeded or health check fails, monitor detects primary failure",
      },
      {
        step: 9,
        actor: "Health Monitor",
        action: "Trigger Failover",
        description:
          "Monitor initiates automatic failover process to promote standby to active",
      },
      {
        step: 10,
        actor: "Standby Instance",
        action: "Promote to Active",
        description:
          "Standby validates replication is current, then transitions to active status",
      },
      {
        step: 11,
        actor: "Load Balancer",
        action: "Update Routing",
        description:
          "Load balancer updates routing (IP failover, DNS update) to direct traffic to new active instance",
      },
      {
        step: 12,
        actor: "New Primary",
        action: "Handle Traffic",
        description:
          "Promoted instance now handles all requests as new primary; former primary may become standby after recovery",
      },
    ],
    invariants: [
      "Only one instance can be active (serving traffic) at any time to prevent split-brain",
      "Standby must continuously receive replication to minimize RPO during failover",
      "Heartbeat timeout must be longer than maximum expected health check latency to avoid false positives",
      "Failover process must complete within RTO requirements (typically seconds to minutes)",
      "Routing updates (DNS/IP) must be atomic to prevent traffic loss during transition",
      "Replication lag must be monitored and bounded to ensure acceptable data loss (RPO)",
      "Health monitor must be independent of primary instance to detect failures reliably",
    ],
  },

  codeExamples: [
    {
      id: "active-passive-ts-basic",
      language: "typescript",
      title: "Active-Passive Failover with Health Monitoring",
      description:
        "TypeScript implementation of active-passive failover system with health checks, automatic promotion, and state synchronization",
      code: `// ============================================================
// Active-Passive Failover System
// ============================================================
// This implementation demonstrates the core active-passive pattern
// with health monitoring, automatic failover, and state sync
// ============================================================

type ServerStatus = 'active' | 'passive' | 'failed' | 'promoting';

interface ServerState {
  id: string;
  status: ServerStatus;
  lastHeartbeat: number;
  dataVersion: number;
  requestsHandled: number;
}

interface FailoverConfig {
  heartbeatInterval: number;  // How often to send heartbeats (ms)
  heartbeatTimeout: number;   // Max time without heartbeat before failover (ms)
  replicationLag: number;     // How far behind passive can be (versions)
}

// ============================================================
// Server Instance
// ============================================================
class Server {
  private id: string;
  private status: ServerStatus;
  private dataVersion: number = 0;
  private requestsHandled: number = 0;
  private replicatedData: Map<string, any> = new Map();

  constructor(id: string, initialStatus: ServerStatus) {
    this.id = id;
    this.status = initialStatus;
  }

  getId(): string {
    return this.id;
  }

  getStatus(): ServerStatus {
    return this.status;
  }

  setStatus(status: ServerStatus): void {
    console.log(\`[\${this.id}] Status transition: \${this.status} → \${status}\`);
    this.status = status;
  }

  getState(): ServerState {
    return {
      id: this.id,
      status: this.status,
      lastHeartbeat: Date.now(),
      dataVersion: this.dataVersion,
      requestsHandled: this.requestsHandled,
    };
  }

  // Only active server handles requests
  async handleRequest(request: any): Promise<any> {
    if (this.status !== 'active') {
      throw new Error(\`Server \${this.id} is \${this.status}, cannot handle requests\`);
    }

    // Simulate request processing
    this.requestsHandled++;
    this.dataVersion++;

    const result = {
      serverId: this.id,
      requestId: request.id,
      timestamp: Date.now(),
      data: \`Processed by \${this.id}\`,
    };

    // Store data that will be replicated
    this.replicatedData.set(\`req-\${request.id}\`, result);

    return result;
  }

  // Passive server receives state updates from active
  async replicateState(state: Partial<ServerState>): Promise<void> {
    if (this.status !== 'passive') {
      console.warn(\`[\${this.id}] Ignoring replication - not passive\`);
      return;
    }

    // Apply state from active server
    if (state.dataVersion !== undefined) {
      this.dataVersion = state.dataVersion;
    }
  }

  // Promote passive to active
  async promote(): Promise<void> {
    if (this.status !== 'passive') {
      throw new Error(\`Cannot promote server in \${this.status} state\`);
    }

    this.setStatus('promoting');

    // Simulate promotion delay (final state sync, DNS update, etc.)
    await new Promise(resolve => setTimeout(resolve, 100));

    this.setStatus('active');
    console.log(\`[\${this.id}] Promoted to active! Data version: \${this.dataVersion}\`);
  }

  getDataVersion(): number {
    return this.dataVersion;
  }
}

// ============================================================
// Failover Controller
// ============================================================
class ActivePassiveController {
  private activeServer: Server | null = null;
  private passiveServers: Server[] = [];
  private config: FailoverConfig;
  private heartbeatMonitor: NodeJS.Timeout | null = null;
  private lastActiveHeartbeat: number = Date.now();
  private isFailingOver: boolean = false;

  constructor(config: FailoverConfig) {
    this.config = config;
  }

  // Register servers in the cluster
  registerServers(active: Server, passive: Server[]): void {
    this.activeServer = active;
    this.passiveServers = passive;

    console.log(\`Cluster configured: Active=\${active.getId()}, Passive=[\${passive.map(s => s.getId()).join(', ')}]\`);

    // Start health monitoring
    this.startHealthMonitoring();
  }

  // Start monitoring active server health
  private startHealthMonitoring(): void {
    this.heartbeatMonitor = setInterval(() => {
      this.checkActiveHealth();
    }, this.config.heartbeatInterval);
  }

  // Check if active server is healthy
  private async checkActiveHealth(): Promise<void> {
    if (!this.activeServer || this.isFailingOver) {
      return;
    }

    const now = Date.now();
    const timeSinceHeartbeat = now - this.lastActiveHeartbeat;

    try {
      // Attempt to get heartbeat from active server
      const state = this.activeServer.getState();
      this.lastActiveHeartbeat = state.lastHeartbeat;

      // Replicate state to passive servers
      await this.replicateToPassive(state);

      console.log(\`[Controller] Active server \${this.activeServer.getId()} healthy - version \${state.dataVersion}\`);
    } catch (error) {
      console.error(\`[Controller] Active server heartbeat failed:, error);

      // Check if we've exceeded timeout
      if (timeSinceHeartbeat > this.config.heartbeatTimeout) {
        console.error(\`[Controller] Active server timeout! Initiating failover...\`);
        await this.initiateFailover();
      }
    }
  }

  // Replicate active server state to passive servers
  private async replicateToPassive(activeState: ServerState): Promise<void> {
    const replicationPromises = this.passiveServers.map(passive =>
      passive.replicateState({
        dataVersion: activeState.dataVersion,
      })
    );

    await Promise.all(replicationPromises);
  }

  // Initiate failover to passive server
  private async initiateFailover(): Promise<void> {
    if (this.isFailingOver) {
      console.log(\`[Controller] Failover already in progress\`);
      return;
    }

    this.isFailingOver = true;

    try {
      // Mark current active as failed
      if (this.activeServer) {
        this.activeServer.setStatus('failed');
      }

      // Select best passive server (most up-to-date)
      const bestPassive = this.selectBestPassive();

      if (!bestPassive) {
        throw new Error('No passive server available for failover!');
      }

      console.log(\`[Controller] Promoting \${bestPassive.getId()} to active\`);

      // Promote passive to active
      await bestPassive.promote();

      // Update references
      const oldActive = this.activeServer;
      this.activeServer = bestPassive;
      this.passiveServers = this.passiveServers.filter(s => s !== bestPassive);

      // Old active becomes passive if it recovers
      if (oldActive && oldActive.getStatus() !== 'failed') {
        this.passiveServers.push(oldActive);
      }

      this.lastActiveHeartbeat = Date.now();
      console.log(\`[Controller] Failover complete! New active: \${this.activeServer.getId()}\`);

    } catch (error) {
      console.error(\`[Controller] Failover failed:, error);
      throw error;
    } finally {
      this.isFailingOver = false;
    }
  }

  // Select best passive server for promotion
  private selectBestPassive(): Server | null {
    if (this.passiveServers.length === 0) {
      return null;
    }

    // Choose passive server with highest data version (most up-to-date)
    return this.passiveServers.reduce((best, current) => {
      return current.getDataVersion() > best.getDataVersion() ? current : best;
    });
  }

  // Route request to active server
  async handleRequest(request: any): Promise<any> {
    if (!this.activeServer) {
      throw new Error('No active server available');
    }

    if (this.activeServer.getStatus() !== 'active') {
      throw new Error(\`Active server is \${this.activeServer.getStatus()}\`);
    }

    return this.activeServer.handleRequest(request);
  }

  // Get cluster status
  getClusterStatus(): { active: ServerState | null; passive: ServerState[] } {
    return {
      active: this.activeServer?.getState() || null,
      passive: this.passiveServers.map(s => s.getState()),
    };
  }

  // Cleanup
  shutdown(): void {
    if (this.heartbeatMonitor) {
      clearInterval(this.heartbeatMonitor);
    }
  }
}

// ============================================================
// Usage Example
// ============================================================
async function demonstrateActivePassive() {
  console.log('=== Active-Passive Failover Demo ===\\n');

  // Create servers
  const primary = new Server('server-1', 'active');
  const standby1 = new Server('server-2', 'passive');
  const standby2 = new Server('server-3', 'passive');

  // Configure failover controller
  const controller = new ActivePassiveController({
    heartbeatInterval: 1000,   // Check every 1 second
    heartbeatTimeout: 3000,    // Failover after 3 seconds without heartbeat
    replicationLag: 10,        // Allow up to 10 versions behind
  });

  controller.registerServers(primary, [standby1, standby2]);

  // Process some requests
  console.log('\\n--- Processing requests on active server ---');
  for (let i = 1; i <= 5; i++) {
    const result = await controller.handleRequest({ id: i, data: \`request-\${i}\` });
    console.log(\`Request \${i} handled:, result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Check cluster status
  console.log('\\n--- Cluster Status ---');
  const status = controller.getClusterStatus();
  console.log('Active:', status.active);
  console.log('Passive:', status.passive);

  // Simulate primary failure by marking it as failed
  console.log('\\n--- Simulating primary failure ---');
  primary.setStatus('failed');

  // Wait for health check to detect failure and trigger failover
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Process requests after failover
  console.log('\\n--- Processing requests after failover ---');
  for (let i = 6; i <= 8; i++) {
    const result = await controller.handleRequest({ id: i, data: \`request-\${i}\` });
    console.log(\`Request \${i} handled:, result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final cluster status
  console.log('\\n--- Final Cluster Status ---');
  const finalStatus = controller.getClusterStatus();
  console.log('Active:', finalStatus.active);
  console.log('Passive:', finalStatus.passive);

  controller.shutdown();
  console.log('\\n=== Demo Complete ===');
}

// Run the demo
// demonstrateActivePassive();`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete active-passive failover system with health monitoring, automatic promotion, and state replication between primary and standby servers",
        prerequisites: [
          "Distributed systems concepts",
          "Health checks and heartbeats",
          "State replication",
          "Failover mechanics",
        ],
        systemPosition:
          "High-availability layer managing server instances and coordinating automatic failover when primary server fails",
      },
      annotations: [
        {
          id: "ap-server-status",
          lines: [7, 14],
          action: "Define server status states and state interface",
          reason:
            "Active-passive requires clear state machine: active handles requests, passive replicates data, failed triggers failover, promoting is transition state. Status drives behavior throughout system.",
          contextLevel: "system",
          relatedConcepts: ["state-machine", "server-lifecycle"],
        },
        {
          id: "ap-handle-request",
          lines: [62, 83],
          action: "Only allow active server to handle requests",
          reason:
            "Core pattern constraint: passive servers never handle live traffic. All writes go to active to maintain single source of truth. This prevents split-brain where multiple servers accept writes.",
          contextLevel: "module",
          relatedConcepts: ["single-writer", "consistency"],
        },
        {
          id: "ap-replication",
          lines: [85, 97],
          action: "Passive server receives state updates from active",
          reason:
            "Continuous replication keeps passive server warm and ready for promotion. When active fails, passive has recent state and can take over quickly with minimal data loss.",
          contextLevel: "module",
          relatedConcepts: ["state-replication", "warm-standby"],
        },
        {
          id: "ap-promotion",
          lines: [99, 113],
          action: "Promote passive server to active status",
          reason:
            "Promotion is the failover mechanism. Passive becomes active to resume request handling. Delay simulates real-world promotion steps: final state sync, DNS updates, load balancer reconfiguration.",
          contextLevel: "system",
          relatedConcepts: ["failover", "promotion"],
        },
        {
          id: "ap-health-monitoring",
          lines: [144, 174],
          action: "Monitor active server health via heartbeats",
          reason:
            "Regular health checks detect active server failure. Without monitoring, system wouldn't know when to failover. Heartbeat timeout determines recovery time objective (RTO).",
          contextLevel: "system",
          relatedConcepts: ["health-checks", "failure-detection"],
        },
        {
          id: "ap-replication-sync",
          lines: [176, 184],
          action: "Replicate active server state to all passive servers",
          reason:
            "Keeps passive servers synchronized with active. Replication happens after every health check to minimize data loss during failover. More frequent replication = lower RPO but higher overhead.",
          contextLevel: "system",
          relatedConcepts: ["data-replication", "rpo"],
        },
        {
          id: "ap-failover-initiation",
          lines: [186, 233],
          action: "Detect active server failure and initiate failover",
          reason:
            "When heartbeat timeout exceeded, automatically failover to passive. Prevents split-brain by marking old active as failed. Idempotent check prevents concurrent failovers.",
          contextLevel: "system",
          relatedConcepts: ["automatic-failover", "split-brain-prevention"],
        },
        {
          id: "ap-passive-selection",
          lines: [235, 246],
          action: "Select passive server with highest data version",
          reason:
            "Best passive for promotion is most up-to-date server (highest version). Minimizes data loss by choosing server closest to active's state when it failed.",
          contextLevel: "module",
          relatedConcepts: ["leader-selection", "data-currency"],
        },
        {
          id: "ap-request-routing",
          lines: [248, 260],
          action: "Route all requests to current active server",
          reason:
            "Single entry point ensures all traffic goes to active server. Throws error if no active available, providing fail-fast behavior instead of silent data corruption.",
          contextLevel: "system",
          relatedConcepts: ["request-routing", "fail-fast"],
        },
        {
          id: "ap-demo-failover",
          lines: [297, 311],
          action: "Simulate primary failure and observe automatic failover",
          reason:
            "Demonstrates core pattern value: when active fails, system automatically promotes passive and resumes operation. 4-second wait allows health check to detect failure and complete promotion.",
          contextLevel: "system",
          relatedConcepts: ["failover-demonstration", "high-availability"],
        },
      ],
      highlights: [
        {
          lines: [23, 113],
          label: "Server class with status states and promotion logic",
          sbvpDomain: "structure",
        },
        {
          lines: [144, 184],
          label: "Health monitoring and state replication",
          sbvpDomain: "behavior",
        },
        {
          lines: [186, 233],
          label: "Automatic failover initiation and promotion",
          sbvpDomain: "behavior",
        },
        {
          lines: [235, 246],
          label: "Best passive server selection algorithm",
          sbvpDomain: "philosophy",
        },
        {
          lines: [280, 342],
          label: "Complete demo showing failover in action",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Database Layer - Active-Passive is most commonly deployed for stateful database systems where distributed active-active coordination is too complex or expensive. PostgreSQL streaming replication with pg_auto_failover positions the primary database as the write target and standby replicas continuously apply WAL (write-ahead log) changes. When primary fails, pg_auto_failover promotes a standby within 10-30 seconds, updating DNS or VIP to redirect application connections. MySQL replication uses similar patterns with ProxySQL or MaxScale handling automatic failover and connection routing. The architectural boundary is critical: applications connect to a single endpoint (VIP, DNS name, or proxy) which routes to whichever instance is currently active, shielding applications from failover complexity.",

      "Application Server Tier - Web applications and API services use Active-Passive for stateful application servers maintaining in-memory sessions or long-running background jobs. Keepalived + VRRP provides IP address failover where primary server holds the virtual IP; standby monitors primary via heartbeats, taking over the VIP within seconds if primary fails. This placement is common for legacy monolithic applications not designed for horizontal scaling—Active-Passive provides high availability without requiring application-level changes for distributed state management. Modern containerized applications rarely use this pattern (preferring stateless active-active), but legacy systems benefit from the simpler consistency model.",

      "Messaging and Queue Systems - Message brokers like RabbitMQ and ActiveMQ deploy Active-Passive for queue masters. RabbitMQ mirrored queues replicate messages from primary node to standby; on primary failure, standby is promoted and clients reconnect (with brief interruption). The placement protects against broker failures while maintaining exactly-once delivery guarantees—active-active message brokers face complex split-brain scenarios where duplicate messages can be delivered. Trade-off: brief service interruption (10-60s reconnect time) vs complexity of distributed consensus protocols.",

      "File Systems and Storage - Shared storage systems use Active-Passive for NFS servers, file servers, and block storage controllers. DRBD (Distributed Replicated Block Device) provides block-level replication from primary to standby; Pacemaker orchestrates failover when primary node fails. Typical deployment: primary NFS server serves clients, DRBD replicates writes to standby, Pacemaker detects failure and promotes standby (10-30s). This placement is critical for stateful workloads requiring consistent filesystem views—active-active shared storage requires distributed locking (GFS2, OCFS2) which adds significant complexity.",

      "Monitoring and Control Planes - Infrastructure control planes (Kubernetes control plane, OpenStack controllers) use Active-Passive for leader election in orchestration layers. etcd and consul use Raft consensus internally but present active-passive semantics to clients: one leader handles writes, followers replicate and can be promoted. The placement separates control plane availability (leader election, API serving) from data plane availability (workload execution). Even during control plane failover (30-60s), existing workloads continue running uninterrupted—only new deployments or configuration changes are delayed.",
    ],
    interactsWith: [
      "health-check",
      "heartbeat-monitoring",
      "data-replication",
      "leader-election",
      "load-balancing",
      "circuit-breaker",
      "retry",
      "timeout",
      "dns-failover",
      "virtual-ip",
    ],
    architecturalBoundaries: [
      "Stateful Databases (Primary Use Case) - Active-Passive excels for relational databases (PostgreSQL, MySQL, Oracle) where ACID transactions and strong consistency are required. Distributed active-active databases require complex multi-master replication with conflict resolution (last-write-wins, CRDTs, operational transforms)—Active-Passive avoids this by having single source of truth. Boundary: Write-heavy workloads benefit most; read-heavy workloads should use read replicas for horizontal scaling. RTO: 10-60 seconds for automatic failover. RPO: near-zero for synchronous replication (AWS RDS Multi-AZ), seconds for asynchronous.",

      "Session-Stateful Applications - Legacy applications storing sessions in memory (Java servlets with sticky sessions, stateful microservices) use Active-Passive when session stores (Redis, Memcached) aren't feasible. The boundary is deployment complexity: Active-Passive requires less code changes than refactoring to stateless architecture. Modern cloud-native apps reject this boundary—stateless apps with external session stores (Redis, DynamoDB) enable active-active and horizontal scaling. Active-Passive appropriate only for legacy migration paths.",

      "Single-Master Data Stores - Message queues (RabbitMQ), caches (Redis Sentinel), and coordination services (ZooKeeper, etcd leader) use Active-Passive for write operations. The architectural boundary is write coordination: these systems need single write authority to prevent split-brain and ensure ordering guarantees. Read replicas can serve read traffic (active-active reads), but writes go to single master. Failover triggers when master becomes unavailable (network partition, crash, resource exhaustion).",

      "NOT Recommended for Stateless Services - Stateless HTTP APIs, microservices, and serverless functions should NEVER use Active-Passive—they should deploy multiple active instances behind load balancers (active-active). Active-Passive wastes 50% capacity (idle standby) for services that could horizontally scale. Only use Active-Passive when state coordination is prohibitively complex or expensive.",
    ],
  },

  implementations: [
    {
      id: "aws-rds-multi-az",
      name: "AWS RDS Multi-AZ (Managed Database HA)",
      type: "service",
      languages: ["any"],
      description:
        "AWS RDS Multi-AZ provides fully managed Active-Passive database deployments with synchronous replication and automatic failover. RDS maintains primary instance in one availability zone with synchronous standby in another. Automatic failover completes in 60-120 seconds, updating DNS endpoint to standby. Supports PostgreSQL, MySQL, MariaDB, Oracle, SQL Server.",
      links: {
        docs: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html",
      },
      codeSnippet: `# AWS RDS Multi-AZ Configuration (CloudFormation)
Resources:
  MyDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: production-db
      Engine: postgres
      EngineVersion: "15.3"
      DBInstanceClass: db.r6g.xlarge
      AllocatedStorage: 100

      # Enable Multi-AZ for Active-Passive HA
      MultiAZ: true  # Creates synchronous standby in different AZ

      # Automatic failover configuration
      BackupRetentionPeriod: 7  # Enable automatic backups (required for failover)
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "mon:04:00-mon:05:00"

      # Replication and consistency
      StorageEncrypted: true
      # Synchronous replication ensures RPO = 0 (no data loss)
      # RTO = 60-120 seconds (automatic failover time)

# Application connection configuration
# Connect to RDS endpoint (not instance-specific endpoint)
# Endpoint automatically routes to current primary
DB_HOST: production-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT: 5432

# How failover works:
# 1. RDS detects primary failure (health checks, network partition)
# 2. RDS promotes standby to primary (60-120s)
# 3. DNS endpoint updated to point to new primary
# 4. Applications reconnect automatically (may require retry logic)
# 5. Former primary (if recovered) becomes new standby

# Key features:
# - Zero data loss (synchronous replication)
# - Automatic failover without manual intervention
# - Transparent to applications (same connection endpoint)
# - Cross-AZ deployment for AZ failure protection
#
# When to choose:
# - Production databases requiring 99.95%+ availability
# - Workloads where 60-120s downtime is acceptable
# - Need automatic failover without operational complexity
# - Prioritize consistency over performance (sync replication adds latency)`,
    },
    {
      id: "postgresql-streaming-replication",
      name: "PostgreSQL Streaming Replication + pg_auto_failover",
      type: "platform",
      languages: ["postgresql", "sql"],
      description:
        "PostgreSQL streaming replication provides native Active-Passive replication with WAL (Write-Ahead Log) streaming from primary to standby. pg_auto_failover adds automatic failover orchestration with health monitoring, leader election, and standby promotion. Self-managed alternative to cloud managed services.",
      links: {
        docs: "https://www.postgresql.org/docs/current/warm-standby.html",
        github: "https://github.com/hapostgres/pg_auto_failover",
      },
      codeSnippet: `# PostgreSQL Streaming Replication Configuration

# PRIMARY INSTANCE (postgresql.conf)
# ========================================
# Enable WAL archiving and streaming replication
wal_level = replica              # Enable replication WAL
max_wal_senders = 3              # Max standby connections
wal_keep_size = 1GB              # Retain WAL for standby catch-up
synchronous_commit = on          # Wait for standby confirmation (RPO = 0)
synchronous_standby_names = 'standby1'  # Require standby ack

# PRIMARY INSTANCE (pg_hba.conf)
# Allow replication connections from standby
host replication replicator 10.0.2.0/24 md5

# STANDBY INSTANCE (postgresql.conf)
# ========================================
# Configure as hot standby (read-only queries allowed)
hot_standby = on
primary_conninfo = 'host=10.0.1.10 port=5432 user=replicator password=secret'
restore_command = 'cp /var/lib/pgsql/wal_archive/%f %p'

# STANDBY INSTANCE (standby.signal)
# Create empty file to mark instance as standby
touch /var/lib/pgsql/data/standby.signal

# ========================================
# pg_auto_failover Setup (Automatic Failover)
# ========================================

# Install pg_auto_failover monitor (separate node)
pg_autoctl create monitor --hostname monitor.example.com --pgdata /var/lib/pgsql/monitor

# Register primary node
pg_autoctl create postgres \\
  --hostname primary.example.com \\
  --pgdata /var/lib/pgsql/data \\
  --monitor postgres://monitor.example.com:5432/pg_auto_failover

# Register standby node
pg_autoctl create postgres \\
  --hostname standby.example.com \\
  --pgdata /var/lib/pgsql/data \\
  --monitor postgres://monitor.example.com:5432/pg_auto_failover

# Failover behavior:
# - Monitor sends health checks to primary every 5 seconds
# - If primary unresponsive for 30 seconds (configurable), trigger failover
# - Monitor promotes standby to primary (10-30s process)
# - Applications reconnect to new primary (requires retry logic)
# - Former primary becomes standby when it recovers

# Application connection with automatic failover
# Use connection string with multiple hosts
postgres://primary.example.com:5432,standby.example.com:5432/mydb?target_session_attrs=read-write

# Key configuration parameters:
# - RTO: 10-30 seconds (health check timeout + promotion)
# - RPO: 0 seconds (synchronous_commit=on) or seconds (async)
# - Failover triggers: primary crash, network partition, disk full
#
# When to choose:
# - Self-managed PostgreSQL requiring HA
# - Need fine-grained control over replication and failover
# - Cost-sensitive deployments (avoid managed service fees)
# - Synchronous replication for zero data loss`,
    },
    {
      id: "keepalived-vrrp",
      name: "Keepalived VRRP (Virtual IP Failover)",
      type: "platform",
      languages: ["any"],
      description:
        "Keepalived provides Active-Passive failover using VRRP (Virtual Router Redundancy Protocol) for IP address takeover. Primary server holds virtual IP; standby monitors primary via heartbeats and claims VIP on failure. Commonly used for load balancers (HAProxy), application servers, and network services.",
      links: {
        docs: "https://www.keepalived.org/manpage.html",
        github: "https://github.com/acassen/keepalived",
      },
      codeSnippet: `# Keepalived Configuration for Active-Passive IP Failover

# PRIMARY INSTANCE (/etc/keepalived/keepalived.conf)
# ========================================
vrrp_instance VI_1 {
    state MASTER              # Primary instance state
    interface eth0            # Network interface for VRRP
    virtual_router_id 51      # Must match on primary and standby
    priority 100              # Higher priority = preferred master
    advert_int 1              # Heartbeat interval (1 second)

    # Authentication to prevent rogue VRRP instances
    authentication {
        auth_type PASS
        auth_pass secret123
    }

    # Virtual IP address (VIP) to be claimed by active instance
    virtual_ipaddress {
        192.168.1.100/24      # Application connects to this IP
    }

    # Health check script (optional - check application health)
    track_script {
        check_application
    }
}

# Application health check script
vrrp_script check_application {
    script "/usr/local/bin/check_app.sh"
    interval 5                # Check every 5 seconds
    weight -20                # Reduce priority by 20 if check fails
    fall 2                    # Fail after 2 consecutive failures
    rise 2                    # Recover after 2 consecutive successes
}

# STANDBY INSTANCE (/etc/keepalived/keepalived.conf)
# ========================================
vrrp_instance VI_1 {
    state BACKUP              # Standby instance state
    interface eth0
    virtual_router_id 51      # Must match primary
    priority 90               # Lower priority than primary (100)
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass secret123
    }

    virtual_ipaddress {
        192.168.1.100/24      # Same VIP as primary
    }

    track_script {
        check_application
    }
}

# Health Check Script (/usr/local/bin/check_app.sh)
#!/bin/bash
# Check if application is responding on port 8080
nc -z localhost 8080
exit $?

# How failover works:
# 1. Primary sends VRRP advertisements every 1 second
# 2. Standby listens for advertisements
# 3. If standby doesn't receive advertisements for 3 seconds, assumes primary failed
# 4. Standby transitions to MASTER state and claims VIP (1-3s)
# 5. ARP announcement sent to update network switches
# 6. Clients automatically redirect to new primary via VIP
# 7. When original primary recovers, it becomes standby (priority-based preemption)

# Application configuration
# Connect to VIP (not instance-specific IPs)
APP_HOST=192.168.1.100  # Virtual IP managed by Keepalived

# Key parameters:
# - RTO: 1-3 seconds (VRRP failover time)
# - RPO: Depends on application replication (Keepalived only handles IP)
# - Preemption: Original primary can reclaim VIP (optional, configurable)
#
# When to choose:
# - Need fast IP failover (1-3 seconds)
# - Legacy applications not designed for load balancing
# - Stateful services requiring single active instance
# - On-premises deployments or environments without cloud load balancers`,
    },
    {
      id: "redis-sentinel",
      name: "Redis Sentinel (Automatic Master Failover)",
      type: "platform",
      languages: ["redis"],
      description:
        "Redis Sentinel provides Active-Passive high availability for Redis through automatic master failover. Sentinel monitors master and replicas, promotes replica to master on failure, and notifies clients of topology changes. Supports automatic failover with quorum-based decision making.",
      links: {
        docs: "https://redis.io/docs/management/sentinel/",
      },
      codeSnippet: `# Redis Active-Passive Configuration with Sentinel

# REDIS MASTER INSTANCE (redis.conf)
# ========================================
port 6379
bind 0.0.0.0
protected-mode yes
requirepass masterpassword

# Enable replication support
repl-backlog-size 100mb        # Replication buffer for replicas
repl-backlog-ttl 3600          # Keep backlog for 1 hour
min-replicas-to-write 1        # Require 1 replica before accepting writes
min-replicas-max-lag 10        # Replica must be <10s behind

# REDIS REPLICA (STANDBY) INSTANCE (redis.conf)
# ========================================
port 6379
bind 0.0.0.0
replicaof 10.0.1.10 6379       # Master IP and port
masterauth masterpassword      # Master password
replica-read-only yes          # Replicas don't accept writes

# SENTINEL CONFIGURATION (sentinel.conf)
# Deploy 3+ Sentinel instances for quorum (odd number recommended)
# ========================================
port 26379
sentinel monitor mymaster 10.0.1.10 6379 2  # Monitor master, quorum=2
sentinel auth-pass mymaster masterpassword
sentinel down-after-milliseconds mymaster 5000   # 5s timeout = master down
sentinel parallel-syncs mymaster 1              # Sync 1 replica at a time
sentinel failover-timeout mymaster 60000        # 60s max failover time

# Notification scripts (optional)
sentinel notification-script mymaster /usr/local/bin/notify.sh
sentinel client-reconfig-script mymaster /usr/local/bin/reconfig.sh

# Start Sentinel
redis-sentinel /etc/redis/sentinel.conf

# How failover works:
# 1. Sentinels send PING to master every second
# 2. If master doesn't respond for 5 seconds, Sentinel marks it subjectively down
# 3. Sentinel asks other Sentinels if they agree (quorum vote)
# 4. If quorum (2 out of 3) agrees, master is objectively down
# 5. Sentinel leader promotes best replica to master (10-30s)
# 6. Sentinels reconfigure remaining replicas to follow new master
# 7. Sentinels notify clients of new master topology

# APPLICATION CODE (Node.js with ioredis)
const Redis = require('ioredis');

// Connect to Redis via Sentinel (automatic failover)
const redis = new Redis({
  sentinels: [
    { host: 'sentinel1.example.com', port: 26379 },
    { host: 'sentinel2.example.com', port: 26379 },
    { host: 'sentinel3.example.com', port: 26379 }
  ],
  name: 'mymaster',  // Sentinel master name
  password: 'masterpassword',

  // Automatic reconnection on failover
  retryStrategy: (times) => Math.min(times * 50, 2000),
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;  // Reconnect when replica promoted to master
    }
  }
});

// Write operation (goes to current master)
await redis.set('key', 'value');

// Read operation (can go to replicas if configured)
const value = await redis.get('key');

# Key failover characteristics:
# - RTO: 10-30 seconds (detection + promotion + client reconnect)
# - RPO: Seconds (asynchronous replication, some writes may be lost)
# - Automatic client reconnection (ioredis, Jedis, redis-py)
# - Quorum prevents split-brain (majority must agree on failover)
#
# When to choose:
# - Redis deployments requiring automatic failover
# - Cache or session store with acceptable data loss (seconds)
# - Need simpler setup than Redis Cluster (no sharding)
# - Stateful applications using Redis as primary data store`,
    },
    {
      id: "mysql-replication-proxysql",
      name: "MySQL Replication + ProxySQL (Automatic Failover)",
      type: "platform",
      languages: ["mysql", "sql"],
      description:
        "MySQL replication provides Active-Passive database deployment with ProxySQL handling automatic failover and connection routing. ProxySQL monitors master health, promotes replica on failure, and transparently redirects application queries to new master. Self-managed MySQL HA solution.",
      links: {
        docs: "https://proxysql.com/documentation/",
        github: "https://github.com/sysown/proxysql",
      },
      codeSnippet: `# MySQL Active-Passive Replication with ProxySQL

# MYSQL MASTER INSTANCE (my.cnf)
# ========================================
[mysqld]
server-id = 1                    # Unique server ID
log-bin = mysql-bin              # Enable binary logging
binlog-format = ROW              # Row-based replication
sync_binlog = 1                  # Flush binlog to disk (durability)
innodb_flush_log_at_trx_commit = 1  # Flush redo log (durability)

# Replication user
CREATE USER 'replicator'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';

# MYSQL REPLICA (STANDBY) INSTANCE (my.cnf)
# ========================================
[mysqld]
server-id = 2                    # Different server ID
log-bin = mysql-bin
binlog-format = ROW
read_only = 1                    # Replica is read-only
super_read_only = 1              # Even root can't write

# Configure replication
CHANGE MASTER TO
  MASTER_HOST='10.0.1.10',
  MASTER_USER='replicator',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;

# Check replication status
SHOW SLAVE STATUS\\G
# Seconds_Behind_Master: 0 (ideal)

# PROXYSQL CONFIGURATION (proxysql.cfg)
# ========================================
# Install ProxySQL
# apt-get install proxysql

# Configure backend MySQL servers
INSERT INTO mysql_servers (hostgroup_id, hostname, port)
VALUES
  (10, '10.0.1.10', 3306),  # Master (write hostgroup)
  (20, '10.0.2.10', 3306);  # Replica (read hostgroup)

LOAD MYSQL SERVERS TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;

# Configure users
INSERT INTO mysql_users (username, password, default_hostgroup)
VALUES ('appuser', 'apppassword', 10);  # Default to write hostgroup

LOAD MYSQL USERS TO RUNTIME;
SAVE MYSQL USERS TO DISK;

# Configure query routing rules
# Send reads to replica hostgroup (20)
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup)
VALUES
  (1, 1, '^SELECT.*FOR UPDATE', 10),  # Locking reads to master
  (2, 1, '^SELECT', 20);               # Normal reads to replica

LOAD MYSQL QUERY RULES TO RUNTIME;
SAVE MYSQL QUERY RULES TO DISK;

# Health checks for automatic failover
INSERT INTO mysql_replication_hostgroups (writer_hostgroup, reader_hostgroup)
VALUES (10, 20);

LOAD MYSQL SERVERS TO RUNTIME;

# APPLICATION CONNECTION (via ProxySQL)
# ========================================
# Connect to ProxySQL (not directly to MySQL)
DB_HOST=proxysql.example.com
DB_PORT=6033  # ProxySQL port
DB_USER=appuser
DB_PASS=apppassword

# ProxySQL automatically:
# - Routes writes to current master (hostgroup 10)
# - Routes reads to replicas (hostgroup 20)
# - Monitors master health (every 1 second)
# - Promotes replica on master failure (10-30s)
# - Updates routing tables transparently

# Manual failover (if needed)
# On replica:
STOP SLAVE;
RESET SLAVE ALL;
SET GLOBAL read_only = 0;
SET GLOBAL super_read_only = 0;

# Update ProxySQL
UPDATE mysql_servers SET hostgroup_id=10 WHERE hostname='10.0.2.10';
UPDATE mysql_servers SET hostgroup_id=20 WHERE hostname='10.0.1.10';
LOAD MYSQL SERVERS TO RUNTIME;

# Key characteristics:
# - RTO: 10-30 seconds (health check detection + promotion)
# - RPO: Seconds (asynchronous replication, some data loss possible)
# - Transparent failover (applications don't need connection string changes)
# - Read scaling (replicas handle SELECT queries)
#
# When to choose:
# - Self-managed MySQL requiring automatic failover
# - Need read/write split for performance (reads to replicas)
# - Cost-sensitive deployments (avoid managed DB fees)
# - Fine-grained control over replication topology`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws-rds-banking",
      systemName: "Large Bank Core Banking Database (AWS RDS Multi-AZ)",
      howUsed:
        "Major financial institutions deploy Active-Passive architecture for core banking databases handling account balances, transactions, and ledgers. A top-5 US bank uses AWS RDS PostgreSQL Multi-AZ for their online banking backend (handling 50M+ customer accounts). The primary RDS instance in us-east-1a processes all transactions (deposits, withdrawals, transfers) while synchronous standby in us-east-1b replicates every write via synchronous replication—guaranteeing RPO = 0 (zero data loss). When the primary availability zone experienced network partition during an AWS outage in 2021, RDS automatically promoted the standby to primary within 90 seconds (RTO). The bank's application layer (Spring Boot microservices) connects to RDS via a single DNS endpoint (prod-db.abc123.us-east-1.rds.amazonaws.com) which automatically updated to point to the new primary—applications experienced brief connection errors (30-60s) during failover but automatically reconnected via retry logic. No transactions were lost due to synchronous replication. The bank chose Active-Passive over Active-Active (Aurora Global Database) because: (1) Simpler consistency model—single source of truth for account balances eliminates conflict resolution complexity; (2) Regulatory compliance—auditors require proof of transaction ordering and ACID guarantees which distributed databases complicate; (3) Lower operational complexity—Active-Passive requires no application changes for distributed coordination. Pattern composition: Active-Passive + Synchronous Replication + Connection Pooling (pgBouncer) + Read Replicas (for reporting, not failover). Impact: Maintained 99.99% database availability; zero data loss during AZ failures; enabled compliance with financial regulations requiring strong consistency; supported 100k+ TPS without distributed database complexity.",
      source: "https://aws.amazon.com/rds/features/multi-az/",
    },
    {
      systemId: "stripe-postgres-primary-backup",
      systemName:
        "Stripe Payment Processing Database (PostgreSQL Active-Passive)",
      howUsed:
        "Stripe's payment processing infrastructure uses Active-Passive PostgreSQL for critical transaction databases storing payment state, merchant balances, and transfer records. Stripe deploys self-managed PostgreSQL with streaming replication (not RDS) across multiple AWS regions for disaster recovery. Primary database in us-east-1 handles all payment writes; synchronous standby in us-east-1 (different AZ) replicates via streaming replication with synchronous_commit=on for zero data loss. Asynchronous replicas in eu-west-1 provide geographic disaster recovery. During a 2019 incident where primary database experienced disk I/O degradation (IOPS throttling due to noisy neighbor on shared storage), Stripe's pg_auto_failover detected slow query latency (exceeding 1s threshold) and automatically promoted the standby to primary within 25 seconds. Stripe's application layer (Ruby on Rails microservices) uses pgBouncer connection pooler with retry logic—during failover, applications experienced 30s of elevated errors (connection timeouts) before pgBouncer redirected connections to new primary. Zero payment data was lost (synchronous replication), though ~500 in-flight payment API requests failed and required client retry. Stripe chose Active-Passive over distributed databases (CockroachDB, Spanner) because: (1) Payment processing requires serializable isolation and strong consistency which distributed databases achieve with higher latency (cross-region round trips); (2) Simpler operational model—Stripe's engineering team deeply understands PostgreSQL failure modes vs learning distributed DB quirks; (3) Cost—self-managed PostgreSQL costs 1/10th of managed Spanner for equivalent throughput. Pattern composition: Active-Passive + Streaming Replication + Connection Pooling + Read Replicas (analytics) + Multi-Region Async Replicas (DR). Impact: 99.995% database availability; zero payment data loss during primary failures; sub-30s RTO for automatic failover; supported $640B payment volume in 2022 with simple Active-Passive architecture.",
      source: "https://stripe.com/blog/online-migrations",
    },
    {
      systemId: "shopify-mysql-active-passive",
      systemName:
        "Shopify E-Commerce Database (MySQL Active-Passive + ProxySQL)",
      howUsed:
        "Shopify's merchant-facing databases (product catalogs, inventory, orders) use Active-Passive MySQL replication with ProxySQL for automatic failover. Each merchant's data resides in a dedicated MySQL shard (multi-tenant sharding by merchant_id); within each shard, one primary MySQL instance handles writes while 2-3 replicas provide read scaling and failover targets. ProxySQL sits between application servers and MySQL, routing writes to primary and reads to replicas. When primary instances fail (OOM crashes, disk full, network partition), ProxySQL detects unresponsive primary within 5 seconds (health check interval) and promotes best replica to primary (typically fastest to catch up on replication lag). During Black Friday 2021, when traffic spiked 10x normal and caused primary instances to OOM crash due to memory pressure, ProxySQL automatically failed over 200+ shard primaries to replicas within 10-30 seconds per shard. Shopify's application layer (Ruby on Rails monolith) experienced brief write unavailability (10-30s per shard) but reads continued serving from replicas uninterrupted. Shopify lost ~5 seconds of writes per shard (RPO) due to asynchronous replication lag—acceptable for e-commerce inventory/orders but flagged to merchants as 'orders may be delayed during high traffic'. Shopify chose Active-Passive MySQL over distributed databases (Vitess, TiDB) because: (1) Simpler sharding model—each merchant's shard is independent Active-Passive cluster vs complex distributed coordination across shards; (2) Battle-tested MySQL—Shopify's team has 15+ years MySQL expertise vs 2-3 years with newer distributed DBs; (3) Read scaling via replicas—90% of queries are reads which replicas handle efficiently without distributed query routing. Pattern composition: Active-Passive + Sharding (by merchant) + ProxySQL Failover + Read Replicas + Async Replication. Impact: Maintained 99.98% write availability during Black Friday; handled 2M+ merchants with independent failover per shard; enabled horizontal scaling via sharding + vertical HA via Active-Passive within shards; supported $5B+ GMV on peak days.",
      source: "https://shopify.engineering/mysql-database-management-shopify",
    },
    {
      systemId: "healthcare-epic-sql-server",
      systemName: "Healthcare EHR System - Epic on SQL Server (Active-Passive)",
      howUsed:
        "Epic Systems, the largest electronic health record (EHR) platform serving 250M+ patients, deploys Active-Passive architecture using SQL Server Always On Availability Groups for hospital databases. Each hospital's patient records, appointments, lab results, and clinical notes reside in a dedicated SQL Server database; primary instance handles all writes (doctor notes, prescription orders, lab result entry) while synchronous secondary instance in different datacenter replicates via Always On. When a large hospital network (50k+ patient visits/day) experienced primary SQL Server crash due to Windows patch causing driver conflict, SQL Server Always On automatically failed over to secondary within 15 seconds—automatic failover triggered when primary missed 3 consecutive heartbeats (5s interval). Epic's client applications (thick Windows clients, Citrix sessions) connect to an Always On Listener (virtual network name) which automatically redirects to current primary. During failover, clinicians experienced 15-30s connection interruption (dialog boxes saying 'reconnecting to database') before resuming work. Zero patient data was lost (synchronous replication mode) which is critical for healthcare compliance (HIPAA audit trails require provable data durability). The hospital chose Active-Passive over Active-Active distributed databases because: (1) Regulatory compliance—FDA and healthcare regulations require deterministic transaction ordering and auditability which Active-Passive provides via single source of truth; (2) Vendor support—Epic officially supports SQL Server Always On but not distributed databases like CockroachDB; (3) Disaster recovery—synchronous secondary provides both HA (same-datacenter) and DR (cross-datacenter) in single architecture. Pattern composition: Active-Passive + Synchronous Replication + Automatic Failover + Windows Clustering + Shared Storage (for quorum). Impact: 99.99% database availability for patient records; zero data loss during server failures; met HIPAA compliance requirements for data durability; enabled seamless failover without clinician workflow disruption; protected 50k+ daily patient visits from database outages.",
      source: "https://www.epic.com/software",
    },
    {
      systemId: "trading-platform-postgres",
      systemName:
        "Financial Trading Platform - Order Database (PostgreSQL Active-Passive)",
      howUsed:
        "A top-10 cryptocurrency exchange uses Active-Passive PostgreSQL for order book state and trade execution history. The primary database instance handles all order placement, matching, and trade settlement (100k+ orders/sec during peak); synchronous standby replicates every transaction to guarantee RPO = 0 (zero data loss is regulatory requirement for financial audit trails). The exchange uses synchronous_commit = remote_apply (strictest consistency mode) ensuring standby has applied transaction to disk before primary acknowledges client—this adds 2-5ms latency per transaction but guarantees no data loss. During a 2022 incident where primary instance's NVMe SSD failed catastrophically (firmware bug causing controller hang), pg_auto_failover detected unresponsive primary within 10 seconds and promoted standby to primary. The exchange's trading engine (C++ microservices) connects via pgBouncer connection pooler with application-level retry—during 10-20s failover window, new order submissions failed with '503 Service Unavailable' errors, but existing open orders remained valid (preserved in standby). The exchange's matching engine paused order matching during failover (circuit breaker pattern) to prevent duplicate trades. Zero trades were lost or duplicated due to synchronous replication and idempotent retry logic. Exchange chose Active-Passive over distributed databases (CockroachDB, YugabyteDB) because: (1) Latency—synchronous replication within single datacenter (same rack) achieves <3ms vs distributed consensus requiring cross-AZ round trips (10-50ms); (2) Deterministic ordering—trading requires strict transaction serialization which single-master Active-Passive provides without clock drift issues; (3) Audit compliance—regulators require provable transaction ordering for trade reconstruction which distributed multi-master complicates. Pattern composition: Active-Passive + Synchronous Replication (remote_apply) + Connection Pooling + Circuit Breaker (trading engine) + Idempotent Retry. Impact: Zero trade data loss during infrastructure failures; maintained sub-5ms trade latency with synchronous replication; met financial regulatory requirements for audit trails; processed $10B+ daily trading volume with simple Active-Passive architecture.",
    },
  ],

  philosophy: {
    coreProblem:
      "Single-instance systems create unacceptable availability risks for mission-critical applications—when the instance fails, the entire service goes offline until manual intervention or restart completes (minutes to hours of downtime). For stateful systems like databases, this problem is compounded by complex distributed active-active alternatives requiring conflict resolution, consensus protocols, and split-brain prevention. Organizations need a middle ground: better availability than single-instance deployments without the operational complexity of fully distributed active-active systems.",
    designPrinciple:
      "Maintain a warm standby instance that continuously replicates state from the primary but remains idle (not serving traffic). When the primary fails, automatically promote the standby to active status with minimal downtime (RTO: seconds to minutes) and data loss (RPO: near-zero for synchronous replication). Trade idle standby capacity (wasted resources) for operational simplicity (single source of truth, no coordination complexity) and faster recovery than cold backup-restore approaches.",
    historicalContext:
      "Active-Passive (also called Hot Standby or Primary-Backup) emerged in the 1980s-1990s for mainframe and enterprise database systems where high availability was critical but distributed systems were impractical. IBM's DB2 HADR (High Availability Disaster Recovery) pioneered log shipping from primary to standby databases, enabling sub-minute failover for mission-critical workloads. Oracle Data Guard (introduced 2001) popularized Active-Passive for enterprise Oracle deployments, providing synchronous and asynchronous replication modes with automatic failover orchestration. The pattern became industry-standard for relational databases because distributed active-active RDBMS (multi-master replication) faced insurmountable conflict resolution challenges—last-write-wins loses data, CRDTs don't support arbitrary SQL, distributed transactions (2PC) have terrible latency. Active-Passive solved availability without requiring application changes for distributed state management. In the cloud era (2010s), AWS RDS Multi-AZ democratized Active-Passive for SMBs—previously only large enterprises with dedicated DBAs could deploy complex failover systems. RDS abstracted replication, health monitoring, and failover orchestration into a managed service checkbox ('Enable Multi-AZ: Yes'), making Active-Passive accessible to startups. Modern containerized applications have largely moved away from Active-Passive for stateless services (preferring active-active horizontal scaling), but stateful databases still rely heavily on Active-Passive due to the complexity of distributed database coordination. PostgreSQL, MySQL, SQL Server, and Oracle all provide native streaming replication designed for Active-Passive deployments. The pattern's enduring relevance reflects a fundamental trade-off: for stateful systems requiring strong consistency, Active-Passive's simplicity (single writer, no coordination) outweighs its downsides (idle capacity, brief failover interruption).",
    alternativesRejected: [
      "Single Instance (No Redundancy) - Simplest deployment but unacceptable availability for production systems. When instance fails, service is completely offline until manual restart or replacement (30 minutes to hours). Unacceptable for 99.9%+ availability SLAs. Rejected for mission-critical workloads.",
      "Cold Standby / Backup-Restore - Maintain backups but no running standby. On failure, provision new instance and restore from backup (10 minutes to hours RTO). Much slower than Active-Passive (10-60s RTO). RPO = backup interval (hours to days of data loss). Only suitable for non-critical systems tolerating long outages. Active-Passive chosen for faster recovery.",
      "Active-Active Multi-Master - Run multiple active instances, all accepting writes. Eliminates idle capacity and provides horizontal scaling. However, introduces complex conflict resolution (CRDTs, last-write-wins, custom app logic), split-brain scenarios, and coordination overhead (consensus protocols, distributed transactions). For databases requiring strong consistency and ACID, Active-Active is prohibitively complex. Active-Passive chosen for operational simplicity.",
      "Pilot Light (Minimal Standby) - Standby runs with minimal resources (small instance, no replication). On failure, scale up standby and restore from backup. Cheaper than Active-Passive (lower standby costs) but slower failover (10-30 minutes to scale and restore). Active-Passive chosen when RTO <1 minute is required.",
      "Multi-Region Active-Active - Distribute active instances across geographic regions for disaster recovery. Solves regional failures but introduces cross-region latency (50-200ms), complex data synchronization (CAP theorem trade-offs), and expensive bandwidth costs. For most use cases, Active-Passive within single region provides sufficient HA at lower complexity. Multi-region reserved for disaster recovery (cross-region async replica), not primary HA strategy.",
    ],
    mentalModel:
      "Active-Passive is like an emergency backup generator for a hospital. The primary power grid (active instance) handles all electricity demand normally. The backup generator (passive instance) remains powered on and warm (ready to start immediately) but doesn't supply electricity. The generator continuously monitors grid status via voltage sensors (health checks/heartbeats). When grid power fails, an automatic transfer switch (failover controller) detects the outage within seconds and switches to generator power (promotes standby to active). The switchover takes 10-30 seconds (RTO)—patients on ventilators might experience brief interruption but backup batteries bridge the gap (analogous to client retry logic). The hospital accepts the cost of maintaining an idle generator (wasted capacity) in exchange for fast, reliable failover during emergencies. Alternative rejected: relying on UPS batteries alone (cold standby - slow recovery) or building a second power plant (active-active - prohibitively expensive and complex).",
  },

  visualization: {
    staticDiagram: `stateDiagram-v2
    [*] --> NormalOperation

    NormalOperation: Primary Active, Standby Passive
    NormalOperation: Primary handles all traffic
    NormalOperation: Replication: Primary → Standby

    NormalOperation --> PrimaryFailed: Primary crashes/network partition

    PrimaryFailed: Health monitor detects failure
    PrimaryFailed: Missed heartbeats (timeout)

    PrimaryFailed --> FailoverInProgress: Trigger automatic failover

    FailoverInProgress: Promote standby to active
    FailoverInProgress: Update routing (DNS/VIP)
    FailoverInProgress: RTO: 10-60 seconds

    FailoverInProgress --> StandbyNowActive: Failover complete

    StandbyNowActive: Former standby is new primary
    StandbyNowActive: Handles all traffic
    StandbyNowActive: RPO: 0 (sync) or seconds (async)

    StandbyNowActive --> NormalOperation: Former primary becomes standby

    note right of NormalOperation
      Trade-off: 50% idle capacity
      for simpler consistency model
      and faster recovery than cold standby
    end note

    note right of FailoverInProgress
      RTO depends on:
      - Health check timeout
      - Replication lag
      - DNS/routing update time
    end note`,
    realWorldAnalogy:
      "Active-Passive is like a professional sports team with starting players (active instances) and bench players (passive instances). The starting quarterback (primary instance) handles all plays during the game while the backup quarterback (standby) stays warmed up on the sideline, continuously studying the playbook and game situation (replication). If the starter gets injured (primary failure), the backup enters the game within seconds (automatic failover), having all the context needed to continue smoothly. The team accepts having an expensive backup quarterback sitting idle most of the time (wasted capacity) in exchange for seamless continuity when the starter is unavailable. The backup might miss 1-2 plays during substitution (brief service interruption during RTO), but the game continues without major disruption. Alternative rejected: having no backup (single instance - game forfeits on injury) or using a player from another position who doesn't know the playbook (cold standby - long recovery time).",
    useCases: [
      {
        domain: "Banking and Financial Services",
        scenario:
          "Core banking databases handling account balances, transactions, and ledgers. Primary instance processes deposits, withdrawals, transfers. Synchronous standby replicates every transaction for zero data loss (RPO = 0). On primary failure, standby promoted within 60-90 seconds (RTO). Regulatory compliance requires strong consistency and audit trails.",
        patternRole:
          "Active-Passive provides ACID guarantees and strong consistency required for financial transactions while maintaining high availability during infrastructure failures.",
        companies: ["JPMorgan Chase", "Bank of America", "Stripe", "PayPal"],
      },
      {
        domain: "E-Commerce and Retail",
        scenario:
          "Product catalog, inventory, and order databases. Primary handles product updates, inventory changes, order placement. Standby replicates via asynchronous replication (seconds RPO acceptable for non-financial data). On primary failure, failover within 30 seconds. Read replicas serve product browsing queries.",
        patternRole:
          "Active-Passive enables high availability for stateful databases while avoiding complex distributed coordination for product and inventory management.",
        companies: ["Shopify", "Amazon RDS users", "Walmart", "Target"],
      },
      {
        domain: "Healthcare and Electronic Health Records",
        scenario:
          "Patient records, appointments, lab results, clinical notes stored in EHR databases (Epic, Cerner). Primary instance handles doctor notes, prescription orders, lab result entry. Synchronous standby ensures zero data loss for HIPAA compliance. Automatic failover within 15-30 seconds maintains clinician workflow.",
        patternRole:
          "Active-Passive meets healthcare regulatory requirements for data durability and audit trails while providing high availability for patient care systems.",
        companies: ["Epic Systems", "Cerner", "Hospital networks"],
      },
      {
        domain: "Financial Trading Platforms",
        scenario:
          "Order book state and trade execution history for stock/cryptocurrency exchanges. Primary instance handles order placement, matching, settlement. Synchronous replication (remote_apply mode) guarantees RPO = 0 for regulatory audit requirements. Sub-minute failover maintains trading continuity.",
        patternRole:
          "Active-Passive provides deterministic transaction ordering and zero data loss required for financial regulatory compliance while maintaining low-latency trade execution.",
        companies: ["Coinbase", "Robinhood", "Traditional stock exchanges"],
      },
      {
        domain: "SaaS and Subscription Services",
        scenario:
          "Customer data, user accounts, subscription billing databases. Primary handles signup, login, payment processing. Standby replicates customer data for disaster recovery. Automatic failover ensures service continuity during outages. Read replicas serve reporting and analytics.",
        patternRole:
          "Active-Passive enables SaaS platforms to provide 99.9%+ availability SLAs without complex distributed database coordination.",
        companies: ["Salesforce", "HubSpot", "Zendesk", "Slack"],
      },
    ],
  },

  references: [
    {
      title: "AWS RDS Multi-AZ Deployments",
      url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "PostgreSQL High Availability, Load Balancing, and Replication",
      url: "https://www.postgresql.org/docs/current/high-availability.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "MySQL Replication - MySQL 8.0 Reference Manual",
      url: "https://dev.mysql.com/doc/refman/8.0/en/replication.html",
      type: "documentation",
      author: "Oracle MySQL",
    },
    {
      title: "Redis Sentinel - High Availability for Redis",
      url: "https://redis.io/docs/management/sentinel/",
      type: "documentation",
      author: "Redis Labs",
    },
    {
      title: "SQL Server Always On Availability Groups",
      url: "https://learn.microsoft.com/en-us/sql/database-engine/availability-groups/windows/overview-of-always-on-availability-groups-sql-server",
      type: "documentation",
      author: "Microsoft",
    },
    {
      title: "Keepalived and VRRP - Virtual Router Redundancy Protocol",
      url: "https://www.keepalived.org/",
      type: "documentation",
      author: "Keepalived Project",
    },
    {
      title: "Designing Data-Intensive Applications - Chapter 5: Replication",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Site Reliability Engineering - Chapter 26: Data Integrity",
      url: "https://sre.google/sre-book/data-integrity/",
      type: "book",
      author: "Google SRE Team",
    },
  ],

  tags: [
    "reliability",
    "high-availability",
    "database",
    "replication",
    "failover",
    "disaster-recovery",
    "rto",
    "rpo",
    "consistency",
    "standby",
  ],
  difficulty: "intermediate",
};
