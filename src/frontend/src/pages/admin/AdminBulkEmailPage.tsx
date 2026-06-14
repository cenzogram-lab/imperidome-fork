import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
  DragEvent as ReactDragEvent,
} from "react";
import { toast } from "sonner";
import type { backendInterface } from "../../backend.d";
import type { EmailCampaign } from "../../backend.d";
import type { CrmClient } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { ADMIN_EMAIL_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

// ─── Shared Styles ───────────────────────────────────────────────────────────
const DARK_CARD: CSSProperties = {
  background: "rgba(17,19,34,0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(94,240,138,0.2)",
  borderRadius: "10px",
  boxShadow: "0 0 12px rgba(94,240,138,0.06)",
};

const NEON = "#00FFA3";
const NEON_AMBER = "#FBBF24";
const TEXT = "#EEF0F8";
const MUTED = "#7A7D90";
const MATRIX_GREEN = "#5EF08A";
// ─── DualMediaField ─────────────────────────────────────────────────────────
function DualMediaField({
  label,
  value,
  onChange,
  accept = "image/*",
  disabled = false,
  inputId,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  disabled?: boolean;
  inputId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const blobStorage = (
        window as {
          __icpBlobStorage?: {
            ExternalBlob?: {
              fromBytes: (b: Uint8Array) => {
                getDirectURL: () => Promise<string>;
              };
            };
          };
        }
      ).__icpBlobStorage;
      if (!blobStorage?.ExternalBlob?.fromBytes) {
        throw new Error("Storage extension not loaded");
      }
      const blob = blobStorage.ExternalBlob.fromBytes(bytes);
      const url = await blob.getDirectURL();
      onChange(url);
    } catch {
      setUploadError("Upload failed — please paste a URL instead");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  function handleDragOver(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragEnter(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleDrop(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }

  if (value.trim()) {
    // Compact thumbnail preview mode
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={value.trim()}
            alt="Preview"
            style={{
              height: "56px",
              width: "auto",
              maxWidth: "120px",
              objectFit: "cover",
              borderRadius: "6px",
              border: "1px solid rgba(94,240,138,0.35)",
              display: "block",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(94,240,138,0.4)",
                background: "rgba(94,240,138,0.06)",
                color: MATRIX_GREEN,
                fontSize: "11px",
                fontWeight: 600,
                cursor: disabled || uploading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "transparent",
                color: "#f87171",
                fontSize: "11px",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Remove
            </button>
          </div>
          {uploading && (
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: "2px solid rgba(94,240,138,0.3)",
                borderTopColor: MATRIX_GREEN,
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <input
          id={inputId}
          type="url"
          placeholder="or paste a URL"
          value={value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          disabled={disabled}
          style={{
            width: "100%",
            background: "rgba(10,11,20,0.8)",
            border: "1px solid #1C1F33",
            borderRadius: "8px",
            color: TEXT,
            fontSize: "13px",
            padding: "8px 12px",
            outline: "none",
            boxSizing: "border-box" as const,
          }}
        />
        {uploadError && (
          <p style={{ color: "#f87171", fontSize: "11px", margin: 0 }}>
            {uploadError}
          </p>
        )}
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Drop zone mode (no image set)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          border: dragOver
            ? "2px dashed rgba(94,240,138,0.9)"
            : "2px dashed rgba(94,240,138,0.35)",
          borderRadius: "8px",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: disabled || uploading ? "not-allowed" : "pointer",
          background: dragOver
            ? "rgba(94,240,138,0.08)"
            : "rgba(94,240,138,0.02)",
          transition: "border-color 0.15s, background 0.15s",
          boxShadow: dragOver ? "0 0 10px rgba(94,240,138,0.15)" : "none",
          outline: "none",
          width: "100%",
          textAlign: "left" as const,
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1 }}>🖼</span>
        <span
          style={{
            color: dragOver ? MATRIX_GREEN : MUTED,
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "center",
            transition: "color 0.15s",
          }}
        >
          {uploading
            ? "Uploading…"
            : dragOver
              ? "Drop to upload"
              : "Drop image here or click to upload"}
        </span>
        {!uploading && (
          <span
            style={{
              color: MUTED,
              fontSize: "11px",
              background: "rgba(94,240,138,0.06)",
              border: "1px solid rgba(94,240,138,0.25)",
              borderRadius: "5px",
              padding: "3px 10px",
            }}
          >
            Upload {label}
          </span>
        )}
        {uploading && (
          <span
            style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid rgba(94,240,138,0.3)",
              borderTopColor: MATRIX_GREEN,
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        )}
      </button>
      <input
        id={inputId}
        type="url"
        placeholder="or paste a URL"
        value={value}
        onChange={(e) => {
          setUploadError(null);
          onChange(e.target.value);
        }}
        disabled={disabled}
        style={{
          width: "100%",
          background: "rgba(10,11,20,0.8)",
          border: "1px solid #1C1F33",
          borderRadius: "8px",
          color: TEXT,
          fontSize: "14px",
          padding: "10px 14px",
          outline: "none",
          boxSizing: "border-box" as const,
        }}
      />
      {uploadError && (
        <p style={{ color: "#f87171", fontSize: "11px", margin: 0 }}>
          {uploadError}
        </p>
      )}
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

type Segment = "all_clients" | "active_clients" | "subscriptions_only";

const SEGMENTS: { value: Segment; label: string; desc: string }[] = [
  {
    value: "all_clients",
    label: "All Clients",
    desc: "Every registered client account",
  },
  {
    value: "active_clients",
    label: "Active Clients",
    desc: "Clients with active projects",
  },
  {
    value: "subscriptions_only",
    label: "Subscriptions Only",
    desc: "Clients with active subscriptions",
  },
];

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
}

function inputStyle(focused: boolean): CSSProperties {
  return {
    width: "100%",
    background: "rgba(10,11,20,0.8)",
    border: focused ? "1px solid rgba(0,255,163,0.5)" : "1px solid #1C1F33",
    borderRadius: "8px",
    color: TEXT,
    fontSize: "14px",
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    resize: "none" as const,
  };
}

function dateTimeInputStyle(_focused: boolean): CSSProperties {
  return {
    width: "100%",
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(94,240,138,0.3)",
    borderRadius: "8px",
    color: "#EEF0F8",
    fontSize: "14px",
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "'Courier New', monospace",
  };
}

function formatNanoTs(nanoTs: bigint | null | undefined): string {
  if (nanoTs === 0n) return "—";
  if (!nanoTs) return "—";
  const ms = Number(nanoTs) / 1_000_000;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(ms));
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localDateTimeToNano(dateStr: string, timeStr: string): bigint {
  const ms = new Date(`${dateStr}T${timeStr}`).getTime();
  return BigInt(ms) * BigInt(1_000_000);
}

export default function AdminBulkEmailPage() {
  const { actor, isFetching } = useActor();

  const [segment, setSegment] = useState<Segment>("all_clients");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState("");
  const [videoLinkUrl, setVideoLinkUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [scheduleTime, setScheduleTime] = useState("09:00");

  const [editCampaignId, setEditCampaignId] = useState<bigint | null>(null);

  const [clients, setClients] = useState<CrmClient[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);

  const [rescheduleId, setRescheduleId] = useState<bigint | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayDateString());
  const [rescheduleTime, setRescheduleTime] = useState("09:00");
  const [rescheduleFocus, setRescheduleFocus] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelId, setCancelId] = useState<bigint | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ─── Draft persistence ─────────────────────────────────────────────────────
  // Save draft to localStorage whenever compose fields change
  useEffect(() => {
    const draft = { subject, body, imageUrl, videoThumbnailUrl, videoLinkUrl };
    localStorage.setItem("bulk_email_draft", JSON.stringify(draft));
  }, [subject, body, imageUrl, videoThumbnailUrl, videoLinkUrl]);

  // Restore draft from localStorage on mount (only when not editing a campaign)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editCampaignId !== null) return;
    const raw = localStorage.getItem("bulk_email_draft");
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as {
        subject?: string;
        body?: string;
        imageUrl?: string;
        videoThumbnailUrl?: string;
        videoLinkUrl?: string;
      };
      if (d.subject) setSubject(d.subject);
      if (d.body) setBody(d.body);
      if (d.imageUrl) setImageUrl(d.imageUrl);
      if (d.videoThumbnailUrl) setVideoThumbnailUrl(d.videoThumbnailUrl);
      if (d.videoLinkUrl) setVideoLinkUrl(d.videoLinkUrl);
    } catch {
      /* ignore malformed draft */
    }
  }, [editCampaignId]);

  const loadCampaigns = useCallback(() => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    if (!adminEmail) return;
    (actor as backendInterface)
      .getAllEmailCampaigns()
      .then((result) => {
        if ("ok" in result) setCampaigns(result.ok);
        setCampaignsLoaded(true);
      })
      .catch(() => setCampaignsLoaded(true));
  }, [actor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: isFetching is a session-hydration proxy — not used directly but triggers re-fetch after session loads
  useEffect(() => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    if (!adminEmail) return;
    actor
      .getClients()
      .then((c) => {
        setClients(c);
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));

    loadCampaigns();
    pollRef.current = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadCampaigns();
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [actor, isFetching, loadCampaigns]);

  function getRecipients(): Array<{
    email: string;
    name: string;
    clientId?: string;
  }> {
    if (segment === "active_clients") {
      return clients
        .filter(
          (c) =>
            c.projectStatus === "buildInProgress" ||
            Number(c.currentMilestone) > 0,
        )
        .map((c) => ({ email: c.email, name: c.name, clientId: c.id }));
    }
    if (segment === "subscriptions_only") {
      return clients
        .filter((c) => c.activeServices && c.activeServices.length > 0)
        .map((c) => ({ email: c.email, name: c.name, clientId: c.id }));
    }
    return clients.map((c) => ({
      email: c.email,
      name: c.name,
      clientId: c.id,
    }));
  }

  const recipients = dataLoaded ? getRecipients() : [];
  const selectedSegment = SEGMENTS.find((s) => s.value === segment)!;

  function resetCompose() {
    setSubject("");
    setBody("");
    setImageUrl("");
    setVideoThumbnailUrl("");
    setVideoLinkUrl("");
    setScheduleLater(false);
    setScheduleDate(getTodayDateString());
    setScheduleTime("09:00");
    setEditCampaignId(null);
    setPreviewVisible(false);
    localStorage.removeItem("bulk_email_draft");
  }

  async function handleSendTest() {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      toast.error("Session not ready. Please log in again.");
      return;
    }
    setSendingTest(true);
    const htmlBody = buildEmailBody(
      body.trim(),
      imageUrl,
      videoThumbnailUrl,
      videoLinkUrl,
    );
    try {
      const createResult = await (
        actor as backendInterface
      ).createEmailCampaign(
        subject.trim() || "(Test Email)",
        htmlBody,
        [adminEmail],
        null,
      );
      if (!("ok" in createResult)) {
        toast.error(
          `Failed to create test campaign: ${"err" in createResult ? createResult.err : "Unknown error"}`,
        );
        return;
      }
      const sendResult = await (actor as backendInterface).sendNowEmailCampaign(
        createResult.ok,
      );
      if (!("ok" in sendResult)) {
        toast.error(
          `Failed to send test email: ${"err" in sendResult ? sendResult.err : "Unknown error"}`,
        );
        return;
      }
      toast.success(`Test email sent to ${adminEmail}`);
    } catch {
      toast.error("Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendNow() {
    if (!actor) return;
    if (!subject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message body.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No recipients found for this segment.");
      return;
    }
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      toast.error("Session not ready. Please log in again.");
      return;
    }

    setSending(true);
    const recipientEmails = recipients.map((r) => r.email);
    const enrichedBody = buildEmailBody(
      body.trim(),
      imageUrl,
      videoThumbnailUrl,
      videoLinkUrl,
    );

    try {
      if (editCampaignId !== null) {
        const updateResult = await (
          actor as backendInterface
        ).updateEmailCampaign(
          editCampaignId,
          subject.trim(),
          enrichedBody,
          recipientEmails,
          null,
        );
        if (!("ok" in updateResult)) {
          toast.error(
            `Failed to update campaign: ${"err" in updateResult ? updateResult.err : "Unknown error"}`,
          );
          return;
        }
        const sendResult = await (
          actor as backendInterface
        ).sendNowEmailCampaign(editCampaignId);
        if (!("ok" in sendResult)) {
          toast.error(
            `Failed to send campaign: ${"err" in sendResult ? sendResult.err : "Unknown error"}`,
          );
          return;
        }
      } else {
        const createResult = await (
          actor as backendInterface
        ).createEmailCampaign(
          subject.trim(),
          enrichedBody,
          recipientEmails,
          null,
        );
        if (!("ok" in createResult)) {
          toast.error(
            `Failed to create campaign: ${"err" in createResult ? createResult.err : "Unknown error"}`,
          );
          return;
        }
        const sendResult = await (
          actor as backendInterface
        ).sendNowEmailCampaign(createResult.ok);
        if (!("ok" in sendResult)) {
          toast.error(
            `Failed to send campaign: ${"err" in sendResult ? sendResult.err : "Unknown error"}`,
          );
          return;
        }
      }
      toast.success(
        `Campaign sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}.`,
      );
      resetCompose();
      loadCampaigns();
    } catch {
      toast.error("Campaign failed to send. Check your email settings.");
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule() {
    if (!actor) return;
    if (!subject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message body.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No recipients found for this segment.");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select a date and time.");
      return;
    }
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      toast.error("Session not ready. Please log in again.");
      return;
    }

    const scheduledNano = localDateTimeToNano(scheduleDate, scheduleTime);
    const nowNano = BigInt(Date.now()) * BigInt(1_000_000);
    if (scheduledNano <= nowNano) {
      toast.error("Scheduled time must be in the future.");
      return;
    }

    setSending(true);
    const recipientEmails = recipients.map((r) => r.email);
    const enrichedBody = buildEmailBody(
      body.trim(),
      imageUrl,
      videoThumbnailUrl,
      videoLinkUrl,
    );

    try {
      if (editCampaignId !== null) {
        const updateResult = await (
          actor as backendInterface
        ).updateEmailCampaign(
          editCampaignId,
          subject.trim(),
          enrichedBody,
          recipientEmails,
          scheduledNano,
        );
        if ("err" in updateResult) {
          toast.error(updateResult.err);
          return;
        }
        toast.success(
          `Campaign updated and rescheduled for ${formatNanoTs(scheduledNano)}.`,
        );
      } else {
        const createResult = await (
          actor as backendInterface
        ).createEmailCampaign(
          subject.trim(),
          enrichedBody,
          recipientEmails,
          scheduledNano,
        );
        if ("err" in createResult) {
          toast.error(createResult.err);
          return;
        }
        toast.success(`Campaign scheduled for ${formatNanoTs(scheduledNano)}.`);
      }
      resetCompose();
      loadCampaigns();
    } catch {
      toast.error("Failed to schedule campaign. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleEditCampaign(c: EmailCampaign) {
    setEditCampaignId(c.id);
    setSubject(c.subject);
    setBody(c.body);
    // Extract image/video URLs from the stored HTML body
    const imgMatch = c.body.match(
      /<img[^>]+src="([^"]+)"[^>]*style="max-width:600px/,
    );
    const extractedImageUrl = imgMatch ? imgMatch[1] : "";
    const thumbMatch = c.body.match(
      /<a href="([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]*style="max-width:560px/,
    );
    const extractedVideoLink = thumbMatch ? thumbMatch[1] : "";
    const extractedVideoThumb = thumbMatch ? thumbMatch[2] : "";
    setImageUrl(extractedImageUrl);
    setVideoThumbnailUrl(extractedVideoThumb);
    setVideoLinkUrl(extractedVideoLink);
    setPreviewVisible(false);
    if (c.scheduledDate !== 0n) {
      const ms = Number(c.scheduledDate) / 1_000_000;
      const dt = new Date(ms);
      const y = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      const h = String(dt.getHours()).padStart(2, "0");
      const mi = String(dt.getMinutes()).padStart(2, "0");
      setScheduleDate(`${y}-${mo}-${d}`);
      setScheduleTime(`${h}:${mi}`);
      setScheduleLater(true);
    } else {
      setScheduleLater(false);
      setScheduleDate(getTodayDateString());
      setScheduleTime("09:00");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReschedule() {
    if (!actor || rescheduleId === null) return;
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Select a date and time.");
      return;
    }
    const _adminEmail = getAdminEmail();
    if (!_adminEmail) {
      toast.error("Session not ready. Please log in again.");
      return;
    }
    const scheduledNano = localDateTimeToNano(rescheduleDate, rescheduleTime);
    const nowNano = BigInt(Date.now()) * BigInt(1_000_000);
    if (scheduledNano <= nowNano) {
      toast.error("Scheduled time must be in the future.");
      return;
    }
    setRescheduling(true);
    try {
      await (actor as backendInterface).rescheduleEmailCampaign(
        rescheduleId,
        scheduledNano,
      );
      toast.success(`Rescheduled to ${formatNanoTs(scheduledNano)}.`);
      setRescheduleId(null);
      loadCampaigns();
    } catch {
      toast.error("Failed to reschedule. Please try again.");
    } finally {
      setRescheduling(false);
    }
  }

  async function handleCancelCampaign() {
    if (!actor || cancelId === null) return;
    const _adminEmail = getAdminEmail();
    if (!_adminEmail) {
      toast.error("Session not ready. Please log in again.");
      return;
    }
    setCancelling(true);
    try {
      await (actor as backendInterface).cancelEmailCampaign(cancelId);
      toast.success("Campaign cancelled.");
      setCancelId(null);
      loadCampaigns();
    } catch {
      toast.error("Failed to cancel campaign.");
    } finally {
      setCancelling(false);
    }
  }

  const scheduledCampaigns = campaigns
    .filter(
      (c) =>
        Object.keys(
          c.status as unknown as Record<string, unknown>,
        )[0]?.toLowerCase() === "scheduled",
    )
    .sort((a, b) => {
      const aTs = a.scheduledDate ?? 0n;
      const bTs = b.scheduledDate ?? 0n;
      return aTs < bTs ? -1 : aTs > bTs ? 1 : 0;
    });

  const draftCampaigns = campaigns
    .filter(
      (c) =>
        Object.keys(
          c.status as unknown as Record<string, unknown>,
        )[0]?.toLowerCase() === "draft",
    )
    .sort((a, b) =>
      b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
    );

  const sendingCampaigns = campaigns
    .filter(
      (c) =>
        Object.keys(
          c.status as unknown as Record<string, unknown>,
        )[0]?.toLowerCase() === "sending",
    )
    .sort((a, b) =>
      b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
    );

  const pastCampaigns = campaigns
    .filter((c) => {
      const statusKey = Object.keys(
        c.status as unknown as Record<string, unknown>,
      )[0]?.toLowerCase();
      return statusKey === "sent" || statusKey === "failed";
    })
    .sort((a, b) => {
      const aTs = a.sentAt ?? a.scheduledDate ?? a.createdAt;
      const bTs = b.sentAt ?? b.scheduledDate ?? b.createdAt;
      return bTs > aTs ? 1 : bTs < aTs ? -1 : 0;
    });

  const labelStyle: CSSProperties = {
    display: "block",
    color: "#5EF08A",
    fontFamily: "'Courier New', monospace",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "6px",
    letterSpacing: "0.1em",
  };

  return (
    <AdminLayout pageTitle="Bulk Email">
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <div>
          <h2
            style={{
              color: TEXT,
              fontWeight: 800,
              fontSize: "22px",
              margin: 0,
            }}
          >
            <TypewriterText
              className="matrix-heading"
              text={
                editCampaignId !== null
                  ? "Edit Campaign"
                  : "Bulk Email Campaign"
              }
            />
          </h2>
          <p style={{ color: MUTED, fontSize: "13px", margin: "6px 0 0" }}>
            {editCampaignId !== null
              ? "Update content or change the schedule."
              : "Send announcements, promotions, or updates to your clients."}
          </p>
          {editCampaignId !== null && (
            <button
              type="button"
              onClick={resetCompose}
              style={{
                marginTop: "10px",
                background: "none",
                border: "1px solid #1C1F33",
                color: MUTED,
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ← Cancel Edit
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          {/* Left: Compose */}
          <div
            style={{
              ...DARK_CARD,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <h3
              style={{
                color: TEXT,
                fontSize: "15px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Compose Message
            </h3>

            <div>
              <label
                htmlFor="bulk-segment"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Recipient Segment
              </label>
              <select
                id="bulk-segment"
                data-ocid="bulk_email.segment.select"
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                style={{
                  ...inputStyle(focusedField === "segment"),
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
                onFocus={() => setFocusedField("segment")}
                onBlur={() => setFocusedField(null)}
              >
                {SEGMENTS.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    style={{ background: "#0A0B14" }}
                  >
                    {s.label}
                  </option>
                ))}
              </select>
              <p style={{ color: MUTED, fontSize: "11px", marginTop: "6px" }}>
                {selectedSegment.desc} ·{" "}
                {dataLoaded
                  ? `${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`
                  : "Loading..."}
              </p>
            </div>

            <div>
              <label
                htmlFor="bulk-subject"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Subject Line
              </label>
              <input
                id="bulk-subject"
                data-ocid="bulk_email.subject.input"
                type="text"
                placeholder="e.g. Important update from Imperidome"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setFocusedField("subject")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "subject")}
                maxLength={150}
              />
              <p
                style={{
                  color: MUTED,
                  fontSize: "11px",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {subject.length}/150
              </p>
            </div>

            {/* Image field */}
            <div data-ocid="bulk_email.image_url.input">
              <label
                htmlFor="bulk-image-url"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Image{" "}
                <span
                  style={{
                    color: MUTED,
                    fontWeight: 400,
                    textTransform: "none",
                  }}
                >
                  (optional)
                </span>
              </label>
              <DualMediaField
                label="Image"
                value={imageUrl}
                onChange={setImageUrl}
                accept="image/*"
                disabled={sending}
                inputId="bulk-image-url"
              />
            </div>

            {/* Video Block fields */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #1C1F33",
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <p
                style={{
                  color: MUTED,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}
              >
                Video Block{" "}
                <span style={{ fontWeight: 400, textTransform: "none" }}>
                  (optional)
                </span>
              </p>
              <div data-ocid="bulk_email.video_thumbnail_url.input">
                <label
                  htmlFor="bulk-video-thumbnail-url"
                  style={{
                    display: "block",
                    color: MUTED,
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Video Thumbnail URL
                </label>
                <DualMediaField
                  label="Video Thumbnail"
                  value={videoThumbnailUrl}
                  onChange={setVideoThumbnailUrl}
                  accept="image/*"
                  disabled={sending}
                  inputId="bulk-video-thumbnail-url"
                />
              </div>
              <div>
                <label
                  htmlFor="bulk-video-link"
                  style={{
                    display: "block",
                    color: MUTED,
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Video Link URL
                </label>
                <input
                  id="bulk-video-link"
                  data-ocid="bulk_email.video_link_url.input"
                  type="url"
                  placeholder="https://youtu.be/..."
                  value={videoLinkUrl}
                  onChange={(e) => setVideoLinkUrl(e.target.value)}
                  onFocus={() => setFocusedField("videoLink")}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle(focusedField === "videoLink")}
                />
              </div>
              <p style={{ color: MUTED, fontSize: "11px", margin: 0 }}>
                Both fields must be filled to include the video block.
              </p>
            </div>

            <div>
              <label
                htmlFor="bulk-body"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Message Body
              </label>
              <textarea
                id="bulk-body"
                data-ocid="bulk_email.body.textarea"
                rows={10}
                placeholder="Write your announcement, update, or promotion here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setFocusedField("body")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle(focusedField === "body"),
                  resize: "vertical",
                  minHeight: "200px",
                }}
              />
              <p style={{ color: MUTED, fontSize: "11px", marginTop: "4px" }}>
                Plain text. An unsubscribe link will be automatically appended.
              </p>
            </div>

            {/* Schedule for Later */}
            <div
              style={{
                background: scheduleLater
                  ? "rgba(94,240,138,0.1)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${scheduleLater ? "rgba(94,240,138,0.3)" : "#1C1F33"}`,

                borderRadius: "8px",
                padding: "14px 16px",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      color: TEXT,
                      fontSize: "13px",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Schedule for Later
                  </p>
                  <p
                    style={{
                      color: MUTED,
                      fontSize: "11px",
                      margin: "2px 0 0",
                    }}
                  >
                    {scheduleLater
                      ? "Choose a date and time below"
                      : "Toggle on to pick a send date"}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="bulk_email.schedule_toggle"
                  onClick={() => setScheduleLater(!scheduleLater)}
                  aria-label={
                    scheduleLater
                      ? "Disable schedule for later"
                      : "Enable schedule for later"
                  }
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    border: "none",
                    background: scheduleLater ? MATRIX_GREEN : "#2a2d40",
                    position: "relative",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: scheduleLater ? "22px" : "3px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.18s",
                      display: "block",
                    }}
                  />
                </button>
              </div>
              {scheduleLater && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label htmlFor="schedule-date" style={labelStyle}>
                      Send Date
                    </label>
                    <input
                      id="schedule-date"
                      data-ocid="bulk_email.schedule_date.input"
                      type="date"
                      min={getTodayDateString()}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      onFocus={() => setFocusedField("schedDate")}
                      onBlur={() => setFocusedField(null)}
                      style={dateTimeInputStyle(focusedField === "schedDate")}
                    />
                  </div>
                  <div>
                    <label htmlFor="schedule-time" style={labelStyle}>
                      Send Time{" "}
                      <span style={{ color: MUTED, fontWeight: 400 }}>
                        (your timezone)
                      </span>
                    </label>
                    <input
                      id="schedule-time"
                      data-ocid="bulk_email.schedule_time.input"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      onFocus={() => setFocusedField("schedTime")}
                      onBlur={() => setFocusedField(null)}
                      style={dateTimeInputStyle(focusedField === "schedTime")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                data-ocid="bulk_email.preview.button"
                onClick={() => setPreviewVisible(!previewVisible)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                  background: "transparent",
                  color: MUTED,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(0,255,163,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = NEON;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#1C1F33";
                  (e.currentTarget as HTMLButtonElement).style.color = MUTED;
                }}
              >
                {previewVisible ? "Hide Preview" : "Preview Email"}
              </button>

              <button
                type="button"
                data-ocid="bulk_email.send_test.button"
                onClick={handleSendTest}
                disabled={sendingTest || !subject.trim() || !body.trim()}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "1px solid rgba(251,191,36,0.35)",
                  background: sendingTest
                    ? "rgba(251,191,36,0.08)"
                    : "rgba(251,191,36,0.06)",
                  color: sendingTest ? MUTED : NEON_AMBER,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor:
                    sendingTest || !subject.trim() || !body.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: !subject.trim() || !body.trim() ? 0.5 : 1,
                  transition: "opacity 0.15s, border-color 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                }}
              >
                {sendingTest ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                        fontSize: "14px",
                      }}
                    >
                      ⟳
                    </span>{" "}
                    Sending…
                  </>
                ) : (
                  "Send Test Email"
                )}
              </button>

              {!scheduleLater && (
                <button
                  type="button"
                  data-ocid="bulk_email.send.primary_button"
                  onClick={handleSendNow}
                  disabled={
                    sending ||
                    !subject.trim() ||
                    !body.trim() ||
                    recipients.length === 0
                  }
                  style={{
                    flex: 2,
                    padding: "10px 0",
                    borderRadius: "8px",
                    border: "none",
                    background: sending ? "rgba(0,255,163,0.3)" : "#00FFA3",
                    color: "#0A0B14",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity:
                      !subject.trim() || !body.trim() || recipients.length === 0
                        ? 0.5
                        : 1,
                    transition: "opacity 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {sending ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          animation: "spin 1s linear infinite",
                          fontSize: "14px",
                        }}
                      >
                        ⟳
                      </span>{" "}
                      Sending…
                    </>
                  ) : (
                    `Send to ${recipients.length} Recipient${recipients.length !== 1 ? "s" : ""}`
                  )}
                </button>
              )}

              {scheduleLater && (
                <button
                  type="button"
                  data-ocid="bulk_email.schedule.primary_button"
                  onClick={handleSchedule}
                  disabled={
                    sending ||
                    !subject.trim() ||
                    !body.trim() ||
                    recipients.length === 0
                  }
                  style={{
                    flex: 2,
                    padding: "10px 0",
                    borderRadius: "8px",
                    border: "none",
                    background: sending ? "rgba(94,240,138,0.4)" : MATRIX_GREEN,
                    color: "#0A0B14",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity:
                      !subject.trim() || !body.trim() || recipients.length === 0
                        ? 0.5
                        : 1,
                    transition: "opacity 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {sending ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          animation: "spin 1s linear infinite",
                          fontSize: "14px",
                        }}
                      >
                        ⟳
                      </span>{" "}
                      Scheduling…
                    </>
                  ) : editCampaignId !== null ? (
                    "Save Schedule"
                  ) : (
                    "Schedule Campaign"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right: Preview + Recipients */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              data-ocid="bulk_email.recipients.panel"
              style={{ ...DARK_CARD, padding: "20px", flex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <h4
                  style={{
                    color: MUTED,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Recipients
                </h4>
                <span
                  style={{
                    background:
                      recipients.length > 0
                        ? "rgba(0,255,163,0.1)"
                        : "rgba(122,125,144,0.1)",
                    color: recipients.length > 0 ? NEON : MUTED,
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {dataLoaded ? recipients.length : "…"} total
                </span>
              </div>
              {!dataLoaded ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      style={{
                        height: "36px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "6px",
                      }}
                    />
                  ))}
                </div>
              ) : recipients.length === 0 ? (
                <div
                  data-ocid="bulk_email.recipients.empty_state"
                  style={{ padding: "32px 0", textAlign: "center" }}
                >
                  <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
                    No recipients in this segment.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  {recipients.slice(0, 50).map((r, idx) => (
                    <div
                      key={r.email}
                      data-ocid={`bulk_email.recipient.item.${idx + 1}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "rgba(0,255,163,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: NEON,
                          flexShrink: 0,
                        }}
                      >
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            color: TEXT,
                            fontSize: "12px",
                            fontWeight: 600,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name}
                        </p>
                        <p
                          style={{
                            color: MUTED,
                            fontSize: "11px",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recipients.length > 50 && (
                    <p
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                        textAlign: "center",
                        padding: "8px 0",
                        margin: 0,
                      }}
                    >
                      +{recipients.length - 50} more recipients
                    </p>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{ color: NEON_AMBER, fontSize: "14px", flexShrink: 0 }}
              >
                ⚠
              </span>
              <p
                style={{
                  color: MUTED,
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {scheduleLater
                  ? "This campaign will be sent automatically at the scheduled time. An unsubscribe link is included."
                  : "This will send an email to all selected recipients immediately. An unsubscribe link is automatically included per CAN-SPAM compliance."}
              </p>
            </div>
          </div>
        </div>

        {/* Draft Campaigns — only shown when drafts exist */}
        {campaignsLoaded && draftCampaigns.length > 0 && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <h3
                style={{
                  color: TEXT,
                  fontWeight: 700,
                  fontSize: "16px",
                  margin: "0 0 4px",
                }}
              >
                <TypewriterText
                  className="matrix-heading"
                  text="Draft Campaigns"
                />
              </h3>
              <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
                Campaigns saved but not yet scheduled or sent.
              </p>
            </div>
            <div style={{ ...DARK_CARD, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {["Subject", "Recipients", "Created", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              color: MUTED,
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              textAlign: h === "Recipients" ? "right" : "left",
                              padding: "12px 16px",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {draftCampaigns.map((c, idx) => (
                      <tr
                        key={String(c.id)}
                        data-ocid={`bulk_email.draft.item.${idx + 1}`}
                        style={{ borderBottom: "1px solid rgba(28,31,51,0.6)" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: TEXT,
                            fontSize: "13px",
                            fontWeight: 600,
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.subject}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "13px",
                            textAlign: "right",
                          }}
                        >
                          {c.recipients.length}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNanoTs(c.createdAt)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              data-ocid={`bulk_email.draft.edit_button.${idx + 1}`}
                              onClick={() => handleEditCampaign(c)}
                              style={actionBtnStyle("edit")}
                            >
                              Edit
                            </button>
                            <span
                              style={{
                                background: "rgba(122,125,144,0.12)",
                                color: MUTED,
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: "20px",
                                border: "1px solid rgba(122,125,144,0.25)",
                              }}
                            >
                              Draft
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* In Progress (Sending) Campaigns — only shown when any exist */}
        {campaignsLoaded && sendingCampaigns.length > 0 && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <h3
                style={{
                  color: TEXT,
                  fontWeight: 700,
                  fontSize: "16px",
                  margin: "0 0 4px",
                }}
              >
                <TypewriterText className="matrix-heading" text="In Progress" />
              </h3>
              <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
                Campaigns currently being dispatched to recipients.
              </p>
            </div>
            <div style={{ ...DARK_CARD, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {["Subject", "Recipients", "Started", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              color: MUTED,
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              textAlign: h === "Recipients" ? "right" : "left",
                              padding: "12px 16px",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sendingCampaigns.map((c, idx) => (
                      <tr
                        key={String(c.id)}
                        data-ocid={`bulk_email.sending.item.${idx + 1}`}
                        style={{ borderBottom: "1px solid rgba(28,31,51,0.6)" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: TEXT,
                            fontSize: "13px",
                            fontWeight: 600,
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.subject}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "13px",
                            textAlign: "right",
                          }}
                        >
                          {c.recipients.length}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNanoTs(c.createdAt)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              background: "rgba(251,191,36,0.12)",
                              color: NEON_AMBER,
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "20px",
                              border: "1px solid rgba(251,191,36,0.3)",
                            }}
                          >
                            Sending…
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Scheduled Campaigns */}
        <div>
          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                color: TEXT,
                fontWeight: 700,
                fontSize: "16px",
                margin: "0 0 4px",
              }}
            >
              <TypewriterText
                className="matrix-heading"
                text="Upcoming Scheduled Campaigns"
              />
            </h3>
            <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
              Campaigns queued for automatic delivery, sorted soonest first.
            </p>
          </div>
          <div style={{ ...DARK_CARD, overflow: "hidden" }}>
            {!campaignsLoaded ? (
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[1, 2].map((k) => (
                  <div
                    key={k}
                    style={{
                      height: "48px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            ) : scheduledCampaigns.length === 0 ? (
              <div
                data-ocid="bulk_email.scheduled.empty_state"
                style={{ padding: "40px 20px", textAlign: "center" }}
              >
                <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
                  No scheduled campaigns. Use the composer above to schedule
                  one.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {[
                        "Subject",
                        "Recipients",
                        "Scheduled For",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            color: MUTED,
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            textAlign: h === "Recipients" ? "right" : "left",
                            padding: "12px 16px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledCampaigns.map((c, idx) => (
                      <tr
                        key={String(c.id)}
                        data-ocid={`bulk_email.scheduled.item.${idx + 1}`}
                        style={{ borderBottom: "1px solid rgba(28,31,51,0.6)" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: TEXT,
                            fontSize: "13px",
                            fontWeight: 600,
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.subject}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "13px",
                            textAlign: "right",
                          }}
                        >
                          {c.recipients.length}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: NEON,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNanoTs(c.scheduledDate)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              data-ocid={`bulk_email.edit_button.${idx + 1}`}
                              onClick={() => handleEditCampaign(c)}
                              style={actionBtnStyle("edit")}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              data-ocid={`bulk_email.reschedule_button.${idx + 1}`}
                              onClick={() => {
                                setRescheduleId(c.id);
                                setRescheduleDate(getTodayDateString());
                                setRescheduleTime("09:00");
                              }}
                              style={actionBtnStyle("reschedule")}
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              data-ocid={`bulk_email.cancel_button.${idx + 1}`}
                              onClick={() => setCancelId(c.id)}
                              style={actionBtnStyle("cancel")}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Past Sent Campaigns */}
        <div>
          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                color: TEXT,
                fontWeight: 700,
                fontSize: "16px",
                margin: "0 0 4px",
              }}
            >
              <TypewriterText
                className="matrix-heading"
                text="Past Sent Campaigns"
              />
            </h3>
            <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
              All delivered and failed campaigns, most recent first.
            </p>
          </div>
          <div style={{ ...DARK_CARD, overflow: "hidden" }}>
            {!campaignsLoaded ? (
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[1, 2, 3].map((k) => (
                  <div
                    key={k}
                    style={{
                      height: "48px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            ) : pastCampaigns.length === 0 ? (
              <div
                data-ocid="bulk_email.past.empty_state"
                style={{ padding: "40px 20px", textAlign: "center" }}
              >
                <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
                  No campaigns have been sent yet.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {["Subject", "Recipients", "Sent At", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              color: MUTED,
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              textAlign: h === "Recipients" ? "right" : "left",
                              padding: "12px 16px",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pastCampaigns.map((c, idx) => (
                      <tr
                        key={String(c.id)}
                        data-ocid={`bulk_email.past.item.${idx + 1}`}
                        style={{ borderBottom: "1px solid rgba(28,31,51,0.6)" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: TEXT,
                            fontSize: "13px",
                            fontWeight: 600,
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.subject}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "13px",
                            textAlign: "right",
                          }}
                        >
                          {c.recipients.length}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: MUTED,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.sentAt
                            ? formatNanoTs(c.sentAt)
                            : c.scheduledDate
                              ? formatNanoTs(c.scheduledDate)
                              : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              background:
                                Object.keys(
                                  c.status as unknown as Record<
                                    string,
                                    unknown
                                  >,
                                )[0]?.toLowerCase() === "sent"
                                  ? "rgba(0,255,163,0.12)"
                                  : "rgba(239,68,68,0.12)",
                              color:
                                Object.keys(
                                  c.status as unknown as Record<
                                    string,
                                    unknown
                                  >,
                                )[0]?.toLowerCase() === "sent"
                                  ? NEON
                                  : "#f87171",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "20px",
                              border: `1px solid ${
                                Object.keys(
                                  c.status as unknown as Record<
                                    string,
                                    unknown
                                  >,
                                )[0]?.toLowerCase() === "sent"
                                  ? "rgba(0,255,163,0.25)"
                                  : "rgba(239,68,68,0.25)"
                              }`,
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewVisible && (
        <div
          data-ocid="bulk_email.preview.dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewVisible(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewVisible(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "10px",
              border: "1px solid rgba(94,240,138,0.4)",
              background: "rgba(13,15,26,0.98)",
              boxShadow: "0 0 40px rgba(94,240,138,0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(94,240,138,0.15)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: MATRIX_GREEN,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Email Preview
              </span>
              <button
                type="button"
                data-ocid="bulk_email.preview.close_button"
                onClick={() => setPreviewVisible(false)}
                aria-label="Close preview"
                style={{
                  background: "none",
                  border: "1px solid #1C1F33",
                  borderRadius: "6px",
                  color: MUTED,
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "4px 10px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            {/* Modal body — email client simulation */}
            <div style={{ padding: "20px", overflowY: "auto" }}>
              <div
                style={{
                  background: "#ffffff",
                  maxWidth: "600px",
                  margin: "0 auto",
                  borderRadius: "6px",
                  padding: "24px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {/* From / Subject meta */}
                <div
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "11px",
                      margin: "0 0 4px",
                    }}
                  >
                    From: Imperidome &lt;hello@imperidome.com&gt;
                  </p>
                  <p
                    style={{
                      color: "#111827",
                      fontSize: "14px",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {subject || (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                        No subject yet…
                      </span>
                    )}
                  </p>
                </div>
                {/* Header image */}
                {imageUrl.trim() && (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <img
                      src={imageUrl.trim()}
                      alt="Header"
                      style={{
                        maxWidth: "100%",
                        width: "100%",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}
                {/* Body text */}
                <div
                  style={{
                    color: "#1f2937",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {body || (
                    <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                      No message body yet…
                    </span>
                  )}
                </div>
                {/* Video block */}
                {videoThumbnailUrl.trim() && videoLinkUrl.trim() && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      paddingTop: "16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <a
                      href={videoLinkUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        textDecoration: "none",
                      }}
                    >
                      <img
                        src={videoThumbnailUrl.trim()}
                        alt="Watch Video"
                        style={{
                          maxWidth: "100%",
                          width: "100%",
                          height: "auto",
                          display: "block",
                          margin: "0 auto",
                          borderRadius: "4px",
                        }}
                      />
                    </a>
                    <p
                      style={{
                        color: "#00a85a",
                        fontSize: "13px",
                        margin: "8px 0 0",
                        fontWeight: 600,
                      }}
                    >
                      &#9654; Watch Video
                    </p>
                  </div>
                )}
                {/* Footer */}
                <div
                  style={{
                    marginTop: "28px",
                    paddingTop: "14px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "11px",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    You received this email as a client of Imperidome.{" "}
                    <span style={{ textDecoration: "underline" }}>
                      Unsubscribe
                    </span>{" "}
                    · Imperidome · www.imperidome.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleId !== null && (
        <div
          data-ocid="bulk_email.reschedule.dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRescheduleId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setRescheduleId(null);
          }}
        >
          <div
            style={{
              ...DARK_CARD,
              padding: "28px",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h3
              style={{
                color: TEXT,
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 6px",
              }}
            >
              Reschedule Campaign
            </h3>
            <p style={{ color: MUTED, fontSize: "12px", margin: "0 0 20px" }}>
              Choose a new send date and time. Campaign content will not change.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label htmlFor="rs-date" style={labelStyle}>
                  New Send Date
                </label>
                <input
                  id="rs-date"
                  data-ocid="bulk_email.reschedule_date.input"
                  type="date"
                  min={getTodayDateString()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  onFocus={() => setRescheduleFocus("date")}
                  onBlur={() => setRescheduleFocus(null)}
                  style={dateTimeInputStyle(rescheduleFocus === "date")}
                />
              </div>
              <div>
                <label htmlFor="rs-time" style={labelStyle}>
                  New Send Time{" "}
                  <span style={{ color: MUTED, fontWeight: 400 }}>
                    (your timezone)
                  </span>
                </label>
                <input
                  id="rs-time"
                  data-ocid="bulk_email.reschedule_time.input"
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  onFocus={() => setRescheduleFocus("time")}
                  onBlur={() => setRescheduleFocus(null)}
                  style={dateTimeInputStyle(rescheduleFocus === "time")}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                data-ocid="bulk_email.reschedule.cancel_button"
                onClick={() => setRescheduleId(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                  background: "transparent",
                  color: MUTED,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="bulk_email.reschedule.confirm_button"
                onClick={handleReschedule}
                disabled={rescheduling}
                style={{
                  flex: 2,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "none",
                  background: "#5EF08A",
                  color: "#3a1a1a",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: rescheduling ? "not-allowed" : "pointer",
                  opacity: rescheduling ? 0.6 : 1,
                }}
              >
                {rescheduling ? "Saving…" : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {cancelId !== null && (
        <div
          data-ocid="bulk_email.cancel.dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setCancelId(null);
          }}
        >
          <div
            style={{
              ...DARK_CARD,
              padding: "28px",
              width: "100%",
              maxWidth: "380px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📅</div>
            <h3
              style={{
                color: TEXT,
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 10px",
              }}
            >
              Cancel this scheduled campaign?
            </h3>
            <p
              style={{
                color: MUTED,
                fontSize: "13px",
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              The campaign will be removed from the scheduled queue. No emails
              will be sent.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                data-ocid="bulk_email.cancel.cancel_button"
                onClick={() => setCancelId(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                  background: "transparent",
                  color: MUTED,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Keep It
              </button>
              <button
                type="button"
                data-ocid="bulk_email.cancel.confirm_button"
                onClick={handleCancelCampaign}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(239,68,68,0.85)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="date"], input[type="time"] { color-scheme: light; }
      `}</style>
    </AdminLayout>
  );
}

/**
 * Builds the body string passed to the backend, embedding optional image
 * and video blocks as HTML snippets before and after the plain-text body.
 * The backend wraps this in the branded HTML wrapper so snippets render inline.
 */
function buildEmailBody(
  plainBody: string,
  imgUrl: string,
  videoThumb: string,
  videoLink: string,
): string {
  const parts: string[] = [];

  if (imgUrl.trim()) {
    parts.push(
      `<div style="text-align:center;margin:0 0 20px;"><img src="${imgUrl.trim()}" alt="" style="max-width:600px;width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" /></div>`,
    );
  }

  if (plainBody) {
    // Convert plain-text body to basic HTML paragraphs so line breaks survive
    const htmlBody = plainBody
      .split("\n")
      .map((line) =>
        line.trim() === ""
          ? "<br/>"
          : `<p style="margin:0 0 12px;">${line}</p>`,
      )
      .join("\n");
    parts.push(htmlBody);
  }

  if (videoThumb.trim() && videoLink.trim()) {
    parts.push(
      `<div style="text-align:center;margin:24px 0 0;"><a href="${videoLink.trim()}" target="_blank" rel="noopener noreferrer"><img src="${videoThumb.trim()}" alt="Watch video" style="max-width:560px;width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" /></a><p style="color:#00e87d;font-size:13px;margin:8px 0 0;font-weight:600;">&#9654; Watch Video</p></div>`,
    );
  }

  return parts.join("\n");
}

function actionBtnStyle(type: "edit" | "reschedule" | "cancel"): CSSProperties {
  const colors: Record<
    typeof type,
    { bg: string; color: string; border: string }
  > = {
    edit: {
      bg: "rgba(0,255,163,0.07)",
      color: NEON,
      border: "rgba(0,255,163,0.25)",
    },
    reschedule: {
      bg: "rgba(232,160,160,0.07)",
      color: "#5EF08A",
      border: "rgba(232,160,160,0.25)",
    },
    cancel: {
      bg: "rgba(239,68,68,0.07)",
      color: "#f87171",
      border: "rgba(239,68,68,0.25)",
    },
  };
  const c = colors[type];
  return {
    padding: "5px 12px",
    borderRadius: "6px",
    border: `1px solid ${c.border}`,
    background: c.bg,
    color: c.color,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
