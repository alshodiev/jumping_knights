import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SITE } from "@/config";
import Header from "./Header";

/** Header + content + slim footer for pages other than the home page. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-blue-900 text-blue-200 text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <Link to="/" className="hover:text-white">Back to home</Link>
        </div>
      </footer>
    </div>
  );
}
