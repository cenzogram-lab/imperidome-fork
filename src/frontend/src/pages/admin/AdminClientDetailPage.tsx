import { useParams, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../../backend.d";
import type { Questionnaire, SiteLinkEntry, Status } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";

// Inline types for admin client data (returned by getAdminAllClients)
interface ClientProfile {
  principal: any;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  createdAt: bigint;
}

interface ClientSummary {
  profile: ClientProfile;
  subscriptionPlanName: string | null;
  latestOrderStatus: Status | null;
  // CRM fields returned by getAdminAllClients (may be present depending on backend version)
  currentMilestone?: bigint | number | null;
  completionPaymentCharged?: boolean;
  activeServices?: string[];
  notes?: string;
}

type UserProfile = ClientProfile;

interface InvoiceRecord {
  id: bigint;
  invoice_number: string;
  description: string;
  amount: number;
  due_date: bigint;
  status: string;
  paid_at?: bigint;
  stripe_payment_intent_id: string;
  order_id?: bigint;
  client_id: any;
  created_at: bigint;
  updated_at: bigint;
}

import AdminLayout from "./AdminLayout";

type StatusKey =
  | "questionnairePending"
  | "questionnaireComplete"
  | "depositSent"
  | "depositReceived"
  | "buildInProgress"
  | "draftReady"
  | "revisionsInProgress"
  | "launching"
  | "live"
  | "paused"
  | "cancelled";

const STATUS_LABELS: Record<StatusKey, string> = {
  questionnairePending: "QUESTIONNAIRE PENDING",
  questionnaireComplete: "QUESTIONNAIRE COMPLETE",
  depositSent: "DEPOSIT SENT",
  depositReceived: "DEPOSIT RECEIVED",
  buildInProgress: "BUILD IN PROGRESS",
  draftReady: "DRAFT READY",
  revisionsInProgress: "REVISIONS IN PROGRESS",
  launching: "LAUNCHING",
  live: "LIVE",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

const STATUS_COLORS: Record<StatusKey, { bg: string; text: string }> = {
  questionnairePending: { bg: "rgba(250,204,21,0.15)", text: "#fbbf24" },
  questionnaireComplete: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  depositSent: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
  depositReceived: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
  buildInProgress: { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc" },
  draftReady: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  revisionsInProgress: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  launching: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf" },
  live: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
  paused: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
  cancelled: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

const STATUS_FILL_COLORS: Record<StatusKey, string> = {
  questionnairePending: "#EAB308",
  questionnaireComplete: "#3B82F6",
  depositSent: "#F97316",
  depositReceived: "#86EFAC",
  buildInProgress: "#3B82C4",
  draftReady: "#A855F7",
  revisionsInProgress: "#F59E0B",
  launching: "#0F766E",
  live: "#166534",
  paused: "#6B7280",
  cancelled: "#991B1B",
};

const STATUS_PROGRESS: Record<StatusKey, number> = {
  questionnairePending: 10,
  questionnaireComplete: 20,
  depositSent: 25,
  depositReceived: 30,
  buildInProgress: 50,
  draftReady: 70,
  revisionsInProgress: 80,
  launching: 90,
  live: 100,
  paused: 0,
  cancelled: 100,
};

const EMAIL_TRIGGER_STATUSES: StatusKey[] = [
  "depositSent",
  "depositReceived",
  "draftReady",
  "revisionsInProgress",
  "launching",
  "live",
];

const ALL_STATUS_KEYS: StatusKey[] = [
  "questionnairePending",
  "questionnaireComplete",
  "depositSent",
  "depositReceived",
  "buildInProgress",
  "draftReady",
  "revisionsInProgress",
  "launching",
  "live",
  "paused",
  "cancelled",
];

const BUSINESS_TYPE_OPTIONS = [
  "Not sure yet",
  "Speedy Site",
  "Tier 1 \u2014 Digital Presence",
  "Tier 2 \u2014 Authority Site",
  "Tier 3A \u2014 Booking Pro",
  "Tier 3B \u2014 Restaurant Pro",
  "Tier 4A \u2014 Digital Storefront",
  "Tier 4B \u2014 Restaurant Empire",
  "Tier 4C \u2014 Membership Engine",
  "Tier 5 \u2014 Enterprise Scale",
];

interface Order {
  id: bigint;
  status: Status;
  updated_at: bigint;
  delivery_window: string;
  created_at: bigint;
  launch_target: string;
  client_id: any;
  tier_code: string;
}

function getStatusKey(status: Status): StatusKey {
  return Object.keys(status)[0] as StatusKey;
}

function makeStatus(key: StatusKey): Status {
  return { [key]: null } as unknown as Status;
}

function StatusBadge({ status }: { status: Status }) {
  const key = getStatusKey(status);
  const label = STATUS_LABELS[key] ?? key;
  const colors = STATUS_COLORS[key] ?? { bg: "#F1F5F9", text: "#475569" };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatReviewedAt(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function parseAnswers(
  answers: string,
): Array<{ label: string; value: string }> {
  try {
    const parsed = JSON.parse(answers);
    if (Array.isArray(parsed)) return parsed;
    return Object.entries(parsed).map(([k, v]) => ({
      label: k,
      value: String(v),
    }));
  } catch {
    if (!answers || answers === "{}") return [];
    return [{ label: "Response", value: answers }];
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #1C1F33",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  color: "#EEF0F8",
  background: "rgba(19,21,36,1)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#7A7D90",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function ProjectProgressBar({ statusKey }: { statusKey: StatusKey }) {
  const pct = STATUS_PROGRESS[statusKey] ?? 0;
  const fill = STATUS_FILL_COLORS[statusKey] ?? "#94A3B8";
  return (
    <div
      data-ocid="client_detail.timeline.progress_bar"
      style={{
        height: 8,
        borderRadius: 4,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: fill,
          borderRadius: 4,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

export default function AdminClientDetailPage() {
  const { clientId } = useParams({ strict: false }) as { clientId: string };
  const router = useRouter();
  const { actor } = useActor();

  function getAdminEmail(): string {
    const s = getSession();
    return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
  }

  const [client, setClient] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
  const saveErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    businessName: "",
    businessType: "",
  });

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null,
  );
  const [questionnaireLoading, setQuestionnaireLoading] = useState(true);
  const [reviewingQuestionnaire, setReviewingQuestionnaire] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewErrorDetail, setReviewErrorDetail] = useState<string | null>(
    null,
  );
  const reviewErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: "",
    description: "",
    dueDate: "",
  });
  const [depositSending, setDepositSending] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const [completionPaymentLoading, setCompletionPaymentLoading] =
    useState(false);
  const [completionPaymentError, setCompletionPaymentError] = useState<
    string | null
  >(null);

  // ── Send Invoice (ad-hoc Stripe checkout) ────────────────────────────────
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    description: "",
    amount: "",
  });
  const [invoiceSending, setInvoiceSending] = useState(false);

  // ── Send Site Link ────────────────────────────────────────────────────────
  const [showSiteLinkModal, setShowSiteLinkModal] = useState(false);
  const [siteLinkUrl, setSiteLinkUrl] = useState("");
  const [siteLinkSending, setSiteLinkSending] = useState(false);
  const [siteLinkError, setSiteLinkError] = useState<string | null>(null);
  const [siteLinkSuccess, setSiteLinkSuccess] = useState(false);
  const [siteLinkLog, setSiteLinkLog] = useState<SiteLinkEntry[]>([]);
  const [siteLinkLogLoading, setSiteLinkLogLoading] = useState(true);
  const [resendingUrl, setResendingUrl] = useState<string | null>(null);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesAutoSaving, setNotesAutoSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Messages ──────────────────────────────────────────────────────────────
  interface ClientMessage {
    id: string;
    senderEmail: string;
    senderName: string;
    receiverEmail: string;
    body: string;
    createdAt: bigint;
    isRead: boolean;
  }
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);
  const messagesPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── File Delivery ─────────────────────────────────────────────────────────
  interface ClientFileMetadata {
    id: string;
    clientEmail: string;
    fileName: string;
    fileLabel: string;
    uploaderEmail: string;
    uploadedAt: bigint;
    objectKey: string;
  }
  const [clientFiles, setClientFiles] = useState<ClientFileMetadata[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileUploadFile, setFileUploadFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Purchase Requests ─────────────────────────────────────────────────────
  interface PurchaseRequest {
    id: string;
    clientEmail: string;
    productId: string;
    productName: string;
    amount: number;
    frequency: string;
    status: string; // "pending" | "approved" | "declined"
    createdAt: bigint;
    checkoutUrl?: string;
    declineReason?: string;
  }
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [purchaseRequestsLoading, setPurchaseRequestsLoading] = useState(false);
  const [purchaseRequestsOpen, setPurchaseRequestsOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReasonMap, setDeclineReasonMap] = useState<
    Record<string, string>
  >({});
  const [declinePendingId, setDeclinePendingId] = useState<string | null>(null);

  async function loadPurchaseRequests() {
    if (!actor || !client) return;
    setPurchaseRequestsLoading(true);
    try {
      const all: PurchaseRequest[] = (await (
        actor as backendInterface
      ).getPurchaseRequests(adminEmail)) as unknown as PurchaseRequest[];
      const forClient = all.filter(
        (r) => r.clientEmail === client.profile.email,
      );
      const sorted = [...forClient].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
      setPurchaseRequests(sorted);
    } catch {
      setPurchaseRequests([]);
    } finally {
      setPurchaseRequestsLoading(false);
    }
  }

  async function handleApprovePurchaseRequest(requestId: string) {
    if (!actor) return;
    setApprovingId(requestId);
    try {
      const result = await (actor as backendInterface).approvePurchaseRequest(
        adminEmail,
        requestId as unknown as bigint,
        `${window.location.origin}/portal/requests`,
        `${window.location.origin}/portal/requests`,
      );
      if (result && "err" in result) {
        toast.error(String(result.err));
      } else {
        toast.success("Request approved — invoice sent");
        await loadPurchaseRequests();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve request.",
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDeclinePurchaseRequest(requestId: string) {
    if (!actor) return;
    const reason = declineReasonMap[requestId] ?? "";
    setDecliningId(requestId);
    try {
      const result = await (actor as backendInterface).declinePurchaseRequest(
        adminEmail,
        requestId as unknown as bigint,
        reason,
      );
      if (result && "err" in result) {
        toast.error(String(result.err));
      } else {
        toast.success("Request declined");
        setDeclinePendingId(null);
        setDeclineReasonMap((prev) => {
          const n = { ...prev };
          delete n[requestId];
          return n;
        });
        await loadPurchaseRequests();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to decline request.",
      );
    } finally {
      setDecliningId(null);
    }
  }

  // Load purchase requests when section is opened
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (purchaseRequestsOpen && actor && client) {
      loadPurchaseRequests();
    }
  }, [purchaseRequestsOpen, actor, client?.profile.email]);

  // Derive the Messages section
  const adminEmail = getAdminEmail();
  const isAdmin = adminEmail === "vincenzo@imperidome.com";

  useEffect(() => {
    if (!actor) return;
    setLoading(true);
    setOrdersLoading(true);
    setQuestionnaireLoading(true);
    setInvoicesLoading(true);

    (actor as backendInterface)
      .getAdminAllClients(adminEmail)
      .then((clients: unknown[]) => {
        const typedClients = clients as ClientSummary[];
        const match = typedClients.find(
          (c) => c.profile.principal.toString() === clientId,
        );
        if (match) {
          setClient(match);
          // Initialize notes textarea from fetched client record
          setNotesValue(match.notes ?? "");
          // Fetch orders
          (actor as backendInterface)
            .getClientOrders(match.profile.principal)
            .then((fetchedOrders: Order[]) => {
              const sorted = [...fetchedOrders].sort(
                (a, b) => Number(b.created_at) - Number(a.created_at),
              );
              setOrders(sorted);
            })
            .catch(() => setOrders([]))
            .finally(() => setOrdersLoading(false));
          // Fetch questionnaire
          (actor as backendInterface)
            .getQuestionnaireByClientId(match.profile.principal)
            .then((q: Questionnaire | null) => setQuestionnaire(q))
            .catch(() => setQuestionnaire(null))
            .finally(() => setQuestionnaireLoading(false));
          // Fetch invoices (subscription + ad-hoc merged)
          Promise.all([
            (actor as backendInterface).getClientInvoices(
              match.profile.principal,
            ),
            (actor as backendInterface).getAdHocClientInvoices(
              adminEmail,
              match.profile.email,
            ),
          ])
            .then(([subscriptionInvoices, adHocInvoices]) => {
              const allInvoices = [
                ...(subscriptionInvoices as any[]),
                ...(adHocInvoices as any[]),
              ];
              const sorted = allInvoices.sort(
                (a, b) =>
                  Number(b.createdAt ?? b.created_at ?? 0) -
                  Number(a.createdAt ?? a.created_at ?? 0),
              );
              setInvoices(sorted);
            })
            .catch(() => setInvoices([]))
            .finally(() => setInvoicesLoading(false));
          // Fetch site link log
          setSiteLinkLogLoading(true);
          (actor as backendInterface)
            .getSiteLinkLog(adminEmail, clientId)
            .then((result: { ok: SiteLinkEntry[] } | { err: string }) => {
              if ("ok" in result) {
                const sorted = [...result.ok].sort(
                  (a, b) => Number(b.sentAt) - Number(a.sentAt),
                );
                setSiteLinkLog(sorted);
              } else {
                setSiteLinkLog([]);
              }
            })
            .catch(() => setSiteLinkLog([]))
            .finally(() => setSiteLinkLogLoading(false));
        } else {
          setError("Client not found.");
          setOrdersLoading(false);
          setQuestionnaireLoading(false);
          setInvoicesLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load client.");
        setOrdersLoading(false);
        setQuestionnaireLoading(false);
        setInvoicesLoading(false);
      })
      .finally(() => setLoading(false));
  }, [actor, clientId, adminEmail]);

  function startEdit() {
    if (!client) return;
    const p = client.profile;
    setEditForm({
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      businessName: p.businessName,
      businessType: p.businessType,
    });
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!actor || !client) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Call adminUpdateClientProfile to persist profile edits to the backend.
      // Cast as any because the binding may not yet be in the generated backend.d.ts.
      const result = await (actor as backendInterface).adminUpdateClientProfile(
        adminEmail,
        clientId,
        editForm.firstName,
        editForm.lastName,
        editForm.phone,
        editForm.businessName,
        editForm.businessType,
      );
      if (result && "err" in result) {
        throw new Error(String(result.err));
      }
      // Only update local state on confirmed ok response
      const updatedProfile: UserProfile = {
        ...client.profile,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        businessName: editForm.businessName,
        businessType: editForm.businessType,
      };
      setClient((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
      setEditing(false);
      toast.success("Client profile updated");
    } catch (err) {
      const detail = err instanceof Error ? err.message : null;
      setSaveError("Save Failed — please try again");
      setSaveErrorDetail(detail || null);
      toast.error("Failed to save client profile");
      if (saveErrorTimerRef.current) clearTimeout(saveErrorTimerRef.current);
      saveErrorTimerRef.current = setTimeout(() => {
        setSaveError(null);
        setSaveErrorDetail(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkReviewed() {
    if (!actor || !questionnaire) return;
    setReviewingQuestionnaire(true);
    try {
      await (actor as backendInterface).markQuestionnaireReviewed(
        adminEmail,
        questionnaire.id,
      );
      const nowNs = BigInt(Date.now()) * BigInt(1_000_000);
      setQuestionnaire((prev) =>
        prev ? { ...prev, reviewed: true, reviewed_at: nowNs } : prev,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : null;
      setReviewError("Save Failed — please try again");
      setReviewErrorDetail(detail || null);
      if (reviewErrorTimerRef.current)
        clearTimeout(reviewErrorTimerRef.current);
      reviewErrorTimerRef.current = setTimeout(() => {
        setReviewError(null);
        setReviewErrorDetail(null);
      }, 5000);
    } finally {
      setReviewingQuestionnaire(false);
    }
  }

  function openDepositModal() {
    const tierName = activeOrder?.tier_code || "";
    const desc = tierName ? `50% deposit — ${tierName}` : "50% deposit";
    setDepositForm({ amount: "", description: desc, dueDate: "" });
    setDepositError(null);
    setDepositSuccess(false);
    setShowDepositModal(true);
  }

  async function handleSendDepositInvoice() {
    if (!actor || !client) return;
    const amountDollars = Number.parseFloat(depositForm.amount);
    if (!amountDollars || amountDollars <= 0) {
      setDepositError("Please enter a valid amount.");
      return;
    }
    if (!depositForm.dueDate) {
      setDepositError("Please select a due date.");
      return;
    }
    const amountCents = Math.round(amountDollars * 100);
    const dueDateTs =
      BigInt(new Date(depositForm.dueDate).getTime()) * BigInt(1_000_000);
    setDepositSending(true);
    setDepositError(null);
    try {
      await (actor as backendInterface).sendDepositInvoice(
        client.profile.principal,
        client.profile.email,
        BigInt(amountCents),
        depositForm.description || "50% deposit",
        dueDateTs,
      );
      setDepositSuccess(true);
      // Refresh invoices (subscription + ad-hoc merged)
      const [subscriptionInvoices, adHocInvoices] = await Promise.all([
        (actor as backendInterface).getClientInvoices(client.profile.principal),
        (actor as backendInterface).getAdHocClientInvoices(
          adminEmail,
          client.profile.email,
        ),
      ]);
      const allInvoices = [
        ...(subscriptionInvoices as any[]),
        ...(adHocInvoices as any[]),
      ];
      const sortedInv = allInvoices.sort(
        (a: any, b: any) =>
          Number(b.createdAt ?? b.created_at ?? 0) -
          Number(a.createdAt ?? a.created_at ?? 0),
      );
      setInvoices(sortedInv);
      // Refresh orders
      const refreshedOrders = await (actor as backendInterface).getClientOrders(
        client.profile.principal,
      );
      const sortedOrders = [...refreshedOrders].sort(
        (a: Order, b: Order) => Number(b.created_at) - Number(a.created_at),
      );
      setOrders(sortedOrders);
      setTimeout(() => {
        setShowDepositModal(false);
        setDepositSuccess(false);
        setDepositForm({ amount: "", description: "", dueDate: "" });
      }, 1500);
    } catch {
      setDepositError("Failed to send invoice. Please try again.");
    } finally {
      setDepositSending(false);
    }
  }

  // ── Completion Payment ────────────────────────────────────────────────────

  // Custom Sites product names (case-insensitive match)
  const CUSTOM_SITE_NAMES = [
    "digital presence",
    "authority site",
    "booking pro",
    "restaurant pro",
    "restaurant empire",
    "digital storefront",
    "membership engine",
    "enterprise scale",
  ];

  function isCustomSitesClient(): boolean {
    const services = client?.activeServices ?? [];
    return services.some((s) => {
      const lower = s.toLowerCase();
      return (
        lower.includes("custom site") ||
        CUSTOM_SITE_NAMES.some((name) => lower.includes(name))
      );
    });
  }

  function getMilestoneNumber(): number {
    const m = client?.currentMilestone;
    if (m === null || m === undefined) return 0;
    return typeof m === "bigint" ? Number(m) : Number(m);
  }

  const showCompletionPaymentButton =
    isCustomSitesClient() &&
    [3, 4, 5].includes(getMilestoneNumber()) &&
    !(client?.completionPaymentCharged === true);

  async function handleChargeCompletionPayment() {
    if (!actor || !client) return;
    setCompletionPaymentLoading(true);
    setCompletionPaymentError(null);
    try {
      const adminEmail = getAdminEmail();
      const result: string = await (
        actor as backendInterface
      ).createCompletionPaymentSession(
        clientId,
        adminEmail,
        `${window.location.origin}/order-confirmation`,
        window.location.href,
      );
      if (result.startsWith("Error:")) {
        setCompletionPaymentError(result.replace(/^Error:\s*/, ""));
      } else {
        window.location.href = result;
      }
    } catch (err) {
      setCompletionPaymentError(
        err instanceof Error
          ? err.message
          : "Failed to create completion payment session. Please try again.",
      );
    } finally {
      setCompletionPaymentLoading(false);
    }
  }

  // ── Send Invoice (ad-hoc Stripe checkout) handler ────────────────────────

  function openSendInvoiceModal() {
    setInvoiceForm({ description: "", amount: "" });
    setShowSendInvoiceModal(true);
  }

  async function handleSendInvoice() {
    if (!actor || !client) return;
    const amountFloat = Number.parseFloat(invoiceForm.amount);
    if (!invoiceForm.description.trim()) {
      toast.error("Please enter a description.");
      return;
    }
    if (Number.isNaN(amountFloat) || amountFloat < 0.5) {
      toast.error("Please enter a valid amount (minimum $0.50).");
      return;
    }
    const amountCents = Math.round(amountFloat * 100);
    setInvoiceSending(true);
    try {
      const result = await (
        actor as backendInterface
      ).createAdHocInvoiceSession(
        clientId,
        adminEmail,
        invoiceForm.description.trim(),
        BigInt(amountCents),
        `${window.location.origin}/order-confirmation`,
        `${window.location.origin}/admin/clients/${clientId}`,
      );
      if (result && "err" in result) {
        toast.error(String(result.err));
      } else {
        setShowSendInvoiceModal(false);
        setInvoiceForm({ description: "", amount: "" });
        toast.success("Invoice sent successfully");
        // Refresh invoices list (subscription + ad-hoc merged)
        const [subscriptionInvoices, adHocInvoices] = await Promise.all([
          (actor as backendInterface).getClientInvoices(
            client.profile.principal,
          ),
          (actor as backendInterface).getAdHocClientInvoices(
            adminEmail,
            client.profile.email,
          ),
        ]);
        const allInvoices = [
          ...(subscriptionInvoices as any[]),
          ...(adHocInvoices as any[]),
        ];
        const sorted = allInvoices.sort(
          (a: any, b: any) =>
            Number(b.createdAt ?? b.created_at ?? 0) -
            Number(a.createdAt ?? a.created_at ?? 0),
        );
        setInvoices(sorted);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send invoice.";
      toast.error(msg);
    } finally {
      setInvoiceSending(false);
    }
  }

  // ── Send Site Link handler ────────────────────────────────────────────────

  async function refreshSiteLinkLog() {
    if (!actor) return;
    try {
      const result = await (actor as backendInterface).getSiteLinkLog(
        adminEmail,
        clientId,
      );
      if ("ok" in result) {
        const sorted = [...(result.ok as SiteLinkEntry[])].sort(
          (a, b) => Number(b.sentAt) - Number(a.sentAt),
        );
        setSiteLinkLog(sorted);
      }
    } catch {
      // silently ignore refresh errors
    }
  }

  async function handleSendSiteLink() {
    if (!actor || !client) return;
    if (!siteLinkUrl.trim()) {
      setSiteLinkError("Please enter a URL.");
      return;
    }
    if (!siteLinkUrl.trim().startsWith("https://")) {
      setSiteLinkError("URL must start with https://");
      return;
    }
    setSiteLinkSending(true);
    setSiteLinkError(null);
    try {
      const result = await (actor as backendInterface).sendSiteLink(
        adminEmail,
        clientId,
        siteLinkUrl.trim(),
      );
      if (result && "err" in result) {
        setSiteLinkError(String(result.err));
        setSiteLinkSending(false);
      } else {
        toast.success("Site link sent to client!");
        setSiteLinkSuccess(true);
        setShowSiteLinkModal(false);
        setSiteLinkUrl("");
        setSiteLinkError(null);
        setSiteLinkSending(false);
        await refreshSiteLinkLog();
      }
    } catch (err) {
      setSiteLinkError(
        err instanceof Error
          ? err.message
          : "Failed to send site link. Please try again.",
      );
      setSiteLinkSending(false);
    }
  }

  async function handleResendSiteLink(url: string) {
    if (!actor) return;
    setResendingUrl(url);
    try {
      const result = await (actor as backendInterface).resendSiteLink(
        adminEmail,
        clientId,
        url,
      );
      if (result && "err" in result) {
        toast.error(String(result.err));
      } else {
        toast.success("Site link resent successfully");
        await refreshSiteLinkLog();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend site link.",
      );
    } finally {
      setResendingUrl(null);
    }
  }

  // ── Notes handlers ────────────────────────────────────────────────────────

  function handleNotesChange(value: string) {
    setNotesValue(value);
    setNotesError(null);

    // Clear any pending debounce
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);

    // Schedule auto-save in 800ms
    notesDebounceRef.current = setTimeout(() => {
      performNotesSave(value, /* silent */ true);
    }, 800);
  }

  async function performNotesSave(notes: string, silent: boolean) {
    if (!actor) return;
    if (silent) setNotesAutoSaving(true);
    else setNotesSaving(true);
    setNotesError(null);
    try {
      const result = await (actor as backendInterface).updateClientNotes(
        clientId,
        notes,
        adminEmail,
      );
      if (result && "err" in result) {
        throw new Error(String(result.err));
      }
      if (!silent) {
        toast.success("Notes saved");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save notes.";
      setNotesError(msg);
      if (silent) {
        toast.error("Notes auto-save failed. Please try again.");
      } else {
        toast.error("Failed to save notes");
      }
    } finally {
      if (silent) setNotesAutoSaving(false);
      else setNotesSaving(false);
    }
  }

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    };
  }, []);

  // ── File Delivery handlers ────────────────────────────────────────────────

  async function loadClientFiles() {
    if (!actor || !client) return;
    setFilesLoading(true);
    try {
      const files = await (actor as backendInterface).getFilesForClient(
        adminEmail,
        client.profile.email,
      );
      const sorted = [...(files as ClientFileMetadata[])].sort(
        (a, b) => Number(b.uploadedAt) - Number(a.uploadedAt),
      );
      setClientFiles(sorted);
    } catch {
      setClientFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }

  // Load files once client data is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (actor && client) {
      loadClientFiles();
    }
  }, [actor, client?.profile.email]);

  // ── Messages helpers ─────────────────────────────────────────────────────

  const loadMessages = useCallback(async () => {
    if (!actor || !client) return;
    try {
      const msgs = await (actor as backendInterface).getMessages(
        "vincenzo@imperidome.com",
        client.profile.email,
      );
      setMessages((msgs as ClientMessage[]) ?? []);
    } catch {
      // silently ignore poll errors
    }
  }, [actor, client]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor || !client) return;
    setMessagesLoading(true);
    // Load initial thread + mark read
    Promise.all([
      (actor as backendInterface).getMessages(
        "vincenzo@imperidome.com",
        client.profile.email,
      ),
      (actor as backendInterface).markMessagesRead(
        "vincenzo@imperidome.com",
        client.profile.email,
      ),
    ])
      .then(([msgs]) => {
        setMessages((msgs as ClientMessage[]) ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));

    // Start 10-second poll
    if (messagesPollRef.current) clearInterval(messagesPollRef.current);
    messagesPollRef.current = setInterval(() => {
      loadMessages();
    }, 10_000);

    return () => {
      if (messagesPollRef.current) {
        clearInterval(messagesPollRef.current);
        messagesPollRef.current = null;
      }
    };
  }, [actor, client?.profile.email]);

  // Auto-scroll to bottom when messages update
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (messagesBottomRef.current) {
      messagesBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSendReply() {
    if (!actor || !client) return;
    const body = replyBody.trim();
    if (!body) return;
    setReplySending(true);
    try {
      const result = await (actor as backendInterface).sendMessage(
        "vincenzo@imperidome.com",
        client.profile.email,
        body,
      );
      if (result && "err" in result) {
        toast.error(String(result.err));
      } else {
        setReplyBody("");
        await loadMessages();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message.",
      );
    } finally {
      setReplySending(false);
    }
  }

  async function handleFileUpload() {
    if (!actor || !client) return;
    if (!fileUploadFile) {
      setFileError("Please select a file to upload.");
      return;
    }
    setFileUploading(true);
    setFileError(null);
    try {
      const arrayBuffer = await fileUploadFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const result = await (actor as backendInterface).uploadFileToClient(
        adminEmail,
        client.profile.email,
        uint8,
        fileUploadFile.name,
        fileLabel.trim(),
      );
      if (result && "err" in result) {
        throw new Error(String(result.err));
      }
      toast.success(`"${fileUploadFile.name}" uploaded successfully`);
      setFileUploadFile(null);
      setFileLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadClientFiles();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setFileError(msg);
      toast.error(msg);
    } finally {
      setFileUploading(false);
    }
  }

  async function handleDeleteFile(fileId: string, fileName: string) {
    if (!actor) return;
    setDeletingFileId(fileId);
    try {
      const result = await (actor as backendInterface).deleteClientFile(
        adminEmail,
        fileId,
      );
      if (result && "err" in result) {
        throw new Error(String(result.err));
      }
      toast.success(`"${fileName}" deleted`);
      setClientFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete file.",
      );
    } finally {
      setDeletingFileId(null);
      setDeleteConfirmId(null);
    }
  }

  async function handleDownloadFile(fileId: string, fileName: string) {
    if (!actor) return;
    try {
      const result = await (actor as backendInterface).getClientFileUrl(
        adminEmail,
        fileId,
      );
      if (!result || "err" in result) {
        toast.error(result?.err ?? "Could not get download link.");
        return;
      }
      const url = result.ok;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = fileName;
      a.click();
    } catch {
      toast.error("Failed to get download link.");
    }
  }

  function downloadInvoicePdf(inv: InvoiceRecord) {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const amountStr =
      typeof inv.amount === "number"
        ? inv.amount.toFixed(2)
        : Number(inv.amount).toFixed(2);
    const dueDateStr = new Date(
      Number(inv.due_date) / 1_000_000,
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const paidDateStr = inv.paid_at
      ? new Date(Number(inv.paid_at) / 1_000_000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${esc(inv.invoice_number)}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1B2D4F}.header{background:#1B2D4F;color:#fff;padding:28px 32px;border-radius:8px 8px 0 0;margin-bottom:0}.wordmark{font-size:26px;font-weight:900;letter-spacing:2px;margin:0}.tagline{font-size:12px;margin:4px 0 0 0;opacity:0.7}.body{background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none}.row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}.label{color:#6b7280}.value{font-weight:600;color:#1B2D4F}.divider{border:none;border-top:2px solid #e2e8f0;margin:20px 0}.total-row{display:flex;justify-content:space-between;font-size:18px;font-weight:900;color:#1B2D4F;margin-top:8px}.footer{font-size:11px;color:#9ca3af;margin-top:24px;text-align:center}</style></head><body><div class="header"><p class="wordmark">IMPERIDOME</p><p class="tagline">Payment Receipt</p></div><div class="body"><div class="row"><span class="label">Invoice Number</span><span class="value">${esc(inv.invoice_number)}</span></div><div class="row"><span class="label">Description</span><span class="value">${esc(inv.description)}</span></div><div class="row"><span class="label">Due Date</span><span class="value">${esc(dueDateStr)}</span></div><div class="row"><span class="label">Date Paid</span><span class="value">${esc(paidDateStr)}</span></div><hr class="divider"><div class="total-row"><span>Amount</span><span>$${esc(amountStr)}</span></div><div class="total-row"><span>Total</span><span>$${esc(amountStr)}</span></div><p class="footer">Thank you for your payment. — Imperidome</p></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${inv.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Active order = most recent non-live, non-cancelled
  const activeOrder =
    orders.find((o) => {
      const key = getStatusKey(o.status);
      return key !== "live" && key !== "cancelled";
    }) ?? null;

  const activeStatusKey = activeOrder ? getStatusKey(activeOrder.status) : null;

  async function handleStatusChange(newKey: StatusKey) {
    if (!actor || !client || !activeOrder) return;
    const originalStatus = activeOrder.status;
    setStatusError(null);

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrder.id ? { ...o, status: makeStatus(newKey) } : o,
      ),
    );
    setStatusUpdating(true);

    try {
      const result = await (actor as backendInterface).updateOrderStatus(
        adminEmail,
        activeOrder.id as unknown as string,
        Object.keys(makeStatus(newKey))[0],
      );

      if (result && "err" in result) {
        throw new Error("Update failed");
      }

      // Send email for specific statuses only
      if (EMAIL_TRIGGER_STATUSES.includes(newKey)) {
        try {
          await (actor as backendInterface).sendOrderStatusEmail(
            client.profile.principal,
            makeStatus(newKey),
            client.profile.email,
          );
        } catch {
          // Email failure is non-blocking
        }
      }
    } catch {
      // Revert on error
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id ? { ...o, status: originalStatus } : o,
        ),
      );
      setStatusError("Failed to update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  }

  const pendingRequestsCount = purchaseRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const profile = client?.profile;
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";

  return (
    <AdminLayout pageTitle="Client Detail">
      {/* Back link */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          data-ocid="client_detail.back_button"
          onClick={() => router.history.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7A7D90",
            fontSize: 14,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Clients
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          data-ocid="client_detail.loading_state"
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: 8,
            border: "1px solid #1C1F33",
            padding: 32,
            textAlign: "center",
            color: "#7A7D90",
          }}
        >
          Loading client data...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          data-ocid="client_detail.error_state"
          style={{
            background: "rgba(239,68,68,0.1)",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)",
            padding: 24,
            color: "#f87171",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <>
          {/* ── Section 1: Client Header ── */}
          <div
            data-ocid="client_detail.header.card"
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              borderRadius: 8,
              border: "1px solid #1C1F33",
              padding: 28,
            }}
          >
            {!editing ? (
              <>
                {/* Header action buttons: Send Invoice + Edit */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#EEF0F8",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {fullName || "—"}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      data-ocid="client_detail.site_link.open_modal_button"
                      onClick={() => {
                        setSiteLinkUrl("");
                        setSiteLinkError(null);
                        setSiteLinkSuccess(false);
                        setShowSiteLinkModal(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.40)",
                        borderRadius: 6,
                        padding: "6px 14px",
                        minHeight: 36,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#a5b4fc",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Send Site Link
                    </button>
                    <button
                      type="button"
                      data-ocid="client_detail.invoices.send_invoice.open_modal_button"
                      onClick={openSendInvoiceModal}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(57,255,20,0.08)",
                        border: "1px solid rgba(57,255,20,0.35)",
                        borderRadius: 6,
                        padding: "6px 14px",
                        minHeight: 36,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#39FF14",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Send Invoice
                    </button>
                    <button
                      type="button"
                      data-ocid="client_detail.header.edit_button"
                      onClick={startEdit}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 6,
                        padding: "6px 14px",
                        minHeight: 36,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#EEF0F8",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 15,
                    color: "#7A7D90",
                    marginBottom: 10,
                    fontWeight: 500,
                  }}
                >
                  {profile.businessName || "\u2014"}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 20px",
                    fontSize: 13,
                    color: "#7A7D90",
                    marginBottom: 14,
                  }}
                >
                  <span>{profile.email}</span>
                  {profile.phone && <span>{profile.phone}</span>}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "#7A7D90",
                  }}
                >
                  <span>Joined {formatDate(profile.createdAt)}</span>

                  {client?.subscriptionPlanName ? (
                    <span
                      style={{
                        background: "#DBEAFE",
                        color: "#1D4ED8",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {client.subscriptionPlanName}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#7A7D90",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      No Plan
                    </span>
                  )}

                  {client?.latestOrderStatus ? (
                    <StatusBadge status={client.latestOrderStatus as Status} />
                  ) : (
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#7A7D90",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      No Project
                    </span>
                  )}
                </div>

                {/* Send Invoice Modal (ad-hoc Stripe checkout) */}
                {showSendInvoiceModal && (
                  <div
                    data-ocid="client_detail.invoices.send_invoice.dialog"
                    role="presentation"
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.70)",
                      backdropFilter: "blur(4px)",
                      zIndex: 1000,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 16,
                    }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget)
                        setShowSendInvoiceModal(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowSendInvoiceModal(false);
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(17,19,34,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        padding: 28,
                        width: "100%",
                        maxWidth: 460,
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 24,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#EEF0F8",
                          }}
                        >
                          Send Invoice
                        </h3>
                        <button
                          type="button"
                          aria-label="Close"
                          data-ocid="client_detail.invoices.send_invoice.close_button"
                          onClick={() => setShowSendInvoiceModal(false)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#7A7D90",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: 18 }}>
                        <label
                          htmlFor="send-invoice-description"
                          style={labelStyle}
                        >
                          Description
                        </label>
                        <textarea
                          id="send-invoice-description"
                          data-ocid="client_detail.invoices.send_invoice_description.textarea"
                          placeholder="e.g. Extra page design — 3 hours"
                          rows={3}
                          value={invoiceForm.description}
                          onChange={(e) =>
                            setInvoiceForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 14,
                            color: "#EEF0F8",
                            outline: "none",
                            boxSizing: "border-box",
                            resize: "vertical",
                            lineHeight: 1.5,
                            fontFamily: "inherit",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#39FF14";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.1)";
                          }}
                        />
                      </div>

                      {/* Amount */}
                      <div style={{ marginBottom: 28 }}>
                        <label htmlFor="send-invoice-amount" style={labelStyle}>
                          Amount (USD)
                        </label>
                        <input
                          id="send-invoice-amount"
                          data-ocid="client_detail.invoices.send_invoice_amount.input"
                          type="number"
                          min="0.50"
                          step="0.01"
                          placeholder="0.00"
                          value={invoiceForm.amount}
                          onChange={(e) =>
                            setInvoiceForm((f) => ({
                              ...f,
                              amount: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 14,
                            color: "#EEF0F8",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#39FF14";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.1)";
                          }}
                        />
                      </div>

                      {/* Buttons */}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          type="button"
                          data-ocid="client_detail.invoices.send_invoice.confirm_button"
                          onClick={handleSendInvoice}
                          disabled={invoiceSending}
                          style={{
                            flex: 1,
                            background: invoiceSending
                              ? "rgba(57,255,20,0.1)"
                              : "transparent",
                            color: "#39FF14",
                            border: "1px solid #39FF14",
                            borderRadius: 8,
                            padding: "11px 0",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: invoiceSending ? "not-allowed" : "pointer",
                            opacity: invoiceSending ? 0.7 : 1,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (!invoiceSending)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "rgba(57,255,20,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            if (!invoiceSending)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                          }}
                        >
                          {invoiceSending ? "Sending..." : "Send Invoice"}
                        </button>
                        <button
                          type="button"
                          data-ocid="client_detail.invoices.send_invoice.cancel_button"
                          onClick={() => setShowSendInvoiceModal(false)}
                          disabled={invoiceSending}
                          style={{
                            background: "transparent",
                            color: "#7A7D90",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 8,
                            padding: "11px 20px",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "border-color 0.2s, color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "rgba(255,255,255,0.3)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "#EEF0F8";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "rgba(255,255,255,0.15)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "#7A7D90";
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  Edit Client
                </h3>

                {saveError && (
                  <div
                    data-ocid="client_detail.header.save_error_state"
                    style={{
                      background: "#FEE2E2",
                      color: "#991B1B",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    {saveError}
                  </div>
                )}
                {saveErrorDetail && (
                  <div
                    style={{ color: "#f87171", fontSize: 11, marginBottom: 16 }}
                  >
                    {saveErrorDetail}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                  className="edit-name-row"
                >
                  <div>
                    <label htmlFor="edit-firstName" style={labelStyle}>
                      First Name
                    </label>
                    <input
                      data-ocid="client_detail.header.first_name.input"
                      id="edit-firstName"
                      style={inputStyle}
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-lastName" style={labelStyle}>
                      Last Name
                    </label>
                    <input
                      data-ocid="client_detail.header.last_name.input"
                      id="edit-lastName"
                      style={inputStyle}
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="edit-phone" style={labelStyle}>
                    Phone Number
                  </label>
                  <input
                    data-ocid="client_detail.header.phone.input"
                    id="edit-phone"
                    style={inputStyle}
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="edit-businessName" style={labelStyle}>
                    Business Name
                  </label>
                  <input
                    data-ocid="client_detail.header.business_name.input"
                    id="edit-businessName"
                    style={inputStyle}
                    value={editForm.businessName}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        businessName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="edit-businessType" style={labelStyle}>
                    Business Type
                  </label>
                  <select
                    data-ocid="client_detail.header.business_type.select"
                    id="edit-businessType"
                    style={inputStyle}
                    value={editForm.businessType}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        businessType: e.target.value,
                      }))
                    }
                  >
                    <option value="" disabled>
                      Select a type
                    </option>
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    data-ocid="client_detail.header.save_button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: "#3B82C4",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "9px 22px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    data-ocid="client_detail.header.cancel_button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    style={{
                      background: "transparent",
                      color: "#7A7D90",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      padding: "9px 22px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Section 2: Project Timeline ── */}
          <div
            data-ocid="client_detail.timeline.card"
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              borderRadius: 8,
              border: "1px solid #1C1F33",
              padding: 24,
              marginTop: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 16,
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              Project Timeline
            </h3>

            {ordersLoading ? (
              <div
                style={{
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Loading project data...
              </div>
            ) : !activeOrder ? (
              <div
                data-ocid="client_detail.timeline.empty_state"
                style={{
                  textAlign: "center",
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "24px 0",
                }}
              >
                No active project for this client.
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <ProjectProgressBar statusKey={activeStatusKey!} />

                {/* Status Update Dropdown */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    htmlFor="status-update-select"
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#7A7D90",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    Update Project Status
                  </label>
                  <select
                    id="status-update-select"
                    data-ocid="client_detail.timeline.status_update.select"
                    disabled={statusUpdating}
                    value={activeStatusKey ?? ""}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as StatusKey)
                    }
                    style={{
                      ...inputStyle,
                      maxWidth: 320,
                      opacity: statusUpdating ? 0.6 : 1,
                      cursor: statusUpdating ? "not-allowed" : "pointer",
                    }}
                  >
                    {ALL_STATUS_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>

                  {statusUpdating && (
                    <div
                      style={{ fontSize: 12, color: "#7A7D90", marginTop: 4 }}
                    >
                      Updating...
                    </div>
                  )}

                  {statusError && (
                    <div
                      data-ocid="client_detail.timeline.update_error_state"
                      style={{
                        fontSize: 12,
                        color: "#f87171",
                        background: "rgba(239,68,68,0.1)",
                        borderRadius: 4,
                        padding: "6px 10px",
                        marginTop: 6,
                        maxWidth: 320,
                      }}
                    >
                      {statusError}
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: 12,
                      color: "#7A7D90",
                      margin: "6px 0 0 0",
                    }}
                  >
                    Changing status to DEPOSIT SENT will automatically email the
                    client their payment link.
                  </p>
                </div>

                {/* 2x2 Data Grid */}
                <div className="timeline-data-grid">
                  <div>
                    <div style={labelStyle}>Tier</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#EEF0F8",
                        fontSize: 14,
                      }}
                    >
                      {activeOrder.tier_code || "\u2014"}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Status</div>
                    <StatusBadge status={activeOrder.status} />
                  </div>
                  <div>
                    <div style={labelStyle}>Delivery Window</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#EEF0F8",
                        fontSize: 14,
                      }}
                    >
                      {activeOrder.delivery_window || "\u2014"}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Launch Target</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#EEF0F8",
                        fontSize: 14,
                      }}
                    >
                      {activeOrder.launch_target || "\u2014"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Section 2b: Notes (vincenzo@imperidome.com only) ── */}
          {isAdmin && (
            <div
              data-ocid="client_detail.notes.card"
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid #1C1F33",
                padding: 24,
                marginTop: 20,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  Notes
                </h3>
                {notesAutoSaving && (
                  <span
                    data-ocid="client_detail.notes.loading_state"
                    style={{
                      fontSize: 12,
                      color: "#7A7D90",
                      fontStyle: "italic",
                    }}
                  >
                    Saving...
                  </span>
                )}
              </div>

              <textarea
                data-ocid="client_detail.notes.textarea"
                value={notesValue}
                onChange={(e) => handleNotesChange(e.target.value)}
                disabled={notesSaving || notesAutoSaving}
                placeholder="Add private notes about this client (only visible to you)..."
                rows={6}
                style={{
                  width: "100%",
                  border: `1px solid ${notesError ? "rgba(239,68,68,0.5)" : "#1C1F33"}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#EEF0F8",
                  background: "rgba(19,21,36,1)",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  lineHeight: 1.6,
                  opacity: notesSaving || notesAutoSaving ? 0.7 : 1,
                  cursor:
                    notesSaving || notesAutoSaving ? "not-allowed" : "text",
                  fontFamily: "inherit",
                }}
              />

              {notesError && (
                <div
                  data-ocid="client_detail.notes.error_state"
                  style={{
                    fontSize: 12,
                    color: "#f87171",
                    marginTop: 6,
                  }}
                >
                  {notesError}
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  data-ocid="client_detail.notes.save_button"
                  onClick={() => {
                    // Cancel any pending auto-save before explicit save
                    if (notesDebounceRef.current)
                      clearTimeout(notesDebounceRef.current);
                    performNotesSave(notesValue, false);
                  }}
                  disabled={notesSaving || notesAutoSaving}
                  style={{
                    background: "#3B82C4",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      notesSaving || notesAutoSaving
                        ? "not-allowed"
                        : "pointer",
                    opacity: notesSaving || notesAutoSaving ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {notesSaving ? (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Section 2c: File Delivery (admin only) ── */}
          {isAdmin && (
            <div
              data-ocid="client_detail.files.card"
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid #1C1F33",
                padding: 24,
                marginTop: 20,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 20,
                  gap: 8,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5EF08A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="8 17 12 21 16 17" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
                </svg>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  File Delivery
                </h3>
              </div>

              {/* Upload form */}
              <div
                style={{
                  background: "rgba(19,21,36,0.6)",
                  border: "1px solid #1C1F33",
                  borderRadius: 8,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}
              >
                {/* Hidden native file input */}
                <input
                  ref={fileInputRef}
                  id="file-delivery-input"
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFileUploadFile(f);
                    setFileError(null);
                  }}
                />

                {/* File picker row */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="file-delivery-input" style={labelStyle}>
                    File
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      data-ocid="client_detail.files.upload_button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid #1C1F33",
                        borderRadius: 6,
                        padding: "7px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#EEF0F8",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "rgba(255,255,255,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "#1C1F33";
                      }}
                    >
                      Choose File
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        color: fileUploadFile ? "#EEF0F8" : "#7A7D90",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {fileUploadFile ? fileUploadFile.name : "No file chosen"}
                    </span>
                    {fileUploadFile && (
                      <button
                        type="button"
                        aria-label="Clear file"
                        onClick={() => {
                          setFileUploadFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#7A7D90",
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Label input */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="file-delivery-label" style={labelStyle}>
                    Label / Description{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        textTransform: "none",
                        color: "#4A4D60",
                        marginLeft: 4,
                        letterSpacing: 0,
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    id="file-delivery-label"
                    data-ocid="client_detail.files.label.input"
                    type="text"
                    placeholder="e.g. Final Logo Package"
                    value={fileLabel}
                    onChange={(e) => setFileLabel(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {fileError && (
                  <div
                    data-ocid="client_detail.files.error_state"
                    style={{
                      fontSize: 12,
                      color: "#f87171",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 5,
                      padding: "6px 10px",
                      marginBottom: 12,
                    }}
                  >
                    {fileError}
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  data-ocid="client_detail.files.submit_button"
                  onClick={handleFileUpload}
                  disabled={fileUploading}
                  style={{
                    background: fileUploading
                      ? "rgba(57,255,20,0.06)"
                      : "rgba(57,255,20,0.10)",
                    color: "#39FF14",
                    border: "1px solid rgba(57,255,20,0.45)",
                    borderRadius: 6,
                    padding: "9px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: fileUploading ? "not-allowed" : "pointer",
                    opacity: fileUploading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!fileUploading)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(57,255,20,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    if (!fileUploading)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(57,255,20,0.10)";
                  }}
                >
                  {fileUploading ? (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      Upload File
                    </>
                  )}
                </button>
              </div>

              {/* File list */}
              {filesLoading ? (
                <div
                  data-ocid="client_detail.files.loading_state"
                  style={{
                    color: "#7A7D90",
                    fontSize: 14,
                    padding: "16px 0",
                    textAlign: "center",
                  }}
                >
                  Loading files...
                </div>
              ) : clientFiles.length === 0 ? (
                <div
                  data-ocid="client_detail.files.empty_state"
                  style={{
                    textAlign: "center",
                    color: "#7A7D90",
                    fontSize: 14,
                    padding: "20px 0",
                    background: "rgba(19,21,36,0.5)",
                    borderRadius: 6,
                  }}
                >
                  No files delivered yet.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 520,
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                        {["File Name", "Label", "Upload Date", "Actions"].map(
                          (col) => (
                            <th
                              key={col}
                              style={{
                                padding: "7px 12px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#7A7D90",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {col}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {clientFiles.map((file, idx) => {
                        const isDeleting = deletingFileId === file.id;
                        const confirmingDelete = deleteConfirmId === file.id;
                        const uploadDate = new Date(
                          Number(file.uploadedAt) / 1_000_000,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        return (
                          <tr
                            key={file.id}
                            data-ocid={`client_detail.files.item.${idx + 1}`}
                            style={{ borderBottom: "1px solid #1C1F33" }}
                          >
                            {/* File name */}
                            <td
                              style={{
                                padding: "10px 12px",
                                fontSize: 13,
                                color: "#EEF0F8",
                                fontWeight: 600,
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={file.fileName}
                            >
                              {file.fileName}
                            </td>
                            {/* Label */}
                            <td
                              style={{
                                padding: "10px 12px",
                                fontSize: 13,
                                color: "#7A7D90",
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={file.fileLabel || undefined}
                            >
                              {file.fileLabel ? (
                                file.fileLabel
                              ) : (
                                <span
                                  style={{
                                    color: "#4A4D60",
                                    fontStyle: "italic",
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                            {/* Upload Date */}
                            <td
                              style={{
                                padding: "10px 12px",
                                fontSize: 13,
                                color: "#7A7D90",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {uploadDate}
                            </td>
                            {/* Actions */}
                            <td
                              style={{
                                padding: "10px 12px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {confirmingDelete ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 12, color: "#f87171" }}
                                  >
                                    Delete &ldquo;
                                    {file.fileName.length > 18
                                      ? `${file.fileName.slice(0, 18)}…`
                                      : file.fileName}
                                    &rdquo;?
                                  </span>
                                  <button
                                    type="button"
                                    data-ocid={`client_detail.files.confirm_button.${idx + 1}`}
                                    disabled={isDeleting}
                                    onClick={() =>
                                      handleDeleteFile(file.id, file.fileName)
                                    }
                                    style={{
                                      background: "rgba(239,68,68,0.12)",
                                      color: "#f87171",
                                      border: "1px solid rgba(239,68,68,0.4)",
                                      borderRadius: 5,
                                      padding: "4px 10px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: isDeleting
                                        ? "not-allowed"
                                        : "pointer",
                                      opacity: isDeleting ? 0.6 : 1,
                                    }}
                                  >
                                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                                  </button>
                                  <button
                                    type="button"
                                    data-ocid={`client_detail.files.cancel_button.${idx + 1}`}
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{
                                      background: "transparent",
                                      color: "#7A7D90",
                                      border:
                                        "1px solid rgba(255,255,255,0.15)",
                                      borderRadius: 5,
                                      padding: "4px 10px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  {/* Download */}
                                  <button
                                    type="button"
                                    data-ocid={`client_detail.files.edit_button.${idx + 1}`}
                                    title="Download file"
                                    onClick={() =>
                                      handleDownloadFile(file.id, file.fileName)
                                    }
                                    style={{
                                      background: "rgba(59,130,196,0.10)",
                                      color: "#60a5fa",
                                      border: "1px solid rgba(59,130,196,0.35)",
                                      borderRadius: 5,
                                      padding: "5px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7 10 12 15 17 10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download
                                  </button>
                                  {/* Delete trigger */}
                                  <button
                                    type="button"
                                    data-ocid={`client_detail.files.delete_button.${idx + 1}`}
                                    title="Delete file"
                                    onClick={() => setDeleteConfirmId(file.id)}
                                    style={{
                                      background: "transparent",
                                      color: "#f87171",
                                      border: "1px solid rgba(239,68,68,0.3)",
                                      borderRadius: 5,
                                      padding: "5px 10px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                      <path d="M10 11v6M14 11v6" />
                                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Section 2d: Messages (admin only) ── */}
          {isAdmin && (
            <div
              data-ocid="client_detail.messages.card"
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid #1C1F33",
                padding: 24,
                marginTop: 20,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a5b4fc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  Messages — {fullName || profile.email}
                </h3>
              </div>

              {/* Message thread */}
              <div
                data-ocid="client_detail.messages.panel"
                style={{
                  maxHeight: 400,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "4px 2px",
                  marginBottom: 16,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#1C1F33 transparent",
                }}
              >
                {messagesLoading ? (
                  <div
                    data-ocid="client_detail.messages.loading_state"
                    style={{
                      color: "#7A7D90",
                      fontSize: 14,
                      textAlign: "center",
                      padding: "24px 0",
                    }}
                  >
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    data-ocid="client_detail.messages.empty_state"
                    style={{
                      color: "#7A7D90",
                      fontSize: 14,
                      textAlign: "center",
                      padding: "32px 0",
                      background: "rgba(19,21,36,0.5)",
                      borderRadius: 6,
                    }}
                  >
                    No messages yet.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdminMsg =
                      msg.senderEmail === "vincenzo@imperidome.com";
                    const ts = new Date(Number(msg.createdAt) / 1_000_000);
                    const timeStr = ts.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    return (
                      <div
                        key={msg.id}
                        data-ocid={`client_detail.messages.item.${msg.id.slice(0, 12)}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdminMsg ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "80%",
                            background: isAdminMsg
                              ? "rgba(99,102,241,0.18)"
                              : "rgba(255,255,255,0.06)",
                            border: isAdminMsg
                              ? "1px solid rgba(99,102,241,0.35)"
                              : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: isAdminMsg
                              ? "12px 12px 2px 12px"
                              : "12px 12px 12px 2px",
                            padding: "10px 14px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: isAdminMsg ? "#a5b4fc" : "#7A7D90",
                              marginBottom: 5,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {msg.senderName || msg.senderEmail}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#EEF0F8",
                              lineHeight: 1.55,
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.body}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#4A4D60",
                              marginTop: 6,
                              textAlign: isAdminMsg ? "right" : "left",
                            }}
                          >
                            {timeStr}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesBottomRef} />
              </div>

              {/* Reply input */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background: "rgba(19,21,36,0.6)",
                  border: "1px solid #1C1F33",
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <textarea
                  data-ocid="client_detail.messages.textarea"
                  rows={3}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  disabled={replySending}
                  placeholder={`Reply to ${fullName || profile.email}...`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  style={{
                    width: "100%",
                    background: "rgba(19,21,36,1)",
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "9px 12px",
                    fontSize: 14,
                    color: "#EEF0F8",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    opacity: replySending ? 0.7 : 1,
                    cursor: replySending ? "not-allowed" : "text",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1C1F33";
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#4A4D60" }}>
                    ⌘ + Enter to send
                  </span>
                  <button
                    type="button"
                    data-ocid="client_detail.messages.submit_button"
                    onClick={handleSendReply}
                    disabled={replySending || !replyBody.trim()}
                    style={{
                      background:
                        replySending || !replyBody.trim()
                          ? "rgba(99,102,241,0.08)"
                          : "rgba(99,102,241,0.18)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.45)",
                      borderRadius: 6,
                      padding: "8px 22px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor:
                        replySending || !replyBody.trim()
                          ? "not-allowed"
                          : "pointer",
                      opacity: replySending || !replyBody.trim() ? 0.55 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      transition: "background 0.2s, opacity 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!replySending && replyBody.trim())
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(99,102,241,0.28)";
                    }}
                    onMouseLeave={(e) => {
                      if (!replySending && replyBody.trim())
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(99,102,241,0.18)";
                    }}
                  >
                    {replySending ? (
                      <>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          style={{ animation: "spin 1s linear infinite" }}
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Section 2e: Purchase Requests (admin only) ── */}
          {isAdmin && (
            <div
              data-ocid="client_detail.purchase_requests.card"
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid #1C1F33",
                marginTop: 20,
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Collapsible header */}
              <button
                type="button"
                data-ocid="client_detail.purchase_requests.toggle"
                onClick={() => setPurchaseRequestsOpen((v) => !v)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EEF0F8",
                    flex: 1,
                  }}
                >
                  Purchase Requests
                </span>
                {pendingRequestsCount > 0 && (
                  <span
                    data-ocid="client_detail.purchase_requests.pending_badge"
                    style={{
                      background: "rgba(251,191,36,0.18)",
                      border: "1px solid rgba(251,191,36,0.4)",
                      color: "#FBBF24",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pendingRequestsCount} Pending
                  </span>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7A7D90"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    transition: "transform 0.2s",
                    transform: purchaseRequestsOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {purchaseRequestsOpen && (
                <div style={{ padding: "0 24px 24px 24px" }}>
                  {purchaseRequestsLoading ? (
                    <div
                      data-ocid="client_detail.purchase_requests.loading_state"
                      style={{
                        color: "#7A7D90",
                        fontSize: 14,
                        textAlign: "center",
                        padding: "24px 0",
                      }}
                    >
                      Loading purchase requests...
                    </div>
                  ) : purchaseRequests.length === 0 ? (
                    <div
                      data-ocid="client_detail.purchase_requests.empty_state"
                      style={{
                        color: "#7A7D90",
                        fontSize: 14,
                        textAlign: "center",
                        padding: "28px 0",
                        background: "rgba(19,21,36,0.5)",
                        borderRadius: 6,
                      }}
                    >
                      No purchase requests from this client yet.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {purchaseRequests.map((req, idx) => {
                        const statusColors =
                          req.status === "approved"
                            ? {
                                bg: "rgba(94,240,138,0.15)",
                                text: "#5EF08A",
                                border: "rgba(94,240,138,0.3)",
                              }
                            : req.status === "declined"
                              ? {
                                  bg: "rgba(239,68,68,0.15)",
                                  text: "#f87171",
                                  border: "rgba(239,68,68,0.3)",
                                }
                              : {
                                  bg: "rgba(251,191,36,0.15)",
                                  text: "#FBBF24",
                                  border: "rgba(251,191,36,0.3)",
                                };
                        const isApproving = approvingId === req.id;
                        const isDeclining = decliningId === req.id;
                        const isDeclinePending = declinePendingId === req.id;
                        const reqDate = new Date(
                          Number(req.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        return (
                          <div
                            key={req.id}
                            data-ocid={`client_detail.purchase_requests.item.${idx + 1}`}
                            style={{
                              background: "rgba(19,21,36,0.5)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              borderRadius: 8,
                              padding: "16px 18px",
                            }}
                          >
                            {/* Request header row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                marginBottom: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#EEF0F8",
                                    marginBottom: 4,
                                  }}
                                >
                                  {req.productName}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px 14px",
                                    flexWrap: "wrap",
                                    fontSize: 12,
                                    color: "#7A7D90",
                                  }}
                                >
                                  <span>
                                    $
                                    {typeof req.amount === "number"
                                      ? req.amount.toFixed(2)
                                      : Number(req.amount).toFixed(2)}
                                  </span>
                                  <span style={{ textTransform: "capitalize" }}>
                                    {req.frequency}
                                  </span>
                                  <span>Requested {reqDate}</span>
                                </div>
                              </div>
                              <span
                                style={{
                                  background: statusColors.bg,
                                  color: statusColors.text,
                                  border: `1px solid ${statusColors.border}`,
                                  borderRadius: 5,
                                  padding: "3px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {req.status}
                              </span>
                            </div>

                            {/* Pending: Approve + Decline */}
                            {req.status === "pending" && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                }}
                              >
                                {!isDeclinePending ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      data-ocid={`client_detail.purchase_requests.approve_button.${idx + 1}`}
                                      onClick={() =>
                                        handleApprovePurchaseRequest(req.id)
                                      }
                                      disabled={isApproving || isDeclining}
                                      style={{
                                        background: isApproving
                                          ? "rgba(94,240,138,0.1)"
                                          : "rgba(94,240,138,0.12)",
                                        color: "#5EF08A",
                                        border:
                                          "1px solid rgba(94,240,138,0.4)",
                                        borderRadius: 6,
                                        padding: "7px 18px",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor:
                                          isApproving || isDeclining
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity:
                                          isApproving || isDeclining ? 0.65 : 1,
                                        whiteSpace: "nowrap",
                                        transition: "background 0.2s",
                                      }}
                                    >
                                      {isApproving
                                        ? "Approving..."
                                        : "✓ Approve"}
                                    </button>
                                    <button
                                      type="button"
                                      data-ocid={`client_detail.purchase_requests.decline_button.${idx + 1}`}
                                      onClick={() =>
                                        setDeclinePendingId(req.id)
                                      }
                                      disabled={isApproving || isDeclining}
                                      style={{
                                        background: "transparent",
                                        color: "#f87171",
                                        border:
                                          "1px solid rgba(239,68,68,0.35)",
                                        borderRadius: 6,
                                        padding: "7px 18px",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor:
                                          isApproving || isDeclining
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity:
                                          isApproving || isDeclining ? 0.65 : 1,
                                        whiteSpace: "nowrap",
                                        transition: "background 0.2s",
                                      }}
                                    >
                                      ✕ Decline
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      background: "rgba(239,68,68,0.07)",
                                      border: "1px solid rgba(239,68,68,0.2)",
                                      borderRadius: 7,
                                      padding: "12px 14px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 8,
                                    }}
                                  >
                                    <label
                                      htmlFor={`decline-reason-${req.id}`}
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#f87171",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      Decline Reason (optional)
                                    </label>
                                    <textarea
                                      id={`decline-reason-${req.id}`}
                                      data-ocid={`client_detail.purchase_requests.decline_reason.${idx + 1}`}
                                      rows={2}
                                      placeholder="e.g. Product not available for this plan"
                                      value={declineReasonMap[req.id] ?? ""}
                                      onChange={(e) =>
                                        setDeclineReasonMap((prev) => ({
                                          ...prev,
                                          [req.id]: e.target.value,
                                        }))
                                      }
                                      style={{
                                        width: "100%",
                                        background: "rgba(19,21,36,1)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        borderRadius: 5,
                                        padding: "8px 10px",
                                        fontSize: 13,
                                        color: "#EEF0F8",
                                        outline: "none",
                                        resize: "vertical",
                                        lineHeight: 1.5,
                                        fontFamily: "inherit",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button
                                        type="button"
                                        data-ocid={`client_detail.purchase_requests.confirm_button.${idx + 1}`}
                                        onClick={() =>
                                          handleDeclinePurchaseRequest(req.id)
                                        }
                                        disabled={isDeclining}
                                        style={{
                                          background: isDeclining
                                            ? "rgba(239,68,68,0.08)"
                                            : "rgba(239,68,68,0.15)",
                                          color: "#f87171",
                                          border:
                                            "1px solid rgba(239,68,68,0.4)",
                                          borderRadius: 5,
                                          padding: "6px 14px",
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: isDeclining
                                            ? "not-allowed"
                                            : "pointer",
                                          opacity: isDeclining ? 0.65 : 1,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {isDeclining
                                          ? "Declining..."
                                          : "Confirm Decline"}
                                      </button>
                                      <button
                                        type="button"
                                        data-ocid={`client_detail.purchase_requests.cancel_button.${idx + 1}`}
                                        onClick={() =>
                                          setDeclinePendingId(null)
                                        }
                                        disabled={isDeclining}
                                        style={{
                                          background: "transparent",
                                          color: "#7A7D90",
                                          border:
                                            "1px solid rgba(255,255,255,0.12)",
                                          borderRadius: 5,
                                          padding: "6px 12px",
                                          fontSize: 12,
                                          fontWeight: 600,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Approved: checkout link */}
                            {req.status === "approved" && req.checkoutUrl && (
                              <a
                                href={req.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-ocid={`client_detail.purchase_requests.checkout_link.${idx + 1}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "rgba(94,240,138,0.08)",
                                  color: "#5EF08A",
                                  border: "1px solid rgba(94,240,138,0.3)",
                                  borderRadius: 6,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                View Checkout Link
                              </a>
                            )}

                            {/* Declined: reason */}
                            {req.status === "declined" && req.declineReason && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#7A7D90",
                                  background: "rgba(239,68,68,0.06)",
                                  border: "1px solid rgba(239,68,68,0.15)",
                                  borderRadius: 5,
                                  padding: "6px 10px",
                                  marginTop: 2,
                                }}
                              >
                                <span
                                  style={{ fontWeight: 600, color: "#f87171" }}
                                >
                                  Reason:{" "}
                                </span>
                                {req.declineReason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Section 3: Questionnaire Summary ── */}
          <div
            data-ocid="client_detail.questionnaire.card"
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              borderRadius: 8,
              border: "1px solid #1C1F33",
              padding: 24,
              marginTop: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 16,
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              Questionnaire Summary
            </h3>

            {questionnaireLoading ? (
              <div
                data-ocid="client_detail.questionnaire.loading_state"
                style={{
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Loading questionnaire...
              </div>
            ) : !questionnaire || !questionnaire.submitted ? (
              /* State 1: Not yet submitted */
              <div
                data-ocid="client_detail.questionnaire.empty_state"
                style={{
                  textAlign: "center",
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "24px 0",
                  background: "rgba(19,21,36,0.5)",
                  borderRadius: 6,
                }}
              >
                This client has not yet submitted their questionnaire.
              </div>
            ) : (
              <>
                {/* State 2: Submitted but unreviewed */}
                {!questionnaire.reviewed && (
                  <>
                    <div
                      data-ocid="client_detail.questionnaire.unreviewed_banner"
                      style={{
                        background: "#FEF3C7",
                        borderRadius: 6,
                        padding: "12px 16px",
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          color: "#fbbf24",
                          fontWeight: 500,
                        }}
                      >
                        This questionnaire has not been reviewed yet.
                      </span>
                      <button
                        type="button"
                        data-ocid="client_detail.questionnaire.mark_reviewed_button"
                        onClick={handleMarkReviewed}
                        disabled={reviewingQuestionnaire}
                        style={{
                          background: "#0F766E",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "7px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: reviewingQuestionnaire
                            ? "not-allowed"
                            : "pointer",
                          opacity: reviewingQuestionnaire ? 0.7 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reviewingQuestionnaire
                          ? "Marking..."
                          : "Mark as Reviewed"}
                      </button>
                      {reviewError && (
                        <span
                          data-ocid="client_detail.review.save_error_state"
                          style={{
                            color: "#991B1B",
                            fontSize: 13,
                            fontWeight: 500,
                            marginLeft: 12,
                          }}
                        >
                          {reviewError}
                        </span>
                      )}
                    </div>
                    {reviewErrorDetail && (
                      <div
                        style={{ color: "#991B1B", fontSize: 11, marginTop: 4 }}
                      >
                        {reviewErrorDetail}
                      </div>
                    )}
                  </>
                )}

                {/* State 3: Reviewed */}
                {questionnaire.reviewed && (
                  <div
                    data-ocid="client_detail.questionnaire.reviewed_banner"
                    style={{
                      background: "#F0FDF4",
                      borderRadius: 6,
                      padding: "12px 16px",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#166534",
                        fontWeight: 600,
                      }}
                    >
                      Questionnaire reviewed.
                    </div>
                    {questionnaire.reviewed_at !== undefined &&
                      questionnaire.reviewed_at !== null && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#7A7D90",
                            marginTop: 4,
                          }}
                        >
                          Reviewed at{" "}
                          {formatReviewedAt(questionnaire.reviewed_at)}
                        </div>
                      )}
                  </div>
                )}

                {/* Read-only answers */}
                {parseAnswers(questionnaire.answers).length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {parseAnswers(questionnaire.answers).map((item, i) => (
                      <div
                        key={item.label || i}
                        data-ocid={`client_detail.questionnaire.answer.${i + 1}`}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#7A7D90",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            marginBottom: 4,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#EEF0F8",
                            fontWeight: 500,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.value || "\u2014"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: "#7A7D90" }}>
                    No answers recorded.
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Section 4: Invoice History ── */}
          <div
            data-ocid="client_detail.invoices.card"
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              borderRadius: 8,
              border: "1px solid #1C1F33",
              padding: 24,
              marginTop: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                Invoice History
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                {showCompletionPaymentButton && (
                  <button
                    type="button"
                    data-ocid="client_detail.invoices.charge_completion_button"
                    onClick={handleChargeCompletionPayment}
                    disabled={completionPaymentLoading}
                    style={{
                      background: "#39FF14",
                      color: "#0a0a0a",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: completionPaymentLoading
                        ? "not-allowed"
                        : "pointer",
                      opacity: completionPaymentLoading ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {completionPaymentLoading
                      ? "Creating session..."
                      : "Charge Completion Payment"}
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="client_detail.invoices.open_modal_button"
                  onClick={openDepositModal}
                  style={{
                    background: "#3B82C4",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Send Deposit Invoice
                </button>
                <button
                  type="button"
                  data-ocid="client_detail.invoices.send_invoice_button"
                  onClick={openSendInvoiceModal}
                  style={{
                    background: "transparent",
                    color: "#39FF14",
                    border: "1px solid #39FF14",
                    borderRadius: 6,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(57,255,20,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  Send Invoice
                </button>
              </div>
            </div>

            {completionPaymentError && (
              <div
                data-ocid="client_detail.invoices.completion_payment.error_state"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 16,
                }}
              >
                {completionPaymentError}
              </div>
            )}

            {invoicesLoading ? (
              <div
                data-ocid="client_detail.invoices.loading_state"
                style={{
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div
                data-ocid="client_detail.invoices.empty_state"
                style={{
                  textAlign: "center",
                  color: "#7A7D90",
                  fontSize: 14,
                  padding: "24px 0",
                  background: "rgba(19,21,36,0.5)",
                  borderRadius: 6,
                }}
              >
                No invoices yet for this client.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 640,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {[
                        "Invoice #",
                        "Description",
                        "Amount",
                        "Status",
                        "Created",
                        "Paid Date",
                        "Action",
                      ].map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#7A7D90",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => {
                      const statusUpper = inv.status.toUpperCase();
                      const statusStyle =
                        statusUpper === "PAID"
                          ? { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" }
                          : statusUpper === "OVERDUE"
                            ? { bg: "rgba(239,68,68,0.15)", text: "#f87171" }
                            : { bg: "rgba(250,204,21,0.15)", text: "#fbbf24" };
                      return (
                        <tr
                          key={String(inv.id)}
                          data-ocid={`client_detail.invoices.row.${idx + 1}`}
                          style={{ borderBottom: "1px solid #1C1F33" }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inv.invoice_number}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#7A7D90",
                              maxWidth: 200,
                            }}
                          >
                            {inv.description}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            $
                            {typeof inv.amount === "number"
                              ? inv.amount.toFixed(2)
                              : Number(inv.amount).toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                borderRadius: 5,
                                padding: "3px 9px",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                border: `1px solid ${statusUpper === "PAID" ? "rgba(57,255,20,0.3)" : statusUpper === "OVERDUE" ? "rgba(239,68,68,0.3)" : "rgba(250,204,21,0.3)"}`,
                              }}
                            >
                              {statusUpper}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#7A7D90",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(
                              Number(inv.created_at) / 1_000_000,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#7A7D90",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inv.paid_at
                              ? new Date(
                                  Number(inv.paid_at) / 1_000_000,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusUpper === "PAID" && (
                              <button
                                type="button"
                                data-ocid={`client_detail.invoices.download_button.${idx + 1}`}
                                onClick={() => downloadInvoicePdf(inv)}
                                title="Download PDF Receipt"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#3B82C4",
                                  padding: 4,
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Sent Site Link History ── */}
            <div
              data-ocid="client_detail.site_link_log.card"
              style={{
                marginTop: 20,
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid #1C1F33",
                padding: 24,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                Sent Link History
              </h3>

              {siteLinkLogLoading ? (
                <div
                  data-ocid="client_detail.site_link_log.loading_state"
                  style={{
                    color: "#7A7D90",
                    fontSize: 13,
                    padding: "12px 0",
                    textAlign: "center",
                  }}
                >
                  Loading history...
                </div>
              ) : siteLinkLog.length === 0 ? (
                <div
                  data-ocid="client_detail.site_link_log.empty_state"
                  style={{
                    color: "#7A7D90",
                    fontSize: 13,
                    padding: "16px 0",
                    textAlign: "center",
                    background: "rgba(19,21,36,0.5)",
                    borderRadius: 6,
                  }}
                >
                  No links sent yet.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {siteLinkLog.map((entry, idx) => {
                    const ts = new Date(Number(entry.sentAt) / 1_000_000);
                    const formattedDate = ts.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const formattedTime = ts.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    const isResending = resendingUrl === entry.url;
                    return (
                      <div
                        key={`${entry.sentAt.toString()}-${idx}`}
                        data-ocid={`client_detail.site_link_log.item.${idx + 1}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 6,
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={entry.url}
                            style={{
                              fontSize: 13,
                              color: "#a5b4fc",
                              textDecoration: "none",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.textDecoration = "none";
                            }}
                          >
                            {entry.url}
                          </a>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#7A7D90",
                              marginTop: 2,
                              display: "block",
                            }}
                          >
                            {formattedDate} at {formattedTime}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-ocid={`client_detail.site_link_log.resend_button.${idx + 1}`}
                          disabled={resendingUrl !== null}
                          onClick={() => handleResendSiteLink(entry.url)}
                          style={{
                            flexShrink: 0,
                            background: isResending
                              ? "rgba(99,102,241,0.05)"
                              : "transparent",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99,102,241,0.35)",
                            borderRadius: 5,
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor:
                              resendingUrl !== null ? "not-allowed" : "pointer",
                            opacity:
                              resendingUrl !== null && !isResending ? 0.5 : 1,
                            transition: "background 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (resendingUrl === null)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "rgba(99,102,241,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            if (resendingUrl === null)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                          }}
                        >
                          {isResending ? (
                            <>
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                style={{ animation: "spin 1s linear infinite" }}
                              >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            "Resend"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send Site Link Modal */}
            {showSiteLinkModal && (
              <div
                data-ocid="client_detail.site_link.dialog"
                role="presentation"
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.70)",
                  backdropFilter: "blur(4px)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowSiteLinkModal(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowSiteLinkModal(false);
                }}
              >
                <div
                  style={{
                    background: "rgba(17,19,34,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    padding: 28,
                    width: "100%",
                    maxWidth: 460,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#EEF0F8",
                      }}
                    >
                      Send Site Link to Client
                    </h3>
                    <button
                      type="button"
                      aria-label="Close"
                      data-ocid="client_detail.site_link.close_button"
                      onClick={() => setShowSiteLinkModal(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#7A7D90",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p
                    style={{
                      margin: "0 0 20px 0",
                      fontSize: 13,
                      color: "#7A7D90",
                      lineHeight: 1.5,
                    }}
                  >
                    Paste the client's live site URL below. They will receive an
                    email with a clickable link to view their website.
                  </p>

                  {siteLinkSuccess && (
                    <div
                      data-ocid="client_detail.site_link.success_state"
                      style={{
                        background: "rgba(94,240,138,0.1)",
                        border: "1px solid rgba(94,240,138,0.3)",
                        color: "#5EF08A",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                        marginBottom: 16,
                        fontWeight: 600,
                      }}
                    >
                      Site link sent successfully!
                    </div>
                  )}

                  {siteLinkError && (
                    <div
                      data-ocid="client_detail.site_link.error_state"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span>{siteLinkError}</span>
                      <button
                        type="button"
                        aria-label="Dismiss error"
                        onClick={() => setSiteLinkError(null)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#f87171",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div style={{ marginBottom: 28 }}>
                    <label htmlFor="site-link-url" style={labelStyle}>
                      Site URL
                    </label>
                    <input
                      id="site-link-url"
                      data-ocid="client_detail.site_link.input"
                      type="url"
                      placeholder="https://www.yoursite.com"
                      value={siteLinkUrl}
                      onChange={(e) => setSiteLinkUrl(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 14,
                        color: "#EEF0F8",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#a5b4fc";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      data-ocid="client_detail.site_link.confirm_button"
                      onClick={handleSendSiteLink}
                      disabled={siteLinkSending || !siteLinkUrl.trim()}
                      style={{
                        flex: 1,
                        background:
                          siteLinkSending || !siteLinkUrl.trim()
                            ? "rgba(99,102,241,0.1)"
                            : "transparent",
                        color: "#a5b4fc",
                        border: "1px solid rgba(99,102,241,0.40)",
                        borderRadius: 8,
                        padding: "11px 0",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor:
                          siteLinkSending || !siteLinkUrl.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          siteLinkSending || !siteLinkUrl.trim() ? 0.6 : 1,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!siteLinkSending && siteLinkUrl.trim())
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(99,102,241,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        if (!siteLinkSending && siteLinkUrl.trim())
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                      }}
                    >
                      {siteLinkSending ? "Sending..." : "Send Site Link"}
                    </button>
                    <button
                      type="button"
                      data-ocid="client_detail.site_link.cancel_button"
                      onClick={() => {
                        setShowSiteLinkModal(false);
                        setSiteLinkUrl("");
                        setSiteLinkError(null);
                      }}
                      disabled={siteLinkSending}
                      style={{
                        background: "transparent",
                        color: "#7A7D90",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        padding: "11px 18px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: siteLinkSending ? "not-allowed" : "pointer",
                        opacity: siteLinkSending ? 0.6 : 1,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Send Deposit Invoice Modal */}
            {showDepositModal && (
              <div
                data-ocid="client_detail.invoices.modal"
                role="presentation"
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowDepositModal(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowDepositModal(false);
                }}
              >
                <div
                  style={{
                    background: "#0E1020",
                    borderRadius: 10,
                    padding: 32,
                    width: "100%",
                    maxWidth: 460,
                    boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
                    border: "1px solid #1C1F33",
                    boxSizing: "border-box",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 20px 0",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#EEF0F8",
                    }}
                  >
                    Send Deposit Invoice
                  </h3>

                  {depositError && (
                    <div
                      data-ocid="client_detail.invoices.deposit.error_state"
                      style={{
                        background: "#FEE2E2",
                        color: "#991B1B",
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {depositError}
                    </div>
                  )}

                  {depositSuccess && (
                    <div
                      data-ocid="client_detail.invoices.deposit.success_state"
                      style={{
                        background: "#F0FDF4",
                        color: "#166534",
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 13,
                        marginBottom: 16,
                        fontWeight: 600,
                      }}
                    >
                      Invoice sent successfully!
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="deposit-amount" style={labelStyle}>
                      Amount (USD)
                    </label>
                    <input
                      id="deposit-amount"
                      data-ocid="client_detail.invoices.deposit_amount.input"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="e.g. 500.00"
                      value={depositForm.amount}
                      onChange={(e) =>
                        setDepositForm((f) => ({
                          ...f,
                          amount: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="deposit-description" style={labelStyle}>
                      Description
                    </label>
                    <input
                      id="deposit-description"
                      data-ocid="client_detail.invoices.deposit_description.input"
                      type="text"
                      value={depositForm.description}
                      onChange={(e) =>
                        setDepositForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label htmlFor="deposit-due-date" style={labelStyle}>
                      Due Date
                    </label>
                    <input
                      id="deposit-due-date"
                      data-ocid="client_detail.invoices.deposit_due_date.input"
                      type="date"
                      value={depositForm.dueDate}
                      onChange={(e) =>
                        setDepositForm((f) => ({
                          ...f,
                          dueDate: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      data-ocid="client_detail.invoices.deposit.confirm_button"
                      onClick={handleSendDepositInvoice}
                      disabled={depositSending || depositSuccess}
                      style={{
                        flex: 1,
                        background: "#3B82C4",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 0",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: depositSending ? "not-allowed" : "pointer",
                        opacity: depositSending ? 0.7 : 1,
                      }}
                    >
                      {depositSending ? "Sending..." : "Send Invoice"}
                    </button>
                    <button
                      type="button"
                      data-ocid="client_detail.invoices.deposit.cancel_button"
                      onClick={() => setShowDepositModal(false)}
                      disabled={depositSending}
                      style={{
                        background: "rgba(19,21,36,1)",
                        color: "#7A7D90",
                        border: "1px solid #1C1F33",
                        borderRadius: 6,
                        padding: "10px 18px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 600px) {
          .edit-name-row {
            grid-template-columns: 1fr !important;
          }
          .timeline-data-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .timeline-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 32px;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}
