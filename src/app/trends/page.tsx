import { trends } from "@/data/trends";
import { getFashionNews } from "@/lib/news-source";
import { TrendCard } from "@/components/TrendCard";
import { NewsCard } from "@/components/NewsCard";

export default async function TrendsPage() {
  const news = await getFashionNews();

  return (
    <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-14 space-y-20">
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl">What&apos;s trending</h1>
          <p className="text-charcoal-soft">
            A restrained edit of what&apos;s actually worth adopting this season — not everything, all at once.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trends.map((t) => (
            <TrendCard key={t.id} trend={t} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl">Fashion Now</h2>
          <p className="text-charcoal-soft text-sm">
            The season&apos;s developments, summarized — not dumped as a wall of headlines.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
