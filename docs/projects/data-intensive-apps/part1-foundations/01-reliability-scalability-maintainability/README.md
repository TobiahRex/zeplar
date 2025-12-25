# Chapter 1: Reliable, Scalable, and Maintainable Applications

> **Source Material:** [Full chapter notes](../../source-notes.md#reliable-scalable-and-maintainable-applications) (lines 57-199)

## Overview

This chapter establishes the vocabulary and mental models for the entire book. The three pillars—reliability, scalability, and maintainability—recur in every subsequent chapter.

## Core Concepts

### Reliability
*"Continuing to work correctly, even when things go wrong."*

- **Faults vs Failures**: A fault is a component deviation; a failure is system-level service loss
- **Fault tolerance**: Prefer tolerating faults over preventing them
- **Fault types**: Hardware (use redundancy), Software (systematic, harder), Human (most common)

### Scalability
*"Reasonable ways of dealing with growth."*

- **Load parameters**: Describe load before discussing growth (requests/sec, read/write ratio, active users)
- **Performance metrics**: Throughput (batch), Response time (online)
- **Percentiles**: p50, p95, p99, p999 matter more than averages
- **Approaches**: Scale up (vertical) vs Scale out (horizontal)

### Maintainability
*"Making life easier for future engineers."*

- **Operability**: Make it easy to keep running smoothly
- **Simplicity**: Remove accidental complexity
- **Evolvability**: Make change easy (aka extensibility, modifiability)

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **SLO/SLA** | Service Level Objectives/Agreements | Contracts defining expected uptime/latency |
| **Percentile distributions** | p50, p95, p99 response times | Statistics beyond averages |
| **Horizontal vs vertical scaling** | Add machines vs bigger machines | Distributed systems fundamentals |
| **Fault domains** | Blast radius of a failure | Failure isolation patterns |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Graceful degradation | Fault tolerance design | System works (worse) when components fail |
| Elastic scaling | Load measurement + automation | Resources grow/shrink with demand |
| Operational simplicity | Good abstractions + tooling | On-call engineers can debug issues |

## Key Examples from the Book

### Twitter's Home Timeline
The canonical example of load parameter thinking:
- **Problem**: 300k reads/sec vs 4.6k writes/sec
- **Approach 1**: Query on read (JOIN) — reads too expensive
- **Approach 2**: Fan-out on write — writes expensive for celebrities
- **Solution**: Hybrid — fan-out for most, query for high-follower accounts

## Practical Exercises

- [ ] **Chaos experiment**: Kill a database replica, observe failover behavior
- [ ] **Load test**: Use `wrk` or `k6` to find system breaking points
- [ ] **Percentile analysis**: Capture p50/p95/p99 for your service, identify outliers
- [ ] **Failure modes**: List 10 ways your system could fail, classify by likelihood/impact

## Discussion Questions

1. What's the difference between a fault and a failure? Why does this distinction matter?
2. Why does the book argue for *tolerating* faults rather than *preventing* them?
3. How would you describe the "load" on a system you've worked on?
4. What's the problem with using average response time as a performance metric?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Fault tolerance | Ch 5 (Replication), Ch 8 (Distributed trouble) |
| Scalability | Ch 5-6 (Replication, Partitioning) |
| Maintainability | Ch 4 (Encoding), Ch 12 (Future) |
