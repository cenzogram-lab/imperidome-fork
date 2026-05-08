import { useCallback, useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Lead {
  id: string;
  path: string;
  name: string;
  email: string;
  business: string;
  message: string;
  status: string;
  created_at: bigint;
  // Optional meeting integration fields
  meetingMethod?: string; // 'phone' | 'google_meet' | ''
  meetLink?: string; // Google Meet URL or ''
  // Draft / reschedule fields
  isDraft?: boolean;
  rescheduleToken?: string;
}

interface DaySchedule {
  isOpen: boolean;
  startHour: number;
  endHour: number;
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AvailabilitySettings {
  weeklySchedule: WeeklySchedule;
  blockedDates: string[];
}

const WEEK_DAY_KEYS: (keyof WeeklySchedule)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseLeadMessage(message: string): Record<string, string> {
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === "object")
      return parsed as Record<string, string>;
    return {};
  } catch {
    return {};
  }
}

function getLeadDate(lead: Lead): Date {
  const details = parseLeadMessage(lead.message);
  if (details.preferredDate) {
    // Use T12:00:00 to avoid DST edge cases with YYYY-MM-DD strings
    const d = new Date(`${details.preferredDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(Number(lead.created_at) / 1_000_000);
}

function getLeadHour(lead: Lead): number {
  const details = parseLeadMessage(lead.message);
  if (details.preferredTime) {
    // preferredTime may be "09:00" or "9 AM" etc.
    const match = details.preferredTime.match(/(\d{1,2})/);
    if (match) {
      const h = Number.parseInt(match[1], 10);
      if (h >= 0 && h <= 23) return h;
    }
  }
  return new Date(Number(lead.created_at) / 1_000_000).getHours();
}

function getServiceLabel(lead: Lead): string {
  const details = parseLeadMessage(lead.message);
  const pathLower = lead.path.toLowerCase();
  if (pathLower.includes("custom-sites") || pathLower.includes("custom sites"))
    return "Custom Website";
  if (pathLower.includes("speedy-sites") || pathLower.includes("speedy sites"))
    return "Speedy Site";
  if (pathLower.includes("audit")) return "Audit";
  if (
    pathLower.includes("product-lab") ||
    pathLower.includes("product lab") ||
    pathLower.includes("product production")
  )
    return "Product Lab";
  if (
    pathLower.includes("ai-receptionist") ||
    pathLower.includes("ai receptionist")
  )
    return "AI Receptionist";
  if (details.business_type) return details.business_type;
  return "Inquiry";
}

function getMeetingType(lead: Lead): "google_meet" | "phone" | null {
  // Priority 1: use explicit meetingMethod field if set
  if (lead.meetingMethod === "google_meet") return "google_meet";
  if (lead.meetingMethod === "phone") return "phone";
  // Priority 2: fall back to keyword heuristic
  const details = parseLeadMessage(lead.message);
  const haystack = [
    details.business_type ?? "",
    details.contact_phone ?? "",
    details.meetingMethod ?? "",
    lead.business ?? "",
    lead.message ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes("google meet") || haystack.includes("video"))
    return "google_meet";
  if (haystack.includes("phone") || haystack.includes("call")) return "phone";
  return null;
}

function getLeadLabel(lead: Lead): { name: string; service: string } {
  const details = parseLeadMessage(lead.message);
  const name = details.contact_name || lead.name || "Unknown";
  return { name, service: getServiceLabel(lead) };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ── Lead Entry Chip (Month/Week) ─────────────────────────────────────────────

function LeadChip({
  lead,
  onSelect,
  highlighted,
}: {
  lead: Lead;
  onSelect: (id: string) => void;
  highlighted: boolean;
}) {
  const { name, service } = getLeadLabel(lead);
  const isDraft = lead.isDraft || lead.status === "draft";
  const isClosed = lead.status === "Closed" || lead.status === "closed";
  const isContacted =
    lead.status === "Contacted" || lead.status === "contacted";
  const isQualified =
    lead.status === "Qualified" || lead.status === "qualified";
  const meetingType = getMeetingType(lead);

  // Derive colors per status
  let bgColor: string;
  let borderStyle: string;
  let nameColor: string;
  let subtitleColor: string;
  let shadow: string;

  if (isDraft) {
    bgColor = highlighted ? "rgba(107,114,128,0.18)" : "rgba(107,114,128,0.08)";
    borderStyle = "1px dashed rgba(107,114,128,0.5)";
    nameColor = "#9ca3af";
    subtitleColor = "rgba(156,163,175,0.65)";
    shadow = "none";
  } else if (isClosed) {
    bgColor = "rgba(239,68,68,0.06)";
    borderStyle = "1px solid rgba(239,68,68,0.2)";
    nameColor = "rgba(239,68,68,0.7)";
    subtitleColor = "rgba(239,68,68,0.45)";
    shadow = "none";
  } else if (isContacted || isQualified) {
    bgColor = highlighted ? "rgba(57,255,20,0.14)" : "rgba(57,255,20,0.06)";
    borderStyle = highlighted
      ? "1px solid #39FF14"
      : "1px solid rgba(57,255,20,0.3)";
    nameColor = "rgba(57,255,20,0.8)";
    subtitleColor = "rgba(57,255,20,0.5)";
    shadow = highlighted
      ? "0 0 8px rgba(57,255,20,0.4), 0 0 16px rgba(57,255,20,0.2)"
      : "none";
  } else {
    // Default: new / active — keep current green exactly
    bgColor = highlighted ? "rgba(57,255,20,0.18)" : "rgba(57,255,20,0.08)";
    borderStyle = highlighted
      ? "1px solid #39FF14"
      : "1px solid rgba(57,255,20,0.3)";
    nameColor = "#39FF14";
    subtitleColor = "rgba(57,255,20,0.65)";
    shadow = highlighted
      ? "0 0 8px rgba(57,255,20,0.5), 0 0 16px rgba(57,255,20,0.25)"
      : "none";
  }

  // Meeting method icon prefix (compact — just an icon for the chip)
  const meetIcon =
    !isDraft && meetingType === "google_meet"
      ? "📹 "
      : !isDraft && meetingType === "phone"
        ? "📞 "
        : "";

  return (
    <button
      type="button"
      data-ocid={`leads.calendar.chip.${lead.id}`}
      onClick={() => onSelect(lead.id)}
      title={`${
        meetingType === "google_meet"
          ? "[Google Meet] "
          : meetingType === "phone"
            ? "[Phone] "
            : ""
      }${name} — ${service}${isDraft ? " (Draft)" : ""}`}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: bgColor,
        border: borderStyle,
        borderRadius: "4px",
        padding: "2px 6px",
        marginBottom: "2px",
        cursor: "pointer",
        boxShadow: shadow,
        transition: "all 0.2s",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "block",
          color: nameColor,
          fontSize: "11px",
          fontWeight: 700,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isDraft ? "⋯ " : meetIcon}
        {name}
      </span>
      <span
        style={{
          display: "block",
          color: subtitleColor,
          fontSize: "10px",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isDraft ? "Draft" : service}
      </span>
    </button>
  );
}

// ── Day View Lead Block ───────────────────────────────────────────────────────

function DayLeadBlock({
  lead,
  onSelect,
  highlighted,
}: {
  lead: Lead;
  onSelect: (id: string) => void;
  highlighted: boolean;
}) {
  const details = parseLeadMessage(lead.message);
  const name = details.contact_name || lead.name || "Unknown";
  const service = getServiceLabel(lead);
  const meetingType = getMeetingType(lead);
  const isDraft = lead.isDraft || lead.status === "draft";
  const isClosed = lead.status === "Closed" || lead.status === "closed";

  // Derive block colors per status
  let bgColor: string;
  let borderStyle: string;
  let nameColor: string;
  let serviceColor: string;
  let blockShadow: string;

  if (isDraft) {
    bgColor = highlighted ? "rgba(107,114,128,0.18)" : "rgba(107,114,128,0.1)";
    borderStyle = "1.5px dashed rgba(107,114,128,0.4)";
    nameColor = "#9ca3af";
    serviceColor = "rgba(156,163,175,0.6)";
    blockShadow = "none";
  } else if (isClosed) {
    bgColor = "rgba(239,68,68,0.07)";
    borderStyle = "1.5px solid rgba(239,68,68,0.25)";
    nameColor = "rgba(239,68,68,0.7)";
    serviceColor = "rgba(239,68,68,0.45)";
    blockShadow = "none";
  } else {
    // Default new/active — keep current green exactly
    bgColor = highlighted ? "rgba(57,255,20,0.18)" : "rgba(57,255,20,0.1)";
    borderStyle = highlighted
      ? "1.5px solid #39FF14"
      : "1.5px solid rgba(57,255,20,0.4)";
    nameColor = "#39FF14";
    serviceColor = "rgba(57,255,20,0.7)";
    blockShadow = highlighted
      ? "0 0 12px rgba(57,255,20,0.5), 0 0 24px rgba(57,255,20,0.2)"
      : "0 1px 4px rgba(0,0,0,0.3)";
  }

  return (
    <button
      type="button"
      data-ocid={`leads.calendar.day_block.${lead.id}`}
      onClick={() => onSelect(lead.id)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: bgColor,
        border: borderStyle,
        borderRadius: "6px",
        padding: "8px 12px",
        marginBottom: "4px",
        cursor: "pointer",
        boxShadow: blockShadow,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: nameColor,
            fontSize: "13px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "220px",
          }}
        >
          {isDraft ? "⋯ " : ""}
          {name}
        </span>
        {isDraft ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(107,114,128,0.15)",
              border: "1px dashed rgba(107,114,128,0.4)",
              borderRadius: "4px",
              padding: "2px 7px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#9ca3af",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Draft
          </span>
        ) : meetingType ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background:
                meetingType === "google_meet"
                  ? "rgba(66,133,244,0.15)"
                  : "rgba(255,165,0,0.15)",
              border:
                meetingType === "google_meet"
                  ? "1px solid rgba(66,133,244,0.4)"
                  : "1px solid rgba(255,165,0,0.4)",
              borderRadius: "4px",
              padding: "2px 7px",
              fontSize: "11px",
              fontWeight: 600,
              color: meetingType === "google_meet" ? "#60a5fa" : "#fb923c",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {meetingType === "google_meet" ? "📹" : "📞"}
            &nbsp;
            {meetingType === "google_meet" ? "Google Meet" : "Phone"}
          </span>
        ) : null}
      </div>
      <span
        style={{
          display: "block",
          color: serviceColor,
          fontSize: "11px",
          marginTop: "3px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isDraft ? "No meeting scheduled" : service}
      </span>
      {/* Meet link icon — only shown if google_meet AND meetLink present AND not draft */}
      {!isDraft && meetingType === "google_meet" && lead.meetLink && (
        <a
          href={lead.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open Google Meet"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "5px",
            color: "#93c5fd",
            fontSize: "11px",
            fontWeight: 600,
            textDecoration: "none",
            background: "rgba(66,133,244,0.15)",
            border: "1px solid rgba(66,133,244,0.35)",
            borderRadius: "4px",
            padding: "2px 8px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Join Meet
        </a>
      )}
    </button>
  );
}

// ── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({
  viewDate,
  leads,
  highlightedId,
  onSelectLead,
}: {
  viewDate: Date;
  leads: Lead[];
  highlightedId: string | null;
  onSelectLead: (id: string) => void;
}) {
  const today = new Date();
  const monthStart = startOfMonth(viewDate);
  const firstDayOfWeek = monthStart.getDay();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
  }
  while (cells.length < totalCells) cells.push(null);

  const leadsByDay = new Map<string, Lead[]>();
  for (const lead of leads) {
    const d = getLeadDate(lead);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!leadsByDay.has(key)) leadsByDay.set(key, []);
    leadsByDay.get(key)!.push(lead);
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          marginBottom: "4px",
        }}
      >
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              color: "#7A7D90",
              fontSize: "12px",
              fontWeight: 700,
              padding: "6px 0",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          background: "#1C1F33",
          border: "1px solid #1C1F33",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {cells.map((day, i) => {
          const isToday = day ? isSameDay(day, today) : false;
          const isCurrentMonth = day
            ? day.getMonth() === viewDate.getMonth()
            : false;
          const dayKey = day
            ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
            : null;
          const dayLeads = dayKey ? (leadsByDay.get(dayKey) ?? []) : [];
          const cellKey = dayKey ?? `empty-${i}`;

          return (
            <div
              key={cellKey}
              style={{
                background: day ? "rgba(17,19,34,0.9)" : "rgba(10,10,10,0.6)",
                minHeight: "96px",
                padding: "6px",
                verticalAlign: "top",
              }}
            >
              {day && (
                <>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: isToday ? "#39FF14" : "transparent",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: isToday ? 800 : 500,
                        color: isToday
                          ? "#0a0a0a"
                          : isCurrentMonth
                            ? "#EEF0F8"
                            : "#8b8fa8",
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {dayLeads.map((lead) => (
                    <LeadChip
                      key={lead.id}
                      lead={lead}
                      onSelect={onSelectLead}
                      highlighted={highlightedId === lead.id}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weekly View ─────────────────────────────────────────────────────────────

function WeeklyView({
  viewDate,
  leads,
  highlightedId,
  onSelectLead,
  availability,
}: {
  viewDate: Date;
  leads: Lead[];
  highlightedId: string | null;
  onSelectLead: (id: string) => void;
  availability: AvailabilitySettings | null;
}) {
  const today = new Date();
  const weekStart = startOfWeek(viewDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));

  const leadMap = new Map<string, Lead[]>();
  for (const lead of leads) {
    const d = getLeadDate(lead);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const hourBlock = Math.floor(d.getHours() / 2) * 2;
    const key = `${dayKey}-${hourBlock}`;
    if (!leadMap.has(key)) leadMap.set(key, []);
    leadMap.get(key)!.push(lead);
  }

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px repeat(7, 1fr)",
          gap: "1px",
          marginBottom: "1px",
        }}
      >
        <div style={{ background: "rgba(17,19,34,0.9)" }} />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              style={{
                background: "rgba(17,19,34,0.9)",
                textAlign: "center",
                padding: "8px 4px",
                borderBottom: isToday
                  ? "2px solid #39FF14"
                  : "2px solid transparent",
              }}
            >
              <div
                style={{
                  color: "#7A7D90",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {DAY_LABELS[day.getDay()]}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: isToday ? "#39FF14" : "transparent",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{
                    color: isToday ? "#0a0a0a" : "#EEF0F8",
                    fontSize: "13px",
                    fontWeight: isToday ? 800 : 500,
                  }}
                >
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time rows */}
      <div
        style={{
          border: "1px solid #1C1F33",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#1C1F33",
        }}
      >
        {HOURS.map((hour) => (
          <div
            key={hour}
            style={{
              display: "grid",
              gridTemplateColumns: "56px repeat(7, 1fr)",
              gap: "1px",
            }}
          >
            {/* Time label */}
            <div
              style={{
                background: "rgba(14,16,32,0.95)",
                padding: "6px 4px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  color: "#7A7D90",
                  fontSize: "10px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  paddingTop: "2px",
                }}
              >
                {formatHour(hour)}
              </span>
            </div>
            {days.map((day) => {
              const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const key = `${dayKey}-${hour}`;
              const slotLeads = leadMap.get(key) ?? [];
              // Availability band: is this 2-hour block within open hours for this weekday?
              let isAvailBand = false;
              if (availability) {
                const dayKey2 = WEEK_DAY_KEYS[day.getDay()];
                const sched = availability.weeklySchedule[dayKey2];
                if (
                  sched?.isOpen &&
                  hour >= sched.startHour &&
                  hour < sched.endHour
                ) {
                  isAvailBand = true;
                }
              }
              return (
                <div
                  key={day.toISOString()}
                  style={{
                    background: isAvailBand
                      ? "rgba(57,255,20,0.05)"
                      : "rgba(17,19,34,0.9)",
                    minHeight: "52px",
                    padding: "4px",
                    borderTop: "1px solid rgba(28,31,51,0.5)",
                    borderLeft: isAvailBand
                      ? "2px solid rgba(57,255,20,0.25)"
                      : "2px solid transparent",
                    boxSizing: "border-box",
                  }}
                >
                  {slotLeads.map((lead) => (
                    <LeadChip
                      key={lead.id}
                      lead={lead}
                      onSelect={onSelectLead}
                      highlighted={highlightedId === lead.id}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  viewDate,
  leads,
  highlightedId,
  onSelectLead,
}: {
  viewDate: Date;
  leads: Lead[];
  highlightedId: string | null;
  onSelectLead: (id: string) => void;
}) {
  const today = new Date();
  const isToday = isSameDay(viewDate, today);
  const nowHour = today.getHours();

  // Map leads to hour slots for this specific day
  const leadsByHour = new Map<number, Lead[]>();
  for (const lead of leads) {
    const leadDate = getLeadDate(lead);
    if (isSameDay(leadDate, viewDate)) {
      const h = getLeadHour(lead);
      if (!leadsByHour.has(h)) leadsByHour.set(h, []);
      leadsByHour.get(h)!.push(lead);
    }
  }

  const totalLeadsToday = Array.from(leadsByHour.values()).reduce(
    (s, arr) => s + arr.length,
    0,
  );

  return (
    <div>
      {/* Day header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
          padding: "10px 14px",
          background: "rgba(17,19,34,0.9)",
          border: "1px solid #1C1F33",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: isToday ? "#39FF14" : "rgba(57,255,20,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: isToday ? "#0a0a0a" : "#39FF14",
            }}
          >
            {viewDate.getDate()}
          </span>
        </div>
        <div>
          <div
            style={{
              color: isToday ? "#39FF14" : "#EEF0F8",
              fontSize: "15px",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {DAY_FULL_LABELS[viewDate.getDay()]},{" "}
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getDate()}
          </div>
          <div style={{ color: "#7A7D90", fontSize: "12px", marginTop: "2px" }}>
            {totalLeadsToday === 0
              ? "No leads scheduled"
              : `${totalLeadsToday} lead${totalLeadsToday !== 1 ? "s" : ""} today`}
          </div>
        </div>
      </div>

      {/* Hour timeline */}
      <div
        style={{
          border: "1px solid #1C1F33",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#1C1F33",
        }}
      >
        {ALL_HOURS.map((hour) => {
          const slotLeads = leadsByHour.get(hour) ?? [];
          const isPastHour = isToday && hour < nowHour;
          const isCurrentHour = isToday && hour === nowHour;
          const hasLeads = slotLeads.length > 0;

          return (
            <div
              key={hour}
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr",
                gap: "0",
                borderBottom:
                  hour < 23 ? "1px solid rgba(28,31,51,0.6)" : "none",
              }}
            >
              {/* Hour label */}
              <div
                style={{
                  background: isCurrentHour
                    ? "rgba(57,255,20,0.08)"
                    : "rgba(14,16,32,0.95)",
                  padding: "10px 10px 10px 0",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  borderRight: isCurrentHour
                    ? "2px solid #39FF14"
                    : "2px solid rgba(28,31,51,0.4)",
                }}
              >
                <span
                  style={{
                    color: isCurrentHour
                      ? "#39FF14"
                      : isPastHour
                        ? "rgba(122,125,144,0.4)"
                        : "#7A7D90",
                    fontSize: "11px",
                    fontWeight: isCurrentHour ? 700 : 500,
                    whiteSpace: "nowrap",
                    paddingTop: "2px",
                  }}
                >
                  {formatHour(hour)}
                </span>
              </div>

              {/* Lead content */}
              <div
                style={{
                  background: isPastHour
                    ? "rgba(12,14,28,0.7)"
                    : isCurrentHour
                      ? "rgba(57,255,20,0.03)"
                      : "rgba(17,19,34,0.9)",
                  minHeight: hasLeads ? "auto" : "44px",
                  padding: hasLeads ? "8px 10px" : "4px 10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {slotLeads.map((lead) => (
                  <DayLeadBlock
                    key={lead.id}
                    lead={lead}
                    onSelect={onSelectLead}
                    highlighted={highlightedId === lead.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Calendar Component ──────────────────────────────────────────────────

interface LeadCalendarProps {
  leads: Lead[];
  draftCount?: number;
  onHighlightLead?: (id: string) => void;
}

export default function LeadCalendar({
  leads,
  draftCount = 0,
  onHighlightLead,
}: LeadCalendarProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySettings | null>(
    null,
  );

  // Fetch availability settings for the week view bands
  const { actor } = useActor();
  useEffect(() => {
    if (!actor) return;
    (async () => {
      try {
        const result = await (
          actor as unknown as { getPublicAvailability: () => Promise<unknown> }
        ).getPublicAvailability();
        if (
          result &&
          typeof result === "object" &&
          "weeklySchedule" in result
        ) {
          setAvailability(result as unknown as AvailabilitySettings);
        }
      } catch {
        // availability is optional — gracefully skip
      }
    })();
  }, [actor]);

  const handlePrev = useCallback(() => {
    if (viewMode === "month") {
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setViewDate((d) => addDays(startOfWeek(d), -7));
    } else {
      setViewDate((d) => addDays(d, -1));
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "month") {
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setViewDate((d) => addDays(startOfWeek(d), 7));
    } else {
      setViewDate((d) => addDays(d, 1));
    }
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setViewDate(new Date());
  }, []);

  const handleSelectLead = useCallback(
    (id: string) => {
      setHighlightedId(id);
      onHighlightLead?.(id);
      const el = document.querySelector(`[data-lead-card-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(() => setHighlightedId(null), 2000);
    },
    [onHighlightLead],
  );

  // Build the navigation title
  let navTitle: string;
  if (viewMode === "month") {
    navTitle = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  } else if (viewMode === "week") {
    const ws = startOfWeek(viewDate);
    const we = addDays(ws, 6);
    if (ws.getMonth() === we.getMonth()) {
      navTitle = `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
    } else {
      navTitle = `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
    }
  } else {
    navTitle = `${DAY_FULL_LABELS[viewDate.getDay()]}, ${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getDate()}`;
  }

  const btnBase: React.CSSProperties = {
    background: "rgba(17,19,34,0.9)",
    border: "1px solid #1C1F33",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#EEF0F8",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const toggleBase: React.CSSProperties = {
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <div
      data-ocid="leads.calendar.section"
      style={{
        marginTop: "40px",
        background: "rgba(14,16,32,0.7)",
        border: "1px solid #1C1F33",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Calendar icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(57,255,20,0.1)",
              border: "1px solid rgba(57,255,20,0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#39FF14"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                color: "#EEF0F8",
                fontSize: "18px",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Lead Calendar
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "2px",
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  margin: 0,
                }}
              >
                {leads.length} lead{leads.length !== 1 ? "s" : ""} shown
                {leads.length > 0
                  ? " — click any entry to highlight its card above"
                  : ""}
              </p>
              {draftCount > 0 && (
                <span
                  data-ocid="leads.calendar.drafts_pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(251,146,60,0.14)",
                    border: "1px solid rgba(251,146,60,0.4)",
                    borderRadius: "20px",
                    padding: "2px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fb923c",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {draftCount} Draft Lead{draftCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View toggle — scrollable on mobile */}
        <div
          data-ocid="leads.calendar.view_toggle"
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling:
              "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "rgba(17,19,34,0.9)",
              border: "1px solid #1C1F33",
              borderRadius: "8px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <button
              type="button"
              data-ocid="leads.calendar.month_tab"
              onClick={() => setViewMode("month")}
              style={{
                ...toggleBase,
                background:
                  viewMode === "month" ? "rgba(57,255,20,0.15)" : "transparent",
                color: viewMode === "month" ? "#39FF14" : "#7A7D90",
                borderRight: "1px solid #1C1F33",
              }}
            >
              Month
            </button>
            <button
              type="button"
              data-ocid="leads.calendar.week_tab"
              onClick={() => setViewMode("week")}
              style={{
                ...toggleBase,
                background:
                  viewMode === "week" ? "rgba(57,255,20,0.15)" : "transparent",
                color: viewMode === "week" ? "#39FF14" : "#7A7D90",
                borderRight: "1px solid #1C1F33",
              }}
            >
              Week
            </button>
            <button
              type="button"
              data-ocid="leads.calendar.day_tab"
              onClick={() => setViewMode("day")}
              style={{
                ...toggleBase,
                background:
                  viewMode === "day" ? "rgba(57,255,20,0.15)" : "transparent",
                color: viewMode === "day" ? "#39FF14" : "#7A7D90",
              }}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          data-ocid="leads.calendar.prev_button"
          onClick={handlePrev}
          aria-label="Previous"
          style={btnBase}
        >
          ←
        </button>
        <button
          type="button"
          data-ocid="leads.calendar.next_button"
          onClick={handleNext}
          aria-label="Next"
          style={btnBase}
        >
          →
        </button>
        <button
          type="button"
          data-ocid="leads.calendar.today_button"
          onClick={handleToday}
          style={{
            ...btnBase,
            background: "rgba(57,255,20,0.1)",
            border: "1px solid rgba(57,255,20,0.3)",
            color: "#39FF14",
          }}
        >
          Today
        </button>
        <span
          style={{
            color: "#EEF0F8",
            fontSize: "15px",
            fontWeight: 700,
            marginLeft: "4px",
          }}
        >
          {navTitle}
        </span>
        {/* Green dot when today is in view */}
        {viewMode === "month" &&
          today.getFullYear() === viewDate.getFullYear() &&
          today.getMonth() === viewDate.getMonth() && (
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#39FF14",
                boxShadow: "0 0 6px #39FF14",
                marginLeft: "4px",
              }}
            />
          )}
        {viewMode === "day" && isSameDay(viewDate, today) && (
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#39FF14",
              boxShadow: "0 0 6px #39FF14",
              marginLeft: "4px",
            }}
          />
        )}
      </div>

      {/* Calendar body */}
      {viewMode === "month" && (
        <MonthlyView
          viewDate={viewDate}
          leads={leads}
          highlightedId={highlightedId}
          onSelectLead={handleSelectLead}
        />
      )}
      {viewMode === "week" && (
        <WeeklyView
          viewDate={viewDate}
          leads={leads}
          highlightedId={highlightedId}
          onSelectLead={handleSelectLead}
          availability={availability}
        />
      )}
      {viewMode === "day" && (
        <DayView
          viewDate={viewDate}
          leads={leads}
          highlightedId={highlightedId}
          onSelectLead={handleSelectLead}
        />
      )}

      {/* Empty state */}
      {leads.length === 0 && (
        <div
          data-ocid="leads.calendar.empty_state"
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#7A7D90",
            fontSize: "14px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1C1F33"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: "0 auto 12px", display: "block" }}
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          No leads match the current filter
        </div>
      )}
    </div>
  );
}
