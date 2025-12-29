# Redis System Design Cheat Sheet

## 🧠 Core Mental Models

| Concept           | Mental Model                                           |
| ----------------- | ------------------------------------------------------ |
| **Identity**      | In-memory data structure server (not just key-value)   |
| **Hot Path**      | Data accessed frequently needing sub-ms response       |
| **Ephemeral**     | Treat as renewable; rebuild from durable store if lost |
| **Scratch Space** | Shared whiteboard between services                     |

## ⚡ Why Single-Threaded Works

```
Latency Breakdown (typical):
├── Network → Redis:  0.1-1ms (99% of time)
├── Redis Processing: 1-10μs  (negligible)
└── Network ← Redis:  0.1-1ms (99% of time)
```

**Result**: No locks needed, atomic by default, predictable performance

## 📊 Data Structures Quick Reference

| Structure      | Use Case                  | Key Commands            | Time     |
| -------------- | ------------------------- | ----------------------- | -------- |
| **String**     | Counters, cache, binary   | `SET/GET/INCR`          | O(1)     |
| **List**       | Queues, stacks, feeds     | `LPUSH/RPOP/BRPOP`      | O(1)     |
| **Set**        | Unique items, tags        | `SADD/SISMEMBER/SINTER` | O(1)     |
| **Sorted Set** | Leaderboards, rate limits | `ZADD/ZRANGE/ZRANK`     | O(log N) |
| **Hash**       | Objects, sessions         | `HSET/HGET/HINCRBY`     | O(1)     |
| **Stream**     | Event logs, queues        | `XADD/XREADGROUP/XACK`  | O(1)     |

## 🎯 Rate Limiting Patterns

### Simple Counter (Fixed Window)

```redis
SET ratelimit:user:123 0 EX 60
INCR ratelimit:user:123
# If > limit, reject
```

### Sliding Window (Accurate)

```redis
ZADD ratelimit:user:123 <timestamp_ms> <request_id>
ZREMRANGEBYSCORE ratelimit:user:123 0 <now - window>
ZCARD ratelimit:user:123  # → count in window
```

## 🔐 Distributed Lock Pattern

```redis
# Acquire (NX = only if not exists)
SET lock:resource <uuid> NX PX 30000

# Release (only if we own it) - USE LUA SCRIPT
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
```

## 📡 Streaming Pattern (Your Pipeline)

```
Go Producer                  Redis Stream               Python Consumer
     │                            │                           │
     │──XADD market:prices───────►│                           │
     │   MAXLEN ~ 100000          │◄──XREADGROUP GROUP grp────│
     │                            │   BLOCK 1000              │
     │                            │──────────────────────────►│
     │                            │◄──XACK───────────────────│
```

### Producer (Go)

```go
pipe.XAdd(ctx, &redis.XAddArgs{
    Stream: "market:prices",
    MaxLen: 100000, Approx: true,
    Values: map[string]any{"sym": sym, "price": price},
})
```

### Consumer (Python)

```python
entries = r.xreadgroup("analytics", "worker-1",
    {"market:prices": ">"}, count=100, block=1000)
for msg_id, data in messages:
    process(data)
    r.xack("market:prices", "analytics", msg_id)
```

## 🔀 Cluster Concepts

| Concept        | Description                             |
| -------------- | --------------------------------------- |
| **Hash Slots** | 16,384 slots, each key → slot via CRC16 |
| **Hash Tags**  | `{user:123}:profile` forces same slot   |
| **MOVED**      | Permanent redirect to correct shard     |
| **ASK**        | Temporary redirect during migration     |

⚠️ **Cross-slot operations fail**: MGET across different slots → error

## 🚀 Performance Tips

1. **Pipeline commands** - batch to reduce RTT
2. **Use SCAN not KEYS** - KEYS blocks
3. **Avoid HGETALL** on large hashes - use HMGET
4. **Set MAXLEN on streams** - prevent unbounded growth
5. **Hash tags for multi-key ops** - ensure same slot

## ⏱️ Temporal Layers

| Layer             | Scale        | Notes                    |
| ----------------- | ------------ | ------------------------ |
| Command execution | 1-10 μs      | Single-threaded          |
| Network RTT       | 0.1-2 ms     | Use pipelining           |
| Key TTL           | secs-hours   | Lazy + active expiration |
| Stream lag        | variable     | Monitor consumer lag     |
| RDB snapshots     | minutes      | Point-in-time backup     |
| AOF sync          | configurable | `always`/`everysec`/`no` |

## 🆚 Pub/Sub vs Streams

| Aspect          | Pub/Sub             | Streams                |
| --------------- | ------------------- | ---------------------- |
| Persistence     | ❌ No               | ✅ Yes                 |
| Replay          | ❌ No               | ✅ Yes                 |
| Consumer groups | ❌ No               | ✅ Yes                 |
| Acknowledgment  | ❌ No               | ✅ Yes                 |
| Use case        | Real-time broadcast | Event sourcing, queues |

**For your pipeline → USE STREAMS**

## 📝 Lua Script Template

```lua
-- KEYS[1] = primary key
-- ARGV[1] = parameter

local key = KEYS[1]
local param = tonumber(ARGV[1])

-- Your atomic operations
local result = redis.call("GET", key)

if condition then
    redis.call("SET", key, new_value)
    return {1, new_value}  -- success
else
    return {0, result}  -- failure
end
```

⚠️ **Scripts block Redis** - keep them short!

## 🎓 Quick Decision Tree

```
Need fast key-value lookup?
    └── Use String

Need atomic counter?
    └── Use String with INCR

Need queue/stack?
    └── Use List with LPUSH/RPOP

Need unique collection?
    └── Use Set

Need ranked/scored items?
    └── Use Sorted Set

Need object/record?
    └── Use Hash

Need event log with replay?
    └── Use Stream

Need multiple atomic ops?
    └── Use Lua Script
```

---

_Redis = Shared, fast, atomic scratch space between your services_ 🧠
