/**
 * 批量导入数据源到Railway云端数据库
 * 使用API端点批量创建数据源
 */

import axios from "axios";

// Railway生产环境API地址
const RAILWAY_API_URL =
  process.env.RAILWAY_API_URL ||
  "https://backend-production-8638.up.railway.app";

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
    rateLimit: 3,
    keywords: ["AI", "machine learning", "deep learning", "neural networks"],
    categories: ["cs.AI", "cs.LG", "cs.CL", "cs.CV"],
    minQualityScore: 7.0,
    status: "ACTIVE" as const,
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
  },
  {
    name: "Hugging Face Blog",
    description: "Latest updates on AI models and transformers",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://huggingface.co",
    apiEndpoint: "/blog/feed.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://huggingface.co/blog/feed.xml",
    },
    rateLimit: 60,
    keywords: ["Hugging Face", "transformers", "diffusers", "open source AI"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "AWS Machine Learning Blog",
    description: "Machine learning insights from AWS",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://aws.amazon.com",
    apiEndpoint: "/blogs/machine-learning/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://aws.amazon.com/blogs/machine-learning/feed/",
    },
    rateLimit: 60,
    keywords: ["AWS", "SageMaker", "cloud ML"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },
  {
    name: "NVIDIA AI Blog",
    description: "AI and GPU computing from NVIDIA",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://blogs.nvidia.com",
    apiEndpoint: "/blog/category/deep-learning/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://blogs.nvidia.com/blog/category/deep-learning/feed/",
    },
    rateLimit: 60,
    keywords: ["NVIDIA", "GPU", "deep learning", "CUDA"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Stability AI Blog",
    description: "Generative AI and Stable Diffusion updates",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://stability.ai",
    apiEndpoint: "/blog/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://stability.ai/blog/rss.xml",
    },
    rateLimit: 60,
    keywords: ["Stability AI", "Stable Diffusion", "generative AI"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Cohere AI Blog",
    description: "Enterprise AI and LLM insights from Cohere",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://cohere.com",
    apiEndpoint: "/blog/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://cohere.com/blog/rss.xml",
    },
    rateLimit: 60,
    keywords: ["Cohere", "enterprise AI", "LLM"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Mistral AI Blog",
    description: "Open-source LLMs and AI research from Mistral",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://mistral.ai",
    apiEndpoint: "/news/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://mistral.ai/news/rss.xml",
    },
    rateLimit: 60,
    keywords: ["Mistral", "open source LLM", "AI research"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "AI at Meta Engineering",
    description: "Engineering blog from Meta's AI team",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://ai.meta.com",
    apiEndpoint: "/blog/rss/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://ai.meta.com/blog/rss/",
    },
    rateLimit: 60,
    keywords: ["Meta AI", "research", "LLaMA", "PyTorch"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "OpenAI Research Index",
    description: "OpenAI research publications and papers",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://openai.com",
    apiEndpoint: "/research/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://openai.com/research/rss.xml",
    },
    rateLimit: 60,
    keywords: ["OpenAI research", "GPT", "reinforcement learning"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Databricks Blog",
    description: "Data and AI platform insights from Databricks",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://www.databricks.com",
    apiEndpoint: "/blog/feed",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.databricks.com/blog/feed",
    },
    rateLimit: 60,
    keywords: ["Databricks", "data engineering", "MLOps"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },
  {
    name: "Towards Data Science",
    description: "Medium publication on data science and ML",
    type: "RSS" as const,
    category: "BLOG" as const,
    baseUrl: "https://towardsdatascience.com",
    apiEndpoint: "/feed",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://towardsdatascience.com/feed",
    },
    rateLimit: 30,
    keywords: ["data science", "machine learning", "tutorials"],
    minQualityScore: 7.0,
    status: "ACTIVE" as const,
  },

  // ============ NEWS (行业新闻) ============
  {
    name: "The Verge AI",
    description: "AI and technology news from The Verge",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://www.theverge.com",
    apiEndpoint: "/rss/ai-artificial-intelligence/index.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    },
    rateLimit: 30,
    keywords: ["AI news", "technology", "consumer tech"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },
  {
    name: "Ars Technica",
    description: "Technology news and analysis",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://arstechnica.com",
    apiEndpoint: "/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://arstechnica.com/feed/",
    },
    rateLimit: 30,
    keywords: ["technology", "science", "policy"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },
  {
    name: "VentureBeat AI",
    description: "AI and ML news from VentureBeat",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://venturebeat.com",
    apiEndpoint: "/category/ai/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://venturebeat.com/category/ai/feed/",
    },
    rateLimit: 30,
    keywords: ["AI", "enterprise", "business"],
    minQualityScore: 7.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Wired AI",
    description: "Wired's coverage of artificial intelligence",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://www.wired.com",
    apiEndpoint: "/feed/tag/ai/latest/rss",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.wired.com/feed/tag/ai/latest/rss",
    },
    rateLimit: 30,
    keywords: ["AI", "technology", "culture"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "AI News (Artificial Intelligence News)",
    description: "Dedicated AI news aggregator",
    type: "RSS" as const,
    category: "NEWS" as const,
    baseUrl: "https://www.artificialintelligence-news.com",
    apiEndpoint: "/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.artificialintelligence-news.com/feed/",
    },
    rateLimit: 30,
    keywords: ["AI news", "industry updates"],
    minQualityScore: 6.5,
    status: "ACTIVE" as const,
  },
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
  },

  // ============ REPORT (研究报告) ============
  {
    name: "Stanford AI Lab",
    description: "Stanford Artificial Intelligence Laboratory publications",
    type: "RSS" as const,
    category: "REPORT" as const,
    baseUrl: "https://ai.stanford.edu",
    apiEndpoint: "/blog/feed.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://ai.stanford.edu/blog/feed.xml",
    },
    rateLimit: 60,
    keywords: ["Stanford", "AI research", "academia"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "MIT CSAIL",
    description: "MIT Computer Science and AI Laboratory",
    type: "RSS" as const,
    category: "REPORT" as const,
    baseUrl: "https://www.csail.mit.edu",
    apiEndpoint: "/news/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.csail.mit.edu/news/rss.xml",
    },
    rateLimit: 60,
    keywords: ["MIT", "CS", "AI research"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Berkeley AI Research",
    description: "UC Berkeley AI Research Lab",
    type: "RSS" as const,
    category: "REPORT" as const,
    baseUrl: "https://bair.berkeley.edu",
    apiEndpoint: "/blog/feed.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://bair.berkeley.edu/blog/feed.xml",
    },
    rateLimit: 60,
    keywords: ["Berkeley", "BAIR", "robotics", "AI"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Allen Institute for AI",
    description: "AI2 research and publications",
    type: "RSS" as const,
    category: "REPORT" as const,
    baseUrl: "https://allenai.org",
    apiEndpoint: "/blog/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://allenai.org/blog/rss.xml",
    },
    rateLimit: 60,
    keywords: ["AI2", "NLP", "common sense AI"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },

  // ============ YOUTUBE (视频教程) ============
  {
    name: "Two Minute Papers",
    description: "AI research paper summaries and explanations",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    },
    rateLimit: 60,
    keywords: ["AI research", "paper reviews", "tutorials"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Yannic Kilcher",
    description: "Deep learning and AI research paper explanations",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew",
    },
    rateLimit: 60,
    keywords: ["deep learning", "research", "paper reviews"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "Andrej Karpathy",
    description: "AI and neural networks from Tesla's former AI director",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCPk8m_r6fkUSYmvgCBwq-sw",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCPk8m_r6fkUSYmvgCBwq-sw",
    },
    rateLimit: 60,
    keywords: ["neural networks", "deep learning", "tutorials"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "Lex Fridman Podcast",
    description: "AI conversations with leading researchers",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    },
    rateLimit: 60,
    keywords: ["AI podcast", "interviews", "research"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "3Blue1Brown",
    description: "Mathematical visualization and AI concepts",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw",
    },
    rateLimit: 60,
    keywords: ["math", "neural networks", "visualization"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "sentdex",
    description: "Python and machine learning tutorials",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCfzlCWGWYyIQ0aLC5w48gBQ",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCfzlCWGWYyIQ0aLC5w48gBQ",
    },
    rateLimit: 60,
    keywords: ["Python", "ML tutorials", "practical AI"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },
  {
    name: "AI Explained",
    description: "Latest AI developments and model comparisons",
    type: "RSS" as const,
    category: "YOUTUBE_VIDEO" as const,
    baseUrl: "https://www.youtube.com",
    apiEndpoint: "/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw",
    },
    rateLimit: 60,
    keywords: ["AI news", "model analysis", "benchmarks"],
    minQualityScore: 7.5,
    status: "ACTIVE" as const,
  },

  // ============ POLICY (美国科技政策) ============
  {
    name: "FTC Technology Blog",
    description: "Federal Trade Commission technology and AI blog",
    type: "RSS" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.ftc.gov",
    apiEndpoint: "/news-events/blogs/business-blog/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.ftc.gov/news-events/blogs/business-blog/rss.xml",
    },
    rateLimit: 180,
    keywords: ["FTC", "consumer protection", "AI regulation", "privacy"],
    minQualityScore: 8.0,
    status: "ACTIVE" as const,
  },
  {
    name: "NIST News",
    description: "National Institute of Standards and Technology news feed",
    type: "RSS" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.nist.gov",
    apiEndpoint: "/news-events/news.rss",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.nist.gov/news-events/news.rss",
    },
    rateLimit: 180,
    keywords: ["NIST", "AI standards", "AI safety", "AI framework"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "US AI Safety Institute",
    description: "US AI Safety Institute updates and guidelines",
    type: "RSS" as const,
    category: "POLICY" as const,
    baseUrl: "https://www.nist.gov",
    apiEndpoint: "/aisi/rss.xml",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://www.nist.gov/aisi/rss.xml",
    },
    rateLimit: 180,
    keywords: ["AI safety", "AISI", "AI governance", "standards"],
    minQualityScore: 9.0,
    status: "ACTIVE" as const,
  },
  {
    name: "AI.gov",
    description: "Official US government AI initiatives and policy",
    type: "RSS" as const,
    category: "POLICY" as const,
    baseUrl: "https://ai.gov",
    apiEndpoint: "/feed/",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://ai.gov/feed/",
    },
    rateLimit: 180,
    keywords: ["US AI policy", "government AI", "AI strategy"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
  {
    name: "EU AI Act Updates",
    description: "European Commission AI Act and regulatory updates",
    type: "RSS" as const,
    category: "POLICY" as const,
    baseUrl: "https://digital-strategy.ec.europa.eu",
    apiEndpoint: "/en/news-events/feed",
    crawlerType: "RSS",
    crawlerConfig: {
      rssUrl: "https://digital-strategy.ec.europa.eu/en/news-events/feed",
    },
    rateLimit: 180,
    keywords: ["EU AI Act", "European regulation", "AI governance"],
    minQualityScore: 8.5,
    status: "ACTIVE" as const,
  },
];

