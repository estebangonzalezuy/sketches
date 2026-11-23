import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { RadialWarpApp } from "./radial-warp-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <RadialWarpApp />;
}
