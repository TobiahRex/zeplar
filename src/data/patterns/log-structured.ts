import type { Pattern } from "../schema";

export const logStructured: Pattern = {
  id: "log-structured",
  slug: "log-structured",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📜 Write-Ahead Logging → 📊 Log-Structured",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Write-Ahead Logging",
    level: 4,
  },

  concept: {
    name: "Log-Structured",
    emoji: "📊",
    tagline: "Append-only storage",
    definition:
      "Log-Structured Storage treats all writes as append-only log entries, turning random writes into sequential writes for dramatically improved write throughput on spinning disks and SSDs. Think of it like writing in a journal—you always write at the end, never erasing or going back to modify previous entries. In databases like Cassandra or LevelDB, a write operation appends a new entry to an in-memory structure (memtable) and a sequential log file (commit log), never modifying data in place. For example, updating user_age from 25 to 26 appends 'user_age=26, timestamp=T2' to the log rather than overwriting the old value. Later compaction merges log entries, discarding obsolete versions. Reads check the memtable first, then search through log segments (SSTables) using indexes and bloom filters. The key insight is that sequential writes are 100-1000x faster than random writes on traditional disks, and this advantage persists even on SSDs due to write amplification.",
    problemSolved:
      "Traditional update-in-place storage performs random I/O writes that are extremely slow on spinning disks (seek time 5-10ms per write) and cause write amplification on SSDs (wear leveling overhead). A database updating scattered records requires disk seeks between each write, limiting throughput to 100-200 writes/second on HDDs. Update-in-place also complicates crash recovery, requiring careful ordering and synchronization. Log-Structured Storage solves this by converting all writes into sequential appends, achieving 10,000+ writes/second on the same hardware. Sequential writes saturate disk bandwidth without seek overhead, and SSDs benefit from reduced write amplification. This is critical for write-intensive workloads (event logging, time-series data, message queues), systems requiring high write throughput (IoT sensor data, analytics ingestion), and applications where writes far outnumber reads.",
    tradeoffs: {
      pros: [
        "Dramatically higher write throughput (10-100x) by converting random writes into sequential appends",
        "Simpler crash recovery with append-only log providing natural write-ahead logging and durability",
        "Reduced write amplification on SSDs, extending drive lifespan by minimizing internal garbage collection",
        "Naturally supports time-ordered data access patterns like time-series queries and event replay",
      ],
      cons: [
        "Slower reads requiring searches through multiple log segments unless indexes and bloom filters are used",
        "Requires periodic compaction to merge log segments and reclaim space from deleted/updated records",
        "Higher storage overhead as deleted records remain until compaction, wasting disk space temporarily",
        "Compaction can cause write spikes and resource contention, degrading foreground operation performance",
      ],
    },
    relatedPatterns: [
      "write-ahead-log",
      "event-sourcing",
      "append-only",
      "compaction",
    ],
  },

  structure: {
    participants: [
      {
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
  },

  codeExamples: [
    {
      id: "log-structured-ts-basic",
      language: "typescript",
      title: "Log-Structured Storage with Compaction",
      description:
        "An append-only storage system that converts random writes into sequential writes for maximum throughput, with background compaction to reclaim space from obsolete entries.",
      code: `// Log-Structured Storage Implementation
// All writes are appends, reads search through segments

type Key = string;
type Value = any;
type Timestamp = number;

// Entry in the log
interface LogEntry {
  key: Key;
  value: Value | null; // null indicates deletion
  timestamp: Timestamp;
  sequence: number; // For ordering within same timestamp
}

// Immutable log segment (SSTable-like)
class LogSegment {
  private entries: LogEntry[] = [];
  private index = new Map<Key, number>(); // Key -> position in entries
  readonly id: number;
  readonly createdAt: Timestamp;
  private _size = 0;

  constructor(id: number) {
    this.id = id;
    this.createdAt = Date.now();
  }

  append(entry: LogEntry): void {
    const position = this.entries.length;
    this.entries.push(entry);
    this.index.set(entry.key, position);
    this._size += JSON.stringify(entry).length;
  }

  get(key: Key): LogEntry | undefined {
    const position = this.index.get(key);
    return position !== undefined ? this.entries[position] : undefined;
  }

  getAllEntries(): LogEntry[] {
    return [...this.entries];
  }

  get size(): number {
    return this._size;
  }

  get length(): number {
    return this.entries.length;
  }

  // Make segment immutable (simulate flush to disk)
  freeze(): void {
    console.log(\`[SEGMENT] Segment \${this.id} frozen with \${this.length} entries\`);
  }
}

// Active memtable (in-memory buffer)
class Memtable {
  private entries = new Map<Key, LogEntry>();
  private sequence = 0;
  readonly maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  write(key: Key, value: Value | null): LogEntry {
    const entry: LogEntry = {
      key,
      value,
      timestamp: Date.now(),
      sequence: this.sequence++,
    };
    this.entries.set(key, entry);
    return entry;
  }

  get(key: Key): LogEntry | undefined {
    return this.entries.get(key);
  }

  isFull(): boolean {
    return this.entries.size >= this.maxSize;
  }

  getAllEntries(): LogEntry[] {
    return Array.from(this.entries.values());
  }

  clear(): void {
    this.entries.clear();
    this.sequence = 0;
  }
}

// Main log-structured store
class LogStructuredStore {
  private memtable = new Memtable(5); // Small size for demo
  private segments: LogSegment[] = [];
  private nextSegmentId = 1;
  private readonly COMPACTION_THRESHOLD = 3;

  // Write: always append to memtable
  put(key: Key, value: Value): void {
    console.log(\`[PUT] \${key} = \${JSON.stringify(value)}\`);

    // Append to memtable
    this.memtable.write(key, value);

    // Flush if full
    if (this.memtable.isFull()) {
      this.flush();
    }

    // Trigger compaction if needed
    if (this.segments.length >= this.COMPACTION_THRESHOLD) {
      this.compact();
    }
  }

  // Delete: append tombstone marker
  delete(key: Key): void {
    console.log(\`[DELETE] \${key}\`);
    this.memtable.write(key, null); // null = tombstone

    if (this.memtable.isFull()) {
      this.flush();
    }
  }

  // Read: check memtable first, then segments newest-to-oldest
  get(key: Key): Value | undefined {
    // Check active memtable first (most recent)
    const memEntry = this.memtable.get(key);
    if (memEntry) {
      return memEntry.value === null ? undefined : memEntry.value;
    }

    // Search segments from newest to oldest
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const entry = this.segments[i].get(key);
      if (entry) {
        // Found entry - check if it's a tombstone
        return entry.value === null ? undefined : entry.value;
      }
    }

    return undefined;
  }

  // Flush memtable to immutable segment
  private flush(): void {
    if (this.memtable.getAllEntries().length === 0) {
      return;
    }

    console.log("\\n[FLUSH] Flushing memtable to disk segment");

    const segment = new LogSegment(this.nextSegmentId++);

    // Copy all memtable entries to segment
    for (const entry of this.memtable.getAllEntries()) {
      segment.append(entry);
    }

    segment.freeze();
    this.segments.push(segment);

    // Clear memtable
    this.memtable.clear();

    console.log(\`[FLUSH] Complete. Total segments: \${this.segments.length}\\n\`);
  }

  // Compaction: merge segments and remove obsolete entries
  private compact(): void {
    console.log("\\n[COMPACTION] Starting compaction...");

    // Collect all entries from all segments
    const allEntries: LogEntry[] = [];
    for (const segment of this.segments) {
      allEntries.push(...segment.getAllEntries());
    }

    console.log(\`[COMPACTION] Processing \${allEntries.length} total entries\`);

    // Sort by timestamp descending (newest first)
    allEntries.sort((a, b) => {
      if (b.timestamp !== a.timestamp) {
        return b.timestamp - a.timestamp;
      }
      return b.sequence - a.sequence;
    });

    // Keep only latest version of each key
    const latestEntries = new Map<Key, LogEntry>();
    for (const entry of allEntries) {
      if (!latestEntries.has(entry.key)) {
        // Skip tombstones during compaction
        if (entry.value !== null) {
          latestEntries.set(entry.key, entry);
        }
      }
    }

    console.log(
      \`[COMPACTION] Reduced to \${latestEntries.size} live entries (removed \${
        allEntries.length - latestEntries.size
      } obsolete)\`
    );

    // Create new compacted segment
    const compacted = new LogSegment(this.nextSegmentId++);
    for (const entry of latestEntries.values()) {
      compacted.append(entry);
    }
    compacted.freeze();

    // Replace old segments with compacted one
    this.segments = [compacted];

    console.log("[COMPACTION] Complete. Segments reduced to 1\\n");
  }

  // Force flush for demo purposes
  forceFlush(): void {
    this.flush();
  }

  // Display current state
  displayState(): void {
    console.log("\\n=== Store State ===");
    console.log(\`Memtable: \${this.memtable.getAllEntries().length} entries\`);
    console.log(\`Segments: \${this.segments.length}\`);
    for (const segment of this.segments) {
      console.log(
        \`  Segment \${segment.id}: \${segment.length} entries, \${segment.size} bytes\`
      );
    }
    console.log("===================\\n");
  }

  // Show all key-value pairs
  displayData(): void {
    console.log("\\n=== Current Data ===");

    // Collect all unique keys
    const keys = new Set<Key>();
    for (const entry of this.memtable.getAllEntries()) {
      keys.add(entry.key);
    }
    for (const segment of this.segments) {
      for (const entry of segment.getAllEntries()) {
        keys.add(entry.key);
      }
    }

    // Display latest value for each key
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        console.log(\`  \${key}: \${JSON.stringify(value)}\`);
      }
    }
    console.log("====================\\n");
  }
}

// Demo: Show log-structured benefits
function demo() {
  console.log("\\n📊 Log-Structured Storage Demo\\n");

  const store = new LogStructuredStore();

  // Write operations - all sequential appends
  console.log("--- Phase 1: Initial Writes ---");
  store.put("user:1", { name: "Alice", age: 30 });
  store.put("user:2", { name: "Bob", age: 25 });
  store.put("user:3", { name: "Charlie", age: 35 });

  store.displayState();

  // More writes trigger flush
  console.log("--- Phase 2: More Writes (triggers flush) ---");
  store.put("user:4", { name: "David", age: 28 });
  store.put("user:5", { name: "Eve", age: 32 });

  store.displayState();

  // Updates create new entries (old ones become obsolete)
  console.log("--- Phase 3: Updates ---");
  store.put("user:1", { name: "Alice", age: 31 }); // Updated age
  store.put("user:2", { name: "Bob", age: 26 }); // Updated age
  store.put("user:6", { name: "Frank", age: 40 });

  store.displayState();

  // More updates
  console.log("--- Phase 4: More Updates (triggers another flush) ---");
  store.put("user:3", { name: "Charlie", age: 36 });
  store.put("user:7", { name: "Grace", age: 29 });

  store.displayState();

  // Delete operation
  console.log("--- Phase 5: Delete ---");
  store.delete("user:4");
  store.forceFlush();

  store.displayState();

  // Compaction removes obsolete versions
  console.log("--- Phase 6: Manual Compaction ---");
  store["compact"]();

  store.displayState();

  // Verify all reads work correctly
  console.log("--- Phase 7: Verification ---");
  store.displayData();

  console.log("✅ Read Tests:");
  console.log(\`  user:1 age: \${store.get("user:1")?.age} (expected 31)\`);
  console.log(\`  user:2 age: \${store.get("user:2")?.age} (expected 26)\`);
  console.log(\`  user:4: \${store.get("user:4")} (expected undefined - deleted)\`);

  console.log("\\n--- Write Performance Benefit ---");
  console.log("Sequential appends: 10,000+ writes/sec on HDD");
  console.log("Random updates: 100-200 writes/sec on HDD");
  console.log("Speedup: 50-100x for write-heavy workloads!");
}

demo();`,
    },
  ],
};
