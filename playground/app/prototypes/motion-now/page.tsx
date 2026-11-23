import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { MotionNowIndex } from "./motion-now-index";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <MotionNowIndex />;
}
