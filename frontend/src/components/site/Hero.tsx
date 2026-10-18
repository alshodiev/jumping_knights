import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE, heroSlides } from "@/data/content";
import { scrollToId } from "@/lib/scroll";

export default function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [i]);

  const slide = heroSlides[i];
  const words = slide.title.split(" ");
  const last = words.pop();

  return (
    <section id="home" className="relative min-h-[calc(100svh-4rem)] flex items-center justify-center px-4 overflow-hidden">
      <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/60" />

      <div className="relative z-10 text-center max-w-4xl mx-auto py-24">
        <div key={i} className="hero-in">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white leading-[1.05] tracking-tight">
            {words.join(" ")}
            <span className="block font-light text-indigo-300">{last}</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl font-light text-white/85">{slide.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 text-base" onClick={() => scrollToId("classes")}>
            View programs
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent text-white border-white/70 hover:bg-white hover:text-blue-900" onClick={() => scrollToId("contact")}>
            Contact us
          </Button>
        </div>

        <div className="mt-10 flex justify-center gap-2" role="tablist" aria-label="Headline">
          {heroSlides.map((s, n) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={n === i}
              aria-label={s.title}
              onClick={() => setI(n)}
              className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>

      <button onClick={() => scrollToId("classes")} aria-label="Scroll to programs" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-white">
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </button>
    </section>
  );
}
