import { useState } from "react";
import { TopicInput } from "@/components/TopicInput";
import { LearningMap } from "@/components/LearningMap";
import { NodeDetailModal } from "@/components/NodeDetailModal";
import { RelatedTopics } from "@/components/RelatedTopics";
import { FollowUpChat } from "@/components/FollowUpChat";
import { Button } from "@/components/ui/button";
import { Download, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [learningMap, setLearningMap] = useState<{
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
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{
    name: string;
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    estimatedHours?: number;
    prerequisites?: string[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  // Shared UI types
  type Resource = { title: string; url: string; type: string };
  type UINode = {
    id: string;
    name: string;
    description: string;
    resources: Resource[];
    estimatedHours: number;
    prerequisites: string[];
  };
  type UIBranch = {
    id: string;
    name: string;
    description: string;
    level: string;
    nodes: UINode[];
  };
  type UIMap = {
    topic: string;
    description: string;
    branches: UIBranch[];
    relatedTopics: string[];
  };
  type GenerateMapMeta = { provider: "perplexity" };
  type GenerateMapEnvelope = {
    error?: string;
    map?: UIMap;
    meta?: GenerateMapMeta;
    topic?: string;
    description?: string;
    branches?: UIBranch[];
    relatedTopics?: string[];
  };

  const handleGenerate = async (topic: string, level: string) => {
    setIsLoading(true);
    console.log("🚀 Starting learning map generation...");
    console.log("📝 Topic:", topic);
    console.log("🎯 Level:", level);
    console.log("🔑 API Keys Status:");
    console.log(
      "- VITE_SUPABASE_URL:",
      import.meta.env.VITE_SUPABASE_URL ? "✅ Configured" : "❌ Missing",
    );
    console.log(
      "- Supabase anon key:",
      import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Configured" : "❌ Missing",
    );

    try {
      // Prefer local proxy first to ensure OpenRouter + deep link verification in dev
      let finalMap: UIMap | undefined;
      let resp: GenerateMapEnvelope | null = null;
      try {
        const r = await fetch("/api/perplexity-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, level }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Local proxy error");
        finalMap = j?.map as UIMap | undefined;
        console.log(
          "🧠 Provider:",
          j?.meta?.provider,
          j?.meta?.localProxy ? "(local proxy)" : "",
          "model:",
          j?.meta?.model,
          j?.meta?.linkVerification,
        );
      } catch (e) {
        console.warn(
          "Local proxy unavailable or failed, falling back to Supabase function...",
          e instanceof Error ? e.message : e,
        );
      }

      if (!finalMap) {
        const { data, error } = await supabase.functions.invoke(
          "generate-map",
          { body: { topic, level } },
        );
        if (error) throw error;
        resp = (
          typeof data !== "undefined" ? data : null
        ) as GenerateMapEnvelope | null;
        if (resp?.error) throw new Error(resp.error);
        finalMap =
          resp?.map ||
          (resp?.topic && resp?.branches
            ? {
                topic: resp.topic,
                description: resp.description || "",
                branches: resp.branches || [],
                relatedTopics: resp.relatedTopics || [],
              }
            : undefined);
        if (!finalMap) {
          // Final fallback: try proxy again
          try {
            const r = await fetch("/api/perplexity-map", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic, level }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Local proxy error");
            finalMap = j?.map as UIMap | undefined;
            console.log(
              "🧠 Provider:",
              j?.meta?.provider,
              j?.meta?.localProxy ? "(local proxy)" : "",
              "model:",
              j?.meta?.model,
              j?.meta?.linkVerification,
            );
          } catch {
            throw new Error("Malformed response: missing map structure");
          }
        }
      }

      // If the response is legacy-shaped (no meta/map envelope), prefer Perplexity via local proxy to ensure real-time URLs
      const isLegacy = !!resp && !("map" in (resp || {})) && !!resp?.topic;
      if (isLegacy) {
        console.log(
          "ℹ️ Legacy response detected from server. Enriching via local proxy (OpenRouter/Perplexity) for fresh links...",
        );
        try {
          const r = await fetch("/api/perplexity-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, level }),
          });
          const j = await r.json();
          if (r.ok && j?.map) {
            finalMap = j.map as UIMap;
            console.log(
              "🧠 Provider:",
              j?.meta?.provider,
              j?.meta?.localProxy ? "(local proxy)" : "",
              "model:",
              j?.meta?.model,
              j?.meta?.linkVerification,
            );
          } else {
            console.warn(
              "Perplexity local proxy failed; using legacy map. Error:",
              j?.error,
            );
          }
        } catch (e) {
          console.warn("Perplexity local proxy unavailable; using legacy map.");
        }
      }

      if (!finalMap)
        throw new Error("Malformed response: missing map structure");

      console.log("✅ Learning map generated successfully");
      console.log(
        "🧠 Provider:",
        resp?.meta?.provider || (resp?.map ? "unknown" : "legacy-shape"),
      );
      console.log("📊 Map data:", finalMap);

      setLearningMap(finalMap);
      toast({
        title: "Success!",
        description: `Your learning map has been generated${resp?.meta?.provider ? ` using ${resp.meta.provider}` : ""}.`,
      });
    } catch (error) {
      console.error("❌ Error generating map:", error);
      console.log("💡 Check server logs for API key status and error details");
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate learning map. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 Generation process completed");
    }
  };

  const handleNodeClick = (node: {
    name: string;
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    estimatedHours?: number;
    prerequisites?: string[];
  }) => {
    setSelectedNode(node);
    setModalOpen(true);
  };

  const handleExportJSON = () => {
    if (!learningMap) return;

    const dataStr = JSON.stringify(learningMap, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${learningMap.topic.replace(/\s+/g, "-").toLowerCase()}-learning-map.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Learning map downloaded as JSON.",
    });
  };

  const handleRelatedTopicClick = (topic: string) => {
    handleGenerate(topic, "beginner");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                  Learning Map Generator
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  AI-Powered Learning Roadmaps
                </p>
              </div>
            </div>
            {learningMap && (
              <Button
                onClick={handleExportJSON}
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Responsive spacing */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-12">
        <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-12 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Master Any Subject with AI
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Enter any topic and get a comprehensive, interactive learning
            roadmap powered by advanced AI. Explore branches, discover
            resources, and track your progress.
          </p>
        </div>

        <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />

        {learningMap && (
          <>
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center px-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
                  {learningMap.topic}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {learningMap.description}
                </p>
              </div>

              <LearningMap data={learningMap} onNodeClick={handleNodeClick} />
            </div>

            {/* Follow-Up Chat Section */}
            <FollowUpChat
              topic={learningMap.topic}
              learningMapContext={JSON.stringify(learningMap, null, 2)}
            />

            {learningMap.relatedTopics && (
              <RelatedTopics
                topics={learningMap.relatedTopics}
                onTopicClick={handleRelatedTopicClick}
              />
            )}
          </>
        )}
      </main>

      {/* Footer - Mobile optimized */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
          <p className="leading-relaxed">
            Built with AI • Powered by Perplexity • Made with ❤️ for learners
            everywhere
          </p>
        </div>
      </footer>

      <NodeDetailModal
        node={selectedNode}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
