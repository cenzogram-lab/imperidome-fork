import { Play } from "lucide-react";

interface VideoCardProps {
  videoUrl?: string;
  title?: string;
  description?: string;
}

function isYouTubeUrl(url: string) {
  return /youtu\.be|youtube\.com/.test(url);
}

function isVimeoUrl(url: string) {
  return /vimeo\.com/.test(url);
}

function getYouTubeEmbedUrl(url: string) {
  const match =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getVimeoEmbedUrl(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}

export function VideoCard({ videoUrl, title, description }: VideoCardProps) {
  const hasVideo = Boolean(videoUrl);

  return (
    <div
      style={{
        background: "rgba(17,19,34,0.9)",
        border: "1px solid #1C1F33",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(94,240,138,0.35)";
        el.style.boxShadow = "0 0 20px rgba(94,240,138,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "#1C1F33";
        el.style.boxShadow = "none";
      }}
    >
      {/* 16:9 video area */}
      <div
        style={{ position: "relative", paddingTop: "56.25%", width: "100%" }}
      >
        {hasVideo ? (
          <>
            {isYouTubeUrl(videoUrl!) || isVimeoUrl(videoUrl!) ? (
              <iframe
                src={
                  isYouTubeUrl(videoUrl!)
                    ? getYouTubeEmbedUrl(videoUrl!)
                    : getVimeoEmbedUrl(videoUrl!)
                }
                title={title ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            ) : (
              // biome-ignore lint/a11y/useMediaCaption: placeholder video
              <video
                src={videoUrl}
                controls
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </>
        ) : (
          /* Placeholder */
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(17,19,34,0.95) 0%, rgba(28,31,51,0.95) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            {/* Decorative grid lines */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(94,240,138,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,240,138,0.04) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Play button circle */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "2px solid rgba(94,240,138,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(94,240,138,0.07)",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Play
                size={22}
                color="#5EF08A"
                fill="rgba(94,240,138,0.3)"
                style={{ marginLeft: "3px" }}
              />
            </div>

            {/* Label */}
            <p
              style={{
                color: "#7A7D90",
                fontSize: "0.8rem",
                fontWeight: "500",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                position: "relative",
                zIndex: 1,
                margin: 0,
              }}
            >
              Video coming soon
            </p>
          </div>
        )}
      </div>

      {/* Bottom info section — only when title or description provided */}
      {(title ?? description) && (
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #1C1F33",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {title && (
            <p
              style={{
                color: "#EEF0F8",
                fontSize: "0.925rem",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {title}
            </p>
          )}
          {description && (
            <p
              style={{
                color: "#7A7D90",
                fontSize: "0.825rem",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoCard;
