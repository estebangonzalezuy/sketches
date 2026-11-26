import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { TmscMagazine } from "./tmsc-magazine";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <TmscMagazine />;
}
