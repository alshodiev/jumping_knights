import React, { useState, useEffect } from "react";
import { LOGIN_URL, CONTACT_FORM_URL } from "@/config";
import { useRegisterChat } from "@/context/RegisterChatContext";

// Shadcn/UI and Lucide Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Menu, X, ChevronDown, MapPin, Phone, Mail, Star, Users, Clock, Facebook
} from "lucide-react";

const LandingPage: React.FC = () => {
  const { open: openRegister } = useRegisterChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // State for the contact form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('idle');

    const scriptURL = CONTACT_FORM_URL;

    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Required for Apps Script
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.result === 'success') {
        setSubmissionStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' }); // Clear form
      } else { throw new Error(result.error || 'An unknown error occurred.'); }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionStatus('error');
    } finally { setIsSubmitting(false); }
  };

  const slides = [
    {
      image: "/pic9.jpg",
      title: "Win Your Next Tournament",
      subtitle: "with Our Academy",
    },
    { image: "/pic9.jpg", title: "Master the Endgame", subtitle: "Strategic insights from the pros." },
    { image: "/pic9.jpg", title: "Perfect Your Openings", subtitle: "Start every game with an advantage." },
    { image: "/pic9.jpg", title: "Build Mental Fortitude", subtitle: "The psychological edge you need." },
    { image: "/pic9.jpg", title: "Analyze Like a Grandmaster", subtitle: "Deepen your understanding of the game." },
    { image: "/pic9.jpg", title: "Compete with Confidence", subtitle: "Step into any match ready to win." },
    { image: "/pic9.jpg", title: "Achieve Your Chess Goals", subtitle: "Your journey to mastery starts here." },
  ];

    useEffect(() => {
    // Set up a timer that runs every 4 seconds (4000 milliseconds)
    const timer = setInterval(() => {
      // This function will be called every 4 seconds
      setCurrentSlide((prevSlide) =>
        // If the current slide is the last one, go back to the first (index 0).
        // Otherwise, just go to the next slide.
        prevSlide === slides.length - 1 ? 0 : prevSlide + 1
      );
    }, 4000); // 4 seconds

    return () => clearInterval(timer);
  }, [slides.length]); // The dependency array ensures this effect only runs once.

  const locations = [
    { name: "Midtown", address: "641 Lexington Ave, New York, NY 10022", phone: "(347) 475-5912" },
    { name: "Waterline Square Rentals", address: "400 W 61st, New York, NY 10023", phone: "(347) 475-5912" },
    { name: "Online", address: "See Contact Below", phone: "(347) 475-5912" }
  ];

 const testimonials = [
    { name: "", role: "Parent", content: "My son has achieved unimaginable heights in one year with coach Murad. Winning 2024 State championships, and Winning K1000 in Nationals 2024. Currently ranked as top 5 kindergartners in the country.", rating: 5, image: "https://placehold.co/60x60/4169e1/ffffff?text=P" },
    { name: "", role: "Parent", content: "My son has developed love for the game and won the clear 2nd place in NY State championships 2025 in Saratoga and all this happened in one year of working with Coach Murad.", rating: 5, image: "https://placehold.co/60x60/32cd32/ffffff?text=A" },
    { name: "", role: "Parent", content: "My daughter has improved in one year achieving top 3 seed in all girls NY state championships.", rating: 5, image: "https://placehold.co/60x60/ffa500/ffffff?text=Y" },
    { name: "", role: "Parent", content: "My son scored 5 out of 6 in NY state championships beginning category after only working for 3 month with Coach Murad.", rating: 5, image: "https://placehold.co/60x60/ff6347/ffffff?text=R" },
    { name: "", role: "Parent", content: "My son has won numerous tournaments including the prestigious Hunter championship category and achieved the rating of 1443 in one year. Ranking him the highest rated first grader in the NY state. All thanks to coach Murad.", rating: 5, image: "https://placehold.co/60x60/8a2be2/ffffff?text=P" },
 ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-3">
              <img src="/logo_c.png" alt="Top 10 Chess Logo" width={40} height={40} className="rounded-lg"/>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Jumping Knights</h1>
              </div>
            </a>

            <nav className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection("home")} className="text-gray-700 hover:text-blue-900 font-medium">Home</button>
              <button onClick={() => scrollToSection("classes")} className="text-gray-700 hover:text-blue-900 font-medium">Programs</button>
              <button onClick={() => scrollToSection("locations")} className="text-gray-700 hover:text-blue-900 font-medium">Locations</button>
              <button onClick={() => scrollToSection("about")} className="text-gray-700 hover:text-blue-900 font-medium">About</button>
              <button onClick={() => scrollToSection("testimonials")} className="text-gray-700 hover:text-blue-900 font-medium">Testimonials</button>
              <button onClick={() => scrollToSection("contact")} className="text-gray-700 hover:text-blue-900 font-medium">Contact</button>
            </nav>

            <div className="flex items-center space-x-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-900">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Login (coaches and students) */}
              <Button variant="outline" asChild>
                <a href={LOGIN_URL}>Login</a>
              </Button>
            </div>

          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <button onClick={() => scrollToSection("home")} className="text-left text-gray-700 hover:text-blue-900 font-medium">Home</button>
                <button onClick={() => scrollToSection("classes")} className="text-left text-gray-700 hover:text-blue-900 font-medium">Programs</button>
                <button onClick={() => scrollToSection("locations")} className="text-left text-gray-700 hover:text-blue-900 font-medium">Locations</button>
                <button onClick={() => scrollToSection("about")} className="text-left text-gray-700 hover:text-blue-900 font-medium">About</button>
                <button onClick={() => scrollToSection("testimonials")} className="text-left text-gray-700 hover:text-blue-900 font-medium">Testimonials</button>
                <button onClick={() => scrollToSection("contact")} className="text-left text-gray-700 hover:text-blue-900 font-medium">Contact</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center px-4">
        {/* Container for the background images */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <img
              key={slide.image}
              src={slide.image}
              className={`w-full h-full object-cover absolute transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Semi-transparent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10"></div>

        {/* Centered text content */}
        <div className="relative z-20 text-center max-w-3xl mx-auto">
          {/* Animated Text Container */}
          <div className="transition-all duration-700 ease-in-out">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              {slides[currentSlide].title.split(" ").slice(0, -1).join(" ")}
              <span className="text-indigo-400 block font-light">
                {slides[currentSlide].title.split(" ").slice(-1).join(" ")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/80">
              {slides[currentSlide].subtitle}
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <ChevronDown className="text-white/50 text-3xl animate-bounce" />
        </div>
      </section>
      

    {/* Classes Section */}
      <section id="classes" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">Our Chess Programs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">From beginners to advanced players, we offer comprehensive chess education for all skill levels.</p>
            <div className="mt-8 bg-orange-100 border border-orange-300 rounded-lg p-4 max-w-md mx-auto"><Badge className="bg-orange-500 text-white mb-2">Special Offer</Badge><p className="text-orange-800 font-semibold">Save $30 on Summer Registration!</p></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">            <Card className="hover:shadow-lg transition-shadow"><CardHeader><Users className="h-8 w-8 text-blue-900 mb-2" /><CardTitle className="text-blue-900">Group Lessons</CardTitle><CardDescription>Learn with peers in small groups of 4-6 students</CardDescription></CardHeader><CardContent><ul className="space-y-2 text-sm text-gray-600 mb-4"><li>• Interactive group dynamics</li><li>• Peer learning opportunities</li><li>• Competitive practice games</li><li>• Weekly 60-minute sessions</li><li>• 1 semester (12 classes) for $600</li><li>• Monthly soccer game included in curriculum in Waterline Square</li></ul><Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => openRegister("Group Lessons")}>Register Now</Button></CardContent></Card>
            <Card className="hover:shadow-lg transition-shadow"><CardHeader><Clock className="h-8 w-8 text-blue-900 mb-2" /><CardTitle className="text-blue-900">Private Lessons</CardTitle><CardDescription>One-on-one instruction tailored to your needs</CardDescription></CardHeader><CardContent><ul className="space-y-2 text-sm text-gray-600 mb-4"><li>• Personalized curriculum</li><li>• Flexible scheduling</li><li>• Rapid skill development</li><li>• 60-minute sessions</li><li>• $100 per session</li></ul><Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => openRegister("Private Lessons")}>Register Now</Button></CardContent></Card>
          </div>
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">Skill Levels</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tots">
                <AccordionTrigger className="text-lg font-semibold text-blue-900">Tots (Ages 4-6)</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <p className="text-gray-600 mb-4">Introduction to chess through fun games and activities. Learn piece names, basic moves, and simple tactics.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">What's Included:</p>
                        <ul className="text-sm text-gray-600 mt-2">
                          <li>• Colorful chess sets and boards</li>
                          <li>• Story-based learning</li>
                          <li>• 45-minute sessions</li>
                          <li>• Small class sizes (max 4 students)</li>
                        </ul>
                      </div>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openRegister("Tots (Ages 4-6)")}>Register for Tots</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="juniors">
                <AccordionTrigger className="text-lg font-semibold text-blue-900">Juniors (Ages 7-12)</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <p className="text-gray-600 mb-4">Develop fundamental chess skills including tactics, basic strategy, and tournament play preparation.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">What's Included:</p>
                        <ul className="text-sm text-gray-600 mt-2">
                          <li>• Tactical puzzles and exercises</li>
                          <li>• Opening principles</li>
                          <li>• 60-minute sessions</li>
                          <li>• Tournament opportunities</li>
                        </ul>
                      </div>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openRegister("Juniors (Ages 7-12)")}>Register for Juniors</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="jumpstarters">
                <AccordionTrigger className="text-lg font-semibold text-blue-900">Jumpstarters (Ages 13-17)</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <p className="text-gray-600 mb-4">Advanced instruction for serious players looking to compete at high levels and improve their ratings.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">What's Included:</p>
                        <ul className="text-sm text-gray-600 mt-2">
                          <li>• Advanced tactical training</li>
                          <li>• Opening repertoire development</li>
                          <li>• 90-minute sessions</li>
                          <li>• Competition coaching</li>
                        </ul>
                      </div>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openRegister("Jumpstarters (Ages 13-17)")}>Register for Jumpstarters</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* --- NEW SECTION STARTS HERE --- */}
              <AccordionItem value="adults">
                <AccordionTrigger className="text-lg font-semibold text-blue-900">Adults (18+)</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <p className="text-gray-600 mb-4">Whether you're new to the game or a seasoned club player, our adult programs are designed to fit your busy schedule and help you achieve your personal chess goals.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">What's Included:</p>
                        <ul className="text-sm text-gray-600 mt-2">
                          <li>• Beginner to advanced group classes</li>
                          <li>• Social chess nights and events</li>
                          <li>• Flexible evening and weekend schedules</li>
                          <li>• Focus on practical play and strategy</li>
                        </ul>
                      </div>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openRegister("Adults (18+)")}>Register for Adults</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* --- NEW SECTION ENDS HERE --- */}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">Our Location</h2></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {locations.map((location, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow"><CardHeader><MapPin className="h-6 w-6 text-blue-900 mb-2" /><CardTitle className="text-blue-900 text-lg">{location.name}</CardTitle></CardHeader><CardContent><p className="text-gray-600 text-sm mb-3">{location.address}</p><div className="flex items-center text-gray-600 text-sm mb-4"><Phone className="h-4 w-4 mr-2" />{location.phone}</div><Button variant="outline" className="w-full border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white bg-transparent">{location.name === "Online Coaching" ? "Join Online" : "Get Directions"}</Button></CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">Meet Murad Shadiev</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">Chess Expert and Chess Tutor. In his youth, Murad was one of the top Junior players in his native Uzbekistan. He has experience teaching chess to young kids as well as adults, and his sense of humor helps students get through the toughest chess concepts with ease and grace.</p>
              <div className="grid grid-cols-3 gap-4 mb-6"><div className="text-center"><div className="text-2xl font-bold text-blue-900">10+</div><div className="text-sm text-gray-600">Years Teaching</div></div><div className="text-center"><div className="text-2xl font-bold text-blue-900">10+</div><div className="text-sm text-gray-600">National Champions</div></div><div className="text-center"><div className="text-2xl font-bold text-blue-900">100+</div><div className="text-sm text-gray-600">Students Taught</div></div></div>
            </div>
            <div className="relative">
              <img src="/murad.jpeg" alt=" Murad teaching chess" width={400} height={500} className="rounded-lg shadow-lg"/>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">What Our Families Say</h2><p className="text-xl text-gray-600">Hear from parents and students about their experience</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">{[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />))}</div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img src={testimonial.image} alt={testimonial.name} width={48} height={48} className="rounded-full mr-4"/>
                    <div><div className="font-semibold text-blue-900">{testimonial.name}</div><div className="text-sm text-gray-600">{testimonial.role}</div></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">Get in Touch</h2><p className="text-xl text-gray-600">Ready to start your chess journey? Contact us today!</p></div>
          <div className="grid lg:grid-cols-2 gap-12">            <Card>
              <CardHeader><CardTitle className="text-blue-900">Send us a Message</CardTitle><CardDescription>We'll get back to you within 24 hours</CardDescription></CardHeader>
              <CardContent>
                {submissionStatus === 'success' ? (
                  <div className="text-center p-8 flex flex-col items-center justify-center h-full bg-green-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-green-700">Thank You!</h3>
                    <p className="text-gray-600 mt-2">Your message has been sent successfully. We'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} required disabled={isSubmitting} /></div>
                      <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required disabled={isSubmitting} /></div>
                    </div>
                    <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} required disabled={isSubmitting} /></div>
                    <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={handleInputChange} disabled={isSubmitting} /></div>
                    <div><Label htmlFor="message">Message</Label><Textarea id="message" placeholder="Tell us about your chess goals..." rows={4} value={formData.message} onChange={handleInputChange} required disabled={isSubmitting} /></div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Message'}</Button>
                    {submissionStatus === 'error' && <p className="text-sm text-center text-red-600 mt-2">Something went wrong sending your message. Please try again or email us directly.</p>}
                  </form>
                )}
              </CardContent>
            </Card>
            <div className="space-y-8">
              <Card><CardHeader><CardTitle className="text-blue-900">Contact Information</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center"><Mail className="h-5 w-5 text-blue-900 mr-3" /><span>jumpingknights2025@gmail.com</span></div><div className="flex items-center"><Phone className="h-5 w-5 text-blue-900 mr-3" /><span>(347) 475-5912</span></div><div className="flex space-x-4 mt-6"><a href="https://www.facebook.com/murad.chess" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700"><Facebook className="h-6 w-6" /></a></div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-blue-900">Frequently Asked Questions</CardTitle></CardHeader><CardContent><Accordion type="single" collapsible><AccordionItem value="pricing"><AccordionTrigger>What are your class prices?</AccordionTrigger><AccordionContent>Group lessons start at $40/session, private lessons are $80/hour. We offer package deals and sibling discounts.</AccordionContent></AccordionItem><AccordionItem value="schedule"><AccordionTrigger>What is your class schedule?</AccordionTrigger><AccordionContent>We offer classes Monday through Saturday, with morning, afternoon, and evening options to fit your schedule.</AccordionContent></AccordionItem><AccordionItem value="beginner"><AccordionTrigger>Can complete beginners join?</AccordionTrigger><AccordionContent>We welcome students of all skill levels, from complete beginners to advanced tournament players.</AccordionContent></AccordionItem></Accordion></CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4"><img src="/logo_c.png" alt="Top 10 Chess Logo" width={32} height={32} className="rounded" /><span className="text-xl font-bold">Jumping Knights</span></div>
              <p className="text-blue-200 text-sm">World-class instruction for all ages and skill levels.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><button onClick={() => scrollToSection("classes")} className="hover:text-white">Programs</button></li>
                <li><button onClick={() => scrollToSection("locations")} className="hover:text-white">Locations</button></li>
                <li><button onClick={() => scrollToSection("about")} className="hover:text-white">About</button></li>
                <li><button onClick={() => scrollToSection("contact")} className="hover:text-white">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white">Group Lessons</a></li>
                <li><a href="#" className="hover:text-white">Private Lessons</a></li>
                <li><a href="#" className="hover:text-white">Workshops</a></li>
                <li><a href="#" className="hover:text-white">Online Classes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Download Our App</h4>
              <p className="text-blue-200 text-sm mb-4">Practice puzzles and track your progress on the go.</p>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent">Download App</Button>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <p className="text-blue-200 text-sm">© {new Date().getFullYear()} Jumping Knights Platform. All rights reserved.</p>
              <img src="https://placehold.co/60x24/ffffff/1e3a8a?text=USCF" alt="US Chess Federation" width={60} height={24} className="opacity-80"/>
            </div>
            <div className="flex space-x-4 text-sm text-blue-200"><a href="#" className="hover:text-white">Privacy Policy</a><a href="#" className="hover:text-white">Terms of Service</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;