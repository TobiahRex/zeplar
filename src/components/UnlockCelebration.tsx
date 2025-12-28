import { motion } from "framer-motion";

interface UnlockCelebrationProps {
  layer: "L2" | "L3";
  patternName: string;
  onClose: () => void;
}

export function UnlockCelebration({
  layer,
  patternName,
  onClose,
}: UnlockCelebrationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-lg text-white text-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-4xl font-bold my-4">{layer} Unlocked!</h2>
        <p className="text-xl mb-2">{patternName}</p>
        <p className="text-sm text-gray-200 mb-6">
          You've achieved 80% mastery. New cards are now available!
        </p>
        <button
          onClick={onClose}
          className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </motion.div>
  );
}
