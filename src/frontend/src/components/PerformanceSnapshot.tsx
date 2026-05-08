import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

export default function PerformanceSnapshot() {
  const [leads, setLeads] = useState(11);
  const [leadValue, setLeadValue] = useState(200);
  const count = useMotionValue(2200);
  const rounded = useTransform(
    count,
    (v) => `$${Math.round(v).toLocaleString()}`,
  );

  useEffect(() => {
    const controls = animate(count, leads * leadValue, {
      duration: 0.4,
      ease: "easeOut",
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, leadValue, count]);

  const fillPct = ((leads - 1) / (50 - 1)) * 100;

  return (
    <>
      <style>{`
        input[type=range].perf-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          margin: 12px 0;
        }
        input[type=range].perf-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #5EF08A;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(94,240,138,0.7), 0 0 0 3px rgba(94,240,138,0.15);
          transition: box-shadow 0.15s;
        }
        input[type=range].perf-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 18px rgba(94,240,138,0.9), 0 0 0 5px rgba(94,240,138,0.2);
        }
        input[type=range].perf-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #5EF08A;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(94,240,138,0.7);
        }
        input[type=number].lead-value-input::-webkit-inner-spin-button,
        input[type=number].lead-value-input::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
      <div
        style={{
          background: "rgba(17,19,34,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid #1C1F33",
          borderLeft: "4px solid #5EF08A",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "32px",
        }}
        data-ocid="performance_snapshot.panel"
      >
        <h3
          style={{
            color: "#EEF0F8",
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: "4px",
          }}
        >
          Performance Snapshot
        </h3>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "0.875rem",
            marginBottom: "20px",
          }}
        >
          Based on current service gaps and missed engagement.
        </p>

        {/* Average Customer Value input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <label
            htmlFor="lead-value-input"
            style={{ color: "#9CA3AF", fontSize: "0.8rem", flexShrink: 0 }}
          >
            Average Customer Value ($)
          </label>
          <input
            id="lead-value-input"
            type="number"
            className="lead-value-input"
            min={1}
            value={leadValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1) setLeadValue(val);
            }}
            data-ocid="performance_snapshot.lead_value_input"
            style={{
              background: "rgba(19,21,36,1)",
              border: "1px solid #1C1F33",
              borderRadius: "8px",
              color: "#EEF0F8",
              padding: "6px 10px",
              width: "120px",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>

        <p
          style={{ color: "#9CA3AF", fontSize: "0.8rem", marginBottom: "4px" }}
        >
          Estimated Monthly Missed Opportunities
        </p>

        <input
          type="range"
          className="perf-slider"
          min={1}
          max={50}
          step={1}
          value={leads}
          onChange={(e) => setLeads(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #5EF08A ${fillPct}%, #1C1F33 ${fillPct}%)`,
          }}
          data-ocid="performance_snapshot.input"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <span style={{ color: "#7A7D90", fontSize: "0.75rem" }}>
            {leads} missed {leads === 1 ? "opportunity" : "opportunities"}
          </span>
          <span style={{ color: "#7A7D90", fontSize: "0.75rem" }}>50</span>
        </div>

        <div>
          <p
            style={{
              color: "#EEF0F8",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: "6px",
            }}
          >
            Projected Monthly Opportunity Loss
          </p>
          <motion.span
            style={{
              color: "#5EF08A",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {rounded}
          </motion.span>
        </div>

        <p
          style={{
            color: "#7A7D90",
            fontSize: "0.75rem",
            marginTop: "12px",
            borderTop: "1px solid #1C1F33",
            paddingTop: "12px",
          }}
        >
          Estimated monthly opportunity cost based on your specified lead value.
          Adjust both sliders and input for your specific business volume.
        </p>
      </div>
    </>
  );
}
