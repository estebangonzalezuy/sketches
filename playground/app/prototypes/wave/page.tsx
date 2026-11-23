import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { WaveApp } from "./wave-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <WaveApp />;
}
