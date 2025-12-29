-- ============================================================
-- REDIS LUA SCRIPTS REFERENCE
-- Common patterns for system design
-- ============================================================

-- ============================================================
-- 1. SLIDING WINDOW RATE LIMITER
-- ============================================================
-- KEYS[1]: Rate limit key (e.g., "ratelimit:user:123")
-- ARGV[1]: Current timestamp (ms)
-- ARGV[2]: Window size (ms)  
-- ARGV[3]: Max requests allowed
-- ARGV[4]: Unique request ID
-- Returns: {allowed (0/1), remaining}

local SLIDING_WINDOW_RATE_LIMITER = [[
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local request_id = ARGV[4]

-- Remove entries outside the sliding window
redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

-- Count current requests in window
local count = redis.call("ZCARD", key)

if count < limit then
    -- Under limit: add this request
    redis.call("ZADD", key, now, request_id)
    -- Set TTL to auto-cleanup (window duration + buffer)
    redis.call("EXPIRE", key, math.ceil(window / 1000) + 10)
    return {1, limit - count - 1}  -- allowed, remaining
else
    -- Over limit: reject
    return {0, 0}  -- denied, remaining
end
]]


-- ============================================================
-- 2. FIXED WINDOW RATE LIMITER (simpler, less accurate)
-- ============================================================
-- KEYS[1]: Rate limit key
-- ARGV[1]: Window size in seconds
-- ARGV[2]: Max requests allowed
-- Returns: {allowed (0/1), remaining, ttl}

local FIXED_WINDOW_RATE_LIMITER = [[
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])

local current = redis.call("INCR", key)

if current == 1 then
    redis.call("EXPIRE", key, window)
end

local ttl = redis.call("TTL", key)

if current <= limit then
    return {1, limit - current, ttl}
else
    return {0, 0, ttl}
end
]]


-- ============================================================
-- 3. TOKEN BUCKET RATE LIMITER
-- ============================================================
-- KEYS[1]: Bucket key (hash)
-- ARGV[1]: Current timestamp (ms)
-- ARGV[2]: Bucket capacity (max tokens)
-- ARGV[3]: Refill rate (tokens per second)
-- ARGV[4]: Tokens to consume
-- Returns: {allowed (0/1), tokens_remaining}

local TOKEN_BUCKET = [[
local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local rate = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

-- Get current state
local data = redis.call("HMGET", key, "tokens", "last_update")
local tokens = tonumber(data[1]) or capacity
local last_update = tonumber(data[2]) or now

-- Calculate tokens to add based on time elapsed
local elapsed = (now - last_update) / 1000  -- convert to seconds
local new_tokens = math.min(capacity, tokens + (elapsed * rate))

if new_tokens >= requested then
    -- Consume tokens
    new_tokens = new_tokens - requested
    redis.call("HMSET", key, "tokens", new_tokens, "last_update", now)
    redis.call("EXPIRE", key, math.ceil(capacity / rate) + 10)
    return {1, math.floor(new_tokens)}
else
    -- Not enough tokens
    redis.call("HMSET", key, "tokens", new_tokens, "last_update", now)
    return {0, math.floor(new_tokens)}
end
]]


-- ============================================================
-- 4. DISTRIBUTED LOCK (Redlock pattern - single instance)
-- ============================================================
-- KEYS[1]: Lock key
-- ARGV[1]: Unique lock token (UUID)
-- ARGV[2]: Lock TTL in milliseconds
-- Returns: 1 if acquired, 0 if not

local ACQUIRE_LOCK = [[
local key = KEYS[1]
local token = ARGV[1]
local ttl = tonumber(ARGV[2])

-- Try to set lock with NX (only if not exists)
local result = redis.call("SET", key, token, "NX", "PX", ttl)

if result then
    return 1
else
    return 0
end
]]


-- Safe release - only if we hold the lock
-- KEYS[1]: Lock key  
-- ARGV[1]: Our lock token
-- Returns: 1 if released, 0 if not our lock

local RELEASE_LOCK = [[
local key = KEYS[1]
local token = ARGV[1]

-- Only delete if token matches (we own the lock)
if redis.call("GET", key) == token then
    redis.call("DEL", key)
    return 1
else
    return 0
end
]]


-- ============================================================
-- 5. ATOMIC COUNTER WITH CAP (Inventory, Quotas)
-- ============================================================
-- KEYS[1]: Counter key
-- ARGV[1]: Amount to decrement
-- ARGV[2]: Minimum value (usually 0)
-- Returns: {success (0/1), new_value}

local DECREMENT_WITH_FLOOR = [[
local key = KEYS[1]
local amount = tonumber(ARGV[1])
local floor = tonumber(ARGV[2])

local current = tonumber(redis.call("GET", key) or "0")

if current - amount >= floor then
    local new_val = redis.call("DECRBY", key, amount)
    return {1, new_val}
else
    return {0, current}
end
]]


-- ============================================================
-- 6. LEADERBOARD UPDATE WITH RANK RETURN
-- ============================================================
-- KEYS[1]: Leaderboard key
-- ARGV[1]: Member ID
-- ARGV[2]: Score to add
-- Returns: {new_score, rank (0-indexed)}

local LEADERBOARD_UPDATE = [[
local key = KEYS[1]
local member = ARGV[1]
local score_delta = tonumber(ARGV[2])

-- Increment score atomically
local new_score = redis.call("ZINCRBY", key, score_delta, member)

-- Get rank (reverse order - highest first)
local rank = redis.call("ZREVRANK", key, member)

return {tonumber(new_score), rank}
]]


