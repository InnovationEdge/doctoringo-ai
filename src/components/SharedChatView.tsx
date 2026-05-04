import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../lib/api';
import { ChatMessage } from './ChatMessage';
import { DoctorLogo } from './DoctorLogo';
import { ArrowLeft, Lock } from 'lucide-react';
import { useTranslation } from 'src/providers/TranslationProvider';

interface SharedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SharedSession {
  id: string;
  title: string;
  created_at: string;
  messages: SharedMessage[];
}

export function SharedChatView() {
  const { translate } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SharedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(translate('shared_invalid_link', 'Invalid share link.'));
      setLoading(false);
      return;
    }

    const fetchSharedSession = async () => {
      try {
        const data = await chatApi.getSharedSession(token);
        if (!data?.success) {
          throw Object.assign(new Error(data?.error || 'Not found'), { status: 404 });
        }
        setSession({
          id: data.id,
          title: data.title,
          created_at: data.created_at,
          messages: data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })) as unknown as SharedSession['messages'],
        });
      } catch (err: any) {
        if (err?.status === 404) {
          setError(translate('shared_no_longer_exists', 'This shared chat no longer exists or has been revoked.'));
        } else {
          setError(translate('shared_failed_load', 'Failed to load shared chat. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSession();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#171717] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <DoctorLogo className="h-10 w-10 text-[#033C81]" isThinking={true} />
          <p className="text-[#8e8e8e] text-[14px]">{translate('shared_loading', 'Loading shared chat...')}</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#171717] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-[400px]">
          <div className="w-14 h-14 rounded-2xl bg-[#f3f3f3] dark:bg-[#2d2d2d] flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#8e8e8e]" />
          </div>
          <h2 className="text-[20px] font-serif text-[#1a1a1a] dark:text-[#ececec]">{translate('shared_unavailable', 'Chat unavailable')}</h2>
          <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e]">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-5 py-2.5 bg-[#1a1a1a] dark:bg-[#2d2d2d] text-white rounded-xl text-[14px] font-medium hover:bg-black dark:hover:bg-[#3d3d3d] transition-colors"
          >
            {translate('shared_go_to_knowhow', 'Go to Doctoringo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/5 px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <DoctorLogo className="h-6 w-6 text-[#033C81]" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#ececec] truncate">
            {session.title}
          </h1>
          <p className="text-[11px] text-[#8e8e8e]">
            {translate('shared_conversation', 'Shared conversation')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[800px] mx-auto px-4 md:px-0 pt-6">
          {session.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                id: message.id,
                role: message.role,
                content: message.content,
                timestamp: new Date(message.timestamp),
              }}

            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/5 dark:border-white/5 px-4 md:px-6 py-4 text-center">
        <p className="text-[12px] text-[#8e8e8e] mb-2">{translate('shared_readonly', 'This is a read-only view of a shared conversation.')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-[#033C81] text-white rounded-xl text-[13px] font-medium hover:bg-[#c47d5c] transition-colors"
        >
          {translate('shared_try_knowhow', 'Try Doctoringo AI')}
        </button>
      </div>
    </div>
  );
}
