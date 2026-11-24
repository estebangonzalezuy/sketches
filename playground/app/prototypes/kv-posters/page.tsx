import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { KvPosters } from "./kv-posters";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <KvPosters />;
}
