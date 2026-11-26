import * as THREE from "three";
import type { finishMaterial } from "./paper";

/**
 * The sheet material: three's matte Lambert with the page-curl deformation spliced into the
 * vertex shader, and the back page sampled on back faces. The shadow (depth) material gets the
 * same deformation, so the shadow follows the curl.
 */

export type CurlUniforms = {
  uRoot: { value: number };
  uBend: { value: number };
  uPhi: { value: number };
  uSign: { value: number };
  uYOff: { value: number };
  uWave: { value: number };
  uIdle: { value: number };
  uWarp: { value: number };
  uTime: { value: number };
  uLen: { value: number };
  uSize: { value: THREE.Vector2 };
  uBackMap: { value: THREE.Texture | null };
};

const CURL_GLSL = /* glsl */ `
uniform float uRoot, uBend, uPhi, uSign, uYOff, uWave, uIdle, uWarp, uTime, uLen;
uniform vec2 uSize;

// q = (u, v): u across the page from the spine, v up the page. Returns object space, y up.
vec3 curlDeform(vec2 q) {
  vec2 n = vec2(cos(uPhi), sin(uPhi));
  float dMax = uSize.x * n.x + 0.5 * uSize.y * abs(n.y);
  float d = dot(q, n) - (dMax - uLen);
  vec3 p = vec3(q, 0.0);
  if (d > 0.0 && uBend > 1e-4) {
    float R = uLen / uBend;
    float a = d / R;
    p.xy = q + n * (R * sin(a) - d);
    p.z = uSign * R * (1.0 - cos(a));
  }
  float t = clamp(q.x / uSize.x, 0.0, 1.0);
  p.z += uSign * uWave * t * t * cos(3.14159265 * q.y / uSize.y);
  float c = cos(uRoot), s = sin(uRoot);
  vec3 w = vec3(p.x * c - p.z * s, p.x * s + p.z * c, -p.y);
  w.y += uYOff + uIdle * t * t * (0.75 + 0.25 * sin(uTime * 0.9 + q.y * 1.7));
  // cockling: paper that doesn't lie quite flat, the same gentle waves on every sheet so stacks never cross
  w.y += uWarp * t * (0.5 + 0.5 * sin(q.x * 5.3 + q.y * 3.1) * cos(q.y * 4.2 - q.x * 1.7));
  return w;
}
`;

const NORMAL_GLSL = /* glsl */ `
vec3 curlP = curlDeform(position.xy);
vec3 curlU = curlDeform(position.xy + vec2(0.003, 0.0));
vec3 curlV = curlDeform(position.xy + vec2(0.0, 0.003));
vec3 objectNormal = normalize(cross(curlU - curlP, curlV - curlP));
#ifdef USE_TANGENT
  vec3 objectTangent = vec3(tangent.xyz);
#endif
`;

const MAP_GLSL = /* glsl */ `
#ifdef USE_MAP
  // back faces show the other printed side, mirrored so it reads the right way round
  vec4 sampledDiffuseColor = gl_FrontFacing ? texture2D(map, vMapUv) : texture2D(uBackMap, vec2(1.0 - vMapUv.x, vMapUv.y));
  diffuseColor *= sampledDiffuseColor;
#endif
`;

export function createCurlUniforms(w: number, h: number, len: number): CurlUniforms {
  return {
    uRoot: { value: 0 },
    uBend: { value: 0 },
    uPhi: { value: 0 },
    uSign: { value: 1 },
    uYOff: { value: 0 },
    uWave: { value: 0 },
    uIdle: { value: 0 },
    uWarp: { value: 0 },
    uTime: { value: 0 },
    uLen: { value: len },
    uSize: { value: new THREE.Vector2(w, h) },
    uBackMap: { value: null },
  };
}

export type SheetLook = { finish: ReturnType<typeof finishMaterial>; bump: THREE.Texture | null; bumpScale: number };

export function createSheetMaterial(u: CurlUniforms, front: THREE.Texture, back: THREE.Texture, look: SheetLook) {
  u.uBackMap.value = back;
  const base = { map: front, side: THREE.DoubleSide, bumpMap: look.bump ?? undefined, bumpScale: look.bumpScale };
  const m =
    look.finish.model === "lambert"
      ? new THREE.MeshLambertMaterial(base)
      : new THREE.MeshStandardMaterial({ ...base, roughness: look.finish.roughness, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${CURL_GLSL}`)
      .replace("#include <beginnormal_vertex>", NORMAL_GLSL)
      .replace("#include <begin_vertex>", "vec3 transformed = curlP;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uBackMap;")
      .replace("#include <map_fragment>", MAP_GLSL);
  };
  m.customProgramCacheKey = () => `tmsc-curl-sheet-${look.finish.model}`;
  return m;
}

export function createSheetDepthMaterial(u: CurlUniforms) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${CURL_GLSL}`)
      .replace("#include <begin_vertex>", "vec3 transformed = curlDeform(position.xy);");
  };
  m.customProgramCacheKey = () => "tmsc-curl-depth";
  return m;
}

/** A page-sized plane with the spine on its left edge (x = 0 … w), finely cut across for the curl. */
export function createSheetGeometry(w: number, h: number, su: number, sv: number) {
  const g = new THREE.PlaneGeometry(w, h, su, sv);
  g.translate(w / 2, 0, 0);
  return g;
}
