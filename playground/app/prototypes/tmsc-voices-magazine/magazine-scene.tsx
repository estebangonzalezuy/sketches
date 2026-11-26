"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { installDebugHook } from "./debug-hook";
import type { StageSetup } from "./setup";
import type { DriverRef } from "./driver";
import type { Book } from "./faces";
import { Magazine } from "./magazine";
import { PointerInput } from "./pointer-input";
import { fitCamera, Stage } from "./stage";

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

type Props = { book: Book; pages: Map<string, HTMLCanvasElement>; stage: StageSetup; textureImage: HTMLImageElement | null; driverRef: DriverRef };

export function MagazineScene({ book, pages, stage, textureImage, driverRef }: Props) {
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
      <Stage stage={stage} textureImage={textureImage} />
      <Magazine book={book} pages={pages} driverRef={driverRef} />
      <PointerInput driverRef={driverRef} />
    </Canvas>
  );
}
