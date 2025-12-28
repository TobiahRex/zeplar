import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface CardFlipProps {
  isFlipped: boolean;
  front: ReactNode;
  back: ReactNode;
}

export function CardFlip({ isFlipped, front, back }: CardFlipProps) {
  return (
    <div className="relative w-full h-[400px] perspective-1000">
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {front}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {back}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
