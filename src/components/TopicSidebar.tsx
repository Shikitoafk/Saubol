import { motion } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  ChevronRight, 
  Lock, 
  CheckCircle2,
  BookOpen
} from "lucide-react";

interface Topic {
  name: string;
  progress: number;
  isLocked: boolean;
  isCompleted: boolean;
}

interface Category {
  name: string;
  icon: any;
  topics: Topic[];
}

interface TopicSidebarProps {
  categories: Category[];
  activeTopic: string;
  onSelectTopic: (topic: string) => void;
}

export default function TopicSidebar({ categories, activeTopic, onSelectTopic }: TopicSidebarProps) {
  return (
    <div className="w-80 h-full bg-black border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-8 border-b border-white/5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Curriculum</h2>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">SAT Mastery.</h1>
      </div>

      <div className="p-4 space-y-8">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-4">
            <div className="flex items-center gap-3 px-4 opacity-40">
              <cat.icon className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">{cat.name}</span>
            </div>
            
            <div className="space-y-1">
              {cat.topics.map((topic) => {
                const isActive = activeTopic === topic.name;
                return (
                  <button
                    key={topic.name}
                    disabled={topic.isLocked}
                    onClick={() => onSelectTopic(topic.name)}
                    className={`w-full p-4 rounded-xl transition-all flex flex-col gap-3 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-indigo-600/10 border border-indigo-500/20' 
                        : 'hover:bg-white/5 border border-transparent'
                    } ${topic.isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-white/60 group-hover:text-white'
                      }`}>
                        {topic.name}
                      </span>
                      {topic.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : topic.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-white/20" />
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-indigo-400' : 'text-white/10 group-hover:translate-x-1'}`} />
                      )}
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                        <span className="text-white/20">Mastery</span>
                        <span className={topic.progress >= 70 ? 'text-emerald-400' : 'text-indigo-400'}>{topic.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.progress}%` }}
                          className={`h-full ${topic.progress >= 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </div>

                    {isActive && (
                      <motion.div 
                        layoutId="active-bg"
                        className="absolute inset-0 bg-indigo-500/5 z-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <BookOpen className="w-5 h-5 text-indigo-400" />
           </div>
           <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Global Progress</p>
              <p className="text-lg font-black italic">24.5% Mastery</p>
           </div>
        </div>
      </div>
    </div>
  );
}
