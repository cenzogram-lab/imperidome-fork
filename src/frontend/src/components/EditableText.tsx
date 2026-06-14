import { Link } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

// ---------------------------------------------------------------------------
// Shared edit mode style — visible pulsing neon outline with pencil cursor
// ---------------------------------------------------------------------------
const editBorderStyle: CSSProperties = {
  outline: `2px solid ${NEON}`,
  outlineOffset: "3px",
  backgroundColor: "rgba(57,255,20,0.06)",
  cursor: "pointer",
  borderRadius: "3px",
  boxShadow: `0 0 8px ${NEON_GLOW}, inset 0 0 4px rgba(57,255,20,0.05)`,
  position: "relative",
};

// Inject global CSS for the pulsing animation on EditableText components.
// This runs once when the module loads.
(function injectEditableTextStyles() {
  const id = "editable-text-global-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    [data-editable-active="true"] {
      animation: editable-pulse 1.8s ease-in-out infinite;
    }
    @keyframes editable-pulse {
      0%, 100% { box-shadow: 0 0 6px rgba(57,255,20,0.3), inset 0 0 4px rgba(57,255,20,0.05); }
      50%       { box-shadow: 0 0 16px rgba(57,255,20,0.7), inset 0 0 8px rgba(57,255,20,0.12); }
    }
    [data-editable-active="true"]:hover {
      background-color: rgba(57,255,20,0.12) !important;
      box-shadow: 0 0 20px rgba(57,255,20,0.8) !important;
    }
    /* Pencil badge on hover */
    [data-editable-active="true"]::after {
      content: "✏️";
      position: absolute;
      top: -10px;
      right: -6px;
      font-size: 11px;
      line-height: 1;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
    }
    [data-editable-active="true"]:hover::after {
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      [data-editable-active="true"] {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ---------------------------------------------------------------------------
// EditorOverlay — shared modal for all three component types
// ---------------------------------------------------------------------------
interface EditorOverlayProps {
  currentText: string;
  textKey: string;
  onClose: () => void;
  onSaved: (newText: string) => void;
}

function EditorOverlay({
  currentText,
  textKey,
  onClose,
  onSaved,
}: EditorOverlayProps) {
  const [draft, setDraft] = useState(currentText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { actor } = useActor();

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handlePanelKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  const handleSave = async () => {
    if (!actor) {
      setError("Actor not ready. Please try again.");
      return;
    }
    const session = getSession();
    if (!session || session.role !== "admin") {
      setError("Unauthorized: Super Admin access required.");
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
            adminEmail: string,
          ) => Promise<boolean>;
        }
      ).updateSiteText(textKey, DOMPurify.sanitize(draft), session.email);
      if (success) {
        broadcastSiteTextInvalidation();
        onSaved(draft);
      } else {
        setError("Save failed — backend returned false.");
      }
    } catch (err) {
      console.error("[EditableText] updateSiteText error:", err);
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
      {/* Backdrop */}
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

      {/* Editor panel */}
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
        onKeyDown={handlePanelKeyDown}
      >
        {/* Header */}
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

        {/* Textarea */}
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

        {/* Error */}
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

        {/* Actions */}
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
interface ToastProps {
  message: string;
  onDone: () => void;
}

function SavedToast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  const toast = (
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
      ✓ {message}
    </div>
  );

  return ReactDOM.createPortal(toast, document.body);
}

// ---------------------------------------------------------------------------
// useEditableState — shared hook logic for all three component types
// ---------------------------------------------------------------------------
function useEditableState(textKey: string, defaultText: string) {
  const editMode = useSiteTextStore((s) => s.editMode);
  const getText = useSiteTextStore((s) => s.getText);
  const updateText = useSiteTextStore((s) => s.updateText);

  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const currentText = getText(textKey, defaultText);
  const session = getSession();
  const isSuperAdmin = editMode && session?.role === "admin";

  const openEditor = () => {
    if (isSuperAdmin) setIsEditing(true);
  };

  const handleSaved = (newText: string) => {
    updateText(textKey, newText);
    setIsEditing(false);
    setShowToast(true);
  };

  return {
    isSuperAdmin,
    currentText,
    isEditing,
    showToast,
    openEditor,
    handleSaved,
    closeEditor: () => setIsEditing(false),
    closeToast: () => setShowToast(false),
  };
}

// ---------------------------------------------------------------------------
// EditableText — inline span/heading/paragraph wrapper (original behavior)
// ---------------------------------------------------------------------------
interface EditableTextProps {
  textKey: string;
  defaultText: string;
  /** The HTML tag to render. Defaults to "span" for safe inline use. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: never;
}

export function EditableText({
  textKey,
  defaultText,
  as,
  className,
  style,
}: EditableTextProps) {
  // Default to "span" so it is safe inside <p> and <h*> elements
  const Tag = (as ?? "span") as ElementType<HTMLAttributes<HTMLElement>>;

  const {
    isSuperAdmin,
    currentText,
    isEditing,
    showToast,
    openEditor,
    handleSaved,
    closeEditor,
    closeToast,
  } = useEditableState(textKey, defaultText);

  const handleKeyUp = (e: ReactKeyboardEvent) => {
    if (isSuperAdmin && (e.key === "Enter" || e.key === " ")) openEditor();
  };

  // Combined style: when in edit mode, merge the pulsing outline on top of
  // any caller-supplied style so product card text is unmistakably editable.
  const combinedStyle: CSSProperties = isSuperAdmin
    ? { ...style, ...editBorderStyle }
    : (style ?? {});

  return (
    <>
      <Tag
        className={className}
        style={combinedStyle}
        onClick={isSuperAdmin ? openEditor : undefined}
        onKeyUp={isSuperAdmin ? handleKeyUp : undefined}
        role={isSuperAdmin ? "button" : undefined}
        tabIndex={isSuperAdmin ? 0 : undefined}
        title={isSuperAdmin ? `Click to edit: ${textKey}` : undefined}
        data-ocid={`editable-text-${textKey}`}
        // Signal to GodModeOverlay that this element handles its own editing
        data-editable-managed="true"
        // Drive the CSS pulse animation
        data-editable-active={isSuperAdmin ? "true" : undefined}
      >
        {currentText}
      </Tag>

      {isEditing && (
        <EditorOverlay
          currentText={currentText}
          textKey={textKey}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      {showToast && <SavedToast message="Saved!" onDone={closeToast} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// EditableButton — wraps a <button>. Intercepts click in edit mode.
// ---------------------------------------------------------------------------
interface EditableButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  textKey: string;
  defaultText: string;
  /** href makes the button render as an <a> tag when edit mode is OFF */
  href?: string;
  className?: string;
  style?: CSSProperties;
}

export function EditableButton({
  textKey,
  defaultText,
  href,
  className,
  style,
  onClick,
  ...rest
}: EditableButtonProps) {
  const {
    isSuperAdmin,
    currentText,
    isEditing,
    showToast,
    openEditor,
    handleSaved,
    closeEditor,
    closeToast,
  } = useEditableState(textKey, defaultText);

  const handleClick = (
    e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    if (isSuperAdmin) {
      // Suppress navigation/action — open editor instead
      e.preventDefault();
      e.stopPropagation();
      openEditor();
      return;
    }
    if (onClick)
      (onClick as (e: MouseEvent<HTMLButtonElement>) => void)(
        e as MouseEvent<HTMLButtonElement>,
      );
  };

  const combinedStyle: CSSProperties = isSuperAdmin
    ? { ...style, ...editBorderStyle }
    : (style ?? {});

  const editProps = isSuperAdmin
    ? {
        title: `Click to edit label: ${textKey}`,
        "data-edit-mode": "true",
        "data-editable-managed": "true",
        "data-editable-active": "true",
      }
    : {};

  // When edit mode is OFF and href is provided, render as an anchor for semantics
  if (!isSuperAdmin && href) {
    return (
      <>
        <a
          href={href}
          className={className}
          style={style}
          data-ocid={`editable-btn-${textKey}`}
        >
          {currentText}
        </a>
        {showToast && <SavedToast message="Saved!" onDone={closeToast} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={combinedStyle}
        onClick={handleClick as (e: MouseEvent<HTMLButtonElement>) => void}
        data-ocid={`editable-btn-${textKey}`}
        {...editProps}
        {...(isSuperAdmin ? {} : rest)}
      >
        {currentText}
      </button>

      {isEditing && (
        <EditorOverlay
          currentText={currentText}
          textKey={textKey}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      {showToast && <SavedToast message="Saved!" onDone={closeToast} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// EditableLink — wraps an <a> / react-router Link. Intercepts click in edit mode.
// ---------------------------------------------------------------------------
interface EditableLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  textKey: string;
  defaultText: string;
  href: string;
  /** Use react-router <Link> for internal routes (default true for relative paths) */
  useRouterLink?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function EditableLink({
  textKey,
  defaultText,
  href,
  useRouterLink,
  className,
  style,
  onClick,
  ...rest
}: EditableLinkProps) {
  const {
    isSuperAdmin,
    currentText,
    isEditing,
    showToast,
    openEditor,
    handleSaved,
    closeEditor,
    closeToast,
  } = useEditableState(textKey, defaultText);

  // Auto-detect internal links unless explicitly overridden
  const isInternal =
    useRouterLink !== undefined
      ? useRouterLink
      : href.startsWith("/") || href.startsWith("#");

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isSuperAdmin) {
      e.preventDefault();
      e.stopPropagation();
      openEditor();
      return;
    }
    if (onClick) onClick(e);
  };

  const combinedStyle: CSSProperties = isSuperAdmin
    ? { ...style, ...editBorderStyle }
    : (style ?? {});

  const sharedProps = {
    className,
    style: combinedStyle,
    onClick: handleClick,
    "data-ocid": `editable-link-${textKey}`,
    ...(isSuperAdmin
      ? {
          title: `Click to edit label: ${textKey}`,
          "data-editable-managed": "true",
          "data-editable-active": "true",
        }
      : {}),
  };

  return (
    <>
      {isInternal ? (
        <Link
          to={href}
          {...sharedProps}
          {...(isSuperAdmin ? {} : (rest as object))}
        >
          {currentText}
        </Link>
      ) : (
        <a
          href={href}
          {...sharedProps}
          {...(isSuperAdmin ? {} : rest)}
          rel={rest.rel ?? "noopener noreferrer"}
        >
          {currentText}
        </a>
      )}

      {isEditing && (
        <EditorOverlay
          currentText={currentText}
          textKey={textKey}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      {showToast && <SavedToast message="Saved!" onDone={closeToast} />}
    </>
  );
}

export default EditableText;
