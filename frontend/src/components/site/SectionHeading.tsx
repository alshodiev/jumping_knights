export default function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}
