import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FogTransitionProps {
  currentTab: string;
  children: React.ReactNode;
}

export default function FogTransition({ currentTab, children }: FogTransitionProps) {
  const [isFogging, setIsFogging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Whenever tab changes, trigger rolling fog animation overlay
    setIsFogging(true);
    const timer = setTimeout(() => {
      setIsFogging(false);
    }, 850); // fast crisp fog duration

    return () => clearTimeout(timer);
  }, [currentTab]);

  const sporeCount = isMobile ? 8 : 14;

  return (
    <div className="relative w-full min-h-full">
      {/* Page Content with Framer Motion crisp GPU slide/fade transition */}
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

      {/* Atmospheric Rolling Forest Fog & Mist Transition Overlay */}
      <AnimatePresence>
        {isFogging && (
          <div className="fixed inset-0 z-[2000] pointer-events-none overflow-hidden flex items-center justify-center transform-gpu">
            {/* Wave 1: Primary Dense Sweeping Fog Cloud Bank */}
            <motion.div
              initial={{ x: "-120%", opacity: 0, scaleY: 0.95 }}
              animate={{
                x: ["-120%", "0%", "120%"],
                opacity: [0, 0.9, 0.9, 0.6, 0],
                scaleY: [0.95, 1.05, 1],
              }}
              transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
              className={`absolute inset-0 w-[220%] h-full bg-gradient-to-r from-transparent via-[#021d16]/95 via-[#064232]/85 via-[#00ffc8]/15 via-[#02241b]/95 to-transparent ${
                isMobile ? "backdrop-blur-sm" : "backdrop-blur-md"
              } transform-gpu`}
              style={{
                maskImage:
                  "radial-gradient(ellipse at center, black 60%, transparent 95%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, black 60%, transparent 95%)",
              }}
            />

            {/* Wave 2: Swirling Radial Mist Billows */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{
                scale: [0.5, 1.3, 1.8],
                opacity: [0, 0.75, 0],
                rotate: [-10, 8, 20],
              }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className={`absolute w-[80vw] h-[70vh] rounded-full bg-gradient-to-tr from-[#00ffc8]/20 via-[#0a4838]/60 to-transparent ${
                isMobile ? "blur-[50px]" : "blur-[90px]"
              } transform-gpu`}
            />

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: 10 }}
              animate={{
                scale: [0.5, 1.2, 1.6],
                opacity: [0, 0.65, 0],
                rotate: [10, -8, -18],
              }}
              transition={{ duration: 0.85, ease: "easeOut", delay: 0.04 }}
              className={`absolute w-[75vw] h-[65vh] rounded-full bg-gradient-to-bl from-[#00e5ff]/20 via-[#032e22]/65 to-transparent ${
                isMobile ? "blur-[50px]" : "blur-[90px]"
              } transform-gpu`}
            />

            {/* Floating Forest Spore Particles during transition */}
            {[...Array(sporeCount)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${(i * 12) - 15}vw`,
                  y: `${40 + (i % 4) * 14}vh`,
                  scale: 0.2,
                  opacity: 0,
                }}
                animate={{
                  x: `${(i * 12) + 18}vw`,
                  y: `${18 + (i % 3) * 14}vh`,
                  scale: [0.2, 1.2, 0.3],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.02,
                  ease: "easeInOut",
                }}
                className="absolute w-3 h-3 rounded-full bg-[#00ffc8] shadow-[0_0_12px_#00ffc8] transform-gpu"
              />
            ))}

            {/* Volumetric Emerald Ray Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.95, 1.05, 1.1] }}
              transition={{ duration: 0.85 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,200,0.15),transparent_70%)] pointer-events-none transform-gpu"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
