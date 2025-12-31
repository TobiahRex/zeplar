import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CodeExampleSchema } from "@/data/schema";
import { z } from "zod";

type CodeExample = z.infer<typeof CodeExampleSchema>;

interface AnnotationOverlayProps {
  codeExample: CodeExample;
}

export function AnnotationOverlay({ codeExample }: AnnotationOverlayProps) {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string>("code");

  const { code, annotations, contextDilation } = codeExample;

  // Get the active annotation object
  const activeAnnotation = annotations?.find(
    (ann) => ann.id === activeAnnotationId,
  );

  // Calculate line highlights for active annotation
  const getHighlightedLines = (): Set<number> => {
    if (!activeAnnotation) return new Set();
    const [start, end] = activeAnnotation.lines;
    const lines = new Set<number>();
    for (let i = start; i <= end; i++) {
      lines.add(i);
    }
    return lines;
  };

  const highlightedLines = getHighlightedLines();

  // Split code into lines for highlighting
  const codeLines = code.split("\n");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="context">Context</TabsTrigger>
        <TabsTrigger value="annotations">Action-Reason</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>

      {/* Context Tab */}
      <TabsContent value="context" className="space-y-4">
        {contextDilation && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Dilation Level
                </h3>
                <Badge variant="outline" className="capitalize">
                  {contextDilation.level}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Scope
                </h3>
                <p className="text-sm">{contextDilation.scope}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  System Position
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {contextDilation.systemPosition}
                </p>
              </div>

              {contextDilation.prerequisites &&
                contextDilation.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Prerequisites
                    </h3>
                    <ul className="space-y-1">
                      {contextDilation.prerequisites.map((prereq, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Action-Reason Annotations Tab */}
      <TabsContent value="annotations" className="space-y-4">
        {annotations && annotations.length > 0 ? (
          <div className="grid gap-3">
            {annotations.map((annotation) => (
              <Card
                key={annotation.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  activeAnnotationId === annotation.id
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => {
                  setActiveAnnotationId(annotation.id);
                  setActiveTab("code");
                }}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Lines {annotation.lines[0]}-{annotation.lines[1]}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {annotation.contextLevel}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">
                      Action
                    </h4>
                    <p className="text-sm">{annotation.action}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                      Reason
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {annotation.reason}
                    </p>
                  </div>
                  {annotation.relatedConcepts &&
                    annotation.relatedConcepts.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {annotation.relatedConcepts.map((concept, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No annotations available for this code example.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Code Tab */}
      <TabsContent value="code" className="space-y-0">
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {/* Code display with line highlighting */}
            <div className="relative">
              {highlightedLines.size > 0 ? (
                // Custom line-by-line rendering with highlights
                <div className="font-mono text-sm bg-muted/30">
                  {codeLines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const isHighlighted = highlightedLines.has(lineNum);
                    return (
                      <div
                        key={idx}
                        className={`flex ${
                          isHighlighted
                            ? "bg-primary/20 border-l-4 border-primary"
                            : ""
                        }`}
                      >
                        <span className="inline-block w-12 text-right pr-3 text-muted-foreground select-none">
                          {lineNum}
                        </span>
                        <pre className="flex-1 overflow-x-auto px-3 py-0.5">
                          <code>{line}</code>
                        </pre>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Use CodeMirror when no highlights
                <CodeMirror
                  value={code}
                  extensions={[javascript({ jsx: true, typescript: true })]}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLineGutter: false,
                  }}
                  className="text-sm"
                />
              )}
            </div>

            {/* Active annotation info overlay */}
            {activeAnnotation && (
              <div className="border-t bg-card p-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    Lines {activeAnnotation.lines[0]}-
                    {activeAnnotation.lines[1]}
                  </Badge>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">
                      {activeAnnotation.action}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {activeAnnotation.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
