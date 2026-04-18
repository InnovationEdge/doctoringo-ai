import { Plus, Search, MessageSquare, PanelLeft, LogOut, Settings, Globe, Gift, Info, FileText, Check, MoreHorizontal, ChevronRight, Star, Pencil, Trash2, Layout, CreditCard, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const Motion = motion;
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DoctorLogo } from './DoctorLogo';
import { chatApi } from '../lib/api';
import { useTranslation } from 'src/providers/TranslationProvider';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string, title: string) => void;
  onToggleSearch: () => void;
  onOpenSettings: (tab?: string) => void;
  onOpenUpgrade: () => void;
  currentChatId: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  chats: { id: string, title: string }[];
  user: any;
  isIncognito?: boolean;
  setIsIncognito?: (val: boolean) => void;
  onRefreshChats?: () => void;
}

const languages = [
  { id: 'ka-GE', label: 'ქართული' },
  { id: 'en-US', label: 'English' },
  { id: 'ru-RU', label: 'Русский' },
];

export function AppSidebar({
  activeTab,
  onTabChange,
  onLogout,
  onNewChat,
  onSelectChat,
  onToggleSearch,
  onOpenSettings,
  onOpenUpgrade,
  currentChatId,
  isCollapsed,
  setIsCollapsed,
  isMobile,
  onCloseMobile,
  chats,
  user,
  isIncognito,
  setIsIncognito,
  onRefreshChats
}: AppSidebarProps) {
  const { translate } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('doctoringo_language');
      if (stored) return stored;
      // Auto-detect device language on first visit
      const browserLang = navigator.language || 'en-US';
      const detectedLocale = browserLang.startsWith('ka') ? 'ka-GE' : browserLang.startsWith('ru') ? 'ru-RU' : 'en-US';
      localStorage.setItem('doctoringo_language', detectedLocale);
      return detectedLocale;
    }
    return 'en-US';
  });
  const [activeChatMenuId, setActiveChatMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const languageBtnRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Handle chat rename
  const handleRename = async (chatId: string) => {
    if (!renameValue.trim()) {
      setRenamingChatId(null);
      return;
    }
    try {
      await chatApi.renameSession(chatId, renameValue.trim());
      onRefreshChats?.();
    } catch (e) {
      console.error('Failed to rename chat:', e);
      alert(translate('rename_failed', 'Failed to rename chat. Please try again.'));
    }
    setRenamingChatId(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageMenuRef.current && languageMenuRef.current.contains(event.target as Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowLanguageMenu(false);
      }
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target as Node)) {
        setShowLogoMenu(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setActiveChatMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation items based on image
  const navItems = [
    { id: 'chat', label: translate('new_chat', 'New chat'), icon: Plus, onClick: onNewChat },
    { id: 'search', label: translate('search', 'Search'), icon: Search, onClick: onToggleSearch },
    { id: 'chats', label: translate('chats', 'Chats'), icon: MessageSquare, onClick: () => onTabChange('chats') },
    { id: 'documents', label: translate('documents', 'Documents'), icon: FileText, onClick: () => onTabChange('documents') },
  ];

  return (
    <Motion.div 
      initial={false}
      animate={{ 
        width: isCollapsed ? 72 : (isMobile ? 280 : 260) 
      }}
      transition={{ type: 'spring', damping: 28, stiffness: 220, restDelta: 0.001 }}
      className={`
        h-full bg-[#f9f9f8] dark:bg-[#171717] flex flex-col relative border-r border-[#e5e5e0] dark:border-[#2d2d2d] z-[100] will-change-[width]
      `}
    >
      {/* Sidebar Header - FIXED TOP */}
      <div className={`flex-shrink-0 p-4 md:p-4 pt-6 md:pt-6 flex items-center justify-between z-30 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
        {(isMobile || !isCollapsed) && (
          <div className="relative" ref={logoMenuRef}>
            <button type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowLogoMenu(!showLogoMenu);
              }}
              className="flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-colors group cursor-pointer select-none"
            >
              <DoctorLogo className="w-7 h-7 dark:text-white" />
              <h1 className="text-[20px] md:text-[22px] font-serif font-medium tracking-tight text-[#1a1a1a] dark:text-[#ececec] truncate">Doctoringo</h1>
            </button>
          </div>
        )}
        
        {isCollapsed && !isMobile && (
          <button type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 text-[#676767] hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {(!isCollapsed || isMobile) && (
           <button type="button"
           onClick={() => isMobile ? onCloseMobile?.() : setIsCollapsed(!isCollapsed)}
           className="p-1.5 text-[#676767] hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer active:scale-95 transition-transform"
         >
           <PanelLeft className="w-5 h-5" />
         </button>
        )}
      </div>

      {/* Navigation Items - FROZEN */}
      <div className="flex-shrink-0 px-3 md:px-2 mt-2 space-y-0.5 z-20">
        {navItems.map((item) => (
          <button type="button"
            key={item.id}
            onClick={item.onClick}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 md:px-3 md:py-2 rounded-xl md:rounded-lg transition-all group cursor-pointer active:scale-[0.98]
              ${isCollapsed ? 'justify-center' : ''}
              ${activeTab === item.id 
                ? 'bg-[#e8e8e6] dark:bg-white/10 text-[#1a1a1a] dark:text-white font-medium shadow-sm md:shadow-none' 
                : 'text-[#676767] dark:text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1a1a1a] dark:hover:text-[#ececec]'}
            `}
          >
            <item.icon className="w-5 h-5 md:w-4.5 md:h-4.5 flex-shrink-0" />
            {!isCollapsed && <span className="text-[14px] font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Recents Header - FIXED below main nav */}
      {!isCollapsed && (
        <div className="flex-shrink-0 text-[11px] font-medium text-[#8e8e8e] uppercase tracking-wider mt-4 mb-1.5 px-5">{translate('recents', 'Recents')}</div>
      )}

      {/* Scrollable Area - Recents List Only */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 z-10 min-h-0 relative">
        <div className="space-y-0.5 pb-4">
          {!isCollapsed && (chats && chats.length > 0 ? chats : []).map((chat) => (
            <div key={chat.id} className="relative group/chat">
              {renamingChatId === chat.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(chat.id);
                    if (e.key === 'Escape') setRenamingChatId(null);
                  }}
                  onBlur={() => handleRename(chat.id)}
                  className="w-full px-3 py-1.5 rounded-lg text-[14px] bg-white dark:bg-[#212121] border border-[#033C81] outline-none text-[#1a1a1a] dark:text-white"
                  autoFocus
                />
              ) : (
                <button type="button"
                  onClick={() => onSelectChat(chat.id, chat.title)}
                  className={`
                    w-full text-left px-3 py-1.5 rounded-lg text-[14px] transition-all truncate cursor-pointer pr-8 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10
                    ${currentChatId === chat.id
                      ? 'text-[#1a1a1a] dark:text-white bg-black/10 dark:bg-white/10 font-medium'
                      : 'text-[#676767] dark:text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5'}
                  `}
                >
                  <span className="truncate block">{chat.title}</span>
                </button>
              )}
              
              <button type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ top: rect.bottom + 8, left: rect.left });
                  setActiveChatMenuId(activeChatMenuId === chat.id ? null : chat.id);
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[#8e8e8e] transition-all z-20 ${activeChatMenuId === chat.id ? 'opacity-100 bg-black/5 dark:bg-white/5' : 'opacity-0 group-hover/chat:opacity-100'}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {activeChatMenuId === chat.id && (
                  <div className="fixed inset-0 z-[120]" onClick={() => setActiveChatMenuId(null)}>
                    <Motion.div
                      ref={chatMenuRef}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        top: Math.min(window.innerHeight - 180, menuPosition.top),
                        left: Math.min(window.innerWidth - 200, menuPosition.left)
                      }}
                      className="absolute w-[180px] bg-white dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl shadow-2xl py-1.5 z-[130] pointer-events-auto"
                    >
                      <button type="button" className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2.5 text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5 text-[13px]">
                        <Star className="w-3.5 h-3.5 opacity-60" />
                        <span>{translate('star', 'Star')}</span>
                      </button>
                      <button type="button"
                        onClick={() => {
                          setRenameValue(chat.title);
                          setRenamingChatId(chat.id);
                          setActiveChatMenuId(null);
                          setTimeout(() => renameInputRef.current?.focus(), 50);
                        }}
                        className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2.5 text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5 text-[13px]"
                      >
                        <Pencil className="w-3.5 h-3.5 opacity-60" />
                        <span>{translate('rename', 'Rename')}</span>
                      </button>
                      <button type="button" className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2.5 text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5 text-[13px]">
                        <Layout className="w-3.5 h-3.5 opacity-60" />
                        <span>{translate('add_to_project', 'Add to project')}</span>
                      </button>
                      <div className="border-t border-[#e5e5e0] dark:border-[#2d2d2d] my-1" />
                      <button type="button"
                        onClick={async () => {
                          if (!confirm(translate('delete_chat_confirm', 'Are you sure you want to delete this chat?'))) return;
                          try {
                            await chatApi.deleteSession(chat.id);
                            setActiveChatMenuId(null);
                            onRefreshChats?.();
                            if (currentChatId === chat.id) {
                              onNewChat();
                            }
                          } catch (e) {
                            console.error('Failed to delete chat:', e);
                          }
                        }}
                        className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 text-[13px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 opacity-60" />
                        <span>{translate('delete', 'Delete')}</span>
                      </button>
                    </Motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Footer - FIXED BOTTOM */}
      <div className={`flex-shrink-0 mt-auto p-2 bg-inherit relative z-50 ${isMobile ? 'pb-8' : ''}`} ref={menuRef}>
        <AnimatePresence>
          {showProfileMenu && (
            <div className={`absolute bottom-[72px] left-2 right-2 pointer-events-none`}>
              <Motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="relative bg-white dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[14px] shadow-2xl z-[110] py-2 pointer-events-auto w-full"
              >
                <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 mb-1.5">
                  <div className="text-[13px] text-[#8e8e8e] truncate">{user?.email || 'hello@doctoringo.com'}</div>
                </div>

                <button type="button" onClick={() => { onOpenSettings('General'); setShowProfileMenu(false); }} className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-[#1a1a1a] dark:text-[#ececec] cursor-pointer group">
                  <div className="flex items-center gap-3"><Settings className="w-4 h-4 opacity-70" /> {translate('settings_general', 'General')}</div>
                </button>
                
                <div className="relative">
                  <button type="button"
                    ref={languageBtnRef}
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-[#1a1a1a] dark:text-[#ececec] cursor-pointer"
                  >
                    <div className="flex items-center gap-3"><Globe className="w-4 h-4 opacity-70" /> {translate('language', 'Language')}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#8e8e8e] font-medium">{languages.find(l => l.id === selectedLanguage)?.label.split(' ')[0] || ''}</span>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${showLanguageMenu ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {showLanguageMenu && createPortal(
                    <div
                      ref={languageMenuRef}
                      className="fixed inset-0 z-[9999]"
                      onMouseDown={() => setShowLanguageMenu(false)}
                    >
                      <Motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.8 }}
                        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          left: Math.min(
                            window.innerWidth - 230,
                            (languageBtnRef.current?.getBoundingClientRect().right ?? 260) + 8
                          ),
                          top: Math.max(10, languageBtnRef.current?.getBoundingClientRect().top ?? 100),
                        }}
                        className="w-[220px] bg-white dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl shadow-2xl py-1.5"
                      >
                        <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-1">
                          {languages.map((lang, index) => (
                            <Motion.button
                              type="button"
                              key={lang.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
                              onClick={() => {
                                setSelectedLanguage(lang.id);
                                setShowLanguageMenu(false);
                                setShowProfileMenu(false);
                                localStorage.setItem('doctoringo_language', lang.id);
                                window.dispatchEvent(new CustomEvent('language-changed', { detail: lang.id }));
                              }}
                              className={`w-[calc(100%-12px)] mx-1.5 flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-150 ${
                                selectedLanguage === lang.id
                                  ? 'text-[#033C81] font-medium bg-[#033C81]/5'
                                  : 'text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                            >
                              <span>{lang.label}</span>
                              <AnimatePresence mode="wait">
                                {selectedLanguage === lang.id && (
                                  <Motion.span
                                    key="check"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Motion.span>
                                )}
                              </AnimatePresence>
                            </Motion.button>
                          ))}
                        </div>
                      </Motion.div>
                    </div>,
                    document.body
                  )}
                </div>

                <button type="button" onClick={() => { onOpenSettings('Billing'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-[#1a1a1a] dark:text-[#ececec] cursor-pointer">
                  <CreditCard className="w-4 h-4 opacity-70" /> {translate('billing', 'Billing')}
                </button>

                <button type="button" onClick={() => { setShowProfileMenu(false); window.dispatchEvent(new CustomEvent('open-plans')); }} className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-[#1a1a1a] dark:text-[#ececec] cursor-pointer">
                  <Gift className="w-4 h-4 opacity-70" /> {translate('gift_doctoringo', 'Gift Doctoringo')}
                </button>
                
                <button type="button" onClick={() => { setShowProfileMenu(false); window.open('https://doctoringo.com', '_blank'); }} className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-[#1a1a1a] dark:text-[#ececec] cursor-pointer group">
                  <div className="flex items-center gap-3"><Info className="w-4 h-4 opacity-70" /> {translate('learn_more', 'Learn more')}</div>
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </button>
                
                <div className="h-px bg-black/5 dark:bg-white/5 my-1.5" />
                
                <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[14px] text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 opacity-70" /> {translate('logout', 'Log out')}
                </button>
              </Motion.div>
            </div>
          )}
        </AnimatePresence>

        <button type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`
            w-full flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer active:bg-black/5 dark:active:bg-white/5
            ${isCollapsed ? 'justify-center' : ''}
            hover:bg-black/5 dark:hover:bg-white/5
          `}
        >
          <div className="w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center text-white text-[14px] font-medium flex-shrink-0">
            {user?.first_name?.[0] || '?'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec] truncate">{user?.first_name || translate('user', 'User')}</div>
              <div className="text-[12px] text-[#8e8e8e] truncate w-full">
                {user?.subscription?.is_paid ? translate('pro_plan', 'Pro plan') : translate('free_plan', 'Free plan')}
              </div>
            </div>
          )}
        </button>
      </div>
    </Motion.div>
  );
}
