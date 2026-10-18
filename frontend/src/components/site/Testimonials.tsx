import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { testimonials } from "@/data/content";
import SectionHeading from "./SectionHeading";

// 6-column grid so 3 cards fill the first row and the last 2 sit centered below.
const POSITION = ["", "", "", "lg:col-start-2", "md:col-start-2 lg:col-start-4"];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="What Our Families Say" subtitle="Hear from parents and students about their experience" />
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-6">
          {testimonials.map((t, i) => (
            <Card key={i} className={`md:col-span-2 h-full ${POSITION[i]}`}>
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <Quote className="h-6 w-6 text-blue-900/20" aria-hidden />
                </div>
                <p className="text-gray-700 leading-relaxed flex-1">{t}</p>
                <p className="mt-6 pt-4 border-t border-gray-100 text-sm font-semibold text-blue-900">Parent</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
