export function AuditReferralSection() {
  return (
    <section
      style={{ backgroundColor: "rgba(14,16,32,1)" }}
      className="py-16 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Card — Site Audit */}
          <div
            className="rounded-[8px] p-8"
            style={{
              backgroundColor: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #1C1F33",
            }}
          >
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#FFF3E0", color: "#C2500A" }}
            >
              $99 ONE-TIME
            </span>
            <h3
              className="text-xl font-bold mb-4"
              style={{
                color: "#EEF0F8",
                fontFamily: "Inter, Arial, sans-serif",
              }}
            >
              See Exactly What Your Site Is Missing.
            </h3>
            <p
              className="text-base mb-6"
              style={{
                color: "#7A7D90",
                fontFamily: "Inter, Arial, sans-serif",
                lineHeight: "1.6",
              }}
            >
              We audit your current site and deliver a 1-page PDF with the 5
              specific issues costing you leads right now. If you build with us
              within 30 days, the $99 comes off your invoice.
            </p>
            <a
              href="/get-started?intent=audit&pay=true"
              data-ocid="audit_referral.audit.primary_button"
              className="inline-block font-semibold px-6 py-3 rounded text-sm transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#5EF08A",
                color: "#061209",
                fontFamily: "Inter, Arial, sans-serif",
              }}
            >
              Order My Audit — $99
            </a>
          </div>

          {/* Right Card — Referral */}
          <div
            className="rounded-[8px] p-8"
            style={{
              backgroundColor: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #1C1F33",
            }}
          >
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#E0F7F4", color: "#0F766E" }}
            >
              FREE MONTH
            </span>
            <h3
              className="text-xl font-bold mb-4"
              style={{
                color: "#EEF0F8",
                fontFamily: "Inter, Arial, sans-serif",
              }}
            >
              Refer a Business. Get a Free Month.
            </h3>
            <p
              className="text-base mb-6"
              style={{
                color: "#7A7D90",
                fontFamily: "Inter, Arial, sans-serif",
                lineHeight: "1.6",
              }}
            >
              Refer any business owner who signs with us at Tier 3 or above and
              your next month is free. Tier 1 or 2 referrals earn a $50 account
              credit. No forms, no tracking codes. Just reply to any email with
              their name and number.
            </p>
            <a
              href="/about"
              data-ocid="audit_referral.referral.secondary_button"
              className="inline-block font-semibold px-6 py-3 rounded text-sm transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                fontFamily: "Inter, Arial, sans-serif",
              }}
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
