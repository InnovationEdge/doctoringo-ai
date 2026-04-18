import { useState, useEffect } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, ChevronDown, Check, FileText, ChevronUp, Download } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { DoctorLogo } from './DoctorLogo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'src/providers/TranslationProvider';
import { documentsApi } from '../lib/api';

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
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  thought?: string;
  thoughtDuration?: number;
  isStreaming?: boolean;
  processingSteps?: ProcessingStep[];
  title?: string;
  subtitle?: string;
  groundingSources?: GroundingSource[];
}

export function ChatMessage({ message, onRegenerate }: { message: Message; onRegenerate?: (messageId: string | number) => void }) {
  const { translate } = useTranslation();
  const [isThoughtOpen, setIsThoughtOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const [docGenerating, setDocGenerating] = useState(false);
  const [docReady, setDocReady] = useState(false);
  const [chatFont, setChatFont] = useState(() => localStorage.getItem('doctoringo_chat_font') || 'Default');

  useEffect(() => {
    const handleFontChange = () => setChatFont(localStorage.getItem('doctoringo_chat_font') || 'Default');
    window.addEventListener('knowhow-font-change', handleFontChange);
    return () => window.removeEventListener('knowhow-font-change', handleFontChange);
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const fontClass = chatFont === 'Sans' ? 'font-sans' : chatFont === 'System' ? 'font-system' : chatFont === 'Dyslexic' ? 'font-dyslexic' : 'font-serif';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = message.content;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Copy failed silently
      }
    }
    setCopied(true);
  };

  // Detect if message is a generated legal document and extract its type
  const documentType = (() => {
    if (message.role !== 'assistant' || message.isStreaming || !message.content) return null;
    if (message.content.length < 800) return null;
    const text = message.content.toLowerCase();
    const structureMarkers = ['მუხლი', 'article', 'section', 'parties:', 'მხარეები:', 'პირობები:'];
    if (!structureMarkers.some(m => text.includes(m))) return null;

    // Detect document type — return Georgian label
    const types: [string, string][] = [
      ['ხელშეკრულება', 'ხელშეკრულება'],
      ['შეთანხმება', 'შეთანხმება'],
      ['სარჩელ', 'სარჩელი'],
      ['განცხადება', 'განცხადება'],
      ['ოქმი', 'ოქმი'],
      ['დებულება', 'დებულება'],
      ['წესდება', 'წესდება'],
      ['მინდობილობა', 'მინდობილობა'],
      ['ხელწერილი', 'ხელწერილი'],
      ['agreement', 'Agreement'],
      ['contract', 'Contract'],
      ['memorandum', 'Memorandum'],
      ['petition', 'Petition'],
      ['power of attorney', 'Power of Attorney'],
    ];
    for (const [keyword, label] of types) {
      if (text.includes(keyword)) return label;
    }
    return null;
  })();
  const isDocumentResponse = documentType !== null;

  // Auto-generate DOCX when document response is detected
  useEffect(() => {
    if (!isDocumentResponse || docGenerating || docReady || generatedDocId) return;
    let cancelled = false;
    setDocGenerating(true);
    documentsApi.generateDocument({
      title: message.title || translate('doctoringo_document', 'Doctoringo Document'),
      content: message.content,
      format: 'docx',
    }).then((result) => {
      if (cancelled) return;
      if (result?.id) {
        setGeneratedDocId(result.id);
        setDocReady(true);
      }
    }).catch((e) => {
      if (cancelled) return;
      console.error('Failed to generate document:', e);
    }).finally(() => {
      if (!cancelled) setDocGenerating(false);
    });
    return () => { cancelled = true; };
  }, [isDocumentResponse]);

  const handleDownloadDocx = async () => {
    if (!generatedDocId || downloading) return;
    setDownloading(true);
    try {
      await documentsApi.downloadDocument(
        generatedDocId,
        message.title || 'document',
        'docx'
      );
    } catch (e) {
      console.error('Failed to download document:', e);
      alert(translate('download_failed', 'ჩამოტვირთვა ვერ მოხერხდა. სცადეთ თავიდან.'));
    } finally {
      setDownloading(false);
    }
  };

  if (message.role === 'user') {
    return (
      <Motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.2, 0, 0, 1]
        }}
        className="flex flex-col items-end mb-8 first:mt-4 w-full"
      >
        <div className="max-w-[92%] md:max-w-[85%] bg-[#f3f3f3] dark:bg-[#212121] text-[#1a1a1a] dark:text-[#ececec] rounded-[22px] px-4 md:px-5 py-2.5 text-[15px] md:text-[16px] leading-relaxed border border-[#e5e5e0] dark:border-[#2d2d2d] shadow-sm">
          {message.content}
        </div>
      </Motion.div>
    );
  }

  // Assistant Message Layout
  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
      className="flex flex-col mb-10 w-full"
    >
      <div className="flex items-start gap-3 md:gap-4 group w-full relative">
        {/* Avatar Logo */}
        <div className="mt-1 flex-shrink-0">
          <DoctorLogo
            className="h-5 w-5 md:h-6 md:w-6 text-[#033C81] dark:text-[#033C81]"
            isThinking={message.isStreaming}
          />
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Reasoning Block */}
          <AnimatePresence>
            {message.thought && (
              <Motion.div
                key="thought-block"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="bg-[#fcfaf7] dark:bg-[#282826]/40 border border-[#e5d8c9] dark:border-[#2d2d2d] rounded-2xl md:rounded-2xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setIsThoughtOpen(!isThoughtOpen)}
                    className="w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 text-[#676767] dark:text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec] transition-colors text-[12px] md:text-[13px] font-medium group/header"
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">{translate('thought_process', 'Thought process')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {message.thoughtDuration ? (
                        <span className="text-[10px] md:text-[11px] opacity-40 font-mono">{Math.round(message.thoughtDuration / 1000)}s</span>
                      ) : null}
                      {isThoughtOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 opacity-40 group-hover/header:opacity-100 transition-opacity" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-40 group-hover/header:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isThoughtOpen && (
                      <Motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className={`px-3 md:px-4 pb-4 md:pb-5 pt-1 text-[13px] md:text-[14px] leading-relaxed text-[#1a1a1a]/80 dark:text-[#ececec]/80 ${fontClass} prose prose-sm prose-stone dark:prose-invert max-w-none prose-a:text-[#033C81]`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => {
                                if (!href || href === '#') return <span>{children}</span>;
                                let fixedHref = href;
                                if (fixedHref && !fixedHref.startsWith('http') && !fixedHref.startsWith('/') && !fixedHref.startsWith('mailto:')) {
                                  fixedHref = 'https://' + fixedHref;
                                }
                                return <a href={fixedHref} target="_blank" rel="noopener noreferrer" className="text-[#033C81] hover:underline">{children}</a>;
                              }
                            }}
                          >
                            {message.thought}
                          </ReactMarkdown>
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Message Content */}
          {(message.content || (!message.isStreaming && !message.thought)) && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`text-[16px] md:text-[17px] text-[#1a1a1a] dark:text-[#ececec] leading-[1.6] ${fontClass} pt-0.5 prose prose-stone dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-[#033C81] prose-a:no-underline hover:prose-a:underline prose-code:bg-[#f3f3f3] dark:prose-code:bg-[#2d2d2d] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[14px] prose-pre:bg-[#1a1a1a] dark:prose-pre:bg-[#0d0d0d] prose-pre:text-[#ececec]`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    if (!href || href === '#' || href === '') {
                      return <span className="text-[#033C81]">{children}</span>;
                    }
                    let fixedHref = href;
                    if (fixedHref && !fixedHref.startsWith('http') && !fixedHref.startsWith('/') && !fixedHref.startsWith('mailto:')) {
                      fixedHref = 'https://' + fixedHref;
                    }
                    return (
                      <a
                        href={fixedHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#033C81] hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  p: ({ children }) => <p className="my-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-[#f3f3f3] dark:bg-[#2d2d2d] px-1.5 py-0.5 rounded text-[14px]" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-[#1a1a1a] dark:bg-[#0d0d0d] text-[#ececec] p-4 rounded-lg overflow-x-auto my-3">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <Motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="inline-block w-[2px] h-[16px] md:h-[18px] ml-1 bg-[#033C81] rounded-full translate-y-[3px]"
                />
              )}
            </Motion.div>
          )}

          {/* Google Search Grounding Sources */}
          {!message.isStreaming && message.groundingSources && message.groundingSources.length > 0 && (
            <Motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="mt-3 pt-3 border-t border-[#e5e5e5]/50 dark:border-[#2d2d2d]/50"
            >
              <p className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider mb-2">
                {translate('sources', 'Sources')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.groundingSources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f3f2ee] dark:bg-[#1a1a1a] border border-[#e5e5e5]/50 dark:border-[#2d2d2d] rounded-lg text-[12px] text-[#676767] dark:text-[#8e8e8e] hover:text-[#033C81] hover:border-[#033C81]/30 transition-colors truncate max-w-[280px]"
                    title={source.title}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#033C81]/15 flex items-center justify-center shrink-0 text-[9px] font-bold text-[#033C81]">{i + 1}</span>
                    <span className="truncate">{source.title || new URL(source.url).hostname}</span>
                  </a>
                ))}
              </div>
            </Motion.div>
          )}

          {/* Action Icons */}
          {!message.isStreaming && message.content && (
            <Motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-0.5 md:gap-1.5 mt-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <button
                onClick={handleCopy}
                className="p-1.5 md:p-1.5 hover:bg-black/5 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec]"
                title={translate('copy', 'Copy')}
              >
                {copied ? <Check className="w-3.5 md:w-4 h-3.5 md:h-4 text-green-500" /> : <Copy className="w-3.5 md:w-4 h-3.5 md:h-4" />}
              </button>
              <button
                onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
                className={`p-1.5 md:p-1.5 hover:bg-black/5 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors ${feedback === 'up' ? 'text-[#2f9e44]' : 'text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec]'}`}
                title={translate('good_response', 'Good response')}
              >
                <ThumbsUp className="w-3.5 md:w-4 h-3.5 md:h-4" />
              </button>
              <button
                onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
                className={`p-1.5 md:p-1.5 hover:bg-black/5 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors ${feedback === 'down' ? 'text-[#e03131]' : 'text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec]'}`}
                title={translate('bad_response', 'Bad response')}
              >
                <ThumbsDown className="w-3.5 md:w-4 h-3.5 md:h-4" />
              </button>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="p-1.5 md:p-1.5 hover:bg-black/5 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-[#ececec]"
                  title={translate('regenerate', 'Regenerate')}
                >
                  <RotateCcw className="w-3.5 md:w-4 h-3.5 md:h-4" />
                </button>
              )}
            </Motion.div>
          )}

          {/* Document Download Card */}
          {isDocumentResponse && (docGenerating || docReady) && (
            <Motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-4"
            >
              {docReady ? (
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={downloading}
                  className="flex items-center gap-3 px-4 py-3 bg-[#033C81]/10 border border-[#033C81]/30 rounded-xl hover:bg-[#033C81]/15 transition-colors group w-full md:w-auto disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#033C81]/20 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#033C81]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[13px] font-medium text-[#033C81]">
                      {downloading ? translate('downloading', 'ჩამოიტვირთება...') : documentType}
                    </p>
                    <p className="text-[11px] text-[#033C81]/70">.docx — {downloading ? translate('please_wait', 'მოიცადეთ...') : translate('click_to_download', 'დააჭირე ჩამოსატვირთად')}</p>
                  </div>
                  <Download size={16} className={`text-[#033C81] shrink-0 ${downloading ? 'animate-bounce' : ''}`} />
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl w-full md:w-auto">
                  <div className="w-9 h-9 rounded-lg bg-[#f3f2ee] dark:bg-[#2d2d2d] flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#8e8e8e] animate-pulse" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[13px] font-medium text-[#8e8e8e]">{translate('preparing_document', 'დოკუმენტი მზადდება...')}</p>
                    <p className="text-[11px] text-[#b0b0b0]">.docx — Times New Roman</p>
                  </div>
                </div>
              )}
            </Motion.div>
          )}
        </div>
      </div>
    </Motion.div>

  );
}
