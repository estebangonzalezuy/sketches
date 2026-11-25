"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PAGE_H, PAGE_W } from "./data";
import type { StageColors } from "./stage-colors";

/**
 * The table: a flat field in the theme's background color with a fine grid and four crop
 * marks, a shadow catcher on top, one hemisphere light and one shadow-casting directional.
 */

const FLOOR = 30;
const CELL = 0.1; // world units per grid cell

function gridTexture(c: StageColors) {
  const px = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const g = canvas.getContext("2d")!;
  g.fillStyle = c.field;
  g.fillRect(0, 0, px, px);
  g.globalAlpha = 0.55;
  g.fillStyle = c.line;
  g.fillRect(0, 0, px, 2);
  g.fillRect(0, 0, 2, px);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(FLOOR / CELL, FLOOR / CELL);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Crop marks just outside the corners of the open spread. */
function CropMarks({ color }: { color: string }) {
  const x = PAGE_W + 0.32;
  const z = PAGE_H / 2 + 0.22;
  const len = 0.12;
  const t = 0.004;
  const gap = 0.05;
  const bars: [number, number, number, number][] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      bars.push([sx * (x + gap + len / 2), sz * z, len, t]); // horizontal, outside the corner
      bars.push([sx * x, sz * (z + gap + len / 2), t, len]); // vertical
    }
  return (
    <group position={[0, 0.0004, 0]}>
      {bars.map(([px, pz, w, d], i) => (
        <mesh key={i} position={[px, 0, pz]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Stage({ colors }: { colors: StageColors }) {
  const grid = useMemo(() => gridTexture(colors), [colors]);
  useEffect(() => () => grid.dispose(), [grid]);

  const light = useMemo(() => {
    const l = new THREE.DirectionalLight(0xffffff, 0.78);
    l.position.set(-1.7, 7, -2.0);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    Object.assign(l.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 14 });
    // no normalBias: a turned sheet's vertex normal points down, and the offset would sink its
    // own surface into its shadow (left pages went grey)
    l.shadow.bias = -0.0012;
    return l;
  }, []);

  return (
    <>
      <color attach="background" args={[colors.field]} />
      <hemisphereLight args={[0xffffff, 0xd9d6cf, 2.25]} />
      <primitive object={light} />
      <primitive object={light.target} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[FLOOR, FLOOR]} />
        <meshBasicMaterial map={grid} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.0002} receiveShadow>
        <planeGeometry args={[FLOOR, FLOOR]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <CropMarks color={colors.mark} />
    </>
  );
}

/** Frames the open spread with a margin at any aspect: near-frontal, a little above. */
export function fitCamera(camera: THREE.PerspectiveCamera, aspect: number) {
  const tilt = THREE.MathUtils.degToRad(17);
  const fov = 26;
  // narrow frames (phones, the 4:5 export) crop closer at the sides
  const halfW = PAGE_W + (aspect < 1 ? 0.07 : 0.24);
  const halfH = PAGE_H / 2 + 0.32;
  const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const dist = Math.max(halfW / (t * aspect), halfH / t);
  camera.fov = fov;
  camera.aspect = aspect;
  camera.near = 0.1;
  camera.far = 60;
  camera.position.set(0, dist * Math.cos(tilt), dist * Math.sin(tilt));
  camera.lookAt(0, 0, 0.02);
  camera.updateProjectionMatrix();
}
