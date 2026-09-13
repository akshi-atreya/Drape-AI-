import { ChatMessage, Outfit } from "@/lib/types";
import { OutfitCard } from "@/components/OutfitCard";

export function ChatMessageBubble({
  message,
  onTryOn,
  savedIds,
}: {
  message: ChatMessage;
  onTryOn: (outfit: Outfit) => void;
  savedIds: Set<string>;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`animate-in flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser ? "bg-charcoal text-ivory rounded-br-md" : "bg-white border border-beige-dark/60 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>

      {message.outfits && message.outfits.length > 0 && (
        <div className="mt-4 flex flex-col md:flex-row flex-wrap gap-5 w-full">
          {message.outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onTryOn={onTryOn} savedIds={savedIds} />
          ))}
        </div>
      )}
    </div>
  );
}
