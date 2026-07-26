import { motion } from "framer-motion";
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Lightbulb,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SATLesson } from "@/data/sat-lessons";
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LessonViewerProps {
  lesson: SATLesson;
  onStartPractice: () => void;
}

export default function LessonViewer({ lesson, onStartPractice }: LessonViewerProps) {
  const renderText = (text: string) => {
    if (!text) return "";
    try {
      return text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => 
        katex.renderToString(math, { displayMode: true, throwOnError: false })
      ).replace(/\$([\s\S]+?)\$/g, (_, math) => 
        katex.renderToString(math, { displayMode: false, throwOnError: false })
      );
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-12 space-y-16 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="space-y-6">
        <div className="flex items-center gap-3 opacity-60">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">{lesson.category}</span>
        </div>
        <h1 className="text-6xl font-black uppercase italic tracking-tighter text-shimmer leading-none">
          {lesson.topic}.
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-line">
             <Clock className="w-3 h-3 text-ink-muted" />
             <span className="text-[9px] font-black uppercase text-ink-muted">{lesson.readTime} Read</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
             <Zap className="w-3 h-3 text-indigo-400" />
             <span className="text-[9px] font-black uppercase text-indigo-400">Unlock Practice after reading</span>
          </div>
        </div>
      </header>

      {/* Concepts */}
      <section className="space-y-12">
        {lesson.concepts.map((concept, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-3d p-10 border-line relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-indigo-400 opacity-20">0{i + 1}</span>
              {concept.title}
            </h3>
            <p className="text-ink-muted text-lg leading-relaxed mb-6 font-medium" dangerouslySetInnerHTML={{ __html: renderText(concept.description) }} />
            {concept.example && (
              <div className="p-6 bg-canvas/40 rounded-2xl border border-line font-mono text-sm">
                 <div className="text-[9px] font-black uppercase text-indigo-400 mb-3 opacity-40">Interactive Example</div>
                 <div className="text-ink" dangerouslySetInnerHTML={{ __html: renderText(concept.example) }} />
              </div>
            )}
          </motion.div>
        ))}
      </section>

      {/* Worked Example */}
      <section className="glass-3d p-12 bg-indigo-600/5 border-indigo-500/20">
        <div className="flex items-center gap-3 mb-8">
          <Lightbulb className="w-6 h-6 text-indigo-400" />
          <h3 className="text-2xl font-black uppercase tracking-tight italic">Worked Example.</h3>
        </div>
        <div className="space-y-8">
           <div className="text-xl font-bold leading-relaxed border-b border-line pb-8" dangerouslySetInnerHTML={{ __html: renderText(lesson.workedExample.question) }} />
           <div>
              <div className="text-[9px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Step-by-Step Solution</div>
              <div className="text-ink whitespace-pre-line leading-loose font-medium" dangerouslySetInnerHTML={{ __html: renderText(lesson.workedExample.solution) }} />
           </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="space-y-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500/60 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Common Strategy Pitfalls
        </h4>
        <div className="grid gap-4">
          {lesson.commonMistakes.map((mistake, i) => (
            <div key={i} className="flex gap-4 p-6 bg-surface rounded-2xl border border-line">
               <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <span className="text-[10px] font-black text-rose-500">!</span>
               </div>
               <p className="text-ink-muted font-medium text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderText(mistake) }} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="pt-12">
        <Button 
          onClick={onStartPractice}
          className="w-full h-24 bg-white text-black font-black uppercase text-sm rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
        >
          Master this topic <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
