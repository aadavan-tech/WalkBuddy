import React, { useEffect, useRef, useState } from "react";

interface FirefliesCanvasProps {
  density?: "calm" | "magical" | "swarm";
  isActiveWorkout?: boolean;
}

interface Firefly {
  x: number;
  y: number;
  z: number; // Depth for 3D parallax
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  vz: number;
  alpha: number;
  maxAlpha: number;
  colorIndex: number;
  hueOffset: number;
}

// Pre-render glow sprite canvases for each color to avoid creating radial gradients on every frame
const createGlowSprite = (color: string, size = 64): HTMLCanvasElement => {
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const sCtx = sprite.getContext("2d");
  if (!sCtx) return sprite;

  const center = size / 2;
  const grad = sCtx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color + "80");
  grad.addColorStop(0.65, color + "20");
  grad.addColorStop(1, "transparent");

  sCtx.fillStyle = grad;
  sCtx.beginPath();
  sCtx.arc(center, center, center, 0, Math.PI * 2);
  sCtx.fill();

  return sprite;
};

export default function FirefliesCanvas({
  density = "magical",
  isActiveWorkout = false,
}: FirefliesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  const [fireflyCount, setFireflyCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detect mobile for hardware optimization
    const isMobile = window.innerWidth < 768 || ("ontouchstart" in window);
    // Clamp devicePixelRatio to max 1.5 to avoid pixel fill rate lag on high-DPI retina screens
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener("resize", handleResize);

    // Track mouse / touch position
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Determine count based on density mode & device performance capability
    const baseCount =
      density === "calm"
        ? 45
        : density === "swarm" || isActiveWorkout
        ? 120
        : 85;

    // Scale count for mobile viewports while keeping visually identical density
    const count = isMobile ? Math.floor(baseCount * 0.45) : baseCount;

    setFireflyCount(count);

    // Bioluminescent palette
    const colors = [
      "#00ffc8", // Electric emerald
      "#00e5ff", // Ethereal cyan
      "#adff2f", // Bio green
      "#c3f400", // Neon lime
      "#ffea00", // Warm amber golden
      "#38bdf8", // Sky sparkle
    ];

    // Pre-generate glow sprites for all 6 palette colors
    const glowSprites = colors.map((c) => createGlowSprite(c, isMobile ? 48 : 64));

    // Create fireflies
    const fireflies: Firefly[] = [];
    for (let i = 0; i < count; i++) {
      const z = Math.random() * 0.85 + 0.15; // depth from 0.15 to 1.0
      const baseRadius = (Math.random() * 2.8 + 1.2) * z;
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: baseRadius,
        baseRadius,
        vx: (Math.random() - 0.5) * 0.8 * z * (isActiveWorkout ? 1.6 : 1),
        vy: (Math.random() - 0.5) * 0.8 * z * (isActiveWorkout ? 1.6 : 1),
        vz: (Math.random() - 0.5) * 0.005,
        alpha: Math.random() * 0.8 + 0.2,
        maxAlpha: Math.random() * 0.5 + 0.5,
        colorIndex: Math.floor(Math.random() * colors.length),
        hueOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      // Pause rendering if document is hidden to save battery & CPU
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.015;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Render magnificent glow highlight around cursor if active
      if (mouseRef.current.active) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const cursorGlow = ctx.createRadialGradient(mx, my, 0, mx, my, isMobile ? 120 : 160);
        cursorGlow.addColorStop(0, "rgba(0, 255, 200, 0.16)");
        cursorGlow.addColorStop(0.5, "rgba(0, 229, 255, 0.05)");
        cursorGlow.addColorStop(1, "transparent");
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mx, my, isMobile ? 120 : 160, 0, Math.PI * 2);
        ctx.fill();
      }

      const activeRadiusMult = isActiveWorkout ? 8 : 6.5;

      // Render each firefly efficiently using pre-rendered sprites
      for (let i = 0; i < count; i++) {
        const f = fireflies[i];

        // Wave perturbation movement
        f.x += f.vx + Math.sin(time + f.hueOffset) * 0.35 * f.z;
        f.y += f.vy + Math.cos(time * 0.8 + f.hueOffset) * 0.35 * f.z;

        // Cursor Swarm & Swirl Interaction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - f.x;
          const dy = mouseRef.current.y - f.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = isMobile ? 180 : 260;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const force = (maxDist - dist) / maxDist;
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            const pullSpeed = force * 2.4 * f.z;
            const swirlSpeed = force * 1.3 * f.z;

            f.x += (dx / dist) * pullSpeed + Math.cos(angle) * swirlSpeed;
            f.y += (dy / dist) * pullSpeed + Math.sin(angle) * swirlSpeed;
          }
        }

        // Screen boundary wrapping
        if (f.x < -30) f.x = width + 30;
        if (f.x > width + 30) f.x = -30;
        if (f.y < -30) f.y = height + 30;
        if (f.y > height + 30) f.y = -30;

        // Pulsing bioluminescent brightness
        const currentAlpha = Math.sin(time * 2 + f.hueOffset) * 0.35 + (f.maxAlpha - 0.35);
        const activeAlpha = Math.max(0.1, Math.min(1, currentAlpha));

        // Draw outer light halo using hardware-accelerated sprite drawImage
        const glowRadius = f.radius * activeRadiusMult;
        const sprite = glowSprites[f.colorIndex];

        ctx.globalAlpha = activeAlpha * 0.85;
        ctx.drawImage(
          sprite,
          f.x - glowRadius,
          f.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );

        // Draw solid core spark
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = activeAlpha;
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, isActiveWorkout]);

  return (
    <canvas
      ref={canvasRef}
      className="fireflies-canvas fixed inset-0 pointer-events-none z-[10] transition-opacity duration-1000"
      style={{ opacity: isActiveWorkout ? 0.7 : 0.5 }}
    />
  );
}
