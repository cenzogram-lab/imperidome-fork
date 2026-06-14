/**
 * GodModeOverlay — Universal DOM-based text editor for God Mode.
 *
 * When editMode is ON and the user is the super admin, this component:
 * 1. Traverses the entire public DOM to find all text-containing leaf nodes.
 * 2. Marks each with data-god-editable="true" and class "god-mode-editable".
 * 3. Uses a single delegated click handler to open an inline editor on any
 *    marked element WITHOUT requiring every element to be wrapped in EditableText.
 *
 * For elements already managed by EditableText/EditableButton/EditableLink
 * (detected via data-editable-managed="true"), the click handler forwards the
 * click directly to the underlying DOM element so their own openEditor fires.
 * This means ALL text on the page — whether wrapped or unwrapped — is editable.
 *
 * Exclusions:
 * - input, textarea, select, script, style, code, pre elements
 * - Elements inside [data-admin], .admin-panel, or /admin routes
 * - Elements that already have data-god-editable set (avoid double-marking)
 *
 * This is additive — existing EditableText/EditableButton/EditableLink
 * components continue to work exactly as before via their own openEditor.
 * GodModeOverlay handles the DOM-traversal overlay for unwrapped text, and
 * also acts as a delegating click router for managed elements.
 */

import DOMPurify from "dompurify";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";
import {
  broadcastSiteTextInvalidation,
  useSiteTextStore,
} from "../store/useSiteTextStore";

const NEON = "#39FF14";
const DARK = "#0a0a0a";
const NEON_DIM = "#39FF1444";
const NEON_GLOW = "rgba(57,255,20,0.25)";

// Tags we traverse into but never mark directly (container elements)
const CONTAINER_TAGS = new Set([
  "DIV",
  "SECTION",
  "ARTICLE",
  "MAIN",
  "NAV",
  "HEADER",
  "FOOTER",
  "ASIDE",
  "UL",
  "OL",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "COLGROUP",
  "COL",
  "FORM",
  "FIELDSET",
  "FIGURE",
  "DETAILS",
  "SUMMARY",
]);

// Tags we skip entirely (no traversal, no marking)
const SKIP_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "CANVAS",
  "SVG",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "AUDIO",
  "VIDEO",
  "IMG",
  "BR",
  "HR",
  "META",
  "LINK",
  "BASE",
]);

// Tags we mark if they contain direct text content
const LEAF_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "LI",
  "TD",
  "TH",
  "LABEL",
  "BLOCKQUOTE",
  "STRONG",
  "B",
  "EM",
  "I",
  "SMALL",
  "BUTTON",
  "A",
]);

