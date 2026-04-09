import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1 w-full animate-fade-in">
        {children}
      </main>
      <Footer />
    </div>
  );
}