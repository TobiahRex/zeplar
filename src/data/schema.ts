import { z } from "zod";

// =============================================================================
// Enums and Primitives
// =============================================================================

export const SystemQualitySchema = z.enum([
  "performance",
  "reliability",
  "scalability",
  "security",
  "observability",
  "maintainability",
  "consistency",
]);

export const DifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const ContextLevelSchema = z.enum([
  "micro",
  "local",
  "module",
  "system",
  "ecosystem",
]);

export const LanguageSchema = z.enum([
  "typescript",
  "go",
  "python",
  "java",
  "rust",
]);

// =============================================================================
// Layer 1: Concept
// =============================================================================

export const ConceptSchema = z.object({
  name: z.string(),
  emoji: z.string(),
  tagline: z.string(),
  definition: z.string(),
  problemSolved: z.string(),
  tradeoffs: z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  }),
  relatedPatterns: z.array(z.string()),
});

// =============================================================================
// Layer 2: Structure & Behavior
// =============================================================================

export const ParticipantSchema = z.object({
  name: z.string(),
  role: z.string(),
  responsibilities: z.array(z.string()),
});

export const FlowStepSchema = z.object({
  step: z.number(),
  actor: z.string(),
  action: z.string(),
  description: z.string(),
});

export const StructureSchema = z.object({
  participants: z.array(ParticipantSchema),
  diagram: z.string(),
  flow: z.array(FlowStepSchema),
  invariants: z.array(z.string()),
});

// =============================================================================
// Layer 3: Code Expression
// =============================================================================

export const ActionReasonAnnotationSchema = z.object({
  id: z.string(),
  lines: z.tuple([z.number(), z.number()]),
  action: z.string(),
  reason: z.string(),
  contextLevel: ContextLevelSchema,
  relatedConcepts: z.array(z.string()).optional(),
});

export const CodeHighlightSchema = z.object({
  lines: z.tuple([z.number(), z.number()]),
  label: z.string(),
  sbvpDomain: z.enum(["structure", "behavior", "visualization", "philosophy"]),
});

export const ContextDilationSchema = z.object({
  level: ContextLevelSchema,
  scope: z.string(),
  prerequisites: z.array(z.string()),
  systemPosition: z.string(),
});

export const CodeExampleSchema = z.object({
  id: z.string(),
  language: LanguageSchema,
  title: z.string(),
  description: z.string(),
  code: z.string(),
  runnable: z.boolean().optional(),
  contextDilation: ContextDilationSchema.optional(),
  annotations: z.array(ActionReasonAnnotationSchema).optional(),
  highlights: z.array(CodeHighlightSchema).optional(),
});

// =============================================================================
// Layer 4: System Integration
// =============================================================================

export const SystemContextSchema = z.object({
  typicalPlacement: z.array(z.string()),
  interactsWith: z.array(z.string()),
  architecturalBoundaries: z.array(z.string()),
});

// =============================================================================
// Layer 5: Technology Mapping
// =============================================================================

export const ImplementationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["library", "framework", "service", "platform"]),
  languages: z.array(z.string()),
  description: z.string(),
  links: z.object({
    docs: z.string().optional(),
    github: z.string().optional(),
    npm: z.string().optional(),
  }),
  codeSnippet: z.string().optional(),
});

// =============================================================================
// Layer 6: System Composition
// =============================================================================

export const SystemReferenceSchema = z.object({
  systemId: z.string(),
  systemName: z.string(),
  howUsed: z.string(),
  source: z.string().optional(),
});

// =============================================================================
// SBVP Meta-Domains
// =============================================================================

export const UseCaseExampleSchema = z.object({
  domain: z.string(),
  scenario: z.string(),
  patternRole: z.string(),
  companies: z.array(z.string()).optional(),
});

export const PhilosophySchema = z.object({
  coreProblem: z.string(),
  designPrinciple: z.string(),
  historicalContext: z.string().optional(),
  alternativesRejected: z.array(z.string()),
  mentalModel: z.string(),
});

export const VisualizationSchema = z.object({
  staticDiagram: z.string(),
  animatedDiagram: z.string().optional(),
  realWorldAnalogy: z.string(),
  useCases: z.array(UseCaseExampleSchema),
});

// =============================================================================
// Hierarchy
// =============================================================================

export const HierarchySchema = z.object({
  quality: SystemQualitySchema,
  strategy: z.string(),
  family: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
  ]),
  parentId: z.string().optional(),
});

// =============================================================================
// Pattern Entity (Full)
// =============================================================================

export const PatternSchema = z.object({
  id: z.string(),
  slug: z.string(),
  corpusPath: z.string(),
  corpusLineNumber: z.number().optional(),
  hierarchy: HierarchySchema,
  concept: ConceptSchema,
  structure: StructureSchema,
  codeExamples: z.array(CodeExampleSchema),
  systemContext: SystemContextSchema.optional(),
  implementations: z.array(ImplementationSchema).optional(),
  usedInSystems: z.array(SystemReferenceSchema).optional(),
  philosophy: PhilosophySchema.optional(),
  visualization: VisualizationSchema.optional(),
  tags: z.array(z.string()).optional(),
  difficulty: DifficultySchema.optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type SystemQuality = z.infer<typeof SystemQualitySchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type ContextLevel = z.infer<typeof ContextLevelSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type ActionReasonAnnotation = z.infer<
  typeof ActionReasonAnnotationSchema
>;
export type CodeHighlight = z.infer<typeof CodeHighlightSchema>;
export type ContextDilation = z.infer<typeof ContextDilationSchema>;
export type CodeExample = z.infer<typeof CodeExampleSchema>;
export type SystemContext = z.infer<typeof SystemContextSchema>;
export type Implementation = z.infer<typeof ImplementationSchema>;
export type SystemReference = z.infer<typeof SystemReferenceSchema>;
export type UseCaseExample = z.infer<typeof UseCaseExampleSchema>;
export type Philosophy = z.infer<typeof PhilosophySchema>;
export type Visualization = z.infer<typeof VisualizationSchema>;
export type Hierarchy = z.infer<typeof HierarchySchema>;
export type Pattern = z.infer<typeof PatternSchema>;
