import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { TmscObject } from "./tmsc-object";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <TmscObject />;
}
