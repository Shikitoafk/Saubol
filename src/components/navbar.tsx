import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, BarChart3, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { name: "Programs", href: "/programs" },
  { name: "IELTS", href: "/ielts" },
  { name: "SAT", href: "/sat" },
  { name: "Admissions", href: "/admissions" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, signInWithGoogle } = useAuth();

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <nav className="fixed top-0 z-[100] w-full bg-black/40 backdrop-blur-2xl border-b border-white/[0.03] h-20">
      <div className="max-w-[1400px] mx-auto px-10 h-full flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src="/logo.png" 
                alt="Saubol Logo" 
                className="w-9 h-9 object-contain relative z-10 transition-transform duration-700 group-hover:rotate-[360deg]"
              />
            </div>
            <span className="font-black text-2xl tracking-[-0.05em] text-white uppercase italic">
              SAUBOL
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-white relative group/link py-2",
                  location.pathname === link.href ? "text-white" : "text-white/30"
                )}
              >
                {link.name}
                <span className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-white transition-all duration-500 rounded-full",
                  location.pathname === link.href ? "w-full opacity-100" : "w-0 opacity-0 group-hover/link:w-full group-hover/link:opacity-50"
                )} />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          {!loading && (
            <div className="hidden lg:flex items-center gap-6">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-4 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-2xl border border-white/5 transition-all group active:scale-95">
                      <div className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center text-[11px] font-black shadow-[0_5px_15px_rgba(255,255,255,0.1)]">
                        {getUserInitials()}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                        {user.user_metadata?.full_name?.split(' ')[0] || 'Member'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-black/90 backdrop-blur-3xl border-white/10 text-white p-3 rounded-2xl shadow-2xl" align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-indigo-400" /> My Mission Control
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5 my-2" />
                    <DropdownMenuItem onClick={signOut} className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 text-rose-500 flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Disconnect Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={signInWithGoogle} className="bg-white text-black hover:bg-gray-200 px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all active:scale-95">
                   Access Portal
                </Button>
              )}
            </div>
          )}
          
          <Button asChild className="hidden lg:flex px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] bg-transparent hover:bg-white/5 border border-white/10 rounded-xl transition-all">
            <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
              Support <Send className="w-3.5 h-3.5 ml-2.5" />
            </a>
          </Button>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/5 rounded-xl">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 backdrop-blur-3xl border-white/5 text-white w-full">
                <SheetHeader className="mt-12 mb-20 text-left px-4">
                  <SheetTitle className="text-4xl font-black text-shimmer uppercase tracking-tighter italic">SAUBOL.</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-10 px-4">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "text-5xl font-black uppercase tracking-tighter transition-all",
                        location.pathname === link.href ? "text-shimmer" : "text-[#333]"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="h-px bg-white/5 my-6" />
                  <Button onClick={() => user ? signOut() : signInWithGoogle()} className="w-full h-20 bg-white text-black font-black uppercase text-sm tracking-widest rounded-2xl">
                    {user ? "Terminate Session" : "Portal Access"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
