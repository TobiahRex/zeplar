import type { Pattern } from "../schema";

export const fencingTokens: Pattern = {
  id: "fencing-tokens",
  slug: "fencing-tokens",
  corpusPath: "🔗 CONSISTENCY → 🛡️ Coordination → 🔑 Fencing Tokens",

  hierarchy: {
    quality: "consistency",
    strategy: "Distributed Coordination",
    family: "Coordination",
    level: 5,
  },

  concept: {
    name: "Fencing Tokens",
    emoji: "🔑",
    tagline: "A monotonically increasing token that stops a stale leader from writing",
    definition:
      "A fencing token is a monotonically increasing number that a lock or lease service returns every time it grants exclusive access, and that every subsequent write to the protected resource must carry. Popularized by Martin Kleppmann in Designing Data-Intensive Applications, it is the mechanism that turns an unsafe distributed lock into a safe one. The lock service guarantees only one property about the token: it strictly increases with each grant, so no two holders ever see the same number and a later holder always sees a larger one. The protected resource — the storage system, database, or file being guarded — remembers the highest token it has ever accepted and rejects any write whose token is less than or equal to that high-water mark. Correctness therefore does not rest on synchronized clocks, on bounded network delay, or on clients being well-behaved; it rests on a single monotonic comparison performed at the resource itself. Fencing is the answer to the question 'how does a lock stay safe when the process holding it can be paused for an unbounded amount of time?'",
    problemSolved:
      "Distributed locks built on leases are unsafe against process pauses, and no timeout can fix that. The canonical failure: a client acquires a lease from a lock service, then stalls — a stop-the-world garbage-collection pause, a long scheduler preemption, or a network partition — for longer than the lease duration. The lease expires and the service, correctly, grants the lock to a second client. Now the first client wakes up with no idea that any time has passed, still believing it is the sole leader, and issues a write to the shared resource. Two clients now think they hold the lock: split brain. The stale write corrupts data that the new leader already owns. You cannot prevent this with longer timeouts, because you cannot put an upper bound on how long a process might be paused. Fencing tokens solve it structurally: the stale writer is carrying an old, lower token, and the resource simply refuses it.",
    tradeoffs: {
      pros: [
        "Safety no longer depends on the honor system — a paused or partitioned client cannot corrupt the resource",
        "Correctness is independent of clock synchronization and of any bound on network or pause duration",
        "The enforcement is a single monotonic comparison at the resource — cheap and easy to reason about",
        "Fencing composes with any lock service that can emit a monotonic number (ZooKeeper zxid, etcd revision, a DB sequence)",
        "Turns 'mostly works' locking into provably safe locking for correctness-critical writes",
      ],
      cons: [
        "The protected resource MUST participate — it has to store a high-water mark and check every write; a resource that can't be modified can't be fenced",
        "Every write path must thread the token through, which touches the API of the storage layer",
        "It only protects a single, coherent resource that can enforce ordering — fanning one logical write across N independent stores reintroduces the gap",
        "Tokens must be sourced from a genuinely monotonic authority; a naive 'increment a counter' that isn't crash-safe can hand out duplicates",
        "It does not make the lock itself more available — it only makes the writes it guards safe",
      ],
    },
    relatedPatterns: [
      "leader-election",
      "distributed-lock",
      "consensus",
      "lease",
      "optimistic-locking",
    ],
  },

  structure: {
    participants: [
      {
        name: "Lock / Lease Service",
        role: "Grantor of exclusive access",
        responsibilities: [
          "Grant the lock to at most one holder at a time (mutual exclusion)",
          "Stamp every grant with a fencing token that strictly increases across grants",
        ],
      },
      {
        name: "Fencing Token",
        role: "Monotonic proof of grant order",
        responsibilities: [
          "Increase strictly on each grant so a later holder always carries a larger number",
          "Travel with every write the holder issues to the protected resource",
        ],
      },
      {
        name: "Client (Lease Holder)",
        role: "Would-be leader that may pause",
        responsibilities: [
          "Attach its current token to every mutating request",
          "Tolerate being fenced off — it cannot be trusted to notice its own lease expired",
        ],
      },
      {
        name: "Protected Resource",
        role: "The enforcement point",
        responsibilities: [
          "Remember the highest fencing token it has ever accepted (a high-water mark)",
          "Reject any write whose token is less than or equal to that high-water mark",
        ],
      },
      {
        name: "Coordination Store (token source)",
        role: "Origin of the monotonic number",
        responsibilities: [
          "Expose a crash-safe, strictly increasing value (zxid, mod_revision, ModifyIndex, or a SEQUENCE)",
          "Never hand out the same or a smaller value after a restart or failover",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant A as Client A (old leader)
    participant L as Lock Service
    participant B as Client B (new leader)
    participant R as Resource (storage)
    A->>L: acquire lock
    L-->>A: granted, token = 33
    Note over A: GC pause / partition —<br/>lease expires while frozen
    B->>L: acquire lock
    L-->>B: granted, token = 34
    B->>R: write(token=34, data)
    R-->>B: OK — 34 > high-water 0
    Note over R: high-water mark = 34
    A->>R: write(token=33, stale data)
    R-->>A: REJECTED — 33 <= 34 (fenced)`,
    flow: [
      {
        step: 1,
        actor: "Client A",
        action: "Acquire",
        description:
          "Client A asks the lock service for the lock and receives it, stamped with fencing token 33.",
      },
      {
        step: 2,
        actor: "Client A",
        action: "Pause (unbounded)",
        description:
          "A suffers a stop-the-world GC pause or a network partition. Its lease expires while it is frozen; A has no idea any time has passed.",
      },
      {
        step: 3,
        actor: "Lock Service",
        action: "Re-grant",
        description:
          "Seeing the lease expire, the service grants the lock to Client B and stamps it with token 34 — strictly greater than 33.",
      },
      {
        step: 4,
        actor: "Client B",
        action: "Write (accepted)",
        description:
          "B writes to the resource carrying token 34. The resource raises its high-water mark to 34 and applies the write.",
      },
      {
        step: 5,
        actor: "Client A",
        action: "Stale write",
        description:
          "A finally wakes, still believing it is the leader, and issues a write carrying its stale token 33.",
      },
      {
        step: 6,
        actor: "Protected Resource",
        action: "Fence",
        description:
          "The resource compares 33 against its high-water mark 34, sees 33 ≤ 34, and rejects the write. Split brain is averted with zero corruption.",
      },
    ],
    invariants: [
      "Every grant returns a token strictly greater than every prior grant (global monotonicity)",
      "Every write to the protected resource carries the token from the grant that authorized it",
      "The resource applies a write only if its token strictly exceeds the highest token already applied — the high-water mark never regresses",
      "The token check is enforced AT THE RESOURCE, never merely trusted at the client",
      "Safety holds regardless of clock skew, network delay, or how long any client is paused",
    ],
  },

  codeExamples: [
    {
      id: "fencing-tokens-split-brain-guard",
      language: "typescript",
      title: "The split-brain sequence, and the fence that stops it",
      description:
        "A lock service hands out a strictly increasing token on every grant; the protected resource remembers the highest token it has accepted and rejects anything ≤ that. Client A gets token 33 and pauses; B gets 34 and writes; A wakes and writes with 33 → REJECTED.",
      runnable: false,
      code: `// A lock service that returns a fencing token with every grant. The ONLY
// guarantee it makes about the token is that it strictly increases per grant.
// Safety does not depend on clocks or on the client behaving well.
class LockService {
  // Pretend 32 grants have already happened, so the next token is 33.
  private tokenCounter = 32;
  private heldBy: string | null = null;

  acquire(clientId: string): number {
    this.tokenCounter += 1; // monotonic: 33, 34, 35, ...
    this.heldBy = clientId;
    return this.tokenCounter; // the fencing token
  }
}

// The resource being protected is the ENFORCEMENT POINT. It remembers the
// highest token it has ever accepted and rejects anything <= that. A client
// checking its own token would be no protection at all — the check must live
// here, where the write actually lands.
class Resource {
  private highestToken = 0;
  private data: string | null = null;

  write(token: number, payload: string): void {
    if (token <= this.highestToken) {
      throw new Error(
        \`FENCED: token \${token} <= highest accepted \${this.highestToken}\`,
      );
    }
    this.highestToken = token; // ratchet forward — never backward
    this.data = payload;
  }
}

// ---- The split-brain sequence that fencing makes safe -------------------
const lock = new LockService();
const storage = new Resource();

// Client A acquires the lock and gets token 33.
const tokenA = lock.acquire("A"); // -> 33

// Client A now suffers a stop-the-world GC pause. Its lease expires while it
// is frozen; it has NO idea that any time has passed.

// The lock service, seeing the lease expire, grants the lock to Client B.
const tokenB = lock.acquire("B"); // -> 34

// Client B does its work and writes with its fresh token. Accepted.
storage.write(tokenB, "written-by-B"); // OK: 34 > 0

// Client A finally wakes up. It STILL believes it holds the lock and issues
// its write with the stale token 33. The resource fences it off.
try {
  storage.write(tokenA, "written-by-A-stale");
} catch (err) {
  console.log((err as Error).message); // FENCED: token 33 <= highest accepted 34
}

// Split brain averted: two clients believed they were leader, but only the
// holder of the highest token could mutate the resource.
export { LockService, Resource };`,
    },
    {
      id: "fencing-tokens-real-monotonic-source",
      language: "python",
      title: "Sourcing the token from a real coordination primitive (Postgres / etcd)",
      description:
        "In production you rarely hand-roll the counter — you borrow a monotonic version a coordination system already maintains: a Postgres SEQUENCE, etcd's mod_revision, or a ZooKeeper zxid. The guard is a compare-and-set in the resource's own WHERE clause.",
      runnable: false,
      code: `# In production you rarely hand-roll the counter — you borrow a monotonic
# version that a coordination system already maintains for free:
#   - ZooKeeper: the zxid, or a znode's cversion
#   - etcd:      the key's mod_revision (or a lease attached to a revision)
#   - Postgres:  a SEQUENCE, or a row's version column bumped under lock
# The fencing rule is identical: carry the version on every write, and let
# the RESOURCE reject any version <= the highest it has already applied.

import psycopg2


def acquire_token(conn) -> int:
    # etcd analogue: resp.header.revision / kv.mod_revision after a Txn.
    # Here a Postgres SEQUENCE gives us a crash-safe, strictly increasing token.
    with conn.cursor() as cur:
        cur.execute("SELECT nextval('fencing_token_seq')")
        return cur.fetchone()[0]


def guarded_write(conn, resource_id: int, token: int, payload: str) -> bool:
    # The enforcement lives in the WHERE clause: the row stores the highest
    # token it has accepted, and the UPDATE only lands if our token beats it.
    # This is a compare-and-set — atomic, and safe against a paused writer.
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE protected_resource
               SET data = %s,
                   fencing_token = %s
             WHERE id = %s
               AND fencing_token < %s   -- reject stale (<=) writers
            """,
            (payload, token, resource_id, token),
        )
        applied = cur.rowcount == 1
    conn.commit()
    return applied  # False => we were fenced off by a newer leader


# ---- Split brain, enforced by the database -------------------------------
conn = psycopg2.connect("dbname=app")

token_a = acquire_token(conn)  # e.g. 33
# ... client A pauses (GC / partition); its lease expires ...
token_b = acquire_token(conn)  # e.g. 34

assert guarded_write(conn, 1, token_b, "by-B") is True    # 34 applied
assert guarded_write(conn, 1, token_a, "by-A") is False   # 33 fenced off

# The stale write from A changed ZERO rows. Correctness did not depend on A
# noticing that its lease had expired — the resource refused it unconditionally.`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Between a distributed lock/lease service and the shared resource that lock is meant to protect",
      "On the write path of any single-leader system where a deposed leader could still try to write",
    ],
    interactsWith: [
      "Lock / coordination services (ZooKeeper, etcd, Consul, Chubby) that emit the monotonic token",
      "The storage or database layer that must enforce the token check on every mutating request",
      "Leader-election machinery that produces a new leader (and thus a higher token) on failover",
    ],
    architecturalBoundaries: [
      "The trust boundary sits at the resource, not the client — the client is assumed untrustworthy (it may be paused)",
      "The token source (coordination store) is separate from the enforcement point (protected resource); both must cooperate",
    ],
  },

  implementations: [
    {
      id: "zookeeper",
      name: "Apache ZooKeeper",
      type: "service",
      languages: ["java", "go", "python"],
      description:
        "Kleppmann's canonical fencing source. Each ZooKeeper transaction has a globally monotonic zxid, and every znode carries a cversion; either can be used as the fencing token attached to a lock's ephemeral/sequential znode, then checked at the resource.",
      links: {
        docs: "https://zookeeper.apache.org/doc/current/recipes.html#sc_recipes_Locks",
      },
    },
    {
      id: "etcd",
      name: "etcd",
      type: "service",
      languages: ["go", "python", "java"],
      description:
        "Every key has a mod_revision drawn from a cluster-wide, strictly increasing revision counter. A lock acquired via a lease can carry that revision as its fencing token; a guarded write conditions on it via a transaction (Txn/compare).",
      links: {
        docs: "https://etcd.io/docs/latest/learning/api/#key-value-pair",
      },
    },
    {
      id: "consul",
      name: "HashiCorp Consul",
      type: "service",
      languages: ["go", "python", "java"],
      description:
        "Sessions provide the lock; every KV entry exposes a monotonically increasing ModifyIndex (backed by the Raft log index) that serves as the fencing token, enabling check-and-set (cas) writes gated on the index.",
      links: {
        docs: "https://developer.hashicorp.com/consul/docs/dynamic-app-config/sessions",
      },
    },
    {
      id: "chubby",
      name: "Google Chubby",
      type: "service",
      languages: ["go", "java"],
      description:
        "The lock service that inspired the pattern: Chubby issues 'sequencers' — an opaque token describing a lock's state that a client passes to a protected server, which validates it before acting. This is fencing by another name, predating the DDIA framing.",
      links: {
        docs: "https://research.google/pubs/pub27897/",
      },
    },
    {
      id: "redis-redlock",
      name: "Redis Redlock",
      type: "library",
      languages: ["typescript", "python", "java", "go"],
      description:
        "A widely used distributed-lock algorithm — but per Kleppmann's critique it does NOT return a fencing token and relies on timing assumptions, so it cannot make writes safe against process pauses. For correctness-critical locking it must be paired with an external monotonic token; on its own it is unsafe.",
      links: {
        docs: "https://redis.io/docs/latest/develop/use/patterns/distributed-locks/",
      },
    },
    {
      id: "object-store-preconditions",
      name: "Cloud Object Store / DB Sequence (enforcement point)",
      type: "platform",
      languages: ["go", "python", "typescript"],
      description:
        "The resource where the check actually lives. Google Cloud Storage's object generation preconditions (x-goog-if-generation-match), S3 conditional writes, or a relational SEQUENCE + conditional UPDATE all let the storage layer reject a stale-token write atomically — turning the store itself into the fence.",
      links: {
        docs: "https://cloud.google.com/storage/docs/request-preconditions",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "distributed-lock-object-storage",
      systemName: "Distributed lock guarding writes to shared object storage",
      howUsed:
        "A client takes a lock to become the sole writer of a file in shared storage (HDFS-style / an S3 or GCS lease). Each grant carries a fencing token; the storage layer records the highest token per object and refuses a write from a paused old holder whose token is now stale — exactly the DDIA example.",
      source: "Designing Data-Intensive Applications, Ch. 8",
    },
    {
      systemId: "single-leader-failover",
      systemName: "Single-leader failover (fencing off the deposed leader)",
      howUsed:
        "When a new primary is elected, it receives a higher epoch/term (its fencing token). Followers and the shared datastore accept writes only from the highest epoch, so a previously partitioned old primary that returns is fenced off and cannot resurrect stale state — the mechanism behind Raft/Paxos leader terms and DB failover epochs.",
    },
  ],

  philosophy: {
    coreProblem:
      "A lock is only as safe as the assumption that its holder is still alive and still the holder. That assumption breaks the instant a process can be paused for an unbounded time (GC, scheduling, partition): the lease expires, someone else takes the lock, and the paused process wakes up and writes as if nothing happened. Timeouts cannot close this gap because no timeout can bound a pause.",
    designPrinciple:
      "Do not trust the holder — make the resource enforce order. Every grant carries a strictly increasing token; the resource accepts a write only if its token beats the highest it has already applied. Push the safety check to the thing being protected, so correctness depends on a monotonic comparison rather than on clocks, network timing, or a well-behaved client.",
    historicalContext:
      "Google's Chubby (2006) issued 'sequencers' that protected servers validated — fencing before the name existed. Martin Kleppmann crystallized and named the pattern in 'How to do distributed locking' (2016, the Redlock critique) and in Designing Data-Intensive Applications (2017), where 'fencing tokens' became the standard framing.",
    alternativesRejected: [
      "Longer lease timeouts — a bigger timeout only makes the race rarer, never impossible, because pauses have no upper bound",
      "Client-side token checks — a client that is paused or partitioned cannot be trusted to police itself; the check must live at the resource",
      "Redlock-style timing algorithms without a fencing token — Kleppmann shows they cannot be safe for correctness-critical writes",
      "Assuming synchronized clocks — clock skew and NTP jumps make time an unreliable basis for mutual exclusion",
    ],
    mentalModel:
      "Think of the bank teller's 'now serving' counter. Every customer takes a ticket with a strictly higher number, and the counter only ever moves forward. If you wandered off holding ticket 33 and the display now reads 34, you are simply turned away — no matter how long you were gone, no matter how sure you are it's your turn. The teller (the resource) enforces the order; your ticket alone proves nothing.",
  },

  references: [
    {
      title: "How to do distributed locking (the Redlock critique)",
      url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html",
      type: "article",
      author: "Martin Kleppmann",
    },
    {
      title:
        "Designing Data-Intensive Applications — Ch. 8 (The Trouble with Distributed Systems): Fencing tokens",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "ZooKeeper Recipes — Locks",
      url: "https://zookeeper.apache.org/doc/current/recipes.html#sc_recipes_Locks",
      type: "documentation",
    },
  ],

  tags: [
    "distributed-systems",
    "coordination",
    "distributed-lock",
    "fencing",
    "split-brain",
    "consistency",
    "kleppmann",
    "leader-election",
  ],

  difficulty: "advanced",
};
