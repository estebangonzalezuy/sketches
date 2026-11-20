import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { OneRatio } from "./one-ratio";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <OneRatio />;
}
