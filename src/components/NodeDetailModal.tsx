import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NodeDetailModalProps {
  node: {
    name: string;
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    estimatedHours?: number;
    prerequisites?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeDetailModal = ({ node, open, onOpenChange }: NodeDetailModalProps) => {
  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent pr-8">
            {node.name}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base mt-2 leading-relaxed">
            {node.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4">
          {node.estimatedHours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">Estimated Time:</span>
              <span>{node.estimatedHours} hours</span>
            </div>
          )}

          {node.prerequisites && node.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                Prerequisites
              </h3>
              <div className="flex flex-wrap gap-2">
                {node.prerequisites.map((prereq: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {node.resources && node.resources.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-3">Learning Resources</h3>
              <div className="space-y-2">
                {node.resources.map((resource: {
                  title: string;
                  url: string;
                  type: string;
                }, index: number) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors touch-manipulation"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm break-words">{resource.title}</div>
                        <Badge variant="outline" className="mt-1.5 text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-primary hover:opacity-90 h-10 sm:h-11 touch-manipulation"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
