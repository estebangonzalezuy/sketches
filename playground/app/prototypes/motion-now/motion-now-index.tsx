import { archivoNarrow } from "./fonts";
import { ToolList } from "./tool-list";

export function MotionNowIndex() {
  return (
    <main className={`${archivoNarrow.className} mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16`}>
      <header className="flex flex-col gap-2">
        <h1 className="text-7xl leading-[0.9] font-bold tracking-tight sm:text-8xl">Motion, Now</h1>
        <p className="text-xl text-muted-foreground">tMSC 2026 · a worldwide survey of the motion design craft · example data</p>
      </header>
      <ToolList />
    </main>
  );
}
