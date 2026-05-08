import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const IELTSTestViewer = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data === "ielts-test-back") {
        navigate("/ielts");
      }
      
      if (e.data?.type === "ielts-test-result") {
        const { score, total, skill, slug: testSlug } = e.data;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("ielts_progress").insert({
              user_id: user.id,
              test_name: testSlug || slug,
              skill: skill || (slug?.includes("reading") ? "reading" : "listening"),
              score: score,
              total: total || 40,
            });
          }
        } catch (err) {
          console.error('Failed to process test result:', err);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, slug]);

  if (!slug) {
    navigate("/ielts");
    return null;
  }

  let testUrl: string;
  const cambridgeMatch = /^cambridge-ielts-(\d+)-academic-test-([1-4])-(reading|listening)$/.exec(slug);
  if (cambridgeMatch) {
    const book = cambridgeMatch[1];
    const testNum = cambridgeMatch[2];
    const skill = cambridgeMatch[3];
    testUrl = `/tests/cambridge/cambridge-ielts-${book}-academic/test-${testNum}/${skill === "reading" ? "Reading.html" : "Listening.html"}`;
  } else if (slug.startsWith("mock-")) {
    const parts = slug.split("-");
    testUrl = `/tests/mock-tests/mock-${parts[1]}/${parts[2] === "writing" ? "Writing.html" : parts[2] === "listening" ? "Listening.html" : "Reading.html"}`;
  } else {
    const isListening = slug.startsWith("listening-") || slug.startsWith("full-listening-");
    testUrl = `/tests/${isListening ? "listening-predictions" : "reading-predictions"}/${slug}.html`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col font-sans">
      {/* Premium Header Wrapper */}
      <div className="absolute top-6 left-6 z-[60] flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-white/10 mr-2">
          <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
          <span className="font-black text-sm tracking-tighter text-white uppercase">SAUBOL</span>
        </div>
        <Button 
          onClick={() => navigate("/ielts")}
          className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl"
        >
          <ChevronLeft className="w-4 h-4" /> Exit Session
        </Button>
        <div className="px-4 py-3 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md hidden md:flex items-center gap-3 shadow-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Secure Environment</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
           <div className="bg-vignette opacity-50" />
           <Loader2 className="w-12 h-12 animate-spin text-white mb-6 relative z-10" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#444] relative z-10 animate-pulse">Initializing Test Engine</p>
        </div>
      )}

      {/* Test Frame */}
      <iframe
        src={testUrl}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        title="IELTS Test"
      />
      
      {/* Bottom Status Bar */}
      <div className="h-2 bg-indigo-600/20 w-full overflow-hidden shrink-0">
         <div className="h-full bg-indigo-500 animate-shimmer" style={{ width: isLoaded ? '100%' : '30%' }} />
      </div>
    </div>
  );
};

export default IELTSTestViewer;
