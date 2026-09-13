"use client";

import { useAppStore } from "@/store/useAppStore";
import { HeroLanding } from "@/components/HeroLanding";
import { ChatView } from "@/components/ChatView";

export default function Home() {
  const chatStarted = useAppStore((s) => s.chatStarted);
  return chatStarted ? <ChatView /> : <HeroLanding />;
}