async function importDataSources() {
  console.log("🚀 开始批量导入数据源到Railway云端...\n");
  console.log(`目标API: ${RAILWAY_API_URL}`);
  console.log(`数据源总数: ${predefinedDataSources.length}\n`);

  try {
    const response = await axios.post(
      `${RAILWAY_API_URL}/api/v1/data-collection/sources/bulk`,
      predefinedDataSources,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000, // 2分钟超时
      },
    );

    if (response.data.success) {
      const { created, skipped, failed, errors } = response.data.data;

      console.log("\n✅ 批量导入完成!");
      console.log(`\n📊 统计摘要:`);
      console.log(`   ✅ 成功创建: ${created}`);
      console.log(`   ⏭️  已跳过: ${skipped}`);
      console.log(`   ❌ 失败: ${failed}`);

      if (errors && errors.length > 0) {
        console.log(`\n❌ 错误详情:`);
        errors.forEach((error: any) => {
          console.log(`   - ${error.name}: ${error.error}`);
        });
      }

      console.log("\n🎉 数据源已成功导入到Railway云端数据库!");
    } else {
      console.error("❌ 导入失败:", response.data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("\n❌ 批量导入时发生错误:");
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("请求未收到响应:", error.message);
    } else {
      console.error("错误:", error.message);
    }
    process.exit(1);
  }
}

// 运行导入
importDataSources();
