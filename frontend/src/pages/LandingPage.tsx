import { useEffect, useState } from "react";
import About from "@/components/site/About";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Locations from "@/components/site/Locations";
import Play from "@/components/site/Play";
import Programs from "@/components/site/Programs";
import Testimonials from "@/components/site/Testimonials";
import { scrollToId } from "@/lib/scroll";

export default function LandingPage() {
  // Which skill level is expanded. Lifted here so footer links can open one.
  const [openLevel, setOpenLevel] = useState("");

  // Arriving from another page (e.g. the game) with #play: scroll once the page has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) window.setTimeout(() => scrollToId(id), 50);
  }, []);

  const goToLevel = (value: string) => {
    setOpenLevel(value);
    // wait for the accordion to finish moving before scrolling to the item
    window.setTimeout(() => scrollToId(`level-${value}`), 360);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main>
        <Hero />
        <Programs openLevel={openLevel} onOpenLevelChange={setOpenLevel} />
        <Play />
        <Locations />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer onLevel={goToLevel} />
    </div>
  );
}
