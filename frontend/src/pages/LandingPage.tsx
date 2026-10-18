import { useState } from "react";
import About from "@/components/site/About";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Locations from "@/components/site/Locations";
import Programs from "@/components/site/Programs";
import Testimonials from "@/components/site/Testimonials";
import { scrollToId } from "@/lib/scroll";

export default function LandingPage() {
  // Which skill level is expanded. Lifted here so footer links can open one.
  const [openLevel, setOpenLevel] = useState("");

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
        <Locations />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer onLevel={goToLevel} />
    </div>
  );
}
