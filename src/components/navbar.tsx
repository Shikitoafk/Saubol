import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { name: "Home", href: "/" },
  { name: "Programs", href: "/programs" },
  { name: "IELTS", href: "/ielts" },
  { name: "SAT", href: "/sat" },
  { name: "Admissions", href: "/admissions" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, signInWithGoogle } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

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
          
          {/* Auth Section */}
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {getUserInitials()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getUserInitials()}
                      </div>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{getUserName()}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>My Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} variant="default" className="bg-primary text-primary-foreground font-medium ml-4 hover:bg-primary/90">
                  Sign in
                </Button>
              )}
            </>
          )}
          
          <Button asChild variant="outline" className="font-medium ml-4" data-testid="btn-nav-contact">
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
                
                {/* Mobile Auth Section */}
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <div className="flex items-center gap-2 p-2 border-t pt-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getUserInitials()}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-medium">{getUserName()}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => navigate('/dashboard')} 
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          My Dashboard
                        </Button>
                        <Button 
                          onClick={handleSignOut} 
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleSignIn} className="mt-4 bg-primary text-primary-foreground w-full">
                        Sign in
                      </Button>
                    )}
                  </>
                )}
                
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
