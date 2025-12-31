import { cn } from "@/lib/utils";

interface LayerBadgeProps {
  layer: "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
  locked?: boolean;
}

export function LayerBadge({ layer, locked }: LayerBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs font-bold",
        layer === "L1" && "bg-blue-500 text-white",
        layer === "L2" && !locked && "bg-purple-500 text-white",
        layer === "L3" && !locked && "bg-amber-500 text-white",
        layer === "L4" && !locked && "bg-green-500 text-white",
        layer === "L5" && !locked && "bg-cyan-500 text-white",
        layer === "L6" && !locked && "bg-pink-500 text-white",
        locked && "bg-gray-400 text-gray-200",
      )}
    >
      {layer} {locked && "🔒"}
    </span>
  );
}
