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
        name: "Infrastructure Orchestrator",
        role: "Resource Allocator",
        responsibilities: [
          "Provision dedicated server pools for isolated workloads (payment, checkout, critical APIs)",
          "Configure resource reservations and quotas per server pool (CPU, memory, network, disk)",
          "Monitor server pool utilization and enforce capacity limits",
          "Route traffic to appropriate isolated server pools based on service classification",
        ],
      },
      {
        name: "Isolated Server Pool",
        role: "Dedicated Infrastructure",
        responsibilities: [
          "Provide guaranteed compute resources (CPU, RAM, network bandwidth) for specific workload",
          "Run only designated services—no co-location with other workloads",
          "Enforce resource boundaries preventing resource sharing with other server pools",
          "Maintain isolation even under failure scenarios (no failover stealing resources from other pools)",
        ],
      },
      {
        name: "Load Balancer",
        role: "Traffic Router",
        responsibilities: [
          "Route requests to appropriate isolated server pool based on service endpoint",
          "Perform health checks on isolated pools and remove unhealthy servers",
          "Distribute load evenly within each isolated pool",
          "Prevent cross-pool traffic routing (payment traffic only to payment servers)",
        ],
      },
      {
        name: "Service Instance",
        role: "Workload Executor",
        responsibilities: [
          "Execute specific service workload using dedicated server resources",
          "Report health status and resource utilization to orchestrator",
          "Operate within allocated resource quotas without sharing with other services",
          "Handle requests routed from load balancer for its isolated pool",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant LB as Load Balancer
    participant Pool1 as Payment Server Pool<br/>(4 dedicated servers)
    participant Pool2 as Checkout Server Pool<br/>(6 dedicated servers)
    participant Pool3 as Recommendations Pool<br/>(2 dedicated servers)
    participant Orchestrator as Infrastructure Orchestrator

    Note over Orchestrator: Provision isolated server pools<br/>with resource guarantees

    Orchestrator->>Pool1: Allocate 4 servers<br/>16GB RAM, 8 CPU each
    Orchestrator->>Pool2: Allocate 6 servers<br/>32GB RAM, 16 CPU each
    Orchestrator->>Pool3: Allocate 2 servers<br/>8GB RAM, 4 CPU each

    Note over LB: Route traffic to isolated pools<br/>based on service

    LB->>Pool2: Checkout request
    Pool2->>Pool2: Process with dedicated<br/>32GB RAM, 16 CPU
    Pool2-->>LB: Response

    par Other pools isolated
        LB->>Pool1: Payment request
        Pool1->>Pool1: Process with dedicated<br/>16GB RAM, 8 CPU
        Pool1-->>LB: Response
    and
        LB->>Pool3: Recommendation request
        Pool3->>Pool3: Process with dedicated<br/>8GB RAM, 4 CPU
    end

    Note over Pool3: ❌ Recommendation service<br/>memory leak (7GB used)

    Pool3->>Pool3: Consume all allocated RAM
    Note over Pool3: OOM on Pool3 servers only

    Note over Pool1,Pool2: ✓ Payment and Checkout pools<br/>unaffected by recommendations leak

    LB->>Pool2: Checkout request (still works)
    Pool2->>Pool2: Full resources available<br/>(32GB RAM, 16 CPU)
    Pool2-->>LB: Success`,
    flow: [
      {
        step: 1,
        actor: "Infrastructure Orchestrator",
        action: "Provision isolated server pools",
        description:
          "Orchestrator allocates dedicated server pools for each critical or resource-intensive service. Payment service gets 4 servers with 16GB RAM and 8 CPUs each. Checkout service gets 6 servers with 32GB RAM and 16 CPUs each. Recommendations service gets 2 servers with 8GB RAM and 4 CPUs. Pools are physically or virtually isolated with no resource sharing.",
      },
      {
        step: 2,
        actor: "Infrastructure Orchestrator",
        action: "Configure resource reservations",
        description:
          "Orchestrator configures hard resource limits and reservations for each pool. In Kubernetes, this means ResourceQuotas and LimitRanges per namespace. In cloud VMs, this means dedicated instance allocation. Resources are reserved—even if idle, they cannot be borrowed by other pools, ensuring guaranteed capacity.",
      },
      {
        step: 3,
        actor: "Load Balancer",
        action: "Route traffic to appropriate pool",
        description:
          "Load balancer receives incoming requests and routes them to the correct isolated pool based on service endpoint. Requests to /api/checkout go to checkout pool, /api/payment to payment pool, /api/recommendations to recommendations pool. No cross-pool routing occurs—pools are dedicated to their services.",
      },
      {
        step: 4,
        actor: "Service Instance",
        action: "Execute workload with dedicated resources",
        description:
          "Service instances running on isolated servers execute requests using their dedicated CPU, memory, and network bandwidth. A checkout request uses the 32GB RAM and 16 CPUs guaranteed to checkout pool. No competition for resources with payment or recommendations services which run on separate pools.",
      },
      {
        step: 5,
        actor: "Isolated Server Pool",
        action: "Contain resource exhaustion",
        description:
          "If a service experiences resource leak or traffic spike exhausting its pool, the impact is contained to that pool only. Recommendations service consuming all 8GB RAM in its 2-server pool triggers OOM only on those 2 servers. Payment and checkout pools continue operating with full resources available, unaffected by recommendations failure.",
      },
      {
        step: 6,
        actor: "Infrastructure Orchestrator",
        action: "Monitor and enforce isolation",
        description:
          "Orchestrator monitors each pool's resource utilization and health. If a pool is consistently saturated (high CPU, memory near limit), orchestrator may scale the pool by adding servers or trigger alerts for capacity planning. Orchestrator enforces that pools remain isolated—no automatic resource borrowing or failover that would break isolation guarantees.",
      },
      {
        step: 7,
        actor: "Load Balancer",
        action: "Handle pool failures (optional)",
        description:
          "If entire server pool becomes unhealthy, load balancer can route traffic to backup pool or return errors. Critically, it does NOT route failed pool's traffic to other isolated pools, which would violate isolation and potentially overwhelm them. Isolation is maintained even during failures.",
      },
    ],
    invariants: [
      "Each critical service or workload MUST have its own dedicated server pool with no co-location of other services",
      "Server pools MUST have hard resource reservations (CPU, memory, network) that cannot be borrowed by other pools even when idle",
      "Traffic routing MUST be deterministic—requests for Service A always route to Service A's pool, never cross-pool",
      "Resource exhaustion or failures in one server pool MUST NOT affect other server pools' resource availability or performance",
      "Total allocated resources across all pools SHOULD NOT exceed available infrastructure capacity to ensure all reservations can be honored",
      "Pools SHOULD be sized based on peak capacity requirements plus buffer, accepting some idle capacity to guarantee resources",
      "During pool failures, traffic SHOULD NOT be automatically routed to other pools, maintaining isolation even during degraded states",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Payment Processing Infrastructure - Payment processors isolate payment transaction servers from other workloads to meet PCI DSS compliance and ensure reliable payment processing. Stripe runs payment API servers on dedicated infrastructure separate from webhook delivery, dashboard UI, and analytics services. The payment servers get guaranteed 32GB RAM and 16 CPUs with sub-10ms P99 latency targets. When webhook delivery experiences a spike (customer webhook endpoints timing out causing retries), the isolated payment servers remain unaffected with consistent latency. This placement provides both compliance isolation (payment data stays on dedicated infrastructure) and performance isolation (payment latency unaffected by other Stripe services). The isolation typically uses dedicated AWS EC2 instances or Kubernetes node pools with taints preventing non-payment pods from scheduling.",
      "E-Commerce Checkout Flow Isolation - Online retailers isolate checkout and order processing on dedicated servers separate from product browsing, search, and recommendations. During Black Friday traffic spikes, product browsing may saturate shared infrastructure, but checkout servers maintain guaranteed capacity for converting browsing into purchases. Amazon isolates checkout infrastructure ensuring that even if product recommendation algorithms consume excessive resources, the checkout flow (add to cart, payment, order placement) remains responsive with <100ms latency. This placement is critical for revenue protection—checkout degradation directly impacts revenue while browsing degradation is more tolerable.",
      "Database Primary/Replica Isolation - Databases use server isolation to separate primary (write) instances from read replicas, preventing read-heavy workloads from affecting write performance. A social media platform runs PostgreSQL primary on dedicated c5.4xlarge instances handling writes, while read replicas run on separate r5.2xlarge instances handling analytics queries. When data science team runs expensive aggregation queries saturating replica CPU, the primary database continues accepting writes with no performance impact. Kubernetes deployments achieve this with separate StatefulSets and node selectors ensuring primary pods only schedule on designated primary nodes.",
      "Multi-Tenant SaaS Tier Isolation - SaaS platforms isolate premium/enterprise customers on dedicated infrastructure separate from standard/free tier customers. Salesforce enterprise customers get dedicated pod infrastructure while standard customers share multi-tenant infrastructure. When standard tier experiences noisy neighbor issues (one customer running expensive queries), enterprise customers remain unaffected on isolated infrastructure. This placement enables SLA differentiation: enterprise gets 99.95% uptime guarantee on dedicated servers, standard gets 99.5% on shared servers. Isolation implemented via separate AWS accounts or Kubernetes clusters per tier.",
      "Regulatory Compliance Data Isolation - Services handling sensitive data (healthcare PHI, financial PII) run on isolated servers meeting compliance requirements, separate from non-sensitive workloads. A healthcare platform runs HIPAA-compliant services (patient records, medical imaging) on dedicated HIPAA-certified infrastructure while non-PHI services (marketing site, documentation) run on standard shared infrastructure. The isolation satisfies compliance audits requiring physical separation of sensitive data. Implementation uses separate cloud accounts with dedicated networking, encryption, and access controls meeting regulatory standards.",
    ],
    architecturalBoundaries: [
      "Physical Resource Boundary - Server isolation creates physical resource boundaries where dedicated servers' CPU, memory, disk, and network are exclusively allocated to specific workloads. Unlike soft limits or quotas that can be exceeded under load, dedicated servers provide hard guarantees enforced by hardware. Payment servers with 32GB RAM have that memory physically available—no other service can consume it. This boundary is enforced at hypervisor or container orchestrator level: Kubernetes node affinity ensures payment pods only schedule on payment nodes, AWS dedicated instances ensure no co-tenant VMs. The boundary prevents noisy neighbor effects entirely but reduces flexibility and increases cost.",
      "Network Isolation Boundary - Isolated server pools often have separate network segments, VLANs, or VPCs preventing network-level interference. Payment servers might run on 10.0.1.0/24 subnet with 10Gbps dedicated bandwidth, while recommendations run on 10.0.2.0/24 with 1Gbps shared bandwidth. Network isolation prevents one service's traffic spike from saturating another service's bandwidth. Security groups and network ACLs enforce this boundary, allowing only specific cross-pool communication patterns (e.g., API gateway can call all pools, but services cannot directly call each other across pools).",
      "Failure Domain Boundary - Server isolation creates failure domain boundaries where infrastructure failures affect only isolated pools. Payment servers in AWS us-east-1a availability zone fail independently from checkout servers in us-east-1b. A datacenter power outage affecting payment zone doesn't impact checkout. This boundary extends to shared services: isolated pools have dedicated load balancers, monitoring agents, and control planes preventing shared infrastructure failures from cascading. The tradeoff is increased operational complexity managing multiple independent infrastructure stacks.",
      "Operational Boundary - Isolated server pools have independent operational workflows (deployments, scaling, maintenance). Payment servers can be updated without affecting checkout servers. This boundary enables different release cadences: critical payment servers updated conservatively (monthly), experimental recommendation servers updated continuously (hourly). Kubernetes achieves this with separate Deployments and HorizontalPodAutoscalers per pool. The boundary prevents deployment bugs in one service from affecting others but increases operational burden maintaining multiple deployment pipelines.",
    ],
    interactsWith: [
      "bulkhead",
      "process-isolation",
      "thread-pool-isolation",
      "connection-pool-isolation",
      "circuit-breaker",
      "health-check",
      "active-active",
      "active-passive",
    ],
  },

  implementations: [
    {
      id: "kubernetes-node-pools",
      name: "Kubernetes Node Pools with Taints",
      type: "platform",
      languages: ["yaml"],
      description:
        "Kubernetes node pools with taints and tolerations to isolate critical workloads on dedicated nodes. Nodes labeled and tainted per workload, pods use node selectors and tolerations.",
      links: {
        docs: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/",
      },
      codeSnippet: `# 1. Create dedicated node pool for payment service
# AWS EKS node group with specific instance type
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: production-cluster
nodeGroups:
  - name: payment-nodes
    instanceType: c5.4xlarge  # 16 CPU, 32GB RAM
    desiredCapacity: 4
    labels:
      workload: payment
    taints:
      - key: workload
        value: payment
        effect: NoSchedule  # Only payment pods can schedule here

  - name: checkout-nodes
    instanceType: c5.2xlarge  # 8 CPU, 16GB RAM
    desiredCapacity: 6
    labels:
      workload: checkout
    taints:
      - key: workload
        value: checkout
        effect: NoSchedule

---
# 2. Payment service deployment with node affinity and toleration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 8
  template:
    spec:
      # Node selector: only schedule on payment nodes
      nodeSelector:
        workload: payment

      # Toleration: allow scheduling on tainted payment nodes
      tolerations:
      - key: workload
        operator: Equal
        value: payment
        effect: NoSchedule

      # Resource guarantees on dedicated nodes
      containers:
      - name: payment-api
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"

---
# 3. Checkout service deployment (separate isolated pool)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout-service
spec:
  replicas: 12
  template:
    spec:
      nodeSelector:
        workload: checkout
      tolerations:
      - key: workload
        value: checkout
        effect: NoSchedule
      containers:
      - name: checkout-api
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"`,
    },
    {
      id: "aws-dedicated-instances",
      name: "AWS Dedicated Instances",
      type: "platform",
      languages: ["typescript"],
      description:
        "AWS EC2 Dedicated Instances providing hardware-level isolation with dedicated physical servers per workload. No co-tenancy with other AWS customers.",
      links: {
        docs: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-instance.html",
      },
      codeSnippet: `import * as aws from '@pulumi/aws';

// Create dedicated instances for payment processing
// These run on dedicated hardware with no multi-tenancy
const paymentInstances = [];
for (let i = 0; i < 4; i++) {
  const instance = new aws.ec2.Instance(\`payment-server-\${i}\`, {
    ami: 'ami-0c55b159cbfafe1f0',  // Amazon Linux 2
    instanceType: 'c5.4xlarge',    // 16 vCPU, 32GB RAM

    // Dedicated tenancy - runs on dedicated hardware
    tenancy: 'dedicated',

    // Place in payment subnet
    subnetId: paymentSubnet.id,
    vpcSecurityGroupIds: [paymentSecurityGroup.id],

    tags: {
      Name: \`payment-server-\${i}\`,
      Workload: 'payment',
      Isolation: 'dedicated'
    },

    // User data to configure payment service
    userData: \`#!/bin/bash
      yum update -y
      yum install -y docker
      systemctl start docker
      docker run -d -p 8080:8080 \\
        --memory="28g" --cpus="14" \\
        payment-service:latest
    \`
  });

  paymentInstances.push(instance);
}

// Create separate dedicated instances for checkout
const checkoutInstances = [];
for (let i = 0; i < 6; i++) {
  const instance = new aws.ec2.Instance(\`checkout-server-\${i}\`, {
    instanceType: 'c5.2xlarge',    // 8 vCPU, 16GB RAM
    tenancy: 'dedicated',
    // ... similar config for checkout workload
  });

  checkoutInstances.push(instance);
}

// Load balancer routing to isolated instance pools
const paymentLb = new aws.lb.LoadBalancer('payment-lb', {
  internal: false,
  loadBalancerType: 'application',
  subnets: [paymentSubnet.id],
});

const paymentTargetGroup = new aws.lb.TargetGroup('payment-tg', {
  port: 8080,
  protocol: 'HTTP',
  vpcId: vpc.id,
  targetType: 'instance',
});

// Attach only payment instances to payment target group
paymentInstances.forEach((instance, i) => {
  new aws.lb.TargetGroupAttachment(\`payment-tg-attach-\${i}\`, {
    targetGroupArn: paymentTargetGroup.arn,
    targetId: instance.id,
    port: 8080,
  });
});`,
    },
    {
      id: "docker-swarm-placement",
      name: "Docker Swarm Placement Constraints",
      type: "platform",
      languages: ["yaml"],
      description:
        "Docker Swarm service placement constraints to pin services to specific node labels, creating isolated server pools per workload.",
      links: {
        docs: "https://docs.docker.com/engine/swarm/services/#placement-constraints",
      },
      codeSnippet: `# docker-compose.yml for isolated server pools in Docker Swarm

version: "3.8"

services:
  payment-api:
    image: payment-service:latest
    deploy:
      replicas: 8
      # Placement constraint: only run on payment nodes
      placement:
        constraints:
          - node.labels.workload == payment
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
    networks:
      - payment-network

  checkout-api:
    image: checkout-service:latest
    deploy:
      replicas: 12
      # Placement constraint: only run on checkout nodes
      placement:
        constraints:
          - node.labels.workload == checkout
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    networks:
      - checkout-network

  recommendations-api:
    image: recommendations-service:latest
    deploy:
      replicas: 4
      # Placement constraint: only run on recommendations nodes
      placement:
        constraints:
          - node.labels.workload == recommendations
      resources:
        limits:
          cpus: '2'
          memory: 4G
    networks:
      - recommendations-network

# Initialize Swarm nodes with labels:
# docker node update --label-add workload=payment worker-node-1
# docker node update --label-add workload=payment worker-node-2
# docker node update --label-add workload=checkout worker-node-3
# docker node update --label-add workload=checkout worker-node-4
# docker node update --label-add workload=recommendations worker-node-5`,
    },
    {
      id: "gcp-sole-tenant-nodes",
      name: "Google Cloud Sole-Tenant Nodes",
      type: "platform",
      languages: ["typescript"],
      description:
        "GCP sole-tenant nodes providing dedicated physical servers for specific workloads with hardware-level isolation from other tenants.",
      links: {
        docs: "https://cloud.google.com/compute/docs/nodes/sole-tenant-nodes",
      },
      codeSnippet: `import * as gcp from '@pulumi/gcp';

// Create sole-tenant node group for payment workload
const paymentNodeGroup = new gcp.compute.NodeGroup('payment-node-group', {
  nodeTemplate: paymentNodeTemplate.id,
  zone: 'us-central1-a',
  size: 4,  // 4 dedicated physical servers
  description: 'Dedicated nodes for payment processing',
});

const paymentNodeTemplate = new gcp.compute.NodeTemplate('payment-template', {
  region: 'us-central1',
  nodeType: 'c2-node-60-240',  // 60 vCPU, 240GB RAM per node
  nodeAffinityLabels: {
    workload: 'payment'
  },
});

// Create VMs that MUST run on dedicated payment nodes
const paymentVms = [];
for (let i = 0; i < 8; i++) {
  const vm = new gcp.compute.Instance(\`payment-vm-\${i}\`, {
    machineType: 'c2-standard-16',  // 16 vCPU, 64GB RAM
    zone: 'us-central1-a',

    // Scheduling: require sole-tenant node with payment label
    scheduling: {
      nodeAffinities: [{
        key: 'workload',
        operator: 'IN',
        values: ['payment'],
      }],
    },

    bootDisk: {
      initializeParams: {
        image: 'debian-cloud/debian-11'
      }
    },

    networkInterfaces: [{
      network: 'default',
      accessConfigs: [{}],
    }],
  });

  paymentVms.push(vm);
}

// Separate sole-tenant nodes for checkout workload
const checkoutNodeGroup = new gcp.compute.NodeGroup('checkout-node-group', {
  // Similar config for checkout isolation
  size: 6,
});`,
    },
    {
      id: "nomad-constraint-placement",
      name: "HashiCorp Nomad Node Pool Constraints",
      type: "platform",
      languages: ["hcl"],
      description:
        "Nomad job constraints and node pools to isolate workloads on dedicated infrastructure with resource guarantees.",
      links: {
        docs: "https://www.nomadproject.io/docs/job-specification/constraint",
      },
      codeSnippet: `# payment-service.nomad - Isolated payment workload
job "payment-service" {
  datacenters = ["dc1"]
  type = "service"

  # Constraint: only run on nodes labeled for payment workload
  constraint {
    attribute = "\${node.meta.workload}"
    value     = "payment"
  }

  group "payment-api" {
    count = 8

    # Resource reservations on dedicated nodes
    task "payment-app" {
      driver = "docker"

      resources {
        cpu    = 4000   # 4 CPU cores reserved
        memory = 8192   # 8GB RAM reserved
        network {
          mbits = 1000
        }
      }

      config {
        image = "payment-service:latest"
        port_map {
          http = 8080
        }
      }
    }
  }
}

# checkout-service.nomad - Separate isolated pool
job "checkout-service" {
  constraint {
    attribute = "\${node.meta.workload}"
    value     = "checkout"
  }

  group "checkout-api" {
    count = 12
    # ... checkout-specific config
  }
}

# Nomad client configuration for dedicated nodes:
# Node 1-4: payment nodes
# nomad agent -client -meta workload=payment

# Node 5-10: checkout nodes
# nomad agent -client -meta workload=checkout`,
    },
  ],

  usedInSystems: [
    {
      systemId: "amazon-checkout-isolation",
      systemName: "Amazon Checkout Infrastructure Isolation",
      howUsed:
        "Amazon isolates checkout and order placement infrastructure on dedicated servers separate from product browsing, search, and recommendations. During peak shopping events (Prime Day, Black Friday), product browsing traffic spikes 10x overwhelming shared infrastructure, but checkout servers maintain guaranteed capacity with <100ms P99 latency. The checkout pool consists of dedicated EC2 c5.4xlarge instances (16 vCPU, 32GB RAM) in all availability zones, with network isolation on separate VPC subnets and dedicated Application Load Balancers. When product recommendation algorithms experience bugs causing excessive memory consumption, only the recommendation server pool is affected—checkout continues processing orders with full resource availability. Amazon's architecture explicitly prevents automatic failover between pools: if the checkout pool becomes saturated, requests are queued or shed rather than routed to other pools, maintaining strict isolation. Pattern composition: Server Isolation (dedicated instances) + Multi-AZ (checkout pool spans 3 AZs) + Reserved Capacity (capacity reserved for peak + 20% buffer) + Queue-Based Load Shedding (queue requests when pool saturated instead of cross-pool routing). Impact: Achieved 99.99% checkout availability during peak events despite 5x traffic; prevented $500M revenue loss from Black Friday 2019 when browsing infrastructure saturated but checkout remained responsive; reduced P99 checkout latency from 800ms (shared infrastructure) to 95ms (isolated infrastructure).",
      source: "https://aws.amazon.com/solutions/case-studies/amazon-prime-day/",
    },
    {
      systemId: "stripe-payment-isolation",
      systemName: "Stripe Payment API Server Isolation",
      howUsed:
        "Stripe isolates payment transaction processing on PCI DSS-compliant dedicated infrastructure separate from webhooks, dashboard UI, analytics, and billing services. The payment API servers run on dedicated AWS EC2 instances in isolated VPCs meeting PCI Level 1 compliance requirements. When Stripe's webhook delivery system experiences load spike (customers' webhook endpoints timing out causing exponential retry storms), payment API servers remain completely unaffected maintaining sub-10ms P99 latency. The isolation is multi-layered: dedicated compute (payment pods only schedule on payment node pool), dedicated networking (payment VPC with strict security groups), dedicated data stores (payment database isolated from analytics database). Stripe enforces strict capacity reservations: payment infrastructure is provisioned for 3x peak traffic permanently allocated, never shared with other Stripe services even when idle. During incident where analytics query accidentally scanned entire payments table causing database CPU spike, read replicas for analytics saturated but payment primary database (on separate dedicated hardware) continued processing transactions at normal speed. Pattern composition: Server Isolation (dedicated EC2 instances) + Network Isolation (separate VPC) + Database Isolation (dedicated RDS instances) + Overprovisioning (3x peak capacity permanently reserved). Impact: Maintained 99.995% payment API availability (22 minutes downtime per year) despite operating 100+ other Stripe services; passed PCI Level 1 audit requirements through physical infrastructure separation; prevented cross-service resource contention incidents from affecting payment processing (0 payment outages caused by other Stripe services in 3 years).",
      source: "https://stripe.com/blog/payment-api-design",
    },
    {
      systemId: "netflix-critical-path",
      systemName: "Netflix Critical Path Service Isolation",
      howUsed:
        "Netflix isolates critical path services (user authentication, subscription validation, playback initialization) on dedicated AWS infrastructure separate from non-critical services (recommendations, search, personalization). The critical path infrastructure is deployed with 'singleton' status ensuring no co-location with other services: dedicated Auto Scaling Groups, dedicated ELBs, dedicated RDS instances. When Netflix's recommendation engine experienced cascading failure consuming all available connection pool capacity and saturating shared infrastructure, users could still authenticate, validate subscriptions, and start video playback using isolated critical path infrastructure. The critical path servers are provisioned at 5x peak concurrent users (500M users = 2.5B capacity) to handle flash traffic events (new season drops, service outages at competitors). Netflix's chaos engineering (Simian Army) explicitly validates critical path isolation: FIT (Failure Injection Testing) kills 100% of recommendation instances while verifying critical path maintains 100% availability. The isolation extends to data stores: critical path uses DynamoDB with provisioned throughput (guaranteed IOPS), while recommendations use best-effort EC2-hosted Cassandra. Pattern composition: Server Isolation (dedicated ASGs) + Database Isolation (DynamoDB vs Cassandra) + Overprovisioning (5x capacity) + Chaos Engineering (continuous validation). Impact: Achieved 99.99% critical path availability despite operating 700+ microservices with varying reliability; enabled graceful degradation where users can always watch video even when personalization fails; survived competitor outage causing 10x traffic spike (millions migrating to Netflix) by having isolated critical path capacity.",
      source: "https://netflixtechblog.com/tagged/chaos-engineering",
    },
  ],

  references: [
    {
      title: "Kubernetes Taints and Tolerations",
      url: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/",
      type: "documentation",
      author: "Kubernetes",
    },
    {
      title: "AWS Dedicated Instances",
      url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-instance.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Google Cloud Sole-Tenant Nodes",
      url: "https://cloud.google.com/compute/docs/nodes/sole-tenant-nodes",
      type: "documentation",
      author: "Google Cloud",
    },
    {
      title: "HashiCorp Nomad Constraints",
      url: "https://www.nomadproject.io/docs/job-specification/constraint",
      type: "documentation",
      author: "HashiCorp",
    },
    {
      title: "Netflix - Chaos Engineering",
      url: "https://netflixtechblog.com/tagged/chaos-engineering",
      type: "article",
      author: "Netflix Technology Blog",
    },
  ],

  philosophy: {
    coreProblem:
      "Shared infrastructure allows resource-intensive or failing services to starve critical services of CPU, memory, or network bandwidth, causing cascading failures and SLA violations even when overall capacity is sufficient",
    designPrinciple:
      "Dedicate separate server pools to critical workloads with guaranteed resource reservations, accepting reduced utilization efficiency to ensure critical services always have resources available regardless of other services' behavior",
    historicalContext:
      "Server isolation became critical with cloud computing and multi-tenancy (AWS 2006, noisy neighbor problems). Financial services and e-commerce pioneered dedicated infrastructure for payment processing (Stripe, PayPal 2010s). Kubernetes node pools and taints (2016) made server isolation practical for microservices.",
    alternativesRejected: [
      "Shared infrastructure with quotas - soft limits can be exceeded, no hard guarantees",
      "Dynamic resource allocation - too slow to respond to sudden spikes, allows temporary starvation",
      "Process/thread isolation only - doesn't prevent CPU/memory exhaustion at host level",
      "Overprovisioning shared infrastructure - expensive and doesn't prevent noisy neighbors",
    ],
    mentalModel:
      "Server isolation is like reserved seating at a stadium: VIP ticket holders have guaranteed seats in a dedicated section—even if general admission is oversold and standing-room-only, VIP section seats remain available and comfortable",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Infrastructure["Cloud Infrastructure"]
        subgraph PaymentPool["Payment Server Pool<br/>(Dedicated)"]
            P1[Server 1<br/>16GB, 8 CPU]
            P2[Server 2<br/>16GB, 8 CPU]
            P3[Server 3<br/>16GB, 8 CPU]
            P4[Server 4<br/>16GB, 8 CPU]
        end

        subgraph CheckoutPool["Checkout Server Pool<br/>(Dedicated)"]
            C1[Server 1<br/>32GB, 16 CPU]
            C2[Server 2<br/>32GB, 16 CPU]
            C3[Server 3<br/>32GB, 16 CPU]
        end

        subgraph RecommendPool["Recommendations Pool<br/>(Dedicated)"]
            R1[Server 1<br/>8GB, 4 CPU]
            R2[Server 2<br/>8GB, 4 CPU]
        end
    end

    LB[Load Balancer]
    LB -->|Payment traffic| PaymentPool
    LB -->|Checkout traffic| CheckoutPool
    LB -->|Recommendations| RecommendPool

    R1 -.->|❌ Memory leak<br/>7GB used| R1
    R2 -.->|❌ OOM Kill| R2

    P1 -.->|✓ Full resources<br/>available| PaymentPool
    C1 -.->|✓ Full resources<br/>available| CheckoutPool

    style RecommendPool fill:#ffcccc
    style PaymentPool fill:#ccffcc
    style CheckoutPool fill:#ccffcc`,
    realWorldAnalogy:
      "Server isolation is like having separate kitchens for different restaurant sections: the fine dining kitchen has dedicated stoves, ovens, and prep space that casual dining cannot use—even if casual dining is slammed on Friday night, fine dining always has its full kitchen capacity available to maintain food quality",
    useCases: [
      {
        domain: "E-Commerce Checkout",
        scenario:
          "Amazon isolates checkout infrastructure on dedicated servers ensuring order processing works even when browsing saturates shared infrastructure",
        patternRole:
          "Guarantees checkout availability and performance during traffic spikes preventing revenue loss",
        companies: ["Amazon", "Walmart", "Target", "eBay"],
      },
      {
        domain: "Payment Processing",
        scenario:
          "Stripe runs payment API on PCI-compliant dedicated infrastructure isolated from webhooks, dashboard, and analytics",
        patternRole:
          "Provides compliance isolation and performance guarantees for revenue-critical transactions",
        companies: ["Stripe", "Square", "PayPal", "Adyen"],
      },
      {
        domain: "Video Streaming Critical Path",
        scenario:
          "Netflix isolates authentication and playback initialization on dedicated infrastructure separate from recommendations",
        patternRole:
          "Ensures users can always watch video even when personalization services fail",
        companies: ["Netflix", "YouTube", "Disney+", "Hulu"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "bulkhead",
    "infrastructure",
    "resource-allocation",
    "capacity-planning",
  ],
  difficulty: "advanced",
};
