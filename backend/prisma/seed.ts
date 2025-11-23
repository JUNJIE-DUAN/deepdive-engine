import {
  PrismaClient,
  DataSourceType,
  DataSourceStatus,
  ResourceType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始初始化数据源...");

  // 定义初始数据源
  const initialDataSources = [
    {
      name: "arXiv",
      type: "ARXIV" as DataSourceType,
      category: "PAPER" as ResourceType,
      baseUrl: "https://arxiv.org",
      apiEndpoint: "http://export.arxiv.org/api/query",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "xml",
        queryParams: {
          search_query: "cat:cs.AI OR cat:cs.LG OR cat:cs.CL",
          sortBy: "submittedDate",
          sortOrder: "descending",
        },
      },
      rateLimit: 3,
      categories: ["cs.AI", "cs.LG", "cs.CL", "cs.CV"],
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description:
        "arXiv is a free distribution service and an open-access archive for scholarly articles",
    },
    {
      name: "HackerNews",
      type: "HACKERNEWS" as DataSourceType,
      category: "NEWS" as ResourceType,
      baseUrl: "https://news.ycombinator.com",
      apiEndpoint: "https://hacker-news.firebaseio.com/v0",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        endpoints: {
          topStories: "/topstories.json",
          newStories: "/newstories.json",
          bestStories: "/beststories.json",
          item: "/item/{id}.json",
        },
      },
      rateLimit: 10,
      status: "ACTIVE" as DataSourceStatus,
      description:
        "Social news website focusing on computer science and entrepreneurship",
    },
    {
      name: "Medium",
      type: "MEDIUM" as DataSourceType,
      category: "BLOG" as ResourceType,
      baseUrl: "https://medium.com",
      crawlerType: "SCRAPER",
      crawlerConfig: {
        selectors: {
          title: "h1",
          content: "article section",
          author: "[data-testid='authorName']",
          publishedDate: "time",
        },
        waitForSelector: "article",
      },
      rateLimit: 5,
      keywords: [
        "technology",
        "programming",
        "data-science",
        "machine-learning",
      ],
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Online publishing platform for articles and blog posts",
    },
    {
      name: "GitHub Trending",
      type: "GITHUB" as DataSourceType,
      category: "PROJECT" as ResourceType,
      baseUrl: "https://github.com",
      apiEndpoint: "https://api.github.com",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      },
      rateLimit: 60,
      keywords: ["Python", "TypeScript", "JavaScript", "Go", "Rust"],
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Trending repositories on GitHub",
    },
    {
      name: "PubMed",
      type: "PUBMED" as DataSourceType,
      category: "PAPER" as ResourceType,
      baseUrl: "https://pubmed.ncbi.nlm.nih.gov",
      apiEndpoint: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "xml",
        endpoints: {
          search: "/esearch.fcgi",
          fetch: "/efetch.fcgi",
        },
        params: {
          db: "pubmed",
          retmode: "xml",
        },
      },
      rateLimit: 3,
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Database of biomedical and life sciences literature",
    },
    {
      name: "YouTube",
      type: "YOUTUBE" as DataSourceType,
      category: "YOUTUBE_VIDEO" as ResourceType,
      baseUrl: "https://www.youtube.com",
      apiEndpoint: "https://www.googleapis.com/youtube/v3",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        endpoints: {
          search: "/search",
          videos: "/videos",
        },
      },
      rateLimit: 100,
      categories: ["Science & Technology", "Education"],
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Video-sharing platform with educational content",
    },
    {
      name: "Reddit",
      type: "REDDIT" as DataSourceType,
      category: "NEWS" as ResourceType,
      baseUrl: "https://www.reddit.com",
      apiEndpoint: "https://oauth.reddit.com",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        subreddits: [
          "programming",
          "machinelearning",
          "datascience",
          "technology",
        ],
        endpoints: {
          hot: "/r/{subreddit}/hot.json",
          new: "/r/{subreddit}/new.json",
          top: "/r/{subreddit}/top.json",
        },
      },
      rateLimit: 60,
      keywords: [
        "programming",
        "machine learning",
        "data science",
        "technology",
      ],
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Social news aggregation and discussion website",
    },
    {
      name: "IEEE Xplore",
      type: "IEEE" as DataSourceType,
      category: "PAPER" as ResourceType,
      baseUrl: "https://ieeexplore.ieee.org",
      apiEndpoint: "https://ieeexploreapi.ieee.org/api/v1",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        endpoints: {
          search: "/search/articles",
        },
      },
      rateLimit: 200,
      languages: ["en"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Digital library for IEEE technical literature",
    },
    {
      name: "RSS General",
      type: "RSS" as DataSourceType,
      category: "RSS" as ResourceType,
      baseUrl: "https://",
      crawlerType: "RSS",
      crawlerConfig: {
        parseOptions: {
          customFields: {
            item: ["media:content", "content:encoded"],
          },
        },
      },
      rateLimit: 10,
      languages: ["en", "zh"],
      status: "ACTIVE" as DataSourceStatus,
      description: "Generic RSS feed parser for various sources",
    },
    {
      name: "Twitter/X",
      type: "TWITTER" as DataSourceType,
      category: "NEWS" as ResourceType,
      baseUrl: "https://twitter.com",
      apiEndpoint: "https://api.twitter.com/2",
      crawlerType: "API",
      crawlerConfig: {
        method: "GET",
        responseType: "json",
        endpoints: {
          search: "/tweets/search/recent",
          userTimeline: "/users/{id}/tweets",
        },
      },
      rateLimit: 15,
      keywords: ["AI", "MachineLearning", "DataScience"],
      languages: ["en"],
      status: "PAUSED" as DataSourceStatus,
      description: "Social media platform for real-time updates",
    },
  ];

  // 创建或更新数据源
  for (const source of initialDataSources) {
    try {
      const existing = await prisma.dataSource.findUnique({
        where: { name: source.name },
      });

      if (existing) {
        console.log(`数据源已存在: ${source.name}, 跳过创建`);
        continue;
      }

      await prisma.dataSource.create({
        data: source,
      });
      console.log(`✓ 创建数据源: ${source.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`✗ 创建数据源失败 ${source.name}:`, errorMessage);
    }
  }

  console.log("\n数据源初始化完成！");

  // 输出统计信息
  const stats = await prisma.dataSource.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("\n数据源统计:");
  stats.forEach((stat) => {
    console.log(`  ${stat.status}: ${stat._count} 个`);
  });

  const total = await prisma.dataSource.count();
  console.log(`  总计: ${total} 个数据源`);
}

main()
  .catch((e) => {
    console.error("初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
