import { NewsArticle } from "@/lib/types";

// MVP seed data standing in for a live fashion news/trend feed. In production
// this should be replaced by `lib/news-source.ts` calling a real web/news API
// (see the comment there) — nothing else in the app needs to change since
// consumers only depend on the NewsArticle shape.
export const seedNews: NewsArticle[] = [
  {
    id: "n1",
    headline: "Why burgundy is everywhere this season",
    category: "Runway",
    source: "Editorial Desk",
    date: "2026-09-02",
    summary:
      "From runway collections to high-street retailers, burgundy has become one of the dominant colors this season. Here's how stylists are incorporating it without making the look feel overly formal.",
    heroColor: "#5b2333",
    url: "#",
  },
  {
    id: "n2",
    headline: "The relaxed blazer is replacing the structured one",
    category: "Street Style",
    source: "Editorial Desk",
    date: "2026-08-29",
    summary:
      "Street style photographers are seeing fewer sharply structured shoulders and more oversized, softened blazers worn open over simple layers.",
    heroColor: "#3a3a38",
    url: "#",
  },
  {
    id: "n3",
    headline: "Suede is having its biggest moment in a decade",
    category: "Retail",
    source: "Editorial Desk",
    date: "2026-08-24",
    summary:
      "Retailers are reporting suede jackets and boots as top sellers this fall, with the texture trend spanning both budget and premium price points.",
    heroColor: "#8a6a4f",
    url: "#",
  },
  {
    id: "n4",
    headline: "Celebrities are quietly dressing down for red carpets",
    category: "Celebrity Style",
    source: "Editorial Desk",
    date: "2026-08-20",
    summary:
      "A wave of minimal, quiet-luxury red carpet looks is replacing overt logo dressing, favoring texture and cut over branding.",
    heroColor: "#c9a24b",
    url: "#",
  },
  {
    id: "n5",
    headline: "Ballet flats overtake sneakers in street style counts",
    category: "Street Style",
    source: "Editorial Desk",
    date: "2026-08-14",
    summary:
      "For the first time in several seasons, ballet flats are appearing more often than sneakers in street style roundups outside fashion week venues.",
    heroColor: "#d8c9b8",
    url: "#",
  },
  {
    id: "n6",
    headline: "Designers lean into layering as a design principle",
    category: "Designer News",
    source: "Editorial Desk",
    date: "2026-08-10",
    summary:
      "Several fall collections built entire looks around visible layering rather than treating it as a cold-weather afterthought.",
    heroColor: "#6b5d4f",
    url: "#",
  },
];
