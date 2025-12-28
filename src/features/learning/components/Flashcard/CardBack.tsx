import { Card, CardContent } from "@/components/ui/card";
import { RatingButtons } from "./RatingButtons";
import { LayerBadge } from "@/components/LayerBadge";
import type { Flashcard } from "@/lib/cardGenerator";
import type { Quality } from "@/lib/sm2";

interface CardBackProps {
  card: Flashcard;
  onRate: (quality: Quality) => void;
}

export function CardBack({ card, onRate }: CardBackProps) {
  return (
    <Card className="h-full flex flex-col relative">
      {/* Layer badge in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LayerBadge layer={`L${card.layer}` as "L1" | "L2" | "L3"} />
      </div>

      <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-xl font-medium leading-relaxed mb-4">
          {card.back.text}
        </p>
        {card.back.details && card.back.details.length > 0 && (
          <ul className="text-left text-muted-foreground space-y-2 mt-4">
            {card.back.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
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
