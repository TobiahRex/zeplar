import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SystemContextSchema } from "@/data/schema";
import { z } from "zod";

type SystemContext = z.infer<typeof SystemContextSchema>;

interface ArchitectureDiagramProps {
  systemContext: SystemContext;
  patternName: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
});

export function ArchitectureDiagram({
  systemContext,
  patternName,
}: ArchitectureDiagramProps) {
  const [activeView, setActiveView] = useState<string>("placement");
  const placementDiagramRef = useRef<HTMLDivElement>(null);
  const interactionsDiagramRef = useRef<HTMLDivElement>(null);

  const { typicalPlacement, interactsWith, architecturalBoundaries } =
    systemContext;

  // Generate a simple architecture diagram showing pattern placement
  const generatePlacementDiagram = (): string => {
    return `graph TB
    subgraph "Application Layer"
      APP[Application Logic]
    end

    subgraph "Infrastructure Layer"
      PATTERN["${patternName}<br/>(Pattern Implementation)"]
    end

    subgraph "External Dependencies"
      EXT[External Services/Resources]
    end

    APP --> PATTERN
    PATTERN --> EXT

    style PATTERN fill:#3b82f6,stroke:#2563eb,stroke-width:3px,color:#fff
    style APP fill:#374151,stroke:#4b5563,color:#fff
    style EXT fill:#374151,stroke:#4b5563,color:#fff`;
  };

  // Generate interaction diagram showing related patterns
  const generateInteractionsDiagram = (): string => {
    const relatedPatterns = interactsWith.slice(0, 5); // Limit to 5 for readability

    let diagram = `graph LR
    MAIN["${patternName}"]

`;

    relatedPatterns.forEach((pattern, idx) => {
      const nodeId = `P${idx}`;
      const displayName = pattern
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      diagram += `    ${nodeId}["${displayName}"]\n`;
      diagram += `    MAIN <--> ${nodeId}\n`;
    });

    diagram += `
    style MAIN fill:#3b82f6,stroke:#2563eb,stroke-width:3px,color:#fff
`;

    relatedPatterns.forEach((_, idx) => {
      diagram += `    style P${idx} fill:#374151,stroke:#4b5563,color:#fff\n`;
    });

    return diagram;
  };

  // Render mermaid diagrams
  useEffect(() => {
    const renderDiagrams = async () => {
      try {
        if (placementDiagramRef.current) {
          const placementDiagram = generatePlacementDiagram();
          const { svg: placementSvg } = await mermaid.render(
            `placement-${Date.now()}`,
            placementDiagram,
          );
          placementDiagramRef.current.innerHTML = placementSvg;
        }

        if (interactionsDiagramRef.current && interactsWith.length > 0) {
          const interactionsDiagram = generateInteractionsDiagram();
          const { svg: interactionsSvg } = await mermaid.render(
            `interactions-${Date.now()}`,
            interactionsDiagram,
          );
          interactionsDiagramRef.current.innerHTML = interactionsSvg;
        }
      } catch (error) {
        console.error("Failed to render mermaid diagram:", error);
      }
    };

    renderDiagrams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, patternName, interactsWith]);

  return (
    <div className="space-y-4">
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="placement">Placement</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
        </TabsList>

        {/* Placement Tab */}
        <TabsContent value="placement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typical Placement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Placement description */}
              <div className="space-y-2">
                {typicalPlacement.map((placement, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {placement}
                  </p>
                ))}
              </div>

              {/* Diagram */}
              <div
                ref={placementDiagramRef}
                className="flex justify-center items-center p-4 bg-muted/30 rounded-lg min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pattern Interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interactsWith.length > 0 ? (
                <>
                  {/* Interaction diagram */}
                  <div
                    ref={interactionsDiagramRef}
                    className="flex justify-center items-center p-4 bg-muted/30 rounded-lg min-h-[300px]"
                  />

                  {/* List of interacting patterns */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Related Patterns
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {interactsWith.map((pattern, idx) => (
                        <Badge key={idx} variant="secondary">
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
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pattern interactions documented yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boundaries Tab */}
        <TabsContent value="boundaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Architectural Boundaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {architecturalBoundaries.length > 0 ? (
                <div className="space-y-4">
                  {architecturalBoundaries.map((boundary, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border bg-card space-y-2"
                    >
                      <p className="text-sm">{boundary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No architectural boundaries documented yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
