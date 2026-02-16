import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageCircle, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark } from "@/types/bookmark";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AskDocModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark;
}

export function AskDocModal({ open, onOpenChange, bookmark }: AskDocModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ask-doc", {
        body: {
          question,
          bookmarkId: bookmark.id,
          content: bookmark.content || "",
          url: bookmark.tweet_url,
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.error || "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get an answer. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const domain = (() => {
    try { return new URL(bookmark.tweet_url).hostname.replace("www.", ""); } catch { return "doc"; }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            Ask about — <span className="text-muted-foreground font-normal truncate">{bookmark.author_name || domain}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12 space-y-2">
              <Bot className="h-10 w-10 mx-auto opacity-40" />
              <p>Ask anything about this document</p>
              <p className="text-xs">e.g. "What are the main takeaways?" or "Explain the key concept"</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && <User className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 items-center">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleAsk} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
