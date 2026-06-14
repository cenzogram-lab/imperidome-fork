import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useTypewriter } from "@/hooks/useTypewriter";
import React, { useRef } from "react";

type TagName = keyof React.JSX.IntrinsicElements;

type TypewriterTextProps = {
  text: string;
  as?: TagName;
  speed?: number;
  className?: string;
  onDone?: () => void;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">;

function TypewriterText({
  text,
  as: Tag = "span",
  speed = 50,
  className = "",
  onDone,
  ...rest
}: TypewriterTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isIntersecting = useIntersectionObserver(
    containerRef as React.RefObject<Element>,
    { threshold: 0.1, once: true },
  );

  const { displayText, isDone } = useTypewriter({
    text,
    speed,
    enabled: isIntersecting,
  });

  // Fire onDone callback when animation completes
  const prevDoneRef = useRef(false);
  if (isDone && !prevDoneRef.current) {
    prevDoneRef.current = true;
    onDone?.();
  }

  const cursorClass = isDone ? "" : "blink-cursor";
  const combinedClass = [className, cursorClass].filter(Boolean).join(" ");

  return React.createElement(
    Tag,
    {
      ref: containerRef,
      className: combinedClass || undefined,
      ...rest,
    },
    displayText,
  );
}

export default TypewriterText;
