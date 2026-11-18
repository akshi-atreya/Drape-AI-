import { Trend } from "@/lib/types";

// Hand-written fallback trends, used only when the live feed pipeline
// (src/lib/live-trends.ts) is unavailable — no API key, feeds unreachable, or
// extraction failed. Normally the Trends page and the recommendation engine
// use trends extracted from current fashion publications instead.
export const trends: Trend[] = [
  {
    id: "t-burgundy",
    pieceTypes: ["Wool Coat","Knit Top","Turtleneck","Ankle Boots","Shoulder Bag","Midi Dress"],
    colors: ["burgundy","rust"],
    strength: 0.7,
    name: "Burgundy",
    season: "Fall 2026",
    heroColor: "#5b2333",
    shortExplanation:
      "A deep, wine-toned red that reads warm rather than bold — the season's answer to head-to-toe neutrals.",
    whyTrending:
      "Runway collections leaned into rich jewel tones this season, and burgundy has trickled down fastest because it pairs as easily with black and cream as it does on its own.",
    howToWear:
      "Use it as an anchor piece — a knit, a bag, or boots — against cream or charcoal so it reads intentional rather than costume-y.",
  },
  {
    id: "t-suede",
    pieceTypes: ["Suede Jacket","Ankle Boots","Chelsea Boots","Shoulder Bag","Loafers"],
    colors: ["brown","camel","beige"],
    strength: 0.65,
    name: "Suede",
    season: "Fall 2026",
    heroColor: "#8a6a4f",
    shortExplanation:
      "Soft, matte texture showing up in jackets, boots and bags — the season's strongest material trend.",
    whyTrending:
      "Suede softens tailoring and adds warmth without pattern or color, which fits the broader move toward quiet, texture-driven dressing.",
    howToWear:
      "One suede piece per look is plenty. Let it be the texture moment and keep everything else smooth and simple.",
  },
  {
    id: "t-relaxed-tailoring",
    pieceTypes: ["Blazer","Wide-Leg Trousers","Tailored Trousers","Chinos","Overshirt"],
    colors: ["charcoal","navy","beige"],
    strength: 0.7,
    name: "Relaxed Tailoring",
    season: "Fall 2026",
    heroColor: "#3a3a38",
    shortExplanation:
      "Structured blazers and trousers cut with more room — tailoring that moves.",
    whyTrending:
      "Workwear is loosening up. Brands are softening shoulders and widening legs so tailoring feels lived-in rather than corporate.",
    howToWear:
      "Balance the volume — if the trouser is wide, keep the top fitted, or vice versa.",
  },
  {
    id: "t-statement-accessories",
    pieceTypes: ["Belt","Sunglasses","Jewelry Set","Watch"],
    colors: [],
    strength: 0.5,
    name: "Statement Accessories",
    season: "Fall 2026",
    heroColor: "#c9a24b",
    shortExplanation:
      "One bold accessory — a belt, sunglasses, or jewelry set — doing the styling work.",
    whyTrending:
      "As base wardrobes get simpler, the accessory is where personality and trend enter a look.",
    howToWear:
      "Pick one. A statement belt and statement jewelry together compete rather than complement.",
  },
  {
    id: "t-ballet-flats",
    pieceTypes: ["Ballet Flats","Loafers"],
    colors: ["black","cream","burgundy"],
    strength: 0.55,
    name: "Ballet Flats",
    season: "Fall 2026",
    heroColor: "#d8c9b8",
    shortExplanation:
      "The soft, rounded flat is back — quieter than sneakers, easier than heels.",
    whyTrending:
      "A broader shift toward comfort-without-sacrificing-polish has made ballet flats the default shoe on runways and street style alike.",
    howToWear:
      "They work best against a longer hemline — a midi skirt or wide trouser — to keep proportions balanced.",
  },
  {
    id: "t-layering",
    pieceTypes: ["Turtleneck","Knit Top","Slip Dress","Blazer","Overshirt","Wool Coat"],
    colors: [],
    strength: 0.6,
    name: "Layering",
    season: "Fall 2026",
    heroColor: "#6b5d4f",
    shortExplanation:
      "Turtlenecks under slip dresses, knits under blazers — texture and warmth built in visible layers.",
    whyTrending:
      "As fall dressing gets more function-driven, layering has become the styling technique of the season rather than just a cold-weather necessity.",
    howToWear:
      "Stick to two or three tonal layers so the look reads intentional, not bulky.",
  },
];
