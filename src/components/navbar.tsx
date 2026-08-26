import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { name: "Home", href: "/" },
  { name: "IELTS", href: "/ielts" },
  { name: "SAT", href: "/sat" },
];

export function Navbar() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const isActive = (href: string) => location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  return (
    <nav className="fixed top-0 z-[100] w-full border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Saubol" className="h-7 w-7 object-contain" />
            <span className="font-display text-xl font-semibold tracking-[-0.04em] text-ink">Saubol</span>
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            {links.map((link) => (
              <Link key={link.href} to={link.href} className={cn("text-sm transition-colors", isActive(link.href) ? "font-semibold text-ink" : "text-ink-muted hover:text-ink")}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          {!loading && (user ? <>
            <Link to="/dashboard" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">Progress</Link>
            <button onClick={() => signOut()} className="text-sm font-medium text-ink-muted transition-colors hover:text-ink">Sign out</button>
          </> : <Link to="/login" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">Sign in</Link>)}
          <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ink-muted transition-colors hover:text-ink">Contact</a>
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-ink hover:bg-surface-2"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-full border-line bg-canvas text-ink">
              <SheetHeader className="mt-8 text-left"><SheetTitle className="font-display text-2xl font-semibold text-ink">Saubol</SheetTitle></SheetHeader>
              <div className="mt-12 flex flex-col gap-6">
                {links.map((link) => <Link key={link.href} to={link.href} className={cn("text-2xl", isActive(link.href) ? "font-semibold text-ink" : "text-ink-muted")}>{link.name}</Link>)}
                <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-medium text-ink-muted">Contact us</a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
