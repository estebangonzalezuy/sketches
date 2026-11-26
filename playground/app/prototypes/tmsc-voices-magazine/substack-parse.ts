/**
 * Turns a Substack post (title, subtitle, body HTML) into what a feature needs: paragraphs
 * (questions in bold vs answers), candidate hero quotes (verbatim), images, and the guest's
 * name. Pure string work, no DOM, so the API route and the tests can both use it.
 */

export type Block = { kind: "q" | "a"; text: string };
export type PostImage = { src: string; caption: string; animated: boolean };
export type PostSummary = { slug: string; title: string; subtitle: string; date: string; cover: string | null; paid: boolean };
export type PostData = PostSummary & { guest: string; url: string; blocks: Block[]; quotes: string[]; images: PostImage[]; interview: boolean; series: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", mdash: "—", ndash: "–" };

export function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export const text = (html: string) => decode(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/** Emoji don't exist in the magazine's fonts; titles lose them rather than print tofu. */
export const plain = (s: string) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();

/** "Be ready … w/Victor Verdugo" → "Victor Verdugo"; "ft. Justin Cone, co-founder…" → "Justin Cone". */
export function guestFrom(title: string, subtitle: string, byline: string): string {
  const w = /\sw\/\s*([^(]+?)\s*(\(|$)/i.exec(title);
  if (w) return plain(w[1]);
  const ft = /\bft\.?\s+([^,]+)/i.exec(subtitle);
  if (ft) return plain(ft[1]);
  return byline;
}

/** The title without the guest tail and emoji. */
export const headline = (title: string) => plain(title.replace(/\s+w\/.*$/i, ""));

/** The original image behind a substackcdn fetch URL (or the URL itself). */
export function originalImage(url: string): string {
  const m = /\/(https%3A%2F%2F[^/?"\s]+)$/i.exec(url);
  return m ? decodeURIComponent(m[1]) : url;
}

function images(html: string): PostImage[] {
  const out: PostImage[] = [];
  for (const fig of html.match(/<figure[\s\S]*?<\/figure>/gi) ?? []) {
    const raw = /https%3A%2F%2Fsubstack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F[^"\s,&]+/i.exec(fig)?.[0];
    const direct = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/[^"\s,&]+/i.exec(fig)?.[0];
    const src = raw ? decodeURIComponent(raw) : direct;
    if (!src || out.some((i) => i.src === src)) continue;
    // section dividers are thin strips; leave them out
    const size = /_(\d+)x(\d+)\.\w+$/.exec(src);
    if (size && Number(size[1]) / Number(size[2]) > 6) continue;
    const cap = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(fig);
    out.push({ src, caption: cap ? text(cap[1]) : "", animated: /\.gif$/i.test(src) });
  }
  return out;
}

/** `joined`: no image or rule between this paragraph and the one before it. */
type Para = { text: string; bold: boolean; skip: boolean; joined: boolean };

function paragraphs(html: string): Para[] {
  const body = html.replace(/<figure[\s\S]*?<\/figure>/gi, "<hr>");
  const out: Para[] = [];
  let lastEnd = 0;
  for (const m of body.matchAll(/<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const gap = body.slice(lastEnd, m.index);
    lastEnd = (m.index ?? 0) + m[0].length;
    const t = text(m[2]);
    if (!t) continue;
    const inner = m[2].trim();
    const linksOnly = /<a\s/i.test(inner) && text(inner.replace(/<a\s[\s\S]*?<\/a>/gi, "")).replace(/[-–|·\s]/g, "") === "";
    const label = /^<em>/i.test(inner) && t.length < 40; // "Transcript" and similar
    const prev = out[out.length - 1];
    // a paragraph split after its first letter in the source ("A" / "nd the work…") is joined back
    if (prev && /(^|\s)[A-Z]$/.test(prev.text) && /^[a-z]/.test(t)) {
      prev.text += t;
      continue;
    }
    out.push({ text: t, bold: /^h/i.test(m[1]) || /^<(strong|b)\b/i.test(inner), skip: linksOnly || label, joined: !/<hr/i.test(gap) });
  }
  return out;
}

export function parsePost(summary: PostSummary, html: string, byline: string, url: string): PostData {
  const paras = paragraphs(html);
  const all = paras.map((p) => p.text);
  // a paragraph repeated inside a longer one is a pull quote: the author's own pick of a line
  // an interview starts at its first question (bold or a heading, ending in "?"); bold before
  // that is the intro's emphasis. Without one it's an essay and goes in whole.
  const q = paras.findIndex((p) => p.bold && /\?\s*$/.test(p.text));
  const interview = q >= 0;
  // a two-part question ("Tell me about X." / "How did it start?") starts one paragraph earlier
  const first = !interview ? 0 : q > 0 && paras[q - 1].bold && paras[q].joined ? q - 1 : q;
  const pull = paras.filter((p, i) => i >= first && !p.bold && all.some((o) => o !== p.text && o.length > p.text.length && o.includes(p.text)));
  const pullSet = new Set(pull.map((p) => p.text));
  const blocks: Block[] = [];
  for (const p of paras.slice(first)) {
    if (p.skip || pullSet.has(p.text)) continue;
    const kind = p.bold ? "q" : "a";
    const last = blocks[blocks.length - 1];
    if (kind === "q" && last?.kind === "q") last.text += ` ${p.text}`;
    else blocks.push({ kind, text: p.text });
  }
  const sentences = blocks
    .filter((b) => b.kind === "a")
    .flatMap((b) => b.text.split(/(?<=[.!?…])\s+/))
    .filter((s) => s.length >= 60 && s.length <= 220 && /[.!?…]$/.test(s));
  const quotes = [...new Set([...pull.map((p) => p.text), ...sentences])].slice(0, 24);
  const series = /voice file/i.test(html) ? "Voice File" : interview ? "Conversation" : "";
  return { ...summary, guest: guestFrom(summary.title, summary.subtitle, byline), url, blocks, quotes, images: images(html), interview, series };
}
