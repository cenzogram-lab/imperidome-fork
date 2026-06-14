import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  once?: boolean;
}

export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {},
): boolean {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = "0px",
    once = true,
  } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once && observerRef.current) {
            observerRef.current.unobserve(el);
          }
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { threshold, root, rootMargin },
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref, threshold, root, rootMargin, once]);

  return isIntersecting;
}

export default useIntersectionObserver;
