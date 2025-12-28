import { Lock } from "lucide-react";

interface LockedCardOverlayProps {
  layer: "L2" | "L3";
  currentMastery: number;
  requiredMastery: number; // 80
  prerequisiteLayer: "L1" | "L2";
}

export function LockedCardOverlay({
  layer,
  currentMastery,
  requiredMastery,
  prerequisiteLayer,
}: LockedCardOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
      <div className="text-center text-white">
        <Lock className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">{layer} Locked</h3>
        <p className="text-gray-300 mb-4">
          You need {requiredMastery}% mastery of {prerequisiteLayer} cards to
          unlock {layer}.
        </p>
        <div className="mb-2">
          <span className="text-3xl font-bold">{currentMastery}%</span>
          <span className="text-gray-400"> / {requiredMastery}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(currentMastery / requiredMastery) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-400">
          Keep studying {prerequisiteLayer} cards!
        </p>
      </div>
    </div>
  );
}
