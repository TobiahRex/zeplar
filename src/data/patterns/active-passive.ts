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
};
