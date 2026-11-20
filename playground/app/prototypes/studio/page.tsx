import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { StudioApp } from "./studio-app";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <StudioApp />;
}
