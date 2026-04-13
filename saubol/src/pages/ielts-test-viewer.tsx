import { useParams, useNavigate } from "react-router-dom";

const SKILL_LABELS: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
};

const SKILL_EMOJI: Record<string, string> = {
  reading: "📖",
  listening: "🎧",
  writing: "✍️",
};

const IELTSTestViewer = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    navigate("/ielts");
    return null;
  }

  let testUrl: string;
  let title = "";
  let showDarkHeader = false;

  if (slug.startsWith("cambridge-")) {
    const parts = slug.split("-");
    const bookNum = parts[1];
    const testNum = parts[3];
    const skill = parts[4];

    const emoji = SKILL_EMOJI[skill] ?? "📖";
    const label = SKILL_LABELS[skill] ?? skill;
    title = `${emoji} Cambridge IELTS ${bookNum} · Test ${testNum} — ${label}`;
    showDarkHeader = true;

    if (skill === "writing") {
      testUrl = `/tests/cambridge/cambridge-${bookNum}/test-${testNum}/Writing.html`;
    } else if (skill === "listening") {
      testUrl = `/api/test-proxy?url=${encodeURIComponent(
        `https://engnovate.com/ielts-listening-tests/cambridge-ielts-${bookNum}-academic-listening-test-${testNum}/`
      )}`;
    } else {
      testUrl = `/tests/cambridge/cambridge-${bookNum}/test-${testNum}/Reading.html`;
    }
  } else if (slug.startsWith("mock-")) {
    const parts = slug.split("-");
    const mockNum = parts[1];
    const skillPart = parts[2];
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

  if (showDarkHeader) {
    return (
      <div className="fixed inset-0 z-50" style={{ background: "#0f172a" }}>
        <div
          className="flex items-center gap-3 px-4"
          style={{ height: 48, background: "#1e293b", borderBottom: "1px solid #334155" }}
        >
          <button
            onClick={() => navigate("/ielts")}
            style={{
              fontSize: 13, fontWeight: 600, color: "#94a3b8",
              padding: "5px 12px", border: "1px solid #334155",
              borderRadius: 6, background: "transparent",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = "#f1f5f9"; (e.target as HTMLElement).style.borderColor = "#64748b"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = "#94a3b8"; (e.target as HTMLElement).style.borderColor = "#334155"; }}
          >
            ← Back
          </button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
            {title}
          </span>
          <div style={{ width: 80, flexShrink: 0 }} />
        </div>
        <iframe
          src={testUrl}
          style={{ position: "absolute", top: 48, left: 0, right: 0, bottom: 0, width: "100%", height: "calc(100% - 48px)", border: "none" }}
          title="IELTS Test"
        />
      </div>
    );
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
