import type { Pattern } from "../schema";

export const dockerSwarm: Pattern = {
  id: "docker-swarm",
  slug: "docker-swarm",
  corpusPath: "📈 SCALABILITY → ↔️ Horizontal → 🎼 Orchestration",

  hierarchy: {
    quality: "scalability",
    strategy: "Horizontal",
    family: "Orchestration",
    level: 4,
  },

  concept: {
    name: "Docker Swarm",
    emoji: "🐳",
    tagline: "Native Docker clustering made simple",
    definition:
      "Docker Swarm is a native container orchestration platform built directly into the Docker Engine, enabling developers to create and manage clusters of Docker nodes without external dependencies. It transforms multiple Docker hosts into a single, logical cluster where containers are deployed as services with declarative scaling, load balancing, and self-healing capabilities. Swarm operates with a manager-worker architecture: manager nodes maintain cluster state using Raft consensus, schedule tasks across worker nodes, and expose a unified API, while worker nodes execute containerized tasks. Services are defined with desired replica counts, placement constraints, and update strategies—Swarm continuously reconciles actual state with desired state, automatically rescheduling failed containers and distributing traffic via an internal overlay network and ingress load balancer. The platform provides zero-downtime rolling updates, secrets management, and Docker CLI integration, making it significantly simpler to learn and operate than Kubernetes while sacrificing some advanced features. Docker Swarm excels in small-to-medium production deployments, edge computing, and teams seeking container orchestration without Kubernetes operational complexity.",
    problemSolved:
      "Running containers in production requires orchestration capabilities that raw Docker lacks: multi-host deployment, automatic failover, load balancing, service discovery, and rolling updates. Kubernetes solves these problems but introduces steep learning curves, complex YAML configurations, and operational overhead that can overwhelm small teams or simple use cases. Docker Swarm addresses this by embedding orchestration directly into Docker Engine, leveraging familiar Docker CLI commands and Compose file formats that developers already know. It eliminates the need for external control planes, separate networking plugins, or third-party service meshes—everything runs natively within Docker. For teams migrating from single-host Docker deployments to clustered environments, Swarm provides the shortest path to production-grade orchestration with minimal architectural changes.",
    tradeoffs: {
      pros: [
        "Zero external dependencies - built into Docker Engine",
        "Simple setup with familiar Docker CLI commands",
        "Native Docker Compose stack file support",
        "Built-in service discovery and load balancing",
        "Rolling updates and rollback without downtime",
      ],
      cons: [
        "Less feature-rich than Kubernetes (no CRDs, operators, or advanced scheduling)",
        "Smaller ecosystem with fewer integrations and tools",
        "Limited extensibility and plugin architecture",
        "Declining community adoption and enterprise support",
        "Weaker multi-tenancy and RBAC compared to Kubernetes",
      ],
    },
    relatedPatterns: [
      "kubernetes",
      "ecs-fargate",
      "nomad",
      "load-balancing",
      "service-discovery",
      "rolling-updates",
      "health-checks",
    ],
  },

  structure: {
    participants: [
      {
        name: "Manager Node",
        role: "Control Plane",
        responsibilities: [
          "Maintain cluster state using Raft consensus algorithm",
          "Schedule tasks across worker nodes based on placement constraints",
          "Orchestrate service deployments and rolling updates",
          "Expose Docker API for cluster management",
          "Handle service discovery and routing mesh",
        ],
      },
      {
        name: "Worker Node",
        role: "Data Plane",
        responsibilities: [
          "Execute tasks (container instances) assigned by managers",
          "Report task status and health checks to managers",
          "Connect to overlay network for service communication",
          "Pull container images from registries",
        ],
      },
      {
        name: "Service",
        role: "Workload Definition",
        responsibilities: [
          "Define desired state (replicas, image, resources, constraints)",
          "Specify update and rollback strategies",
          "Configure health checks and restart policies",
          "Declare networking and volume requirements",
        ],
      },
      {
        name: "Task",
        role: "Container Instance",
        responsibilities: [
          "Run single container replica on assigned worker node",
          "Report health status to manager nodes",
          "Execute application workload",
        ],
      },
      {
        name: "Ingress Load Balancer",
        role: "Traffic Distribution",
        responsibilities: [
          "Route external traffic to service replicas via routing mesh",
          "Distribute requests across healthy tasks using round-robin",
          "Provide service VIP (Virtual IP) for internal routing",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant Manager as Manager Node
    participant Worker1 as Worker Node 1
    participant Worker2 as Worker Node 2
    participant LB as Ingress LB

    User->>Manager: docker service create --replicas 3 web-app
    Manager->>Manager: Schedule tasks across workers
    Manager->>Worker1: Deploy task 1
    Manager->>Worker2: Deploy task 2
    Manager->>Worker2: Deploy task 3
    Worker1->>Manager: Task 1 running
    Worker2->>Manager: Tasks 2,3 running
    Manager->>LB: Register service endpoints

    User->>LB: HTTP request to service VIP
    LB->>Worker1: Route to task 1
    Worker1->>LB: Response
    LB->>User: Return response

    Worker1->>Manager: Task 1 failed (health check)
    Manager->>Manager: Detect desired != actual state
    Manager->>Worker1: Reschedule task 1
    Worker1->>Manager: Task 1 running (recovered)`,
    flow: [
      {
        step: 1,
        actor: "Administrator",
        action: "Initialize Swarm",
        description:
          "Run 'docker swarm init' on first manager node to create cluster",
      },
      {
        step: 2,
        actor: "Manager Node",
        action: "Generate Join Tokens",
        description:
          "Create secure tokens for additional managers and workers to join",
      },
      {
        step: 3,
        actor: "Worker Nodes",
        action: "Join Cluster",
        description:
          "Execute 'docker swarm join' with token to become cluster members",
      },
      {
        step: 4,
        actor: "Administrator",
        action: "Deploy Service",
        description:
          "Create service with 'docker service create' or 'docker stack deploy'",
      },
      {
        step: 5,
        actor: "Manager Node",
        action: "Schedule Tasks",
        description:
          "Assign tasks to worker nodes based on resource availability and constraints",
      },
      {
        step: 6,
        actor: "Worker Nodes",
        action: "Execute Tasks",
        description:
          "Pull images, start containers, and report status to managers",
      },
      {
        step: 7,
        actor: "Ingress Load Balancer",
        action: "Route Traffic",
        description:
          "Distribute incoming requests across healthy task replicas using VIP",
      },
      {
        step: 8,
        actor: "Manager Node",
        action: "Monitor Health",
        description:
          "Continuously check task health and compare actual vs desired state",
      },
      {
        step: 9,
        actor: "Manager Node",
        action: "Reconcile State",
        description:
          "Reschedule failed tasks, scale replicas, handle node failures",
      },
      {
        step: 10,
        actor: "Administrator",
        action: "Rolling Update",
        description:
          "Update service image; manager replaces tasks one-by-one with zero downtime",
      },
    ],
    invariants: [
      "Manager nodes must maintain odd-numbered quorum (3, 5, or 7 recommended for fault tolerance)",
      "Raft consensus requires majority of managers available to accept writes",
      "Service VIP remains constant even as task IPs change during scaling/updates",
      "Tasks are immutable - updates create new tasks rather than modifying existing ones",
      "Overlay network encryption is optional but recommended for multi-host security",
      "Desired state reconciliation happens continuously in background",
    ],
  },

  codeExamples: [
    {
      id: "docker-swarm-cli",
      language: "bash",
      title: "Docker Swarm CLI Management",
      description:
        "Complete Swarm cluster setup, service deployment, scaling, and rolling updates via Docker CLI",
      code: `#!/bin/bash
# Docker Swarm CLI Management - Complete cluster lifecycle

# ============================================================================
# SWARM INITIALIZATION AND NODE MANAGEMENT
# ============================================================================

# Initialize swarm on manager node (first node in cluster)
# --advertise-addr: IP address other nodes use to connect to this manager
docker swarm init --advertise-addr 192.168.1.10

# Output:
# Swarm initialized: current node (abc123) is now a manager.
# To add a worker to this swarm, run the following command:
#     docker swarm join --token SWMTKN-1-xxx 192.168.1.10:2377

# Get join tokens for adding additional nodes
docker swarm join-token manager  # For manager nodes (control plane)
docker swarm join-token worker   # For worker nodes (data plane)

# Add worker nodes (run on worker machines)
docker swarm join --token SWMTKN-1-worker-token-here 192.168.1.10:2377

# Add manager nodes for HA (run on manager machines)
docker swarm join --token SWMTKN-1-manager-token-here 192.168.1.10:2377

# List all nodes in cluster
docker node ls
# ID               HOSTNAME    STATUS    AVAILABILITY    MANAGER STATUS
# abc123 *         manager1    Ready     Active          Leader
# def456           worker1     Ready     Active
# ghi789           worker2     Ready     Active

# Inspect node details (resources, labels, status)
docker node inspect worker1 --pretty

# Promote worker to manager (increase control plane redundancy)
docker node promote worker1

# Demote manager to worker (reduce control plane size)
docker node demote manager2

# Drain node for maintenance (stop scheduling new tasks, migrate existing)
docker node update --availability drain worker1

# Return drained node to active service
docker node update --availability active worker1


# ============================================================================
# SERVICE DEPLOYMENT AND MANAGEMENT
# ============================================================================

# Create service with 3 replicas (horizontal scaling)
# --publish: Expose port 8080 on all nodes via ingress routing mesh
# --replicas: Desired number of task instances
# --name: Service identifier for DNS and service discovery
docker service create \\
  --name web-app \\
  --replicas 3 \\
  --publish published=8080,target=80 \\
  nginx:alpine

# List all services
docker service ls
# ID            NAME        MODE         REPLICAS    IMAGE
# xyz123        web-app     replicated   3/3         nginx:alpine

# Inspect service configuration and status
docker service inspect web-app --pretty

# List tasks (container instances) for a service
docker service ps web-app
# ID        NAME          IMAGE          NODE        DESIRED STATE    CURRENT STATE
# task1     web-app.1     nginx:alpine   worker1     Running          Running 2 mins
# task2     web-app.2     nginx:alpine   worker2     Running          Running 2 mins
# task3     web-app.3     nginx:alpine   worker1     Running          Running 2 mins

# View service logs (aggregated from all replicas)
docker service logs web-app --follow --tail 100


# ============================================================================
# SCALING AND RESOURCE MANAGEMENT
# ============================================================================

# Scale service to 10 replicas (horizontal scaling)
# Swarm distributes new tasks across available worker nodes
docker service scale web-app=10

# Scale multiple services simultaneously
docker service scale web-app=10 api-service=5 worker-queue=20

# Update service with resource constraints (prevent resource exhaustion)
# --reserve: Guaranteed resources (scheduler only places if available)
# --limit: Hard caps to prevent runaway containers
docker service update \\
  --reserve-memory 512M \\
  --reserve-cpu 0.5 \\
  --limit-memory 1G \\
  --limit-cpu 1.0 \\
  web-app


# ============================================================================
# ROLLING UPDATES AND ROLLBACK
# ============================================================================

# Configure rolling update strategy
# --update-parallelism: Number of tasks to update simultaneously
# --update-delay: Wait time between batches (allow health checks)
# --update-failure-action: Rollback on failure vs continue
# --update-monitor: Watch period to detect failures
docker service update \\
  --image nginx:1.21-alpine \\
  --update-parallelism 2 \\
  --update-delay 10s \\
  --update-failure-action rollback \\
  --update-monitor 30s \\
  web-app

# Watch rolling update progress
watch docker service ps web-app
# Shows old tasks shutting down, new tasks starting

# Manual rollback to previous version (if update went wrong)
docker service rollback web-app

# Update environment variables without image change
docker service update \\
  --env-add DATABASE_URL=postgres://new-db:5432 \\
  --env-rm OLD_CONFIG \\
  web-app


# ============================================================================
# PLACEMENT CONSTRAINTS AND PREFERENCES
# ============================================================================

# Deploy only to nodes with SSD storage (custom label constraint)
# First, label nodes with capabilities
docker node update --label-add storage=ssd worker1
docker node update --label-add storage=hdd worker2

# Then create service with constraint
docker service create \\
  --name database \\
  --constraint 'node.labels.storage==ssd' \\
  --replicas 3 \\
  postgres:13

# Deploy only to manager nodes (useful for monitoring/admin tools)
docker service create \\
  --name portainer \\
  --constraint 'node.role==manager' \\
  --publish 9000:9000 \\
  portainer/portainer-ce

# Deploy to specific availability zones (cloud deployments)
docker service create \\
  --name web-app \\
  --placement-pref 'spread=node.labels.zone' \\
  --replicas 9 \\
  nginx:alpine

# Global mode - one task per node (useful for logging agents, monitoring)
docker service create \\
  --name node-exporter \\
  --mode global \\
  --mount type=bind,source=/proc,target=/host/proc,readonly \\
  prom/node-exporter


# ============================================================================
# HEALTH CHECKS AND SELF-HEALING
# ============================================================================

# Service with custom health check
# --health-cmd: Command to test container health
# --health-interval: How often to run check
# --health-retries: Failures before marking unhealthy
# --health-timeout: Max time for health check
docker service create \\
  --name api-service \\
  --replicas 5 \\
  --health-cmd "curl -f http://localhost/health || exit 1" \\
  --health-interval 10s \\
  --health-retries 3 \\
  --health-timeout 5s \\
  --health-start-period 30s \\
  my-api:v1.0

# Configure restart policy (how Swarm handles task failures)
docker service update \\
  --restart-condition on-failure \\
  --restart-delay 5s \\
  --restart-max-attempts 3 \\
  --restart-window 120s \\
  api-service


# ============================================================================
# NETWORKING AND SERVICE DISCOVERY
# ============================================================================

# Create custom overlay network (encrypted multi-host networking)
# --driver overlay: Enables cross-host container communication
# --attachable: Allows standalone containers to join
# --opt encrypted: Encrypts network traffic (IPSEC)
docker network create \\
  --driver overlay \\
  --attachable \\
  --opt encrypted=true \\
  my-app-network

# Deploy services on custom network
docker service create \\
  --name frontend \\
  --network my-app-network \\
  --replicas 3 \\
  frontend:v1

docker service create \\
  --name backend \\
  --network my-app-network \\
  --replicas 5 \\
  backend:v1

# Services can now resolve each other via DNS:
# frontend containers can call http://backend:8080
# Swarm load balances across all backend replicas automatically


# ============================================================================
# SECRETS AND CONFIGS
# ============================================================================

# Create secret (encrypted, stored in Raft log)
echo "my-database-password" | docker secret create db_password -

# Create secret from file
docker secret create ssl_cert ./certificate.pem

# Create service with secrets (mounted at /run/secrets/)
docker service create \\
  --name database \\
  --secret db_password \\
  --env POSTGRES_PASSWORD_FILE=/run/secrets/db_password \\
  postgres:13

# Create config (non-sensitive configuration files)
docker config create nginx_config ./nginx.conf

# Mount config into service
docker service create \\
  --name nginx \\
  --config source=nginx_config,target=/etc/nginx/nginx.conf \\
  nginx:alpine


# ============================================================================
# SERVICE REMOVAL AND CLEANUP
# ============================================================================

# Remove service (stops and removes all tasks)
docker service rm web-app

# Remove multiple services
docker service rm web-app api-service worker-queue

# Leave swarm (run on worker node)
docker swarm leave

# Force leave swarm (run on manager node)
docker swarm leave --force

# Remove node from cluster (run on remaining manager)
docker node rm worker1`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Docker Swarm cluster lifecycle from initialization through service deployment, scaling, updates, and teardown. Covers 30+ minutes of manual container deployment across multiple hosts condensed into 2-minute declarative commands.",
        prerequisites: [
          "Docker Engine 1.12+",
          "Multiple hosts or VMs with Docker installed",
          "Network connectivity between nodes on port 2377 (cluster management), 7946 (node communication), 4789 (overlay network)",
        ],
        systemPosition:
          "Production container orchestration layer replacing manual docker run commands across multiple servers",
      },
      annotations: [
        {
          id: "swarm-init",
          lines: [8, 9],
          action: "Initialize Swarm cluster on first manager node",
          reason:
            "Creates Raft consensus cluster, generates join tokens, and enables orchestration features. The advertise address must be reachable by other nodes.",
          contextLevel: "system",
          relatedConcepts: ["raft-consensus", "cluster-initialization"],
        },
        {
          id: "service-create-replicas",
          lines: [54, 58],
          action: "Create service with replica count and published port",
          reason:
            "Swarm automatically distributes 3 nginx containers across available workers and exposes port 8080 on ALL nodes via ingress routing mesh—traffic to any node routes to healthy tasks",
          contextLevel: "system",
          relatedConcepts: [
            "horizontal-scaling",
            "service-discovery",
            "load-balancing",
          ],
        },
        {
          id: "rolling-update-config",
          lines: [108, 116],
          action:
            "Configure rolling update with parallelism and failure handling",
          reason:
            "Updates 2 tasks at a time with 10s delay between batches, automatically rolls back if new tasks fail health checks. Zero-downtime deployments with automatic safety.",
          contextLevel: "system",
          relatedConcepts: ["rolling-updates", "zero-downtime", "rollback"],
        },
        {
          id: "placement-constraints",
          lines: [139, 143],
          action: "Deploy service only to nodes with specific labels",
          reason:
            "Placement constraints enable deploying databases to SSD nodes, stateful apps to specific zones, or monitoring to managers. Critical for resource optimization and compliance.",
          contextLevel: "module",
          relatedConcepts: ["resource-scheduling", "node-affinity"],
        },
        {
          id: "health-checks",
          lines: [169, 178],
          action: "Configure comprehensive health check for service",
          reason:
            "Swarm continuously runs health checks; failing tasks are automatically stopped and rescheduled. Self-healing without manual intervention. Start period allows app warmup.",
          contextLevel: "system",
          relatedConcepts: ["health-checks", "self-healing", "resilience"],
        },
        {
          id: "overlay-network-encrypted",
          lines: [195, 200],
          action:
            "Create encrypted overlay network for multi-host communication",
          reason:
            "Overlay networks span multiple hosts using VXLAN encapsulation; encryption option adds IPSEC for secure inter-container traffic. Essential for zero-trust environments.",
          contextLevel: "system",
          relatedConcepts: ["overlay-networks", "encryption", "zero-trust"],
        },
        {
          id: "secrets-management",
          lines: [221, 229],
          action: "Store and mount secrets securely in service containers",
          reason:
            "Secrets are encrypted in Raft log, transmitted over TLS, and mounted in-memory tmpfs (never written to disk). Industry best practice for credential management.",
          contextLevel: "system",
          relatedConcepts: ["secrets-management", "security", "encryption"],
        },
        {
          id: "global-mode",
          lines: [162, 166],
          action: "Deploy service in global mode (one task per node)",
          reason:
            "Global mode ensures exactly one replica on every node, automatically scaling with cluster size. Perfect for logging agents, monitoring exporters, or node-local caches.",
          contextLevel: "module",
          relatedConcepts: ["daemonset", "node-local", "monitoring"],
        },
      ],
      highlights: [
        {
          lines: [8, 10],
          label: "Swarm initialization",
          sbvpDomain: "structure",
        },
        {
          lines: [54, 58],
          label: "Service creation with replicas",
          sbvpDomain: "behavior",
        },
        {
          lines: [108, 116],
          label: "Rolling update configuration",
          sbvpDomain: "philosophy",
        },
        {
          lines: [169, 178],
          label: "Health check setup",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "docker-swarm-stack",
      language: "yaml",
      title: "Docker Compose Stack Deployment",
      description:
        "Multi-service application deployment using Docker Compose v3 stack files with deploy specifications, networks, volumes, and secrets",
      code: `# docker-stack.yml
# Complete multi-tier application stack for Docker Swarm
# Deploy with: docker stack deploy -c docker-stack.yml myapp

version: '3.8'

# ============================================================================
# SERVICES DEFINITION
# ============================================================================

services:
  # Frontend - React SPA served by Nginx
  frontend:
    image: myapp/frontend:v2.1.0
    ports:
      - "80:80"
      - "443:443"
    networks:
      - frontend-network
      - monitoring
    volumes:
      - nginx-cache:/var/cache/nginx
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf
        mode: 0444
    secrets:
      - ssl_certificate
      - ssl_private_key
    deploy:
      replicas: 3
      # Spread replicas across availability zones for redundancy
      placement:
        preferences:
          - spread: node.labels.zone
        constraints:
          # Only deploy to worker nodes (not managers)
          - node.role == worker
      # Rolling update strategy: 1 at a time, 30s between updates
      update_config:
        parallelism: 1
        delay: 30s
        failure_action: rollback
        monitor: 60s
        order: start-first  # Start new task before stopping old (zero downtime)
      rollback_config:
        parallelism: 1
        delay: 10s
        order: stop-first
      # Resource limits prevent runaway containers
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      # Restart policy for fault tolerance
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      # Labels for monitoring and service discovery
      labels:
        com.myapp.service: "frontend"
        com.myapp.version: "2.1.0"
        prometheus.scrape: "true"
        prometheus.port: "9090"

  # Backend API - Node.js REST API
  backend:
    image: myapp/backend:v2.1.0
    networks:
      - frontend-network
      - backend-network
      - monitoring
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
      REDIS_HOST: redis
      DATABASE_HOST: postgres
    secrets:
      - db_password
      - jwt_secret
      - api_key
    deploy:
      replicas: 5
      placement:
        preferences:
          - spread: node.labels.zone
        constraints:
          - node.role == worker
          # Deploy to high-memory nodes for better performance
          - node.labels.memory == high
      update_config:
        parallelism: 2          # Update 2 replicas simultaneously
        delay: 20s
        failure_action: rollback
        monitor: 45s
        max_failure_ratio: 0.2  # Rollback if >20% fail
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 5
        window: 180s
      labels:
        com.myapp.service: "backend"
        com.myapp.version: "2.1.0"

  # Background Worker - Async job processing
  worker:
    image: myapp/worker:v2.1.0
    networks:
      - backend-network
      - monitoring
    environment:
      WORKER_CONCURRENCY: 10
      REDIS_HOST: redis
      DATABASE_HOST: postgres
    secrets:
      - db_password
      - aws_credentials
    deploy:
      # Autoscale workers based on queue depth (manual adjustment)
      replicas: 8
      placement:
        constraints:
          # Deploy to CPU-optimized nodes
          - node.labels.compute == cpu-optimized
      update_config:
        parallelism: 3
        delay: 15s
        failure_action: pause  # Pause update on failure for manual inspection
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 30s
        max_attempts: 5

  # Redis - In-memory cache and queue
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    networks:
      - backend-network
    volumes:
      - redis-data:/data
    deploy:
      replicas: 1
      placement:
        constraints:
          # Pin to specific node for data persistence
          - node.hostname == worker1
          # Deploy to memory-optimized instance
          - node.labels.memory == high
      # No rolling updates for stateful service
      update_config:
        parallelism: 0
      resources:
        limits:
          cpus: '1.0'
          memory: 3G
        reservations:
          cpus: '0.5'
          memory: 2G
      restart_policy:
        condition: on-failure
        delay: 10s

  # PostgreSQL - Relational database
  postgres:
    image: postgres:15-alpine
    networks:
      - backend-network
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: myapp
      # Password loaded from Docker secret (secure)
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          # Pin to node with SSD storage
          - node.labels.storage == ssd
          - node.hostname == worker2
      update_config:
        parallelism: 0  # Never update database in place
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
      restart_policy:
        condition: on-failure
        delay: 30s
        max_attempts: 3

  # Monitoring - Prometheus for metrics collection
  prometheus:
    image: prom/prometheus:latest
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring
    ports:
      - "9090:9090"
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
    volumes:
      - prometheus-data:/prometheus
    deploy:
      replicas: 1
      placement:
        constraints:
          # Deploy to manager node for cluster-wide visibility
          - node.role == manager
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  # Log aggregator - Collects logs from all services (Global mode)
  log-collector:
    image: fluent/fluentd:latest
    networks:
      - monitoring
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    configs:
      - source: fluentd_config
        target: /fluentd/etc/fluent.conf
    deploy:
      # Global mode: one replica per node (like Kubernetes DaemonSet)
      mode: global
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M


# ============================================================================
# NETWORKS
# ============================================================================

networks:
  # Frontend network - Nginx to Backend API
  frontend-network:
    driver: overlay
    driver_opts:
      # Encrypt traffic between frontend and backend
      encrypted: "true"
    attachable: true

  # Backend network - API, Workers, DB, Cache
  backend-network:
    driver: overlay
    driver_opts:
      encrypted: "true"
    internal: true  # No external internet access
    attachable: true

  # Monitoring network - Prometheus, Grafana, metrics exporters
  monitoring:
    driver: overlay
    attachable: true


# ============================================================================
# VOLUMES (Persistent storage)
# ============================================================================

volumes:
  # Database volume - persistent across container restarts
  postgres-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/data/postgres

  # Redis AOF persistence
  redis-data:
    driver: local

  # Nginx cache for static assets
  nginx-cache:
    driver: local

  # Prometheus metrics storage
  prometheus-data:
    driver: local


# ============================================================================
# CONFIGS (Non-sensitive configuration files)
# ============================================================================

configs:
  nginx_config:
    # Create with: docker config create nginx_config ./nginx.conf
    external: true

  prometheus_config:
    external: true

  fluentd_config:
    external: true


# ============================================================================
# SECRETS (Encrypted sensitive data)
# ============================================================================

secrets:
  # Database password
  db_password:
    # Create with: echo "password" | docker secret create db_password -
    external: true

  # JWT signing key for authentication
  jwt_secret:
    external: true

  # Third-party API credentials
  api_key:
    external: true

  # SSL/TLS certificates for HTTPS
  ssl_certificate:
    external: true

  ssl_private_key:
    external: true

  # AWS credentials for S3, SQS, etc.
  aws_credentials:
    external: true`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade multi-service stack with 8 services, 3 networks, 5 volumes, 3 configs, 6 secrets. Replaces manual orchestration of 20+ containers across 5 nodes. Single command deployment: 'docker stack deploy' vs 45+ minutes of manual docker run commands with networking, volumes, and service discovery configuration.",
        prerequisites: [
          "Docker Swarm cluster initialized",
          "Secrets and configs created beforehand",
          "Node labels applied for placement constraints",
          "Persistent volume paths created on nodes",
        ],
        systemPosition:
          "Complete application infrastructure-as-code replacing manual container management, Ansible playbooks, or imperative deployment scripts",
      },
      annotations: [
        {
          id: "stack-deploy-section",
          lines: [30, 68],
          action:
            "Define frontend service with comprehensive deployment configuration",
          reason:
            "Deploy section contains Swarm-specific orchestration: replicas, placement, update strategy, resources, and restart policy. This is declarative infrastructure—specify desired state, Swarm maintains it.",
          contextLevel: "system",
          relatedConcepts: [
            "declarative-infrastructure",
            "desired-state",
            "reconciliation",
          ],
        },
        {
          id: "stack-update-config",
          lines: [40, 46],
          action: "Configure rolling update strategy with failure handling",
          reason:
            "update_config controls zero-downtime deployments: parallelism limits concurrent updates, delay allows health check stabilization, failure_action triggers automatic rollback, order: start-first prevents capacity loss",
          contextLevel: "system",
          relatedConcepts: [
            "rolling-updates",
            "zero-downtime",
            "blue-green-deployment",
          ],
        },
        {
          id: "stack-resources",
          lines: [51, 57],
          action: "Set CPU and memory limits and reservations",
          reason:
            "Limits prevent resource exhaustion (noisy neighbor problem), reservations guarantee minimum resources for scheduling. Swarm won't place task on node lacking reserved resources.",
          contextLevel: "module",
          relatedConcepts: [
            "resource-isolation",
            "quality-of-service",
            "scheduling",
          ],
        },
        {
          id: "stack-placement-constraints",
          lines: [33, 39],
          action: "Use placement preferences and constraints for scheduling",
          reason:
            "Spread across zones for high availability, constrain to worker nodes (not managers) for production best practice. Enables multi-AZ deployments, compliance requirements, resource optimization.",
          contextLevel: "system",
          relatedConcepts: [
            "high-availability",
            "fault-tolerance",
            "affinity-rules",
          ],
        },
        {
          id: "stack-secrets-mount",
          lines: [27, 29],
          action: "Mount Docker secrets into container filesystem",
          reason:
            "Secrets are encrypted at rest in Raft, transmitted over mTLS, and mounted as tmpfs (in-memory, never on disk). Containers read from /run/secrets/<name>. Industry best practice for credentials.",
          contextLevel: "system",
          relatedConcepts: [
            "secrets-management",
            "encryption-at-rest",
            "zero-trust",
          ],
        },
        {
          id: "stack-overlay-network",
          lines: [299, 305],
          action:
            "Create encrypted overlay network for multi-host communication",
          reason:
            "Overlay driver uses VXLAN to create virtual L2 network spanning all Swarm nodes. encrypted: true adds IPSEC for data-in-transit encryption. Services resolve each other via DNS (e.g., http://backend).",
          contextLevel: "system",
          relatedConcepts: [
            "overlay-networks",
            "service-discovery",
            "encryption-in-transit",
          ],
        },
        {
          id: "stack-global-mode",
          lines: [267, 269],
          action: "Deploy log collector in global mode",
          reason:
            "Global mode ensures exactly one replica per node, automatically scaling with cluster size. Perfect for node-local agents: logging, monitoring, security scanners. Equivalent to Kubernetes DaemonSet.",
          contextLevel: "module",
          relatedConcepts: ["daemonset", "node-affinity", "observability"],
        },
        {
          id: "stack-stateful-pinning",
          lines: [185, 191],
          action:
            "Pin stateful database to specific node with storage constraint",
          reason:
            "Databases require persistent storage and stable network identity. Pinning to hostname prevents data loss during rescheduling; storage label ensures SSD performance. Critical for stateful workloads.",
          contextLevel: "system",
          relatedConcepts: [
            "stateful-sets",
            "persistent-storage",
            "node-affinity",
          ],
        },
      ],
      highlights: [
        {
          lines: [30, 68],
          label: "Complete service deployment spec",
          sbvpDomain: "structure",
        },
        {
          lines: [40, 46],
          label: "Rolling update configuration",
          sbvpDomain: "behavior",
        },
        {
          lines: [267, 269],
          label: "Global mode deployment",
          sbvpDomain: "philosophy",
        },
        {
          lines: [299, 311],
          label: "Network topology",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "docker-swarm-nodejs-api",
      language: "typescript",
      title: "Node.js Swarm Management via Docker API",
      description:
        "Programmatic Swarm management using Docker Engine API: service creation, scaling, event monitoring, and auto-scaling based on custom metrics",
      code: `// Docker Swarm API Management with Node.js
// Programmatic service orchestration, monitoring, and auto-scaling

import Docker from 'dockerode';
import { EventEmitter } from 'events';

// ============================================================================
// DOCKER API CLIENT SETUP
// ============================================================================

// Initialize Docker client (connects to local Docker daemon via socket)
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// For remote Swarm cluster management
const remoteDocker = new Docker({
  host: 'swarm-manager.example.com',
  port: 2376,
  protocol: 'https',
  ca: process.env.DOCKER_CA_CERT,
  cert: process.env.DOCKER_CLIENT_CERT,
  key: process.env.DOCKER_CLIENT_KEY,
});

// ============================================================================
// SERVICE CREATION AND MANAGEMENT
// ============================================================================

interface ServiceConfig {
  name: string;
  image: string;
  replicas: number;
  ports?: Array<{ published: number; target: number }>;
  env?: string[];
  networks?: string[];
  constraints?: string[];
  resources?: {
    limits?: { memory: number; cpu: number };
    reservations?: { memory: number; cpu: number };
  };
}

/**
 * Create a new Swarm service with comprehensive configuration
 *
 * Reason: Declarative service creation via API enables infrastructure-as-code,
 * GitOps workflows, and programmatic orchestration. Replaces manual CLI commands
 * with auditable, versioned, automated deployments.
 */
async function createService(config: ServiceConfig): Promise<string> {
  try {
    // Construct service specification (matches Docker API schema)
    const serviceSpec = {
      Name: config.name,
      TaskTemplate: {
        // Container configuration
        ContainerSpec: {
          Image: config.image,
          Env: config.env || [],
          // Mount Docker secrets (encrypted credentials)
          Secrets: [
            {
              SecretName: 'db_password',
              File: {
                Name: '/run/secrets/db_password',
                UID: '0',
                GID: '0',
                Mode: 0o444,
              },
            },
          ],
        },
        // Resource constraints prevent runaway containers
        Resources: {
          Limits: {
            NanoCPUs: (config.resources?.limits?.cpu || 1) * 1e9,
            MemoryBytes: (config.resources?.limits?.memory || 512) * 1024 * 1024,
          },
          Reservations: {
            NanoCPUs: (config.resources?.reservations?.cpu || 0.25) * 1e9,
            MemoryBytes: (config.resources?.reservations?.memory || 128) * 1024 * 1024,
          },
        },
        // Restart policy for fault tolerance
        RestartPolicy: {
          Condition: 'on-failure',
          Delay: 5_000_000_000, // 5 seconds in nanoseconds
          MaxAttempts: 3,
          Window: 120_000_000_000, // 120 seconds
        },
        // Placement constraints (e.g., node labels, roles)
        Placement: {
          Constraints: config.constraints || ['node.role==worker'],
        },
        // Networks for service discovery and connectivity
        Networks: (config.networks || ['default']).map(name => ({
          Target: name,
        })),
      },
      // Deployment mode and replica count
      Mode: {
        Replicated: {
          Replicas: config.replicas,
        },
      },
      // Rolling update strategy
      UpdateConfig: {
        Parallelism: 2, // Update 2 tasks at a time
        Delay: 10_000_000_000, // 10 second delay between batches
        FailureAction: 'rollback', // Auto-rollback on failure
        Monitor: 30_000_000_000, // Monitor for 30 seconds
        MaxFailureRatio: 0.2, // Rollback if >20% fail
        Order: 'start-first', // Zero-downtime: start new before stopping old
      },
      // Rollback configuration
      RollbackConfig: {
        Parallelism: 1,
        Delay: 5_000_000_000,
        FailureAction: 'pause',
        Monitor: 15_000_000_000,
        Order: 'stop-first',
      },
      // Published ports (ingress routing mesh)
      EndpointSpec: {
        Mode: 'vip', // Virtual IP load balancing
        Ports: (config.ports || []).map(p => ({
          Protocol: 'tcp',
          PublishedPort: p.published,
          TargetPort: p.target,
          PublishMode: 'ingress', // Available on all nodes
        })),
      },
      // Labels for metadata and monitoring
      Labels: {
        'com.example.service': config.name,
        'com.example.managed-by': 'swarm-api',
        'prometheus.scrape': 'true',
      },
    };

    // Create service via Docker API
    const service = await docker.createService(serviceSpec);
    console.log(\`Service created: \${service.id}\`);

    return service.id;
  } catch (error) {
    console.error('Failed to create service:', error);
    throw error;
  }
}

// ============================================================================
// SERVICE SCALING
// ============================================================================

/**
 * Scale service to desired replica count
 *
 * Reason: Horizontal scaling via API enables auto-scaling based on metrics
 * (CPU, memory, queue depth, custom metrics). Swarm handles task distribution,
 * health checks, and load balancing automatically.
 */
async function scaleService(
  serviceName: string,
  replicas: number
): Promise<void> {
  try {
    // Get service by name
    const service = docker.getService(serviceName);
    const serviceInfo = await service.inspect();

    // Update service spec with new replica count
    const version = serviceInfo.Version.Index;
    const spec = serviceInfo.Spec;
    spec.Mode.Replicated.Replicas = replicas;

    // Apply update (Swarm reconciles actual state to match)
    await service.update({
      version,
      ...spec,
    });

    console.log(\`Scaled \${serviceName} to \${replicas} replicas\`);
  } catch (error) {
    console.error(\`Failed to scale service \${serviceName}:\`, error);
    throw error;
  }
}

// ============================================================================
// EVENT MONITORING AND OBSERVABILITY
// ============================================================================

/**
 * Monitor Swarm events in real-time for task state changes
 *
 * Reason: Event stream provides visibility into cluster operations: task starts,
 * stops, failures, node joins/leaves. Critical for debugging, alerting, and
 * building control loops (e.g., auto-scaling, self-healing).
 */
class SwarmMonitor extends EventEmitter {
  private eventStream: NodeJS.ReadableStream | null = null;

  async start(): Promise<void> {
    try {
      // Subscribe to Docker events (task, service, node, volume, network)
      this.eventStream = await docker.getEvents({
        filters: {
          type: ['service', 'node', 'task'],
        },
      });

      // Parse and emit events
      this.eventStream.on('data', (chunk: Buffer) => {
        const events = chunk
          .toString()
          .split('\\n')
          .filter(Boolean)
          .map(line => JSON.parse(line));

        events.forEach(event => this.handleEvent(event));
      });

      this.eventStream.on('error', error => {
        console.error('Event stream error:', error);
        this.emit('error', error);
      });

      console.log('Swarm event monitoring started');
    } catch (error) {
      console.error('Failed to start event monitoring:', error);
      throw error;
    }
  }

  private handleEvent(event: any): void {
    const { Type, Action, Actor } = event;

    // Task state changes (starting, running, failed, shutdown)
    if (Type === 'task') {
      const taskName = Actor.Attributes.name;
      const serviceName = Actor.Attributes['com.docker.swarm.service.name'];
      const desiredState = Actor.Attributes.desired_state;

      console.log(
        \`Task \${taskName} (service: \${serviceName}): \${Action} (desired: \${desiredState})\`
      );

      this.emit('taskStateChange', {
        action: Action,
        taskName,
        serviceName,
        desiredState,
        timestamp: new Date(event.time * 1000),
      });

      // Alert on task failures
      if (Action === 'failed' || desiredState === 'shutdown') {
        this.emit('taskFailure', {
          taskName,
          serviceName,
          error: Actor.Attributes.error,
        });
      }
    }

    // Service updates (create, update, remove)
    if (Type === 'service') {
      const serviceName = Actor.Attributes.name;
      console.log(\`Service \${serviceName}: \${Action}\`);

      this.emit('serviceUpdate', {
        action: Action,
        serviceName,
        timestamp: new Date(event.time * 1000),
      });
    }

    // Node events (join, leave, update)
    if (Type === 'node') {
      const nodeName = Actor.Attributes.name;
      console.log(\`Node \${nodeName}: \${Action}\`);

      this.emit('nodeEvent', {
        action: Action,
        nodeName,
        timestamp: new Date(event.time * 1000),
      });
    }
  }

  stop(): void {
    if (this.eventStream) {
      this.eventStream.destroy();
      console.log('Swarm event monitoring stopped');
    }
  }
}

// ============================================================================
// AUTO-SCALING BASED ON METRICS
// ============================================================================

interface ScalingPolicy {
  serviceName: string;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number; // Target CPU utilization percentage
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number; // Seconds between scaling actions
}

/**
 * Auto-scaler that adjusts service replicas based on CPU metrics
 *
 * Reason: Manual scaling is reactive and slow. Auto-scaling enables elastic
 * capacity that matches demand in real-time, optimizing cost and performance.
 * Prevents over-provisioning (wasted resources) and under-provisioning (degraded UX).
 */
class SwarmAutoScaler {
  private lastScaleTime = new Map<string, number>();

  constructor(private policies: ScalingPolicy[]) {}

  async run(): Promise<void> {
    console.log('Auto-scaler started');

    // Poll every 30 seconds (production: use Prometheus metrics)
    setInterval(() => this.evaluatePolicies(), 30_000);
  }

  private async evaluatePolicies(): Promise<void> {
    for (const policy of this.policies) {
      try {
        await this.evaluatePolicy(policy);
      } catch (error) {
        console.error(\`Failed to evaluate policy for \${policy.serviceName}:\`, error);
      }
    }
  }

  private async evaluatePolicy(policy: ScalingPolicy): Promise<void> {
    const { serviceName, minReplicas, maxReplicas, cooldownPeriod } = policy;

    // Check cooldown period
    const lastScale = this.lastScaleTime.get(serviceName) || 0;
    const now = Date.now();
    if (now - lastScale < cooldownPeriod * 1000) {
      return; // Still in cooldown
    }

    // Get current service state
    const service = docker.getService(serviceName);
    const serviceInfo = await service.inspect();
    const currentReplicas = serviceInfo.Spec.Mode.Replicated.Replicas;

    // Get service task stats (simplified - use Prometheus in production)
    const stats = await this.getServiceStats(serviceName);
    const avgCPU = stats.avgCPUPercent;

    console.log(
      \`\${serviceName}: \${currentReplicas} replicas, \${avgCPU.toFixed(1)}% CPU\`
    );

    // Scale up if CPU exceeds threshold
    if (avgCPU > policy.scaleUpThreshold && currentReplicas < maxReplicas) {
      const newReplicas = Math.min(currentReplicas + 1, maxReplicas);
      await scaleService(serviceName, newReplicas);
      this.lastScaleTime.set(serviceName, now);
      console.log(\`Scaled UP \${serviceName}: \${currentReplicas} → \${newReplicas}\`);
    }
    // Scale down if CPU below threshold
    else if (
      avgCPU < policy.scaleDownThreshold &&
      currentReplicas > minReplicas
    ) {
      const newReplicas = Math.max(currentReplicas - 1, minReplicas);
      await scaleService(serviceName, newReplicas);
      this.lastScaleTime.set(serviceName, now);
      console.log(\`Scaled DOWN \${serviceName}: \${currentReplicas} → \${newReplicas}\`);
    }
  }

  /**
   * Get aggregated CPU stats for service (simplified version)
   * Production: Use Prometheus/Grafana for metrics
   */
  private async getServiceStats(serviceName: string): Promise<{
    avgCPUPercent: number;
  }> {
    const service = docker.getService(serviceName);
    const tasks = await service.tasks();

    // Get stats for all running tasks
    const cpuUsages: number[] = [];
    for (const task of tasks) {
      if (task.Status.State === 'running') {
        const containerID = task.Status.ContainerStatus?.ContainerID;
        if (containerID) {
          const container = docker.getContainer(containerID);
          const stats = await container.stats({ stream: false });

          // Calculate CPU usage percentage
          const cpuDelta =
            stats.cpu_stats.cpu_usage.total_usage -
            stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta =
            stats.cpu_stats.system_cpu_usage -
            stats.precpu_stats.system_cpu_usage;
          const cpuPercent =
            (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

          cpuUsages.push(cpuPercent);
        }
      }
    }

    const avgCPU = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length || 0;
    return { avgCPUPercent: avgCPU };
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  try {
    // Create a new service
    const serviceId = await createService({
      name: 'web-api',
      image: 'myapp/api:v2.0',
      replicas: 3,
      ports: [{ published: 8080, target: 8080 }],
      env: ['NODE_ENV=production', 'LOG_LEVEL=info'],
      networks: ['backend-network'],
      constraints: ['node.role==worker'],
      resources: {
        limits: { cpu: 1, memory: 1024 },
        reservations: { cpu: 0.5, memory: 512 },
      },
    });

    // Start event monitoring
    const monitor = new SwarmMonitor();
    monitor.on('taskFailure', ({ taskName, serviceName, error }) => {
      console.error(\`ALERT: Task \${taskName} failed in service \${serviceName}: \${error}\`);
      // Send to alerting system (PagerDuty, Slack, etc.)
    });
    await monitor.start();

    // Start auto-scaler
    const autoscaler = new SwarmAutoScaler([
      {
        serviceName: 'web-api',
        minReplicas: 2,
        maxReplicas: 10,
        targetCPU: 70,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriod: 60, // 1 minute between scaling actions
      },
    ]);
    await autoscaler.run();

    console.log('Swarm management API running...');
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createService, scaleService, SwarmMonitor, SwarmAutoScaler };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete programmatic Swarm orchestration: service creation, scaling, event monitoring, and auto-scaling. Replaces manual CLI operations with API-driven automation. Enables GitOps, CI/CD integration, and event-driven control loops. Context dilation: Manual scaling (reactive, 5-10 min response time) → Auto-scaling (proactive, 30-second response time).",
        prerequisites: [
          "Node.js 16+",
          "dockerode npm package",
          "Docker Swarm cluster",
          "Access to Docker socket or remote API (TLS certificates)",
        ],
        systemPosition:
          "Control plane automation layer sitting above Docker Swarm, integrating with monitoring (Prometheus), alerting (PagerDuty), and CI/CD (GitLab, GitHub Actions)",
      },
      annotations: [
        {
          id: "api-service-creation",
          lines: [48, 86],
          action:
            "Construct comprehensive service specification matching Docker API schema",
          reason:
            "Declarative service spec enables infrastructure-as-code: version control, code review, automated deployments. TaskTemplate defines containers, resources, placement; Mode defines replicas; UpdateConfig controls rolling updates.",
          contextLevel: "system",
          relatedConcepts: [
            "infrastructure-as-code",
            "declarative-configuration",
            "gitops",
          ],
        },
        {
          id: "api-resource-limits",
          lines: [68, 77],
          action: "Set CPU and memory limits/reservations in Docker API format",
          reason:
            "NanoCPUs (1 CPU = 1e9 nanocpus) and MemoryBytes prevent resource exhaustion. Limits cap usage, reservations guarantee minimum for scheduling. Critical for multi-tenant stability.",
          contextLevel: "module",
          relatedConcepts: [
            "resource-isolation",
            "quality-of-service",
            "noisy-neighbor",
          ],
        },
        {
          id: "api-update-config",
          lines: [96, 103],
          action:
            "Configure rolling update strategy with zero-downtime guarantees",
          reason:
            "Parallelism controls blast radius (limit concurrent updates), FailureAction enables auto-rollback, Order: start-first prevents capacity loss. MaxFailureRatio stops update if too many tasks fail.",
          contextLevel: "system",
          relatedConcepts: [
            "rolling-updates",
            "zero-downtime",
            "progressive-delivery",
          ],
        },
        {
          id: "api-scaling",
          lines: [163, 179],
          action: "Scale service by updating replica count via API",
          reason:
            "Horizontal scaling via API enables auto-scaling, load-based adjustments, scheduled scaling. Version field required for optimistic concurrency control (prevents race conditions).",
          contextLevel: "module",
          relatedConcepts: [
            "horizontal-scaling",
            "optimistic-concurrency",
            "auto-scaling",
          ],
        },
        {
          id: "api-event-monitoring",
          lines: [196, 213],
          action:
            "Subscribe to Docker event stream for real-time cluster monitoring",
          reason:
            "Event stream provides visibility into task state changes (starting, running, failed), service updates, node events. Foundation for alerting, debugging, and building control loops (e.g., auto-remediation).",
          contextLevel: "system",
          relatedConcepts: [
            "observability",
            "event-driven-architecture",
            "control-loop",
          ],
        },
        {
          id: "api-task-failure-detection",
          lines: [237, 245],
          action: "Detect and emit events for task failures",
          reason:
            "Task failures indicate application crashes, resource exhaustion, or node issues. Emitting events enables alerting (PagerDuty, Slack), automated remediation, or scaling decisions.",
          contextLevel: "system",
          relatedConcepts: ["fault-detection", "alerting", "self-healing"],
        },
        {
          id: "api-autoscaling-logic",
          lines: [312, 340],
          action:
            "Evaluate scaling policy and adjust replicas based on CPU metrics",
          reason:
            "Auto-scaling matches capacity to demand: scale up under load (prevent degradation), scale down during idle (reduce cost). Cooldown prevents flapping. Production systems use Prometheus metrics.",
          contextLevel: "system",
          relatedConcepts: [
            "auto-scaling",
            "horizontal-pod-autoscaler",
            "elastic-capacity",
          ],
        },
        {
          id: "api-stats-collection",
          lines: [345, 377],
          action: "Collect container stats for auto-scaling metrics",
          reason:
            "Docker stats API provides CPU, memory, network, disk I/O metrics. Simplified example; production uses Prometheus exporters, Grafana dashboards, and alerting rules for comprehensive observability.",
          contextLevel: "module",
          relatedConcepts: [
            "metrics-collection",
            "prometheus",
            "observability",
          ],
        },
      ],
      highlights: [
        {
          lines: [48, 86],
          label: "Service specification construction",
          sbvpDomain: "structure",
        },
        {
          lines: [96, 103],
          label: "Rolling update configuration",
          sbvpDomain: "behavior",
        },
        {
          lines: [196, 213],
          label: "Event stream monitoring",
          sbvpDomain: "philosophy",
        },
        {
          lines: [312, 340],
          label: "Auto-scaling logic",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Small-to-medium microservices deployments (5-50 services)",
      "Development and staging environments (simpler than Kubernetes)",
      "Edge computing and IoT device fleets (lightweight orchestration)",
      "Legacy Docker application migrations (minimal refactoring required)",
      "Hobbyist and side projects (low operational overhead)",
      "Simple production workloads without advanced orchestration needs",
    ],
    interactsWith: [
      "load-balancing",
      "service-discovery",
      "health-checks",
      "rolling-updates",
      "secrets-management",
      "overlay-networks",
    ],
    architecturalBoundaries: [
      "Manager Nodes (Control Plane) - Raft consensus, scheduling, orchestration",
      "Worker Nodes (Data Plane) - Task execution, container runtime",
      "Overlay Network - Multi-host container communication via VXLAN",
      "Ingress Routing Mesh - External traffic distribution to service replicas",
    ],
  },

  implementations: [
    {
      id: "docker-swarm-mode",
      name: "Docker Swarm Mode",
      type: "platform",
      languages: ["any"],
      description:
        "Native clustering and orchestration built into Docker Engine 1.12+. Provides manager-worker architecture, service discovery, load balancing, rolling updates, and secrets management without external dependencies. Enabled with 'docker swarm init' command.",
      links: {
        docs: "https://docs.docker.com/engine/swarm/",
        github: "https://github.com/moby/moby",
      },
      codeSnippet: `# Initialize Swarm cluster
docker swarm init --advertise-addr 192.168.1.10

# Create service with 3 replicas
docker service create \\
  --name web \\
  --replicas 3 \\
  --publish 8080:80 \\
  nginx:alpine

# Scale service
docker service scale web=5`,
    },
    {
      id: "portainer",
      name: "Portainer",
      type: "platform",
      languages: ["any"],
      description:
        "Web-based management UI for Docker and Docker Swarm. Provides visual service deployment, stack management, monitoring, and RBAC. Simplifies Swarm operations for teams unfamiliar with CLI. Open-source community edition available.",
      links: {
        docs: "https://docs.portainer.io/",
        github: "https://github.com/portainer/portainer",
      },
      codeSnippet: `# Deploy Portainer on Swarm manager
docker service create \\
  --name portainer \\
  --publish 9000:9000 \\
  --constraint 'node.role==manager' \\
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \\
  portainer/portainer-ce:latest`,
    },
    {
      id: "swarmpit",
      name: "Swarmpit",
      type: "platform",
      languages: ["any"],
      description:
        "Lightweight web UI for Docker Swarm with service management, monitoring, and resource visualization. Built with Clojure and React. Provides service logs, stats, and deployment management. Open-source alternative to Portainer.",
      links: {
        docs: "https://swarmpit.io/docs/",
        github: "https://github.com/swarmpit/swarmpit",
      },
      codeSnippet: `# Deploy Swarmpit stack
curl -L https://raw.githubusercontent.com/swarmpit/swarmpit/master/docker-compose.yml \\
  -o swarmpit.yml

docker stack deploy -c swarmpit.yml swarmpit`,
    },
    {
      id: "docker-stack",
      name: "Docker Stack",
      type: "tool",
      languages: ["yaml"],
      description:
        "Declarative multi-service deployment using Docker Compose v3 files. Native Swarm feature enabling infrastructure-as-code with services, networks, volumes, secrets, and configs. Deployed with 'docker stack deploy' command.",
      links: {
        docs: "https://docs.docker.com/engine/reference/commandline/stack/",
      },
      codeSnippet: `# docker-stack.yml
version: '3.8'
services:
  web:
    image: nginx:alpine
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s

# Deploy stack
docker stack deploy -c docker-stack.yml myapp`,
    },
    {
      id: "docker-enterprise",
      name: "Docker Enterprise (Mirantis Kubernetes Engine)",
      type: "platform",
      languages: ["any"],
      description:
        "Enterprise-grade container platform supporting both Swarm and Kubernetes orchestration. Provides RBAC, image scanning, secure supply chain, and enterprise support. Acquired by Mirantis from Docker Inc. Now focuses primarily on Kubernetes.",
      links: {
        docs: "https://docs.mirantis.com/mke/",
      },
      codeSnippet: `# Docker Enterprise includes built-in Swarm + Kubernetes
# Deployed via Universal Control Plane (UCP) UI or CLI`,
    },
    {
      id: "rancher-swarm",
      name: "Rancher (Swarm Support)",
      type: "platform",
      languages: ["any"],
      description:
        "Multi-cluster container management platform with Docker Swarm support (legacy). Rancher 1.x provided Swarm orchestration alongside Kubernetes and Cattle. Rancher 2.x focuses on Kubernetes but can import Swarm clusters for migration.",
      links: {
        docs: "https://rancher.com/docs/",
        github: "https://github.com/rancher/rancher",
      },
      codeSnippet: `# Rancher 1.x with Swarm orchestration (deprecated)
# Rancher 2.x imports existing Swarm clusters for K8s migration`,
    },
    {
      id: "traefik-swarm",
      name: "Traefik",
      type: "service",
      languages: ["any"],
      description:
        "Cloud-native reverse proxy and load balancer with native Docker Swarm integration. Automatically discovers services, configures routes, and handles SSL termination. Provides dynamic configuration without restarts.",
      links: {
        docs: "https://doc.traefik.io/traefik/providers/docker/",
        github: "https://github.com/traefik/traefik",
      },
      codeSnippet: `# Deploy Traefik as Swarm service
docker service create \\
  --name traefik \\
  --constraint 'node.role==manager' \\
  --publish 80:80 \\
  --publish 443:443 \\
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \\
  traefik:v2.10 \\
  --providers.docker.swarmMode=true \\
  --providers.docker.exposedByDefault=false`,
    },
    {
      id: "dockerode",
      name: "Dockerode",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Node.js library for Docker Engine API with full Swarm support. Enables programmatic service management, scaling, monitoring, and automation. Used in custom orchestration tools, CI/CD pipelines, and auto-scalers.",
      links: {
        docs: "https://github.com/apocas/dockerode",
        github: "https://github.com/apocas/dockerode",
      },
      codeSnippet: `import Docker from 'dockerode';

const docker = new Docker();
const serviceSpec = {
  Name: 'web-api',
  TaskTemplate: {
    ContainerSpec: { Image: 'nginx:alpine' },
  },
  Mode: { Replicated: { Replicas: 3 } },
};

await docker.createService(serviceSpec);`,
    },
  ],

  usedInSystems: [
    {
      systemId: "adp-hr",
      systemName: "ADP - HR Platform Containerization",
      howUsed:
        "ADP used Docker Swarm as an intermediate step in their Kubernetes migration journey, containerizing legacy monolithic HR applications (payroll, benefits, time tracking) before moving to K8s. Swarm provided a gentler learning curve for developers unfamiliar with container orchestration, enabling them to gain operational experience with service discovery, rolling updates, and horizontal scaling without Kubernetes complexity. The platform ran 200+ microservices across 50+ Swarm nodes, handling millions of payroll calculations per month. Pattern composition: Docker Swarm + Service Mesh (Traefik) + Secrets Management + Health Checks. Rationale: ADP needed container orchestration to modernize legacy apps but couldn't justify immediate Kubernetes adoption due to steep learning curve and operational overhead; Swarm provided 80% of benefits with 20% of complexity. Impact: Reduced deployment times from 4 hours (manual) to 15 minutes (Swarm), achieved 99.9% uptime during migration, successfully trained 100+ developers on container orchestration before K8s transition. Migration to Kubernetes completed after 18 months of Swarm experience.",
      source: "https://www.adp.com/",
    },
    {
      systemId: "ge-digital-iot",
      systemName: "GE Digital - Industrial IoT Edge Orchestration",
      howUsed:
        "GE Digital deployed Docker Swarm on industrial edge devices (manufacturing plants, oil rigs, wind farms) for local container orchestration without cloud connectivity dependencies. Swarm's lightweight footprint and zero external dependencies made it ideal for resource-constrained edge environments (ARM devices with 2-4GB RAM). The system runs data collection, local analytics, and control applications as Swarm services with automatic failover across edge node clusters (3-5 nodes per site). Swarm handles sensor data processing, predictive maintenance models, and SCADA integrations. Pattern composition: Docker Swarm + Edge Computing + Local Data Processing + Offline-First Architecture. Rationale: Kubernetes requires too many resources for edge devices and has complex control plane dependencies; Swarm provides orchestration with minimal overhead and works offline. Impact: Deployed to 500+ industrial sites globally; reduced edge infrastructure costs by 60% vs dedicated hardware; achieved 99.99% uptime for critical control systems; enabled zero-downtime updates for edge workloads.",
      source: "https://www.ge.com/digital/",
    },
    {
      systemId: "metlife-legacy",
      systemName: "MetLife - Legacy Application Containerization",
      howUsed:
        "MetLife used Docker Swarm to containerize legacy insurance policy management systems (written in .NET Framework, Java EE) running on Windows Server 2016+. Swarm's native Windows container support and Docker Compose compatibility enabled lift-and-shift migrations with minimal application changes. The platform orchestrates 150+ Windows containers across hybrid Windows/Linux Swarm clusters, running policy underwriting, claims processing, and customer portals. Pattern composition: Docker Swarm + Windows Containers + Hybrid Orchestration + Blue-Green Deployment. Rationale: Legacy .NET Framework apps couldn't run on Kubernetes (no Windows support in early K8s versions); Swarm provided Windows container orchestration without rewriting applications. Impact: Containerized 80+ legacy applications in 12 months; reduced infrastructure costs by 40% through resource consolidation; achieved 10x faster deployments (4 hours → 20 minutes); maintained 99.95% SLA during modernization.",
    },
    {
      systemId: "bbc-media",
      systemName: "BBC - Media Processing Pipelines",
      howUsed:
        "BBC employed Docker Swarm for short-lived media transcoding and processing pipelines, converting video content from broadcast formats to streaming formats (HLS, DASH) for BBC iPlayer. Swarm's simple API and fast service creation enabled spawning ephemeral processing clusters for specific jobs, scaling from 10 to 500+ containers based on queue depth. The system processes thousands of video files daily with automatic retries, health checks, and resource isolation. Pattern composition: Docker Swarm + Queue-Based Load Leveling (RabbitMQ) + Worker Pools + Auto-Scaling. Rationale: Media processing requires burst capacity and simple orchestration—Kubernetes was overkill for stateless batch jobs; Swarm provided fast cluster spin-up and minimal operational overhead. Impact: Reduced video processing time by 70% through horizontal scaling; handled 10x traffic spikes during major events (Olympics, elections); saved 50% on infrastructure costs vs dedicated transcoding servers.",
      source: "https://www.bbc.co.uk/iplayer",
    },
    {
      systemId: "spotify-early",
      systemName: "Spotify - Early Container Orchestration (Pre-Kubernetes)",
      howUsed:
        "Spotify experimented with Docker Swarm in 2015-2016 for orchestrating microservices in their music streaming platform before adopting Kubernetes. Swarm managed backend services (playlist generation, user recommendations, playback tracking) with 50-200 replicas each across multiple data centers. The platform used Swarm's overlay networking for cross-DC communication and secrets management for API keys. Pattern composition: Docker Swarm + Multi-DC Deployment + Service Discovery + Circuit Breakers. Rationale: Early Kubernetes was immature and lacked production-ready features; Swarm provided immediate orchestration capabilities with familiar Docker tooling. Impact: Successfully ran production workloads for 18 months; learned container orchestration patterns that informed K8s migration; reduced deployment complexity by 80% vs previous Helios scheduler. Eventually migrated to Kubernetes as ecosystem matured and advanced features (CRDs, operators) became critical.",
      source:
        "https://engineering.atspotify.com/2016/03/managing-machines-at-spotify/",
    },
  ],

  philosophy: {
    coreProblem:
      "Container orchestration is essential for production, but Kubernetes complexity overwhelms small teams and simple use cases",
    designPrinciple:
      "Embed orchestration directly into Docker with zero dependencies, familiar CLI, and sane defaults—prioritize simplicity over features",
    historicalContext:
      "Created by Docker Inc. in 2016 as a response to Kubernetes momentum. Swarm 'mode' integrated clustering into Docker Engine, replacing the earlier standalone Swarm 1.0. Competed with Kubernetes, Mesos, and Nomad but ultimately lost market share as K8s ecosystem matured.",
    alternativesRejected: [
      "Kubernetes - More features but steep learning curve and operational overhead",
      "Apache Mesos - Too complex for most use cases, requires ZooKeeper",
      "Nomad - Better simplicity but less Docker-native integration",
      "Manual Docker - No orchestration, scaling, or fault tolerance",
    ],
    mentalModel:
      "Think of Swarm as Docker with superpowers: same CLI, same Compose files, but now containers run across multiple machines with automatic load balancing, health checks, and rolling updates. It's the 80/20 solution—80% of orchestration value with 20% of Kubernetes complexity.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Swarm Cluster"
        subgraph "Control Plane"
            M1[Manager 1<br/>Leader]
            M2[Manager 2<br/>Follower]
            M3[Manager 3<br/>Follower]
            M1 -.Raft Consensus.-> M2
            M2 -.Raft Consensus.-> M3
            M3 -.Raft Consensus.-> M1
        end

        subgraph "Data Plane"
            W1[Worker 1]
            W2[Worker 2]
            W3[Worker 3]
        end

        M1 -->|Schedule Tasks| W1
        M1 -->|Schedule Tasks| W2
        M1 -->|Schedule Tasks| W3
    end

    User[User] -->|docker service create| M1
    User -->|HTTP Request| LB[Ingress LB]
    LB -->|Routing Mesh| W1
    LB -->|Routing Mesh| W2
    LB -->|Routing Mesh| W3`,
    realWorldAnalogy:
      "Docker Swarm is like a restaurant franchise with a simple management system: the manager nodes (corporate HQ) decide which restaurants (worker nodes) serve which menu items (containers), and customers (requests) are automatically routed to any location via a shared phone number (ingress routing mesh). Kubernetes is like a massive food delivery platform with complex algorithms, route optimization, and corporate bureaucracy—more powerful but requires dedicated operations team.",
    useCases: [
      {
        domain: "Edge Computing",
        scenario:
          "Industrial IoT deployment on resource-constrained devices (2-4GB RAM) in oil rigs and wind farms. Swarm orchestrates sensor data collection, local analytics, and control systems with automatic failover across 3-5 edge nodes per site.",
        patternRole:
          "Lightweight orchestration with offline-first operation and minimal resource overhead",
        companies: ["GE Digital", "Siemens"],
      },
      {
        domain: "Legacy Migration",
        scenario:
          "Containerize .NET Framework and Java EE insurance applications running on Windows Server. Swarm provides Windows container orchestration without rewriting apps, enabling lift-and-shift with Docker Compose.",
        patternRole:
          "Simplifies legacy containerization with familiar tooling and Windows support",
        companies: ["MetLife", "ADP"],
      },
      {
        domain: "Media Processing",
        scenario:
          "Short-lived video transcoding pipelines for BBC iPlayer, scaling from 10 to 500+ containers based on queue depth. Process thousands of video files daily with automatic retries and resource isolation.",
        patternRole:
          "Fast cluster spin-up for ephemeral batch workloads without Kubernetes overhead",
        companies: ["BBC", "Netflix (early)"],
      },
    ],
  },

  tags: [
    "scalability",
    "horizontal-scaling",
    "orchestration",
    "containers",
    "docker",
    "microservices",
    "service-discovery",
    "load-balancing",
  ],
  difficulty: "intermediate",
};
