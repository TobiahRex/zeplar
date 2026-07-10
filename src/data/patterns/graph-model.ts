import type { Pattern } from "../schema";

export const graphModel: Pattern = {
  id: "graph-model",
  slug: "graph-model",
  corpusPath: "🔗 CONSISTENCY → 🗄️ Data Modeling → 🕸️ Graph Model",

  hierarchy: {
    quality: "consistency",
    strategy: "Data Modeling",
    family: "Data Modeling",
    level: 5,
  },

  concept: {
    name: "Graph Model",
    emoji: "🕸️",
    tagline: "When the relationships ARE the data",
    definition:
      "The graph model represents data as a set of vertices (nodes, standing for entities) and edges (the relationships between them), where — crucially — the edges are first-class citizens that can carry their own properties, labels, and direction. You reach for it when the relationships between things matter as much as the things themselves, and when the questions you ask are traversals: 'who is connected to whom, and how many hops away?' Two dominant flavors exist. The property graph (Neo4j / Cypher, Apache TinkerPop / Gremlin) attaches key–value properties to both vertices and edges and lets a query walk labeled relationships outward from a starting node. The triple-store / RDF model (queried with SPARQL) records everything as (subject, predicate, object) triples, where the predicate is the edge and a vertex is just a subject or object. Both flavors make the one operation that relational and document models handle worst — traversal of unknown or variable depth — into a first-class primitive. Where a relational schema forces a verbose recursive CTE to follow a chain of unknown length, a graph query expresses the same walk in a single clause. Choose the graph model when many-to-many relationships and variable-depth traversal dominate the workload: social networks, recommendation engines, fraud rings, knowledge graphs, and org charts.",
    problemSolved:
      "Relational and document models both stumble on the same access pattern: following a chain of relationships whose length you do not know in advance. A friends-of-friends lookup, a fraud ring three hops deep, an org chart of arbitrary depth, or a build-dependency graph all require traversal, and in SQL that means a recursive common table expression (WITH RECURSIVE) that is verbose, easy to get subtly wrong (cycle guards, depth bounds, DISTINCT), and expensive for the planner. Each additional hop in a relational model is another JOIN; when the number of hops is variable or unbounded, there is no single fixed query at all. The document model is even worse for this — following a reference to another document is a manual, application-side dereference with no join support whatsoever. The graph model solves this by making the edge a first-class object and traversal a native operation, so 'walk outward from this vertex across these relationship types, however deep it goes' is expressed once and executed efficiently regardless of depth. It also lets you introduce entirely new relationship types without a schema migration, because an edge is simply data.",
    tradeoffs: {
      pros: [
        "Natural fit for highly connected, many-to-many data where the relationships are the domain",
        "Variable- and unbounded-depth traversal is cheap and expressed as a first-class primitive — no recursive-CTE gymnastics",
        "Flexible schema: new edge (relationship) types can be added without migrating existing data",
        "Queries read like the questions you actually ask ('friends of friends within 3 hops', 'shortest path between A and B')",
        "Edges carry their own properties, so a relationship can hold data (weight, since-date, role, confidence)",
      ],
      cons: [
        "Weak for aggregate / set-oriented analytics — summing, grouping, and scanning whole collections is what relational/columnar stores do better",
        "Sharding a graph is genuinely hard: edges cross partitions, so a traversal turns into a cross-partition (cross-machine) operation",
        "Fewer mature operational tools, and a smaller talent pool, than the decades-old relational ecosystem",
        "Overkill when relationships are shallow and fixed — a normalized relational schema with one or two joins is simpler and faster",
        "Query-language fragmentation (Cypher vs Gremlin vs SPARQL vs the emerging GQL standard) means less portability than SQL",
      ],
    },
    relatedPatterns: [
      "normalization",
      "document-model",
      "cqrs",
      "materialized-view",
      "sharding",
    ],
  },

  structure: {
    participants: [
      {
        name: "Vertex (Node)",
        role: "First-class entity in the graph",
        responsibilities: [
          "Represent a single entity (a person, product, account, concept)",
          "Carry labels and key–value properties, and serve as an anchor for traversal",
        ],
      },
      {
        name: "Edge (Relationship)",
        role: "First-class, typed, directed connection between two vertices",
        responsibilities: [
          "Connect exactly two vertices with a named relationship type (FRIEND, BOUGHT, REPORTS_TO)",
          "Carry its own properties (weight, timestamp, role) — the relationship itself holds data",
        ],
      },
      {
        name: "Property",
        role: "Key–value data attached to a vertex or an edge",
        responsibilities: [
          "Describe an entity or a relationship without needing a separate join table",
          "Support filtering and projection during a traversal (WHERE / RETURN clauses)",
        ],
      },
      {
        name: "Traversal / Query Engine",
        role: "Executor that walks the graph",
        responsibilities: [
          "Locate a start vertex and follow edges outward to a fixed or variable depth",
          "Prune by relationship type, direction, and property predicates while avoiding cycles",
        ],
      },
      {
        name: "Vertex Index",
        role: "Entry-point accelerator",
        responsibilities: [
          "Resolve a starting vertex quickly from a property (id, email, sku) so the walk can begin",
          "Keep anchor lookups O(log n) or better instead of a full scan before traversal",
        ],
      },
    ],
    diagram: `graph LR
    Me((Person: Me)) -->|FRIEND| A((Person: Alice))
    A -->|FRIEND| B((Person: Bob))
    B -->|FRIEND| C((Person: Carol))
    Me -->|BOUGHT qty:1| Bk[Product: DDIA]
    A -->|BOUGHT qty:2| Bk
    A -->|BOUGHT qty:1| Mg[Product: Mug]
    Me -.->|FRIEND*1..3 traversal| C
    Bk -.->|co-bought recommends| Mg`,
    flow: [
      {
        step: 1,
        actor: "Data Modeler",
        action: "Model entities as vertices, relationships as edges",
        description:
          "Decide what is a thing (vertex) and what is a connection (edge). Anything you will traverse — friendship, purchase, dependency — becomes a first-class edge rather than a foreign-key column.",
      },
      {
        step: 2,
        actor: "Data Modeler",
        action: "Attach properties and labels",
        description:
          "Put descriptive key–value data on both vertices and edges, and label edges with a relationship type so traversals can select which relationships to follow.",
      },
      {
        step: 3,
        actor: "Vertex Index",
        action: "Index anchor properties",
        description:
          "Create indexes on the properties used to locate a starting vertex (id, email, sku) so a traversal does not begin with a full scan.",
      },
      {
        step: 4,
        actor: "Traversal / Query Engine",
        action: "Resolve the start vertex",
        description:
          "The query engine uses the index to jump directly to the anchor vertex from which the walk will proceed.",
      },
      {
        step: 5,
        actor: "Traversal / Query Engine",
        action: "Walk edges to variable depth",
        description:
          "Follow edges of the requested type(s) outward — a fixed number of hops or a variable range such as *1..3 — pruning by property predicates and guarding against cycles.",
      },
      {
        step: 6,
        actor: "Traversal / Query Engine",
        action: "Project and return the reached subgraph",
        description:
          "Collect the vertices/edges the walk touched, apply DISTINCT and aggregation (e.g. rank recommendations by co-buyer count), and return the result set.",
      },
    ],
    invariants: [
      "Every edge connects exactly two vertices — a dangling edge (missing endpoint) is invalid",
      "Edges are typed and directed (or explicitly bidirectional); a traversal always knows which relationship it is following and which way",
      "Traversal follows edges directly — no join keys are matched at query time, because the connection is materialized as the edge itself",
      "A vertex is reachable from another if and only if a path of edges connects them; reachability is defined by the graph, not by shared column values",
      "In the RDF flavor, every fact is a single (subject, predicate, object) triple — the atomic, indivisible unit of the model",
    ],
  },

  codeExamples: [
    {
      id: "graph-model-foaf-cypher-vs-recursive-cte",
      language: "typescript",
      title: "Friends-of-friends within N hops — Cypher vs SQL WITH RECURSIVE",
      description:
        "The same variable-depth traversal expressed three ways. In a property graph it is one Cypher clause; in relational SQL it needs a hand-rolled recursive CTE with manual depth bound, cycle handling, and de-duplication — which is exactly why the graph model wins when join depth is variable.",
      runnable: false,
      code: `// The access pattern that breaks relational modeling: "friends-of-friends,
// up to N hops out." N is variable, so there is no single fixed JOIN count.

// ✅ GRAPH (Cypher) — traversal of variable depth is a FIRST-CLASS primitive.
// "*1..3" means "follow the FRIEND edge between 1 and 3 hops." One clause.
const cypherFoaf = \`
  MATCH (me:Person {id: $meId})-[:FRIEND*1..3]-(reachable:Person)
  WHERE reachable.id <> $meId
  RETURN DISTINCT reachable.id AS id, reachable.name AS name
\`;

// ❌ RELATIONAL (SQL) — the same walk needs a WITH RECURSIVE CTE. Every hop
// is another self-join hidden inside the recursion; getting the depth bound,
// the cycle guard, and DISTINCT right is fiddly, and the planner works hard.
const sqlFoaf = \`
  WITH RECURSIVE foaf(person_id, depth) AS (
    SELECT :me_id, 0                       -- base case: me, at depth 0
    UNION ALL
    SELECT f.friend_id, foaf.depth + 1     -- recursive step: one more hop
    FROM   foaf
    JOIN   friendships f ON f.person_id = foaf.person_id
    WHERE  foaf.depth < 3                  -- variable-depth bound, done by hand
  )
  SELECT DISTINCT p.person_id AS id, p.name
  FROM   foaf
  JOIN   persons p ON p.person_id = foaf.person_id
  WHERE  foaf.person_id <> :me_id;         -- exclude self, added by hand
\`;

// SPARQL over the same data as RDF triples: a property path ("+" = one-or-more)
// expresses the transitive walk just as compactly as Cypher does.
const sparqlFoaf = \`
  SELECT DISTINCT ?friend ?name WHERE {
    :me (:friend)+ ?friend .
    ?friend :name ?name .
    FILTER (?friend != :me)
  }
\`;

// Pick the engine by SHAPE of the access pattern, not by habit:
type Depth = "fixed" | "variable";
function chooseModel(depth: Depth): "relational" | "graph" {
  // Fixed depth (e.g. always order -> customer) → one JOIN, relational is simpler.
  // Variable/unbounded depth → traversal is the hot path → the graph model wins.
  return depth === "fixed" ? "relational" : "graph";
}

console.log(chooseModel("fixed"));    // "relational"
console.log(chooseModel("variable")); // "graph"

export { cypherFoaf, sqlFoaf, sparqlFoaf, chooseModel };`,
    },
    {
      id: "graph-model-property-graph-write-and-traverse",
      language: "python",
      title: "Property-graph write + traversal — 'customers who bought X also bought'",
      description:
        "Create vertices and property-bearing edges, then answer the classic recommendation query with a two-hop traversal. Comments show the same data as RDF triples with the SPARQL equivalent, and a fraud-ring variant reusing the identical traversal shape.",
      runnable: false,
      code: `# Property graph: vertices AND edges carry properties. Model a purchase graph
# where (:Customer)-[:BOUGHT {qty}]->(:Product), then answer the classic
# recommendation query: "customers who bought X also bought ...".

# --- WRITE: create vertices and property-bearing edges (Cypher via a driver) ---
write_graph = """
  // vertices with their own properties
  MERGE (alice:Customer {id: 'c1', name: 'Alice'})
  MERGE (bob:Customer   {id: 'c2', name: 'Bob'})
  MERGE (book:Product   {sku: 'p_book', title: 'DDIA'})
  MERGE (mug:Product    {sku: 'p_mug',  title: 'Graph Mug'})
  MERGE (pen:Product    {sku: 'p_pen',  title: 'Ink Pen'})

  // EDGES are first-class and carry their OWN properties (qty, timestamp)
  MERGE (alice)-[:BOUGHT {qty: 1, at: datetime()}]->(book)
  MERGE (alice)-[:BOUGHT {qty: 2, at: datetime()}]->(mug)
  MERGE (bob)-[:BOUGHT   {qty: 1, at: datetime()}]->(book)
  MERGE (bob)-[:BOUGHT   {qty: 1, at: datetime()}]->(pen)
"""

# --- TRAVERSE: "customers who bought $sku also bought ..." in two hops ---
# hop 1: BOUGHT (incoming) to co-buyers; hop 2: BOUGHT (outgoing) to their
# other products. Rank by how many distinct co-buyers purchased each product.
recommend = """
  MATCH (seed:Product {sku: $sku})<-[:BOUGHT]-(peer:Customer)-[:BOUGHT]->(rec:Product)
  WHERE rec.sku <> $sku
  RETURN rec.title AS title, count(DISTINCT peer) AS strength
  ORDER BY strength DESC
  LIMIT 10
"""

def recommend_for(session, sku: str):
    session.run(write_graph)
    rows = session.run(recommend, sku=sku)
    return [(r["title"], r["strength"]) for r in rows]

# --- The SAME data as RDF triples (subject predicate object). The predicate
# IS the edge; a triple-store models every fact as one triple:
#     :c1  :bought  :p_book .
#     :c1  :bought  :p_mug  .
#     :c2  :bought  :p_book .
# "co-bought with the book" is then a two-edge SPARQL path:
sparql_reco = """
  SELECT ?rec (COUNT(DISTINCT ?peer) AS ?strength) WHERE {
    ?peer :bought :p_book .
    ?peer :bought ?rec .
    FILTER (?rec != :p_book)
  } GROUP BY ?rec ORDER BY DESC(?strength)
"""

# Fraud-ring variant: the IDENTICAL traversal shape finds accounts linked
# through shared devices or cards within k hops — connectedness the relational
# model would need k self-joins (or a recursive CTE) to chase.
fraud_ring = """
  MATCH (a:Account {id: $id})-[:USED_DEVICE|SHARES_CARD*1..4]-(linked:Account)
  RETURN DISTINCT linked.id AS id, linked.risk_score AS risk
"""`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "The relationship / connectivity core of a system — the friend graph, the recommendation engine, the entity-resolution or knowledge-graph layer",
      "Alongside a relational or document system of record, serving the specific queries that are traversals rather than lookups or aggregates",
    ],
    interactsWith: [
      "A relational/document store that holds the authoritative entity records, with the graph mirroring their connections (often kept in sync via CDC)",
      "A CQRS read side or search index that answers set/aggregate queries the graph handles poorly",
      "Stream processors and ETL that project events into new vertices and edges as relationships are formed",
    ],
    architecturalBoundaries: [
      "Traversal workloads (graph) vs aggregate/OLAP workloads (columnar/warehouse) — different engines for different question shapes",
      "Connected read model (graph) vs system of record (normalized relational) — the graph may be a derived projection kept honest by a reconciliation mechanism",
    ],
  },

  implementations: [
    {
      id: "neo4j",
      name: "Neo4j",
      type: "platform",
      languages: ["cypher"],
      description:
        "The reference property-graph database; vertices and edges both carry properties, and its Cypher language makes variable-depth traversal (rel*1..n) a first-class clause.",
      links: { docs: "https://neo4j.com/docs/cypher-manual/current/" },
    },
    {
      id: "amazon-neptune",
      name: "Amazon Neptune",
      type: "service",
      languages: ["cypher", "gremlin", "sparql"],
      description:
        "Managed graph service that supports BOTH models — property graph (via openCypher and Gremlin) and RDF triple-store (via SPARQL) — over the same durable, replicated storage.",
      links: { docs: "https://docs.aws.amazon.com/neptune/latest/userguide/intro.html" },
    },
    {
      id: "apache-tinkerpop",
      name: "Apache TinkerPop / Gremlin",
      type: "framework",
      languages: ["java", "groovy", "python"],
      description:
        "A vendor-neutral graph computing framework whose Gremlin traversal language runs across many backends, letting you write property-graph traversals independent of the store beneath.",
      links: { docs: "https://tinkerpop.apache.org/docs/current/reference/" },
    },
    {
      id: "arangodb",
      name: "ArangoDB",
      type: "platform",
      languages: ["aql"],
      description:
        "A multi-model database that stores documents and graphs together; its AQL query language expresses variable-depth graph traversals alongside document filters in one query.",
      links: { docs: "https://docs.arangodb.com/stable/graphs/" },
    },
    {
      id: "dgraph",
      name: "Dgraph",
      type: "platform",
      languages: ["dql", "graphql"],
      description:
        "A distributed, natively sharded graph database with a GraphQL-native API; it addresses the hard problem of partitioning a graph by co-locating predicates to keep traversals fast.",
      links: { docs: "https://dgraph.io/docs/" },
    },
    {
      id: "janusgraph",
      name: "JanusGraph",
      type: "platform",
      languages: ["gremlin"],
      description:
        "An open-source, horizontally scalable property graph built on TinkerPop/Gremlin and backed by Cassandra, HBase, or ScyllaDB for storage plus Elasticsearch/Solr for indexing.",
      links: { docs: "https://docs.janusgraph.org/" },
    },
  ],

  usedInSystems: [
    {
      systemId: "social-network-graph",
      systemName: "Social network friend/follow graph + recommendations",
      howUsed:
        "The core friend/follow relationships are stored as edges so 'People You May Know' and mutual-connection features are variable-depth traversals rather than exploding self-joins; the same graph powers content and connection recommendations by walking two hops out from a user.",
      source: "https://engineering.fb.com/2013/06/25/core-infra/tao-the-power-of-the-graph/",
    },
    {
      systemId: "fraud-knowledge-graph",
      systemName: "Fraud-detection / knowledge-graph system",
      howUsed:
        "Accounts, devices, cards, and addresses are vertices linked by SHARES_* edges; a traversal of unknown depth surfaces fraud rings — clusters of accounts connected through shared attributes — that a relational model could only find with brittle, ever-deeper recursive joins.",
    },
  ],

  philosophy: {
    coreProblem:
      "Some of the most valuable questions are about connection, not about individual records: 'how are these two entities related, and how far apart are they?' Relational and document models can store the relationships but cannot cheaply traverse them to unknown depth — every extra hop is another join, and variable depth has no fixed query at all.",
    designPrinciple:
      "Make the relationship a first-class citizen. When an edge is real data with its own identity, type, direction, and properties, traversal becomes a native primitive: you walk outward across edges instead of matching keys across tables. The model should mirror the shape of the domain — a network of things connected to things.",
    historicalContext:
      "Graph-like data models trace back to the network and hierarchical databases that predated Codd's relational model; they were sidelined by relational's cleaner algebra, then returned in force in the 2000s (Neo4j, RDF/Semantic Web, later Amazon Neptune) as social, recommendation, and knowledge-graph workloads made variable-depth traversal a mainstream need. Kleppmann frames them in DDIA Ch. 2 as the model for data with many-to-many relationships.",
    alternativesRejected: [
      "Normalized relational with recursive CTEs — correct, but the WITH RECURSIVE query is verbose, error-prone, and slow once the traversal is the hot path",
      "Document model with embedded references — following a link is a manual application-side dereference with no join or traversal support at all",
      "Denormalizing the whole neighborhood into one row/document — collapses under combinatorial explosion the moment relationships are deep or many-to-many",
    ],
    mentalModel:
      "A relational join asks 'which rows match on this key?' — a set operation over columns. A graph traversal asks 'walk outward from here and see where the edges take you' — a movement through a network. The graph model matches how you already think about a network: not as tables to be matched, but as a web of connections to be followed. Its gift and its curse are the same connectedness — cheap to traverse, hard to partition, so what makes reads elegant makes horizontal scale expensive.",
  },

  references: [
    {
      title: "Designing Data-Intensive Applications — Ch. 2 (Graph-Like Data Models: Cypher & SPARQL)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Neo4j Cypher Manual — Patterns and Variable-Length Relationships",
      url: "https://neo4j.com/docs/cypher-manual/current/patterns/",
      type: "documentation",
    },
    {
      title: "SPARQL 1.1 Query Language (W3C Recommendation)",
      url: "https://www.w3.org/TR/sparql11-query/",
      type: "documentation",
      author: "W3C",
    },
  ],

  tags: [
    "graph-database",
    "data-modeling",
    "traversal",
    "property-graph",
    "cypher",
    "sparql",
    "rdf",
    "kleppmann",
    "consistency",
  ],

  difficulty: "advanced",
};
