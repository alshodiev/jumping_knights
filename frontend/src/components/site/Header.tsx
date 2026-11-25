import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGIN_URL, SITE } from "@/config";
import { scrollToId } from "@/lib/scroll";

/** `id` = a section on the home page. `to` = a page of its own. */
export const NAV: Array<{ id: string; label: string; to?: string }> = [
  { id: "home", label: "Home" },
  { id: "classes", label: "Programs" },
  { id: "play", label: "Play" },
  { id: "videos", label: "Videos", to: "/videos" },
  { id: "locations", label: "Locations" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";

  // Close the mobile menu first: while it is open the header is taller and pushes the page
  // down, so scrolling before it closes overshoots the target.
  const go = (item: { id: string; to?: string }) => {
    setOpen(false);
    if (item.to) return navigate(item.to);
    if (!onHome) return navigate({ pathname: "/", hash: item.id === "home" ? "" : item.id });
    window.setTimeout(() => scrollToId(item.id), 60);
  };

  const isActive = (item: { to?: string }) => !!item.to && pathname.startsWith(item.to);
  const itemCls = (item: { to?: string }) =>
    `text-sm font-medium hover:text-blue-900 ${isActive(item) ? "text-blue-900 underline underline-offset-8" : "text-gray-700"}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" onClick={(e) => { if (onHome) { e.preventDefault(); go({ id: "home" }); } }} className="flex items-center gap-3 shrink-0">
          <img src="/logo_c.png" alt="" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-bold text-blue-900">{SITE.name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n)} aria-current={isActive(n) ? "page" : undefined} className={itemCls(n)}>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={LOGIN_URL}>Login</a>
          </Button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-900"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-gray-200 bg-white" aria-label="Mobile">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n)} className="text-left py-3 text-gray-700 font-medium border-b border-gray-100 last:border-b-0">
                {n.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
