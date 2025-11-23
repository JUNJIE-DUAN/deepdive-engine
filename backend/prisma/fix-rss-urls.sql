-- 修复RSS URL
-- 运行方式: psql -d your_database_name -f fix-rss-urls.sql
-- 或在PostgreSQL客户端中直接执行

-- 1. 修复 OpenAI Blog
UPDATE data_sources
SET
  base_url = 'https://openai.com',
  api_endpoint = '/news/rss.xml',
  crawler_config = jsonb_set(crawler_config, '{rssUrl}', '"https://openai.com/news/rss.xml"'::jsonb)
WHERE name = 'OpenAI Blog';

-- 2. 修复 DeepMind Blog
UPDATE data_sources
SET
  base_url = 'https://blog.google',
  api_endpoint = '/technology/google-deepmind/rss/',
  crawler_config = jsonb_set(crawler_config, '{rssUrl}', '"https://blog.google/technology/google-deepmind/rss/"'::jsonb)
WHERE name = 'DeepMind Blog';

-- 3. 修复 Meta AI Blog (使用 Meta Engineering Blog 替代)
UPDATE data_sources
SET
  base_url = 'https://engineering.fb.com',
  api_endpoint = '/feed',
  crawler_config = jsonb_set(crawler_config, '{rssUrl}', '"https://engineering.fb.com/feed/"'::jsonb),
  description = 'AI research and innovations from Meta Engineering'
WHERE name = 'Meta AI Blog';

-- 4. 修复 Anthropic Blog (使用社区RSS源)
UPDATE data_sources
SET
  base_url = 'https://raw.githubusercontent.com',
  api_endpoint = '/Olshansk/rss-feeds/refs/heads/main/feeds/feed_anthropic_news.xml',
  crawler_config = jsonb_set(crawler_config, '{rssUrl}', '"https://raw.githubusercontent.com/Olshansk/rss-feeds/refs/heads/main/feeds/feed_anthropic_news.xml"'::jsonb),
  description = 'AI safety and research from Anthropic (Community RSS)',
  status = 'ACTIVE'
WHERE name = 'Anthropic Blog';

-- 查询更新后的结果
SELECT id, name, status,
       crawler_config->>'rssUrl' as rss_url
FROM data_sources
WHERE name IN ('OpenAI Blog', 'DeepMind Blog', 'Meta AI Blog', 'Anthropic Blog');
