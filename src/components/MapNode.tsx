import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Clock, Book } from "lucide-react";

export const MapNode = memo(({ data }: { data: {
  label: string;
  description?: string;
  estimatedHours?: number;
  level?: string;
  isCenter?: boolean;
  isBranch?: boolean;
  nodeData?: {
    name: string;
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    estimatedHours?: number;
    prerequisites?: string[];
  };
} }) => {
  const isCenter = data.isCenter;
  const isBranch = data.isBranch;

  return (
    <div
      className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl shadow-soft border-2 transition-all hover:shadow-medium hover:scale-105 cursor-pointer touch-manipulation ${
        isCenter
          ? "bg-gradient-primary text-primary-foreground border-primary min-w-[200px] sm:min-w-[250px] md:min-w-[300px] min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
          : isBranch
          ? "bg-gradient-secondary text-secondary-foreground border-secondary min-w-[180px] sm:min-w-[220px] md:min-w-[250px] min-h-[70px] sm:min-h-[90px] md:min-h-[100px]"
          : "bg-card text-card-foreground border-accent min-w-[160px] sm:min-w-[200px] md:min-w-[220px] min-h-[60px] sm:min-h-[80px] md:min-h-[90px]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 sm:w-3 sm:h-3 !bg-accent border-2 border-background"
      />

      <div className="space-y-1 sm:space-y-2">
        <div className={`font-bold ${isCenter ? "text-lg sm:text-xl md:text-2xl" : isBranch ? "text-base sm:text-lg md:text-xl" : "text-sm sm:text-base md:text-lg"} leading-tight`}>
          {data.label}
        </div>

        {data.description && (
          <div className={`text-xs sm:text-sm md:text-base ${isCenter || isBranch ? "opacity-90" : "text-muted-foreground"} line-clamp-2 sm:line-clamp-3 leading-relaxed`}>
            {data.description}
          </div>
        )}

        {data.estimatedHours && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{data.estimatedHours}h</span>
          </div>
        )}

        {data.level && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <Book className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="capitalize">{data.level}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 sm:w-3 sm:h-3 !bg-accent border-2 border-background"
      />
    </div>
  );
});

MapNode.displayName = "MapNode";
