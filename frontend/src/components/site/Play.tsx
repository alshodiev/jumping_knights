import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "./SectionHeading";

const BASE = import.meta.env.BASE_URL;
const GAME_URL = `${BASE}games/butterfly/`;

export default function Play() {
  return (
    <section id="play" className="py-20 bg-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Play & Practice"
          subtitle="Free chess games your child can enjoy at home, between classes."
        />

        <div className="max-w-4xl mx-auto rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden grid md:grid-cols-[1fr_320px]">
          <div className="p-6 md:p-10 flex flex-col">
            <Gamepad2 className="h-8 w-8 text-blue-900 mb-3" aria-hidden />
            <h3 className="text-2xl font-bold text-blue-900 mb-2">Butterfly and the Garden of Caissa</h3>
            <p className="text-gray-600 mb-4">
              Climb the vine and tap the square where each butterfly lands. A gentle first game for learning the names of
              the squares on the board, perfect for our youngest players.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex gap-2"><span aria-hidden>•</span><span>Great for ages 4-8 and new players</span></li>
              <li className="flex gap-2"><span aria-hidden>•</span><span>Plays right in the browser on phone, tablet or computer</span></li>
              <li className="flex gap-2"><span aria-hidden>•</span><span>Free, no sign-up, progress is saved on the device</span></li>
            </ul>
            <Button asChild className="mt-auto w-full sm:w-auto sm:self-start bg-blue-900 hover:bg-blue-800">
              <a href={GAME_URL}>Play now</a>
            </Button>
          </div>

          <div
            aria-hidden
            className="relative min-h-[200px] flex items-center justify-center gap-4 p-6 bg-gradient-to-b from-sky-200 via-sky-100 to-green-200"
          >
            <img src={`${BASE}games/butterfly/assets/sprites/butterfly-garden/title-butterfly.webp`} alt="" width={150} height={118} className="w-36 h-auto" />
            <img src={`${BASE}games/butterfly/assets/sprites/butterfly-garden/flower-pink.webp`} alt="" width={72} height={72} className="w-16 h-auto self-end" />
          </div>
        </div>
      </div>
    </section>
  );
}
