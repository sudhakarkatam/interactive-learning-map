import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";

interface TopicInputProps {
  onGenerate: (topic: string, level: string) => void;
  isLoading: boolean;
}

export const TopicInput = ({ onGenerate, isLoading }: TopicInputProps) => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic.trim(), level);
      // Clear the input after submission to allow for new topics
      setTopic("");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 md:p-8 border border-border hover-lift transition-all">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-2">
              What do you want to learn?
            </label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., Web Development, Machine Learning..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              className="h-11 sm:h-12 text-base sm:text-lg transition-all focus:scale-[1.02]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 sm:mb-3">
              Select your level
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {["beginner", "intermediate", "advanced"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  disabled={isLoading}
                  className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base touch-manipulation hover-lift ${
                    level === lvl
                      ? "bg-primary text-primary-foreground shadow-medium scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                  }`}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-primary hover:opacity-90 transition-all touch-manipulation hover-lift shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="hidden sm:inline">Generating Your Learning Map...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Generate Learning Map</span>
                <span className="sm:hidden">Generate Map</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
