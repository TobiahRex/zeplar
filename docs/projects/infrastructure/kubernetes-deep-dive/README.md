# Kubernetes Deep-Dive: From Core Concepts to Production Patterns

A temporal narrative through mastering Kubernetes—from understanding reconciliation loops to operating production-grade clusters.

> **Supporting Material**: Extends [DEVOPS_IMPLEMENTATION_GUIDE Phase 2](../../multi-agent-cognition/p1/DEVOPS_IMPLEMENTATION_GUIDE.md#phase-2-kubernetes-core) and integrates [DDIA Chapter 8: Distributed Systems Trouble](../../data-intensive-apps/part2-distributed-data/08-distributed-systems-trouble/README.md)

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Architecture Overview](#architecture-overview)
3. [Phase 0: Mental Model Foundation](#phase-0-mental-model-foundation)
4. [Phase 1: Core Concepts Mastery](#phase-1-core-concepts-mastery)
5. [Phase 2: Stateful Workloads](#phase-2-stateful-workloads)
6. [Phase 3: Networking Deep-Dive](#phase-3-networking-deep-dive)
7. [Phase 4: Observability Stack](#phase-4-observability-stack)
8. [Phase 5: Production Patterns](#phase-5-production-patterns)
9. [Troubleshooting Playbook](#troubleshooting-playbook)

---

## Philosophy

> **DDIA Reference**: [The Trouble with Distributed Systems](../../data-intensive-apps/part2-distributed-data/08-distributed-systems-trouble/README.md)

1. **The Reconciliation Loop is Everything** — Kubernetes doesn't execute commands. Controllers continuously compare desired state (your YAML) to actual state (what's running) and take actions to converge. This observe-diff-act loop runs forever. Understanding this loop is understanding Kubernetes.

2. **The API Server is the Single Source of Truth** — Every component talks through the API server. Every object is stored in etcd. There's no distributed state to reconcile—just one consistent store that everyone watches. If it's not in etcd, it doesn't exist.

3. **Labels and Selectors Create Relationships** — Nothing in Kubernetes uses names for relationships. Services find pods by labels. Deployments manage pods by labels. This indirection enables dynamic scaling, rolling updates, and declarative management.

4. **Resource Requests are Scheduling Promises** — When you request 500m CPU, you're reserving it on the node. The scheduler only places pods where requests fit. Under-request and pods get evicted under pressure; over-request and you waste capacity.

5. **Pods are Ephemeral, Services are Stable** — Pods come and go. Their IPs change on every restart. Services provide stable endpoints (ClusterIP, DNS name) that persist across pod restarts. Never hardcode pod IPs.

6. **Namespaces are Organizational, Not Security** — Namespaces group resources and enable quotas. They do NOT provide network isolation by default. NetworkPolicies provide network security; RBAC provides API security.

7. **Everything is an API Object** — Pods, Services, Secrets, ConfigMaps, Nodes—all are resources with a schema. This uniformity means you can extend Kubernetes with Custom Resource Definitions (CRDs) that behave identically to built-in resources.

8. **Controllers Turn Primitives into Behaviors** — A Deployment is a controller that manages ReplicaSets. A ReplicaSet is a controller that manages Pods. HPA is a controller that adjusts Deployment replicas. The power comes from composing controllers.

---

## Architecture Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#fff', 'primaryBorderColor': '#fff', 'lineColor': '#fff', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460'}}}%%
flowchart TB
    subgraph CONTROL["Control Plane"]
        API["API Server"]
        ETCD["etcd"]
        SCHED["Scheduler"]
        CM["Controller Manager"]
    end

    subgraph NODE1["Node 1"]
        KUB1["Kubelet"]
        PROXY1["kube-proxy"]
        POD1A["Pod A"]
        POD1B["Pod B"]
    end

    subgraph NODE2["Node 2"]
        KUB2["Kubelet"]
        PROXY2["kube-proxy"]
        POD2A["Pod C"]
        POD2B["Pod D"]
    end

    USER["kubectl"] --> API
    API <--> ETCD
    SCHED --> API
    CM --> API

    API --> KUB1
    API --> KUB2
    KUB1 --> POD1A
    KUB1 --> POD1B
    KUB2 --> POD2A
    KUB2 --> POD2B

    style CONTROL fill:#16213e,stroke:#e94560,stroke-width:2px
    style NODE1 fill:#0f3460,stroke:#fff,stroke-width:1px
    style NODE2 fill:#0f3460,stroke:#fff,stroke-width:1px
```

---

## Phase 0: Mental Model Foundation

### Objective

Internalize Kubernetes as a declarative state machine before touching kubectl. Understand *why* the reconciliation loop exists and *how* it enables self-healing.

### Philosophy

> **DEVOPS Reference**: [Phase 2: Kubernetes Core](../../multi-agent-cognition/p1/DEVOPS_IMPLEMENTATION_GUIDE.md#phase-2-kubernetes-core)

1. **Declarative Over Imperative** — You declare desired state ("I want 3 replicas"). Kubernetes figures out how to get there ("Start 2 more pods"). You don't script the steps; you describe the goal.

2. **The Reconciliation Loop** — Controllers run in infinite loops: observe current state, compare to desired state, take action, repeat. If a pod dies, the loop notices the diff and creates a new one. This is self-healing.

3. **Eventually Consistent** — Changes aren't instant. You update a Deployment, the controller sees it, creates a ReplicaSet, the ReplicaSet creates Pods, the Scheduler assigns nodes, Kubelets start containers. Each step takes time.

4. **Ownership via Labels** — A Deployment owns ReplicaSets that match its selector. A ReplicaSet owns Pods that match its selector. Ownership determines garbage collection—delete a Deployment, and its ReplicaSets and Pods delete too.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| Control loops | Observe-compare-act feedback loops | Think thermostat: measure temp, compare to target, adjust |
| etcd | Consistent key-value store using Raft | Distributed consensus basics |
| Containers | Isolated processes with own filesystem/network | Docker fundamentals |
| REST APIs | CRUD operations on resources via HTTP | HTTP methods, resource models |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Self-healing | Reconciliation loops | Dead pods replaced automatically |
| Rolling updates | Deployment controller + ReplicaSet management | Zero-downtime deploys |
| Service discovery | CoreDNS + label selectors | `http://my-svc` just works |
| Load balancing | kube-proxy + Endpoints | Traffic distributed to healthy pods |
| Declarative config | API objects + controllers | YAML describes intent, not steps |

### The Reconciliation Loop

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#fff', 'primaryBorderColor': '#fff', 'lineColor': '#fff', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460'}}}%%
flowchart LR
    subgraph LOOP["Reconciliation Loop"]
        direction TB
        OBSERVE["Observe<br>Current State"]
        DIFF["Compare to<br>Desired State"]
        ACT["Take<br>Action"]

        OBSERVE --> DIFF --> ACT --> OBSERVE
    end

    ETCD["etcd<br>(Desired State)"]
    CLUSTER["Cluster<br>(Current State)"]

    ETCD --> DIFF
    CLUSTER --> OBSERVE
    ACT --> CLUSTER

    style LOOP fill:#16213e,stroke:#e94560,stroke-width:2px
```

### t=0: The Mental Shift

**Developer Intent:** "I'm used to running commands. How does Kubernetes work differently?"

*What you're thinking:* "In traditional ops, I run `service restart nginx`. It's imperative—I'm telling the system what to do."

**The Kubernetes Way:**

```yaml
# This is a declaration of desired state
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3  # "I want 3 replicas"
  # ... rest of spec
```

*What you're thinking:* "I'm not saying 'start 3 pods.' I'm declaring that 3 pods should exist. Kubernetes figures out how to get there."

### t=1: Watching the Loop

**Developer Action:** Observe the reconciliation loop in action.

```bash
# In terminal 1: Watch pods
kubectl get pods -w

# In terminal 2: Create a deployment
kubectl create deployment nginx --image=nginx --replicas=3
```

**Terminal 1 shows:**
```
NAME                     READY   STATUS    RESTARTS   AGE
nginx-7854ff8877-abc12   0/1     Pending   0          0s
nginx-7854ff8877-def34   0/1     Pending   0          0s
nginx-7854ff8877-ghi56   0/1     Pending   0          0s
nginx-7854ff8877-abc12   0/1     ContainerCreating   0          1s
nginx-7854ff8877-def34   0/1     ContainerCreating   0          1s
nginx-7854ff8877-ghi56   0/1     ContainerCreating   0          1s
nginx-7854ff8877-abc12   1/1     Running   0          3s
nginx-7854ff8877-def34   1/1     Running   0          3s
nginx-7854ff8877-ghi56   1/1     Running   0          4s
```

*What you're thinking:* "The Deployment controller saw `replicas: 3` in etcd. It created a ReplicaSet. The ReplicaSet controller created 3 Pods. The Scheduler assigned them to nodes. Kubelets started containers. Each step was a controller doing its job."

### t=2: Self-Healing in Action

**Developer Action:** Kill a pod and watch recovery.

```bash
# Delete one pod
kubectl delete pod nginx-7854ff8877-abc12

# Immediately watch
kubectl get pods -w
```

```
nginx-7854ff8877-abc12   1/1     Terminating   0          5m
nginx-7854ff8877-abc12   0/1     Terminating   0          5m
nginx-7854ff8877-jkl78   0/1     Pending       0          0s
nginx-7854ff8877-jkl78   0/1     ContainerCreating   0          0s
nginx-7854ff8877-jkl78   1/1     Running       0          2s
```

*What you're thinking:* "The ReplicaSet controller noticed current state (2 pods) differs from desired state (3 pods). It created a new pod. I didn't run any command—the loop handled it."

### t=3: Understanding Ownership

**Developer Action:** Trace the ownership chain.

```bash
kubectl get deployment nginx -o yaml | grep -A 5 "ownerReferences"
```

```yaml
# The ReplicaSet's metadata shows:
ownerReferences:
- apiVersion: apps/v1
  controller: true
  kind: Deployment
  name: nginx
  uid: abc-123-...
```

*What you're thinking:* "The Deployment owns the ReplicaSet, which owns the Pods. When I delete the Deployment, garbage collection deletes everything downstream."

### Checkpoint 0

- [ ] You can explain the reconciliation loop without mentioning "running commands"
- [ ] You understand that desired state lives in etcd, current state is the cluster
- [ ] You can describe how a Deployment creates Pods (Deployment → ReplicaSet → Pods)
- [ ] You know what happens when a pod dies (controller creates replacement)
- [ ] You understand ownership and garbage collection

---

## Phase 1: Core Concepts Mastery

### Objective

Deep understanding of Pods, Deployments, Services, and ConfigMaps. Know exactly what each field means and when to use each pattern.

### Philosophy

> **DDIA Reference**: [Partitioning](../../data-intensive-apps/part2-distributed-data/06-partitioning/README.md) — Pods distribute workloads like partitions distribute data

1. **Pods are the Atomic Unit** — Not containers—pods. A pod can have multiple containers that share network (localhost) and storage (volumes). Use this for sidecars: log shippers, proxies, init containers.

2. **Deployments Manage Replica Lifecycle** — A Deployment doesn't run your app. It manages a ReplicaSet, which manages Pods. This indirection enables rolling updates: create new ReplicaSet, scale it up, scale old one down.

3. **Services Provide Stable Endpoints** — A ClusterIP Service gets a virtual IP. DNS resolves `my-svc` to this IP. kube-proxy routes traffic to healthy pod IPs. The abstraction survives pod restarts.

4. **ConfigMaps Separate Config from Code** — Don't bake configuration into images. Mount ConfigMaps as files or environment variables. Change config without rebuilding images.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| Pods | One or more containers with shared network/storage | Kubernetes Pod docs |
| ReplicaSets | Ensures N pod replicas exist | Rarely interact directly—Deployments manage them |
| Services | Stable network endpoint for pods | Service types (ClusterIP, NodePort, LoadBalancer) |
| ConfigMaps | Key-value configuration storage | Non-sensitive config |
| Secrets | Base64-encoded sensitive config | Passwords, tokens |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Zero-downtime deploys | Deployment + rolling update strategy | Old pods stay until new pods ready |
| Service discovery | Service + CoreDNS | `http://my-svc:8080` resolves |
| Sidecar pattern | Multi-container pods | Envoy proxy alongside app |
| Config hot-reload | ConfigMap volumes | Some apps detect file changes |

### t=0: Pod Deep-Dive

**Developer Intent:** "I want to understand exactly what a pod is."

```yaml
# pod-example.yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
  labels:
    app: my-app
spec:
  # Init containers run before main containers
  initContainers:
    - name: init-db-check
      image: busybox:1.35
      command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 1; done']

  containers:
    # Main application container
    - name: app
      image: my-app:v1.0
      ports:
        - containerPort: 8080
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 5
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        periodSeconds: 3

    # Sidecar: log shipper
    - name: log-shipper
      image: fluentd:v1.16
      volumeMounts:
        - name: logs
          mountPath: /var/log/app

  volumes:
    - name: logs
      emptyDir: {}
```

**Field-by-Field Breakdown:**

| Field | Purpose |
|-------|---------|
| `initContainers` | Run to completion before main containers start. Use for DB migrations, waiting for dependencies. |
| `containers[].resources.requests` | Scheduler uses this for placement. Kubelet reserves this capacity. |
| `containers[].resources.limits` | Hard ceiling. Container killed (OOMKilled) if it exceeds memory limit. |
| `livenessProbe` | Fails → Kubelet restarts container. Use for deadlock detection. |
| `readinessProbe` | Fails → Pod removed from Service endpoints. Use for initialization time. |
| `volumes` | Shared storage between containers in the pod. `emptyDir` is temporary; `persistentVolumeClaim` is durable. |

*What you're thinking:* "The pod has two containers sharing the `logs` volume. The init container ensures the database is reachable before the app starts. Probes tell Kubernetes how to check health."

### t=1: Deployment Rolling Update

**Developer Intent:** "I want to update my app without downtime."

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1    # At most 1 pod can be unavailable
      maxSurge: 1          # At most 1 extra pod during update
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:v1.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            periodSeconds: 3
```

**Update the image:**
```bash
kubectl set image deployment/my-app app=my-app:v2.0
kubectl rollout status deployment/my-app
```

```
Waiting for deployment "my-app" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "my-app" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "my-app" rollout to finish: 2 of 3 updated replicas are available...
deployment "my-app" successfully rolled out
```

*What you're thinking:* "A new ReplicaSet is created. It scales up while the old one scales down. `maxUnavailable: 1` means at least 2 pods serve traffic at all times. Readiness probes ensure new pods are ready before old ones terminate."

### t=2: Rollback

**Developer Action:** The new version has a bug. Roll back.

```bash
# Check rollout history
kubectl rollout history deployment/my-app

# Roll back to previous version
kubectl rollout undo deployment/my-app

# Or roll back to specific revision
kubectl rollout undo deployment/my-app --to-revision=2
```

*What you're thinking:* "Kubernetes keeps ReplicaSet history (controlled by `revisionHistoryLimit`). Undo just scales the old ReplicaSet back up. No need to remember what the previous image was."

### t=3: Services and Endpoints

**Developer Intent:** "I want to understand how Services route traffic."

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app    # Matches pods with this label
  ports:
    - port: 80           # Service port
      targetPort: 8080   # Pod port
```

```bash
# Check the service
kubectl get svc my-app
```

```
NAME     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
my-app   ClusterIP   10.96.45.123   <none>        80/TCP    5m
```

```bash
# Check the endpoints (pod IPs)
kubectl get endpoints my-app
```

```
NAME     ENDPOINTS                                      AGE
my-app   10.244.0.5:8080,10.244.1.3:8080,10.244.2.7:8080   5m
```

*What you're thinking:* "The Service has a stable ClusterIP (10.96.45.123). Endpoints are the actual pod IPs. When I call `my-app:80`, kube-proxy routes to one of the endpoint IPs. When pods restart, Endpoints update but ClusterIP stays the same."

### t=4: ConfigMaps and Secrets

**Developer Action:** Externalize configuration.

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  CACHE_TTL: "300"
  config.yaml: |
    database:
      pool_size: 10
      timeout: 30s
    features:
      dark_mode: true
```

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=          # base64 encoded
  password: c2VjcmV0MTIz      # base64 encoded
stringData:
  url: "postgres://admin:secret123@postgres:5432/mydb"  # Plain text, encoded on apply
```

```yaml
# deployment with config
spec:
  containers:
    - name: app
      image: my-app:v1.0
      env:
        # From ConfigMap
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
        # From Secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
      volumeMounts:
        # Mount ConfigMap as file
        - name: config-volume
          mountPath: /etc/app/config.yaml
          subPath: config.yaml
  volumes:
    - name: config-volume
      configMap:
        name: app-config
```

*What you're thinking:* "I can inject config as environment variables or files. Secrets are just base64 (not encrypted by default!). For real security, use external secret management like Vault."

### Checkpoint 1

- [ ] You can explain the difference between liveness and readiness probes
- [ ] You understand how rolling updates work (new ReplicaSet scales up, old scales down)
- [ ] You can trace a request from Service to Pod (ClusterIP → Endpoints → Pod IP)
- [ ] You know when to use ConfigMaps vs Secrets
- [ ] You can roll back a deployment to a previous version

---

## Phase 2: Stateful Workloads

### Objective

Master StatefulSets, PersistentVolumes, and Operators for running databases and other stateful applications.

### Philosophy

> **DDIA Reference**: [Replication](../../data-intensive-apps/part2-distributed-data/05-replication/README.md)

1. **StatefulSets Provide Identity** — Unlike Deployments, StatefulSets give pods stable names (my-app-0, my-app-1) and stable storage. Pod identity survives restarts—my-app-0 always remounts the same volume.

2. **PVCs Decouple Storage from Pods** — A PersistentVolumeClaim requests storage. A StorageClass provisions it. Pods mount PVCs. If the pod dies, the PVC (and data) survives.

3. **Headless Services Enable Peer Discovery** — StatefulSet pods need to find each other (e.g., for Cassandra gossip or PostgreSQL replication). Headless Services (ClusterIP: None) return pod IPs directly.

4. **Operators Encode Expert Knowledge** — The PostgreSQL Operator isn't just Postgres containers. It encodes DBA knowledge: failover, backup, restore, upgrades. Operators automate day-2 operations.

5. **Ordered Deployment Matters** — StatefulSets deploy pods sequentially (0, then 1, then 2). This ordering ensures primaries start before replicas, or leaders exist before followers.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| StatefulSet | Manages pods with stable identity | Kubernetes StatefulSet docs |
| PersistentVolume (PV) | Actual storage resource (disk) | Cluster admin creates these |
| PersistentVolumeClaim (PVC) | Request for storage | Developer creates these |
| StorageClass | Dynamic provisioner configuration | "I want SSD storage" |
| Operator | Custom controller for complex apps | Operator pattern |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Stable identity | StatefulSet + headless Service | my-db-0 always gets same PVC |
| Automatic failover | Operator + pod monitoring | New primary elected on failure |
| Data persistence | PVC + StorageClass | Data survives pod restart |
| Ordered startup | StatefulSet orderedReady | Pod N waits for Pod N-1 to be ready |

### t=0: StatefulSet Basics

**Developer Intent:** "I want to run a 3-node database cluster."

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless  # Required: headless service name
  replicas: 3
  podManagementPolicy: OrderedReady  # Default: sequential startup
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:  # Per-pod storage
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 10Gi
```

```yaml
# headless-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None  # Headless!
  selector:
    app: postgres
  ports:
    - port: 5432
```

```bash
kubectl apply -f headless-service.yaml
kubectl apply -f statefulset.yaml
kubectl get pods -w
```

```
NAME         READY   STATUS    AGE
postgres-0   0/1     Pending   0s
postgres-0   0/1     Init:0/1  1s
postgres-0   1/1     Running   30s
postgres-1   0/1     Pending   0s      # Only starts after 0 is Ready
postgres-1   1/1     Running   35s
postgres-2   0/1     Pending   0s
postgres-2   1/1     Running   40s
```

*What you're thinking:* "Each pod started sequentially. Each got its own PVC (data-postgres-0, data-postgres-1, data-postgres-2). If postgres-1 restarts, it remounts the same PVC."

### t=1: Headless Service DNS

**Developer Action:** Understand how pods discover each other.

```bash
# DNS records for headless service
kubectl run -it --rm debug --image=busybox -- nslookup postgres-headless
```

```
Name:      postgres-headless.default.svc.cluster.local
Address 1: 10.244.0.5 postgres-0.postgres-headless.default.svc.cluster.local
Address 2: 10.244.1.3 postgres-1.postgres-headless.default.svc.cluster.local
Address 3: 10.244.2.7 postgres-2.postgres-headless.default.svc.cluster.local
```

*What you're thinking:* "The headless service returns all pod IPs. Each pod also has a DNS record: `postgres-0.postgres-headless`. Pods can connect to specific peers by name."

### t=2: PVC Lifecycle

**Developer Intent:** "What happens to my data when pods restart or scale?"

```bash
# Scale down
kubectl scale statefulset postgres --replicas=1

# Check PVCs
kubectl get pvc
```

```
NAME              STATUS   VOLUME         CAPACITY   ACCESS MODES   AGE
data-postgres-0   Bound    pvc-abc-123    10Gi       RWO            10m
data-postgres-1   Bound    pvc-def-456    10Gi       RWO            9m
data-postgres-2   Bound    pvc-ghi-789    10Gi       RWO            8m
```

*What you're thinking:* "Pods 1 and 2 are gone, but their PVCs remain! Data is preserved. If I scale back up, postgres-1 and postgres-2 will remount their original volumes."

```bash
# Scale back up
kubectl scale statefulset postgres --replicas=3

# Pods remount their original volumes
kubectl exec postgres-1 -- ls /var/lib/postgresql/data
# Shows existing data!
```

### t=3: Using an Operator (CloudNativePG)

**Developer Intent:** "I want production-grade PostgreSQL with automatic failover."

```bash
# Install CloudNativePG operator
kubectl apply -f https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.22.0/cnpg-1.22.0.yaml
```

```yaml
# postgres-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: my-postgres
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised

  storage:
    size: 10Gi
    storageClass: standard

  bootstrap:
    initdb:
      database: myapp
      owner: myapp
      secret:
        name: myapp-credentials

  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"

  backup:
    barmanObjectStore:
      destinationPath: s3://my-bucket/postgres-backups
      s3Credentials:
        accessKeyId:
          name: s3-creds
          key: access-key
        secretAccessKey:
          name: s3-creds
          key: secret-key
```

```bash
kubectl apply -f postgres-cluster.yaml
kubectl get pods -l cnpg.io/cluster=my-postgres
```

```
NAME             READY   STATUS    ROLE      AGE
my-postgres-1    1/1     Running   primary   2m
my-postgres-2    1/1     Running   replica   1m
my-postgres-3    1/1     Running   replica   30s
```

*What you're thinking:* "The operator created 3 pods with proper roles. It handles replication, failover, backups. I describe WHAT I want (3 instances with S3 backup); the operator handles HOW."

### t=4: Simulating Failover

**Developer Action:** Kill the primary and watch automatic recovery.

```bash
# Find and kill the primary
kubectl delete pod my-postgres-1

# Watch the failover
kubectl get pods -l cnpg.io/cluster=my-postgres -w
```

```
NAME             READY   STATUS        ROLE      AGE
my-postgres-1    1/1     Terminating   primary   5m
my-postgres-2    1/1     Running       primary   4m    # Promoted!
my-postgres-3    1/1     Running       replica   3m
my-postgres-1    0/1     Pending       replica   0s    # Recreated as replica
my-postgres-1    1/1     Running       replica   30s
```

*What you're thinking:* "The operator detected the primary failure, promoted postgres-2, and recreated postgres-1 as a new replica. All without manual intervention."

### Checkpoint 2

- [ ] You can explain the difference between StatefulSet and Deployment
- [ ] You understand why PVCs persist after pods are deleted
- [ ] You know what a headless Service is and when to use it
- [ ] You can describe what an Operator does beyond just running containers
- [ ] You've simulated a failover and watched automatic recovery

---

## Phase 3: Networking Deep-Dive

### Objective

Understand how networking works in Kubernetes: Services, Ingress, NetworkPolicies, and DNS.

### Philosophy

> **DEVOPS Reference**: [Phase 5: Service Mesh](../../multi-agent-cognition/p1/DEVOPS_IMPLEMENTATION_GUIDE.md#phase-5-service-mesh)

1. **Every Pod Gets an IP** — Unlike Docker's port mapping, Kubernetes gives each pod a unique, routable IP. Pods communicate directly without NAT. This "flat network" is the foundation.

2. **Services are iptables/IPVS Rules** — A ClusterIP Service doesn't run anything. kube-proxy creates iptables rules that intercept traffic to the Service IP and forward to pod IPs.

3. **Ingress is L7, Services are L4** — Services route TCP/UDP (layer 4). Ingress routes HTTP (layer 7)—by host, by path. Ingress controllers (NGINX, Traefik) implement Ingress specs.

4. **NetworkPolicies are Firewalls** — By default, all pods can talk to all pods. NetworkPolicies define allowed traffic. A CNI that supports policies (Calico, Cilium) enforces them.

5. **DNS is CoreDNS** — `my-svc.my-ns.svc.cluster.local` resolves to the Service ClusterIP. CoreDNS watches the API server and updates records when Services change.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| CNI | Container Network Interface plugin | Calico, Cilium, Flannel |
| kube-proxy | Node component managing Service rules | iptables/IPVS modes |
| CoreDNS | Cluster DNS server | DNS resolution basics |
| Ingress Controller | Implements Ingress resources | NGINX, Traefik, Contour |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Pod-to-pod communication | CNI + flat network | Pods reach each other by IP |
| Service load balancing | kube-proxy + iptables | Traffic distributed across pods |
| External access | Ingress + TLS | HTTPS routes to internal services |
| Network isolation | NetworkPolicy + Calico/Cilium | Microsegmentation |

### t=0: Tracing a Request

**Developer Intent:** "I want to understand how traffic flows from external to pod."

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#fff', 'primaryBorderColor': '#fff', 'lineColor': '#fff', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460'}}}%%
flowchart LR
    EXT["External Client"]
    LB["LoadBalancer / NodePort"]
    ING["Ingress Controller"]
    SVC["ClusterIP Service"]
    POD["Pod"]

    EXT -->|"1. HTTPS"| LB
    LB -->|"2. Forward"| ING
    ING -->|"3. Route by path/host"| SVC
    SVC -->|"4. iptables"| POD

    style EXT fill:#0f3460,stroke:#fff
    style LB fill:#16213e,stroke:#e94560
    style ING fill:#16213e,stroke:#e94560
    style SVC fill:#16213e,stroke:#e94560
    style POD fill:#1a1a2e,stroke:#e94560
```

### t=1: Service Types

**Developer Action:** Understand the three main Service types.

```yaml
# ClusterIP (internal only)
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP  # Default
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080

---
# NodePort (expose on every node)
apiVersion: v1
kind: Service
metadata:
  name: backend-nodeport
spec:
  type: NodePort
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080  # Accessible on any-node:30080

---
# LoadBalancer (cloud provider creates LB)
apiVersion: v1
kind: Service
metadata:
  name: backend-lb
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
```

*What you're thinking:* "ClusterIP for internal. NodePort for quick external access (but exposes on all nodes). LoadBalancer for production (cloud creates actual LB with public IP)."

### t=2: Ingress

**Developer Intent:** "I want to route HTTPS traffic by host and path."

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
        - www.example.com
      secretName: example-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: api-v1
                port:
                  number: 80
          - path: /v2
            pathType: Prefix
            backend:
              service:
                name: api-v2
                port:
                  number: 80
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

*What you're thinking:* "The Ingress controller (NGINX) reads this and configures itself. `api.example.com/v1/*` goes to api-v1 service. cert-manager handles TLS certificates automatically."

### t=3: NetworkPolicies

**Developer Intent:** "I want to restrict which pods can talk to my database."

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Only allow from backend pods
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 5432
  egress:
    # Allow DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

```bash
# Test from backend pod (should work)
kubectl exec -it backend-pod -- nc -zv postgres 5432
# Connection to postgres 5432 port [tcp/postgresql] succeeded!

# Test from other pod (should fail)
kubectl exec -it other-pod -- nc -zv postgres 5432
# Connection timed out
```

*What you're thinking:* "Without NetworkPolicies, any pod can reach postgres. With this policy, only pods with `app: backend` label can connect on port 5432. Defense in depth."

### Checkpoint 3

- [ ] You can explain how kube-proxy routes traffic to pods
- [ ] You know when to use ClusterIP vs NodePort vs LoadBalancer
- [ ] You can configure Ingress for path-based and host-based routing
- [ ] You understand how NetworkPolicies default-deny traffic
- [ ] You can trace a request from external client to pod

---

## Phase 4: Observability Stack

### Objective

Implement monitoring, logging, and tracing with Prometheus, Grafana, Loki, and Tempo.

### Philosophy

> **DEVOPS Reference**: [Phase 6: Observability](../../multi-agent-cognition/p1/DEVOPS_IMPLEMENTATION_GUIDE.md#phase-6-observability)

1. **Metrics Tell You What, Logs Tell You Why** — Prometheus shows CPU is high. Loki shows the stacktrace causing it. Both are necessary; neither is sufficient.

2. **The RED Method for Services** — Rate (requests/sec), Errors (failed requests), Duration (latency). These three metrics cover service health.

3. **The USE Method for Resources** — Utilization (how busy), Saturation (how queued), Errors (failures). These cover infrastructure health.

4. **Distributed Tracing Connects Requests** — A request touches API, then DB, then cache, then downstream service. Tracing shows the full journey and where time is spent.

5. **Alert on Symptoms, Not Causes** — Alert on "p99 latency > 500ms" (what users feel), not "CPU > 80%" (a possible cause). Investigate causes when symptoms alert.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| Prometheus | Time-series metrics database | PromQL basics |
| Grafana | Visualization and dashboards | Dashboard creation |
| Loki | Log aggregation (like Prometheus for logs) | LogQL basics |
| Tempo | Distributed tracing backend | Trace concepts |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Automatic discovery | ServiceMonitors + Prometheus | New services scraped automatically |
| Correlated investigation | Grafana + all data sources | Jump from metric spike to logs to traces |
| Alert routing | Alertmanager + rules | Right people notified at right time |
| Capacity planning | Historical metrics | Know when to scale before it's urgent |

### t=0: Installing the Observability Stack

**Developer Action:** Deploy kube-prometheus-stack.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin
```

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# Open http://localhost:3000, login with admin/admin
```

*What you're thinking:* "This single Helm chart deploys Prometheus, Alertmanager, Grafana, and pre-configured dashboards for Kubernetes. Production-ready observability in one command."

### t=1: ServiceMonitor for Custom Metrics

**Developer Intent:** "I want Prometheus to scrape my application's metrics."

```yaml
# service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
  namespace: monitoring
  labels:
    release: monitoring  # Must match Prometheus selector
spec:
  namespaceSelector:
    matchNames:
      - production
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s
```

```yaml
# Ensure your app Service exposes metrics port
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: production
  labels:
    app: my-app
spec:
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: metrics        # This port
      port: 9090
      targetPort: 9090
```

*What you're thinking:* "Prometheus Operator watches for ServiceMonitors. When it sees one matching a Service, it configures Prometheus to scrape that Service's metrics endpoint."

### t=2: Creating Alerts

**Developer Action:** Define alerting rules.

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-app-alerts
  namespace: monitoring
  labels:
    release: monitoring
spec:
  groups:
    - name: my-app
      rules:
        # High error rate
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{job="my-app", status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="my-app"}[5m]))
            > 0.01
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High error rate in my-app"
            description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"

        # High latency
        - alert: HighLatency
          expr: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{job="my-app"}[5m])) by (le)
            ) > 0.5
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High p99 latency in my-app"
            description: "p99 latency is {{ $value | humanizeDuration }}"

        # Pod restarts
        - alert: PodRestartingFrequently
          expr: |
            increase(kube_pod_container_status_restarts_total{namespace="production"}[1h]) > 3
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} is restarting frequently"
```

*What you're thinking:* "These rules check for symptoms: error rate > 1%, p99 latency > 500ms, pods restarting. Alertmanager routes these to Slack/PagerDuty based on severity."

### t=3: Log Aggregation with Loki

**Developer Action:** Query logs from all pods.

```bash
# Install Loki stack
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=true
```

In Grafana, add Loki as a data source, then query:

```logql
# All logs from production namespace
{namespace="production"}

# Error logs from my-app
{namespace="production", app="my-app"} |= "error"

# Logs with specific request ID
{namespace="production"} |= "request_id=abc-123"

# Parse JSON logs and filter
{namespace="production", app="my-app"} | json | level="error" | latency_ms > 1000
```

*What you're thinking:* "LogQL is like PromQL but for logs. I can filter, parse, and aggregate. Most importantly, I can jump from a metric alert to the specific logs for that time range."

### Checkpoint 4

- [ ] You have Prometheus + Grafana running in your cluster
- [ ] You can create a ServiceMonitor for custom application metrics
- [ ] You've defined PrometheusRules for alerting on symptoms
- [ ] You can query logs with LogQL
- [ ] You understand the RED and USE methods

---

## Phase 5: Production Patterns

### Objective

Master HPA (Horizontal Pod Autoscaler), PDB (PodDisruptionBudget), resource management, and graceful shutdown.

### Philosophy

> **DDIA Reference**: [The Trouble with Distributed Systems](../../data-intensive-apps/part2-distributed-data/08-distributed-systems-trouble/README.md)

1. **HPA Automates Scaling Decisions** — You'd add replicas when CPU is high. HPA does this continuously based on metrics. But it's not magic—you must set appropriate thresholds.

2. **PDB Protects Availability** — Node drains, cluster upgrades, and spot instance reclamation all evict pods. PDB ensures enough pods stay running to serve traffic.

3. **Resource Requests are for Scheduling** — The scheduler uses requests to place pods. If total requests > node capacity, pods won't schedule (Pending).

4. **Resource Limits are for Protection** — Limits are hard ceilings. Exceed memory limit = OOMKilled. Exceed CPU limit = throttled. Protect your node from runaway containers.

5. **Graceful Shutdown Matters** — Kubernetes sends SIGTERM, waits `terminationGracePeriodSeconds`, then SIGKILL. Your app must handle SIGTERM: stop accepting new requests, finish in-flight requests, then exit.

### Structures & Behaviors

**Prerequisite Structures**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| HPA | Adjusts replicas based on metrics | Kubernetes HPA docs |
| PDB | Limits voluntary disruptions | Pod eviction concepts |
| Resource Quotas | Namespace-level resource limits | Multi-tenancy |
| LimitRanges | Default and max resources per pod | Namespace policies |

**Behaviors Given These Structures**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Autoscaling | HPA + metrics-server | Replicas adjust to load |
| Safe maintenance | PDB + drain | Upgrades don't cause outages |
| Fair sharing | ResourceQuotas | Teams can't consume all cluster resources |
| Predictable scheduling | Requests | Pods placed where capacity exists |

### t=0: Horizontal Pod Autoscaler

**Developer Action:** Scale based on CPU.

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

```bash
# Watch HPA decisions
kubectl get hpa my-app -w
```

```
NAME     REFERENCE           TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
my-app   Deployment/my-app   45%/70%, 30%/80%   2         10        2          5m
my-app   Deployment/my-app   85%/70%, 60%/80%   2         10        4          6m  # Scaled up!
```

*What you're thinking:* "When CPU exceeds 70% average, HPA adds pods. The `behavior` section prevents flapping: scale up fast (15s), scale down slow (5 min stabilization)."

### t=1: Custom Metrics Autoscaling

**Developer Intent:** "I want to scale based on message queue depth."

```yaml
# hpa-custom-metrics.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-processor
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-processor
  minReplicas: 1
  maxReplicas: 20
  metrics:
    - type: External
      external:
        metric:
          name: kafka_consumer_group_lag
          selector:
            matchLabels:
              topic: orders
              group: order-processors
        target:
          type: AverageValue
          averageValue: "1000"  # Scale when lag > 1000 per pod
```

*What you're thinking:* "When Kafka consumer lag exceeds 1000 messages per pod, HPA adds more pods. This requires a metrics adapter (Prometheus Adapter) to expose Kafka metrics to the HPA."

### t=2: PodDisruptionBudget

**Developer Action:** Protect availability during maintenance.

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2        # At least 2 pods must be running
  # OR: maxUnavailable: 1  # At most 1 pod can be down
  selector:
    matchLabels:
      app: my-app
```

```bash
# Try to drain a node
kubectl drain node-1 --ignore-daemonsets

# If draining would violate PDB:
error: Cannot evict pod as it would violate the pod's disruption budget.
```

*What you're thinking:* "PDB tells Kubernetes: 'You can evict pods for maintenance, but keep at least 2 running.' This prevents all replicas from being evicted simultaneously."

### t=3: Graceful Shutdown

**Developer Action:** Handle SIGTERM properly.

```go
// cmd/server/main.go
package main

import (
    "context"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    server := &http.Server{Addr: ":8080", Handler: myHandler()}

    // Start server
    go func() {
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    // Wait for SIGTERM
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit

    log.Println("Shutting down gracefully...")

    // Give Kubernetes time to update endpoints
    time.Sleep(5 * time.Second)

    // Graceful shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Forced shutdown: %v", err)
    }

    log.Println("Server stopped")
}
```

```yaml
# deployment.yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]  # Wait for endpoint removal
```

*What you're thinking:* "When Kubernetes terminates a pod, it sends SIGTERM. The `preStop` hook runs first (I use it to wait for endpoints to update). Then SIGTERM. My app stops accepting requests and drains in-flight ones."

### t=4: Resource Quotas

**Developer Intent:** "I want to limit how much each team can consume."

```yaml
# resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "50"
    persistentvolumeclaims: "10"
```

```yaml
# limit-range.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-a
spec:
  limits:
    - default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "2"
        memory: "4Gi"
      type: Container
```

*What you're thinking:* "ResourceQuota caps the namespace total. LimitRange sets defaults and maximums for individual containers. Together they prevent resource hogging and ensure pods always have requests set."

### Checkpoint 5

- [ ] You can configure HPA with CPU and custom metrics
- [ ] You understand the HPA behavior settings for scale up/down
- [ ] You've created a PDB to protect availability during maintenance
- [ ] Your application handles SIGTERM gracefully
- [ ] You can explain ResourceQuotas vs LimitRanges

---

## Troubleshooting Playbook

### Problem: Pod Stuck in Pending

```bash
# 1. Check pod events
kubectl describe pod my-pod | grep -A 20 "Events:"

# Common causes:
# - "Insufficient cpu/memory" → Node doesn't have capacity. Check resource requests.
# - "No nodes match" → Tainted nodes or affinity rules blocking placement.
# - "Unbound PersistentVolumeClaim" → PVC can't find a PV.

# 2. Check node capacity
kubectl describe nodes | grep -A 10 "Allocated resources"

# 3. Check if PVC is bound
kubectl get pvc
```

### Problem: Pod in CrashLoopBackOff

```bash
# 1. Check logs from previous crash
kubectl logs my-pod --previous

# 2. Check exit code
kubectl describe pod my-pod | grep "Exit Code"
# Exit Code 137 = OOMKilled (memory limit exceeded)
# Exit Code 1 = Application error

# 3. Increase memory if OOMKilled
kubectl set resources deployment/my-app --limits=memory=1Gi
```

### Problem: Service Not Reaching Pods

```bash
# 1. Verify selector matches
kubectl get svc my-svc -o yaml | grep selector
kubectl get pods -l app=my-app

# 2. Check endpoints exist
kubectl get endpoints my-svc
# If empty, selector doesn't match any running pods

# 3. Check pod readiness
kubectl get pods -l app=my-app -o wide
# Pods must be Ready (1/1) to be in endpoints

# 4. Test from inside cluster
kubectl run -it --rm debug --image=busybox -- wget -qO- http://my-svc:80
```

### Problem: Ingress Not Working

```bash
# 1. Check Ingress controller pods
kubectl get pods -n ingress-nginx

# 2. Check Ingress resource
kubectl describe ingress my-ingress

# 3. Check backend service exists
kubectl get svc my-backend

# 4. Check Ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# 5. Verify TLS secret exists (if using HTTPS)
kubectl get secret my-tls-secret
```

### Problem: HPA Not Scaling

```bash
# 1. Check HPA status
kubectl describe hpa my-app

# 2. Verify metrics-server is running
kubectl get pods -n kube-system | grep metrics-server

# 3. Check if pods have resource requests
kubectl get deployment my-app -o yaml | grep -A 5 "resources:"
# HPA requires resource requests to calculate utilization

# 4. Check current metrics
kubectl top pods -l app=my-app
```

---

## Next Steps

After completing this deep-dive:

1. **[Kafka Deep-Dive](../kafka-deep-dive/README.md)** — Run Kafka as a StatefulSet workload
2. **[DDIA Distributed Systems](../../data-intensive-apps/part2-distributed-data/08-distributed-systems-trouble/README.md)** — Theoretical foundation
3. **[DEVOPS Phase 2](../../multi-agent-cognition/p1/DEVOPS_IMPLEMENTATION_GUIDE.md#phase-2-kubernetes-core)** — Integration with the full DevOps stack
