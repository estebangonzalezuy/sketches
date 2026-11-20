import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { KvStudio } from "./kv-studio";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <KvStudio />;
}
