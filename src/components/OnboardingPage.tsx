import { useState } from 'react';
import { DoctorLogo } from './DoctorLogo';
import { motion } from 'motion/react';
const Motion = motion;
import { Hand, Bird, Handshake, RefreshCw } from 'lucide-react';
import { useTranslation } from 'src/providers/TranslationProvider';

interface OnboardingPageProps {
  onComplete: () => void;
  onBack: () => void;
  onNavigate?: (step: string) => void;
  email?: string;
}

export function OnboardingPage({ onComplete, onBack, onNavigate, email = "knowhowaiassistant@gmail.com" }: OnboardingPageProps) {
  const { translate } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedEmails, setAgreedEmails] = useState(false);
  const [helpImprove, setHelpImprove] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    // Integration Point: POST /api/auth/register { email, agreedTerms, agreedEmails, helpImprove }
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsCreatingAccount(false);
    setStep(2);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#212121] text-[#1a1a1a] dark:text-[#ececec] flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300">
        <div className="max-w-[540px] w-full">
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start"
          >
            <div className="mb-8">
              <DoctorLogo className="h-8 w-8" />
            </div>

            <h1 className="text-[36px] font-serif mb-4 tracking-tight text-[#1a1a1a] dark:text-white">{translate('onboarding_hey_knowhow', 'Hey there, I\'m Doctoringo AI.')}</h1>
            <p className="text-[17px] text-[#1a1a1a] dark:text-[#ececec] mb-8 leading-relaxed">
              {translate('onboarding_legal_assistant_desc', 'I\'m your legal AI assistant for research, document analysis, and case strategy.')}
            </p>

            <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] mb-8 font-medium">{translate('onboarding_things_to_know', 'Here\'s a few things you should know about me:')}</p>

            <div className="space-y-8 mb-10">
              <div className="flex gap-4">
                <div className="mt-1">
                  <Hand className="w-8 h-8 text-[#676767] dark:text-[#8e8e8e]" strokeWidth={1.2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold mb-1">{translate('onboarding_ask_anything_title', 'Ask me anything')}</h3>
                  <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e]">{translate('onboarding_ask_anything_desc', 'I\'m here to help with whatever\'s on your mind—from legal research to drafting contracts.')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Bird className="w-8 h-8 text-[#676767] dark:text-[#8e8e8e]" strokeWidth={1.2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold mb-1">{translate('onboarding_built_to_help', 'I\'m built to help, never harm')}</h3>
                  <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e]">{translate('onboarding_built_to_help_desc', 'Automated safeguards protect our conversations from creating violent, abusive, or deceptive legal content.')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Handshake className="w-8 h-8 text-[#676767] dark:text-[#8e8e8e]" strokeWidth={1.2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold mb-1">{translate('onboarding_help_improve_title', 'Help Doctoringo improve for everyone')}</h3>
                  <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e]">
                    {translate('onboarding_help_improve_desc', 'We use your chats and research sessions to train and improve Doctoringo. You can change this setting anytime in your')} <button onClick={() => onNavigate?.('privacy')} className="underline decoration-[#e5e5e5] dark:decoration-[#3d3d3d] underline-offset-4 hover:text-black dark:hover:text-[#ececec]">{translate('onboarding_privacy_settings', 'Privacy Settings')}</button>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-10">
              <button 
                onClick={() => setHelpImprove(!helpImprove)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${helpImprove ? 'bg-[#d97757]' : 'bg-[#e5e5e5] dark:bg-[#3d3d3d]'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${helpImprove ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-[14px] text-[#676767] dark:text-[#8e8e8e]">{translate('onboarding_help_toggle', 'Help Improve Doctoringo')}</span>
            </div>

            <button
              onClick={onComplete}
              className="px-8 py-2.5 bg-[#1a1a1a] dark:bg-[#3d3d3d] hover:bg-black dark:hover:bg-[#4d4d4d] text-white dark:text-[#ececec] rounded-lg text-[15px] font-medium transition-colors"
            >
              {translate('onboarding_i_understand', 'I understand')}
            </button>
          </Motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#212121] text-[#1a1a1a] dark:text-[#ececec] flex flex-col items-center justify-between py-12 px-6 font-sans transition-colors duration-300">
      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-8">
        <DoctorLogo className="h-6" />
        <span className="text-[20px] font-serif tracking-tight font-medium">Doctoringo</span>
      </div>

      {/* Main Content */}
      <div className="max-w-[540px] w-full text-center flex-1 flex flex-col justify-center">
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[40px] font-serif mb-2 tracking-tight text-[#1a1a1a] dark:text-white">{translate('onboarding_create_account', 'Let\'s create your account')}</h1>
          <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] mb-12">{translate('onboarding_review', 'A few things for you to review')}</p>

          <div className="bg-[#f9f9f9] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#2d2d2d] rounded-[24px] p-8 text-left shadow-xl">
            <div className="space-y-6 mb-8">
              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-[18px] h-[18px] rounded border transition-colors flex items-center justify-center ${
                    agreedTerms ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-[#ccc] dark:border-[#3d3d3d] group-hover:border-black dark:group-hover:border-[#4d4d4d]'
                  }`}>
                    {agreedTerms && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-[1.5]">
                  {translate('onboarding_agree_prefix', 'I agree to Doctoringo\'s')} <button onClick={() => onNavigate?.('terms')} className="underline decoration-[#e5e5e5] dark:decoration-[#3d3d3d] underline-offset-4 hover:text-black dark:hover:text-[#ececec]">{translate('onboarding_consumer_terms', 'Consumer Terms')}</button> {translate('and_conjunction', 'and')} <button onClick={() => onNavigate?.('terms')} className="underline decoration-[#e5e5e5] dark:decoration-[#3d3d3d] underline-offset-4 hover:text-black dark:hover:text-[#ececec]">{translate('onboarding_acceptable_use', 'Acceptable Use Policy')}</button> {translate('onboarding_agree_suffix', 'and confirm that I am at least 18 years of age.')}
                </span>
              </label>

              {/* Emails Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={agreedEmails}
                    onChange={(e) => setAgreedEmails(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-[18px] h-[18px] rounded border transition-colors flex items-center justify-center ${
                    agreedEmails ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-[#ccc] dark:border-[#3d3d3d] group-hover:border-black dark:group-hover:border-[#4d4d4d]'
                  }`}>
                    {agreedEmails && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-[1.5]">
                  {translate('onboarding_subscribe_emails', 'Subscribe to occasional product update and promotional emails. You can opt out at any time.')}
                </span>
              </label>
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={!agreedTerms || isCreatingAccount}
              className={`w-full py-3.5 rounded-xl text-[15px] font-medium transition-all flex items-center justify-center gap-2 ${
                agreedTerms && !isCreatingAccount
                  ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-[#ececec]' 
                  : 'bg-[#f3f3f3] dark:bg-[#2d2d2d] text-[#ccc] dark:text-[#676767] cursor-not-allowed'
              }`}
            >
              {isCreatingAccount && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isCreatingAccount ? translate('onboarding_creating_account', 'Creating account...') : translate('onboarding_continue', 'Continue')}
            </button>
          </div>
        </Motion.div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-8">
        <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] mb-1">
          {translate('onboarding_email_verified', 'Email verified as')} <span className="text-black dark:text-[#ececec]">{email}</span>
        </p>
        <button
          onClick={onBack}
          className="text-[13px] text-[#676767] dark:text-[#8e8e8e] underline decoration-[#e5e5e5] dark:decoration-[#3d3d3d] underline-offset-4 hover:text-black dark:hover:text-[#ececec]"
        >
          {translate('onboarding_different_email', 'Use a different email')}
        </button>
      </div>
    </div>
  );
}
