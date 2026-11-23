import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { WhereYouLand } from "./where-you-land";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <WhereYouLand />;
}
