import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { OrbitRig } from "./orbit-rig";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <OrbitRig />;
}
