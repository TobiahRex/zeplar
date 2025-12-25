# Chapter 8: The Trouble with Distributed Systems

> **Source Material:** [Full chapter notes](../../source-notes.md#the-trouble-with-distributed-systems) (lines 1400-1550)

## Overview

Distributed systems face fundamentally different challenges than single-node systems. This chapter catalogs what can go wrong: unreliable networks, unreliable clocks, and processes that pause. Understanding these failure modes is essential for building robust systems.

## Core Concepts

### Partial Failures

Single computer: works or doesn't (deterministic)
Distributed system: *partial* failures are nondeterministic

**Key insight:** We must build reliable systems from unreliable components.

### Unreliable Networks

In async networks, when you send a request:
1. Request may be lost
2. Request may be queued
3. Remote node may have crashed
4. Remote node may be slow
5. Response may be lost
6. Response may be delayed

**You cannot distinguish these cases.** The only option: timeout.

### Timeouts

| Timeout | Risk if too long | Risk if too short |
|---------|------------------|-------------------|
| Long | Slow failure detection | — |
| Short | — | False positives, unnecessary failovers |

**Causes of delays:**
- Network congestion (switch queues full)
- OS scheduling (other processes)
- VM pausing (hypervisor context switch)
- TCP flow control
- GC pauses

**No "correct" timeout value.** Systems should adapt based on observed latency distributions.

### Unreliable Clocks

**Time-of-day clocks:**
- Return wall-clock time
- May jump backward (NTP sync)
- **Not suitable for measuring durations**

**Monotonic clocks:**
- Always move forward
- NTP can speed up or slow down, but never jump
- **Good for measuring elapsed time**

**Dangers of relying on clocks:**
- Last-write-wins can lose data
- Lease expiration can cause split-brain
- Clock skew between nodes is inevitable

**Logical clocks (Lamport timestamps):**
- Based on counters, not physical time
- Capture causality, not actual time
- Safer for ordering events

### Process Pauses

A process may pause for:
- Garbage collection (stop-the-world)
- VM suspension by hypervisor
- Disk I/O (especially with swap)
- Context switches under load
- `SIGSTOP` signal

**Implication:** A node may think it still holds a lease when it has already expired.

### Fencing Tokens

**Problem:** Node pauses, lease expires, another node takes over, original node resumes and corrupts data.

**Solution:** Every lease/lock includes a monotonically increasing *fencing token*. Storage rejects writes with older tokens.

### Byzantine Faults

When nodes *lie* (malicious or buggy hardware):
- Most systems assume non-Byzantine (nodes may crash but don't lie)
- Byzantine fault tolerance needed for adversarial environments
- Much more expensive to implement

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Async networks** | No guaranteed delivery time | Network fundamentals |
| **NTP** | Network Time Protocol | Time synchronization |
| **Monotonic clocks** | Non-jumping time source | OS time APIs |
| **GC pauses** | Stop-the-world garbage collection | JVM/runtime internals |
| **Leases** | Time-limited locks | Distributed locking |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Timeouts | Unbounded network delays | Only way to detect failure |
| Clock skew | Distributed clocks | LWW can lose recent writes |
| Split-brain | Process pauses + leases | Two nodes think they're leader |
| Fencing | Monotonic tokens | Stale leaders rejected by storage |
| Jitter | Variable network/process delays | Need adaptive timeouts |

## Key Examples from the Book

### GitHub's 90-Second Packet Delay

A network switch dropped packets for 90 seconds but didn't fail completely. Result: confusing partial connectivity, hard to diagnose.

### GC Pause Breaking Consensus

A node in a consensus group pauses for GC. Others elect new leader. Old node wakes up, still thinks it's leader. Fencing tokens prevent data corruption.

## Practical Exercises

- [ ] **Inject network partitions**: Use `tc` or Toxiproxy to add latency/drops
- [ ] **Measure clock skew**: Compare NTP offsets across cluster nodes
- [ ] **Trigger GC pauses**: Allocate heavily, observe stop-the-world duration
- [ ] **Implement fencing tokens**: Reject writes with stale tokens

## Discussion Questions

1. Why can't you reliably detect whether a remote node has crashed?
2. When would you use physical clocks despite their unreliability?
3. How do Lamport timestamps help with ordering without synchronized clocks?
4. Why are most systems not Byzantine fault-tolerant?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Failure detection | Ch 5 (Leader election), Ch 9 (Consensus) |
| Clock issues | Ch 7 (Snapshot isolation), Ch 11 (Event time) |
| Network partitions | Ch 5 (Split-brain), Ch 9 (CAP theorem) |
| Leases | Ch 9 (Distributed locks) |
