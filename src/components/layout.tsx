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
    "Free IELTS practice tests and SAT question bank with filters by section, category, and difficulty.",
};

const SEO_BY_PATH: Record<string, SeoEntry> = {
  "/": {
    title: "Saubol | IELTS & SAT Practice",
    description:
      "Free IELTS practice tests and SAT question bank for standardized test preparation.",
  },
  "/ielts": {
    title: "IELTS Practice Tests | Saubol",
    description:
      "Practice IELTS reading and listening with prediction tests in a timed exam interface.",
  },
  "/sat": {
    title: "SAT Question Bank | Saubol",
    description:
      "Practice SAT questions with filters by section, category, and difficulty.",
  },
  "/sat/practice": {
    title: "SAT Practice Questions | Saubol",
    description:
      "Train with SAT practice questions by section, category, and difficulty level.",
  },
};

function getSeoByPath(pathname: string): SeoEntry {
  if (SEO_BY_PATH[pathname]) return SEO_BY_PATH[pathname];
  if (pathname.startsWith("/ielts/test/")) {
    return {
      title: "IELTS Test Viewer | Saubol",
      description: "Open and practice IELTS tests with timing and a focused exam interface.",
    };
  }
  if (pathname.startsWith("/sat/test/")) {
    return {
      title: "SAT Test Viewer | Saubol",
      description: "Open SAT tests with a clean test environment and detailed questions.",
    };
  }
  return DEFAULT_SEO;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoByPath(location.pathname);
    document.title = seo.title;

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