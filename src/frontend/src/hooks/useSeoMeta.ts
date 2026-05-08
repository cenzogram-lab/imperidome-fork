import { useEffect } from "react";
import { useSiteTextStore } from "../store/useSiteTextStore";

interface SeoMeta {
  title: string;
  description: string;
}

/**
 * Reads SEO meta overrides from the site text store.
 * Keys: meta.title.<pageKey> and meta.description.<pageKey>
 * Falls back to defaultTitle / empty description if not set.
 * Sets document.title reactively via useEffect.
 */
export function useSeoMeta(pageKey: string, defaultTitle: string): SeoMeta {
  const getText = useSiteTextStore((s) => s.getText);

  const title = getText(`meta.title.${pageKey}`, defaultTitle);
  const description = getText(`meta.description.${pageKey}`, "");

  useEffect(() => {
    document.title = title;
  }, [title]);

  return { title, description };
}
