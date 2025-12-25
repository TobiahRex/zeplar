## 📁 Documentation Suite

| File                              | Layer                   | Purpose                                                                                                                           |
| --------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **index.html**                    | Master                  | Navigation hub with system overview, trade-offs matrix, and friction point solutions                                              |
| **concentric-cycles.html**        | Layer 0: Mental Model   | Animated visualization of temporal frequencies across system layers — the core abstraction for understanding UX vs system reality |
| **architecture-structure.html**   | Layer 1: Structure      | Cloud topology, tenant isolation, org chart hierarchies, agent state machines with Mermaid diagrams                               |
| **behavior-flow.html**            | Layer 2: Behavior       | Animated event propagation, WebSocket protocol specs, Event Bus architecture, task delegation sequences                           |
| **resilience-observability.html** | Layer 3: Operations     | Checkpoint recovery patterns, failure scenarios, distributed tracing, alerting                                                    |
| **implementation-code.html**      | Layer 4: Implementation | TypeScript & Go code, domain models, database schema with PostgreSQL NOTIFY triggers                                              |
| **interactive-org-chart.html**    | Demo                    | Live simulation with workflow animation, state transitions, and failure injection                                                 |

---

## 🎯 Key Design Decisions Addressing Your Requirements

**Concentric Cycles Friction** → Solved via progressive state projection, event coalescing, and tiered checkpointing

**Multi-Tenant + Multi-Instance** → PostgreSQL RLS + tenant-scoped NOTIFY channels + namespaced event routing

**WebSocket Fan-out** → Message router with subscription-based broadcasting, reconnection buffering with sequence replay

**Workflow Resilience** → Every state change checkpoints to DB before acknowledgment; deterministic replay on recovery

**High Observability** → OpenTelemetry spans through full agent hierarchy, structured event logging, Prometheus metrics

The interactive simulation lets you watch agents coordinate through a complete workflow with real-time state transitions — try the "Simulate Failure" button to see checkpoint recovery in action.