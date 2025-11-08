import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface RelatedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
}

export const RelatedTopics = ({ topics, onTopicClick }: RelatedTopicsProps) => {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 border border-border">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">You might also be interested in</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onTopicClick(topic)}
              className="hover:bg-primary hover:text-primary-foreground transition-all text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
            >
              {topic}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
