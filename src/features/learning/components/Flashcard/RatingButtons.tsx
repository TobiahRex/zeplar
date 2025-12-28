import { Button } from "@/components/ui/button";
import type { Quality } from "@/lib/sm2";

interface RatingButtonsProps {
  onRate: (quality: Quality) => void;
}

const ratings: {
  quality: Quality;
  label: string;
  shortcut: string;
  color: string;
}[] = [
  {
    quality: 0,
    label: "Blackout",
    shortcut: "1",
    color: "bg-red-500/10 hover:bg-red-500/20 text-red-500",
  },
  {
    quality: 1,
    label: "Wrong",
    shortcut: "2",
    color: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500",
  },
  {
    quality: 2,
    label: "Familiar",
    shortcut: "3",
    color: "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500",
  },
  {
    quality: 3,
    label: "Hard",
    shortcut: "4",
    color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-500",
  },
  {
    quality: 4,
    label: "Good",
    shortcut: "5",
    color: "bg-green-500/10 hover:bg-green-500/20 text-green-500",
  },
  {
    quality: 5,
    label: "Easy",
    shortcut: "6",
    color: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500",
  },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ratings.map(({ quality, label, shortcut, color }) => (
        <Button
          key={quality}
          variant="ghost"
          className={`flex flex-col h-auto py-2 ${color}`}
          onClick={() => onRate(quality)}
        >
          <span className="text-xs opacity-60">{shortcut}</span>
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}
