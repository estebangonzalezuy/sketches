"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage, removeStorage } from "@/lib/storage";
import {
  defaultValues,
  randomValues,
  sanitizeValues,
  type ControlSchema,
  type ControlValues,
} from "./schema";

type Store = { values: unknown; listeners: Set<() => void> };
const stores = new Map<string, Store>();

function getStore(key: string, schema: ControlSchema): Store {
  let store = stores.get(key);
  if (!store) {
    store = { values: sanitizeValues(schema, readStorage(key)), listeners: new Set() };
    stores.set(key, store);
  }
  return store;
}

export type Controls<S extends ControlSchema> = {
  schema: S;
  values: ControlValues<S>;
  set: <K extends keyof S>(key: K, value: ControlValues<S>[K]) => void;
  reset: () => void;
  randomize: () => void;
};

/**
 * Values for a control schema, remembered per prototype in localStorage
 * (`playground:<slug>:controls`). The server render and first client render use the
 * defaults; stored values load right after hydration.
 */
export function useControls<S extends ControlSchema>(slug: string, schema: S): Controls<S> {
  const key = storageKey(slug, "controls");
  const defaults = useMemo(() => defaultValues(schema), [schema]);

  const subscribe = useCallback(
    (cb: () => void) => {
      const store = getStore(key, schema);
      store.listeners.add(cb);
      return () => store.listeners.delete(cb);
    },
    [key, schema],
  );
  const values = useSyncExternalStore(
    subscribe,
    () => getStore(key, schema).values as ControlValues<S>,
    () => defaults,
  );

  const commit = useCallback(
    (next: ControlValues<S>, persist = true) => {
      const store = getStore(key, schema);
      store.values = next;
      if (persist) writeStorage(key, next);
      else removeStorage(key);
      store.listeners.forEach((l) => l());
    },
    [key, schema],
  );

  return {
    schema,
    values,
    set: (k, v) => commit({ ...(getStore(key, schema).values as ControlValues<S>), [k]: v }),
    reset: () => commit(defaults, false),
    randomize: () => commit(randomValues(schema, getStore(key, schema).values as ControlValues<S>)),
  };
}
