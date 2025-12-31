import type { Pattern } from "../schema";

export const contractTesting: Pattern = {
  id: "contract-testing",
  slug: "contract-testing",
  corpusPath: "🔧 MAINTAINABILITY → 🧪 Testability → 🔗 Contract Testing",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Testability",
    level: 4,
  },

  concept: {
    name: "Contract Testing",
    emoji: "🔗",
    tagline: "Validate service interactions",
    definition:
      "Contract Testing verifies that services meet the expectations of their consumers without requiring end-to-end integration tests, using consumer-driven contracts to ensure API compatibility across independent deployments. Like a legal contract where parties agree on terms before signing, services establish explicit contracts defining expected requests and responses, then both sides verify compliance. The consumer (frontend, downstream service) defines contract expectations: 'When I call GET /users/123, I expect {id: 123, name: string, email: string}.' This contract is published to a contract broker (Pact Broker). The provider (API service) retrieves the contract and runs tests verifying it can fulfill those expectations. If tests pass, both sides know they're compatible without spinning up the entire system. Popular frameworks include Pact (consumer-driven contracts with broker), Spring Cloud Contract (provider-driven with stub generation), and Specmatic (OpenAPI-based). The pattern operates in two phases: consumer tests generate contracts by recording expected interactions with a mock provider, then provider tests verify the real service satisfies all consumer contracts. Advanced features include versioning (handle multiple consumer versions), contract evolution (add fields without breaking), and bi-directional contracts (both consumer and provider verify). The key insight: contracts catch breaking changes at test time rather than runtime, enabling independent service deployments with confidence.",
    problemSolved:
      "Microservices architectures require testing service integrations to prevent breaking changes, but traditional approaches fail at scale. End-to-end tests that spin up all services are slow, flaky (network, database), expensive (require full test environments), and brittle (one flaky service breaks all tests). Alternatively, mocking all dependencies in unit tests provides no confidence that services actually integrate correctly—mocks can diverge from real implementations, passing tests but breaking production. Contract testing solves this by testing integration points in isolation without coordinating deployments. When the frontend team changes their UserService API call expectations, the contract test fails immediately if the backend hasn't updated the endpoint—catching incompatibilities before deployment. This enables independent releases: backend teams can confidently deploy API changes knowing consumer contracts verify compatibility. The pattern also addresses the versioning problem: contracts document which consumers use which API versions, so providers know when old versions can be deprecated. Additionally, contract testing speeds CI/CD: instead of waiting 30 minutes for end-to-end tests, contract tests run in seconds since they test only the integration contract, not business logic.",
    tradeoffs: {
      pros: [
        "Catches API breaking changes at test time before deployment, preventing production incidents",
        "Enables independent service deployments without coordinating end-to-end tests",
        "Faster than integration tests—run in seconds without spinning up entire service graph",
        "Documents API expectations from consumer perspective, improving discoverability",
        "Reduces coupling—teams develop against contracts, not live services or mocks",
        "Supports API versioning by tracking which consumers use which contract versions",
      ],
      cons: [
        "Requires cultural shift—teams must adopt consumer-driven contract workflow",
        "Contract broker becomes single point of failure requiring operational overhead",
        "Does not test business logic—only verifies request/response structure, not correctness",
        "Difficult to model complex scenarios like stateful interactions or side effects",
        "Learning curve for Pact or similar frameworks with their DSLs and tooling",
        "Can create false confidence—passing contracts doesn't guarantee end-to-end system correctness",
      ],
    },
    relatedPatterns: [
      "microservices",
      "api-versioning",
      "integration-testing",
      "consumer-driven-contracts",
      "schema-registry",
      "openapi",
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
      id: "contract-testing-ts-basic",
      language: "typescript",
      title: "TODO: Contract Testing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Contract Testing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
