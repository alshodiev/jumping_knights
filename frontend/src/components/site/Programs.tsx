import { Clock, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { levels, programs } from "@/data/content";
import { useRegisterChat } from "@/context/RegisterChatContext";
import SectionHeading from "./SectionHeading";

const ICONS = { users: Users, clock: Clock };

interface Props {
  openLevel: string;
  onOpenLevelChange: (v: string) => void;
}

export default function Programs({ openLevel, onOpenLevelChange }: Props) {
  const { open: openRegister } = useRegisterChat();

  return (
    <section id="classes" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Chess Programs"
          subtitle="From beginners to advanced players, we offer comprehensive chess education for all skill levels."
        />


        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-16">
          {programs.map((p) => {
            const Icon = ICONS[p.icon];
            return (
              <Card key={p.id} id={p.id} className="flex flex-col h-full">
                <CardHeader>
                  <Icon className="h-8 w-8 text-blue-900 mb-2" />
                  <CardTitle className="text-blue-900 text-xl">{p.chatLabel}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2"><span aria-hidden>•</span><span>{b}</span></li>
                    ))}
                  </ul>
                  <Button className="mt-auto w-full bg-blue-900 hover:bg-blue-800" onClick={() => openRegister(p.chatLabel)}>
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div id="levels" className="rounded-xl border border-gray-200 bg-gray-50 p-6 md:p-10 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-blue-900 mb-4 text-center">Skill Levels</h3>
          <Accordion type="single" collapsible value={openLevel} onValueChange={onOpenLevelChange} className="w-full">
            {levels.map((l) => (
              <AccordionItem key={l.value} value={l.value} id={`level-${l.value}`}>
                <AccordionTrigger className="text-lg font-semibold text-blue-900">{l.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-2 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <p className="text-gray-600 mb-4">{l.description}</p>
                      <p className="font-semibold text-blue-900">What's Included:</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {l.included.map((x) => (
                          <li key={x} className="flex gap-2"><span aria-hidden>•</span><span>{x}</span></li>
                        ))}
                      </ul>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openRegister(l.chatLabel)}>
                      {l.buttonLabel}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
