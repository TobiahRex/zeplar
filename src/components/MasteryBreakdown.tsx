import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LayerBadge } from "./LayerBadge";
import type { LayerUnlockStatus } from "@/lib/layerUnlock";

interface MasteryBreakdownProps {
  patternId: string;
  patternName: string;
  patternEmoji: string;
  family: string;
  layerUnlocks: LayerUnlockStatus;
  onClick?: () => void;
}

// Color mapping for family badges (matching Dashboard)
const familyColors: Record<string, string> = {
  "Circuit Breakers": "bg-rose-500/20 text-rose-400",
  Retries: "bg-sky-500/20 text-sky-400",
  "Retry Strategies": "bg-sky-500/20 text-sky-400",
  Caching: "bg-lime-500/20 text-lime-400",
  Bulkheads: "bg-violet-500/20 text-violet-400",
  Timeouts: "bg-fuchsia-500/20 text-fuchsia-400",
  "Flow Control": "bg-yellow-500/20 text-yellow-400",
  "Data Access Patterns": "bg-blue-500/20 text-blue-400",
  "Data Integrity": "bg-teal-500/20 text-teal-400",
  Degradation: "bg-orange-500/20 text-orange-400",
  "Event-Driven Architecture": "bg-purple-500/20 text-purple-400",
  "Load Management": "bg-red-500/20 text-red-400",
  Monitoring: "bg-cyan-500/20 text-cyan-400",
  "Stream Processing": "bg-indigo-500/20 text-indigo-400",
  "Traffic Management": "bg-pink-500/20 text-pink-400",
  "Transaction Management": "bg-emerald-500/20 text-emerald-400",
  "Transactional Messaging": "bg-amber-500/20 text-amber-400",
};

export function MasteryBreakdown({
  patternName,
  patternEmoji,
  family,
  layerUnlocks,
  onClick,
}: MasteryBreakdownProps) {
  return (
    <div
      className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{patternEmoji}</span>
          <h4 className="font-bold">{patternName}</h4>
        </div>
        <Badge
          className={`${familyColors[family] || "bg-gray-500/20 text-gray-400"} border-0 text-xs shrink-0`}
        >
          {family}
        </Badge>
      </div>

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
          {layerUnlocks.l4Unlocked && (
            <span className="text-xs text-green-500">✓ Unlocked L4!</span>
          )}
        </div>
        {layerUnlocks.l3Unlocked && <Progress value={layerUnlocks.l3Mastery} />}
      </div>

      {/* L4 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L4" locked={!layerUnlocks.l4Unlocked} />
            {layerUnlocks.l4Unlocked ? (
              <span className="text-sm">{layerUnlocks.l4Mastery}%</span>
            ) : (
              <span className="text-xs text-gray-400">🔒 Unlock at L3 80%</span>
            )}
          </div>
          {layerUnlocks.l5Unlocked && (
            <span className="text-xs text-green-500">✓ Unlocked L5!</span>
          )}
        </div>
        {layerUnlocks.l4Unlocked && <Progress value={layerUnlocks.l4Mastery} />}
      </div>

      {/* L5 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L5" locked={!layerUnlocks.l5Unlocked} />
            {layerUnlocks.l5Unlocked ? (
              <span className="text-sm">{layerUnlocks.l5Mastery}%</span>
            ) : (
              <span className="text-xs text-gray-400">🔒 Unlock at L4 80%</span>
            )}
          </div>
          {layerUnlocks.l6Unlocked && (
            <span className="text-xs text-green-500">✓ Unlocked L6!</span>
          )}
        </div>
        {layerUnlocks.l5Unlocked && <Progress value={layerUnlocks.l5Mastery} />}
      </div>

      {/* L6 Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayerBadge layer="L6" locked={!layerUnlocks.l6Unlocked} />
            {layerUnlocks.l6Unlocked ? (
              <span className="text-sm">{layerUnlocks.l6Mastery}%</span>
            ) : (
              <span className="text-xs text-gray-400">🔒 Unlock at L5 80%</span>
            )}
          </div>
        </div>
        {layerUnlocks.l6Unlocked && <Progress value={layerUnlocks.l6Mastery} />}
      </div>
    </div>
  );
}
