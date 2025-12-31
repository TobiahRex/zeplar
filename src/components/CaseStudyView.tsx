import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemReference } from "@/data/schema";
import { ExternalLink, Building2, Info } from "lucide-react";

interface CaseStudyViewProps {
  usedInSystems: SystemReference[];
  patternName: string;
  relatedPatterns?: string[]; // For showing pattern composition
}

export function CaseStudyView({
  usedInSystems,
  patternName,
  relatedPatterns = [],
}: CaseStudyViewProps) {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<string | null>(
    usedInSystems.length > 0 ? usedInSystems[0].systemId : null,
  );

  if (!usedInSystems || usedInSystems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No real-world case studies documented yet for {patternName}.</p>
          <p className="text-sm mt-2">
            Check back later as we continue to add production examples.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedCase = usedInSystems.find(
    (cs) => cs.systemId === selectedCaseStudy,
  );

  return (
    <div className="space-y-4">
      {/* Case study selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {usedInSystems.map((caseStudy) => (
          <Card
            key={caseStudy.systemId}
            className={`min-w-[200px] cursor-pointer transition-all hover:border-primary ${
              selectedCaseStudy === caseStudy.systemId
                ? "border-primary bg-primary/5"
                : ""
            }`}
            onClick={() => setSelectedCaseStudy(caseStudy.systemId)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  {caseStudy.systemName}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {caseStudy.howUsed.substring(0, 60)}...
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected case study details */}
      {selectedCase && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-2xl">
                    {selectedCase.systemName}
                  </CardTitle>
                </div>
                <Badge variant="secondary">Production Case Study</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* How it's used */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                How {patternName} is Used
              </h3>
              <div className="p-4 rounded-lg border bg-muted/20">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedCase.howUsed}
                </p>
              </div>
            </div>

            {/* Pattern composition */}
            {relatedPatterns.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pattern Composition
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Patterns commonly used together with {patternName} in this
                  system:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {relatedPatterns.slice(0, 8).map((pattern, idx) => (
                    <Badge key={idx} variant="outline">
                      {pattern
                        .split("-")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Source link */}
            {selectedCase.source && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Source
                </h3>
                <a
                  href={selectedCase.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read the full case study
                </a>
              </div>
            )}

            {/* Key insights section */}
            <div className="p-4 rounded-lg border bg-card space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Key Insights
              </h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Real production system demonstrating {patternName} at scale
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Shows practical implementation challenges and solutions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Illustrates how the pattern composes with other patterns
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary grid of all case studies */}
      {usedInSystems.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            All Case Studies ({usedInSystems.length})
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {usedInSystems.map((caseStudy) => (
              <Card
                key={caseStudy.systemId}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedCaseStudy(caseStudy.systemId)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">
                      {caseStudy.systemName}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {caseStudy.howUsed}
                  </p>
                  {caseStudy.source && (
                    <a
                      href={caseStudy.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
