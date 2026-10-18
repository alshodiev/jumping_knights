import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGIN_URL, SITE } from "@/config";
import { scrollToId } from "@/lib/scroll";

export const NAV = [
  { id: "home", label: "Home" },
  { id: "classes", label: "Programs" },
  { id: "locations", label: "Locations" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const go = (id: string) => { scrollToId(id); setOpen(false); };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#home" onClick={(e) => { e.preventDefault(); go("home"); }} className="flex items-center gap-3 shrink-0">
          <img src="/logo_c.png" alt="" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-bold text-blue-900">{SITE.name}</span>
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className="text-sm font-medium text-gray-700 hover:text-blue-900">
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
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-900"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white" aria-label="Mobile">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} className="text-left py-3 text-gray-700 font-medium border-b border-gray-100 last:border-b-0">
                {n.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
