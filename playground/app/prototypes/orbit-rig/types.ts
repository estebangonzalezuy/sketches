export type Key = { t: number; v: number };

export type CurveId = "xSquash" | "ySquash" | "zSquash";
export type Curves = Record<CurveId, Key[]>;
export type CurveMeta = { id: CurveId; label: string; min: number; max: number };

export type Vec3 = { x: number; y: number; z: number };

/** Screen mapping: stage center and the world→pixel scale for the current stage width. */
export type View = { cx: number; cy: number; k: number };

export type RigParams = {
  cards: number;
  orbDelay: number;
  mainRotate: number;
  mainX: number;
  mainZ: number;
  orbSize: number;
  orbZ: number;
  orbCardScale: number;
  slice: number;
};

export type CardPose = {
  /** World position now, where it starts (the stack) and where it lands (its anchor). */
  pos: Vec3;
  start: Vec3;
  anchor: Vec3;
  scale: number;
  /** This card's eased progress after the stagger. */
  p: number;
};
