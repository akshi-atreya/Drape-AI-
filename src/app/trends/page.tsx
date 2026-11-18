import { getLiveTrends } from "@/lib/live-trends";
import { TrendCard } from "@/components/TrendCard";
import { NewsCard } from "@/components/NewsCard";

// Rendered per request; getLiveTrends() itself caches the (slow, paid) feed
// fetch + extraction for hours, so visitors don't each trigger it.
export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { trends, news, live, updatedAt, outlets } = await getLiveTrends();

  return (
    <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-14 space-y-20">
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl">What&apos;s trending</h1>
          <p className="text-charcoal-soft">
            {live
              ? "What fashion editors are covering right now, distilled into what's actually worth wearing."
              : "A restrained edit of what's worth adopting this season — not everything, all at once."}
          </p>
          <p className="text-xs text-gray">
            {live && updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} from ${outlets.join(", ")}. Trend summaries are written by FitCast; articles link back to the original.`
              : "Live trend feed unavailable right now — showing our curated edit."}
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
            {live ? "Fresh stories from the publications we read — tap through for the full piece." : "The season's developments, summarized — not dumped as a wall of headlines."}
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
