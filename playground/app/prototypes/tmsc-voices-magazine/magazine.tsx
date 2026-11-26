"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createCurlUniforms, createSheetDepthMaterial, createSheetGeometry, createSheetMaterial } from "./curl-material";
import { BEND_TURN, FOLD_LENGTH, PAGE_H, PAGE_PX, PAGE_W, SEGMENTS } from "./data";
import { finishMaterial, weightParams, type PaperSetup } from "./paper";
import { textureTile, type TextureKind } from "./textures";
import type { Book } from "./faces";
import { clamp, magazineShift, shaderPose, stackHeight } from "./pose";
import type { DriverRef } from "./driver";
import { recordFrame } from "./timeline";
import type { SheetPose } from "./types";

const BASE_Y = 0.004;
const IDLE_LIFT = 0.005;
/** Height of the cockle waves at 100 % waviness. */
const WARP = 0.006;
/** Relief at 100 %: the tile varies a few percent, so the bump needs some gain. */
const BUMP_SCALE = 30;
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

/** The sheets, their contact shadow, and the per-frame mapping from poses to shader uniforms. */
type Props = {
  book: Book;
  pages: Map<string, HTMLCanvasElement>;
  paper: PaperSetup;
  /** The page texture, whose tile becomes the paper's relief. */
  texture: { kind: TextureKind | "None"; image: HTMLImageElement | null };
  driverRef: DriverRef;
};

export function Magazine({ book, pages, paper, texture, driverRef }: Props) {
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const shadowL = useRef<THREE.MeshBasicMaterial>(null);
  const shadowR = useRef<THREE.MeshBasicMaterial>(null);

  // page textures: rebuilt only when the pages are re-baked
  const printed = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    const tex = (id: string) => {
      const t = new THREE.CanvasTexture(pages.get(id)!);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    };
    const side = (k: number, s: "front" | "back") => tex(book.faces.find((f) => f.sheet === k && f.side === s)!.id);
    return Array.from({ length: book.sheets }, (_, k) => ({ front: side(k, "front"), back: side(k, "back") }));
  }, [gl, pages, book]);
  useEffect(() => () => printed.forEach((p) => (p.front.dispose(), p.back.dispose())), [printed]);

  // the paper's relief: the chosen texture tile as a bump map, repeated at print scale
  const bumpTile = useMemo(
    () => (texture.kind === "None" ? null : textureTile({ kind: texture.kind, strength: 1, image: texture.image })),
    [texture.kind, texture.image],
  );
  const bump = useMemo(() => {
    if (!bumpTile || paper.relief <= 0) return null;
    const t = new THREE.CanvasTexture(bumpTile);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(PAGE_PX.w / bumpTile.width, PAGE_PX.h / bumpTile.height);
    t.anisotropy = gl.capabilities.getMaxAnisotropy();
    return t;
  }, [bumpTile, paper.relief, gl]);
  useEffect(() => () => bump?.dispose(), [bump]);

  // meshes and materials: rebuilt when the pages or the paper finish / relief change
  const built = useMemo(() => {
    const look = { finish: finishMaterial(paper.finish), bump, bumpScale: paper.relief * BUMP_SCALE };
    const geometry = createSheetGeometry(PAGE_W, PAGE_H, SEGMENTS.u, SEGMENTS.v);
    const sheets = printed.map(({ front, back }) => {
      const uniforms = createCurlUniforms(PAGE_W, PAGE_H, PAGE_W * FOLD_LENGTH);
      const mesh = new THREE.Mesh(geometry, createSheetMaterial(uniforms, front, back, look));
      mesh.customDepthMaterial = createSheetDepthMaterial(uniforms);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false; // the shader moves vertices far outside the flat bounds
      return { mesh, uniforms };
    });
    return { geometry, sheets, contact: contactShadowTexture() };
  }, [printed, paper.finish, paper.relief, bump]);

  useEffect(
    () => () => {
      built.geometry.dispose();
      built.contact.dispose();
      for (const s of built.sheets) {
        (s.mesh.material as THREE.Material).dispose();
        s.mesh.customDepthMaterial?.dispose();
      }
    },
    [built],
  );

  // the one place poses become uniforms; live mode and Record both go through it
  useEffect(() => {
    const driver = driverRef.current;
    const count = built.sheets.length;
    const weight = weightParams(paper.weight);
    driver.apply = (poses: SheetPose[], drop: number, shadow: number, time: number) => {
      // a controller from another page order (mid re-bake) has nothing to say to these meshes
      if (poses.length !== count) return;
      let turned = 0;
      poses.forEach((s, k) => {
        const u = built.sheets[k].uniforms;
        const pose = shaderPose(s.p, s.sign, s.bend * weight.bend);
        u.uRoot.value = pose.root;
        u.uBend.value = pose.bend;
        u.uPhi.value = s.phi;
        u.uSign.value = s.sign;
        u.uYOff.value = BASE_Y + stackHeight(k, s.p, count, weight.gap);
        u.uWave.value = 0.04 * Math.sin(Math.PI * clamp(s.p)) * (s.bend / BEND_TURN) * weight.bend;
        u.uIdle.value = IDLE_LIFT * paper.waviness;
        u.uWarp.value = WARP * paper.waviness;
        u.uTime.value = time;
        turned += s.p;
      });
      if (group.current) {
        group.current.position.x = magazineShift(turned, count, PAGE_W);
        group.current.position.y = drop * DROP_HEIGHT;
      }
      if (shadowR.current) shadowR.current.opacity = 0.28 * shadow * clamp(count - turned);
      if (shadowL.current) shadowL.current.opacity = 0.28 * shadow * clamp(turned);
    };
    return () => {
      driver.apply = null;
    };
  }, [built, driverRef, paper.weight, paper.waviness]);

  useFrame((_, dt) => {
    const driver = driverRef.current;
    if (driver.recording || !driver.apply) return;
    const pv = driver.preview;
    if (pv && driver.plan) {
      // the timeline is playing or scrubbing: show the exact Record frame
      if (pv.playing) {
        pv.t = Math.min(driver.plan.duration, pv.t + Math.min(dt, 1 / 20));
        if (pv.t >= driver.plan.duration) pv.playing = false;
      }
      const f = recordFrame(driver.plan, pv.t);
      driver.apply(f.sheets, f.drop, f.shadow, pv.t);
      driver.onPreview?.(pv.t);
      return;
    }
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
