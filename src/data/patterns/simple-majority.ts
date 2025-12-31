import type { Pattern } from "../schema";

export const simpleMajority: Pattern = {
  id: "simple-majority",
  slug: "simple-majority",
  corpusPath: "🛡️ RELIABILITY → 📋 Redundancy → 🗳️ Quorum → 📊 Simple Majority",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Quorum",
    level: 4,
  },

  concept: {
    name: "Simple Majority",
    emoji: "📊",
    tagline: "(N/2)+1 agreement",
    definition:
      "Simple Majority quorum requires more than half of the nodes in a distributed system ((N/2)+1 where N is total nodes) to agree on an operation before considering it successful, providing a mathematically provable way to prevent split-brain scenarios and ensure consistency. Like democratic voting where a bill passes only with majority support, simple majority ensures that any two majorities must overlap by at least one node, preventing conflicting decisions. In a 5-node cluster, 3 nodes must agree (3 > 5/2). In a 7-node cluster, 4 must agree (4 > 7/2). This overlap property guarantees that if a majority agrees on value X, no other majority can simultaneously agree on conflicting value Y because they must share at least one common node. The pattern is fundamental to consensus protocols (Raft, Paxos, ZooKeeper), leader election algorithms, and quorum-based distributed databases. It tolerates ⌊N/2⌋ failures—a 5-node cluster survives 2 failures, a 7-node cluster survives 3 failures. The threshold of 'more than half' rather than 'at least half' prevents ties in even-sized clusters: with 4 nodes, requiring 3 ensures a unique decision rather than allowing two conflicting 2-node minorities. Simple majority provides the minimum quorum size that guarantees safety properties while maximizing availability—smaller quorums (like 2-of-5) risk split-brain, while larger quorums (like 4-of-5) reduce failure tolerance.",
    problemSolved:
      "Distributed systems face the split-brain problem where network partitions divide nodes into isolated groups that each believe they're the only functioning partition, leading to conflicting decisions and data corruption. Without majority quorums, a 5-node cluster partitioned into 3+2 groups could have both sides elect leaders, accept writes, and diverge permanently. Traditional approaches like requiring all nodes to agree (unanimity) are impractical—a single node failure blocks all operations. Simple majority solves this by mathematically ensuring that at most one partition can achieve quorum: in a 3+2 partition, only the 3-node side reaches majority (3 > 5/2), while the 2-node side cannot (2 ≯ 5/2). This asymmetry prevents both sides from making progress, guaranteeing safety even during network splits. The pattern also solves leader election races: when multiple nodes simultaneously try to become leader, at most one can win because acquiring majority votes is mutually exclusive—if candidate A gets votes from nodes 1,2,3 (majority of 5), candidate B cannot get majority votes from the remaining nodes 4,5. This makes simple majority fundamental for consistency: it provides the sweet spot between availability (survives ⌊N/2⌋ failures) and safety (prevents split-brain), which is provably optimal—you cannot do better without sacrificing one property.",
    tradeoffs: {
      pros: [
        "Mathematically prevents split-brain by ensuring quorum overlap",
        "Maximizes fault tolerance for given safety guarantees—survives ⌊N/2⌋ failures",
        "Provides minimum quorum size that guarantees consistency",
        "Well-understood semantics with decades of proven consensus protocols",
        "Enables leader election with guaranteed single winner",
        "Balances availability and consistency better than alternatives",
      ],
      cons: [
        "Requires majority of nodes operational—single node down in 3-node cluster leaves only 1-node tolerance",
        "Reduced availability during network partitions—minority partitions become read-only or unavailable",
        "Odd node count required for efficiency (even counts waste tolerance)",
        "Higher latency than minority quorums—must wait for majority responses",
        "Cannot survive majority failures—5-node cluster fails if 3 nodes crash",
        "Increased network traffic from consulting majority of nodes",
      ],
    },
    relatedPatterns: [
      "read-quorum",
      "write-quorum",
      "r-w-n",
      "raft-consensus",
      "paxos",
      "leader-election",
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
      id: "simple-majority-ts-basic",
      language: "typescript",
      title: "Simple Majority Quorum System",
      description:
        "TypeScript implementation of simple majority quorum for leader election and distributed consensus with split-brain prevention",
      code: `// ============================================================
// Simple Majority Quorum System
// ============================================================
// Demonstrates (N/2)+1 quorum for leader election and consensus
// with mathematical guarantees against split-brain scenarios
// ============================================================

type NodeStatus = 'follower' | 'candidate' | 'leader' | 'offline';
type VoteDecision = 'granted' | 'denied';

interface Vote {
  from: string;
  to: string;
  term: number;
  decision: VoteDecision;
}

interface ProposeResult {
  success: boolean;
  votesReceived: number;
  votesNeeded: number;
  votes: Vote[];
}

// ============================================================
// Cluster Node
// ============================================================
class Node {
  private status: NodeStatus = 'follower';
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private isOnline: boolean = true;
  private currentLeader: string | null = null;

  constructor(private id: string) {}

  getId(): string {
    return this.id;
  }

  getStatus(): NodeStatus {
    return this.status;
  }

  setStatus(status: NodeStatus): void {
    console.log(\`[\${this.id}] Status change: \${this.status} → \${status}\`);
    this.status = status;
  }

  getTerm(): number {
    return this.currentTerm;
  }

  // Request vote from this node
  requestVote(candidateId: string, term: number): Vote {
    if (!this.isOnline) {
      return {
        from: this.id,
        to: candidateId,
        term: this.currentTerm,
        decision: 'denied',
      };
    }

    // If candidate's term is older, deny
    if (term < this.currentTerm) {
      console.log(\`[\${this.id}] Denied vote to \${candidateId} - stale term (\${term} < \${this.currentTerm})\`);
      return {
        from: this.id,
        to: candidateId,
        term: this.currentTerm,
        decision: 'denied',
      };
    }

    // Update term if candidate has newer term
    if (term > this.currentTerm) {
      this.currentTerm = term;
      this.votedFor = null;
      this.setStatus('follower');
    }

    // Grant vote if haven't voted in this term
    if (this.votedFor === null || this.votedFor === candidateId) {
      this.votedFor = candidateId;
      console.log(\`[\${this.id}] Granted vote to \${candidateId} for term \${term}\`);
      return {
        from: this.id,
        to: candidateId,
        term: this.currentTerm,
        decision: 'granted',
      };
    }

    // Already voted for someone else in this term
    console.log(\`[\${this.id}] Denied vote to \${candidateId} - already voted for \${this.votedFor}\`);
    return {
      from: this.id,
      to: candidateId,
      term: this.currentTerm,
      decision: 'denied',
    };
  }

  // Become candidate and start election
  becomeCandidate(): void {
    this.currentTerm++;
    this.votedFor = this.id; // Vote for self
    this.setStatus('candidate');
    console.log(\`[\${this.id}] Starting election for term \${this.currentTerm}\`);
  }

  // Become leader after winning election
  becomeLeader(): void {
    this.setStatus('leader');
    this.currentLeader = this.id;
    console.log(\`[\${this.id}] Became leader for term \${this.currentTerm}\`);
  }

  // Step down from leadership
  stepDown(newTerm?: number): void {
    if (newTerm !== undefined && newTerm > this.currentTerm) {
      this.currentTerm = newTerm;
    }
    this.votedFor = null;
    this.currentLeader = null;
    this.setStatus('follower');
    console.log(\`[\${this.id}] Stepped down to follower\`);
  }

  // Acknowledge new leader
  acknowledgeLeader(leaderId: string, term: number): void {
    if (term >= this.currentTerm) {
      this.currentTerm = term;
      this.currentLeader = leaderId;
      this.setStatus('follower');
      console.log(\`[\${this.id}] Acknowledged \${leaderId} as leader for term \${term}\`);
    }
  }

  setOnline(online: boolean): void {
    this.isOnline = online;
    if (!online) {
      console.log(\`[\${this.id}] Went offline\`);
    } else {
      console.log(\`[\${this.id}] Came online\`);
    }
  }

  isNodeOnline(): boolean {
    return this.isOnline;
  }

  getLeader(): string | null {
    return this.currentLeader;
  }

  reset(): void {
    this.status = 'follower';
    this.currentTerm = 0;
    this.votedFor = null;
    this.currentLeader = null;
  }
}

// ============================================================
// Quorum Calculator
// ============================================================
class QuorumCalculator {
  // Calculate simple majority: (N/2) + 1
  static calculateMajority(totalNodes: number): number {
    return Math.floor(totalNodes / 2) + 1;
  }

  // Calculate maximum tolerable failures
  static calculateMaxFailures(totalNodes: number): number {
    return Math.floor(totalNodes / 2);
  }

  // Check if vote count achieves quorum
  static hasQuorum(votesReceived: number, totalNodes: number): boolean {
    const majority = this.calculateMajority(totalNodes);
    return votesReceived >= majority;
  }

  // Validate cluster size (odd is better)
  static validateClusterSize(totalNodes: number): {
    valid: boolean;
    recommendation: string;
  } {
    if (totalNodes < 3) {
      return {
        valid: false,
        recommendation: 'Minimum 3 nodes required for meaningful quorum',
      };
    }

    if (totalNodes % 2 === 0) {
      return {
        valid: true,
        recommendation: \`Even cluster size (\${totalNodes}) wastes fault tolerance. Consider \${totalNodes - 1} or \${totalNodes + 1} nodes instead.\`,
      };
    }

    return {
      valid: true,
      recommendation: \`Cluster size \${totalNodes} is optimal (odd number)\`,
    };
  }

  // Show quorum analysis for different cluster sizes
  static analyzeQuorumScenarios() {
    console.log('\\n=== Quorum Analysis Across Cluster Sizes ===\\n');

    for (let n = 1; n <= 7; n++) {
      const majority = this.calculateMajority(n);
      const maxFailures = this.calculateMaxFailures(n);

      console.log(\`Cluster size \${n}:\`);
      console.log(\`  Quorum needed: \${majority} nodes\`);
      console.log(\`  Max failures tolerated: \${maxFailures} nodes\`);
      console.log(\`  Efficiency: \${(maxFailures / n * 100).toFixed(1)}%\\n\`);
    }
  }
}

// ============================================================
// Cluster Manager
// ============================================================
class ClusterManager {
  private nodes: Map<string, Node> = new Map();

  constructor(nodeIds: string[]) {
    nodeIds.forEach(id => {
      this.nodes.set(id, new Node(id));
    });
  }

  // Run leader election with a specific candidate
  async electLeader(candidateId: string): Promise<ProposeResult> {
    const candidate = this.nodes.get(candidateId);

    if (!candidate) {
      throw new Error(\`Node \${candidateId} not found\`);
    }

    // Candidate starts election
    candidate.becomeCandidate();

    const totalNodes = this.nodes.size;
    const majority = QuorumCalculator.calculateMajority(totalNodes);

    console.log(\`\\n[Election] \${candidateId} seeking election in cluster of \${totalNodes} nodes\`);
    console.log(\`[Election] Need \${majority} votes (majority of \${totalNodes})\`);

    // Request votes from all nodes (including self)
    const votes: Vote[] = [];
    let grantedVotes = 0;

    for (const [nodeId, node] of this.nodes.entries()) {
      if (!node.isNodeOnline()) {
        console.log(\`[\${nodeId}] Unreachable (offline)\`);
        continue;
      }

      const vote = node.requestVote(candidateId, candidate.getTerm());
      votes.push(vote);

      if (vote.decision === 'granted') {
        grantedVotes++;
      }
    }

    console.log(\`\\n[Election] \${candidateId} received \${grantedVotes}/\${majority} votes\`);

    // Check if candidate achieved quorum
    const hasQuorum = QuorumCalculator.hasQuorum(grantedVotes, totalNodes);

    if (hasQuorum) {
      candidate.becomeLeader();

      // Notify all nodes about new leader
      for (const node of this.nodes.values()) {
        if (node !== candidate && node.isNodeOnline()) {
          node.acknowledgeLeader(candidateId, candidate.getTerm());
        }
      }

      console.log(\`[Election] ✓ \${candidateId} won election with majority!\`);
    } else {
      candidate.stepDown();
      console.log(\`[Election] ✗ \${candidateId} failed to achieve quorum\`);
    }

    return {
      success: hasQuorum,
      votesReceived: grantedVotes,
      votesNeeded: majority,
      votes,
    };
  }

  // Simulate network partition
  partitionCluster(partition1: string[], partition2: string[]): void {
    console.log(\`\\n[Network] Partitioning cluster: [\${partition1.join(', ')}] | [\${partition2.join(', ')}]\`);

    const majority = QuorumCalculator.calculateMajority(this.nodes.size);

    console.log(\`[Network] Partition 1: \${partition1.length} nodes (majority: \${partition1.length >= majority})\`);
    console.log(\`[Network] Partition 2: \${partition2.length} nodes (majority: \${partition2.length >= majority})\`);

    // Only one partition can have majority
    if (partition1.length >= majority && partition2.length >= majority) {
      console.log('[Network] ERROR: Both partitions have majority - this should be impossible!');
    } else if (partition1.length >= majority) {
      console.log(\`[Network] → Only partition 1 can elect leader (prevents split-brain)\`);
    } else if (partition2.length >= majority) {
      console.log(\`[Network] → Only partition 2 can elect leader (prevents split-brain)\`);
    } else {
      console.log(\`[Network] → Neither partition has majority - cluster unavailable\`);
    }
  }

  // Demonstrate split-brain prevention
  async demonstrateSplitBrainPrevention(): Promise<void> {
    console.log('\\n=== Demonstrating Split-Brain Prevention ===\\n');

    const nodeIds = Array.from(this.nodes.keys());
    const mid = Math.floor(nodeIds.length / 2);

    // Create network partition
    const partition1 = nodeIds.slice(0, mid);
    const partition2 = nodeIds.slice(mid);

    this.partitionCluster(partition1, partition2);

    // Mark partition2 nodes as offline from partition1's perspective
    partition2.forEach(id => {
      const node = this.nodes.get(id);
      if (node) node.setOnline(false);
    });

    // Try to elect leader in partition1
    console.log(\`\\n[Test] Attempting election in partition 1...\`);
    const result1 = await this.electLeader(partition1[0]);

    // Try to elect leader in partition2 (will fail because nodes are offline)
    partition2.forEach(id => {
      const node = this.nodes.get(id);
      if (node) node.setOnline(true);
    });
    partition1.forEach(id => {
      const node = this.nodes.get(id);
      if (node) node.setOnline(false);
    });

    console.log(\`\\n[Test] Attempting election in partition 2...\`);
    const result2 = await this.electLeader(partition2[0]);

    console.log('\\n[Result] Split-brain prevention outcome:');
    console.log(\`  Partition 1 elected leader: \${result1.success}\`);
    console.log(\`  Partition 2 elected leader: \${result2.success}\`);
    console.log(\`  Both elected leader: \${result1.success && result2.success} (should be false!)\`);

    // Restore all nodes
    for (const node of this.nodes.values()) {
      node.setOnline(true);
      node.reset();
    }
  }

  getClusterStatus() {
    const status: Record<string, any> = {};

    this.nodes.forEach((node, id) => {
      status[id] = {
        status: node.getStatus(),
        term: node.getTerm(),
        leader: node.getLeader(),
        online: node.isNodeOnline(),
      };
    });

    return status;
  }

  getLeader(): string | null {
    for (const node of this.nodes.values()) {
      if (node.getStatus() === 'leader') {
        return node.getId();
      }
    }
    return null;
  }
}

// ============================================================
// Usage Example
// ============================================================
async function demonstrateSimpleMajority() {
  console.log('=== Simple Majority Quorum Demo ===\\n');

  // Analyze quorum requirements
  QuorumCalculator.analyzeQuorumScenarios();

  // Create a 5-node cluster
  console.log('\\n=== 5-Node Cluster Election ===');
  const cluster5 = new ClusterManager(['node-1', 'node-2', 'node-3', 'node-4', 'node-5']);

  const validation = QuorumCalculator.validateClusterSize(5);
  console.log(validation.recommendation);

  // Successful election
  console.log('\\n--- Scenario 1: Normal Election ---');
  await cluster5.electLeader('node-1');

  // Election with some nodes offline
  console.log('\\n--- Scenario 2: Election with 1 Node Offline ---');
  cluster5.getClusterStatus();
  const nodes = Array.from(['node-1', 'node-2', 'node-3', 'node-4', 'node-5']);
  const cluster5b = new ClusterManager(nodes);

  // Reset and take one node offline
  const nodeToOffline = cluster5b['nodes'].get('node-5');
  if (nodeToOffline) {
    nodeToOffline.setOnline(false);
  }

  console.log('[Setup] node-5 is offline (4 nodes remaining)');
  console.log('[Setup] Still have majority (need 3 of 5, have 4 online)');

  await cluster5b.electLeader('node-1');

  // Split-brain prevention demonstration
  console.log('\\n--- Scenario 3: Network Partition (Split-Brain Prevention) ---');
  const cluster5c = new ClusterManager(['node-1', 'node-2', 'node-3', 'node-4', 'node-5']);
  await cluster5c.demonstrateSplitBrainPrevention();

  // Show why odd cluster sizes are better
  console.log('\\n=== Why Odd Cluster Sizes Are Better ===\\n');

  console.log('4-node cluster:');
  console.log('  - Quorum: 3 nodes');
  console.log('  - Max failures: 1 node');
  console.log('  - 25% fault tolerance\\n');

  console.log('5-node cluster:');
  console.log('  - Quorum: 3 nodes');
  console.log('  - Max failures: 2 nodes');
  console.log('  - 40% fault tolerance\\n');

  console.log('Result: 5-node cluster tolerates 2x failures with same quorum size!');

  console.log('\\n=== Demo Complete ===');
}

// Run the demo
// demonstrateSimpleMajority();`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete simple majority quorum system for leader election and distributed consensus with mathematical split-brain prevention guarantees",
        prerequisites: [
          "Distributed consensus concepts",
          "Quorum systems",
          "Leader election algorithms",
          "Network partitions",
          "Split-brain problem",
        ],
        systemPosition:
          "Consensus layer providing mathematical guarantees for single-leader election in distributed clusters with network partition tolerance",
      },
      annotations: [
        {
          id: "sm-vote-request",
          lines: [52, 104],
          action:
            "Handle vote requests with term comparison and single-vote-per-term guarantee",
          reason:
            "Each node can only vote once per term, preventing multiple leaders in same term. Term comparison ensures nodes with stale state don't participate. This is core to preventing split-brain - if node already voted, it denies vote to prevent conflicting majorities.",
          contextLevel: "module",
          relatedConcepts: ["term-based-voting", "single-vote-guarantee"],
        },
        {
          id: "sm-quorum-calculation",
          lines: [170, 177],
          action: "Calculate simple majority as (N/2) + 1",
          reason:
            "Mathematical formula ensures quorum overlap: any two majorities must share at least one node. For 5 nodes, quorum is 3. If partition A has 3 nodes and partition B has 2, only A can elect leader because B can't reach quorum of 3.",
          contextLevel: "system",
          relatedConcepts: ["quorum-mathematics", "majority-overlap"],
        },
        {
          id: "sm-max-failures",
          lines: [179, 182],
          action: "Calculate maximum tolerable failures as floor(N/2)",
          reason:
            "System can tolerate minority failures while maintaining quorum. 5-node cluster tolerates 2 failures (3 remain = majority). This is optimal - any higher failure tolerance would sacrifice safety (split-brain risk).",
          contextLevel: "system",
          relatedConcepts: ["fault-tolerance", "availability-limits"],
        },
        {
          id: "sm-odd-cluster",
          lines: [189, 210],
          action: "Validate cluster size and recommend odd numbers",
          reason:
            "Odd cluster sizes maximize fault tolerance for given quorum. 4-node (quorum=3, tolerate 1 failure) vs 5-node (quorum=3, tolerate 2 failures) - same quorum, double fault tolerance. Even sizes waste capacity.",
          contextLevel: "system",
          relatedConcepts: ["cluster-sizing", "fault-tolerance-optimization"],
        },
        {
          id: "sm-election-process",
          lines: [231, 283],
          action:
            "Conduct election by requesting votes from all nodes and checking quorum",
          reason:
            "Candidate must receive majority votes to become leader. Counting votes from all reachable nodes and comparing to quorum ensures only one candidate can win (two majorities must overlap). Failed elections occur when network partitioned or too many nodes offline.",
          contextLevel: "system",
          relatedConcepts: ["leader-election", "vote-counting"],
        },
        {
          id: "sm-partition-analysis",
          lines: [285, 304],
          action:
            "Analyze network partition to show which side can elect leader",
          reason:
            "Demonstrates split-brain prevention: only the partition with majority nodes can elect leader. 3-2 partition means majority side can elect, minority cannot. Both sides trying to elect simultaneously is impossible because both can't have majority.",
          contextLevel: "system",
          relatedConcepts: ["network-partition", "split-brain-prevention"],
        },
        {
          id: "sm-split-brain-demo",
          lines: [306, 351],
          action:
            "Demonstrate split-brain prevention by simulating partition and dual elections",
          reason:
            "Proves mathematically that two partitions cannot both elect leaders. Partition with majority succeeds, partition without majority fails. This is the core value of simple majority - guaranteed single leader even during network splits.",
          contextLevel: "system",
          relatedConcepts: ["split-brain-prevention", "partition-tolerance"],
        },
        {
          id: "sm-quorum-analysis",
          lines: [212, 225],
          action: "Analyze quorum requirements across different cluster sizes",
          reason:
            "Shows how quorum size and fault tolerance scale with cluster size. Helps understand tradeoffs: larger clusters tolerate more failures but require more nodes to agree. 3-node (quorum 2, tolerate 1) vs 7-node (quorum 4, tolerate 3).",
          contextLevel: "system",
          relatedConcepts: ["scalability-analysis", "quorum-scaling"],
        },
        {
          id: "sm-term-management",
          lines: [106, 117],
          action: "Increment term and vote for self when becoming candidate",
          reason:
            "Term numbers provide temporal ordering in distributed system. Each election gets new term, preventing stale votes from old elections. Self-vote starts with 1 vote, need majority-1 more votes to win.",
          contextLevel: "module",
          relatedConcepts: ["term-numbering", "temporal-ordering"],
        },
        {
          id: "sm-odd-size-comparison",
          lines: [405, 419],
          action: "Compare 4-node vs 5-node cluster fault tolerance",
          reason:
            "Concrete example showing odd cluster advantage: both need quorum of 3, but 5-node tolerates 2 failures vs 4-node's 1 failure. Same quorum cost, double the resilience. This is why production clusters use odd sizes (3, 5, 7).",
          contextLevel: "system",
          relatedConcepts: ["cluster-sizing-strategy", "cost-benefit-analysis"],
        },
      ],
      highlights: [
        {
          lines: [170, 210],
          label: "Quorum calculation and cluster size validation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [52, 104],
          label: "Vote request handling with term-based voting",
          sbvpDomain: "behavior",
        },
        {
          lines: [231, 283],
          label: "Leader election with majority vote counting",
          sbvpDomain: "behavior",
        },
        {
          lines: [306, 351],
          label: "Split-brain prevention demonstration",
          sbvpDomain: "behavior",
        },
        {
          lines: [212, 225],
          label: "Quorum analysis across cluster sizes",
          sbvpDomain: "structure",
        },
      ],
    },
  ],
};
