import { Progress } from "@/components/ui/progress";
import { LayerBadge } from "./LayerBadge";
import type { LayerUnlockStatus } from "@/lib/layerUnlock";

interface MasteryBreakdownProps {
  patternId: string;
  patternName: string;
  layerUnlocks: LayerUnlockStatus;
}

export function MasteryBreakdown({
  patternName,
  layerUnlocks,
}: MasteryBreakdownProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-bold">{patternName}</h4>

      {/* L1 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L1" />
            <span className="text-sm">{layerUnlocks.l1Mastery}%</span>
          </div>
          {layerUnlocks.l2Unlocked && (
            <span className="text-xs text-green-500">✓ Unlocked L2!</span>
          )}
        </div>
        <Progress value={layerUnlocks.l1Mastery} />
      </div>

      {/* L2 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L2" locked={!layerUnlocks.l2Unlocked} />
            {layerUnlocks.l2Unlocked ? (
              <span className="text-sm">{layerUnlocks.l2Mastery}%</span>
            ) : (
              <span className="text-xs text-gray-400">🔒 Unlock at L1 80%</span>
            )}
          </div>
          {layerUnlocks.l3Unlocked && (
            <span className="text-xs text-green-500">✓ Unlocked L3!</span>
          )}
        </div>
        {layerUnlocks.l2Unlocked && <Progress value={layerUnlocks.l2Mastery} />}
      </div>

      {/* L3 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L3" locked={!layerUnlocks.l3Unlocked} />
            {layerUnlocks.l3Unlocked ? (
              <span className="text-sm">{layerUnlocks.l3Mastery}%</span>
            ) : (
              <span className="text-xs text-gray-400">🔒 Unlock at L2 80%</span>
            )}
          </div>
        </div>
        {layerUnlocks.l3Unlocked && <Progress value={layerUnlocks.l3Mastery} />}
      </div>
    </div>
  );
}
