"use client";

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { installDebugHook } from "./debug-hook";
import type { DriverRef } from "./driver";
import { Magazine } from "./magazine";
import { PointerInput } from "./pointer-input";
import { fitCamera, Stage } from "./stage";
import { readStageColors } from "./stage-colors";

/** Keeps the camera framed on resize and hands the live three.js state to the driver. */
function Bridge({ driverRef }: { driverRef: DriverRef }) {
  const get = useThree((s) => s.get);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    if (!driverRef.current.recording) fitCamera(camera, size.width / Math.max(1, size.height));
  }, [camera, size, driverRef]);
  useEffect(() => {
    const driver = driverRef.current;
    driver.three = get;
    const uninstall = installDebugHook(driver);
    return () => {
      driver.three = null;
      uninstall();
    };
  }, [get, driverRef]);
  return null;
}

export function MagazineScene({ pages, driverRef }: { pages: Map<string, HTMLCanvasElement>; driverRef: DriverRef }) {
  const { resolvedTheme } = useTheme();
  // the stage reads the theme tokens; recompute when the theme flips
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colors = useMemo(() => readStageColors(), [resolvedTheme]);

  return (
    <Canvas
      shadows="soft"
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      camera={{ fov: 26, near: 0.1, far: 60, position: [0, 6, 2] }}
      aria-label="the Motion Social Club Voices, a magazine you can page through"
      role="img"
      style={{ touchAction: "none" }}
    >
      <Bridge driverRef={driverRef} />
      <Stage colors={colors} />
      <Magazine pages={pages} driverRef={driverRef} />
      <PointerInput driverRef={driverRef} />
    </Canvas>
  );
}
