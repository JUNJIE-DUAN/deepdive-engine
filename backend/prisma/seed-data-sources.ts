import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const predefinedDataSources = [
  // ============ PAPER (论文) ============
  {
    name: "arXiv",
    description:
      "arXiv is a free distribution service and an open-access archive for scholarly articles",
    type: "ARXIV" as const,
    category: "PAPER" as const,
    baseUrl: "http://export.arxiv.org",
    apiEndpoint: "/api/query",
    crawlerType: "API",
    crawlerConfig: {
      searchParams: "search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL",
      sortBy: "submittedDate",
      sortOrder: "descending",
    },
    rateLimit: 3, // 3 seconds between requests
    keywords: ["AI", "machine learning", "deep learning", "neural networks"],
    categories: ["cs.AI", "cs.LG", "cs.CL", "cs.CV"],
    minQualityScore: 7.0,
    status: "ACTIVE" as const,
    isVerified: true,
  },
  {
    name: "Semantic Scholar",
    description: "AI-powered research tool for scientific literature",
    type: "CUSTOM" as const,
    category: "PAPER" as const,
    baseUrl: "https://api.semanticscholar.org",
    apiEndpoint: "/graph/v1/paper/search",
    crawlerType: "API",
    crawlerConfig: {
      fields: "paperId,title,abstract,authors,year,citationCount,url",
      query: "artificial intelligence OR machine learning",
    },
    rateLimit: 5,
    keywords: ["AI", "ML", "NLP", "computer vision"],
    minQualityScore: 8.0,
    status: "PAUSED" as const,
    isVerified: false,
  },
  {
    name: "Papers with Code",
    description: "Papers with code implementations and benchmarks",
    type: "CUSTOM" as const,
    category: "PAPER" as const,
    baseUrl: "https://paperswithcode.com",
    apiEndpoint: "/api/v1/papers",
    crawlerType: "API",
    crawlerConfig: {
      ordering: "-stars",
    },
    rateLimit: 10,
    keywords: ["deep learning", "benchmarks", "state-of-the-art"],
    minQualityScore: 7.5,
    status: "PAUSED" as const,
    isVerified: false,
  },

  // ============ BLOG (企业博客) ============
  {
    name: "Google AI Blog",
    description: "The latest news from Google AI",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://blog.google",
    apiEndpoint: "/technology/ai/rss/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://blog.google/technology/ai/rss/",
    },
    rateLimit: 60,
    keywords: ["Google AI", "Gemini", "Google Research"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
    isVerified: true,
  },
  {
    name: "OpenAI Blog",
    description: "Research and updates from OpenAI",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://openai.com",
    apiEndpoint: "/news/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://openai.com/news/rss.xml",
    },
    rateLimit: 60,
    keywords: ["OpenAI", "GPT", "ChatGPT", "DALL-E"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
    isVerified: true,
  },
  {
    name: "Meta AI Blog",
    description: "AI research and innovations from Meta",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://engineering.fb.com",
    apiEndpoint: "/feed",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://engineering.fb.com/feed/",
    },
    rateLimit: 60,
    keywords: ["Meta AI", "LLaMA", "PyTorch"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
    isVerified: true,
  },
  {
    name: "DeepMind Blog",
    description: "Latest research from Google DeepMind",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://blog.google",
    apiEndpoint: "/technology/google-deepmind/rss/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://blog.google/technology/google-deepmind/rss/",
    },
    rateLimit: 60,
    keywords: ["DeepMind", "AlphaFold", "Gemini"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
    isVerified: true,
  },
  {
    name: "Anthropic Blog",
    description: "AI safety and research from Anthropic (Community RSS)",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://raw.githubusercontent.com",
    apiEndpoint:
      "/Olshansk/rss-feeds/refs/heads/main/feeds/feed_anthropic_news.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://raw.githubusercontent.com/Olshansk/rss-feeds/refs/heads/main/feeds/feed_anthropic_news.xml",
    },
    rateLimit: 60,
    keywords: ["Anthropic", "Claude", "AI safety"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
    isVerified: false,
  },
  {
    name: "Microsoft AI Blog",
    description: "AI innovations from Microsoft",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://blogs.microsoft.com",
    apiEndpoint: "/ai/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://blogs.microsoft.com/ai/feed/",
    },
    rateLimit: 60,
    keywords: ["Microsoft AI", "Azure AI", "Copilot"],
    minQualityScore: 8.0,
    status: "PAUSED" as const,
    isVerified: false,
  },

  // ============ NEWS (行业新闻) ============
  {
    name: "TechCrunch AI",
    description: "AI news from TechCrunch",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://techcrunch.com",
    apiEndpoint: "/category/artificial-intelligence/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    },
    rateLimit: 30,
    keywords: ["AI news", "startups", "funding"],
    minQualityScore: 7.0,
    status: "PAUSED" as const,
    isVerified: false,
  },
  {
    name: "MIT Technology Review AI",
    description: "AI coverage from MIT Technology Review",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://www.technologyreview.com",
    apiEndpoint: "/topic/artificial-intelligence/feed",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    },
    rateLimit: 30,
    keywords: ["AI research", "technology", "innovation"],
    minQualityScore: 8.0,
    status: "PAUSED" as const,
    isVerified: false,
  },

  // ============ HACKERNEWS ============
  {
    name: "HackerNews",
    description: "Hacker News top stories",
    type: "HACKERNEWS" as const,
    category: "NEWS" as const,
    baseUrl: "https://news.ycombinator.com",
    apiEndpoint: "/topstories",
    crawlerType: "API",
    crawlerConfig: {
      storyType: "top",
      maxItems: 30,
    },
    rateLimit: 10,
    keywords: ["technology", "startups", "programming"],
    minQualityScore: 6.5,
    status: "ACTIVE" as const,
    isVerified: true,
  },

  // ============ REPORT (研究报告) ============
  {
    name: "OpenAI Research",
    description: "Research publications from OpenAI",
    type: "CUSTOM" as const,
    category: "REPORT" as const,
    baseUrl: "https://openai.com",
    apiEndpoint: "/research",
    crawlerType: "WEB_SCRAPER",
    crawlerConfig: {
      selector: ".research-item",
    },
    rateLimit: 60,
    keywords: ["research", "technical reports"],
    minQualityScore: 9.0,
    status: "PAUSED" as const,
    isVerified: false,
  },
  {
    name: "Google AI Research",
    description: "Research publications from Google AI",
    type: "CUSTOM" as const,
    category: "REPORT" as const,
    baseUrl: "https://ai.google",
    apiEndpoint: "/research/pubs",
    crawlerType: "WEB_SCRAPER",
    crawlerConfig: {
      selector: ".publication",
    },
    rateLimit: 60,
    keywords: ["Google research", "publications"],
    minQualityScore: 9.0,
    status: "PAUSED" as const,
    isVerified: false,
  },

  // ============ POLICY (美国科技政策) ============
  // 注意：政府网站通常有反爬虫保护，需要特殊配置
  {
    name: "White House OSTP",
    description:
      "Office of Science and Technology Policy - ⚠️ Requires special scraping configuration (anti-bot protection)",
    type: "CUSTOM" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.whitehouse.gov",
    apiEndpoint: "/ostp/news/",
    crawlerType: "WEB_SCRAPER",
    crawlerConfig: {
      selector: "article, .post",
      note: "Government site with bot protection - may require proxy or browser automation",
    },
    rateLimit: 180,
    keywords: [
      "science policy",
      "technology policy",
      "AI policy",
      "White House",
    ],
    minQualityScore: 8.5,
    status: "PAUSED" as const,
    isVerified: false,
  },
  {
    name: "FTC Technology",
    description:
      "Federal Trade Commission - ⚠️ Requires special scraping configuration (anti-bot protection)",
    type: "CUSTOM" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.ftc.gov",
    apiEndpoint: "/news-events/news",
    crawlerType: "WEB_SCRAPER",
    crawlerConfig: {
      selector: ".press-release, article",
      note: "Government site with bot protection - consider using official RSS at /stay-connected/rss",
    },
    rateLimit: 180,
    keywords: ["FTC", "consumer protection", "AI regulation", "privacy"],
    minQualityScore: 8.0,
    status: "PAUSED" as const,
    isVerified: false,
  },
  {
    name: "NIST AI",
    description:
      "National Institute of Standards and Technology AI initiatives - ⚠️ Paused pending proper configuration",
    type: "CUSTOM" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.nist.gov",
    apiEndpoint: "/artificial-intelligence",
    crawlerType: "WEB_SCRAPER",
    crawlerConfig: {
      selector: ".resource, article",
    },
    rateLimit: 180,
    keywords: ["NIST", "AI standards", "AI safety", "AI framework"],
    minQualityScore: 8.5,
    status: "PAUSED" as const,
    isVerified: false,
  },
];

async function seedDataSources() {
  console.log("🌱 Starting data sources seed...");

  let created = 0;
  let skipped = 0;

  for (const source of predefinedDataSources) {
    try {
      // Check if source already exists
      const existing = await prisma.dataSource.findFirst({
        where: {
          name: source.name,
          category: source.category,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${source.name} - already exists`);
        skipped++;
        continue;
      }

      await prisma.dataSource.create({
        data: {
          ...source,
          deduplicationConfig: {
            checkUrl: true,
            checkTitle: true,
            titleSimilarityThreshold: 0.85,
          },
        },
      });

      console.log(`✅ Created: ${source.name} (${source.category})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${source.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${predefinedDataSources.length}`);
}

seedDataSources()
  .catch((e) => {
    console.error("Error seeding data sources:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
