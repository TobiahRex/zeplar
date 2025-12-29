import type { Pattern } from "../schema";

export const nomad: Pattern = {
  id: "nomad",
  slug: "nomad",
  corpusPath: "📈 SCALABILITY → ↔️ Horizontal → 🎼 Orchestration → 🎼 Nomad",

  hierarchy: {
    quality: "scalability",
    strategy: "Horizontal",
    family: "Orchestration",
    level: 4,
  },

  concept: {
    name: "Nomad",
    emoji: "🎼",
    tagline: "HashiCorp's flexible workload orchestrator",
    definition:
      "HashiCorp Nomad is a flexible workload orchestrator designed to deploy and manage containers, virtual machines, and standalone binaries across on-premises and cloud infrastructure. Unlike Kubernetes which focuses exclusively on containerized workloads, Nomad embraces heterogeneity through pluggable task drivers supporting Docker, QEMU, Java, exec, and custom drivers. Built as a single binary with a simple client-server architecture, Nomad achieves operational simplicity while providing powerful scheduling capabilities including bin-packing optimization, constraint-based placement, and multi-region federation. The system integrates seamlessly with the HashiCorp ecosystem—Consul for service mesh and discovery, Vault for secrets management, Terraform for infrastructure provisioning—creating a cohesive platform for managing diverse workload types. Nomad's scheduler evaluates job specifications against cluster resources and constraints, creating allocations that map task groups to specific client nodes. This lightweight approach enables Nomad to manage thousands of nodes with minimal resource overhead (typically 50MB memory footprint compared to Kubernetes' 500MB+ for control plane components), making it ideal for edge computing, batch processing, and organizations seeking Kubernetes' orchestration benefits without operational complexity.",
    problemSolved:
      "Organizations face significant challenges orchestrating heterogeneous workloads in modern infrastructure. Kubernetes excels at containerized microservices but struggles with virtual machines, legacy Java applications, batch jobs, and binaries that don't fit the container model. Many enterprises operate hybrid environments mixing containers, VMs, and traditional applications, forcing teams to maintain multiple orchestration platforms—Kubernetes for containers, separate tools for VMs, custom scripts for batch jobs—creating operational silos and complexity. The operational overhead of running Kubernetes is substantial: managing etcd clusters, understanding 10+ control plane components, navigating complex networking (CNI plugins, service meshes), and tuning resource-intensive control planes. For smaller teams or edge deployments, this complexity outweighs the benefits. Nomad solves these problems by providing a unified orchestration layer for any workload type through pluggable drivers. Its single-binary architecture eliminates complex component dependencies, while built-in features like multi-region federation and rolling deployments work out-of-the-box without additional controllers. The lightweight design enables running orchestration on resource-constrained edge devices impossible with Kubernetes, while HashiCorp ecosystem integration provides enterprise features without third-party tools.",
    tradeoffs: {
      pros: [
        "Multi-workload support: orchestrate containers, VMs, binaries, and batch jobs with single platform",
        "Operational simplicity: single binary deployment, minimal dependencies, straightforward mental model",
        "Resource efficiency: 50MB footprint vs Kubernetes 500MB+, suitable for edge and constrained environments",
        "HashiCorp ecosystem: native integration with Consul, Vault, Terraform for cohesive infrastructure management",
        "Flexible scheduling: constraint-based placement, affinities, spread strategies, and custom schedulers",
      ],
      cons: [
        "Smaller ecosystem: fewer third-party integrations, tools, and community resources compared to Kubernetes",
        "Limited built-in features: no native ingress controllers, persistent volumes require external solutions",
        "Less enterprise adoption: smaller user base means fewer battle-tested patterns and less community support",
        "Networking complexity: service mesh requires Consul, advanced networking needs external CNI plugins",
        "Kubernetes momentum: industry standardization on K8s means more cloud-native tools target Kubernetes first",
      ],
    },
    relatedPatterns: [
      "kubernetes",
      "docker-swarm",
      "ecs-fargate",
      "consul",
      "vault",
      "terraform",
      "autoscaling",
    ],
  },

  structure: {
    participants: [
      {
        name: "Nomad Server",
        role: "Control Plane",
        responsibilities: [
          "Maintain cluster state and job specifications using Raft consensus",
          "Evaluate jobs and create execution plans based on constraints and resources",
          "Schedule allocations to client nodes using bin-packing algorithms",
          "Monitor cluster health and trigger rescheduling for failed tasks",
          "Serve API requests and maintain distributed state across server quorum",
        ],
      },
      {
        name: "Nomad Client",
        role: "Compute Agent",
        responsibilities: [
          "Execute tasks using pluggable drivers (Docker, QEMU, Java, exec, etc.)",
          "Report node resources (CPU, memory, disk, network) to servers",
          "Run health checks and report task status to servers",
          "Manage task lifecycle including restart policies and cleanup",
          "Enforce resource isolation using cgroups and namespaces",
        ],
      },
      {
        name: "Job",
        role: "Workload Specification",
        responsibilities: [
          "Define desired state including task groups, tasks, and resource requirements",
          "Specify constraints for placement (datacenter, node class, attributes)",
          "Configure update strategies (rolling, canary, blue-green)",
          "Declare service registrations for discovery via Consul",
          "Set restart and reschedule policies for fault tolerance",
        ],
      },
      {
        name: "Allocation",
        role: "Scheduled Unit",
        responsibilities: [
          "Represent a placement of task group on specific client node",
          "Track resource claims (CPU, memory, network ports)",
          "Maintain status of all tasks within the allocation",
          "Execute deployment strategies during updates",
          "Handle failure scenarios and trigger rescheduling",
        ],
      },
      {
        name: "Task Group",
        role: "Co-located Tasks",
        responsibilities: [
          "Group related tasks that must run together on same node",
          "Share networking namespace for inter-task communication",
          "Define scaling count and update strategies",
          "Specify ephemeral disk for shared storage",
          "Configure service discovery and health checks",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant Server as Nomad Server
    participant Scheduler
    participant Client as Nomad Client
    participant Driver as Task Driver
    participant Consul

    User->>Server: Submit Job Specification
    Server->>Server: Validate & Store Job
    Server->>Scheduler: Trigger Evaluation
    Scheduler->>Scheduler: Filter nodes by constraints
    Scheduler->>Scheduler: Rank nodes (bin-packing)
    Scheduler->>Server: Create Allocations
    Server->>Client: Schedule Allocation
    Client->>Driver: Start Task (Docker/QEMU/exec)
    Driver->>Driver: Pull image & start container
    Driver-->>Client: Task Running
    Client->>Consul: Register Service
    Client->>Server: Update Allocation Status
    loop Health Monitoring
        Client->>Driver: Execute Health Check
        Driver-->>Client: Health Status
        Client->>Server: Report Health
    end
    Note over User,Consul: Auto-scaling or updates trigger re-evaluation`,
    flow: [
      {
        step: 1,
        actor: "User",
        action: "Submit Job",
        description:
          "User submits job specification (HCL or JSON) via CLI, API, or UI defining desired workload state",
      },
      {
        step: 2,
        actor: "Nomad Server",
        action: "Create Evaluation",
        description:
          "Server validates job, stores it in Raft state, and creates evaluation object for scheduler",
      },
      {
        step: 3,
        actor: "Scheduler",
        action: "Node Filtering",
        description:
          "Scheduler filters eligible nodes based on constraints (datacenter, attributes, node class)",
      },
      {
        step: 4,
        actor: "Scheduler",
        action: "Node Ranking",
        description:
          "Ranks nodes using bin-packing algorithm to optimize resource utilization and spread",
      },
      {
        step: 5,
        actor: "Scheduler",
        action: "Create Allocation",
        description:
          "Creates allocation mapping task group to specific client node with resource claims",
      },
      {
        step: 6,
        actor: "Nomad Client",
        action: "Receive Allocation",
        description:
          "Client receives allocation assignment and prepares to execute tasks",
      },
      {
        step: 7,
        actor: "Task Driver",
        action: "Start Task",
        description:
          "Driver (Docker, QEMU, etc.) pulls artifacts, sets up environment, and starts task process",
      },
      {
        step: 8,
        actor: "Nomad Client",
        action: "Service Registration",
        description:
          "Client registers service with Consul including health check endpoints and metadata",
      },
      {
        step: 9,
        actor: "Nomad Client",
        action: "Health Monitoring",
        description:
          "Client executes periodic health checks and reports status to servers",
      },
      {
        step: 10,
        actor: "Scheduler",
        action: "Reconciliation",
        description:
          "Scheduler continuously reconciles desired state (job spec) with actual state (allocations)",
      },
      {
        step: 11,
        actor: "Nomad Server",
        action: "Handle Updates",
        description:
          "For job updates, server creates new evaluation and scheduler executes rolling update strategy",
      },
    ],
    invariants: [
      "Server cluster maintains odd-numbered quorum (3 or 5 servers) for Raft consensus",
      "Each allocation uniquely maps task group to single client node",
      "Job desired count equals running + pending allocations (eventual consistency)",
      "Task resource requirements never exceed client node available resources",
      "Allocation update strategies respect max_parallel and health check delays",
      "Service registrations in Consul match running healthy allocations",
      "Bin-packing scheduler maximizes resource utilization while respecting spread constraints",
    ],
  },

  codeExamples: [
    {
      id: "nomad-hcl-job",
      language: "hcl",
      title: "Multi-Driver Nomad Job Specification",
      description:
        "Comprehensive job definition demonstrating Docker, exec, and Java drivers with advanced placement, service discovery, and deployment strategies",
      code: `# Multi-tier application with heterogeneous workload types
# Demonstrates Nomad's ability to orchestrate containers, VMs, and binaries together

job "web-application" {
  # Regional deployment with multi-datacenter support
  datacenters = ["dc1", "dc2", "dc3"]
  type        = "service"  # Long-running service (vs batch, system)
  priority    = 75         # Higher priority for production workloads

  # Update strategy: canary deployment with health checks
  update {
    max_parallel      = 2        # Update 2 allocations at a time
    health_check      = "checks" # Wait for Consul health checks
    min_healthy_time  = "30s"    # Allocation must be healthy for 30s
    healthy_deadline  = "5m"     # Fail if not healthy within 5m
    progress_deadline = "10m"    # Total deployment deadline
    canary            = 1        # Deploy 1 canary first
    auto_revert       = true     # Rollback on failure
    auto_promote      = false    # Manual canary promotion
  }

  # Constraint: Only schedule on nodes with SSD storage
  constraint {
    attribute = "\${node.class}"
    operator  = "="
    value     = "production"
  }

  # Affinity: Prefer nodes in us-west region
  affinity {
    attribute = "\${meta.region}"
    operator  = "="
    value     = "us-west"
    weight    = 50  # Soft preference, not hard constraint
  }

  # Spread: Distribute across availability zones for HA
  spread {
    attribute = "\${meta.zone}"
    weight    = 100
  }

  # ========================================
  # Task Group 1: Frontend Web Servers (Docker)
  # ========================================
  group "frontend" {
    count = 3  # Run 3 instances

    # Network configuration with dynamic port allocation
    network {
      mode = "bridge"  # Use bridge networking for Consul Connect
      port "http" {
        to = 8080  # Container port
      }
    }

    # Service discovery and health checks via Consul
    service {
      name = "web-frontend"
      port = "http"
      tags = ["frontend", "web", "public"]

      # Consul Connect for service mesh mTLS
      connect {
        sidecar_service {}
      }

      # Health check configuration
      check {
        name     = "HTTP Health Check"
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }
    }

    # Ephemeral disk for shared cache
    ephemeral_disk {
      size    = 500  # MB
      sticky  = true # Preserve disk on client reconnect
    }

    # Frontend container task (Docker driver)
    task "nginx" {
      driver = "docker"

      config {
        image = "nginx:1.25-alpine"
        ports = ["http"]

        # Mount configuration from template
        mount {
          type   = "bind"
          source = "local/nginx.conf"
          target = "/etc/nginx/nginx.conf"
        }

        # Resource limits for container
        memory_hard_limit = 512  # OOM kill if exceeded
      }

      # Environment variables from Vault secrets
      template {
        data = <<EOF
{{ with secret "secret/data/web-app" }}
API_KEY={{ .Data.data.api_key }}
DB_PASSWORD={{ .Data.data.db_password }}
{{ end }}
EOF
        destination = "secrets/env.txt"
        env         = true
      }

      # Configuration template with Consul KV integration
      template {
        data = <<EOF
server {
    listen 8080;
    {{ range service "api-backend" }}
    upstream backend {
        server {{ .Address }}:{{ .Port }};
    }
    {{ end }}
}
EOF
        destination = "local/nginx.conf"
        change_mode = "restart"  # Restart on config change
      }

      # Resource requirements
      resources {
        cpu    = 500  # MHz
        memory = 256  # MB
      }

      # Restart policy for task failures
      restart {
        attempts = 3
        interval = "5m"
        delay    = "15s"
        mode     = "fail"  # Fail allocation after 3 restarts
      }
    }
  }

  # ========================================
  # Task Group 2: API Backend (Java driver for legacy app)
  # ========================================
  group "backend" {
    count = 5

    network {
      port "api" {
        static = 8080
      }
    }

    service {
      name = "api-backend"
      port = "api"
      tags = ["backend", "api", "internal"]

      check {
        name     = "API Health"
        type     = "http"
        path     = "/actuator/health"
        interval = "15s"
        timeout  = "3s"
      }
    }

    # Legacy Java application using Java driver
    task "spring-boot-api" {
      driver = "java"

      config {
        jar_path    = "local/app.jar"
        jvm_options = ["-Xmx1024m", "-Xms512m", "-XX:+UseG1GC"]
        args        = ["--server.port=8080"]
      }

      # Download artifact from external storage
      artifact {
        source      = "https://releases.example.com/api-v2.1.0.jar"
        destination = "local/app.jar"
        options {
          checksum = "sha256:abc123..."
        }
      }

      # Volume mount for persistent logs
      volume_mount {
        volume      = "logs"
        destination = "/var/log/app"
      }

      resources {
        cpu    = 1000
        memory = 1536
      }

      # Different restart policy for Java apps
      restart {
        attempts = 2
        interval = "10m"
        delay    = "30s"
        mode     = "delay"  # Exponential backoff
      }
    }
  }

  # ========================================
  # Task Group 3: Background Workers (exec driver)
  # ========================================
  group "workers" {
    count = 2

    # Constraint: Workers need GPU nodes
    constraint {
      attribute = "\${attr.gpu.enabled}"
      operator  = "="
      value     = "true"
    }

    task "data-processor" {
      driver = "exec"

      config {
        command = "/usr/local/bin/process-data"
        args    = ["--config", "local/config.yaml", "--mode", "production"]
      }

      # Artifact from git repository
      artifact {
        source      = "git::https://github.com/company/data-processor"
        destination = "local/bin"
      }

      # Template for configuration file
      template {
        data = <<EOF
database_url: {{ key "config/db/url" }}
queue_name: {{ key "config/queue/name" }}
batch_size: 1000
EOF
        destination = "local/config.yaml"
      }

      resources {
        cpu        = 2000
        memory     = 4096
        device "gpu" {
          count = 1
        }
      }
    }
  }

  # Volume declaration for persistent storage
  volume "logs" {
    type      = "host"
    read_only = false
    source    = "app-logs"
  }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete production job specification demonstrating multi-driver heterogeneous workload orchestration",
        prerequisites: [
          "HCL syntax",
          "Container concepts",
          "Service mesh basics",
          "Deployment strategies",
        ],
        systemPosition:
          "Job specification submitted to Nomad cluster, evaluated by scheduler, and deployed across client nodes with diverse hardware",
      },
      annotations: [
        {
          id: "nomad-job-update",
          lines: [9, 20],
          action:
            "Define canary deployment strategy with automatic rollback on failure",
          reason:
            "Production deployments require gradual rollout with health validation to prevent bad deployments from affecting all instances. Canary deployment tests 1 instance before promoting to all, while auto_revert protects against regressions.",
          contextLevel: "system",
          relatedConcepts: [
            "canary-deployment",
            "progressive-delivery",
            "blue-green",
          ],
        },
        {
          id: "nomad-job-heterogeneous",
          lines: [1, 5],
          action:
            "Single job orchestrating Docker containers, Java applications, and native binaries together",
          reason:
            "Unlike Kubernetes which only handles containers, Nomad's multi-driver architecture enables orchestrating heterogeneous workloads (containers for frontend, JVM for legacy backend, native binary for GPU workers) with unified scheduling and service discovery. This eliminates need for multiple orchestration platforms.",
          contextLevel: "system",
          relatedConcepts: ["polyglot-architecture", "legacy-modernization"],
        },
        {
          id: "nomad-job-placement",
          lines: [22, 42],
          action:
            "Use constraints, affinities, and spread for intelligent workload placement",
          reason:
            "Constraints enforce hard requirements (production nodes only), affinities express preferences (prefer us-west), and spread distributes across failure domains (zones) for high availability. This enables sophisticated placement without custom schedulers.",
          contextLevel: "module",
          relatedConcepts: ["bin-packing", "availability-zones", "scheduling"],
        },
        {
          id: "nomad-job-consul",
          lines: [59, 78],
          action:
            "Integrate with Consul for service discovery, health checks, and Connect service mesh",
          reason:
            "Nomad + Consul provides automatic service registration, DNS-based discovery, health monitoring, and zero-trust networking via mTLS. This eliminates manual service registration and enables secure inter-service communication without application code changes.",
          contextLevel: "system",
          relatedConcepts: ["service-mesh", "zero-trust", "mtls"],
        },
        {
          id: "nomad-job-vault",
          lines: [96, 103],
          action:
            "Fetch secrets from Vault and inject as environment variables via template",
          reason:
            "HashiCorp Vault integration enables dynamic secrets without hardcoding credentials in job specs. Templates automatically rotate secrets and restart tasks on changes, following least-privilege security model.",
          contextLevel: "system",
          relatedConcepts: [
            "secrets-management",
            "dynamic-credentials",
            "least-privilege",
          ],
        },
        {
          id: "nomad-job-java-driver",
          lines: [155, 165],
          action:
            "Use Java driver to run legacy JVM application without containerization",
          reason:
            "Many enterprises have legacy Java applications that are difficult to containerize. Nomad's Java driver provides orchestration benefits (scheduling, health checks, auto-restart) without requiring containerization, enabling gradual modernization. Kubernetes cannot do this.",
          contextLevel: "module",
          relatedConcepts: [
            "legacy-app-orchestration",
            "java-runtime",
            "brownfield",
          ],
        },
        {
          id: "nomad-job-exec-driver",
          lines: [192, 224],
          action:
            "Use exec driver with GPU constraint for native binary execution on specialized hardware",
          reason:
            "ML/data processing workloads often require GPU access and native binaries for performance. Exec driver enables orchestrating these workloads with resource isolation (cgroups), artifact management, and scheduling constraints for GPU nodes—capabilities Kubernetes requires complex device plugins to achieve.",
          contextLevel: "module",
          relatedConcepts: [
            "gpu-scheduling",
            "native-binaries",
            "ml-workloads",
          ],
        },
        {
          id: "nomad-job-resources",
          lines: [137, 140],
          action: "Specify CPU and memory resource requirements for scheduling",
          reason:
            "Resource requirements enable bin-packing scheduler to optimally place tasks on nodes with available capacity. Nomad tracks resource claims to prevent oversubscription and ensure QoS guarantees.",
          contextLevel: "local",
          relatedConcepts: ["resource-management", "qos", "bin-packing"],
        },
      ],
      highlights: [
        {
          lines: [1, 20],
          label: "Job metadata and deployment strategy",
          sbvpDomain: "structure",
        },
        {
          lines: [22, 42],
          label: "Advanced placement controls",
          sbvpDomain: "behavior",
        },
        {
          lines: [47, 78],
          label: "Docker task group with Consul integration",
          sbvpDomain: "structure",
        },
        {
          lines: [155, 165],
          label: "Java driver for legacy applications",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "nomad-cli-ops",
      language: "bash",
      title: "Nomad CLI Operations and Lifecycle Management",
      description:
        "Complete operational workflows using Nomad CLI demonstrating job lifecycle, scaling, node management, and monitoring",
      code: `#!/bin/bash
# Nomad CLI Operations Guide
# Demonstrates operational simplicity vs Kubernetes 10+ components

# ========================================
# CLUSTER SETUP & VERIFICATION
# ========================================

# Start Nomad server (single binary, no external dependencies)
# Compare to Kubernetes: kube-apiserver, kube-scheduler, kube-controller-manager,
# etcd, cloud-controller-manager - 5+ separate processes
nomad agent -config=server.hcl

# Server configuration (server.hcl):
# data_dir  = "/opt/nomad/data"
# bind_addr = "0.0.0.0"
# server {
#   enabled          = true
#   bootstrap_expect = 3  # Raft quorum
# }

# Start Nomad client on worker nodes
nomad agent -config=client.hcl

# Client configuration (client.hcl):
# data_dir  = "/opt/nomad/data"
# bind_addr = "0.0.0.0"
# client {
#   enabled = true
#   servers = ["nomad-server-1:4647", "nomad-server-2:4647"]
#
#   # Custom metadata for constraints/affinities
#   meta {
#     zone   = "us-west-2a"
#     gpu    = "nvidia-v100"
#     region = "us-west"
#   }
# }

# Verify cluster status
nomad server members
# Expected output:
# Name                  Address       Port  Status  Leader  Protocol  Version
# nomad-server-1.global 10.0.1.10     4648  alive   true    2         1.6.2
# nomad-server-2.global 10.0.1.11     4648  alive   false   2         1.6.2
# nomad-server-3.global 10.0.1.12     4648  alive   false   2         1.6.2

nomad node status
# Expected output:
# ID        DC   Name            Class        Drain  Eligibility  Status
# a72dfba6  dc1  nomad-client-1  production   false  eligible     ready
# b83egcb7  dc1  nomad-client-2  production   false  eligible     ready
# c94fhdc8  dc2  nomad-client-3  production   false  eligible     ready

# ========================================
# JOB LIFECYCLE MANAGEMENT
# ========================================

# Plan job deployment (dry-run to preview changes)
nomad job plan web-application.nomad
# Output shows:
# - Which allocations will be created/updated/destroyed
# - Resource changes
# - Deployment strategy details
# Reason: Prevents surprises in production deployments

# Run job (submit to cluster)
nomad job run web-application.nomad
# ==> Monitoring evaluation "e8b3d2c5"
#     Evaluation triggered by job "web-application"
#     Allocation "a1b2c3d4" created: node "a72dfba6", group "frontend"
#     Allocation "b2c3d4e5" created: node "b83egcb7", group "frontend"
#     Allocation "c3d4e5f6" created: node "c94fhdc8", group "frontend"
#     Evaluation status changed: "pending" -> "complete"
# ==> Evaluation "e8b3d2c5" finished with status "complete"

# Check job status
nomad job status web-application
# ID            = web-application
# Name          = web-application
# Type          = service
# Priority      = 75
# Datacenters   = dc1,dc2,dc3
# Status        = running
#
# Deployed
# Task Group  Desired  Placed  Healthy  Unhealthy
# frontend    3        3       3        0
# backend     5        5       5        0
# workers     2        2       2        0

# Inspect specific allocation
nomad alloc status a1b2c3d4
# Shows detailed task state, events, resources, ports

# View allocation logs (streaming)
nomad alloc logs -f a1b2c3d4 nginx
# Streams stdout/stderr from nginx task in allocation

# Execute command in running allocation
nomad alloc exec a1b2c3d4 nginx /bin/sh
# Interactive shell in container, useful for debugging

# ========================================
# SCALING OPERATIONS
# ========================================

# Scale job by updating count
nomad job scale web-application frontend 5
# Scales frontend group from 3 to 5 instances
# Reason: Simple scaling without editing job file

# Stop job (graceful shutdown)
nomad job stop web-application
# Sends SIGTERM, waits for grace period, then SIGKILL
# All allocations cleaned up, resources released

# Purge job from cluster state
nomad job stop -purge web-application
# Removes job and all history from state

# Restart job (useful after Consul/Vault changes)
nomad job restart web-application
# Rolling restart respecting update strategy

# ========================================
# DEPLOYMENT MANAGEMENT
# ========================================

# Monitor active deployment
nomad deployment status 5b8f9a2c
# Deployment ID "5b8f9a2c" for job "web-application"
#
# Status      : running
# Description : Deployment is running
#
# Task Group  Promoted  Desired  Canaries  Placed  Healthy  Unhealthy
# frontend    false     3        1         1       0        0
#
# Canary allocation a1b2c3d4 is healthy - ready for promotion

# Promote canary deployment manually
nomad deployment promote 5b8f9a2c
# Reason: After validating canary metrics/logs, proceed with full rollout

# Fail and revert deployment
nomad deployment fail 5b8f9a2c
# Triggers auto_revert, rolls back to previous version

# ========================================
# NODE MANAGEMENT & MAINTENANCE
# ========================================

# Drain node for maintenance (graceful migration)
nomad node drain -enable -yes a72dfba6
# Migrates all allocations to other nodes before maintenance
# Reason: Zero-downtime node updates/patching

# Mark node as ineligible for scheduling (no migration)
nomad node eligibility -disable a72dfba6
# Prevents new allocations, keeps existing ones running

# Re-enable drained node
nomad node drain -disable -yes a72dfba6
nomad node eligibility -enable a72dfba6

# View node resource utilization
nomad node status -stats a72dfba6
# CPU        = 2500 / 8000 MHz (31%)
# Memory     = 4096 / 16384 MB (25%)
# Disk       = 50 / 100 GB (50%)
# Allocations = 5

# ========================================
# MONITORING & DEBUGGING
# ========================================

# View system events
nomad system gc
# Force garbage collection of stopped allocations

# Check evaluation status (troubleshoot placement failures)
nomad eval status e8b3d2c5
# Shows why allocations were placed or failed placement

# Monitor cluster events in real-time
nomad monitor -log-level=DEBUG
# Streams all cluster events, useful for debugging

# Export metrics (Prometheus format)
curl http://localhost:4646/v1/metrics?format=prometheus
# Metrics for monitoring: allocation counts, resource usage, evaluation latency

# ACL operations (enterprise security)
nomad acl policy apply -description "Developer read-only" dev-read dev-read.hcl

# Namespace operations (multi-tenancy)
nomad namespace apply -description "Production environment" production

# ========================================
# RESOURCE COMPARISONS: NOMAD VS KUBERNETES
# ========================================

# Nomad simplicity demonstration:
# - Single binary: nomad (vs kubectl + 10+ K8s components)
# - Single config file (vs kubeconfig + manifests + CRDs)
# - Built-in service discovery via Consul (vs CoreDNS + Service objects)
# - Native secrets via Vault (vs K8s Secrets + external secret operators)
# - No separate ingress controller needed for basic use cases

# Example: Memory footprint comparison for 100 nodes
# Nomad servers (3): ~150MB total (50MB each)
# Kubernetes control plane: ~1.5GB+ (apiserver, etcd, controller-manager, scheduler)
#
# Reason: Nomad's architecture optimizes for operational simplicity
# making it ideal for:
# - Edge computing (limited resources)
# - Small/medium clusters (< 1000 nodes)
# - Teams preferring operational simplicity over ecosystem size
# - Heterogeneous workloads (containers + VMs + binaries)`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete operational workflows for managing Nomad clusters, jobs, and nodes with emphasis on simplicity vs Kubernetes",
        prerequisites: [
          "Bash scripting",
          "CLI tools",
          "Cluster operations",
          "Deployment strategies",
        ],
        systemPosition:
          "Operations engineer or SRE managing Nomad infrastructure through CLI, scripts, and automation",
      },
      annotations: [
        {
          id: "nomad-cli-single-binary",
          lines: [7, 19],
          action:
            "Start Nomad server as single binary process with minimal configuration",
          reason:
            "Unlike Kubernetes which requires 5+ separate control plane components (kube-apiserver, kube-scheduler, kube-controller-manager, etcd, cloud-controller-manager), Nomad runs as a single binary. This dramatically reduces operational complexity, eliminates inter-component coordination issues, and simplifies deployment, monitoring, and troubleshooting.",
          contextLevel: "system",
          relatedConcepts: [
            "operational-simplicity",
            "single-binary-deployment",
          ],
        },
        {
          id: "nomad-cli-metadata",
          lines: [28, 36],
          action:
            "Configure client metadata for constraint-based scheduling decisions",
          reason:
            "Custom metadata enables sophisticated placement without code changes. Jobs can constrain to specific zones (HA), GPU types (ML workloads), or regions (data sovereignty). This metadata-driven approach is simpler than Kubernetes node labels + node selectors + taints + tolerations.",
          contextLevel: "module",
          relatedConcepts: ["constraint-based-scheduling", "metadata-driven"],
        },
        {
          id: "nomad-cli-plan",
          lines: [55, 61],
          action:
            "Preview deployment changes with plan command before execution",
          reason:
            "Job plan performs dry-run showing exactly which allocations will be created, updated, or destroyed, plus resource impacts. This prevents production surprises and enables safe deployments. Similar to Terraform plan for infrastructure changes.",
          contextLevel: "module",
          relatedConcepts: ["dry-run", "change-preview", "safe-deployment"],
        },
        {
          id: "nomad-cli-exec",
          lines: [90, 92],
          action:
            "Execute interactive shell in running allocation for live debugging",
          reason:
            "Alloc exec provides direct access to running tasks for troubleshooting without SSH or bastion hosts. Works with any driver (Docker, exec, Java) providing consistent debugging experience across heterogeneous workloads.",
          contextLevel: "local",
          relatedConcepts: ["live-debugging", "troubleshooting"],
        },
        {
          id: "nomad-cli-canary",
          lines: [118, 134],
          action:
            "Monitor canary deployment status and manually promote after validation",
          reason:
            "Canary deployments test new versions with subset of traffic before full rollout. Manual promotion after metrics validation prevents bad deployments from affecting all users. Auto-fail with revert provides safety net.",
          contextLevel: "system",
          relatedConcepts: [
            "canary-deployment",
            "progressive-delivery",
            "deployment-validation",
          ],
        },
        {
          id: "nomad-cli-drain",
          lines: [139, 142],
          action:
            "Drain node to gracefully migrate allocations before maintenance",
          reason:
            "Node draining enables zero-downtime maintenance by moving workloads to healthy nodes before taking node offline. Critical for patching, upgrades, or hardware replacement without service interruption.",
          contextLevel: "system",
          relatedConcepts: [
            "graceful-shutdown",
            "zero-downtime",
            "maintenance-mode",
          ],
        },
        {
          id: "nomad-cli-resources",
          lines: [151, 156],
          action: "View detailed node resource utilization statistics",
          reason:
            "Resource stats show CPU, memory, disk, and allocation counts for capacity planning and troubleshooting. Helps identify over/under-utilized nodes and inform scaling decisions.",
          contextLevel: "local",
          relatedConcepts: ["capacity-planning", "resource-monitoring"],
        },
        {
          id: "nomad-cli-footprint",
          lines: [187, 202],
          action:
            "Compare resource footprint: Nomad 150MB vs Kubernetes 1.5GB+ for control plane",
          reason:
            "Nomad's lightweight design (50MB per server) makes it viable for edge computing, IoT, and resource-constrained environments where Kubernetes control plane overhead is prohibitive. A 10x reduction in memory enables running orchestration on smaller, cheaper hardware.",
          contextLevel: "system",
          relatedConcepts: [
            "resource-efficiency",
            "edge-computing",
            "memory-footprint",
          ],
        },
      ],
      highlights: [
        {
          lines: [7, 36],
          label: "Single binary setup vs K8s complexity",
          sbvpDomain: "structure",
        },
        {
          lines: [55, 92],
          label: "Job lifecycle and operational commands",
          sbvpDomain: "behavior",
        },
        {
          lines: [118, 134],
          label: "Deployment management and canary promotion",
          sbvpDomain: "behavior",
        },
        {
          lines: [187, 202],
          label: "Resource efficiency comparison",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "nomad-go-api",
      language: "go",
      title: "Nomad Go API Client for Programmatic Management",
      description:
        "Production-ready Go application using Nomad API for job submission, custom scheduling, event monitoring, and dynamic scaling",
      code: `package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/hashicorp/nomad/api"
)

// NomadManager provides high-level operations on Nomad cluster
type NomadManager struct {
	client *api.Client
}

// NewNomadManager creates Nomad client with configuration
func NewNomadManager(address string) (*NomadManager, error) {
	config := api.DefaultConfig()
	config.Address = address // http://nomad.service.consul:4646

	client, err := api.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Nomad client: %w", err)
	}

	return &NomadManager{client: client}, nil
}

// SubmitJob creates and runs a new job programmatically
// Reason: API-driven job submission enables dynamic workload creation
// based on external triggers (webhooks, queue depth, time schedules)
func (nm *NomadManager) SubmitJob(ctx context.Context, jobID, imageTag string, count int) error {
	// Build job specification programmatically
	job := &api.Job{
		ID:          &jobID,
		Name:        &jobID,
		Type:        stringPtr("service"),
		Datacenters: []string{"dc1"},
		Priority:    intPtr(50),

		TaskGroups: []*api.TaskGroup{
			{
				Name:  stringPtr("web"),
				Count: &count,

				// Restart policy for fault tolerance
				RestartPolicy: &api.RestartPolicy{
					Attempts: intPtr(3),
					Interval: timePtr(5 * time.Minute),
					Delay:    timePtr(15 * time.Second),
					Mode:     stringPtr("fail"),
				},

				// Network configuration with dynamic ports
				Networks: []*api.NetworkResource{
					{
						Mode: "bridge",
						DynamicPorts: []api.Port{
							{Label: "http", To: 8080},
						},
					},
				},

				// Service discovery registration
				Services: []*api.Service{
					{
						Name:      fmt.Sprintf("%s-api", jobID),
						PortLabel: "http",
						Tags:      []string{"api", "production", imageTag},

						// Health check configuration
						Checks: []api.ServiceCheck{
							{
								Name:     "HTTP Health Check",
								Type:     "http",
								Path:     "/health",
								Interval: 10 * time.Second,
								Timeout:  2 * time.Second,
							},
						},
					},
				},

				Tasks: []*api.Task{
					{
						Name:   "app",
						Driver: "docker",

						Config: map[string]interface{}{
							"image": fmt.Sprintf("company/app:%s", imageTag),
							"ports": []string{"http"},
						},

						// Resource requirements for scheduling
						Resources: &api.Resources{
							CPU:      intPtr(500),  // MHz
							MemoryMB: intPtr(256),  // MB
						},

						// Environment variables
						Env: map[string]string{
							"ENV":     "production",
							"VERSION": imageTag,
						},
					},
				},
			},
		},
	}

	// Submit job to Nomad cluster
	jobs := nm.client.Jobs()
	resp, _, err := jobs.Register(job, nil)
	if err != nil {
		return fmt.Errorf("failed to register job: %w", err)
	}

	log.Printf("Job %s submitted successfully, eval ID: %s", jobID, resp.EvalID)

	// Wait for evaluation to complete
	if err := nm.waitForEvaluation(ctx, resp.EvalID); err != nil {
		return fmt.Errorf("evaluation failed: %w", err)
	}

	return nil
}

// waitForEvaluation polls evaluation status until complete
func (nm *NomadManager) waitForEvaluation(ctx context.Context, evalID string) error {
	evals := nm.client.Evaluations()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			eval, _, err := evals.Info(evalID, nil)
			if err != nil {
				return err
			}

			switch eval.Status {
			case "complete":
				log.Printf("Evaluation %s completed successfully", evalID)
				return nil
			case "failed", "cancelled", "blocked":
				return fmt.Errorf("evaluation %s status: %s", evalID, eval.Status)
			}
			// Continue polling for pending/running states
		}
	}
}

// ScaleJob dynamically adjusts job count based on metrics
// Reason: Auto-scaling based on custom metrics (queue depth, response time, etc.)
// Context: Unlike K8s HPA which only supports CPU/memory, Nomad API enables
// custom scaling logic based on any metric source (Prometheus, CloudWatch, etc.)
func (nm *NomadManager) ScaleJob(ctx context.Context, jobID string, newCount int) error {
	jobs := nm.client.Jobs()

	// Retrieve current job specification
	job, _, err := jobs.Info(jobID, nil)
	if err != nil {
		return fmt.Errorf("failed to get job info: %w", err)
	}

	// Update task group count
	for _, tg := range job.TaskGroups {
		oldCount := *tg.Count
		tg.Count = &newCount
		log.Printf("Scaling %s/%s from %d to %d instances", jobID, *tg.Name, oldCount, newCount)
	}

	// Submit updated job
	resp, _, err := jobs.Register(job, nil)
	if err != nil {
		return fmt.Errorf("failed to scale job: %w", err)
	}

	log.Printf("Scale operation submitted, eval ID: %s", resp.EvalID)
	return nm.waitForEvaluation(ctx, resp.EvalID)
}

// MonitorEvents streams Nomad events for observability
// Reason: Real-time event streaming enables external monitoring, alerting,
// and integration with observability platforms (Datadog, New Relic, etc.)
func (nm *NomadManager) MonitorEvents(ctx context.Context) error {
	events := nm.client.EventStream()

	// Subscribe to all event topics
	topics := map[api.Topic][]string{
		api.TopicJob:        {"*"},
		api.TopicAllocation: {"*"},
		api.TopicDeployment: {"*"},
		api.TopicEvaluation: {"*"},
		api.TopicNode:       {"*"},
	}

	streamCh, err := events.Stream(ctx, topics, 0, nil)
	if err != nil {
		return fmt.Errorf("failed to start event stream: %w", err)
	}

	log.Println("Monitoring Nomad events...")

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event := <-streamCh:
			if event.Err != nil {
				log.Printf("Event stream error: %v", event.Err)
				continue
			}

			// Process events by type
			for _, e := range event.Events {
				nm.handleEvent(e)
			}
		}
	}
}

// handleEvent processes individual events for monitoring/alerting
func (nm *NomadManager) handleEvent(event *api.Event) {
	switch event.Topic {
	case api.TopicJob:
		// Job state changes (registered, updated, deleted)
		log.Printf("Job event: %s - %s", event.Type, event.Key())

	case api.TopicAllocation:
		// Allocation lifecycle events
		if event.Type == "AllocationUpdated" {
			// Extract allocation details for metrics
			log.Printf("Allocation updated: %s", event.Key())
		}

	case api.TopicDeployment:
		// Deployment progress tracking
		if event.Type == "DeploymentStatusUpdate" {
			log.Printf("Deployment update: %s", event.Key())
			// Send to monitoring system for deployment tracking
		}

	case api.TopicNode:
		// Node state changes (ready, down, draining)
		log.Printf("Node event: %s - %s", event.Type, event.Key())
		// Alert on node failures
	}
}

// GetClusterResources retrieves total and used cluster capacity
// Reason: Capacity planning and auto-scaling decisions require cluster resource visibility
// Context: Nomad tracks resources across heterogeneous nodes (CPU, memory, disk, GPUs)
func (nm *NomadManager) GetClusterResources(ctx context.Context) (*ClusterResources, error) {
	nodes := nm.client.Nodes()

	nodesList, _, err := nodes.List(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	resources := &ClusterResources{}

	for _, node := range nodesList {
		// Get detailed node info
		nodeInfo, _, err := nodes.Info(node.ID, nil)
		if err != nil {
			log.Printf("Failed to get node %s info: %v", node.ID, err)
			continue
		}

		// Aggregate total resources
		resources.TotalCPU += *nodeInfo.Resources.CPU
		resources.TotalMemoryMB += *nodeInfo.Resources.MemoryMB

		// Calculate used resources from allocations
		allocs, _, err := nodes.Allocations(node.ID, nil)
		if err != nil {
			continue
		}

		for _, alloc := range allocs {
			if alloc.ClientStatus == "running" {
				for _, task := range alloc.TaskResources {
					resources.UsedCPU += *task.CPU
					resources.UsedMemoryMB += *task.MemoryMB
				}
			}
		}
	}

	// Calculate utilization percentages
	resources.CPUUtilization = float64(resources.UsedCPU) / float64(resources.TotalCPU) * 100
	resources.MemoryUtilization = float64(resources.UsedMemoryMB) / float64(resources.TotalMemoryMB) * 100

	return resources, nil
}

// ClusterResources represents aggregate cluster capacity
type ClusterResources struct {
	TotalCPU          int
	UsedCPU           int
	TotalMemoryMB     int
	UsedMemoryMB      int
	CPUUtilization    float64
	MemoryUtilization float64
}

// Example usage demonstrating API-driven operations
func main() {
	ctx := context.Background()

	// Initialize Nomad client
	manager, err := NewNomadManager("http://nomad.service.consul:4646")
	if err != nil {
		log.Fatalf("Failed to create Nomad manager: %v", err)
	}

	// Submit new job programmatically
	if err := manager.SubmitJob(ctx, "my-api-v2", "v2.1.0", 3); err != nil {
		log.Fatalf("Failed to submit job: %v", err)
	}

	// Check cluster resources for capacity planning
	resources, err := manager.GetClusterResources(ctx)
	if err != nil {
		log.Fatalf("Failed to get cluster resources: %v", err)
	}

	log.Printf("Cluster CPU: %.1f%% utilized", resources.CPUUtilization)
	log.Printf("Cluster Memory: %.1f%% utilized", resources.MemoryUtilization)

	// Auto-scale based on utilization
	if resources.CPUUtilization > 80.0 {
		log.Println("High CPU utilization detected, scaling up...")
		if err := manager.ScaleJob(ctx, "my-api-v2", 5); err != nil {
			log.Printf("Failed to scale job: %v", err)
		}
	}

	// Monitor events in background
	go func() {
		if err := manager.MonitorEvents(ctx); err != nil {
			log.Printf("Event monitoring stopped: %v", err)
		}
	}()

	// Keep main goroutine alive
	select {}
}

// Helper functions
func stringPtr(s string) *string { return &s }
func intPtr(i int) *int          { return &i }
func timePtr(t time.Duration) *time.Duration { return &t }`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Go application using Nomad API for dynamic job management, custom auto-scaling, and event-driven monitoring",
        prerequisites: [
          "Go programming",
          "API clients",
          "Concurrency patterns",
          "Event-driven architecture",
        ],
        systemPosition:
          "Orchestration layer managing Nomad clusters programmatically, integrating with external systems (metrics, queues, webhooks) for dynamic workload management",
      },
      annotations: [
        {
          id: "nomad-api-dynamic-job",
          lines: [30, 109],
          action: "Build and submit job specification programmatically via API",
          reason:
            "API-driven job submission enables dynamic workload creation based on external events (webhook triggers, queue depth, scheduled tasks). This is more flexible than static HCL files, allowing applications to spawn workloads on-demand—common in CI/CD pipelines, batch processing systems, and auto-scaling platforms.",
          contextLevel: "system",
          relatedConcepts: ["api-driven", "dynamic-workloads", "event-driven"],
        },
        {
          id: "nomad-api-custom-scaling",
          lines: [151, 177],
          action:
            "Implement custom auto-scaling logic based on arbitrary metrics",
          reason:
            "Unlike Kubernetes HPA which only supports CPU/memory metrics out-of-box, Nomad's API enables custom scaling based on any metric source: queue depth, response time, business metrics, external APIs. This flexibility is critical for real-world auto-scaling needs. Example: Scale workers based on SQS queue size, not just CPU.",
          contextLevel: "system",
          relatedConcepts: [
            "custom-autoscaling",
            "metric-driven",
            "horizontal-scaling",
          ],
        },
        {
          id: "nomad-api-event-stream",
          lines: [181, 220],
          action: "Stream real-time cluster events for monitoring and alerting",
          reason:
            "Event streaming enables external systems to react to cluster changes in real-time: send deployment notifications to Slack, trigger CI/CD pipelines on job completion, update external dashboards with allocation status, alert on node failures. This eliminates polling and enables event-driven architectures.",
          contextLevel: "system",
          relatedConcepts: [
            "event-streaming",
            "observability",
            "event-driven-architecture",
          ],
        },
        {
          id: "nomad-api-capacity",
          lines: [241, 278],
          action:
            "Calculate aggregate cluster resources across heterogeneous nodes",
          reason:
            "Capacity planning requires visibility into total and used resources across the cluster. This enables: 1) Auto-scaling decisions (scale cluster when utilization > 80%), 2) Cost optimization (identify underutilized nodes), 3) Capacity forecasting (predict when to add nodes). Nomad tracks CPU, memory, disk, GPUs across diverse hardware.",
          contextLevel: "module",
          relatedConcepts: [
            "capacity-planning",
            "resource-tracking",
            "cluster-autoscaling",
          ],
        },
        {
          id: "nomad-api-eval-wait",
          lines: [113, 145],
          action:
            "Poll evaluation status until completion to verify job placement",
          reason:
            "Job submission is asynchronous—returns immediately with evaluation ID. Waiting for evaluation ensures scheduler successfully placed allocations on nodes or surfaces placement failures (insufficient resources, constraint mismatches). Critical for automated pipelines that need placement confirmation before proceeding.",
          contextLevel: "module",
          relatedConcepts: [
            "async-operations",
            "eventual-consistency",
            "placement-verification",
          ],
        },
        {
          id: "nomad-api-footprint",
          lines: [284, 320],
          action:
            "Demonstrate complete programmatic control with minimal client overhead",
          reason:
            "Nomad Go client is lightweight (~10MB) compared to Kubernetes client-go (~50MB+), enabling embedded orchestration in applications. Resource efficiency theme: Nomad client ~10MB, server ~50MB vs K8s client ~50MB, control plane ~1.5GB. This 10-50x reduction enables orchestration on edge devices, IoT gateways, and embedded systems impossible with Kubernetes.",
          contextLevel: "system",
          relatedConcepts: [
            "resource-efficiency",
            "embedded-orchestration",
            "edge-computing",
          ],
        },
        {
          id: "nomad-api-integration",
          lines: [295, 310],
          action:
            "Integrate job lifecycle with external metrics for intelligent auto-scaling",
          reason:
            "Production systems need scaling decisions based on business metrics, not just infrastructure metrics. Example: E-commerce scales based on cart conversion rate, not CPU. By exposing full API, Nomad enables integrating any data source (Prometheus, CloudWatch, custom metrics) into orchestration decisions.",
          contextLevel: "system",
          relatedConcepts: [
            "business-metrics",
            "intelligent-scaling",
            "metric-integration",
          ],
        },
        {
          id: "nomad-api-eventdriven",
          lines: [312, 318],
          action:
            "Use event monitoring for reactive architectures and observability",
          reason:
            "Event-driven monitoring enables building reactive systems: trigger Lambda functions on deployment completion, update service catalog on job registration, auto-remediate failed allocations. This is more efficient than polling and enables real-time responses to cluster state changes.",
          contextLevel: "system",
          relatedConcepts: [
            "reactive-systems",
            "event-driven",
            "real-time-monitoring",
          ],
        },
      ],
      highlights: [
        {
          lines: [30, 109],
          label: "Dynamic job submission via API",
          sbvpDomain: "behavior",
        },
        {
          lines: [151, 177],
          label: "Custom auto-scaling with arbitrary metrics",
          sbvpDomain: "behavior",
        },
        {
          lines: [181, 220],
          label: "Real-time event streaming for observability",
          sbvpDomain: "structure",
        },
        {
          lines: [284, 310],
          label: "Production usage with intelligent scaling",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Hybrid container/VM workloads requiring unified orchestration",
      "Batch processing and scheduled jobs (ETL, data pipelines, ML training)",
      "Legacy application modernization without containerization",
      "Edge computing and IoT deployments with resource constraints",
      "Multi-region deployments with federation requirements",
      "Hadoop/Spark cluster orchestration for big data workloads",
      "Machine learning job scheduling on GPU clusters",
      "CI/CD pipeline execution and ephemeral build environments",
    ],
    interactsWith: [
      "consul",
      "vault",
      "terraform",
      "prometheus",
      "grafana",
      "elk-stack",
    ],
    architecturalBoundaries: [
      "Server cluster (control plane): Raft-based consensus, scheduling, state management",
      "Client agents (compute plane): Task execution, resource reporting, health checks",
      "Service mesh integration: Consul Connect for mTLS, service discovery, traffic management",
      "Secrets management: Vault integration for dynamic credentials and encryption",
      "Networking layer: CNI plugins, bridge/host networking, load balancers",
      "Storage layer: Host volumes, CSI plugins, ephemeral disk management",
      "Observability: Metrics endpoints, log aggregation, event streaming",
    ],
  },

  implementations: [
    {
      id: "nomad-platform",
      name: "HashiCorp Nomad",
      type: "platform",
      languages: ["any"],
      description:
        "Official HashiCorp Nomad orchestrator supporting containers, VMs, and binaries. Single binary deployment with multi-region federation, rolling deployments, and HashiCorp ecosystem integration. Ideal for heterogeneous workloads and operational simplicity.",
      links: {
        docs: "https://www.nomadproject.io/docs",
        github: "https://github.com/hashicorp/nomad",
      },
    },
    {
      id: "nomad-pack",
      name: "Nomad Pack",
      type: "tool",
      languages: ["hcl"],
      description:
        "Templating and package manager for Nomad job specifications. Enables reusable job templates with variable substitution, similar to Helm for Kubernetes. Simplifies deploying common workload patterns across environments.",
      links: {
        docs: "https://www.nomadproject.io/docs/nomad-pack",
        github: "https://github.com/hashicorp/nomad-pack",
      },
    },
    {
      id: "levant",
      name: "Levant",
      type: "tool",
      languages: ["any"],
      description:
        "Deployment tool for Nomad with templating and auto-revert capabilities. Provides advanced deployment workflows including canary analysis, metric-based promotion, and automated rollbacks. Similar to Flagger for Kubernetes.",
      links: {
        docs: "https://github.com/hashicorp/levant",
        github: "https://github.com/hashicorp/levant",
      },
    },
    {
      id: "waypoint",
      name: "HashiCorp Waypoint",
      type: "platform",
      languages: ["any"],
      description:
        "Application deployment workflow tool supporting Nomad as deployment target. Provides unified workflow for build, deploy, and release across multiple platforms (Nomad, Kubernetes, ECS). Simplifies developer experience with platform abstraction.",
      links: {
        docs: "https://www.waypointproject.io/docs",
        github: "https://github.com/hashicorp/waypoint",
      },
    },
    {
      id: "consul-mesh",
      name: "Consul Service Mesh",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh with native Nomad integration via Consul Connect. Provides mTLS, traffic management, service discovery, and observability for Nomad workloads. Essential for secure multi-service architectures on Nomad.",
      links: {
        docs: "https://www.consul.io/docs/connect",
        github: "https://github.com/hashicorp/consul",
      },
    },
    {
      id: "vault-secrets",
      name: "HashiCorp Vault",
      type: "service",
      languages: ["any"],
      description:
        "Secrets management with native Nomad integration. Provides dynamic secrets, encryption-as-a-service, and PKI for Nomad tasks. Templates enable automatic secret rotation and injection without application code changes.",
      links: {
        docs: "https://www.vaultproject.io/docs",
        github: "https://github.com/hashicorp/vault",
      },
    },
    {
      id: "terraform-nomad",
      name: "Terraform Nomad Provider",
      type: "tool",
      languages: ["hcl"],
      description:
        "Terraform provider for managing Nomad resources as code. Enables GitOps workflows for Nomad jobs, ACL policies, quotas, and namespaces. Integrates cluster orchestration with infrastructure provisioning.",
      links: {
        docs: "https://registry.terraform.io/providers/hashicorp/nomad/latest/docs",
        github: "https://github.com/hashicorp/terraform-provider-nomad",
      },
    },
    {
      id: "boundary-access",
      name: "HashiCorp Boundary",
      type: "service",
      languages: ["any"],
      description:
        "Identity-based access management for Nomad infrastructure. Provides just-in-time access to Nomad jobs and allocations without VPNs or bastion hosts. Simplifies secure access to dynamic Nomad workloads.",
      links: {
        docs: "https://www.boundaryproject.io/docs",
        github: "https://github.com/hashicorp/boundary",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "roblox",
      systemName: "Roblox Game Server Orchestration",
      howUsed:
        "Roblox uses Nomad to orchestrate game servers for 200M+ monthly active users with 1M+ simultaneous players. Each game instance is a separate Nomad job running on bare metal for performance. Nomad's lightweight footprint (50MB per server agent) enables running on thousands of game servers without resource overhead. The multi-driver support allows mixing Docker containers (for tooling), native binaries (for game servers), and QEMU VMs (for isolated player instances). Constraint-based scheduling places game servers in specific regions for latency requirements (< 50ms) using datacenter and region metadata. Pattern composition: Nomad (orchestration) + Consul (service discovery for player matchmaking) + Vault (dynamic game server credentials) + Envoy (load balancing). Rationale: Kubernetes' 500MB+ control plane overhead would consume significant resources across thousands of game servers, while Nomad's efficiency enables maximizing game server capacity. Impact: Reduced infrastructure costs by 30% vs previous orchestration solution; enabled scaling to 1M+ simultaneous players; sub-50ms server placement latency; zero-downtime game server updates via rolling deployments.",
      source: "https://www.hashicorp.com/case-studies/roblox",
    },
    {
      systemId: "pandora",
      systemName: "Pandora Music Streaming Infrastructure",
      howUsed:
        "Pandora adopted Nomad for multi-region music streaming infrastructure serving 70M+ users. The platform orchestrates heterogeneous workloads: Docker containers for APIs, Java applications for recommendation engine (Java driver), and native binaries for audio transcoding. Multi-region federation enables deploying services across 5 regions with single job specification, simplifying operations vs managing 5 separate Kubernetes clusters. Nomad's Consul integration provides cross-region service discovery for global traffic routing. Pattern composition: Nomad (orchestration) + Consul (service mesh, global catalog) + Vault (secrets) + Prometheus (metrics) + Terraform (IaC). Rationale: Kubernetes complexity (5 control planes, cross-cluster networking, federated ingress) was operational burden; Nomad's built-in federation and single-binary architecture reduced operational overhead by 60%. Impact: Reduced operational team size from 15 to 6 engineers; enabled 99.99% uptime across regions; simplified disaster recovery (single control plane vs 5); reduced inter-region latency by 40% with intelligent scheduling.",
      source: "https://www.hashicorp.com/resources/pandora-nomad-journey",
    },
    {
      systemId: "citadel",
      systemName: "Citadel Securities Trading Infrastructure",
      howUsed:
        "Citadel Securities uses Nomad for low-latency trading system orchestration requiring microsecond-level latency. Trading algorithms run as native binaries (exec driver) on bare metal for maximum performance, while supporting services (monitoring, logging) use Docker containers. Nomad's constraint-based scheduling places latency-sensitive workloads on specific hardware with FPGA accelerators and high-speed networking. The lightweight design (50MB footprint) minimizes CPU cycles wasted on orchestration vs trading logic. Pattern composition: Nomad (orchestration) + Consul (service discovery for market data feeds) + Vault (API credentials) + custom schedulers for NUMA-aware placement. Rationale: Kubernetes overhead (container runtime, service proxy latency, resource limits) added unacceptable microseconds to trade execution; Nomad's exec driver and bare metal support enabled orchestration without performance penalty. Impact: Maintained sub-100μs P99 latency for trade execution; reduced infrastructure costs by running mixed workloads (trading + support) on unified platform; enabled rapid algorithm deployment (seconds vs minutes with previous system).",
      source:
        "https://www.hashicorp.com/resources/citadel-securities-hashicorp-nomad",
    },
    {
      systemId: "circleci",
      systemName: "CircleCI Build Infrastructure",
      howUsed:
        "CircleCI adopted Nomad for CI/CD build infrastructure executing millions of jobs daily. Each build runs as ephemeral Nomad job with Docker driver for containerized builds, VM driver for macOS/Windows builds requiring full VMs, and exec driver for native builds. Multi-driver support eliminates need for separate orchestration platforms (Kubernetes for containers, custom scripts for VMs). Nomad's batch job type handles ephemeral workloads with automatic cleanup. Bin-packing scheduler maximizes build server utilization (70%+ vs 40% with previous solution). Pattern composition: Nomad (orchestration) + Consul (distributed locks for resource allocation) + Vault (customer secrets) + custom autoscaler (scale based on queue depth, not CPU). Rationale: Kubernetes StatefulSets and Jobs primitives didn't match CI/CD workflow; Nomad's batch jobs and multi-driver support eliminated architectural impedance. Impact: Reduced build infrastructure costs by 50% through higher utilization; enabled supporting macOS/Windows builds without separate platforms; improved build start latency from 30s to 5s through efficient scheduling.",
      source: "https://www.hashicorp.com/resources/circleci-nomad",
    },
    {
      systemId: "trivago",
      systemName: "Trivago Hotel Search Platform",
      howUsed:
        "Trivago uses Nomad to orchestrate microservices for hotel search platform processing 1.8B requests/day. The heterogeneous architecture mixes Docker containers (stateless APIs), Java applications (search indexing), and Hadoop jobs (batch analytics). Nomad's multi-driver support enables unified orchestration vs previous solution requiring 3 platforms (Kubernetes for containers, Marathon for Java, custom scripts for Hadoop). Consul integration provides service mesh for 150+ microservices with mTLS and traffic management. Rolling deployment strategies enable 50+ deployments/day with zero downtime. Pattern composition: Nomad (orchestration) + Consul (service mesh) + Vault (secrets) + Prometheus (metrics) + Grafana (dashboards). Rationale: Operational complexity of multiple orchestration platforms (K8s, Marathon, custom) required large team; consolidating on Nomad reduced operational overhead and enabled smaller team to manage more services. Impact: Reduced infrastructure management team from 20 to 8 engineers; improved deployment frequency from 10/day to 50/day; eliminated entire class of cross-platform integration issues; reduced p99 latency by 35% through better resource utilization.",
      source: "https://tech.trivago.com/post/2019-01-25-nomad-our-experiences/",
    },
  ],

  philosophy: {
    coreProblem:
      "Organizations struggle with operational complexity of Kubernetes for heterogeneous workloads (containers, VMs, binaries) and resource-constrained environments (edge, IoT)",
    designPrinciple:
      "Provide simple, flexible orchestration supporting any workload type with minimal operational overhead through single-binary architecture and HashiCorp ecosystem integration",
    historicalContext:
      "Created by HashiCorp in 2015 as reaction to Kubernetes complexity, focusing on operational simplicity and heterogeneous workload support. Targeted at organizations valuing simplicity over ecosystem size.",
    alternativesRejected: [
      "Kubernetes-only approach - too complex for small teams, containers-only limitation",
      "Multiple orchestrators (K8s + custom) - operational overhead, integration complexity",
      "PaaS solutions (Heroku) - vendor lock-in, limited control, higher costs",
    ],
    mentalModel:
      "Like a versatile task scheduler that doesn't care whether you're asking it to run a container, VM, or binary—it just finds the right place to run it, keeps it healthy, and scales it up or down as needed. All controlled by a single binary instead of 10+ components.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Control Plane"
      S1[Nomad Server 1<br/>Leader]
      S2[Nomad Server 2]
      S3[Nomad Server 3]
      S1 -.Raft Consensus.-> S2
      S2 -.Raft Consensus.-> S3
      S3 -.Raft Consensus.-> S1
    end

    subgraph "Compute Plane"
      C1[Client 1<br/>Docker + Exec]
      C2[Client 2<br/>Java + QEMU]
      C3[Client 3<br/>Docker + GPU]
    end

    subgraph "HashiCorp Ecosystem"
      Consul[Consul<br/>Service Mesh]
      Vault[Vault<br/>Secrets]
      Terraform[Terraform<br/>IaC]
    end

    S1 -->|Schedule Jobs| C1
    S1 -->|Schedule Jobs| C2
    S1 -->|Schedule Jobs| C3

    C1 -->|Register Services| Consul
    C2 -->|Register Services| Consul
    C3 -->|Register Services| Consul

    C1 -->|Fetch Secrets| Vault
    C2 -->|Fetch Secrets| Vault

    Terraform -->|Provision Infra| S1

    style S1 fill:#7B42BC,color:#fff
    style S2 fill:#7B42BC,color:#fff
    style S3 fill:#7B42BC,color:#fff`,
    realWorldAnalogy:
      "Nomad is like a versatile project manager who can assign any type of work (coding, design, meetings) to team members based on their skills and availability, versus a specialist manager who only handles one type of project. It's a single point of contact instead of coordinating with 10 different managers.",
    useCases: [
      {
        domain: "Gaming",
        scenario:
          "Roblox orchestrates 1M+ game servers using Nomad's lightweight agents (50MB vs K8s 500MB), maximizing resources for game logic instead of orchestration overhead.",
        patternRole:
          "Enables massive scale with minimal infrastructure overhead on bare metal",
        companies: ["Roblox", "Riot Games"],
      },
      {
        domain: "Financial Trading",
        scenario:
          "Citadel Securities runs microsecond-latency trading algorithms as native binaries via exec driver, achieving sub-100μs P99 latency impossible with container overhead.",
        patternRole:
          "Provides orchestration without performance penalty of containerization",
        companies: ["Citadel Securities", "Two Sigma"],
      },
      {
        domain: "CI/CD",
        scenario:
          "CircleCI executes millions of ephemeral build jobs daily mixing Docker containers (Linux builds), VMs (macOS/Windows builds), and native execution, unified under single orchestrator.",
        patternRole:
          "Multi-driver support eliminates need for separate build infrastructure per platform",
        companies: ["CircleCI", "GitLab"],
      },
    ],
  },

  tags: [
    "scalability",
    "orchestration",
    "containers",
    "virtual-machines",
    "batch-processing",
    "edge-computing",
  ],
  difficulty: "intermediate",
};
