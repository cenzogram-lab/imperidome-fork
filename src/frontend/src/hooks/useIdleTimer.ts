import { useCallback, useEffect, useRef, useState } from "react";

const WARN_MS = 25 * 60 * 1000; // 25 minutes
const LOGOUT_MS = 30 * 60 * 1000; // 30 minutes

interface UseIdleTimerOptions {
  onWarn: () => void;
  onLogout: () => void;
}

interface UseIdleTimerResult {
  isWarning: boolean;
  timeRemaining: number; // ms until auto-logout
  resetTimer: () => void;
}

export function useIdleTimer({
  onWarn,
  onLogout,
}: UseIdleTimerOptions): UseIdleTimerResult {
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(LOGOUT_MS);

  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);
  const loggedOutRef = useRef(false);

  const stableReset = useCallback(() => {
    lastActivityRef.current = Date.now();
    loggedOutRef.current = false;
    warnedRef.current = false;
    setIsWarning(false);
    setTimeRemaining(LOGOUT_MS);
  }, []);

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    function handleActivity() {
      // Only reset if not already in warning state — user must click "Stay logged in" to reset
      if (!warnedRef.current) {
        lastActivityRef.current = Date.now();
      }
    }

    for (const evt of events) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, LOGOUT_MS - elapsed);
      setTimeRemaining(remaining);

      if (elapsed >= LOGOUT_MS && !loggedOutRef.current) {
        loggedOutRef.current = true;
        setIsWarning(false);
        onLogout();
        return;
      }

      if (elapsed >= WARN_MS && !warnedRef.current) {
        warnedRef.current = true;
        setIsWarning(true);
        onWarn();
      }
    }, 1000);

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handleActivity);
      }
      clearInterval(interval);
    };
  }, [onWarn, onLogout]);

  return { isWarning, timeRemaining, resetTimer: stableReset };
}
