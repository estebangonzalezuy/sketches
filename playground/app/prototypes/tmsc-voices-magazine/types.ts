export type Quote = { text: string; attribution: string; context?: string };

export type Interview = {
  order: 1 | 2 | 3 | 4;
  title: string;
  guest: string;
  guest_role?: string;
  series?: string;
  url: string;
  post_date: string;
  quotes: Quote[];
};

export type FaceLayout = "cover" | "interview-left" | "interview-right" | "back-cover";

/** One printed side of one sheet. */
export type PageFace = {
  id: string;
  sheet: number;
  side: "front" | "back";
  layout: FaceLayout;
  interviewOrder?: 1 | 2 | 3 | 4;
};

/** Colors of one printed page: background and ink, from the tMSC palette. */
export type PageInk = { bg: string; ink: string };

export type SpreadTheme = {
  left: PageInk;
  right: PageInk;
  /** Which of the guest's quotes is the hero (index into content.json quotes). */
  heroQuote: number;
  still: string;
};

/** Everything the shader needs to place one sheet. */
export type SheetPose = {
  /** 0 = lying on the right stack, 1 = turned onto the left stack. */
  p: number;
  /** +1 turning forward (edge leads to the left), −1 turning back. */
  sign: 1 | -1;
  /** Bend strength in radians at mid-turn. */
  bend: number;
  /** Fold-line angle: negative grabs the bottom corner, positive the top. */
  phi: number;
};

export type RecordFormat = "square" | "portrait";
