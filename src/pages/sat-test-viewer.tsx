import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const SATTestViewer = () => {
  const { section, slug } = useParams<{ section: string; slug: string }>();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

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

  const testUrl = `/tests/sat/${section.toLowerCase()}/${slug.toLowerCase()}.html`;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col font-sans">
      {/* Premium Header Wrapper */}
      <div className="absolute top-6 left-6 z-[60] flex items-center gap-4">
        <Button 
          onClick={() => navigate("/sat")}
          className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl"
        >
          <ChevronLeft className="w-4 h-4" /> Exit Session
        </Button>
        <div className="px-4 py-3 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md hidden md:flex items-center gap-3 shadow-2xl">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">High-Performance Mode</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
           <div className="bg-vignette opacity-50" />
           <Loader2 className="w-12 h-12 animate-spin text-white mb-6 relative z-10" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#444] relative z-10 animate-pulse">Launching SAT Test Environment</p>
        </div>
      )}

      {/* Test Frame */}
      <iframe
        src={testUrl}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        title="SAT Test"
      />
      
      {/* Bottom Status Bar */}
      <div className="h-2 bg-blue-600/20 w-full overflow-hidden shrink-0">
         <div className="h-full bg-blue-500 animate-shimmer" style={{ width: isLoaded ? '100%' : '30%' }} />
      </div>
    </div>
  );
};

export default SATTestViewer;
