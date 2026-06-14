import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { backendInterface } from "../../backend.d";
import type { GoogleCalendarConfig } from "../../backend.d";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaveStatus {
  type: "idle" | "saving" | "success" | "error";
  message?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminGoogleCalendarPage() {
  const { actor, isFetching } = useActor();

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: "idle" });
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCalHelp, setShowCalHelp] = useState(false);
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);

  const CAL_STEPS: InstructionStep[] = [
    { text: 'Go to script.google.com and click "New project".' },
    {
      text: "Paste the Imperidome Google Calendar Integration script. Save the project (Ctrl+S).",
    },
    {
      text: 'In the left sidebar, click the Services icon (+). Find "Google Calendar API" and click Add.',
    },
    {
      text: "At the top of the script, set CALENDAR_ID (use 'primary' for your main Google Calendar) and SECRET_TOKEN (choose any random string, e.g. imp2026xK9mQ).",
    },
    {
      text: "Click Deploy \u2192 New deployment. Set Type: Web App, Execute as: Me, Who has access: Anyone. Click Deploy and authorize all permissions.",
    },
    { text: "Copy the Web App URL that appears." },
    {
      text: 'Paste the Web App URL into the "Apps Script Web App URL" field in this panel.',
    },
    {
      text: 'Paste the same SECRET_TOKEN you set in the script into the "Secret Token" field.',
    },
    {
      text: 'Set your Event Title Template (e.g. "Meeting with {clientName}") and Default Duration.',
    },
    {
      text: "Click Save. Every future Google Meet booking will automatically create a calendar event and include the Meet link in the client's confirmation email.",
    },
  ];

  // Form fields
  const [scriptUrl, setScriptUrl] = useState("");
  const [titleTemplate, setTitleTemplate] = useState(
    "Meeting with [Client Name]",
  );
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [calendarId, setCalendarId] = useState("primary");

  // ── On mount: check configured status and load existing config ────────────
  useEffect(() => {
    if (!actor || isFetching) return;
    (actor as backendInterface)
      .isGoogleCalendarConfigured()
      .then((configured) => setIsConfigured(configured))
      .catch(() => setIsConfigured(false));

    (actor as backendInterface)
      .getGoogleCalendarConfig()
      .then((result) => {
        if ("err" in result) {
          setConfigLoadError("Failed to load calendar configuration.");
          return;
        }
        if ("ok" in result) {
          const cfg = result.ok;
          setScriptUrl(cfg.scriptUrl);
          setTitleTemplate(cfg.titleTemplate);
          setDefaultDuration(Number(cfg.defaultDurationMinutes));
          setCalendarId(cfg.calendarId);
        }
      })
      .catch(() => {
        setConfigLoadError(
          "Failed to load calendar config — your existing settings have not been changed",
        );
      });
  }, [actor, isFetching]);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!actor) return;

    if (!scriptUrl.trim()) {
      setSaveStatus({ type: "error", message: "Apps Script URL is required." });
      return;
    }

    setSaveStatus({ type: "saving" });

    const config: GoogleCalendarConfig = {
      scriptUrl: scriptUrl.trim(),
      titleTemplate: titleTemplate.trim() || "Meeting with [Client Name]",
      defaultDurationMinutes: BigInt(defaultDuration),
      calendarId: calendarId.trim() || "primary",
    };

    try {
      const result = await (actor as backendInterface).setGoogleCalendarConfig(
        config,
      );

      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setSaveStatus({
          type: "success",
          message: "Configuration saved successfully.",
        });
        setIsConfigured(true);
      } else {
        setSaveStatus({
          type: "error",
          message: `Failed to save: ${result.err ?? "Unknown error"}`,
        });
      }
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus({ type: "error", message: `Failed to save: ${msg}` });
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    }
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  async function handleClear() {
    if (!actor) return;
    setShowClearModal(false);
    setSaveStatus({ type: "saving" });

    try {
      const result = await (
        actor as backendInterface
      ).clearGoogleCalendarConfig();

      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setIsConfigured(false);
        setScriptUrl("");
        setTitleTemplate("Meeting with [Client Name]");
        setDefaultDuration(60);
        setCalendarId("primary");
        setSaveStatus({ type: "success", message: "Configuration cleared." });
      } else {
        setSaveStatus({
          type: "error",
          message: `Failed to clear: ${result.err ?? "Unknown error"}`,
        });
      }
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus({ type: "error", message: `Failed to clear: ${msg}` });
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    }
  }

  return (
    <AdminLayout pageTitle="Google Calendar">
      <div className="max-w-2xl space-y-8">
        {/* ── Status Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 p-5 rounded-xl border bg-white/3 border-white/10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isConfigured ? "bg-[#5EF08A]/15" : "bg-white/8"
            }`}
          >
            <CalendarCheck
              size={20}
              className={isConfigured ? "text-[#5EF08A]" : "text-gray-400"}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Google Calendar Settings
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Connect your Google Calendar to automatically create events with
              Meet links when clients book.
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              isConfigured === null
                ? "bg-white/8 text-gray-500"
                : isConfigured
                  ? "bg-[#5EF08A]/15 text-[#5EF08A]"
                  : "bg-white/8 text-gray-400"
            }`}
          >
            {isConfigured === null
              ? "CHECKING"
              : isConfigured
                ? "CONNECTED"
                : "NOT CONNECTED"}
          </div>
        </div>

        {/* ── Setup Instructions (only when not configured) ─────────────────── */}
        {isConfigured === false && (
          <div
            style={{
              background: "rgba(10,11,20,0.85)",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <Zap size={16} className="text-[#5EF08A] shrink-0" />
              <h2 className="text-white font-semibold text-sm">
                Setup Instructions
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                {
                  step: 1,
                  text: "Create a Google Apps Script Web App in your Google Workspace account. The script should accept POST requests with booking details and return a JSON response with a meetLink field.",
                },
                {
                  step: 2,
                  text: "Deploy the Apps Script as a Web App with 'Execute as: Me' and 'Who has access: Anyone'.",
                },
                {
                  step: 3,
                  text: "Paste the Web App URL below and configure your event settings.",
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: "rgba(94,240,138,0.15)",
                      color: "#5EF08A",
                    }}
                  >
                    <span className="text-xs font-bold">{step}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#5EF08A] text-xs font-medium hover:underline mt-1"
                data-ocid="admin.google-calendar.docs.link"
              >
                <ExternalLink size={12} />
                Open Google Apps Script
              </a>
            </div>
          </div>
        )}

        {/* ── Configuration Form ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Save size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">Configuration</h2>
            <button
              type="button"
              aria-label="Google Calendar setup instructions"
              onClick={() => setShowCalHelp(true)}
              className="ml-auto flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-transparent text-gray-400 text-xs font-bold cursor-pointer hover:text-[#5EF08A] transition-colors"
            >
              ?
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-5">
            {configLoadError && (
              <div
                style={{
                  color: "#ef4444",
                  border: "1px solid #ef4444",
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                {configLoadError}
              </div>
            )}
            {/* Apps Script URL */}
            <div>
              <label
                htmlFor="gcal-script-url"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Google Apps Script Web App URL
              </label>
              <input
                id="gcal-script-url"
                type="text"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
                data-ocid="admin.google-calendar.script-url.input"
              />
            </div>

            {/* Event Title Template */}
            <div>
              <label
                htmlFor="gcal-title-template"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Event Title Template
              </label>
              <input
                id="gcal-title-template"
                type="text"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="Meeting with [Client Name]"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors"
                data-ocid="admin.google-calendar.title-template.input"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Use{" "}
                <code className="text-gray-400 bg-white/8 px-1 rounded">
                  [Client Name]
                </code>{" "}
                as a placeholder — it will be replaced with the client's actual
                name at booking time.
              </p>
            </div>

            {/* Default Duration */}
            <div>
              <label
                htmlFor="gcal-duration"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Default Meeting Duration (minutes)
              </label>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-500 shrink-0" />
                <input
                  id="gcal-duration"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors"
                  data-ocid="admin.google-calendar.duration.input"
                />
                <span className="text-gray-500 text-sm">minutes</span>
              </div>
            </div>

            {/* Calendar ID */}
            <div>
              <label
                htmlFor="gcal-calendar-id"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Calendar ID
              </label>
              <input
                id="gcal-calendar-id"
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="primary"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
                data-ocid="admin.google-calendar.calendar-id.input"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Use{" "}
                <code className="text-gray-400 bg-white/8 px-1 rounded">
                  primary
                </code>{" "}
                for your main Google Calendar, or paste a specific calendar ID
                from your Google Calendar settings.
              </p>
            </div>

            {/* Status messages */}
            {saveStatus.type === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5EF08A]/10 border border-[#5EF08A]/20">
                <CheckCircle2 size={14} className="text-[#5EF08A] shrink-0" />
                <p className="text-[#5EF08A] text-xs font-medium">
                  {saveStatus.message}
                </p>
              </div>
            )}
            {saveStatus.type === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{saveStatus.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saveStatus.type === "saving" || !scriptUrl.trim()}
              data-ocid="admin.google-calendar.save.button"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                saveStatus.type === "saving" || !scriptUrl.trim()
                  ? "bg-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] hover:shadow-[0_0_16px_rgba(94,240,138,0.3)]"
              }`}
            >
              <Save size={14} />
              {saveStatus.type === "saving" ? "Saving…" : "Save Configuration"}
            </button>
          </form>
        </div>

        {/* ── Danger Zone (only when configured) ───────────────────────────── */}
        {isConfigured && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
            <div className="p-5 border-b border-red-500/20 flex items-center gap-3">
              <Trash2 size={16} className="text-red-400 shrink-0" />
              <h2 className="text-white font-semibold text-sm">Danger Zone</h2>
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">
                  Clear Configuration
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Remove the Google Calendar integration. New bookings will no
                  longer auto-create calendar events.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                data-ocid="admin.google-calendar.clear.button"
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ── Payload Reference ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Code2 size={16} className="text-gray-400 shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Apps Script Payload Reference
            </h2>
          </div>
          <div className="p-5">
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              When a client books a Google Meet session, the system will POST to
              your Apps Script URL with the following fields:
            </p>
            <pre
              className="rounded-lg p-4 text-xs leading-relaxed overflow-x-auto"
              style={{
                background: "rgba(0,0,0,0.4)",
                color: "#5EF08A",
                border: "1px solid rgba(94,240,138,0.15)",
              }}
            >{`{
  name: "Client Name",
  email: "client@example.com",
  business: "Business Name",
  date: "2025-06-15",
  time: "14:00",
  meetingMethod: "Google Meet",
  message: "Booking message",
  titleTemplate: "Meeting with [Client Name]",
  durationMinutes: 60,
  calendarId: "primary",
  serviceType: "Custom Site",
  description: "Service details and notes"
}`}</pre>
            <p className="text-gray-400 text-xs mt-3 leading-relaxed">
              Your script should create a calendar event with a Meet conference
              and return:
            </p>
            <pre
              className="rounded-lg p-4 text-xs mt-2"
              style={{
                background: "rgba(0,0,0,0.4)",
                color: "#5EF08A",
                border: "1px solid rgba(94,240,138,0.15)",
              }}
            >{`{ "meetLink": "https://meet.google.com/xxx-xxxx-xxx" }`}</pre>
          </div>
        </div>
      </div>

      {showCalHelp && (
        <InstructionModal
          isOpen={showCalHelp}
          onClose={() => setShowCalHelp(false)}
          title="How to Set Up Google Calendar Integration"
          steps={CAL_STEPS}
        />
      )}

      {/* ── Clear Confirmation Modal ──────────────────────────────────────────── */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          data-ocid="admin.google-calendar.clear.dialog"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#141625", border: "1px solid #2A2D3E" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/15 shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  Remove Integration?
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  New bookings will no longer auto-create calendar events.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                data-ocid="admin.google-calendar.clear.cancel_button"
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                data-ocid="admin.google-calendar.clear.confirm_button"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
