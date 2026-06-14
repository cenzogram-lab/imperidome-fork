import { useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
}

interface UseTypewriterResult {
  displayText: string;
  isDone: boolean;
}

export function useTypewriter({
  text,
  speed = 50,
  enabled = true,
}: UseTypewriterOptions): UseTypewriterResult {
  const [displayText, setDisplayText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: text changes should reset the typewriter
  useEffect(() => {
    // Reset when text changes
    setDisplayText("");
    setIsDone(false);
    indexRef.current = 0;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [text]);

  useEffect(() => {
    if (!enabled) {
      // Pause — clear any pending timer but keep state
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (indexRef.current >= text.length) {
      setIsDone(true);
      return;
    }

    const tick = () => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayText(text.slice(0, indexRef.current));

        if (indexRef.current >= text.length) {
          setIsDone(true);
        } else {
          timerRef.current = setTimeout(tick, speed);
        }
      }
    };

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, text, speed]);

  return { displayText, isDone };
}

export default useTypewriter;
