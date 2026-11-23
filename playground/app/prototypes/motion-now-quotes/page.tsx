import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { QuoteWall } from "./quote-wall";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <QuoteWall />;
}
