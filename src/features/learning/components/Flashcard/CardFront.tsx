import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayerBadge } from "@/components/LayerBadge";
import type { Flashcard } from "@/lib/cardGenerator";

interface CardFrontProps {
  card: Flashcard;
  onFlip: () => void;
}

export function CardFront({ card, onFlip }: CardFrontProps) {
  return (
    <Card className="h-full flex flex-col relative">
      {/* Layer badge in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LayerBadge layer={`L${card.layer}` as "L1" | "L2" | "L3"} />
      </div>

      <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {card.front.hint && (
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">
            {card.front.hint}
          </p>
        )}
        <h2 className="text-2xl font-semibold leading-relaxed">
          {card.front.text}
        </h2>
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
