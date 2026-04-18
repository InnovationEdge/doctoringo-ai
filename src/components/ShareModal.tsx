import { X, Lock, Globe, Check, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { chatApi } from 'src/lib/api';
import { useTranslation } from 'src/providers/TranslationProvider';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle?: string;
  sessionId: string | null;
}

export function ShareModal({ isOpen, onClose, chatTitle, sessionId }: ShareModalProps) {
  const { translate } = useTranslation();
  const [accessType, setAccessType] = useState<'private' | 'public'>('private');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  const handleCreateLink = async () => {
    if (!sessionId) {
      setError(translate('no_chat_to_share', 'No chat selected to share.'));
      return;
    }

    setIsCreatingLink(true);
    setError(null);
    try {
      const response = await chatApi.shareSession(sessionId);
      if (response.success && response.share_url) {
        setShareLink(response.share_url);
        setAccessType('public');
      } else {
        setError(response.error || translate('failed_share_link', 'Failed to create share link.'));
      }
    } catch (err: any) {
      setError(err.message || translate('failed_share_link', 'Failed to create share link.'));
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!sessionId) return;
    if (!confirm(translate('revoke_share_confirm', 'Are you sure you want to revoke this share link? Anyone with the link will lose access.'))) return;

    try {
      await chatApi.revokeShare(sessionId);
      setShareLink(null);
      setAccessType('private');
    } catch (err: any) {
      setError(err.message || translate('failed_revoke_share', 'Failed to revoke share link.'));
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    
  };

  const handleClose = () => {
    setShareLink(null);
    setError(null);
    setAccessType('private');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1d1d1b] border border-[#e5e5e5] dark:border-[#2d2d2d] rounded-[24px] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 p-1.5 hover:bg-[#f3f3f3] dark:hover:bg-[#2d2d2d] rounded-lg transition-colors text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold text-[#1a1a1a] dark:text-[#ececec] mb-1">{translate('share_chat', 'Share chat')}</h2>
          <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e]">{translate('share_only_until_now', 'Only messages up until now will be shared')}</p>
        </div>

        {/* Access Options */}
        <div className="space-y-2 mb-6">
          <button
            type="button"
            onClick={() => {
              if (shareLink) {
                handleRevokeShare();
              } else {
                setAccessType('private');
              }
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              accessType === 'private'
                ? 'bg-[#f3f3f3] dark:bg-[#2d2d2d]/30 border-[#e5e5e5] dark:border-[#3d3d3d]'
                : 'bg-transparent border-transparent hover:bg-[#f3f3f3] dark:hover:bg-[#2d2d2d]/20'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#f3f3f3] dark:bg-[#2d2d2d] flex items-center justify-center text-[#676767] dark:text-[#8e8e8e]">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{translate('private', 'Private')}</div>
              <div className="text-[12px] text-[#676767] dark:text-[#8e8e8e]">{translate('only_you_access', 'Only you have access')}</div>
            </div>
            {accessType === 'private' && (
              <Check className="w-4 h-4 text-[#5c7cfa]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!shareLink) {
                handleCreateLink();
              } else {
                setAccessType('public');
              }
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              accessType === 'public'
                ? 'bg-[#f3f3f3] dark:bg-[#2d2d2d]/30 border-[#e5e5e5] dark:border-[#3d3d3d]'
                : 'bg-transparent border-transparent hover:bg-[#f3f3f3] dark:hover:bg-[#2d2d2d]/20'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#f3f3f3] dark:bg-[#2d2d2d] flex items-center justify-center text-[#676767] dark:text-[#8e8e8e]">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{translate('public_access', 'Public access')}</div>
              <div className="text-[12px] text-[#676767] dark:text-[#8e8e8e]">{translate('anyone_with_link', 'Anyone with the link can view')}</div>
            </div>
            {accessType === 'public' && (
              <Check className="w-4 h-4 text-[#5c7cfa]" />
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed mb-6">
          {translate('share_disclaimer', "Don't share personal information or third-party content without permission, and see our")}{' '}
          <a href="https://doctoringo.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-black dark:hover:text-white transition-colors">{translate('usage_policy', 'Usage Policy')}</a>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[12px] text-center">
            {error}
          </div>
        )}

        {/* Actions */}
        {shareLink ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-[#fcfcf9] dark:bg-[#121212] border border-[#e5e5e5] dark:border-[#2d2d2d] rounded-xl">
              <input 
                readOnly 
                value={shareLink} 
                className="bg-transparent text-[13px] text-[#676767] dark:text-[#8e8e8e] flex-1 outline-none overflow-hidden text-ellipsis whitespace-nowrap"
              />
              <button type="button"
                onClick={handleCopyLink}
                className={`text-[12px] font-medium transition-colors ${copied ? 'text-green-500' : 'text-black dark:text-white hover:text-[#5c7cfa]'}`}
              >
                {copied ? translate('copied_link', 'Copied') : translate('copy_link', 'Copy')}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#1a1a1a] dark:bg-[#2d2d2d] text-white font-semibold py-3 rounded-xl hover:bg-black dark:hover:bg-[#3d3d3d] transition-all text-[15px]"
            >
              {translate('done', 'Done')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isCreatingLink || !sessionId}
            onClick={handleCreateLink}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:bg-black/90 dark:hover:bg-white/90 transition-all text-[15px] flex items-center justify-center gap-2 border border-transparent dark:border-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingLink && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isCreatingLink ? translate('creating_link', 'Creating link...') : translate('create_share_link', 'Create share link')}
          </button>
        )}
      </div>
    </div>
  );
}
