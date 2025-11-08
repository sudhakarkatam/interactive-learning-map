# Learning Map Generator

An AI-powered web application that generates interactive, visual learning roadmaps for any topic with follow-up question support. Built with React, TypeScript, Perplexity AI, and Supabase.

![Learning Map Generator](https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=400&fit=crop)

## 🎯 Overview

Learning Map Generator helps users create comprehensive learning paths for any subject. Simply enter a topic, select your skill level, and let AI generate a structured, interactive mind map with verified resources, time estimates, and an interactive chat to answer follow-up questions.

## ✨ Features

### Core Features
- 🎨 **Interactive Mind Map Visualization**: Beautiful, zoomable, and pannable learning maps using React Flow
- 🤖 **AI-Powered Generation**: Leverages Perplexity Sonar models with web search for real-time, accurate content
- 💬 **Follow-Up Questions**: Interactive chat to ask questions about your learning topic
- 📚 **Detailed Node Information**: Click any topic to view descriptions, resources, and time estimates
- 🎓 **Multi-Level Support**: Beginner, Intermediate, and Advanced learning paths
- 💾 **Export Functionality**: Download your learning map as JSON for future reference
- 💡 **Related Topics**: Get suggestions for related subjects to explore
- ✅ **URL Verification**: All resources are verified for accessibility (no broken links)
- 🔄 **Global Deduplication**: No duplicate resources across the entire learning map

### Interactive Elements
- **Hover Effects**: Preview node descriptions on hover
- **Click to Expand**: Detailed modal with learning resources and prerequisites
- **Smooth Animations**: Fluid transitions and animated connections
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Follow-Up Chat**: Ask questions and get AI-powered answers about your topic

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first styling
- **React Flow** - Interactive node-based graphs
- **Shadcn/ui** - Beautiful, accessible components
- **Lucide React** - Icon library
- **Framer Motion** - Animation library (CSS animations currently)

### Backend
- **Supabase** - Backend infrastructure and edge functions
- **Supabase Edge Functions** - Serverless Deno functions
- **Vite Dev Proxy** - Local development middleware for API calls

### AI Integration
- **Provider**: Perplexity AI (Sonar models)
- **Default Model**: `sonar-pro`
- **Features**: Web search, real-time content, URL verification
- **Max Tokens**: 10,000 (for detailed responses)
- **Temperature**: 0.2 (for maps), 0.3 (for chat)
- **Recency Filter**: "after:2020" for fresh content

## 📐 Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ User Input (Topic + Level)
       ▼
┌─────────────────────┐
│   React Frontend    │
│  - TopicInput       │
│  - LearningMap      │
│  - FollowUpChat     │
│  - NodeDetailModal  │
└──────┬──────────────┘
       │ API Calls
       ▼
┌─────────────────────────────┐
│  Dual API Architecture      │
│  1. Vite Proxy (dev)         │
│     /api/perplexity-map      │
│     /api/perplexity-chat     │
│  2. Supabase Functions (prod)│
│     generate-map             │
│     follow-up-chat           │
└──────┬──────────────────────┘
       │ AI Requests
       ▼
┌─────────────────────┐
│   Perplexity AI     │
│  - Web Search       │
│  - Real-time Data   │
│  - URL Verification │
└──────┬──────────────┘
       │ JSON Response
       ▼
