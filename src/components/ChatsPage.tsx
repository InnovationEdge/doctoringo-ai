import { Search, Plus, MoreHorizontal, CheckSquare, ChevronRight, Menu, AlignLeft, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const Motion = motion;
import { useState } from 'react';
import { useTranslation } from 'src/providers/TranslationProvider';

interface Chat {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

interface ChatsPageProps {
  onNewChat: () => void;
  onSelectChat: (id: string, title: string) => void;
  currentChatId: string | null;
  onOpenMobileMenu?: () => void;
  chats?: Chat[];
}

// Helper to format relative time
const formatRelativeTime = (dateString: string | undefined, t: (key: string, def: string) => string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} ${t('min_ago', 'min ago')}`;
  if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('hours_ago', 'hours ago') : t('hour_ago', 'hour ago')}`;
  if (diffDays === 1) return t('yesterday', 'Yesterday');
  if (diffDays < 7) return `${diffDays} ${t('days_ago', 'days ago')}`;
  if (diffDays < 14) return t('week_ago', '1 week ago');
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${t('weeks_ago', 'weeks ago')}`;
  return `${Math.floor(diffDays / 30)} ${t('months_ago', 'months ago')}`;
};

export function ChatsPage({ onNewChat, onSelectChat, currentChatId, onOpenMobileMenu, chats = [] }: ChatsPageProps) {
  const { translate } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Map chats from API to display format
  const chatList = chats.map(chat => ({
    id: chat.id,
    title: chat.title,
    time: formatRelativeTime(chat.updated_at || chat.created_at, translate)
  }));

  const filteredChats = chatList.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-[#171717] transition-colors relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1000px] w-full mx-auto px-4 md:px-6 pt-4 md:pt-12 pb-32">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-6 pt-4 px-1">
            <button type="button"
              onClick={onOpenMobileMenu}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#212121] rounded-full shadow-sm border border-[#f0f0f0] dark:border-[#2d2d2d] active:scale-95 transition-all"
            >
              <AlignLeft className="w-4.5 h-4.5 text-[#1a1a1a] dark:text-[#ececec]" />
            </button>
            <h1 className="text-[18px] font-semibold text-[#1a1a1a] dark:text-[#ececec]">{translate('chats', 'Chats')}</h1>
            <button type="button"
              onClick={onNewChat}
              className="w-10 h-10 flex items-center justify-center bg-[#033C81] text-white rounded-full shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <h1 className="text-[40px] font-serif font-medium text-[#1a1a1a] dark:text-[#ececec]">{translate('chats', 'Chats')}</h1>
            <button type="button"
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[14px] font-medium hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{translate('new_chat', 'New chat')}</span>
            </button>
          </div>

          {/* Search Bar - Responsive */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-4.5 h-4.5 text-[#8e8e8e]" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate('search_chats_placeholder', 'Search your chats...')}
              className="w-full bg-[#f3f3f3] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl md:rounded-2xl py-3 md:py-3.5 pl-11 md:pl-12 pr-4 text-[15px] md:text-[16px] text-[#1a1a1a] dark:text-[#ececec] placeholder:text-[#8e8e8e] outline-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-colors"
            />
          </div>

          {/* Stats - More compact for mobile */}
          <div className="flex items-center gap-2 text-[13px] md:text-[14px] text-[#8e8e8e] mb-4 md:mb-6 px-1">
            <div className="hidden md:block w-5 h-5 rounded border border-[#e5e5e0] dark:border-[#2d2d2d] flex-shrink-0" />
            <span>{chatList.length} {translate('chats_count', 'chats')}</span>
            <button type="button" className="text-[#033C81] hover:underline font-medium ml-auto">{translate('select_action', 'Select')}</button>
          </div>

          {/* Chat List */}
          <div className="space-y-0.5 md:space-y-1">
            {filteredChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id, chat.title)}
                className={`
                  group relative flex items-center gap-4 w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border border-transparent
                  ${currentChatId === chat.id ? 'bg-[#f3f3f3] dark:bg-[#212121]' : 'hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}
                `}
              >
                {/* Checkbox Placeholder - Desktop Only */}
                <div className="hidden md:block w-5 h-5 rounded border border-[#e5e5e0] dark:border-[#2d2d2d] flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-[17px] md:text-[17px] font-medium leading-snug mb-0.5 truncate ${currentChatId === chat.id ? 'text-[#1a1a1a] dark:text-white' : 'text-[#1a1a1a] dark:text-[#ececec]'}`}>
                    {chat.title}
                  </h3>
                  <p className="text-[14px] text-[#8e8e8e]">
                    {chat.time}
                  </p>
                </div>

                <div className="flex items-center gap-2 transition-opacity">
                  <div className="md:hidden">
                    <ChevronRight className="w-4.5 h-4.5 text-[#8e8e8e] opacity-60" />
                  </div>
                  <button type="button" className="hidden md:block p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-[#8e8e8e] transition-colors opacity-0 md:group-hover:opacity-100">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar - Mobile Only - REMOVED redundant header actions already provide this */}
      <div className="md:hidden h-20" /> {/* Spacer for bottom of list */}
    </div>
  );
}
