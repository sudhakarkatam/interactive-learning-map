import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, Clock, BookOpen, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced AI generates personalized learning paths tailored to your skill level and goals.",
      color: "text-blue-500"
    },
    {
      icon: Target,
      title: "Curated Resources",
      description: "Get handpicked articles and videos from top sources like MDN, FreeCodeCamp, and YouTube.",
      color: "text-purple-500"
    },
    {
      icon: Clock,
      title: "Time Estimates",
      description: "Know exactly how long each topic takes with accurate time estimates for better planning.",
      color: "text-teal-500"
    },
    {
      icon: BookOpen,
      title: "Structured Learning",
      description: "Follow a clear, organized roadmap with branches and nodes for systematic progress.",
      color: "text-orange-500"
    }
  ];

  const steps = [
    { number: "1", title: "Enter Your Topic", description: "Type any subject you want to master" },
    { number: "2", title: "Choose Your Level", description: "Select beginner, intermediate, or advanced" },
    { number: "3", title: "Get Your Roadmap", description: "AI generates a personalized learning path" },
    { number: "4", title: "Start Learning", description: "Follow curated resources and track progress" }
  ];

  const benefits = [
    "📚 Access to curated, high-quality resources",
    "🎯 Clear learning objectives and milestones",
    "⏱️ Realistic time estimates for each topic",
    "🔄 Regular updates with latest content",
    "🎥 Mix of video tutorials and written guides",
    "📊 Visual, interactive learning maps"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 animate-pulse-slow"></div>
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-slide-in-down">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>AI-Powered Learning Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in-up animation-delay-200">
              Master Any Topic with
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2 animate-gradient">
                AI-Generated Roadmaps
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
              Get personalized learning paths with curated resources, time estimates, and step-by-step guidance for any subject you want to learn.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up animation-delay-600">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg px-8 bg-gradient-primary hover:opacity-90 transition-all shadow-lg hover-lift"
                onClick={() => navigate('/app')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Learning Map
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg px-8 hover-lift"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 sm:pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">100+</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Topics Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Fresh</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Latest Resources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">AI</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Powered Search</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to accelerate your learning journey
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-card rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 cursor-pointer hover-lift ${
                  hoveredFeature === index 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.color} mb-4 transition-transform ${hoveredFeature === index ? 'scale-110' : ''}`} />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your personalized learning roadmap in 4 simple steps
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-card rounded-2xl p-6 sm:p-8 border-2 border-border hover:border-primary transition-all h-full">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-4 shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                What You Get
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Comprehensive learning experience designed for success
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 bg-card rounded-2xl p-6 sm:p-8 md:p-10 border-2 border-border">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-base sm:text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-primary rounded-3xl p-8 sm:p-12 md:p-16 text-white hover-lift transition-all">
            <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-lg sm:text-xl mb-8 opacity-90 leading-relaxed">
              Join thousands of learners who are mastering new skills with AI-powered roadmaps.
              Generate your personalized learning path in seconds.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 sm:h-14 text-base sm:text-lg px-8 bg-white text-primary hover:bg-white/90 shadow-xl hover-lift"
              onClick={() => navigate('/app')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Learning Map Generator</span>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Built with AI • Powered by Perplexity • Made with ❤️ for learners
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
