import { notFound } from "next/navigation";

/**
 * Each prototype is its own static folder (app/prototypes/<slug>/), which Next matches
 * before this dynamic segment. Anything that reaches here is not a prototype.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "__none__" }];
}

export default function UnknownPrototype() {
  notFound();
}
