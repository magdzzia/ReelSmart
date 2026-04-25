import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Wallet } from "lucide-react";

export function FooterNav() {
  const { pathname } = useLocation();
  // Hide on the immersive reels player
  if (pathname.startsWith("/reels")) return null;

  const studyActive = pathname === "/" || pathname.startsWith("/study") || pathname.startsWith("/new") || pathname.startsWith("/import");
  const bankActive = pathname.startsWith("/bank");

  return (
    <>
      {/* spacer so content isn't covered */}
      <div className="h-24" aria-hidden />
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 px-4 bg-background/85 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          <Tab to="/" active={studyActive} icon={<BookOpen className="w-4 h-4" />} label="study" />
          <Tab to="/bank" active={bankActive} icon={<Wallet className="w-4 h-4" />} label="reel bank" />
        </div>
      </nav>
    </>
  );
}

function Tab({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={`h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition ${
        active
          ? "bg-brand text-brand-foreground"
          : "bg-card text-muted-foreground border border-border hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
