import type { Pattern } from "../schema";

export const pilotLight: Pattern = {
  id: "pilot-light",
  slug: "pilot-light",
  corpusPath:
    "🛡️ RELIABILITY → 📋 Redundancy → Hot/Warm/Cold Standby → 🌡️ Pilot Light",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Standby",
    level: 4,
  },

  concept: {
    name: "Pilot Light",
    emoji: "🌡️",
    tagline: "Minimal standby infrastructure",
    definition:
      "The Pilot Light pattern maintains a minimal, scaled-down version of critical system components in a standby environment, ready to be rapidly scaled up when disaster strikes. Named after the small, always-on flame in gas furnaces that enables quick ignition of the full burner, this pattern keeps core data infrastructure running (databases with live replication, configuration services) while application servers and compute-heavy components remain powered off until needed. During normal operation, the pilot light environment continuously replicates data from the primary region but serves zero production traffic. When disaster strikes the primary region, operators rapidly provision and start the dormant application components in the pilot light environment, scale them to handle production load, and redirect traffic via DNS or load balancer updates. This approach balances cost efficiency with recovery speed: the always-on minimal infrastructure (database replicas, storage) ensures zero data loss and quick recovery, while dormant compute resources (application servers, workers) minimize costs compared to full hot standby. Recovery typically completes in minutes to hours, making it suitable for systems with moderate RTO requirements where full active-passive is cost-prohibitive.",
    problemSolved:
      "Full disaster recovery requires balancing cost against recovery time objectives. Running full active-passive hot standbys in multiple regions provides fastest recovery but doubles infrastructure costs for resources that remain mostly idle. Cold backups (backup-and-restore) minimize costs but recovery takes hours to days as infrastructure is provisioned, data is restored, and applications are deployed from scratch. Organizations with moderate RTO requirements (15-60 minutes) face a dilemma: hot standby is wastefully expensive, but cold backup is too slow. Pilot Light solves this by identifying which components are expensive to recreate versus cheap to keep running. Databases with terabytes of data take hours to restore from backups, so they run continuously in the standby region with live replication. But stateless application servers are quick to provision and start, so they remain offline to save costs. This creates a middle ground: critical data is always ready, allowing rapid application spinup when needed. Recovery is significantly faster than cold backup since data infrastructure is already running and synchronized.",
    tradeoffs: {
      pros: [
        "Lower cost than full hot standby—minimal compute resources running",
        "Faster recovery than cold backup—data already replicated and ready",
        "Zero data loss with continuous database replication",
        "Can scale gradually during recovery to manage costs",
        "Appropriate for moderate RTO requirements (15-60 minutes)",
      ],
      cons: [
        "Slower recovery than hot standby—requires infrastructure provisioning",
        "Manual or semi-automated recovery process increases complexity",
        "Risk of configuration drift between primary and standby environments",
        "Requires testing failover procedures to ensure recovery works",
        "Still incurs baseline costs for data infrastructure and replication",
      ],
    },
    relatedPatterns: [
      "active-passive",
      "backup-restore",
      "active-active",
      "data-replication",
      "auto-scaling",
      "disaster-recovery",
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
      id: "pilot-light-ts-basic",
      language: "typescript",
      title: "Pilot Light Disaster Recovery System",
      description:
        "TypeScript implementation of pilot light pattern with minimal standby infrastructure, rapid scaling, and DNS-based traffic failover",
      code: `// ============================================================
// Pilot Light Disaster Recovery System
// ============================================================
// Minimal always-on infrastructure (data layer) with dormant
// compute resources that can be rapidly provisioned during disaster
// ============================================================

type EnvironmentStatus = 'primary' | 'pilot-light' | 'active-standby' | 'scaling' | 'failed';
type ComponentType = 'database' | 'cache' | 'storage' | 'compute' | 'loadbalancer';

interface InfrastructureComponent {
  name: string;
  type: ComponentType;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  region: string;
  cost: number; // Cost per hour
}

interface RecoveryMetrics {
  rto: number;  // Recovery Time Objective (minutes)
  rpo: number;  // Recovery Point Objective (minutes)
  monthlyCost: number;
  dataLag: number; // Replication lag (seconds)
}

// ============================================================
// Infrastructure Component
// ============================================================
class Component {
  constructor(
    public name: string,
    public type: ComponentType,
    public region: string,
    public alwaysOn: boolean,  // Whether component runs in pilot light mode
    private costPerHour: number
  ) {}

  private status: 'running' | 'stopped' | 'starting' | 'stopping' = 'stopped';

  getStatus(): string {
    return this.status;
  }

  async start(): Promise<void> {
    if (this.status === 'running') {
      console.log(\`[\${this.name}] Already running\`);
      return;
    }

    console.log(\`[\${this.name}] Starting...\`);
    this.status = 'starting';

    // Simulate startup time based on component type
    const startupTime = this.getStartupTime();
    await new Promise(resolve => setTimeout(resolve, startupTime));

    this.status = 'running';
    console.log(\`[\${this.name}] Started (took \${startupTime}ms)\`);
  }

  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      return;
    }

    console.log(\`[\${this.name}] Stopping...\`);
    this.status = 'stopping';
    await new Promise(resolve => setTimeout(resolve, 100));
    this.status = 'stopped';
    console.log(\`[\${this.name}] Stopped\`);
  }

  private getStartupTime(): number {
    // Different components have different startup times
    switch (this.type) {
      case 'database':
        return 5000; // DB already running in pilot light
      case 'cache':
        return 3000; // Cache already running
      case 'storage':
        return 1000; // Storage always available
      case 'compute':
        return 10000; // Compute takes longest to provision
      case 'loadbalancer':
        return 5000; // LB configuration takes time
      default:
        return 2000;
    }
  }

  getCost(): number {
    return this.status === 'running' ? this.costPerHour : 0;
  }

  getInfo(): InfrastructureComponent {
    return {
      name: this.name,
      type: this.type,
      status: this.status,
      region: this.region,
      cost: this.getCost(),
    };
  }
}

// ============================================================
// Environment (Primary or Pilot Light)
// ============================================================
class Environment {
  private components: Component[] = [];
  private environmentStatus: EnvironmentStatus;
  private dataReplicationLag: number = 0;

  constructor(
    private name: string,
    private region: string,
    initialStatus: EnvironmentStatus
  ) {
    this.environmentStatus = initialStatus;
  }

  addComponent(component: Component): void {
    this.components.push(component);

    // In pilot light mode, only start always-on components
    if (this.environmentStatus === 'pilot-light' && component.alwaysOn) {
      component.start();
    } else if (this.environmentStatus === 'primary') {
      component.start();
    }
  }

  getStatus(): EnvironmentStatus {
    return this.environmentStatus;
  }

  // Scale up pilot light to handle production traffic
  async scaleUp(): Promise<void> {
    if (this.environmentStatus !== 'pilot-light') {
      throw new Error(\`Cannot scale up environment in \${this.environmentStatus} state\`);
    }

    console.log(\`\\n[\${this.name}] Scaling up from pilot light to active standby...\`);
    this.environmentStatus = 'scaling';

    // Start all dormant components in parallel
    const stoppedComponents = this.components.filter(c => c.getStatus() !== 'running');

    console.log(\`[\${this.name}] Starting \${stoppedComponents.length} dormant components...\`);

    await Promise.all(stoppedComponents.map(c => c.start()));

    this.environmentStatus = 'active-standby';
    console.log(\`[\${this.name}] Scale-up complete! Now ready for production traffic.\`);
  }

  // Scale down to minimal pilot light state
  async scaleDown(): Promise<void> {
    console.log(\`\\n[\${this.name}] Scaling down to pilot light mode...\`);
    this.environmentStatus = 'scaling';

    // Stop all non-essential components
    const componentsToStop = this.components.filter(c => !c.alwaysOn && c.getStatus() === 'running');

    await Promise.all(componentsToStop.map(c => c.stop()));

    this.environmentStatus = 'pilot-light';
    console.log(\`[\${this.name}] Scaled down to pilot light (data layer still running)\`);
  }

  setReplicationLag(lagSeconds: number): void {
    this.dataReplicationLag = lagSeconds;
  }

  getReplicationLag(): number {
    return this.dataReplicationLag;
  }

  getComponents(): InfrastructureComponent[] {
    return this.components.map(c => c.getInfo());
  }

  getTotalCost(): number {
    return this.components.reduce((sum, c) => sum + c.getCost(), 0);
  }

  getName(): string {
    return this.name;
  }
}

// ============================================================
// Disaster Recovery Orchestrator
// ============================================================
class DisasterRecoveryOrchestrator {
  private primaryEnv: Environment;
  private pilotLightEnv: Environment;
  private activeEnvironment: 'primary' | 'pilot-light';
  private replicationMonitor: NodeJS.Timeout | null = null;

  constructor(primary: Environment, pilotLight: Environment) {
    this.primaryEnv = primary;
    this.pilotLightEnv = pilotLight;
    this.activeEnvironment = 'primary';

    this.startReplicationMonitoring();
  }

  // Simulate continuous data replication to pilot light
  private startReplicationMonitoring(): void {
    this.replicationMonitor = setInterval(() => {
      // Simulate replication lag (typically 1-10 seconds)
      const lag = Math.random() * 5 + 1;
      this.pilotLightEnv.setReplicationLag(lag);
    }, 2000);
  }

  // Detect primary region failure and initiate failover
  async detectAndFailover(primaryHealthy: boolean): Promise<void> {
    if (!primaryHealthy && this.activeEnvironment === 'primary') {
      console.log('\\n!!! PRIMARY REGION FAILURE DETECTED !!!');
      console.log('Initiating disaster recovery to pilot light region...\\n');

      await this.failoverToPilotLight();
    }
  }

  // Execute failover to pilot light environment
  private async failoverToPilotLight(): Promise<void> {
    const startTime = Date.now();

    console.log('[DR Orchestrator] Step 1: Verify pilot light data integrity');
    console.log(\`  → Replication lag: \${this.pilotLightEnv.getReplicationLag().toFixed(2)}s\`);
    console.log(\`  → Data is fresh enough for recovery (RPO < 30s)\`);

    console.log('\\n[DR Orchestrator] Step 2: Scale up pilot light infrastructure');
    await this.pilotLightEnv.scaleUp();

    console.log('\\n[DR Orchestrator] Step 3: Update DNS to route traffic to standby region');
    await this.updateDNS('pilot-light');

    console.log('\\n[DR Orchestrator] Step 4: Verify standby region is serving traffic');
    const healthCheck = await this.verifyTrafficRouting();

    if (healthCheck) {
      this.activeEnvironment = 'pilot-light';
      const recoveryTime = (Date.now() - startTime) / 1000;

      console.log(\`\\n✓ FAILOVER COMPLETE!\`);
      console.log(\`  → Recovery Time: \${recoveryTime.toFixed(1)}s\`);
      console.log(\`  → Active Environment: \${this.pilotLightEnv.getName()}\`);
      console.log(\`  → Data Loss: ~\${this.pilotLightEnv.getReplicationLag().toFixed(1)}s\`);
    }
  }

  // Simulate DNS update to redirect traffic
  private async updateDNS(target: 'primary' | 'pilot-light'): Promise<void> {
    console.log(\`  → Updating DNS records to point to \${target} region...\`);

    // DNS propagation takes time
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(\`  → DNS updated (TTL allows gradual traffic shift)\`);
  }

  // Verify new environment is receiving traffic
  private async verifyTrafficRouting(): Promise<boolean> {
    console.log(\`  → Running health checks on \${this.pilotLightEnv.getName()}...\`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(\`  → Health checks passed, traffic flowing successfully\`);
    return true;
  }

  // Failback to primary after recovery
  async failbackToPrimary(): Promise<void> {
    if (this.activeEnvironment === 'primary') {
      console.log('Already running on primary');
      return;
    }

    console.log('\\n[DR Orchestrator] Initiating failback to primary region...\\n');

    // Ensure primary is fully recovered
    console.log('[DR Orchestrator] Step 1: Verify primary region is healthy');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\\n[DR Orchestrator] Step 2: Sync latest data back to primary');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\\n[DR Orchestrator] Step 3: Update DNS to route traffic back to primary');
    await this.updateDNS('primary');

    this.activeEnvironment = 'primary';

    console.log('\\n[DR Orchestrator] Step 4: Scale down pilot light to minimal state');
    await this.pilotLightEnv.scaleDown();

    console.log(\`\\n✓ FAILBACK COMPLETE! Back to primary region.\`);
  }

  getMetrics(): RecoveryMetrics {
    const primaryCost = this.primaryEnv.getTotalCost();
    const pilotCost = this.pilotLightEnv.getTotalCost();

    return {
      rto: 2, // ~2 minutes to scale up and redirect traffic
      rpo: 1, // ~1 minute data loss (replication lag)
      monthlyCost: (primaryCost + pilotCost) * 730, // hours per month
      dataLag: this.pilotLightEnv.getReplicationLag(),
    };
  }

  getStatus() {
    return {
      activeEnvironment: this.activeEnvironment,
      primary: {
        name: this.primaryEnv.getName(),
        status: this.primaryEnv.getStatus(),
        components: this.primaryEnv.getComponents(),
        costPerHour: this.primaryEnv.getTotalCost(),
      },
      pilotLight: {
        name: this.pilotLightEnv.getName(),
        status: this.pilotLightEnv.getStatus(),
        components: this.pilotLightEnv.getComponents(),
        costPerHour: this.pilotLightEnv.getTotalCost(),
        replicationLag: this.pilotLightEnv.getReplicationLag(),
      },
      metrics: this.getMetrics(),
    };
  }

  cleanup(): void {
    if (this.replicationMonitor) {
      clearInterval(this.replicationMonitor);
    }
  }
}

// ============================================================
// Usage Example
// ============================================================
async function demonstratePilotLight() {
  console.log('=== Pilot Light Disaster Recovery Demo ===\\n');

  // ============================================================
  // Primary Environment (us-east-1) - Full Production
  // ============================================================
  const primary = new Environment('US-East-1', 'us-east-1', 'primary');

  // Always-on and compute components
  primary.addComponent(new Component('primary-db', 'database', 'us-east-1', true, 50));
  primary.addComponent(new Component('primary-cache', 'cache', 'us-east-1', true, 20));
  primary.addComponent(new Component('primary-storage', 'storage', 'us-east-1', true, 10));
  primary.addComponent(new Component('primary-app-1', 'compute', 'us-east-1', false, 30));
  primary.addComponent(new Component('primary-app-2', 'compute', 'us-east-1', false, 30));
  primary.addComponent(new Component('primary-app-3', 'compute', 'us-east-1', false, 30));
  primary.addComponent(new Component('primary-lb', 'loadbalancer', 'us-east-1', false, 15));

  // ============================================================
  // Pilot Light Environment (us-west-2) - Minimal Standby
  // ============================================================
  const pilotLight = new Environment('US-West-2', 'us-west-2', 'pilot-light');

  // ONLY data layer runs continuously (alwaysOn = true)
  pilotLight.addComponent(new Component('standby-db', 'database', 'us-west-2', true, 50));
  pilotLight.addComponent(new Component('standby-cache', 'cache', 'us-west-2', true, 20));
  pilotLight.addComponent(new Component('standby-storage', 'storage', 'us-west-2', true, 10));

  // Compute resources are STOPPED (alwaysOn = false)
  pilotLight.addComponent(new Component('standby-app-1', 'compute', 'us-west-2', false, 30));
  pilotLight.addComponent(new Component('standby-app-2', 'compute', 'us-west-2', false, 30));
  pilotLight.addComponent(new Component('standby-app-3', 'compute', 'us-west-2', false, 30));
  pilotLight.addComponent(new Component('standby-lb', 'loadbalancer', 'us-west-2', false, 15));

  // Wait for initial setup
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create orchestrator
  const dr = new DisasterRecoveryOrchestrator(primary, pilotLight);

  // Show initial state
  console.log('\\n--- Initial Infrastructure State ---');
  const initialStatus = dr.getStatus();
  console.log(\`Active: \${initialStatus.activeEnvironment}\`);
  console.log(\`Primary Cost: $\${initialStatus.primary.costPerHour}/hr\`);
  console.log(\`Pilot Light Cost: $\${initialStatus.pilotLight.costPerHour}/hr (only data layer)\`);
  console.log(\`Total Monthly Cost: $\${initialStatus.metrics.monthlyCost.toFixed(2)}\`);

  // Simulate normal operations
  console.log('\\n--- Normal Operations (Primary Region) ---');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Simulate disaster in primary region
  console.log('\\n--- Simulating Primary Region Disaster ---');
  await dr.detectAndFailover(false);

  // Show post-failover state
  console.log('\\n--- Post-Failover Infrastructure State ---');
  const failoverStatus = dr.getStatus();
  console.log(\`Active: \${failoverStatus.activeEnvironment}\`);
  console.log(\`Pilot Light Cost: $\${failoverStatus.pilotLight.costPerHour}/hr (scaled up)\`);

  // Simulate recovery and failback
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('\\n--- Primary Region Recovered, Initiating Failback ---');
  await dr.failbackToPrimary();

  // Final state
  console.log('\\n--- Final Infrastructure State ---');
  const finalStatus = dr.getStatus();
  console.log(\`Active: \${finalStatus.activeEnvironment}\`);
  console.log(\`Pilot Light Cost: $\${finalStatus.pilotLight.costPerHour}/hr (back to minimal)\`);

  dr.cleanup();
  console.log('\\n=== Demo Complete ===');
}

// Run the demo
// demonstratePilotLight();`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete pilot light disaster recovery system with minimal always-on infrastructure, rapid compute provisioning, and automated failover/failback orchestration",
        prerequisites: [
          "Disaster recovery concepts",
          "RTO and RPO objectives",
          "Infrastructure provisioning",
          "DNS-based traffic routing",
          "Data replication",
        ],
        systemPosition:
          "Disaster recovery layer managing multi-region infrastructure with cost-optimized standby environment that can rapidly scale during regional failures",
      },
      annotations: [
        {
          id: "pl-component-types",
          lines: [9, 22],
          action: "Define infrastructure component types and recovery metrics",
          reason:
            "Pilot light distinguishes between always-on data components (database, cache, storage) and dormant compute components. This separation enables cost optimization while maintaining rapid recovery capability.",
          contextLevel: "system",
          relatedConcepts: ["infrastructure-components", "recovery-metrics"],
        },
        {
          id: "pl-component-startup",
          lines: [44, 87],
          action: "Different component types have different startup times",
          reason:
            "Databases start quickly because they're already running in pilot light. Compute takes longest because instances must be provisioned from scratch. This difference is why we keep data layer always-on and compute dormant.",
          contextLevel: "module",
          relatedConcepts: ["startup-time", "provisioning-delay"],
        },
        {
          id: "pl-always-on-components",
          lines: [117, 126],
          action: "Only start always-on components in pilot light mode",
          reason:
            "Core pilot light concept: data infrastructure runs continuously to receive replication, while compute resources remain stopped to save costs. This balances recovery speed with cost efficiency.",
          contextLevel: "system",
          relatedConcepts: ["cost-optimization", "selective-provisioning"],
        },
        {
          id: "pl-scale-up",
          lines: [133, 151],
          action: "Scale up pilot light by starting all dormant components",
          reason:
            "During disaster, rapidly provision compute resources that were dormant. Data is already synchronized, so only need to start application servers and load balancers. This is much faster than restoring from cold backup.",
          contextLevel: "system",
          relatedConcepts: ["rapid-scaling", "disaster-recovery"],
        },
        {
          id: "pl-scale-down",
          lines: [153, 167],
          action:
            "Scale down to minimal state by stopping non-essential components",
          reason:
            "After failback to primary, return pilot light to cost-optimized minimal state. Stop compute resources but keep data layer running for continuous replication. Maintains readiness while minimizing costs.",
          contextLevel: "system",
          relatedConcepts: ["cost-optimization", "minimal-standby"],
        },
        {
          id: "pl-replication-monitoring",
          lines: [196, 205],
          action:
            "Continuously monitor replication lag to pilot light data layer",
          reason:
            "Replication lag determines RPO (data loss during failover). Monitoring ensures pilot light data is fresh enough for recovery. High lag would increase data loss, violating recovery objectives.",
          contextLevel: "system",
          relatedConcepts: ["replication-lag", "rpo-monitoring"],
        },
        {
          id: "pl-failover-steps",
          lines: [218, 247],
          action:
            "Execute multi-step failover: verify data, scale up, update DNS, verify traffic",
          reason:
            "Systematic failover ensures data integrity and successful traffic routing. Each step is critical: data verification prevents data loss, scale-up provides capacity, DNS redirect moves traffic, health checks confirm success.",
          contextLevel: "system",
          relatedConcepts: ["failover-orchestration", "disaster-recovery"],
        },
        {
          id: "pl-dns-update",
          lines: [249, 258],
          action: "Update DNS records to redirect traffic to standby region",
          reason:
            "DNS-based failover is common for disaster recovery because it's infrastructure-agnostic and works across regions. TTL controls how fast traffic shifts (lower TTL = faster but more DNS queries).",
          contextLevel: "system",
          relatedConcepts: ["dns-failover", "traffic-routing"],
        },
        {
          id: "pl-failback",
          lines: [268, 291],
          action:
            "Failback to primary after recovery with data sync and scale-down",
          reason:
            "After primary region recovers, return to normal operation. Sync latest data back to primary, redirect traffic, then scale down pilot light to minimal state. This returns to cost-optimized configuration.",
          contextLevel: "system",
          relatedConcepts: ["failback", "normal-operations"],
        },
        {
          id: "pl-cost-metrics",
          lines: [293, 302],
          action: "Calculate RTO, RPO, and monthly costs for disaster recovery",
          reason:
            "Pilot light provides specific RTO/RPO tradeoffs: 2-minute RTO (time to scale and failover) versus hot standby's seconds, 1-minute RPO (replication lag) versus backup's hours. Cost is middle ground between expensive hot standby and cheap cold backup.",
          contextLevel: "system",
          relatedConcepts: ["recovery-objectives", "cost-analysis"],
        },
        {
          id: "pl-demo-setup",
          lines: [349, 384],
          action:
            "Create primary and pilot light environments with different component configurations",
          reason:
            "Demonstrates cost optimization: primary runs all components for production traffic, pilot light only runs data layer (alwaysOn=true) while compute is dormant (alwaysOn=false). Shows 60-70% cost reduction versus full hot standby.",
          contextLevel: "system",
          relatedConcepts: ["environment-configuration", "cost-comparison"],
        },
      ],
      highlights: [
        {
          lines: [25, 105],
          label: "Infrastructure component with startup time modeling",
          sbvpDomain: "structure",
        },
        {
          lines: [133, 167],
          label: "Scale-up and scale-down operations for pilot light",
          sbvpDomain: "behavior",
        },
        {
          lines: [218, 258],
          label: "Multi-step disaster recovery failover orchestration",
          sbvpDomain: "behavior",
        },
        {
          lines: [293, 302],
          label: "RTO/RPO and cost metrics calculation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [349, 384],
          label: "Primary vs pilot light environment configuration",
          sbvpDomain: "structure",
        },
      ],
    },
  ],
};
