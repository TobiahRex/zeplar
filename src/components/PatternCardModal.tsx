import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Pattern } from "@/data/schema";
import type { Flashcard } from "@/lib/cardGenerator";
import {
  generateL1Cards,
  generateL2Cards,
  generateL3Cards,
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

  // Generate all cards for this pattern (L1, L2, L3)
  const l1Cards = generateL1Cards(pattern);
  const l2Cards = generateL2Cards(pattern);
  const l3Cards = generateL3Cards(pattern);
  const allCards: Flashcard[] = [...l1Cards, ...l2Cards, ...l3Cards];

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Card content */}
          <div className="min-h-[300px] p-6 rounded-lg border bg-card">
            {!showBack ? (
              // Front of card
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Question
                </div>
                <div className="text-lg whitespace-pre-wrap">
                  {currentCard.front.text}
                </div>
                {currentCard.front.hint && (
                  <div className="mt-4 p-3 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Hint
                    </div>
                    <div className="text-sm">{currentCard.front.hint}</div>
                  </div>
                )}
                {currentCard.hints && currentCard.hints.length > 0 && (
                  <div className="mt-4 p-3 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Hints
                    </div>
                    <ul className="text-sm space-y-1">
                      {currentCard.hints.map((hint, i) => (
                        <li key={i}>• {hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              // Back of card
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Answer
                </div>
                <div className="text-lg whitespace-pre-wrap">
                  {currentCard.back.text}
                </div>
                {currentCard.back.details &&
                  currentCard.back.details.length > 0 && (
                    <div className="mt-4 p-3 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Details
                      </div>
                      <ul className="text-sm space-y-1">
                        {currentCard.back.details.map((detail, i) => (
                          <li key={i} className="whitespace-pre-wrap">
                            • {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {currentCard.back.diagram && (
                  <div className="mt-4 p-3 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Diagram
                    </div>
                    <pre className="text-xs overflow-x-auto">
                      {currentCard.back.diagram}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
