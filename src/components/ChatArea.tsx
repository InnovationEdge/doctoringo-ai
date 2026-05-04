import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUp, ChevronDown, Square, Ghost, X, Check, Share2, Stethoscope, Calendar, Heart, Apple, Brain, FileText, Trash2, Pencil, AlignLeft, Menu, Zap } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ShareModal } from './ShareModal';
import { DoctorLogo } from './DoctorLogo';
import { chatApi, getCountryCode } from '../lib/api';
import { useTranslation } from 'src/providers/TranslationProvider';

const Motion = motion;

interface ProcessingStep {
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
  type?: 'text' | 'file';
}

interface GroundingSource {
  title: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thought?: string;
  thoughtDuration?: number;
  isStreaming?: boolean;
  processingSteps?: ProcessingStep[];
  title?: string;
  subtitle?: string;
  groundingSources?: GroundingSource[];
}

const modelIds = [
  { id: 'premium', nameKey: 'model_medical_pro', defaultName: 'Medical Pro', descKey: 'model_pro_desc', defaultDesc: 'Most capable for complex consultations' },
  { id: 'standard', nameKey: 'model_medical_basic', defaultName: 'Medical Basic', descKey: 'model_basic_desc', defaultDesc: 'Best for everyday health questions' },
];

const quickActionDefs = [
  { icon: Stethoscope, key: 'quick_symptoms', defaultLabel: 'Symptoms' },
  { icon: Calendar, key: 'quick_appointments', defaultLabel: 'Appointments' },
  { icon: Heart, key: 'quick_health_history', defaultLabel: 'Health History' },
  { icon: Apple, key: 'quick_nutrition', defaultLabel: 'Nutrition' },
  { icon: Brain, key: 'quick_mind_session', defaultLabel: 'Mind Session' },
];

