import type { Pattern } from "../schema";

export const schemaEvolution: Pattern = {
  id: "schema-evolution",
  slug: "schema-evolution",
  corpusPath: "🔗 CONSISTENCY → 🧭 Evolvability → 🔀 Schema Evolution",

  hierarchy: {
    quality: "consistency",
    strategy: "Evolvability",
    family: "Evolvability",
    level: 4,
  },

  concept: {
    name: "Schema Evolution",
    emoji: "🔀",
    tagline: "Change the shape of your data without breaking the code on either side of it",
    definition:
      "Schema evolution is the discipline of changing the shape of your data — the fields in a message, the columns in a table, the structure of an event — without breaking any of the code that reads or writes it. Martin Kleppmann frames it as evolvability: a first-class property of a system, on par with performance or reliability. The central fact is that during any real deployment there is no single instant when 'the code' changes. A rolling upgrade replaces instances one at a time, so old and new code run simultaneously; and data written today by new code may outlive it and be read years later, or be read by an instance that was just rolled back. Because old and new coexist, compatibility must hold in BOTH directions at once. Backward compatibility means new code can read data written by old code (usually easy — the new code knows the old fields). Forward compatibility means old code can read data written by new code (harder — old code must tolerate and ignore fields it has never heard of). Schema evolution is the set of rules and encodings — Avro's writer/reader schema resolution, Protocol Buffers' immutable field tags, expand-and-contract database migrations — that keep both directions true through every change.",
    problemSolved:
      "The naive assumption behind most data bugs is that a schema change is atomic: you alter the shape, and from that moment everything speaks the new shape. Reality is the opposite. Deploys are rolling, so for the whole duration of a rollout some instances run the old code and some the new, reading and writing the same topics and tables. Rollbacks mean yesterday's code may suddenly have to read today's data. Persisted data — rows, event logs, message queues — outlives the code that wrote it. If a change is not compatible in both directions, the failure modes are brutal and silent: an old reader rejects a record it should have skipped, a required field with no default makes historical data unreadable, a reused field tag makes one field's bytes be interpreted as another's, and a lock-taking ALTER TABLE stalls every writer while it rewrites the table. Schema evolution removes these hazards by making every change additive and tolerant, so no moment of the deploy requires old and new code to agree.",
    tradeoffs: {
      pros: [
        "Old and new code interoperate during a rolling deploy — no stop-the-world coordination",
        "Rollbacks are safe: yesterday's code can still read today's data",
        "Persisted data (event logs, rows, queued messages) stays readable long after the writer is gone",
        "A schema registry can reject an incompatible change before it is ever published",
      ],
      cons: [
        "Every change is constrained to be additive and tolerant — you cannot just rename or repurpose a field",
        "Retired field tags/ids are burned forever (must be `reserved`), so the schema accretes scar tissue",
        "Forward compatibility pushes 'ignore what you don't understand' logic into every reader",
        "Removing anything requires the multi-step expand-and-contract dance, not a single migration",
      ],
    },
    relatedPatterns: [
      "normalization",
      "event-sourcing",
      "api-versioning",
      "backward-compatibility",
      "cqrs",
    ],
  },

  structure: {
    participants: [
      {
        name: "Writer's Schema",
        role: "The shape the data was encoded with",
        responsibilities: [
          "Define the fields present at the moment of encoding",
          "Travel with the data, or be referenced by id, so any future reader can resolve it",
        ],
      },
      {
        name: "Reader's Schema",
        role: "The shape the consuming code expects",
        responsibilities: [
          "Declare the fields the current code wants to see",
          "Supply defaults for fields the writer's schema lacks, giving backward compatibility",
        ],
      },
      {
        name: "Field Identifier (tag number / name)",
        role: "The immutable contract that survives change",
        responsibilities: [
          "Map a wire field to a logical field independent of position or order",
          "Be assigned once and never reused for a new meaning — old data still points at the old fact",
        ],
      },
      {
        name: "Schema Registry / Compatibility Checker",
        role: "Gatekeeper on every proposed change",
        responsibilities: [
          "Version schemas centrally and record their compatibility mode (backward/forward/full)",
          "Reject a schema that would break existing readers or writers before it can be published",
        ],
      },
      {
        name: "Rolling Deploy Orchestrator",
        role: "The reason both directions matter",
        responsibilities: [
          "Run old and new instances simultaneously as it replaces them one at a time",
          "Support rollback, so today's writer may be read by yesterday's code",
        ],
      },
    ],
    diagram: `graph TD
    W1[Old code writes v1 data] -->|new code reads it| BC{Backward compatible?<br/>new default fills the missing field}
    W2[New code writes v2 data] -->|old code reads it| FC{Forward compatible?<br/>old code skips the unknown field}
    BC -->|yes: default value| OK[Rolling upgrade is safe:<br/>old + new coexist over the same data]
    FC -->|yes: tolerate + ignore| OK
    OK -->|violate: required field / reused tag| BREAK[Broken deploy:<br/>reject or silently corrupt]`,
    flow: [
      {
        step: 1,
        actor: "Schema Designer",
        action: "Propose an additive change",
        description:
          "Add an optional field with a default and a brand-new tag/name. Do not remove, rename, or retype an existing field — old data and old readers depend on it.",
      },
      {
        step: 2,
        actor: "Compatibility Checker",
        action: "Verify both directions",
        description:
          "The registry (or a CI check) confirms the new schema is backward- AND forward-compatible with the versions still in production; an incompatible change is rejected before publish.",
      },
      {
        step: 3,
        actor: "Rolling Deploy Orchestrator",
        action: "Roll out instance-by-instance",
        description:
          "New code replaces old code one instance at a time. For the whole window, old and new run together over the same topics and tables — this is why both directions had to hold.",
      },
      {
        step: 4,
        actor: "New Code (as reader)",
        action: "Read old data",
        description:
          "A field added in the new schema is absent in old records, so the reader supplies the default. Backward compatibility: new code reads what old code wrote.",
      },
      {
        step: 5,
        actor: "Old Code (as reader)",
        action: "Read new data",
        description:
          "An old instance decodes a record written by a new instance; it does not recognise the new tag, so it skips and ignores it (and ideally preserves it on rewrite). Forward compatibility: old code reads what new code wrote.",
      },
      {
        step: 6,
        actor: "Schema Designer",
        action: "Contract later, never sooner",
        description:
          "Only once no running code and no persisted data reference the old field/column is it finally removed. The tag/name is marked reserved so it can never be reused.",
      },
    ],
    invariants: [
      "A field identifier (protobuf tag / Avro name) is assigned once and never reused for a different meaning",
      "Every added field is optional and carries a default, so records without it still read correctly (backward compatibility)",
      "Unknown fields are tolerated — ignored, and ideally preserved on rewrite — never rejected (forward compatibility)",
      "No change ever requires old and new code to deploy atomically; both compatibility directions hold at once during the rollout",
      "Removal is deferred until nothing (running code or persisted data) references the old shape — expand, then contract",
    ],
  },

  codeExamples: [
    {
      id: "schema-evolution-protobuf-tags",
      language: "go",
      title: "Protobuf field tags: forward + backward compatible (and the wrong moves)",
      description:
        "A v1 message and a v2 that adds an optional field with a new tag. Old code reading v2 skips the unknown tag (forward compat); new code reading v1 falls back to the default (backward compat). Reusing a tag or marking a field required breaks the rolling deploy.",
      runnable: false,
      code: `// Protocol Buffers make the numeric FIELD TAG the contract, not the field name.
// Old and new code run at the SAME TIME during a rolling deploy, so a change
// must be readable in BOTH directions at once.

// ---- v1 of the message (deployed everywhere today) --------------------------
// message User {
//   int64  id    = 1;   // tag 1
//   string email = 2;   // tag 2
// }
type UserV1 struct {
	Id    int64
	Email string
}

// ---- v2: ADD an optional field with a NEW, never-before-used tag -------------
// message User {
//   int64  id       = 1;
//   string email    = 2;
//   string timezone = 3;  // NEW optional field, brand-new tag 3
// }
type UserV2 struct {
	Id       int64
	Email    string
	Timezone string // absent on the wire => zero value ""
}

// FORWARD COMPAT: old (v1) code decoding bytes written by new (v2) code.
// The v1 decoder does not recognise tag 3, so it SKIPS the unknown field
// (protobuf's wire-type tells it exactly how many bytes to jump over).
func decodeAsV1(wire map[int]any) UserV1 {
	return UserV1{
		Id:    wire[1].(int64),
		Email: wire[2].(string),
		// tag 3 present on the wire? ignored. Old code keeps working.
	}
}

// BACKWARD COMPAT: new (v2) code decoding bytes written by old (v1) code.
// Tag 3 is simply absent, so the field takes its default. The default IS
// the compatibility mechanism.
func decodeAsV2(wire map[int]any) UserV2 {
	u := UserV2{Id: wire[1].(int64), Email: wire[2].(string)}
	if tz, ok := wire[3]; ok {
		u.Timezone = tz.(string)
	}
	return u // absent tag 3 -> "" ; still a valid User.
}

// ---- ❌ THE WRONG MOVES that break a rolling deploy --------------------------
// 1) REUSING a retired tag number for a new meaning:
//    string timezone = 2;   // tag 2 used to be \`email\`
//    Old code reads the new timezone bytes AS an email -> silent corruption.
//    Fix: never reuse a tag; mark it \`reserved 2;\` so it can't come back.
//
// 2) Making the new field REQUIRED:
//    required string timezone = 3;
//    Old data (and old writers) have no tag 3 -> new readers REJECT valid
//    records, and \`required\` can never be safely removed later. Always optional.`,
    },
    {
      id: "schema-evolution-expand-contract",
      language: "python",
      title: "Expand-and-contract: evolve a live column under a rolling deploy",
      description:
        "The parallel-change choreography for renaming/splitting a column without a lock-taking ALTER: add a nullable column, dual-write, backfill in batches, switch reads, stop writing the old column, then drop it. Every step is annotated with why it is safe while old and new code run together.",
      runnable: false,
      code: `# Expand-and-Contract (parallel change): evolve a live database column WITHOUT
# a lock-taking, all-at-once ALTER, while old and new app code run together
# during the rolling deploy. Each step is independently deployable and
# reversible; no single step requires old and new code to agree.
#
# Migration goal: replace the \`name\` column with a renamed \`full_name\`, safely.

def step_1_expand_add_nullable_column(db):
    # SAFE under rolling deploy: adds a NULLABLE column with no backfill.
    # Old code never touches \`full_name\`; the new column is invisible to it.
    db.execute("ALTER TABLE users ADD COLUMN full_name TEXT NULL")
    # (A NOT NULL column with no default here would reject old-code inserts.)

def step_2_deploy_dual_writing_code(app):
    # SAFE: new code writes BOTH columns; old code (still running) writes only
    # \`name\`. Every reader still reads \`name\`, so nothing yet depends on the new.
    def on_write(user):
        user["name"] = user["full_name"]       # keep the old column honest
        user["full_name"] = user["full_name"]  # populate the new column too
    app.register_writer(on_write)

def step_3_backfill_in_batches(db):
    # SAFE: copy historical rows in small batches to avoid a long lock / bloat.
    # Resumable and interruptible — never one giant UPDATE that stalls writers.
    last_id = 0
    while True:
        rows = db.execute(
            "SELECT id FROM users WHERE full_name IS NULL AND id > %s "
            "ORDER BY id LIMIT 1000", (last_id,))
        if not rows:
            break
        db.execute("UPDATE users SET full_name = name WHERE id = ANY(%s)",
                   ([r.id for r in rows],))
        last_id = rows[-1].id

def step_4_switch_reads_to_new_column(app):
    # SAFE: now that every row has \`full_name\`, flip readers over. Writers still
    # dual-write, so a rollback to old (name-reading) code is still correct.
    app.set_read_column("full_name")

def step_5_stop_writing_old_column(app):
    # SAFE only AFTER step 4 is fully rolled out: no reader depends on \`name\`.
    app.stop_writing("name")

def step_6_contract_drop_old_column(db):
    # FINAL, hard-to-reverse: only once NO running code reads or writes \`name\`.
    # Doing this earlier would break any old instance still left in the fleet.
    db.execute("ALTER TABLE users DROP COLUMN name")

# The invariant across every step: at no instant do old and new code need to
# agree. That is what makes each deploy safe to roll forward OR back.
SAFETY = {
    "expand":     "additive + nullable -> old code unaffected",
    "dual_write": "both columns true -> readers may use either",
    "backfill":   "batched + resumable -> no long lock",
    "switch":     "reads move, writers still dual -> rollback safe",
    "contract":   "drop old -> ONLY after nothing references it",
}`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "The serialization boundary between services — message/event payloads on a queue or RPC wire that many independently-deployed services encode and decode",
      "The database schema of a system-of-record that a fleet of mixed old/new application instances reads and writes during rolling deploys",
    ],
    interactsWith: [
      "Schema registries (Confluent Schema Registry) that version schemas and enforce compatibility on producers",
      "CI/CD rolling-deploy orchestrators (Kubernetes rolling updates, blue/green) that create the old+new coexistence window",
      "Migration tools and CDC pipelines that carry a schema change from the write model into downstream read models",
    ],
    architecturalBoundaries: [
      "Producer vs consumer: independently deployed, so neither can assume the other has upgraded",
      "Code lifetime vs data lifetime: persisted data outlives the code, so a reader years from now must still resolve an old writer's schema",
    ],
  },

  implementations: [
    {
      id: "apache-avro",
      name: "Apache Avro (+ Confluent Schema Registry)",
      type: "library",
      languages: ["java", "python", "go", "c"],
      description:
        "Resolves a writer's schema against a reader's schema at read time, matching fields by NAME (no tag numbers); adding or removing a field that has a default is both backward- and forward-compatible. The Confluent Schema Registry versions schemas and enforces a configurable compatibility mode (BACKWARD / FORWARD / FULL) on every producer.",
      links: { docs: "https://avro.apache.org/docs/current/specification/" },
    },
    {
      id: "protocol-buffers",
      name: "Protocol Buffers",
      type: "library",
      languages: ["go", "java", "python", "typescript", "c++"],
      description:
        "Numeric field TAGS are the contract: add a new tag freely (old code skips unknown tags = forward compat), never reuse a retired tag (mark it `reserved`), and prefer optional/singular over `required` — proto3 dropped `required` precisely because it cannot be safely evolved.",
      links: { docs: "https://protobuf.dev/programming-guides/proto3/#updating" },
    },
    {
      id: "apache-thrift",
      name: "Apache Thrift",
      type: "framework",
      languages: ["java", "python", "go", "c++"],
      description:
        "Like protobuf, uses numeric field ids as the contract: adding a new optional field id is compatible in both directions, while changing or reusing an id breaks readers; `required` fields are the same trap and should be avoided in evolving schemas.",
      links: { docs: "https://thrift.apache.org/docs/idl" },
    },
    {
      id: "gh-ost",
      name: "gh-ost (online schema migration)",
      type: "library",
      languages: ["go"],
      description:
        "Performs a lock-free ALTER on MySQL by copying to a shadow table and cutting over, so a schema change does not stall writes — the operational half of expand-and-contract, letting the DDL itself happen under live traffic.",
      links: { docs: "https://github.com/github/gh-ost" },
    },
    {
      id: "alembic",
      name: "Alembic (SQLAlchemy migrations)",
      type: "library",
      languages: ["python"],
      description:
        "Versioned, reversible migration scripts (upgrade/downgrade) that let you express the expand-and-contract steps as ordered, individually-deployable revisions rather than one all-at-once change.",
      links: { docs: "https://alembic.sqlalchemy.org/en/latest/" },
    },
    {
      id: "prisma-migrate",
      name: "Prisma Migrate",
      type: "library",
      languages: ["typescript"],
      description:
        "Declarative schema diffing generates ordered SQL migrations; combined with application-level dual-writes it supports the expand/contract choreography needed to evolve a schema safely across a rolling deploy.",
      links: { docs: "https://www.prisma.io/docs/orm/prisma-migrate" },
    },
  ],

  usedInSystems: [
    {
      systemId: "kafka-schema-registry",
      systemName: "Kafka event-streaming platform with a schema registry",
      howUsed:
        "Every topic's records are Avro/Protobuf encoded and registered; the registry enforces a compatibility mode so a producer literally cannot publish a schema that would break existing consumers. Because consumers deploy independently and events are retained for days, a new field must be forward-compatible (old consumers skip it) and old events must stay readable (backward-compatible) — schema evolution is a hard gate, not a convention.",
    },
    {
      systemId: "rolling-fleet",
      systemName: "Large service fleet on rolling deploys sharing a message/DB schema",
      howUsed:
        "During a rollout across thousands of instances, old and new pods serve traffic simultaneously and read/write the same database and RPC messages. Changes ship as additive optional fields and expand-and-contract migrations so any pair of old/new instances interoperate, and a rollback never encounters data it cannot read.",
    },
  ],

  philosophy: {
    coreProblem:
      "There is no atomic moment when 'the code' changes. During every rolling deploy old and new code run at the same time over the same data, and persisted data outlives the code that wrote it — so a change that is safe in only one direction will be read wrong by half the fleet.",
    designPrinciple:
      "Make every change additive and tolerant. Add optional fields with defaults; never remove or repurpose an existing field's identifier; tolerate (and ideally preserve) fields you don't recognise. Guarantee both backward and forward compatibility so no deploy step requires old and new code to be in lockstep, and defer every removal until nothing references the old shape — expand, then contract.",
    historicalContext:
      "Martin Kleppmann's Designing Data-Intensive Applications (Ch. 4, 'Encoding and Evolution') crystallised evolvability as a first-class system property, contrasting Avro, Protocol Buffers, and Thrift by exactly how each handles adding and removing fields; the schema-registry pattern grew up around Kafka to enforce these rules at publish time.",
    alternativesRejected: [
      "Coordinated big-bang deploys (stop the world, migrate, restart everything) — impossible at scale, and defeated by any rollback or any persisted historical data",
      "`required` fields and reused tag numbers as a way to 'tighten' a schema — they make old data unreadable and can never be safely removed",
      "A schemaless free-for-all with no compatibility checks — flexible, but it pushes the entire evolution burden into fragile, untested application code",
    ],
    mentalModel:
      "Evolving a schema is like renovating a house while the family still lives in it. You never tear out the only staircase and then build the new one — you build the new staircase first, move everyone's traffic onto it, and only then remove the old one. At every moment there is a working path for both the people who know the new layout and the people who still know the old.",
  },

  references: [
    {
      title: "Designing Data-Intensive Applications — Ch. 4 (Encoding and Evolution)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Apache Avro Specification — Schema Resolution",
      url: "https://avro.apache.org/docs/current/specification/",
      type: "documentation",
    },
    {
      title: "Protocol Buffers — Updating a Message Type",
      url: "https://protobuf.dev/programming-guides/proto3/#updating",
      type: "documentation",
    },
  ],

  tags: [
    "schema",
    "evolution",
    "compatibility",
    "serialization",
    "protobuf",
    "avro",
    "kleppmann",
    "rolling-deploy",
    "migrations",
  ],

  difficulty: "intermediate",
};
