import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center relative overflow-hidden font-sans">
      {/* Depth Background */}
      <div className="bg-vignette" />
      <div className="bg-sphere top-[-10%] right-[-10%] opacity-20" />
      
      <div className="max-w-xl w-full px-10 relative z-10 text-center">
        <div className="glass-3d p-16 group">
          <div className="flex justify-center mb-12">
            <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center border border-line shadow-[0_0_40px_rgba(255,255,255,0.05)] group-hover:scale-110 transition-transform duration-500">
              <Compass className="w-10 h-10 text-ink opacity-40 animate-spin-slow" />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-rose-500">Navigation Error 404</span>
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter mb-8 text-shimmer">
            LOST IN <br /> SPACE.
          </h1>
          
          <p className="text-ink-muted font-medium mb-12 leading-relaxed uppercase tracking-widest text-[10px]">
            The academic resources you are looking for have drifted beyond the reach of our current network.
          </p>
          
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-white text-black hover:bg-gray-100 h-16 rounded-2xl font-black tracking-widest uppercase text-xs shadow-[0_15px_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            <ChevronLeft className="w-4 h-4" /> Return to Base
          </Button>
        </div>
      </div>
    </div>
  );
}
