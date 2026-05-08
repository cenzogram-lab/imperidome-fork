/**
 * HelpWidget — Globally mounted floating help button.
 *
 * Positioned bottom-left to avoid conflict with FloatingGodModeToggle (bottom-right, z-9998).
 * Opens a glassmorphism panel with Name/Email/Message form.
 * On submit, calls the backend helpRequest() function.
 * Dark aesthetic with neon green (#39FF14) accents.
 */

import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";

const NEON = "#39FF14";
const NEON_DIM = "rgba(57,255,20,0.15)";
const NEON_GLOW =
  "0 0 6px #39ff14, 0 0 20px rgba(57,255,20,0.6), 0 0 50px rgba(57,255,20,0.3)";

type FormState = "idle" | "sending" | "success" | "error";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "9px",
  border: "1px solid rgba(57,255,20,0.18)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  fontSize: "13px",
  lineHeight: 1.4,
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const SUBJECT_OPTIONS = [
  "General Question",
  "Billing",
  "Technical Issue",
  "Feature Request",
  "Other",
] as const;

type Priority = "Low" | "Normal" | "Urgent";

const PRIORITY_OPTIONS: Priority[] = ["Low", "Normal", "Urgent"];

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [priority, setPriority] = useState<Priority>("Normal");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { actor, isFetching } = useActor();
  const panelRef = useRef<HTMLDivElement>(null);

  // Pre-fill name/email for logged-in portal clients (not admin)
  useEffect(() => {
    if (!open) return;
    const session = getSession();
    if (session && session.role !== "admin") {
      setName(session.firstName ?? "");
      setEmail(session.email ?? "");
    }
  }, [open]);

  // Generate/revoke object URL for thumbnail preview
  useEffect(() => {
    if (!attachedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachedFile]);

  function resetForm() {
    setName("");
    setEmail("");
    setSubject(SUBJECT_OPTIONS[0]);
    setPriority("Normal");
    setMessage("");
    setFormState("idle");
    setErrorMsg("");
    setAttachedFile(null);
    setPreviewUrl(null);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(resetForm, 300);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachedFile(file);
    // Reset input value so the same file can be re-selected after removal
    e.target.value = "";
  }

  function handleRemoveFile() {
    setAttachedFile(null);
  }

  async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URI prefix — backend builds the full URI itself
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || isFetching) {
      setErrorMsg("Still connecting — please try again in a moment.");
      setFormState("error");
      return;
    }
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("All fields are required.");
      setFormState("error");
      return;
    }
    setFormState("sending");
    setErrorMsg("");
    try {
      let attachmentBase64 = "";
      let attachmentMimeType = "";
      if (attachedFile) {
        attachmentBase64 = await readFileAsBase64(attachedFile);
        attachmentMimeType = attachedFile.type;
      }
      await (actor as backendInterface).helpRequest(
        name.trim(),
        email.trim(),
        subject,
        message.trim(),
        priority,
        attachmentBase64,
        attachmentMimeType,
      );
      setFormState("success");
      setTimeout(() => {
        handleClose();
      }, 3500);
    } catch (err) {
      console.error("HelpWidget submit error:", err);
      setErrorMsg("Failed to send — please try again.");
      setFormState("error");
    }
  }

  const isSending = formState === "sending";

  return (
    <>
      {/* Floating trigger button — bottom-left */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          zIndex: 9990,
        }}
      >
        <button
          type="button"
          data-ocid="help_widget.open_modal_button"
          aria-label="Open help"
          onClick={() => {
            if (open) {
              handleClose();
            } else {
              setOpen(true);
            }
          }}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: `1.5px solid ${open ? NEON : "rgba(57,255,20,0.35)"}`,
            backgroundColor: "rgba(10,10,10,0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 700,
            color: open ? NEON : "rgba(57,255,20,0.7)",
            lineHeight: 1,
            boxShadow: open ? NEON_GLOW : "0 2px 12px rgba(0,0,0,0.6)",
            transition:
              "border-color 0.2s, box-shadow 0.2s, color 0.2s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = NEON_GLOW;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = open
              ? NEON_GLOW
              : "0 2px 12px rgba(0,0,0,0.6)";
          }}
        >
          {open ? "✕" : "?"}
        </button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="help-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            data-ocid="help_widget.dialog"
            aria-modal="true"
            aria-label="Help & Support"
            style={{
              position: "fixed",
              bottom: "84px",
              left: "24px",
              width: "340px",
              maxWidth: "calc(100vw - 48px)",
              zIndex: 9990,
              backgroundColor: "rgba(10,10,10,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(57,255,20,0.25)",
              borderRadius: "16px",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(57,255,20,0.08), 0 0 40px rgba(57,255,20,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px 14px",
                borderBottom: "1px solid rgba(57,255,20,0.12)",
                background:
                  "linear-gradient(135deg, rgba(57,255,20,0.06) 0%, rgba(10,10,10,0) 60%)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: NEON_DIM,
                    border: "1px solid rgba(57,255,20,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  💬
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Get Help
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: "1px",
                    }}
                  >
                    We typically reply within a few hours
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "16px 20px 20px",
                overflowY: "auto",
                maxHeight: "calc(100vh - 200px)",
              }}
            >
              {formState === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  data-ocid="help_widget.success_state"
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                    ✅
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: NEON,
                      marginBottom: "6px",
                    }}
                  >
                    Message Sent!
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.5,
                    }}
                  >
                    We'll get back to you soon.
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Name field */}
                  <div style={{ marginBottom: "12px" }}>
                    <label htmlFor="hw-name" style={labelStyle}>
                      Name
                    </label>
                    <input
                      id="hw-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSending}
                      data-ocid="help_widget.input"
                      style={inputStyle}
                    />
                  </div>

                  {/* Email field */}
                  <div style={{ marginBottom: "12px" }}>
                    <label htmlFor="hw-email" style={labelStyle}>
                      Email
                    </label>
                    <input
                      id="hw-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSending}
                      data-ocid="help_widget.input"
                      style={inputStyle}
                    />
                  </div>

                  {/* Subject dropdown */}
                  <div style={{ marginBottom: "12px" }}>
                    <label htmlFor="hw-subject" style={labelStyle}>
                      Subject
                    </label>
                    <select
                      id="hw-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isSending}
                      data-ocid="help_widget.select"
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        WebkitAppearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(57,255,20,0.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "32px",
                        cursor: isSending ? "not-allowed" : "pointer",
                      }}
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ background: "#0a0a0a", color: "#ffffff" }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority selector */}
                  <div style={{ marginBottom: "12px" }}>
                    <span id="hw-priority-label" style={labelStyle}>
                      Priority
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      {PRIORITY_OPTIONS.map((p) => {
                        const isSelected = priority === p;
                        const isUrgent = p === "Urgent";
                        const color = isUrgent
                          ? "#ff4444"
                          : p === "Low"
                            ? "rgba(255,255,255,0.45)"
                            : NEON;
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={isSending}
                            data-ocid={`help_widget.priority_${p.toLowerCase()}`}
                            onClick={() => setPriority(p)}
                            style={{
                              flex: 1,
                              padding: "7px 4px",
                              borderRadius: "8px",
                              border: `1px solid ${
                                isSelected
                                  ? isUrgent
                                    ? "rgba(255,68,68,0.6)"
                                    : p === "Low"
                                      ? "rgba(255,255,255,0.3)"
                                      : "rgba(57,255,20,0.5)"
                                  : "rgba(255,255,255,0.1)"
                              }`,
                              background: isSelected
                                ? isUrgent
                                  ? "rgba(255,68,68,0.12)"
                                  : p === "Low"
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(57,255,20,0.1)"
                                : "rgba(255,255,255,0.03)",
                              color: isSelected
                                ? color
                                : "rgba(255,255,255,0.35)",
                              fontSize: "12px",
                              fontWeight: isSelected ? 700 : 500,
                              cursor: isSending ? "not-allowed" : "pointer",
                              transition: "all 0.15s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                          >
                            {isUrgent && isSelected && (
                              <span style={{ fontSize: "10px" }}>🔴</span>
                            )}
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    {priority === "Urgent" && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,68,68,0.8)",
                          marginTop: "6px",
                          marginBottom: 0,
                        }}
                      >
                        ⚠️ Urgent requests are escalated immediately.
                      </p>
                    )}
                  </div>

                  {/* Message field */}
                  <div style={{ marginBottom: "12px" }}>
                    <label htmlFor="hw-message" style={labelStyle}>
                      Message
                    </label>
                    <textarea
                      id="hw-message"
                      rows={3}
                      placeholder="How can we help?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSending}
                      data-ocid="help_widget.textarea"
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "72px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Attachment field */}
                  <div style={{ marginBottom: "16px" }}>
                    <label htmlFor="hw-file" style={labelStyle}>
                      Screenshot (optional)
                    </label>
                    {/* Hidden native file input */}
                    <input
                      ref={fileInputRef}
                      id="hw-file"
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={handleFileChange}
                      disabled={isSending}
                      data-ocid="help_widget.upload_button"
                      style={{ display: "none" }}
                    />
                    {attachedFile && previewUrl ? (
                      /* File selected — show thumbnail + filename + remove */
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "9px",
                          border: "1px solid rgba(57,255,20,0.25)",
                          background: "rgba(57,255,20,0.04)",
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt="preview"
                          style={{
                            height: "48px",
                            maxWidth: "64px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.65)",
                            wordBreak: "break-all",
                            lineHeight: 1.3,
                          }}
                        >
                          {attachedFile.name}
                        </span>
                        <button
                          type="button"
                          aria-label="Remove attachment"
                          onClick={handleRemoveFile}
                          disabled={isSending}
                          data-ocid="help_widget.delete_button"
                          style={{
                            flexShrink: 0,
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            border: "1px solid rgba(255,107,107,0.35)",
                            background: "rgba(255,107,107,0.08)",
                            color: "rgba(255,107,107,0.8)",
                            fontSize: "13px",
                            lineHeight: 1,
                            cursor: isSending ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      /* No file — show styled attach button */
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => fileInputRef.current?.click()}
                        data-ocid="help_widget.upload_button"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "9px",
                          border: "1px dashed rgba(57,255,20,0.25)",
                          background: "rgba(255,255,255,0.02)",
                          color: "rgba(255,255,255,0.35)",
                          fontSize: "12px",
                          cursor: isSending ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "border-color 0.2s, color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (isSending) return;
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(57,255,20,0.5)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(255,255,255,0.6)";
                        }}
                        onMouseLeave={(e) => {
                          if (isSending) return;
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(57,255,20,0.25)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(255,255,255,0.35)";
                        }}
                      >
                        📎 Attach Screenshot
                      </button>
                    )}
                  </div>

                  {/* Error message */}
                  {formState === "error" && errorMsg && (
                    <div
                      data-ocid="help_widget.error_state"
                      style={{
                        fontSize: "14px",
                        color: "#ff6b6b",
                        marginBottom: "12px",
                        padding: "8px 10px",
                        background: "rgba(255,107,107,0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,107,107,0.2)",
                      }}
                    >
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSending}
                    data-ocid="help_widget.submit_button"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      border: `1px solid ${
                        isSending
                          ? "rgba(57,255,20,0.2)"
                          : "rgba(57,255,20,0.5)"
                      }`,
                      background: isSending
                        ? "rgba(57,255,20,0.04)"
                        : "rgba(57,255,20,0.1)",
                      color: isSending ? "rgba(57,255,20,0.4)" : NEON,
                      fontSize: "13px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      cursor: isSending ? "not-allowed" : "pointer",
                      transition:
                        "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                      boxShadow: isSending
                        ? "none"
                        : "0 0 8px rgba(57,255,20,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      if (isSending) return;
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(57,255,20,0.18)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 0 16px rgba(57,255,20,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      if (isSending) return;
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(57,255,20,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 0 8px rgba(57,255,20,0.15)";
                    }}
                  >
                    {isSending ? (
                      <>
                        <span
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            border: "2px solid rgba(57,255,20,0.2)",
                            borderTopColor: "rgba(57,255,20,0.6)",
                            display: "inline-block",
                            animation: "hw-spin 0.7s linear infinite",
                          }}
                        />
                        Sending…
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner keyframe + input overrides */}
      <style>{`
        @keyframes hw-spin {
          to { transform: rotate(360deg); }
        }
        #hw-subject:focus,
        #hw-priority:focus {
          outline: none;
          border-color: rgba(57,255,20,0.5) !important;
          box-shadow: 0 0 0 2px rgba(57,255,20,0.1), 0 0 12px rgba(57,255,20,0.15) !important;
        }
        #hw-subject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #hw-name::placeholder,
        #hw-email::placeholder,
        #hw-message::placeholder {
          color: rgba(255,255,255,0.25) !important;
        }
        #hw-name:focus,
        #hw-email:focus,
        #hw-message:focus {
          outline: none;
          border-color: rgba(57,255,20,0.5) !important;
          box-shadow: 0 0 0 2px rgba(57,255,20,0.1), 0 0 12px rgba(57,255,20,0.15) !important;
        }
        #hw-name:disabled,
        #hw-email:disabled,
        #hw-message:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

export default HelpWidget;
