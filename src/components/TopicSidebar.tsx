import { motion } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  ChevronRight, 
  Lock, 
  CheckCircle2,
  BookOpen,
  Circle,
  TrendingUp
} from "lucide-react";

export interface Topic {
  id: string;
  name: string;
  progress: number;
  isLocked: boolean;
  isCompleted: boolean;
}

export interface Category {
  name: string;
  icon: any;
  topics: Topic[];
}

interface TopicSidebarProps {
  categories: Category[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicSidebar({ categories, activeTopicId, onSelectTopic }: TopicSidebarProps) {
  return (
    <div className="w-80 h-full bg-canvas border-r border-line flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-8 border-b border-line">
        <div className="flex items-center gap-3 mb-4 opacity-30">
           <BookOpen className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">CURRICULUM.</h1>
      </div>

      <div className="p-4 space-y-10">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-4">
            <div className="flex items-center gap-3 px-4 opacity-40">
              <cat.icon className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">{cat.name}</span>
            </div>
            
            <div className="space-y-1">
              {cat.topics.map((topic) => {
                const isActive = activeTopicId === topic.id;
                const status = topic.isCompleted ? 'completed' : topic.isLocked ? 'locked' : isActive ? 'active' : 'available';

                return (
                  <button
                    key={topic.id}
                    disabled={topic.isLocked}
                    onClick={() => onSelectTopic(topic.id)}
                    className={`w-full p-4 rounded-xl transition-all flex flex-col gap-3 group relative overflow-hidden border ${
                      isActive 
                        ? 'bg-surface-2 border-line-strong' 
                        : 'hover:bg-surface border-transparent'
                    } ${topic.isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          topic.isCompleted ? 'bg-emerald-500' : 
                          isActive ? 'bg-white' : 
                          'bg-surface-2'
                        }`} />
                        <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${
                          isActive ? 'text-ink' : 
                          topic.isCompleted ? 'text-emerald-400' :
                          'text-ink-muted group-hover:text-ink'
                        }`}>
                          {topic.name}
                        </span>
                      </div>
                      {topic.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : topic.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-ink-subtle" />
                      ) : (
                        <Circle className={`w-3.5 h-3.5 text-ink/10 ${isActive ? 'fill-white/10' : ''}`} />
                      )}
                    </div>

                    {!topic.isLocked && (
                      <div className="space-y-1.5 relative z-10">
                        <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                          <motion.div 
                            initial={false}
                            animate={{ width: `${topic.progress}%` }}
                            className={`h-full ${topic.isCompleted ? 'bg-emerald-500' : 'bg-surface-2'}`}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-30">
                          <span>Mastery</span>
                          <span>{topic.progress}%</span>
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <motion.div 
                        layoutId="active-highlight"
                        className="absolute left-0 w-1 h-8 bg-white my-auto inset-y-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-8 border-t border-line bg-surface">
        <div className="space-y-4">
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[9px] font-black text-ink-subtle uppercase tracking-widest mb-1">Total Progress</p>
                 <p className="text-xl font-black italic">12.5%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-ink/10" />
           </div>
           <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
              <div className="h-full w-1/8 bg-surface-2" />
           </div>
        </div>
      </div>
    </div>
  );
}
