import type { Pattern } from "../schema";

export const normalization: Pattern = {
  id: "normalization",
  slug: "normalization",
  corpusPath: "🔗 CONSISTENCY → 🗄️ Data Modeling → 🧬 Normalization",

  hierarchy: {
    quality: "consistency",
    strategy: "Data Modeling",
    family: "Normalization",
    level: 4,
  },

  concept: {
    name: "Normalization",
    emoji: "🧬",
    tagline: "One fact, one place",
    definition:
      "Normalization is the discipline of structuring a relational schema so that every fact is represented exactly once. Formalized by E. F. Codd alongside the relational model, it decomposes tables into progressively stricter forms — 1NF (atomic columns, no repeating groups), 2NF (no non-key attribute depends on only part of a composite key), 3NF (no non-key attribute depends on another non-key attribute), and BCNF (every determinant is a candidate key) — each removing a class of redundancy. The organizing idea is the functional dependency: an attribute should depend on the key, the whole key, and nothing but the key. When that holds, a fact such as a customer's address lives in exactly one row; changing it is a single write, and no two copies can disagree. Normalization trades read locality (related data must be re-joined) for write integrity (there is nothing to keep in sync). It is the default posture for an OLTP system of record, where correctness of writes matters more than the cost of a join.",
    problemSolved:
      "Redundant data is the root cause of a family of update, insertion, and deletion anomalies that silently corrupt a database over time. If a customer's city is copied onto every one of their order rows, moving that customer requires updating N rows atomically; miss one and the database now holds two contradictory 'truths' with no way to tell which is right (update anomaly). If the only place a fact can be recorded is alongside another fact, you cannot record it independently — you cannot register a product with no orders yet (insertion anomaly). And deleting the last row that happens to carry a fact destroys that fact entirely — cancel a customer's only order and you lose their address (deletion anomaly). Normalization removes the redundancy that makes these anomalies possible, so the schema itself enforces 'one fact, one place' rather than relying on application code to keep duplicates honest.",
    tradeoffs: {
      pros: [
        "Eliminates update/insertion/deletion anomalies — a fact has exactly one home",
        "Writes are single-row and cannot leave copies inconsistent",
        "Referential integrity is enforced by the schema (foreign keys), not by app code",
        "Smaller storage footprint — no duplicated columns across rows",
      ],
      cons: [
        "Reads must re-join related tables, which costs latency at scale",
        "Deeply normalized schemas can require many joins for a single view",
        "Analytical / read-heavy workloads often need a denormalized copy anyway",
        "Over-normalization can obscure the domain and slow the hottest queries",
      ],
    },
    relatedPatterns: [
      "cqrs",
      "event-sourcing",
      "cache-aside",
      "read-replicas",
      "materialized-view",
      "denormalization",
    ],
  },

  structure: {
    participants: [
      {
        name: "Relation (Table)",
        role: "Container of one entity type",
        responsibilities: [
          "Hold rows about a single kind of thing",
          "Expose a primary key that uniquely identifies each row",
        ],
      },
      {
        name: "Functional Dependency",
        role: "Correctness constraint",
        responsibilities: [
          "Assert that attribute B is determined by attribute A (A → B)",
          "Drive which columns may coexist in a table without redundancy",
        ],
      },
      {
        name: "Candidate Key",
        role: "Determinant of every fact in the row",
        responsibilities: [
          "Uniquely identify a row",
          "Be the only thing non-key attributes are allowed to depend on (BCNF)",
        ],
      },
      {
        name: "Foreign Key",
        role: "Re-linker across decomposed tables",
        responsibilities: [
          "Reference the primary key of a related table",
          "Enforce referential integrity so decomposition stays lossless",
        ],
      },
    ],
    diagram: `graph TD
    A[Unnormalized: one wide table<br/>with repeating + duplicated columns] -->|remove repeating groups,<br/>atomic columns| B[1NF]
    B -->|remove partial<br/>key dependencies| C[2NF]
    C -->|remove transitive<br/>non-key dependencies| D[3NF]
    D -->|every determinant<br/>is a candidate key| E[BCNF]
    E -->|re-link via<br/>foreign keys| F[Lossless join back<br/>to the original view]`,
    flow: [
      {
        step: 1,
        actor: "Schema Designer",
        action: "Reach 1NF",
        description:
          "Make every column atomic and remove repeating groups (no comma-lists, no order_item_1/order_item_2 columns).",
      },
      {
        step: 2,
        actor: "Schema Designer",
        action: "Reach 2NF",
        description:
          "On tables with a composite key, move attributes that depend on only part of the key into their own table.",
      },
      {
        step: 3,
        actor: "Schema Designer",
        action: "Reach 3NF",
        description:
          "Remove transitive dependencies — a non-key attribute that depends on another non-key attribute moves to its own table.",
      },
      {
        step: 4,
        actor: "Schema Designer",
        action: "Reach BCNF",
        description:
          "Ensure every determinant is a candidate key; split any table where a non-key attribute determines another.",
      },
      {
        step: 5,
        actor: "Foreign Key",
        action: "Re-link",
        description:
          "Add foreign keys so the decomposed tables join back losslessly to the original view.",
      },
      {
        step: 6,
        actor: "Query Planner",
        action: "Reconstruct on read",
        description:
          "Reassemble the denormalized view on demand via joins; where that join is too hot, a deliberate denormalized read model (CQRS / materialized view) is introduced with an explicit reconciliation mechanism.",
      },
    ],
    invariants: [
      "Every non-key attribute depends on the key, the whole key, and nothing but the key",
      "Each fact is stored in exactly one place (no derivable column is also stored raw without a reconciliation mechanism)",
      "Decomposition is lossless — the original view is recoverable by joining on foreign keys",
      "Referential integrity holds: every foreign key references an existing primary key",
    ],
  },

  codeExamples: [
    {
      id: "normalization-anomaly-vs-normalized",
      language: "typescript",
      title: "The anomaly, and the fix (denormalized → 3NF)",
      description:
        "A denormalized orders table copies the customer's city onto every order, enabling an update anomaly; the normalized schema stores each fact once and re-links with a foreign key.",
      runnable: false,
      code: `// ❌ DENORMALIZED — the customer's city is copied onto every order row.
// Moving a customer means updating N rows atomically; miss one and the
// database holds two contradictory cities with no way to say which is right.
const denormalized = \`
  CREATE TABLE orders (
    order_id      BIGINT PRIMARY KEY,
    customer_id   BIGINT NOT NULL,
    customer_name TEXT   NOT NULL,   -- duplicated on every order
    customer_city TEXT   NOT NULL,   -- duplicated on every order  ← the anomaly
    total_cents   BIGINT NOT NULL
  );
\`;

// A single logical change ("the customer moved to Berlin") is now an
// N-row write that MUST be atomic — the classic UPDATE ANOMALY:
const updateAnomaly = \`
  UPDATE orders SET customer_city = 'Berlin' WHERE customer_id = 42;
  -- if this touches 999 of 1000 rows, the DB now disagrees with itself.
\`;

// ✅ NORMALIZED (3NF) — the city is a fact about the CUSTOMER, so it lives
// once, on the customer. Orders reference it by foreign key.
const normalized = \`
  CREATE TABLE customers (
    customer_id BIGINT PRIMARY KEY,
    name        TEXT   NOT NULL,
    city        TEXT   NOT NULL          -- one fact, one place
  );

  CREATE TABLE orders (
    order_id     BIGINT PRIMARY KEY,
    customer_id  BIGINT NOT NULL REFERENCES customers(customer_id),
    total_cents  BIGINT NOT NULL
  );
\`;

// The move is now a SINGLE-ROW write — nothing can fall out of sync:
const singleWrite = \`
  UPDATE customers SET city = 'Berlin' WHERE customer_id = 42;
\`;

// The denormalized view is reconstructed on read via a lossless join:
const readView = \`
  SELECT o.order_id, c.name, c.city, o.total_cents
  FROM   orders o
  JOIN   customers c ON c.customer_id = o.customer_id;
\`;

export { denormalized, updateAnomaly, normalized, singleWrite, readView };`,
    },
    {
      id: "normalization-deliberate-denormalization",
      language: "python",
      title: "Deliberate denormalization with reconciliation (the Kleppmann tradeoff)",
      description:
        "Once reads dominate, a denormalized read model is legitimate — but ONLY with an explicit mechanism to keep the copy honest. Here a trigger keeps a cached order_count in sync; without it, the copy is an accidental-denormalization defect.",
      runnable: false,
      code: `# Normalization buys write-consistency; denormalization buys read-performance.
# The rule: you may keep a derived copy — but you MUST own the mechanism that
# reconciles it. A copy with no reconciliation is a lost-update waiting to happen.

# System of record stays normalized: one fact, one place.
schema = """
  CREATE TABLE customers (
    customer_id BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    order_count INT  NOT NULL DEFAULT 0   -- DERIVED cache of COUNT(orders)
  );
  CREATE TABLE orders (
    order_id    BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(customer_id)
  );
"""

# The reconciliation mechanism that makes the derived column honest.
# Without this trigger, order_count silently drifts from reality — the
# denormalization is ACCIDENTAL and will produce wrong dashboards.
reconciliation_trigger = """
  CREATE FUNCTION bump_order_count() RETURNS trigger AS $$
  BEGIN
    UPDATE customers
       SET order_count = order_count + 1
     WHERE customer_id = NEW.customer_id;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER orders_after_insert
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION bump_order_count();
"""

def is_denormalization_safe(has_reconciliation: bool) -> str:
    # The audit question (Kleppmann's lens): deliberate or accidental?
    if has_reconciliation:
        return "deliberate: read-perf bought, copy kept honest"
    return "accidental defect: derived copy will drift -> update anomaly"

assert is_denormalization_safe(True).startswith("deliberate")
assert is_denormalization_safe(False).startswith("accidental")`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "The OLTP transactional core / system of record, where write correctness dominates",
      "Any relational schema whose facts are mutated in place by many concurrent writers",
    ],
    interactsWith: [
      "Denormalized read models (CQRS read side, materialized views) built downstream",
      "Caches (cache-aside / write-through) that hold derived copies of normalized facts",
      "Read replicas that serve the reconstructed, join-heavy read views",
    ],
    architecturalBoundaries: [
      "Write model (normalized, authoritative) vs read model (denormalized, derived)",
      "OLTP (normalized) vs OLAP / warehouse (heavily denormalized star schema)",
    ],
  },

  implementations: [
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "platform",
      languages: ["sql"],
      description:
        "Enforces normalization via primary/foreign keys, unique + check constraints, and referential-integrity actions; generated columns and triggers support deliberate, reconciled denormalization.",
      links: { docs: "https://www.postgresql.org/docs/current/ddl-constraints.html" },
    },
    {
      id: "mysql-innodb",
      name: "MySQL (InnoDB)",
      type: "platform",
      languages: ["sql"],
      description:
        "Foreign-key constraints and clustered primary keys enforce the relational decomposition; the query optimizer reconstructs normalized views via joins.",
      links: { docs: "https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html" },
    },
    {
      id: "sqlserver",
      name: "Microsoft SQL Server",
      type: "platform",
      languages: ["sql"],
      description:
        "Declarative constraints plus indexed views for materialized, reconciled denormalization of hot read paths.",
      links: { docs: "https://learn.microsoft.com/en-us/sql/relational-databases/tables/" },
    },
    {
      id: "prisma",
      name: "Prisma ORM",
      type: "library",
      languages: ["typescript"],
      description:
        "Relations and referential-integrity in the schema DSL keep the application model normalized while generating the join queries that reconstruct views.",
      links: { docs: "https://www.prisma.io/docs/orm/prisma-schema/data-model/relations" },
    },
    {
      id: "sqlalchemy",
      name: "SQLAlchemy",
      type: "library",
      languages: ["python"],
      description:
        "Declarative models with relationship() + ForeignKey express normalized schemas; lazy/eager loading strategies control the join cost on read.",
      links: { docs: "https://docs.sqlalchemy.org/en/20/orm/relationships.html" },
    },
  ],

  usedInSystems: [
    {
      systemId: "double-entry-ledger",
      systemName: "Financial ledgers (double-entry accounting)",
      howUsed:
        "The system of record is strictly normalized — each posting is one fact in one place — so balances are always derivable and can never disagree; reporting reads are served from separate denormalized rollups.",
    },
    {
      systemId: "ecommerce-oltp",
      systemName: "E-commerce order systems",
      howUsed:
        "Customers, products, and orders live in a normalized OLTP core for write integrity, while the product catalog and order-history pages read from denormalized/materialized views kept in sync by CDC or triggers.",
    },
  ],

  philosophy: {
    coreProblem:
      "Redundancy makes disagreement possible. The moment a fact is stored in two places, the database can hold two contradictory truths, and nothing in the schema can say which is right.",
    designPrinciple:
      "One fact, one place. Every non-key attribute must depend on the key, the whole key, and nothing but the key (Codd). Derived data may exist, but only as an explicitly reconciled projection of the single source of truth — never as an unmanaged duplicate.",
    historicalContext:
      "E. F. Codd introduced the relational model and normal forms in 1970 to replace navigational/hierarchical databases whose redundancy made them anomaly-prone; BCNF (Boyce–Codd) tightened 3NF in 1974.",
    alternativesRejected: [
      "Unmanaged denormalization (duplicate columns with no reconciliation) — trades correctness for reads and gets anomalies for free",
      "Wide document blobs that embed related entities inline — fast to read, but the same fact ends up copied across documents",
    ],
    mentalModel:
      "A fact has exactly one home address. Copies are allowed only if you also own the postal service that keeps them in sync — otherwise a change delivered to one copy and not another is silent corruption. Normalize for write-consistency; denormalize for read-performance, but always with a reconciliation mechanism.",
  },

  references: [
    {
      title: "A Relational Model of Data for Large Shared Data Banks",
      url: "https://dl.acm.org/doi/10.1145/362384.362685",
      type: "research-paper",
      author: "E. F. Codd",
    },
    {
      title: "Designing Data-Intensive Applications — Ch. 2/3 (Data Models & Storage)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
  ],

  tags: [
    "database",
    "data-modeling",
    "normalization",
    "consistency",
    "relational",
    "codd",
    "kleppmann",
  ],

  difficulty: "intermediate",
};
