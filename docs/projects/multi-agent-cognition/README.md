# Multi-Agent Cognition System

A hierarchical AI agent orchestration framework with human-proxy organizational patterns, real-time observability, and resilient execution.

## System Overview

This system enables multiple AI agents to collaborate within a corporate-style hierarchy (CEO → VP → Lead → Engineer → Intern), where each agent operates as an autonomous state machine while participating in coordinated workflows. The architecture addresses the fundamental challenge of **temporal frequency mismatch** — users expect millisecond responsiveness, but LLM calls operate on second-scale latencies.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#eee', 'primaryBorderColor': '#4a9eff', 'lineColor': '#4a9eff', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460'}}}%%
block-beta
    columns 1
    block:cloud["Cloud Layer (Kubernetes)"]:1
        columns 1
        block:tenant["Tenant Layer (Row-Level Security)"]:1
            columns 1
            block:oci["Org Chart Instance (OCI)"]:1
                columns 1
                block:agents["Agent Layer"]:1
                    CEO(["CEO"]) --> VP(["VP"])
                    VP --> Lead(["Lead"])
                    Lead --> Engineer(["Engineer"])
                    Engineer --> Intern(["Intern"])
                end
            end
        end
    end

    style cloud fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#4a9eff
    style tenant fill:#16213e,stroke:#00d9ff,stroke-width:2px,color:#00d9ff
    style oci fill:#0f3460,stroke:#00ff88,stroke-width:2px,color:#00ff88
    style agents fill:#1a1a40,stroke:#ff6b6b,stroke-width:2px,color:#ff6b6b
    style CEO fill:#ff6b6b,stroke:#ff6b6b,color:#1a1a2e
    style VP fill:#ffa06b,stroke:#ffa06b,color:#1a1a2e
    style Lead fill:#ffd93d,stroke:#ffd93d,color:#1a1a2e
    style Engineer fill:#6bcf6b,stroke:#6bcf6b,color:#1a1a2e
    style Intern fill:#6b9fff,stroke:#6b9fff,color:#1a1a2e
```

## Core Architectural Concepts

### Concentric Cycles Model
The system operates across five temporal rings, each with distinct latency characteristics:

| Ring | Layer | Timescale | Example |
|------|-------|-----------|---------|
| 1 (Outer) | User Experience | Minutes | Full workflow completion |
| 2 | Tenant Session | 10-60s | Multi-agent task chains |
| 3 | Org Chart Instance | 5-15s | Single delegation cycle |
| 4 | Agent Task | 1-5s | Individual decision |
| 5 (Inner) | LLM Call | 100ms-10s | Token generation |

### Agent State Machine
Each agent follows a deterministic lifecycle:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#fff', 'lineColor': '#888'}}}%%
stateDiagram-v2
    direction LR

    [*] --> IDLE
    IDLE --> ASSIGNED: task received
    ASSIGNED --> PLANNING: begin work
    PLANNING --> BLOCKED: dependency
    BLOCKED --> PLANNING: unblocked
    PLANNING --> EXECUTING: plan ready
    EXECUTING --> DELEGATING: subtask
    DELEGATING --> SUPERVISING: monitor
    SUPERVISING --> EXECUTING: complete
    EXECUTING --> AWAITING_REVIEW: done
    AWAITING_REVIEW --> EXECUTING: revisions
    AWAITING_REVIEW --> COMPLETE: approved
    COMPLETE --> IDLE: reset

    classDef idle fill:#6b9fff,stroke:#4a9eff,color:#1a1a2e
    classDef active fill:#6bcf6b,stroke:#4a9,color:#1a1a2e
    classDef blocked fill:#ff6b6b,stroke:#d44,color:#1a1a2e
    classDef waiting fill:#ffd93d,stroke:#cc0,color:#1a1a2e
    classDef complete fill:#00d9ff,stroke:#0aa,color:#1a1a2e

    class IDLE idle
    class ASSIGNED,PLANNING,EXECUTING active
    class BLOCKED blocked
    class DELEGATING,SUPERVISING,AWAITING_REVIEW waiting
    class COMPLETE complete
```

