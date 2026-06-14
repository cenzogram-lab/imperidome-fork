import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

interface ClientMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  body: string;
  createdAt: bigint;
  isRead: boolean;
}

const POLL_INTERVAL_MS = 10_000;

function formatTs(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday)
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({
  toast,
  onDismiss,
}: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5_000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      data-ocid="messages.toast"
      style={{
        position: "fixed",
        bottom: "88px",
        right: "24px",
        zIndex: 9999,
        padding: "14px 20px",
        borderRadius: "10px",
        background:
          toast.type === "success"
            ? "rgba(5,46,22,0.97)"
            : "rgba(69,10,10,0.97)",
        border: `1px solid ${toast.type === "success" ? "rgba(94,240,138,0.4)" : "rgba(239,68,68,0.4)"}`,
        color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
        fontSize: "14px",
        fontWeight: 600,
        maxWidth: "360px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          opacity: 0.6,
          fontSize: "16px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function MessageBubble({
  msg,
  isSelf,
}: { msg: ClientMessage; isSelf: boolean }) {
  return (
    <div
      key={msg.id}
      data-ocid={`messages.bubble.${msg.id.slice(0, 8)}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isSelf ? "flex-end" : "flex-start",
        marginBottom: "16px",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "5px",
          flexDirection: isSelf ? "row-reverse" : "row",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#5EF08A",
            letterSpacing: "0.02em",
            fontFamily: "monospace",
          }}
        >
          {isSelf ? "You" : "Support Team"}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#4A4D63",
            fontFamily: "monospace",
          }}
        >
          {formatTs(msg.createdAt)}
        </span>
      </div>
      <div
        style={{
          maxWidth: "min(520px, 85%)",
          padding: "12px 16px",
          borderRadius: isSelf ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isSelf ? "rgba(7,8,16,0.8)" : "rgba(7,8,16,0.6)",
          border: isSelf
            ? "1px solid rgba(94,240,138,0.3)"
            : "1px solid rgba(94,240,138,0.1)",
          color: "#EEF0F8",
          fontSize: "15px",
          lineHeight: "1.6",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          boxShadow: isSelf ? "0 0 10px rgba(94,240,138,0.05)" : "none",
        }}
      >
        {msg.body}
      </div>
    </div>
  );
}

export default function PortalMessagesPage() {
  const { session } = useSession();
  const { actor, isFetching } = useActor();
  const clientEmail = session?.email ?? "";
  const clientName = session?.firstName ?? "";
  // adminEmail is fetched from env; no backend getAdminEmail() exists for portal clients
  const [adminEmail, setAdminEmail] = useState<string>(
    import.meta.env.VITE_ADMIN_EMAIL ?? "",
  );
  const [adminEmailLoading, setAdminEmailLoading] = useState(
    !import.meta.env.VITE_ADMIN_EMAIL,
  );
  const adminEmailMissing = !adminEmailLoading && !adminEmail;
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!adminEmail && !isFetching && actor) {
      setAdminEmailLoading(true);
      actor
        .getAdminContactEmail()
        .then((email: string) => {
          setAdminEmail(email);
          setAdminEmailLoading(false);
        })
        .catch(() => setAdminEmailLoading(false));
    }
  }, [isFetching, actor, adminEmail]);

  const loadMessages = useCallback(
    async (quiet = false) => {
      if (!adminEmail) {
        setLoading(false);
        return;
      }
      if (!actor || !clientEmail) {
        setLoading(false);
        setLoadError(true);
        return;
      }
      if (!quiet) setLoading(true);
      try {
        const result = (await (actor as backendInterface).getMessages(
          clientEmail,
          adminEmail,
        )) as ClientMessage[];
        setMessages(result ?? []);
        if (!quiet) setLoadError(false);
      } catch {
        if (!quiet) setLoadError(true);
      } finally {
        if (!quiet) setLoading(false);
      }
      // Mark as read in a separate try/catch so a failure here does not
      // replace successfully loaded messages with an error state
      try {
        await (actor as backendInterface).markMessagesRead(
          clientEmail,
          adminEmail,
        );
      } catch (err) {
        if (import.meta.env.DEV) console.warn("markMessagesRead failed:", err);
      }
    },
    [actor, clientEmail, adminEmail],
  );

  useEffect(() => {
    if (!actor || isFetching || !clientEmail || !adminEmail) return;
    loadMessages(false);
  }, [actor, isFetching, clientEmail, adminEmail, loadMessages]);
  useEffect(() => {
    if (!actor || isFetching || !clientEmail || !adminEmail) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadMessages(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [actor, isFetching, clientEmail, adminEmail, loadMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scroll whenever messages array changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending || !actor) return;
    if (!clientEmail) return;
    setSending(true);
    try {
      const result = (await (actor as backendInterface).sendMessage(
        clientEmail,
        adminEmail,
        trimmed,
      )) as { ok: ClientMessage } | { err: string };
      if ("ok" in result) {
        setBody("");
        setMessages((prev) => [...prev, result.ok]);
        textareaRef.current?.focus();
      } else {
        setToast({
          message: result.err ?? "Failed to send message. Please try again.",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
  const canSend = body.trim().length > 0 && !sending;
  const inputBarHeight = 80;

  return (
    <PortalLayout pageTitle="Messages">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .msg-textarea::placeholder { color: #4A4D63; }
        .msg-textarea:focus { border-color: rgba(94,240,138,0.5) !important; outline: none; box-shadow: 0 0 0 2px rgba(94,240,138,0.1); }
        .msg-send-btn:hover:not(:disabled) { background: rgba(94,240,138,0.95) !important; }
        .msg-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div
        data-ocid="messages.page"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 180px)",
          minHeight: "400px",
          position: "relative",
          maxWidth: "800px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {adminEmailMissing && (
          <div
            data-ocid="messages.admin-email-missing.error_state"
            style={{
              padding: "20px 24px",
              borderRadius: "10px",
              background: "rgba(69,10,10,0.3)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#FCA5A5",
              fontSize: "14px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            Messages are unavailable. Please contact support.
          </div>
        )}
        <div style={{ marginBottom: "16px", flexShrink: 0 }}>
          <h1 style={{ margin: "0 0 4px" }}>
            <TypewriterText
              text="Messages"
              className="matrix-heading"
              style={{ fontSize: "22px", fontWeight: 700 }}
              speed={45}
            />
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Chat directly with the Imperidome team.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: "12px",
            border: "1px solid rgba(94,240,138,0.2)",
            background: "rgba(7,8,16,0.9)",
            overflow: "hidden",
            minHeight: 0,
            boxShadow: "0 0 20px rgba(94,240,138,0.05)",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(94,240,138,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
              background: "rgba(7,8,16,0.8)",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(94,240,138,0.15)",
                border: "1px solid rgba(94,240,138,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: 800,
                color: "#5EF08A",
                fontFamily: "monospace",
              }}
            >
              ID
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                  fontFamily: "monospace",
                }}
              >
                Support Team
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#5EF08A",
                  fontFamily: "monospace",
                }}
              >
                {clientName ? `Chatting as ${clientName}` : "Support Thread"}
              </p>
            </div>
          </div>

          <div
            ref={containerRef}
            data-ocid="messages.thread"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 20px 8px",
              minHeight: 0,
            }}
          >
            {loading && (
              <div
                data-ocid="messages.loading_state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  paddingTop: "8px",
                }}
              >
                {["60%", "45%", "70%"].map((w) => (
                  <div
                    key={w}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        height: "12px",
                        width: "80px",
                        borderRadius: "6px",
                        background: "rgba(94,240,138,0.06)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        height: "48px",
                        width: w,
                        borderRadius: "12px",
                        background: "rgba(94,240,138,0.06)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {!loading && loadError && (
              <div
                data-ocid="messages.error_state"
                style={{
                  padding: "20px 24px",
                  borderRadius: "10px",
                  background: "rgba(69,10,10,0.3)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#FCA5A5",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                Unable to load messages. Please refresh the page and try again.
              </div>
            )}
            {!loading && !loadError && messages.length === 0 && (
              <div
                data-ocid="messages.empty_state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  gap: "12px",
                  color: "#7A7D90",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "rgba(94,240,138,0.08)",
                    border: "1px solid rgba(94,240,138,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "4px",
                  }}
                >
                  <Send size={20} color="#5EF08A" />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#B0B3C6",
                    fontFamily: "monospace",
                  }}
                >
                  No messages yet
                </p>
                <p style={{ margin: 0, fontSize: "13px", maxWidth: "280px" }}>
                  Start a conversation with your team below.
                </p>
              </div>
            )}
            {!loading &&
              !loadError &&
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isSelf={msg.senderEmail === clientEmail}
                />
              ))}
            <div ref={bottomRef} style={{ height: "1px" }} />
          </div>

          <div
            data-ocid="messages.compose_bar"
            style={{
              height: `${inputBarHeight}px`,
              flexShrink: 0,
              borderTop: "1px solid rgba(94,240,138,0.1)",
              background: "rgba(7,8,16,0.7)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 10px",
              boxSizing: "border-box",
            }}
          >
            <textarea
              ref={textareaRef}
              data-ocid="messages.textarea"
              className="msg-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={3}
              disabled={sending || loading}
              aria-label="Message input"
              style={{
                flex: 1,
                resize: "none",
                background: "rgba(94,240,138,0.04)",
                border: "1px solid rgba(94,240,138,0.15)",
                borderRadius: "10px",
                color: "#EEF0F8",
                fontSize: "14px",
                lineHeight: "1.5",
                padding: "10px 14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                height: "44px",
                overflowY: "auto",
                transition: "border-color 0.2s",
              }}
            />
            <button
              type="button"
              data-ocid="messages.send_button"
              className="msg-send-btn"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              style={{
                flexShrink: 0,
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: canSend
                  ? "rgba(94,240,138,0.9)"
                  : "rgba(94,240,138,0.08)",
                border: canSend ? "none" : "1px solid rgba(94,240,138,0.15)",
                cursor: canSend ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, opacity 0.2s",
              }}
            >
              {sending ? (
                <Loader2
                  size={18}
                  color={canSend ? "#061209" : "#5EF08A"}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              ) : (
                <Send size={18} color={canSend ? "#061209" : "#5EF08A"} />
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </PortalLayout>
  );
}
