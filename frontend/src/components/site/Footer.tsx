import { useState } from "react";
import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGIN_URL, SITE } from "@/config";
import { levels } from "@/data/content";
import { scrollToId } from "@/lib/scroll";
import PrivacyDialog from "./PrivacyDialog";

const linkCls = "text-blue-200 hover:text-white text-left";

export default function Footer({ onLevel }: { onLevel: (value: string) => void }) {
  const [privacy, setPrivacy] = useState(false);

  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo_c.png" alt="" width={36} height={36} className="rounded" />
              <span className="text-xl font-bold">{SITE.name}</span>
            </div>
            <p className="text-blue-200 text-sm max-w-xs">World-class instruction for all ages and skill levels.</p>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-block mt-4 text-blue-200 hover:text-white">
              <Facebook className="h-5 w-5" />
            </a>
          </div>

          <nav aria-label="Quick links">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[["classes", "Programs"], ["locations", "Locations"], ["about", "About"], ["testimonials", "Testimonials"], ["contact", "Contact"]].map(([id, label]) => (
                <li key={id}><button onClick={() => scrollToId(id)} className={linkCls}>{label}</button></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Programs">
            <h3 className="font-semibold mb-4">Programs</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToId("group-lessons")} className={linkCls}>Group Lessons</button></li>
              <li><button onClick={() => scrollToId("private-lessons")} className={linkCls}>Private Lessons</button></li>
              {levels.map((l) => (
                <li key={l.value}><button onClick={() => onLevel(l.value)} className={linkCls}>{l.name}</button></li>
              ))}
              <li><button onClick={() => scrollToId("locations")} className={linkCls}>Online Lessons</button></li>
            </ul>
          </nav>

          <div>
            <h3 className="font-semibold mb-4">Student and Coach Login</h3>
            <p className="text-blue-200 text-sm mb-4">Access your lessons, assignments and practice.</p>
            <Button variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white hover:text-blue-900">
              <a href={LOGIN_URL}>Login</a>
            </Button>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-blue-200">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <button onClick={() => setPrivacy(true)} className="hover:text-white">Privacy Policy</button>
        </div>
      </div>
      <PrivacyDialog open={privacy} onClose={() => setPrivacy(false)} />
    </footer>
  );
}
