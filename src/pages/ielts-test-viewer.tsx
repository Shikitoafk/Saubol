import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const IELTSTestViewer = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "ielts-test-back") {
        navigate("/ielts");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  if (!slug) {
    navigate("/ielts");
    return null;
  }

  let testUrl: string;

  if (slug.startsWith("cambridge-")) {
    // e.g. "cambridge-16-test-1-listening" → /tests/cambridge/cambridge-16/test-1/Listening.html
    const parts = slug.split("-"); // ["cambridge","16","test","1","listening"]
    const bookNum = parts[1];
    const testNum = parts[3];
    const skill = parts[4]; // "reading" | "listening" | "writing"
    const fileMap: Record<string, string> = {
      reading: "Reading.html",
      listening: "Listening.html",
      writing: "Writing.html",
    };
    testUrl = `/tests/cambridge/cambridge-${bookNum}/test-${testNum}/${fileMap[skill] ?? "Listening.html"}`;
  } else if (slug.startsWith("mock-")) {
    // e.g. "mock-25-reading" → /tests/mock-tests/mock-25/Reading.html
    const parts = slug.split("-"); // ["mock","25","reading"]
    const mockNum = parts[1];
    const skillPart = parts[2]; // "reading" | "listening" | "writing"
    const fileMap: Record<string, string> = {
      reading: "Reading.html",
      listening: "Listening.html",
      writing: "Writing.html",
    };
    testUrl = `/tests/mock-tests/mock-${mockNum}/${fileMap[skillPart] ?? "Reading.html"}`;
  } else {
    const isListening = slug.startsWith("listening-") || slug.startsWith("full-listening-");
    const folder = isListening ? "listening-predictions" : "reading-predictions";
    testUrl = `/tests/${folder}/${slug}.html`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <button
        onClick={() => navigate("/ielts")}
        className="fixed top-4 left-4 z-[60] flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-lg border hover:bg-muted transition-colors"
      >
        ← Back to IELTS
      </button>
      <iframe
        src={testUrl}
        className="h-full w-full border-0"
        title="IELTS Test"
      />
    </div>
  );
};

export default IELTSTestViewer;
