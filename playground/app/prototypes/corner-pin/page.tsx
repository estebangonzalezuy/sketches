import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { CornerPinApp } from "./corner-pin-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <CornerPinApp />;
}
