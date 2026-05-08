import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * /get-started is deprecated — redirect all visitors to /intake.
 * This handles any stale bookmarks or external links.
 */
export default function GetStartedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/intake", replace: true });
  }, [navigate]);

  return null;
}
