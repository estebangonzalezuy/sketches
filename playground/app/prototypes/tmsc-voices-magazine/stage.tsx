"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DEFAULT_VIEW, type View } from "./camera";
import { PAGE_H, PAGE_W } from "./data";
import type { StageSetup } from "./setup";
import { applyTexture } from "./textures";

/**
 * The table: a flat field in the picked background color, optionally with the same paper
 * finish as the pages and a fine grid with crop marks; a shadow catcher on top, one
 * hemisphere light and one shadow-casting directional.
 */

const FLOOR = 30;
const TILE_UNITS = 2; // world units one texture tile covers
const CELLS = 20; // grid cells per tile (0.1 units each)

/** A color a little off the field (darker on light fields, lighter on dark), for grid lines and crop marks. */
function shade(hex: string, k: number): string {
  const c = new THREE.Color(hex);
  const dark = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722 < 0.35;
  return `#${(dark ? c.lerp(new THREE.Color(1, 1, 1), k * 1.4) : c.multiplyScalar(1 - k)).getHexString()}`;
}

function floorTexture(stage: StageSetup, image: HTMLImageElement | null) {
  const px = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const g = canvas.getContext("2d")!;
  g.fillStyle = stage.color;
  g.fillRect(0, 0, px, px);
  if (stage.texture.kind !== "None") applyTexture(g, px, px, 1, { kind: stage.texture.kind, strength: stage.texture.strength, image });
  if (stage.grid) {
    g.fillStyle = shade(stage.color, 0.07);
    for (let i = 0; i < CELLS; i++) {
      const p = Math.round((i * px) / CELLS);
      g.fillRect(p, 0, 2, px);
      g.fillRect(0, p, px, 2);
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(FLOOR / TILE_UNITS, FLOOR / TILE_UNITS);
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

export function Stage({ stage, textureImage }: { stage: StageSetup; textureImage: HTMLImageElement | null }) {
  const floor = useMemo(() => floorTexture(stage, textureImage), [stage, textureImage]);
  useEffect(() => () => floor.dispose(), [floor]);

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
      <color attach="background" args={[stage.color]} />
      <hemisphereLight args={[0xffffff, 0xd9d6cf, 2.25]} />
      <primitive object={light} />
      <primitive object={light.target} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[FLOOR, FLOOR]} />
        <meshBasicMaterial map={floor} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.0002} receiveShadow>
        <planeGeometry args={[FLOOR, FLOOR]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      {stage.grid && <CropMarks color={shade(stage.color, 0.4)} />}
    </>
  );
}

/** Frames the open spread with a margin at any aspect: near-frontal, a little above. */
export function fitCamera(camera: THREE.PerspectiveCamera, aspect: number, view: View = DEFAULT_VIEW, uiLift = false) {
  const tilt = THREE.MathUtils.degToRad(view.tilt);
  const yaw = THREE.MathUtils.degToRad(view.yaw);
  const fov = 26;
  // narrow frames (phones, the 4:5 export) crop closer at the sides
  const halfW = PAGE_W + (aspect < 1 ? 0.07 : 0.24);
  const halfH = PAGE_H / 2 + 0.32;
  const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const dist = Math.max(halfW / (t * aspect), halfH / t) / view.zoom;
  camera.fov = fov;
  camera.aspect = aspect;
  camera.near = 0.1;
  camera.far = 60;
  // tilt leans the camera off vertical toward the reader; yaw walks it around the magazine
  camera.position.set(dist * Math.sin(tilt) * Math.sin(yaw), dist * Math.cos(tilt), dist * Math.sin(tilt) * Math.cos(yaw));
  // live on tall phone screens: keep the magazine in the upper half, clear of the controls sheet
  const lift = uiLift && aspect < 0.75 ? halfH * 0.9 : 0;
  // "up" on screen is the top edge of the magazine (turned with the yaw), so straight down works
  camera.up.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  camera.lookAt(0, 0, 0.02 + lift);
  camera.updateProjectionMatrix();
}
