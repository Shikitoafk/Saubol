import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Brain, Loader2, ChevronDown, ChevronRight, Bookmark, BookmarkCheck, Sparkles, Zap, Globe, Target } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { semanticSearch } from "@/lib/ai-search";

export interface Program {
  id: string | number;
  name: string;
  details: string;
  overview?: string;
  format: string;
  location: string;
  price: string;
  subject: string;
  url?: string;
  score?: number;
}

const SUBJECT_FILTERS = ["All", "Mixed", "STEM", "Medicine", "Humanities", "Engineering", "Business", "Art", "Computer Science"];
const FORMAT_FILTERS = ["All", "Remote", "In-Person", "Both"];
const PRICE_FILTERS = ["All", "Free", "Paid"];

async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await supabase.from("programs").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function Programs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const { user } = useAuth();
  const { data: programs = [], isLoading } = useQuery<Program[]>({ queryKey: ["programs"], queryFn: fetchPrograms });

  const toggleBookmark = async (p: Program) => {
    if (!user) return;
    const isSaved = savedPrograms.has(p.name);
    if (isSaved) {
      await supabase.from("saved_programs").delete().eq("user_id", user.id).eq("program_name", p.name);
      setSavedPrograms(prev => { const next = new Set(prev); next.delete(p.name); return next; });
    } else {
      await supabase.from("saved_programs").insert({ user_id: user.id, program_name: p.name, program_url: p.url || "" });
      setSavedPrograms(prev => new Set(prev).add(p.name));
    }
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const results = await semanticSearch(aiQuery, programs);
      setAiResults(results);
    } finally { setIsAiSearching(false); }
  };

  const filteredPrograms = useMemo(() => {
    return (aiResults.length > 0 ? aiResults : programs).filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "All" || p.subject === selectedSubject;
      const matchesFormat = selectedFormat === "All" || p.format === selectedFormat;
      const matchesPrice = selectedPrice === "All" || p.price === selectedPrice;
      return matchesSearch && matchesSubject && matchesFormat && matchesPrice;
    });
  }, [searchQuery, selectedSubject, selectedFormat, selectedPrice, programs, aiResults]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] right-[-5%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-24 relative z-10">
          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">Global Opportunities</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-shimmer leading-[0.85] mb-8 uppercase">
              PROGRAMS <br /> & CAMPS.
            </h1>
            <p className="text-xl text-[#a6a6ae] font-medium max-w-2xl leading-relaxed">
              Открой для себя лучшие летние школы, стажировки и исследовательские программы, которые выделят тебя среди тысяч абитуриентов.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: AI & Filters */}
            <div className="lg:w-80 shrink-0 space-y-12">
               {/* AI Matchmaker Card */}
               <div className="glass-3d p-8 border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400">AI Matchmaker</span>
                  </div>
                  <p className="text-xs font-bold text-white/75 uppercase tracking-widest leading-relaxed mb-8">Опиши свои интересы, и AI подберет идеальный лагерь.</p>
                  <textarea 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. I want a free STEM camp in USA..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium focus:outline-none focus:border-indigo-500/50 transition-all h-32 mb-6 placeholder:text-white/40"
                  />
                  <Button onClick={handleAiSearch} disabled={isAiSearching} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest">
                    {isAiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "FIND MY PATH"}
                  </Button>
               </div>

               {/* Standard Filters */}
               <div className="space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-6">Subject Area</h3>
                    <div className="flex flex-wrap gap-2">
                       {SUBJECT_FILTERS.map(f => (
                         <button key={f} onClick={() => setSelectedSubject(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${selectedSubject === f ? 'bg-white text-black border-white' : 'bg-transparent border-white/5 text-white/75 hover:border-white/20'}`}>{f}</button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-6">Format</h3>
                    <div className="flex flex-wrap gap-2">
                       {FORMAT_FILTERS.map(f => (
                         <button key={f} onClick={() => setSelectedFormat(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${selectedFormat === f ? 'bg-white text-black border-white' : 'bg-transparent border-white/5 text-white/75 hover:border-white/20'}`}>{f}</button>
                       ))}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => { setSelectedSubject("All"); setSelectedFormat("All"); setAiResults([]); }} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 p-0 hover:bg-transparent">Clear Filters</Button>
               </div>
            </div>

            {/* Right Column: Grid */}
            <div className="flex-1">
               {isLoading ? (
                 <div className="flex flex-col items-center py-32 opacity-20">
                    <Loader2 className="w-12 h-12 animate-spin mb-6" />
                    <span className="text-xs font-black uppercase tracking-[0.5em]">Fetching Opportunities</span>
                 </div>
               ) : (
                 <div className="grid gap-8 md:grid-cols-2">
                    {filteredPrograms.map((p) => (
                      <div key={p.id} className="glass-3d p-10 flex flex-col group hover:border-white/20 transition-all">
                         <div className="flex justify-between items-start mb-10">
                            <div className="flex flex-wrap gap-2">
                               <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[8px] font-black uppercase tracking-widest">{p.subject}</Badge>
                               <Badge className={`${p.price === 'Free' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'} border-none text-[8px] font-black uppercase tracking-widest`}>{p.price}</Badge>
                               {p.score !== undefined && (
                                 <Badge className="bg-white/10 text-white border-none text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                   <Sparkles className="w-2 h-2" /> Match: {Math.round(p.score * 100)}%
                                 </Badge>
                               )}
                            </div>
                            {user && (
                              <button onClick={() => toggleBookmark(p)} className="text-[#222] hover:text-white transition-colors">
                                {savedPrograms.has(p.name) ? <BookmarkCheck className="w-5 h-5 text-indigo-400" /> : <Bookmark className="w-5 h-5" />}
                              </button>
                            )}
                         </div>
                         <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-shimmer transition-all uppercase leading-tight">{p.name}</h3>
                         <p className="text-xs font-medium text-[#a6a6ae] leading-relaxed mb-10 line-clamp-2">{p.details}</p>
                         
                         <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[9px] font-black text-white/60 uppercase tracking-widest">
                               <MapPin className="w-3 h-3" /> {p.location}
                            </div>
                            <Sheet>
                               <SheetTrigger asChild>
                                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white hover:bg-transparent p-0">Details <ChevronRight className="w-4 h-4 ml-1" /></Button>
                               </SheetTrigger>
                               <SheetContent className="bg-black border-white/10 text-white">
                                  <SheetHeader className="text-left py-10">
                                     <div className="flex gap-2 mb-6">
                                        <Badge className="bg-indigo-500/10 text-indigo-400">{p.subject}</Badge>
                                        <Badge className="bg-white/5 text-white">{p.price}</Badge>
                                     </div>
                                     <SheetTitle className="text-4xl font-black text-shimmer uppercase tracking-tighter mb-4">{p.name}</SheetTitle>
                                     <SheetDescription className="text-[#a6a6ae] font-medium leading-relaxed">{p.details}</SheetDescription>
                                  </SheetHeader>
                                  <div className="space-y-12 py-10">
                                     {p.overview && (
                                       <div>
                                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Program Overview</h4>
                                          <p className="text-sm font-medium leading-relaxed text-[#c2c2c9]">{p.overview}</p>
                                       </div>
                                     )}
                                     <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                                           <Target className="w-4 h-4 text-indigo-400" />
                                           <span>Location: {p.location}</span>
                                        </div>
                                     </div>
                                     <Button className="w-full bg-white text-black hover:bg-gray-200 h-16 rounded-xl font-black uppercase text-xs shadow-[0_15px_30px_rgba(255,255,255,0.1)]" onClick={() => p.url && window.open(p.url, '_blank')}>Visit Official Site</Button>
                                  </div>
                               </SheetContent>
                            </Sheet>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
