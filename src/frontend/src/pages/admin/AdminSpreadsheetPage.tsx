import {
  Check,
  Copy,
  Delete,
  Download,
  RefreshCw,
  Search,
  Settings,
  Table2,
  Wrench,
} from "lucide-react";
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import type { backendInterface } from "../../backend.d";
import type {
  AdHocInvoice,
  CrmClient,
  GoogleSheetsConfig,
  Order,
} from "../../backend.d";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

const ADMIN_EMAIL = "vincenzo@imperidome.com";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTs(ts: bigint | number): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;
type View =
  | "accounting"
  | "clients"
  | "tools"
  | "leads"
  | "reviews"
  | "revenue"
  | "gsheets";

interface AccountingRow {
  rowType: "Order" | "Invoice";
  clientName: string;
  idOrInvoiceNum: string;
  descriptionOrTier: string;
  amount: string;
  amountRaw: number;
  status: string;
  date: string;
  dateRaw: number;
  rawClientId: string;
  rawId: string; // order bigint as string OR adhoc invoice bigint as string
  rowKey: string;
}

interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  projectStatus: string;
  activeServices: string;
  currentMilestone: number;
  joinDate: string;
  joinDateRaw: number;
  notes: string;
}

// ── Status badge colour ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  PAID: {
    bg: "rgba(94,240,138,0.12)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.3)",
  },
  Paid: {
    bg: "rgba(94,240,138,0.12)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.3)",
  },
  paid: {
    bg: "rgba(94,240,138,0.12)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.3)",
  },
  PENDING: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.3)",
  },
  Pending: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.3)",
  },
  pending: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.3)",
  },
  OVERDUE: {
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
  Overdue: {
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
  overdue: {
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
  depositReceived: {
    bg: "rgba(94,240,138,0.12)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.3)",
  },
  live: {
    bg: "rgba(94,240,138,0.12)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.3)",
  },
  buildInProgress: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.3)",
  },
  cancelled: {
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
  paused: {
    bg: "rgba(122,125,144,0.12)",
    color: "#9DA0B3",
    border: "rgba(122,125,144,0.3)",
  },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? {
    bg: "rgba(122,125,144,0.1)",
    color: "#7A7D90",
    border: "rgba(122,125,144,0.2)",
  };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 5,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// ── Sort helper ────────────────────────────────────────────────────────────────

function useSortState(defaultCol: string) {
  const [sortCol, setSortCol] = useState<string>(defaultCol);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  return { sortCol, sortDir, handleSort };
}

function SortArrow({
  col,
  sortCol,
  sortDir,
}: { col: string; sortCol: string; sortDir: SortDir }) {
  if (sortCol !== col)
    return <span style={{ color: "#3A3D50", marginLeft: 4 }}>↕</span>;
  return (
    <span style={{ color: "#5EF08A", marginLeft: 4 }}>
      {sortDir === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy row"
        aria-label="Copy row to clipboard"
        style={{
          background: "none",
          border: "1px solid transparent",
          borderRadius: 5,
          padding: "3px 5px",
          cursor: "pointer",
          color: copied ? "#5EF08A" : "#3A3D50",
          display: "flex",
          alignItems: "center",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {copied && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 5px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(94,240,138,0.15)",
            border: "1px solid rgba(94,240,138,0.3)",
            color: "#5EF08A",
            borderRadius: 5,
            padding: "3px 9px",
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          Copied!
        </span>
      )}
    </div>
  );
}

// ── Inline editable Notes cell ─────────────────────────────────────────────────

function NotesCell({
  value,
  clientId,
  onSave,
}: {
  value: string;
  clientId: string;
  onSave: (id: string, notes: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  async function commit() {
    if (text === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(clientId, text);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setText(value);
            setEditing(false);
          }
        }}
        disabled={saving}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid #5EF08A",
          outline: "none",
          color: "#EEF0F8",
          fontSize: 13,
          width: "100%",
          minWidth: 120,
          padding: "1px 0",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{
        background: "none",
        border: "none",
        cursor: "text",
        color: text ? "#EEF0F8" : "#3A3D50",
        fontSize: 13,
        textAlign: "left",
        padding: 0,
        width: "100%",
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "block",
      }}
    >
      {text || "Click to add notes\u2026"}
    </button>
  );
}

// ── Inline status dropdown for ad-hoc invoices ─────────────────────────────────

const INVOICE_STATUSES = ["PENDING", "PAID", "OVERDUE"];

function InvoiceStatusCell({
  status,
  invoiceId,
  onSave,
}: {
  status: string;
  invoiceId: string;
  onSave: (id: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === "PAID") {
      setCurrent(newStatus);
      setSaving(true);
      try {
        await onSave(invoiceId);
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={saving || current === "PAID"}
      style={{
        background: "#0E1020",
        border: "1px solid #1C1F33",
        borderRadius: 5,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        color: STATUS_COLORS[current]?.color ?? "#7A7D90",
        cursor: current === "PAID" ? "default" : "pointer",
        outline: "none",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {INVOICE_STATUSES.map((s) => (
        <option
          key={s}
          value={s}
          style={{ background: "#0E1020", color: "#EEF0F8" }}
        >
          {s}
        </option>
      ))}
    </select>
  );
}

// ── Project status dropdown for clients ───────────────────────────────────────

const PROJECT_STATUSES = [
  "Onboarding",
  "In Progress",
  "Done",
  "Payment Failed",
];

function ProjectStatusCell({
  status,
  clientId,
  onSave,
}: {
  status: string;
  clientId: string;
  onSave: (id: string, s: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setCurrent(newStatus);
    setSaving(true);
    try {
      await onSave(clientId, newStatus);
    } catch {
      setCurrent(current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={saving}
      style={{
        background: "#0E1020",
        border: "1px solid #1C1F33",
        borderRadius: 5,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
        color: "#EEF0F8",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s} value={s} style={{ background: "#0E1020" }}>
          {s}
        </option>
      ))}
    </select>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {["a", "b", "c", "d", "e"].map((k) => (
        <tr key={k} style={{ borderBottom: "1px solid #1C1F33" }}>
          {Array.from({ length: cols }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
            <td key={i} style={{ padding: "13px 14px" }}>
              <div
                style={{
                  height: 12,
                  width: `${50 + (i % 3) * 15}%`,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── TH with sort ──────────────────────────────────────────────────────────────

function SortableTH({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
}: {
  label: string;
  col: string;
  sortCol: string;
  sortDir: SortDir;
  onSort: (c: string) => void;
}) {
  return (
    <th
      onClick={() => onSort(col)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSort(col);
      }}
      scope="col"
      style={{
        textAlign: "left",
        padding: "11px 14px",
        fontSize: 11,
        fontWeight: 700,
        color: sortCol === col ? "#5EF08A" : "#7A7D90",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom: "1px solid #1C1F33",
        background: "rgba(14,16,32,0.9)",
        position: "sticky" as const,
        top: 0,
        cursor: "pointer",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {label}
      <SortArrow col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );
}

// ── Main export function ───────────────────────────────────────────────────────

export default function AdminSpreadsheetPage() {
  const { actor, isFetching } = useActor();
  const [view, setView] = useState<View>("accounting");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Accounting state ─────────────────────────────────────────────────────────
  const [accountingRows, setAccountingRows] = useState<AccountingRow[]>([]);
  const [acctLoading, setAcctLoading] = useState(true);
  const [acctError, setAcctError] = useState<string | null>(null);

  // ── Client state ──────────────────────────────────────────────────────────────
  const [clientRows, setClientRows] = useState<ClientRow[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const acctSort = useSortState("date");
  const clientSort = useSortState("joinDate");
  const leadSort = useSortState("created_at");
  const reviewSort = useSortState("createdAt");

  // ── Leads tab state ──────────────────────────────────────────────────────────
  const [leadsData, setLeadsData] = useState<Record<string, unknown>[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [leadServiceFilter, setLeadServiceFilter] = useState("");
  const [leadFromDate, setLeadFromDate] = useState("");
  const [leadToDate, setLeadToDate] = useState("");

  // ── Reviews tab state ────────────────────────────────────────────────────────
  const [reviewsData, setReviewsData] = useState<Record<string, unknown>[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");

  // ── Revenue tab state ────────────────────────────────────────────────────────
  const [revFromDate, setRevFromDate] = useState("");
  const [revToDate, setRevToDate] = useState("");
  const [revMonth, setRevMonth] = useState("");
  const [revChartMode, setRevChartMode] = useState<"bar" | "cards">("bar");
  const [convStats, setConvStats] = useState<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
  } | null>(null);

  // ── Google Sheets config state ──────────────────────────────────────────────
  // -- Instruction modal state
  const [showExcelHelp, setShowExcelHelp] = useState(false);
  const [showGSheetsHelp, setShowGSheetsHelp] = useState(false);

  const EXCEL_STEPS: InstructionStep[] = [
    {
      text: "Navigate to the spreadsheet view you want to export \u2014 Accounting, Client List, Leads, Reviews, or Revenue Dashboard.",
    },
    {
      text: 'Click the "Export to Excel" button in the top-right area of that view.',
    },
    { text: "A .xlsx file will download automatically to your device." },
    {
      text: "Open the file in Microsoft Excel, or import it into Google Sheets via File \u2192 Import \u2192 Upload.",
    },
    {
      text: "The file includes all visible data with formatted column headers, currency values, and readable dates.",
    },
  ];

  const GSHEETS_STEPS: InstructionStep[] = [
    { text: 'Go to script.google.com and click "New project".' },
    {
      text: "Delete any existing code, paste the Imperidome Google Sheets Sync Bridge script, and save (Ctrl+S).",
    },
    {
      text: "Click Deploy \u2192 New deployment. Set Type: Web App, Execute as: Me, Who has access: Anyone. Click Deploy and authorize permissions.",
    },
    { text: "Copy the Web App URL that appears after deploying." },
    {
      text: 'Paste the Web App URL into the "Apps Script Web App URL" field in this panel.',
    },
    {
      text: 'Optionally paste your Google Sheet ID into the "Sheet ID" field. Leave blank to auto-create a new Sheet.',
    },
    { text: 'Click "Save Configuration".' },
    {
      text: 'Use the "Sync to Google Sheets" button on any spreadsheet view (Accounting, Client List, Leads, Revenue Dashboard) to push that view\'s data to its own named tab in your Sheet.',
    },
  ];

  const [gsScriptUrl, setGsScriptUrl] = useState("");
  const [gsSheetId, setGsSheetId] = useState("");
  const [gsConfigured, setGsConfigured] = useState(false);
  const [gsSaving, setGsSaving] = useState(false);
  const [gsClearing, setGsClearing] = useState(false);
  const [gsToast, setGsToast] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );
  const [gsSyncingView, setGsSyncingView] = useState<string | null>(null);
  const [gsSyncToast, setGsSyncToast] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  // ── Load accounting data ──────────────────────────────────────────────────────
  const loadAccounting = useCallback(async () => {
    if (!actor || isFetching) return;
    setAcctLoading(true);
    setAcctError(null);
    try {
      const adminEmail = getAdminEmail();
      const [allClients, allOrders] = await Promise.all([
        (actor as backendInterface).getClients(adminEmail),
        (actor as backendInterface).getAdminAllOrders(adminEmail),
      ]);

      const clientMap = new Map<string, string>();
      for (const c of allClients) {
        clientMap.set(c.id, c.name);
      }

      const rows: AccountingRow[] = [];

      // Add order rows
      for (const order of allOrders) {
        const clientIdStr = String(order.client_id);
        rows.push({
          rowType: "Order",
          clientName:
            clientMap.get(clientIdStr) ??
            clientIdStr.slice(0, 12).concat("\u2026"),
          idOrInvoiceNum: String(order.id).slice(-8),
          descriptionOrTier: order.tier_code || "—",
          amount: "—",
          amountRaw: 0,
          status: order.status,
          date: formatTs(order.created_at),
          dateRaw: Number(order.created_at),
          rawClientId: clientIdStr,
          rawId: String(order.id),
          rowKey: `order-${String(order.id)}`,
        });
      }

      // Fetch ad-hoc invoices per client
      const invoiceFetches = allClients.map((c) =>
        (actor as backendInterface)
          .getAdHocClientInvoices(adminEmail, c.id)
          .then((invs) => invs.map((inv) => ({ ...inv, _clientName: c.name })))
          .catch(() => [] as (AdHocInvoice & { _clientName: string })[]),
      );
      const allInvoiceArrays = await Promise.all(invoiceFetches);
      for (const invArray of allInvoiceArrays) {
        for (const inv of invArray) {
          rows.push({
            rowType: "Invoice",
            clientName: (inv as AdHocInvoice & { _clientName: string })
              ._clientName,
            idOrInvoiceNum: inv.invoiceNumber,
            descriptionOrTier: inv.description,
            amount: formatMoney(inv.amount),
            amountRaw: inv.amount,
            status: inv.status,
            date: formatTs(inv.createdAt),
            dateRaw: Number(inv.createdAt),
            rawClientId: inv.clientId,
            rawId: String(inv.id),
            rowKey: `invoice-${String(inv.id)}`,
          });
        }
      }

      setAccountingRows(rows);
    } catch {
      setAcctError("Failed to load accounting data. Please refresh.");
    } finally {
      setAcctLoading(false);
    }
  }, [actor, isFetching]);

  // ── Load client data ──────────────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    if (!actor || isFetching) return;
    setClientsLoading(true);
    setClientsError(null);
    try {
      const adminEmail = getAdminEmail();
      const allClients = await (actor as backendInterface).getClients(
        adminEmail,
      );
      setClientRows(
        allClients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          source: c.source,
          projectStatus: c.projectStatus,
          activeServices: c.activeServices.join(", "),
          currentMilestone: Number(c.currentMilestone),
          joinDate: formatTs(c.created_at),
          joinDateRaw: Number(c.created_at),
          notes: c.notes,
        })),
      );
    } catch {
      setClientsError("Failed to load client list. Please refresh.");
    } finally {
      setClientsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    loadAccounting();
  }, [loadAccounting]);
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Load Google Sheets config on mount
  useEffect(() => {
    if (!actor || isFetching) return;
    const adminEmail = getAdminEmail();
    Promise.all([
      (actor as backendInterface).isGoogleSheetsConfigured(),
      (actor as backendInterface).getGoogleSheetsConfig(adminEmail),
    ])
      .then(([configured, configRes]) => {
        setGsConfigured(Boolean(configured));
        if (configRes && "ok" in configRes) {
          const cfg = (configRes as { ok: GoogleSheetsConfig }).ok;
          setGsScriptUrl(cfg.scriptUrl ?? "");
          setGsSheetId(cfg.sheetId ?? "");
        }
      })
      .catch(() => {});
  }, [actor, isFetching]);

  // Fetch leads when Leads tab is activated
  useEffect(() => {
    if (view === "leads" && leadsData.length === 0 && !leadsLoading) {
      setLeadsLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (actor as backendInterface)
        .getLeads(ADMIN_EMAIL)
        .then((data: unknown) => {
          setLeadsData(
            Array.isArray(data) ? (data as Record<string, unknown>[]) : [],
          );
          setLeadsLoading(false);
        })
        .catch(() => setLeadsLoading(false));
    }
  }, [view, actor, leadsData.length, leadsLoading]);

  // Fetch reviews when Reviews tab is activated
  useEffect(() => {
    if (view === "reviews" && reviewsData.length === 0 && !reviewsLoading) {
      setReviewsLoading(true);
      const ba = actor as backendInterface;
      Promise.all([
        ba.getPendingReviews(ADMIN_EMAIL),
        ba.getApprovedReviews(),
        ba.getRejectedReviews(ADMIN_EMAIL),
      ])
        .then(([pending, approved, rejected]) => {
          const all = [...pending, ...approved, ...rejected];
          setReviewsData(all as unknown as Record<string, unknown>[]);
          setReviewsLoading(false);
        })
        .catch(() => setReviewsLoading(false));
    }
  }, [view, actor, reviewsData.length, reviewsLoading]);

  // Fetch conversion stats when Revenue tab is activated or date range changes
  useEffect(() => {
    if (view === "revenue" && actor) {
      const fromTs = revFromDate
        ? new Date(revFromDate).getTime() * 1_000_000
        : null;
      const toTs = revToDate ? new Date(revToDate).getTime() * 1_000_000 : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (actor as backendInterface)
        .getConversionStats(
          ADMIN_EMAIL,
          fromTs !== null ? BigInt(fromTs) : null,
          toTs !== null ? BigInt(toTs) : null,
        )
        .then(
          (stats: {
            totalLeads: bigint | number;
            convertedLeads: bigint | number;
            conversionRate: bigint | number;
          }) => {
            setConvStats({
              totalLeads: Number(stats.totalLeads),
              convertedLeads: Number(stats.convertedLeads),
              conversionRate: Number(stats.conversionRate),
            });
          },
        )
        .catch(() => {});
    }
  }, [view, actor, revFromDate, revToDate]);

  // ── Inline save handlers ──────────────────────────────────────────────────────
  async function handleSaveNotes(clientId: string, notes: string) {
    if (!actor) return;
    await (actor as backendInterface).updateClientNotes(
      clientId,
      notes,
      getAdminEmail(),
    );
    setClientRows((prev) =>
      prev.map((r) => (r.id === clientId ? { ...r, notes } : r)),
    );
  }

  async function handleSaveStatus(clientId: string, newStatus: string) {
    if (!actor) return;
    await (actor as backendInterface).updateClientStatus(
      getAdminEmail(),
      clientId,
      newStatus,
    );
    setClientRows((prev) =>
      prev.map((r) =>
        r.id === clientId ? { ...r, projectStatus: newStatus } : r,
      ),
    );
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    if (!actor) return;
    await (actor as backendInterface).markInvoicePaid(invoiceId, "");
    setAccountingRows((prev) =>
      prev.map((r) =>
        r.rowKey === `invoice-${invoiceId}` ? { ...r, status: "PAID" } : r,
      ),
    );
  }

  // ── Filtering + sorting ────────────────────────────────────────────────────────
  const filteredAcct = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    let rows = accountingRows.filter((r) => {
      if (q) {
        const match = [
          r.clientName,
          r.idOrInvoiceNum,
          r.descriptionOrTier,
          r.amount,
          r.status,
          r.date,
          r.rowType,
        ].some((v) => v.toLowerCase().includes(q));
        if (!match) return false;
      }
      const rowMs = r.dateRaw / 1_000_000;
      if (fromMs !== null && rowMs < fromMs) return false;
      if (toMs !== null && rowMs > toMs) return false;
      return true;
    });
    const { sortCol, sortDir } = acctSort;
    rows = [...rows].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortCol === "clientName") {
        av = a.clientName;
        bv = b.clientName;
      } else if (sortCol === "idOrInvoiceNum") {
        av = a.idOrInvoiceNum;
        bv = b.idOrInvoiceNum;
      } else if (sortCol === "descriptionOrTier") {
        av = a.descriptionOrTier;
        bv = b.descriptionOrTier;
      } else if (sortCol === "amount") {
        av = a.amountRaw;
        bv = b.amountRaw;
      } else if (sortCol === "status") {
        av = a.status;
        bv = b.status;
      } else if (sortCol === "date") {
        av = a.dateRaw;
        bv = b.dateRaw;
      } else if (sortCol === "rowType") {
        av = a.rowType;
        bv = b.rowType;
      }
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [accountingRows, search, dateFrom, dateTo, acctSort]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? clientRows.filter((r) =>
          [
            r.name,
            r.email,
            r.phone,
            r.source,
            r.projectStatus,
            r.activeServices,
            r.notes,
            r.joinDate,
          ].some((v) => String(v).toLowerCase().includes(q)),
        )
      : clientRows;
    const { sortCol, sortDir } = clientSort;
    rows = [...rows].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortCol === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortCol === "email") {
        av = a.email;
        bv = b.email;
      } else if (sortCol === "phone") {
        av = a.phone;
        bv = b.phone;
      } else if (sortCol === "source") {
        av = a.source;
        bv = b.source;
      } else if (sortCol === "projectStatus") {
        av = a.projectStatus;
        bv = b.projectStatus;
      } else if (sortCol === "activeServices") {
        av = a.activeServices;
        bv = b.activeServices;
      } else if (sortCol === "currentMilestone") {
        av = a.currentMilestone;
        bv = b.currentMilestone;
      } else if (sortCol === "joinDate") {
        av = a.joinDateRaw;
        bv = b.joinDateRaw;
      } else if (sortCol === "notes") {
        av = a.notes;
        bv = b.notes;
      }
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [clientRows, search, clientSort]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function parseLeadMsg(msg: string, field: string): string {
    try {
      const p = JSON.parse(msg) as Record<string, unknown>;
      return String(p[field] ?? "");
    } catch {
      return "";
    }
  }

  // ── Filtered / derived data ──────────────────────────────────────────────────
  const LEAD_STATUSES = [
    "New",
    "Contacted",
    "Qualified",
    "Closed",
    "Cancelled",
  ];

  const filteredLeads = leadsData
    .filter((l) => {
      const isDraft = Boolean(l.isDraft);
      const status = String(l.status ?? "");
      return !isDraft && LEAD_STATUSES.includes(status);
    })
    .filter(
      (l) =>
        leadStatusFilter === "All" || String(l.status) === leadStatusFilter,
    )
    .filter((l) => {
      if (!leadFromDate && !leadToDate) return true;
      const ts = Number(l.created_at) / 1_000_000;
      if (leadFromDate && ts < new Date(leadFromDate).getTime()) return false;
      if (leadToDate && ts > new Date(leadToDate).getTime() + 86400000)
        return false;
      return true;
    })
    .filter((l) => {
      if (!leadServiceFilter) return true;
      return (
        parseLeadMsg(String(l.message ?? ""), "service_type") ===
        leadServiceFilter
      );
    })
    .filter((l) => {
      if (!leadSearch) return true;
      const s = leadSearch.toLowerCase();
      const msg = String(l.message ?? "");
      return [
        String(l.name ?? ""),
        String(l.email ?? ""),
        String(l.status ?? ""),
        parseLeadMsg(msg, "service_type"),
        parseLeadMsg(msg, "industry"),
        parseLeadMsg(msg, "business_name"),
      ].some((v) => v.toLowerCase().includes(s));
    });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const col = leadSort.sortCol;
    const dir = leadSort.sortDir;
    let av: string | number = "";
    let bv: string | number = "";
    if (col === "name") {
      av = String(a.name ?? "");
      bv = String(b.name ?? "");
    } else if (col === "status") {
      av = String(a.status ?? "");
      bv = String(b.status ?? "");
    } else if (col === "created_at") {
      av = Number(a.created_at ?? 0);
      bv = Number(b.created_at ?? 0);
    }
    if (typeof av === "number" && typeof bv === "number")
      return dir === "asc" ? av - bv : bv - av;
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const filteredReviews = reviewsData.filter((r) => {
    if (!reviewSearch) return true;
    const s = reviewSearch.toLowerCase();
    const name = String(r.clientName ?? r.name ?? r.reviewer ?? "");
    const text = String(r.content ?? r.text ?? r.reviewText ?? "");
    return (
      name.toLowerCase().includes(s) ||
      text.toLowerCase().includes(s) ||
      String(r.status ?? "")
        .toLowerCase()
        .includes(s)
    );
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const col = reviewSort.sortCol;
    const dir = reviewSort.sortDir;
    let av: string | number = "";
    let bv: string | number = "";
    if (col === "clientName") {
      av = String(a.clientName ?? "");
      bv = String(b.clientName ?? "");
    } else if (col === "rating") {
      av = Number(a.rating ?? 0);
      bv = Number(b.rating ?? 0);
    } else if (col === "status") {
      av = String(a.status ?? "");
      bv = String(b.status ?? "");
    } else if (col === "createdAt") {
      av = Number(a.createdAt ?? 0);
      bv = Number(b.createdAt ?? 0);
    }
    if (typeof av === "number" && typeof bv === "number")
      return dir === "asc" ? av - bv : bv - av;
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getRevDateRange = () => {
    if (revMonth) {
      const year = new Date().getFullYear();
      const monthIndex = MONTHS.indexOf(revMonth);
      if (monthIndex >= 0) {
        const from = new Date(year, monthIndex, 1).getTime();
        const to = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime();
        return { from, to };
      }
    }
    if (revFromDate || revToDate) {
      return {
        from: revFromDate ? new Date(revFromDate).getTime() : 0,
        to: revToDate
          ? new Date(revToDate).getTime() + 86400000
          : Number.POSITIVE_INFINITY,
      };
    }
    return null;
  };

  const revRange = getRevDateRange();
  const paidRows = accountingRows.filter((r) =>
    (r.status ?? "").toLowerCase().includes("paid"),
  );
  const filteredPaidRows = revRange
    ? paidRows.filter((r) => {
        const ms = r.dateRaw / 1_000_000;
        return ms >= revRange.from && ms <= revRange.to;
      })
    : paidRows;
  const totalRevenue = filteredPaidRows.reduce(
    (sum, r) => sum + (r.amountRaw ?? 0),
    0,
  );
  const paidCount = filteredPaidRows.length;
  const unpaidRows = accountingRows
    .filter((r) =>
      ["pending", "unpaid", "overdue"].some((s) =>
        (r.status ?? "").toLowerCase().includes(s),
      ),
    )
    .sort((a, b) => (b.dateRaw ?? 0) - (a.dateRaw ?? 0));
  const outstandingTotal = unpaidRows.reduce(
    (sum, r) => sum + (r.amountRaw ?? 0),
    0,
  );

  const revYear = revFromDate
    ? new Date(revFromDate).getFullYear()
    : new Date().getFullYear();
  const monthlyRevenue = MONTHS.map((m, idx) => {
    const from = new Date(revYear, idx, 1).getTime();
    const to = new Date(revYear, idx + 1, 0, 23, 59, 59).getTime();
    const monthRows = paidRows.filter((r) => {
      const ms = r.dateRaw / 1_000_000;
      return ms >= from && ms <= to;
    });
    const total = monthRows.reduce((sum, r) => sum + (r.amountRaw ?? 0), 0);
    const inRange = revRange
      ? from >= revRange.from && to <= revRange.to
      : true;
    return { month: m, total, count: monthRows.length, inRange };
  });

  const uniqueServices = Array.from(
    new Set(
      leadsData
        .map((l) => parseLeadMsg(String(l.message ?? ""), "service_type"))
        .filter(Boolean),
    ),
  );
  const totalReviews = reviewsData.length;
  const approvedReviews = reviewsData.filter(
    (r) => String(r.status ?? "").toLowerCase() === "approved",
  ).length;
  const approvalPct =
    totalReviews > 0 ? Math.round((approvedReviews / totalReviews) * 100) : 0;

  // ── Google Sheets save/clear/sync handlers ─────────────────────────────────
  async function handleGssSave() {
    if (!actor || !gsScriptUrl.trim()) return;
    setGsSaving(true);
    setGsToast(null);
    try {
      const adminEmail = getAdminEmail();
      const result = await (actor as backendInterface).setGoogleSheetsConfig(
        { scriptUrl: gsScriptUrl.trim(), sheetId: gsSheetId.trim() },
        adminEmail,
      );
      if (result && "ok" in result) {
        setGsConfigured(true);
        setGsToast({ msg: "Configuration saved successfully.", ok: true });
      } else {
        const errMsg =
          result && "err" in result
            ? String((result as { err: string }).err)
            : "Save failed";
        setGsToast({ msg: errMsg, ok: false });
      }
    } catch {
      setGsToast({ msg: "Failed to save configuration.", ok: false });
    } finally {
      setGsSaving(false);
      setTimeout(() => setGsToast(null), 5000);
    }
  }

  async function handleGssClear() {
    if (!actor) return;
    setGsClearing(true);
    setGsToast(null);
    try {
      const adminEmail = getAdminEmail();
      await (actor as backendInterface).clearGoogleSheetsConfig(adminEmail);
      setGsScriptUrl("");
      setGsSheetId("");
      setGsConfigured(false);
      setGsToast({ msg: "Configuration cleared.", ok: true });
    } catch {
      setGsToast({ msg: "Failed to clear configuration.", ok: false });
    } finally {
      setGsClearing(false);
      setTimeout(() => setGsToast(null), 4000);
    }
  }

  async function syncToGoogleSheets(
    viewName: "Accounting" | "ClientList" | "Leads" | "Revenue",
    rows: (string | number)[][],
  ) {
    if (!gsScriptUrl || !gsConfigured) return;
    setGsSyncingView(viewName);
    setGsSyncToast(null);
    try {
      const body = JSON.stringify({ view: viewName, rows, sheetId: gsSheetId });
      const res = await fetch(gsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body,
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (json.success) {
        setGsSyncToast({ msg: "Synced to Google Sheets", ok: true });
      } else {
        setGsSyncToast({
          msg: `Sync failed: ${json.error ?? "Unknown error"}`,
          ok: false,
        });
      }
    } catch (e) {
      setGsSyncToast({
        msg: `Sync failed: ${e instanceof Error ? e.message : "Network error"}`,
        ok: false,
      });
    } finally {
      setGsSyncingView(null);
      setTimeout(() => setGsSyncToast(null), 5000);
    }
  }

  function buildAccountingSheetRows(): (string | number)[][] {
    const header = [
      "Type",
      "Client Name",
      "ID / Invoice #",
      "Description / Tier",
      "Amount",
      "Status",
      "Date",
    ];
    const data = filteredAcct.map((r) => [
      r.rowType,
      r.clientName,
      r.idOrInvoiceNum,
      r.descriptionOrTier,
      r.amount,
      r.status,
      r.date,
    ]);
    return [header, ...data];
  }

  function buildClientListSheetRows(): (string | number)[][] {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Source",
      "Project Status",
      "Active Services",
      "Current Milestone",
      "Join Date",
      "Notes",
    ];
    const data = filteredClients.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.source,
      r.projectStatus,
      r.activeServices,
      r.currentMilestone,
      r.joinDate,
      r.notes,
    ]);
    return [header, ...data];
  }

  function buildLeadsSheetRows(): (string | number)[][] {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Service",
      "Industry",
      "Meeting Type",
      "Meet Link",
      "Status",
      "Date",
      "Business Name",
      "Monthly Revenue",
      "Website URL",
    ];
    const data = sortedLeads.map((l) => [
      String(l.name ?? ""),
      String(l.email ?? ""),
      parseLeadMsg(String(l.message ?? ""), "contact_phone"),
      parseLeadMsg(String(l.message ?? ""), "service_type"),
      parseLeadMsg(String(l.message ?? ""), "industry"),
      String(l.meetingMethod ?? "") === "google_meet" ? "Video" : "Phone",
      String(l.meetLink ?? ""),
      String(l.status ?? ""),
      new Date(Number(l.created_at) / 1_000_000).toLocaleDateString(),
      parseLeadMsg(String(l.message ?? ""), "business_name"),
      parseLeadMsg(String(l.message ?? ""), "monthly_revenue"),
      parseLeadMsg(String(l.message ?? ""), "website_url"),
    ]);
    return [header, ...data];
  }

  function buildRevenueSheetRows(): (string | number)[][] {
    const rangeLabel = revMonth
      ? `${revMonth} ${revYear}`
      : revFromDate || revToDate
        ? `${revFromDate || "All"} to ${revToDate || "All"}`
        : "All Time";
    const summaryRows: (string | number)[][] = [
      ["Section", "Metric", "Value", "Detail"],
      ["Summary", "Date Range", rangeLabel, ""],
      [
        "Summary",
        "Total Revenue",
        formatMoney(totalRevenue),
        `${paidCount} paid invoice${paidCount !== 1 ? "s" : ""}`,
      ],
      [
        "Summary",
        "Outstanding",
        formatMoney(outstandingTotal),
        `${unpaidRows.length} unpaid invoice${unpaidRows.length !== 1 ? "s" : ""}`,
      ],
      ["Summary", "Paid Invoices", paidCount, "invoices settled"],
      [
        "Summary",
        "Conversion Rate",
        convStats ? `${convStats.conversionRate.toFixed(1)}%` : "N/A",
        convStats
          ? `${convStats.convertedLeads} of ${convStats.totalLeads} leads`
          : "",
      ],
      ["", "", "", ""],
    ];
    const chartRows: (string | number)[][] = [
      ["Chart - Monthly Revenue", `Year: ${revYear}`, "", ""],
      ["Month", "Revenue", "Invoices", "In Selected Range"],
      ...monthlyRevenue.map((m) => [
        m.month,
        formatMoney(m.total),
        m.count,
        m.inRange ? "Yes" : "No",
      ]),
      ["", "", "", ""],
    ];
    const outstandingRows: (string | number)[][] = [
      ["Outstanding Invoices", "", "", "", "", ""],
      [
        "Client Name",
        "ID / Invoice #",
        "Description",
        "Amount",
        "Date",
        "Status",
      ],
      ...unpaidRows.map((r) => [
        r.clientName,
        r.idOrInvoiceNum,
        r.descriptionOrTier,
        r.amount,
        r.date,
        r.status,
      ]),
    ];
    return [...summaryRows, ...chartRows, ...outstandingRows];
  }

  // ── Excel export ──────────────────────────────────────────────────────────────
  function handleExport() {
    if (view === "revenue") {
      const rangeLabel = revMonth
        ? `${revMonth} ${revYear}`
        : revFromDate || revToDate
          ? `${revFromDate || "All"} to ${revToDate || "All"}`
          : "All Time";
      const wb = XLSX.utils.book_new();
      const summaryData = [
        {
          Section: "Summary",
          Metric: "Date Range",
          Value: rangeLabel,
          Detail: "",
        },
        {
          Section: "Summary",
          Metric: "Total Revenue",
          Value: formatMoney(totalRevenue),
          Detail: `${paidCount} paid invoice${paidCount !== 1 ? "s" : ""}`,
        },
        {
          Section: "Summary",
          Metric: "Outstanding",
          Value: formatMoney(outstandingTotal),
          Detail: `${unpaidRows.length} unpaid invoice${unpaidRows.length !== 1 ? "s" : ""}`,
        },
        {
          Section: "Summary",
          Metric: "Paid Invoices",
          Value: String(paidCount),
          Detail: "invoices settled",
        },
        {
          Section: "Summary",
          Metric: "Conversion Rate",
          Value: convStats ? `${convStats.conversionRate.toFixed(1)}%` : "N/A",
          Detail: convStats
            ? `${convStats.convertedLeads} of ${convStats.totalLeads} leads`
            : "",
        },
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(summaryData),
        "Summary",
      );
      const chartData = monthlyRevenue.map((m) => ({
        Month: `${m.month} ${revYear}`,
        Revenue: formatMoney(m.total),
        "Paid Invoices": m.count,
        "In Selected Range": m.inRange ? "Yes" : "No",
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(chartData),
        "Monthly Revenue",
      );
      if (unpaidRows.length > 0) {
        const outstandingData = unpaidRows.map((r) => ({
          "Client Name": r.clientName,
          "ID / Invoice #": r.idOrInvoiceNum,
          Description: r.descriptionOrTier,
          Amount: r.amount,
          Date: r.date,
          Status: r.status,
        }));
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(outstandingData),
          "Outstanding Invoices",
        );
      }
      XLSX.writeFile(wb, "Imperidome_Revenue.xlsx");
      return;
    }
    if (view === "leads") {
      const rows = sortedLeads.map((l) => ({
        Name: String(l.name ?? ""),
        Email: String(l.email ?? ""),
        Phone: parseLeadMsg(String(l.message ?? ""), "contact_phone"),
        Service: parseLeadMsg(String(l.message ?? ""), "service_type"),
        Industry: parseLeadMsg(String(l.message ?? ""), "industry"),
        "Meeting Type":
          String(l.meetingMethod ?? "") === "google_meet" ? "Video" : "Phone",
        "Meet Link": String(l.meetLink ?? ""),
        Status: String(l.status ?? ""),
        Date: new Date(Number(l.created_at) / 1_000_000).toLocaleDateString(),
        "Business Name": parseLeadMsg(String(l.message ?? ""), "business_name"),
        "Monthly Revenue": parseLeadMsg(
          String(l.message ?? ""),
          "monthly_revenue",
        ),
        "Website URL": parseLeadMsg(String(l.message ?? ""), "website_url"),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Leads");
      XLSX.writeFile(wb, "Imperidome_Leads.xlsx");
      return;
    }
    if (view === "reviews") {
      const rows = sortedReviews.map((r) => ({
        "Client Name": String(r.clientName ?? r.name ?? r.reviewer ?? ""),
        Rating: Number(r.rating ?? 0),
        "Review Text": String(r.content ?? r.text ?? r.reviewText ?? ""),
        Status: String(r.status ?? ""),
        "Date Submitted": r.createdAt
          ? new Date(Number(r.createdAt) / 1_000_000).toLocaleDateString()
          : "",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(rows),
        "Reviews",
      );
      XLSX.writeFile(wb, "Imperidome_Reviews.xlsx");
      return;
    }
    if (view === "accounting") {
      const data = filteredAcct.map((r) => ({
        Type: r.rowType,
        "Client Name": r.clientName,
        "ID / Invoice #": r.idOrInvoiceNum,
        "Description / Tier": r.descriptionOrTier,
        Amount: r.amount,
        Status: r.status,
        Date: r.date,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Accounting");
      XLSX.writeFile(wb, "Imperidome_Accounting.xlsx");
    } else {
      const data = filteredClients.map((r) => ({
        Name: r.name,
        Email: r.email,
        Phone: r.phone,
        Source: r.source,
        "Project Status": r.projectStatus,
        "Active Services": r.activeServices,
        "Current Milestone": r.currentMilestone,
        "Join Date": r.joinDate,
        Notes: r.notes,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Client List");
      XLSX.writeFile(wb, "Imperidome_ClientList.xlsx");
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────────
  const CARD: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    border: "1px solid #1C1F33",
    borderRadius: 8,
  };

  const loading = view === "accounting" ? acctLoading : clientsLoading;
  const error = view === "accounting" ? acctError : clientsError;
  const totalRows =
    view === "accounting" ? accountingRows.length : clientRows.length;
  const visibleRows =
    view === "accounting" ? filteredAcct.length : filteredClients.length;

  // ── Tools: Calculator state ────────────────────────────────────────────────
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcExpr, setCalcExpr] = useState("");
  const [calcJustEvaled, setCalcJustEvaled] = useState(false);

  function calcInput(ch: string) {
    setCalcDisplay((prev) => {
      if (calcJustEvaled) {
        setCalcJustEvaled(false);
        if ("+−×÷".includes(ch)) {
          setCalcExpr(`${prev} ${ch} `);
          return prev;
        }
        setCalcExpr("");
        return ch === "." ? "0." : ch;
      }
      if (ch === ".") {
        // Only one decimal per number segment
        const parts = prev.split(/[+\-×÷]/);
        const last = parts[parts.length - 1];
        if (last.includes(".")) return prev;
        return prev === "0" ? "0." : `${prev}.`;
      }
      if (prev === "0") return ch;
      return prev + ch;
    });
  }

  function calcOperator(op: string) {
    setCalcJustEvaled(false);
    setCalcDisplay((prev) => {
      const raw = prev.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      try {
        const result = Function(`"use strict"; return (${raw})`)() as number;
        const rs = String(result);
        setCalcExpr(`${rs} ${op} `);
        return rs;
      } catch {
        setCalcExpr(`${prev} ${op} `);
        return prev;
      }
    });
  }

  function calcEquals() {
    setCalcDisplay((prev) => {
      const full = calcExpr + prev;
      const raw = full.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      try {
        const result = Function(`"use strict"; return (${raw})`)() as number;
        const rs = Number.parseFloat(result.toFixed(10)).toString();
        setCalcExpr(`${full} =`);
        setCalcJustEvaled(true);
        return rs;
      } catch {
        setCalcExpr("");
        setCalcJustEvaled(false);
        return "Error";
      }
    });
  }

  function calcPercent() {
    setCalcDisplay((prev) => {
      const n = Number.parseFloat(prev);
      if (Number.isNaN(n)) return prev;
      return String(n / 100);
    });
    setCalcJustEvaled(false);
  }

  function calcClear() {
    setCalcDisplay("0");
    setCalcExpr("");
    setCalcJustEvaled(false);
  }

  function calcBackspace() {
    setCalcDisplay((prev) => {
      if (prev.length <= 1 || prev === "Error") return "0";
      return prev.slice(0, -1);
    });
    setCalcJustEvaled(false);
  }

  // ── Tools: Notes state ─────────────────────────────────────────────────────
  const NOTES_KEY = "imperidome_spreadsheet_notes";
  const [scratchNotes, setScratchNotes] = useState<string>(
    () => localStorage.getItem(NOTES_KEY) ?? "",
  );
  const [notesClearStep, setNotesClearStep] = useState(false);

  function handleNotesChange(val: string) {
    setScratchNotes(val);
    localStorage.setItem(NOTES_KEY, val);
  }

  function handleClearNotes() {
    if (!notesClearStep) {
      setNotesClearStep(true);
      return;
    }
    setScratchNotes("");
    localStorage.removeItem(NOTES_KEY);
    setNotesClearStep(false);
  }

  return (
    <AdminLayout pageTitle="Spreadsheet">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .spreadsheet-tab-row { display: none !important; }
          .spreadsheet-tab-hamburger { display: flex !important; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ── Header bar ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Mobile hamburger button — visible only below 768px */}
          <button
            type="button"
            data-ocid="spreadsheet.tab_menu.open_button"
            aria-label="Open view menu"
            onClick={() => setTabMenuOpen(true)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1px solid #1C1F33",
              borderRadius: 8,
              background: "rgba(17,19,34,0.7)",
              color: "#5EF08A",
              padding: "0 16px",
              height: 44,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
            className="spreadsheet-tab-hamburger"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
            <span style={{ fontSize: 13 }}>
              {view === "accounting" && "💰 Accounting"}
              {view === "clients" && "👤 Client List"}
              {view === "tools" && "🔧 Tools"}
              {view === "leads" && "📋 Leads"}
              {view === "reviews" && "⭐ Reviews"}
              {view === "revenue" && "📈 Revenue"}
              {view === "gsheets" && "⚙ Google Sheets"}
            </span>
          </button>

          {/* View toggle — hidden below 768px */}
          <div
            className="spreadsheet-tab-row"
            style={{
              display: "flex",
              gap: 0,
              border: "1px solid #1C1F33",
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
            }}
          >
            {(
              [
                "accounting",
                "clients",
                "tools",
                "leads",
                "reviews",
                "revenue",
                "gsheets",
              ] as View[]
            ).map((v) => (
              <button
                key={v}
                type="button"
                data-ocid={`spreadsheet.view.${v}.tab`}
                onClick={() => {
                  setView(v);
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                  setNotesClearStep(false);
                }}
                style={{
                  border: "none",
                  padding: "0 20px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  background:
                    view === v ? "rgba(94,240,138,0.15)" : "transparent",
                  color: view === v ? "#5EF08A" : "#7A7D90",
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {v === "accounting" && "💰 Accounting"}
                {v === "clients" && "👤 Client List"}
                {v === "tools" && (
                  <>
                    <Wrench size={13} />
                    Tools
                  </>
                )}
                {v === "leads" && "📋 Leads"}
                {v === "reviews" && "⭐ Reviews"}
                {v === "revenue" && "📈 Revenue"}
                {v === "gsheets" && (
                  <>
                    <Settings size={13} />
                    Google Sheets
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Row count — only for data views */}
          {(view === "accounting" || view === "clients") && (
            <span
              data-ocid="spreadsheet.row_count"
              style={{
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.2)",
                color: "#5EF08A",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Showing {visibleRows} of {totalRows} rows
            </span>
          )}
        </div>

        {/* ── Toolbar — hidden in Tools view ────────────────────────── */}
        {(view === "accounting" || view === "clients") && (
          <div
            style={{
              ...CARD,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Date range filter — Accounting view only */}
            {view === "accounting" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <label
                    htmlFor="spreadsheet-date-from"
                    style={{
                      fontSize: 12,
                      color: "#7A7D90",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    From
                  </label>
                  <input
                    id="spreadsheet-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    data-ocid="spreadsheet.date_from_input"
                    style={{
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                      padding: "7px 10px",
                      fontSize: 13,
                      color: dateFrom ? "#EEF0F8" : "#7A7D90",
                      background: "rgba(19,21,36,1)",
                      outline: "none",
                      height: 40,
                      boxSizing: "border-box" as const,
                      colorScheme: "dark",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <label
                    htmlFor="spreadsheet-date-to"
                    style={{
                      fontSize: 12,
                      color: "#7A7D90",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    To
                  </label>
                  <input
                    id="spreadsheet-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    data-ocid="spreadsheet.date_to_input"
                    style={{
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                      padding: "7px 10px",
                      fontSize: 13,
                      color: dateTo ? "#EEF0F8" : "#7A7D90",
                      background: "rgba(19,21,36,1)",
                      outline: "none",
                      height: 40,
                      boxSizing: "border-box" as const,
                      colorScheme: "dark",
                    }}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    data-ocid="spreadsheet.date_clear_button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                    style={{
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                      padding: "0 12px",
                      height: 40,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7A7D90",
                      background: "transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Clear dates
                  </button>
                )}
              </>
            )}

            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search
                size={15}
                color="#7A7D90"
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                data-ocid="spreadsheet.search_input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  view === "accounting"
                    ? "Filter by client, invoice, status…"
                    : "Filter by name, email, phone…"
                }
                style={{
                  width: "100%",
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  padding: "9px 13px 9px 34px",
                  fontSize: 14,
                  color: "#EEF0F8",
                  background: "rgba(19,21,36,1)",
                  outline: "none",
                  height: 40,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Sync + Export buttons */}
            {gsConfigured && view === "accounting" && (
              <button
                type="button"
                data-ocid="spreadsheet.accounting.sync.button"
                onClick={() =>
                  syncToGoogleSheets("Accounting", buildAccountingSheetRows())
                }
                disabled={
                  loading || visibleRows === 0 || gsSyncingView === "Accounting"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "transparent",
                  color: loading || visibleRows === 0 ? "#3A3D50" : "#7A7D90",
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  padding: "0 14px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    loading || visibleRows === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation:
                      gsSyncingView === "Accounting"
                        ? "spin 1s linear infinite"
                        : undefined,
                  }}
                />
                {gsSyncingView === "Accounting"
                  ? "Syncing..."
                  : "Sync to Google Sheets"}
              </button>
            )}
            {gsConfigured && view === "clients" && (
              <button
                type="button"
                data-ocid="spreadsheet.clients.sync.button"
                onClick={() =>
                  syncToGoogleSheets("ClientList", buildClientListSheetRows())
                }
                disabled={
                  loading || visibleRows === 0 || gsSyncingView === "ClientList"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "transparent",
                  color: loading || visibleRows === 0 ? "#3A3D50" : "#7A7D90",
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  padding: "0 14px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    loading || visibleRows === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation:
                      gsSyncingView === "ClientList"
                        ? "spin 1s linear infinite"
                        : undefined,
                  }}
                />
                {gsSyncingView === "ClientList"
                  ? "Syncing..."
                  : "Sync to Google Sheets"}
              </button>
            )}
            <button
              type="button"
              data-ocid="spreadsheet.export.button"
              onClick={handleExport}
              disabled={loading || visibleRows === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background:
                  loading || visibleRows === 0
                    ? "rgba(94,240,138,0.2)"
                    : "rgba(94,240,138,0.9)",
                color: loading || visibleRows === 0 ? "#3A5A40" : "#061209",
                border: "none",
                borderRadius: 6,
                padding: "0 16px",
                height: 40,
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  loading || visibleRows === 0 ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <Download size={14} />
              Export to Excel
            </button>
            <button
              type="button"
              aria-label="Excel export instructions"
              onClick={() => setShowExcelHelp(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#9ca3af",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#5EF08A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
              }}
            >
              ?
            </button>
          </div>
        )}

        {/* Google Sheets Tab */}
        {view === "gsheets" && (
          <GoogleSheetsPanel
            scriptUrl={gsScriptUrl}
            sheetId={gsSheetId}
            configured={gsConfigured}
            saving={gsSaving}
            clearing={gsClearing}
            toast={gsToast}
            onScriptUrlChange={setGsScriptUrl}
            onSheetIdChange={setGsSheetId}
            onSave={handleGssSave}
            onClear={handleGssClear}
            onShowHelp={() => setShowGSheetsHelp(true)}
          />
        )}

        {/* Sync toast */}
        {gsSyncToast && (
          <div
            data-ocid="spreadsheet.gsheets.sync_toast"
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              zIndex: 9999,
              background: gsSyncToast.ok
                ? "rgba(17,34,22,0.97)"
                : "rgba(34,17,17,0.97)",
              border: `1px solid ${gsSyncToast.ok ? "rgba(94,240,138,0.4)" : "rgba(239,68,68,0.4)"}`,
              borderRadius: 10,
              padding: "14px 20px",
              color: gsSyncToast.ok ? "#5EF08A" : "#f87171",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              maxWidth: 360,
            }}
          >
            {gsSyncToast.ok ? "✓ " : "✕ "}
            {gsSyncToast.msg}
          </div>
        )}

        {/* Tools view */}
        {view === "tools" && (
          <ToolsPanel
            calcDisplay={calcDisplay}
            calcExpr={calcExpr}
            onCalcInput={calcInput}
            onCalcOperator={calcOperator}
            onCalcEquals={calcEquals}
            onCalcPercent={calcPercent}
            onCalcClear={calcClear}
            onCalcBackspace={calcBackspace}
            scratchNotes={scratchNotes}
            onNotesChange={handleNotesChange}
            notesClearStep={notesClearStep}
            onClearNotes={handleClearNotes}
            onClearCancel={() => setNotesClearStep(false)}
          />
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {(view === "accounting" || view === "clients") && error && (
          <div
            data-ocid="spreadsheet.error_state"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Table (Accounting / Clients) ─────────────────────────── */}
        {(view === "accounting" || view === "clients") && (
          <div
            style={{ ...CARD, padding: 0, overflowX: "auto" }}
            data-ocid="spreadsheet.table"
          >
            {view === "accounting" ? (
              <AccountingTable
                rows={filteredAcct}
                loading={acctLoading}
                sortCol={acctSort.sortCol}
                sortDir={acctSort.sortDir}
                onSort={acctSort.handleSort}
                onMarkPaid={handleMarkInvoicePaid}
                hasDateFilter={!!(dateFrom || dateTo)}
              />
            ) : (
              <ClientListTable
                rows={filteredClients}
                loading={clientsLoading}
                sortCol={clientSort.sortCol}
                sortDir={clientSort.sortDir}
                onSort={clientSort.handleSort}
                onSaveNotes={handleSaveNotes}
                onSaveStatus={handleSaveStatus}
              />
            )}
          </div>
        )}

        {/* ── Leads Tab ─────────────────────────────────────────────── */}
        {view === "leads" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                ...CARD,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["All", ...LEAD_STATUSES].map((s) => (
                  <button
                    key={s}
                    type="button"
                    data-ocid={`spreadsheet.leads.filter.${s.toLowerCase()}`}
                    onClick={() => setLeadStatusFilter(s)}
                    style={{
                      border: `1px solid ${leadStatusFilter === s ? "rgba(94,240,138,0.5)" : "#1C1F33"}`,
                      borderRadius: 20,
                      padding: "3px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background:
                        leadStatusFilter === s
                          ? "rgba(94,240,138,0.12)"
                          : "transparent",
                      color: leadStatusFilter === s ? "#5EF08A" : "#7A7D90",
                      whiteSpace: "nowrap" as const,
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  htmlFor="lead-date-from"
                  style={{
                    fontSize: 12,
                    color: "#7A7D90",
                    whiteSpace: "nowrap" as const,
                    fontWeight: 600,
                  }}
                >
                  From
                </label>
                <input
                  id="lead-date-from"
                  type="date"
                  value={leadFromDate}
                  onChange={(e) => setLeadFromDate(e.target.value)}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: leadFromDate ? "#EEF0F8" : "#7A7D90",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    boxSizing: "border-box" as const,
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  htmlFor="lead-date-to"
                  style={{
                    fontSize: 12,
                    color: "#7A7D90",
                    whiteSpace: "nowrap" as const,
                    fontWeight: 600,
                  }}
                >
                  To
                </label>
                <input
                  id="lead-date-to"
                  type="date"
                  value={leadToDate}
                  onChange={(e) => setLeadToDate(e.target.value)}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: leadToDate ? "#EEF0F8" : "#7A7D90",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    boxSizing: "border-box" as const,
                    colorScheme: "dark",
                  }}
                />
              </div>
              {uniqueServices.length > 0 && (
                <select
                  value={leadServiceFilter}
                  onChange={(e) => setLeadServiceFilter(e.target.value)}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 13,
                    color: "#EEF0F8",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    cursor: "pointer",
                  }}
                >
                  <option value="">All Services</option>
                  {uniqueServices.map((s) => (
                    <option key={s} value={s} style={{ background: "#0E1020" }}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
              <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                <Search
                  size={15}
                  color="#7A7D90"
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  data-ocid="spreadsheet.leads.search_input"
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search leads…"
                  style={{
                    width: "100%",
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "9px 13px 9px 34px",
                    fontSize: 14,
                    color: "#EEF0F8",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>
              {gsConfigured && (
                <button
                  type="button"
                  data-ocid="spreadsheet.leads.sync.button"
                  onClick={() =>
                    syncToGoogleSheets("Leads", buildLeadsSheetRows())
                  }
                  disabled={
                    sortedLeads.length === 0 || gsSyncingView === "Leads"
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "transparent",
                    color: sortedLeads.length === 0 ? "#3A3D50" : "#7A7D90",
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "0 14px",
                    height: 40,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      sortedLeads.length === 0 ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <RefreshCw
                    size={13}
                    style={{
                      animation:
                        gsSyncingView === "Leads"
                          ? "spin 1s linear infinite"
                          : undefined,
                    }}
                  />
                  {gsSyncingView === "Leads"
                    ? "Syncing..."
                    : "Sync to Google Sheets"}
                </button>
              )}
              <button
                type="button"
                data-ocid="spreadsheet.leads.export.button"
                onClick={handleExport}
                disabled={sortedLeads.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background:
                    sortedLeads.length === 0
                      ? "rgba(94,240,138,0.2)"
                      : "rgba(94,240,138,0.9)",
                  color: sortedLeads.length === 0 ? "#3A5A40" : "#061209",
                  border: "none",
                  borderRadius: 6,
                  padding: "0 16px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: sortedLeads.length === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap" as const,
                  flexShrink: 0,
                }}
              >
                <Download size={14} /> Export to Excel
              </button>
              <button
                type="button"
                aria-label="Excel export instructions"
                onClick={() => setShowExcelHelp(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#9ca3af",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#5EF08A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#9ca3af";
                }}
              >
                ?
              </button>
            </div>
            <div
              style={{ ...CARD, padding: 0, overflowX: "auto" }}
              data-ocid="spreadsheet.leads.table"
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 1100,
                }}
              >
                <thead>
                  <tr>
                    {[
                      { key: "name", label: "Name" },
                      { key: "status", label: "Status" },
                      { key: "service", label: "Service" },
                      { key: "meetingMethod", label: "Type" },
                      { key: "meetLink", label: "Meet Link" },
                      { key: "industry", label: "Industry" },
                      { key: "businessName", label: "Business" },
                      { key: "monthlyRevenue", label: "Revenue" },
                      { key: "websiteUrl", label: "Website" },
                      { key: "phone", label: "Phone" },
                      { key: "created_at", label: "Date" },
                    ].map((c) => (
                      <SortableTH
                        key={c.key}
                        label={c.label}
                        col={c.key}
                        sortCol={leadSort.sortCol}
                        sortDir={leadSort.sortDir}
                        onSort={leadSort.handleSort}
                      />
                    ))}
                    <th
                      scope="col"
                      style={{
                        padding: "11px 10px",
                        borderBottom: "1px solid #1C1F33",
                        background: "rgba(14,16,32,0.9)",
                        position: "sticky" as const,
                        top: 0,
                        width: 36,
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {leadsLoading ? (
                    <SkeletonRows cols={12} />
                  ) : sortedLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        data-ocid="spreadsheet.leads.empty_state"
                        style={{ padding: "60px 20px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Table2 size={32} color="#3A3D50" />
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: 14,
                              margin: 0,
                            }}
                          >
                            No leads match the current filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedLeads.map((l, idx) => {
                      const msg = String(l.message ?? "");
                      const service = parseLeadMsg(msg, "service_type");
                      const industry = parseLeadMsg(msg, "industry");
                      const businessName = parseLeadMsg(msg, "business_name");
                      const monthlyRevenue = parseLeadMsg(
                        msg,
                        "monthly_revenue",
                      );
                      const websiteUrl = parseLeadMsg(msg, "website_url");
                      const phone = parseLeadMsg(msg, "contact_phone");
                      const isVideo =
                        String(l.meetingMethod ?? "") === "google_meet";
                      const meetLink = String(l.meetLink ?? "");
                      const dateMs = Number(l.created_at ?? 0) / 1_000_000;
                      const dateStr = new Date(dateMs).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      );
                      return (
                        <tr
                          key={String(l.id ?? idx)}
                          data-ocid={`spreadsheet.leads.item.${idx + 1}`}
                          style={{
                            borderBottom: "1px solid #1C1F33",
                            background:
                              idx % 2 === 1
                                ? "rgba(255,255,255,0.018)"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              fontWeight: 600,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {String(l.name ?? "—")}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <StatusBadge status={String(l.status ?? "")} />
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {service || "—"}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {isVideo ? "📹 Video" : "📞 Phone"}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            {meetLink ? (
                              <a
                                href={meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "3px 10px",
                                  fontSize: 11,
                                  background: "rgba(99,102,241,0.2)",
                                  border: "1px solid rgba(99,102,241,0.4)",
                                  borderRadius: 5,
                                  color: "#818cf8",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap" as const,
                                  fontWeight: 700,
                                }}
                              >
                                Join Meet
                              </a>
                            ) : (
                              <span style={{ color: "#3A3D50" }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                            }}
                          >
                            {industry || "—"}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                            }}
                          >
                            {businessName || "—"}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                            }}
                          >
                            {monthlyRevenue || "—"}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                              maxWidth: 140,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {websiteUrl ? (
                              <a
                                href={
                                  websiteUrl.startsWith("http")
                                    ? websiteUrl
                                    : `https://${websiteUrl}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#60a5fa",
                                  textDecoration: "none",
                                }}
                              >
                                {websiteUrl}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {phone || "—"}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#7A7D90",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {dateStr}
                          </td>
                          <td
                            style={{
                              padding: "11px 10px",
                              textAlign: "center",
                            }}
                          >
                            <CopyButton
                              getText={() =>
                                [
                                  String(l.name ?? ""),
                                  String(l.status ?? ""),
                                  service,
                                  isVideo ? "Video" : "Phone",
                                  meetLink,
                                  industry,
                                  businessName,
                                  monthlyRevenue,
                                  websiteUrl,
                                  phone,
                                  dateStr,
                                ].join("\t")
                              }
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Reviews Tab ───────────────────────────────────────────── */}
        {view === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "rgba(17,19,34,0.7)",
                border: "1px solid #1C1F33",
                borderRadius: 8,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <div>
                  <div
                    style={{ fontSize: 20, fontWeight: 800, color: "#5EF08A" }}
                  >
                    {totalReviews === 0
                      ? "No reviews yet"
                      : `${approvalPct}% Approved`}
                  </div>
                  {totalReviews > 0 && (
                    <div
                      style={{ fontSize: 13, color: "#7A7D90", marginTop: 2 }}
                    >
                      {approvedReviews} of {totalReviews} reviews approved
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <Search
                    size={15}
                    color="#7A7D90"
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    data-ocid="spreadsheet.reviews.search_input"
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Search reviews…"
                    style={{
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                      padding: "9px 13px 9px 34px",
                      fontSize: 14,
                      color: "#EEF0F8",
                      background: "rgba(19,21,36,1)",
                      outline: "none",
                      height: 40,
                      boxSizing: "border-box" as const,
                      width: 220,
                    }}
                  />
                </div>
                <button
                  type="button"
                  data-ocid="spreadsheet.reviews.export.button"
                  onClick={handleExport}
                  disabled={sortedReviews.length === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background:
                      sortedReviews.length === 0
                        ? "rgba(94,240,138,0.2)"
                        : "rgba(94,240,138,0.9)",
                    color: sortedReviews.length === 0 ? "#3A5A40" : "#061209",
                    border: "none",
                    borderRadius: 6,
                    padding: "0 16px",
                    height: 40,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      sortedReviews.length === 0 ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                  }}
                >
                  <Download size={14} /> Export to Excel
                </button>
                <button
                  type="button"
                  aria-label="Excel export instructions"
                  onClick={() => setShowExcelHelp(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#5EF08A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#9ca3af";
                  }}
                >
                  ?
                </button>
              </div>
            </div>
            <div
              style={{ ...CARD, padding: 0, overflowX: "auto" }}
              data-ocid="spreadsheet.reviews.table"
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 800,
                }}
              >
                <thead>
                  <tr>
                    {[
                      { key: "clientName", label: "Client Name" },
                      { key: "rating", label: "Rating" },
                      { key: "reviewText", label: "Review" },
                      { key: "status", label: "Status" },
                      { key: "createdAt", label: "Date" },
                    ].map((c) => (
                      <SortableTH
                        key={c.key}
                        label={c.label}
                        col={c.key}
                        sortCol={reviewSort.sortCol}
                        sortDir={reviewSort.sortDir}
                        onSort={reviewSort.handleSort}
                      />
                    ))}
                    <th
                      scope="col"
                      style={{
                        padding: "11px 10px",
                        borderBottom: "1px solid #1C1F33",
                        background: "rgba(14,16,32,0.9)",
                        position: "sticky" as const,
                        top: 0,
                        width: 36,
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {reviewsLoading ? (
                    <SkeletonRows cols={6} />
                  ) : sortedReviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        data-ocid="spreadsheet.reviews.empty_state"
                        style={{ padding: "60px 20px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Table2 size={32} color="#3A3D50" />
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: 14,
                              margin: 0,
                            }}
                          >
                            No reviews found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedReviews.map((r, idx) => {
                      const name = String(
                        r.clientName ?? r.name ?? r.reviewer ?? "—",
                      );
                      const rating = Number(r.rating ?? 0);
                      const text = String(
                        r.content ?? r.text ?? r.reviewText ?? "",
                      );
                      const status = String(r.status ?? "");
                      const dateMs = r.createdAt
                        ? Number(r.createdAt) / 1_000_000
                        : 0;
                      const dateStr = dateMs
                        ? new Date(dateMs).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—";
                      const stars =
                        "★".repeat(rating) +
                        "☆".repeat(Math.max(0, 5 - rating));
                      const truncated =
                        text.length > 80 ? `${text.slice(0, 80)}…` : text;
                      return (
                        <tr
                          key={String(r.id ?? idx)}
                          data-ocid={`spreadsheet.reviews.item.${idx + 1}`}
                          style={{
                            borderBottom: "1px solid #1C1F33",
                            background:
                              idx % 2 === 1
                                ? "rgba(255,255,255,0.018)"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              fontWeight: 600,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {name}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 15,
                              color: "#fbbf24",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {stars}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#9DA0B3",
                              maxWidth: 300,
                            }}
                            title={text}
                          >
                            {truncated || (
                              <span style={{ color: "#3A3D50" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <StatusBadge status={status} />
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#7A7D90",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {dateStr}
                          </td>
                          <td
                            style={{
                              padding: "11px 10px",
                              textAlign: "center",
                            }}
                          >
                            <CopyButton
                              getText={() =>
                                [name, stars, text, status, dateStr].join("\t")
                              }
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Revenue Tab ───────────────────────────────────────────── */}
        {view === "revenue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                ...CARD,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  htmlFor="rev-date-from"
                  style={{
                    fontSize: 12,
                    color: "#7A7D90",
                    whiteSpace: "nowrap" as const,
                    fontWeight: 600,
                  }}
                >
                  From
                </label>
                <input
                  id="rev-date-from"
                  type="date"
                  value={revFromDate}
                  onChange={(e) => {
                    setRevFromDate(e.target.value);
                    setRevMonth("");
                  }}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: revFromDate ? "#EEF0F8" : "#7A7D90",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    boxSizing: "border-box" as const,
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  htmlFor="rev-date-to"
                  style={{
                    fontSize: 12,
                    color: "#7A7D90",
                    whiteSpace: "nowrap" as const,
                    fontWeight: 600,
                  }}
                >
                  To
                </label>
                <input
                  id="rev-date-to"
                  type="date"
                  value={revToDate}
                  onChange={(e) => {
                    setRevToDate(e.target.value);
                    setRevMonth("");
                  }}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: revToDate ? "#EEF0F8" : "#7A7D90",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    boxSizing: "border-box" as const,
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  htmlFor="rev-month"
                  style={{
                    fontSize: 12,
                    color: "#7A7D90",
                    whiteSpace: "nowrap" as const,
                    fontWeight: 600,
                  }}
                >
                  Month
                </label>
                <select
                  id="rev-month"
                  value={revMonth}
                  onChange={(e) => {
                    setRevMonth(e.target.value);
                    setRevFromDate("");
                    setRevToDate("");
                  }}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 13,
                    color: revMonth ? "#EEF0F8" : "#7A7D90",
                    background: "rgba(19,21,36,1)",
                    outline: "none",
                    height: 40,
                    cursor: "pointer",
                  }}
                >
                  <option value="">All Months</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m} style={{ background: "#0E1020" }}>
                      {m} {revYear}
                    </option>
                  ))}
                </select>
              </div>
              {(revFromDate || revToDate || revMonth) && (
                <button
                  type="button"
                  onClick={() => {
                    setRevFromDate("");
                    setRevToDate("");
                    setRevMonth("");
                  }}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "0 12px",
                    height: 40,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7A7D90",
                    background: "transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  Clear All
                </button>
              )}
              {/* Revenue sync + export buttons */}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {gsConfigured && (
                  <button
                    type="button"
                    data-ocid="spreadsheet.revenue.sync.button"
                    onClick={() =>
                      syncToGoogleSheets("Revenue", buildRevenueSheetRows())
                    }
                    disabled={gsSyncingView === "Revenue"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: "transparent",
                      color: "#7A7D90",
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                      padding: "0 14px",
                      height: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap" as const,
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    <RefreshCw
                      size={13}
                      style={{
                        animation:
                          gsSyncingView === "Revenue"
                            ? "spin 1s linear infinite"
                            : undefined,
                      }}
                    />
                    {gsSyncingView === "Revenue"
                      ? "Syncing..."
                      : "Sync to Google Sheets"}
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="spreadsheet.revenue.export.button"
                  onClick={handleExport}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "rgba(94,240,138,0.9)",
                    color: "#061209",
                    border: "none",
                    borderRadius: 6,
                    padding: "0 16px",
                    height: 40,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <Download size={14} />
                  Export to Excel
                </button>
                <button
                  type="button"
                  aria-label="Excel export instructions"
                  onClick={() => setShowExcelHelp(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#5EF08A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#9ca3af";
                  }}
                >
                  ?
                </button>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
              }}
            >
              {[
                {
                  label: "Total Revenue",
                  value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  color: "#5EF08A",
                  sub: `${paidCount} paid invoice${paidCount !== 1 ? "s" : ""}`,
                },
                {
                  label: "Outstanding",
                  value: `$${outstandingTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  color: "#f87171",
                  sub: `${unpaidRows.length} unpaid invoice${unpaidRows.length !== 1 ? "s" : ""}`,
                },
                {
                  label: "Paid Invoices",
                  value: String(paidCount),
                  color: "#60a5fa",
                  sub: "invoices settled",
                },
                {
                  label: "Conversion Rate",
                  value: convStats
                    ? `${convStats.conversionRate.toFixed(1)}%`
                    : "—",
                  color: "#fbbf24",
                  sub: convStats
                    ? `${convStats.convertedLeads} of ${convStats.totalLeads} leads`
                    : "Loading…",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "rgba(17,19,34,0.7)",
                    border: "1px solid #1C1F33",
                    borderRadius: 10,
                    padding: "18px 20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#7A7D90",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: card.color,
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#3A3D50", marginTop: 6 }}>
                    {card.sub}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#7A7D90" }}>
                Monthly Revenue ({revYear})
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {(["bar", "cards"] as ("bar" | "cards")[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    data-ocid={`spreadsheet.revenue.chart_mode.${mode}`}
                    onClick={() => setRevChartMode(mode)}
                    style={{
                      border: "none",
                      padding: "0 14px",
                      height: 36,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background:
                        revChartMode === mode
                          ? "rgba(94,240,138,0.15)"
                          : "transparent",
                      color: revChartMode === mode ? "#5EF08A" : "#7A7D90",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "bar" ? "📊 Bar Chart" : "🗂 Summary Cards"}
                  </button>
                ))}
              </div>
            </div>
            {revChartMode === "bar" ? (
              <div style={{ ...CARD, padding: "20px 16px", overflowX: "auto" }}>
                <div style={{ minWidth: 540 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={monthlyRevenue}
                      margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(v: number | string) => [
                          `$${Number(v).toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          background: "#1f2937",
                          border: "1px solid #374151",
                          color: "#f3f4f6",
                        }}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {monthlyRevenue.map((m) => (
                          <Cell
                            key={m.month}
                            fill="#6366f1"
                            fillOpacity={m.inRange ? 1 : 0.25}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                {monthlyRevenue.map((m) => (
                  <div
                    key={m.month}
                    style={{
                      opacity: m.inRange ? 1 : 0.35,
                      background: "rgba(17,19,34,0.7)",
                      border: "1px solid #1C1F33",
                      borderRadius: 10,
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#7A7D90",
                        marginBottom: 6,
                      }}
                    >
                      {m.month} {revYear}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#EEF0F8",
                      }}
                    >
                      ${m.total.toLocaleString()}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#3A3D50", marginTop: 4 }}
                    >
                      {m.count} paid invoice{m.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#EEF0F8" }}
                >
                  Outstanding Invoices
                </span>
                {unpaidRows.length > 0 && (
                  <span
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#f87171",
                      borderRadius: 12,
                      padding: "2px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {unpaidRows.length}
                  </span>
                )}
              </div>
              {unpaidRows.length === 0 ? (
                <div
                  style={{ ...CARD, padding: "40px 20px", textAlign: "center" }}
                >
                  <p style={{ color: "#7A7D90", fontSize: 14, margin: 0 }}>
                    🎉 No outstanding invoices
                  </p>
                </div>
              ) : (
                <div
                  style={{ ...CARD, padding: 0, overflowX: "auto" }}
                  data-ocid="spreadsheet.revenue.outstanding.table"
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 700,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Client Name",
                          "ID / Invoice #",
                          "Description",
                          "Amount",
                          "Date",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            style={{
                              textAlign: "left",
                              padding: "11px 14px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#7A7D90",
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.06em",
                              borderBottom: "1px solid #1C1F33",
                              background: "rgba(14,16,32,0.9)",
                              position: "sticky" as const,
                              top: 0,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidRows.map((row, idx) => (
                        <tr
                          key={row.rowKey}
                          data-ocid={`spreadsheet.revenue.outstanding.item.${idx + 1}`}
                          style={{
                            borderBottom: "1px solid #1C1F33",
                            background:
                              idx % 2 === 1
                                ? "rgba(255,255,255,0.018)"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              fontWeight: 500,
                            }}
                          >
                            {row.clientName}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#9DA0B3",
                              fontFamily: "monospace",
                            }}
                          >
                            {row.idOrInvoiceNum}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#EEF0F8",
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {row.descriptionOrTier}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 13,
                              color: "#5EF08A",
                              fontWeight: 600,
                              textAlign: "right",
                            }}
                          >
                            {row.amount}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#7A7D90",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {row.date}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile fullscreen tab menu overlay */}
      {tabMenuOpen && (
        <div
          data-ocid="spreadsheet.tab_menu.dialog"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(10,11,22,0.97)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Overlay header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "1px solid #1C1F33",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Select View
            </span>
            <button
              type="button"
              data-ocid="spreadsheet.tab_menu.close_button"
              aria-label="Close view menu"
              onClick={() => setTabMenuOpen(false)}
              style={{
                background: "rgba(28,31,51,0.8)",
                border: "1px solid #1C1F33",
                borderRadius: 8,
                color: "#EEF0F8",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
                width: 44,
                height: 44,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          {/* Tab items */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px 0",
            }}
          >
            {[
              { id: "accounting" as View, label: "💰 Accounting" },
              { id: "clients" as View, label: "👤 Client List" },
              { id: "tools" as View, label: "🔧 Tools" },
              { id: "leads" as View, label: "📋 Leads" },
              { id: "reviews" as View, label: "⭐ Reviews" },
              { id: "revenue" as View, label: "📈 Revenue" },
              { id: "gsheets" as View, label: "⚙ Google Sheets" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                data-ocid={`spreadsheet.tab_menu.${item.id}.item`}
                onClick={() => {
                  setView(item.id);
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                  setNotesClearStep(false);
                  setTabMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  minHeight: 52,
                  padding: "0 24px",
                  border: "none",
                  borderLeft:
                    view === item.id
                      ? "3px solid #5EF08A"
                      : "3px solid transparent",
                  background:
                    view === item.id ? "rgba(94,240,138,0.08)" : "transparent",
                  color: view === item.id ? "#5EF08A" : "#EEF0F8",
                  fontSize: 16,
                  fontWeight: view === item.id ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, color 0.15s",
                  width: "100%",
                }}
              >
                {item.label}
                {view === item.id && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5EF08A",
                      background: "rgba(94,240,138,0.12)",
                      border: "1px solid rgba(94,240,138,0.3)",
                      borderRadius: 4,
                      padding: "2px 8px",
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <InstructionModal
        isOpen={showExcelHelp}
        onClose={() => setShowExcelHelp(false)}
        title="How to Export to Excel"
        steps={EXCEL_STEPS}
      />
      <InstructionModal
        isOpen={showGSheetsHelp}
        onClose={() => setShowGSheetsHelp(false)}
        title="How to Set Up Google Sheets Sync"
        steps={GSHEETS_STEPS}
      />
    </AdminLayout>
  );
}

// ── Tools Panel (Calculator + Scratch Pad) ────────────────────────────────

interface ToolsPanelProps {
  calcDisplay: string;
  calcExpr: string;
  onCalcInput: (ch: string) => void;
  onCalcOperator: (op: string) => void;
  onCalcEquals: () => void;
  onCalcPercent: () => void;
  onCalcClear: () => void;
  onCalcBackspace: () => void;
  scratchNotes: string;
  onNotesChange: (val: string) => void;
  notesClearStep: boolean;
  onClearNotes: () => void;
  onClearCancel: () => void;
}

const CALC_BTN: React.CSSProperties = {
  border: "1px solid #1C1F33",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s",
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function ToolsPanel({
  calcDisplay,
  calcExpr,
  onCalcInput,
  onCalcOperator,
  onCalcEquals,
  onCalcPercent,
  onCalcClear,
  onCalcBackspace,
  scratchNotes,
  onNotesChange,
  notesClearStep,
  onClearNotes,
  onClearCancel,
}: ToolsPanelProps) {
  const isError = calcDisplay === "Error";

  const CARD_STYLE: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    border: "1px solid #1C1F33",
    borderRadius: 12,
  };

  // Calculator button helper
  function CalcBtn({
    label,
    onClick,
    variant = "default",
    wide = false,
    title,
  }: {
    label: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "op" | "equals" | "clear" | "util";
    wide?: boolean;
    title?: string;
  }) {
    const bg: Record<string, string> = {
      default: "rgba(28,31,51,0.95)",
      op: "rgba(94,240,138,0.10)",
      equals: "rgba(94,240,138,0.90)",
      clear: "rgba(239,68,68,0.12)",
      util: "rgba(251,191,36,0.10)",
    };
    const color: Record<string, string> = {
      default: "#EEF0F8",
      op: "#5EF08A",
      equals: "#061209",
      clear: "#f87171",
      util: "#fbbf24",
    };
    const hover: Record<string, string> = {
      default: "rgba(40,44,68,0.98)",
      op: "rgba(94,240,138,0.20)",
      equals: "rgba(94,240,138,1)",
      clear: "rgba(239,68,68,0.22)",
      util: "rgba(251,191,36,0.20)",
    };
    const [hov, setHov] = React.useState(false);
    return (
      <button
        type="button"
        title={title}
        aria-label={typeof label === "string" ? label : title}
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          ...CALC_BTN,
          gridColumn: wide ? "span 2" : undefined,
          background: hov ? hover[variant] : bg[variant],
          color: color[variant],
          fontWeight: variant === "equals" ? 700 : 600,
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      data-ocid="spreadsheet.tools.panel"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        alignItems: "start",
      }}
    >
      {/* ────────────────────── CALCULATOR ────────────────────── */}
      <div style={{ ...CARD_STYLE, padding: 20, maxWidth: 360 }}>
        {/* Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 16 }}>🖩</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#7A7D90",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Calculator
          </span>
        </div>

        {/* Display */}
        <div
          data-ocid="calculator.display"
          style={{
            background: "rgba(10,11,22,0.95)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 12,
            minHeight: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          {/* Expression */}
          <div
            style={{
              fontSize: 12,
              color: "#3A3D50",
              fontFamily: "monospace",
              minHeight: 18,
              wordBreak: "break-all",
              textAlign: "right",
            }}
          >
            {calcExpr || "\u00a0"}
          </div>
          {/* Main result */}
          <div
            style={{
              fontSize: calcDisplay.length > 14 ? 18 : 28,
              fontWeight: 700,
              color: isError ? "#f87171" : "#EEF0F8",
              fontFamily: "monospace",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              wordBreak: "break-all",
              textAlign: "right",
            }}
          >
            {calcDisplay}
          </div>
        </div>

        {/* Button grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {/* Row 1: C, ⌫, %, ÷ */}
          <CalcBtn
            label="C"
            onClick={onCalcClear}
            variant="clear"
            title="Clear"
          />
          <CalcBtn
            label={<Delete size={16} />}
            onClick={onCalcBackspace}
            variant="util"
            title="Backspace"
          />
          <CalcBtn
            label="%"
            onClick={onCalcPercent}
            variant="util"
            title="Percent"
          />
          <CalcBtn
            label="\u00f7"
            onClick={() => onCalcOperator("\u00f7")}
            variant="op"
            title="Divide"
          />

          {/* Row 2: 7 8 9 × */}
          <CalcBtn label="7" onClick={() => onCalcInput("7")} />
          <CalcBtn label="8" onClick={() => onCalcInput("8")} />
          <CalcBtn label="9" onClick={() => onCalcInput("9")} />
          <CalcBtn
            label="\u00d7"
            onClick={() => onCalcOperator("\u00d7")}
            variant="op"
            title="Multiply"
          />

          {/* Row 3: 4 5 6 − */}
          <CalcBtn label="4" onClick={() => onCalcInput("4")} />
          <CalcBtn label="5" onClick={() => onCalcInput("5")} />
          <CalcBtn label="6" onClick={() => onCalcInput("6")} />
          <CalcBtn
            label="\u2212"
            onClick={() => onCalcOperator("\u2212")}
            variant="op"
            title="Subtract"
          />

          {/* Row 4: 1 2 3 + */}
          <CalcBtn label="1" onClick={() => onCalcInput("1")} />
          <CalcBtn label="2" onClick={() => onCalcInput("2")} />
          <CalcBtn label="3" onClick={() => onCalcInput("3")} />
          <CalcBtn
            label="+"
            onClick={() => onCalcOperator("+")}
            variant="op"
            title="Add"
          />

          {/* Row 5: 0(wide) . = */}
          <CalcBtn label="0" onClick={() => onCalcInput("0")} wide />
          <CalcBtn label="." onClick={() => onCalcInput(".")} />
          <CalcBtn
            label="="
            onClick={onCalcEquals}
            variant="equals"
            title="Equals"
          />
        </div>
      </div>

      {/* ───────────────────── SCRATCH PAD ────────────────────── */}
      <div style={{ ...CARD_STYLE, padding: 20 }}>
        {/* Label row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📝</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7A7D90",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Scratch Pad
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              data-ocid="calculator.notes.char_count"
              style={{
                fontSize: 11,
                color: scratchNotes.length > 4500 ? "#f87171" : "#3A3D50",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {scratchNotes.length.toLocaleString()} / 5,000
            </span>
            {notesClearStep ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  data-ocid="calculator.notes.confirm_clear_button"
                  onClick={onClearNotes}
                  style={{
                    border: "1px solid rgba(239,68,68,0.5)",
                    borderRadius: 6,
                    background: "rgba(239,68,68,0.12)",
                    color: "#f87171",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  data-ocid="calculator.notes.cancel_clear_button"
                  onClick={onClearCancel}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    background: "transparent",
                    color: "#7A7D90",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="calculator.notes.clear_button"
                onClick={onClearNotes}
                disabled={scratchNotes.length === 0}
                style={{
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  background: "transparent",
                  color: scratchNotes.length === 0 ? "#2A2D40" : "#7A7D90",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  cursor: scratchNotes.length === 0 ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Clear notes
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          data-ocid="calculator.notes.textarea"
          value={scratchNotes}
          onChange={(e) => {
            if (e.target.value.length <= 5000) onNotesChange(e.target.value);
          }}
          placeholder="Jot down notes, reminders, or calculation context\u2026&#10;&#10;E.g. Follow up with Client X on Friday\nInvoice INV-0042 needs approval by EOD"
          spellCheck
          style={{
            width: "100%",
            minHeight: 320,
            resize: "vertical" as const,
            background: "rgba(10,11,22,0.95)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: "12px 14px",
            color: "#EEF0F8",
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Mono', 'Consolas', monospace",
            lineHeight: 1.65,
            outline: "none",
            boxSizing: "border-box",
            colorScheme: "dark",
          }}
        />

        {/* Hint */}
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 11,
            color: "#2A2D40",
            fontStyle: "italic",
          }}
        >
          Notes are saved automatically in your browser.
        </p>
      </div>
    </div>
  );
}
// ── Accounting Table ──────────────────────────────────────────────────────────

const ACCT_COLS = [
  { key: "rowType", label: "Type" },
  { key: "clientName", label: "Client Name" },
  { key: "idOrInvoiceNum", label: "ID / Invoice #" },
  { key: "descriptionOrTier", label: "Description / Tier" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
];

function AccountingTable({
  rows,
  loading,
  sortCol,
  sortDir,
  onSort,
  onMarkPaid,
  hasDateFilter,
}: {
  rows: AccountingRow[];
  loading: boolean;
  sortCol: string;
  sortDir: SortDir;
  onSort: (c: string) => void;
  onMarkPaid: (id: string) => Promise<void>;
  hasDateFilter: boolean;
}) {
  const totalCols = ACCT_COLS.length + 1;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
      <thead>
        <tr>
          {ACCT_COLS.map((c) => (
            <SortableTH
              key={c.key}
              label={c.label}
              col={c.key}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={onSort}
            />
          ))}
          <th
            scope="col"
            style={{
              padding: "11px 10px",
              borderBottom: "1px solid #1C1F33",
              background: "rgba(14,16,32,0.9)",
              position: "sticky" as const,
              top: 0,
              width: 36,
            }}
          />
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <SkeletonRows cols={totalCols} />
        ) : rows.length === 0 ? (
          <tr>
            <td
              colSpan={totalCols}
              data-ocid="spreadsheet.accounting.empty_state"
              style={{ padding: "60px 20px", textAlign: "center" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Table2 size={32} color="#3A3D50" />
                <p style={{ color: "#7A7D90", fontSize: 14, margin: 0 }}>
                  {hasDateFilter
                    ? "No records match the selected date range"
                    : "No accounting records found"}
                </p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.rowKey}
              data-ocid={`spreadsheet.accounting.item.${idx + 1}`}
              style={{
                borderBottom: "1px solid #1C1F33",
                background:
                  idx % 2 === 1 ? "rgba(255,255,255,0.018)" : "transparent",
              }}
            >
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    background:
                      row.rowType === "Invoice"
                        ? "rgba(139,92,246,0.12)"
                        : "rgba(59,130,246,0.12)",
                    color: row.rowType === "Invoice" ? "#a78bfa" : "#60a5fa",
                    border: `1px solid ${row.rowType === "Invoice" ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)"}`,
                    borderRadius: 5,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {row.rowType}
                </span>
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "#EEF0F8",
                  fontWeight: 500,
                }}
              >
                {row.clientName}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#9DA0B3",
                  fontFamily: "monospace",
                }}
              >
                {row.idOrInvoiceNum}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "#EEF0F8",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.descriptionOrTier}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 13,
                  color: row.rowType === "Invoice" ? "#5EF08A" : "#3A3D50",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {row.amount}
              </td>
              <td style={{ padding: "11px 14px" }}>
                {row.rowType === "Invoice" ? (
                  <InvoiceStatusCell
                    status={row.status}
                    invoiceId={row.rawId}
                    onSave={onMarkPaid}
                  />
                ) : (
                  <StatusBadge status={row.status} />
                )}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#7A7D90",
                  whiteSpace: "nowrap",
                }}
              >
                {row.date}
              </td>
              <td style={{ padding: "11px 10px", textAlign: "center" }}>
                <CopyButton
                  getText={() =>
                    [
                      row.rowType,
                      row.clientName,
                      row.idOrInvoiceNum,
                      row.descriptionOrTier,
                      row.amount,
                      row.status,
                      row.date,
                    ].join("\t")
                  }
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ── Google Sheets Config Panel ──────────────────────────────────────────────

interface GoogleSheetsPanelProps {
  scriptUrl: string;
  sheetId: string;
  configured: boolean;
  saving: boolean;
  clearing: boolean;
  toast: { msg: string; ok: boolean } | null;
  onScriptUrlChange: (v: string) => void;
  onSheetIdChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  onShowHelp: () => void;
}

function GoogleSheetsPanel({
  scriptUrl,
  sheetId,
  configured,
  saving,
  clearing,
  toast,
  onScriptUrlChange,
  onSheetIdChange,
  onSave,
  onClear,
  onShowHelp,
}: GoogleSheetsPanelProps) {
  const CARD_STYLE: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    border: "1px solid #1C1F33",
    borderRadius: 10,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #1C1F33",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#EEF0F8",
    background: "rgba(10,11,22,0.95)",
    outline: "none",
    boxSizing: "border-box" as const,
    height: 42,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ ...CARD_STYLE, padding: "24px 28px", maxWidth: 700 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: configured ? "#5EF08A" : "#3A3D50",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#EEF0F8" }}>
            Google Sheets Configuration
          </span>
          <span
            style={{
              marginLeft: 4,
              fontSize: 11,
              fontWeight: 700,
              color: configured ? "#5EF08A" : "#7A7D90",
              background: configured
                ? "rgba(94,240,138,0.1)"
                : "rgba(122,125,144,0.1)",
              border: `1px solid ${configured ? "rgba(94,240,138,0.3)" : "rgba(122,125,144,0.2)"}`,
              borderRadius: 5,
              padding: "2px 8px",
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
            }}
          >
            {configured ? "Connected" : "Not Configured"}
          </span>
          {/* GSheets help button */}
          <button
            type="button"
            aria-label="Google Sheets setup instructions"
            onClick={onShowHelp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              transition: "color 0.15s",
              marginLeft: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#5EF08A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
            }}
          >
            ?
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#7A7D90",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Deploy a Google Apps Script Web App to use as a bridge, then paste its
          URL below. Once configured, "Sync to Google Sheets" buttons will
          appear on the Accounting, Client List, Leads, and Revenue views.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              htmlFor="gss-script-url"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#7A7D90",
                marginBottom: 6,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              Apps Script Web App URL{" "}
              <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              id="gss-script-url"
              type="url"
              value={scriptUrl}
              onChange={(e) => onScriptUrlChange(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfyc.../exec"
              data-ocid="spreadsheet.gsheets.script_url_input"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="gss-sheet-id"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#7A7D90",
                marginBottom: 6,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              Sheet ID{" "}
              <span style={{ fontSize: 11, fontWeight: 400, color: "#3A3D50" }}>
                (optional)
              </span>
            </label>
            <input
              id="gss-sheet-id"
              type="text"
              value={sheetId}
              onChange={(e) => onSheetIdChange(e.target.value)}
              placeholder="Leave blank to use the default sheet"
              data-ocid="spreadsheet.gsheets.sheet_id_input"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            data-ocid="spreadsheet.gsheets.config_toast"
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 7,
              background: toast.ok
                ? "rgba(94,240,138,0.1)"
                : "rgba(239,68,68,0.1)",
              border: `1px solid ${toast.ok ? "rgba(94,240,138,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: toast.ok ? "#5EF08A" : "#f87171",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {toast.ok ? "✓ " : "✕ "}
            {toast.msg}
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            data-ocid="spreadsheet.gsheets.save_button"
            onClick={onSave}
            disabled={saving || !scriptUrl.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background:
                saving || !scriptUrl.trim()
                  ? "rgba(94,240,138,0.2)"
                  : "rgba(94,240,138,0.9)",
              color: saving || !scriptUrl.trim() ? "#3A5A40" : "#061209",
              border: "none",
              borderRadius: 6,
              padding: "0 20px",
              height: 42,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving || !scriptUrl.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          {configured && (
            <button
              type="button"
              data-ocid="spreadsheet.gsheets.clear_button"
              onClick={onClear}
              disabled={clearing}
              style={{
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 6,
                padding: "0 16px",
                height: 42,
                fontSize: 13,
                fontWeight: 700,
                color: "#f87171",
                cursor: clearing ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {clearing ? "Clearing..." : "Clear"}
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ ...CARD_STYLE, padding: "22px 28px", maxWidth: 700 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#EEF0F8",
            marginBottom: 14,
          }}
        >
          How to set up the Apps Script
        </div>
        <ol
          style={{
            paddingLeft: 18,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {[
            "Go to script.google.com and create a new project.",
            "Paste the Apps Script template (provided below) into the editor and save.",
            "Click Deploy → New deployment. Set type to Web App, Execute as: Me, Who has access: Anyone.",
            "Copy the Web App URL from the deployment and paste it above.",
            "Each view (Accounting, Client List, Leads, Revenue) will sync to its own tab in your Google Sheet.",
          ].map((step) => (
            <li
              key={step.slice(0, 30)}
              style={{ fontSize: 13, color: "#9DA0B3", lineHeight: 1.6 }}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Client List Table ─────────────────────────────────────────────────────────

const CLIENT_COLS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source" },
  { key: "projectStatus", label: "Project Status" },
  { key: "activeServices", label: "Active Services" },
  { key: "currentMilestone", label: "Milestone" },
  { key: "joinDate", label: "Join Date" },
  { key: "notes", label: "Notes" },
];

function ClientListTable({
  rows,
  loading,
  sortCol,
  sortDir,
  onSort,
  onSaveNotes,
  onSaveStatus,
}: {
  rows: ClientRow[];
  loading: boolean;
  sortCol: string;
  sortDir: SortDir;
  onSort: (c: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onSaveStatus: (id: string, s: string) => Promise<void>;
}) {
  const totalCols = CLIENT_COLS.length + 1;
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}
    >
      <thead>
        <tr>
          {CLIENT_COLS.map((c) => (
            <SortableTH
              key={c.key}
              label={c.label}
              col={c.key}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={onSort}
            />
          ))}
          <th
            scope="col"
            style={{
              padding: "11px 10px",
              borderBottom: "1px solid #1C1F33",
              background: "rgba(14,16,32,0.9)",
              position: "sticky" as const,
              top: 0,
              width: 36,
            }}
          />
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <SkeletonRows cols={totalCols} />
        ) : rows.length === 0 ? (
          <tr>
            <td
              colSpan={totalCols}
              data-ocid="spreadsheet.clients.empty_state"
              style={{ padding: "60px 20px", textAlign: "center" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Table2 size={32} color="#3A3D50" />
                <p style={{ color: "#7A7D90", fontSize: 14, margin: 0 }}>
                  No clients found
                </p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              data-ocid={`spreadsheet.clients.item.${idx + 1}`}
              style={{
                borderBottom: "1px solid #1C1F33",
                background:
                  idx % 2 === 1 ? "rgba(255,255,255,0.018)" : "transparent",
              }}
            >
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "#EEF0F8",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {row.name}
              </td>
              <td
                style={{ padding: "11px 14px", fontSize: 12, color: "#9DA0B3" }}
              >
                {row.email}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#9DA0B3",
                  whiteSpace: "nowrap",
                }}
              >
                {row.phone || "—"}
              </td>
              <td style={{ padding: "11px 14px" }}>
                <span
                  style={{
                    background: "rgba(122,125,144,0.1)",
                    color: "#9DA0B3",
                    border: "1px solid rgba(122,125,144,0.2)",
                    borderRadius: 5,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase" as const,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.source || "—"}
                </span>
              </td>
              <td style={{ padding: "11px 14px" }}>
                <ProjectStatusCell
                  status={row.projectStatus}
                  clientId={row.id}
                  onSave={onSaveStatus}
                />
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#9DA0B3",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.activeServices || "—"}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#7A7D90",
                  textAlign: "center",
                }}
              >
                {row.currentMilestone > 0 ? `${row.currentMilestone}/6` : "—"}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  color: "#7A7D90",
                  whiteSpace: "nowrap",
                }}
              >
                {row.joinDate}
              </td>
              <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                <NotesCell
                  value={row.notes}
                  clientId={row.id}
                  onSave={onSaveNotes}
                />
              </td>
              <td style={{ padding: "11px 10px", textAlign: "center" }}>
                <CopyButton
                  getText={() =>
                    [
                      row.name,
                      row.email,
                      row.phone || "—",
                      row.source || "—",
                      row.projectStatus,
                      row.activeServices || "—",
                      row.currentMilestone > 0
                        ? `${row.currentMilestone}/6`
                        : "—",
                      row.joinDate,
                      row.notes,
                    ].join("\t")
                  }
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
