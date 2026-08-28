import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface FogTransitionProps {
  currentTab: string;
  children: React.ReactNode;
}

export default function FogTransition({ currentTab, children }: FogTransitionProps) {
  return (
    <div className="relative w-full min-h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.985 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full transform-gpu will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
