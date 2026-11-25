"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { magazineShift } from "./pose";
import { PAGE_H, PAGE_W } from "./data";
import type { DriverRef } from "./driver";

/**
 * Pointer → page-plane coordinates. Rays hit the table plane; x is measured from the spine
 * (after the closed-magazine shift), v runs up the page. The drag never moves the camera.
 */
export function PointerInput({ driverRef }: { driverRef: DriverRef }) {
  const get = useThree((s) => s.get);

  useEffect(() => {
    const { gl, camera } = get();
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01);
    const hit = new THREE.Vector3();
    const ndc = new THREE.Vector2();
    let lastT = 0;

    const toPage = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) return null;
      const c = driverRef.current.controller;
      const shift = magazineShift(c.progress, c.count, PAGE_W);
      return { x: hit.x - shift, v: -hit.z };
    };

    const down = (e: PointerEvent) => {
      const d = driverRef.current;
      const q = toPage(e);
      if (d.recording || !q || e.button > 0) return;
      if (d.controller.pointerDown(q.x, q.v)) {
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
      }
      lastT = e.timeStamp;
    };
    const move = (e: PointerEvent) => {
      const d = driverRef.current;
      const q = toPage(e);
      if (d.recording || !q) return;
      const dt = Math.max(1e-3, (e.timeStamp - lastT) / 1000);
      lastT = e.timeStamp;
      if (e.pointerType === "mouse" || d.controller.dragging) d.controller.pointerMove(q.x, q.v, dt);
      if (!d.controller.dragging) el.style.cursor = Math.abs(q.x) <= PAGE_W && Math.abs(q.v) <= PAGE_H / 2 ? "grab" : "";
    };
    const up = () => {
      driverRef.current.controller.pointerUp();
      el.style.cursor = "";
    };
    const leave = () => driverRef.current.controller.pointerLeave();

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, [get, driverRef]);

  return null;
}
