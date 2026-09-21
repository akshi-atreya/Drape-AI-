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
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        )}
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
