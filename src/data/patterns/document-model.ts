import type { Pattern } from "../schema";

export const documentModel: Pattern = {
  id: "document-model",
  slug: "document-model",
  corpusPath: "🔗 CONSISTENCY → 🗄️ Data Modeling → 📄 Document Model",

  hierarchy: {
    quality: "consistency",
    strategy: "Data Modeling",
    family: "Data Modeling",
    level: 4,
  },

  concept: {
    name: "Document Model",
    emoji: "📄",
    tagline: "Store related data together as one self-contained document",
    definition:
      "The document model stores an entire aggregate — a whole tree of related data such as a résumé, an order with its line items, or a product with its variants — as a single self-contained document, typically encoded as JSON or its binary cousin BSON. Rather than scattering an object across many normalized tables that must be re-joined on read, the document keeps everything about one thing in one place, so a single lookup by key returns the complete tree with no joins. Two properties define the model. First, LOCALITY: because the whole aggregate is stored contiguously and fetched together, one read returns it all, and the on-disk shape mirrors the in-memory application object, shrinking the object–relational impedance mismatch that ORMs exist to paper over. Second, SCHEMA-ON-READ: a document's structure is implicit and interpreted by the application when it reads the data, in contrast to schema-on-write, where the database enforces an explicit, declared schema at write time. This makes documents a natural fit for one-to-many trees that are loaded and updated as a unit, for data with a clear document boundary, and for evolving, heterogeneous shapes where different records legitimately carry different fields.",
    problemSolved:
      "Relational normalization splits an application object across many tables so that each fact lives in one place, but that split imposes a tax on every read: reconstructing a single conceptual object — an order plus its line items plus shipping address plus a customer snapshot — requires a multi-way join, and the code must translate between the flat rows the database returns and the nested objects it actually wants to work with. This is the object–relational impedance mismatch, and the glue that bridges it (ORMs, hand-written join queries, mapping layers) is a persistent source of complexity and latency. The document model attacks that mismatch head-on: when the data genuinely has a document boundary — a self-contained tree that is almost always loaded and saved as one unit — storing it as a single document turns the read into one key lookup, eliminates the joins, and lets the persisted shape match the application object exactly. It also removes the schema-migration friction of adding a field, because new or heterogeneous fields need no ALTER TABLE: the writer simply includes them and the reader interprets them.",
    tradeoffs: {
      pros: [
        "Locality — one read fetches the entire aggregate; no joins to reassemble the object",
        "The stored shape matches the application object, shrinking the object–relational impedance mismatch",
        "Schema-on-read absorbs heterogeneous and evolving shapes without migrations (no ALTER TABLE to add a field)",
        "Excellent fit for one-to-many trees that are loaded and updated as a single unit",
        "A self-contained document is a natural unit to shard/partition by key for horizontal scale",
      ],
      cons: [
        "Many-to-many and highly interconnected data fits poorly: you must either denormalize (copy shared facts into many documents) or store references and join in application code",
        "Denormalized copies drift — a customer name embedded in every order goes stale, reintroducing exactly the update anomaly normalization prevents",
        "Poor native support for joins pushes relationship-following logic into the application, where it is slower and easy to get wrong",
        "You cannot efficiently update a single deeply nested item, nor reference a nested item directly from outside the document",
        "Schema-on-read defers validation to runtime — malformed or missing fields surface as application bugs, not write-time errors",
      ],
    },
    relatedPatterns: [
      "normalization",
      "graph-model",
      "cqrs",
      "event-sourcing",
      "cache-aside",
    ],
  },

  structure: {
    participants: [
      {
        name: "Document",
        role: "Self-contained aggregate",
        responsibilities: [
          "Hold the entire tree for one entity (root plus nested children) in one JSON/BSON value",
          "Serve as the unit of read, write, and — in most document stores — atomicity",
        ],
      },
      {
        name: "Document Key (_id)",
        role: "Addressable identity",
        responsibilities: [
          "Uniquely identify a document so it can be fetched by a direct key lookup",
          "Act as the shard / partition key that co-locates the whole aggregate on one node",
        ],
      },
      {
        name: "Embedded Sub-document",
        role: "Contained child data",
        responsibilities: [
          "Store one-to-many children inline (line items, variants, addresses, comments)",
          "Ride along with the parent on every read — but cannot be addressed or joined directly from outside the document",
        ],
      },
      {
        name: "Reference (document-id pointer)",
        role: "Cross-document link",
        responsibilities: [
          "Point to another document by its key when the data is shared or many-to-many",
          "Defer the join to application code or a database-side lookup ($lookup / SQL++), because the store won't follow it for free",
        ],
      },
      {
        name: "Application (schema-on-read interpreter)",
        role: "Structure enforcer",
        responsibilities: [
          "Interpret each document's implicit shape at read time, tolerating heterogeneous and evolving fields",
          "Own reference-following joins and reconciliation of any denormalized copies so they don't drift",
        ],
      },
    ],
    diagram: `graph TD
    K[Key / _id lookup] --> DOC[Order Document<br/>one self-contained tree]
    DOC --> C[Embedded customer snapshot]
    DOC --> LI[Embedded line-items array]
    DOC --> A[Embedded shipping address]
    DOC -.->|reference by id| P[Product Document<br/>shared / many-to-many]
    P -.->|no native join —<br/>resolve in app or $lookup| APP[Application code]
    LI -.->|cannot address a<br/>nested item directly| APP`,
    flow: [
      {
        step: 1,
        actor: "Data Modeler",
        action: "Find the aggregate boundary",
        description:
          "Decide what is loaded and saved as a single unit — that boundary is the document. Everything inside is embedded; everything outside is referenced.",
      },
      {
        step: 2,
        actor: "Data Modeler",
        action: "Embed contained one-to-many",
        description:
          "Nest children that belong to exactly one parent and are always read with it (line items, variants, addresses) directly inside the document.",
      },
      {
        step: 3,
        actor: "Data Modeler",
        action: "Reference shared / many-to-many",
        description:
          "For entities pointed at by many documents, store the foreign document's id instead of copying it — this is the document-model equivalent of a foreign key.",
      },
      {
        step: 4,
        actor: "Application",
        action: "Write the whole document",
        description:
          "Persist the entire tree in one atomic write keyed by _id; there is no multi-table transaction to coordinate for a single aggregate.",
      },
      {
        step: 5,
        actor: "Application",
        action: "Read by key (the locality win)",
        description:
          "A single lookup by _id returns the complete aggregate — no join reassembles it, and the returned shape already matches the application object.",
      },
      {
        step: 6,
        actor: "Application",
        action: "Resolve references / reconcile copies",
        description:
          "Follow references via application joins or a database $lookup, and reconcile any denormalized copies (e.g. an embedded customer name) so they don't drift from the canonical record.",
      },
    ],
    invariants: [
      "An aggregate has a single document boundary — data loaded and saved together lives in one document",
      "The document key is the only guaranteed-efficient access path; nested items are not independently addressable",
      "Embedded data is duplicated data — any copied shared fact needs an explicit reconciliation mechanism or it will drift",
      "Relationships that cross document boundaries are resolved outside the storage engine (application join or $lookup), not for free",
      "Structure is validated on read by the application (schema-on-read), not enforced on write by the database",
    ],
  },

  codeExamples: [
    {
      id: "document-model-embedded-order-vs-normalized",
      language: "typescript",
      title: "An order as an embedded document — the locality win and the drift hazard",
      description:
        "The whole order is one self-contained tree, so a single read by _id returns everything the order page needs. But the embedded customer snapshot is a COPY: rename the customer and every order goes stale unless you fan-out a reconciliation write — exactly the update anomaly normalization exists to prevent.",
      runnable: false,
      code: `// ✅ DOCUMENT MODEL — the whole order is ONE self-contained tree.
// Customer snapshot + line items are EMBEDDED, so a single read by _id
// returns everything the order page needs, with no joins.
interface OrderDocument {
  _id: string;
  placedAt: string;
  customer: {                     // embedded snapshot (a denormalized copy)
    customerId: string;
    name: string;                 // ← COPIED from the customer record
    city: string;                 //   the locality win... and the hazard
  };
  lineItems: Array<{              // embedded one-to-many, loaded as a unit
    productId: string;
    title: string;
    qty: number;
    priceCents: number;
  }>;
  totalCents: number;
}

// One key lookup hydrates the entire aggregate — the LOCALITY win.
async function loadOrder(db: DocDb, id: string): Promise<OrderDocument> {
  return db.collection<OrderDocument>("orders").findOne({ _id: id });
  // No JOIN across customers / products / line_items — it's all right here.
}

// ❌ THE HAZARD: the embedded customer.name is a COPY. When the customer
// renames themselves, every order they ever placed still shows the OLD
// name unless you hunt down and rewrite each document — the update anomaly
// that normalization exists to prevent, now living inside your documents.
async function renameCustomer(db: DocDb, customerId: string, name: string) {
  await db.collection("customers").updateOne({ _id: customerId }, { name });
  // The canonical record is fixed — but the embedded snapshots are stale.
  // Reconciliation is now YOUR job, fanned out across N order documents:
  await db.collection("orders").updateMany(
    { "customer.customerId": customerId },
    { $set: { "customer.name": name } },   // fan-out write to every copy
  );
}

// The normalized / relational alternative keeps name in ONE place and
// re-joins on read — no fan-out write, but every order read pays a join:
const relationalReadView = \`
  SELECT o.order_id, c.name, c.city
  FROM   orders o
  JOIN   customers c ON c.customer_id = o.customer_id
\`;

// Minimal structural types so the example stands alone.
interface DocDb {
  collection<T = any>(name: string): {
    findOne(q: Record<string, unknown>): Promise<T>;
    updateOne(q: Record<string, unknown>, patch: Record<string, unknown>): Promise<void>;
    updateMany(q: Record<string, unknown>, patch: Record<string, unknown>): Promise<void>;
  };
}

export type { OrderDocument, DocDb };
export { loadOrder, renameCustomer, relationalReadView };`,
    },
    {
      id: "document-model-embed-vs-reference",
      language: "python",
      title: "Embed vs reference — and the many-to-many join pain",
      description:
        "Embed data that is contained and loaded with its parent; reference data that is shared or many-to-many. Referencing shows the cost the document store won't pay for you: either N+1 round-trips resolved in application code, or a server-side $lookup — the relational join, bolted back on.",
      runnable: false,
      code: `# EMBED vs REFERENCE — the central document-modeling decision.
# Rule of thumb: EMBED data that is contained and loaded with its parent
# (a one-to-many that belongs to exactly one owner); REFERENCE data that is
# shared or many-to-many (the same entity pointed at by many documents).

# EMBED: a blog post owns its comments — they are never queried on their own.
post_embedded = {
    "_id": "post:42",
    "title": "The Document Model",
    "body": "...",
    "comments": [                      # one-to-many, contained -> embed
        {"author": "ana", "text": "great post"},
        {"author": "ben", "text": "clarifying, thanks"},
    ],
}
# One read returns the post AND its comments — locality win, no join.

# REFERENCE: students <-> courses is MANY-TO-MANY. Embedding either side
# copies shared facts and invites update anomalies, so we store ids instead.
student = {"_id": "stu:7", "name": "Ana", "course_ids": ["crs:db", "crs:os"]}
course = {"_id": "crs:db", "title": "Databases", "student_ids": ["stu:7"]}

# The cost of referencing: the document store will NOT join for free. You
# either follow the references in application code (N+1 round-trips)...
def resolve_courses_in_app(db, student_doc):
    return [db.courses.find_one({"_id": cid})   # one query PER reference
            for cid in student_doc["course_ids"]]

# ...or push a server-side join with $lookup — powerful, but this is exactly
# the relational work the document model claimed to avoid, now bolted back on.
enrollment_pipeline = [
    {"$match": {"_id": "stu:7"}},
    {"$lookup": {
        "from": "courses",
        "localField": "course_ids",
        "foreignField": "_id",
        "as": "courses",              # joined array, resolved by the server
    }},
]

def choose_strategy(is_shared_or_many_to_many: bool) -> str:
    # The one-line heuristic that captures Kleppmann's tension.
    if is_shared_or_many_to_many:
        return "reference: one fact one place, pay the join"
    return "embed: locality win, aggregate loaded as one unit"

assert choose_strategy(False).startswith("embed")
assert choose_strategy(True).startswith("reference")

# The other limitation embedding hides: you cannot address or update a
# single DEEPLY NESTED item directly. To bump one comment's text you must
# match the parent AND locate the nested element with a positional operator,
# and unbounded growth (comments forever) will eventually blow the document
# size limit — a signal that this child wanted to be its own document.
edit_nested_comment = {
    "filter": {"_id": "post:42", "comments.author": "ana"},
    "update": {"$set": {"comments.$.text": "edited: still great"}},  # "$" = first match
}
# Rule restated: embed for BOUNDED, contained one-to-many; reference the
# moment the child is shared, unbounded, or needs direct addressing.`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "The primary store for self-contained aggregates that are loaded and saved as a unit (data with a genuine document boundary)",
      "Content, catalog, and profile stores where records are heterogeneous and evolve independently",
    ],
    interactsWith: [
      "Application code that performs schema-on-read interpretation and any reference-following joins the store won't do",
      "Caches holding whole documents (cache-aside), since a document is already a self-contained value keyed by id",
      "CQRS read models and search indexes that project documents into query shapes the document store handles poorly",
    ],
    architecturalBoundaries: [
      "Aggregate boundary (embed inside) vs entity boundary (reference across documents)",
      "Schema-on-read (document, application-enforced) vs schema-on-write (relational, database-enforced)",
    ],
  },

  implementations: [
    {
      id: "mongodb",
      name: "MongoDB",
      type: "platform",
      languages: ["javascript", "typescript", "python", "go", "java"],
      description:
        "The canonical document store: BSON documents, embed-vs-reference modeling, per-document atomicity, and $lookup for server-side joins when relationships must cross a document boundary.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/core/data-modeling-introduction/",
      },
    },
    {
      id: "dynamodb",
      name: "Amazon DynamoDB (single-table design)",
      type: "service",
      languages: ["python", "typescript", "java", "go"],
      description:
        "Key-value + document store; single-table design co-locates related items under one partition key so an entire access pattern is served by one read — locality taken to its extreme, with no server-side joins.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-relational-modeling.html",
      },
    },
    {
      id: "couchbase",
      name: "Couchbase",
      type: "platform",
      languages: ["javascript", "python", "java", "go"],
      description:
        "Memory-first JSON document store whose SQL++ (N1QL) query language adds real joins over documents — a document model that leans back toward relational querying, the convergence Kleppmann describes.",
      links: {
        docs: "https://docs.couchbase.com/server/current/learn/data/document-data-model.html",
      },
    },
    {
      id: "postgresql-jsonb",
      name: "PostgreSQL (JSONB)",
      type: "platform",
      languages: ["sql"],
      description:
        "A relational database doing documents: jsonb columns with GIN indexes and JSON path operators let one store hold both normalized tables and self-contained documents — the relational-side of the models converging.",
      links: {
        docs: "https://www.postgresql.org/docs/current/datatype-json.html",
      },
    },
    {
      id: "firestore",
      name: "Firebase Firestore",
      type: "service",
      languages: ["javascript", "typescript", "python", "java"],
      description:
        "Hierarchical documents-and-collections with realtime sync; whole-document reads and deliberately limited querying push relationship logic into the data model, rewarding careful embed-vs-reference choices.",
      links: {
        docs: "https://firebase.google.com/docs/firestore/data-model",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "product-catalog-cms",
      systemName: "Product catalog / headless CMS",
      howUsed:
        "Each product or article is a self-contained document with heterogeneous fields — a book carries an author and page count, a shirt carries sizes and colors — and schema-on-read absorbs the variety, so a single read renders a whole page without joining a dozen attribute tables.",
    },
    {
      systemId: "user-profile-session",
      systemName: "User-profile & session store",
      howUsed:
        "The entire profile or session object (preferences, feature flags, cart contents) is loaded and written as one document keyed by user or session id, so the hot path is a single key lookup and locality keeps latency flat.",
    },
  ],

  philosophy: {
    coreProblem:
      "Application objects are nested trees, but relational storage is flat tables; every read must reassemble the tree with joins, and code must translate rows into objects — the object–relational impedance mismatch. Compounding it, a whole class of data is naturally a self-contained document that is always handled as one unit, yet normalization forces it apart anyway.",
    designPrinciple:
      "Store data in the shape the application uses it. When an aggregate has a genuine document boundary — loaded and saved as a unit — keep the whole tree together for locality: embed what is contained within it, reference what is shared beyond it. Choose the model by the dominant access pattern, not by dogma.",
    historicalContext:
      "The document model revives ideas from 1970s hierarchical/network databases (IBM's IMS) that Codd's relational model displaced, and returned with the 2000s–2010s NoSQL wave (MongoDB, CouchDB) driven by web-scale sharding and developer ergonomics. Kleppmann (DDIA, 2017) frames the models as converging — relational databases added JSON columns while document databases added joins — so the real choice is per-access-pattern, not tribal.",
    alternativesRejected: [
      "Full relational normalization for every access pattern — correct for writes, but pays a join and an impedance-mismatch tax on self-contained trees that are always read whole",
      "Denormalizing shared or many-to-many data into documents to keep the read fast — buys read locality but reintroduces update anomalies as the copies drift",
    ],
    mentalModel:
      "A document is a manila folder: everything about one thing in one place, grab-and-go. It is perfect until two folders need to share the same sheet of paper — then you either photocopy it into both (and they drift apart) or write 'see folder B' (and now you're doing the filing by hand).",
  },

  references: [
    {
      title: "Designing Data-Intensive Applications — Ch. 2 (Data Models and Query Languages)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "MongoDB Data Modeling — Embedded Data vs. References",
      url: "https://www.mongodb.com/docs/manual/core/data-model-design/",
      type: "documentation",
    },
    {
      title: "The What, Why, and When of Single-Table Design with DynamoDB",
      url: "https://www.alexdebrie.com/posts/dynamodb-single-table/",
      type: "article",
      author: "Alex DeBrie",
    },
  ],

  tags: [
    "database",
    "data-modeling",
    "document-model",
    "nosql",
    "json",
    "schema-on-read",
    "kleppmann",
    "locality",
  ],

  difficulty: "intermediate",
};
