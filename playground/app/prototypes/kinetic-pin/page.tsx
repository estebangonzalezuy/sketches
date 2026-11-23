import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { KineticPin } from "./kinetic-pin";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <KineticPin />;
}
