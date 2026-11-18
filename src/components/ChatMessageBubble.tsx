import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, Outfit } from "@/lib/types";
import { OutfitCard } from "@/components/OutfitCard";

// Compact overrides so markdown reads like chat prose, not a document —
// no default paragraph margins stacking up, tight list spacing, links open
// safely in a new tab.
const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-4 space-y-0.5 mt-1">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-4 space-y-0.5 mt-1">{children}</ol>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold">{children}</strong>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
};

export function ChatMessageBubble({
  message,
  onTryOn,
  savedIds,
  onQuickReply,
}: {
  message: ChatMessage;
  onTryOn: (outfit: Outfit) => void;
  savedIds: Set<string>;
  /** Set only while these buttons can still be used (latest message, nothing in flight). */
  onQuickReply?: (text: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`animate-in flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser ? "bg-charcoal text-ivory rounded-br-md" : "bg-white border border-beige-dark/60 rounded-bl-md"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        )}
      </div>

      {onQuickReply && message.quickReplies && message.quickReplies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick replies">
          {message.quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => onQuickReply(reply)}
              className="px-4 py-2 rounded-full border border-charcoal/70 bg-white text-sm text-charcoal hover:bg-charcoal hover:text-ivory transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {message.outfits && message.outfits.length > 0 && (
        // Phone: a swipeable, snap-scrolling carousel that bleeds to the screen
        // edges (the next card peeks in to hint at swiping). Desktop: the
        // original wrapping grid of cards.
        <div className="mt-4 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar w-[calc(100%+3rem)] -mx-6 px-6 pb-2 md:w-full md:mx-0 md:px-0 md:pb-0 md:flex-wrap md:overflow-visible md:gap-5">
          {message.outfits.map((outfit) => (
            <div key={outfit.id} className="shrink-0 snap-center w-[86%] md:w-full md:max-w-[560px]">
              <OutfitCard outfit={outfit} onTryOn={onTryOn} savedIds={savedIds} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
