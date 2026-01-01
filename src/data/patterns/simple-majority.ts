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
        name: "Candidate Node",
        role: "Leader Election Proposer",
        responsibilities: [
          "Increment term number and become candidate when election timeout triggers",
          "Vote for self (counts as first vote in quorum)",
          "Request votes from all other nodes in parallel",
          "Count votes and determine if majority (N/2)+1 achieved",
          "Become leader if majority obtained, step down if election fails",
        ],
      },
      {
        name: "Voter Node",
        role: "Vote Granting Authority",
        responsibilities: [
          "Grant at most one vote per term (single-vote-per-term guarantee)",
          "Compare candidate's term with own term (reject stale candidates)",
          "Update own term if candidate has newer term",
          "Track which candidate received vote in current term",
          "Deny vote if already voted for different candidate in same term",
        ],
      },
      {
        name: "Quorum Calculator",
        role: "Mathematical Quorum Verifier",
        responsibilities: [
          "Calculate majority threshold: floor(N/2) + 1",
          "Verify if vote count meets quorum requirements",
          "Calculate maximum tolerable failures: floor(N/2)",
          "Validate cluster size (recommend odd numbers)",
          "Provide quorum analysis for different cluster sizes",
        ],
      },
      {
        name: "Cluster Manager",
        role: "Election Orchestrator",
        responsibilities: [
          "Maintain registry of all nodes in cluster",
          "Coordinate election process across nodes",
          "Collect votes from all reachable nodes",
          "Detect network partitions and their quorum status",
          "Notify cluster of new leader once majority achieved",
        ],
      },
      {
        name: "Leader Node",
        role: "Elected Authority",
        responsibilities: [
          "Accept writes and coordinate distributed operations",
          "Send heartbeats to maintain leadership authority",
          "Step down if loses majority support or discovers higher term",
          "Replicate state changes to follower nodes",
          "Serve as single source of truth for cluster decisions",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant N1 as Node 1 (Candidate)
    participant N2 as Node 2
    participant N3 as Node 3
    participant N4 as Node 4
    participant N5 as Node 5
    participant QC as Quorum Calculator

    Note over N1,N5: 5-Node Cluster - Need 3 votes for majority

    N1->>N1: Election timeout<br/>Become candidate<br/>Term = 1<br/>Vote for self (1 vote)

    par Vote Request to All Nodes
        N1->>N2: RequestVote(term=1, candidateId=N1)
        N1->>N3: RequestVote(term=1, candidateId=N1)
        N1->>N4: RequestVote(term=1, candidateId=N1)
        N1->>N5: RequestVote(term=1, candidateId=N1)
    end

    Note over N2,N5: Each node checks:<br/>1. Is candidate term >= my term?<br/>2. Have I voted this term?

    N2-->>N1: VoteGranted (2 votes total)
    N3-->>N1: VoteGranted (3 votes total)
    N4-->>N1: VoteDenied (already voted for N4)
    N5--xN1: Offline (unreachable)

    N1->>QC: Check quorum: 3 votes of 5 nodes
    QC-->>N1: Majority achieved! (3 >= 3)

    N1->>N1: Become leader for term 1

    par Notify Cluster of New Leader
        N1->>N2: Heartbeat (leader=N1, term=1)
        N1->>N3: Heartbeat (leader=N1, term=1)
        N1->>N4: Heartbeat (leader=N1, term=1)
    end

    Note over N1,N5: Leader elected with majority<br/>N4 cannot win (only 2 votes possible)`,
    flow: [
      {
        step: 1,
        actor: "Candidate Node",
        action: "Become Candidate",
        description:
          "Node detects election timeout (no heartbeat from leader) or manually triggered election. Increments term number, votes for self, and transitions to candidate state.",
      },
      {
        step: 2,
        actor: "Candidate Node",
        action: "Request Votes from All Nodes",
        description:
          "Sends RequestVote RPCs to all other nodes in parallel, including current term and candidate ID. Does not wait for all responses (fail-fast for offline nodes).",
      },
      {
        step: 3,
        actor: "Voter Node",
        action: "Evaluate Vote Request",
        description:
          "Each voter checks: (1) Is candidate's term >= my current term? (2) Have I already voted this term? (3) If yes to both, grant vote and record vote for this candidate in this term.",
      },
      {
        step: 4,
        actor: "Voter Node",
        action: "Grant or Deny Vote",
        description:
          "Returns VoteGranted if conditions met (candidate term current, haven't voted yet or already voted for this candidate). Returns VoteDenied if already voted for different candidate or candidate has stale term.",
      },
      {
        step: 5,
        actor: "Candidate Node",
        action: "Collect Votes and Count Responses",
        description:
          "Aggregates VoteGranted responses from all reachable nodes. Includes self-vote in count. Tracks vote count in real-time as responses arrive.",
      },
      {
        step: 6,
        actor: "Quorum Calculator",
        action: "Verify Quorum Achievement",
        description:
          "Calculates majority threshold: majority = floor(N/2) + 1 where N is total cluster size. Compares vote count to threshold. Returns true if votes >= majority.",
      },
      {
        step: 7,
        actor: "Candidate Node",
        action: "Determine Election Outcome",
        description:
          "If majority achieved: become leader and notify cluster. If majority not achieved (insufficient votes or too many offline nodes): step down to follower and reset election timer.",
      },
      {
        step: 8,
        actor: "Leader Node",
        action: "Notify Cluster of Leadership",
        description:
          "New leader sends heartbeat messages to all nodes announcing leadership for current term. Follower nodes acknowledge leader and transition to follower state.",
      },
      {
        step: 9,
        actor: "Cluster Manager",
        action: "Detect Split-Brain Prevention",
        description:
          "In network partition scenario, only partition with majority nodes can elect leader. Minority partition fails to reach quorum. This mathematically prevents two leaders from being elected simultaneously.",
      },
      {
        step: 10,
        actor: "Leader Node",
        action: "Maintain Leadership via Heartbeats",
        description:
          "Leader sends periodic heartbeats to all nodes to maintain authority. Nodes reset election timers on heartbeat receipt. If leader fails, nodes trigger new election after timeout.",
      },
    ],
    invariants: [
      "At most one leader can be elected per term (majority overlap property)",
      "Each node grants at most one vote per term",
      "Candidate must receive votes from majority of total cluster size (not just reachable nodes)",
      "Majority quorum must be (N/2)+1 where N is total nodes, not current online nodes",
      "Vote count must include candidate's self-vote",
      "Higher term number always supersedes lower term",
      "Two majorities must overlap by at least one node (prevents split-brain)",
      "Cluster size N should be odd (3, 5, 7) for optimal fault tolerance",
      "Maximum failures tolerated: floor(N/2) nodes",
      "Quorum requirement is static based on total cluster size, not dynamic based on available nodes",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Distributed Consensus Layer - Simple majority quorum is fundamental to consensus protocols like Raft, Paxos, and ZooKeeper Atomic Broadcast (ZAB). In Raft, leader election requires a candidate to receive votes from a majority of nodes (e.g., 3 votes in a 5-node cluster). The quorum layer sits between application state machines and network communication—when clients request writes, Raft leader replicates log entries to a majority of followers before committing. Placement: Leader election module calculates quorum on every election; log replication module checks majority acknowledgment before commit. Used in etcd (Kubernetes metadata store), Consul (service discovery), and CockroachDB (distributed SQL). Critical boundary: quorum verification must happen before state machine applies commands—premature commit without majority violates consistency guarantees.",

      "Distributed Coordination Services - ZooKeeper, etcd, and Consul use simple majority for configuration changes and distributed locks. When creating a ZooKeeper znode (configuration entry), write must be acknowledged by majority of ZooKeeper ensemble nodes before returning success to client. Typical deployment: 3-node or 5-node ZooKeeper ensemble where writes require 2 or 3 acknowledgments respectively. Placement: Transaction proposal layer calculates quorum after receiving acknowledgments from followers. ZooKeeper guarantees linearizable writes via majority quorum—if write succeeds, all future reads see that write (even if some nodes haven't received update yet). Used in Kafka (controller election and metadata), HBase (master election), and HDFS (NameNode high availability). Pattern prevents split-brain: if ZooKeeper ensemble partitions into 3+2 groups, only 3-node partition can elect leader and accept writes.",

      "Distributed Databases - MongoDB replica sets, Cassandra with QUORUM consistency, and Spanner use simple majority for write acknowledgment and leader election. MongoDB replica set with 5 nodes requires writes to be acknowledged by 3 nodes (primary + 2 secondaries) for majority write concern. Placement: Write concern layer in MongoDB driver calculates majority based on replica set size; Cassandra coordinator node calculates QUORUM as (N/2)+1 replicas for consistency level. MongoDB's replica set elections use Raft-like majority voting: when primary fails, secondaries with most up-to-date oplogs become candidates and require majority votes to become new primary. Used in production: MongoDB Atlas clusters (3-node minimum for high availability), Cassandra clusters with QUORUM reads/writes for strong consistency, Elasticsearch master node elections (majority of master-eligible nodes). Critical tradeoff: majority writes reduce availability (cannot tolerate majority failures) but guarantee consistency (no divergent data).",

      "Service Mesh Control Planes - Istio and Consul service mesh use etcd or Consul (both using Raft) for storing service mesh configuration (VirtualServices, DestinationRules). When updating traffic routing rules, etcd requires majority acknowledgment before configuration takes effect. Placement: Control plane (istiod) writes to etcd which uses Raft consensus; data plane proxies (Envoy sidecars) read eventually consistent configuration. Typical deployment: 3-node or 5-node etcd cluster where istiod updates require 2 or 3 acknowledgments. Used in Kubernetes clusters where etcd stores all API objects—kubectl apply doesn't succeed until majority of etcd nodes acknowledge write. Pattern enables zero-downtime upgrades: rolling restart of etcd nodes one-at-a-time maintains quorum (e.g., 5-node cluster tolerates 2 nodes down, so can safely restart 1 node at a time).",

      "Leader Election for Stateful Services - Kafka controller election, Redis Sentinel master election, and Elasticsearch master election use majority quorum. Kafka cluster has multiple brokers but only one controller (leader managing partition assignment and metadata). Controller election uses ZooKeeper: candidate broker creates ephemeral node in ZooKeeper, ZooKeeper ensemble requires majority to acknowledge creation, first broker to successfully create node becomes controller. Placement: Election logic in Kafka broker delegates to ZooKeeper client which handles majority quorum. Redis Sentinel uses simple majority for failover decisions: when sentinels detect master down, they vote on promoting replica—requires majority of sentinels to agree (e.g., 3 of 5 sentinels). Used in production: Kafka clusters with ZooKeeper ensembles for controller election, Redis Sentinel deployments with odd number of sentinels (3, 5, 7), Elasticsearch clusters electing master from master-eligible nodes via Zen discovery (requires majority).",
    ],
    interactsWith: [
      "read-quorum",
      "write-quorum",
      "r-w-n",
      "leader-election",
      "raft-consensus",
      "paxos",
      "zab-protocol",
      "two-phase-commit",
      "distributed-lock",
    ],
    architecturalBoundaries: [
      "Consensus Protocol Boundary - Simple majority sits at the core of consensus algorithms (Raft, Paxos, ZAB). In Raft, leader election and log replication both require majority agreement. Architectural placement: between replicated state machine layer (application state) and RPC layer (network communication). When client sends write to Raft leader, flow is: Client → Leader → RPC to all followers → Collect acknowledgments → Check majority quorum → Apply to state machine → Return success. Critical invariant: state machine applies command only after majority acknowledges log entry. Split-brain prevention: if 5-node cluster partitions into 3+2, only 3-node partition can elect leader and commit writes. Used in: etcd (Kubernetes), Consul (HashiCorp service mesh), TiKV (TiDB storage engine).",

      "Write Path in Distributed Databases - Majority quorum enforces consistency on write path. MongoDB with writeConcern: 'majority' doesn't acknowledge write to client until majority of replica set members acknowledge. Architectural flow: Client → Primary → Replicate to secondaries → Wait for majority acknowledgments → Update commit point → Acknowledge client. Placement: Write concern enforcement in primary node after replication. Ensures written data survives failures: if client receives acknowledgment, data exists on majority of nodes, so can survive minority failures. Cassandra QUORUM writes follow similar pattern: Coordinator → Calculate QUORUM based on replication factor → Send to all replicas → Wait for (RF/2)+1 acknowledgments → Return success. Used in: MongoDB replica sets, Cassandra with QUORUM consistency level, Riak with quorum writes.",

      "Leader Election Boundary - Simple majority prevents multiple leaders via overlapping majorities. When multiple nodes simultaneously attempt to become leader (split-brain scenario), at most one can achieve majority. Architectural placement: between failure detection (heartbeat timeout) and leadership assertion (sending commands to followers). Election flow: Follower detects timeout → Become candidate → Increment term → Vote for self → Request votes from all nodes → Count votes → If majority, become leader; else retry. Critical property: two majorities must overlap by at least one node—if candidate A gets votes from nodes {1,2,3} and candidate B tries to get votes from nodes {3,4,5}, node 3 can only vote for one (single-vote-per-term), preventing both from winning. Used in: Raft leader election, ZooKeeper leader election, Consul leader election, Kafka controller election via ZooKeeper.",

      "Configuration Change Boundary - Simple majority enables safe cluster membership changes. Adding/removing nodes from Raft cluster requires majority agreement to prevent unsafe configurations. Architectural placement: between cluster configuration manager and consensus layer. Flow: Client requests node addition → Leader proposes configuration change → Replicate to followers → Majority acknowledges → Apply new configuration → New node joins cluster. Joint consensus approach: during transition, system requires majority in both old and new configurations to prevent split-brain during membership change. Used in: etcd cluster membership changes, Consul server addition/removal, CockroachDB node rebalancing.",

      "Distributed Lock Boundary - Distributed locks (e.g., ZooKeeper distributed locks, etcd distributed locks) use majority quorum for lock acquisition safety. Architectural placement: between lock client and coordination service. Lock acquisition flow: Client requests lock → Coordination service (ZooKeeper/etcd) creates ephemeral node → Requires majority acknowledgment → Lock acquired → Client failure deletes ephemeral node → Majority acknowledges deletion → Lock released. Majority quorum ensures lock cannot be acquired by multiple clients simultaneously: even during network partition, only client in majority partition can acquire lock. Used in: ZooKeeper locks for HBase master election, etcd locks for Kubernetes leader election, Consul locks for service coordination.",
    ],
  },

  implementations: [
    {
      id: "raft-consensus",
      name: "Raft Consensus Algorithm",
      type: "library",
      languages: ["any"],
      description:
        "Raft is a consensus algorithm designed for understandability that uses simple majority quorum for leader election and log replication. In a 5-node Raft cluster, a candidate must receive 3 votes (majority of 5) to become leader. Once elected, leader must replicate log entries to at least 3 nodes (majority) before committing. Raft's simple majority approach prevents split-brain: in a network partition, only the partition with majority nodes can elect a leader and make progress.",
      links: {
        docs: "https://raft.github.io/",
        github: "https://github.com/etcd-io/etcd/tree/main/raft",
      },
      codeSnippet: `// Raft leader election with simple majority quorum
// Based on etcd's Raft implementation

// Calculate majority quorum for cluster
func (r *raft) quorum() int {
    return len(r.nodes)/2 + 1
}

// Leader election - candidate requests votes from all nodes
func (r *raft) becomeCandidate() {
    r.state = StateCandidate
    r.term++
    r.vote = r.id // Vote for self
    r.votes = make(map[uint64]bool)
    r.votes[r.id] = true // Count self-vote

    // Request votes from all other nodes
    for _, id := range r.nodes {
        if id == r.id {
            continue
        }
        r.send(Message{
            Type: MsgVote,
            To: id,
            Term: r.term,
            LogTerm: r.raftLog.lastTerm(),
            Index: r.raftLog.lastIndex(),
        })
    }
}

// Handle vote response
func (r *raft) handleVoteResp(m Message) {
    r.votes[m.From] = !m.Reject

    granted := 0
    for _, vote := range r.votes {
        if vote {
            granted++
        }
    }

    quorum := r.quorum()

    // Check if majority achieved
    if granted >= quorum {
        r.becomeLeader()
        return
    }

    // Check if majority impossible (too many rejections)
    rejected := len(r.votes) - granted
    if rejected >= quorum {
        r.becomeFollower(r.term, None)
    }
}

// Log replication - leader waits for majority acknowledgment
func (r *raft) maybeCommit() bool {
    // Count acknowledgments for each log entry
    acks := make(map[uint64]int)
    for _, progress := range r.progressMap {
        acks[progress.Match]++
    }

    // Find highest index acknowledged by majority
    quorum := r.quorum()
    for index := r.raftLog.committed + 1; index <= r.raftLog.lastIndex(); index++ {
        if acks[index] >= quorum && r.raftLog.term(index) == r.term {
            r.raftLog.commitTo(index)
            r.bcastAppend()
            return true
        }
    }
    return false
}

// Example for 5-node cluster:
// - Quorum = floor(5/2) + 1 = 3 nodes
// - Candidate needs 3 votes to become leader
// - Leader needs 3 acknowledgments to commit log entry
// - Can tolerate 2 node failures (floor(5/2) = 2)
// - Network partition: 3-node side can elect leader, 2-node side cannot`,
    },
    {
      id: "etcd-raft",
      name: "etcd - Distributed Key-Value Store",
      type: "platform",
      languages: ["go"],
      description:
        "etcd is a strongly consistent distributed key-value store that uses Raft consensus with simple majority quorum. Used by Kubernetes for storing all cluster state (pods, services, config). A typical etcd cluster has 3 or 5 nodes—writes require majority acknowledgment (2 of 3, or 3 of 5). Leader election requires majority votes. etcd can tolerate (N-1)/2 failures: 3-node tolerates 1 failure, 5-node tolerates 2 failures.",
      links: {
        docs: "https://etcd.io/docs/",
        github: "https://github.com/etcd-io/etcd",
      },
      codeSnippet: `// etcd cluster with 5 nodes using simple majority

// Initialize 5-node etcd cluster
$ etcd --name node1 --initial-cluster \\
  node1=http://10.0.0.1:2380,node2=http://10.0.0.2:2380,\\
  node3=http://10.0.0.3:2380,node4=http://10.0.0.4:2380,\\
  node5=http://10.0.0.5:2380

// Write operation requires majority (3 of 5 nodes)
$ etcdctl put /config/database "postgresql://prod"
OK  # Returns only after 3 nodes acknowledge

// Leader election happens automatically
// Quorum: floor(5/2) + 1 = 3 nodes required
// - Candidate votes for self (1 vote)
// - Needs 2 more votes from other nodes
// - Total 3 votes = majority achieved

// Check cluster member list
$ etcdctl member list
a1b2c3d4, started, node1, http://10.0.0.1:2380, http://10.0.0.1:2379, false
e5f6g7h8, started, node2, http://10.0.0.2:2380, http://10.0.0.2:2379, false
i9j0k1l2, started, node3, http://10.0.0.3:2380, http://10.0.0.3:2379, false
m3n4o5p6, started, node4, http://10.0.0.4:2380, http://10.0.0.4:2379, false
q7r8s9t0, started, node5, http://10.0.0.5:2380, http://10.0.0.5:2379, false

// Simulate network partition: 3 nodes vs 2 nodes
# Partition 1 (nodes 1,2,3): CAN elect leader, CAN accept writes
# Partition 2 (nodes 4,5): CANNOT elect leader, CANNOT accept writes

// Fault tolerance
# 5-node cluster can tolerate 2 failures
# If 2 nodes crash, remaining 3 nodes = majority
# Cluster continues operating normally

// Kubernetes integration
apiVersion: v1
kind: Pod
metadata:
  name: etcd-node1
spec:
  containers:
  - name: etcd
    image: quay.io/coreos/etcd:v3.5.0
    command:
      - etcd
      - --name=node1
      - --initial-cluster-state=new
      - --initial-cluster=node1=http://10.0.0.1:2380,...
    # Kubernetes uses etcd for storing all cluster state
    # API server writes (kubectl apply) require majority acknowledgment`,
    },
    {
      id: "mongodb-replica-set",
      name: "MongoDB Replica Set Elections",
      type: "platform",
      languages: ["any"],
      description:
        "MongoDB replica sets use simple majority for primary election and write acknowledgment. When primary fails, secondaries with highest oplog trigger election requiring majority votes. writeConcern: 'majority' ensures writes are acknowledged by majority of replica set members before returning to client. Prevents rollback scenarios where data committed on primary is lost during failover.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/core/replica-set-elections/",
      },
      codeSnippet: `// MongoDB 5-member replica set configuration
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongodb1:27017" },
    { _id: 1, host: "mongodb2:27017" },
    { _id: 2, host: "mongodb3:27017" },
    { _id: 3, host: "mongodb4:27017" },
    { _id: 4, host: "mongodb5:27017" }
  ]
})

// Majority for 5 nodes = floor(5/2) + 1 = 3 nodes

// Primary election after failure
// 1. Secondary with highest oplog becomes candidate
// 2. Candidate requests votes from all members
// 3. Needs 3 votes (majority of 5) to become primary
// 4. Only one candidate can win (majority overlap)

// Write with majority write concern
db.users.insertOne(
  { name: "Alice", email: "alice@example.com" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
)
// Write acknowledged only after 3 of 5 members confirm

// Check replica set status
rs.status()
{
  "set": "myReplicaSet",
  "members": [
    { "_id": 0, "name": "mongodb1:27017", "stateStr": "PRIMARY" },
    { "_id": 1, "name": "mongodb2:27017", "stateStr": "SECONDARY" },
    { "_id": 2, "name": "mongodb3:27017", "stateStr": "SECONDARY" },
    { "_id": 3, "name": "mongodb4:27017", "stateStr": "SECONDARY" },
    { "_id": 4, "name": "mongodb5:27017", "stateStr": "SECONDARY" }
  ]
}

// Network partition scenario (3 nodes vs 2 nodes)
// Partition with 3 nodes: CAN elect primary, CAN accept majority writes
// Partition with 2 nodes: CANNOT elect primary, becomes read-only

// Fault tolerance
// Can tolerate 2 member failures: floor(5/2) = 2
// With 2 members down, 3 remain = majority
// Cluster continues operating (elections and majority writes succeed)`,
    },
    {
      id: "zookeeper-quorum",
      name: "Apache ZooKeeper - ZAB Protocol",
      type: "platform",
      languages: ["java"],
      description:
        "ZooKeeper uses ZooKeeper Atomic Broadcast (ZAB) protocol which relies on simple majority quorum for leader election and transaction commits. ZooKeeper ensemble typically has 3, 5, or 7 nodes. All writes go through leader which broadcasts to followers—transaction commits only after majority acknowledgment. Provides linearizable writes and eventually consistent reads.",
      links: {
        docs: "https://zookeeper.apache.org/doc/r3.8.0/zookeeperInternals.html",
      },
      codeSnippet: `# ZooKeeper 5-node ensemble configuration
# zoo.cfg on each server

tickTime=2000
initLimit=10
syncLimit=5
dataDir=/var/lib/zookeeper

# Server list (odd number for optimal fault tolerance)
server.1=zoo1:2888:3888
server.2=zoo2:2888:3888
server.3=zoo3:2888:3888
server.4=zoo4:2888:3888
server.5=zoo5:2888:3888

# Quorum configuration
# N = 5 nodes
# Majority = floor(5/2) + 1 = 3 nodes
# Max failures tolerated = floor(5/2) = 2 nodes

# Leader election process (ZAB protocol)
# 1. Each server proposes itself as leader with (epoch, zxid)
# 2. Servers exchange proposals
# 3. Server with highest (epoch, zxid) gets votes
# 4. Candidate needs 3 votes (majority of 5) to become leader
# 5. Only one leader can be elected per epoch

# Write transaction flow
# Client creates znode /config/database
import org.apache.zookeeper.*;

ZooKeeper zk = new ZooKeeper("zoo1:2181,zoo2:2181,zoo3:2181", 3000, watcher);

// Write operation
zk.create(
    "/config/database",
    "postgresql://prod".getBytes(),
    ZooDefs.Ids.OPEN_ACL_UNSAFE,
    CreateMode.PERSISTENT
);
// Transaction committed only after majority (3 of 5) acknowledges

# ZooKeeper in Kafka for controller election
# Kafka broker becomes controller by creating ephemeral node
# ZooKeeper ensures only one broker creates node (majority acknowledgment)

# Network partition scenario
# Partition 1: 3 servers - CAN elect leader, CAN accept writes
# Partition 2: 2 servers - CANNOT elect leader, read-only mode

# Production deployment (Kubernetes)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zookeeper
spec:
  serviceName: zookeeper
  replicas: 5  # 5-node ensemble
  selector:
    matchLabels:
      app: zookeeper
  template:
    metadata:
      labels:
        app: zookeeper
    spec:
      containers:
      - name: zookeeper
        image: zookeeper:3.8
        env:
        - name: ZOO_SERVERS
          value: "server.1=zk-0.zookeeper:2888:3888;2181 server.2=zk-1.zookeeper:2888:3888;2181 ..."`,
    },
    {
      id: "consul-raft",
      name: "HashiCorp Consul - Service Mesh Coordination",
      type: "platform",
      languages: ["go"],
      description:
        "Consul uses Raft consensus with simple majority for server cluster coordination. Consul servers (typically 3 or 5) elect a leader that manages service catalog, health checks, and key-value store. All writes (service registration, KV updates) require majority acknowledgment. Used for service discovery, configuration management, and distributed locking.",
      links: {
        docs: "https://www.consul.io/docs/architecture/consensus",
      },
      codeSnippet: `# Consul 5-server cluster deployment
# Server 1
consul agent -server -bootstrap-expect=5 \\
  -data-dir=/tmp/consul1 \\
  -node=server1 \\
  -bind=10.0.0.1 \\
  -retry-join=10.0.0.2 \\
  -retry-join=10.0.0.3 \\
  -retry-join=10.0.0.4 \\
  -retry-join=10.0.0.5

# Quorum mathematics
# N = 5 servers
# Majority = floor(5/2) + 1 = 3 servers
# Fault tolerance = floor(5/2) = 2 server failures

# Leader election
# - Each server votes for candidate with highest log
# - Candidate needs 3 votes (majority) to become leader
# - Only servers participate in voting (clients don't vote)

# Service registration (write operation)
curl -X PUT http://localhost:8500/v1/catalog/register \\
  -d '{
    "Node": "web-server-1",
    "Address": "10.0.1.100",
    "Service": {
      "ID": "web",
      "Service": "web",
      "Port": 80
    }
  }'
# Registered only after majority (3 of 5 servers) acknowledge

# KV store write with majority consistency
consul kv put config/database "postgresql://prod"
# Value stored after majority acknowledgment

# Distributed lock using sessions
consul lock -verbose my-lock ./my-service
# Lock acquired only when majority of servers acknowledge session

# Check Raft status
curl http://localhost:8500/v1/status/leader
"10.0.0.1:8300"  # Current leader

# Consul in Kubernetes for service mesh
apiVersion: v1
kind: ConfigMap
metadata:
  name: consul-config
data:
  server.json: |
    {
      "server": true,
      "bootstrap_expect": 5,
      "retry_join": ["consul-0.consul", "consul-1.consul", ...],
      "raft_protocol": 3
    }

# Network partition scenario
# 3-server partition: Elects leader, accepts writes (has majority)
# 2-server partition: No leader election, read-only (lacks majority)

# Deployment recommendation
# - 3 servers: Tolerates 1 failure (small deployments)
# - 5 servers: Tolerates 2 failures (production recommended)
# - 7 servers: Tolerates 3 failures (large-scale critical systems)`,
    },
    {
      id: "redis-sentinel",
      name: "Redis Sentinel - Automatic Failover",
      type: "platform",
      languages: ["c"],
      description:
        "Redis Sentinel provides high availability for Redis via monitoring and automatic failover. Sentinels use simple majority quorum for failover decisions—when master fails, sentinels vote on promoting a replica. Requires majority of sentinels to agree (e.g., 3 of 5) before failover proceeds. Prevents split-brain where multiple replicas become master simultaneously.",
      links: {
        docs: "https://redis.io/docs/management/sentinel/",
      },
      codeSnippet: `# Redis Sentinel 5-instance deployment
# sentinel.conf on each sentinel

port 26379
sentinel monitor mymaster 10.0.0.1 6379 3
# 'mymaster' = master name
# '10.0.0.1 6379' = master address
# '3' = quorum (majority of 5 sentinels)

sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1

# Quorum configuration
# Total sentinels: 5
# Quorum: 3 (majority of 5)
# Sentinels needed to trigger failover: 3
# Fault tolerance: 2 sentinel failures

# Sentinel leader election for failover
# 1. Sentinels detect master down (after 5 seconds)
# 2. Sentinel that detects failure becomes candidate
# 3. Candidate requests authorization from other sentinels
# 4. Needs 3 authorizations (majority of 5) to proceed with failover
# 5. Selected sentinel promotes best replica to master

# Failover process with majority voting
# Step 1: Detect master failure (3+ sentinels agree)
# Step 2: Elect sentinel leader to manage failover (majority vote)
# Step 3: Select best replica based on priority, replication offset
# Step 4: Promote replica to master
# Step 5: Reconfigure other replicas to follow new master
# Step 6: Update clients with new master address

# Client connection with Sentinel awareness
import redis
from redis.sentinel import Sentinel

sentinel = Sentinel([
    ('sentinel1', 26379),
    ('sentinel2', 26379),
    ('sentinel3', 26379),
    ('sentinel4', 26379),
    ('sentinel5', 26379)
], socket_timeout=0.1)

# Get current master (sentinels provide via majority consensus)
master = sentinel.master_for('mymaster', socket_timeout=0.1)
master.set('key', 'value')

# Network partition scenario
# Partition 1 (3 sentinels): CAN elect leader, CAN failover master
# Partition 2 (2 sentinels): CANNOT elect leader, CANNOT failover

# Production deployment
# - Always use odd number of sentinels (3, 5, 7)
# - Deploy sentinels on separate infrastructure from Redis
# - Minimum 3 sentinels for production (tolerate 1 failure)
# - 5 sentinels recommended (tolerate 2 failures)

# Docker Compose example
version: '3'
services:
  sentinel1:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
  sentinel2:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
  sentinel3:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
  sentinel4:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
  sentinel5:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
# 5 sentinels ensure 2-failure tolerance with quorum=3`,
    },
  ],

  usedInSystems: [
    {
      systemId: "kubernetes-etcd",
      systemName: "Kubernetes etcd Cluster",
      howUsed:
        "Kubernetes relies on etcd (using Raft consensus with simple majority quorum) to store all cluster state: pods, services, deployments, secrets, configmaps. A production Kubernetes cluster typically runs a 3-node or 5-node etcd cluster. When kubectl apply creates a deployment, the API server writes to etcd which requires majority acknowledgment (2 of 3 nodes, or 3 of 5 nodes) before returning success. etcd's leader election uses simple majority: when leader fails, remaining nodes hold election requiring majority votes to elect new leader. This prevents split-brain scenarios where two leaders could exist and cause divergent cluster state. In a 5-node etcd cluster during network partition (3 nodes in one partition, 2 in another), only the 3-node partition can elect a leader and accept writes—the 2-node partition becomes read-only, preventing both partitions from accepting conflicting writes. Kubernetes clusters can tolerate (N-1)/2 etcd failures: 3-node tolerates 1 failure, 5-node tolerates 2 failures. Google Cloud's GKE runs 3-node etcd for standard clusters and 5-node for high-availability clusters. The majority quorum ensures that once kubectl receives success for a write (e.g., creating a pod), that state persists even if minority of etcd nodes crash. During etcd node failures, Kubernetes API server continues operating as long as majority of etcd nodes remain healthy. Operators can perform rolling upgrades of etcd nodes one-at-a-time without downtime because quorum is maintained (5-node cluster can tolerate 1 node offline for upgrade, then that node rejoins before upgrading next node). Pattern composition: Simple Majority (leader election + write quorum) + Raft Consensus + Replicated State Machine + Linearizable Reads/Writes. Impact: Kubernetes clusters achieve 99.95%+ availability for control plane by using etcd's majority quorum to survive node failures; prevents data corruption from split-brain scenarios; enables zero-downtime etcd upgrades via rolling restart while maintaining quorum.",
      source:
        "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/",
    },
    {
      systemId: "mongodb-atlas",
      systemName: "MongoDB Atlas Replica Set Elections",
      howUsed:
        "MongoDB Atlas (MongoDB's managed cloud service) deploys replica sets with simple majority quorum for primary election and write acknowledgment. Atlas enforces minimum 3-member replica sets for high availability (M10+ clusters). When a primary fails (node crash, network partition, or maintenance), secondaries detect missing heartbeats and initiate election. The secondary with the most up-to-date oplog (highest priority) becomes candidate and requests votes from all members. To become new primary, candidate must receive votes from majority of replica set members—in a 5-member set, needs 3 votes; in 3-member set, needs 2 votes. Atlas configures writeConcern: 'majority' by default for critical collections, ensuring writes are acknowledged by majority before returning to application. This prevents rollback scenarios: if primary commits write and crashes before replicating to secondaries, that write could be lost during failover. With majority write concern, client doesn't receive acknowledgment until write exists on majority of nodes, guaranteeing write survives failover. During Atlas rolling upgrades (upgrading MongoDB versions), nodes restart one-at-a-time. In 5-member replica set: (1) Secondary restarts, remaining 4 nodes maintain quorum; (2) Another secondary restarts, remaining 3 nodes = majority; (3) Primary steps down and restarts, one of upgraded secondaries becomes new primary via majority election; (4) Old primary rejoins as secondary. The majority quorum enables zero-downtime upgrades—cluster always has majority available for elections and writes. Atlas regional outage scenario: 5-node replica set deployed across 3 availability zones (2 nodes in zone A, 2 in zone B, 1 in zone C). If zone A fails (2 nodes down), remaining 3 nodes (zones B+C) constitute majority—cluster continues operating with new primary election. Application experiences brief failover (5-10 seconds) but no data loss. Pattern composition: Simple Majority + Raft-like Consensus + Priority-based Elections + Heartbeat Failure Detection + Oplog Replication. Impact: MongoDB Atlas maintains 99.995% uptime SLA via majority quorum; customers using majority write concern have zero data loss during failovers; prevents split-brain in multi-region deployments.",
      source: "https://www.mongodb.com/docs/manual/core/replica-set-elections/",
    },
    {
      systemId: "kafka-controller",
      systemName: "Apache Kafka Controller Election",
      howUsed:
        "Apache Kafka uses ZooKeeper (which implements ZAB protocol with simple majority quorum) for controller election—one broker becomes controller responsible for partition leadership, replica management, and metadata. Kafka cluster typically has 3-9 brokers, with ZooKeeper ensemble of 3 or 5 nodes. Controller election process: each broker attempts to create ephemeral node /controller in ZooKeeper. ZooKeeper's ZAB requires majority of ensemble nodes (2 of 3, or 3 of 5) to acknowledge node creation. First broker to successfully create node becomes controller. Subsequent brokers' attempts fail (node already exists), so they become followers. If controller crashes, its ephemeral node is deleted (ZooKeeper session expired), triggering new election among remaining brokers. The majority quorum prevents split-brain: if ZooKeeper ensemble partitions into 3+2 groups, only broker in 3-node partition can create /controller node—brokers in 2-node partition cannot become controller. This ensures at most one controller exists even during network partitions. Kafka production clusters often use 5-node ZooKeeper ensemble to tolerate 2 failures: floor(5/2) = 2. LinkedIn (Kafka's creator) runs ZooKeeper ensembles across multiple datacenters with majority in primary datacenter—during datacenter failure, majority in primary DC can still elect Kafka controller. Kafka 2.8+ introduces KRaft (Kafka Raft Metadata mode) replacing ZooKeeper with built-in Raft implementation using simple majority directly in Kafka brokers. KRaft controller election: broker with highest committed offset becomes candidate, requests votes from all controller-eligible brokers, needs majority votes to become active controller. KRaft metadata replication: controller writes metadata changes to Raft log, waits for majority acknowledgment before committing. Pattern composition: Simple Majority + Leader Election + Ephemeral Nodes (ZooKeeper) + Session Management + Raft Consensus (KRaft). Impact: Kafka clusters achieve millisecond failover during controller crashes via majority-based election; prevents metadata corruption from multiple controllers; KRaft removes ZooKeeper dependency while maintaining majority quorum guarantees.",
      source:
        "https://kafka.apache.org/documentation/#design_controllerelection",
    },
    {
      systemId: "consul-service-mesh",
      systemName: "HashiCorp Consul Service Mesh",
      howUsed:
        "HashiCorp Consul service mesh uses Raft consensus with simple majority quorum for distributed coordination across microservices. Consul server cluster (typically 3 or 5 servers) maintains service catalog, health checks, and KV store. All writes (service registration, health updates, configuration changes) require majority acknowledgment before succeeding. When microservice registers with Consul (e.g., web service on 10.0.1.100:8080), Consul server receives request and becomes Raft leader proposes transaction to followers. Transaction commits only after majority of servers acknowledge—3 of 5 servers must write to disk before registration succeeds. This ensures service catalog remains consistent even if minority of servers fail. Consul's leader election uses simple majority: during leader failure (crash, network partition), remaining servers hold election. Candidate with most up-to-date log requests votes from all servers; needs majority (3 of 5) to become leader. Only one candidate can achieve majority due to majority overlap property. In geo-distributed deployment, Consul can run servers across multiple datacenters with local leader per datacenter. Each datacenter's servers use majority quorum for local writes. Cross-datacenter replication is eventually consistent, but within datacenter, majority quorum provides strong consistency. Uber runs Consul in Kubernetes for service discovery with 5-server clusters per availability zone—can tolerate 2 server failures per zone while maintaining service discovery. Consul's distributed locks (used for leader election in applications) use sessions with majority quorum: lock acquired only when majority of Consul servers acknowledge session creation. If application holding lock crashes, session expires across majority of servers before another application can acquire lock—prevents two applications from holding same lock. Health check updates (service healthy/unhealthy) require majority acknowledgment, ensuring health state is durable. During Consul server rolling upgrades, servers restart one-at-a-time. With 5 servers, restarting 1 leaves 4 (majority), then 2nd restart leaves 3 (still majority), maintaining cluster availability. Pattern composition: Simple Majority + Raft Leader Election + Distributed Locking + Session Management + Gossip Protocol (for servers discovery). Impact: Consul achieves 99.99% availability for service discovery via majority quorum; prevents split-brain in multi-datacenter deployments; enables zero-downtime rolling upgrades of Consul servers.",
      source: "https://www.consul.io/docs/architecture/consensus",
    },
    {
      systemId: "elasticsearch-master",
      systemName: "Elasticsearch Master Node Election",
      howUsed:
        "Elasticsearch uses simple majority quorum (via Zen Discovery and later Voting Configuration) for master node election. Elasticsearch cluster has master-eligible nodes (typically 3, 5, or 7) that participate in elections. Master node is responsible for cluster state changes (index creation, shard allocation, node joins/leaves). When cluster starts or current master fails, master-eligible nodes hold election. Each node votes for candidate with highest cluster state version and node ID. Candidate must receive votes from majority of master-eligible nodes to become master: 3-node cluster needs 2 votes, 5-node needs 3 votes. Elasticsearch 7.0+ introduced Voting Configuration excluding older Zen Discovery. Voting configuration defines set of master-eligible nodes whose majority must approve cluster state changes. Cluster forms when majority of voting configuration nodes are available: 5-node voting config requires 3 nodes to form cluster. This prevents split-brain: if 5-node cluster partitions into 3+2 groups, only 3-node partition has majority and can elect master—2-node partition cannot elect master and becomes read-only (cannot accept writes or cluster state changes). Elastic Cloud (managed Elasticsearch) enforces minimum 3 master-eligible nodes for production clusters. During node failures, as long as majority of master-eligible nodes remain healthy, cluster continues operating: 5-node cluster tolerates 2 failures (3 nodes = majority). Elasticsearch production best practice: deploy dedicated master nodes separate from data nodes. Example: 3 dedicated master-eligible nodes + 20 data nodes. Only master-eligible nodes participate in elections, reducing election complexity. Amazon Elasticsearch Service runs 3 dedicated master nodes across 3 availability zones—if 1 AZ fails, remaining 2 master nodes (majority lost) cannot elect master, cluster becomes read-only. This led to recommendation of 5 master nodes for multi-AZ high availability (can tolerate 2 AZ failures). During rolling cluster restart (e.g., upgrading Elasticsearch version), master-eligible nodes restart one-at-a-time. With 5 master nodes: restart 1st node (4 remain, majority preserved), wait for rejoin, restart 2nd node (3 remain, still majority), continuing until all upgraded. Pattern composition: Simple Majority + Master Election + Cluster State Replication + Shard Allocation + Split-Brain Prevention. Impact: Elasticsearch maintains cluster availability during master node failures via majority quorum; prevents split-brain and data corruption in partitioned clusters; enables zero-downtime rolling upgrades.",
      source:
        "https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-discovery-voting.html",
    },
  ],

  philosophy: {
    coreProblem:
      "Distributed systems must prevent split-brain scenarios where network partitions cause multiple nodes to simultaneously believe they are the leader, leading to conflicting decisions, data divergence, and system-wide corruption. Traditional approaches like requiring all nodes to agree (unanimity) are impractical—single node failure blocks all progress.",
    designPrinciple:
      "Simple majority quorum ((N/2)+1) provides the minimum threshold that mathematically guarantees at most one leader can be elected: any two majorities must overlap by at least one node, preventing conflicting majorities from existing simultaneously. This sweet spot maximizes fault tolerance (tolerates floor(N/2) failures) while ensuring safety (prevents split-brain).",
    historicalContext:
      "Simple majority voting originates from democratic governance dating back to ancient Greece (5th century BC)—decisions required majority support to prevent tyranny and ensure legitimacy. The mathematical properties of majority voting (overlap guarantees, impossibility of two majorities) made it natural fit for distributed systems. Early distributed consensus protocols struggled with Byzantine failures and required complex 2/3 majorities (Byzantine Paxos) or unanimity (two-phase commit). Lamport's Paxos (1989) used simple majority but was notoriously difficult to understand and implement correctly. ZooKeeper (2008) popularized simple majority via ZAB protocol, making it accessible to industry via practical API (create znode, acquire lock). Raft (2014) revolutionized consensus by designing for understandability with simple majority at its core—leader election and log replication both use (N/2)+1. Raft's clarity led to explosion of Raft-based systems: etcd (Kubernetes), Consul (HashiCorp), CockroachDB, TiKV. The pattern became industry standard: all major consensus protocols (Raft, Multi-Paxos, ZAB) converged on simple majority. Research proved optimality: simple majority is minimum quorum size providing both safety (split-brain prevention) and maximum fault tolerance (cannot do better without sacrificing safety). Modern distributed databases (MongoDB, Cassandra with QUORUM, Spanner) universally adopt simple majority for strong consistency. Cloud providers enforce it: AWS recommends 3-node etcd for EKS, GCP enforces 3-member replica sets for Cloud SQL PostgreSQL HA, Azure Cosmos DB uses Raft with majority quorum. The pattern's mathematical elegance (impossible for two majorities to exist) combined with practical fault tolerance (survives 50% failures) made it ubiquitous in distributed systems.",
    alternativesRejected: [
      "Unanimity (All Nodes Must Agree) - Requires 100% node agreement for decisions. Rejected because single node failure blocks all progress—N-node cluster can tolerate 0 failures. Two-phase commit uses unanimity for atomic transactions, leading to blocking during coordinator failure. Trade-off: perfect consistency but zero availability during failures. Used only when atomicity is absolutely required (distributed transactions), not for general consensus.",
      "Minority Quorum (e.g., 2 of 5) - Requires fewer than majority for decisions. Rejected because enables split-brain: 5-node cluster partitioned into 3+2 can have both sides form quorum (both have 2 nodes), leading to dual leaders. Mathematical flaw: two minority quorums can exist without overlap, violating safety. Some systems use minority quorums for reads (eventual consistency) but never for writes requiring strong consistency.",
      "Supermajority (e.g., 2/3 or 3/4) - Requires more than simple majority. Byzantine Paxos requires 2/3 to tolerate Byzantine (malicious) failures. Rejected for crash-failure systems because reduces fault tolerance: 5-node cluster with 2/3 quorum needs 4 nodes (can only tolerate 1 failure vs 2 with simple majority). Trade-off: handles Byzantine failures but sacrifices availability. Used only when nodes may be malicious (blockchain), not for crash-only failures (typical distributed systems).",
      "Dynamic Quorum (Adjust Based on Available Nodes) - Recalculate majority based on currently reachable nodes rather than total cluster size. Rejected because enables split-brain: 5-node cluster partitions into 3+2; if each partition recalculates majority based on local nodes, both sides have majority (3/3 and 2/2), leading to dual leaders. Safety requires static quorum based on total configured cluster size, not dynamic available nodes.",
      "Leader-Based Quorum (Leader + Any Subset) - Require leader plus any subset of followers. Rejected because doesn't prevent split-brain: if leader becomes partitioned alone, both old leader and new leader (elected by majority in other partition) coexist. Raft and Paxos explicitly reject this, requiring majority acknowledgment from total cluster, not leader-centric quorum.",
      "Even Cluster Sizes (e.g., 4 or 6 nodes) - Deploy even number of nodes. Rejected because wastes fault tolerance: 4-node cluster needs 3-node quorum (same as 3-node cluster) but costs 33% more. 5-node and 4-node both need 3-node quorum, but 5-node tolerates 2 failures vs 4-node's 1 failure. Odd cluster sizes (3, 5, 7) are universally recommended to maximize failures tolerated per quorum size.",
    ],
    mentalModel:
      "Simple majority is like a jury deliberation where 12 jurors must reach consensus. If network partition splits jury into 7+5 groups in separate rooms, only the 7-person group can reach verdict (majority is 7 of 12). The 5-person group cannot render verdict (lacks majority). This prevents two conflicting verdicts—mathematical impossibility for both groups to achieve majority simultaneously. The overlap property: any group of 7 must share members with any other group of 7 (cannot have 14 unique members from 12 total), forcing agreement. In distributed systems, nodes are jurors, decisions are leader elections or log commits, and network partitions are rooms. The majority threshold (7 of 12, 3 of 5, 4 of 7) ensures at most one group can make decisions, preventing split-brain where multiple leaders issue conflicting commands.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "5-Node Cluster"
        N1[Node 1<br/>Candidate]
        N2[Node 2<br/>Voter]
        N3[Node 3<br/>Voter]
        N4[Node 4<br/>Voter]
        N5[Node 5<br/>Offline]
    end

    QC[Quorum Calculator<br/>Majority = floor(5/2)+1 = 3]

    N1 -->|RequestVote| N2
    N1 -->|RequestVote| N3
    N1 -->|RequestVote| N4
    N1 -.->|Unreachable| N5

    N2 -->|VoteGranted| N1
    N3 -->|VoteGranted| N1
    N4 -->|VoteDenied| N1

    N1 -->|Self-vote + 2 votes = 3| QC
    QC -->|3 >= 3 ✓ Majority!| Leader[Node 1 Becomes Leader]

    Leader -->|Heartbeat| N2
    Leader -->|Heartbeat| N3
    Leader -->|Heartbeat| N4

    style N1 fill:#90ee90
    style Leader fill:#3cb371
    style QC fill:#87ceeb
    style N5 fill:#ddd`,
    realWorldAnalogy:
      "Simple majority quorum is like a 5-person board of directors voting to elect a CEO. To become CEO, a candidate must receive votes from 3 directors (majority of 5). If the board splits into two rooms due to miscommunication (3 directors in room A, 2 in room B), only room A can elect a CEO because room B lacks majority (2 < 3). This prevents the company from having two CEOs issuing conflicting orders. The mathematical guarantee: any group of 3 directors from the 5-person board must overlap with any other group of 3 directors—impossible to find two non-overlapping groups of 3 from only 5 people total. This overlap property ensures that if room A elects CEO Alice with votes from directors 1, 2, 3, then room B cannot elect CEO Bob because they only have directors 4 and 5 (need 3 votes). Same principle applies in distributed systems: network partition splits cluster into groups, but only majority group can elect leader, preventing split-brain where multiple leaders exist.",
    useCases: [
      {
        domain: "Distributed Databases",
        scenario:
          "MongoDB replica set with 5 members must elect new primary after current primary crashes. Secondaries detect missing heartbeats and initiate election. Secondary with highest oplog becomes candidate and requests votes from all members. Candidate receives 3 votes (majority of 5) and becomes new primary. Application writes resume with new primary replicating to secondaries.",
        patternRole:
          "Simple majority ensures only one primary is elected even during network partitions, preventing conflicting writes to different primaries that would corrupt data",
        companies: ["MongoDB", "CockroachDB", "TiDB", "YugabyteDB"],
      },
      {
        domain: "Container Orchestration",
        scenario:
          "Kubernetes cluster with 5-node etcd stores all cluster state (pods, services, secrets). When kubectl apply creates deployment, etcd leader replicates entry to followers and waits for 3 acknowledgments (majority) before committing. If 2 etcd nodes crash, remaining 3 nodes maintain quorum—cluster continues operating normally.",
        patternRole:
          "Majority quorum ensures Kubernetes cluster state is durable and consistent, tolerating minority node failures without downtime or data loss",
        companies: ["Google GKE", "AWS EKS", "Azure AKS", "Red Hat OpenShift"],
      },
      {
        domain: "Service Discovery & Coordination",
        scenario:
          "HashiCorp Consul 5-server cluster manages service catalog for microservices. When microservice registers (e.g., payment-service on 10.0.1.50:8080), Consul leader replicates registration to followers. Registration commits only after 3 servers acknowledge (majority). If datacenter network partitions Consul into 3+2 server groups, only 3-server group accepts registrations—2-server group becomes read-only.",
        patternRole:
          "Majority quorum prevents split-brain where two partitions register conflicting service addresses, ensuring applications discover correct service endpoints",
        companies: ["HashiCorp", "Uber", "Cloudflare", "Twitter"],
      },
      {
        domain: "Message Queues & Streaming",
        scenario:
          "Apache Kafka cluster with 7 brokers uses ZooKeeper (5-node ensemble) for controller election. When controller crashes, ZooKeeper conducts election requiring majority votes (3 of 5). Only one broker successfully creates /controller ephemeral node in ZooKeeper. New controller manages partition leadership and replica placement across Kafka cluster.",
        patternRole:
          "Simple majority ensures only one Kafka controller exists, preventing conflicting partition assignments that would cause message loss or duplication",
        companies: ["LinkedIn", "Netflix", "Uber", "Airbnb"],
      },
      {
        domain: "Caching & High Availability",
        scenario:
          "Redis Sentinel deployment with 5 sentinels monitors Redis master. When master becomes unresponsive, sentinels vote on promoting a replica. Failover proceeds only after 3 sentinels (majority) agree on which replica to promote. Promoted replica becomes new master; other replicas reconfigure to follow new master.",
        patternRole:
          "Majority voting prevents split-brain where multiple replicas become master during network partition, ensuring single source of truth for cache data",
        companies: ["GitHub", "Stack Overflow", "Twitter", "Pinterest"],
      },
    ],
  },

  references: [
    {
      title: "In Search of an Understandable Consensus Algorithm (Raft Paper)",
      url: "https://raft.github.io/raft.pdf",
      type: "research-paper",
      author: "Diego Ongaro and John Ousterhout",
    },
    {
      title: "The Part-Time Parliament (Original Paxos Paper)",
      url: "https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf",
      type: "research-paper",
      author: "Leslie Lamport",
    },
    {
      title: "ZooKeeper: Wait-free coordination for Internet-scale systems",
      url: "https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf",
      type: "research-paper",
      author: "Patrick Hunt, Mahadev Konar, Flavio P. Junqueira, Benjamin Reed",
    },
    {
      title: "MongoDB Replica Set Elections Documentation",
      url: "https://www.mongodb.com/docs/manual/core/replica-set-elections/",
      type: "documentation",
      author: "MongoDB Inc.",
    },
    {
      title: "etcd Raft Consensus Documentation",
      url: "https://etcd.io/docs/latest/learning/why/",
      type: "documentation",
      author: "etcd Authors",
    },
    {
      title: "Consul Consensus Protocol",
      url: "https://www.consul.io/docs/architecture/consensus",
      type: "documentation",
      author: "HashiCorp",
    },
    {
      title:
        "Designing Data-Intensive Applications (Chapter 9: Consistency and Consensus)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Kubernetes etcd Best Practices",
      url: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/",
      type: "documentation",
      author: "Kubernetes Authors",
    },
  ],

  tags: [
    "consensus",
    "quorum",
    "distributed-systems",
    "leader-election",
    "split-brain-prevention",
    "raft",
    "paxos",
    "fault-tolerance",
    "majority-voting",
    "replication",
  ],
  difficulty: "advanced",
};
