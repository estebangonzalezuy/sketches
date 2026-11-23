"use client";

import { useMemo } from "react";
import { EXAMPLE_RESPONDENTS, parseRespondents, type Respondent } from "@/lib/tmsc/survey";
import { DataEditor } from "./data-editor";
import { usePersistent } from "./use-persistent";

const sanitize = (raw: unknown) => {
  const r = parseRespondents(JSON.stringify(raw ?? null));
  return r.ok ? r.value : undefined;
};

/** The survey respondents a tool shows: the example set until the user pastes their own. */
export function useRespondents(slug: string) {
  const [people, setPeople, reset] = usePersistent<Respondent[]>(slug, "respondents", EXAMPLE_RESPONDENTS, sanitize);
  return { people, setPeople, reset, isExample: people === EXAMPLE_RESPONDENTS };
}

export function RespondentsEditor({ data }: { data: ReturnType<typeof useRespondents> }) {
  const count = data.people.length;
  const label = useMemo(() => `Respondents (${count}, JSON)`, [count]);
  return (
    <DataEditor
      label={label}
      value={data.people}
      isExample={data.isExample}
      parse={parseRespondents}
      onApply={data.setPeople}
      onRestore={data.reset}
    />
  );
}
