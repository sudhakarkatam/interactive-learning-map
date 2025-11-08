import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { MapNode } from "./MapNode";

interface LearningMapProps {
  data: {
    topic: string;
    description: string;
    branches: Array<{
      id: string;
      name: string;
      description: string;
      level: string;
      nodes: Array<{
        id: string;
        name: string;
        description: string;
        resources: Array<{
          title: string;
          url: string;
          type: string;
        }>;
        estimatedHours: number;
        prerequisites: string[];
      }>;
    }>;
    relatedTopics: string[];
  } | null;
  onNodeClick: (node: {
    name: string;
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    estimatedHours?: number;
    prerequisites?: string[];
  }) => void;
}

export const LearningMap = ({ data, onNodeClick }: LearningMapProps) => {
  const nodeTypes = useMemo(() => ({ custom: MapNode }), []);

  // Generate nodes and edges from learning map data
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center node (main topic)
    nodes.push({
      id: "center",
      type: "custom",
      position: { x: 0, y: 0 },
      data: {
        label: data.topic,
        description: data.description,
        isCenter: true,
        nodeData: { name: data.topic, description: data.description },
      },
    });

    // Calculate positions for branches - responsive radius
    const branchCount = data.branches?.length || 0;
    const isMobile = window.innerWidth < 768;
    const branchRadius = isMobile ? 400 : 800; // Smaller radius on mobile

    data.branches?.forEach((branch: {
      id: string;
      name: string;
      description: string;
      level: string;
      nodes: Array<{
        id: string;
        name: string;
        description: string;
        resources: Array<{
          title: string;
          url: string;
          type: string;
        }>;
        estimatedHours: number;
        prerequisites: string[];
      }>;
    }, branchIndex: number) => {
      const angle = (2 * Math.PI * branchIndex) / branchCount - Math.PI / 2;
      const branchX = Math.cos(angle) * branchRadius;
      const branchY = Math.sin(angle) * branchRadius;

      const branchId = `branch-${branchIndex}`;

      // Branch node
      nodes.push({
        id: branchId,
        type: "custom",
        position: { x: branchX, y: branchY },
        data: {
          label: branch.name,
          description: branch.description,
          level: branch.level,
          isBranch: true,
          nodeData: branch,
        },
      });

      // Edge from center to branch
      edges.push({
        id: `edge-center-${branchId}`,
        source: "center",
        target: branchId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217 91% 60%)", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(217 91% 60%)",
        },
      });

      // Subtopic nodes with improved spacing - responsive
      const nodeCount = branch.nodes?.length || 0;
      const subRadius = isMobile ? 300 : 600; // Smaller radius on mobile
      
      // Calculate angle offset based on branch position to avoid overlaps
      const angleOffset = angle + Math.PI / 2;

      branch.nodes?.forEach((node: {
        id: string;
        name: string;
        description: string;
        resources: Array<{
          title: string;
          url: string;
          type: string;
        }>;
        estimatedHours: number;
        prerequisites: string[];
      }, nodeIndex: number) => {
        // Distribute subtopics in a wider arc around the branch
        const arcSpan = Math.PI * 1.5; // 270 degrees arc for better distribution
        const startAngle = angleOffset - arcSpan / 2;
        const subAngle = startAngle + (arcSpan * nodeIndex) / Math.max(nodeCount - 1, 1);
        
        const nodeX = branchX + Math.cos(subAngle) * subRadius;
        const nodeY = branchY + Math.sin(subAngle) * subRadius;

        const nodeId = `node-${branchIndex}-${nodeIndex}`;

        nodes.push({
          id: nodeId,
          type: "custom",
          position: { x: nodeX, y: nodeY },
          data: {
            label: node.name,
            description: node.description,
            estimatedHours: node.estimatedHours,
            nodeData: node,
          },
        });

        // Edge from branch to subtopic
        edges.push({
          id: `edge-${branchId}-${nodeId}`,
          source: branchId,
          target: nodeId,
          type: "smoothstep",
          style: { stroke: "hsl(174 62% 47%)", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "hsl(174 62% 47%)",
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.data.nodeData);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[400px] sm:h-[600px] md:h-[800px] lg:h-[900px] bg-card rounded-xl sm:rounded-2xl shadow-medium border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: window.innerWidth < 768 ? 0.15 : 0.3 }}
        panOnDrag={true}
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        className="touch-pan-x touch-pan-y"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={window.innerWidth < 768 ? 15 : 20} 
          size={1} 
          color="hsl(214.3 31.8% 91.4%)" 
        />
        <Controls className="bg-card border border-border rounded-lg shadow-soft !bottom-2 !left-2 sm:!bottom-4 sm:!left-4" />
      </ReactFlow>
    </div>
  );
};
