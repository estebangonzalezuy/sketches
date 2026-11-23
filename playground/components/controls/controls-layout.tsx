"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ControlPanel } from "./control-panel";
import type { ControlSchema } from "./schema";
import type { Controls } from "./use-controls";

/**
 * Puts the control panel beside the subject, never over it.
 *
 *   ≥ lg   fixed panel on the right; the subject is centered in the remaining width
 *   < lg   a floating "Controls" button opens a non-modal bottom sheet capped at 45% of
 *          the screen; put the subject at the top of the page so it stays visible above it
 */
export function ControlsLayout<S extends ControlSchema>({
  controls,
  children,
  header,
  footer,
}: {
  controls: Controls<S>;
  children: React.ReactNode;
  /** Extra panel content above the fields (e.g. export actions). */
  header?: React.ReactNode;
  /** Extra panel content below Reset / Randomize (e.g. a data editor). */
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div data-capture-content className="flex flex-1 flex-col lg:pr-72">
        {children}
      </div>

      <aside
        aria-label="Controls"
        data-capture-hide
        className="fixed top-[calc(3rem+1px+env(safe-area-inset-top))] right-0 bottom-0 hidden w-72 overflow-y-auto border-l border-border bg-background p-4 lg:block"
      >
        <ControlPanel controls={controls} header={header} footer={footer} />
      </aside>

      {/* Non-modal: no overlay, so the subject stays visible while tuning. */}
      <Drawer open={open} onOpenChange={setOpen} modal={false}>
        <DrawerTrigger asChild>
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label="Controls"
            data-capture-hide
            // Explicit 44px: asChild triggers replace data-slot, so the global touch rule misses them.
            className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 size-11 shadow-md sm:w-auto sm:px-3 lg:hidden"
          >
            <SlidersHorizontalIcon />
            <span className="hidden sm:inline">Controls</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Controls</DrawerTitle>
          </DrawerHeader>
          {/* no-drag: sliders inside must not drag the sheet. */}
          <div
            data-vaul-no-drag
            className="max-h-[45dvh] overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <ControlPanel controls={controls} header={header} footer={footer} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
