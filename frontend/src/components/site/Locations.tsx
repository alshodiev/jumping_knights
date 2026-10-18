import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { locations } from "@/data/content";
import { scrollToId } from "@/lib/scroll";
import SectionHeading from "./SectionHeading";

export default function Locations() {
  return (
    <section id="locations" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Our Locations" />
        <div className="grid gap-6 md:grid-cols-3">
          {locations.map((l) => (
            <Card key={l.name} className="flex flex-col h-full">
              <CardHeader>
                <MapPin className="h-6 w-6 text-blue-900 mb-2" />
                <CardTitle className="text-blue-900 text-lg">{l.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-gray-600 text-sm mb-3">{l.address}</p>
                <div className="flex items-center text-gray-600 text-sm mb-6">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href="tel:+13474755912" className="hover:text-blue-900">{l.phone}</a>
                </div>
                {l.mapsQuery ? (
                  <Button variant="outline" asChild className="mt-auto w-full border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.mapsQuery)}`} target="_blank" rel="noopener noreferrer">
                      Get Directions
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => scrollToId("contact")} className="mt-auto w-full border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white">
                    Ask about online lessons
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
