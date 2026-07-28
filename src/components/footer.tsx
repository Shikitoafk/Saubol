import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-10">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Saubol" className="h-7 w-7 object-contain" />
            <span className="font-display text-xl font-semibold tracking-[-0.04em] text-ink">Saubol</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">
            Free, focused practice for IELTS, SAT, and the next stage of your education.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Practice</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-ink-muted">
            <Link to="/ielts" className="hover:text-ink">IELTS</Link>
            <Link to="/sat" className="hover:text-ink">SAT</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Community</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-ink-muted">
            <a href="https://t.me/shikitoafk" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Contact</a>
            <a href="https://t.me/Saubolopps" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Updates</a>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-line px-6 py-5 text-xs text-ink-subtle sm:px-10">
        © {new Date().getFullYear()} Saubol
      </div>
    </footer>
  );
}
