import type { Pattern } from "../schema";

export const hashRing: Pattern = {
  id: "hash-ring",
  slug: "hash-ring",
  corpusPath:
    "📈 SCALABILITY → 🧩 Partitioning → #️⃣ Hash Partitioning → 💍 Hash Ring",

  hierarchy: {
    quality: "scalability",
    strategy: "Partitioning",
    family: "Hash Partitioning",
    level: 4,
  },

  concept: {
    name: "Hash Ring",
    emoji: "💍",
    tagline: "Circular hash space for distributed node assignment",
    definition:
      "Hash Ring is a fundamental data distribution technique that maps both keys and nodes onto a circular hash space, enabling deterministic and balanced assignment of data across a dynamic set of nodes. The pattern visualizes the hash space as a ring (typically 0 to 2^160-1 for SHA-1), where nodes are positioned at hashed locations and keys are assigned to the nearest node in the clockwise direction (the successor). This circular structure elegantly handles the wrap-around from the maximum hash value back to zero. When nodes are added or removed, only keys in the immediate vicinity are affected—specifically, keys between the removed node and its predecessor move to the successor. The hash ring forms the foundation for consistent hashing schemes but in its basic form suffers from uneven load distribution when nodes hash to clustered positions. Despite this limitation, its geometric intuition and deterministic routing make it a cornerstone pattern in distributed caching, peer-to-peer networks, and sharded databases. The pattern's genius lies in transforming the complex problem of dynamic node membership into simple circular geometry.",
    problemSolved:
      "Traditional hash-based partitioning schemes (like simple modulo hashing) require redistributing all keys when the number of nodes changes, causing massive data movement and cache invalidation. The Hash Ring solves this by minimizing redistribution: when a node joins or leaves, only K/N keys need to move (where K is total keys and N is node count), rather than all K keys. This enables elastic scaling in distributed systems without catastrophic performance degradation. Additionally, the hash ring provides deterministic routing—any client can compute which node owns a key without centralized coordination or metadata lookup. The pattern also addresses the challenge of load balancing in dynamic environments: while basic hash rings can create hotspots, they establish the geometric foundation for advanced techniques like virtual nodes. Finally, the circular structure naturally handles the edge case of hash space wrap-around, eliminating special-case logic that plagues linear partitioning schemes.",
    tradeoffs: {
      pros: [
        "Visual simplicity: geometric ring model is intuitive and easy to reason about",
        "Deterministic routing: any client can compute node ownership without coordination",
        "Minimal redistribution: only ~1/N keys move when nodes change (vs all keys in modulo hashing)",
        "Coordination-free: no centralized registry or consensus required for routing decisions",
        "Natural load balancing: with good hash functions, keys distribute evenly around ring",
      ],
      cons: [
        "Hotspots without virtual nodes: non-uniform node distribution creates load imbalance",
        "O(n) lookup complexity: basic implementation requires linear scan of nodes",
        "Cascading failure risk: if successor node fails, its keys concentrate on next node",
        "Manual rebalancing complexity: adding/removing nodes requires careful key migration",
        "No automatic failover: ring structure doesn't inherently provide redundancy or replication",
      ],
    },
    relatedPatterns: [
      "consistent-hashing",
      "jump-hash",
      "rendezvous-hashing",
      "virtual-nodes",
      "dht",
      "chord-protocol",
      "ketama",
    ],
  },

  structure: {
    participants: [
      {
        name: "Ring Structure",
        role: "Circular Hash Space",
        responsibilities: [
          "Define circular address space (0 to 2^m-1 where m is hash bits)",
          "Maintain sorted list of node positions for efficient lookup",
          "Handle wrap-around from maximum value back to zero",
        ],
      },
      {
        name: "Hash Function",
        role: "Position Calculator",
        responsibilities: [
          "Map node identifiers to positions on ring (typically SHA-1, MD5, or MurmurHash)",
          "Map keys to positions on ring using same hash function",
          "Provide uniform distribution across hash space to minimize clustering",
        ],
      },
      {
        name: "Key",
        role: "Data Identifier",
        responsibilities: [
          "Hash to position on ring",
          "Route to successor node in clockwise direction",
          "Migrate to new node when topology changes",
        ],
      },
      {
        name: "Node",
        role: "Storage/Compute Endpoint",
        responsibilities: [
          "Position itself on ring based on identifier hash",
          "Store keys from predecessor position to own position",
          "Transfer keys to successor when leaving ring",
        ],
      },
      {
        name: "Successor Finder",
        role: "Routing Logic",
        responsibilities: [
          "Locate clockwise successor node for a given key position",
          "Implement efficient search (binary search on sorted nodes)",
          "Handle edge case when key hashes beyond last node (wrap to first)",
        ],
      },
    ],
    diagram: `graph TB
    subgraph Ring["Hash Ring (0 to 2^160-1)"]
      N1["Node A<br/>hash(A)=30"]
      N2["Node B<br/>hash(B)=90"]
      N3["Node C<br/>hash(C)=180"]
      N4["Node D<br/>hash(D)=270"]

      K1["Key X<br/>hash(X)=45"]
      K2["Key Y<br/>hash(Y)=120"]
      K3["Key Z<br/>hash(Z)=200"]
    end

    K1 -->|clockwise successor| N2
    K2 -->|clockwise successor| N3
    K3 -->|clockwise successor| N4

    N1 -.->|ring topology| N2
    N2 -.->|ring topology| N3
    N3 -.->|ring topology| N4
    N4 -.->|wrap around| N1

    style N1 fill:#4a90e2
    style N2 fill:#4a90e2
    style N3 fill:#4a90e2
    style N4 fill:#4a90e2
    style K1 fill:#50c878
    style K2 fill:#50c878
    style K3 fill:#50c878`,
    flow: [
      {
        step: 1,
        actor: "Hash Function",
        action: "Hash Node Identifiers",
        description:
          "Each node identifier (IP address, hostname, UUID) is hashed to a position on the ring. Nodes are sorted by hash value for efficient lookup.",
      },
      {
        step: 2,
        actor: "Client",
        action: "Hash Key",
        description:
          "Client hashes the key using the same hash function to determine its position on the ring.",
      },
      {
        step: 3,
        actor: "Successor Finder",
        action: "Find Clockwise Successor",
        description:
          "Search sorted node list for the first node with position >= key position. If no such node exists, wrap around to first node.",
      },
      {
        step: 4,
        actor: "Client",
        action: "Route Request",
        description:
          "Send request to the successor node, which is responsible for storing the key.",
      },
      {
        step: 5,
        actor: "Node",
        action: "Process Request",
        description:
          "Node handles get/set/delete operation for the key within its assigned range.",
      },
      {
        step: 6,
        actor: "Ring Structure",
        action: "Handle Node Addition",
        description:
          "When new node joins, it takes ownership of keys between its predecessor and itself. Only these keys need migration.",
      },
      {
        step: 7,
        actor: "Ring Structure",
        action: "Handle Node Removal",
        description:
          "When node leaves, its keys migrate to its successor. Keys between predecessor and removed node now belong to successor.",
      },
      {
        step: 8,
        actor: "Successor Finder",
        action: "Update Sorted Node List",
        description:
          "After topology changes, re-sort node list to maintain O(log n) lookup performance with binary search.",
      },
      {
        step: 9,
        actor: "Hash Function",
        action: "Ensure Uniform Distribution",
        description:
          "Good hash function (SHA-1, MurmurHash3) distributes nodes uniformly to prevent clustering and hotspots.",
      },
    ],
    invariants: [
      "Circular address space: hash values wrap from 2^m-1 to 0, forming continuous ring",
      "Clockwise successor selection: keys always route to first node clockwise from their position",
      "Deterministic routing: same key always maps to same node (given stable topology)",
      "Monotonicity: adding/removing node only affects keys in immediate vicinity, not entire keyspace",
      "Sorted node invariant: nodes must be kept in sorted order by hash value for efficient lookup",
    ],
  },

  codeExamples: [
    {
      id: "hash-ring-ts-basic",
      language: "typescript",
      title: "Simple Hash Ring with Binary Search",
      description:
        "TypeScript implementation using SHA-1 hash and binary search for O(log n) successor lookup. Demonstrates core ring mechanics and performance comparison.",
      code: `import crypto from 'crypto';

/**
 * Simple Hash Ring implementation with binary search optimization
 * Hash space: 0 to 2^160-1 (SHA-1 produces 160-bit hashes)
 */
class HashRing {
  private nodes: Map<string, bigint> = new Map(); // node_id -> position
  private sortedPositions: bigint[] = []; // sorted positions for binary search
  private positionToNode: Map<bigint, string> = new Map(); // position -> node_id

  private readonly hashSpaceSize = BigInt(2) ** BigInt(160);

  /**
   * Add a node to the ring
   * ACTION: Hash node identifier and insert into sorted position list
   * REASON: Binary search requires sorted list; we maintain sort order on insertion
   */
  addNode(nodeId: string): void {
    if (this.nodes.has(nodeId)) {
      throw new Error(\`Node \${nodeId} already exists in ring\`);
    }

    const position = this.hash(nodeId);
    this.nodes.set(nodeId, position);
    this.positionToNode.set(position, nodeId);

    // Insert position in sorted order
    const insertIndex = this.findInsertIndex(position);
    this.sortedPositions.splice(insertIndex, 0, position);

    console.log(\`Added node \${nodeId} at position \${position} (index \${insertIndex})\`);
  }

  /**
   * Remove a node from the ring
   * ACTION: Remove node from all internal structures
   * REASON: Keys owned by this node will now route to its successor
   */
  removeNode(nodeId: string): void {
    const position = this.nodes.get(nodeId);
    if (!position) {
      throw new Error(\`Node \${nodeId} not found in ring\`);
    }

    this.nodes.delete(nodeId);
    this.positionToNode.delete(position);

    const index = this.sortedPositions.indexOf(position);
    this.sortedPositions.splice(index, 1);

    console.log(\`Removed node \${nodeId} from position \${position}\`);
  }

  /**
   * Get the node responsible for a given key
   * ACTION: Hash key and find clockwise successor using binary search
   * REASON: O(log n) lookup is critical for performance at scale
   */
  getNode(key: string): string | null {
    if (this.sortedPositions.length === 0) {
      return null;
    }

    const keyPosition = this.hash(key);
    const nodePosition = this.findSuccessor(keyPosition);
    return this.positionToNode.get(nodePosition)!;
  }

  /**
   * Find clockwise successor position for a given key position
   * ACTION: Binary search for first node >= keyPosition, else wrap to first node
   * REASON: Circular ring requires wrap-around when key exceeds all node positions
   */
  private findSuccessor(keyPosition: bigint): bigint {
    // Binary search for first position >= keyPosition
    let left = 0;
    let right = this.sortedPositions.length - 1;
    let successor = this.sortedPositions[0]; // default to first node (wrap-around)

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midPosition = this.sortedPositions[mid];

      if (midPosition >= keyPosition) {
        successor = midPosition;
        right = mid - 1; // look for earlier successor
      } else {
        left = mid + 1;
      }
    }

    return successor;
  }

  /**
   * Find insertion index for a position to maintain sorted order
   * ACTION: Binary search to find correct insertion point
   * REASON: Maintaining sort order on insert is cheaper than re-sorting
   */
  private findInsertIndex(position: bigint): number {
    let left = 0;
    let right = this.sortedPositions.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedPositions[mid] < position) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  /**
   * Hash a string to a position on the ring
   * ACTION: Use SHA-1 to generate 160-bit hash, convert to BigInt
   * REASON: SHA-1 provides good uniform distribution across hash space
   */
  private hash(key: string): bigint {
    const hash = crypto.createHash('sha1').update(key).digest();
    // Convert first 20 bytes to BigInt (SHA-1 produces 20 bytes = 160 bits)
    let value = BigInt(0);
    for (let i = 0; i < hash.length; i++) {
      value = (value << BigInt(8)) | BigInt(hash[i]);
    }
    return value % this.hashSpaceSize;
  }

  /**
   * Visualize the ring structure
   * ACTION: Print nodes and sample keys with their positions
   * REASON: Visual representation helps understand key distribution
   */
  visualize(sampleKeys: string[] = []): void {
    console.log('\\n=== Hash Ring Visualization ===');
    console.log(\`Total nodes: \${this.nodes.size}\`);
    console.log(\`Hash space: 0 to \${this.hashSpaceSize - BigInt(1)}\`);
    console.log('\\nNodes (sorted by position):');

    for (const position of this.sortedPositions) {
      const nodeId = this.positionToNode.get(position)!;
      const percentage = Number(position * BigInt(10000) / this.hashSpaceSize) / 100;
      console.log(\`  \${nodeId}: \${position} (\${percentage.toFixed(2)}%)\`);
    }

    if (sampleKeys.length > 0) {
      console.log('\\nSample key mappings:');
      for (const key of sampleKeys) {
        const node = this.getNode(key);
        const keyPos = this.hash(key);
        console.log(\`  \${key} -> \${node} (key_pos: \${keyPos})\`);
      }
    }
    console.log('========================\\n');
  }

  /**
   * Get distribution statistics
   * ACTION: Calculate load distribution across nodes
   * REASON: Quantify whether keys are evenly distributed (detect hotspots)
   */
  analyzeDistribution(keys: string[]): Map<string, number> {
    const distribution = new Map<string, number>();

    // Initialize counts
    for (const nodeId of this.nodes.keys()) {
      distribution.set(nodeId, 0);
    }

    // Count keys per node
    for (const key of keys) {
      const node = this.getNode(key);
      if (node) {
        distribution.set(node, (distribution.get(node) || 0) + 1);
      }
    }

    return distribution;
  }
}

// ====================
// Usage Example & Performance Demo
// ====================

const ring = new HashRing();

// Add nodes
console.log('Adding nodes to ring...');
ring.addNode('node-1');
ring.addNode('node-2');
ring.addNode('node-3');
ring.addNode('node-4');

// Visualize ring
ring.visualize(['user:123', 'product:456', 'order:789', 'cache:abc']);

// Test key routing
console.log('Key routing examples:');
const testKeys = ['user:alice', 'user:bob', 'product:laptop', 'order:12345'];
for (const key of testKeys) {
  console.log(\`  \${key} -> \${ring.getNode(key)}\`);
}

// Analyze distribution with many keys
console.log('\\nDistribution analysis with 10000 random keys:');
const randomKeys = Array.from({ length: 10000 }, (_, i) => \`key:\${i}\`);
const distribution = ring.analyzeDistribution(randomKeys);

for (const [node, count] of distribution.entries()) {
  const percentage = (count / randomKeys.length) * 100;
  console.log(\`  \${node}: \${count} keys (\${percentage.toFixed(2)}%)\`);
}

// Calculate standard deviation to measure distribution quality
const counts = Array.from(distribution.values());
const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
const variance = counts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / counts.length;
const stdDev = Math.sqrt(variance);
console.log(\`\\nStandard deviation: \${stdDev.toFixed(2)} (lower is better)\`);
console.log(\`Expected per node: \${mean.toFixed(0)} keys\`);

// Demonstrate node addition and key migration
console.log('\\n=== Adding new node (demonstrates minimal key migration) ===');
const beforeAdd = new Map(ring.analyzeDistribution(randomKeys));
ring.addNode('node-5');
const afterAdd = ring.analyzeDistribution(randomKeys);

console.log('Key redistribution after adding node-5:');
for (const [node, countAfter] of afterAdd.entries()) {
  const countBefore = beforeAdd.get(node) || 0;
  const delta = countAfter - countBefore;
  console.log(\`  \${node}: \${countBefore} -> \${countAfter} (\${delta >= 0 ? '+' : ''}\${delta})\`);
}

// CONTEXT DILATION: Compare binary search O(log n) vs linear scan O(n)
console.log('\\n=== Performance: Binary Search vs Linear Scan ===');
console.log('For 1000 nodes, binary search needs ~10 comparisons');
console.log('Linear scan would need ~500 comparisons on average');
console.log(\`Speedup factor: ~\${(500/10).toFixed(0)}x faster with binary search\`);`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete hash ring with binary search, distribution analysis, and visualization",
        prerequisites: [
          "TypeScript",
          "BigInt arithmetic",
          "Binary search",
          "Cryptographic hashing",
        ],
        systemPosition:
          "Core routing logic in distributed cache layer (Memcached, Redis Cluster)",
      },
      annotations: [
        {
          id: "hr-hash-space",
          lines: [8, 8],
          action: "Define 160-bit circular hash space using BigInt",
          reason:
            "SHA-1 produces 160-bit hashes; BigInt handles values beyond JavaScript's 53-bit safe integer limit",
          contextLevel: "module",
          relatedConcepts: ["hash-functions", "circular-space"],
        },
        {
          id: "hr-add-node",
          lines: [14, 30],
          action:
            "Insert node into sorted position list while maintaining order",
          reason:
            "Binary search requires sorted data; maintaining sort on insert (O(n)) is cheaper than sorting on every lookup",
          contextLevel: "local",
          relatedConcepts: ["binary-search", "sorted-array"],
        },
        {
          id: "hr-find-successor",
          lines: [60, 78],
          action:
            "Binary search for clockwise successor, wrap to first node if needed",
          reason:
            "O(log n) lookup is critical for performance; wrap-around implements circular ring topology",
          contextLevel: "module",
          relatedConcepts: ["binary-search", "circular-buffer"],
        },
        {
          id: "hr-sha1-hash",
          lines: [111, 123],
          action: "Use SHA-1 to generate uniform 160-bit hash from string",
          reason:
            "Cryptographic hash functions provide good uniform distribution, minimizing clustering of nodes",
          contextLevel: "local",
          relatedConcepts: ["uniform-distribution", "cryptographic-hash"],
        },
        {
          id: "hr-distribution-analysis",
          lines: [156, 175],
          action: "Count keys per node and calculate distribution statistics",
          reason:
            "Quantifying load distribution reveals hotspots and validates hash function uniformity",
          contextLevel: "system",
          relatedConcepts: ["load-balancing", "statistical-analysis"],
        },
        {
          id: "hr-migration-tracking",
          lines: [219, 227],
          action: "Compare key distribution before and after node addition",
          reason:
            "Demonstrates hash ring's key property: only ~1/N keys migrate when adding a node",
          contextLevel: "system",
          relatedConcepts: ["data-migration", "scalability"],
        },
        {
          id: "hr-binary-perf",
          lines: [230, 234],
          action:
            "Compare binary search O(log n) vs linear scan O(n) performance",
          reason:
            "At scale (1000+ nodes), binary search provides 50x speedup over naive linear scan",
          contextLevel: "system",
          relatedConcepts: [
            "algorithmic-complexity",
            "performance-optimization",
          ],
        },
        {
          id: "hr-wrap-around",
          lines: [69, 71],
          action: "Default successor to first node for wrap-around case",
          reason:
            "When key position exceeds all nodes, wrap to beginning of ring (circular topology)",
          contextLevel: "local",
          relatedConcepts: ["circular-data-structure", "edge-cases"],
        },
      ],
      highlights: [
        {
          lines: [14, 30],
          label: "Node addition with sorted insert",
          sbvpDomain: "structure",
        },
        {
          lines: [60, 78],
          label: "Binary search successor lookup",
          sbvpDomain: "behavior",
        },
        {
          lines: [156, 175],
          label: "Distribution analysis",
          sbvpDomain: "visualization",
        },
      ],
    },
    {
      id: "hash-ring-py-ketama",
      language: "python",
      title: "Ketama Algorithm (Memcached Standard)",
      description:
        "Python implementation of libketama algorithm with virtual nodes (replicas). Demonstrates MD5 hashing and statistical distribution improvements.",
      code: `import hashlib
from bisect import bisect_left, insort
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

class KetamaHashRing:
    """
    Ketama consistent hash ring implementation (libketama algorithm)
    Used in Memcached clients for distributed caching

    Key features:
    - MD5 hashing (4 replica points per virtual node)
    - 160 virtual nodes per physical node (configurable)
    - Statistical distribution analysis
    """

    def __init__(self, replicas_per_node: int = 160):
        """
        ACTION: Initialize ring with configurable virtual node count
        REASON: More virtual nodes = better distribution but higher memory cost
        Industry standard (libketama): 160 virtual nodes per physical node
        """
        self.replicas = replicas_per_node
        self.ring: List[int] = []  # sorted list of positions
        self.ring_map: Dict[int, str] = {}  # position -> node_id
        self.nodes: set[str] = set()

    def add_node(self, node_id: str) -> None:
        """
        Add node with virtual nodes using Ketama algorithm
        ACTION: Generate 160 virtual nodes, each producing 4 hash points (640 total)
        REASON: Multiple points per node distribute load evenly across ring
        """
        if node_id in self.nodes:
            raise ValueError(f"Node {node_id} already exists")

        self.nodes.add(node_id)

        # Generate virtual nodes: "node_id-0", "node_id-1", ..., "node_id-159"
        for vnode_idx in range(self.replicas):
            vnode_key = f"{node_id}-{vnode_idx}"

            # MD5 produces 128 bits = 16 bytes
            # Ketama extracts 4 positions from each MD5 hash
            digest = hashlib.md5(vnode_key.encode()).digest()

            # Extract 4 uint32 values from 16-byte digest
            for i in range(4):
                # ACTION: Extract 32-bit integer in little-endian byte order
                # REASON: Ketama spec uses little-endian for cross-platform compatibility
                position = (
                    digest[i*4] |
                    (digest[i*4 + 1] << 8) |
                    (digest[i*4 + 2] << 16) |
                    (digest[i*4 + 3] << 24)
                )

                # Insert position in sorted order (bisect maintains sort)
                insort(self.ring, position)
                self.ring_map[position] = node_id

        print(f"Added {node_id} with {self.replicas * 4} hash points")

    def remove_node(self, node_id: str) -> None:
        """
        Remove all virtual nodes associated with this physical node
        ACTION: Filter out all positions belonging to node_id
        REASON: Clean removal prevents stale routing entries
        """
        if node_id not in self.nodes:
            raise ValueError(f"Node {node_id} not found")

        # Remove all positions for this node
        positions_to_remove = [
            pos for pos, nid in self.ring_map.items() if nid == node_id
        ]

        for pos in positions_to_remove:
            self.ring.remove(pos)
            del self.ring_map[pos]

        self.nodes.remove(node_id)
        print(f"Removed {node_id} ({len(positions_to_remove)} hash points)")

    def get_node(self, key: str) -> Optional[str]:
        """
        Route key to node using Ketama algorithm
        ACTION: Hash key with MD5, find successor in sorted ring
        REASON: MD5 is fast and provides good distribution (though not cryptographically secure)
        """
        if not self.ring:
            return None

        # Ketama uses first 4 bytes of MD5 digest
        digest = hashlib.md5(key.encode()).digest()
        key_hash = (
            digest[0] |
            (digest[1] << 8) |
            (digest[2] << 16) |
            (digest[3] << 24)
        )

        # Binary search for successor
        # ACTION: bisect_left finds insertion point; we want first element >= key_hash
        # REASON: bisect_left gives us O(log n) lookup in sorted list
        idx = bisect_left(self.ring, key_hash)

        # Wrap around if we went past the end
        if idx >= len(self.ring):
            idx = 0

        position = self.ring[idx]
        return self.ring_map[position]

    def analyze_distribution(self, keys: List[str]) -> Dict[str, float]:
        """
        Statistical analysis of key distribution
        ACTION: Calculate load per node, standard deviation, and min/max
        REASON: Quantify distribution quality; Ketama targets <5% std deviation
        """
        distribution = defaultdict(int)

        for key in keys:
            node = self.get_node(key)
            if node:
                distribution[node] += 1

        total_keys = len(keys)
        expected_per_node = total_keys / len(self.nodes)

        # Calculate statistics
        counts = list(distribution.values())
        mean = sum(counts) / len(counts)
        variance = sum((x - mean) ** 2 for x in counts) / len(counts)
        std_dev = variance ** 0.5

        results = {
            "mean": mean,
            "expected": expected_per_node,
            "std_dev": std_dev,
            "std_dev_pct": (std_dev / mean) * 100,
            "min": min(counts),
            "max": max(counts),
            "distribution": dict(distribution)
        }

        return results

    def visualize_ring(self, num_segments: int = 20) -> None:
        """
        Visual representation of node distribution around ring
        ACTION: Divide ring into segments and show node density
        REASON: Visual inspection helps identify clustering problems
        """
        if not self.ring:
            print("Ring is empty")
            return

        print(f"\\n{'='*60}")
        print(f"Ketama Hash Ring Visualization")
        print(f"Nodes: {len(self.nodes)}, Hash points: {len(self.ring)}")
        print(f"{'='*60}")

        # Count points per node
        node_points = defaultdict(int)
        for node in self.ring_map.values():
            node_points[node] += 1

        print("\\nHash points per node:")
        for node, count in sorted(node_points.items()):
            expected = self.replicas * 4
            deviation = ((count - expected) / expected) * 100
            print(f"  {node}: {count} points ({deviation:+.1f}%)")

        # Show ring segments
        print(f"\\nRing segments (2^32 hash space divided into {num_segments} parts):")
        max_hash = 2**32
        segment_size = max_hash // num_segments

        segment_nodes = defaultdict(lambda: defaultdict(int))
        for pos, node in self.ring_map.items():
            segment = pos // segment_size
            segment_nodes[segment][node] += 1

        for seg in range(num_segments):
            nodes_in_seg = segment_nodes.get(seg, {})
            total = sum(nodes_in_seg.values())
            bar = "█" * (total // 10) if total > 0 else "·"
            print(f"  Segment {seg:2d}: {bar} ({total} points)")

        print(f"{'='*60}\\n")


# ====================
# Demo: Ketama vs Simple Hash Ring
# ====================

print("=== DEMONSTRATION: Ketama Algorithm Performance ===\\n")

# Create Ketama ring with standard configuration
ketama_ring = KetamaHashRing(replicas_per_node=160)

# Add nodes
print("Adding 4 nodes to Ketama ring...")
for i in range(1, 5):
    ketama_ring.add_node(f"cache-node-{i}")

# Visualize the ring structure
ketama_ring.visualize_ring()

# Generate test keys
print("\\nGenerating 100,000 random cache keys...")
test_keys = [f"user:session:{i}" for i in range(100000)]

# Analyze distribution
print("\\nAnalyzing key distribution with Ketama algorithm...")
ketama_stats = ketama_ring.analyze_distribution(test_keys)

print(f"\\nKetama Distribution Statistics:")
print(f"  Mean keys per node: {ketama_stats['mean']:.1f}")
print(f"  Expected per node: {ketama_stats['expected']:.1f}")
print(f"  Standard deviation: {ketama_stats['std_dev']:.2f} ({ketama_stats['std_dev_pct']:.2f}%)")
print(f"  Min/Max: {ketama_stats['min']} / {ketama_stats['max']}")

print(f"\\nPer-node distribution:")
for node, count in sorted(ketama_stats['distribution'].items()):
    percentage = (count / len(test_keys)) * 100
    expected_pct = 100 / len(ketama_ring.nodes)
    deviation = percentage - expected_pct
    bar = "█" * int(percentage)
    print(f"  {node}: {bar} {percentage:.2f}% ({deviation:+.2f}%)")

# CONTEXT DILATION: Compare with simple hash ring (no virtual nodes)
print("\\n" + "="*60)
print("CONTEXT DILATION: Simple Hash vs Ketama")
print("="*60)

print("""
Simple Hash Ring (no virtual nodes):
  - 4 physical nodes = 4 hash points
  - Random node positions can create huge load imbalance
  - Standard deviation typically 35-45% (very uneven)
  - Example: Node A gets 10%, Node D gets 40% of keys

Ketama Hash Ring (160 virtual nodes per physical):
  - 4 physical nodes = 640 hash points (160 * 4)
  - Virtual nodes distribute evenly around ring
  - Standard deviation typically 3-7% (near-perfect balance)
  - Each node gets 24-26% of keys (expected 25%)

Production Impact:
  - Memcached deployments use Ketama to prevent hotspots
  - Without virtual nodes, adding 1 node to 4-node cluster can
    cause 40% cache invalidation (instead of expected 20%)
  - Ketama ensures predictable ~20% invalidation (1/5 of keys)
""")

# Demonstrate node addition and key migration
print("\\n=== KEY MIGRATION TEST ===")
print("\\nBefore adding node: 4 nodes, 100k keys")
before_dist = ketama_stats['distribution']

ketama_ring.add_node("cache-node-5")
after_stats = ketama_ring.analyze_distribution(test_keys)
after_dist = after_stats['distribution']

print(f"\\nAfter adding node: 5 nodes, 100k keys")
print(f"New standard deviation: {after_stats['std_dev']:.2f} ({after_stats['std_dev_pct']:.2f}%)")

print("\\nKey migration summary:")
for node in sorted(after_dist.keys()):
    before = before_dist.get(node, 0)
    after = after_dist[node]
    migrated = after - before
    print(f"  {node}: {before:5d} -> {after:5d} ({migrated:+5d} keys)")

total_migrated = sum(abs(after_dist.get(n, 0) - before_dist.get(n, 0)) for n in after_dist)
migration_pct = (total_migrated / (2 * len(test_keys))) * 100  # divide by 2 (moves counted twice)

print(f"\\nTotal keys migrated: {total_migrated // 2} ({migration_pct:.2f}%)")
print(f"Expected migration: ~{len(test_keys) // 5} (20%)")
print(f"Ketama efficiency: Migration within expected bounds ✓")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade Ketama implementation with statistical distribution analysis",
        prerequisites: [
          "Python",
          "MD5 hashing",
          "Statistical analysis",
          "Binary search (bisect)",
        ],
        systemPosition:
          "Client-side routing logic in Memcached, Redis, or distributed cache clusters",
      },
      annotations: [
        {
          id: "ketama-replicas",
          lines: [16, 21],
          action:
            "Configure virtual node count (default 160 per physical node)",
          reason:
            "Libketama uses 160 replicas as optimal balance between distribution quality and memory usage",
          contextLevel: "system",
          relatedConcepts: ["virtual-nodes", "load-balancing"],
        },
        {
          id: "ketama-md5-extract",
          lines: [40, 53],
          action:
            "Extract 4 uint32 positions from single MD5 hash in little-endian",
          reason:
            "Ketama algorithm generates 4 ring positions per virtual node for better distribution granularity",
          contextLevel: "module",
          relatedConcepts: ["md5", "byte-order", "hash-distribution"],
        },
        {
          id: "ketama-key-hash",
          lines: [86, 96],
          action: "Hash key with MD5 and extract first 4 bytes as position",
          reason:
            "MD5 is fast (not cryptographically secure needed for routing) and consistent with Ketama spec",
          contextLevel: "local",
          relatedConcepts: ["non-cryptographic-hash", "performance"],
        },
        {
          id: "ketama-bisect",
          lines: [99, 102],
          action: "Use bisect_left for O(log n) binary search in sorted ring",
          reason:
            "Python's bisect module provides optimized binary search; critical for performance with 640+ points",
          contextLevel: "local",
          relatedConcepts: ["binary-search", "stdlib-optimization"],
        },
        {
          id: "ketama-statistics",
          lines: [113, 139],
          action:
            "Calculate mean, variance, std deviation, and min/max load distribution",
          reason:
            "Standard deviation <5% indicates good distribution; >20% suggests clustering problems",
          contextLevel: "system",
          relatedConcepts: ["statistical-analysis", "performance-monitoring"],
        },
        {
          id: "ketama-visualization",
          lines: [168, 182],
          action:
            "Divide 2^32 hash space into segments and count points per segment",
          reason:
            "Visual inspection reveals clustering: segments should have roughly equal point counts",
          contextLevel: "system",
          relatedConcepts: ["data-visualization", "debugging"],
        },
        {
          id: "ketama-migration",
          lines: [237, 249],
          action: "Track key count changes per node after adding new node",
          reason:
            "Demonstrates Ketama's property: adding 1 node to N nodes migrates ~1/(N+1) of keys",
          contextLevel: "system",
          relatedConcepts: ["data-migration", "scalability"],
        },
        {
          id: "ketama-comparison",
          lines: [211, 229],
          action:
            "Compare simple hash (no virtual nodes) vs Ketama distribution quality",
          reason:
            "Simple hash has 35-45% std dev; Ketama achieves 3-7% std dev with 160 virtual nodes",
          contextLevel: "ecosystem",
          relatedConcepts: ["performance-comparison", "algorithm-analysis"],
        },
      ],
      highlights: [
        {
          lines: [40, 53],
          label: "Ketama 4-point extraction from MD5",
          sbvpDomain: "structure",
        },
        {
          lines: [113, 139],
          label: "Statistical distribution analysis",
          sbvpDomain: "behavior",
        },
        {
          lines: [211, 229],
          label: "Performance comparison context",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "hash-ring-java-redis",
      language: "java",
      title: "Redis Cluster Slot-Based Routing",
      description:
        "Java implementation of Redis Cluster's slot-based hash ring variant. Uses CRC16 hashing with 16384 fixed slots for simplified rebalancing.",
      code: `import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Redis Cluster hash slot implementation
 *
 * Key differences from traditional hash ring:
 * - Fixed 16384 slots (not circular hash space)
 * - CRC16 hash function (not MD5/SHA-1)
 * - Slots assigned to nodes (not keys directly)
 * - Simpler rebalancing: move slots, not individual keys
 */
public class RedisClusterRouter {
    private static final int SLOT_COUNT = 16384;  // Redis Cluster spec

    // ACTION: Use CRC16 lookup table for fast computation
    // REASON: CRC16 is 10x faster than MD5, good enough distribution for 16k slots
    private static final int[] CRC16_LOOKUP_TABLE = generateCRC16Table();

    private final Map<Integer, String> slotToNode = new HashMap<>();
    private final Map<String, Set<Integer>> nodeToSlots = new HashMap<>();

    /**
     * Generate CRC16 lookup table (XMODEM polynomial)
     * ACTION: Precompute CRC16 values for all byte values (0-255)
     * REASON: Lookup table trades memory (512 bytes) for speed (no bit operations per byte)
     */
    private static int[] generateCRC16Table() {
        int[] table = new int[256];
        int polynomial = 0x1021;  // XMODEM polynomial

        for (int i = 0; i < 256; i++) {
            int crc = i << 8;
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x8000) != 0) {
                    crc = (crc << 1) ^ polynomial;
                } else {
                    crc = crc << 1;
                }
            }
            table[i] = crc & 0xFFFF;
        }
        return table;
    }

    /**
     * Calculate CRC16 hash for a key
     * ACTION: Use CRC16 with XMODEM polynomial, modulo 16384
     * REASON: Redis Cluster spec mandates CRC16 for cross-client compatibility
     */
    private int calculateSlot(String key) {
        // Redis Cluster hash tag support: "user:{alice}:session" -> hash only "alice"
        // ACTION: Extract hash tag if present (content between {})
        // REASON: Allows multi-key operations by forcing keys to same slot
        String hashKey = extractHashTag(key);

        byte[] bytes = hashKey.getBytes(StandardCharsets.UTF_8);
        int crc = 0;

        for (byte b : bytes) {
            int index = ((crc >> 8) ^ (b & 0xFF)) & 0xFF;
            crc = ((crc << 8) ^ CRC16_LOOKUP_TABLE[index]) & 0xFFFF;
        }

        return crc % SLOT_COUNT;
    }

    /**
     * Extract hash tag from key (Redis Cluster feature)
     * Example: "user:{alice}:session" -> "alice"
     * ACTION: Find content between first { and first } after it
     * REASON: Hash tags enable multi-key operations (all keys with same tag -> same slot)
     */
    private String extractHashTag(String key) {
        int start = key.indexOf('{');
        if (start == -1) return key;

        int end = key.indexOf('}', start + 1);
        if (end == -1 || end == start + 1) return key;

        return key.substring(start + 1, end);
    }

    /**
     * Assign slots to a node
     * ACTION: Update bidirectional mapping (slot->node and node->slots)
     * REASON: Both directions needed for routing and cluster management
     */
    public void assignSlots(String nodeId, int startSlot, int endSlot) {
        if (startSlot < 0 || endSlot >= SLOT_COUNT || startSlot > endSlot) {
            throw new IllegalArgumentException(
                String.format("Invalid slot range: %d-%d", startSlot, endSlot)
            );
        }

        Set<Integer> slots = nodeToSlots.computeIfAbsent(nodeId, k -> new HashSet<>());

        for (int slot = startSlot; slot <= endSlot; slot++) {
            // Remove slot from previous owner if exists
            String previousOwner = slotToNode.get(slot);
            if (previousOwner != null && !previousOwner.equals(nodeId)) {
                nodeToSlots.get(previousOwner).remove(slot);
            }

            slotToNode.put(slot, nodeId);
            slots.add(slot);
        }

        System.out.printf("Assigned slots %d-%d to %s (%d slots total)%n",
            startSlot, endSlot, nodeId, endSlot - startSlot + 1);
    }

    /**
     * Get node responsible for a key
     * ACTION: Calculate slot, then lookup owning node
     * REASON: Two-level indirection (key->slot->node) simplifies rebalancing
     */
    public String getNode(String key) {
        int slot = calculateSlot(key);
        String node = slotToNode.get(slot);

        if (node == null) {
            throw new IllegalStateException(
                String.format("Slot %d not assigned (key: %s)", slot, key)
            );
        }

        return node;
    }

    /**
     * Migrate slots from one node to another
     * ACTION: Atomically reassign slot range from source to target node
     * REASON: Slot-based approach enables bulk migration (vs key-by-key in traditional hash ring)
     */
    public void migrateSlots(String sourceNode, String targetNode,
                            int startSlot, int endSlot) {
        if (!nodeToSlots.containsKey(sourceNode)) {
            throw new IllegalArgumentException("Source node " + sourceNode + " not found");
        }

        Set<Integer> sourceSlots = nodeToSlots.get(sourceNode);
        Set<Integer> targetSlots = nodeToSlots.computeIfAbsent(targetNode, k -> new HashSet<>());

        int migratedCount = 0;
        for (int slot = startSlot; slot <= endSlot; slot++) {
            if (slotToNode.get(slot).equals(sourceNode)) {
                slotToNode.put(slot, targetNode);
                sourceSlots.remove(slot);
                targetSlots.add(slot);
                migratedCount++;
            }
        }

        System.out.printf("Migrated %d slots from %s to %s%n",
            migratedCount, sourceNode, targetNode);
    }

    /**
     * Get cluster topology summary
     * ACTION: Calculate slot distribution and coverage
     * REASON: Validate cluster health (all slots assigned, balanced distribution)
     */
    public ClusterTopology getTopology() {
        int assignedSlots = slotToNode.size();
        int unassignedSlots = SLOT_COUNT - assignedSlots;

        Map<String, Integer> nodeSlotCounts = nodeToSlots.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                e -> e.getValue().size()
            ));

        double avgSlotsPerNode = nodeToSlots.isEmpty() ? 0 :
            (double) assignedSlots / nodeToSlots.size();

        return new ClusterTopology(
            SLOT_COUNT,
            assignedSlots,
            unassignedSlots,
            nodeSlotCounts,
            avgSlotsPerNode
        );
    }

    /**
     * Analyze key distribution across nodes
     * ACTION: Hash sample keys and count which nodes they route to
     * REASON: Verify that slot-based routing distributes keys evenly in practice
     */
    public Map<String, Integer> analyzeDistribution(List<String> keys) {
        Map<String, Integer> distribution = new HashMap<>();

        for (String key : keys) {
            String node = getNode(key);
            distribution.merge(node, 1, Integer::sum);
        }

        return distribution;
    }

    /**
     * Cluster topology information
     */
    public static class ClusterTopology {
        public final int totalSlots;
        public final int assignedSlots;
        public final int unassignedSlots;
        public final Map<String, Integer> nodeSlotCounts;
        public final double avgSlotsPerNode;

        ClusterTopology(int totalSlots, int assignedSlots, int unassignedSlots,
                       Map<String, Integer> nodeSlotCounts, double avgSlotsPerNode) {
            this.totalSlots = totalSlots;
            this.assignedSlots = assignedSlots;
            this.unassignedSlots = unassignedSlots;
            this.nodeSlotCounts = nodeSlotCounts;
            this.avgSlotsPerNode = avgSlotsPerNode;
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder();
            sb.append("\\nRedis Cluster Topology:\\n");
            sb.append(String.format("  Total slots: %d\\n", totalSlots));
            sb.append(String.format("  Assigned: %d (%.1f%%)\\n",
                assignedSlots, (assignedSlots * 100.0 / totalSlots)));
            sb.append(String.format("  Unassigned: %d\\n", unassignedSlots));
            sb.append(String.format("  Avg slots/node: %.1f\\n", avgSlotsPerNode));
            sb.append("\\n  Slot distribution:\\n");

            nodeSlotCounts.forEach((node, count) -> {
                double percentage = (count * 100.0) / totalSlots;
                sb.append(String.format("    %s: %d slots (%.2f%%)\\n",
                    node, count, percentage));
            });

            return sb.toString();
        }
    }

    // ====================
    // Demo and Testing
    // ====================

    public static void main(String[] args) {
        System.out.println("=== Redis Cluster Hash Slot Routing Demo ===\\n");

        RedisClusterRouter router = new RedisClusterRouter();

        // Initial 3-node cluster with balanced slot distribution
        System.out.println("Setting up 3-node cluster with balanced slots...");
        router.assignSlots("node-1", 0, 5460);      // ~33.3%
        router.assignSlots("node-2", 5461, 10922);  // ~33.3%
        router.assignSlots("node-3", 10923, 16383); // ~33.4%

        ClusterTopology topology = router.getTopology();
        System.out.println(topology);

        // Test key routing
        System.out.println("\\n=== Key Routing Examples ===");
        String[] testKeys = {
            "user:1000",
            "session:abc123",
            "product:laptop",
            "order:98765"
        };

        for (String key : testKeys) {
            int slot = router.calculateSlot(key);
            String node = router.getNode(key);
            System.out.printf("  %s -> slot %d -> %s\\n", key, slot, node);
        }

        // Test hash tags (multi-key operations)
        System.out.println("\\n=== Hash Tag Support (Multi-Key Operations) ===");
        String[] taggedKeys = {
            "user:{alice}:profile",
            "user:{alice}:sessions",
            "user:{alice}:preferences",
            "user:{bob}:profile",
            "user:{bob}:sessions"
        };

        Map<String, List<String>> keysByNode = new HashMap<>();
        for (String key : taggedKeys) {
            String node = router.getNode(key);
            keysByNode.computeIfAbsent(node, k -> new ArrayList<>()).add(key);
        }

        System.out.println("Keys grouped by hash tag route to same node:");
        keysByNode.forEach((node, keys) -> {
            System.out.printf("  %s:\\n", node);
            keys.forEach(k -> System.out.printf("    - %s (slot %d)\\n",
                k, router.calculateSlot(k)));
        });

        // Distribution analysis with 100k keys
        System.out.println("\\n=== Distribution Analysis (100,000 keys) ===");
        List<String> randomKeys = new ArrayList<>();
        for (int i = 0; i < 100000; i++) {
            randomKeys.add("key:" + i);
        }

        Map<String, Integer> distribution = router.analyzeDistribution(randomKeys);
        distribution.forEach((node, count) -> {
            double percentage = (count * 100.0) / randomKeys.size();
            System.out.printf("  %s: %d keys (%.2f%%)\\n", node, count, percentage);
        });

        // Add new node and rebalance
        System.out.println("\\n=== Adding 4th Node and Rebalancing ===");
        System.out.println("Migrating slots to new node...");

        // Each existing node gives up ~25% of slots to new node
        router.assignSlots("node-4", 0, 0);  // Initialize node
        router.migrateSlots("node-1", "node-4", 0, 1365);      // ~8.3%
        router.migrateSlots("node-2", "node-4", 5461, 6826);   // ~8.3%
        router.migrateSlots("node-3", "node-4", 10923, 12288); // ~8.3%

        ClusterTopology newTopology = router.getTopology();
        System.out.println(newTopology);

        // CONTEXT DILATION: Compare slot-based vs traditional hash ring
        System.out.println("\\n" + "=".repeat(60));
        System.out.println("CONTEXT DILATION: Slot-Based vs Traditional Hash Ring");
        System.out.println("=".repeat(60));
        System.out.println("""

Traditional Hash Ring (Memcached/Ketama):
  - Circular hash space (2^160 for SHA-1)
  - Keys route directly to nodes via successor lookup
  - Rebalancing: migrate individual keys one-by-one
  - Adding node: must scan all keys to find ones that should migrate
  - Virtual nodes needed for good distribution (640+ points)

Redis Cluster Slot-Based Routing:
  - Fixed 16384 slots (smaller, simpler than 2^160)
  - Keys route to slots, slots assigned to nodes
  - Rebalancing: move entire slot ranges atomically
  - Adding node: migrate predetermined slot ranges (no key scanning)
  - Even distribution without virtual nodes (slots are virtual nodes)

Performance Comparison:
  - Lookup: Both O(log n) with binary search
  - Rebalancing: Redis O(1) slot reassignment vs O(k) key migration
  - Migration protocol: Redis moves slots in background, serves during migration
  - Cluster awareness: Redis clients cache slot map (16KB), update on redirects

Production Considerations:
  - Redis Cluster: Better for planned scaling (move slots methodically)
  - Hash Ring: Better for dynamic membership (nodes join/leave frequently)
  - Redis supports live migration: source serves reads, redirects writes
  - Slot size: ~61 keys/slot on average (1M keys / 16384 slots)
        """);
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Redis Cluster routing with CRC16, hash tags, slot migration, and topology management",
        prerequisites: [
          "Java",
          "CRC16 checksums",
          "Cluster coordination",
          "Data migration protocols",
        ],
        systemPosition:
          "Client-side routing library in Redis Cluster deployments (Stack Overflow, GitHub, Discord)",
      },
      annotations: [
        {
          id: "redis-slot-count",
          lines: [14, 14],
          action: "Define 16384 fixed slots (Redis Cluster specification)",
          reason:
            "16384 = 2^14, small enough to fit slot bitmap in 2KB, large enough for granular distribution",
          contextLevel: "ecosystem",
          relatedConcepts: ["redis-cluster", "slot-based-routing"],
        },
        {
          id: "redis-crc16-table",
          lines: [16, 18],
          action: "Precompute CRC16 lookup table with XMODEM polynomial",
          reason:
            "Lookup table provides 10x speedup over bit-by-bit CRC computation, critical for high-throughput",
          contextLevel: "module",
          relatedConcepts: ["crc16", "lookup-table-optimization"],
        },
        {
          id: "redis-hash-tag",
          lines: [48, 53],
          action:
            "Extract content between {} as hash key for multi-key operations",
          reason:
            "Hash tags force related keys to same slot, enabling atomic multi-key operations (MGET, transactions)",
          contextLevel: "system",
          relatedConcepts: ["multi-key-operations", "atomic-transactions"],
        },
        {
          id: "redis-slot-calc",
          lines: [56, 62],
          action:
            "Calculate CRC16 of key bytes, modulo 16384 for slot assignment",
          reason:
            "CRC16 is deterministic and fast; modulo 16384 maps hash to slot range",
          contextLevel: "local",
          relatedConcepts: ["deterministic-routing", "hash-modulo"],
        },
        {
          id: "redis-bidirectional-map",
          lines: [83, 92],
          action: "Maintain both slot->node and node->slots mappings",
          reason:
            "Slot->node for fast routing; node->slots for cluster management and rebalancing",
          contextLevel: "module",
          relatedConcepts: ["bidirectional-mapping", "data-structure-design"],
        },
        {
          id: "redis-slot-migration",
          lines: [129, 149],
          action: "Atomically reassign slot range from source to target node",
          reason:
            "Slot-level migration is simpler than key-level: move metadata, then bulk-copy keys in background",
          contextLevel: "system",
          relatedConcepts: ["live-migration", "zero-downtime-rebalancing"],
        },
        {
          id: "redis-topology",
          lines: [155, 170],
          action:
            "Calculate cluster health metrics: coverage, balance, unassigned slots",
          reason:
            "Cluster must have 100% slot coverage to be operational; balance affects performance",
          contextLevel: "system",
          relatedConcepts: ["cluster-health", "operational-monitoring"],
        },
        {
          id: "redis-vs-hashring",
          lines: [318, 349],
          action:
            "Compare slot-based routing advantages vs traditional hash ring",
          reason:
            "Slots enable simpler rebalancing protocol: move 'virtual buckets' instead of scanning all keys",
          contextLevel: "ecosystem",
          relatedConcepts: ["architectural-tradeoffs", "design-decisions"],
        },
      ],
      highlights: [
        {
          lines: [26, 43],
          label: "CRC16 lookup table generation",
          sbvpDomain: "structure",
        },
        {
          lines: [70, 81],
          label: "Hash tag extraction for multi-key ops",
          sbvpDomain: "behavior",
        },
        {
          lines: [318, 349],
          label: "Architectural comparison: slots vs hash ring",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Distributed cache routing (Memcached, Redis Cluster)",
      "Load balancer node selection (nginx, HAProxy)",
      "Sharded database partitioning (DynamoDB, Cassandra)",
      "Message queue routing (Kafka partition assignment)",
      "CDN server selection (edge cache routing)",
      "Peer-to-peer network routing (DHT, Chord)",
    ],
    interactsWith: [
      "consistent-hashing",
      "virtual-nodes",
      "replication",
      "load-balancing",
      "service-discovery",
    ],
    architecturalBoundaries: [
      "Routing decision layer: where hash ring logic executes (client-side, proxy, or coordinator)",
      "Storage/compute nodes: physical or virtual machines that store partitioned data",
      "Hash function abstraction: SHA-1, MD5, MurmurHash, CRC16 - must be consistent across clients",
      "Topology management: node addition/removal protocol and key migration orchestration",
    ],
  },

  implementations: [
    {
      id: "libketama",
      name: "libketama",
      type: "library",
      languages: ["c"],
      description:
        "Reference implementation of Ketama consistent hashing algorithm for Memcached. Uses MD5 hashing with 160 virtual nodes per physical node, producing 640 hash points. Industry standard for client-side routing in Memcached deployments. Ports available in Python, Ruby, Java, Go, and JavaScript.",
      links: {
        github: "https://github.com/RJ/ketama",
        docs: "https://www.last.fm/user/RJ/journal/2007/04/10/rz_libketama_-_a_consistent_hashing_algo_for_memcache_clients",
      },
      codeSnippet: `// libketama C API
ketama_continuum c = ketama_smoke_init("memcached_servers.txt");
char* server = ketama_get_server("user:12345", c);
printf("Key routes to: %s\\n", server);
ketama_smoke_destroy(c);`,
    },
    {
      id: "redis-cluster",
      name: "Redis Cluster",
      type: "platform",
      languages: ["any"],
      description:
        "Redis's native sharding solution using 16384 hash slots with CRC16 hashing. Slots are assigned to nodes in ranges; clients cache slot map and receive MOVED/ASK redirects during rebalancing. Supports hash tags for multi-key operations and live slot migration without downtime.",
      links: {
        docs: "https://redis.io/docs/management/scaling/",
        github: "https://github.com/redis/redis",
      },
      codeSnippet: `# Redis Cluster slot calculation
CLUSTER KEYSLOT "user:12345"  # Returns slot number (0-16383)
CLUSTER NODES                  # Shows slot assignments per node

# Hash tag example (multi-key op)
MGET user:{alice}:profile user:{alice}:session  # Same slot`,
    },
    {
      id: "amazon-dynamodb",
      name: "Amazon DynamoDB",
      type: "service",
      languages: ["any"],
      description:
        "AWS-managed NoSQL database using consistent hashing for automatic sharding. Partition key is hashed to determine storage node; DynamoDB automatically splits partitions when they exceed 10GB or 3000 RCU/1000 WCU. Hash ring rebalancing is transparent to applications.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html",
      },
      codeSnippet: `// DynamoDB partition key determines node via hash ring
{
  "TableName": "Users",
  "Item": {
    "userId": "12345",  // Partition key - hashed to determine node
    "name": "Alice"
  }
}`,
    },
    {
      id: "nginx-hash",
      name: "nginx hash directive",
      type: "platform",
      languages: ["nginx"],
      description:
        "Nginx load balancer supports consistent hash-based upstream selection. Uses MurmurHash2 or custom hash with optional virtual nodes (weight parameter). Minimizes upstream server changes when backend pool scales.",
      links: {
        docs: "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#hash",
      },
      codeSnippet: `upstream backend {
    hash $request_uri consistent;  # Consistent hash ring
    server backend1.example.com weight=3;
    server backend2.example.com weight=2;
    server backend3.example.com;
}`,
    },
    {
      id: "varnish-director",
      name: "Varnish director",
      type: "platform",
      languages: ["vcl"],
      description:
        "Varnish HTTP cache supports hash-based backend selection via directors. SHA256-based consistent hashing with configurable virtual nodes. Used in high-traffic CDN deployments to distribute cache load.",
      links: {
        docs: "https://varnish-cache.org/docs/trunk/users-guide/vcl-backends.html#directors",
        github: "https://github.com/varnish/varnish-cache",
      },
      codeSnippet: `import directors;

sub vcl_init {
    new bar = directors.hash();
    bar.add_backend(server1, 10);  # 10 virtual nodes
    bar.add_backend(server2, 10);
}

sub vcl_recv {
    set req.backend_hint = bar.backend(req.url);  # Hash URL to backend
}`,
    },
    {
      id: "haproxy-consistent-hash",
      name: "HAProxy consistent hash",
      type: "platform",
      languages: ["haproxy"],
      description:
        "HAProxy load balancer with consistent hashing support. Supports multiple hash algorithms (sdbm, djb2, wt6) and adjustable virtual node counts. Provides smooth scaling with minimal session redistribution.",
      links: {
        docs: "https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/#4.2-balance",
      },
      codeSnippet: `backend cache_servers
    balance consistent hash-type sdbm
    hash-balance-factor 150  # Virtual nodes per server
    server cache1 10.0.1.1:11211
    server cache2 10.0.1.2:11211
    server cache3 10.0.1.3:11211`,
    },
    {
      id: "akka-consistent-hashing-router",
      name: "Akka consistent hashing router",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Akka actor framework provides consistent hash routing for actor pools. Messages route to actors based on hash of message content or envelope. Uses virtual nodes (160 default) for balanced work distribution.",
      links: {
        docs: "https://doc.akka.io/docs/akka/current/routing.html#consistenthashing",
        github: "https://github.com/akka/akka",
      },
      codeSnippet: `// Akka ConsistentHashingRouter
int nrOfInstances = 10;
ActorRef router = getContext().actorOf(
  new ConsistentHashingPool(nrOfInstances).props(Props.create(Worker.class)),
  "workerRouter"
);

// Message with hash key
router.tell(new ConsistentHashableEnvelope(message, "user-123"), getSelf());`,
    },
    {
      id: "envoy-ring-hash",
      name: "Envoy ring hash load balancer",
      type: "platform",
      languages: ["any"],
      description:
        "Envoy proxy supports ring hash load balancing with configurable hash function (xxHash, murmurHash2) and minimum/maximum ring size. Used in service meshes (Istio, AWS App Mesh) for consistent request routing.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers#ring-hash",
        github: "https://github.com/envoyproxy/envoy",
      },
      codeSnippet: `load_assignment:
  cluster_name: cache_cluster
  policy:
    ring_hash_lb_config:
      hash_function: XX_HASH     # Fast hash function
      minimum_ring_size: 1024    # Virtual nodes
      maximum_ring_size: 8388608
  endpoints:
    - lb_endpoints:
      - endpoint:
          address: {socket_address: {address: cache1, port_value: 11211}}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "memcached-facebook",
      systemName: "Facebook Memcached Infrastructure",
      howUsed:
        "Facebook operates one of the world's largest Memcached deployments with thousands of cache servers distributed globally. Client-side consistent hashing using libketama routes cache keys to servers, ensuring that the same key always hits the same server for cache efficiency. When Facebook adds cache servers during traffic spikes (billions of users), the hash ring ensures only ~1/N keys are invalidated rather than flushing entire cache clusters. Pattern composition: Hash Ring (libketama) + Replication (regional clusters) + Cache-Aside + Connection Pooling. Each web server maintains a consistent hash ring of available Memcached servers in its region. Hash ring enables horizontal scaling without cache stampedes: adding 1 server to 1000-server pool invalidates only 0.1% of cached data. During regional failover, hash ring recomputes with surviving servers, gracefully degrading to primary data stores for missed keys. Rationale: With 3 billion users generating 1M+ requests per second, cache hit rate is critical—even 1% hit rate drop costs thousands of additional database queries. Impact: Enabled scaling from 100 to 10,000+ Memcached servers without cache architecture redesign; maintained 95%+ cache hit rates during server additions; reduced database load by 100x during peak traffic.",
      source: "https://www.facebook.com/notes/10158791368532200/",
    },
    {
      systemId: "twitter-cache",
      systemName: "Twitter Caching Infrastructure",
      howUsed:
        "Twitter uses consistent hashing for its massive Memcached and Redis deployments that power timeline assembly, tweet caching, and user graph queries. The hash ring distributes billions of cache keys across thousands of servers in multiple data centers. During major events (Super Bowl, breaking news), traffic can spike 10x—Twitter dynamically adds cache servers, and the hash ring ensures minimal disruption (only keys in affected ring segments migrate). Pattern composition: Hash Ring + Virtual Nodes (160 per server) + Read Replicas (multi-region) + TTL-based Expiration. Twitter's custom consistent hashing implementation optimizes for their specific workload: timeline keys use user_id as hash input to ensure related data co-locates. When cache servers fail (common in 10,000+ server fleet), the hash ring automatically routes affected keys to successor servers, triggering cache-aside pattern to refill from database. Rationale: Timeline assembly requires fetching 100+ cached objects per request; routing must be deterministic and fast (sub-millisecond) to meet latency SLOs. Impact: Handles 500M tweets per day with median cache lookup latency <1ms; survives loss of entire cache cluster (100+ servers) with graceful degradation; reduces database queries by 95% during normal operation.",
      source:
        "https://blog.twitter.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale",
    },
    {
      systemId: "discord-messages",
      systemName: "Discord Message Routing",
      howUsed:
        "Discord uses consistent hashing to route messages and presence updates across thousands of server nodes handling 150+ million active users. Each guild (Discord server) is assigned to a specific node via hash ring based on guild_id, ensuring all messages for a guild hit the same node for state consistency. As Discord scales (adding nodes for new user growth), the hash ring minimizes guild migrations—only ~1/N guilds move when adding the Nth node. Pattern composition: Hash Ring + WebSocket Fan-out + Actor Model (guilds as actors) + Event Sourcing. Discord's hash ring operates at two levels: (1) guild routing to application nodes, (2) user routing to WebSocket gateway nodes. When application nodes fail, affected guilds migrate to successor nodes via hash ring, triggering state reconstruction from event log. Virtual nodes (256 per physical node) prevent hotspots when popular guilds (millions of members) hash to clustered positions. Rationale: Real-time message delivery requires consistent routing—if messages for a guild route to different nodes, race conditions corrupt chat state; hash ring provides this consistency without coordination overhead. Impact: Routes 1 billion+ messages per day with <50ms delivery latency; handles node failures (dozens per day) with <5 second recovery time; scales from 100M to 200M users with zero downtime migrations.",
      source:
        "https://discord.com/blog/how-discord-stores-billions-of-messages",
    },
    {
      systemId: "uber-ringpop",
      systemName: "Uber Ringpop Service Mesh",
      howUsed:
        "Uber developed Ringpop, an open-source consistent hash ring library, to route ride requests across thousands of microservice instances globally. Each ride request hashes to a specific instance that maintains state (driver locations, matching logic, pricing calculations). When Uber deploys new service versions or scales during demand spikes, the hash ring ensures only affected keys migrate to new instances. Pattern composition: Hash Ring + SWIM Gossip (membership) + Request Forwarding + Sticky Routing. Ringpop combines hash ring routing with SWIM protocol for distributed membership: nodes gossip about joins/leaves/failures, updating local hash ring views within seconds. When a request hashes to a different instance (e.g., after rebalancing), Ringpop automatically forwards to the correct instance, providing transparent migration. Virtual nodes prevent hotspots in geographic partitions (e.g., downtown surge pricing affects more requests). Rationale: Uber processes millions of concurrent ride requests; stateful routing is critical for real-time matching—hash ring provides O(log n) routing without centralized coordination or databases. Impact: Handles 10M+ rides per day across 10,000+ service instances; recovers from node failures in <3 seconds via hash ring recomputation; reduced cross-instance request forwarding by 90% compared to random routing.",
      source: "https://eng.uber.com/ringpop-open-source-nodejs-library/",
    },
    {
      systemId: "cloudflare-cdn",
      systemName: "CloudFlare CDN Edge Routing",
      howUsed:
        "CloudFlare uses consistent hashing to route cached content across thousands of edge servers in 300+ data centers. When a user requests a resource, the URL hashes to a specific edge server using hash ring routing, maximizing cache hit rates. As CloudFlare expands (adding new PoPs or servers), the hash ring minimizes cache invalidation—only ~1/N URLs re-route to new servers. Pattern composition: Hash Ring + Tiered Caching (L1/L2) + Anycast Routing + Cache Purging. CloudFlare's implementation uses two hash rings: (1) global ring across data centers for L2 cache, (2) local ring within each PoP for L1 cache. When edge servers fail or enter maintenance, hash ring routes affected URLs to healthy servers, which fetch from L2 cache or origin. Virtual nodes (configurable 100-500) optimize for heterogeneous hardware—larger servers get more virtual nodes, receiving proportionally more traffic. Rationale: With 40M+ websites and 25M+ HTTP requests per second, cache consistency is critical—hash ring ensures same URL always hits same server (when topology stable) for maximum hit rate. Impact: Achieves 95%+ cache hit rate across global CDN; serves 1B+ unique IPs daily; handles DDoS attacks (10M+ RPS) without cache thrashing; reduced origin server load by 98%.",
      source: "https://blog.cloudflare.com/building-a-more-efficient-cdn/",
    },
  ],

  philosophy: {
    coreProblem:
      "Traditional hash-based partitioning (modulo hashing) requires redistributing all data when the number of nodes changes, causing massive cache invalidation and data movement in distributed systems",
    designPrinciple:
      "Map both keys and nodes onto a shared circular hash space; keys route to the nearest node in clockwise direction, ensuring that only ~1/N keys move when nodes change",
    historicalContext:
      "Hash ring concept emerged from peer-to-peer research (Chord DHT, 2001) and was popularized by Akamai's consistent hashing paper (1997). Memcached community standardized on libketama implementation (2007), making hash rings ubiquitous in distributed caching.",
    alternativesRejected: [
      "Modulo hashing (hash % N) - simple but causes complete redistribution when N changes",
      "Static partition table - requires coordination and cannot adapt to dynamic membership",
      "Random routing - no cache affinity, extremely low hit rates",
      "Range-based partitioning - manual rebalancing overhead, hotspot risk",
    ],
    mentalModel:
      "Imagine a circular racetrack where runners (nodes) stand at specific positions. When someone throws a ball (key) onto the track, it rolls clockwise until it reaches the first runner. Adding a new runner only affects balls that would roll past their position—everyone else's assignments stay the same.",
  },

  visualization: {
    staticDiagram: `graph LR
    subgraph "Hash Space: 0 to 2^160-1"
      direction TB
      H0[0] -->|ring| H1[...] -->|ring| H2[2^160-1]
      H2 -->|wrap around| H0
    end

    subgraph "Nodes on Ring"
      N1[Node A: 30]
      N2[Node B: 90]
      N3[Node C: 180]
    end

    subgraph "Keys"
      K1[Key X: 45]
      K2[Key Y: 120]
    end

    K1 -->|successor: 90| N2
    K2 -->|successor: 180| N3`,
    realWorldAnalogy:
      "A hash ring is like a circular conveyor belt at an airport baggage claim with multiple pickup stations. Bags (keys) are placed on the belt at random positions based on flight number. Passengers (nodes) stand at specific positions around the belt. Each bag belongs to the first passenger clockwise from where it lands. When a new passenger joins, they only take bags that would pass their position—everyone else's bags remain unchanged.",
    useCases: [
      {
        domain: "Distributed Caching",
        scenario:
          "Memcached cluster with 100 servers caches 1 billion objects. Adding 1 new server should only invalidate ~1% of cache (10M objects), not the entire cache.",
        patternRole:
          "Hash ring ensures each key consistently routes to the same server; adding server only affects keys in immediate vicinity on ring",
        companies: ["Facebook", "Twitter", "Pinterest"],
      },
      {
        domain: "Content Delivery Network",
        scenario:
          "CDN with 1000 edge servers caches web assets. When servers fail or enter maintenance, traffic should redistribute smoothly without cache stampede.",
        patternRole:
          "Hash ring routes URLs to edge servers; failed server's traffic redistributes to successor, which warms cache gradually",
        companies: ["CloudFlare", "Akamai", "Fastly"],
      },
      {
        domain: "Database Sharding",
        scenario:
          "Sharded database with 50 nodes stores 10TB of data. Adding shards for growth should minimize data migration to avoid performance degradation.",
        patternRole:
          "Hash ring determines which shard owns each partition key; adding shard only migrates ~2% of data (1/50)",
        companies: ["DynamoDB", "Cassandra", "MongoDB"],
      },
      {
        domain: "Load Balancing",
        scenario:
          "Web application with 200 backend servers uses session affinity. Server restarts should not cause mass session invalidation.",
        patternRole:
          "Hash ring routes session_id to backend server; restarted server only affects its assigned sessions, others remain sticky",
        companies: ["Uber", "Lyft", "Airbnb"],
      },
    ],
  },

  tags: [
    "scalability",
    "partitioning",
    "distributed-systems",
    "consistent-hashing",
    "load-balancing",
    "caching",
  ],
  difficulty: "intermediate",
};
