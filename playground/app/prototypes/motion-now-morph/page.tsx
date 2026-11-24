import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { ChapterMorph } from "./chapter-morph";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <ChapterMorph />;
}
