import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicPages } from "@/lib/generated/registry";
import { getPrototype } from "@/lib/prototypes";
import { siteUrl } from "@/lib/site";

/**
 * Public route: renders the same page component as /prototypes/<slug>, without login,
 * for prototypes whose metadata.json has "public": true. Everything else is a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = Object.keys(publicPages);
  // Next needs at least one param to prerender; the placeholder 404s below.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrototype(slug);
  if (!p?.public) return {};
  const url = `/p/${slug}`;
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: p.title,
      description: p.description,
      images: p.og.image ? [{ url: p.og.image, width: 1200, height: 630, alt: p.title }] : undefined,
      // Next resolves image URLs against metadataBase but not video URLs, so do it here.
      videos: p.og.video
        ? [
            {
              url: `${siteUrl()}${p.og.video}`,
              secureUrl: `${siteUrl()}${p.og.video}`,
              type: "video/mp4",
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
      images: p.og.image ? [p.og.image] : undefined,
    },
  };
}

export default async function PublicPrototype({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const load = publicPages[slug];
  if (!load || !getPrototype(slug)?.public) notFound();
  const { default: Page } = await load();
  return <Page />;
}
