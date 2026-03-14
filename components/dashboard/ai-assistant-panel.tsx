"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles, Send } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const QUICK_SUGGESTIONS = [
  "Summarize open alerts",
  "Top anomalies (24h)",
  "Recommend threshold",
  "Why did production drop?"
];

export function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I can help explain anomalies, alerts, and production shifts."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const ask = async (questionText: string) => {
    if (!questionText.trim()) {
      return;
    }

    const cleanQuestion = questionText.trim();
    setMessages((prev) => [...prev, { role: "user", content: cleanQuestion }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion })
      });

      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Assistant error", description: json.error ?? "Unknown error", kind: "error" });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I could not process that request. Please try again."
          }
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.answer ?? "No answer generated."
        }
      ]);
    } catch (error) {
      toast({ title: "Assistant request failed", description: String(error), kind: "error" });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue detected. Please retry in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(139,92,246,0.65)]"
      >
        {isOpen ? <Sparkles className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl backdrop-blur-lg"
          >
            <header className="border-b border-border bg-gradient-to-r from-blue-500/20 to-violet-500/20 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted">Live insights for industrial telemetry</p>
            </header>

            <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <p
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm",
                      message.role === "user"
                        ? "rounded-br-sm bg-accent text-white"
                        : "rounded-bl-sm border border-border bg-card text-foreground"
                    )}
                  >
                    {message.content}
                  </p>
                </div>
              ))}
              {loading ? (
                <div className="flex justify-start">
                  <p className="rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-foreground/80">
                    Analyzing telemetry...
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-border px-4 pb-2 pt-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void ask(item)}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-foreground/80 transition-colors hover:border-accent/70 hover:bg-surface/80"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about alerts or anomalies..."
                  className="h-9 text-xs"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}