/** Generate a stable key for a DOM element */
function generateKey(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "")
    .trim()
    .slice(0, 40)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/gi, "");
  // Stable index among siblings with same tag
  let idx = 0;
  const parent = el.parentElement;
  if (parent) {
    let sib = parent.firstElementChild;
    while (sib && sib !== el) {
      if (sib.tagName === el.tagName) idx++;
      sib = sib.nextElementSibling;
    }
  }
  return `god_${tag}_${text.slice(0, 24)}_${idx}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 60);
}

/** Check if an element is inside an admin zone */
function isInAdminZone(el: Element): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (
      cur.hasAttribute("data-admin") ||
      cur.classList.contains("admin-panel") ||
      cur.getAttribute("data-ocid")?.includes("admin")
    )
      return true;
    cur = cur.parentElement;
  }
  return false;
}

/**
 * Check if an element is already managed by EditableText/Button/Link.
 * Previously this excluded editable-text-* from the DOM walk entirely,
 * which made product card text invisible to the overlay. Now we only
 * skip elements that have ALREADY been marked by god-mode (data-god-editable)
 * to prevent double-marking. Managed elements (data-editable-managed) are
 * NOT excluded — they are still traversed so their visual highlight is shown,
 * but when clicked, the click is forwarded to their own openEditor.
 */
function isAlreadyGodMarked(el: Element): boolean {
  if (el.hasAttribute("data-god-editable")) return true;

  // Exempt all login form elements — never intercept login input/button/link
  const ocid = el.getAttribute("data-ocid") ?? "";
  if (ocid.startsWith("login.")) return true;
  if (el.closest("[data-login-form]")) return true;

  return false;
}

/** Returns true if element has meaningful direct text (not just whitespace/emoji) */
function hasDirectText(el: Element): boolean {
  // Check if any direct child is a non-empty text node
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if ((node.textContent ?? "").trim().length > 0) return true;
    }
  }
  return false;
}

/** Walk the DOM and collect all markable leaf elements */
function collectLeafElements(root: Element): Element[] {
  const results: Element[] = [];

  function walk(el: Element) {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (isInAdminZone(el)) return;
    if (isAlreadyGodMarked(el)) return;

    if (LEAF_TAGS.has(el.tagName)) {
      // Mark this element if it has direct text content
      if (hasDirectText(el) && (el.textContent ?? "").trim().length > 0) {
        results.push(el);
      }
      // Also recurse to find nested leaf elements
      for (const child of el.children) {
        walk(child);
      }
      return;
    }

    if (CONTAINER_TAGS.has(el.tagName)) {
      for (const child of el.children) {
        walk(child);
      }
    }
  }

  walk(root);
  return results;
}

/** Mark all leaf elements with data-god-editable */
function markElements(root: Element) {
  const leaves = collectLeafElements(root);
  for (const el of leaves) {
    if (!el.hasAttribute("data-god-editable")) {
      const key = generateKey(el);
      el.setAttribute("data-god-editable", "true");
      el.setAttribute("data-god-key", key);
      el.classList.add("god-mode-editable");
    }
  }
}

/** Remove all god-mode markings */
function unmarkElements() {
  const marked = document.querySelectorAll("[data-god-editable]");
  for (const el of marked) {
    el.removeAttribute("data-god-editable");
    el.removeAttribute("data-god-key");
    el.classList.remove("god-mode-editable");
  }
}

// ---------------------------------------------------------------------------
// EditorOverlay — reused from EditableText pattern (standalone copy for DOM els)
// ---------------------------------------------------------------------------
interface GodEditorOverlayProps {
  currentText: string;
  textKey: string;
  onClose: () => void;
  onSaved: (newText: string, el: Element) => void;
  targetEl: Element;
}

function GodEditorOverlay({
  currentText,
  textKey,
  onClose,
  onSaved,
  targetEl,
}: GodEditorOverlayProps) {
  const [draft, setDraft] = useState(currentText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { actor } = useActor();
  const updateText = useSiteTextStore((s) => s.updateText);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handleSave = async () => {
    if (!actor) {
      setError("Actor not ready.");
      return;
    }
    const session = getSession();
    if (!session || session.role !== "admin") {
      setError("Unauthorized.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const success = await (
        actor as {
          updateSiteText: (
            key: string,
            value: string,
            email: string,
          ) => Promise<boolean>;
        }
      ).updateSiteText(textKey, DOMPurify.sanitize(draft), session.email);
      if (success) {
        broadcastSiteTextInvalidation();
        updateText(textKey, draft);
        onSaved(draft, targetEl);
      } else {
        setError("Save failed — backend returned false.");
      }
    } catch (err) {
      console.error("[GodModeOverlay] updateSiteText error:", err);
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const overlay = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.75)",
          border: "none",
          cursor: "default",
          padding: 0,
        }}
      />
      <dialog
        open
        aria-label="Edit text"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: DARK,
          border: `2px solid ${NEON}`,
          borderRadius: "8px",
          padding: "24px",
          width: "min(540px, 90vw)",
          boxShadow: `0 0 32px ${NEON_GLOW}`,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: NEON,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Edit: {textKey}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            backgroundColor: "#111",
            border: `1px solid ${NEON_DIM}`,
            borderRadius: "6px",
            color: "#ffffff",
            fontSize: "14px",
            lineHeight: "1.6",
            padding: "10px 12px",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = NEON;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = NEON_DIM;
          }}
        />
        {error && (
          <p
            style={{
              color: "#ff4444",
              fontSize: "12px",
              margin: 0,
              padding: "6px 10px",
              backgroundColor: "rgba(255,68,68,0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(255,68,68,0.3)",
            }}
          >
            {error}
          </p>
        )}
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              border: "1px solid #444",
              backgroundColor: "transparent",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: saving ? "#1a7a0a" : NEON,
              color: DARK,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              transition: "background-color 0.2s",
              minWidth: "80px",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </dialog>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}

// ---------------------------------------------------------------------------
// SavedToast
// ---------------------------------------------------------------------------
function GodSavedToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 10000,
        backgroundColor: DARK,
        border: `1.5px solid ${NEON}`,
        borderRadius: "8px",
        padding: "10px 18px",
        color: NEON,
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        boxShadow: "0 0 20px rgba(57,255,20,0.3)",
        pointerEvents: "none",
      }}
    >
      ✓ Saved!
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// GodModeOverlay — mounts once at the app root
// ---------------------------------------------------------------------------
interface EditingState {
  el: Element;
  key: string;
  text: string;
}

export function GodModeOverlay() {
  const editMode = useSiteTextStore((s) => s.editMode);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showToast, setShowToast] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const updateText = useSiteTextStore((s) => s.updateText);

  const session = getSession();
  const isSuperAdmin = editMode && session?.role === "admin";

  // ── Mark/unmark all leaf elements when editMode changes ──
  useEffect(() => {
    if (!isSuperAdmin) {
      unmarkElements();
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    // Watch for DOM changes (SPA route transitions, AnimatePresence, etc.)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            markElements(node as Element);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    // Initial mark — runs after observer is attached
    markElements(document.body);

    return () => {
      observer.disconnect();
      observerRef.current = null;
      unmarkElements();
    };
  }, [isSuperAdmin]);

  // ── Delegated click handler ──
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isSuperAdmin) return;
      const target = e.target as Element;

      // Never intercept login form elements
      const targetOcid = target.getAttribute?.("data-ocid") ?? "";
      if (targetOcid.startsWith("login.")) return;
      if (target.closest?.("[data-login-form]")) return;

      // Don't intercept clicks inside any editor overlay
      const dialog = document.querySelector("dialog[aria-label='Edit text']");
      if (dialog?.contains(target)) return;

      // Walk up to find the nearest editable element — either a god-marked
      // element OR an EditableText/Button/Link managed element.
      let el: Element | null = target;
      while (el && el !== document.body) {
        const ocid = el.getAttribute?.("data-ocid") ?? "";

        // ── Case 1: EditableText / EditableButton / EditableLink ──
        // These elements handle their own editing. We simply forward the click
        // to the element directly so their React onClick fires, which calls
        // openEditor(). We do NOT preventDefault here so the React synthetic
        // event also fires — but we DO stopPropagation to prevent this
        // capture-phase handler from re-running on the bubble.
        if (
          ocid.startsWith("editable-text-") ||
          ocid.startsWith("editable-btn-") ||
          ocid.startsWith("editable-link-")
        ) {
          // Prevent default browser action (navigation on links, form submit)
          // but allow the React onClick to fire by NOT stopping propagation
          // at capture phase for these elements.
          e.preventDefault();
          // If the click didn't originate directly on the managed element
          // (e.g., it landed on a child text node's parent), dispatch a fresh
          // click so the React handler fires reliably.
          if (el !== target) {
            (el as HTMLElement).click();
          }
          return;
        }

        // ── Case 2: GodMode-marked element (unwrapped DOM text) ──
        if (el.hasAttribute("data-god-editable")) {
          e.preventDefault();
          e.stopPropagation();
          const key = el.getAttribute("data-god-key") ?? generateKey(el);
          const currentText = (el.textContent ?? "").trim();
          setEditing({ el, key, text: currentText });
          return;
        }

        el = el.parentElement;
      }
    },
    [isSuperAdmin],
  );

  useEffect(() => {
    if (!isSuperAdmin) return;
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [isSuperAdmin, handleClick]);

  const handleSaved = useCallback(
    (newText: string, targetEl: Element) => {
      // Update the DOM element directly so the user sees the change immediately
      const hasChildElements = targetEl.children.length > 0;
      if (!hasChildElements) {
        targetEl.textContent = newText;
      } else {
        // Update only the first direct text node
        for (const node of targetEl.childNodes) {
          if (
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent ?? "").trim().length > 0
          ) {
            node.textContent = newText;
            break;
          }
        }
      }
      // Persist to store
      if (editing) {
        updateText(editing.key, newText);
      }
      setEditing(null);
      setShowToast(true);
    },
    [editing, updateText],
  );

  if (!isSuperAdmin) return null;

  return (
    <>
      {editing && (
        <GodEditorOverlay
          currentText={editing.text}
          textKey={editing.key}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          targetEl={editing.el}
        />
      )}
      {showToast && <GodSavedToast onDone={() => setShowToast(false)} />}
    </>
  );
}

export default GodModeOverlay;
