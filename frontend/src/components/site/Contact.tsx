import { useState, type ChangeEvent, type FormEvent } from "react";
import { Facebook, Mail, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/config";
import { faqs } from "@/data/content";
import { sendContact } from "@/lib/api";
import SectionHeading from "./SectionHeading";

const EMPTY = { firstName: "", lastName: "", email: "", phone: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await sendContact(form);
      setForm(EMPTY);
      setStatus("sent");
    } catch (err) {
      const msg = err instanceof Error && err.message && !/^HTTP|Failed to fetch|NetworkError|Load failed/i.test(err.message) ? err.message : "";
      setError(msg || `We couldn't send your message. Please try again, or email ${SITE.email}.`);
      setStatus("error");
    }
  }

  const busy = status === "sending";

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Get in Touch" subtitle="Ready to start your chess journey? Contact us today!" />
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-blue-900">Send us a Message</CardTitle>
              <CardDescription>We'll get back to you within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "sent" ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center" role="status">
                  <h3 className="text-xl font-semibold text-green-700">Thank you!</h3>
                  <p className="mt-2 text-gray-600">Your message has been sent. We'll be in touch soon.</p>
                  <Button variant="outline" className="mt-6" onClick={() => setStatus("idle")}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={onChange} required maxLength={60} disabled={busy} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={onChange} required maxLength={60} disabled={busy} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} required maxLength={120} disabled={busy} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={onChange} maxLength={30} disabled={busy} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" rows={5} placeholder="Tell us about your chess goals…" value={form.message} onChange={onChange} required maxLength={2000} disabled={busy} />
                  </div>
                  {/* Honeypot: hidden from people, bots tend to fill it in */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label>Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={onChange} /></label>
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={busy}>
                    {busy ? "Sending…" : "Send message"}
                  </Button>
                  {status === "error" && <p role="alert" className="text-sm text-center text-red-600">{error}</p>}
                </form>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader><CardTitle className="text-blue-900">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-900 break-all">
                  <Mail className="h-5 w-5 text-blue-900 shrink-0" />{SITE.email}
                </a>
                <a href={SITE.phoneHref} className="flex items-center gap-3 text-gray-700 hover:text-blue-900">
                  <Phone className="h-5 w-5 text-blue-900 shrink-0" />{SITE.phone}
                </a>
                <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-900">
                  <Facebook className="h-5 w-5 text-blue-900 shrink-0" />Follow us on Facebook
                </a>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader><CardTitle className="text-blue-900">Frequently Asked Questions</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {faqs.map((f, i) => (
                    <AccordionItem key={f.q} value={`faq-${i}`}>
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent className="text-gray-600">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
