import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FollowUpChatProps {
  topic: string;
  learningMapContext: string;
}

export const FollowUpChat = ({ topic, learningMapContext }: FollowUpChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatAnswer = (text: string): string => {
    if (!text) return text;
    // Convert bare URLs to markdown links
    const linkified = text.replace(/(?<!\]\()((https?:\/\/)[^\s)]+)(?!\))/g, "[$1]($1)");
    // Ensure list markers are consistent
    return linkified.replace(/^\s*\*\s+/gm, "- ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      let answer = "";

      // Try local proxy first
      try {
        const response = await fetch("/api/perplexity-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            learningMapContext,
            conversationHistory,
            question: input.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          answer = data.answer || "";
        } else {
          throw new Error("Proxy failed");
        }
      } catch (proxyError) {
        console.warn("Local proxy unavailable, trying Supabase function...", proxyError);
        
        // Fallback to Supabase function
        const { data, error } = await supabase.functions.invoke("follow-up-chat", {
          body: {
            topic,
            learningMapContext,
            conversationHistory,
            question: input.trim(),
          },
        });

        if (error) throw error;
        answer = data?.answer || "";
      }

      if (!answer) {
        throw new Error("No response generated");
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formatAnswer(answer),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting follow-up answer:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white/50 backdrop-blur-sm border-2 hover-lift transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Ask Follow-Up Questions</h3>
      </div>
      
      <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ask questions about "{topic}" to deepen your understanding</p>
            <p className="text-sm mt-2">Examples: "What are the prerequisites?", "Can you explain more about...?"</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 shadow-sm prose prose-sm dark:prose-invert",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a({ node, ...props }) {
                            return (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
                              />
                            );
                          },
                          p({ node, ...props }) {
                            return <p className="mb-2 leading-relaxed" {...props} />;
                          },
                          ul({ node, ...props }) {
                            return <ul className="list-disc ml-5 space-y-1 mb-2" {...props} />;
                          },
                          ol({ node, ...props }) {
                            return <ol className="list-decimal ml-5 space-y-1 mb-2" {...props} />;
                          },
                          li({ node, ...props }) {
                            return <li className="leading-relaxed" {...props} />;
                          },
                          strong({ node, ...props }) {
                            return <strong className="font-semibold" {...props} />;
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          code(props: any) {
                            const { inline, children, ...rest } = props || {};
                            return inline ? (
                              <code className="px-1 py-0.5 rounded bg-muted text-muted-foreground" {...rest}>
                                {children}
                              </code>
                            ) : (
                              <code className="block w-full p-2 rounded bg-muted text-muted-foreground overflow-x-auto" {...rest}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question... (Shift+Enter for new line)"
          className="min-h-[60px] max-h-[120px] resize-none focus:scale-[1.01] transition-transform"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="h-[60px] w-[60px] shrink-0 hover:scale-105 transition-transform"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </Card>
  );
};
