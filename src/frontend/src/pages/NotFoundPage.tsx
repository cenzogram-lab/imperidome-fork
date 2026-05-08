import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />
      <main
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "#1B2D4F" }}
        data-ocid="not_found.section"
      >
        <div className="text-center px-6 py-20">
          <p
            className="font-bold leading-none mb-6"
            style={{
              fontSize: "clamp(96px, 16vw, 160px)",
              color: "#3B82C4",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            <EditableText textKey="not-found.error_code" defaultText="404" />
          </p>
          <h2
            className="text-white font-bold mb-4"
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            <EditableText
              textKey="not-found.heading"
              defaultText="This Page Does Not Exist."
            />
          </h2>
          <p
            className="text-white mb-10 max-w-md mx-auto"
            style={{
              fontSize: "17px",
              fontFamily: "Arial, Inter, sans-serif",
              lineHeight: "1.6",
              opacity: 0.85,
            }}
          >
            <EditableText
              textKey="not-found.body"
              defaultText="The page you are looking for has moved, been deleted, or never existed."
            />
          </p>
          <a
            href="/"
            data-ocid="not_found.primary_button"
            className="inline-block font-bold rounded-[6px] px-8 py-3 transition-opacity duration-150 hover:opacity-90"
            style={{
              backgroundColor: "#ffffff",
              color: "#1B2D4F",
              border: "2px solid #1B2D4F",
              fontSize: "15px",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            <EditableText
              textKey="not-found.cta_button_text"
              defaultText="Back to Home"
            />
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
