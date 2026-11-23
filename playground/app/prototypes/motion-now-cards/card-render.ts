/** Draws one finding card at any size; 4:5 stacks, wide formats put the chart on the right. */
import { segment, expoOut } from "@/lib/tmsc/ease";
import { font } from "@/lib/tmsc/fonts";
import { alpha, CHAPTERS, palette } from "@/lib/tmsc/palettes";
import { fitSize, wrap } from "@/lib/tmsc/text";
import { drawBars, drawDonut, drawDotGrid, drawLine, drawPair } from "./charts";
import { COUNT_DUR } from "./data";
import { displayNumber, shareOf } from "./findings";
import type { Box, CardColors, Finding } from "./types";

export type CardOptions = { background: string; tag: boolean };

export function cardColors(f: Finding, background: string): CardColors {
  const ch = CHAPTERS[f.chapter];
  return palette(background === "Dark" ? ch.dark : ch.color);
}

function drawChart(ctx: CanvasRenderingContext2D, f: Finding, b: Box, t: number, c: CardColors) {
  switch (f.chart) {
    case "bar":
      return drawBars(ctx, b, f.data, t, c);
    case "dot grid":
      return drawDotGrid(ctx, b, shareOf(f), t, c);
    case "line":
      return drawLine(ctx, b, f.data, t, c);
    case "donut":
      return drawDonut(ctx, b, shareOf(f), t, c);
    case "before/after":
      return drawPair(ctx, b, f.data, t, c);
  }
}

export function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number, f: Finding, t: number, o: CardOptions) {
  const c = cardColors(f, o.background);
  const wide = w / h > 1.2;
  const pad = Math.round(Math.min(w, h) * 0.066);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);

  const colW = wide ? w * 0.52 - pad : w - pad * 2;
  const base = Math.min(w, h);

  // chapter
  const ch = CHAPTERS[f.chapter];
  ctx.fillStyle = c.fg;
  ctx.font = font(base * 0.034, 500);
  ctx.fillText(`${ch.number}  ${f.chapter}`, pad, pad + base * 0.03);

  // the number
  const shown = displayNumber(f, expoOut(segment(t, 0, COUNT_DUR)));
  const final = displayNumber(f, 1);
  const numSize = fitSize(ctx, final, colW, 1, base * (wide ? 0.4 : 0.46), base * 0.08, (s) => font(s, 700));
  ctx.font = font(numSize, 700);
  ctx.fillStyle = c.accent;
  const numY = pad + base * 0.07 + numSize * 0.78;
  ctx.fillText(shown, pad - numSize * 0.03, numY);

  // the sentence
  const textSize = fitSize(ctx, f.sentence, colW, 4, base * 0.058, base * 0.03, (s) => font(s, 500));
  ctx.font = font(textSize, 500);
  ctx.fillStyle = c.fg;
  const lines = wrap(ctx, f.sentence, colW);
  const lineH = textSize * 1.08;
  const textTop = numY + base * 0.05;
  lines.forEach((line, i) => ctx.fillText(line, pad, textTop + textSize + i * lineH));
  const textBottom = textTop + textSize + (lines.length - 1) * lineH;

  // chart
  const footH = base * 0.09;
  const chart: Box = wide
    ? { x: w * 0.56, y: pad + base * 0.1, w: w * 0.44 - pad, h: h - pad - footH - (pad + base * 0.1) }
    : { x: pad, y: textBottom + base * 0.08, w: w - pad * 2, h: h - footH - pad - (textBottom + base * 0.08) };
  if (f.chart === "donut" || (f.chart === "dot grid" && chart.w / chart.h <= 1.8)) {
    const s = Math.min(chart.w, chart.h);
    chart.x = wide ? chart.x + (chart.w - s) / 2 : chart.x;
    chart.y = chart.y + (chart.h - s);
    chart.w = chart.h = s;
  }
  if (chart.h > 40) drawChart(ctx, f, chart, t, c);

  // footer
  const fs = base * 0.026;
  ctx.font = font(fs, 500);
  ctx.fillStyle = c.fg;
  ctx.fillText("tMSC: Motion, Now 2026", pad, h - pad);
  const right = `n=${f.n.toLocaleString("en-US")}`;
  ctx.textAlign = "right";
  ctx.fillText(right, w - pad, h - pad);
  if (o.tag) {
    ctx.fillStyle = alpha(c.fg, 0.6);
    ctx.fillText("Example data", w - pad - ctx.measureText(right).width - fs * 1.2, h - pad);
  }
  ctx.textAlign = "left";
}