┌─────────────────────┐
│   React Flow        │
│  Mind Map Render    │
└─────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Perplexity API Key (from https://www.perplexity.ai/)
- Supabase Account (for production deployment)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd insight-journey-gen-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Perplexity AI (Required)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Optional: Override default model (sonar-pro)
PERPLEXITY_MODEL=sonar-pro

# Supabase (Required for production)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Development Workflow

**Local Development (Recommended)**
- Vite proxy middleware handles API calls
- Keeps your API key secure (not exposed to browser)
- Faster development cycle
- No need to deploy edge functions for testing

**Production Deployment**
- Deploy edge functions to Supabase
- Set secrets remotely
- Frontend connects to Supabase functions
- Falls back to local proxy if available

## 📦 Deployment

### 1. Deploy to Supabase

**Deploy Edge Functions**

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy both functions
supabase functions deploy generate-map
supabase functions deploy follow-up-chat
```

**Set Secrets**

```bash
# Set Perplexity API key
supabase secrets set PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Optional: Set model override
supabase secrets set PERPLEXITY_MODEL=sonar-pro
```

**Verify Deployment**

```bash
# Test generate-map function
supabase functions invoke generate-map --data '{"topic":"Python","level":"beginner"}'

# Test follow-up-chat function
supabase functions invoke follow-up-chat --data '{"topic":"Python","question":"What are the best resources?"}'
```

### 2. Deploy Frontend

**Build for production**
```bash
npm run build
```

**Deploy to your hosting provider**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 🔌 API Integration & LLM Notes

### Perplexity AI Integration

**Why Perplexity?**
- Real-time web search capability
- Always returns current, verified URLs
- No hallucinated links or outdated content
- Optimized for factual, up-to-date information

**API Configuration**
```typescript
// Vite proxy and edge functions use the same config
const config = {
   model: 'sonar-pro', // Default, can be overridden
   temperature: 0.2,   // Low for structured output
   max_tokens: 10000,  // Increased for detailed maps
   search: true        // Enable web search
};
```

**Available Models (2025)**
- `sonar` - Fast, balanced model
- `sonar-pro` - **Default**, best quality/speed ratio
- `sonar-reasoning` - Advanced reasoning
- `sonar-reasoning-pro` - Maximum reasoning capability
- `sonar-deep-research` - Comprehensive research

**Request Flow**
1. Frontend calls `/api/perplexity-map` (proxy) or Supabase function
2. System prompt instructs AI to search web with "after:2020" filter
3. AI generates structured JSON with real URLs
4. Proxy/function verifies URLs (HEAD/GET requests)
5. Global deduplication removes repeated resources
6. Response sent to frontend with metadata

**Follow-Up Chat**
- Uses same Perplexity API with conversational context
- Temperature: 0.3 (slightly higher for natural responses)
- Max tokens: 2000 (focused answers)
- Maintains conversation history for context

### API Endpoints

#### 1. Generate Learning Map

**Development**: `POST /api/perplexity-map` (Vite proxy)
**Production**: `supabase functions invoke generate-map`

**Request:**
```json
{
   "topic": "Machine Learning",
   "level": "intermediate"
}
```

**Response:**
```json
{
   "map": {
      "topic": "Machine Learning",
      "description": "Comprehensive guide to ML...",
      "branches": [
         {
            "id": "branch-1",
            "name": "Supervised Learning",
            "description": "Learn with labeled data",
            "level": "intermediate",
            "nodes": [
               {
                  "id": "node-1",
                  "name": "Linear Regression",
                  "description": "Predict continuous values...",
                  "resources": [
                     {
                        "title": "Scikit-learn Linear Models",
                        "url": "https://scikit-learn.org/stable/modules/linear_model.html",
                        "type": "article"
                     },
                     {
                        "title": "Linear Regression Explained",
                        "url": "https://www.youtube.com/watch?v=7ArmBVF2dCs",
                        "type": "video"
                     }
                  ],
                  "estimatedHours": 8,
                  "prerequisites": ["Python Basics", "Statistics"]
               }
            ]
         }
      ],
      "relatedTopics": ["Deep Learning", "Data Science", "Neural Networks"]
   },
   "meta": {
      "provider": "perplexity",
      "model": "sonar-pro",
      "localProxy": true,
      "linkVerification": {
         "verified": 34,
         "total": 36
      }
   }
}
```

#### 2. Follow-Up Chat

**Development**: `POST /api/perplexity-chat` (Vite proxy)
**Production**: `supabase functions invoke follow-up-chat`

**Request:**
```json
{
   "topic": "Machine Learning",
   "learningMapContext": "{...full map JSON...}",
   "conversationHistory": [
      {
         "role": "user",
         "content": "What are the best prerequisites?"
      },
      {
         "role": "assistant",
         "content": "For Machine Learning, you should start with..."
      }
   ],
   "question": "Can you recommend specific Python libraries?"
}
```

**Response:**
```json
{
   "answer": "For Machine Learning in Python, I recommend:\n\n1. **NumPy** - Essential for numerical computing...",
   "model": "sonar-pro"
}
```

### URL Verification Pipeline

**Quality Assurance Process:**
1. **Normalization**: Convert YouTube shorts to standard format
2. **Format Validation**: Check URL structure (http/https, valid domain)
3. **Homepage Filtering**: Reject generic homepage URLs
4. **Per-Node Deduplication**: Remove duplicates within each node
5. **Accessibility Check**: HEAD/GET request with 5s timeout
6. **Global Deduplication**: Remove duplicates across entire map
7. **Logging**: Track verification rate and duplicate removals

**Verification Configuration:**
```typescript
const verifyConfig = {
   timeout: 5000,        // 5 seconds max per URL
   concurrency: 10,      // 10 parallel requests
   methods: ['HEAD', 'GET'], // Try HEAD first, fallback to GET
   followRedirects: true
};
```

## 📂 Project Structure

```
learning-map-generator/
├── src/
│   ├── components/
│   │   ├── TopicInput.tsx          # Search and level selector
│   │   ├── LearningMap.tsx         # React Flow visualization
│   │   ├── MapNode.tsx             # Custom node component
│   │   ├── NodeDetailModal.tsx     # Detailed node popup
│   │   ├── RelatedTopics.tsx       # Topic suggestions
│   │   ├── FollowUpChat.tsx        # Interactive Q&A chat
│   │   └── ui/                     # Shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx               # Main map generator
│   │   ├── Landing.tsx             # Homepage/landing page
│   │   └── NotFound.tsx            # 404 page
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts           # Supabase client config
│   ├── lib/
│   │   └── utils.ts                # Utility functions
│   ├── hooks/
│   │   └── use-toast.ts            # Toast notifications
│   ├── index.css                   # Design system & animations
│   └── main.tsx                    # Application entry
├── supabase/
│   └── functions/
│       ├── generate-map/
│       │   └── index.ts            # Map generation endpoint
│       └── follow-up-chat/
│           └── index.ts            # Chat endpoint
├── vite.config.ts                  # Vite + proxy middleware
├── tailwind.config.ts              # Tailwind configuration
├── components.json                 # Shadcn/ui config
└── package.json                    # Dependencies
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (`hsl(217 91% 60%)`) - Learning & Intelligence
- **Secondary**: Purple (`hsl(271 76% 53%)`) - Creativity & Innovation  
- **Accent**: Teal (`hsl(174 62% 47%)`) - Growth & Progress
- **Background**: Light gradient with subtle depth

### Gradients
- `gradient-primary`: Blue to Teal (main actions)
- `gradient-secondary`: Purple to Blue (branches)
- `gradient-subtle`: Light background gradient

### Components
All components use semantic tokens from the design system for consistent theming:
- `--primary`: Main brand color
- `--secondary`: Secondary surfaces
- `--accent`: Highlights and focus states
- `--muted`: Subtle backgrounds
- Custom tokens for shadows, transitions, and gradients

## 🔌 API Design

### Endpoint: `/functions/v1/generate-map`

**Request:**
```json
{
  "topic": "Web Development",
  "level": "beginner"
}
```

## 🧠 Approach & Trade-Offs

### Design Goals
1. Generate genuinely useful, current learning paths (not static/hallucinated)
2. Ensure link quality (no broken, duplicate, or generic homepage URLs)
3. Provide a smooth, mobile-friendly user experience
4. Support continued exploration with conversational follow-ups

### Key Architectural Decisions
| Decision | Rationale | Trade-Off |
|----------|-----------|-----------|
| Perplexity Sonar as sole AI provider | Real-time web search + fresher links | Vendor dependency |
| Dual API (proxy in dev + edge in prod) | Faster iteration + secure prod separation | Slight duplication of logic |
| Global URL deduplication Set | Prevents repeated resources across nodes | Removes occasionally relevant cross-links |
| HEAD then GET verification with timeout | Balance speed vs accuracy | Adds generation latency |
| 10K token context window | Better structured, richer maps | Higher token usage cost |
| Low temperature (0.2) for map | Deterministic, structured output | Less creative variety |
| Follow-up chat separate endpoint | Keeps map generation lean | More code paths to maintain |
| CSS-based animation utilities | Lightweight, no runtime overhead | Less granular control vs Framer Motion |

### Performance Considerations
- URL verification runs in parallel (concurrency=10) to minimize total wait time
- Verification only after AI output (no mid-generation overhead)
- Minimal external dependencies to keep bundle small
- Staggered animations for perceived performance

### Failure Handling
- If proxy fails → fallback to Supabase function
- If Supabase returns legacy shape → enrich via proxy when available
- If link verification fails heavily → still returns partial map (best-effort)
- Chat gracefully degrades: proxy → Supabase → user-facing error message

### Potential Enhancements (Future Work)
- Add user auth + saved maps
- Progress tracking + completion badges
- Multi-model strategy (reasoning model for complex paths)
- Caching layer for repeated topics (with freshness window)
- Framer Motion upgrade for fine-grained interactive animations
- Rate limiting + abuse detection on public endpoints

### Known Limitations
- No streaming responses yet (full JSON returned after generation)
- Verification may exclude slower servers that time out at 5s
- Some niche domains may be filtered if not in curated list
- No offline mode / PWA caching yet

### Why Not OpenAI / Gemini?
- Perplexity integrates search inherently – fewer prompt hacks
- Reduced hallucination rate for resource URLs
- Lower overhead: one provider for both generation + research

## ✅ Quick Start Recap
1. Clone repo & install dependencies
2. Add `.env` with PERPLEXITY_API_KEY + Supabase vars
3. Run: `npm run dev`
4. Generate a map: enter topic → select level → Generate
5. Ask follow-ups below the map for deeper insights

## 🙌 Contributions & Feedback
Issues and pull requests are welcome. Ideas for improvement? Open an issue describing the use case.

## 📄 License
MIT License. Use freely with attribution.

---
Built for curious learners. Empowering structured exploration with real-time knowledge.

**Response:**
```json
{
  "topic": "Web Development",
  "description": "Learn to build modern websites...",
  "branches": [
    {
      "id": "branch-1",
      "name": "Frontend Development",
      "description": "Client-side programming",
      "level": "beginner",
      "nodes": [
        {
          "id": "node-1-1",
          "name": "HTML Basics",
          "description": "Structure of web pages...",
          "resources": [
            {
              "title": "MDN HTML Guide",
              "url": "https://developer.mozilla.org/...",
              "type": "article"
            }
          ],
          "estimatedHours": 10,
          "prerequisites": []
        }
      ]
    }
  ],
  "relatedTopics": ["JavaScript", "CSS", "React"]
}
```

## 🤖 LLM Integration

### System Prompt Strategy
The edge function uses a carefully crafted system prompt that:
- Enforces strict JSON structure
- Adapts complexity based on skill level
- Requests 2-3 quality resources per node
- Ensures logical learning progression
- Includes time estimates and prerequisites

### Error Handling
- Rate limiting (429): User-friendly retry message
- Payment required (402): Clear upgrade instructions
- Parse errors: Graceful fallback with error logging
- Network failures: Automatic retry with exponential backoff

### Model Selection
- **Default**: `google/gemini-2.5-flash`
- **Reason**: Balanced speed, cost, and quality
- **Alternatives**: Can upgrade to `gemini-2.5-pro` for complex topics

## 👥 User Flow

```
1. User lands on homepage
   ↓
2. Enters topic (e.g., "Machine Learning")
   ↓
3. Selects skill level (Beginner/Intermediate/Advanced)
   ↓
4. Clicks "Generate Learning Map"
   ↓
5. Loading state displays
   ↓
6. API calls edge function with topic + level
   ↓
7. Edge function calls Lovable AI with structured prompt
   ↓
8. AI returns JSON learning structure
   ↓
9. React Flow renders interactive mind map
   ↓
10. User explores nodes:
    - Hover for quick preview
    - Click for detailed modal
    - Pan/zoom to navigate
    ↓
11. User can:
    - Export as JSON
    - Explore related topics
    - Generate new maps
```

## 🚢 Deployment

### Deploy to Production

1. Push your code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. In Lovable:
   - Click "Publish" in the top right
   - Your app deploys automatically to `<your-project>.lovable.app`

3. Edge functions deploy automatically on every commit

### Environment Variables
All environment variables are managed automatically by Lovable Cloud. For local or self-hosted setups, set these:
- `VITE_SUPABASE_URL`: Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public API key
- `PERPLEXITY_API_KEY`: Perplexity API key for live web search (Edge Function)
- `LOVABLE_API_KEY` (optional fallback): Lovable AI Gateway key used only if Perplexity is not configured

#### Using OpenRouter (Tongyi DeepResearch)

The local dev proxy also supports OpenRouter so you can use Tongyi DeepResearch 30B A3B (free) instead of Perplexity.

Set these in your `.env` and restart `npm run dev`:

```cmd
REM Required for OpenRouter
set OPENROUTER_API_KEY=your_openrouter_key

REM Optional: choose model, defaults to alibaba/tongyi-deepresearch-30b-a3b
set VITE_OPENROUTER_MODEL=alibaba/tongyi-deepresearch-30b-a3b

REM If you also have PERPLEXITY_API_KEY set, the proxy will try OpenRouter first,
REM then fall back to Perplexity if OpenRouter fails.
```

To sanity check your OpenRouter setup:

```cmd
node test-openrouter.js
```

The Edge Function `/generate-map` prefers Perplexity for fresh web search (real URLs and YouTube links). If `PERPLEXITY_API_KEY` is missing but `LOVABLE_API_KEY` is present, it will use the Lovable AI Gateway as a fallback (without live web search).

#### Setting the Perplexity key for the Edge Function (local CLI)

On Windows cmd:

```cmd
supabase functions secrets set PERPLEXITY_API_KEY=your_pplx_key_here --project-ref sbendjlywkgvxfaqcilj
```

Optionally set a fallback (not required when using Perplexity):

```cmd
supabase functions secrets set LOVABLE_API_KEY=your_lovable_key_here --project-ref sbendjlywkgvxfaqcilj
```

Then run the function locally:

```cmd
supabase functions serve generate-map --no-verify-jwt --project-ref sbendjlywkgvxfaqcilj
```

Note: The `.env` at the project root is for the Vite frontend; function secrets must be set in the Edge Function runtime (via Supabase secrets or your hosting provider).

## 📊 Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components load on demand
- **Memoization**: React Flow nodes are memoized to prevent unnecessary re-renders
- **Edge Functions**: Serverless architecture scales automatically
- **Caching**: Browser caches static assets via CDN

### Typical Response Times
- Edge function cold start: ~1-2 seconds
- Edge function warm: ~200-500ms
- AI generation: ~3-5 seconds (varies by complexity)
- Total generation time: ~4-7 seconds

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Built on [Lovable](https://lovable.dev) platform
- Powered by Google Gemini AI
- Icons by [Lucide](https://lucide.dev)
- Graph visualization by [React Flow](https://reactflow.dev)

## 📞 Support

- Documentation: [docs.lovable.dev](https://docs.lovable.dev)
- Community: [Discord](https://discord.gg/lovable)
- Issues: Open a GitHub issue

---

**Made with ❤️ for learners everywhere**
