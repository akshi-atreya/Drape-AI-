"use client";

import { useRouter } from "next/navigation";
import { NewsArticle } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export function NewsCard({ article }: { article: NewsArticle }) {
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);

  const buildLook = () => {
    sendMessage(article.headline.replace(/^Why /, "Build me a ").replace(/ is everywhere.*/, " look."));
    router.push("/");
  };

  return (
    <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60 flex flex-col">
      <div className="aspect-[16/9]" style={{ background: `linear-gradient(155deg, ${article.heroColor}, ${article.heroColor}aa)` }} />
      <div className="p-5 space-y-2.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-gray">
          <span className="uppercase tracking-wide">{article.category}</span>
          <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
        <h3 className="font-serif text-xl leading-snug">{article.headline}</h3>
        <p className="text-sm text-charcoal-soft leading-relaxed flex-1">{article.summary}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray">{article.source}</span>
          <button onClick={buildLook} className="text-xs text-accent hover:underline">
            Build this look
          </button>
        </div>
      </div>
    </article>
  );
}
