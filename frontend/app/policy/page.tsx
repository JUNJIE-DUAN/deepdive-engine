'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Calendar, Tag, ExternalLink } from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  source: string;
  url: string;
  tags: string[];
}

// Sample US technology policy data
const US_TECH_POLICIES: Policy[] = [
  {
    id: '1',
    title: 'CHIPS and Science Act',
    description:
      'A comprehensive legislative package aimed at boosting U.S. semiconductor manufacturing and research. Provides $52.7 billion for semiconductor manufacturing, R&D, and workforce development.',
    date: '2022-08-09',
    category: 'Semiconductor & Manufacturing',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/117th-congress/house-bill/4346',
    tags: ['Semiconductors', 'Manufacturing', 'R&D', 'Workforce'],
  },
  {
    id: '2',
    title: 'National Artificial Intelligence Initiative Act',
    description:
      'Establishes a national AI initiative to ensure continued U.S. leadership in AI research and development, promote AI education and workforce training, and establish ethical AI principles.',
    date: '2020-12-23',
    category: 'Artificial Intelligence',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/116th-congress/house-bill/6216',
    tags: ['AI', 'Machine Learning', 'Ethics', 'Education'],
  },
  {
    id: '3',
    title: 'Executive Order on Safe, Secure, and Trustworthy AI',
    description:
      'Presidential executive order establishing new standards for AI safety and security, protecting privacy, advancing equity, and promoting innovation and competition.',
    date: '2023-10-30',
    category: 'Artificial Intelligence',
    source: 'White House',
    url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/',
    tags: ['AI', 'Safety', 'Security', 'Privacy'],
  },
  {
    id: '4',
    title: 'National Cybersecurity Strategy',
    description:
      'Comprehensive strategy to defend critical infrastructure, disrupt threat actors, shape market forces, invest in resilient future, and forge international partnerships for cybersecurity.',
    date: '2023-03-02',
    category: 'Cybersecurity',
    source: 'White House',
    url: 'https://www.whitehouse.gov/briefing-room/statements-releases/2023/03/02/fact-sheet-biden-harris-administration-announces-national-cybersecurity-strategy/',
    tags: ['Cybersecurity', 'Infrastructure', 'National Security'],
  },
  {
    id: '5',
    title: 'National Quantum Initiative Act',
    description:
      'Establishes the National Quantum Initiative to accelerate quantum research and development for economic and national security benefits. Authorizes $1.275 billion over 5 years.',
    date: '2018-12-21',
    category: 'Quantum Computing',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/115th-congress/house-bill/6227',
    tags: ['Quantum Computing', 'Research', 'National Security'],
  },
  {
    id: '6',
    title: 'Infrastructure Investment and Jobs Act - Broadband',
    description:
      'Historic $65 billion investment in broadband infrastructure to ensure all Americans have access to reliable, affordable high-speed internet.',
    date: '2021-11-15',
    category: 'Telecommunications',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/117th-congress/house-bill/3684',
    tags: ['Broadband', 'Infrastructure', 'Digital Divide'],
  },
  {
    id: '7',
    title: 'American Data Privacy and Protection Act',
    description:
      'Comprehensive federal privacy legislation establishing national data privacy rights and protections for all Americans.',
    date: '2022-07-20',
    category: 'Data Privacy',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/117th-congress/house-bill/8152',
    tags: ['Privacy', 'Data Protection', 'Consumer Rights'],
  },
  {
    id: '8',
    title: 'National Defense Authorization Act - 5G Security',
    description:
      'Provisions to secure 5G networks and telecommunications infrastructure from foreign adversaries, with emphasis on supply chain security.',
    date: '2020-12-27',
    category: 'Telecommunications',
    source: 'U.S. Congress',
    url: 'https://www.congress.gov/bill/116th-congress/house-bill/6395',
    tags: ['5G', 'Security', 'Telecommunications', 'Supply Chain'],
  },
];

export default function PolicyPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    ...Array.from(new Set(US_TECH_POLICIES.map((p) => p.category))),
  ];

  const filteredPolicies = US_TECH_POLICIES.filter((policy) => {
    const matchesCategory =
      selectedCategory === 'All' || policy.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              US Technology Policies
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            {filteredPolicies.length} policies
          </div>
        </header>

        {/* Search and Filter Bar */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="max-w-md flex-1">
              <input
                type="text"
                placeholder="Search policies, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Policies List */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            <div className="space-y-4">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Policy Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {policy.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(policy.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {policy.category}
                        </span>
                        <span className="text-gray-500">{policy.source}</span>
                      </div>
                    </div>
                    <a
                      href={policy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <span>View</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Policy Description */}
                  <p className="mb-4 text-gray-700">{policy.description}</p>

                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {policy.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredPolicies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-600">
                  No policies found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
