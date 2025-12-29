import type { Pattern } from "../schema";

export const rendezvousHashing: Pattern = {
  id: "rendezvous-hashing",
  slug: "rendezvous-hashing",
  corpusPath:
    "📈 SCALABILITY → 🧩 Partitioning → #️⃣ Hash Partitioning → 🎯 Rendezvous Hashing",

  hierarchy: {
    quality: "scalability",
    strategy: "Partitioning",
    family: "Hash Partitioning",
    level: 4,
  },

  concept: {
    name: "Rendezvous Hashing",
    emoji: "🎯",
    tagline: "Highest random weight",
    definition:
      "Rendezvous Hashing (also known as Highest Random Weight or HRW hashing) is a distributed hash algorithm where each key independently ranks all available nodes by computing a hash-based score for each key-node pair, then selects the node with the highest score. Unlike consistent hashing which requires maintaining a ring data structure with virtual nodes, rendezvous hashing is stateless—every client can independently determine the correct node by simply hashing the key against each node identifier and picking the highest scorer. This deterministic selection happens without any coordination or shared state. When nodes are added or removed, only the keys that would have selected the departed node (approximately 1/N of total keys) need reassignment, providing the same minimal disruption property as consistent hashing but with simpler implementation. The algorithm naturally supports weighted nodes by incorporating node capacity into the scoring function, making it trivial to handle heterogeneous clusters. While the O(N) computation cost per lookup makes it less suitable for very large node sets (1000+ nodes), its simplicity, uniform distribution, and lack of data structure overhead make it ideal for moderate-sized clusters where algorithmic clarity and maintenance simplicity outweigh raw performance.",
    problemSolved:
      "Traditional hash-based partitioning (key % N) suffers catastrophic rebalancing when nodes change—adding or removing a single node remaps almost all keys, causing massive data movement. Consistent hashing solves this with a hash ring and virtual nodes, but introduces complexity: the ring structure requires careful maintenance, virtual nodes consume memory proportional to the replication factor, and achieving uniform distribution across weighted nodes requires tuning virtual node counts. Rendezvous hashing eliminates these problems through pure computation: no ring to maintain, no virtual nodes to manage, no data structures to keep in sync. It achieves the same 1/N disruption property as consistent hashing (only keys mapped to the removed node need reassignment) but with dramatically simpler code. Weighted node support is natural—just multiply the hash score by the node's weight. The trade-off is computational: O(N) hash operations per lookup versus O(log N) for consistent hashing with binary search, making rendezvous hashing ideal for clusters with 10-100 nodes where simplicity and correctness matter more than microsecond-level lookup performance.",
    tradeoffs: {
      pros: [
        "No ring data structure needed—pure stateless computation",
        "Naturally supports weighted nodes without virtual node tuning",
        "Uniform distribution guaranteed by cryptographic hash properties",
        "Simple implementation—50-100 lines of code versus 500+ for consistent hashing",
        "No memory overhead for virtual nodes or ring maintenance",
      ],
      cons: [
        "O(N) computation per lookup—must hash against every node",
        "Poor cache locality—no early termination possible",
        "Unsuitable for very large clusters (1000+ nodes)",
        "Higher CPU cost than hash ring with binary search",
        "No spatial locality—similar keys don't map to nearby nodes",
      ],
    },
    relatedPatterns: [
      "consistent-hashing",
      "jump-hash",
      "hash-ring",
      "weighted",
      "maglev",
      "cache-aside",
      "load-balancing",
    ],
  },

  structure: {
    participants: [
      {
        name: "Key",
        role: "Input",
        responsibilities: [
          "Represent the item to be partitioned (cache key, request ID, user ID)",
          "Combined with node identifier to create unique hash input",
        ],
      },
      {
        name: "Node Set",
        role: "Candidate Pool",
        responsibilities: [
          "Maintain list of available nodes with their identifiers",
          "Track node weights for capacity-aware selection",
          "Handle node addition and removal",
        ],
      },
      {
        name: "Weight Calculator",
        role: "Capacity Handler",
        responsibilities: [
          "Assign capacity weights to nodes (e.g., 1.0 for standard, 2.0 for double capacity)",
          "Multiply hash scores by weights to bias selection toward higher-capacity nodes",
        ],
      },
      {
        name: "Hash Function",
        role: "Score Generator",
        responsibilities: [
          "Compute hash of key+nodeID combination",
          "Provide uniform distribution across hash space",
          "Must be fast (MurmurHash, CRC32) for O(N) computation",
        ],
      },
      {
        name: "Highest Score Selector",
        role: "Decision Maker",
        responsibilities: [
          "Iterate through all nodes computing weighted scores",
          "Track maximum score and corresponding node",
          "Return node with highest score",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant HRW as Rendezvous Hash
    participant Nodes as Node Set

    Client->>HRW: select_node(key)
    HRW->>Nodes: get_all_nodes()
    Nodes-->>HRW: [node1, node2, ..., nodeN]

    loop For each node
        HRW->>HRW: score = hash(key + node.id) * node.weight
        Note over HRW: Track highest score
    end

    HRW->>HRW: node = max_by_score()
    HRW-->>Client: selected_node

    Note over Client,Nodes: O(N) computation<br/>No coordination needed<br/>Deterministic result`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request Node Selection",
        description:
          "Client provides key (cache key, user ID, request ID) to determine which node should handle it",
      },
      {
        step: 2,
        actor: "Rendezvous Hash",
        action: "Retrieve Node Set",
        description:
          "Get current list of available nodes with their weights and identifiers",
      },
      {
        step: 3,
        actor: "Hash Function",
        action: "Compute Scores",
        description:
          "For each node, hash the concatenation of key and node identifier (e.g., hash('user123' + 'node-a'))",
      },
      {
        step: 4,
        actor: "Weight Calculator",
        action: "Apply Weights",
        description:
          "Multiply each hash score by the node's capacity weight to bias toward higher-capacity nodes",
      },
      {
        step: 5,
        actor: "Highest Score Selector",
        action: "Find Maximum",
        description:
          "Iterate through all weighted scores and track the node with the highest value",
      },
      {
        step: 6,
        actor: "Rendezvous Hash",
        action: "Return Selected Node",
        description:
          "Return the node with the highest weighted score—this is deterministic and stateless",
      },
      {
        step: 7,
        actor: "Node Set",
        action: "Handle Node Changes",
        description:
          "When node added/removed, only ~1/N keys remap (those previously mapped to removed node or now mapped to new node)",
      },
      {
        step: 8,
        actor: "Client",
        action: "Route Request",
        description:
          "Send request to selected node (cache GET, load balancer backend, database shard)",
      },
    ],
    invariants: [
      "Deterministic selection—same key always maps to same node (given same node set)",
      "All nodes evaluated—no early termination, ensuring fairness",
      "Highest score wins—selection is purely based on maximum weighted hash",
      "Minimal disruption—only 1/N keys redistribute when node added/removed (same as consistent hashing)",
      "No coordination required—any client can independently compute the same result",
      "Weight monotonicity—higher weight increases selection probability proportionally",
    ],
  },

  codeExamples: [
    {
      id: "rendezvous-ts-core",
      language: "typescript",
      title: "TypeScript Rendezvous Hash with MurmurHash3",
      description:
        "Complete HRW implementation with MurmurHash3 for speed, weighted node support, and distribution uniformity testing",
      code: `/**
 * Rendezvous Hashing (Highest Random Weight)
 *
 * Core algorithm: For each key, compute hash(key + nodeID) for all nodes,
 * select node with highest hash. Weighted variant multiplies hash by weight.
 */

interface Node {
  id: string;
  weight: number;  // Capacity multiplier: 1.0 = standard, 2.0 = double capacity
  endpoint: string;
}

/**
 * MurmurHash3 (32-bit) - Fast non-cryptographic hash
 *
 * Why MurmurHash3? We need O(N) hashing per lookup, so speed matters.
 * MurmurHash3 provides excellent distribution with 2-3x faster performance
 * than cryptographic hashes like SHA-256.
 */
function murmurHash3(key: string, seed: number = 0): number {
  let h = seed;
  const len = key.length;
  let i = 0;

  // Process 4-byte chunks
  while (i < len - 3) {
    let k = (key.charCodeAt(i) & 0xff) |
            ((key.charCodeAt(i + 1) & 0xff) << 8) |
            ((key.charCodeAt(i + 2) & 0xff) << 16) |
            ((key.charCodeAt(i + 3) & 0xff) << 24);

    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);

    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;

    i += 4;
  }

  // Handle remaining bytes
  let k = 0;
  switch (len & 3) {
    case 3:
      k ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      k ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      k ^= (key.charCodeAt(i) & 0xff);
      k = Math.imul(k, 0xcc9e2d51);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, 0x1b873593);
      h ^= k;
  }

  // Finalization
  h ^= len;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return h >>> 0; // Convert to unsigned 32-bit integer
}

class RendezvousHash {
  private nodes: Map<string, Node> = new Map();

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
  }

  /**
   * Select node using Highest Random Weight algorithm.
   *
   * Time complexity: O(N) where N = number of nodes
   * Space complexity: O(1) - no data structures needed
   *
   * Action: Compute weighted hash score for each node, return highest
   * Reason: Stateless algorithm enables any client to compute same result
   *         without coordination or shared state
   */
  selectNode(key: string): Node | null {
    if (this.nodes.size === 0) return null;

    let highestScore = -1;
    let selectedNode: Node | null = null;

    // O(N) iteration - must evaluate all nodes for fairness
    for (const node of this.nodes.values()) {
      // Combine key and nodeID for unique hash input
      // Action: Hash concatenation of key + nodeID
      // Reason: Different nodes must produce different scores for same key;
      //         concatenation ensures each node gets unique hash input
      const combinedKey = \`\${key}:\${node.id}\`;
      const hashValue = murmurHash3(combinedKey);

      // Apply weight to bias toward higher-capacity nodes
      // Action: Multiply hash by node weight
      // Reason: Weight=2.0 doubles selection probability, naturally handling
      //         heterogeneous clusters without virtual node complexity
      const weightedScore = hashValue * node.weight;

      if (weightedScore > highestScore) {
        highestScore = weightedScore;
        selectedNode = node;
      }
    }

    return selectedNode;
  }

  /**
   * Measure key distribution uniformity across nodes.
   *
   * Context: With N nodes and uniform hashing, each node should receive
   *          ~1/N of keys. Chi-squared test measures deviation from expected.
   */
  testDistribution(keyCount: number): Map<string, number> {
    const distribution = new Map<string, number>();

    // Initialize counters
    for (const nodeId of this.nodes.keys()) {
      distribution.set(nodeId, 0);
    }

    // Distribute test keys
    for (let i = 0; i < keyCount; i++) {
      const key = \`test-key-\${i}\`;
      const node = this.selectNode(key);
      if (node) {
        distribution.set(node.id, (distribution.get(node.id) || 0) + 1);
      }
    }

    return distribution;
  }

  /**
   * Measure rebalancing impact when node added/removed.
   *
   * Expected: ~1/N keys remap (same as consistent hashing)
   * Actual: Measured by comparing selections before/after node change
   */
  measureRebalancing(
    keys: string[],
    operation: () => void
  ): { moved: number; total: number; percentage: number } {
    // Capture initial mappings
    const before = new Map<string, string>();
    for (const key of keys) {
      const node = this.selectNode(key);
      if (node) before.set(key, node.id);
    }

    // Perform node change
    operation();

    // Measure remapping
    let moved = 0;
    for (const key of keys) {
      const node = this.selectNode(key);
      if (node && before.get(key) !== node.id) {
        moved++;
      }
    }

    return {
      moved,
      total: keys.length,
      percentage: (moved / keys.length) * 100,
    };
  }

  getNodeCount(): number {
    return this.nodes.size;
  }
}

// ============================================================================
// Example Usage & Testing
// ============================================================================

console.log("=== Rendezvous Hashing Demo ===\\n");

const hrw = new RendezvousHash();

// Add nodes with different capacities
hrw.addNode({ id: "node-a", weight: 1.0, endpoint: "10.0.1.1:8080" });
hrw.addNode({ id: "node-b", weight: 1.0, endpoint: "10.0.1.2:8080" });
hrw.addNode({ id: "node-c", weight: 2.0, endpoint: "10.0.1.3:8080" }); // Double capacity

console.log("Nodes:");
console.log("  node-a: weight=1.0");
console.log("  node-b: weight=1.0");
console.log("  node-c: weight=2.0 (double capacity)\\n");

// Test key selection
console.log("Key Selection:");
const testKeys = ["user:123", "user:456", "user:789"];
for (const key of testKeys) {
  const node = hrw.selectNode(key);
  console.log(\`  \${key} -> \${node?.id}\`);
}

// Test distribution uniformity
console.log("\\n=== Distribution Test (10,000 keys) ===");
const distribution = hrw.testDistribution(10000);
console.log("Expected: ~25% to node-a, ~25% to node-b, ~50% to node-c (weighted)\\n");

for (const [nodeId, count] of distribution.entries()) {
  const percentage = ((count / 10000) * 100).toFixed(2);
  console.log(\`  \${nodeId}: \${count} keys (\${percentage}%)\`);
}

// Test rebalancing on node addition
console.log("\\n=== Rebalancing Test: Add Node ===");
const keys = Array.from({ length: 10000 }, (_, i) => \`key-\${i}\`);

const addResult = hrw.measureRebalancing(keys, () => {
  hrw.addNode({ id: "node-d", weight: 1.0, endpoint: "10.0.1.4:8080" });
});

console.log(\`Keys remapped: \${addResult.moved} / \${addResult.total}\`);
console.log(\`Percentage: \${addResult.percentage.toFixed(2)}%\`);
console.log(\`Expected: ~\${(100 / 4).toFixed(2)}% (1/N for N=4 nodes)\`);

// Test rebalancing on node removal
console.log("\\n=== Rebalancing Test: Remove Node ===");

const removeResult = hrw.measureRebalancing(keys, () => {
  hrw.removeNode("node-a");
});

console.log(\`Keys remapped: \${removeResult.moved} / \${removeResult.total}\`);
console.log(\`Percentage: \${removeResult.percentage.toFixed(2)}%\`);
console.log(\`Expected: ~\${(100 / 4).toFixed(2)}% (1/N for N=4 nodes before removal)\`);

console.log("\\n=== Performance Comparison ===");
console.log("Rendezvous Hash:");
console.log("  - Lookup: O(N) - must hash against all nodes");
console.log("  - Code complexity: ~100 lines");
console.log("  - Memory: O(N) - just node list");
console.log("\\nConsistent Hash (with ring):");
console.log("  - Lookup: O(log N) - binary search on ring");
console.log("  - Code complexity: ~500 lines (ring maintenance, virtual nodes)");
console.log("  - Memory: O(N * V) - V virtual nodes per physical node");
console.log("\\nTrade-off: Simplicity vs Performance");
console.log("  - Rendezvous: Best for 10-100 nodes where code simplicity matters");
console.log("  - Consistent: Best for 100+ nodes where lookup speed critical");`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete rendezvous hashing implementation with distribution testing and rebalancing measurement",
        prerequisites: [
          "Hash functions",
          "Statistical distribution",
          "Algorithm complexity",
        ],
        systemPosition:
          "Core partitioning logic for distributed cache, load balancer, or database sharding layer",
      },
      annotations: [
        {
          id: "hrw-murmur-choice",
          lines: [9, 15],
          action: "Use MurmurHash3 instead of cryptographic hash like SHA-256",
          reason:
            "O(N) algorithm requires N hash computations per lookup; MurmurHash3 is 2-3x faster than crypto hashes while providing sufficient distribution quality for partitioning",
          contextLevel: "system",
          relatedConcepts: ["hash-functions", "performance-optimization"],
        },
        {
          id: "hrw-combine-key-node",
          lines: [99, 103],
          action: "Concatenate key and nodeID before hashing",
          reason:
            "Each node must produce different score for same key; concatenation ensures unique hash input per node, creating the 'random weight' effect",
          contextLevel: "local",
          relatedConcepts: ["hash-distribution"],
        },
        {
          id: "hrw-weight-multiplication",
          lines: [105, 109],
          action: "Multiply hash score by node weight",
          reason:
            "Weighted selection without virtual nodes: weight=2.0 doubles selection probability, naturally handling heterogeneous clusters",
          contextLevel: "module",
          relatedConcepts: ["weighted-distribution", "capacity-planning"],
        },
        {
          id: "hrw-all-nodes",
          lines: [94, 96],
          action: "Iterate through all nodes with no early termination",
          reason:
            "Must evaluate every node to guarantee finding highest score; this O(N) cost is inherent trade-off for stateless simplicity",
          contextLevel: "system",
          relatedConcepts: ["algorithm-complexity"],
        },
        {
          id: "hrw-distribution-test",
          lines: [122, 141],
          action: "Test distribution uniformity with 10,000 keys",
          reason:
            "Verify hash function provides uniform distribution; uneven distribution indicates poor hash quality or implementation bugs",
          contextLevel: "module",
          relatedConcepts: ["testing", "statistical-analysis"],
        },
        {
          id: "hrw-rebalancing",
          lines: [148, 173],
          action: "Measure key remapping percentage on node changes",
          reason:
            "Validate 1/N disruption property: adding/removing node should only remap ~1/N keys, matching consistent hashing with simpler code",
          contextLevel: "system",
          relatedConcepts: ["rebalancing", "minimal-disruption"],
        },
        {
          id: "hrw-stateless",
          lines: [87, 93],
          action: "No ring structure or virtual nodes—pure computation",
          reason:
            "Stateless algorithm enables any client to independently compute same result without coordination or shared state synchronization",
          contextLevel: "system",
          relatedConcepts: ["stateless-algorithms", "distributed-consensus"],
        },
        {
          id: "hrw-complexity-tradeoff",
          lines: [231, 240],
          action: "Document O(N) vs O(log N) trade-off with consistent hashing",
          reason:
            "Rendezvous hashing trades lookup speed for code simplicity: 100 LOC vs 500+ LOC for consistent hashing, ideal for moderate clusters (10-100 nodes)",
          contextLevel: "ecosystem",
          relatedConcepts: ["algorithm-trade-offs", "system-design"],
        },
      ],
      highlights: [
        {
          lines: [87, 119],
          label: "Core HRW selection algorithm with weighted scoring",
          sbvpDomain: "structure",
        },
        {
          lines: [99, 109],
          label: "Key+NodeID hashing and weight application",
          sbvpDomain: "behavior",
        },
        {
          lines: [148, 173],
          label: "Rebalancing measurement (1/N disruption validation)",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "rendezvous-py-cache",
      language: "python",
      title: "Python Cache Node Selection with CRC32",
      description:
        "Rendezvous hashing for distributed cache routing with CRC32 for performance and node addition/removal impact measurement",
      code: `"""
Rendezvous Hashing for Distributed Cache

Use case: Route cache keys to backend cache nodes (Redis, Memcached)
with minimal rebalancing on node changes.

CRC32 choice: Python's zlib.crc32 is 5-10x faster than hashlib hashes,
sufficient for non-cryptographic partitioning.
"""

import zlib
from typing import Dict, List, Optional, Set
from dataclasses import dataclass

@dataclass
class CacheNode:
    """Cache backend node with capacity weight."""
    id: str
    host: str
    port: int
    weight: float = 1.0  # Capacity multiplier

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        return isinstance(other, CacheNode) and self.id == other.id


class RendezvousCacheRouter:
    """
    Distributed cache router using Rendezvous Hashing.

    Why Rendezvous over Consistent Hashing?
    - No ring structure to maintain
    - Weight support without virtual node tuning
    - Simple code: 100 lines vs 400+ for ring implementation

    Trade-off: O(N) lookup vs O(log N) for ring
    Sweet spot: 10-50 cache nodes
    """

    def __init__(self):
        self.nodes: Dict[str, CacheNode] = {}

    def add_node(self, node: CacheNode) -> None:
        """Add cache node to pool."""
        self.nodes[node.id] = node

    def remove_node(self, node_id: str) -> None:
        """Remove cache node from pool."""
        self.nodes.pop(node_id, None)

    def _compute_score(self, key: str, node: CacheNode) -> int:
        """
        Compute weighted hash score for key-node pair.

        Action: Hash concatenation of key and node ID, multiply by weight
        Reason: Concatenation ensures different nodes produce different scores
                for same key; weight biases selection toward higher capacity
        """
        # Combine key and node ID for unique hash input
        combined = f"{key}:{node.id}".encode('utf-8')

        # CRC32 is fast (5-10x faster than SHA) and sufficient for partitioning
        # Action: Use CRC32 instead of cryptographic hash
        # Reason: O(N) algorithm needs speed; CRC32 provides good distribution
        #         without cryptographic overhead
        hash_value = zlib.crc32(combined) & 0xffffffff  # Unsigned 32-bit

        # Apply weight for capacity-aware routing
        weighted_score = hash_value * node.weight

        return int(weighted_score)

    def get_node(self, key: str) -> Optional[CacheNode]:
        """
        Select cache node using Highest Random Weight.

        Time: O(N) where N = number of cache nodes
        Space: O(1) - no data structures

        Action: Compute score for all nodes, return highest
        Reason: Stateless algorithm—any client computes same result
                without coordination
        """
        if not self.nodes:
            return None

        highest_score = -1
        selected_node = None

        # Must evaluate all nodes for fairness (no early termination)
        for node in self.nodes.values():
            score = self._compute_score(key, node)

            if score > highest_score:
                highest_score = score
                selected_node = node

        return selected_node

    def measure_rebalancing(
        self,
        keys: List[str],
        operation: callable
    ) -> Dict[str, any]:
        """
        Measure key remapping when node added/removed.

        Expected: ~1/N keys remap (same as consistent hashing)

        Context: Adding 11th node to 10-node cluster should remap ~9% of keys.
                 Removing 1 of 10 nodes should remap ~10% of keys.
        """
        # Capture initial mappings
        before = {}
        for key in keys:
            node = self.get_node(key)
            if node:
                before[key] = node.id

        # Perform node change
        operation()

        # Measure changes
        moved = 0
        after = {}
        for key in keys:
            node = self.get_node(key)
            if node:
                after[key] = node.id
                if before.get(key) != node.id:
                    moved += 1

        return {
            'moved': moved,
            'total': len(keys),
            'percentage': (moved / len(keys)) * 100,
            'expected': 100 / max(len(self.nodes), 1)
        }

    def analyze_distribution(self, key_count: int) -> Dict[str, Dict]:
        """
        Test distribution uniformity across nodes.

        Action: Generate test keys and measure node assignment distribution
        Reason: Verify hash function provides uniform distribution;
                skewed distribution indicates implementation bugs
        """
        distribution = {node_id: 0 for node_id in self.nodes.keys()}

        for i in range(key_count):
            key = f"test-key-{i}"
            node = self.get_node(key)
            if node:
                distribution[node.id] += 1

        # Calculate statistics
        results = {}
        for node_id, count in distribution.items():
            node = self.nodes[node_id]
            expected = (node.weight / sum(n.weight for n in self.nodes.values())) * key_count
            results[node_id] = {
                'count': count,
                'percentage': (count / key_count) * 100,
                'expected': expected,
                'deviation': abs(count - expected) / expected * 100
            }

        return results


# ============================================================================
# Example: Cache Cluster with Node Changes
# ============================================================================

if __name__ == "__main__":
    print("=== Rendezvous Cache Router Demo ===\\n")

    router = RendezvousCacheRouter()

    # Add cache nodes with different capacities
    router.add_node(CacheNode("cache-1", "10.0.1.1", 6379, weight=1.0))
    router.add_node(CacheNode("cache-2", "10.0.1.2", 6379, weight=1.0))
    router.add_node(CacheNode("cache-3", "10.0.1.3", 6379, weight=2.0))  # 2x capacity

    print("Cache Nodes:")
    for node in router.nodes.values():
        print(f"  {node.id}: {node.host}:{node.port} (weight={node.weight})")

    # Route some keys
    print("\\n=== Key Routing ===")
    test_keys = ["user:123:profile", "user:456:profile", "product:789"]
    for key in test_keys:
        node = router.get_node(key)
        print(f"  {key} -> {node.id}")

    # Test distribution
    print("\\n=== Distribution Test (10,000 keys) ===")
    results = router.analyze_distribution(10000)

    print("Expected: ~25% to cache-1, ~25% to cache-2, ~50% to cache-3 (weighted)\\n")
    for node_id, stats in results.items():
        print(f"  {node_id}:")
        print(f"    Count: {stats['count']}")
        print(f"    Percentage: {stats['percentage']:.2f}%")
        print(f"    Expected: {stats['expected']:.0f} keys")
        print(f"    Deviation: {stats['deviation']:.2f}%")

    # Test node addition
    print("\\n=== Rebalancing Test: Add Node ===")
    keys = [f"key-{i}" for i in range(10000)]

    add_result = router.measure_rebalancing(keys, lambda:
        router.add_node(CacheNode("cache-4", "10.0.1.4", 6379, weight=1.0))
    )

    print(f"Keys remapped: {add_result['moved']} / {add_result['total']}")
    print(f"Percentage: {add_result['percentage']:.2f}%")
    print(f"Expected: ~{add_result['expected']:.2f}% (1/N for N=4 nodes)")

    # Test node removal
    print("\\n=== Rebalancing Test: Remove Node ===")

    remove_result = router.measure_rebalancing(keys, lambda:
        router.remove_node("cache-1")
    )

    print(f"Keys remapped: {remove_result['moved']} / {remove_result['total']}")
    print(f"Percentage: {remove_result['percentage']:.2f}%")
    print(f"Expected: ~{remove_result['expected']:.2f}% (1/N for N=4 nodes before removal)")

    print("\\n=== Performance Characteristics ===")
    print(f"Lookup complexity: O({len(router.nodes)}) - must hash against all nodes")
    print("Memory overhead: 0 bytes (no ring or virtual nodes)")
    print("Code complexity: ~100 lines (vs ~400+ for consistent hashing)")
    print("\\nIdeal for: 10-50 cache nodes where simplicity > microsecond latency")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready cache routing with weighted nodes, distribution analysis, and rebalancing measurement",
        prerequisites: [
          "Distributed caching",
          "Hash functions",
          "Statistical analysis",
        ],
        systemPosition:
          "Cache routing layer between application and Redis/Memcached cluster",
      },
      annotations: [
        {
          id: "py-crc32-choice",
          lines: [63, 67],
          action: "Use CRC32 instead of SHA-256 or other cryptographic hash",
          reason:
            "O(N) algorithm requires N hash operations per lookup; CRC32 is 5-10x faster than crypto hashes while providing sufficient distribution for partitioning",
          contextLevel: "system",
          relatedConcepts: ["hash-performance", "cache-optimization"],
        },
        {
          id: "py-key-node-combine",
          lines: [58, 60],
          action: "Concatenate key and node.id to create unique hash input",
          reason:
            "Each node must produce different score for same key; concatenation ensures unique input, creating deterministic but varied scores",
          contextLevel: "local",
          relatedConcepts: ["hash-distribution"],
        },
        {
          id: "py-weight-scoring",
          lines: [69, 71],
          action:
            "Multiply CRC32 hash by node weight for capacity-aware routing",
          reason:
            "Weight=2.0 doubles selection probability, naturally balancing load across heterogeneous nodes without virtual node complexity",
          contextLevel: "module",
          relatedConcepts: ["weighted-load-balancing", "capacity-planning"],
        },
        {
          id: "py-rebalancing-measure",
          lines: [112, 138],
          action: "Measure key remapping percentage on node addition/removal",
          reason:
            "Validate 1/N disruption property: adding 11th node should remap ~9% keys, matching consistent hashing with simpler implementation",
          contextLevel: "system",
          relatedConcepts: ["cache-rebalancing", "minimal-disruption"],
        },
        {
          id: "py-distribution-stats",
          lines: [140, 166],
          action:
            "Calculate expected distribution based on weights and measure deviation",
          reason:
            "Weighted nodes should receive proportional load: weight=2.0 node should get ~2x keys; large deviation indicates hash quality issues",
          contextLevel: "module",
          relatedConcepts: ["statistical-testing", "distribution-analysis"],
        },
        {
          id: "py-stateless-routing",
          lines: [77, 103],
          action: "Compute node selection purely from key and current node set",
          reason:
            "Stateless algorithm enables any cache client to independently route keys without coordination, shared state, or configuration sync",
          contextLevel: "system",
          relatedConcepts: ["stateless-architecture", "distributed-systems"],
        },
        {
          id: "py-all-nodes-eval",
          lines: [95, 97],
          action: "Iterate through all nodes without early termination",
          reason:
            "Must evaluate every node to guarantee finding highest score; O(N) cost is unavoidable for HRW but acceptable for 10-50 nodes",
          contextLevel: "module",
          relatedConcepts: ["algorithm-complexity"],
        },
        {
          id: "py-cache-use-case",
          lines: [1, 9],
          action:
            "Document cache routing use case and CRC32 performance rationale",
          reason:
            "Cache systems need predictable routing with minimal rebalancing; rendezvous hashing provides this with simpler code than consistent hashing",
          contextLevel: "ecosystem",
          relatedConcepts: ["distributed-caching", "system-design"],
        },
      ],
      highlights: [
        {
          lines: [54, 73],
          label: "CRC32-based weighted scoring for cache routing",
          sbvpDomain: "structure",
        },
        {
          lines: [112, 138],
          label: "Rebalancing measurement (1/N disruption validation)",
          sbvpDomain: "behavior",
        },
        {
          lines: [140, 166],
          label: "Distribution analysis with weighted expectations",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "rendezvous-java-maglev",
      language: "java",
      title: "Java Maglev Backend Selector with Lookup Table",
      description:
        "Maglev variant (Google's load balancer) with O(1) lookup table after preprocessing and connection draining",
      code: `/**
 * Maglev Hashing - Google's Rendezvous Hash Variant
 *
 * Problem with standard HRW: O(N) lookup too slow for load balancers
 * handling millions of requests per second.
 *
 * Solution: Maglev preprocesses HRW scores into fixed-size lookup table,
 * trading O(N) preprocessing for O(1) lookups. Used in Google Cloud Load
 * Balancer to route 1M+ requests/sec.
 *
 * Key insight: Most keys don't need perfect HRW; approximate with table
 * lookup. Rebalancing still minimal (1/N keys move on node changes).
 */

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.nio.ByteBuffer;
import java.util.zip.CRC32;

class Backend {
    final String id;
    final String host;
    final int port;
    final double weight;
    final AtomicInteger activeConnections;

    Backend(String id, String host, int port, double weight) {
        this.id = id;
        this.host = host;
        this.port = port;
        this.weight = weight;
        this.activeConnections = new AtomicInteger(0);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof Backend && ((Backend) obj).id.equals(this.id);
    }
}

class MaglevLoadBalancer {
    private static final int LOOKUP_TABLE_SIZE = 65537; // Prime number for better distribution

    private final Map<String, Backend> backends = new ConcurrentHashMap<>();
    private volatile Backend[] lookupTable;
    private volatile boolean needsRebuild = true;

    /**
     * Add backend to pool and mark table for rebuild.
     *
     * Action: Add backend and set rebuild flag
     * Reason: Lookup table must be regenerated when backend set changes;
     *         lazy rebuild avoids blocking on write-heavy workloads
     */
    public void addBackend(Backend backend) {
        backends.put(backend.id, backend);
        needsRebuild = true;
    }

    /**
     * Remove backend with connection draining.
     *
     * Context: Can't immediately remove backend with active connections;
     *          must wait for connections to drain to avoid disrupting
     *          in-flight requests.
     */
    public void removeBackend(String backendId) {
        Backend backend = backends.get(backendId);
        if (backend != null) {
            // Mark for removal (could implement draining timeout here)
            backends.remove(backendId);
            needsRebuild = true;

            // In production: Wait for activeConnections to reach 0
            // or timeout, then remove
        }
    }

    /**
     * Fast hash function using CRC32.
     *
     * Action: Use CRC32 for speed
     * Reason: Maglev needs to hash millions of keys/sec; CRC32 is hardware-
     *         accelerated on modern CPUs (Intel SSE4.2) and 10x faster than SHA
     */
    private long hash(String input) {
        CRC32 crc = new CRC32();
        crc.update(input.getBytes());
        return crc.getValue();
    }

    /**
     * Generate Maglev permutation for a backend.
     *
     * Action: Create permutation array mapping table indices to backend preference
     * Reason: Each backend gets unique permutation of table indices; this creates
     *         the "rendezvous" effect where different backends prefer different
     *         table slots
     *
     * Context: Google's innovation over standard HRW—precompute all possible
     *          hash scores into permutation arrays, enabling O(1) lookup
     */
    private int[] generatePermutation(Backend backend) {
        int[] permutation = new int[LOOKUP_TABLE_SIZE];

        // Hash backend ID to get offset and skip values
        long offset = hash(backend.id + ":offset") % LOOKUP_TABLE_SIZE;
        long skip = (hash(backend.id + ":skip") % (LOOKUP_TABLE_SIZE - 1)) + 1;

        // Generate permutation using offset and skip
        // Action: Create deterministic permutation unique to each backend
        // Reason: Different offset/skip pairs ensure each backend has different
        //         preference order for table slots, mimicking HRW scoring
        for (int i = 0; i < LOOKUP_TABLE_SIZE; i++) {
            permutation[i] = (int) ((offset + i * skip) % LOOKUP_TABLE_SIZE);
        }

        return permutation;
    }

    /**
     * Build Maglev lookup table.
     *
     * Algorithm:
     * 1. Generate permutation for each backend (preference order for table slots)
     * 2. Round-robin through backends, each claiming next unclaimed slot from
     *    its permutation
     * 3. Weight support: backends with weight=2.0 get 2x iterations
     *
     * Result: Fixed-size table where table[hash(key) % size] = selected backend
     *
     * Time: O(M * N) where M=table size, N=backends
     * Space: O(M) for table
     *
     * Trade-off: Slower preprocessing for O(1) lookup
     */
    private void buildLookupTable() {
        if (!needsRebuild) return;

        Backend[] newTable = new Backend[LOOKUP_TABLE_SIZE];
        Map<Backend, int[]> permutations = new HashMap<>();
        Map<Backend, Integer> nextIndices = new HashMap<>();

        // Generate permutations for all backends
        for (Backend backend : backends.values()) {
            permutations.put(backend, generatePermutation(backend));
            nextIndices.put(backend, 0);
        }

        // Build weighted backend list (weight=2.0 appears twice)
        // Action: Replicate backends proportional to weight
        // Reason: Backend with weight=2.0 gets 2x chances to claim table slots,
        //         resulting in 2x selection probability
        List<Backend> weightedBackends = new ArrayList<>();
        for (Backend backend : backends.values()) {
            int count = (int) Math.ceil(backend.weight);
            for (int i = 0; i < count; i++) {
                weightedBackends.add(backend);
            }
        }

        // Fill table using round-robin with permutations
        int filled = 0;
        while (filled < LOOKUP_TABLE_SIZE) {
            for (Backend backend : weightedBackends) {
                int[] permutation = permutations.get(backend);
                int next = nextIndices.get(backend);

                // Find next unclaimed slot in this backend's permutation
                // Action: Iterate through permutation until finding empty slot
                // Reason: Multiple backends may want same slot; first to claim wins,
                //         others move to next preference
                while (next < LOOKUP_TABLE_SIZE) {
                    int candidate = permutation[next];
                    nextIndices.put(backend, next + 1);

                    if (newTable[candidate] == null) {
                        newTable[candidate] = backend;
                        filled++;
                        break;
                    }
                    next++;
                }

                if (filled >= LOOKUP_TABLE_SIZE) break;
            }
        }

        lookupTable = newTable;
        needsRebuild = false;
    }

    /**
     * Select backend using Maglev lookup table.
     *
     * Time: O(1) after preprocessing
     *
     * Action: Hash key, index into table, return backend
     * Reason: Table preprocessing converts O(N) HRW into O(1) lookup,
     *         enabling million+ QPS load balancing
     *
     * Context: Google Cloud Load Balancer uses this for 1M+ RPS
     */
    public Backend selectBackend(String key) {
        if (needsRebuild) {
            synchronized (this) {
                buildLookupTable();
            }
        }

        long hashValue = hash(key);
        int index = (int) (hashValue % LOOKUP_TABLE_SIZE);
        Backend backend = lookupTable[index];

        if (backend != null) {
            backend.activeConnections.incrementAndGet();
        }

        return backend;
    }

    /**
     * Release connection (for connection draining).
     */
    public void releaseConnection(Backend backend) {
        backend.activeConnections.decrementAndGet();
    }

    /**
     * Measure rebalancing impact.
     */
    public Map<String, Object> measureRebalancing(
        List<String> keys,
        Runnable operation
    ) {
        // Capture before
        Map<String, String> before = new HashMap<>();
        for (String key : keys) {
            Backend backend = selectBackend(key);
            if (backend != null) {
                before.put(key, backend.id);
                releaseConnection(backend);
            }
        }

        // Execute change
        operation.run();

        // Measure after
        int moved = 0;
        for (String key : keys) {
            Backend backend = selectBackend(key);
            if (backend != null) {
                if (!backend.id.equals(before.get(key))) {
                    moved++;
                }
                releaseConnection(backend);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("moved", moved);
        result.put("total", keys.size());
        result.put("percentage", (moved * 100.0) / keys.size());

        return result;
    }

    public int getBackendCount() {
        return backends.size();
    }
}

// ============================================================================
// Example Usage
// ============================================================================

public class MaglevDemo {
    public static void main(String[] args) {
        System.out.println("=== Maglev Load Balancer Demo ===\\n");

        MaglevLoadBalancer lb = new MaglevLoadBalancer();

        // Add backends
        lb.addBackend(new Backend("backend-1", "10.0.1.1", 8080, 1.0));
        lb.addBackend(new Backend("backend-2", "10.0.1.2", 8080, 1.0));
        lb.addBackend(new Backend("backend-3", "10.0.1.3", 8080, 2.0)); // 2x capacity

        System.out.println("Backends:");
        System.out.println("  backend-1: weight=1.0");
        System.out.println("  backend-2: weight=1.0");
        System.out.println("  backend-3: weight=2.0 (double capacity)\\n");

        // Test routing
        System.out.println("Request Routing:");
        String[] requests = {"GET /api/users/123", "GET /api/users/456", "POST /api/orders"};
        for (String request : requests) {
            Backend backend = lb.selectBackend(request);
            System.out.printf("  %s -> %s%n", request, backend.id);
            lb.releaseConnection(backend);
        }

        // Test rebalancing
        System.out.println("\\n=== Rebalancing Test: Add Backend ===");
        List<String> keys = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            keys.add("request-" + i);
        }

        Map<String, Object> addResult = lb.measureRebalancing(keys, () -> {
            lb.addBackend(new Backend("backend-4", "10.0.1.4", 8080, 1.0));
        });

        System.out.printf("Keys remapped: %d / %d%n", addResult.get("moved"), addResult.get("total"));
        System.out.printf("Percentage: %.2f%%%n", addResult.get("percentage"));
        System.out.printf("Expected: ~%.2f%% (1/N for N=4 backends)%n", 100.0 / 4);

        System.out.println("\\n=== Maglev vs Standard HRW ===");
        System.out.println("Standard HRW:");
        System.out.println("  - Lookup: O(N) - hash against all backends");
        System.out.println("  - Preprocessing: None");
        System.out.println("  - Memory: O(N) - just backend list");
        System.out.println("\\nMaglev:");
        System.out.println("  - Lookup: O(1) - table lookup");
        System.out.println("  - Preprocessing: O(M*N) - build lookup table");
        System.out.println("  - Memory: O(M) - M=65537 table size");
        System.out.println("\\nProduction Use:");
        System.out.println("  - Google Cloud Load Balancer: 1M+ RPS");
        System.out.println("  - Facebook Katran: BGP load balancing");
        System.out.println("  - CloudFlare: Edge routing at 46M+ RPS");
    }
}`,
      runnable: false,
      contextDilation: {
        level: "ecosystem",
        scope:
          "Production load balancer implementation using Google's Maglev algorithm with O(1) lookup table and connection draining",
        prerequisites: [
          "Load balancing",
          "Hash tables",
          "Connection management",
          "Production systems",
        ],
        systemPosition:
          "L4/L7 load balancer routing layer used by Google Cloud Load Balancer for 1M+ RPS",
      },
      annotations: [
        {
          id: "java-maglev-table-size",
          lines: [52, 52],
          action: "Use prime number (65537) for lookup table size",
          reason:
            "Prime table size reduces hash collisions and improves distribution uniformity; Google chose 65537 as sweet spot for memory vs accuracy",
          contextLevel: "system",
          relatedConcepts: ["hash-tables", "prime-numbers"],
        },
        {
          id: "java-lazy-rebuild",
          lines: [62, 67],
          action:
            "Mark table for rebuild rather than immediately rebuilding on backend change",
          reason:
            "Lazy rebuild avoids blocking write-heavy workloads; table rebuilds on next read, amortizing O(M*N) cost across requests",
          contextLevel: "system",
          relatedConcepts: ["lazy-evaluation", "amortized-complexity"],
        },
        {
          id: "java-connection-draining",
          lines: [72, 86],
          action: "Track active connections per backend for graceful removal",
          reason:
            "Can't immediately remove backend with in-flight requests; connection draining prevents disrupting active transactions",
          contextLevel: "system",
          relatedConcepts: ["graceful-degradation", "connection-pooling"],
        },
        {
          id: "java-crc32-hardware",
          lines: [89, 97],
          action: "Use CRC32 for hashing instead of cryptographic hash",
          reason:
            "CRC32 has hardware acceleration (Intel SSE4.2) and is 10x faster than SHA for millions of requests/sec load balancing",
          contextLevel: "ecosystem",
          relatedConcepts: [
            "hardware-acceleration",
            "performance-optimization",
          ],
        },
        {
          id: "java-permutation-generation",
          lines: [100, 123],
          action:
            "Generate deterministic permutation array for each backend using offset and skip",
          reason:
            "Each backend gets unique preference order for table slots; this creates rendezvous effect where different backends prefer different slots",
          contextLevel: "module",
          relatedConcepts: ["permutations", "deterministic-algorithms"],
        },
        {
          id: "java-weighted-replication",
          lines: [156, 163],
          action:
            "Replicate backends in weighted list proportional to their weight",
          reason:
            "Backend with weight=2.0 appears twice in list, getting 2x chances to claim table slots, resulting in 2x selection probability",
          contextLevel: "module",
          relatedConcepts: ["weighted-distribution", "capacity-planning"],
        },
        {
          id: "java-table-filling",
          lines: [166, 188],
          action:
            "Round-robin through backends, each claiming next unclaimed slot from permutation",
          reason:
            "Multiple backends may want same slot; first to claim wins, others move to next preference; ensures all slots filled while respecting preferences",
          contextLevel: "module",
          relatedConcepts: ["greedy-algorithms", "slot-allocation"],
        },
        {
          id: "java-o1-lookup",
          lines: [197, 215],
          action:
            "Hash key and index into precomputed lookup table for O(1) selection",
          reason:
            "Table preprocessing converts O(N) HRW into O(1) lookup, enabling Google Cloud Load Balancer to handle 1M+ requests/sec",
          contextLevel: "ecosystem",
          relatedConcepts: ["time-space-tradeoff", "production-systems"],
        },
      ],
      highlights: [
        {
          lines: [100, 123],
          label: "Maglev permutation generation (Google's innovation)",
          sbvpDomain: "structure",
        },
        {
          lines: [166, 188],
          label: "Lookup table construction with weighted backends",
          sbvpDomain: "behavior",
        },
        {
          lines: [197, 215],
          label: "O(1) backend selection via table lookup",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Load Balancer Backend Selection",
      "Distributed Cache Routing Layer",
      "CDN Node Selection",
      "Database Shard Assignment",
      "Message Queue Partition",
      "Service Mesh Routing",
    ],
    interactsWith: [
      "consistent-hashing",
      "cache-aside",
      "load-balancing",
      "health-checks",
      "connection-pooling",
      "service-discovery",
    ],
    architecturalBoundaries: [
      "Client routing layer—decides which backend handles request",
      "Backend pool management—tracks available nodes and weights",
      "Hash computation—stateless scoring for key-node pairs",
      "Weight management—capacity-aware node selection",
    ],
  },

  implementations: [
    {
      id: "google-maglev",
      name: "Google Maglev",
      type: "platform",
      languages: ["c++"],
      description:
        "Google's production load balancer using Maglev hashing (rendezvous hash variant with O(1) lookup table). Handles 1M+ requests/sec in Google Cloud Load Balancer. Preprocesses HRW scores into 65537-slot lookup table for constant-time backend selection.",
      links: {
        docs: "https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf",
      },
      codeSnippet: `// Maglev algorithm (simplified)
// 1. Generate permutation for each backend
permutation[backend] = generate_permutation(backend.id, TABLE_SIZE);

// 2. Fill lookup table round-robin
while (filled < TABLE_SIZE) {
  for backend in backends:
    slot = permutation[backend][next[backend]++];
    if table[slot] == null:
      table[slot] = backend;
      filled++;
}

// 3. O(1) lookup
backend = table[hash(key) % TABLE_SIZE];`,
    },
    {
      id: "nginx-upstream",
      name: "nginx Upstream Hash",
      type: "platform",
      languages: ["c"],
      description:
        "nginx load balancer supports both consistent hashing (with ketama) and weighted rendezvous hashing for upstream backend selection. Used in production by CloudFlare and others for edge routing.",
      links: {
        docs: "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#hash",
      },
      codeSnippet: `# nginx.conf with upstream hash
upstream backend {
    hash $request_uri consistent;  # Consistent hashing
    server backend1.example.com weight=1;
    server backend2.example.com weight=2;
    server backend3.example.com weight=1;
}

server {
    location / {
        proxy_pass http://backend;
    }
}`,
    },
    {
      id: "haproxy-balance",
      name: "HAProxy Balance URI",
      type: "platform",
      languages: ["c"],
      description:
        "HAProxy supports URI-based hashing with consistent or rendezvous algorithms for backend selection. Widely used in production load balancing with excellent performance (100k+ RPS per instance).",
      links: {
        docs: "https://www.haproxy.org/download/2.8/doc/configuration.txt",
      },
      codeSnippet: `# haproxy.cfg with URI hashing
backend web_servers
    balance uri
    hash-type consistent
    server web1 10.0.1.1:80 check weight 1
    server web2 10.0.1.2:80 check weight 2
    server web3 10.0.1.3:80 check weight 1`,
    },
    {
      id: "varnish-director",
      name: "Varnish Director Hash",
      type: "platform",
      languages: ["c"],
      description:
        "Varnish HTTP cache uses rendezvous hashing in director module for CDN backend selection. Ensures cache hits remain consistent when backends change, minimizing cache churn.",
      links: {
        docs: "https://varnish-cache.org/docs/7.3/reference/vmod_directors.generated.html#hash-director",
      },
      codeSnippet: `# Varnish VCL with hash director
import directors;

sub vcl_init {
    new vdir = directors.hash();
    vdir.add_backend(backend1, 1.0);
    vdir.add_backend(backend2, 2.0);  // Double weight
}

sub vcl_recv {
    set req.backend_hint = vdir.backend(req.url);
}`,
    },
    {
      id: "envoy-ring-hash",
      name: "Envoy Ring Hash",
      type: "platform",
      languages: ["c++"],
      description:
        "Envoy proxy supports both ring hash (consistent hashing) and Maglev for load balancing. Used as foundation for Istio service mesh. Maglev provides better distribution than ring hash with similar minimal disruption.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers#maglev",
        github: "https://github.com/envoyproxy/envoy",
      },
      codeSnippet: `# Envoy config with Maglev
clusters:
  - name: service_backend
    load_assignment:
      cluster_name: service_backend
      endpoints:
        - lb_endpoints:
          - endpoint:
              address: {socket_address: {address: 10.0.1.1, port_value: 8080}}
            load_balancing_weight: 1
          - endpoint:
              address: {socket_address: {address: 10.0.1.2, port_value: 8080}}
            load_balancing_weight: 2
    lb_policy: MAGLEV
    maglev_lb_config:
      table_size: 65537`,
    },
    {
      id: "katran-facebook",
      name: "Katran",
      type: "platform",
      languages: ["c++", "bpf"],
      description:
        "Facebook's L4 load balancer using Maglev hashing in eBPF for kernel-level routing. Handles BGP-based load balancing at massive scale with minimal CPU overhead.",
      links: {
        docs: "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
        github: "https://github.com/facebookincubator/katran",
      },
    },
    {
      id: "ipvs-kernel",
      name: "Linux IPVS",
      type: "platform",
      languages: ["c"],
      description:
        "Linux kernel IP Virtual Server supports consistent hashing and rendezvous hashing for connection scheduling. Used in production Kubernetes clusters for kube-proxy load balancing.",
      links: {
        docs: "https://www.kernel.org/doc/Documentation/networking/ipvs-sysctl.txt",
      },
    },
    {
      id: "cloudflare-lb",
      name: "CloudFlare Load Balancing",
      type: "service",
      languages: ["any"],
      description:
        "CloudFlare's global load balancer uses rendezvous hashing for edge routing across 300+ data centers. Handles 46M+ requests/sec with sub-millisecond backend selection.",
      links: {
        docs: "https://developers.cloudflare.com/load-balancing/",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "google-cloud-lb",
      systemName: "Google Cloud Load Balancer",
      howUsed:
        "Google Cloud Load Balancer uses Maglev hashing (rendezvous hash variant) to distribute traffic across backend instances at 1M+ requests per second. The Maglev algorithm preprocesses HRW scores into a 65537-slot lookup table, enabling O(1) backend selection versus O(N) for standard rendezvous hashing. When backend instances are added or removed (autoscaling, deployments, failures), only ~1/N connections remap—the same minimal disruption as consistent hashing but with simpler implementation. Weighted backend support is native: instances with weight=2.0 claim twice as many table slots, receiving proportionally more traffic. The system operates at Layer 4 (TCP/UDP) and Layer 7 (HTTP/HTTPS), using connection tracking to maintain session affinity for existing connections. Pattern composition: Maglev (HRW variant) + Health Checks (remove unhealthy backends) + Connection Tracking (session affinity) + Autoscaling (dynamic backend pool). Rationale: Google needed load balancing at massive scale (millions of QPS) with minimal disruption during backend changes; Maglev's O(1) lookup with 1/N disruption property perfectly balanced performance and stability. Impact: Powers Google Cloud's global load balancing infrastructure; handles 1M+ RPS per instance with <1ms backend selection latency; minimal traffic disruption during rolling deployments and autoscaling events.",
      source:
        "https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf",
    },
    {
      systemId: "facebook-katran",
      systemName: "Facebook Katran",
      howUsed:
        "Facebook's Katran L4 load balancer implements Maglev hashing in eBPF (extended Berkeley Packet Filter) for kernel-level packet routing. Operating at the network edge, Katran uses rendezvous hashing to distribute incoming connections across backend servers without maintaining connection state tables. The eBPF implementation achieves line-rate performance (100Gbps+) with minimal CPU overhead by computing Maglev table lookups entirely in kernel space. When backend servers are added or removed (deployments, failures, capacity changes), only 1/N of connections remap to new servers—critical for minimizing disruption to Facebook's billions of active users. The system integrates with BGP routing to announce service IPs and automatically drain connections from failing backends. Pattern composition: Maglev (eBPF implementation) + BGP Routing (service discovery) + Connection Draining (graceful backend removal) + Health Checks (automatic failover). Rationale: Traditional stateful load balancers like LVS couldn't scale to Facebook's traffic volume (billions of connections); stateless Maglev hashing eliminates per-connection memory overhead while maintaining connection affinity. Impact: Reduced load balancer infrastructure costs by 90%; handles 100Gbps+ traffic with commodity hardware; enables instant failover during backend failures with minimal connection disruption.",
      source:
        "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
    },
    {
      systemId: "cloudflare-edge",
      systemName: "CloudFlare Edge Routing",
      howUsed:
        "CloudFlare uses rendezvous hashing for routing requests across its 300+ edge data centers and within each data center across backend origin servers. With 46M+ requests per second globally, CloudFlare needs deterministic routing that minimizes disruption when data centers go offline or new capacity comes online. Rendezvous hashing enables each edge PoP to independently compute the correct origin server for cached content without centralized coordination. When an origin server fails health checks, only the requests mapped to that server (1/N) need rerouting—the remaining 99%+ of traffic continues hitting their cached data without disruption. The system uses geographic weighting to prefer nearby origins, reducing latency while maintaining cache hit rates. Pattern composition: Rendezvous Hashing (edge routing) + Health Checks (origin monitoring) + Geographic Weighting (latency optimization) + Cache-Aside (origin failover). Rationale: With hundreds of data centers and thousands of origin servers, CloudFlare needed routing that scaled horizontally without centralized state; rendezvous hashing's stateless computation perfectly fit their distributed architecture. Impact: Maintains 95%+ cache hit rates during origin failures; handles 46M+ RPS with sub-10ms P95 latency; enables rapid capacity expansion (adding data centers) without cache churn or traffic disruption.",
    },
    {
      systemId: "linux-ipvs",
      systemName: "Linux IPVS (Kubernetes kube-proxy)",
      howUsed:
        "Linux IPVS (IP Virtual Server) provides kernel-level load balancing for Kubernetes clusters using rendezvous hashing for connection scheduling. When kube-proxy runs in IPVS mode, it programs kernel routing rules using consistent hashing or rendezvous hashing to distribute incoming connections across pod endpoints. The rendezvous hash scheduler ensures that connections from the same client IP consistently route to the same backend pod (session affinity) without maintaining connection state tables. When pods are added or removed (scaling events, rolling updates, failures), only 1/N of connections remap to different pods—critical for minimizing disruption to long-lived gRPC streams and WebSocket connections. IPVS operates at Layer 4 in the kernel, achieving 10x better performance than iptables-based kube-proxy with O(1) lookup versus O(N) rule traversal. Pattern composition: Rendezvous Hashing (connection scheduling) + Health Checks (pod liveness) + Service Discovery (endpoint updates) + Session Affinity (client IP persistence). Rationale: Kubernetes clusters with thousands of services and pods need efficient load balancing; IPVS with rendezvous hashing provides kernel-level performance with minimal disruption during pod lifecycle events. Impact: Reduces kube-proxy CPU usage by 90% vs iptables mode; handles 100k+ connections per node; enables smooth rolling updates with <1% connection disruption.",
      source:
        "https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/",
    },
    {
      systemId: "varnish-cdn",
      systemName: "Varnish CDN Backend Selection",
      howUsed:
        "Varnish HTTP cache uses rendezvous hashing in its director module to select backend origin servers for cache misses. When a requested URL isn't in Varnish's cache, the director hashes the URL using rendezvous hashing to deterministically select an origin server. This ensures that the same URL always routes to the same backend, maximizing cache hit rates when multiple Varnish instances sit in front of the same origin pool. When origin servers are added or removed (deployments, scaling, failures), only 1/N of URLs remap to different backends—critical for minimizing cache churn. A cache miss that would have hit on the previous backend must now fetch from a new backend (cold cache), but 99%+ of URLs continue hitting the same backend they always have. The system supports weighted backends to handle heterogeneous origin capacity (legacy servers vs new high-capacity instances). Pattern composition: Rendezvous Hashing (backend selection) + Cache-Aside (origin fallback) + Health Checks (backend monitoring) + Weighted Distribution (capacity awareness). Rationale: CDN architectures with multiple cache tiers need consistent URL-to-backend mapping to maximize cache efficiency; rendezvous hashing provides this with minimal complexity and disruption during backend changes. Impact: Maintains 95%+ cache hit rates during origin deployments; handles 100k+ requests/sec per Varnish instance; reduces origin load by 20x through consistent backend routing.",
    },
  ],

  philosophy: {
    coreProblem:
      "Traditional hash partitioning (key % N) causes catastrophic rebalancing when nodes change, while consistent hashing solves this but introduces ring maintenance complexity and virtual node overhead",
    designPrinciple:
      "Trade O(N) computation for algorithmic simplicity—eliminate data structures entirely by computing highest weighted hash across all nodes",
    historicalContext:
      "Introduced in 1996 by Thaler and Ravishankar as 'Highest Random Weight' hashing; later refined by Google as 'Maglev' for Cloud Load Balancer (2016)",
    alternativesRejected: [
      "Consistent hashing with ring—too complex (500+ LOC) for moderate clusters",
      "Jump hash—doesn't support weighted nodes or node removal",
      "Modulo hashing—remaps all keys on node changes",
      "Random selection—no determinism or session affinity",
    ],
    mentalModel:
      "Imagine a contest where every key votes for every node, with each node getting a unique random ballot score. The node with the highest score wins. Weighted nodes get their score multiplied by their weight. No coordination needed—everyone computes the same winner independently.",
  },

  visualization: {
    staticDiagram: `graph TB
    Key["Key: 'user:123'"] --> Hash1["hash(user:123 + node-a) = 0x4A3F"]
    Key --> Hash2["hash(user:123 + node-b) = 0x7B2E"]
    Key --> Hash3["hash(user:123 + node-c) = 0x9F1D"]

    Hash1 --> Weight1["0x4A3F * 1.0 = 19007"]
    Hash2 --> Weight2["0x7B2E * 1.0 = 31534"]
    Hash3 --> Weight3["0x9F1D * 2.0 = 81826"]

    Weight1 --> Max["Select Maximum"]
    Weight2 --> Max
    Weight3 --> Max

    Max --> Result["node-c wins (highest score)"]

    style Key fill:#e1f5e1
    style Result fill:#ffe1e1`,
    realWorldAnalogy:
      "Rendezvous hashing is like a beauty contest where each contestant (node) gets scored by every judge (key), but different judges have different (deterministic) preferences. Each contestant-judge pair produces a unique score based on hashing both together. The contestant with the highest score wins. Weighted contestants (bigger capacity) get their score multiplied by their weight. No coordination needed—every observer can independently compute the same winner.",
    useCases: [
      {
        domain: "Load Balancing",
        scenario:
          "Google Cloud Load Balancer routes 1M+ requests/sec across backend instances using Maglev (rendezvous hash variant). When autoscaling adds instances, only 1/N traffic remaps, maintaining session affinity for existing users.",
        patternRole:
          "O(1) backend selection with minimal disruption on scaling events",
        companies: ["Google", "Facebook", "CloudFlare"],
      },
      {
        domain: "Distributed Caching",
        scenario:
          "Varnish CDN uses rendezvous hashing to route cache misses to origin servers. Same URL always maps to same backend, maximizing cache hit rates. When origins fail, only 1/N URLs remap to different backends.",
        patternRole:
          "Consistent URL-to-backend mapping with minimal cache churn",
        companies: ["Varnish", "CloudFlare"],
      },
      {
        domain: "Database Sharding",
        scenario:
          "Distributed database routes queries to shards using rendezvous hashing. Weighted shards handle more data. Adding new shard only redistributes 1/N of data, avoiding full rebalancing.",
        patternRole:
          "Deterministic shard selection with incremental rebalancing",
        companies: ["Cassandra", "ScyllaDB"],
      },
    ],
  },

  tags: [
    "scalability",
    "partitioning",
    "hashing",
    "load-balancing",
    "distributed-systems",
    "stateless",
  ],
  difficulty: "intermediate",
};
