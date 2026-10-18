import { about } from "@/data/content";

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900 mb-6">{about.heading}</h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-xl">{about.body}</p>
            <dl className="grid grid-cols-3 gap-4 max-w-md">
              {about.stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-gray-50 py-4 text-center">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-bold text-blue-900">{s.value}</dd>
                  <dd className="text-xs sm:text-sm text-gray-600 px-1">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img src="/murad.jpeg" alt="Murad Shadiev teaching chess" className="w-full max-w-md aspect-[4/5] object-cover rounded-2xl shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
