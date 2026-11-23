import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { KineticLettersApp } from "./kinetic-letters-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <KineticLettersApp />;
}
