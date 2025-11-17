#!/usr/bin/env node

/**
 * Script to extract all unique domains from resources in the database
 * and identify which ones are not in the current whitelist
 */

const API_URL = 'http://localhost:4000/api/v1';
const WHITELIST = [
  "arxiv.org",
  "alphaxiv.org",
  "www.alphaxiv.org",
  "openreview.net",
  "papers.nips.cc",
  "proceedings.mlr.press",
  "github.com",
  "raw.githubusercontent.com",
  "reddit.com",
  "old.reddit.com",
  "forbes.com",
  "www.forbes.com",
  "medium.com",
  "towardsdatascience.com",
  "blog.google",
  "ai.googleblog.com",
  "openai.com",
  "blog.openai.com",
  "deepmind.com",
  "deepmind.google",
  "techcrunch.com",
  "venturebeat.com",
  "wired.com",
  "theverge.com",
  "arstechnica.com",
  "xslt.rip",
  "news.ycombinator.com",
  "myticker.com",
  "www.myticker.com",
];

async function fetchAllResources() {
  const allResources = [];
  let skip = 0;
  const take = 100; // Fetch in batches of 100

  try {
    while (true) {
      console.log(`Fetching resources: skip=${skip}, take=${take}`);
      const response = await fetch(`${API_URL}/resources?skip=${skip}&take=${take}`);

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const resources = data.data || data.resources || [];

      if (resources.length === 0) {
        console.log('No more resources to fetch');
        break;
      }

      allResources.push(...resources);
      console.log(`Fetched ${resources.length} resources (total: ${allResources.length})`);

      if (resources.length < take) {
        break; // Last batch
      }

      skip += take;
    }
  } catch (error) {
    console.error('Error fetching resources:', error.message);
  }

  return allResources;
}

function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.warn(`Invalid URL: ${url}`);
    return null;
  }
}

function isAllowed(hostname) {
  return WHITELIST.some(
    (domain) =>
      hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

async function main() {
  console.log('='.repeat(60));
  console.log('Domain Extraction Script');
  console.log('='.repeat(60));
  console.log();

  // Fetch all resources
  console.log('📥 Fetching resources from database...');
  const resources = await fetchAllResources();
  console.log(`✅ Fetched ${resources.length} total resources`);
  console.log();

  // Extract unique domains
  console.log('🔍 Extracting unique domains...');
  const domains = new Set();
  const resourcesByDomain = new Map();

  for (const resource of resources) {
    if (resource.sourceUrl) {
      const domain = extractDomainFromUrl(resource.sourceUrl);
      if (domain) {
        domains.add(domain);
        if (!resourcesByDomain.has(domain)) {
          resourcesByDomain.set(domain, []);
        }
        resourcesByDomain.get(domain).push(resource);
      }
    }
  }

  const sortedDomains = Array.from(domains).sort();
  console.log(`✅ Found ${sortedDomains.length} unique domains`);
  console.log();

  // Categorize domains
  const allowedDomains = [];
  const newDomains = [];

  for (const domain of sortedDomains) {
    if (isAllowed(domain)) {
      allowedDomains.push(domain);
    } else {
      newDomains.push(domain);
    }
  }

  // Print results
  console.log('=' .repeat(60));
  console.log(`✅ Already Whitelisted: ${allowedDomains.length}`);
  console.log('=' .repeat(60));
  allowedDomains.forEach(domain => {
    console.log(`  • ${domain} (${resourcesByDomain.get(domain).length} resources)`);
  });
  console.log();

  console.log('=' .repeat(60));
  console.log(`⚠️  NEW Domains NOT in Whitelist: ${newDomains.length}`);
  console.log('=' .repeat(60));

  if (newDomains.length > 0) {
    newDomains.forEach(domain => {
      const count = resourcesByDomain.get(domain).length;
      const types = [...new Set(resourcesByDomain.get(domain).map(r => r.type))].join(', ');
      console.log(`  • ${domain} (${count} resources, types: ${types})`);
    });
    console.log();

    // Generate code to add to whitelist
    console.log('=' .repeat(60));
    console.log('📝 Add these domains to proxy.controller.ts allowedDomains:');
    console.log('=' .repeat(60));
    newDomains.forEach(domain => {
      console.log(`      "${domain}",`);
    });
  } else {
    console.log('  ✅ All domains are already whitelisted!');
  }

  console.log();
  console.log('=' .repeat(60));
  console.log(`Summary: ${sortedDomains.length} domains total`);
  console.log(`  - Whitelisted: ${allowedDomains.length}`);
  console.log(`  - Need to add: ${newDomains.length}`);
  console.log('=' .repeat(60));
}

main().catch(console.error);