### Checkpoint-First Durability
Every state transition persists to PostgreSQL before acknowledgment. This guarantees:
- Maximum data loss: ~2 seconds
- Deterministic replay on failure
- Full auditability of all state changes

### Event-Driven Communication

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#fff', 'lineColor': '#4a9eff'}}}%%
flowchart LR
    A[Agent State Change] --> B[(PostgreSQL\nNOTIFY)]
    B --> C{{Event Bus}}
    C --> D[/WebSocket\nBridge/]
    D --> E([Clients])

    style A fill:#ff6b6b,stroke:#d44,color:#1a1a2e,stroke-width:2px
    style B fill:#6b9fff,stroke:#4a9eff,color:#1a1a2e,stroke-width:2px
    style C fill:#ffd93d,stroke:#cc0,color:#1a1a2e,stroke-width:2px
    style D fill:#00d9ff,stroke:#0aa,color:#1a1a2e,stroke-width:2px
    style E fill:#6bcf6b,stroke:#4a9,color:#1a1a2e,stroke-width:2px

    linkStyle default stroke:#4a9eff,stroke-width:2px
```

## Key Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| PostgreSQL as event bus | Transactional consistency with state | ~10K events/s ceiling |
| Hierarchical agent model | Maps to intuitive org structures | Deep trees add latency |
| Per-agent priority queues | Agents manage own cognitive load | Complexity in queue scoring |
| Multi-tenant single cluster | Resource efficiency | Noisy neighbor risk (mitigated by RLS) |

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Orchestration | Kubernetes (GKE/EKS), Istio service mesh |
| Runtime | TypeScript (agents), Go (event bus, core) |
| Data | PostgreSQL 16 + Citus, Redis Cluster, NATS JetStream |
| Observability | OpenTelemetry, Grafana LGTM stack |
| Security | HashiCorp Vault, mTLS, Row-Level Security |

## Documentation Structure

The documentation follows a layered bottom-up approach across two phases:

### Phase 0: Core Architecture (`p0/`)
| File | Layer | Content |
|------|-------|---------|
| `02-concentric-cycles.html` | 0 | Mental model — temporal frequency mismatch |
| `03-architecture-structure.html` | 1 | System structure — tenants, OCIs, agents |
| `04-behavior-flow.html` | 2 | Event flow — WebSocket protocol, pub/sub |
| `05-resilience-observability.html` | 3 | Operations — checkpoints, tracing, recovery |
| `06-implementation-code.html` | 4 | Implementation — TypeScript/Go code patterns |
| `07-interactive-org-chart.html` | Demo | Live workflow simulation |

### Phase 1: Advanced Extensions (`p1/`)
| File | Layer | Content |
|------|-------|---------|
| `02-cloud-infra.html` | 1b | Production infrastructure — K8s, Istio, Vault |
| `03-agent-cognition.html` | 2b | Cognitive architecture — memory, narrative, reflection |
| `04-cognition-simulation.html` | Demo | Interactive cognition visualization |

## Agent Cognition Model

Inspired by "Generative Agents: Interactive Simulacra of Human Behavior" (Park et al.), each agent maintains:

1. **Memory Stream** — Chronological log with vector embeddings for semantic retrieval
2. **Internal Narrative** — Observable first-person reasoning trace
3. **Priority Conversation Queue** — Weighted scoring for managing concurrent interactions
4. **Reflection Cycles** — Periodic synthesis of memories into higher-level insights

## Getting Started

1. Open `p0/01-index.html` for the Phase 0 navigation hub
2. Read layers 0-4 sequentially for conceptual understanding
3. Explore `p1/` for production infrastructure and cognitive extensions
4. Run the interactive simulations to see the system in action

## Architecture Principles

- **Observable by Default** — OpenTelemetry spans propagate through full agent hierarchy
- **Resilience First** — Failure recovery designed in, not bolted on
- **Multi-Tenant Native** — Row-level security from inception
- **Temporal Awareness** — Explicit handling of timescale mismatches
- **Hierarchical Autonomy** — Agents self-manage within delegated authority
