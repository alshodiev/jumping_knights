import { useEffect } from "react";

/** Sets the tab title and (optionally) asks search engines not to list the page. */
export function usePageMeta(title: string, noindex = false) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let tag: HTMLMetaElement | null = null;
    if (noindex) {
      tag = document.createElement("meta");
      tag.name = "robots"; tag.content = "noindex, nofollow";
      document.head.appendChild(tag);
    }
    return () => { document.title = prev; tag?.remove(); };
  }, [title, noindex]);
}
