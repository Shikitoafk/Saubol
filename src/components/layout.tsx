import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface LayoutProps {
  children: ReactNode;
}

type SeoEntry = {
  title: string;
  description: string;
};

const DEFAULT_SEO: SeoEntry = {
  title: "Saubol | IELTS & SAT Practice",
  description:
    "Practice IELTS and SAT, and explore education programs.",
};

const SEO_BY_PATH: Record<string, SeoEntry> = {
  "/": {
    title: "Saubol | IELTS & SAT Practice",
    description:
      "IELTS and SAT practice with a sourced directory of education programs.",
  },
  "/ielts": {
    title: "IELTS Practice Tests | Saubol",
    description:
      "Practice IELTS reading and listening with prediction tests in a timed exam interface.",
  },
  "/ielts/writing": { title: "IELTS Writing Practice | Saubol", description: "Original IELTS-style writing prompts with a timer and saved drafts." },
  "/sat": { title: "SAT Practice | Saubol", description: "Practice Digital SAT questions by topic or take a complete test." },
  "/sat/past-papers": { title: "SAT Practice Tests | Saubol", description: "Try complete Digital SAT practice tests and review your results." },
  "/sat/question-bank": { title: "SAT Question Bank | Saubol", description: "Practice SAT Reading and Writing or Math by topic and difficulty." },
  "/programs": { title: "Education Programs | Saubol", description: "Search sourced education programs by subject, format and cost." },
};

function getSeoByPath(pathname: string): SeoEntry {
  if (SEO_BY_PATH[pathname]) return SEO_BY_PATH[pathname];
  if (pathname.startsWith("/ielts/test/")) {
    return {
      title: "IELTS Test Viewer | Saubol",
      description: "Open and practice IELTS tests with timing and a focused exam interface.",
    };
  }
  if (pathname.startsWith("/ielts/speaking")) return { title: "IELTS Speaking Practice | Saubol", description: "Three-part IELTS-style speaking practice with local recording and playback." };
  if (pathname.startsWith("/sat/")) return { title: "SAT Practice | Saubol", description: "Digital SAT practice questions and progress." };
  return DEFAULT_SEO;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoByPath(location.pathname);
    document.title = seo.title;
    window.scrollTo({ top: 0, behavior: "auto" });

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", seo.description);
    }
  }, [location.pathname]);

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
