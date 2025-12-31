import type { Pattern } from "../schema";

export const kubernetes: Pattern = {
  id: "kubernetes",
  slug: "kubernetes",
  corpusPath:
    "📈 SCALABILITY → ↔️ Horizontal → 🎼 Orchestration → ☸️ Kubernetes",

  hierarchy: {
    quality: "scalability",
    strategy: "Horizontal",
    family: "Orchestration",
    level: 4,
  },

  concept: {
    name: "Kubernetes",
    emoji: "☸️",
    tagline: "Container orchestration at scale",
    definition:
      "Kubernetes (K8s) is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications across clusters of machines. Originally developed by Google and now maintained by the Cloud Native Computing Foundation, it provides a declarative API for defining desired system state—specifying what containers should run, how many replicas, resource requirements, networking configuration, and health checks—while the control plane continuously reconciles actual state to match. Kubernetes abstracts away infrastructure complexity through concepts like Pods (groups of containers), Services (stable network endpoints), and Deployments (declarative rollout specifications). It handles core operational concerns automatically: scheduling containers to nodes based on resource availability, restarting failed containers, replacing unhealthy nodes, load balancing traffic across replicas, rolling out updates with zero downtime, and scaling applications horizontally based on CPU, memory, or custom metrics. The platform's self-healing capabilities detect and recover from failures without human intervention, while its extensibility through Custom Resources and Operators enables teams to codify domain-specific operational knowledge. Kubernetes has become the de facto standard for running cloud-native applications, powering everything from microservices platforms to machine learning pipelines, with major cloud providers offering managed Kubernetes services (GKE, EKS, AKS) that handle control plane operations.",
    problemSolved:
      "Managing containerized applications at scale presents overwhelming operational complexity without orchestration. Manual container management requires scripts to start containers on different machines, monitor their health, restart failures, distribute traffic, and coordinate updates—creating brittle, error-prone infrastructure that doesn't scale. Teams face resource utilization inefficiency as containers are statically allocated to servers, leaving capacity stranded when workloads fluctuate. Deployment consistency breaks down across environments (dev, staging, production) as manual configuration drifts, leading to 'works on my machine' issues that surface only in production. Service discovery becomes a nightmare when container IPs change dynamically—applications can't find dependencies without complex DNS or registry coordination. Kubernetes solves these problems through automated orchestration: its scheduler optimally packs containers onto nodes based on real-time resource availability, maximizing utilization while respecting constraints. Declarative configuration (YAML manifests) ensures consistency across environments—the same spec deploys identically everywhere. Built-in service discovery via DNS and environment variables eliminates manual coordination. Self-healing restarts failed containers and reschedules them on healthy nodes automatically. Horizontal Pod Autoscaler (HPA) adjusts replica counts based on metrics, handling traffic spikes without manual intervention. Rolling updates deploy new versions gradually with automated health checks, rolling back automatically on failure. This transforms container operations from manual, error-prone toil into automated, reliable infrastructure that scales effortlessly.",
    tradeoffs: {
      pros: [
        "Automatic horizontal scaling based on metrics (CPU, memory, custom)",
        "Self-healing: restarts failed containers and replaces unhealthy nodes",
        "Declarative configuration ensures consistency across environments",
        "Multi-cloud and on-premise portability avoids vendor lock-in",
        "Zero-downtime rolling updates with automated health checking",
      ],
      cons: [
        "Steep learning curve: concepts (Pods, Services, Ingress) require significant training",
        "Operational complexity: requires expertise in networking, storage, security",
        "Resource overhead: control plane components consume substantial CPU/memory",
        "Cost inefficiency for small deployments: overkill for simple applications",
        "YAML configuration verbosity leads to complex, hard-to-maintain manifests",
      ],
    },
    relatedPatterns: [
      "docker-swarm",
      "ecs-fargate",
      "nomad",
      "circuit-breaker",
      "health-check",
      "load-balancing",
      "service-mesh",
    ],
  },

  structure: {
    participants: [
      {
        name: "Control Plane",
        role: "Cluster Management",
        responsibilities: [
          "API Server: validates and processes all cluster operations",
          "Scheduler: assigns Pods to nodes based on resource availability",
          "Controller Manager: runs reconciliation loops to maintain desired state",
          "etcd: stores all cluster state and configuration data",
        ],
      },
      {
        name: "Worker Node",
        role: "Container Runtime Host",
        responsibilities: [
          "Kubelet: manages Pods and containers on the node",
          "Container Runtime: actually runs containers (Docker, containerd, CRI-O)",
          "Kube-proxy: manages network rules for Service load balancing",
          "Reports node health and resource capacity to control plane",
        ],
      },
      {
        name: "Pod",
        role: "Smallest Deployable Unit",
        responsibilities: [
          "Groups one or more containers sharing network and storage",
          "Provides shared localhost networking between containers",
          "Ephemeral: designed to be created, destroyed, and replaced",
          "Runs on a single node with dedicated IP address",
        ],
      },
      {
        name: "Service",
        role: "Stable Network Endpoint",
        responsibilities: [
          "Provides consistent DNS name and IP for accessing Pods",
          "Load balances traffic across healthy Pod replicas",
          "Abstracts away dynamic Pod IPs that change on restart",
          "Enables service discovery within the cluster",
        ],
      },
      {
        name: "Ingress Controller",
        role: "External Traffic Gateway",
        responsibilities: [
          "Routes external HTTP/HTTPS traffic to internal Services",
          "Provides SSL termination and virtual hosting",
          "Implements routing rules based on hostnames and paths",
          "Integrates with external load balancers (ALB, NLB, Cloud Load Balancer)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant IngressCtrl as Ingress Controller
    participant Service
    participant Scheduler
    participant Node
    participant Pod

    User->>IngressCtrl: HTTP Request
    IngressCtrl->>Service: Route to Service
    Service->>Pod: Load balance to healthy Pod
    Pod->>Service: Response
    Service->>IngressCtrl: Response
    IngressCtrl->>User: HTTP Response

    Note over Scheduler,Node: Deployment Flow
    Scheduler->>Node: Schedule Pod (resource fit)
    Node->>Pod: Create Pod
    Pod->>Node: Report health (readiness probe)
    Node->>Service: Register endpoint

    Note over Scheduler,Pod: Scaling Flow
    Scheduler->>Node: Create additional Pod replicas
    Node->>Pod: Scale horizontally
    Pod->>Service: New endpoint registered`,
    flow: [
      {
        step: 1,
        actor: "User",
        action: "Submit Deployment manifest",
        description:
          "User applies YAML configuration defining desired state (image, replicas, resources, health checks)",
      },
      {
        step: 2,
        actor: "API Server",
        action: "Validate and store in etcd",
        description:
          "API Server validates manifest against schema, stores in etcd distributed database",
      },
      {
        step: 3,
        actor: "Deployment Controller",
        action: "Create ReplicaSet",
        description:
          "Controller watches for Deployment changes, creates ReplicaSet to manage Pod replicas",
      },
      {
        step: 4,
        actor: "ReplicaSet Controller",
        action: "Create Pod specifications",
        description:
          "Ensures desired number of Pods exist, creates Pod specs if replicas < desired",
      },
      {
        step: 5,
        actor: "Scheduler",
        action: "Assign Pods to Nodes",
        description:
          "Selects optimal node for each Pod based on resource requests, affinity rules, constraints",
      },
      {
        step: 6,
        actor: "Kubelet",
        action: "Start containers on Node",
        description:
          "Kubelet on assigned node pulls container images and starts containers via runtime",
      },
      {
        step: 7,
        actor: "Pod",
        action: "Pass health checks",
        description:
          "Liveness probe ensures container is running; readiness probe confirms Pod can accept traffic",
      },
      {
        step: 8,
        actor: "Service",
        action: "Register Pod endpoint",
        description:
          "Service controller adds Pod IP to endpoints list for load balancing",
      },
      {
        step: 9,
        actor: "HPA",
        action: "Monitor metrics",
        description:
          "Horizontal Pod Autoscaler queries metrics server for CPU/memory/custom metrics",
      },
      {
        step: 10,
        actor: "HPA",
        action: "Scale replicas if needed",
        description:
          "Adjusts Deployment replica count if metrics exceed/fall below thresholds",
      },
      {
        step: 11,
        actor: "Deployment Controller",
        action: "Rolling update on image change",
        description:
          "Gradually replaces old Pods with new version, respecting maxUnavailable and maxSurge",
      },
      {
        step: 12,
        actor: "Kubelet",
        action: "Self-heal on failure",
        description:
          "Restarts containers that fail health checks; Scheduler reschedules Pods from failed nodes",
      },
    ],
    invariants: [
      "Desired state reconciliation: controllers continuously ensure actual state matches declared spec",
      "Pod isolation: each Pod has dedicated network namespace with unique IP address",
      "Service endpoint consistency: Services only route to Pods passing readiness probes",
      "Resource limits enforced: containers cannot exceed memory/CPU limits; node rejects Pods exceeding capacity",
      "Rolling update zero-downtime: maxUnavailable ensures minimum healthy replicas during updates",
      "Immutable container images: Pods always pull specified image tag; image changes trigger new Pod creation",
      "Node autonomy: Kubelet can continue managing Pods even if control plane is temporarily unreachable",
    ],
  },

  codeExamples: [
    {
      id: "k8s-typescript-client",
      language: "typescript",
      title:
        "TypeScript Kubernetes Client - Programmatic Deployment Management",
      description:
        "Using @kubernetes/client-node to programmatically create deployments, configure horizontal autoscaling, and manage rolling updates. Demonstrates the full deployment lifecycle including replica scaling and HPA configuration.",
      code: `import * as k8s from '@kubernetes/client-node';

// Initialize Kubernetes client from kubeconfig
const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // Loads from ~/.kube/config

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const autoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);

interface DeploymentConfig {
  name: string;
  namespace: string;
  image: string;
  replicas: number;
  containerPort: number;
  cpu: {
    request: string;
    limit: string;
  };
  memory: {
    request: string;
    limit: string;
  };
}

/**
 * REASON: Declarative deployment creation ensures consistency across environments.
 * Without K8s, you'd manually SSH to each server, pull images, start containers,
 * configure load balancers—taking hours and prone to errors.
 * K8s does this in seconds with guaranteed consistency.
 */
async function createDeployment(config: DeploymentConfig): Promise<void> {
  const deployment: k8s.V1Deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: config.name,
      namespace: config.namespace,
      labels: {
        app: config.name,
      },
    },
    spec: {
      // REASON: Replicas define desired Pod count. Controller Manager continuously
      // ensures actual count matches this spec, replacing failed Pods automatically.
      replicas: config.replicas,

      // REASON: Selector must match Pod template labels. This is how Deployment
      // controller identifies which Pods it manages.
      selector: {
        matchLabels: {
          app: config.name,
        },
      },

      // REASON: Template defines the Pod specification. All replicas are identical
      // clones of this template, ensuring consistency.
      template: {
        metadata: {
          labels: {
            app: config.name,
            version: 'v1',
          },
        },
        spec: {
          containers: [
            {
              name: config.name,
              image: config.image,
              ports: [
                {
                  containerPort: config.containerPort,
                  protocol: 'TCP',
                },
              ],

              // REASON: Resource requests are used by Scheduler to find nodes with
              // sufficient capacity. Limits prevent container from consuming unlimited
              // resources and impacting other Pods on the node.
              resources: {
                requests: {
                  cpu: config.cpu.request,      // "250m" = 0.25 CPU cores
                  memory: config.memory.request, // "256Mi" = 256 megabytes
                },
                limits: {
                  cpu: config.cpu.limit,         // "500m" = 0.5 CPU cores
                  memory: config.memory.limit,   // "512Mi" = 512 megabytes
                },
              },

              // REASON: Liveness probe restarts container if health check fails.
              // Catches deadlocks, infinite loops, corrupted state that prevents
              // the app from serving traffic.
              livenessProbe: {
                httpGet: {
                  path: '/health',
                  port: config.containerPort,
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },

              // REASON: Readiness probe controls Service endpoint registration.
              // Pod doesn't receive traffic until passing readiness check, preventing
              // requests to containers still warming up (loading caches, DB connections).
              readinessProbe: {
                httpGet: {
                  path: '/ready',
                  port: config.containerPort,
                },
                initialDelaySeconds: 10,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 2,
              },
            },
          ],
        },
      },

      // REASON: Rolling update strategy ensures zero-downtime deployments.
      // maxUnavailable=1 means at most 1 Pod can be down during update.
      // maxSurge=1 allows 1 extra Pod temporarily during rollout.
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxUnavailable: 1,
          maxSurge: 1,
        },
      },
    },
  };

  try {
    await k8sApi.createNamespacedDeployment(config.namespace, deployment);
    console.log(\`✅ Deployment \${config.name} created successfully\`);
  } catch (error) {
    if (error.response?.statusCode === 409) {
      console.log(\`Deployment \${config.name} already exists, updating...\`);
      await updateDeployment(config);
    } else {
      throw error;
    }
  }
}

/**
 * REASON: Horizontal Pod Autoscaler (HPA) automatically scales replicas based on
 * metrics. Without HPA, you'd manually watch dashboards and adjust replicas during
 * traffic spikes—too slow to prevent outages. HPA reacts in seconds.
 */
async function createHorizontalPodAutoscaler(
  name: string,
  namespace: string,
  targetDeployment: string,
  minReplicas: number,
  maxReplicas: number,
  targetCPUUtilization: number
): Promise<void> {
  const hpa: k8s.V2HorizontalPodAutoscaler = {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: name,
      namespace: namespace,
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: targetDeployment,
      },
      minReplicas: minReplicas,
      maxReplicas: maxReplicas,

      // REASON: HPA queries metrics server every 15s (default). When average CPU
      // across all Pods exceeds target, HPA increases replicas. When CPU drops,
      // it scales down (respecting scaleDown stabilization window to prevent flapping).
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: targetCPUUtilization, // Target 70% CPU
            },
          },
        },
        {
          type: 'Resource',
          resource: {
            name: 'memory',
            target: {
              type: 'Utilization',
              averageUtilization: 80, // Target 80% memory
            },
          },
        },
      ],

      // REASON: Scaling behavior prevents thrashing. Scale up quickly (60s window)
      // to handle traffic spikes, but scale down slowly (300s window) to avoid
      // oscillation during temporary load dips.
      behavior: {
        scaleUp: {
          stabilizationWindowSeconds: 60,
          policies: [
            {
              type: 'Percent',
              value: 100,          // Double replicas in one scale-up
              periodSeconds: 60,
            },
            {
              type: 'Pods',
              value: 4,            // Or add 4 Pods, whichever is greater
              periodSeconds: 60,
            },
          ],
          selectPolicy: 'Max',
        },
        scaleDown: {
          stabilizationWindowSeconds: 300, // Wait 5 minutes before scaling down
          policies: [
            {
              type: 'Percent',
              value: 10,           // Remove 10% of Pods at a time
              periodSeconds: 60,
            },
          ],
          selectPolicy: 'Min',
        },
      },
    },
  };

  await autoscalingApi.createNamespacedHorizontalPodAutoscaler(namespace, hpa);
  console.log(\`✅ HPA \${name} created: min=\${minReplicas}, max=\${maxReplicas}\`);
}

/**
 * REASON: Rolling updates deploy new versions gradually. Update image tag,
 * K8s creates new Pods, waits for health checks to pass, then terminates old Pods.
 * If new version fails health checks, rollout pauses automatically.
 */
async function updateDeploymentImage(
  name: string,
  namespace: string,
  newImage: string
): Promise<void> {
  const patch = [
    {
      op: 'replace',
      path: '/spec/template/spec/containers/0/image',
      value: newImage,
    },
    {
      op: 'replace',
      path: '/spec/template/metadata/labels/version',
      value: 'v2', // Update version label to track rollout
    },
  ];

  await k8sApi.patchNamespacedDeployment(
    name,
    namespace,
    patch,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
    }
  );

  console.log(\`✅ Deployment \${name} updated to image: \${newImage}\`);
  console.log('🔄 Rolling update in progress...');

  // Wait for rollout to complete
  await waitForRollout(name, namespace);
}

/**
 * REASON: Monitor rollout status to detect failures early. If new Pods don't
 * become ready within timeout, rollback automatically to prevent prolonged outage.
 */
async function waitForRollout(
  name: string,
  namespace: string,
  timeoutSeconds: number = 600
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const deployment = await k8sApi.readNamespacedDeploymentStatus(name, namespace);
    const status = deployment.body.status;

    // REASON: Check if all replicas are updated and available. Deployment is
    // complete when updatedReplicas = availableReplicas = desired replicas.
    if (
      status?.updatedReplicas === status?.replicas &&
      status?.availableReplicas === status?.replicas &&
      status?.unavailableReplicas === 0
    ) {
      console.log(\`✅ Rollout completed successfully\`);
      return;
    }

    console.log(
      \`⏳ Rollout status: \${status?.updatedReplicas}/\${status?.replicas} updated, \` +
      \`\${status?.availableReplicas} available\`
    );

    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
  }

  throw new Error('Rollout timeout exceeded');
}

// Usage Example
async function main() {
  const config: DeploymentConfig = {
    name: 'web-api',
    namespace: 'production',
    image: 'myregistry/web-api:v1.2.3',
    replicas: 3,
    containerPort: 8080,
    cpu: {
      request: '250m',
      limit: '500m',
    },
    memory: {
      request: '256Mi',
      limit: '512Mi',
    },
  };

  // Create deployment
  await createDeployment(config);

  // Configure autoscaling
  await createHorizontalPodAutoscaler(
    'web-api-hpa',
    'production',
    'web-api',
    3,   // min replicas
    10,  // max replicas
    70   // target CPU 70%
  );

  // Later: deploy new version
  await updateDeploymentImage(
    'web-api',
    'production',
    'myregistry/web-api:v1.3.0'
  );
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete programmatic deployment management with TypeScript client",
        prerequisites: [
          "@kubernetes/client-node library",
          "Kubernetes cluster access",
          "Understanding of Deployment lifecycle",
          "Metrics server installed for HPA",
        ],
        systemPosition:
          "CI/CD pipeline integration for automated deployments, GitOps workflows, infrastructure-as-code tools",
      },
      annotations: [
        {
          id: "k8s-ts-replicas",
          lines: [44, 46],
          action: "Define desired replica count in Deployment spec",
          reason:
            "Declarative replicas enable self-healing. If a Pod crashes or node fails, controller immediately schedules replacement to restore desired count. No manual intervention required.",
          contextLevel: "module",
          relatedConcepts: ["self-healing", "declarative-configuration"],
        },
        {
          id: "k8s-ts-resources",
          lines: [73, 84],
          action: "Specify CPU and memory requests and limits",
          reason:
            "Requests drive scheduling decisions—Scheduler only places Pod on nodes with sufficient capacity. Limits prevent noisy neighbor problems where one container starves others of resources. Critical for multi-tenant clusters.",
          contextLevel: "system",
          relatedConcepts: ["resource-management", "quality-of-service"],
        },
        {
          id: "k8s-ts-probes",
          lines: [86, 116],
          action: "Configure liveness and readiness probes",
          reason:
            "Probes enable self-healing and zero-downtime deployments. Liveness restarts frozen containers. Readiness prevents traffic to warming-up Pods. Without probes, Services send traffic to broken Pods, causing 500 errors.",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "circuit-breaker"],
        },
        {
          id: "k8s-ts-rolling-update",
          lines: [118, 128],
          action:
            "Define rolling update strategy with maxUnavailable and maxSurge",
          reason:
            "Controls rollout velocity and risk. maxUnavailable=1 ensures at least N-1 Pods always available (99%+ uptime). maxSurge=1 allows temporary extra Pod to speed rollout without disrupting capacity. Balance between speed and safety.",
          contextLevel: "module",
          relatedConcepts: ["zero-downtime-deployment", "blue-green"],
        },
        {
          id: "k8s-ts-hpa-metrics",
          lines: [170, 197],
          action: "Configure HPA with CPU and memory targets",
          reason:
            "Multi-metric HPA prevents both CPU-bound and memory-bound bottlenecks. Scales up when either metric exceeds threshold. Without HPA, traffic spikes cause slow responses or crashes; manual scaling reacts too slowly (minutes vs seconds).",
          contextLevel: "system",
          relatedConcepts: ["horizontal-scaling", "autoscaling"],
        },
        {
          id: "k8s-ts-hpa-behavior",
          lines: [199, 234],
          action: "Define scaling behavior to prevent thrashing",
          reason:
            "Asymmetric scaling (fast up, slow down) balances responsiveness with stability. Quick scale-up prevents outages during traffic spikes. Slow scale-down prevents oscillation during temporary dips (lunch hour, retry storms). Without behavior config, HPA can thrash and waste resources.",
          contextLevel: "system",
          relatedConcepts: ["adaptive-thresholds", "rate-limiting"],
        },
        {
          id: "k8s-ts-image-update",
          lines: [244, 264],
          action: "Patch deployment image to trigger rolling update",
          reason:
            "Immutable infrastructure: never modify running containers. Instead, update image tag and let K8s create new Pods. Controller gradually replaces old with new, health checking each step. Auto-pauses if new version fails probes.",
          contextLevel: "module",
          relatedConcepts: ["immutable-infrastructure", "canary-deployment"],
        },
        {
          id: "k8s-ts-rollout-status",
          lines: [276, 295],
          action:
            "Poll deployment status to verify all replicas updated and available",
          reason:
            "Rolling update isn't instant—can take minutes for large deployments. Monitor status to detect stuck rollouts (failing health checks, insufficient node capacity, image pull errors). Critical for CI/CD automation to fail fast on deployment issues.",
          contextLevel: "system",
          relatedConcepts: ["observability", "ci-cd"],
        },
      ],
      highlights: [
        {
          lines: [44, 128],
          label:
            "Deployment specification with self-healing and rolling updates",
          sbvpDomain: "structure",
        },
        {
          lines: [170, 234],
          label: "HPA configuration with behavior policies",
          sbvpDomain: "behavior",
        },
        {
          lines: [244, 264],
          label: "Rolling update via image patch",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "k8s-yaml-microservice",
      language: "typescript",
      title: "Complete Microservice Deployment with YAML Manifests",
      description:
        "Full-stack Kubernetes configuration for a production microservice: Deployment with resource limits and health probes, Service for load balancing, Ingress for external access, HPA for autoscaling, ConfigMap for configuration, and Secret for credentials. Demonstrates the complete deployment lifecycle using kubectl.",
      code: `# REASON: Namespace provides logical isolation for resources. Separates
# prod from dev/staging, prevents accidental cross-environment operations,
# enables resource quotas and RBAC policies per environment.
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production

---
# REASON: ConfigMap stores non-sensitive configuration as key-value pairs.
# Decouples config from container image—same image runs in dev/prod with
# different configs. Mounted as environment variables or files in Pods.
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-api-config
  namespace: production
data:
  LOG_LEVEL: "info"
  DATABASE_POOL_SIZE: "20"
  CACHE_TTL_SECONDS: "300"
  FEATURE_FLAG_NEW_UI: "true"
  # Application-specific settings...
  API_RATE_LIMIT: "1000"
  CORS_ALLOWED_ORIGINS: "https://app.example.com,https://www.example.com"

---
# REASON: Secret stores sensitive data (passwords, API keys, certificates).
# Base64 encoded and encrypted at rest in etcd. Mounted to Pods as environment
# variables or files. Separate from ConfigMap for RBAC—only authorized Pods
# can access specific Secrets.
apiVersion: v1
kind: Secret
metadata:
  name: web-api-secret
  namespace: production
type: Opaque
data:
  # Base64 encoded values (echo -n 'password' | base64)
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=
  API_KEY: YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=
  JWT_SECRET: c3VwZXJzZWNyZXRqd3RrZXk=

---
# REASON: Deployment manages Pod lifecycle. Declarative spec defines desired
# state; controller continuously reconciles actual to desired. Replaces Pods
# on failure, schedules to healthy nodes, performs rolling updates.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-api
  namespace: production
  labels:
    app: web-api
    tier: backend
    version: v2.1.0
spec:
  # REASON: 3 replicas provides high availability. If 1 Pod crashes or node
  # fails, 2 remain serving traffic. Odd number prevents split-brain scenarios
  # in distributed systems. Adjust based on load (or let HPA decide).
  replicas: 3

  # REASON: Selector links Deployment to Pods. Must match template labels exactly.
  # Deployment controller tracks Pods with these labels, ignores others.
  selector:
    matchLabels:
      app: web-api
      tier: backend

  # REASON: Template defines Pod specification. All replicas clone this template,
  # ensuring consistency. Updates to template trigger rolling update.
  template:
    metadata:
      labels:
        app: web-api
        tier: backend
        version: v2.1.0
      annotations:
        # REASON: Prometheus annotation enables automatic metric scraping.
        # Service mesh or monitoring stack reads these to discover endpoints.
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      # REASON: Service account provides Pod identity for RBAC. If Pod needs
      # to call K8s API (list resources, update ConfigMaps), assign service
      # account with appropriate permissions.
      serviceAccountName: web-api-sa

      containers:
      - name: web-api
        image: myregistry.azurecr.io/web-api:v2.1.0

        # REASON: ImagePullPolicy controls when to pull image. IfNotPresent uses
        # local cache if available, speeding up Pod startup. Always pulls latest
        # for :latest tag or registry changes. Never uses local cache only.
        imagePullPolicy: IfNotPresent

        ports:
        - name: http
          containerPort: 8080
          protocol: TCP

        # REASON: Environment variables from ConfigMap and Secret. Changes to
        # ConfigMap/Secret don't auto-update running Pods—must recreate Pod
        # (rolling update) to pick up new values. Use envFrom for all keys.
        env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: web-api-config
              key: LOG_LEVEL
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: web-api-secret
              key: DATABASE_PASSWORD
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: web-api-secret
              key: API_KEY
        # Pod metadata available as env vars for observability
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace

        # REASON: Resource requests and limits are CRITICAL for stable multi-tenant
        # clusters. Requests ensure Pod only scheduled on nodes with capacity.
        # Limits prevent runaway processes from consuming entire node. Without
        # limits, one Pod can OOM-kill others, causing cascading failures.
        resources:
          requests:
            # 500m = 0.5 CPU cores. Scheduler uses this for placement.
            cpu: 500m
            # 512Mi = 512 megabytes. Node reserves this memory for Pod.
            memory: 512Mi
          limits:
            # 1000m = 1 full CPU core. Throttles CPU if exceeded.
            cpu: 1000m
            # 1Gi = 1 gigabyte. OOM-kills Pod if exceeded, then restarts.
            memory: 1Gi

        # REASON: Liveness probe detects deadlocked or zombie containers.
        # If probe fails consecutively (failureThreshold=3), Kubelet kills
        # and restarts container. Use for detecting infinite loops, memory
        # leaks, corrupted state that prevents serving traffic.
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 30    # Wait 30s after start before first probe
          periodSeconds: 10           # Check every 10 seconds
          timeoutSeconds: 5           # Probe timeout (5s max response time)
          successThreshold: 1         # 1 success = healthy
          failureThreshold: 3         # 3 consecutive failures = restart

        # REASON: Readiness probe controls Service endpoint registration. Pod
        # doesn't receive traffic until passing readiness. Use for slow startup
        # (cache warming, DB connection pool), dependencies (wait for DB), or
        # transient issues (temporary backpressure). Unlike liveness, doesn't
        # restart container—just removes from load balancer temporarily.
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 10     # Start checking after 10s
          periodSeconds: 5            # Check frequently (every 5s)
          timeoutSeconds: 3           # Faster timeout (3s)
          successThreshold: 1         # 1 success = ready for traffic
          failureThreshold: 2         # 2 failures = remove from Service

        # REASON: Startup probe for slow-starting containers (JVM apps, ML models).
        # Liveness/readiness probes disabled until startup succeeds. Prevents
        # premature restarts during long initialization (loading large datasets).
        startupProbe:
          httpGet:
            path: /health/startup
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30        # 30 * 10s = 5 minutes max startup time

        # REASON: Lifecycle hooks run at container start/stop. preStop gives
        # container time to gracefully shutdown (finish in-flight requests,
        # flush buffers, deregister from service mesh). Without preStop, SIGTERM
        # kills immediately, causing connection errors for active requests.
        lifecycle:
          preStop:
            exec:
              # REASON: Sleep 15s before SIGTERM. Gives time for Service endpoint
              # removal to propagate (kube-proxy updates iptables rules). Prevents
              # new requests from routing to terminating Pod.
              command: ["/bin/sh", "-c", "sleep 15"]

      # REASON: Termination grace period limits how long K8s waits after SIGTERM
      # before sending SIGKILL. 30s allows graceful shutdown (finish requests,
      # close connections). For batch jobs or stateful apps, increase to 60-120s.
      terminationGracePeriodSeconds: 30

      # REASON: Image pull secret for private container registries (ACR, ECR, GCR).
      # Without this, Kubelet can't authenticate to pull private images.
      imagePullSecrets:
      - name: acr-secret

  # REASON: Rolling update strategy ensures zero-downtime deployments.
  # Creates new Pods with updated spec, waits for readiness, then terminates old.
  # If new Pods fail readiness, rollout pauses automatically—prevents bad
  # deployments from taking down service.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # REASON: maxUnavailable=1 means at most 1 Pod down during update.
      # With 3 replicas, always have 2+ serving traffic. Can use percentage
      # (25%) for large deployments.
      maxUnavailable: 1

      # REASON: maxSurge=1 allows 1 extra Pod temporarily (4 total during update).
      # Speeds rollout without capacity dip. For cost-sensitive deployments,
      # set to 0 and increase maxUnavailable instead.
      maxSurge: 1

  # REASON: Revision history limits stored ReplicaSets for rollback. Keep 10
  # recent versions to enable fast rollback (kubectl rollout undo). Old
  # ReplicaSets remain but scaled to 0 replicas.
  revisionHistoryLimit: 10

---
# REASON: Service provides stable network endpoint for Pods. Pod IPs change
# on restart/reschedule; Service IP/DNS never changes. Load balances traffic
# across healthy Pods (passing readiness probe). Essential for service discovery.
apiVersion: v1
kind: Service
metadata:
  name: web-api
  namespace: production
  labels:
    app: web-api
spec:
  # REASON: ClusterIP creates internal load balancer. Accessible only within
  # cluster via DNS (web-api.production.svc.cluster.local). Use LoadBalancer
  # for external access or NodePort for edge cases (demo, debug).
  type: ClusterIP

  # REASON: Selector determines which Pods receive traffic. Service controller
  # watches Pods with these labels, adds their IPs to endpoints list.
  selector:
    app: web-api
    tier: backend

  ports:
  - name: http
    protocol: TCP
    port: 80           # Service port (internal DNS resolves to this)
    targetPort: 8080   # Container port (traffic forwarded here)

  # REASON: Session affinity routes requests from same client to same Pod.
  # Useful for stateful sessions (websockets, in-memory sessions). ClientIP
  # uses source IP for affinity; None for random load balancing.
  sessionAffinity: None

---
# REASON: Ingress routes external HTTP/HTTPS traffic to internal Services.
# Provides SSL termination, virtual hosting (multiple domains), path-based
# routing. Ingress Controller (nginx, Traefik, ALB) implements the routing rules.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-api-ingress
  namespace: production
  annotations:
    # REASON: Annotations configure Ingress Controller behavior. These are
    # nginx-specific; other controllers (Traefik, HAProxy) have different options.
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod  # Auto SSL via cert-manager
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

    # REASON: Rate limiting prevents abuse and DDoS. 10 req/s per IP with burst
    # capacity of 20. Requests exceeding limit return 429 Too Many Requests.
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "2"

    # REASON: Increase body size limit for file uploads. Default 1MB is too small
    # for many APIs. Set to 0 for unlimited (risky—enables DoS via huge uploads).
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  # REASON: TLS configuration for HTTPS. cert-manager automatically provisions
  # and renews certificates from Let's Encrypt. Secret stores cert and private key.
  tls:
  - hosts:
    - api.example.com
    secretName: web-api-tls

  rules:
  # REASON: Routing rules define host and path mappings. Supports multiple
  # hosts, wildcards (*.example.com), and path-based routing (/api, /admin).
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-api
            port:
              number: 80

---
# REASON: Horizontal Pod Autoscaler (HPA) automatically scales replicas based
# on metrics. Queries metrics server every 15s; adjusts replica count when
# metrics exceed/fall below target. Essential for handling traffic spikes
# without manual intervention—scales up in seconds vs minutes for manual scaling.
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-api

  # REASON: Min/max replicas set scaling boundaries. Min ensures baseline
  # capacity (3 replicas = handle 300 req/s). Max prevents runaway costs
  # (10 replicas = cap at 1000 req/s, ~$500/month). Adjust based on capacity
  # planning and cost constraints.
  minReplicas: 3
  maxReplicas: 10

  # REASON: Multi-metric HPA scales on ANY metric exceeding threshold. If either
  # CPU or memory hits target, HPA scales up. Prevents bottlenecks where one
  # resource is saturated but others idle (CPU-bound vs memory-bound).
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        # REASON: Target 70% CPU utilization. Leaves 30% headroom for burst
        # traffic before scale-up completes. Lower targets (50%) waste resources;
        # higher targets (90%) risk saturation during scale-up delay (2-3 minutes).
        averageUtilization: 70

  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        # REASON: Target 80% memory utilization. Memory less bursty than CPU,
        # so higher utilization acceptable. But leave headroom—hitting limit
        # causes OOM kill and Pod restart, disrupting traffic.
        averageUtilization: 80

  # REASON: Scaling behavior prevents flapping (rapid scale up/down). Asymmetric
  # policy: scale up fast (respond to spikes), scale down slow (avoid thrashing
  # on temporary dips). Without behavior config, HPA can oscillate wildly during
  # variable load, wasting resources and causing instability.
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # Wait 60s before scaling up
      policies:
      # REASON: Max policy allows aggressive scale-up. Double replicas (100%) or
      # add 4 Pods, whichever is greater. Handles sudden traffic spikes (product
      # launch, viral content) without prolonged degradation.
      - type: Percent
        value: 100          # Double replica count
        periodSeconds: 60
      - type: Pods
        value: 4            # Or add 4 Pods
        periodSeconds: 60
      selectPolicy: Max     # Use the more aggressive policy

    scaleDown:
      stabilizationWindowSeconds: 300   # Wait 5 minutes before scaling down
      policies:
      # REASON: Conservative scale-down prevents thrashing. Remove only 10% of
      # Pods every minute. If load bounces back (lunch hour dip, retry storm),
      # we still have capacity. Gradual scale-down also amortizes termination cost.
      - type: Percent
        value: 10           # Remove 10% of replicas
        periodSeconds: 60
      selectPolicy: Min     # Use the more conservative policy`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete production microservice deployment with all operational concerns",
        prerequisites: [
          "Kubernetes cluster (GKE, EKS, AKS, or local)",
          "kubectl CLI configured",
          "Metrics server installed for HPA",
          "Ingress controller deployed (nginx, Traefik)",
          "cert-manager for SSL (optional)",
        ],
        systemPosition:
          "Foundational infrastructure for cloud-native applications, CI/CD pipelines, GitOps workflows (ArgoCD, Flux)",
      },
      annotations: [
        {
          id: "k8s-yaml-configmap",
          lines: [11, 28],
          action: "Store non-sensitive configuration in ConfigMap",
          reason:
            "Decouples configuration from container image. Same image runs in dev/prod with different configs. Change config without rebuilding image. Mounted as env vars or files. Critical for 12-factor apps.",
          contextLevel: "module",
          relatedConcepts: ["twelve-factor", "configuration-management"],
        },
        {
          id: "k8s-yaml-secret",
          lines: [30, 44],
          action: "Store sensitive data (passwords, API keys) in Secret",
          reason:
            "Encrypted at rest in etcd. RBAC controls which Pods can access which Secrets. Base64 encoded for non-printable characters. Separate from ConfigMap to prevent accidental exposure in logs/dashboards.",
          contextLevel: "system",
          relatedConcepts: ["secrets-management", "security"],
        },
        {
          id: "k8s-yaml-replicas",
          lines: [62, 66],
          action: "Set replica count to 3 for high availability",
          reason:
            "3 replicas ensures service remains available if 1 Pod crashes or node fails. Odd number prevents split-brain in distributed consensus. Adjust based on load or let HPA decide dynamically.",
          contextLevel: "module",
          relatedConcepts: ["high-availability", "fault-tolerance"],
        },
        {
          id: "k8s-yaml-resources",
          lines: [140, 152],
          action: "Define resource requests and limits for CPU and memory",
          reason:
            "Requests ensure Pod only scheduled on nodes with capacity. Limits prevent noisy neighbor problems. QoS classes (Guaranteed, Burstable, BestEffort) based on requests/limits ratio. Critical for multi-tenant stability.",
          contextLevel: "system",
          relatedConcepts: ["resource-management", "quality-of-service"],
        },
        {
          id: "k8s-yaml-probes",
          lines: [154, 192],
          action:
            "Configure liveness, readiness, and startup probes for health checking",
          reason:
            "Liveness restarts frozen containers. Readiness controls traffic routing—no requests until ready. Startup accommodates slow initialization. Without probes, K8s can't detect failures or coordinate deployments safely.",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "self-healing"],
        },
        {
          id: "k8s-yaml-lifecycle",
          lines: [194, 204],
          action: "Use preStop hook to gracefully shutdown container",
          reason:
            "Sleep 15s before SIGTERM allows Service endpoint removal to propagate. Prevents new requests from routing to terminating Pod. Gives container time to finish in-flight requests, flush buffers, close connections gracefully.",
          contextLevel: "module",
          relatedConcepts: ["graceful-shutdown", "zero-downtime"],
        },
        {
          id: "k8s-yaml-rolling-update",
          lines: [219, 233],
          action:
            "Configure rolling update strategy with maxUnavailable and maxSurge",
          reason:
            "maxUnavailable=1 ensures at least 2/3 Pods always serving (66%+ capacity). maxSurge=1 allows temporary extra Pod to speed rollout. Balance between deployment velocity, capacity, and cost. Rollout pauses if new Pods fail readiness.",
          contextLevel: "module",
          relatedConcepts: ["zero-downtime-deployment", "canary-deployment"],
        },
        {
          id: "k8s-yaml-service",
          lines: [238, 263],
          action:
            "Create Service for stable network endpoint and load balancing",
          reason:
            "Pod IPs change on restart/reschedule. Service provides stable DNS name and IP that never changes. Load balances across healthy Pods (passing readiness). Essential for service discovery—other apps find this service via DNS.",
          contextLevel: "system",
          relatedConcepts: ["service-discovery", "load-balancing"],
        },
        {
          id: "k8s-yaml-ingress",
          lines: [265, 314],
          action:
            "Configure Ingress for external HTTP/HTTPS access with SSL and rate limiting",
          reason:
            "Ingress routes external traffic to internal Services. Provides SSL termination (offload TLS from apps), virtual hosting (multiple domains on one IP), path-based routing. Rate limiting prevents abuse. Cost-effective: one load balancer serves many Services.",
          contextLevel: "system",
          relatedConcepts: ["api-gateway", "ssl-termination", "rate-limiting"],
        },
        {
          id: "k8s-yaml-hpa",
          lines: [316, 388],
          action:
            "Configure HPA with CPU/memory metrics and scaling behavior policies",
          reason:
            "HPA automatically scales replicas based on load. Responds to traffic spikes in seconds vs minutes for manual scaling. Multi-metric prevents bottlenecks. Behavior policies prevent flapping—fast up, slow down. Essential for variable load (time-of-day, seasonal, viral content).",
          contextLevel: "system",
          relatedConcepts: [
            "horizontal-scaling",
            "autoscaling",
            "adaptive-thresholds",
          ],
        },
      ],
      highlights: [
        {
          lines: [46, 237],
          label: "Deployment with comprehensive configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [238, 263],
          label: "Service for load balancing and discovery",
          sbvpDomain: "structure",
        },
        {
          lines: [265, 314],
          label: "Ingress for external access with SSL",
          sbvpDomain: "structure",
        },
        {
          lines: [316, 388],
          label: "HPA with multi-metric scaling and behavior policies",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "k8s-go-operator",
      language: "go",
      title: "Kubernetes Operator with Custom Resource Definition",
      description:
        "A Kubernetes Operator using controller-runtime that defines a custom resource (Database CRD) and implements a reconciliation loop to manage its lifecycle. Demonstrates the Operator pattern for automating complex operational tasks and encoding domain-specific knowledge into Kubernetes.",
      code: `package main

import (
    "context"
    "fmt"
    "time"

    corev1 "k8s.io/api/core/v1"
    apierrors "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
    "sigs.k8s.io/controller-runtime/pkg/log"
)

// REASON: Custom Resource Definition (CRD) extends Kubernetes API with
// domain-specific resources. Operators watch CRDs and automate complex
// operational tasks. This DatabaseCRD automates database provisioning,
// backup scheduling, user management—tasks that normally require hours
// of manual toil (provision VM, install postgres, configure replication,
// set up backups). Operator does it in minutes, declaratively.

// Database is the Schema for the databases API
type Database struct {
    metav1.TypeMeta   \`json:",inline"\`
    metav1.ObjectMeta \`json:"metadata,omitempty"\`

    Spec   DatabaseSpec   \`json:"spec,omitempty"\`
    Status DatabaseStatus \`json:"status,omitempty"\`
}

// DatabaseSpec defines desired state of Database
type DatabaseSpec struct {
    // REASON: Storage size request. Operator provisions PVC with this capacity.
    // Unlike manual provisioning where you estimate and overprovision, CRD
    // makes storage requirements explicit and auditable.
    StorageSize string \`json:"storageSize"\`

    // REASON: Database engine and version. Operator selects appropriate
    // container image and configuration. Change version to trigger upgrade.
    Engine  string \`json:"engine"\`   // "postgresql", "mysql", "mongodb"
    Version string \`json:"version"\`  // "14.5", "8.0", "6.0"

    // REASON: Replicas for high availability. Operator configures replication
    // (streaming replication for Postgres, MySQL replication, MongoDB replica set).
    // Manual HA setup takes days; Operator does it in minutes.
    Replicas int32 \`json:"replicas,omitempty"\`

    // REASON: Backup schedule (cron format). Operator creates CronJob for
    // automated backups, uploads to S3/GCS, manages retention. No more
    // forgotten backups or manual scripts.
    BackupSchedule string \`json:"backupSchedule,omitempty"\` // "0 2 * * *"

    // REASON: Resource requirements passed to StatefulSet. Ensures database
    // Pods have sufficient CPU/memory for workload.
    Resources corev1.ResourceRequirements \`json:"resources,omitempty"\`
}

// DatabaseStatus defines observed state of Database
type DatabaseStatus struct {
    // REASON: Status reflects reality, not desired state. Controller updates
    // status after observing cluster. Applications watch status to know when
    // database is ready (wait for Phase=Ready before connecting).
    Phase string \`json:"phase,omitempty"\` // Pending, Provisioning, Ready, Failed

    // REASON: Connection info for applications. Controller populates after
    // creating Service. Apps read connectionString from status to connect.
    ConnectionString string \`json:"connectionString,omitempty"\`

    // REASON: Last backup timestamp. Controller updates after successful backup.
    // Monitoring alerts if backups stop (lastBackup > 25 hours for daily backups).
    LastBackupTime *metav1.Time \`json:"lastBackupTime,omitempty"\`

    // REASON: Error conditions for debugging. If provisioning fails, error
    // message explains why (insufficient storage, invalid engine version).
    Conditions []metav1.Condition \`json:"conditions,omitempty"\`
}

// DatabaseReconciler reconciles a Database object
type DatabaseReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// REASON: Reconcile function is the heart of the Operator. Called whenever
// Database CRD changes (created, updated, deleted) or owned resources change
// (StatefulSet, Service). Controller compares desired state (spec) with
// actual state (cluster resources) and takes actions to converge.
// This is Kubernetes' declarative paradigm—users declare "I want a database
// with 3 replicas" and controller figures out HOW (create StatefulSet,
// configure replication, set up backups). Without operators, users manually
// run kubectl commands in correct order, handling errors, retries, edge cases.

//+kubebuilder:rbac:groups=database.example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=database.example.com,resources=databases/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete

func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // Fetch the Database instance
    database := &Database{}
    err := r.Get(ctx, req.NamespacedName, database)
    if err != nil {
        if apierrors.IsNotFound(err) {
            // REASON: Resource deleted. Clean up external resources (S3 backups,
            // external DNS records) before removing finalizer. Return success—
            // no need to requeue.
            return ctrl.Result{}, nil
        }
        // REASON: Transient error (API server unreachable, network timeout).
        // Return error to trigger exponential backoff retry. Controller-runtime
        // automatically requeues with backoff (1s, 2s, 4s, ..., max 5 minutes).
        return ctrl.Result{}, err
    }

    logger.Info("Reconciling Database", "name", database.Name, "phase", database.Status.Phase)

    // REASON: Handle deletion with finalizer. Finalizers prevent deletion until
    // controller cleans up external resources (S3 backups, external databases,
    // DNS records). Without finalizer, K8s deletes CRD immediately, leaking
    // external resources.
    finalizerName := "database.example.com/finalizer"
    if database.ObjectMeta.DeletionTimestamp.IsZero() {
        // Resource not being deleted, add finalizer if missing
        if !controllerutil.ContainsFinalizer(database, finalizerName) {
            controllerutil.AddFinalizer(database, finalizerName)
            if err := r.Update(ctx, database); err != nil {
                return ctrl.Result{}, err
            }
        }
    } else {
        // REASON: Resource being deleted. Clean up external resources before
        // removing finalizer. This is CRITICAL for avoiding resource leaks.
        // Example: delete S3 backups, remove external DNS records, revoke IAM roles.
        if controllerutil.ContainsFinalizer(database, finalizerName) {
            logger.Info("Cleaning up external resources")

            if err := r.cleanupExternalResources(ctx, database); err != nil {
                // REASON: Cleanup failed. Return error to retry. Don't remove
                // finalizer until cleanup succeeds, preventing resource leaks.
                return ctrl.Result{}, err
            }

            // Remove finalizer to allow deletion
            controllerutil.RemoveFinalizer(database, finalizerName)
            if err := r.Update(ctx, database); err != nil {
                return ctrl.Result{}, err
            }
        }
        return ctrl.Result{}, nil
    }

    // REASON: Create or update StatefulSet for database. StatefulSet provides
    // stable network identity and persistent storage for stateful workloads.
    // Controller creates StatefulSet if missing, updates if spec changed.
    statefulSet, err := r.reconcileStatefulSet(ctx, database)
    if err != nil {
        // REASON: Update status to Failed with error message. Applications
        // watching status know database unavailable. Ops teams get alerts.
        r.updateStatusPhase(ctx, database, "Failed")
        return ctrl.Result{}, err
    }

    // REASON: Create Service for stable network endpoint. StatefulSet Pods have
    // predictable DNS names (db-0.db-service.default.svc.cluster.local). Service
    // load balances read queries across replicas.
    service, err := r.reconcileService(ctx, database)
    if err != nil {
        r.updateStatusPhase(ctx, database, "Failed")
        return ctrl.Result{}, err
    }

    // REASON: Check if StatefulSet Pods are ready. Don't mark database Ready
    // until all replicas are running and passing health checks. Prevents apps
    // from connecting to partially-initialized database.
    if statefulSet.Status.ReadyReplicas < database.Spec.Replicas {
        logger.Info("Waiting for StatefulSet replicas to be ready",
            "ready", statefulSet.Status.ReadyReplicas,
            "desired", database.Spec.Replicas)

        // REASON: Update status to Provisioning. Applications know to wait.
        // Requeue after 30 seconds to check readiness again.
        r.updateStatusPhase(ctx, database, "Provisioning")
        return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
    }

    // REASON: Set up backup CronJob if backup schedule specified. Operator
    // creates CronJob that dumps database, uploads to S3, manages retention.
    // Without operator, teams forget to set up backups or misconfigure them.
    if database.Spec.BackupSchedule != "" {
        if err := r.reconcileBackup(ctx, database); err != nil {
            logger.Error(err, "Failed to reconcile backup CronJob")
            // REASON: Backup setup failed but database is operational. Don't fail
            // entire reconciliation—update status condition and continue.
            r.updateStatusCondition(ctx, database, "BackupConfigured", metav1.ConditionFalse, err.Error())
        } else {
            r.updateStatusCondition(ctx, database, "BackupConfigured", metav1.ConditionTrue, "Backup CronJob created")
        }
    }

    // REASON: Update connection string in status. Applications read this to
    // connect. Format: postgres://user:password@service:5432/dbname
    connectionString := fmt.Sprintf("%s://%s:%d/%s",
        database.Spec.Engine,
        service.Name,
        5432, // TODO: engine-specific port
        database.Name)

    database.Status.ConnectionString = connectionString
    database.Status.Phase = "Ready"

    // REASON: Update status subresource. Status updates don't trigger new
    // reconciliations (prevents infinite loops). Applications watch status
    // to know when database is ready for connections.
    if err := r.Status().Update(ctx, database); err != nil {
        logger.Error(err, "Failed to update Database status")
        return ctrl.Result{}, err
    }

    logger.Info("Database reconciliation complete", "phase", "Ready")

    // REASON: Return success with no requeue. Controller only reconciles again
    // on changes to Database CRD or owned resources (StatefulSet, Service).
    // For periodic tasks (backup verification), schedule explicit requeue.
    return ctrl.Result{}, nil
}

// reconcileStatefulSet creates or updates the StatefulSet for the database
func (r *DatabaseReconciler) reconcileStatefulSet(ctx context.Context, db *Database) (*appsv1.StatefulSet, error) {
    // REASON: StatefulSet provides stable network identity (db-0, db-1, db-2)
    // and persistent storage (PVC per Pod). Critical for stateful workloads
    // like databases where identity and storage must persist across restarts.
    statefulSet := &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
        },
        Spec: appsv1.StatefulSetSpec{
            Replicas: &db.Spec.Replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: map[string]string{"app": db.Name},
            },
            ServiceName: db.Name,
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: map[string]string{"app": db.Name},
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{
                        {
                            Name:  "database",
                            Image: fmt.Sprintf("%s:%s", db.Spec.Engine, db.Spec.Version),
                            Ports: []corev1.ContainerPort{
                                {ContainerPort: 5432}, // TODO: engine-specific
                            },
                            Resources: db.Spec.Resources,
                            // TODO: Add liveness/readiness probes, env vars, etc.
                        },
                    },
                },
            },
            VolumeClaimTemplates: []corev1.PersistentVolumeClaim{
                {
                    ObjectMeta: metav1.ObjectMeta{Name: "data"},
                    Spec: corev1.PersistentVolumeClaimSpec{
                        AccessModes: []corev1.PersistentVolumeAccessMode{
                            corev1.ReadWriteOnce,
                        },
                        Resources: corev1.ResourceRequirements{
                            Requests: corev1.ResourceList{
                                corev1.ResourceStorage: resource.MustParse(db.Spec.StorageSize),
                            },
                        },
                    },
                },
            },
        },
    }

    // REASON: Set owner reference so StatefulSet is deleted when Database CRD
    // is deleted. Establishes parent-child relationship for garbage collection.
    if err := controllerutil.SetControllerReference(db, statefulSet, r.Scheme); err != nil {
        return nil, err
    }

    // REASON: Create or update StatefulSet. If already exists, update to match
    // desired spec. This enables declarative updates (change Database.spec.replicas,
    // controller updates StatefulSet.spec.replicas).
    found := &appsv1.StatefulSet{}
    err := r.Get(ctx, client.ObjectKey{Name: db.Name, Namespace: db.Namespace}, found)
    if err != nil && apierrors.IsNotFound(err) {
        return statefulSet, r.Create(ctx, statefulSet)
    } else if err != nil {
        return nil, err
    }

    // Update existing StatefulSet if spec changed
    found.Spec = statefulSet.Spec
    return found, r.Update(ctx, found)
}

// reconcileService creates or updates the Service for database access
func (r *DatabaseReconciler) reconcileService(ctx context.Context, db *Database) (*corev1.Service, error) {
    service := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
        },
        Spec: corev1.ServiceSpec{
            Selector: map[string]string{"app": db.Name},
            Ports: []corev1.ServicePort{
                {
                    Port:       5432, // TODO: engine-specific
                    TargetPort: intstr.FromInt(5432),
                },
            },
            ClusterIP: "None", // Headless service for StatefulSet
        },
    }

    if err := controllerutil.SetControllerReference(db, service, r.Scheme); err != nil {
        return nil, err
    }

    found := &corev1.Service{}
    err := r.Get(ctx, client.ObjectKey{Name: db.Name, Namespace: db.Namespace}, found)
    if err != nil && apierrors.IsNotFound(err) {
        return service, r.Create(ctx, service)
    }
    return found, err
}

// Helper functions (simplified for brevity)
func (r *DatabaseReconciler) reconcileBackup(ctx context.Context, db *Database) error {
    // Create CronJob for automated backups
    // TODO: Implementation
    return nil
}

func (r *DatabaseReconciler) cleanupExternalResources(ctx context.Context, db *Database) error {
    // Clean up S3 backups, external DNS records, etc.
    // TODO: Implementation
    return nil
}

func (r *DatabaseReconciler) updateStatusPhase(ctx context.Context, db *Database, phase string) {
    db.Status.Phase = phase
    r.Status().Update(ctx, db)
}

func (r *DatabaseReconciler) updateStatusCondition(ctx context.Context, db *Database, conditionType string, status metav1.ConditionStatus, message string) {
    condition := metav1.Condition{
        Type:               conditionType,
        Status:             status,
        Reason:             "Reconciliation",
        Message:            message,
        LastTransitionTime: metav1.Now(),
    }

    // Find and update existing condition or append new one
    found := false
    for i, existing := range db.Status.Conditions {
        if existing.Type == conditionType {
            db.Status.Conditions[i] = condition
            found = true
            break
        }
    }
    if !found {
        db.Status.Conditions = append(db.Status.Conditions, condition)
    }

    r.Status().Update(ctx, db)
}

// SetupWithManager sets up the controller with the Manager
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&Database{}).              // Watch Database CRD
        Owns(&appsv1.StatefulSet{}).   // Watch owned StatefulSets
        Owns(&corev1.Service{}).       // Watch owned Services
        Complete(r)
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Kubernetes Operator with CRD, reconciliation loop, and lifecycle management",
        prerequisites: [
          "Go programming language",
          "controller-runtime library",
          "Kubernetes API concepts (CRD, controllers, reconciliation)",
          "kubebuilder scaffolding tool",
        ],
        systemPosition:
          "Platform engineering layer for automating operational tasks, encoding domain expertise into Kubernetes, reducing manual toil",
      },
      annotations: [
        {
          id: "k8s-op-crd",
          lines: [19, 69],
          action: "Define Custom Resource Definition for database abstraction",
          reason:
            "CRD extends Kubernetes API with domain-specific resources. Encapsulates complex operational knowledge (database provisioning, replication, backups) into simple declarative API. Users declare 'I want a postgres database with 3 replicas' without knowing HOW. Operator handles all complexity.",
          contextLevel: "system",
          relatedConcepts: ["declarative-api", "platform-engineering"],
        },
        {
          id: "k8s-op-reconcile",
          lines: [93, 103],
          action:
            "Implement reconciliation loop to converge actual to desired state",
          reason:
            "Core of Kubernetes declarative paradigm. Controller watches for changes to Database CRD, compares desired state (spec) with actual state (cluster resources), takes actions to converge. Called on every change (create, update, delete) and periodically for drift detection. Enables self-healing—if StatefulSet deleted manually, controller recreates it.",
          contextLevel: "system",
          relatedConcepts: [
            "reconciliation-loop",
            "declarative-configuration",
            "self-healing",
          ],
        },
        {
          id: "k8s-op-finalizer",
          lines: [126, 150],
          action:
            "Use finalizer to clean up external resources before deletion",
          reason:
            "Finalizers prevent CRD deletion until controller completes cleanup. Critical for avoiding resource leaks (S3 backups, external databases, DNS records) that exist outside Kubernetes. Without finalizer, K8s deletes CRD immediately, orphaning external resources that cost money and pose security risks.",
          contextLevel: "system",
          relatedConcepts: ["garbage-collection", "lifecycle-management"],
        },
        {
          id: "k8s-op-statefulset",
          lines: [152, 165],
          action:
            "Create StatefulSet for database with stable identity and persistent storage",
          reason:
            "StatefulSet provides guarantees critical for stateful workloads: stable network identity (db-0, db-1, db-2), persistent storage per Pod (survives restarts), ordered deployment/scaling. Databases require identity for replication (primary vs replicas) and storage persistence for durability.",
          contextLevel: "module",
          relatedConcepts: ["stateful-workloads", "persistent-storage"],
        },
        {
          id: "k8s-op-readiness-check",
          lines: [177, 187],
          action:
            "Wait for StatefulSet Pods to be ready before marking database Ready",
          reason:
            "Don't expose database to applications until fully initialized (schema created, replication configured, caches warmed). Prevents connection errors and data corruption. Status updates signal readiness to watching applications—they wait for Phase=Ready before connecting.",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "readiness-gates"],
        },
        {
          id: "k8s-op-backup",
          lines: [189, 200],
          action: "Configure automated backup CronJob based on schedule",
          reason:
            "Operators codify best practices. Backup automation prevents common disaster: database loss because someone forgot to set up backups or misconfigured retention. CronJob runs on schedule, dumps database, uploads to S3, manages retention. Operator ensures all databases get backups by default.",
          contextLevel: "system",
          relatedConcepts: ["disaster-recovery", "backup-automation"],
        },
        {
          id: "k8s-op-status-update",
          lines: [202, 218],
          action:
            "Update status with connection string and phase for application consumption",
          reason:
            "Status subresource is how applications discover database connection info. App watches Database CRD, waits for Phase=Ready, reads connectionString from status. Decouples app deployment from database provisioning—app can deploy before database ready, automatically connects when available.",
          contextLevel: "system",
          relatedConcepts: ["service-discovery", "status-subresource"],
        },
        {
          id: "k8s-op-owner-reference",
          lines: [253, 256],
          action: "Set owner reference for garbage collection",
          reason:
            "Owner references establish parent-child relationships. When Database CRD deleted, Kubernetes garbage collector automatically deletes owned resources (StatefulSet, Service, PVCs). Prevents orphaned resources. Controller doesn't need explicit cleanup logic for K8s resources, only external resources (S3, DNS).",
          contextLevel: "module",
          relatedConcepts: ["garbage-collection", "resource-lifecycle"],
        },
      ],
      highlights: [
        {
          lines: [24, 69],
          label: "Custom Resource Definition (CRD) schema",
          sbvpDomain: "structure",
        },
        {
          lines: [93, 103],
          label: "Reconciliation loop entry point",
          sbvpDomain: "behavior",
        },
        {
          lines: [126, 150],
          label: "Finalizer for external resource cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [227, 282],
          label: "StatefulSet reconciliation for stateful workload",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservices platform: orchestrate 100+ services with automated scaling and rolling updates",
      "Machine learning model serving: deploy and scale ML models with GPU scheduling and batch inference",
      "Batch processing: run data pipelines with CronJobs, parallel processing, and resource isolation",
      "CI/CD pipelines: ephemeral build environments with isolated resources and automatic cleanup",
      "Multi-tenant SaaS: isolate customer workloads with namespaces, resource quotas, and network policies",
      "Edge computing: manage distributed clusters across edge locations with centralized control plane",
      "Hybrid cloud: run workloads across on-premise and cloud with consistent API and portability",
    ],
    interactsWith: [
      "circuit-breaker",
      "rate-limiting",
      "retry",
      "timeout",
      "health-check",
    ],
    architecturalBoundaries: [
      "Control plane: API server, scheduler, controller manager, etcd (cluster management)",
      "Data plane: worker nodes running Pods (application workloads)",
      "Network layer: Services, Ingress, NetworkPolicies (traffic routing and security)",
      "Storage layer: PersistentVolumes, StorageClasses (stateful workload persistence)",
      "Security layer: RBAC, ServiceAccounts, Secrets, NetworkPolicies (access control and isolation)",
    ],
  },

  implementations: [
    {
      id: "gke",
      name: "Google Kubernetes Engine (GKE)",
      type: "service",
      languages: ["any"],
      description:
        "Google's managed Kubernetes service with autopilot mode for hands-off operation. Integrates with Google Cloud services (Cloud SQL, BigQuery, Cloud Storage). Features: auto-scaling, auto-repair, auto-upgrade, Workload Identity for IAM integration, GKE Hub for multi-cluster management.",
      links: {
        docs: "https://cloud.google.com/kubernetes-engine/docs",
      },
    },
    {
      id: "eks",
      name: "Amazon Elastic Kubernetes Service (EKS)",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed Kubernetes service with deep AWS integration (IAM, VPC, ELB, EBS). Features: Fargate serverless compute, EKS Anywhere for hybrid deployments, EKS Distro for self-managed clusters, IAM Roles for Service Accounts (IRSA) for fine-grained permissions.",
      links: {
        docs: "https://docs.aws.amazon.com/eks/",
      },
    },
    {
      id: "aks",
      name: "Azure Kubernetes Service (AKS)",
      type: "service",
      languages: ["any"],
      description:
        "Microsoft's managed Kubernetes service integrated with Azure ecosystem (Azure AD, Azure Monitor, Azure DevOps). Features: virtual nodes (ACI integration), Azure Policy for governance, Azure Arc for hybrid/multi-cloud, automated node pool scaling.",
      links: {
        docs: "https://docs.microsoft.com/en-us/azure/aks/",
      },
    },
    {
      id: "openshift",
      name: "Red Hat OpenShift",
      type: "platform",
      languages: ["any"],
      description:
        "Enterprise Kubernetes platform with developer and operations tooling. Adds opinionated workflows, built-in CI/CD (Tekton), service mesh (Istio), monitoring (Prometheus), and enhanced security (SELinux, RBAC). Supports hybrid cloud (OpenShift Dedicated, self-managed).",
      links: {
        docs: "https://docs.openshift.com/",
      },
    },
    {
      id: "rancher",
      name: "Rancher",
      type: "platform",
      languages: ["any"],
      description:
        "Multi-cluster Kubernetes management platform. Centralized UI for managing clusters across clouds (GKE, EKS, AKS) and on-premise. Features: RBAC, project isolation, cluster templates, integrated monitoring, app catalog, GitOps workflows.",
      links: {
        docs: "https://rancher.com/docs/",
      },
    },
    {
      id: "k3s",
      name: "K3s",
      type: "platform",
      languages: ["any"],
      description:
        "Lightweight Kubernetes distribution for resource-constrained environments (IoT, edge, ARM). Single binary <100MB, uses SQLite instead of etcd. Perfect for edge computing, development, CI/CD. Fully CNCF certified—same API as full Kubernetes.",
      links: {
        docs: "https://docs.k3s.io/",
      },
    },
    {
      id: "microk8s",
      name: "MicroK8s",
      type: "platform",
      languages: ["any"],
      description:
        "Canonical's lightweight Kubernetes for workstations, IoT, and edge. Single-command installation, add-ons for common services (DNS, dashboard, Istio), automatic updates. Ideal for local development and testing.",
      links: {
        docs: "https://microk8s.io/docs",
      },
    },
    {
      id: "minikube",
      name: "Minikube",
      type: "platform",
      languages: ["any"],
      description:
        "Local Kubernetes cluster for development and testing. Runs in VM, container, or bare-metal. Supports multiple drivers (Docker, VirtualBox, Hyper-V), add-ons for experimentation, and tunneling for LoadBalancer services. Not for production.",
      links: {
        docs: "https://minikube.sigs.k8s.io/docs/",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "spotify",
      systemName: "Spotify Microservices Platform",
      howUsed:
        "Spotify runs 150+ engineering teams with 1500+ microservices on Kubernetes. Each team owns their services with full autonomy (deploy, scale, monitor). Kubernetes provides the foundation: automated deployments via Helm charts, horizontal scaling via HPA based on request rates, self-healing restarts failed containers, and rolling updates ensure zero-downtime deployments. Internal platform team built tooling on top of K8s: custom CRDs for databases and message queues, GitOps with ArgoCD for continuous deployment, and cost allocation per team based on resource usage. Pattern composition: Kubernetes + Service Mesh (Linkerd for observability) + HPA (autoscaling based on custom metrics like Kafka lag) + Ingress (route traffic to 1500+ services) + RBAC (isolate team namespaces). Rationale: With 150+ teams deploying independently multiple times per day, manual infrastructure coordination is impossible. Kubernetes provides self-service infrastructure—teams deploy without coordination, platform team scales infrastructure horizontally. Impact: Reduced deployment time from hours to minutes; enabled teams to scale from 100 to 1500+ services without proportional infrastructure team growth; 99.9% service availability despite thousands of daily deployments.",
      source:
        "https://engineering.atspotify.com/2018/10/infrastructure-as-code-at-spotify/",
    },
    {
      systemId: "airbnb",
      systemName: "Airbnb Infrastructure Automation",
      howUsed:
        "Airbnb migrated 1000+ microservices from EC2 to Kubernetes to improve resource utilization and deployment velocity. Kubernetes orchestrates everything: web services, background jobs, machine learning pipelines, data processing. Custom tooling automates complex workflows: Spinnaker for multi-region deployments, custom operators for managing stateful services (Kafka, Cassandra), and cost optimization via bin-packing and spot instances. Pattern composition: Kubernetes + Custom Operators (automate operational tasks like backup, scaling, upgrades) + HPA (scale based on request latency and CPU) + VPA (vertical autoscaling for batch jobs) + PodDisruptionBudgets (ensure availability during node upgrades). Rationale: EC2 required manual capacity planning, suffered from resource fragmentation (average 40% utilization), and had slow deployment cycles (hours). Kubernetes automated scheduling, improved utilization to 70%+, and reduced deployment time to minutes. Impact: Reduced infrastructure costs by 30% through better resource utilization; enabled 200+ deploys per day (up from 10); improved mean time to recovery from 30 minutes to 5 minutes via automated self-healing.",
      source: "https://www.youtube.com/watch?v=ytu3aUCwlSg",
    },
    {
      systemId: "pinterest",
      systemName: "Pinterest ML Model Serving Platform",
      howUsed:
        "Pinterest serves 2+ billion predictions per day for recommendations, content ranking, and ads using Kubernetes. ML models deployed as containerized services with GPU scheduling for inference. Kubernetes manages the complexity: schedules GPU workloads efficiently, scales replicas based on prediction latency, and performs canary deployments for new model versions. Custom HPA scales based on prediction queue depth and P99 latency. StatefulSets manage TensorFlow Serving instances with persistent model storage. Pattern composition: Kubernetes + GPU Scheduling (allocate expensive GPU resources efficiently) + HPA (scale based on queue depth and latency) + Canary Deployments (gradual rollout of new models with A/B testing) + PriorityClasses (critical models get resources first). Rationale: Manual GPU allocation was inefficient (30% utilization), deployments were slow and error-prone (days of testing), and scaling couldn't keep up with traffic spikes. Kubernetes automated GPU scheduling (70%+ utilization), enabled rapid deployments (hours not days), and scaled automatically during events (Super Bowl, holidays). Impact: Reduced infrastructure costs by 40% through efficient GPU utilization; improved P99 prediction latency by 50% via autoscaling; enabled 50+ model deployments per day (up from 5).",
      source:
        "https://medium.com/@Pinterest_Engineering/building-a-kubernetes-platform-at-pinterest-fb3d9571c948",
    },
    {
      systemId: "nyt",
      systemName: "The New York Times Publishing Platform",
      howUsed:
        "The New York Times runs their digital publishing platform on Kubernetes, serving 100+ million readers monthly. Kubernetes orchestrates web frontends, API services, image processing pipelines, and content delivery. Key features: HPA scales web services during breaking news (10x traffic spikes), CronJobs run scheduled publishing workflows, and Ingress routes traffic to different editions (international, mobile, AMP). Custom operators automate operational tasks: article caching, image optimization, CDN purging. Pattern composition: Kubernetes + HPA (traffic-based scaling) + CronJobs (scheduled publishing) + Ingress (multi-tenant routing) + Custom Operators (automate workflows) + StatefulSets (cache layers). Rationale: Legacy infrastructure couldn't handle traffic spikes (crashed during major news), deployments took hours (missed publishing deadlines), and scaling required manual intervention. Kubernetes automated scaling (handles 10x spikes), reduced deployment time to minutes, and enabled self-service for editorial teams. Impact: Zero downtime during breaking news events (previously had 2-3 outages per year); reduced deployment time from 4 hours to 15 minutes; enabled editorial teams to publish without infrastructure team involvement.",
      source:
        "https://open.nytimes.com/how-the-new-york-times-uses-kubernetes-to-power-its-content-management-system-f3e3c3e4b8d2",
    },
    {
      systemId: "shopify",
      systemName: "Shopify Multi-Tenant Commerce Platform",
      howUsed:
        "Shopify runs 1 million+ online stores on Kubernetes, processing 10,000+ requests per second during peak (Black Friday, Cyber Monday). Kubernetes provides the foundation for multi-tenancy: namespaces isolate merchant workloads, resource quotas prevent noisy neighbors, and network policies enforce security. HPA scales based on request rate and checkout latency. Custom operators manage merchant-specific resources (databases, caches, queues). Ingress routes traffic to millions of unique storefronts. Pattern composition: Kubernetes + Multi-Tenancy (namespace isolation, resource quotas, network policies) + HPA (request-rate scaling) + Custom Operators (per-merchant resources) + Ingress (route to millions of stores) + PodDisruptionBudgets (ensure availability during maintenance). Rationale: Previous architecture couldn't scale to millions of stores (shared infrastructure had contention), deployments caused downtime (all-or-nothing releases), and cost per store was too high. Kubernetes enabled density (10x more stores per server), zero-downtime deployments (rolling updates), and cost efficiency (pay only for used resources). Impact: Scaled from 100k to 1M+ stores without proportional infrastructure growth; handled Black Friday 2023 with 10x normal traffic (80k+ requests/second) with zero downtime; reduced cost per store by 60% through better resource utilization.",
      source: "https://shopify.engineering/kubernetes-at-shopify",
    },
  ],

  philosophy: {
    coreProblem:
      "Managing containerized applications at scale requires automating deployment, scaling, networking, and self-healing—tasks that are overwhelming with manual coordination",
    designPrinciple:
      "Declarative configuration and continuous reconciliation: users declare desired state, controllers continuously ensure actual state matches",
    historicalContext:
      "Developed by Google based on 15+ years of experience running Borg and Omega container orchestration systems at planetary scale. Open-sourced in 2014, donated to CNCF in 2015. Named after Greek word for 'helmsman' or 'pilot'.",
    alternativesRejected: [
      "Manual container management: doesn't scale, error-prone, inconsistent",
      "Configuration management tools (Ansible, Chef): imperative, stateful, no self-healing",
      "Simple container orchestrators (Docker Swarm): limited features, less ecosystem",
      "VM-based orchestration: too heavy, slow startup, poor resource utilization",
    ],
    mentalModel:
      "Like a datacenter operating system: you declare what you want to run (Pods), Kubernetes figures out where and how to run it (scheduling), monitors health and restarts failures (self-healing), and adjusts to changing conditions (autoscaling)",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Control Plane"
        API[API Server]
        SCHED[Scheduler]
        CTRL[Controller Manager]
        ETCD[(etcd)]
    end

    subgraph "Worker Nodes"
        subgraph "Node 1"
            KUBELET1[Kubelet]
            POD1[Pod]
            POD2[Pod]
        end

        subgraph "Node 2"
            KUBELET2[Kubelet]
            POD3[Pod]
            POD4[Pod]
        end
    end

    USER[User] -->|kubectl apply| API
    API --> ETCD
    CTRL -->|Watch| API
    SCHED -->|Watch| API
    SCHED -->|Assign| KUBELET1
    SCHED -->|Assign| KUBELET2
    KUBELET1 -->|Manage| POD1
    KUBELET1 -->|Manage| POD2
    KUBELET2 -->|Manage| POD3
    KUBELET2 -->|Manage| POD4

    style API fill:#4285f4
    style ETCD fill:#34a853
    style KUBELET1 fill:#fbbc04
    style KUBELET2 fill:#fbbc04
    style POD1 fill:#ea4335
    style POD2 fill:#ea4335
    style POD3 fill:#ea4335
    style POD4 fill:#ea4335`,
    realWorldAnalogy:
      "Kubernetes is like an airport control tower for containers. You (developer) file a flight plan (Deployment manifest) specifying what should fly (container image), how many flights (replicas), and when (scheduling constraints). The control tower (Control Plane) assigns gates (nodes), monitors weather (health checks), reroutes around problems (self-healing), and adjusts capacity based on passenger volume (autoscaling). Individual gates (nodes) handle the actual passengers (Pods), but the control tower coordinates everything.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Black Friday traffic spike causes 10x normal load. HPA automatically scales web services from 5 to 50 replicas in 2 minutes, handling surge without downtime. After spike ends, gradually scales back down over 10 minutes.",
        patternRole:
          "Automated horizontal scaling enables handling unpredictable traffic spikes without manual intervention or over-provisioning",
        companies: ["Shopify", "Amazon", "Walmart"],
      },
      {
        domain: "Media & Publishing",
        scenario:
          "Breaking news event drives 5x traffic spike. Kubernetes scales frontend services, rolling update deploys new article without downtime, and Ingress routes traffic to new content instantly.",
        patternRole:
          "Zero-downtime deployments and instant scaling enable rapid response to breaking news without infrastructure concerns",
        companies: ["The New York Times", "BBC", "CNN"],
      },
      {
        domain: "Machine Learning",
        scenario:
          "ML inference service needs GPU for model serving. Kubernetes schedules Pods with GPU requirements onto GPU nodes, scales based on prediction latency, and performs canary deployments for new model versions.",
        patternRole:
          "GPU scheduling and HPA enable efficient resource utilization and automated scaling for expensive ML infrastructure",
        companies: ["Pinterest", "Uber", "Netflix"],
      },
    ],
  },

  tags: [
    "scalability",
    "horizontal-scaling",
    "orchestration",
    "containers",
    "cloud-native",
    "microservices",
    "self-healing",
    "declarative-configuration",
  ],
  difficulty: "advanced",
};
