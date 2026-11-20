"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function ChromaticAberration() {
  const pathname = usePathname();
  const [intensity, setIntensity] = useState(0);
  const targetIntensityRef = useRef(0);
  const currentIntensityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    // Trigger aberration on route change
    if (pathname !== lastPathRef.current) {
      targetIntensityRef.current = 1;
      lastPathRef.current = pathname;
    }

    const animate = () => {
      currentIntensityRef.current = Math.max(0, currentIntensityRef.current * 0.92);
      if (targetIntensityRef.current > currentIntensityRef.current) {
        currentIntensityRef.current = targetIntensityRef.current;
        targetIntensityRef.current *= 0.95;
      }
      setIntensity(currentIntensityRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pathname]);

  // Also respond to scroll velocity
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();

    const handleScroll = () => {
      const now = performance.now();
      const deltaY = window.scrollY - lastScrollY;
      const deltaTime = now - lastTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      if (velocity > 0.5) {
        targetIntensityRef.current = Math.min(1, targetIntensityRef.current + velocity * 0.01);
      }

      lastScrollY = window.scrollY;
      lastTime = now;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (intensity < 0.01) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .chromatic-active *,
          .chromatic-active *::before,
          .chromatic-active *::after {
            transform: translateZ(0);
          }

          .chromatic-active h1,
          .chromatic-active h2,
          .chromatic-active h3,
          .chromatic-active .at-gradient-text,
          .chromatic-active .font-heading {
            text-shadow:
              ${intensity * 2}px 0 rgba(124, 77, 255, ${intensity * 0.6}),
              ${-intensity * 2}px 0 rgba(0, 188, 212, ${intensity * 0.6}),
              ${intensity * 1}px ${intensity * 1}px rgba(224, 64, 251, ${intensity * 0.4});
            animation: chromatic-jitter ${0.1 + intensity * 0.1}s infinite;
          }

          .chromatic-active button:focus-visible,
          .chromatic-active a:focus-visible,
          .chromatic-active [href]:hover {
            text-shadow:
              ${intensity * 3}px 0 rgba(124, 77, 255, ${intensity * 0.8}),
              ${-intensity * 3}px 0 rgba(0, 188, 212, ${intensity * 0.8});
          }

          @keyframes chromatic-jitter {
            0%, 100% { transform: translate3d(0, 0, 0); }
            25% { transform: translate3d(${intensity * 0.5}px, ${intensity * 0.3}px, 0); }
            50% { transform: translate3d(${-intensity * 0.3}px, ${-intensity * 0.2}px, 0); }
            75% { transform: translate3d(${intensity * 0.2}px, ${-intensity * 0.4}px, 0); }
          }
        `,
      }}
    />
  );
}