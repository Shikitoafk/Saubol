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
    <nav className="fixed top-0 z-[100] w-full bg-black/60 backdrop-blur-xl border-b border-white/5 h-20">
      <div className="max-w-[1400px] mx-auto px-10 h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black font-black text-xl italic shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase">
              SAUBOL
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-white relative group/link",
                  location.pathname === link.href ? "text-white" : "text-[#888]"
                )}
              >
                {link.name}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-px bg-white transition-all duration-300",
                  location.pathname === link.href ? "w-full" : "w-0 group-hover/link:w-full"
                )} />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!loading && (
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 glass-3d px-4 py-2 group">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black border border-indigo-500/20">
                        {getUserInitials()}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#444] group-hover:text-white transition-colors">{user.user_metadata?.full_name?.split(' ')[0] || 'Member'}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-black border-white/10 text-white p-2" align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/5">
                      <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={signOut} className="p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/5 text-rose-400">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={signInWithGoogle} className="glass-3d px-6 h-10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">
                   Sign In
                </Button>
              )}
            </div>
          )}
          
          <Button asChild className="hidden lg:flex glass-3d px-6 h-10 text-[9px] font-black uppercase tracking-widest bg-white text-black hover:bg-gray-100 border-none shadow-[0_10px_20px_rgba(255,255,255,0.05)]">
            <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
              Contact <Send className="w-3 h-3 ml-2" />
            </a>
          </Button>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-white/10 text-white w-full">
                <div className="flex flex-col gap-8 mt-20 px-6">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "text-2xl font-black uppercase tracking-tighter transition-all",
                        location.pathname === link.href ? "text-shimmer" : "text-[#888]"
                      )}
                    >
                      {link.name}.
                    </Link>
                  ))}
                  <div className="h-px bg-white/5 my-4" />
                  <Button onClick={() => user ? signOut() : signInWithGoogle()} className="w-full h-16 glass-3d font-black uppercase text-xs tracking-widest">
                    {user ? "Sign Out" : "Sign In"}
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
