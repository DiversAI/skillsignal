import { Link, useLocation } from "wouter";
import { Layers } from "lucide-react";

const Navbar = () => {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-display text-foreground">SkillsOS</span>
            <span className="text-xs text-muted-foreground font-medium">by DiversAI</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {!isHome && (
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          )}
          <a
            href="https://www.diversai.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            DiversAI
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
