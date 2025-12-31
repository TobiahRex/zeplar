import { Card, CardContent } from "@/components/ui/card";
import { RatingButtons } from "./RatingButtons";
import { LayerBadge } from "@/components/LayerBadge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { AnnotationOverlay } from "@/components/AnnotationOverlay";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { TechComparison } from "@/components/TechComparison";
import { CaseStudyView } from "@/components/CaseStudyView";
import { useAppSelector } from "@/app/hooks";
import { selectPatternById } from "@/features/patterns/patternsSlice";
import type { Flashcard } from "@/lib/cardGenerator";
import type { Quality } from "@/lib/sm2";

interface CardBackProps {
  card: Flashcard;
  onRate: (quality: Quality) => void;
}

export function CardBack({ card, onRate }: CardBackProps) {
  // Get full pattern data for advanced components
  const pattern = useAppSelector((state) =>
    selectPatternById(state, card.patternId),
  );

  // Check if we should render advanced components based on layer and available data
  const shouldShowAnnotationOverlay =
    card.layer === 3 &&
    card.questionType === "action-reason" &&
    pattern?.codeExamples?.[0]?.annotations &&
    pattern.codeExamples[0].annotations.length > 0;

  const shouldShowArchitectureDiagram =
    card.layer === 4 && pattern?.systemContext;

  const shouldShowTechComparison =
    card.layer === 5 &&
    pattern?.implementations &&
    pattern.implementations.length > 0;

  const shouldShowCaseStudyView =
    card.layer === 6 &&
    pattern?.usedInSystems &&
    pattern.usedInSystems.length > 0;

  const shouldShowReferences =
    card.layer === 1 && pattern?.references && pattern.references.length > 0;

  const hasAdvancedComponent =
    shouldShowAnnotationOverlay ||
    shouldShowArchitectureDiagram ||
    shouldShowTechComparison ||
    shouldShowCaseStudyView ||
    shouldShowReferences;

  return (
    <Card className="h-full flex flex-col relative">
      {/* Layer badge in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LayerBadge
          layer={`L${card.layer}` as "L1" | "L2" | "L3" | "L4" | "L5" | "L6"}
        />
      </div>

      <CardContent className="flex-1 flex flex-col p-8 overflow-y-auto">
        {/* Standard answer text */}
        <div className={`${hasAdvancedComponent ? "mb-6" : "flex-1"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Answer
          </p>
          <MarkdownRenderer
            content={card.back.text}
            className="text-base mb-4"
          />
          {card.back.details && card.back.details.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Details
              </p>
              {card.back.details.map((detail, i) => (
                <MarkdownRenderer
                  key={i}
                  content={`- ${detail}`}
                  className="text-sm"
                />
              ))}
            </div>
          )}

          {/* Render diagram if present */}
          {card.back.diagram && (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Diagram
              </p>
              <MermaidDiagram chart={card.back.diagram} />
            </div>
          )}
        </div>

        {/* Advanced components based on layer */}
        {shouldShowAnnotationOverlay && pattern && (
          <div className="mt-4">
            <AnnotationOverlay codeExample={pattern.codeExamples[0]} />
          </div>
        )}

        {shouldShowArchitectureDiagram && pattern?.systemContext && (
          <div className="mt-4">
            <ArchitectureDiagram
              systemContext={pattern.systemContext}
              patternName={pattern.concept.name}
            />
          </div>
        )}

        {shouldShowTechComparison && pattern?.implementations && (
          <div className="mt-4">
            <TechComparison
              implementations={pattern.implementations}
              patternName={pattern.concept.name}
            />
          </div>
        )}

        {shouldShowCaseStudyView && pattern?.usedInSystems && (
          <div className="mt-4">
            <CaseStudyView
              usedInSystems={pattern.usedInSystems}
              patternName={pattern.concept.name}
              relatedPatterns={pattern.concept.relatedPatterns}
            />
          </div>
        )}

        {shouldShowReferences && pattern?.references && (
          <div className="mt-6 p-4 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              Further Reading
            </p>
            <div className="space-y-2">
              {pattern.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-md bg-card hover:bg-accent transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {ref.title}
                      </p>
                      {ref.author && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {ref.author}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                        {ref.type.replace(/-/g, " ")}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" x2="21" y1="14" y2="3" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground text-center mb-3">
          How well did you know this?
        </p>
        <RatingButtons onRate={onRate} />
      </div>
    </Card>
  );
}
