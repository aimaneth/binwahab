import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AddToCartAnimationProps {
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  onComplete?: () => void;
}

export function AddToCartAnimation({
  sourcePosition,
  targetPosition,
  onComplete,
}: AddToCartAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Reset animation state when positions change
    setIsAnimating(true);
  }, [sourcePosition, targetPosition]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ 
            opacity: 1,
            scale: 1,
            x: sourcePosition.x,
            y: sourcePosition.y,
          }}
          animate={{
            opacity: 0,
            scale: 0.5,
            x: targetPosition.x,
            y: targetPosition.y,
          }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            duration: 0.7,
            bounce: 0.3
          }}
          onAnimationComplete={() => {
            setIsAnimating(false);
            onComplete?.();
          }}
          className="fixed z-50 w-4 h-4 bg-primary rounded-full pointer-events-none"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
          }}
        />
      )}
    </AnimatePresence>
  );
} 