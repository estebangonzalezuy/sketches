import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { PixelShapeApp } from "./pixel-shape-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <PixelShapeApp />;
}
