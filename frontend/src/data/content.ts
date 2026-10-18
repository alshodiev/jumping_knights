// All page copy lives here so it is easy to edit. Program/level labels (chatLabel)
// must match TOPICS in backend/src/config.ts.

export const HERO_IMAGE = "/pic9.jpg";

export const heroSlides = [
  { title: "Win Your Next Tournament", subtitle: "with Our Academy" },
  { title: "Master the Endgame", subtitle: "Strategic insights from the pros." },
  { title: "Perfect Your Openings", subtitle: "Start every game with an advantage." },
  { title: "Build Mental Fortitude", subtitle: "The psychological edge you need." },
  { title: "Analyze Like a Grandmaster", subtitle: "Deepen your understanding of the game." },
  { title: "Compete with Confidence", subtitle: "Step into any match ready to win." },
  { title: "Achieve Your Chess Goals", subtitle: "Your journey to mastery starts here." },
];

export const programs = [
  {
    id: "group-lessons",
    chatLabel: "Group Lessons",
    icon: "users",
    description: "Learn with peers in small groups of 4-6 students",
    bullets: [
      "Interactive group dynamics",
      "Peer learning opportunities",
      "Competitive practice games",
      "Weekly 60-minute sessions",
      "1 semester (12 classes) for $600",
      "Monthly soccer game included in curriculum in Waterline Square",
    ],
  },
  {
    id: "private-lessons",
    chatLabel: "Private Lessons",
    icon: "clock",
    description: "One-on-one instruction tailored to your needs",
    bullets: [
      "Personalized curriculum",
      "Flexible scheduling",
      "Rapid skill development",
      "60-minute sessions",
      "$100 per session",
    ],
  },
] as const;

export const levels = [
  {
    value: "tots",
    name: "Tots (Ages 4-6)",
    chatLabel: "Tots (Ages 4-6)",
    buttonLabel: "Register for Tots",
    description: "Introduction to chess through fun games and activities. Learn piece names, basic moves, and simple tactics.",
    included: ["Colorful chess sets and boards", "Story-based learning", "45-minute sessions", "Small class sizes (max 4 students)"],
  },
  {
    value: "juniors",
    name: "Juniors (Ages 7-12)",
    chatLabel: "Juniors (Ages 7-12)",
    buttonLabel: "Register for Juniors",
    description: "Develop fundamental chess skills including tactics, basic strategy, and tournament play preparation.",
    included: ["Tactical puzzles and exercises", "Opening principles", "60-minute sessions", "Tournament opportunities"],
  },
  {
    value: "jumpstarters",
    name: "Jumpstarters (Ages 13-17)",
    chatLabel: "Jumpstarters (Ages 13-17)",
    buttonLabel: "Register for Jumpstarters",
    description: "Advanced instruction for serious players looking to compete at high levels and improve their ratings.",
    included: ["Advanced tactical training", "Opening repertoire development", "90-minute sessions", "Competition coaching"],
  },
  {
    value: "adults",
    name: "Adults (18+)",
    chatLabel: "Adults (18+)",
    buttonLabel: "Register for Adults",
    description: "Whether you're new to the game or a seasoned club player, our adult programs are designed to fit your busy schedule and help you achieve your personal chess goals.",
    included: ["Beginner to advanced group classes", "Social chess nights and events", "Flexible evening and weekend schedules", "Focus on practical play and strategy"],
  },
] as const;

export const locations = [
  { name: "Midtown", address: "641 Lexington Ave, New York, NY 10022", phone: "(347) 475-5912", mapsQuery: "641 Lexington Ave, New York, NY 10022" },
  { name: "Waterline Square Rentals", address: "400 W 61st, New York, NY 10023", phone: "(347) 475-5912", mapsQuery: "400 W 61st, New York, NY 10023" },
  { name: "Online", address: "See Contact Below", phone: "(347) 475-5912", mapsQuery: null },
] as const;

export const about = {
  heading: "Meet Murad Shadiev",
  body: "Chess Expert and Chess Tutor. In his youth, Murad was one of the top Junior players in his native Uzbekistan. He has experience teaching chess to young kids as well as adults, and his sense of humor helps students get through the toughest chess concepts with ease and grace.",
  stats: [
    { value: "10+", label: "Years Teaching" },
    { value: "10+", label: "National Champions" },
    { value: "100+", label: "Students Taught" },
  ],
};

export const testimonials = [
  "My son has achieved unimaginable heights in one year with coach Murad. Winning 2024 State championships, and Winning K1000 in Nationals 2024. Currently ranked as top 5 kindergartners in the country.",
  "My son has developed love for the game and won the clear 2nd place in NY State championships 2025 in Saratoga and all this happened in one year of working with Coach Murad.",
  "My daughter has improved in one year achieving top 3 seed in all girls NY state championships.",
  "My son scored 5 out of 6 in NY state championships beginning category after only working for 3 month with Coach Murad.",
  "My son has won numerous tournaments including the prestigious Hunter championship category and achieved the rating of 1443 in one year. Ranking him the highest rated first grader in the NY state. All thanks to coach Murad.",
];

export const faqs = [
  { q: "What are your class prices?", a: "Group lessons start at $40/session, private lessons are $80/hour. We offer package deals and sibling discounts." },
  { q: "What is your class schedule?", a: "We offer classes Monday through Saturday, with morning, afternoon, and evening options to fit your schedule." },
  { q: "Can complete beginners join?", a: "We welcome students of all skill levels, from complete beginners to advanced tournament players." },
];
