import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Home", href: "/" },
  { name: "Programs", href: "/programs" },
  { name: "IELTS", href: "/ielts" },
  { name: "SAT", href: "/sat" },
  { name: "Admissions", href: "/admissions" },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xl">
              S
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              Saubol
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              data-testid={`link-nav-${link.name.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
          <Button asChild variant="default" className="bg-primary text-primary-foreground font-medium ml-4 hover:bg-primary/90" data-testid="btn-nav-contact">
            <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
              Contact Us
            </a>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" data-testid="btn-mobile-menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col space-y-4 mt-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    data-testid={`link-mobile-nav-${link.name.toLowerCase()}`}
                    className={cn(
                      "text-lg font-medium p-2 rounded-md hover:bg-muted transition-colors",
                      location.pathname === link.href ? "text-primary bg-primary/10" : "text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                <Button asChild className="mt-4 bg-primary text-primary-foreground w-full" data-testid="btn-mobile-contact">
                  <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer">
                    Contact Us
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
