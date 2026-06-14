import { EVALUATION_AGENTS } from "@/config/agents";

export type IdealAgentName = (typeof EVALUATION_AGENTS)[number]["name"];

export type IdealSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type IdealAgentContent = {
  summary: string[];
  sections: IdealSection[];
};

export type IdealStartupTrack = {
  id: string;
  title: string;
  tagline: string;
  agents: Record<IdealAgentName, IdealAgentContent>;
};

export const IDEAL_STARTUP_TRACKS: IdealStartupTrack[] = [
  {
    id: "ai-study-companion",
    title: "AI Study Companion",
    tagline: "AI copilot that helps students find and summarize notes from previous years.",
    agents: {
      "YC Partner": {
        summary: [
          "The strongest education startups solve a recurring problem that students experience multiple times per week, ideally daily. A great AI Study Companion should become part of a student's routine rather than a tool used only during exams. The product should demonstrate the ability to improve academic outcomes through faster comprehension, personalized learning, or more effective revision. Strong founder-market fit exists when the team deeply understands the student experience and can identify pain points traditional learning platforms fail to address.",
          "Investors would look for evidence that students return frequently, recommend the platform to peers, and rely on it throughout an academic term. The ideal long-term vision is to become the operating system for student learning rather than a note-summarization tool.",
        ],
        sections: [
          {
            heading: "Green Flags",
            bullets: [
              "Daily active usage",
              "Strong retention beyond exam periods",
              "Viral sharing among students",
              "Measurable academic improvement",
            ],
          },
          {
            heading: "Questions to Answer",
            bullets: [
              "Why won't students use ChatGPT directly?",
              "What proprietary advantage exists?",
              "Can the product expand beyond note summarization?",
            ],
          },
        ],
      },
      "Business CFO": {
        summary: [
          "A healthy business model should generate predictable recurring revenue while maintaining low operating costs. Since AI inference costs can become significant at scale, the company must balance feature richness with profitability. The strongest opportunities include premium subscriptions, university licensing, tutoring partnerships, and institutional adoption.",
          "The platform should demonstrate a path toward high lifetime value through continued engagement across semesters or academic years. Strong financial performance would show low customer acquisition costs and consistent subscription renewals.",
        ],
        sections: [
          {
            heading: "Ideal Metrics",
            bullets: ["CAC under $10–15", "Monthly retention above 70%", "Gross margins above 70%", "Conversion rate above 5%"],
          },
          {
            heading: "Revenue Opportunities",
            bullets: ["Premium study plans", "AI tutoring", "Institutional licenses", "University partnerships"],
          },
        ],
      },
      "Marketing Expert": {
        summary: [
          "The product should target students facing high academic pressure and information overload. Messaging should focus on saving time, improving grades, and reducing stress. The strongest growth channel is peer-to-peer sharing because students naturally exchange notes and resources.",
          "Campus ambassadors, student organizations, and educational influencers can become powerful acquisition channels. Products that generate shareable outputs such as notes, flashcards, summaries, or revision guides often achieve stronger organic growth.",
        ],
        sections: [
          {
            heading: "Ideal ICP",
            bullets: ["University students", "Competitive exam candidates", "STEM majors", "Medical students"],
          },
          {
            heading: "Best Growth Channels",
            bullets: ["Discord communities", "Student WhatsApp groups", "Campus ambassadors", "TikTok educational content"],
          },
        ],
      },
      "Tech Auditor": {
        summary: [
          "The platform should support document ingestion, OCR, semantic search, retrieval-augmented generation, and personalized learning recommendations. The architecture must handle large volumes of educational content while maintaining response quality and low latency.",
          "Technical defensibility should come from personalization and accumulated student data rather than dependence on a single AI model. Features such as adaptive learning, memory systems, and long-term progress tracking create meaningful barriers to competition.",
        ],
        sections: [
          {
            heading: "Core Features",
            bullets: ["PDF ingestion", "Lecture note processing", "AI tutoring", "Flashcard generation", "Revision planning"],
          },
          {
            heading: "Technical Risks",
            bullets: ["Hallucinated educational content", "Copyright concerns", "High AI costs", "Limited differentiation"],
          },
        ],
      },
      "Demand Intel": {
        summary: [
          "Students consistently struggle with information overload, scattered resources, ineffective revision methods, and exam anxiety. Demand is strongest when the product addresses a measurable pain point that directly affects grades or learning outcomes.",
          "The ideal validation signal is repeat usage across multiple subjects and academic terms. Strong willingness to pay exists when the product demonstrably saves time or improves performance.",
        ],
        sections: [
          {
            heading: "Demand Signals",
            bullets: [
              "Students spending hours organizing notes",
              "Demand spikes during exams",
              "Existing use of AI for studying",
              "Frequent requests for summaries and explanations",
            ],
          },
          {
            heading: "Validation Questions",
            bullets: [
              "How many students already use AI for studying?",
              "How often do users return each week?",
              "Do users share outputs with classmates?",
              "Would users pay after the first semester?",
            ],
          },
        ],
      },
    },
  },
  {
    id: "localeats",
    title: "LocalEats",
    tagline: "Hyperlocal food delivery marketplace connecting home cooks with nearby customers.",
    agents: {
      "YC Partner": {
        summary: [
          "The strongest marketplace startups unlock supply that already exists but remains difficult to discover. LocalEats succeeds if it becomes the default platform for discovering authentic neighborhood kitchens, home chefs, and small food businesses that are overlooked by major delivery platforms. The opportunity is not to compete head-on with food delivery giants, but to create a category focused on local, culturally unique, and community-driven food experiences.",
          "A compelling vision would transform LocalEats into the digital infrastructure for neighborhood food economies. The strongest signal is not order volume alone, but the platform's ability to attract unique food providers that customers cannot easily find elsewhere.",
          "Investors would want evidence that both sides of the marketplace are receiving value. Vendors should earn meaningful income, while customers should consistently discover meals unavailable through traditional delivery services.",
        ],
        sections: [
          {
            heading: "Green Flags",
            bullets: [
              "Vendors generating repeat revenue",
              "Customers ordering from the same kitchens repeatedly",
              "Strong community engagement",
              "Unique food supply unavailable elsewhere",
              "Organic referrals from both buyers and sellers",
            ],
          },
          {
            heading: "Questions to Answer",
            bullets: [
              "Why would users choose LocalEats over Swiggy or Zomato?",
              "How defensible is the local supply network?",
              "Can the marketplace scale city by city?",
              "What prevents larger competitors from copying the model?",
            ],
          },
        ],
      },
      "Business CFO": {
        summary: [
          "LocalEats must demonstrate healthy marketplace economics before scaling aggressively. The primary challenge is balancing customer acquisition, vendor onboarding, and operational costs while maintaining positive unit economics.",
          "Revenue can come from transaction commissions, premium vendor subscriptions, promoted listings, delivery partnerships, and sponsored placements. The ideal business model grows revenue without significantly increasing operational complexity.",
          "The strongest financial outcome occurs when customer acquisition becomes largely referral-driven and vendors remain active for extended periods.",
        ],
        sections: [
          {
            heading: "Ideal Metrics",
            bullets: [
              "Customer retention above 40%",
              "Vendor retention above 80%",
              "Average order value increasing monthly",
              "Positive contribution margin per order",
              "CAC lower than first-month customer value",
            ],
          },
          {
            heading: "Revenue Streams",
            bullets: ["Commission on orders", "Vendor subscription plans", "Featured listings", "Delivery partnerships", "Local advertising"],
          },
          {
            heading: "Financial Risks",
            bullets: ["High logistics costs", "Marketplace imbalance", "Low vendor retention", "Excessive discount dependency"],
          },
        ],
      },
      "Marketing Expert": {
        summary: [
          "LocalEats should position itself as a discovery platform for authentic local food rather than another delivery application. Customers should feel they are uncovering hidden gems within their neighborhoods.",
          "The ideal customer profile includes food enthusiasts, young professionals, students, families, and individuals seeking affordable alternatives to restaurant chains. Storytelling should focus on local culture, family recipes, neighborhood favorites, and supporting small businesses.",
          "Content marketing can become a major growth engine because food is naturally visual and shareable.",
        ],
        sections: [
          {
            heading: "Ideal Customer Profiles",
            bullets: ["Food explorers", "Students", "Working professionals", "Families", "Community-focused consumers"],
          },
          {
            heading: "Growth Channels",
            bullets: [
              "Instagram Reels",
              "Food influencers",
              "Local community groups",
              "Referral programs",
              "University campuses",
              "Neighborhood ambassadors",
            ],
          },
          {
            heading: "Messaging Themes",
            bullets: [
              "Discover hidden local kitchens",
              "Support neighborhood businesses",
              "Authentic homemade food",
              "Better food at better prices",
            ],
          },
        ],
      },
      "Tech Auditor": {
        summary: [
          "The platform must support marketplace operations reliably while maintaining a smooth experience for customers and vendors. Core infrastructure should include vendor onboarding, menu management, order processing, payments, delivery coordination, and customer reviews.",
          "The greatest technical challenge lies in logistics. As order volume increases, the platform must efficiently coordinate deliveries, manage real-time updates, and minimize delays.",
          "Long-term differentiation may come from recommendation systems that personalize food discovery based on location, preferences, dietary restrictions, and purchasing history.",
        ],
        sections: [
          {
            heading: "Core Features",
            bullets: [
              "Vendor dashboard",
              "Menu management",
              "Real-time ordering",
              "Payment processing",
              "Delivery tracking",
              "Ratings and reviews",
              "Personalized recommendations",
            ],
          },
          {
            heading: "Technical Risks",
            bullets: ["Delivery failures", "Inventory inaccuracies", "Fraudulent vendors", "Scalability challenges", "Poor location accuracy"],
          },
          {
            heading: "Future Opportunities",
            bullets: [
              "AI-powered food recommendations",
              "Dynamic delivery optimization",
              "Community food discovery feed",
              "Hyperlocal demand forecasting",
            ],
          },
        ],
      },
      "Demand Intel": {
        summary: [
          "Consumers increasingly seek authenticity, affordability, and convenience. While major delivery platforms excel at restaurant aggregation, many customers feel overwhelmed by repetitive options and inflated prices. LocalEats addresses this gap by helping people discover unique neighborhood food providers that would otherwise remain invisible online.",
          "Demand is strongest in dense urban areas where local food culture already exists but lacks digital distribution. Customers are particularly attracted to homemade meals, regional specialties, and niche cuisines unavailable on mainstream platforms.",
          "The willingness to pay increases when users perceive a combination of quality, uniqueness, and convenience.",
        ],
        sections: [
          {
            heading: "Demand Signals",
            bullets: [
              "Growing interest in local businesses",
              "Increasing food delivery adoption",
              "Demand for homemade meals",
              "Rising dissatisfaction with marketplace fees",
              "Search volume for local food recommendations",
            ],
          },
          {
            heading: "Validation Questions",
            bullets: [
              "How often do customers reorder?",
              "Are users discovering new vendors?",
              "Do vendors report increased revenue?",
              "Would customers recommend LocalEats to friends?",
              "Can the platform sustain activity without discounts?",
            ],
          },
          {
            heading: "Indicators of Strong Product-Market Fit",
            bullets: [
              "Frequent repeat orders",
              "Vendor waitlists",
              "Organic customer referrals",
              "High engagement with food discovery features",
              "Consistent marketplace growth across neighborhoods",
            ],
          },
        ],
      },
    },
  },
  {
    id: "codereview-ai",
    title: "CodeReview AI",
    tagline: "AI-powered code review assistant for small engineering teams.",
    agents: {
      "YC Partner": {
        summary: [
          "The best developer tools eliminate friction from workflows that engineers perform every day. CodeReview AI should not simply review code—it should help teams ship faster, reduce production bugs, and improve engineering quality without increasing developer overhead.",
          "The strongest startups in this category become deeply embedded within the software development lifecycle. Rather than being viewed as an optional AI assistant, the platform should become a critical checkpoint before code reaches production. Investors would look for evidence that teams trust the platform enough to rely on its recommendations and that it consistently catches issues humans miss.",
          "A compelling long-term vision is to become the AI engineering partner that understands a company's codebase, coding standards, architecture, and development patterns.",
        ],
        sections: [
          {
            heading: "Green Flags",
            bullets: [
              "Daily usage by engineering teams",
              "Integration into existing development workflows",
              "Reduced review turnaround time",
              "Increased deployment frequency",
              "Measurable reduction in production bugs",
            ],
          },
          {
            heading: "Questions to Answer",
            bullets: [
              "Why is this better than GitHub Copilot?",
              "Why won't teams just use ChatGPT?",
              "Does performance improve as it learns the codebase?",
              "Can it become indispensable to engineering teams?",
            ],
          },
        ],
      },
      "Business CFO": {
        summary: [
          "Developer tools often enjoy some of the highest retention rates in SaaS because once integrated into workflows, switching becomes costly. CodeReview AI should focus on creating strong operational dependency through integrations, historical learning, and workflow automation.",
          "Revenue should primarily come from team subscriptions and enterprise contracts. The ideal customer is not individual developers but engineering organizations willing to pay to reduce engineering costs and release software more confidently.",
          "The strongest financial outcome occurs when the platform saves more engineering hours than it costs.",
        ],
        sections: [
          {
            heading: "Ideal Metrics",
            bullets: [
              "Monthly retention above 90%",
              "Daily active developers above 60%",
              "Team expansion revenue",
              "Gross margins above 80%",
              "Positive ROI within first month",
            ],
          },
          {
            heading: "Revenue Streams",
            bullets: ["Developer subscriptions", "Team plans", "Enterprise contracts", "Security audit packages", "Compliance reporting"],
          },
          {
            heading: "Financial Risks",
            bullets: ["High inference costs", "Dependence on third-party models", "Long enterprise sales cycles", "Open-source competition"],
          },
        ],
      },
      "Marketing Expert": {
        summary: [
          "The ideal customer profile includes engineering managers, CTOs, startup founders, and software development teams. Messaging should focus on faster releases, fewer bugs, improved code quality, and reduced review bottlenecks.",
          "Developers are skeptical buyers, so traditional marketing often performs poorly. Product-led growth, open-source contributions, technical content, and engineering communities are significantly more effective.",
          "The strongest adoption loops occur when developers share AI-generated reviews within pull requests and teams experience noticeable productivity gains.",
        ],
        sections: [
          {
            heading: "Ideal Customer Profiles",
            bullets: [
              "Startups with small engineering teams",
              "Scaling SaaS companies",
              "Engineering managers",
              "CTOs",
              "Enterprise development teams",
            ],
          },
          {
            heading: "Growth Channels",
            bullets: ["GitHub Marketplace", "Hacker News", "Reddit", "Dev.to", "LinkedIn Engineering Communities", "Open-source projects"],
          },
          {
            heading: "Messaging Themes",
            bullets: ["Ship faster", "Catch bugs before production", "Reduce review bottlenecks", "Improve code quality automatically"],
          },
        ],
      },
      "Tech Auditor": {
        summary: [
          "The platform must analyze source code, understand project context, detect risks, and generate meaningful recommendations. A successful implementation requires more than calling an LLM; it must understand architecture, dependencies, coding standards, and project-specific conventions.",
          "The strongest technical moat comes from repository awareness. Generic AI models can review isolated code snippets, but understanding an entire codebase creates substantially more value.",
          "The system should identify security vulnerabilities, performance bottlenecks, maintainability concerns, architectural inconsistencies, and testing gaps before code reaches production.",
        ],
        sections: [
          {
            heading: "Core Features",
            bullets: [
              "Pull request reviews",
              "Security vulnerability detection",
              "Code quality scoring",
              "Architecture analysis",
              "Performance optimization suggestions",
              "Test coverage recommendations",
              "Repository-wide context awareness",
            ],
          },
          {
            heading: "Technical Risks",
            bullets: ["False positives", "Hallucinated recommendations", "Large repository complexity", "High processing costs", "Context window limitations"],
          },
          {
            heading: "Future Opportunities",
            bullets: [
              "Autonomous code fixes",
              "CI/CD integration",
              "Architecture monitoring",
              "Technical debt tracking",
              "AI-powered engineering analytics",
            ],
          },
        ],
      },
      "Demand Intel": {
        summary: [
          "Software teams face increasing pressure to release features faster without sacrificing quality. Traditional code review processes are often slow, inconsistent, and dependent on senior engineers who already face significant workload pressures.",
          "Demand is strongest among rapidly growing teams where engineering velocity directly impacts business outcomes. Companies are increasingly willing to adopt AI tools that improve productivity, provided they maintain trust and reliability.",
          "The willingness to pay increases significantly when the platform demonstrates measurable improvements in release quality and engineering efficiency.",
        ],
        sections: [
          {
            heading: "Demand Signals",
            bullets: [
              "Growing adoption of AI developer tools",
              "Rising software complexity",
              "Engineering talent shortages",
              "Increasing security requirements",
              "Faster product release expectations",
            ],
          },
          {
            heading: "Validation Questions",
            bullets: [
              "Does it reduce review time?",
              "Does it catch issues humans miss?",
              "Do developers trust the recommendations?",
              "Are teams using it daily?",
              "Does it improve deployment confidence?",
            ],
          },
          {
            heading: "Indicators of Strong Product-Market Fit",
            bullets: [
              "Teams making reviews mandatory",
              "Increased deployment frequency",
              "Reduced bug reports",
              "High daily active usage",
              "Expansion from individual developers to entire organizations",
            ],
          },
        ],
      },
    },
  },
  {
    id: "fintrack",
    title: "FinTrack",
    tagline: "Personal finance app for freelancers that automates tax set-asides and cash-flow forecasting.",
    agents: {
      "YC Partner": {
        summary: [
          "The strongest fintech startups become systems of record. FinTrack should aim to become the financial operating system for freelancers, creators, consultants, and independent professionals who currently manage their finances through spreadsheets, banking apps, invoices, and manual bookkeeping.",
          "The opportunity is not simply helping users track expenses—it is reducing financial uncertainty. Freelancers often know how much they earned last month, but not how much they can safely spend next month. FinTrack should provide clarity around cash flow, taxes, savings, profitability, and long-term financial health.",
          "A compelling vision would transform FinTrack into the \"CFO for the self-employed.\" Instead of merely displaying numbers, the platform should actively help users make better financial decisions.",
        ],
        sections: [
          {
            heading: "Green Flags",
            bullets: [
              "Users connect all financial accounts",
              "Weekly or daily engagement",
              "High retention after tax season",
              "Growing financial data stored on platform",
              "Users making decisions based on FinTrack recommendations",
            ],
          },
          {
            heading: "Questions to Answer",
            bullets: [
              "Why is this better than Excel?",
              "Why won't users rely on traditional banking apps?",
              "Can the platform become a freelancer's financial hub?",
              "What makes switching away difficult?",
            ],
          },
          {
            heading: "Long-Term Vision",
            body: "Become the financial intelligence layer for independent workers, helping them earn more, save more, and plan confidently.",
          },
        ],
      },
      "Business CFO": {
        summary: [
          "FinTrack should generate recurring revenue while maximizing retention through increasing financial dependency. The more financial history users accumulate, the more valuable the platform becomes.",
          "Revenue opportunities extend beyond subscriptions. Financial products such as tax services, bookkeeping, insurance, lending, investment products, and banking partnerships can significantly increase lifetime value.",
          "The strongest businesses in fintech create trust, consistency, and recurring engagement around financial decision-making.",
        ],
        sections: [
          {
            heading: "Ideal Metrics",
            bullets: [
              "Monthly retention above 85%",
              "CAC below $50",
              "Subscription conversion above 8%",
              "Gross margins above 75%",
              "Lifetime value at least 5x acquisition cost",
            ],
          },
          {
            heading: "Revenue Streams",
            bullets: [
              "Monthly subscriptions",
              "Premium analytics",
              "Tax filing services",
              "Financial product referrals",
              "Business banking partnerships",
              "Invoice financing",
            ],
          },
          {
            heading: "Financial Risks",
            bullets: ["High compliance costs", "Low willingness to pay", "Regulatory changes", "Banking integration dependencies"],
          },
          {
            heading: "Key Business Objective",
            body: "Increase the amount of financial activity managed through FinTrack rather than merely increasing user count.",
          },
        ],
      },
      "Marketing Expert": {
        summary: [
          "The ideal customer profile includes freelancers, consultants, creators, agency owners, and independent contractors. These users frequently experience irregular income, financial stress, and difficulty planning future expenses.",
          "Marketing should focus on peace of mind rather than accounting. Most freelancers do not want bookkeeping software—they want confidence that they are financially secure.",
          "The strongest messaging highlights visibility, control, and predictability.",
        ],
        sections: [
          {
            heading: "Ideal Customer Profiles",
            bullets: ["Freelancers", "Content creators", "Consultants", "Designers", "Developers", "Agency owners"],
          },
          {
            heading: "Growth Channels",
            bullets: ["LinkedIn", "Creator communities", "Upwork freelancers", "Fiverr sellers", "YouTube creators", "Freelance newsletters"],
          },
          {
            heading: "Messaging Themes",
            bullets: [
              "Know where your money goes",
              "Stop living invoice to invoice",
              "Financial clarity for freelancers",
              "Your personal AI CFO",
              "Plan your next month with confidence",
            ],
          },
          {
            heading: "Viral Loops",
            bullets: ["Shareable financial health reports", "Tax savings insights", "Income growth tracking", "Financial milestone achievements"],
          },
        ],
      },
      "Tech Auditor": {
        summary: [
          "The platform must aggregate financial information from multiple sources while maintaining high levels of security, accuracy, and reliability. Financial data is highly sensitive, making trust and compliance critical.",
          "The core value comes from transforming raw financial transactions into actionable insights. The platform should automatically categorize expenses, forecast future cash flow, estimate tax obligations, and detect unusual spending patterns.",
          "The strongest technical moat comes from historical financial intelligence and personalized forecasting models.",
        ],
        sections: [
          {
            heading: "Core Features",
            bullets: [
              "Bank account integration",
              "Expense categorization",
              "Invoice tracking",
              "Cash-flow forecasting",
              "Tax estimation",
              "Income analytics",
              "Financial health scoring",
            ],
          },
          {
            heading: "Technical Risks",
            bullets: ["Data security breaches", "Banking API failures", "Incorrect forecasting", "Poor categorization accuracy", "Compliance requirements"],
          },
          {
            heading: "Future Opportunities",
            bullets: [
              "AI financial advisor",
              "Automated tax filing",
              "Investment recommendations",
              "Smart budgeting",
              "Predictive cash-flow management",
            ],
          },
          {
            heading: "Technical Differentiator",
            body: "Use AI not only to track finances but to explain financial decisions and proactively recommend actions before problems occur.",
          },
        ],
      },
      "Demand Intel": {
        summary: [
          "Independent professionals face significant financial uncertainty. Unlike salaried employees, they often experience irregular income, delayed payments, inconsistent workloads, and unexpected expenses.",
          "Many freelancers currently manage finances using spreadsheets or generic banking apps that fail to provide meaningful financial guidance. The pain point is not a lack of data—it is a lack of actionable financial intelligence.",
          "Demand increases as freelancers earn more money and financial management becomes more complex.",
        ],
        sections: [
          {
            heading: "Demand Signals",
            bullets: [
              "Growth of the gig economy",
              "Increasing freelance workforce",
              "Rising creator economy participation",
              "Frequent discussions about taxes and budgeting",
              "Heavy spreadsheet usage among freelancers",
            ],
          },
          {
            heading: "Validation Questions",
            bullets: [
              "How often do users check their finances?",
              "Do forecasts influence spending decisions?",
              "Would users pay to reduce financial stress?",
              "Are users replacing existing tools?",
              "Does engagement increase over time?",
            ],
          },
          {
            heading: "Indicators of Strong Product-Market Fit",
            bullets: [
              "Users connecting multiple financial accounts",
              "Weekly platform engagement",
              "High subscription conversion",
              "Reduced churn after onboarding",
              "Referrals from existing customers",
            ],
          },
          {
            heading: "Evidence of Strong Demand",
            body: "If users begin relying on FinTrack before making financial decisions—whether hiring, investing, spending, or saving—the product has moved beyond expense tracking and become a critical financial decision-making tool.",
          },
        ],
      },
    },
  },
];

export const IDEAL_AGENT_NAMES = EVALUATION_AGENTS.map((a) => a.name);

const TEMPLATE_TITLE_TO_TRACK: Record<string, string> = {
  "AI Study Companion": "ai-study-companion",
  FinTrack: "fintrack",
  LocalEats: "localeats",
  "CodeReview AI": "codereview-ai",
};

export function resolveIdealTrackId(track?: string, template?: string): string {
  if (track && IDEAL_STARTUP_TRACKS.some((t) => t.id === track)) return track;
  if (template && TEMPLATE_TITLE_TO_TRACK[template]) return TEMPLATE_TITLE_TO_TRACK[template];
  return IDEAL_STARTUP_TRACKS[0].id;
}

export function getIdealTrack(trackId: string): IdealStartupTrack {
  return IDEAL_STARTUP_TRACKS.find((t) => t.id === trackId) ?? IDEAL_STARTUP_TRACKS[0];
}
