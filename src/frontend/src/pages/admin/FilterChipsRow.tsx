import { useEffect, useState } from "react";

type StatusFilterKey =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Closed"
  | "Draft"
  | "Cancelled";

interface FilterChipsRowProps {
  isAllActive: boolean;
  activeFilters: Set<StatusFilterKey>;
  calendarLeadsCount: number;
  ALL_STATUS_FILTERS: readonly StatusFilterKey[];
  FILTER_CHIP_COLORS: Record<
    StatusFilterKey,
    { active: string; border: string; text: string; bg: string }
  >;
  selectAll: () => void;
  toggleFilter: (s: StatusFilterKey) => void;
}

export default function FilterChipsRow({
  isAllActive,
  activeFilters,
  calendarLeadsCount,
  ALL_STATUS_FILTERS,
  FILTER_CHIP_COLORS,
  selectAll,
  toggleFilter,
}: FilterChipsRowProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (!overlayOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOverlayOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      data-ocid="leads.calendar.filter_chips"
      style={{ marginTop: "24px", marginBottom: "0" }}
    >
      {/* ── Desktop: full chip row (≥768px) ── */}
      <div className="leads-filter-chips-desktop">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            paddingBottom: "4px",
          }}
        >
          <span
            style={{
              color: "#7A7D90",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              flexShrink: 0,
            }}
          >
            Filter:
          </span>
          {/* All chip */}
          <button
            type="button"
            data-ocid="leads.calendar.filter.all"
            onClick={selectAll}
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              border: isAllActive
                ? "1.5px solid rgba(238,240,248,0.6)"
                : "1px solid rgba(122,125,144,0.3)",
              background: isAllActive
                ? "rgba(238,240,248,0.12)"
                : "rgba(17,19,34,0.8)",
              color: isAllActive ? "#EEF0F8" : "#7A7D90",
              letterSpacing: "0.03em",
            }}
          >
            All
          </button>
          {/* Per-status chips */}
          {ALL_STATUS_FILTERS.map((status) => {
            const isActive = activeFilters.has(status);
            const colors = FILTER_CHIP_COLORS[status];
            return (
              <button
                key={status}
                type="button"
                data-ocid={`leads.calendar.filter.${status.toLowerCase()}`}
                onClick={() => toggleFilter(status)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: isActive
                    ? `1.5px solid ${colors.border}`
                    : "1px solid rgba(28,31,51,0.9)",
                  background: isActive ? colors.active : colors.bg,
                  color: isActive ? colors.text : "rgba(122,125,144,0.6)",
                  letterSpacing: "0.03em",
                }}
              >
                {status === "Draft" ? "⋯ " : ""}
                {status}
              </button>
            );
          })}
          {/* Count badge */}
          {!isAllActive && (
            <span
              style={{
                fontSize: "11px",
                color: "#7A7D90",
                marginLeft: "4px",
              }}
            >
              {calendarLeadsCount} lead
              {calendarLeadsCount !== 1 ? "s" : ""} shown
            </span>
          )}
        </div>
      </div>

      {/* ── Mobile: hamburger button (<768px) ── */}
      <div className="leads-filter-chips-mobile">
        <button
          type="button"
          data-ocid="leads.calendar.filter.open_modal_button"
          onClick={() => setOverlayOpen(true)}
          aria-label="Open status filters"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: isAllActive
              ? "rgba(17,19,34,0.9)"
              : "rgba(94,240,138,0.12)",
            border: isAllActive
              ? "1px solid #1C1F33"
              : "1px solid rgba(94,240,138,0.45)",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            color: isAllActive ? "#7A7D90" : "#5EF08A",
            cursor: "pointer",
            letterSpacing: "0.03em",
          }}
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          Filter Leads
          {!isAllActive && (
            <span
              style={{
                background: "rgba(94,240,138,0.25)",
                border: "1px solid rgba(94,240,138,0.5)",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#5EF08A",
              }}
            >
              {activeFilters.size}
            </span>
          )}
        </button>
        {!isAllActive && (
          <span
            style={{
              display: "block",
              marginTop: "6px",
              fontSize: "11px",
              color: "#7A7D90",
            }}
          >
            {calendarLeadsCount} lead{calendarLeadsCount !== 1 ? "s" : ""} shown
          </span>
        )}
      </div>

      {/* ── Mobile fullscreen overlay ── */}
      {overlayOpen && (
        <div
          data-ocid="leads.calendar.filter.dialog"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(8,9,20,0.97)",
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
                color: "#EEF0F8",
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              Filter Leads
            </span>
            <button
              type="button"
              data-ocid="leads.calendar.filter.close_button"
              onClick={() => setOverlayOpen(false)}
              aria-label="Close filter menu"
              style={{
                background: "rgba(28,31,51,0.8)",
                border: "1px solid #1C1F33",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                color: "#7A7D90",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Option list */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "8px 0",
            }}
          >
            {/* All option */}
            <button
              type="button"
              data-ocid="leads.calendar.filter.overlay.all"
              onClick={() => {
                selectAll();
                setOverlayOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "52px",
                padding: "0 24px",
                background: isAllActive
                  ? "rgba(238,240,248,0.08)"
                  : "transparent",
                border: "none",
                borderBottom: "1px solid rgba(28,31,51,0.6)",
                cursor: "pointer",
                color: isAllActive ? "#EEF0F8" : "#7A7D90",
                fontSize: "16px",
                fontWeight: isAllActive ? 700 : 500,
                transition: "background 0.15s",
                width: "100%",
              }}
            >
              <span>All Statuses</span>
              {isAllActive && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5EF08A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Per-status options — tapping toggles, Done button closes */}
            {ALL_STATUS_FILTERS.map((status, idx) => {
              const isActive = activeFilters.has(status);
              const colors = FILTER_CHIP_COLORS[status];
              const isLast = idx === ALL_STATUS_FILTERS.length - 1;
              return (
                <button
                  key={status}
                  type="button"
                  data-ocid={`leads.calendar.filter.overlay.${status.toLowerCase()}`}
                  onClick={() => toggleFilter(status)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "52px",
                    padding: "0 24px",
                    background: isActive ? colors.active : "transparent",
                    border: "none",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid rgba(28,31,51,0.6)",
                    cursor: "pointer",
                    color: isActive ? colors.text : "rgba(122,125,144,0.7)",
                    fontSize: "16px",
                    fontWeight: isActive ? 700 : 500,
                    transition: "background 0.15s",
                    width: "100%",
                  }}
                >
                  <span>
                    {status === "Draft" ? "⋯ " : ""}
                    {status}
                  </span>
                  {isActive && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Done button */}
          <div style={{ padding: "16px 24px 40px", flexShrink: 0 }}>
            <button
              type="button"
              data-ocid="leads.calendar.filter.overlay.done_button"
              onClick={() => setOverlayOpen(false)}
              style={{
                width: "100%",
                background: "#5EF08A",
                border: "none",
                borderRadius: "10px",
                padding: "16px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#061209",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Done — View {calendarLeadsCount} Lead
              {calendarLeadsCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .leads-filter-chips-desktop { display: block; }
          .leads-filter-chips-mobile { display: none; }
        }
        @media (max-width: 767px) {
          .leads-filter-chips-desktop { display: none; }
          .leads-filter-chips-mobile { display: block; }
        }
      `}</style>
    </div>
  );
}
