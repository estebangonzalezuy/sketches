import { prototypeMetadata } from "@/lib/prototype-page";
import meta from "./metadata.json";
import { RespondentMap } from "./respondent-map";

export const metadata = prototypeMetadata(meta);

export default function Page() {
  return <RespondentMap />;
}
