import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Home", href: "/" },
  { name: "IELTS", href: "/ielts" },
  { name: "SAT", href: "/sat" },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 z-[100] w-full bg-canvas/40 backdrop-blur-2xl border-b border-line h-20">
      <div className="max-w-[1400px] mx-auto px-10 h-full flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-surface-2 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.png"
                alt="Saubol Logo"
                className="w-9 h-9 object-contain relative z-10 transition-transform duration-700 group-hover:rotate-[360deg]"
              />
            </div>
            <span className="font-black text-2xl tracking-[-0.05em] text-ink uppercase italic">
              SAUBOL
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-ink relative group/link py-2",
                  location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href))
                    ? "text-ink"
                    : "text-ink-subtle"
                )}
              >
                {link.name}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-white transition-all duration-500 rounded-full",
                    location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href))
                      ? "w-full opacity-100"
                      : "w-0 opacity-0 group-hover/link:w-full group-hover/link:opacity-50"
                  )}
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button
            asChild
            className="hidden lg:flex px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-ink bg-transparent hover:bg-surface border border-line rounded-xl transition-all"
          >
            <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
              Support <Send className="w-3.5 h-3.5 ml-2.5" />
            </a>
          </Button>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-ink hover:bg-surface rounded-xl">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-canvas/95 backdrop-blur-3xl border-line text-ink w-full">
                <SheetHeader className="mt-12 mb-20 text-left px-4">
                  <SheetTitle className="text-4xl font-black text-shimmer uppercase tracking-tighter italic">
                    SAUBOL.
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-10 px-4">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "text-5xl font-black uppercase tracking-tighter transition-all",
                        location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href))
                          ? "text-shimmer"
                          : "text-[#333]"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="h-px bg-surface my-6" />
                  <Button asChild className="w-full h-20 bg-white text-black font-black uppercase text-sm tracking-widest rounded-2xl">
                    <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
                      Support
                    </a>
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
