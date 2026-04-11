import { Link } from "react-router-dom";
import { Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xl">
                S
              </div>
              <span className="font-bold text-xl tracking-tight">
                Saubol
              </span>
            </div>
            <p className="text-muted text-sm md:text-base leading-relaxed max-w-sm">
              Your trusted guide to top universities. We help ambitious students navigate admissions, prepare for tests, and find educational opportunities that match their goals.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">Navigation</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-muted hover:text-white transition-colors text-sm" data-testid="link-footer-home">Home</Link>
              </li>
              <li>
                <Link to="/programs" className="text-muted hover:text-white transition-colors text-sm" data-testid="link-footer-programs">Programs & Camps</Link>
              </li>
              <li>
                <Link to="/ielts" className="text-muted hover:text-white transition-colors text-sm" data-testid="link-footer-ielts">IELTS Prep</Link>
              </li>
              <li>
                <Link to="/sat" className="text-muted hover:text-white transition-colors text-sm" data-testid="link-footer-sat">SAT Prep</Link>
              </li>
              <li>
                <Link to="/admissions" className="text-muted hover:text-white transition-colors text-sm" data-testid="link-footer-admissions">Admissions Guide</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">Contact</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li>
                <a
                  href="https://t.me/shikitoafk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  @shikitoafk
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-sm mb-3 text-background">Our Channel</h4>
              <a
                href="https://t.me/Saubolopps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                t.me/Saubolopps
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-muted-foreground/20 text-center md:text-left flex items-center justify-center md:justify-start">
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} Saubol Global Education Gateway. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
