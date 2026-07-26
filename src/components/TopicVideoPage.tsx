import { motion } from "framer-motion";
import { 
  Play, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoResource } from "@/data/sat-video-library";

interface TopicVideoPageProps {
  video: VideoResource;
  onStartPractice: () => void;
}

export default function TopicVideoPage({ video, onStartPractice }: TopicVideoPageProps) {
  return (
    <div className="max-w-6xl mx-auto p-12 selection:bg-indigo-500/30">
      {/* Breadcrumbs Placeholder Style */}
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-ink-subtle mb-12">
         <span>SAT Learn</span>
         <span className="opacity-40">/</span>
         <span className="text-ink-muted">{video.title}</span>
      </div>

      <header className="mb-12">
        <h1 className="text-7xl font-black uppercase italic tracking-tighter text-shimmer leading-none mb-6">
          {video.title}.
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-line">
             <Clock className="w-3 h-3 text-ink-muted" />
             <span className="text-[9px] font-black uppercase text-ink-muted">{video.duration} Exploration</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
             <Zap className="w-3 h-3 text-indigo-400" />
             <span className="text-[9px] font-black uppercase text-indigo-400">Concept Mastery Flow</span>
          </div>
        </div>
      </header>

      {/* Video Container */}
      <div className="aspect-video w-full glass-3d border-line overflow-hidden mb-16 relative group">
        {video.videoId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        ) : (
          <div className="w-full h-full bg-surface flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center border border-line group-hover:scale-110 transition-transform">
               <Play className="w-8 h-8 text-ink-subtle" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-ink-subtle">Video Coming Soon</p>
            <Button variant="outline" onClick={onStartPractice} className="border-line text-ink-muted uppercase font-black text-[10px] tracking-widest h-12 px-8 rounded-xl hover:bg-surface">
               Skip to Practice <ArrowRight className="ml-2 w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-10">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">What you'll practice after:</h3>
            <div className="space-y-4">
              {video.topics_covered.map((topic, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-lg font-medium text-ink-muted group-hover:text-ink transition-colors">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-16 h-16 text-indigo-400" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <AlertCircle className="w-5 h-5 text-indigo-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Strategy Note</h4>
              </div>
              <p className="text-ink-muted text-sm leading-relaxed font-medium mb-8">
                 Watch the video to understand the "why" behind the concepts. SAT questions are designed to trap students who only memorize formulas. The following practice session will test your ability to apply these strategies in real exam scenarios.
              </p>
              <Button 
                onClick={onStartPractice}
                className="w-full h-20 bg-white text-black font-black uppercase text-xs rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Start Practice Session <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
