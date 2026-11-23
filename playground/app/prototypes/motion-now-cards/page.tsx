import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { FindingCards } from "./finding-cards";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <FindingCards />;
}
