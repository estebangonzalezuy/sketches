"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createCurlUniforms, createSheetDepthMaterial, createSheetGeometry, createSheetMaterial } from "./curl-material";
import { BEND_TURN, FACES, FOLD_LENGTH, PAGE_H, PAGE_W, SEGMENTS, SHEET_COUNT, STACK_GAP } from "./data";
import { clamp, magazineShift, shaderPose, stackHeight } from "./pose";
import type { DriverRef } from "./driver";
import type { SheetPose } from "./types";

const BASE_Y = 0.004;
const IDLE_LIFT = 0.005;
const DROP_HEIGHT = 0.35;

function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 340;
  const g = c.getContext("2d")!;
  // alphaMap reads brightness: black field, white blurred page shape
  g.fillStyle = "#000";
  g.fillRect(0, 0, 256, 340);
  g.filter = "blur(14px)";
  g.fillStyle = "#fff";
  g.fillRect(34, 34, 256 - 68, 340 - 68);
  return new THREE.CanvasTexture(c);
}

/** The five sheets, their contact shadow, and the per-frame mapping from poses to shader uniforms. */
export function Magazine({ pages, driverRef }: { pages: Map<string, HTMLCanvasElement>; driverRef: DriverRef }) {
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const shadowL = useRef<THREE.MeshBasicMaterial>(null);
  const shadowR = useRef<THREE.MeshBasicMaterial>(null);

  const built = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    const tex = (id: string) => {
      const t = new THREE.CanvasTexture(pages.get(id)!);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    };
    const geometry = createSheetGeometry(PAGE_W, PAGE_H, SEGMENTS.u, SEGMENTS.v);
    const sheets = Array.from({ length: SHEET_COUNT }, (_, k) => {
      const front = tex(FACES.find((f) => f.sheet === k && f.side === "front")!.id);
      const back = tex(FACES.find((f) => f.sheet === k && f.side === "back")!.id);
      const uniforms = createCurlUniforms(PAGE_W, PAGE_H, PAGE_W * FOLD_LENGTH);
      const mesh = new THREE.Mesh(geometry, createSheetMaterial(uniforms, front, back));
      mesh.customDepthMaterial = createSheetDepthMaterial(uniforms);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false; // the shader moves vertices far outside the flat bounds
      return { mesh, uniforms, textures: [front, back] };
    });
    return { geometry, sheets, contact: contactShadowTexture() };
  }, [gl, pages]);

  useEffect(
    () => () => {
      built.geometry.dispose();
      built.contact.dispose();
      for (const s of built.sheets) {
        s.textures.forEach((t) => t.dispose());
        (s.mesh.material as THREE.Material).dispose();
        s.mesh.customDepthMaterial?.dispose();
      }
    },
    [built],
  );

  // the one place poses become uniforms; live mode and Record both go through it
  useEffect(() => {
    const driver = driverRef.current;
    driver.apply = (poses: SheetPose[], drop: number, shadow: number, time: number) => {
      let turned = 0;
      poses.forEach((s, k) => {
        const u = built.sheets[k].uniforms;
        const pose = shaderPose(s.p, s.sign, s.bend);
        u.uRoot.value = pose.root;
        u.uBend.value = pose.bend;
        u.uPhi.value = s.phi;
        u.uSign.value = s.sign;
        u.uYOff.value = BASE_Y + stackHeight(k, s.p, SHEET_COUNT, STACK_GAP);
        u.uWave.value = 0.04 * Math.sin(Math.PI * clamp(s.p)) * (s.bend / BEND_TURN);
        u.uIdle.value = IDLE_LIFT;
        u.uTime.value = time;
        turned += s.p;
      });
      if (group.current) {
        group.current.position.x = magazineShift(turned, SHEET_COUNT, PAGE_W);
        group.current.position.y = drop * DROP_HEIGHT;
      }
      if (shadowR.current) shadowR.current.opacity = 0.28 * shadow * clamp(SHEET_COUNT - turned);
      if (shadowL.current) shadowL.current.opacity = 0.28 * shadow * clamp(turned);
    };
    return () => {
      driver.apply = null;
    };
  }, [built, driverRef]);

  useFrame((_, dt) => {
    const driver = driverRef.current;
    if (driver.recording || !driver.apply) return;
    const c = driver.controller;
    c.update(Math.min(dt, 1 / 20));
    if (!c.reduced) driver.time += dt;
    driver.apply(c.sheets, 0, 1, driver.time);
    driver.onFrame?.();
  });

  return (
    <group ref={group}>
      {built.sheets.map((s, k) => (
        <primitive key={k} object={s.mesh} />
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} rotation-x={-Math.PI / 2} position={[side * (PAGE_W / 2) + 0.025, 0.0006, 0.04]}>
          <planeGeometry args={[PAGE_W * 1.16, PAGE_H * 1.12]} />
          <meshBasicMaterial ref={side < 0 ? shadowL : shadowR} color={0x000000} alphaMap={built.contact} transparent depthWrite={false} opacity={0} />
        </mesh>
      ))}
    </group>
  );
}