-- ============================================================
-- 7. COMPARE-AND-SWAP (Optimistic Locking)
-- ============================================================
-- KEYS[1]: Key to update
-- ARGV[1]: Expected current value
-- ARGV[2]: New value
-- ARGV[3]: TTL in seconds (optional, 0 = no expire)
-- Returns: 1 if swapped, 0 if current != expected

local COMPARE_AND_SWAP = [[
local key = KEYS[1]
local expected = ARGV[1]
local new_value = ARGV[2]
local ttl = tonumber(ARGV[3])

local current = redis.call("GET", key)

if current == expected then
    if ttl > 0 then
        redis.call("SET", key, new_value, "EX", ttl)
    else
        redis.call("SET", key, new_value)
    end
    return 1
else
    return 0
end
]]


-- ============================================================
-- 8. SLIDING WINDOW COUNTER (Approximation)
-- ============================================================
-- More memory efficient than full log, slight accuracy tradeoff
-- KEYS[1]: Counter key prefix
-- ARGV[1]: Current timestamp (seconds)
-- ARGV[2]: Window size (seconds)
-- ARGV[3]: Max requests
-- Returns: {allowed (0/1), approximate_count}

local SLIDING_WINDOW_COUNTER = [[
local key_prefix = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- Calculate current and previous windows
local current_window = math.floor(now / window) * window
local prev_window = current_window - window

local current_key = key_prefix .. ":" .. current_window
local prev_key = key_prefix .. ":" .. prev_window

-- Get counts
local current_count = tonumber(redis.call("GET", current_key) or "0")
local prev_count = tonumber(redis.call("GET", prev_key) or "0")

-- Calculate weighted average based on position in current window
local elapsed_pct = (now - current_window) / window
local weighted_count = (prev_count * (1 - elapsed_pct)) + current_count

if weighted_count < limit then
    -- Increment current window counter
    redis.call("INCR", current_key)
    redis.call("EXPIRE", current_key, window * 2)  -- Keep for overlap
    return {1, math.floor(weighted_count)}
else
    return {0, math.floor(weighted_count)}
end
]]


-- ============================================================
-- 9. ATOMIC HASH FIELD INCREMENT WITH LIMITS
-- ============================================================
-- KEYS[1]: Hash key
-- ARGV[1]: Field name
-- ARGV[2]: Increment amount
-- ARGV[3]: Max value
-- ARGV[4]: Min value
-- Returns: {success (0/1), new_value}

local HASH_FIELD_BOUNDED_INCR = [[
local key = KEYS[1]
local field = ARGV[1]
local amount = tonumber(ARGV[2])
local max_val = tonumber(ARGV[3])
local min_val = tonumber(ARGV[4])

local current = tonumber(redis.call("HGET", key, field) or "0")
local new_val = current + amount

if new_val > max_val then
    new_val = max_val
elseif new_val < min_val then
    new_val = min_val
end

if new_val ~= current then
    redis.call("HSET", key, field, new_val)
    return {1, new_val}
else
    return {0, current}
end
]]


-- ============================================================
-- 10. DEDUPLICATION CHECK (Idempotency)
-- ============================================================
-- KEYS[1]: Dedup set key
-- ARGV[1]: Request/event ID
-- ARGV[2]: TTL in seconds
-- Returns: 1 if new (first time), 0 if duplicate

local DEDUP_CHECK = [[
local key = KEYS[1]
local request_id = ARGV[1]
local ttl = tonumber(ARGV[2])

-- Try to add to set
local added = redis.call("SADD", key, request_id)

if added == 1 then
    -- New entry - refresh TTL
    redis.call("EXPIRE", key, ttl)
    return 1
else
    -- Duplicate
    return 0
end
]]


-- ============================================================
-- USAGE EXAMPLES (Go)
-- ============================================================
--[[

// Loading and caching a script
var rateLimitScript = redis.NewScript(`<paste script here>`)

// Running with EVALSHA (auto-fallback to EVAL)
result, err := rateLimitScript.Run(ctx, rdb,
    []string{"ratelimit:user:123"},           // KEYS
    time.Now().UnixMilli(), 60000, 100, uuid.New().String(),  // ARGV
).Int64Slice()

allowed := result[0] == 1
remaining := result[1]

]]


-- ============================================================
-- USAGE EXAMPLES (Python)
-- ============================================================
--[[

import redis

r = redis.Redis()

# Register script
rate_limit_script = r.register_script("""<paste script here>""")

# Call script
result = rate_limit_script(
    keys=["ratelimit:user:123"],
    args=[int(time.time() * 1000), 60000, 100, str(uuid.uuid4())]
)

allowed = result[0] == 1
remaining = result[1]

]]


-- ============================================================
-- BEST PRACTICES
-- ============================================================
--[[

1. KEYS array MUST contain all Redis keys accessed
   - Required for Redis Cluster slot routing
   - Scripts that violate this may work standalone but fail in cluster

2. Keep scripts SHORT
   - They block the entire Redis instance while executing
   - Default lua-time-limit is 5 seconds
   - Long scripts trigger BUSY errors

3. Scripts are ATOMIC but not transactional
   - If script fails midway, partial changes ARE applied
   - Use careful ordering or explicit rollback logic

4. Use EVALSHA in production
   - First EVAL caches the script
   - EVALSHA uses SHA1 hash - saves bandwidth
   - Most clients handle this automatically

5. Pass dynamic values as ARGV, not hardcoded
   - Allows script reuse across different parameters
   - Better for EVALSHA caching

6. Test edge cases
   - What if key doesn't exist?
   - What if value is wrong type?
   - What if TTL already expired?

7. Return structured data
   - Use Lua tables: return {status, value, ttl}
   - Makes client parsing easier and consistent

]]