export function ChatArea({ 
  chatId, 
  chatTitle, 
  isSidebarCollapsed, 
  isIncognito, 
  setIsIncognito,
  onOpenMobileMenu,
  user
}: { 
  chatId: string | null; 
  chatTitle?: string | null; 
  isSidebarCollapsed: boolean; 
  isIncognito: boolean;
  setIsIncognito: (val: boolean) => void;
  onOpenMobileMenu?: () => void;
  user?: any;
}) {
  const { translate } = useTranslation();

  const models = useMemo(() => modelIds.map(m => ({
    id: m.id,
    name: translate(m.nameKey, m.defaultName),
    shortName: translate(m.nameKey, m.defaultName),
    description: translate(m.descKey, m.defaultDesc),
  })), [translate]);

  const quickActions = quickActionDefs.map(a => ({
    icon: a.icon,
    label: translate(a.key, a.defaultLabel),
  }));

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Load saved model preference from localStorage
    try {
      const saved = localStorage.getItem('doctoringo_preferred_model');
      if (saved) {
        const found = modelIds.find(m => m.id === saved);
        if (found) return { id: found.id, name: found.defaultName, shortName: found.defaultName, description: found.defaultDesc };
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return { id: modelIds[1].id, name: modelIds[1].defaultName, shortName: modelIds[1].defaultName, description: modelIds[1].defaultDesc };
  });

  // Derive translated display for the currently selected model
  const currentModelDisplay = models.find(m => m.id === selectedModel.id) || models[0];

  // Sync model selection with subscription status
  const isPaidUser = user?.subscription?.is_paid === true;
  useEffect(() => {
    if (!isPaidUser && selectedModel.id === 'premium') {
      setSelectedModel(models[1]); // Downgrade to Basic
    }
    if (isPaidUser && selectedModel.id !== 'premium') {
      setSelectedModel(models[0]); // Upgrade to Legal Pro
    }
  }, [isPaidUser, models, selectedModel.id]);

  const handleModelSelect = (m: typeof models[0]) => {
    if (m.id === 'premium' && !isPaidUser) {
      setShowModelDropdown(false);
      window.dispatchEvent(new CustomEvent('open-plans'));
      return;
    }
    setSelectedModel(m);
    setShowModelDropdown(false);
  };
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(chatId);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getGreeting = () => {
    const greetings = [
      translate('greeting_how_feeling', 'How are you feeling today?'),
      translate('greeting_something_bothering', 'Is something bothering you?'),
      translate('greeting_describe_symptoms', 'Describe your symptoms'),
      translate('greeting_here_to_help', 'Here to help with your health'),
      translate('greeting_health_check', 'Ready for your health check'),
    ];
    // Use hour to pick a greeting deterministically (so it doesn't change on re-render)
    const hour = new Date().getHours();
    return greetings[hour % greetings.length];
  };

  const greeting = getGreeting();
  const firstName = user?.first_name || '';

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save model preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('doctoringo_preferred_model', selectedModel.id);
    } catch (e) {
      // ignore localStorage errors
    }
  }, [selectedModel.id]);

  const isDesktop = windowWidth > 768;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  const landingDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await chatApi.uploadFile(file, activeSessionId || undefined);
      if (response?.file?.id) {
        setUploadedFileId(response.file.id);
        setUploadedFileName(file.name);
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      const errorMsg = error?.data?.error || error?.message || '';
      if (errorMsg.includes('size') || errorMsg.includes('large')) {
        alert(translate('file_too_large', 'File is too large. Maximum size is 10MB.'));
      } else if (errorMsg.includes('type') || errorMsg.includes('format')) {
        alert(translate('file_type_error', 'Unsupported file type. Please use PDF, DOCX, TXT, or image files.'));
      } else {
        alert(translate('file_upload_failed', 'File upload failed. Please try again.'));
      }
    }

    // Reset file input element
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle chat rename
  const handleRename = async () => {
    if (!activeSessionId || !renameValue.trim()) return;
    try {
      await chatApi.renameSession(activeSessionId, renameValue.trim());
      setShowRenameInput(false);
      setShowTitleDropdown(false);
      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent('refresh-sessions'));
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Handle chat delete
  const handleDelete = async () => {
    if (!activeSessionId) return;
    try {
      await chatApi.deleteSession(activeSessionId);
      setShowDeleteConfirm(false);
      setShowTitleDropdown(false);
      // Navigate to home/new chat
      window.dispatchEvent(new CustomEvent('chat-deleted', { detail: { sessionId: activeSessionId } }));
      setActiveSessionId(null);
      setMessages([]);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (landingDropdownRef.current && !landingDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
        setShowTitleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveSessionId(chatId);
    if (chatId) {
      let cancelled = false;
      const loadHistory = async () => {
        try {
          const history = await chatApi.getSessionHistory(chatId);
          if (cancelled) return;
          if (Array.isArray(history)) {
            setMessages(history.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp),
            })));
          }
        } catch (error: any) {
          if (cancelled) return;
          // Show error as a system message so user knows what happened
          setMessages([{
            id: 'error',
            role: 'assistant',
            content: error?.status === 404
              ? translate('error_not_found', 'This conversation could not be found. It may have been deleted.')
              : translate('error_loading_history', 'Failed to load conversation history. Please try again.'),
            timestamp: new Date(),
          }]);
        }
      };
      loadHistory();
      return () => { cancelled = true; };
    } else if (!isIncognito) {
      setMessages([]);
    }
  }, [chatId, isIncognito]);

  // Cleanup: abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping || isStreaming) return;

    let sessionId = activeSessionId;
    const sentContent = content.trim();
    const fileId = uploadedFileId;
    setUploadedFileId(null);
    setUploadedFileName(null);

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    // Track if this is the first message (new session)
    let isFirstMessage = false;

    if (!sessionId && !isIncognito) {
      try {
        const session = await chatApi.createSession(sentContent.substring(0, 30));
        sessionId = session.id;
        setActiveSessionId(sessionId);
        isFirstMessage = true;
        window.dispatchEvent(new CustomEvent('new-chat-started'));
      } catch (error: any) {
        console.error('Failed to create session:', error);
        // Restore the user's input so they don't lose their message
        setInput(sentContent);
        // Show error as a temporary message
        setMessages([{
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: error?.status === 401 || error?.status === 403
            ? translate('error_session_expired', 'Session expired. Please refresh the page and log in again.')
            : translate('error_start_chat', 'Failed to start a new chat. Please check your connection and try again.'),
          timestamp: new Date(),
        }]);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sentContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    let assistantId: string | null = null;

    try {
      assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        // Don't show "Thinking..." placeholder - only show when actual thinking content comes from backend (Premium only)
        thought: undefined,
        processingSteps: []
      };

      setMessages(prev => [...prev, assistantMessage]);

      abortControllerRef.current = new AbortController();
      const response = await chatApi.sendMessageStream({
        sessionId: sessionId || null,
        message: sentContent,
        model_tier: selectedModel.id as any,
        signal: abortControllerRef.current.signal,
      });

      setIsTyping(false);
      setIsStreaming(true);

      if (!response.body) {
        throw new Error('No response body received from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let thinkingContent = '';
      let thinkingStartTime: number | null = null;
      let thinkingDuration: number | null = null;

      let wordQueue: string[] = [];
      let isProcessingQueue = false;
      let queueDrainResolve: (() => void) | null = null;

      const waitForQueueDrain = () => new Promise<void>(resolve => {
        if (wordQueue.length === 0 && !isProcessingQueue) {
          resolve();
        } else {
          queueDrainResolve = resolve;
        }
      });

      const processQueue = async () => {
        if (isProcessingQueue) return;
        isProcessingQueue = true;

        while (wordQueue.length > 0) {
          const word = wordQueue.shift();
          if (word !== undefined) {
            assistantContent += word;
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: assistantContent, thought: thinkingContent || undefined } : m
            ));
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        isProcessingQueue = false;
        if (queueDrainResolve) {
          queueDrainResolve();
          queueDrainResolve = null;
        }
      };

      let streamEnded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle thinking content from AI
              if (data.thinking) {
                if (!thinkingStartTime) thinkingStartTime = Date.now();
                thinkingContent += data.thinking;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, thought: thinkingContent } : m
                ));
              }

              // Handle regular content
              if (data.content) {
                // Calculate thinking duration on first content chunk
                if (thinkingStartTime && !thinkingDuration) {
                  thinkingDuration = Date.now() - thinkingStartTime;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, thoughtDuration: thinkingDuration! } : m
                  ));
                }
                const words = data.content.split(/(?<=\s)/);
                wordQueue.push(...words);
                processQueue();
              }

              // Handle grounding sources from Google Search
              if (data.grounding_sources) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, groundingSources: data.grounding_sources } : m
                ));
              }

              // Handle error from backend
              if (data.error) {
                console.error("Backend error:", data.error);
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: `Error: ${data.error}`, isStreaming: false, thought: undefined }
                    : m
                ));
                stopStreaming();
                streamEnded = true;
              }
            } catch (e) {
              // Ignore parse errors
            }
          } else if (line === 'data: [DONE]') {
            await waitForQueueDrain();
            stopStreaming();
            streamEnded = true;

            // If this was the first message, trigger chat history refresh after a delay
            // to show the newly generated title from backend
            if (isFirstMessage) {
              setTimeout(() => {
                window.dispatchEvent(new Event('chat-title-updated'));
              }, 2000);
            }
          }
        }
      }

      // Safety: if stream ended without [DONE] signal, ensure state is reset
      if (!streamEnded) {
        // Wait for any remaining words in the queue
        while(wordQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        stopStreaming();
        if (isFirstMessage) {
          setTimeout(() => {
            window.dispatchEvent(new Event('chat-title-updated'));
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Failed to send message:", error?.message);
      setIsTyping(false);
      setIsStreaming(false);

      // Show error message to user
      if (error?.name !== 'AbortError' && assistantId) {
        let errorMessage = translate('error_failed_response', 'Failed to get response. Please try again.');

        if (error?.status === 503) {
          errorMessage = translate('error_ai_unavailable', 'AI service is temporarily unavailable. Please try again later.');
        } else if (error?.status === 401 || error?.status === 403) {
          errorMessage = user?.id === 'guest'
            ? translate('error_try_again', 'Something went wrong. Please try again.')
            : translate('error_session_expired', 'Session expired. Please refresh the page and log in again.');
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.data?.error) {
          errorMessage = error.data.error;
        }

        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${errorMessage}`, isStreaming: false, thought: undefined }
            : m
        ));
      }
    }
  };

  const mainLandingContent = (
    <div className={`flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-20`}>
      <div className="w-full max-w-[800px] flex flex-col items-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-10 text-center">
            <div 
              onMouseEnter={() => setIsLogoHovered(true)} 
              onMouseLeave={() => setIsLogoHovered(false)}
              className="cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 flex-shrink-0"
            >
              <DoctorLogo className="h-20 w-20 md:h-28 md:w-28 text-[#033C81] dark:text-[#033C81]" isThinking={isLogoHovered || isTyping || isStreaming} />
            </div>
            <h1 className="text-[26px] md:text-[48px] font-serif tracking-tight text-[#1a1a1a] dark:text-[#ececec] leading-tight font-medium opacity-90 select-none">
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
          </div>

        <div className="w-full max-w-[800px] bg-white dark:bg-[#212121] rounded-[22px] md:rounded-[28px] border border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col p-0.5 md:p-1.5 mb-4 md:mb-6 shadow-xl dark:shadow-2xl pointer-events-auto relative z-40">
          <div className="px-3 py-1.5 md:px-4 md:pt-4 md:pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }}
              placeholder={translate('chat_placeholder', 'Describe your symptoms...')}
              className="w-full bg-transparent text-[#161616] dark:text-[#ececec] placeholder:text-[#8e8e8e] resize-none outline-none text-[15px] md:text-[16px] leading-relaxed min-h-[38px] md:min-h-[44px]"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between px-2 pb-1.5 md:px-3 md:pb-3">
            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/5 rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-5 md:w-5.5 h-5 md:h-5.5" />
              </button>
              {uploadedFileName && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f3f3f3] dark:bg-[#2a2a2a] rounded-lg text-[12px] text-[#1a1a1a] dark:text-[#ececec] max-w-[180px]">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#033C81]" />
                  <span className="truncate">{uploadedFileName}</span>
                  <button type="button" onClick={() => { setUploadedFileId(null); setUploadedFileName(null); }} className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative" ref={landingDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 px-2 md:px-3 py-1 bg-black/5 dark:bg-white/5 md:bg-transparent hover:bg-black/5 dark:hover:bg-[#3d3d3b] text-[#676767] dark:text-[#ececec] rounded-lg text-[11px] md:text-[14px] font-medium transition-all active:scale-95 cursor-pointer"
                >
                  <span className="truncate max-w-[85px] md:max-w-none">{currentModelDisplay.name}</span>
                  <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 opacity-60 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showModelDropdown && (
                    <Motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-3 w-[260px] md:w-[280px] bg-white dark:bg-[#1b1b19] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-2xl shadow-2xl z-[70] py-1.5 overflow-hidden pointer-events-auto"
                    >
                      {models.map(m => {
                        const isLocked = m.id === 'premium' && !isPaidUser;
                        return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={(e) => { e.stopPropagation(); handleModelSelect(m); }}
                          className={`w-[calc(100%-12px)] mx-1.5 text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer ${isLocked ? 'opacity-60' : ''} ${selectedModel.id === m.id ? 'bg-[#f3f3f3] dark:bg-[#2f2f2d]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[13px] md:text-[14px] font-medium ${selectedModel.id === m.id ? 'text-black dark:text-white' : 'text-[#1a1a1a] dark:text-[#ececec]'}`}>{m.name}{isLocked && translate('model_upgrade_suffix', ' — Upgrade')}</span>
                            <span className="text-[11px] md:text-[12px] text-[#8e8e8e] leading-tight">{m.description}</span>
                          </div>
                          {selectedModel.id === m.id && <Check className="w-4 h-4 text-[#73a7ff]" />}
                        </button>
                        );
                      })}
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage(input)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 cursor-pointer ${input.trim() ? 'bg-[#033C81] text-white shadow-lg' : 'bg-[#f3f3f3] dark:bg-[#2a2a2a] text-[#aaa] dark:text-[#555]'}`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide flex items-center justify-center gap-2.5 px-4 mt-2 pb-2">
          <div className="flex items-center gap-2.5 min-w-max">
            {quickActions.map((action, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleSendMessage(action.label)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-[#212121]/50 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] md:text-[14px] text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/5 transition-all cursor-pointer whitespace-nowrap shadow-sm group"
              >
                <action.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#8e8e8e] group-hover:text-[#033C81] transition-colors" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const incognitoLandingContent = (
    <div className={`flex-1 flex flex-col items-center justify-center px-4 md:px-8 bg-[#fcfcf9] dark:bg-[#1f1f1d] rounded-[24px] m-2 md:m-3 mt-0 border border-black/10 dark:border-[#e5e5e0]/20 shadow-inner relative z-10 overflow-hidden`}>
      <div className="w-full max-w-[800px] flex flex-col items-center relative z-20">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5 mb-8 md:mb-12 text-center">
          <div className="flex-shrink-0">
             <DoctorLogo className="h-20 w-20 md:h-28 md:w-28 text-[#033C81] dark:text-[#033C81]" isThinking={isTyping || isStreaming} />
          </div>
          <h1 className="text-[26px] md:text-[48px] font-serif tracking-tight text-[#1a1a1a] dark:text-[#ececec] leading-tight font-medium opacity-90 select-none">
            {translate('incognito_greeting', 'Greetings, whoever you are')}
          </h1>
        </div>

        <div className="w-full max-w-[800px] bg-white dark:bg-[#212121] rounded-[22px] md:rounded-[28px] border border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col p-0.5 md:p-1.5 mb-4 md:mb-6 shadow-xl dark:shadow-2xl pointer-events-auto relative z-40">
          <div className="px-3 py-1.5 md:px-4 md:pt-4 md:pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }}
              placeholder={translate('chat_placeholder', 'Describe your symptoms...')}
              className="w-full bg-transparent text-[#161616] dark:text-[#ececec] placeholder:text-[#8e8e8e] resize-none outline-none text-[15px] md:text-[16px] leading-relaxed min-h-[38px] md:min-h-[44px]"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between px-2 pb-1.5 md:px-3 md:pb-3">
            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/5 rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-5 md:w-5.5 h-5 md:h-5.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 px-2 md:px-3 py-1 bg-black/5 dark:bg-white/5 md:bg-transparent hover:bg-black/5 dark:hover:bg-[#3d3d3b] text-[#676767] dark:text-[#ececec] rounded-lg text-[11px] md:text-[14px] font-medium transition-all active:scale-95 cursor-pointer"
                >
                  <span className="truncate max-w-[85px] md:max-w-none">{currentModelDisplay.name}</span>
                  <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 opacity-60 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showModelDropdown && (
                    <Motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-3 w-[260px] md:w-[280px] bg-white dark:bg-[#1b1b19] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-2xl shadow-2xl z-[70] py-1.5 overflow-hidden pointer-events-auto"
                    >
                      {models.map(m => {
                        const isLocked = m.id === 'premium' && !isPaidUser;
                        return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={(e) => { e.stopPropagation(); handleModelSelect(m); }}
                          className={`w-[calc(100%-12px)] mx-1.5 text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer ${isLocked ? 'opacity-60' : ''} ${selectedModel.id === m.id ? 'bg-[#f3f3f3] dark:bg-[#2f2f2d]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[13px] md:text-[14px] font-medium ${selectedModel.id === m.id ? 'text-black dark:text-white' : 'text-[#1a1a1a] dark:text-[#ececec]'}`}>{m.name}{isLocked && translate('model_upgrade_suffix', ' — Upgrade')}</span>
                            <span className="text-[11px] md:text-[12px] text-[#8e8e8e] leading-tight">{m.description}</span>
                          </div>
                          {selectedModel.id === m.id && <Check className="w-4 h-4 text-[#73a7ff]" />}
                        </button>
                        );
                      })}
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage(input)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 cursor-pointer ${input.trim() ? 'bg-[#033C81] text-white shadow-lg' : 'bg-[#f3f3f3] dark:bg-[#2a2a2a] text-[#aaa] dark:text-[#555]'}`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide flex items-center justify-center gap-2.5 px-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-max">
            {quickActions.map((action, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleSendMessage(action.label)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-[#212121]/50 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] md:text-[14px] text-[#1a1a1a] dark:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/5 transition-all cursor-pointer whitespace-nowrap shadow-sm group"
              >
                <action.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#8e8e8e] group-hover:text-[#033C81] transition-colors" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-[#676767] dark:text-[#8e8e8e] text-[11px] md:text-[13px] leading-relaxed max-w-[500px] mt-6 md:mt-8 mb-4">
          {translate('incognito_disclaimer', "Incognito chats aren't saved, added to memory, or used to train models.")} <br />
          <button type="button" onClick={() => window.open('https://doctoringo.com/privacy-policy', '_blank')} className="underline hover:text-[#1a1a1a] dark:hover:text-[#ececec] transition-colors cursor-pointer">{translate('learn_more', 'Learn more')}</button> {translate('incognito_learn_more_data', 'about how your data is used.')}
        </div>
      </div>
    </div>

  );

  return (
    <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isIncognito ? 'bg-[#171717]' : 'bg-white dark:bg-[#171717]'} transition-colors duration-400`}>
      {/* Global file input — accessible from all views */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
      <AnimatePresence mode="wait">
        {messages.length === 0 ? (
          isIncognito ? (
            <Motion.div 
              key="incognito-landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col bg-[#171717] h-screen overflow-hidden"
            >
              <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-black z-50">
                <div className="flex items-center gap-3 text-white font-medium">
                  <Ghost className="w-5 h-5 text-[#8e8e8e]" />
                  <span className="text-[14px] md:text-[15px] font-serif italic">{translate('incognito_workspace', 'Incognito Workspace')}</span>
                </div>
                <button 
                  onClick={() => setIsIncognito(false)}
                  className="p-1.5 text-[#8e8e8e] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {incognitoLandingContent}
              </div>
            </Motion.div>
          ) : (
            <Motion.div
              key="main-landing"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex-1 flex flex-col bg-white dark:bg-[#171717] relative overflow-hidden h-screen w-full`}
            >
              <div className="h-14 flex-shrink-0 flex items-center justify-between px-5 z-20 md:px-6">
                 <div className="md:hidden">
                    <button
                      type="button"
                      onClick={onOpenMobileMenu}
                      className="p-2 -ml-2 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                 </div>
                 <div className="flex-1 hidden md:block" />
                 <div className="flex items-center gap-2 md:gap-3">
                    {!user?.subscription?.is_paid && (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-plans'))}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #033C81 0%, #c47a58 100%)' }}
                      >
                        <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" fill="currentColor" />
                        <span className="hidden sm:inline">{translate('upgrade', 'Upgrade')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsIncognito(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors active:scale-95 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[14px] font-medium group cursor-pointer"
                    >
                      <Ghost className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="hidden md:inline">{translate('incognito', 'Incognito')}</span>
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {mainLandingContent}
              </div>
            </Motion.div>
          )
        ) : (
          <Motion.div
            key="chat-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-[#171717] w-full`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 z-20 ${isIncognito ? 'bg-black text-white border-b border-white/10' : 'border-b border-black/5 dark:border-white/5'}`}>
              <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                {!isIncognito && (
                  <button
                    type="button"
                    onClick={onOpenMobileMenu}
                    className="md:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#212121] rounded-full shadow-sm border border-[#f0f0f0] dark:border-[#2d2d2d] active:scale-95 transition-all cursor-pointer"
                  >
                    <AlignLeft className="w-4 h-4 text-[#1a1a1a] dark:text-[#ececec]" />
                  </button>
                )}
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                  {isIncognito ? <Ghost className="w-4.5 h-4.5 text-[#8e8e8e]" /> : (!isDesktop && <DoctorLogo className="h-5 w-5 text-[#033C81] dark:text-[#033C81]" isThinking={isTyping || isStreaming} />)}
                  <div className="relative overflow-hidden" ref={titleDropdownRef}>
                    <button 
                      onClick={() => !isIncognito && setShowTitleDropdown(!showTitleDropdown)}
                      className={`flex items-center gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-xl transition-colors min-w-0 cursor-pointer ${!isIncognito ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''} ${showTitleDropdown ? 'bg-black/5 dark:bg-white/5' : ''}`}
                    >
                      <span className={`text-[14px] md:text-[15px] font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-[400px] ${isIncognito ? 'text-white' : 'text-[#1a1a1a] dark:text-[#ececec]'}`}>
                        {isIncognito ? translate('incognito_session', 'Incognito Session') : (chatTitle || translate('new_legal_discussion', 'New Legal Discussion'))}
                      </span>
                      {!isIncognito && <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 text-[#8e8e8e] opacity-60 flex-shrink-0 transition-transform ${showTitleDropdown ? 'rotate-180' : ''}`} />}
                    </button>

                    <AnimatePresence>
                      {showTitleDropdown && !isIncognito && (
                        <Motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-[220px] bg-white dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-2xl shadow-2xl z-[70] py-1.5 overflow-hidden pointer-events-auto"
                        >
                          {/* Rename Input */}
                          {showRenameInput ? (
                            <div className="px-3 py-2">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                placeholder={translate('rename_placeholder', 'New name...')}
                                className="w-full px-2 py-1.5 text-[14px] bg-[#f5f5f5] dark:bg-[#2d2d2d] border border-[#e5e5e0] dark:border-[#3d3d3d] rounded-lg outline-none focus:border-[#033C81]"
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button type="button" onClick={handleRename} className="flex-1 py-1.5 bg-[#033C81] text-white text-[12px] rounded-lg hover:bg-[#c47d5c]">{translate('save', 'Save')}</button>
                                <button type="button" onClick={() => setShowRenameInput(false)} className="flex-1 py-1.5 bg-[#e5e5e0] dark:bg-[#3d3d3d] text-[#1a1a1a] dark:text-white text-[12px] rounded-lg">{translate('cancel', 'Cancel')}</button>
                              </div>
                            </div>
                          ) : showDeleteConfirm ? (
                            /* Delete Confirmation */
                            <div className="px-3 py-2">
                              <p className="text-[13px] text-[#1a1a1a] dark:text-[#ececec] mb-3">{translate('delete_this_chat', 'Delete this chat?')}</p>
                              <div className="flex gap-2">
                                <button type="button" onClick={handleDelete} className="flex-1 py-1.5 bg-red-500 text-white text-[12px] rounded-lg hover:bg-red-600">{translate('delete', 'Delete')}</button>
                                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-[#e5e5e0] dark:bg-[#3d3d3d] text-[#1a1a1a] dark:text-white text-[12px] rounded-lg">{translate('cancel', 'Cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            /* Normal Menu */
                            <>
                              <button
                                type="button"
                                onClick={() => { setRenameValue(chatTitle || ''); setShowRenameInput(true); }}
                                className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-[#1a1a1a] dark:text-[#ececec] text-[14px] cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 opacity-70" />
                                <span>{translate('rename', 'Rename')}</span>
                              </button>
                              <div className="border-t border-[#e5e5e0] dark:border-[#2d2d2d] my-1.5" />
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full text-left px-3 py-2 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-500 text-[14px] cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 opacity-70" />
                                <span>{translate('delete', 'Delete')}</span>
                              </button>
                            </>
                          )}
                        </Motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isIncognito && !user?.subscription?.is_paid && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-plans'))}
                    className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #033C81 0%, #c47a58 100%)' }}
                  >
                    <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" fill="currentColor" />
                    <span className="hidden sm:inline">{translate('upgrade', 'Upgrade')}</span>
                  </button>
                )}
                {isIncognito ? (
                  <button
                    onClick={() => setIsIncognito(false)}
                    className="p-1.5 text-[#8e8e8e] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-1.5 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors cursor-pointer"
                    title={translate('share', 'Share')}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Content */}
            <div className={`flex-1 overflow-y-auto relative flex flex-col items-center pb-40 md:pb-48 scrollbar-hide`}>
              <div className={`w-full max-w-[800px] px-4 md:px-0 pt-6 md:pt-4`}>
                <AnimatePresence>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Wrapper */}
            <Motion.div 
              className="fixed bottom-0 left-0 right-0 p-3 md:p-8 flex flex-col items-center z-30 pointer-events-none" 
              initial={false}
              animate={{ 
                paddingLeft: !isSidebarCollapsed && !isIncognito && isDesktop ? 260 : (isSidebarCollapsed && !isIncognito && isDesktop ? 72 : 0) 
              }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              <div className={`w-full max-w-[800px] bg-white dark:bg-[#212121] rounded-[22px] md:rounded-[28px] border border-[#e5e5e0] dark:border-[#2d2d2d] shadow-2xl flex flex-col p-0.5 md:p-1.5 pointer-events-auto relative z-40 transition-shadow duration-300 focus-within:shadow-xl`}>
                <div className="px-3 py-1.5 md:px-4 md:pt-4 md:pb-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }}
                    placeholder={translate('reply_placeholder', 'Reply...')}
                    className="w-full bg-transparent text-[#161616] dark:text-[#ececec] placeholder:text-[#8e8e8e] resize-none outline-none text-[15px] md:text-[16px] leading-relaxed min-h-[38px] md:min-h-[44px]"
                    rows={1}
                  />
                </div>
                
                <div className="flex items-center justify-between px-2 pb-1.5 md:px-3 md:pb-3">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {uploadedFileName && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f3f3f3] dark:bg-[#2a2a2a] rounded-lg text-[11px] text-[#1a1a1a] dark:text-[#ececec] max-w-[140px]">
                        <FileText className="w-3 h-3 flex-shrink-0 text-[#033C81]" />
                        <span className="truncate">{uploadedFileName}</span>
                        <button type="button" onClick={() => { setUploadedFileId(null); setUploadedFileName(null); }} className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1 px-1.5 md:px-3 py-1 bg-black/5 dark:bg-white/5 md:bg-[#f3f3f3] md:dark:bg-[#2f2f2d] hover:bg-black/10 dark:hover:bg-white/10 md:hover:bg-[#e8e8e8] md:dark:hover:bg-[#3d3d3b] text-[#1a1a1a] dark:text-[#ececec] rounded-lg text-[11px] md:text-[13px] font-medium transition-all cursor-pointer"
                      >
                        <span className="truncate max-w-[80px] md:max-w-none">{currentModelDisplay.name}</span>
                        <ChevronDown className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 opacity-60 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showModelDropdown && (
                          <Motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-3 w-[280px] bg-white dark:bg-[#1b1b19] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-2xl shadow-2xl z-[70] py-1.5 overflow-hidden pointer-events-auto"
                          >
                            {models.map(m => {
                              const isLocked = m.id === 'premium' && !isPaidUser;
                              return (
                              <button
                                type="button"
                                key={m.id}
                                onClick={(e) => { e.stopPropagation(); handleModelSelect(m); }}
                                className={`w-[calc(100%-12px)] mx-1.5 text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer ${isLocked ? 'opacity-60' : ''} ${selectedModel.id === m.id ? 'bg-[#f3f3f3] dark:bg-[#2f2f2d]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className={`text-[14px] font-medium ${selectedModel.id === m.id ? 'text-black dark:text-white' : 'text-[#1a1a1a] dark:text-[#ececec]'}`}>{m.name}{isLocked && translate('model_upgrade_suffix', ' — Upgrade')}</span>
                                  <span className="text-[12px] text-[#8e8e8e] leading-tight">{m.description}</span>
                                </div>
                                {selectedModel.id === m.id && <Check className="w-4 h-4 text-[#73a7ff]" />}
                              </button>
                              );
                            })}
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {isStreaming ? (
                      <button
                        type="button"
                        onClick={stopStreaming}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black transition-all active:scale-90 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendMessage(input)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 cursor-pointer ${input.trim() ? 'bg-[#033C81] text-white shadow-md' : 'bg-[#f3f3f3] dark:bg-[#2a2a2a] text-[#aaa] dark:text-[#555]'}`}
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        chatTitle={messages.find(m => m.role === 'user')?.content?.slice(0, 50)}
        sessionId={activeSessionId}
      />
    </div>
  );
}
