import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ClipboardList } from "lucide-react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 font-sans relative overflow-hidden">
        <div className="bg-vignette" />
        <div
          className="bg-sphere top-[-20%] left-[-10%] opacity-40 animate-pulse"
          style={{
            width: "1200px",
            height: "1200px",
            background: "radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)",
          }}
        />

        <main className="relative z-10">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-[1400px] mx-auto px-10 py-32"
          >
            <motion.div variants={item} className="text-center mb-24 pt-20">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-shimmer mb-8 uppercase italic leading-[0.9]">
                IELTS & SAT
                <br />
                Practice
              </h1>
              <p className="text-xl md:text-2xl text-ink-muted max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                Free IELTS tests and SAT question bank. No extra paths — just study materials.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div
                variants={item}
                whileHover={{ translateY: -10 }}
                className="glass-3d p-12 flex flex-col justify-between min-h-[360px] border-indigo-500/10 hover:border-indigo-500/30 group cursor-pointer"
                onClick={() => navigate("/ielts")}
              >
                <div>
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-10 group-hover:bg-indigo-500/20 transition-all">
                    <BookOpen className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic mb-6">IELTS Tests</h2>
                  <p className="text-ink-muted text-lg font-medium leading-relaxed">
                    Reading and listening prediction tests in a timed exam interface.
                  </p>
                </div>
                <Button className="w-full h-16 bg-indigo-600 text-white font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform mt-10">
                  Open IELTS <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div
                variants={item}
                whileHover={{ translateY: -10 }}
                className="glass-3d p-12 flex flex-col justify-between min-h-[360px] border-violet-500/10 hover:border-violet-500/30 group cursor-pointer"
                onClick={() => navigate("/sat/practice")}
              >
                <div>
                  <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 mb-10 group-hover:bg-violet-500/20 transition-all">
                    <ClipboardList className="w-10 h-10 text-violet-400" />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic mb-6">SAT Question Bank</h2>
                  <p className="text-ink-muted text-lg font-medium leading-relaxed">
                    Practice questions with filters by section, category, and difficulty.
                  </p>
                </div>
                <Button className="w-full h-16 bg-violet-600 text-white font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform mt-10">
                  Start Practice <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}
