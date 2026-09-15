import { useEffect } from "react";

const BASE_TITLE = "POLARIS | Expedition Command";

/** Set a unique <title> for the current page; restores the site title on unmount. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
