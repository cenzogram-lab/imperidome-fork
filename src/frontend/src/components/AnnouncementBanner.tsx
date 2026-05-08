import { EditableText } from "./EditableText";

/**
 * AnnouncementBanner — full-width, fixed at z-[60] above the Navbar (z-50).
 * Dark glassmorphism strip with a 1px neon green bottom border.
 * Text is wired into the Inline CMS so the Admin can click-to-edit it live.
 */
export function AnnouncementBanner() {
  return (
    <div
      data-ocid="announcement.banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,10,10,0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #39FF14",
        boxShadow: "0 0 8px rgba(57,255,20,0.25), 0 0 20px rgba(57,255,20,0.1)",
        padding: "0 16px",
      }}
    >
      <EditableText
        textKey="announcement.banner"
        defaultText="NEW: AI Receptionists coming soon, NEVER MISS A LEAD!"
        as="span"
        style={{
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      />
    </div>
  );
}

export default AnnouncementBanner;
