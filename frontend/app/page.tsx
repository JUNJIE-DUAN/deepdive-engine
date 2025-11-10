'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import NoteEditor from '@/components/NoteEditor';
import NotesList from '@/components/NotesList';
import CommentsList from '@/components/CommentsList';

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  aiSummary?: string;
  publishedAt: string;
  sourceUrl: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  authors?: Array<{ username: string; platform: string }>;
  categories?: string[];
  qualityScore?: string;
  upvoteCount?: number;
  viewCount?: number;
  commentCount?: number;
}

interface SearchSuggestion {
  id: string;
  title: string;
  type: string;
  abstract: string;
  highlight: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIInsight {
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

// Helper function to parse markdown format to insights array
function parseMarkdownToInsights(markdown: string): AIInsight[] {
  const insights: AIInsight[] = [];

  // Split by #### headings (numbered items)
  const sections = markdown.split(/####\s+\d+\.\s+/);

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // Extract title (first line before newline or **)
    const titleMatch = section.match(/^([^\n*]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '未命名';

    // Extract importance if present
    let importance: 'high' | 'medium' | 'low' = 'medium';
    if (section.includes('重要性：高') || section.includes('importance: high') || section.includes('**重要性：高**')) {
      importance = 'high';
    } else if (section.includes('重要性：低') || section.includes('importance: low') || section.includes('**重要性：低**')) {
      importance = 'low';
    }

    // Extract description (text after the importance line or after first newline)
    let description = section;
    // Remove title from description
    description = description.replace(/^([^\n*]+)/, '');
    // Remove importance markers
    description = description.replace(/\*\*重要性：[^*]+\*\*/g, '').trim();
    description = description.replace(/重要性：[^\n]+/g, '').trim();
    // Take first few lines as description
    const lines = description.split('\n').filter(line => line.trim());
    description = lines.slice(0, 3).join(' ').substring(0, 200);

    if (title && description) {
      insights.push({ title, description, importance });
    }
  }

  return insights.length > 0 ? insights : [];
}

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'papers' | 'projects' | 'news'>('papers');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // AI interaction states
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiMethodology, setAiMethodology] = useState<AIInsight[]>([]);
  const [aiRightTab, setAiRightTab] = useState<'assistant' | 'notes' | 'comments' | 'similar'>('assistant');

  // Context menu for adding to notes
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [aiModel, setAiModel] = useState<'grok' | 'openai'>('grok');
  const [isStreaming, setIsStreaming] = useState(false);

  // Search and filter states
  const [sortBy, setSortBy] = useState<'publishedAt' | 'qualityScore' | 'trendingScore'>('trendingScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Search suggestions states
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<'agent' | 'search'>('search');

  // Bookmark states
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [defaultCollectionId, setDefaultCollectionId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load bookmarks function
  const loadBookmarks = useCallback(async () => {
    try {
      // Get all collections
      const response = await fetch(`${config.apiBaseUrl}/api/v1/collections`);
      if (response.ok) {
        const collections = await response.json();

        // Find or create default collection
        let defaultCollection = collections.find((c: any) => c.name === '我的收藏');

        if (!defaultCollection) {
          // Create default collection
          const createResponse = await fetch(`${config.apiBaseUrl}/api/v1/collections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: '我的收藏',
              description: '默认收藏集',
              isPublic: false,
            }),
          });

          if (createResponse.ok) {
            defaultCollection = await createResponse.json();
          }
        }

        if (defaultCollection) {
          setDefaultCollectionId(defaultCollection.id);

          // Load bookmarked resource IDs
          const bookmarkedIds = new Set<string>(
            (defaultCollection.items || []).map((item: any) => item.resourceId as string)
          );
          setBookmarks(bookmarkedIds);
        }
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  }, []);

  // Load bookmarks from backend API on mount
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    fetchResources();
  }, [activeTab, searchQuery, sortBy, sortOrder, filterCategory]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  const fetchResources = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({
        take: '50',
        skip: '0',
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      // Map tab to resource type
      const typeMap = {
        papers: 'PAPER',
        projects: 'PROJECT',
        news: 'NEWS',
      };
      params.append('type', typeMap[activeTab]);

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filterCategory) {
        params.append('category', filterCategory);
      }

      const url = `${config.apiUrl}/resources?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setResources(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setViewMode('detail');
    // Clear previous AI data
    setAiMessages([]);
    setAiSummary(null);
    setAiInsights([]);
    // Auto-generate summary and insights
    generateSummary(resource);
    generateInsights(resource);
  };

  const handleBackToList = () => {
    setViewMode('list');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
        // Select the highlighted suggestion
        handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
      } else {
        // Perform normal search
        setShowSuggestions(false);
        fetchResources();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Fetch search suggestions with debouncing
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: '5',
      });

      const url = `${config.apiUrl}/resources/search/suggestions?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSearchSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Debounce search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchMode === 'search') {
        fetchSearchSuggestions(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, fetchSearchSuggestions]);

  // Handle clicks outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Navigate to the resource detail
    const resource = resources.find(r => r.id === suggestion.id);
    if (resource) {
      handleResourceClick(resource);
    } else {
      // If not in current list, fetch and show it
      fetchResourceById(suggestion.id);
    }
  };

  const fetchResourceById = async (id: string) => {
    try {
      const res = await fetch(`${config.apiUrl}/resources/${id}`);
      const resource = await res.json();
      if (resource) {
        handleResourceClick(resource);
      }
    } catch (error) {
      console.error('Failed to fetch resource:', error);
    }
  };

  // AI Functions
  const generateSummary = async (resource: Resource) => {
    if (!resource) return;

    try {
      setAiLoading(true);
      const content = resource.abstract || resource.title;

      const res = await fetch('http://localhost:5000/api/v1/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          max_length: 200,
          language: 'zh'
        }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          setAiSummary('⚠️ AI服务暂不可用\n\n请在 ai-service/.env 文件中配置以下API密钥之一：\n• GROK_API_KEY (推荐)\n• OPENAI_API_KEY\n\n配置后重启 ai-service 即可使用AI功能。');
        } else {
          const error = await res.json();
          setAiSummary(`生成失败: ${error.detail || '未知错误'}`);
        }
        return;
      }

      const data = await res.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setAiSummary('⚠️ 无法连接到AI服务\n\n请确保 ai-service 已启动：\ncd ai-service && uvicorn main:app --reload');
    } finally {
      setAiLoading(false);
    }
  };

  const generateInsights = async (resource: Resource) => {
    if (!resource) return;

    try {
      const content = resource.abstract || resource.title;

      const res = await fetch('http://localhost:5000/api/v1/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          language: 'zh'
        }),
      });

      const data = await res.json();
      setAiInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  // Handle context menu for adding to notes
  const handleContextMenu = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        text: selectedText,
      });
    } else if (text) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        text: text,
      });
    }
  };

  // Save selected text to notes
  const saveToNotes = async () => {
    if (!contextMenu || !selectedResource) return;

    try {
      setSavingNote(true);
      console.log('Saving note to resource:', selectedResource.id, 'content:', contextMenu.text.substring(0, 50) + '...');

      const response = await fetch(`${config.apiBaseUrl}/api/v1/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          content: contextMenu.text,
          tags: ['AI生成'],
          isPublic: false,
        }),
      });

      if (response.ok) {
        const savedNote = await response.json();
        console.log('Note saved successfully:', savedNote);

        // Close context menu first
        setContextMenu(null);

        // Switch to notes tab
        setAiRightTab('notes');

        // Trigger notes list refresh after a small delay
        setTimeout(() => {
          setNotesRefreshKey(prev => prev + 1);
          console.log('Notes list refreshed');
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Failed to save note:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on the context menu itself
      if (target.closest('.context-menu')) {
        return;
      }
      setContextMenu(null);
    };
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const sendAIMessage = async () => {
    if (!aiInput.trim() || !selectedResource) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    const currentInput = aiInput;
    setAiInput('');
    setIsStreaming(true);

    try {
      // Build context from selected resource
      const context = `Title: ${selectedResource.title}\nAbstract: ${selectedResource.abstract || selectedResource.aiSummary || 'No abstract available'}`;

      const res = await fetch('http://localhost:5000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          context: context,
          model: aiModel,
          stream: true
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch');

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMessage: AIMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setAiMessages(prev => [...prev, assistantMessage]);
      const messageIndex = aiMessages.length + 1;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setAiMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[messageIndex] = {
                    ...newMessages[messageIndex],
                    content: newMessages[messageIndex].content + parsed.content
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.debug('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'AI服务暂时不可用，请检查AI服务是否运行（http://localhost:5000）',
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuickAction = async (action: 'summary' | 'insights' | 'methodology') => {
    if (!selectedResource) return;

    setAiLoading(true);

    try {
      const content = `Title: ${selectedResource.title}\n\nAbstract: ${selectedResource.abstract || selectedResource.aiSummary || ''}`;

      const res = await fetch('http://localhost:5000/api/v1/ai/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          action: action,
          model: aiModel
        }),
      });

      const data = await res.json();

      // Parse and set the appropriate state based on action type
      if (action === 'summary') {
        setAiSummary(data.content);
      } else if (action === 'insights') {
        // Try to parse JSON response for insights
        try {
          const insights = JSON.parse(data.content);
          if (Array.isArray(insights)) {
            setAiInsights(insights);
          } else {
            setAiInsights([]);
          }
        } catch {
          // If not valid JSON, try to parse markdown format
          console.log('JSON parsing failed, trying markdown parsing for insights');
          const parsedInsights = parseMarkdownToInsights(data.content);
          setAiInsights(parsedInsights);
        }
      } else if (action === 'methodology') {
        // Try to parse JSON response for methodology
        try {
          const methodology = JSON.parse(data.content);
          if (Array.isArray(methodology)) {
            setAiMethodology(methodology);
          } else {
            setAiMethodology([]);
          }
        } catch {
          // If not valid JSON, try to parse markdown format
          console.log('JSON parsing failed, trying markdown parsing for methodology');
          const parsedMethodology = parseMarkdownToInsights(data.content);
          setAiMethodology(parsedMethodology);
        }
      }

      // Only add summary to chat messages, not insights/methodology
      // (insights/methodology are displayed as structured blocks)
      if (action === 'summary') {
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setAiMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `执行 ${action} 失败，请检查AI服务`,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // Bookmark functions
  const toggleBookmark = async (resourceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!defaultCollectionId) {
      console.error('Default collection not found');
      return;
    }

    try {
      const isCurrentlyBookmarked = bookmarks.has(resourceId);

      if (isCurrentlyBookmarked) {
        // Remove from collection
        const response = await fetch(
          `${config.apiBaseUrl}/api/v1/collections/${defaultCollectionId}/items/${resourceId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          const newBookmarks = new Set(bookmarks);
          newBookmarks.delete(resourceId);
          setBookmarks(newBookmarks);
        }
      } else {
        // Add to collection
        const response = await fetch(
          `${config.apiBaseUrl}/api/v1/collections/${defaultCollectionId}/items`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceId }),
          }
        );

        if (response.ok) {
          const newBookmarks = new Set(bookmarks);
          newBookmarks.add(resourceId);
          setBookmarks(newBookmarks);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const isBookmarked = (resourceId: string) => {
    return bookmarks.has(resourceId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Collapsible */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {!isSidebarCollapsed && (
              <Link href="/" className="text-lg font-bold text-gray-900">
                DeepDive
              </Link>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          {!isSidebarCollapsed && (
            <button className="text-xs text-gray-500 mb-2 px-3">Menu</button>
          )}
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-900 bg-pink-50 rounded-lg`}
              title="Explore"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Explore</span>}
            </Link>
            <Link
              href="/library"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="My Library"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {!isSidebarCollapsed && <span>My Library</span>}
            </Link>
            <Link
              href="/notifications"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Notifications"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {!isSidebarCollapsed && <span>Notifications</span>}
            </Link>
            <Link
              href="/profile"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Profile"
            >
              <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                P
              </div>
              {!isSidebarCollapsed && <span>Profile</span>}
            </Link>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link
            href="/labs"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg`}
            title="Labs"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {!isSidebarCollapsed && <span>Labs</span>}
          </Link>
          <Link
            href="/feedback"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg`}
            title="Feedback"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!isSidebarCollapsed && <span>Feedback</span>}
          </Link>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg w-full`}
            title="Dark mode"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            {!isSidebarCollapsed && <span>Dark mode</span>}
          </button>
        </div>
      </aside>

      {/* Center Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Sticky Search Bar Container */}
        <div className="sticky top-0 z-10 bg-gray-50 pt-6 pb-4">
          <div className="max-w-5xl mx-auto px-8">
            {/* Large Search Bar */}
            <div className="mb-4">
              <div className="relative bg-white border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center">
                  {/* Agent Selector */}
                  <div className="flex items-center gap-2 px-4 py-3 border-r border-gray-200">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <select
                      value={searchMode}
                      onChange={(e) => setSearchMode(e.target.value as 'agent' | 'search')}
                      className="text-sm font-medium text-gray-700 border-none focus:ring-0 bg-transparent cursor-pointer"
                    >
                      <option value="agent">agent</option>
                      <option value="search">search</option>
                    </select>
                  </div>

                  {/* Search Input */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Ask or search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    onFocus={() => {
                      if (searchMode === 'search' && searchQuery.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="flex-1 px-4 py-3 text-sm border-none focus:ring-0 focus:outline-none"
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 px-4">
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto"
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                          index === selectedSuggestionIndex
                            ? 'bg-red-50 border-l-4 border-l-red-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {suggestion.type === 'PAPER' && (
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {suggestion.type === 'PROJECT' && (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            )}
                            {suggestion.type === 'NEWS' && (
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.title}
                              </h4>
                              <span className="flex-shrink-0 text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                                {suggestion.type.toLowerCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {suggestion.highlight}
                            </p>
                          </div>

                          {/* Arrow Icon */}
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs and Filters */}
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('papers')}
                  className={`pb-1 text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'papers'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Papers
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`pb-1 text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'projects'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`pb-1 text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'news'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  News
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilterCategory(filterCategory ? '' : 'AI')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {filterCategory || 'Filter'}
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <option value="trendingScore">Hot</option>
                  <option value="publishedAt">Latest</option>
                  <option value="qualityScore">Quality</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto px-8 pb-6">

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {/* Loading State */}
              {loading && (
                <div className="space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse flex gap-6">
                      <div className="w-40 h-52 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resource Cards - Horizontal Layout */}
              {!loading && resources.length > 0 && (
                <div className="space-y-5">
                  {resources.map((resource) => (
                    <article
                      key={resource.id}
                      onClick={() => handleResourceClick(resource)}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex gap-6 p-6">
                        {/* Left: Paper Thumbnail */}
                        <div className="w-40 flex-shrink-0">
                          <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200" style={{aspectRatio: '1/1.4'}}>
                            {resource.thumbnailUrl ? (
                              <img
                                src={`${config.apiBaseUrl}${resource.thumbnailUrl}`}
                                alt={resource.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                {resource.type === 'PAPER' && (
                                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                                {resource.type === 'PROJECT' && (
                                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                  </svg>
                                )}
                                {resource.type === 'NEWS' && (
                                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                  </svg>
                                )}
                              </div>
                            )}
                            {/* Stats Overlay */}
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm flex items-center gap-1 text-xs">
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="font-medium text-gray-700">{resource.upvoteCount || 0}</span>
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Right: Content */}
                        <div className="flex-1 min-w-0">
                          {/* Date and Tags */}
                          <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                            <span>
                              {new Date(resource.publishedAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {resource.categories && resource.categories.slice(0, 3).map((cat, i) => (
                              <span key={i} className="text-gray-600">{cat}</span>
                            ))}
                          </div>

                          {/* Title */}
                          <h2 className="text-xl font-semibold text-red-600 mb-3 hover:underline">
                            {resource.title}
                          </h2>

                          {/* Abstract */}
                          {(resource.aiSummary || resource.abstract) && (
                            <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                              {resource.aiSummary || resource.abstract}
                            </p>
                          )}

                          {/* Bottom Actions */}
                          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                            <button
                              onClick={(e) => toggleBookmark(resource.id, e)}
                              className={`flex items-center gap-2 text-sm transition-colors ${
                                isBookmarked(resource.id)
                                  ? 'text-red-600 hover:text-red-700'
                                  : 'text-gray-600 hover:text-red-600'
                              }`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill={isBookmarked(resource.id) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              {isBookmarked(resource.id) ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            {resource.commentCount !== undefined && (
                              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {resource.commentCount}
                              </button>
                            )}
                            {resource.upvoteCount !== undefined && (
                              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                {resource.upvoteCount}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && resources.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500 mb-2">No content available</p>
                  <p className="text-sm text-gray-400">Try running the data crawler first</p>
                </div>
              )}
            </>
          )}

          {/* Detail View */}
          {viewMode === 'detail' && selectedResource && (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedResource.title}
                </h1>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                  <span>
                    {new Date(selectedResource.publishedAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {selectedResource.categories && selectedResource.categories.slice(0, 3).map((cat, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded">{cat}</span>
                  ))}
                </div>

                {/* Authors */}
                {selectedResource.authors && selectedResource.authors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-1">Authors</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.authors.map((author, i) => (
                        <span key={i} className="text-xs text-gray-600">{author.username}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleBookmark(selectedResource.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isBookmarked(selectedResource.id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'border border-red-600 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={isBookmarked(selectedResource.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {isBookmarked(selectedResource.id) ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <a
                    href={selectedResource.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in new tab
                  </a>
                  <div className="flex items-center gap-3 ml-auto text-xs text-gray-600">
                    {selectedResource.upvoteCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {selectedResource.upvoteCount}
                      </span>
                    )}
                    {selectedResource.viewCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedResource.viewCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Embedded Content */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preview</span>
                  <a
                    href={
                      selectedResource.type === 'PAPER' && selectedResource.pdfUrl
                        ? `${config.apiUrl}/proxy/pdf?url=${encodeURIComponent(selectedResource.pdfUrl)}`
                        : selectedResource.sourceUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in new tab
                  </a>
                </div>
                {/* Display preview via proxy */}
                {selectedResource.type === 'PAPER' && selectedResource.pdfUrl ? (
                  <object
                    data={`${config.apiUrl}/proxy/pdf?url=${encodeURIComponent(selectedResource.pdfUrl)}`}
                    type="application/pdf"
                    className="w-full h-[800px]"
                    title={selectedResource.title}
                  >
                    <p className="p-4 text-center text-gray-500">
                      PDF cannot be displayed. <a
                        href={`${config.apiUrl}/proxy/pdf?url=${encodeURIComponent(selectedResource.pdfUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >Click here to download</a>
                    </p>
                  </object>
                ) : (
                  <iframe
                    src={`${config.apiUrl}/proxy/html?url=${encodeURIComponent(selectedResource.sourceUrl)}`}
                    className="w-full h-[800px]"
                    title={selectedResource.title}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right AI Interaction Panel */}
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Top Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex items-center px-3">
            <button
              onClick={() => setAiRightTab('assistant')}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                aiRightTab === 'assistant'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setAiRightTab('notes')}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                aiRightTab === 'notes'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent'
              }`}
            >
              My Notes
            </button>
            <button
              onClick={() => setAiRightTab('comments')}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                aiRightTab === 'comments'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setAiRightTab('similar')}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                aiRightTab === 'similar'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent'
              }`}
            >
              Similar
            </button>
          </div>
        </div>
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedResource ? (
            aiRightTab === 'assistant' ? (
              <div className="space-y-4">
                {/* Model Selector */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">AI模型:</span>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value as 'grok' | 'openai')}
                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="grok">Grok-3 (x.AI)</option>
                    <option value="openai">GPT-4o-mini (OpenAI)</option>
                  </select>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">快捷操作:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickAction('summary')}
                      disabled={aiLoading || isStreaming}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-700">摘要</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('insights')}
                      disabled={aiLoading || isStreaming}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-gray-700">洞察</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('methodology')}
                      disabled={aiLoading || isStreaming}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span className="text-gray-700">方法论</span>
                    </button>
                  </div>
                </div>

                {/* AI Summary Section */}
                {aiSummary && (
                  <div
                    className="bg-gradient-to-br from-pink-50 to-red-50 rounded-lg p-4 border border-pink-200 cursor-text select-text"
                    onContextMenu={(e) => handleContextMenu(e, aiSummary)}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      AI摘要
                      <span className="ml-auto text-xs text-gray-500">右键添加到笔记</span>
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
                  </div>
                )}

                {/* AI Loading Indicator */}
                {(aiLoading || isStreaming) && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    <span className="text-xs text-gray-600">
                      {isStreaming ? `${aiModel === 'grok' ? 'Grok-3' : 'GPT-4o-mini'}正在思考...` : 'AI处理中...'}
                    </span>
                  </div>
                )}

                {/* AI Insights Section */}
                {aiInsights.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      关键洞察
                      <span className="ml-auto text-xs text-gray-500">右键添加到笔记</span>
                    </h3>
                    {aiInsights.map((insight, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border cursor-text select-text ${
                          insight.importance === 'high'
                            ? 'bg-red-50 border-red-200'
                            : insight.importance === 'medium'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, `**${insight.title}**\n\n${insight.description}`)}
                      >
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h4>
                        <p className="text-xs text-gray-600">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Methodology Section */}
                {aiMethodology.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      研究方法论
                      <span className="ml-auto text-xs text-gray-500">右键添加到笔记</span>
                    </h3>
                    {aiMethodology.map((method, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border cursor-text select-text ${
                          method.importance === 'high'
                            ? 'bg-blue-50 border-blue-200'
                            : method.importance === 'medium'
                            ? 'bg-cyan-50 border-cyan-200'
                            : 'bg-teal-50 border-teal-200'
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, `**${method.title}**\n\n${method.description}`)}
                      >
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{method.title}</h4>
                        <p className="text-xs text-gray-600">{method.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Messages */}
                {aiMessages.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    {aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Tips when no messages */}
                {aiMessages.length === 0 && !aiLoading && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">💡 你可以问：</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setAiInput('这篇文章的主要贡献是什么？');
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700"
                      >
                        这篇文章的主要贡献是什么？
                      </button>
                      <button
                        onClick={() => {
                          setAiInput('有哪些实际应用场景？');
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700"
                      >
                        有哪些实际应用场景？
                      </button>
                      <button
                        onClick={() => {
                          setAiInput('有什么局限性？');
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700"
                      >
                        有什么局限性？
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : aiRightTab === 'notes' ? (
              <div className="p-6">
                <NotesList key={notesRefreshKey} resourceId={selectedResource.id} />
              </div>
            ) : aiRightTab === 'comments' ? (
              <div className="p-6">
                <CommentsList resourceId={selectedResource.id} />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">相似内容推荐功能开发中...</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div>
                <div className="flex justify-center mb-6">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-2">No content selected</p>
                <p className="text-xs text-gray-400">Click on any paper, project, or news item to analyze it with AI</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="relative">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendAIMessage();
                }
              }}
              disabled={!selectedResource || aiLoading}
              placeholder={selectedResource ? "Ask anything about this content..." : "Select a resource first..."}
              rows={3}
              className="w-full px-4 py-3 pr-24 text-sm bg-gray-50 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600" disabled={!selectedResource}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600" disabled={!selectedResource}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                onClick={sendAIMessage}
                disabled={!selectedResource || !aiInput.trim() || aiLoading}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Context Menu for Adding to Notes */}
      {contextMenu && (
        <div
          className="context-menu fixed bg-white border-2 border-blue-500 rounded-lg shadow-xl py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Button clicked!');
              saveToNotes();
            }}
            disabled={savingNote}
            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {savingNote ? '保存中...' : '添加到笔记'}
          </button>
        </div>
      )}
    </div>
  );
}
