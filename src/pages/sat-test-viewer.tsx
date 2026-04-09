import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const SATTestViewer = () => {
  const { section, slug } = useParams<{ section: string; slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "sat-test-back") {
        navigate("/sat");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  if (!slug || !section) {
    navigate("/sat");
    return null;
  }

  const testUrl = `/tests/sat/${section}/${slug}.html`;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <button
        onClick={() => navigate("/sat")}
        className="fixed top-4 left-4 z-[60] flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-lg border hover:bg-muted transition-colors"
      >
        ← Back to SAT
      </button>
      <iframe
        src={testUrl}
        className="h-full w-full border-0"
        title="SAT Test"
      />
    </div>
  );
};

export default SATTestViewer;
