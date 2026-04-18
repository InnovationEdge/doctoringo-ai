import { Search, X, MessageSquare, Box, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
const Motion = motion;
import { useState, useEffect, useRef } from 'react';
import { searchApi } from '../lib/api';
import { useTranslation } from 'src/providers/TranslationProvider';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string, title: string) => void;
  user?: any;
}

export function SearchOverlay({ isOpen, onClose, onSelectChat, user }: SearchOverlayProps) {
  const { translate } = useTranslation();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        setSearchError(null);
        const results = await searchApi.searchChats(query);
        const mappedResults = (results?.results || results || []).map((chat: any) => ({
          id: chat.id,
          type: 'chat',
          title: chat.title,
          extra: translate('chat_label', 'Chat')
        }));
        setSearchResults(mappedResults);
      } catch (error: any) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setSearchError(error.message || 'Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <Motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="w-full max-w-[640px] bg-white dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-black/5 dark:border-white/5 relative">
          <div className="flex items-center gap-3 flex-1 bg-transparent">
            <Search className="w-5 h-5 text-[#8e8e8e]" />
            <input 
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={translate('search_chats_projects', 'Search chats and projects')}
              className="bg-transparent border-none outline-none text-[#1a1a1a] dark:text-[#ececec] text-[16px] w-full placeholder:text-[#8e8e8e]"
            />
          </div>
          <button type="button"
            onClick={onClose}
            className="p-1 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {isSearching && (
            <div className="py-12 text-center text-[#8e8e8e]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <div>{translate('searching', 'Searching...')}</div>
            </div>
          )}

          {!isSearching && searchResults.map((result: any) => (
            <button
              key={result.id}
              onClick={() => {
                if (result.type === 'chat') onSelectChat(result.id, result.title);
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0">
                  {result.type === 'project' ? (
                    <Box className="w-4.5 h-4.5 text-[#8e8e8e]" />
                  ) : (
                    <MessageSquare className="w-4.5 h-4.5 text-[#8e8e8e]" />
                  )}
                </div>
                <span className="text-[15px] truncate text-[#1a1a1a] dark:text-[#ececec]">
                  {result.title}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <span className="text-[13px] text-[#8e8e8e] whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                  {result.extra}
                </span>
              </div>
            </button>
          ))}

          {!isSearching && searchError && (
            <div className="py-12 text-center text-red-500">
              <div className="mb-2 text-[14px]">{searchError}</div>
              <button type="button" onClick={() => setSearchError(null)} className="text-[13px] text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white">
                {translate('dismiss', 'Dismiss')}
              </button>
            </div>
          )}

          {!isSearching && !searchError && query && searchResults.length === 0 && (
            <div className="py-20 text-center text-[#8e8e8e]">
              <div className="mb-2">{translate('no_results_for', 'No results found for')} "{query}"</div>
              <div className="text-[13px] opacity-60">{translate('try_searching_hint', 'Try searching for chats, projects or people.')}</div>
            </div>
          )}
        </div>

        {/* Footer info (Matching screenshot bottom bar style if any, but screenshot ends at results) */}
      </Motion.div>
    </div>
  );
}
