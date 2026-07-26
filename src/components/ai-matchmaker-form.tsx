import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  GraduationCap, 
  Globe, 
  Target,
  Zap,
  Building2,
  Trophy
} from "lucide-react";

export interface MatchmakerData {
  gpa: string;
  sat: string;
  ielts: string;
  major: string;
  region: string;
  budget: string;
}

export default function AIMatchmakerForm({ onComplete }: { onComplete: (data: MatchmakerData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<MatchmakerData>({
    gpa: "",
    sat: "",
    ielts: "",
    major: "",
    region: "",
    budget: ""
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const steps = [
    {
      title: "Academic Profile",
      icon: GraduationCap,
      fields: [
        { name: "gpa", label: "GPA (e.g. 3.8/4.0)", placeholder: "3.8" },
        { name: "sat", label: "SAT Score", placeholder: "1550" },
        { name: "ielts", label: "IELTS/TOEFL", placeholder: "7.5" }
      ]
    },
    {
      title: "Ambitions",
      icon: Target,
      fields: [
        { name: "major", label: "Preferred Major", placeholder: "Computer Science" },
        { name: "region", label: "Target Region", placeholder: "USA / Europe / Asia" }
      ]
    },
    {
      title: "Resources",
      icon: Building2,
      fields: [
        { name: "budget", label: "Annual Budget ($)", placeholder: "20,000" }
      ]
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-3d p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
               <currentStep.icon className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Step {step} of 3</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{currentStep.title}</h3>
            </div>
          </div>

          <div className="space-y-8 mb-12">
            {currentStep.fields.map(f => (
              <div key={f.name}>
                <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">{f.label}</label>
                <input 
                  type="text" 
                  value={(data as any)[f.name]}
                  onChange={e => setData({ ...data, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 h-14 text-white focus:outline-none focus:border-yellow-500/50 transition-colors font-medium"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={prev} className="text-[10px] font-black uppercase tracking-widest text-[#8b8b93] hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : <div />}
            
            {step < 3 ? (
              <Button onClick={next} className="bg-white text-black hover:bg-gray-100 rounded-xl px-8 h-14 font-black uppercase text-xs">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => onComplete(data)} className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl px-12 h-14 font-black uppercase text-xs shadow-[0_20px_40px_rgba(234,179,8,0.2)]">
                Generate Path <Zap className="ml-2 w-4 h-4 fill-current" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
