import { resolveRegistryEntry, type TestRegistryEntry } from "@/data/test-registry";

export type ResolvedTest =
  | { mode: "iframe"; url: string; entry: TestRegistryEntry }
  | { mode: "speaking"; entry: TestRegistryEntry };

/** Resolve any IELTS or SAT slug to a loadable asset path. */
export function resolveTestAsset(slug: string): ResolvedTest | null {
  const entry = resolveRegistryEntry(slug);
  if (!entry) return null;

  if (entry.assetPath === "react-speaking" || entry.kind === "speaking") {
    return { mode: "speaking", entry };
  }

  return { mode: "iframe", url: entry.assetPath, entry };
}

/** SAT route params → registry slug */
export function satParamsToSlug(section: string, slug: string): string {
  const normalizedSection = section.toLowerCase();
  const normalizedSlug = slug.toLowerCase();
  const direct = `sat-${normalizedSection}-${normalizedSlug}`;
  if (resolveRegistryEntry(direct)) return direct;
  return normalizedSlug;
}

export function resolveSatAsset(section: string, slug: string): string | null {
  const registrySlug = satParamsToSlug(section, slug);
  const resolved = resolveTestAsset(registrySlug);
  if (resolved?.mode === "iframe") return resolved.url;

  // Legacy direct path fallback
  return `/tests/sat/${section.toLowerCase()}/${slug.toLowerCase()}.html`;
}
