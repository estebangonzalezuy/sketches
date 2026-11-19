"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { readCanvasColors, type CanvasColors } from "./canvas-colors";
import { STILL_FRAMES } from "./data";
import { createNoise, createRng } from "./noise";
import { createParticles, step } from "./simulation";
import type { Particles, Settings, Size } from "./types";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Draws the field on a canvas. Animation state lives in refs so slider changes never
 * restart the loop. Under prefers-reduced-motion it draws one still frame instead.
 */
export function FlowFieldCanvas({ settings }: { settings: Settings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  const redrawStillRef = useRef<() => void>(() => {});
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    settingsRef.current = settings;
    // Animated mode reads the ref every frame; the still image has to be redrawn.
    if (reducedMotion) redrawStillRef.current();
  }, [settings, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rng = createRng(Date.now());
    const noise = createNoise(Math.floor(rng() * 1e9));
    const colors: CanvasColors = readCanvasColors();
    let size: Size = { width: 1, height: 1 };
    let particles: Particles = createParticles(settingsRef.current.count, size, rng);
    let time = 0;
    let frame = 0;

    const clear = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);
    };

    const draw = (fade: number) => {
      const s = settingsRef.current;
      if (s.count !== particles.count) particles = createParticles(s.count, size, rng);
      if (fade < 1) {
        ctx.globalAlpha = 1 - fade;
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, size.width, size.height);
      }
      step(particles, noise, s, time, size, rng);
      time += s.drift / 60;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = s.ink === "tint" ? s.tint : colors.foreground;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      for (let i = 0; i < particles.count; i++) {
        if (particles.age[i] === 0) continue;
        ctx.moveTo(particles.px[i], particles.py[i]);
        ctx.lineTo(particles.x[i], particles.y[i]);
      }
      ctx.stroke();
    };

    const still = () => {
      clear();
      for (let i = 0; i < STILL_FRAMES; i++) draw(1);
    };

    redrawStillRef.current = still;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { width: rect.width, height: rect.height };
      particles = createParticles(settingsRef.current.count, size, rng);
      if (reducedMotion) still();
      else clear();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const loop = () => {
      draw(settingsRef.current.fade);
      frame = requestAnimationFrame(loop);
    };
    if (!reducedMotion) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // resolvedTheme restarts the drawing so the canvas picks up the new token colors.
  }, [reducedMotion, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Flow field animation"
      role="img"
      className="aspect-square w-full touch-manipulation rounded-xl border border-border bg-background"
    />
  );
}
