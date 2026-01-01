import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import type { Pattern } from "@/data/schema";
import type { Flashcard } from "@/lib/cardGenerator";
import {
  generateL1Cards,
  generateL2Cards,
  generateL3Cards,
  generateL4Cards,
  generateL5Cards,
  generateL6Cards,
} from "@/lib/cardGenerator";

interface PatternCardModalProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PatternCardModal({
  pattern,
  isOpen,
  onClose,
}: PatternCardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  if (!pattern) return null;

  // Generate all cards for this pattern (L1-L6)
  const l1Cards = generateL1Cards(pattern);
  const l2Cards = generateL2Cards(pattern);
  const l3Cards = generateL3Cards(pattern);
  const l4Cards = generateL4Cards(pattern);
  const l5Cards = generateL5Cards(pattern);
  const l6Cards = generateL6Cards(pattern);
  const allCards: Flashcard[] = [
    ...l1Cards,
    ...l2Cards,
    ...l3Cards,
    ...l4Cards,
    ...l5Cards,
    ...l6Cards,
  ];

  if (allCards.length === 0) return null;

  const currentCard = allCards[currentIndex];

  const handleNext = () => {
    setShowBack(false);
    setCurrentIndex((prev) => (prev + 1) % allCards.length);
  };

  const handlePrev = () => {
    setShowBack(false);
    setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
  };

  const handleFlip = () => {
    setShowBack((prev) => !prev);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setShowBack(false);
    onClose();
  };

  // Layer badge colors
  const layerColors: Record<number, string> = {
    1: "bg-blue-500/20 text-blue-400",
    2: "bg-purple-500/20 text-purple-400",
    3: "bg-orange-500/20 text-orange-400",
    4: "bg-green-500/20 text-green-400",
    5: "bg-yellow-500/20 text-yellow-400",
    6: "bg-pink-500/20 text-pink-400",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[75vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{pattern.concept.emoji}</span>
            <span>{pattern.concept.name}</span>
            <Badge className="ml-auto">
              {currentIndex + 1} / {allCards.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card metadata */}
          <div className="flex gap-2">
            <Badge className={`${layerColors[currentCard.layer]} border-0`}>
              L{currentCard.layer}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {currentCard.questionType.replace(/-/g, " ")}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {currentCard.sbvpDomain}
            </Badge>
          </div>

          {/* Controls - Fixed position above dynamic content */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrev}
              variant="outline"
              disabled={allCards.length <= 1}
            >
              ← Previous
            </Button>
            <Button onClick={handleFlip} size="lg">
              {showBack ? "Show Question" : "Show Answer"}
            </Button>
            <Button
              onClick={handleNext}
              variant="outline"
              disabled={allCards.length <= 1}
            >
              Next →
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-1 justify-center">
            {allCards.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Card content */}
          <div className="min-h-[300px] p-6 rounded-lg border bg-card">
            {!showBack ? (
              // Front of card
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Question
                </div>
                <div className="mx-auto">
                  <MarkdownRenderer
                    content={currentCard.front.text}
                    className="text-lg leading-[1.75] font-serif constrain-text"
                  />
                </div>
                {currentCard.front.hint && (
                  <div className="mt-4 p-3 rounded bg-muted/50 max-w-[500px] mx-auto">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Hint
                    </div>
                    <MarkdownRenderer
                      content={currentCard.front.hint}
                      className="text-sm leading-[1.75] font-serif"
                    />
                  </div>
                )}
                {currentCard.hints && currentCard.hints.length > 0 && (
                  <div className="mt-4 p-3 rounded bg-muted/50 max-w-[500px] mx-auto">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Hints
                    </div>
                    <div className="space-y-1">
                      {currentCard.hints.map((hint, i) => (
                        <MarkdownRenderer
                          key={i}
                          content={`- ${hint}`}
                          className="text-sm leading-[1.75] font-serif"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Back of card
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Answer
                </div>
                <div className="mx-auto">
                  <MarkdownRenderer
                    content={currentCard.back.text}
                    className="text-base leading-[1.75] font-serif constrain-text"
                  />
                </div>
                {currentCard.back.details &&
                  currentCard.back.details.length > 0 && (
                    <div className="mt-4 space-y-2 max-w-[500px] mx-auto">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Details
                      </div>
                      {currentCard.back.details.map((detail, i) => (
                        <MarkdownRenderer
                          key={i}
                          content={`- ${detail}`}
                          className="text-sm leading-[1.75] font-serif"
                        />
                      ))}
                    </div>
                  )}
                {currentCard.back.diagram && (
                  <div className="mt-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                      Diagram
                    </div>
                    <MermaidDiagram chart={currentCard.back.diagram} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* References section - always visible */}
          {pattern?.references && pattern.references.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
