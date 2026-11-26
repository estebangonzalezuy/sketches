import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { displayDate, INTERVIEWS } from "./content";
import { buildBook } from "./faces";
import { addFeature, DEFAULT_MAGAZINE, moveFeature, removeFeature, sanitizeMagazine, updateFeature } from "./feature";
import { resolveFeature } from "./feature-data";
import { guestFrom, headline, parsePost, type PostSummary } from "./substack-parse";

const summary: PostSummary = { slug: "a-post", title: "✨ Making things w/Ana Pérez (@ana)", subtitle: "On work", date: "2026-06-30T06:02:02.035Z", cover: null, paid: false };

const HTML = `
<p>Intro by the host, with <strong>emphasis</strong>.</p>
<p><strong>A bold aside in the intro.</strong></p>
<figure><img src="https://substackcdn.com/image/fetch/w_1456/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fabc_900x546.gif"><figcaption>Work by Ana</figcaption></figure>
<figure><img src="https://substackcdn.com/image/fetch/w_1456/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdiv_2305x134.png"></figure>
<p><strong>Who are you?</strong></p>
<p><em>Transcript</em></p>
<p>I make small films. Each one starts as a sketch on paper and ends up moving on a screen somewhere.</p>
<p>Each one starts as a sketch on paper and ends up moving on a screen somewhere.</p>
<h4>What would you tell someone starting out?</h4>
<p>Make the thing you want to see, then put it out there and see what comes back to you. A</p>
<p>nd keep going.</p>
<p><a href="https://example.com">Ana's site</a> - <a href="https://example.com/ig">Instagram</a></p>`;

describe("substack parsing", () => {
  const post = parsePost(summary, HTML, "Host Name", "https://x/p/a-post");

  it("finds the guest and a clean headline", () => {
    expect(post.guest).toBe("Ana Pérez");
    expect(headline(summary.title)).toBe("Making things");
    expect(guestFrom("Motion got harder", "ft. Justin Cone, co-founder", "Esteban")).toBe("Justin Cone");
    expect(guestFrom("An essay", "", "Esteban González")).toBe("Esteban González");
  });

  it("starts an interview at its first question and keeps the text verbatim", () => {
    expect(post.interview).toBe(true);
    expect(post.blocks.map((b) => b.kind)).toEqual(["q", "a", "q", "a"]);
    expect(post.blocks[0].text).toBe("Who are you?");
    // the pull quote is a candidate, not repeated in the article; the link line and label are out
    expect(post.blocks.some((b) => b.text.startsWith("Each one starts"))).toBe(false);
    expect(post.blocks.some((b) => /Transcript|Instagram/.test(b.text))).toBe(false);
    expect(post.quotes[0]).toBe("Each one starts as a sketch on paper and ends up moving on a screen somewhere.");
    // a paragraph split after its first letter in the source is joined back
    expect(post.blocks[3].text.endsWith("back to you. And keep going.")).toBe(true);
  });

  it("keeps real images and leaves section dividers out", () => {
    expect(post.images).toEqual([{ src: "https://substack-post-media.s3.amazonaws.com/public/images/abc_900x546.gif", caption: "Work by Ana", animated: true }]);
  });

  it("treats a post without questions as an essay, in full", () => {
    const essay = parsePost(summary, "<p>One.</p><p><strong>Bold, not a question.</strong></p><p>Two.</p>", "Host", "u");
    expect(essay.interview).toBe(false);
    expect(essay.blocks.map((b) => b.text)).toEqual(["One.", "Bold, not a question.", "Two."]);
  });
});

describe("magazine model", () => {
  it("adds, removes, moves, and clears choices when the post changes", () => {
    let m = { features: [] as typeof DEFAULT_MAGAZINE.features };
    m = addFeature(addFeature(addFeature(m, "a"), "b"), "c");
    expect(m.features.map((f) => f.slug)).toEqual(["a", "b", "c"]);
    m = moveFeature(m, 2, 0);
    expect(m.features.map((f) => f.slug)).toEqual(["c", "a", "b"]);
    expect(moveFeature(m, 0, 9)).toBe(m);
    const id = m.features[0].id;
    m = updateFeature(m, id, { quote: "x", left: "#000000" });
    m = updateFeature(m, id, { slug: "d" });
    expect(m.features[0]).toEqual({ id, slug: "d", left: "#000000", right: undefined });
    m = removeFeature(m, id);
    expect(m.features).toHaveLength(2);
    expect(sanitizeMagazine({ features: [{ id: "x", slug: "ok-1" }, { id: 2 }, { id: "y", slug: "Bad Slug" }] })!.features).toEqual([{ id: "x", slug: "ok-1" }]);
    expect(sanitizeMagazine("nope")).toBeNull();
  });

  it("defaults to the four interviews with their verbatim hero quotes", () => {
    expect(DEFAULT_MAGAZINE.features.map((f) => f.guest)).toEqual(INTERVIEWS.map((i) => i.guest));
    DEFAULT_MAGAZINE.features.forEach((f, i) => {
      const quotes = raw.interviews[i].quotes.map((q) => q.text);
      expect(quotes).toContain(f.quote);
      expect(f.quote).not.toMatch(/ninety|90/i);
    });
    expect(INTERVIEWS.map((i) => displayDate(i.post_date))).toEqual(["17 Nov", "3 Nov", "13 Oct", "8 Sep"]);
  });

  it("fills blanks from the post and keeps explicit choices", () => {
    const post = parsePost(summary, HTML, "Host", "u");
    const auto = resolveFeature({ id: "f", slug: "a-post" }, post, 0);
    expect(auto.guest).toBe("Ana Pérez");
    expect(auto.quote).toBe(post.quotes[0]);
    expect(auto.image?.url).toContain("frame=3");
    expect(auto.image?.credit).toBe("Work by Ana");
    expect(auto.textImages).toEqual([null, null]);
    const set = resolveFeature({ id: "f", slug: "a-post", guest: "  Someone  ", image: null, right: "#0C0C0C" }, post, 1);
    expect(set.guest).toBe("Someone");
    expect(set.image).toBeNull();
    expect(set.right.ink).toBe("#FFFFFF");
  });
});

describe("page order", () => {
  it("gives every feature its spreads, for any number of features", () => {
    for (const n of [0, 1, 3, 6])
      for (const editorial of [false, true]) {
        const features = Array.from({ length: n }, (_, i) => ({ id: `f${i}`, guest: `G${i}` }));
        const { faces, sheets, spreadNames } = buildBook(features, editorial);
        expect(faces).toHaveLength(sheets * 2);
        expect(sheets).toBe(1 + n * (editorial ? 2 : 1));
        expect(spreadNames).toHaveLength(sheets + 1);
        for (let k = 1; k < sheets; k++) {
          const left = faces.find((f) => f.sheet === k - 1 && f.side === "back")!;
          const right = faces.find((f) => f.sheet === k && f.side === "front")!;
          expect(left.feature).toBe(right.feature);
        }
      }
  });
});
