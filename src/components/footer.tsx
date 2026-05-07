import { Link } from "react-router-dom";
import { Send, Globe, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-24 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8 group">
              <img 
                src="/logo.png" 
                alt="Saubol Logo" 
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              />
              <span className="font-black text-2xl tracking-tighter text-white uppercase">
                SAUBOL
              </span>
            </div>
            <p className="text-[#444] font-bold text-xs uppercase tracking-widest leading-relaxed max-w-sm mb-12">
              Мы создаем будущее образования. Твой проводник в мир топовых университетов, элитной подготовки и неограниченных возможностей.
            </p>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[9px] font-black text-[#222] uppercase tracking-[0.3em]">
                  <Globe className="w-3 h-3" /> Global Network
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-[#222] uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-3 h-3" /> Verified Status
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Navigation</h3>
            <ul className="space-y-4">
              {["Home", "Programs", "IELTS", "SAT", "Admissions"].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === "Home" ? "/" : `/${item.toLowerCase().replace(/ /g, '-')}`} 
                    className="text-[10px] font-black text-[#444] hover:text-white uppercase tracking-[0.2em] transition-colors"
                  >
                    {item}.
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Intelligence</h3>
            <ul className="space-y-6">
              <li>
                <a href="https://t.me/shikitoafk" target="_blank" className="flex items-center gap-3 text-[10px] font-black text-[#444] hover:text-white transition-all group">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Send className="w-3 h-3" />
                   </div>
                   @SHIKITOAFK
                </a>
              </li>
              <li>
                <a href="https://t.me/Saubolopps" target="_blank" className="flex items-center gap-3 text-[10px] font-black text-[#444] hover:text-white transition-all group">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Send className="w-3 h-3" />
                   </div>
                   @SAUBOLOPPS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#444]">
            © {new Date().getFullYear()} Saubol Academic Systems.
          </p>
          <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.4em]">
             <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
             <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
          </div>
        </div>
      </div>
      
      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-500/5 blur-[120px] rounded-full" />
    </footer>
  );
}
