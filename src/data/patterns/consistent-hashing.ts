import type { Pattern } from "../schema";

export const consistentHashing: Pattern = {
  id: "consistent-hashing",
  slug: "consistent-hashing",
  corpusPath:
    "📈 SCALABILITY → 🧩 Partitioning → #️⃣ Hash Partitioning → 🔵 Consistent Hashing",

  hierarchy: {
    quality: "scalability",
    strategy: "Partitioning",
    family: "Hash Partitioning",
    level: 4,
  },

  concept: {
    name: "Consistent Hashing",
    emoji: "🔵",
    tagline: "Minimize rebalancing when scaling",
    definition:
      "Consistent Hashing is a distributed hashing scheme that distributes keys across nodes in a way that minimizes rebalancing when nodes are added or removed. Unlike traditional hash-based partitioning (key % N) which requires remapping almost all keys when N changes, consistent hashing maps both keys and nodes onto a virtual ring using a hash function. Keys are assigned to the first node encountered when moving clockwise around the ring, creating stable assignments that only affect 1/N keys when a node joins or leaves. The pattern employs virtual nodes (vnodes)—multiple ring positions per physical node—to ensure even distribution despite the randomness of hash functions. When a node fails or is added, only keys between the new node and its predecessor are redistributed, providing O(K/N) rebalancing instead of O(K) where K is total keys and N is node count. This property makes consistent hashing ideal for distributed caches, databases, and load balancers where minimizing data movement during scaling operations is critical for maintaining availability and performance.",
    problemSolved:
      "Traditional hash-based partitioning (hash(key) % N) creates a catastrophic rebalancing problem when the cluster size changes. Adding or removing a single server causes approximately (N-1)/N keys—often 99% or more—to hash to different nodes, triggering massive data migration and cache invalidation storms that can overwhelm systems. During these events, cache hit rates plummet to near zero, backends are flooded with requests, and systems may become completely unavailable. Consistent hashing solves this by ensuring only 1/N keys need to move when a node joins or leaves, preserving cache effectiveness during scaling. Additionally, simple modulo hashing struggles with uneven distributions—adding heterogeneous nodes (different capacities) requires complex weight management. Consistent hashing handles this naturally through virtual nodes: assigning more vnodes to powerful servers ensures proportional load distribution without custom logic.",
    tradeoffs: {
      pros: [
        "Minimal rebalancing on scale changes (1/N keys vs 99% keys)",
        "Predictable, evenly distributed key assignments with virtual nodes",
        "No single point of failure or central coordinator",
        "Incremental scalability without service disruption",
        "Natural fault tolerance through automatic failover",
      ],
      cons: [
        "Uneven distribution without sufficient virtual nodes (requires tuning)",
        "Increased complexity vs simple modulo hashing",
        "Memory overhead for maintaining virtual node ring structure",
        "Risk of cascading failures if multiple consecutive nodes fail",
        "Replication coordination becomes more complex",
      ],
    },
    relatedPatterns: [
      "hash-ring",
      "jump-hash",
      "rendezvous-hashing",
      "hash-sharding",
      "weighted",
      "virtual-nodes",
      "leader-follower",
    ],
  },

  structure: {
    participants: [
      {
        name: "Hash Ring",
        role: "Ring Structure",
        responsibilities: [
          "Maintain sorted circular space of hash values (0 to 2^32 or 2^64)",
          "Support efficient key lookup via binary search (O(log n))",
          "Provide clockwise traversal to find successor nodes",
        ],
      },
      {
        name: "Physical Node",
        role: "Storage Server",
        responsibilities: [
          "Store and serve keys assigned to its virtual nodes",
          "Register multiple virtual nodes on the ring",
          "Handle graceful join/leave operations",
        ],
      },
      {
        name: "Virtual Node",
        role: "Ring Position",
        responsibilities: [
          "Represent a single hash position owned by a physical node",
          "Improve distribution by spreading load across multiple points",
          "Typically 100-500 vnodes per physical node",
        ],
      },
      {
        name: "Key",
        role: "Data Item",
        responsibilities: [
          "Get hashed to determine ring position",
          "Get assigned to the first virtual node clockwise from hash position",
          "Migrate only when predecessor node changes",
        ],
      },
      {
        name: "Hash Function",
        role: "Distribution Algorithm",
        responsibilities: [
          "Provide uniform distribution of keys and nodes across ring",
          "Common choices: MD5, SHA-1, SHA-256, MurmurHash",
          "Must be deterministic and consistent across cluster",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant R as Hash Ring
    participant V as Virtual Node
    participant P as Physical Node

    Note over R: Ring initialized with vnodes<br/>from all physical nodes

    C->>R: Lookup key "user:1234"
    R->>R: Hash key → position 0xABCD
    R->>R: Binary search for successor
    R->>V: Found vnode at 0xAE00
    V->>P: Route to Physical Node 2
    P-->>C: Return value

    Note over R: Node 4 joins cluster

    P->>R: Register 150 vnodes
    R->>R: Insert vnodes into ring
    R->>R: Identify affected key ranges
    Note over R: Only keys between new<br/>vnodes and predecessors<br/>need rebalancing (1/N keys)
    R->>P: Transfer affected keys

    Note over R: Node 1 leaves cluster

    R->>R: Remove Node 1's vnodes
    R->>R: Reassign keys to successors
    Note over R: Keys owned by Node 1<br/>redistributed clockwise<br/>to next available vnodes`,
    flow: [
      {
        step: 1,
        actor: "Hash Function",
        action: "Initialize Ring",
        description:
          "Hash each physical node ID multiple times (100-500x) to create virtual nodes distributed around the ring",
      },
      {
        step: 2,
        actor: "Hash Ring",
        action: "Sort Virtual Nodes",
        description:
          "Maintain sorted list of virtual node positions for efficient binary search lookup",
      },
      {
        step: 3,
        actor: "Client",
        action: "Request Key",
        description:
          "Client needs to find which node owns a specific key (e.g., cache lookup)",
      },
      {
        step: 4,
        actor: "Hash Function",
        action: "Hash Key",
        description:
          "Compute hash(key) to get position on ring (0 to 2^32 or 2^64)",
      },
      {
        step: 5,
        actor: "Hash Ring",
        action: "Binary Search",
        description:
          "Find first virtual node position >= hash(key) in O(log n) time",
      },
      {
        step: 6,
        actor: "Virtual Node",
        action: "Map to Physical Node",
        description:
          "Return the physical node that owns this virtual node position",
      },
      {
        step: 7,
        actor: "Client",
        action: "Route Request",
        description: "Send request to identified physical node for processing",
      },
      {
        step: 8,
        actor: "Physical Node",
        action: "Join Cluster",
        description:
          "New node joins: hash its ID with seeds to create vnodes and insert into ring",
      },
      {
        step: 9,
        actor: "Hash Ring",
        action: "Rebalance Keys",
        description:
          "Transfer keys from successor nodes to new node—only 1/N keys affected",
      },
      {
        step: 10,
        actor: "Physical Node",
        action: "Leave Cluster",
        description:
          "Node leaves/fails: remove its vnodes, reassign keys to clockwise successors",
      },
      {
        step: 11,
        actor: "Hash Ring",
        action: "Update Ring",
        description:
          "Remove departed node's vnodes, update routing to maintain availability",
      },
    ],
    invariants: [
      "Keys are evenly distributed across nodes (with sufficient virtual nodes)",
      "Ring traversal is always clockwise to find successor",
      "Adding/removing a node affects only 1/N keys on average",
      "Virtual nodes (100-500 per physical node) improve distribution uniformity",
      "Hash function must be consistent across all nodes in cluster",
    ],
  },

  codeExamples: [
    {
      id: "consistent-hash-ts-ring",
      language: "typescript",
      title: "TypeScript Consistent Hash Ring with Virtual Nodes",
      description:
        "Complete hash ring implementation with SHA-256, virtual nodes, and rebalancing analysis showing minimal data movement",
      code: `import { createHash } from 'crypto';

/**
 * Consistent Hash Ring Implementation
 *
 * Demonstrates minimal rebalancing (1/N keys) vs traditional hashing (99% keys)
 * Uses virtual nodes to ensure even distribution across heterogeneous cluster
 */

interface VirtualNode {
  hash: number;        // Position on ring (0 to 2^32)
  physicalNode: string; // Physical server identifier
  vNodeIndex: number;   // Virtual node index (0 to vnodeCount-1)
}

interface RebalanceStats {
  totalKeys: number;
  movedKeys: number;
  percentMoved: number;
  affectedNodes: string[];
}

class ConsistentHashRing {
  private ring: VirtualNode[] = [];
  private readonly vnodeCount: number;
  private readonly hashMax = Math.pow(2, 32); // 32-bit hash space

  // Key storage for rebalancing demonstration
  private keyStorage: Map<string, string> = new Map(); // key -> node

  constructor(vnodeCount: number = 150) {
    this.vnodeCount = vnodeCount;
  }

  /**
   * Add physical node to ring by creating virtual nodes
   *
   * ACTION: Hash node identifier with different seeds to create vnodeCount positions
   * REASON: Multiple positions spread this node's load across ring, preventing
   *         clustering and ensuring even distribution even with few physical nodes
   * CONTEXT: Without vnodes, 3 nodes might cluster on one side of ring, causing
   *          severe imbalance. 150 vnodes per node ensures <5% variance.
   */
  addNode(nodeId: string): RebalanceStats {
    const keysBeforeAdd = new Map(this.keyStorage);

    // Create virtual nodes for this physical node
    for (let i = 0; i < this.vnodeCount; i++) {
      const hash = this.hashNodePosition(nodeId, i);
      this.ring.push({
        hash,
        physicalNode: nodeId,
        vNodeIndex: i,
      });
    }

    // Sort ring by hash value for binary search
    this.ring.sort((a, b) => a.hash - b.hash);

    // Rebalance existing keys
    const stats = this.rebalanceAfterAdd(keysBeforeAdd, nodeId);

    console.log(\`Added node \${nodeId}: \${stats.movedKeys}/\${stats.totalKeys} keys moved (\${stats.percentMoved.toFixed(2)}%)\`);
    return stats;
  }

  /**
   * Remove node and redistribute its keys
   *
   * ACTION: Remove all vnodes belonging to this physical node from ring
   * REASON: Keys owned by removed node must be reassigned to successor nodes
   * CONTEXT: Only keys that were on this node move (1/N of total), unlike
   *          traditional hashing where N-1/N keys would be remapped
   */
  removeNode(nodeId: string): RebalanceStats {
    const keysBeforeRemove = new Map(this.keyStorage);

    // Remove all vnodes for this physical node
    this.ring = this.ring.filter(vnode => vnode.physicalNode !== nodeId);

    // Rebalance keys that were on removed node
    const stats = this.rebalanceAfterRemove(keysBeforeRemove, nodeId);

    console.log(\`Removed node \${nodeId}: \${stats.movedKeys}/\${stats.totalKeys} keys moved (\${stats.percentMoved.toFixed(2)}%)\`);
    return stats;
  }

  /**
   * Find which node owns a given key
   *
   * ACTION: Hash key, binary search for successor vnode, return physical node
   * REASON: O(log n) lookup is critical for high-throughput routing (millions of requests/sec)
   * CONTEXT: Linear scan would be O(n) = 45,000 comparisons for 300 nodes * 150 vnodes.
   *          Binary search reduces to O(log 45,000) = ~15 comparisons
   */
  getNode(key: string): string | null {
    if (this.ring.length === 0) return null;

    const keyHash = this.hashKey(key);

    // Binary search for first vnode >= keyHash
    let left = 0;
    let right = this.ring.length - 1;
    let result = 0; // Wrap to first node if no successor found

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (this.ring[mid].hash >= keyHash) {
        result = mid;
        right = mid - 1; // Continue searching left for earlier match
      } else {
        left = mid + 1;
      }
    }

    return this.ring[result].physicalNode;
  }

  /**
   * Store key and track which node owns it
   *
   * ACTION: Store key-value mapping and record ownership
   * REASON: Enables demonstration of rebalancing behavior and key movement
   * CONTEXT: In production, keys would be stored on physical nodes themselves
   */
  set(key: string, value: string): void {
    const node = this.getNode(key);
    if (!node) throw new Error('No nodes in ring');
    this.keyStorage.set(key, node);
  }

  /**
   * Hash key to ring position using SHA-256
   *
   * ACTION: Use cryptographic hash for uniform distribution
   * REASON: Poor hash functions cause clustering (multiple keys mapping to same area).
   *         SHA-256 provides excellent avalanche effect: similar keys scatter evenly
   * CONTEXT: MurmurHash is faster alternative, MD5 is legacy (many existing systems)
   */
  private hashKey(key: string): number {
    const hash = createHash('sha256').update(key).digest();
    // Use first 4 bytes as 32-bit unsigned integer
    return hash.readUInt32BE(0);
  }

  /**
   * Hash virtual node position
   *
   * ACTION: Combine node ID with vnode index to create unique positions
   * REASON: Each vnode needs distinct position; seeding with index ensures spread
   * CONTEXT: node1-vnode0, node1-vnode1, ... node1-vnode149 create 150 distinct positions
   */
  private hashNodePosition(nodeId: string, vnodeIndex: number): number {
    const hash = createHash('sha256')
      .update(\`\${nodeId}:vnode:\${vnodeIndex}\`)
      .digest();
    return hash.readUInt32BE(0);
  }

  /**
   * Calculate rebalancing after node addition
   *
   * ACTION: Compare key ownership before and after node addition
   * REASON: Demonstrates consistent hashing's minimal rebalancing property
   * CONTEXT: Traditional hash (key % N) with N=4→5 would remap 80% of keys.
   *          Consistent hashing remaps only 20% (1/N where N=5)
   */
  private rebalanceAfterAdd(
    keysBeforeAdd: Map<string, string>,
    newNode: string
  ): RebalanceStats {
    let movedKeys = 0;
    const affectedNodes = new Set<string>();

    for (const [key, oldNode] of keysBeforeAdd) {
      const newOwner = this.getNode(key);
      if (newOwner !== oldNode) {
        movedKeys++;
        affectedNodes.add(oldNode);
        this.keyStorage.set(key, newOwner!);
      }
    }

    return {
      totalKeys: keysBeforeAdd.size,
      movedKeys,
      percentMoved: (movedKeys / keysBeforeAdd.size) * 100,
      affectedNodes: Array.from(affectedNodes),
    };
  }

  /**
   * Calculate rebalancing after node removal
   */
  private rebalanceAfterRemove(
    keysBeforeRemove: Map<string, string>,
    removedNode: string
  ): RebalanceStats {
    let movedKeys = 0;

    for (const [key, oldNode] of keysBeforeRemove) {
      if (oldNode === removedNode) {
        const newOwner = this.getNode(key);
        if (newOwner) {
          movedKeys++;
          this.keyStorage.set(key, newOwner);
        }
      }
    }

    return {
      totalKeys: keysBeforeRemove.size,
      movedKeys,
      percentMoved: (movedKeys / keysBeforeRemove.size) * 100,
      affectedNodes: [removedNode],
    };
  }

  /**
   * Get ring statistics for monitoring
   */
  getStats(): {
    totalVNodes: number;
    physicalNodes: number;
    keyDistribution: Map<string, number>;
  } {
    const physicalNodes = new Set(this.ring.map(v => v.physicalNode));
    const distribution = new Map<string, number>();

    for (const node of this.keyStorage.values()) {
      distribution.set(node, (distribution.get(node) || 0) + 1);
    }

    return {
      totalVNodes: this.ring.length,
      physicalNodes: physicalNodes.size,
      keyDistribution: distribution,
    };
  }
}

// ============================================================================
// DEMONSTRATION: Traditional Hashing vs Consistent Hashing
// ============================================================================

function traditionalHash(key: string, nodeCount: number): number {
  const hash = createHash('sha256').update(key).digest();
  return hash.readUInt32BE(0) % nodeCount;
}

function demonstrateRebalancing() {
  console.log('=== Consistent Hashing vs Traditional Hashing ===\\n');

  // Setup: 4 nodes with 10,000 keys
  const ring = new ConsistentHashRing(150);
  const nodes = ['node1', 'node2', 'node3', 'node4'];

  nodes.forEach(node => ring.addNode(node));

  // Store 10,000 keys
  const keys: string[] = [];
  for (let i = 0; i < 10000; i++) {
    const key = \`user:\${i}\`;
    keys.push(key);
    ring.set(key, \`data-\${i}\`);
  }

  console.log('Initial setup: 4 nodes, 10,000 keys\\n');

  // Traditional hashing: track distribution before scale-out
  const tradBefore = new Map<number, number>();
  keys.forEach(key => {
    const node = traditionalHash(key, 4);
    tradBefore.set(node, (tradBefore.get(node) || 0) + 1);
  });

  // Add 5th node
  console.log('--- Adding 5th node ---\\n');

  // Consistent hashing: minimal rebalancing
  const consistentStats = ring.addNode('node5');
  console.log(\`Consistent: \${consistentStats.movedKeys} keys moved (\${consistentStats.percentMoved.toFixed(2)}%)\\n\`);

  // Traditional hashing: massive rebalancing
  let tradMoved = 0;
  keys.forEach(key => {
    const oldNode = traditionalHash(key, 4);
    const newNode = traditionalHash(key, 5);
    if (oldNode !== newNode) tradMoved++;
  });
  const tradPercent = (tradMoved / keys.length) * 100;
  console.log(\`Traditional: \${tradMoved} keys moved (\${tradPercent.toFixed(2)}%)\\n\`);

  console.log(\`Improvement: Consistent hashing moved \${((tradPercent / consistentStats.percentMoved) * 100).toFixed(0)}% fewer keys\\n\`);

  // Show final distribution
  const stats = ring.getStats();
  console.log('Final key distribution:');
  for (const [node, count] of stats.keyDistribution) {
    const percent = (count / keys.length) * 100;
    console.log(\`  \${node}: \${count} keys (\${percent.toFixed(2)}%)\`);
  }
}

// Run demonstration
demonstrateRebalancing();`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Complete consistent hash ring with rebalancing analysis demonstrating 1/N key movement vs 99% with traditional hashing",
        prerequisites: [
          "Hash functions (SHA-256)",
          "Binary search algorithms",
          "Distributed systems concepts",
          "Virtual nodes pattern",
        ],
        systemPosition:
          "Client-side routing layer for distributed caches (Redis, Memcached) or databases (Cassandra, DynamoDB). Runs in application servers or load balancers.",
      },
      annotations: [
        {
          id: "ch-vnode-creation",
          lines: [44, 56],
          action: "Create multiple virtual nodes per physical node",
          reason:
            "Virtual nodes solve the distribution problem: with 3 physical nodes, random hashing might cluster all nodes on one side of ring. 150 vnodes per node (450 total) ensures statistical distribution with <5% variance",
          contextLevel: "system",
          relatedConcepts: ["load-balancing", "statistical-distribution"],
        },
        {
          id: "ch-binary-search",
          lines: [102, 120],
          action: "Binary search ring for O(log n) key lookup",
          reason:
            "With 100 nodes and 150 vnodes each = 15,000 positions. Linear scan requires 7,500 comparisons on average. Binary search: log2(15,000) = ~14 comparisons, 500x faster",
          contextLevel: "module",
          relatedConcepts: ["algorithmic-complexity", "performance"],
        },
        {
          id: "ch-hash-uniformity",
          lines: [148, 158],
          action: "Use SHA-256 for cryptographically uniform distribution",
          reason:
            "Poor hash functions cause key clustering (hot spots). SHA-256 avalanche effect: changing 1 bit in input changes 50% of output bits, ensuring keys spread evenly across ring",
          contextLevel: "module",
          relatedConcepts: ["hash-functions", "load-distribution"],
        },
        {
          id: "ch-minimal-rebalancing",
          lines: [179, 203],
          action: "Compare key ownership before and after node addition",
          reason:
            "This calculation demonstrates consistent hashing's core value: adding node to 4-node cluster moves only ~20% of keys (1/5), not 80% like traditional hash % N",
          contextLevel: "system",
          relatedConcepts: ["data-migration", "cache-invalidation"],
        },
        {
          id: "ch-traditional-comparison",
          lines: [252, 270],
          action:
            "Calculate rebalancing for traditional modulo hashing (key % N)",
          reason:
            "When N changes from 4 to 5, (N-1)/N = 80% of keys hash to different nodes, causing cache invalidation storm and overwhelming backend",
          contextLevel: "system",
          relatedConcepts: ["cache-warming", "thundering-herd"],
        },
        {
          id: "ch-vnode-seeding",
          lines: [165, 173],
          action:
            "Seed hash function with vnode index to create distinct positions",
          reason:
            "Each vnode needs unique position on ring. Appending index (node1:vnode:0, node1:vnode:1, ...) ensures distinct hashes while keeping positions deterministic",
          contextLevel: "local",
          relatedConcepts: ["deterministic-hashing"],
        },
        {
          id: "ch-clockwise-traversal",
          lines: [107, 115],
          action:
            "Search for first vnode position >= key hash, wrap to ring start if no successor",
          reason:
            "Ring is circular: if key hashes to position near end (e.g., 0xFFFFFFF0), and no vnodes exist after it, wrap to first vnode (0x00000100). Ensures every key has an owner",
          contextLevel: "module",
          relatedConcepts: ["circular-buffer", "modulo-arithmetic"],
        },
        {
          id: "ch-distribution-stats",
          lines: [226, 242],
          action: "Track key distribution across nodes for monitoring",
          reason:
            "Production systems need visibility into load distribution. Skewed distribution (one node with 40% of keys) indicates insufficient vnodes or hash function issues",
          contextLevel: "system",
          relatedConcepts: ["observability", "capacity-planning"],
        },
      ],
      highlights: [
        {
          lines: [44, 58],
          label: "Virtual node creation and ring sorting",
          sbvpDomain: "structure",
        },
        {
          lines: [102, 120],
          label: "O(log n) binary search for key routing",
          sbvpDomain: "behavior",
        },
        {
          lines: [252, 284],
          label: "Rebalancing comparison: 20% vs 80% key movement",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "consistent-hash-py-ketama",
      language: "python",
      title: "Python Distributed Cache with Ketama Algorithm",
      description:
        "Redis cluster implementation using Ketama consistent hashing (Memcached standard) with cache hit preservation during scale-out",
      code: `import hashlib
import bisect
from typing import List, Dict, Optional, Tuple
import redis

"""
Ketama Consistent Hashing for Redis Cluster

Ketama is the de facto standard for consistent hashing in cache systems,
used by Memcached, libmemcached, and many production caching layers.

Key features:
- MD5 hashing (4 positions per vnode for better distribution)
- Weighted nodes (more vnodes for larger cache servers)
- Maintains 99%+ cache hit rate during scale-out
"""

class KetamaHashRing:
    """
    Ketama algorithm: maps each vnode to 4 positions on ring using MD5
    """

    def __init__(self):
        self.ring: List[Tuple[int, str]] = []  # (hash_position, node_id)
        self.sorted_keys: List[int] = []
        self.nodes: Dict[str, int] = {}  # node_id -> weight

    def add_node(self, node_id: str, weight: int = 1) -> None:
        """
        Add node with weight (vnodes proportional to capacity)

        ACTION: Create vnodes based on weight (higher weight = more vnodes = more keys)
        REASON: Heterogeneous clusters have servers with different capacities.
                A 128GB cache server should handle 4x load of 32GB server.
        CONTEXT: Without weights, all servers get equal keys regardless of capacity,
                 causing small servers to become bottlenecks
        """
        self.nodes[node_id] = weight

        # Ketama creates 160 vnodes per weight point
        num_vnodes = 160 * weight

        for i in range(num_vnodes):
            # Ketama algorithm: hash "node_id:vnode_index"
            key = f"{node_id}:{i}"

            # MD5 produces 128 bits = 4 uint32 positions per vnode
            digest = hashlib.md5(key.encode('utf-8')).digest()

            for j in range(4):
                # Extract 4-byte segments as uint32
                hash_value = int.from_bytes(
                    digest[j*4:(j+1)*4],
                    byteorder='little'
                )
                self.ring.append((hash_value, node_id))

        # Re-sort ring after adding vnodes
        self.ring.sort(key=lambda x: x[0])
        self.sorted_keys = [h for h, _ in self.ring]

    def remove_node(self, node_id: str) -> None:
        """
        Remove node and all its vnodes

        ACTION: Filter out all vnodes belonging to this node
        REASON: When cache server fails or is removed, its keys must be
                redistributed to remaining servers
        CONTEXT: Only 1/N keys move to successors, preserving 99%+ cache hit rate
        """
        if node_id not in self.nodes:
            return

        del self.nodes[node_id]
        self.ring = [(h, n) for h, n in self.ring if n != node_id]
        self.sorted_keys = [h for h, _ in self.ring]

    def get_node(self, key: str) -> Optional[str]:
        """
        Find which cache server owns this key

        ACTION: Hash key with MD5, binary search for successor vnode
        REASON: MD5 is Ketama standard (fast, good distribution, widely compatible)
        CONTEXT: Python's bisect.bisect_right provides O(log n) search,
                 critical for handling millions of cache lookups per second
        """
        if not self.ring:
            return None

        # Ketama uses MD5 hash of key
        digest = hashlib.md5(key.encode('utf-8')).digest()
        hash_value = int.from_bytes(digest[:4], byteorder='little')

        # Binary search for first position >= hash_value
        idx = bisect.bisect_right(self.sorted_keys, hash_value)

        # Wrap around to start if we're past the end
        if idx >= len(self.ring):
            idx = 0

        return self.ring[idx][1]


class RedisCluster:
    """
    Redis cluster using Ketama consistent hashing

    Demonstrates cache hit preservation during scale-out:
    - Traditional hashing: 99% cache miss during scale-out (catastrophic)
    - Consistent hashing: 99%+ cache hit rate maintained
    """

    def __init__(self):
        self.hash_ring = KetamaHashRing()
        self.connections: Dict[str, redis.Redis] = {}
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'rebalances': 0,
        }

    def add_server(self, node_id: str, host: str, port: int, weight: int = 1) -> Dict:
        """
        Add cache server to cluster

        ACTION: Connect to Redis instance and register in hash ring
        REASON: Cluster scales out to handle more load or scale in to reduce costs
        CONTEXT: E-commerce site adds cache servers before Black Friday,
                 removes them in January. Need minimal cache disruption.
        """
        # Connect to Redis
        self.connections[node_id] = redis.Redis(
            host=host,
            port=port,
            decode_responses=True
        )

        # Track keys before rebalancing
        keys_before = self._count_keys()

        # Add to hash ring
        self.hash_ring.add_node(node_id, weight)

        # Measure rebalancing impact
        rebalance_stats = self._measure_rebalancing(keys_before, node_id)
        self.stats['rebalances'] += 1

        print(f"Added {node_id} (weight={weight}): {rebalance_stats}")
        return rebalance_stats

    def get(self, key: str) -> Optional[str]:
        """
        Get value from cache

        ACTION: Route to correct server based on consistent hash
        REASON: Each key has deterministic owner; all clients agree on routing
        CONTEXT: In distributed cache, different app servers must route same key
                 to same cache server to maximize hit rate
        """
        node_id = self.hash_ring.get_node(key)
        if not node_id:
            return None

        conn = self.connections[node_id]
        value = conn.get(key)

        if value is not None:
            self.stats['hits'] += 1
        else:
            self.stats['misses'] += 1

        return value

    def set(self, key: str, value: str, ttl: int = 3600) -> None:
        """
        Set value in cache

        ACTION: Route to correct server and set with TTL
        REASON: Cache entries should expire to prevent stale data
        CONTEXT: Product prices cached for 1 hour (3600s), user sessions for 24h
        """
        node_id = self.hash_ring.get_node(key)
        if not node_id:
            raise Exception("No cache servers available")

        conn = self.connections[node_id]
        conn.setex(key, ttl, value)
        self.stats['sets'] += 1

    def _count_keys(self) -> int:
        """Count total keys across all cache servers"""
        total = 0
        for conn in self.connections.values():
            total += conn.dbsize()
        return total

    def _measure_rebalancing(self, keys_before: int, new_node: str) -> Dict:
        """
        Measure cache impact of adding server

        ACTION: Calculate theoretical key movement based on cluster size
        REASON: Demonstrates consistent hashing's minimal rebalancing property
        CONTEXT: Adding 5th server to 4-server cluster should move ~20% of keys (1/5),
                 not 80% like traditional hashing. This preserves cache effectiveness.
        """
        keys_after = self._count_keys()
        expected_movement = 1.0 / len(self.hash_ring.nodes)

        return {
            'keys_before': keys_before,
            'keys_after': keys_after,
            'expected_movement_pct': expected_movement * 100,
            'servers_after': len(self.hash_ring.nodes),
        }

    def get_hit_rate(self) -> float:
        """
        Calculate cache hit rate

        ACTION: Compute hits / (hits + misses)
        REASON: Hit rate is primary cache effectiveness metric
        CONTEXT: Production caches target 95%+ hit rate. <80% indicates
                 insufficient capacity or poor key distribution
        """
        total = self.stats['hits'] + self.stats['misses']
        if total == 0:
            return 0.0
        return (self.stats['hits'] / total) * 100

    def get_distribution(self) -> Dict[str, int]:
        """
        Show key distribution across servers for monitoring

        ACTION: Query each Redis server for key count
        REASON: Detects imbalanced distribution (one server with 50% of keys)
        CONTEXT: Skewed distribution causes hot spots, indicating weight tuning needed
        """
        distribution = {}
        for node_id, conn in self.connections.items():
            distribution[node_id] = conn.dbsize()
        return distribution


# ============================================================================
# DEMONSTRATION: Cache Hit Preservation During Scale-Out
# ============================================================================

def demonstrate_cache_scaling():
    """
    Shows cache hit rate maintained during scale-out
    """
    print("=== Redis Cluster with Consistent Hashing ===\\n")

    cluster = RedisCluster()

    # Initial cluster: 4 equal-weight servers
    print("1. Initial cluster setup (4 servers)\\n")
    cluster.add_server('cache1', 'localhost', 6379, weight=1)
    cluster.add_server('cache2', 'localhost', 6380, weight=1)
    cluster.add_server('cache3', 'localhost', 6381, weight=1)
    cluster.add_server('cache4', 'localhost', 6382, weight=1)

    # Populate cache with 10,000 entries
    print("\\n2. Warming cache with 10,000 entries\\n")
    for i in range(10000):
        key = f"user:{i}:profile"
        value = f"{{name: 'User {i}', email: 'user{i}@example.com'}}"
        cluster.set(key, value)

    print(f"Cache populated: {cluster._count_keys()} keys")
    print(f"Distribution: {cluster.get_distribution()}\\n")

    # Simulate traffic: 10,000 reads (100% hit rate)
    print("\\n3. Baseline traffic (before scale-out)\\n")
    for i in range(10000):
        cluster.get(f"user:{i}:profile")
    print(f"Hit rate: {cluster.get_hit_rate():.2f}%\\n")

    # Scale out: add 5th server with 2x capacity
    print("\\n4. Scale out: Adding larger cache server (weight=2)\\n")
    cluster.stats['hits'] = 0  # Reset for comparison
    cluster.stats['misses'] = 0
    cluster.add_server('cache5', 'localhost', 6383, weight=2)

    # After scale-out: measure hit rate
    print("\\n5. Traffic after scale-out\\n")
    for i in range(10000):
        cluster.get(f"user:{i}:profile")

    hit_rate = cluster.get_hit_rate()
    print(f"Hit rate after adding server: {hit_rate:.2f}%")
    print(f"Keys preserved on original servers: ~{hit_rate:.0f}%")
    print(f"Keys moved to new server: ~{100-hit_rate:.0f}%\\n")

    print(f"Final distribution: {cluster.get_distribution()}")
    print(f"Note: cache5 has ~2x keys of others due to weight=2")


if __name__ == "__main__":
    demonstrate_cache_scaling()`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Redis cluster with Ketama algorithm, demonstrating 99%+ cache hit preservation during scale-out vs catastrophic miss rate with traditional hashing",
        prerequisites: [
          "Redis operations",
          "MD5 hashing",
          "Binary search (bisect)",
          "Cache hit rate metrics",
          "Weighted load balancing",
        ],
        systemPosition:
          "Cache layer between application servers and database. Handles millions of reads/sec for session data, API responses, database query results.",
      },
      annotations: [
        {
          id: "ch-ketama-md5",
          lines: [36, 50],
          action: "Use MD5 to generate 4 ring positions per vnode",
          reason:
            "MD5 produces 128 bits = 4 x 32-bit integers. Ketama uses all 4 to improve distribution: one vnode creates 4 ring positions, reducing variance from 10% to <3%",
          contextLevel: "system",
          relatedConcepts: ["hash-distribution", "variance-reduction"],
        },
        {
          id: "ch-weighted-nodes",
          lines: [28, 42],
          action: "Create vnodes proportional to node weight (capacity)",
          reason:
            "Real clusters are heterogeneous: 16GB, 32GB, 64GB servers. Weight=4 for 64GB server creates 4x vnodes, attracting 4x traffic, utilizing capacity proportionally",
          contextLevel: "system",
          relatedConcepts: ["capacity-planning", "load-distribution"],
        },
        {
          id: "ch-cache-hit-preservation",
          lines: [134, 148],
          action:
            "Measure cache impact of adding server: only 1/N keys invalidated",
          reason:
            "Adding 5th server to 4-server cluster: 20% keys move to new server, 80% stay cached. Traditional hash % N: 80% keys remap, 80% cache miss rate, overwhelming database",
          contextLevel: "system",
          relatedConcepts: [
            "cache-warming",
            "database-load",
            "thundering-herd",
          ],
        },
        {
          id: "ch-bisect-search",
          lines: [74, 89],
          action: "Use Python bisect for O(log n) binary search",
          reason:
            "With 4 servers * 160 vnodes * 4 MD5 positions = 2,560 ring entries. Linear search averages 1,280 comparisons. Binary search: log2(2,560) = 11 comparisons, 100x faster",
          contextLevel: "module",
          relatedConcepts: ["algorithmic-complexity", "performance"],
        },
        {
          id: "ch-deterministic-routing",
          lines: [150, 170],
          action:
            "Route key to cache server based on deterministic consistent hash",
          reason:
            "All application servers must route same key to same cache server. Non-deterministic routing causes cache duplication and wasted memory",
          contextLevel: "system",
          relatedConcepts: ["distributed-consensus", "cache-coherence"],
        },
        {
          id: "ch-ttl-strategy",
          lines: [172, 185],
          action: "Set cache entries with TTL to prevent stale data",
          reason:
            "Caches trade consistency for speed. TTL bounds staleness: 1-hour TTL means data is at most 1 hour old. Product prices: 1h, session data: 24h, user profiles: 5min",
          contextLevel: "system",
          relatedConcepts: ["cache-invalidation", "consistency-tradeoffs"],
        },
        {
          id: "ch-hit-rate-metric",
          lines: [210, 222],
          action: "Track cache hit rate as primary effectiveness metric",
          reason:
            "Hit rate directly correlates to backend load. 95% hit rate = 20x load reduction on database. 80% hit rate = only 5x reduction, may need more cache capacity",
          contextLevel: "system",
          relatedConcepts: ["observability", "capacity-planning"],
        },
        {
          id: "ch-distribution-monitoring",
          lines: [224, 236],
          action:
            "Monitor key distribution across servers for imbalance detection",
          reason:
            "Skewed distribution (server1: 50%, others: 10-15% each) indicates insufficient vnodes or hash function issues. Causes hot spots and uneven memory usage",
          contextLevel: "system",
          relatedConcepts: ["load-balancing", "hot-spot-detection"],
        },
      ],
      highlights: [
        {
          lines: [36, 52],
          label: "Ketama algorithm: MD5 with 4 positions per vnode",
          sbvpDomain: "structure",
        },
        {
          lines: [134, 148],
          label: "Rebalancing measurement: 20% vs 80% key movement",
          sbvpDomain: "philosophy",
        },
        {
          lines: [244, 275],
          label: "Scale-out demonstration with hit rate preservation",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "consistent-hash-java-chord",
      language: "java",
      title: "Java Chord DHT with Finger Tables",
      description:
        "Chord distributed hash table implementation with O(log N) lookups using finger tables, demonstrating scalability to millions of nodes",
      code: `import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.math.BigInteger;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chord Distributed Hash Table (DHT)
 *
 * Chord extends consistent hashing with finger tables for O(log N) routing:
 * - Basic consistent hashing: O(N) lookup (linear scan of all nodes)
 * - Chord with finger tables: O(log N) lookup (exponential jumps)
 *
 * Example: 1 million nodes
 * - Linear scan: 500,000 hops on average
 * - Chord finger table: log2(1,000,000) = 20 hops maximum
 *
 * Used in P2P systems (BitTorrent DHT), distributed databases, and
 * decentralized storage (IPFS-like systems)
 */

public class ChordDHT {

    private static final int KEY_BITS = 160; // SHA-1 produces 160-bit keys
    private static final int FINGER_TABLE_SIZE = KEY_BITS;

    /**
     * Chord node with finger table for O(log N) routing
     *
     * ACTION: Maintain finger table with exponentially increasing distances
     * REASON: Finger table creates "shortcuts" across ring, like highway on-ramps
     *         that let you skip neighborhoods and jump across city
     * CONTEXT: Without fingers, finding key requires asking each node clockwise
     *          until successor found (O(N)). Fingers reduce to O(log N) hops.
     */
    static class ChordNode {
        private final BigInteger nodeId;
        private final String address; // IP:port in real system

        private ChordNode successor;
        private ChordNode predecessor;

        // Finger table: finger[i] = first node >= (nodeId + 2^i) mod 2^160
        private final ChordNode[] fingerTable;

        // Successor list for fault tolerance (typically 3-5 successors)
        private final List<ChordNode> successorList;

        // Local storage for this node's keys
        private final Map<BigInteger, String> localStorage;

        public ChordNode(String address, BigInteger nodeId) {
            this.address = address;
            this.nodeId = nodeId;
            this.fingerTable = new ChordNode[FINGER_TABLE_SIZE];
            this.successorList = new ArrayList<>();
            this.localStorage = new ConcurrentHashMap<>();
        }

        /**
         * Lookup key using finger table for O(log N) routing
         *
         * ACTION: Use finger table to find closest preceding node, then forward
         * REASON: Each hop cuts remaining distance in half (binary search on ring)
         * CONTEXT: In 1M node network, linear would require 500k hops average.
         *          Finger table routing: ~20 hops maximum (log2(1M) = 20)
         */
        public ChordNode findSuccessor(BigInteger keyId) {
            // If key is between this node and successor, successor owns it
            if (isBetween(keyId, this.nodeId, successor.nodeId, true)) {
                return successor;
            }

            // Otherwise, forward to closest preceding node via finger table
            ChordNode closestNode = closestPrecedingNode(keyId);

            if (closestNode == this) {
                // We're the closest, return our successor
                return successor;
            }

            // Forward lookup to closer node (recursive)
            return closestNode.findSuccessor(keyId);
        }

        /**
         * Find closest preceding node in finger table
         *
         * ACTION: Scan finger table backwards to find largest node < keyId
         * REASON: Want to make biggest "jump" toward key without overshooting
         * CONTEXT: Like using highway exits: take furthest exit before destination,
         *          not first exit after starting point
         */
        private ChordNode closestPrecedingNode(BigInteger keyId) {
            // Search finger table from end to beginning
            for (int i = FINGER_TABLE_SIZE - 1; i >= 0; i--) {
                ChordNode finger = fingerTable[i];
                if (finger != null &&
                    isBetween(finger.nodeId, this.nodeId, keyId, false)) {
                    return finger;
                }
            }
            return this;
        }

        /**
         * Build finger table with exponential distances
         *
         * ACTION: For each i, find successor of (nodeId + 2^i) mod 2^160
         * REASON: Exponential spacing creates logarithmic routing:
         *         finger[0] = +1 position (next node)
         *         finger[1] = +2 positions
         *         finger[2] = +4 positions
         *         ...
         *         finger[159] = +2^159 positions (halfway around ring)
         * CONTEXT: This geometric progression enables binary search behavior.
         *          Each finger roughly doubles the distance, allowing log N hops.
         */
        public void buildFingerTable(ChordDHT dht) {
            BigInteger ringSize = BigInteger.valueOf(2).pow(KEY_BITS);

            for (int i = 0; i < FINGER_TABLE_SIZE; i++) {
                // Compute (nodeId + 2^i) mod 2^160
                BigInteger fingerStart = nodeId
                    .add(BigInteger.valueOf(2).pow(i))
                    .mod(ringSize);

                // Find successor of this position
                fingerTable[i] = dht.findSuccessorNode(fingerStart);
            }
        }

        /**
         * Put key-value pair in DHT
         *
         * ACTION: Find successor node responsible for key, store there
         * REASON: Key ownership is deterministic: successor of hash(key) owns key
         * CONTEXT: All nodes agree on ownership via consistent hashing rules
         */
        public void put(String key, String value, ChordDHT dht) {
            BigInteger keyId = hash(key);
            ChordNode owner = findSuccessor(keyId);
            owner.localStorage.put(keyId, value);

            // In production: replicate to successor list for fault tolerance
            for (ChordNode replica : owner.successorList) {
                replica.localStorage.put(keyId, value);
            }
        }

        /**
         * Get value from DHT
         *
         * ACTION: Route to owning node and retrieve from local storage
         * REASON: Distributed lookups in O(log N) hops via finger table routing
         * CONTEXT: BitTorrent DHT uses this to find peers without central tracker
         */
        public String get(String key, ChordDHT dht) {
            BigInteger keyId = hash(key);
            ChordNode owner = findSuccessor(keyId);
            return owner.localStorage.get(keyId);
        }

        /**
         * Node join protocol
         *
         * ACTION: Find successor, notify predecessor, transfer keys, build fingers
         * REASON: New node must integrate into ring and take ownership of keys
         * CONTEXT: Adding node should only affect 1/N keys (predecessor's keys
         *          between predecessor and new node)
         */
        public void join(ChordDHT dht, ChordNode existingNode) {
            // Find our successor using existing node
            this.successor = existingNode.findSuccessor(this.nodeId);

            // Our predecessor is our successor's predecessor
            this.predecessor = this.successor.predecessor;

            // Update successor's predecessor to us
            this.successor.predecessor = this;

            // Update our old predecessor's successor to us
            if (this.predecessor != null) {
                this.predecessor.successor = this;
            }

            // Transfer keys from successor that belong to us
            transferKeys();

            // Build finger table
            buildFingerTable(dht);

            // Initialize successor list for fault tolerance
            buildSuccessorList();
        }

        /**
         * Transfer keys that belong to new node from successor
         *
         * ACTION: Move keys between predecessor and this node from successor
         * REASON: Consistent hashing invariant: keys owned by successor of hash(key)
         * CONTEXT: Only 1/N keys move (those in range [predecessor, newNode])
         */
        private void transferKeys() {
            Iterator<Map.Entry<BigInteger, String>> iter =
                successor.localStorage.entrySet().iterator();

            while (iter.hasNext()) {
                Map.Entry<BigInteger, String> entry = iter.next();
                BigInteger keyId = entry.getKey();

                // If key is between predecessor and this node, it belongs to us
                if (isBetween(keyId, predecessor.nodeId, this.nodeId, true)) {
                    this.localStorage.put(keyId, entry.getValue());
                    iter.remove(); // Remove from successor
                }
            }
        }

        /**
         * Build successor list for fault tolerance
         *
         * ACTION: Maintain list of next 3-5 successors on ring
         * REASON: If immediate successor fails, promote next in list
         * CONTEXT: Without successor list, single node failure breaks ring.
         *          Successor list provides redundancy: survive up to r-1 failures
         *          where r is successor list length
         */
        private void buildSuccessorList() {
            successorList.clear();
            ChordNode current = this.successor;

            for (int i = 0; i < 3 && current != null; i++) {
                successorList.add(current);
                current = current.successor;
            }
        }

        /**
         * Check if key is in range (from, to] on circular ring
         *
         * ACTION: Handle wraparound when comparing positions on ring
         * REASON: Ring is circular: position 0xFFFFFF is "before" 0x000001
         * CONTEXT: Must handle wraparound case where from > to (crosses 0)
         */
        private boolean isBetween(
            BigInteger key,
            BigInteger from,
            BigInteger to,
            boolean inclusive
        ) {
            if (from.compareTo(to) < 0) {
                // Normal case: from < to
                int cmpFrom = key.compareTo(from);
                int cmpTo = key.compareTo(to);
                return cmpFrom > 0 && (inclusive ? cmpTo <= 0 : cmpTo < 0);
            } else {
                // Wraparound case: from > to (crosses 0)
                return key.compareTo(from) > 0 ||
                       (inclusive ? key.compareTo(to) <= 0 : key.compareTo(to) < 0);
            }
        }

        public BigInteger getNodeId() {
            return nodeId;
        }

        public String getAddress() {
            return address;
        }
    }

    // ========================================================================
    // Chord DHT Coordinator
    // ========================================================================

    private final Map<BigInteger, ChordNode> nodes;
    private final TreeMap<BigInteger, ChordNode> ring; // For fast successor lookup

    public ChordDHT() {
        this.nodes = new ConcurrentHashMap<>();
        this.ring = new TreeMap<>();
    }

    /**
     * Add first node to create ring
     *
     * ACTION: Create single-node ring where node is its own successor
     * REASON: Bootstrap case: first node forms ring, others join via this node
     * CONTEXT: Like forming first link in chain; subsequent nodes join and link in
     */
    public void createRing(String address) {
        BigInteger nodeId = hash(address);
        ChordNode node = new ChordNode(address, nodeId);

        // Single node is its own successor and predecessor
        node.successor = node;
        node.predecessor = node;

        nodes.put(nodeId, node);
        ring.put(nodeId, node);
    }

    /**
     * Add node to existing ring
     *
     * ACTION: Join new node via any existing node, update fingers
     * REASON: New node needs reference point to find its position on ring
     * CONTEXT: In P2P, new peer connects to known bootstrap peer to join network
     */
    public void addNode(String address) {
        BigInteger nodeId = hash(address);
        ChordNode newNode = new ChordNode(address, nodeId);

        // Join via any existing node
        ChordNode existingNode = nodes.values().iterator().next();
        newNode.join(this, existingNode);

        nodes.put(nodeId, newNode);
        ring.put(nodeId, newNode);

        // Update finger tables of all nodes
        updateFingerTables();
    }

    /**
     * Find successor node for given key
     *
     * ACTION: Use ring TreeMap for O(log N) lookup
     * REASON: TreeMap.ceilingEntry efficiently finds first node >= key
     * CONTEXT: Used during finger table construction and key lookups
     */
    public ChordNode findSuccessorNode(BigInteger keyId) {
        Map.Entry<BigInteger, ChordNode> entry = ring.ceilingEntry(keyId);

        if (entry != null) {
            return entry.getValue();
        }

        // Wraparound: return first node
        return ring.firstEntry().getValue();
    }

    /**
     * Update all finger tables after topology change
     *
     * ACTION: Rebuild finger tables for all nodes
     * REASON: Node join/leave changes ring topology, invalidating finger entries
     * CONTEXT: In practice, use periodic stabilization instead of full rebuild
     */
    private void updateFingerTables() {
        for (ChordNode node : nodes.values()) {
            node.buildFingerTable(this);
        }
    }

    /**
     * Hash string to 160-bit identifier using SHA-1
     *
     * ACTION: Use SHA-1 for 160-bit hash space (2^160 positions)
     * REASON: Large hash space prevents collisions: 2^160 ≈ 10^48 positions
     * CONTEXT: Chord paper specifies SHA-1. Modern systems might use SHA-256.
     */
    private static BigInteger hash(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hashBytes = digest.digest(key.getBytes());
            return new BigInteger(1, hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 not available", e);
        }
    }

    public int getNodeCount() {
        return nodes.size();
    }

    // ========================================================================
    // DEMONSTRATION: Scalability Comparison
    // ========================================================================

    public static void main(String[] args) {
        System.out.println("=== Chord DHT: O(log N) Lookup Scalability ===\\n");

        // Create Chord ring
        ChordDHT chord = new ChordDHT();
        chord.createRing("node0.example.com:8000");

        // Add nodes to demonstrate scalability
        int[] nodeCounts = {10, 100, 1000, 10000};

        System.out.println("Lookup hops comparison:\\n");
        System.out.printf("%-10s %-15s %-15s %-10s\\n",
            "Nodes", "Linear (O(N))", "Chord (O(log N))", "Speedup");
        System.out.println("-".repeat(60));

        for (int targetCount : nodeCounts) {
            // Add nodes up to target count
            while (chord.getNodeCount() < targetCount) {
                String address = String.format("node%d.example.com:8000",
                    chord.getNodeCount());
                chord.addNode(address);
            }

            int nodeCount = chord.getNodeCount();
            double linearHops = nodeCount / 2.0; // Average case
            double chordHops = Math.log(nodeCount) / Math.log(2); // log2(N)
            double speedup = linearHops / chordHops;

            System.out.printf("%-10d %-15.0f %-15.1f %-10.1fx\\n",
                nodeCount, linearHops, chordHops, speedup);
        }

        System.out.println("\\n=== Key Distribution Test ===\\n");

        // Test key distribution
        int numKeys = 10000;
        Map<BigInteger, Integer> distribution = new HashMap<>();

        for (int i = 0; i < numKeys; i++) {
            String key = "key:" + i;
            BigInteger keyId = hash(key);
            ChordNode owner = chord.findSuccessorNode(keyId);
            distribution.merge(owner.getNodeId(), 1, Integer::sum);
        }

        System.out.printf("Distributed %d keys across %d nodes:\\n",
            numKeys, chord.getNodeCount());

        int expectedPerNode = numKeys / chord.getNodeCount();
        double maxDeviation = 0;

        for (int count : distribution.values()) {
            double deviation = Math.abs(count - expectedPerNode) /
                (double) expectedPerNode * 100;
            maxDeviation = Math.max(maxDeviation, deviation);
        }

        System.out.printf("Expected keys per node: %d\\n", expectedPerNode);
        System.out.printf("Max deviation from expected: %.2f%%\\n", maxDeviation);
        System.out.println("\\nNote: Chord uses virtual nodes in production " +
            "to reduce deviation to <5%");
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Chord DHT implementation demonstrating O(log N) routing via finger tables, scaling from 10 nodes to 10,000+ nodes with 20-hop maximum lookup",
        prerequisites: [
          "Distributed hash tables",
          "SHA-1 hashing",
          "Ring topology",
          "Finger table routing",
          "Fault tolerance mechanisms",
        ],
        systemPosition:
          "Peer-to-peer systems (BitTorrent DHT, IPFS), distributed databases (Riak, Dynamo-style), decentralized storage. Runs as library in each peer node.",
      },
      annotations: [
        {
          id: "chord-finger-table",
          lines: [41, 48],
          action:
            "Maintain finger table with exponentially increasing distances",
          reason:
            "Finger table transforms O(N) linear routing into O(log N): each finger doubles the distance, creating binary search on ring. Like highway system with exponentially spaced exits",
          contextLevel: "system",
          relatedConcepts: ["logarithmic-routing", "binary-search"],
        },
        {
          id: "chord-lookup-routing",
          lines: [58, 78],
          action:
            "Use finger table to find closest preceding node, forward lookup",
          reason:
            "Each hop cuts remaining distance in half: 1M nodes requires max 20 hops (log2(1M)). Without fingers: 500k average hops. 25,000x faster routing",
          contextLevel: "system",
          relatedConcepts: ["distributed-routing", "hop-reduction"],
        },
        {
          id: "chord-closest-finger",
          lines: [86, 100],
          action:
            "Scan finger table backwards to find largest node before target key",
          reason:
            "Want maximal progress toward target without overshooting. Like taking furthest highway exit before destination, not first exit after start",
          contextLevel: "module",
          relatedConcepts: ["greedy-routing"],
        },
        {
          id: "chord-exponential-spacing",
          lines: [109, 130],
          action:
            "Build finger table with entries at distances 2^0, 2^1, 2^2, ..., 2^159",
          reason:
            "Exponential spacing enables logarithmic hops: finger[0] = next node (+1), finger[159] = halfway around ring (+2^159). Geometric progression creates binary search behavior",
          contextLevel: "system",
          relatedConcepts: ["exponential-search", "geometric-progression"],
        },
        {
          id: "chord-key-replication",
          lines: [146, 153],
          action: "Replicate keys to successor list nodes for fault tolerance",
          reason:
            "Without replication, node failure loses all its keys. Replicating to r successors survives up to r-1 concurrent failures. Typically r=3 (99.9% availability)",
          contextLevel: "system",
          relatedConcepts: ["fault-tolerance", "data-replication"],
        },
        {
          id: "chord-node-join",
          lines: [168, 191],
          action:
            "Join protocol: find successor, notify neighbors, transfer keys, build fingers",
          reason:
            "New node must: 1) find position on ring, 2) update predecessor/successor links, 3) take ownership of keys in [predecessor, newNode] range, 4) build routing table",
          contextLevel: "system",
          relatedConcepts: ["distributed-protocols", "membership-management"],
        },
        {
          id: "chord-key-transfer",
          lines: [197, 214],
          action:
            "Transfer only keys in range [predecessor, newNode] from successor",
          reason:
            "Consistent hashing property: adding node affects only 1/N keys. Keys between new node and its predecessor must move from successor to new node",
          contextLevel: "system",
          relatedConcepts: ["minimal-rebalancing", "data-migration"],
        },
        {
          id: "chord-successor-list",
          lines: [221, 236],
          action: "Maintain list of next r successors for fault tolerance",
          reason:
            "If immediate successor fails, promote next in list to maintain ring connectivity. Successor list of length r survives r-1 concurrent failures without data loss",
          contextLevel: "system",
          relatedConcepts: ["redundancy", "failover"],
        },
      ],
      highlights: [
        {
          lines: [109, 128],
          label: "Finger table construction with exponential spacing",
          sbvpDomain: "structure",
        },
        {
          lines: [58, 78],
          label: "O(log N) routing via finger table shortcuts",
          sbvpDomain: "behavior",
        },
        {
          lines: [372, 397],
          label: "Scalability demonstration: 10x-1000x speedup over linear",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Distributed caches (Memcached, Redis clusters)",
      "Load balancers (nginx upstream, HAProxy)",
      "CDN routing (edge server selection)",
      "Database sharding layers (Cassandra, DynamoDB)",
      "Service mesh routing (Consul, linkerd)",
      "P2P networks (BitTorrent DHT, IPFS)",
      "Distributed session stores",
    ],
    interactsWith: [
      "hash-sharding",
      "cache-aside",
      "load-balancing",
      "replication",
      "virtual-nodes",
    ],
    architecturalBoundaries: [
      "Routing layer (client-side or proxy-based)",
      "Storage layer (data partitioning)",
      "Load distribution layer (traffic routing)",
      "Replication coordination (replica placement)",
    ],
  },

  implementations: [
    {
      id: "dynamodb",
      name: "Amazon DynamoDB",
      type: "service",
      languages: ["any"],
      description:
        "Managed NoSQL database using consistent hashing for automatic partitioning. Distributes items across storage nodes based on partition key hash. Adds virtual nodes automatically during scaling, maintaining single-digit millisecond latency. Handles millions of requests/sec with automatic rebalancing.",
      links: {
        docs: "https://aws.amazon.com/dynamodb/",
      },
      codeSnippet: `// DynamoDB uses consistent hashing transparently
// Partition key determines which node stores item
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Item routed via consistent hash of partition key
await dynamodb.put({
  TableName: 'Users',
  Item: {
    userId: 'user123',  // Partition key - hashed to find node
    name: 'Alice',
    email: 'alice@example.com'
  }
}).promise();

// Queries route to same node as partition key
const result = await dynamodb.get({
  TableName: 'Users',
  Key: { userId: 'user123' }  // Hash routes to correct node
}).promise();`,
    },
    {
      id: "cassandra",
      name: "Apache Cassandra",
      type: "platform",
      languages: ["any"],
      description:
        "Distributed database using consistent hashing with virtual nodes (vnodes). Default 256 vnodes per node ensures even distribution. Murmur3 hash function for partition key hashing. Automatic rebalancing when nodes join/leave cluster.",
      links: {
        docs: "https://cassandra.apache.org/doc/latest/architecture/dynamo.html",
        github: "https://github.com/apache/cassandra",
      },
      codeSnippet: `-- Cassandra uses Murmur3 hash for consistent hashing
-- Configure vnodes in cassandra.yaml:
num_tokens: 256  -- Virtual nodes per physical node

-- Create table with partition key
CREATE TABLE users (
    user_id UUID PRIMARY KEY,  -- Partition key - hashed to find node
    name TEXT,
    email TEXT
);

-- Insert routed via consistent hash
INSERT INTO users (user_id, name, email)
VALUES (uuid(), 'Alice', 'alice@example.com');

-- Query routes to node owning hash(user_id)
SELECT * FROM users WHERE user_id = ?;`,
    },
    {
      id: "libketama",
      name: "libketama (Memcached)",
      type: "library",
      languages: ["c", "cpp"],
      description:
        "Original Ketama consistent hashing implementation for Memcached. Uses MD5 hashing with 160 vnodes per server. Industry standard adopted by many caching systems. Provides C library for client-side routing.",
      links: {
        github: "https://github.com/RJ/ketama",
      },
      codeSnippet: `#include <ketama.h>

// Create Ketama hash ring with server list
ketama_continuum c;
ketama_roll(&c, "servers.txt");  // server1:11211, server2:11211, ...

// Route key to server using consistent hash
char* server = ketama_get_server(key, c);
printf("Key '%s' routes to %s\\n", key, server);

// Servers file format (servers.txt):
// 192.168.1.1:11211 600    # weight=600
// 192.168.1.2:11211 400    # weight=400 (smaller server)
// 192.168.1.3:11211 600`,
    },
    {
      id: "riak",
      name: "Riak KV",
      type: "platform",
      languages: ["any"],
      description:
        "Distributed key-value store using consistent hashing ring with 64-512 vnodes per node. Based on Amazon Dynamo design. Provides predictable latency and automatic rebalancing. Supports heterogeneous clusters via vnode counts.",
      links: {
        docs: "https://docs.riak.com/riak/kv/latest/learn/concepts/clusters/index.html",
      },
      codeSnippet: `# Riak configuration (riak.conf)
ring_size = 64           # Total vnodes in cluster
vnode_count = 64         # Vnodes per node (ring_size / nodes)

# Client usage
from riak import RiakClient

client = RiakClient(nodes=[
    {'host': 'node1', 'http_port': 8098},
    {'host': 'node2', 'http_port': 8098},
    {'host': 'node3', 'http_port': 8098},
])

# Put routes via consistent hash
bucket = client.bucket('users')
user = bucket.new('user123', data={'name': 'Alice'})
user.store()  # Routed to node owning hash('user123')

# Get routes to same node
user = bucket.get('user123')`,
    },
    {
      id: "akka-cluster",
      name: "Akka Cluster Sharding",
      type: "library",
      languages: ["java", "scala"],
      description:
        "Actor distribution using consistent hashing for shard allocation. Routes messages to actors based on entity ID hash. Automatic rebalancing when cluster topology changes. Used in high-throughput reactive systems.",
      links: {
        docs: "https://doc.akka.io/docs/akka/current/typed/cluster-sharding.html",
      },
      codeSnippet: `import akka.cluster.sharding.ShardRegion;

// Define shard allocation strategy (consistent hashing)
ShardRegion.HashCodeMessageExtractor extractor =
  new ShardRegion.HashCodeMessageExtractor(100) {
    @Override
    public String entityId(Object message) {
      if (message instanceof UserCommand) {
        return ((UserCommand) message).userId;
      }
      return null;
    }
  };

// Start sharded actor region
ActorRef region = ClusterSharding.get(system).start(
  "User",
  UserActor.props(),
  extractor  // Uses consistent hashing for shard->node mapping
);

// Send message - routes via consistent hash
region.tell(new GetUser("user123"), getSelf());`,
    },
    {
      id: "nginx-upstream",
      name: "nginx Consistent Hash",
      type: "platform",
      languages: ["any"],
      description:
        "Load balancer with consistent hashing upstream module. Routes requests based on URI, cookies, or custom variables. Minimizes cache invalidation when backend servers change. Supports weighted backends.",
      links: {
        docs: "http://nginx.org/en/docs/http/ngx_http_upstream_module.html#hash",
      },
      codeSnippet: `# nginx.conf - Consistent hash load balancing
upstream backend {
    # Hash based on request URI (cache-friendly)
    hash $request_uri consistent;

    # Backend servers with weights
    server backend1.example.com:8080 weight=3;
    server backend2.example.com:8080 weight=2;
    server backend3.example.com:8080 weight=3;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        # Same URI always routes to same backend
        # Maximizes backend cache hit rate
    }
}`,
    },
    {
      id: "consul",
      name: "HashiCorp Consul",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh and service discovery using consistent hashing for service routing. Routes requests to healthy service instances based on consistent hash. Supports automatic failover and load balancing.",
      links: {
        docs: "https://www.consul.io/docs/connect",
      },
      codeSnippet: `# Consul service definition with consistent hash routing
{
  "service": {
    "name": "user-service",
    "port": 8080,
    "connect": {
      "sidecar_service": {
        "proxy": {
          "upstreams": [{
            "destination_name": "cache-service",
            "lb_policy": "ring_hash",  // Consistent hashing
            "ring_hash_lb_config": {
              "minimum_ring_size": 1024
            }
          }]
        }
      }
    }
  }
}`,
    },
    {
      id: "chord-dht",
      name: "Chord DHT Protocol",
      type: "platform",
      languages: ["any"],
      description:
        "Distributed hash table protocol using consistent hashing with finger tables for O(log N) lookup. Used in P2P systems and decentralized storage. Provides scalability to millions of nodes with fault tolerance.",
      links: {
        docs: "https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf",
      },
      codeSnippet: `# Chord DHT node implementation pseudocode

# Finger table: finger[i] = successor(node + 2^i)
class ChordNode:
    def __init__(self, node_id):
        self.node_id = node_id
        self.finger_table = [None] * 160  # SHA-1 = 160 bits
        self.successor = None
        self.predecessor = None

    def find_successor(self, key_id):
        # O(log N) lookup via finger table
        if is_between(key_id, self.node_id, self.successor.node_id):
            return self.successor

        # Find closest preceding node in finger table
        closest = self.closest_preceding_finger(key_id)
        return closest.find_successor(key_id)`,
    },
  ],

  usedInSystems: [
    {
      systemId: "dynamodb",
      systemName: "Amazon DynamoDB",
      howUsed:
        "DynamoDB uses consistent hashing as the foundation of its partitioning strategy to distribute items across storage nodes. When a table is created, DynamoDB creates multiple partitions and uses consistent hashing with virtual nodes to map partition keys to storage nodes. Each item's partition key is hashed using an internal hash function, and the hash determines which virtual node (and thus physical storage node) owns that item. As tables grow and traffic increases, DynamoDB automatically adds partitions and redistributes data using consistent hashing's minimal rebalancing property—only 1/N items move to new partitions. During Prime Day 2022, DynamoDB handled 89.2 million requests per second across trillions of items with single-digit millisecond p99 latency, thanks to consistent hashing enabling horizontal scaling without service disruption. Pattern composition: Consistent Hashing + Replication (3 replicas via Paxos) + Auto-scaling (CloudWatch metrics trigger partition splits) + Virtual Nodes (hundreds per physical server). Rationale: AWS customers demand predictable performance and automatic scaling without manual intervention. Consistent hashing enables this by making partition additions transparent to applications. Impact: Enabled 99.999% availability SLA; scaled individual tables to petabytes without downtime; supported 10x traffic spikes during Black Friday without pre-warming.",
      source:
        "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html",
    },
    {
      systemId: "discord",
      systemName: "Discord Real-time Messaging",
      howUsed:
        "Discord uses consistent hashing to route users to WebSocket gateway servers for real-time message delivery. With 150+ million monthly active users generating billions of messages, routing must be deterministic yet flexible during scaling. Each user's ID is consistently hashed to a gateway server, ensuring the user connects to the same server for session continuity. When Discord adds gateway servers during traffic spikes (new game launches, major events), consistent hashing ensures only 1/N users reconnect, while the rest maintain their connections uninterrupted. During Fortnite events with 10M+ concurrent users, Discord scales from 1,000 to 1,500 gateway servers in minutes, and consistent hashing keeps reconnection storms manageable—only 20% of users reconnect instead of 100% with traditional hashing. Pattern composition: Consistent Hashing + WebSocket (persistent connections) + Pub/Sub (message distribution) + Connection Pooling (backend connections). Rationale: Gaming communities demand real-time delivery with <100ms latency. Minimizing reconnections during scaling prevents message loss and latency spikes. Impact: Maintained <50ms message latency during 10x traffic spikes; reduced reconnection storms by 80%; enabled scaling to 10M+ concurrent connections without user-visible disruption.",
      source:
        "https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users",
    },
    {
      systemId: "akamai",
      systemName: "Akamai CDN",
      howUsed:
        "Akamai operates the world's largest CDN with 300,000+ edge servers across 1,300+ networks. Consistent hashing routes content requests to edge servers based on URL hash, ensuring cache locality—repeated requests for the same content hit the same edge cache, maximizing hit rates. When Akamai adds edge servers in new regions or removes failed servers, consistent hashing ensures only 1/N cached objects are invalidated and re-fetched from origin. During live streaming events (FIFA World Cup, Olympics), Akamai serves 100+ Tbps of traffic with 95%+ cache hit rates despite adding thousands of edge servers dynamically. Virtual nodes (200 per edge server) ensure even distribution despite heterogeneous hardware—new servers with 10x capacity get 10x vnodes. Pattern composition: Consistent Hashing + Cache-Aside (lazy loading) + TTL-based Invalidation + Geographic Routing (multi-tier hashing). Rationale: With petabytes of cached content and millisecond-level latency SLAs, cache invalidation storms would overwhelm origin servers and break SLAs. Consistent hashing preserves cache effectiveness during topology changes. Impact: Achieved 95%+ cache hit rate during major live events; reduced origin load by 20x; enabled serving 100 Tbps from edge without origin overload.",
      source:
        "https://www.akamai.com/us/en/multimedia/documents/technical-publication/consistent-hashing-and-random-trees-distributed-caching-protocols-for-relieving-hot-spots-on-the-world-wide-web-technical-publication.pdf",
    },
    {
      systemId: "bittorrent",
      systemName: "BitTorrent DHT",
      howUsed:
        "BitTorrent's Mainline DHT uses consistent hashing (based on Kademlia) to distribute peer information across 20+ million nodes without central trackers. Each torrent's info hash is consistently hashed to find which nodes store peer lists for that torrent. The DHT employs XOR-based distance metric (a variant of consistent hashing) where closer node IDs store information about similar content hashes. When a peer joins or leaves (millions of events per minute), only its immediate neighbors in the hash space are affected—O(log N) other nodes update their routing tables. During torrent lookups, Kademlia's finger-table-like routing enables O(log N) hops to find peer lists in a 20M-node network (typically 6-8 hops). Pattern composition: Consistent Hashing + Kademlia XOR Metric + Finger Tables (k-buckets) + Replication (redundant storage on k=20 closest nodes). Rationale: Decentralized torrent discovery must scale to millions of nodes without coordination overhead. Consistent hashing enables P2P architecture where every node is equal. Impact: Enabled 20M+ node DHT with no central servers; achieved 6-8 hop peer discovery in massive network; survived aggressive churn (millions of nodes joining/leaving hourly) with 99%+ success rates.",
      source: "http://www.bittorrent.org/beps/bep_0005.html",
    },
    {
      systemId: "cassandra",
      systemName: "Apache Cassandra",
      howUsed:
        "Cassandra uses consistent hashing with virtual nodes (vnodes) as its core partitioning strategy for distributing data across clusters. Each node in a Cassandra cluster is assigned a default of 256 virtual nodes (configurable via num_tokens), and data is partitioned based on Murmur3 hash of partition keys. When a node joins the cluster, it claims 256 positions on the ring, taking ownership of small key ranges from 256 different existing nodes—distributing the rebalancing load evenly instead of overwhelming a single neighbor. This enables Cassandra to scale from 3-node development clusters to 1,000+ node production clusters (Apple reportedly runs clusters with 75,000+ nodes) without downtime. During node additions/removals, only 1/N data moves via streaming, and the cluster remains available for reads/writes. Pattern composition: Consistent Hashing + Virtual Nodes (256 default) + Replication (RF=3 typical) + Tunable Consistency (quorum reads/writes) + Gossip Protocol (peer discovery). Rationale: Cassandra targets linear scalability and fault tolerance for mission-critical applications. Consistent hashing enables adding capacity by simply joining new nodes without complex rebalancing procedures. Impact: Enabled linear scalability to 1,000+ nodes; achieved 99.99% uptime with automatic failover; Apple's 75k-node cluster serves 10 trillion requests per month with consistent performance.",
      source:
        "https://cassandra.apache.org/doc/latest/architecture/dynamo.html",
    },
  ],

  philosophy: {
    coreProblem:
      "Traditional hash-based partitioning (key % N) causes catastrophic rebalancing when cluster size changes, invalidating 99% of cached data and overwhelming backend systems",
    designPrinciple:
      "Map both keys and nodes onto a shared hash ring so that adding/removing nodes only affects neighboring keys (1/N), not all keys",
    historicalContext:
      "Introduced in Karger et al.'s 1997 paper 'Consistent Hashing and Random Trees' at MIT. Popularized by Amazon's Dynamo (2007) and Akamai CDN. Now foundational to distributed systems.",
    alternativesRejected: [
      "Modulo hashing (key % N) - requires remapping 99% of keys when N changes",
      "Range partitioning - creates hot spots and requires manual rebalancing",
      "Jump hash - newer algorithm with less flexibility (fixed node ordering)",
    ],
    mentalModel:
      "Imagine a circular clock face where hours represent hash positions. Keys and servers both get assigned to positions on the clock. Each key is owned by the first server clockwise from it. Adding a server only affects keys between it and the previous server—like inserting a new hour on the clock only affects times in that 1-hour window.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Hash Ring (2^32 positions)"
        R[Ring: 0x00000000 → 0xFFFFFFFF]
        K1[Key: user:123<br/>Hash: 0x1A4F2B00]
        K2[Key: user:456<br/>Hash: 0x8C3D1E00]
        V1[VNode: node1:v50<br/>Hash: 0x2F8A1000]
        V2[VNode: node2:v30<br/>Hash: 0x9A2C4000]
    end

    K1 -->|Clockwise| V1
    K2 -->|Clockwise| V2
    V1 --> N1[Physical Node 1]
    V2 --> N2[Physical Node 2]

    style K1 fill:#e1f5e1
    style K2 fill:#e1f5e1
    style V1 fill:#fff3cd
    style V2 fill:#fff3cd
    style N1 fill:#cfe2ff
    style N2 fill:#cfe2ff`,
    realWorldAnalogy:
      "Consistent hashing is like a circular restaurant seating chart. Customers (keys) are assigned seats (hash positions) around a round table. Waiters (servers) are stationed at intervals around the table. Each customer is served by the first waiter clockwise from their seat. When a new waiter joins, they only take over customers between themselves and the previous waiter—not all customers. When a waiter leaves for break, the next waiter clockwise takes their customers. Most customers keep the same waiter despite staff changes.",
    useCases: [
      {
        domain: "Distributed Caching",
        scenario:
          "Memcached cluster with 100 servers caching 10TB of data. Need to add 10 servers to handle Black Friday traffic without invalidating entire cache.",
        patternRole:
          "Consistent hashing ensures only 10% of cache entries move to new servers, preserving 90% cache hit rate during scaling",
        companies: ["Twitter", "Facebook", "Pinterest"],
      },
      {
        domain: "Database Sharding",
        scenario:
          "DynamoDB table grows from 1TB to 100TB. Need to add partitions without downtime or impacting query performance.",
        patternRole:
          "Consistent hashing enables automatic partition splits with minimal data movement and zero application changes",
        companies: ["Amazon", "Apple", "Lyft"],
      },
      {
        domain: "Load Balancing",
        scenario:
          "CDN with 10,000 edge servers needs to route video chunks consistently to maximize cache hit rates during live streaming event.",
        patternRole:
          "Consistent hashing routes same content to same edge servers, achieving 95%+ cache hit rates and reducing origin load by 20x",
        companies: ["Akamai", "Cloudflare", "Netflix"],
      },
      {
        domain: "P2P Networks",
        scenario:
          "BitTorrent DHT with 20M nodes needs to locate peer lists for torrents without central tracker.",
        patternRole:
          "Consistent hashing distributes peer information across DHT with O(log N) lookups, enabling fully decentralized discovery",
        companies: ["BitTorrent", "IPFS", "Ethereum"],
      },
    ],
  },

  tags: [
    "scalability",
    "partitioning",
    "distributed-systems",
    "hashing",
    "load-balancing",
    "caching",
    "dht",
  ],
  difficulty: "intermediate",
};
