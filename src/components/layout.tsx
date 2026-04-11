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
  title: "Saubol | Top Universities & Test Prep",
  description:
    "Saubol helps students prepare for IELTS and SAT, explore programs, and navigate admissions to top universities worldwide.",
};

const SEO_BY_PATH: Record<string, SeoEntry> = {
  "/": {
    title: "Saubol | Top Universities & Test Prep",
    description:
      "Expert guidance for admissions, IELTS/SAT preparation, and global education opportunities.",
  },
  "/programs": {
    title: "Programs & Camps | Saubol",
    description:
      "Explore curated academic programs, camps, and opportunities to strengthen your profile.",
  },
  "/ielts": {
    title: "IELTS Preparation | Saubol",
    description:
      "Practice IELTS with structured skill paths, prediction tests, and focused preparation resources.",
  },
  "/sat": {
    title: "SAT Preparation | Saubol",
    description:
      "Build SAT performance with adaptive practice questions, explanations, and smart filtering.",
  },
  "/sat/practice": {
    title: "SAT Practice Questions | Saubol",
    description:
      "Train with SAT practice questions by section, category, and difficulty level.",
  },
  "/admissions": {
    title: "Admissions Guide | Saubol",
    description:
      "A clear admissions roadmap for students applying to universities abroad.",
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