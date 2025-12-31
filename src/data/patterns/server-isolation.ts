import type { Pattern } from "../schema";

export const serverIsolation: Pattern = {
  id: "server-isolation",
  slug: "server-isolation",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🧱 Bulkhead → 🖥️ Server Isolation",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkhead",
    level: 4,
  },

  concept: {
    name: "Server Isolation",
    emoji: "🖥️",
    tagline: "Dedicated infrastructure",
    definition:
      "Server isolation is a reliability pattern that deploys critical or high-priority workloads on dedicated physical or virtual servers, preventing resource contention with less critical services. Think of it like VIP seating at a concert—premium ticket holders get their own section separate from general admission to guarantee they aren't crowded out. For example, an e-commerce platform might run its checkout service on dedicated servers while sharing infrastructure for less critical features like product recommendations or reviews. This ensures that even if the recommendation engine experiences a traffic spike or resource leak, the checkout flow remains unaffected with guaranteed CPU, memory, and network bandwidth. The isolation can be physical (separate hardware), virtual (dedicated VMs or containers with resource reservations), or logical (Kubernetes namespaces with resource quotas). The pattern is particularly important for services with strict SLAs, regulatory compliance requirements, or unpredictable workload characteristics that could starve other services of resources.",
    problemSolved:
      "Shared infrastructure creates the risk that one misbehaving or overloaded service can degrade or crash other services running on the same servers. For example, a batch analytics job consuming all available CPU and memory can starve critical user-facing API services, causing request timeouts and failed transactions. A memory leak in a background worker can gradually consume all server RAM, eventually triggering the out-of-memory killer that randomly terminates processes including critical services. Traffic spikes to one service can exhaust network bandwidth or file descriptors, impacting unrelated services. Server isolation solves this by dedicating infrastructure: the payment service runs on its own servers with 16GB RAM and 8 CPUs guaranteed available, regardless of what happens to the recommendation service on separate servers. This creates strong resource boundaries and blast radius containment. If the analytics job goes haywire, it only affects its own servers, not production APIs.",
    tradeoffs: {
      pros: [
        "Provides strong resource guarantees and performance isolation, ensuring critical services always have dedicated CPU, memory, and network bandwidth available",
        "Limits blast radius of failures, resource exhaustion, or performance degradation to isolated server pools rather than affecting all services",
        "Enables independent scaling and capacity planning for each isolated workload based on its specific resource needs and traffic patterns",
        "Simplifies compliance and security by physically segregating services that handle sensitive data or have regulatory requirements",
      ],
      cons: [
        "Significantly increases infrastructure costs by dedicating servers to specific workloads instead of efficiently sharing resources across all services",
        "Reduces overall resource utilization since dedicated servers may sit partially idle while shared servers are overloaded, wasting capacity",
        "Complicates infrastructure management with multiple server pools to monitor, patch, and maintain separately rather than a homogeneous fleet",
        "Makes dynamic resource allocation harder since servers are pre-allocated to specific services, reducing flexibility during unexpected load patterns",
      ],
    },
    relatedPatterns: [
      "bulkhead",
      "process-isolation",
      "thread-pool-isolation",
      "multi-level-queue",
      "circuit-breaker",
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
      id: "server-isolation-ts-basic",
      language: "typescript",
      title: "Server Isolation with Resource Guarantees",
      description:
        "Kubernetes-based server isolation demonstrating dedicated node pools for critical vs non-critical services with resource reservations",
      code: `type ServicePriority = 'critical' | 'standard' | 'background';

interface ResourceRequirements {
  cpu: string;
  memory: string;
  diskIO: string;
}

interface ServerPool {
  name: string;
  priority: ServicePriority;
  nodeCount: number;
  resources: ResourceRequirements;
  services: Service[];
  utilizationPercent: number;
}

interface Service {
  name: string;
  priority: ServicePriority;
  resources: ResourceRequirements;
  healthStatus: 'healthy' | 'degraded' | 'failing';
}

class IsolatedServerManager {
  private serverPools: Map<ServicePriority, ServerPool> = new Map();

  constructor() {
    this.serverPools.set('critical', {
      name: 'critical-pool',
      priority: 'critical',
      nodeCount: 5,
      resources: {
        cpu: '16 cores per node',
        memory: '64GB per node',
        diskIO: '10000 IOPS per node'
      },
      services: [],
      utilizationPercent: 0
    });

    this.serverPools.set('standard', {
      name: 'standard-pool',
      priority: 'standard',
      nodeCount: 10,
      resources: {
        cpu: '8 cores per node',
        memory: '32GB per node',
        diskIO: '5000 IOPS per node'
      },
      services: [],
      utilizationPercent: 0
    });

    this.serverPools.set('background', {
      name: 'background-pool',
      priority: 'background',
      nodeCount: 3,
      resources: {
        cpu: '4 cores per node',
        memory: '16GB per node',
        diskIO: '1000 IOPS per node'
      },
      services: [],
      utilizationPercent: 0
    });
  }

  deployService(service: Service): { success: boolean; message: string; assignedPool?: string } {
    const targetPool = this.serverPools.get(service.priority);

    if (!targetPool) {
      return {
        success: false,
        message: \`No server pool exists for priority: \${service.priority}\`
      };
    }

    if (targetPool.utilizationPercent >= 80) {
      return {
        success: false,
        message: \`Pool \${targetPool.name} is at capacity (\${targetPool.utilizationPercent}%)\`
      };
    }

    targetPool.services.push(service);
    targetPool.utilizationPercent = this.calculateUtilization(targetPool);

    return {
      success: true,
      message: \`Service \${service.name} deployed to isolated pool: \${targetPool.name}\`,
      assignedPool: targetPool.name
    };
  }

  private calculateUtilization(pool: ServerPool): number {
    const serviceCount = pool.services.length;
    const maxServices = pool.nodeCount * 3;
    return Math.min(Math.round((serviceCount / maxServices) * 100), 100);
  }

  simulateServiceFailure(serviceName: string): void {
    for (const [priority, pool] of this.serverPools) {
      const service = pool.services.find(s => s.name === serviceName);
      if (service) {
        service.healthStatus = 'failing';
        console.log(\`\nFAILURE SIMULATION: \${serviceName} failing in \${pool.name}\`);
        this.reportIsolationBoundary(priority);
        return;
      }
    }
  }

  private reportIsolationBoundary(failedPriority: ServicePriority): void {
    console.log(\`\n--- Isolation Boundary Report ---\`);

    for (const [priority, pool] of this.serverPools) {
      const healthyServices = pool.services.filter(s => s.healthStatus === 'healthy').length;
      const failedServices = pool.services.filter(s => s.healthStatus === 'failing').length;
      const isolationStatus = priority === failedPriority ? 'AFFECTED' : 'PROTECTED';

      console.log(\`\${pool.name} [\${isolationStatus}]:\`);
      console.log(\`  - Healthy: \${healthyServices}/\${pool.services.length} services\`);
      console.log(\`  - Failed: \${failedServices}/\${pool.services.length} services\`);
      console.log(\`  - Utilization: \${pool.utilizationPercent}%\`);
      console.log(\`  - Resources: \${pool.resources.cpu}, \${pool.resources.memory}\`);
    }

    console.log(\`\n✓ Isolation successful: Failure in \${failedPriority}-pool did not impact other pools\`);
  }

  getPoolStatus(priority: ServicePriority): ServerPool | undefined {
    return this.serverPools.get(priority);
  }

  getAllPoolsStatus(): Record<ServicePriority, ServerPool> {
    const status: any = {};
    this.serverPools.forEach((pool, priority) => {
      status[priority] = {
        ...pool,
        services: pool.services.map(s => ({
          name: s.name,
          health: s.healthStatus
        }))
      };
    });
    return status;
  }
}

function generateKubernetesManifest(service: Service): string {
  const nodeSelector = service.priority === 'critical'
    ? 'critical-workloads'
    : service.priority === 'standard'
    ? 'standard-workloads'
    : 'background-workloads';

  return \`apiVersion: apps/v1
kind: Deployment
metadata:
  name: \${service.name}
  labels:
    priority: \${service.priority}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: \${service.name}
  template:
    metadata:
      labels:
        app: \${service.name}
        priority: \${service.priority}
    spec:
      nodeSelector:
        workload-type: \${nodeSelector}
      containers:
      - name: \${service.name}
        image: \${service.name}:latest
        resources:
          requests:
            cpu: "\${service.resources.cpu}"
            memory: "\${service.resources.memory}"
          limits:
            cpu: "\${service.resources.cpu}"
            memory: "\${service.resources.memory}"\`;
}

async function demonstrateServerIsolation() {
  const manager = new IsolatedServerManager();

  const criticalServices: Service[] = [
    { name: 'payment-service', priority: 'critical', resources: { cpu: '2000m', memory: '4Gi', diskIO: '1000' }, healthStatus: 'healthy' },
    { name: 'checkout-service', priority: 'critical', resources: { cpu: '2000m', memory: '4Gi', diskIO: '1000' }, healthStatus: 'healthy' },
    { name: 'auth-service', priority: 'critical', resources: { cpu: '1000m', memory: '2Gi', diskIO: '500' }, healthStatus: 'healthy' }
  ];

  const standardServices: Service[] = [
    { name: 'product-catalog', priority: 'standard', resources: { cpu: '1000m', memory: '2Gi', diskIO: '500' }, healthStatus: 'healthy' },
    { name: 'recommendation-engine', priority: 'standard', resources: { cpu: '2000m', memory: '8Gi', diskIO: '1000' }, healthStatus: 'healthy' },
    { name: 'search-service', priority: 'standard', resources: { cpu: '1500m', memory: '4Gi', diskIO: '750' }, healthStatus: 'healthy' }
  ];

  const backgroundServices: Service[] = [
    { name: 'analytics-processor', priority: 'background', resources: { cpu: '1000m', memory: '4Gi', diskIO: '200' }, healthStatus: 'healthy' },
    { name: 'data-export-job', priority: 'background', resources: { cpu: '500m', memory: '2Gi', diskIO: '100' }, healthStatus: 'healthy' }
  ];

  console.log('=== Deploying Services to Isolated Server Pools ===\n');

  [...criticalServices, ...standardServices, ...backgroundServices].forEach(service => {
    const result = manager.deployService(service);
    console.log(\`\${result.success ? '✓' : '✗'} \${result.message}\`);
  });

  console.log('\n=== Server Pool Status ===');
  const status = manager.getAllPoolsStatus();
  Object.entries(status).forEach(([priority, pool]) => {
    console.log(\`\n\${pool.name}:\`);
    console.log(\`  Nodes: \${pool.nodeCount}\`);
    console.log(\`  Services: \${pool.services.length}\`);
    console.log(\`  Utilization: \${pool.utilizationPercent}%\`);
  });

  console.log('\n\n=== Simulating Failure in Background Pool ===');
  manager.simulateServiceFailure('analytics-processor');

  console.log('\n=== Example Kubernetes Manifest for Critical Service ===');
  console.log(generateKubernetesManifest(criticalServices[0]));
}

demonstrateServerIsolation().catch(console.error);`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Multi-tier server isolation system managing dedicated infrastructure pools for critical, standard, and background workloads with Kubernetes integration",
        prerequisites: [
          "Container orchestration concepts",
          "Resource management and quotas",
          "Kubernetes node selectors and taints",
          "Service isolation patterns",
        ],
        systemPosition:
          "Infrastructure layer spanning cluster management and orchestration, sits between physical/cloud resources and application deployment",
      },
      annotations: [
        {
          id: "si-priority-types",
          lines: [1, 1],
          action: "Define service priority tiers for isolation",
          reason:
            "Three-tier classification separates mission-critical services (payments) from standard features (recommendations) and background jobs (analytics), enabling different resource guarantees",
          contextLevel: "system",
          relatedConcepts: ["quality-of-service", "resource-prioritization"],
        },
        {
          id: "si-resource-requirements",
          lines: [3, 7],
          action: "Model CPU, memory, and disk I/O resource requirements",
          reason:
            "Explicit resource modeling enables capacity planning, admission control, and prevents resource contention between services",
          contextLevel: "local",
          relatedConcepts: ["resource-quotas", "capacity-planning"],
        },
        {
          id: "si-server-pool",
          lines: [9, 16],
          action:
            "Define isolated server pool with node count and resource totals",
          reason:
            "Each pool represents dedicated physical/virtual infrastructure - critical pool gets 5 nodes with 16 cores each, background pool gets 3 nodes with 4 cores",
          contextLevel: "system",
          relatedConcepts: ["bulkhead", "infrastructure-isolation"],
        },
        {
          id: "si-pool-initialization",
          lines: [25, 67],
          action:
            "Initialize three isolated server pools with different capacities",
          reason:
            "Pre-allocating dedicated infrastructure ensures critical services always have guaranteed resources - 5 high-spec nodes for payments, 3 low-spec nodes for batch jobs",
          contextLevel: "system",
          relatedConcepts: ["static-partitioning", "resource-reservation"],
        },
        {
          id: "si-admission-control",
          lines: [69, 92],
          action: "Check pool capacity before deploying service",
          reason:
            "Admission control prevents oversubscription - reject deployment if pool is at 80% capacity to maintain headroom for traffic spikes",
          contextLevel: "module",
          relatedConcepts: ["admission-control", "oversubscription"],
        },
        {
          id: "si-utilization-calc",
          lines: [94, 98],
          action: "Calculate pool utilization based on service count",
          reason:
            "Simplified utilization metric (services per node) helps operators understand capacity - real systems would track actual CPU/memory usage",
          contextLevel: "local",
          relatedConcepts: ["resource-metrics", "capacity-monitoring"],
        },
        {
          id: "si-failure-simulation",
          lines: [100, 111],
          action: "Simulate service failure and identify affected pool",
          reason:
            "Demonstrates blast radius containment - when analytics-processor fails in background-pool, it only affects that pool, not critical or standard pools",
          contextLevel: "module",
          relatedConcepts: ["fault-isolation", "blast-radius"],
        },
        {
          id: "si-isolation-report",
          lines: [113, 134],
          action: "Report health status across all pools to show isolation",
          reason:
            "Proves isolation effectiveness - failure in one pool shows AFFECTED status while other pools remain PROTECTED with all services healthy",
          contextLevel: "system",
          relatedConcepts: ["observability", "fault-isolation"],
        },
        {
          id: "si-k8s-manifest",
          lines: [150, 182],
          action:
            "Generate Kubernetes manifest with node selector and resource limits",
          reason:
            "Translates logical isolation to Kubernetes primitives - nodeSelector ensures pod only schedules on dedicated nodes, resource limits enforce isolation",
          contextLevel: "module",
          relatedConcepts: ["kubernetes", "infrastructure-as-code"],
        },
        {
          id: "si-node-selector",
          lines: [151, 158],
          action: "Map service priority to Kubernetes node selector label",
          reason:
            "Node selectors are the key Kubernetes mechanism for server isolation - ensures critical services only run on critical-workloads nodes",
          contextLevel: "module",
          relatedConcepts: ["kubernetes-scheduling", "node-affinity"],
        },
        {
          id: "si-resource-requests-limits",
          lines: [173, 180],
          action: "Set CPU and memory requests equal to limits",
          reason:
            "Guaranteed QoS class in Kubernetes - when requests == limits, pods get dedicated resources and are never evicted due to resource pressure",
          contextLevel: "module",
          relatedConcepts: ["kubernetes-qos", "resource-guarantees"],
        },
        {
          id: "si-demo-services",
          lines: [186, 199],
          action: "Create representative services for each priority tier",
          reason:
            "Realistic example shows typical workload distribution - payment/checkout are critical, search/catalog are standard, analytics is background",
          contextLevel: "system",
          relatedConcepts: ["workload-classification"],
        },
        {
          id: "si-failure-demo",
          lines: [217, 218],
          action: "Simulate failure in background pool to prove isolation",
          reason:
            "Demonstrates core value proposition - analytics-processor crashes but payment-service and checkout-service are completely unaffected",
          contextLevel: "system",
          relatedConcepts: ["fault-tolerance", "blast-radius-containment"],
        },
      ],
      highlights: [
        {
          lines: [25, 67],
          label: "Three-tier server pool architecture - 5/10/3 node split",
          sbvpDomain: "structure",
        },
        {
          lines: [69, 92],
          label: "Admission control preventing pool oversubscription",
          sbvpDomain: "behavior",
        },
        {
          lines: [113, 134],
          label: "Isolation boundary visualization - AFFECTED vs PROTECTED",
          sbvpDomain: "visualization",
        },
        {
          lines: [151, 180],
          label: "Kubernetes node selector and QoS enforcement",
          sbvpDomain: "philosophy",
        },
        {
          lines: [100, 111],
          label: "Failure simulation proving blast radius containment",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],
};
