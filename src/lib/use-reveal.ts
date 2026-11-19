import { useEffect } from "react";

/**
 * Revela elementos con `data-reveal` cuando entran a la pantalla (una sola vez).
 * El estilo vive en styles.css (.reveal-ready / .is-revealed) y se apaga con "reducir movimiento".
 */
export function useReveal(rootSelector = "[data-reveal]") {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(rootSelector));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, [rootSelector]);
}
