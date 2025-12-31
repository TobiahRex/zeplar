import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayerBadge } from "@/components/LayerBadge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { CodeBlock } from "@/components/CodeBlock";
import type { Flashcard } from "@/lib/cardGenerator";

interface CardFrontProps {
  card: Flashcard;
  onFlip: () => void;
}

// Extract mermaid diagrams from text
function extractMermaidDiagram(text: string): {
  hasDiagram: boolean;
  diagram?: string;
  cleanText: string;
} {
  const mermaidRegex = /```mermaid\n([\s\S]+?)\n```/;
  const match = text.match(mermaidRegex);

  if (match) {
    return {
      hasDiagram: true,
      diagram: match[1],
      cleanText: text.replace(mermaidRegex, "").trim(),
    };
  }

  return {
    hasDiagram: false,
    cleanText: text,
  };
}

// Extract code blocks from text
function extractCodeBlock(text: string): {
  hasCode: boolean;
  code?: string;
  language?: string;
  cleanText: string;
} {
  const codeRegex = /```(\w+)?\n([\s\S]+?)\n```/;
  const match = text.match(codeRegex);

  if (match) {
    return {
      hasCode: true,
      language: match[1] || "typescript",
      code: match[2],
      cleanText: text.replace(codeRegex, "").trim(),
    };
  }

  return {
    hasCode: false,
    cleanText: text,
  };
}

export function CardFront({ card, onFlip }: CardFrontProps) {
  const {
    hasDiagram,
    diagram,
    cleanText: textWithoutDiagram,
  } = extractMermaidDiagram(card.front.text);
  const {
    hasCode,
    code,
    language,
    cleanText: finalText,
  } = extractCodeBlock(textWithoutDiagram);

  return (
    <Card className="h-full flex flex-col relative">
      {/* Layer badge in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LayerBadge
          layer={`L${card.layer}` as "L1" | "L2" | "L3" | "L4" | "L5" | "L6"}
        />
      </div>

      <CardContent className="flex-1 flex flex-col p-8 overflow-y-auto">
        {card.front.hint && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Hint
            </p>
            <MarkdownRenderer content={card.front.hint} className="text-sm" />
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Question
          </p>
          <MarkdownRenderer content={finalText} className="text-base" />
        </div>

        {/* Render mermaid diagram if present */}
        {hasDiagram && diagram && (
          <div className="mb-6">
            <MermaidDiagram chart={diagram} />
          </div>
        )}

        {/* Render code block if present */}
        {hasCode && code && (
          <div className="mb-6">
            <CodeBlock
              code={code}
              language={language}
              showLineNumbers={false}
              maxHeight="400px"
            />
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t">
        <Button onClick={onFlip} className="w-full" size="lg">
          Show Answer
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Space to flip
        </p>
      </div>
    </Card>
  );
}
