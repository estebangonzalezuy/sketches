import * as THREE from "three";
import type { Driver } from "./driver";
import { fitCamera } from "./stage";
import { recordFrame } from "./timeline";

/**
 * Only with ?debug=1: exposes `window.__tmsc` so a script can render exact Record frames
 * (stills of the curl at a given time) and step the live controller. Off for everyone else.
 */
export function installDebugHook(driver: Driver): () => void {
  if (typeof window === "undefined" || !new URLSearchParams(window.location.search).has("debug")) return () => {};
  const w = window as unknown as { __tmsc?: unknown };
  w.__tmsc = {
    driver,
    /** Renders the Record sequence at time t into a w×h PNG data URL, then restores the live view. */
    frame(t: number, width = 1080, height = 1080): string {
      const st = driver.three?.();
      if (!st || !driver.apply) throw new Error("not ready");
      const cam = st.camera as THREE.PerspectiveCamera;
      const prevRatio = st.gl.getPixelRatio();
      const prev = st.gl.getSize(new THREE.Vector2());
      driver.recording = true;
      st.gl.setPixelRatio(1);
      st.gl.setSize(width, height, false);
      fitCamera(cam, width / height);
      const f = recordFrame(t);
      driver.apply(f.sheets, f.drop, f.shadow, t);
      st.gl.render(st.scene, cam);
      const url = st.gl.domElement.toDataURL("image/png");
      st.gl.setPixelRatio(prevRatio);
      st.gl.setSize(prev.x, prev.y, false);
      fitCamera(cam, prev.x / prev.y);
      driver.recording = false;
      return url;
    },
  };
  return () => {
    delete w.__tmsc;
  };
}
