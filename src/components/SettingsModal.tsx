import { X, Zap, Globe2, Copy, Check, Mail, Trash2, Download, Database, Sparkles, ExternalLink, HelpCircle, RefreshCw, ChevronDown, Save, Search, MessageSquare, FileText, Scale, Gavel, ShieldCheck, BarChart3, AlertTriangle, Loader2, Cloud, HardDrive, Brain, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const Motion = motion;
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { paymentApi, authApi, chatApi, API_BASE_URL } from '../lib/api';
import { useCountry } from '../providers/CountryProvider';
import { useTranslation } from 'src/providers/TranslationProvider';
import useIsMobile from 'src/hooks/useMobile';
import { LanguageType } from 'src/core/types';
import { message } from 'src/components/ui';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  onUpgradeClick?: () => void;
  user?: any;
}

export function SettingsModal({ isOpen, onClose, initialTab = 'General', user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  const { theme, setTheme } = useTheme();
  const { countries, setSelectedCountry } = useCountry();
  const navigate = useNavigate();
  const { translate, selectedLanguage, changeLanguage } = useTranslation();
  const isMobile = useIsMobile();
  const [activeFont, setActiveFont] = useState(() => {
    try { return localStorage.getItem('doctoringo_chat_font') || 'Default'; } catch { return 'Default'; }
  });

  // ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Timer refs for cleanup
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Get user's full name from Google account data
  const getUserFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.name || '';
  };

  // Load toggle settings from localStorage
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('doctoringo_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedSettings = loadSavedSettings();

  const [formData, setFormData] = useState({
    fullName: getUserFullName(),
    callMe: user?.call_me || user?.first_name || '',
    email: user?.email || '',
    workDesc: user?.role || 'Legal Associate',
    jurisdiction: user?.jurisdiction || 'GE',
    preferences: user?.preferences || translate('default_preferences_text', 'I prefer concise answers with direct citations to relevant case law and statutes.'),
    notifications: savedSettings.notifications ?? true,
    emailDigest: savedSettings.emailDigest ?? false,
    historyTraining: savedSettings.historyTraining ?? true,
    locationMetadata: savedSettings.locationMetadata ?? true,
    improveDoctoringo: savedSettings.improveDoctoringo ?? true,
    searchReference: savedSettings.searchReference ?? true,
    generateMemory: savedSettings.generateMemory ?? true,
    extraUsage: savedSettings.extraUsage ?? false,
    citationStyle: savedSettings.citationStyle ?? 'Auto',
    responseLength: savedSettings.responseLength ?? 'Standard',
  });

  // Track if profile fields have been modified (to show Save button)
  const [profileModified, setProfileModified] = useState(false);
  const originalProfile = {
    fullName: getUserFullName(),
    callMe: user?.call_me || user?.first_name || '',
    workDesc: user?.role || 'Legal Associate',
    jurisdiction: user?.jurisdiction || 'GE',
    preferences: user?.preferences || translate('default_preferences_text', 'I prefer concise answers with direct citations to relevant case law and statutes.'),
  };

  // Sync formData when user prop changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: getUserFullName(),
        callMe: user.call_me || user.first_name || prev.callMe,
        email: user.email || prev.email,
        workDesc: user.role || prev.workDesc,
        jurisdiction: user.jurisdiction || prev.jurisdiction,
        preferences: user.preferences || prev.preferences,
      }));
    }
  }, [user]);

  // Billing/Subscription state
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // Profile save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteAllChatsLoading, setDeleteAllChatsLoading] = useState(false);
  const [showDeleteChatsConfirm, setShowDeleteChatsConfirm] = useState(false);
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false);
  const [cancelSubLoading, setCancelSubLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Privacy accordion state
  const [expandedPrivacy, setExpandedPrivacy] = useState<string | null>(null);

  // Delete account state
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // Usage stats state
  const [usageStats, setUsageStats] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(7);

  // Save profile to backend
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await authApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        role: formData.workDesc,
        jurisdiction: formData.jurisdiction,
        call_me: formData.callMe,
        preferences: formData.preferences,
      });

      // Sync jurisdiction with CountryProvider so chat uses the new jurisdiction
      if (formData.jurisdiction) {
        // Convert jurisdiction string (e.g. 'usa-federal') to country code ('US')
        const { getCountryCode } = await import('../lib/api');
        setSelectedCountry(getCountryCode(formData.jurisdiction));
      }

      // Dispatch event to update user state in App.tsx
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: {
          first_name: firstName,
          last_name: lastName,
          role: formData.workDesc,
          jurisdiction: formData.jurisdiction,
          call_me: formData.callMe,
          preferences: formData.preferences,
        }
      }));

      // Update localStorage directly too
      try {
        const storedUser = localStorage.getItem('doctoringo_user');
        if (storedUser) {
          let userData;
          try { userData = JSON.parse(storedUser); } catch { userData = {}; }
          userData.first_name = firstName;
          userData.last_name = lastName;
          userData.role = formData.workDesc;
          userData.jurisdiction = formData.jurisdiction;
          userData.call_me = formData.callMe;
          userData.preferences = formData.preferences;
          localStorage.setItem('doctoringo_user', JSON.stringify(userData));
        }
      } catch (e) {
        // ignore localStorage errors
      }

      setSaveSuccess(true);
      saveTimerRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      message.error(translate('save_failed', 'შენახვა ვერ მოხერხდა'));
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch active sessions when Account tab is selected
  useEffect(() => {
    if (activeTab === 'Account' && activeSessions.length === 0) {
      setSessionsLoading(true);
      authApi.getActiveSessions()
        .then((data: any) => {
          setActiveSessions(data?.sessions || []);
        })
        .catch((e) => { console.error('Failed to fetch active sessions:', e); message.error(translate('sessions_load_failed', 'სესიების ჩატვირთვა ვერ მოხერხდა')); })
        .finally(() => setSessionsLoading(false));
    }
  }, [activeTab, translate]);

  // Logout from all devices
  const handleLogoutAllDevices = async () => {
    setLogoutAllLoading(true);
    try {
      await authApi.logoutAllDevices();
      // Refresh sessions list
      const data = await authApi.getActiveSessions();
      setActiveSessions(data?.sessions || []);
      message.success(translate('logged_out_all', 'ყველა მოწყობილობიდან გამოხვედით'));
    } catch (error) {
      console.error('Failed to logout all devices:', error);
      message.error(translate('logout_failed', 'გამოსვლა ვერ მოხერხდა'));
    } finally {
      setLogoutAllLoading(false);
    }
  };

  // Export user data
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const data = await authApi.exportUserData();
      if (!data) throw new Error('No data returned');
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowhow-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(translate('data_exported', 'მონაცემები ექსპორტირებულია'));
    } catch (error) {
      console.error('Failed to export data:', error);
      message.error(translate('export_failed', 'მონაცემების ექსპორტი ვერ მოხერხდა'));
    } finally {
      setExportLoading(false);
    }
  };

  // Delete all chat sessions (GDPR compliance)
  const handleDeleteAllChats = async () => {
    setDeleteAllChatsLoading(true);
    try {
      await chatApi.deleteAllSessions();
      setShowDeleteChatsConfirm(false);
      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent('chats-deleted'));
      message.success(translate('all_chats_deleted', 'ყველა ჩატი წაიშალა'));
    } catch (error) {
      console.error('Failed to delete all chats:', error);
      message.error(translate('delete_chats_failed', 'ჩატების წაშლა ვერ მოხერხდა'));
    } finally {
      setDeleteAllChatsLoading(false);
    }
  };

  // Fetch billing data
  const fetchBillingData = () => {
    setBillingLoading(true);
    Promise.all([
      paymentApi.getSubscriptionStatus().catch(() => null),
      paymentApi.getPaymentHistory().catch(() => [])
    ]).then(([subData, historyData]) => {
      setSubscription(subData);
      setPaymentHistory(Array.isArray(historyData) ? historyData : []);
    }).finally(() => setBillingLoading(false));
  };

  // Fetch billing data when Billing tab is selected
  useEffect(() => {
    if (activeTab === 'Billing' && !subscription) {
      fetchBillingData();
    }
  }, [activeTab]);

  // Refresh billing data after payment success
  useEffect(() => {
    const handlePaymentSuccess = () => {
      if (activeTab === 'Billing') fetchBillingData();
      else setSubscription(null); // Force refetch on next tab visit
    };
    window.addEventListener('payment-success', handlePaymentSuccess);
    return () => window.removeEventListener('payment-success', handlePaymentSuccess);
  }, [activeTab]);

  // Fetch usage stats when Usage tab is selected
  useEffect(() => {
    if (activeTab === 'Usage' && !usageStats) {
      setUsageLoading(true);
      chatApi.getUsageStats()
        .then((data: any) => {
          if (data?.success) {
            setUsageStats(data.usage);
          }
        })
        .catch((e) => { console.error('Failed to fetch usage stats:', e); message.error(translate('usage_load_failed', 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა')); })
        .finally(() => setUsageLoading(false));
    }
  }, [activeTab, translate]);

  // Fetch analytics when Legal Analytics tab is selected
  useEffect(() => {
    if (activeTab === 'Legal Analytics') {
      setAnalyticsLoading(true);
      setAnalyticsData(null);
      chatApi.getAnalytics(analyticsDays)
        .then((data: any) => {
          if (data?.success) {
            setAnalyticsData(data.analytics);
          }
        })
        .catch((e) => { console.error('Failed to fetch analytics:', e); message.error(translate('analytics_load_failed', 'ანალიტიკის ჩატვირთვა ვერ მოხერხდა')); })
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab, analyticsDays, translate]);

  const sidebarItems = [
    { id: 'General', label: translate('settings_general', 'General') },
    { id: 'Account', label: translate('settings_account', 'Account') },
    { id: 'Privacy', label: translate('settings_privacy', 'Privacy') },
    { id: 'Billing', label: translate('settings_billing', 'Billing') },
    { id: 'Usage', label: translate('settings_usage', 'Usage') },
    { id: 'Capabilities', label: translate('settings_capabilities', 'Capabilities') },
    { id: 'Connectors', label: translate('settings_connectors', 'Connectors') },
    { id: 'Legal Analytics', label: translate('settings_legal_analytics', 'Legal Analytics') },
    { id: 'Legal', label: translate('settings_legal', 'Legal') },
  ];

  // Toggle settings that should auto-save to localStorage
  const toggleFields = ['notifications', 'emailDigest', 'historyTraining', 'locationMetadata', 'improveDoctoringo', 'searchReference', 'generateMemory', 'extraUsage', 'citationStyle', 'responseLength'];

  // Profile fields that need explicit Save
  const profileFields = ['fullName', 'callMe', 'workDesc', 'jurisdiction', 'preferences'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-save toggle settings to localStorage
      if (toggleFields.includes(field)) {
        const toggleSettings: Record<string, any> = {};
        toggleFields.forEach(f => {
          toggleSettings[f] = f === field ? value : prev[f as keyof typeof prev];
        });
        localStorage.setItem('doctoringo_settings', JSON.stringify(toggleSettings));
      }

      // Track if profile was modified
      if (profileFields.includes(field)) {
        const isModified =
          (field === 'fullName' ? value : newData.fullName) !== originalProfile.fullName ||
          (field === 'callMe' ? value : newData.callMe) !== originalProfile.callMe ||
          (field === 'workDesc' ? value : newData.workDesc) !== originalProfile.workDesc ||
          (field === 'jurisdiction' ? value : newData.jurisdiction) !== originalProfile.jurisdiction ||
          (field === 'preferences' ? value : newData.preferences) !== originalProfile.preferences;
        setProfileModified(isModified);
      }

      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-[1020px] bg-white dark:bg-[#1d1d1b] shadow-2xl flex flex-col overflow-hidden text-[#1a1a1a] dark:text-[#ececec] ${
          isMobile ? 'h-full rounded-none' : 'h-[85vh] rounded-[28px]'
        }`}
      >
          {/* Mobile: Header with close button */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e0] dark:border-[#2d2d2d] flex-shrink-0">
              <h2 className="text-[18px] font-serif font-medium">{translate('settings_title', 'Settings')}</h2>
              <button type="button" onClick={onClose} aria-label="Close settings" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>
          )}

          {/* Mobile: Horizontal scrollable tabs */}
          {isMobile && (
            <div className="flex-shrink-0 border-b border-[#e5e5e0] dark:border-[#2d2d2d] overflow-x-auto">
              <div className="flex px-3 py-2 gap-1 min-w-max">
                {sidebarItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                      activeTab === item.id
                        ? 'bg-[#f1f1ee] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-white font-medium'
                        : 'text-[#676767] dark:text-[#8e8e8e]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Sidebar */}
            {!isMobile && (
            <div className="w-[260px] border-r border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col bg-[#fcfaf7] dark:bg-[#1d1d1b] flex-shrink-0">
              <div className="p-8 pb-4">
                <h2 className="text-[24px] font-serif font-medium text-[#1a1a1a] dark:text-[#ececec]">{translate('settings_title', 'Settings')}</h2>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 pb-8 space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] transition-all ${
                      activeTab === item.id
                        ? 'bg-[#f1f1ee] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-white font-medium'
                        : 'text-[#676767] dark:text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1d1d1b]">
              <div className={`max-w-[720px] mx-auto ${isMobile ? 'p-4' : 'p-12'}`}>
                <AnimatePresence mode="wait">
                  {activeTab === 'General' && (
                    <Motion.div 
                      key="general-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      {/* Profile Section */}
                      <section className="space-y-8">
                        <h3 className="text-[18px] font-medium">{translate('profile', 'Profile')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('full_name', 'Full name')}</label>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-[13px]">
                                {formData.fullName.charAt(0)}
                              </div>
                              <input 
                                type="text" 
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="flex-1 bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all" 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('what_should_call_you', 'What should Doctoringo call you?')}</label>
                            <input 
                              type="text" 
                              value={formData.callMe}
                              onChange={(e) => handleInputChange('callMe', e.target.value)}
                              className="w-full bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all" 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('what_describes_work', 'What best describes your work?')}</label>
                          <div className="relative">
                            <select 
                              value={formData.workDesc}
                              onChange={(e) => handleInputChange('workDesc', e.target.value)}
                              className="w-full bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none appearance-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all cursor-pointer"
                            >
                              <option value="Attorney">{translate('work_attorney', 'Attorney')}</option>
                              <option value="Paralegal">{translate('work_paralegal', 'Paralegal')}</option>
                              <option value="Judge">{translate('work_judge', 'Judge')}</option>
                              <option value="Legal Researcher">{translate('work_legal_researcher', 'Legal Researcher')}</option>
                              <option value="Law Student">{translate('work_law_student', 'Law Student')}</option>
                              <option value="General Counsel">{translate('work_general_counsel', 'General Counsel')}</option>
                              <option value="Compliance Officer">{translate('work_compliance_officer', 'Compliance Officer')}</option>
                              <option value="Other">{translate('work_other', 'Other')}</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e] pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('primary_jurisdiction', 'Primary Jurisdiction')}</label>
                          <div className="relative">
                            <select
                              value={formData.jurisdiction}
                              onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
                              className="w-full bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none appearance-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all cursor-pointer"
                            >
                              {countries.length > 0 ? (
                                countries.map((country) => (
                                  <option key={country.code} value={country.code}>
                                    {country.flag_emoji} {country.native_name}
                                  </option>
                                ))
                              ) : (
                                <option value="GE">🇬🇪 საქართველო</option>
                              )}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e] pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">
                            {translate('personal_preferences_label', 'What personal preferences or legal focus should Doctoringo consider in responses?')}
                          </label>
                          <p className="text-[12px] text-[#8e8e8e] mb-2">
                            {translate('preferences_description', "Your preferences will apply to all conversations, within Doctoringo's guidelines.")}
                          </p>
                          <textarea
                            value={formData.preferences}
                            onChange={(e) => handleInputChange('preferences', e.target.value)}
                            className="w-full h-32 bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#033C81] dark:focus:border-[#033C81] resize-none transition-all"
                            placeholder={translate('preferences_placeholder', 'e.g., Always cite the IRAC method, focus on US Federal Law, keep explanations concise...')}
                          />
                        </div>

                        {/* Save Profile Button - only show when modified */}
                        <AnimatePresence>
                          {(profileModified || saveSuccess) && (
                            <Motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="flex items-center justify-end gap-3 pt-4"
                            >
                              {saveSuccess && (
                                <span className="flex items-center gap-2 text-[13px] text-[#2f9e44]">
                                  <Check size={16} />
                                  {translate('saved_successfully', 'Saved successfully')}
                                </span>
                              )}
                              {profileModified && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await handleSaveProfile();
                                    setProfileModified(false);
                                  }}
                                  disabled={isSaving}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#033C81] text-white rounded-xl text-[13px] font-medium hover:bg-[#c07d5b] transition-colors disabled:opacity-50"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" />
                                      {translate('saving', 'Saving...')}
                                    </>
                                  ) : (
                                    <>
                                      <Save size={16} />
                                      {translate('save_changes', 'Save Changes')}
                                    </>
                                  )}
                                </button>
                              )}
                            </Motion.div>
                          )}
                        </AnimatePresence>
                      </section>

                      {/* Notifications Section */}
                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <h3 className="text-[18px] font-medium">{translate('notifications', 'Notifications')}</h3>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium">{translate('response_completions', 'Response completions')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">
                                {translate('response_completions_desc', 'Get notified when Doctoringo has finished a response.')}
                              </p>
                            </div>
                            <button type="button"
                              onClick={() => handleInputChange('notifications', !formData.notifications)}
                              className={`relative w-11 h-6 rounded-full transition-colors ${formData.notifications ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium">{translate('emails_from_analytics', 'Emails from Legal Analytics on the web')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">
                                {translate('emails_from_analytics_desc', 'Get an email when Legal Analytics on the web has finished building or needs your response.')}
                              </p>
                            </div>
                            <button type="button"
                              onClick={() => handleInputChange('emailDigest', !formData.emailDigest)}
                              className={`relative w-11 h-6 rounded-full transition-colors ${formData.emailDigest ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.emailDigest ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>
                      </section>

                      {/* Appearance Section */}
                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <h3 className="text-[18px] font-medium">{translate('appearance', 'Appearance')}</h3>

                        <div className="space-y-4">
                          <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('color_mode', 'Color mode')}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: 'light', label: translate('theme_light', 'Light') },
                              { id: 'system', label: translate('theme_auto', 'Auto') },
                              { id: 'dark', label: translate('theme_dark', 'Dark') }
                            ].map((mode) => (
                              <button type="button"
                                key={mode.id}
                                onClick={() => setTheme(mode.id as any)}
                                className="space-y-3 group"
                              >
                                <div className={`aspect-[16/10] rounded-xl border-2 overflow-hidden transition-all ${
                                  theme === mode.id ? 'border-[#033C81]' : 'border-[#e5e5e0] dark:border-[#2d2d2d] group-hover:border-[#033C81]'
                                }`}>
                                  <div className={`w-full h-full p-2 ${
                                    mode.id === 'light' ? 'bg-[#fcfcf9]' : 
                                    mode.id === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gradient-to-r from-[#fcfcf9] to-[#1a1a1a]'
                                  }`}>
                                    <div className="w-full h-full rounded-lg border border-[#e5e5e0] dark:border-[#2d2d2d] overflow-hidden flex flex-col">
                                      <div className={`h-3 w-full border-b ${mode.id === 'light' ? 'bg-[#f3f2ee]' : 'bg-[#2d2d2d]'}`} />
                                      <div className="flex-1 p-2 space-y-2">
                                        <div className={`h-1.5 w-3/4 rounded-full ${mode.id === 'light' ? 'bg-[#e5e5e0]' : 'bg-[#3d3d3d]'}`} />
                                        <div className={`h-1.5 w-1/2 rounded-full ${mode.id === 'light' ? 'bg-[#e5e5e0]' : 'bg-[#3d3d3d]'}`} />
                                        <div className={`mt-auto h-4 w-full rounded-md ${mode.id === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}`} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{mode.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('chat_font', 'Chat font')}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { id: 'Default', label: translate('font_default', 'Default') },
                              { id: 'Sans', label: translate('font_sans', 'Sans') },
                              { id: 'System', label: translate('font_system', 'System') },
                              { id: 'Dyslexic', label: translate('font_dyslexic', 'Dyslexic friendly') }
                            ].map((font) => (
                              <button type="button"
                                key={font.id}
                                onClick={() => { setActiveFont(font.id); localStorage.setItem('doctoringo_chat_font', font.id); window.dispatchEvent(new Event('knowhow-font-change')); }}
                                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-4 ${
                                  activeFont === font.id ? 'border-[#033C81] bg-[#033C81]/5' : 'border-[#e5e5e0] dark:border-[#2d2d2d] hover:border-[#033C81]'
                                }`}
                              >
                                <span className={`text-[24px] ${
                                  font.id === 'Sans' ? 'font-sans' :
                                  font.id === 'Default' ? 'font-serif' :
                                  font.id === 'System' ? 'font-mono' :
                                  ''
                                }`} style={font.id === 'Dyslexic' ? { fontFamily: 'OpenDyslexic, Comic Sans MS, cursive' } : undefined}>Aa</span>
                                <span className="text-[12px] font-medium text-center leading-tight">{font.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('language', 'ენა / Language')}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: LanguageType.GEO, label: 'ქართული', flag: '🇬🇪' },
                              { id: LanguageType.ENG, label: 'English', flag: '🇬🇧' },
                              { id: LanguageType.RUS, label: 'Русский', flag: '🇷🇺' }
                            ].map((lang) => (
                              <button type="button"
                                key={lang.id}
                                onClick={() => changeLanguage(lang.id)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-[14px] font-medium ${
                                  selectedLanguage === lang.id ? 'border-[#033C81] bg-[#033C81]/5' : 'border-[#e5e5e0] dark:border-[#2d2d2d] hover:border-[#033C81]'
                                }`}
                              >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Account' && (
                    <Motion.div 
                      key="account-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <h3 className="text-[18px] font-medium">{translate('account', 'Account')}</h3>

                        <div className="flex items-center justify-between py-2">
                          <div className="space-y-1">
                            <h4 className="text-[14px] font-medium">{translate('log_out_all_devices', 'Log out of all devices')}</h4>
                            <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{translate('log_out_all_devices_desc', 'This will log you out of all active sessions on other browsers and devices.')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleLogoutAllDevices}
                            disabled={logoutAllLoading}
                            className="flex items-center gap-2 px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                          >
                            {logoutAllLoading && <Loader2 size={14} className="animate-spin" />}
                            {translate('log_out_btn', 'Log out')}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div className="space-y-1">
                            <h4 className="text-[14px] font-medium text-red-500">{translate('delete_account', 'Delete account')}</h4>
                            <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{translate('delete_account_desc', 'Permanently delete your account and all associated data.')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowDeleteAccountConfirm(true); setDeleteAccountInput(''); }}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-[13px] font-medium transition-colors hover:bg-red-600"
                          >
                            {translate('delete_account_btn', 'Delete account')}
                          </button>
                        </div>

                        {/* Delete Account Confirmation Dialog */}
                        <AnimatePresence>
                          {showDeleteAccountConfirm && (
                            <Motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                            >
                              <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteAccountConfirm(false)} />
                              <Motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="relative bg-white dark:bg-[#1d1d1b] rounded-[28px] p-8 max-w-[420px] w-full border border-[#e5e5e0] dark:border-[#2d2d2d]"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-red-500" />
                                  </div>
                                  <h3 className="text-[18px] font-medium">{translate('delete_account_title', 'Delete your account?')}</h3>
                                </div>
                                <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed mb-6">
                                  {translate('delete_account_warning', 'This action is permanent and cannot be undone. All your data, including chat history, documents, and subscription will be permanently deleted.')}
                                </p>
                                <div className="space-y-2 mb-6">
                                  <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">
                                    {translate('type_delete_confirm', 'Type DELETE to confirm')}
                                  </label>
                                  <input
                                    type="text"
                                    value={deleteAccountInput}
                                    onChange={(e) => setDeleteAccountInput(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-white dark:bg-[#1d1d1b] border border-red-300 dark:border-red-800 rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-red-500 dark:focus:border-red-400 transition-all"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setShowDeleteAccountConfirm(false)}
                                    className="px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {translate('cancel', 'Cancel')}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deleteAccountInput !== 'DELETE' || deleteAccountLoading}
                                    onClick={async () => {
                                      setDeleteAccountLoading(true);
                                      try {
                                        await authApi.deleteAccount('DELETE');
                                        window.location.href = '/';
                                      } catch (e) {
                                        console.error('Failed to delete account:', e);
                                        message.error(translate('delete_account_failed', 'ანგარიშის წაშლა ვერ მოხერხდა'));
                                      } finally {
                                        setDeleteAccountLoading(false);
                                      }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    {deleteAccountLoading && <Loader2 size={14} className="animate-spin" />}
                                    {translate('delete_permanently', 'Delete permanently')}
                                  </button>
                                </div>
                              </Motion.div>
                            </Motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-4 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[14px] font-medium">{translate('user_id', 'User ID')}</h4>
                            <div className="flex items-center gap-2 bg-[#fcfaf7] dark:bg-[#1f1f1f] px-3 py-1.5 rounded-lg border border-[#e5e5e0] dark:border-[#2d2d2d]">
                              <code className="text-[12px] text-[#676767] dark:text-[#8e8e8e]">{user?.id || 'N/A'}</code>
                              <button
                                type="button"
                                onClick={() => {
                                  if (user?.id) {
                                    navigator.clipboard.writeText(String(user.id));
                                    setCopiedUserId(true);
                                    copyTimerRef.current = setTimeout(() => setCopiedUserId(false), 2000);
                                  }
                                }}
                                title={translate('copy_to_clipboard', 'Copy to clipboard')}
                                className="text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
                              >
                                {copiedUserId ? <Check size={14} className="text-[#2f9e44]" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <h3 className="text-[18px] font-medium">{translate('active_sessions', 'Active sessions')}</h3>
                        {sessionsLoading ? (
                          <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-[#033C81]" />
                          </div>
                        ) : activeSessions.length > 0 ? (
                          <div className="border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] overflow-hidden overflow-x-auto">
                            <table className="w-full text-[13px] text-left min-w-[480px]">
                              <thead>
                                <tr className="bg-[#fcfaf7] dark:bg-[#1f1f1f] text-[#676767] dark:text-[#8e8e8e] font-medium">
                                  <th className="px-4 md:px-6 py-3 border-b border-[#e5e5e0] dark:border-[#2d2d2d]">{translate('device', 'Device')}</th>
                                  <th className="px-4 md:px-6 py-3 border-b border-[#e5e5e0] dark:border-[#2d2d2d]">{translate('location', 'Location')}</th>
                                  <th className="px-4 md:px-6 py-3 border-b border-[#e5e5e0] dark:border-[#2d2d2d]">{translate('expires', 'Expires')}</th>
                                  <th className="px-4 md:px-6 py-3 border-b border-[#e5e5e0] dark:border-[#2d2d2d]">{translate('status', 'Status')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5e5e0] dark:divide-[#2d2d2d]">
                                {activeSessions.map((session: any, i: number) => (
                                  <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-4 md:px-6 py-4 font-medium">{session.device}</td>
                                    <td className="px-4 md:px-6 py-4 text-[#8e8e8e]">{session.location}</td>
                                    <td className="px-4 md:px-6 py-4 text-[#8e8e8e]">
                                      {new Date(session.expire_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                      {session.is_current ? (
                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2f9e44]">
                                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                          {translate('current', 'Current')}
                                        </span>
                                      ) : (
                                        <span className="text-[#8e8e8e] text-[12px]">{translate('active', 'Active')}</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-[14px] text-[#8e8e8e] py-4">{translate('no_active_sessions', 'No active sessions found')}</p>
                        )}
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Privacy' && (
                    <Motion.div 
                      key="privacy-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-[18px] font-medium">{translate('settings_privacy', 'Privacy')}</h3>
                          <p className="text-[13px] text-[#8e8e8e]">{translate('privacy_subtitle', 'Doctoringo believes in transparent data practices')}</p>
                        </div>

                        <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed max-w-[500px]">
                          {translate('privacy_description', 'Learn how your information is protected when using Doctoringo products')}, <a href="https://doctoringo.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#033C81] font-medium hover:underline">{translate('privacy_center', 'Privacy Center')}</a> & <a href="https://doctoringo.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#033C81] font-medium hover:underline">{translate('privacy_policy', 'Privacy Policy')}</a>.
                        </p>

                        <div className="flex flex-col gap-3">
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedPrivacy(expandedPrivacy === 'protect' ? null : 'protect')}
                              className="flex items-center gap-2 text-[14px] text-[#1a1a1a] dark:text-[#ececec] hover:text-[#033C81] transition-colors group"
                            >
                              <span>{translate('how_we_protect_data', 'How we protect your data')}</span>
                              <ChevronDown size={14} className={`transition-transform ${expandedPrivacy === 'protect' ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                            <AnimatePresence>
                              {expandedPrivacy === 'protect' && (
                                <Motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 pb-2 pl-4 text-[13px] text-[#676767] dark:text-[#8e8e8e] space-y-2">
                                    <p>• {translate('protect_data_1', 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256)')}</p>
                                    <p>• {translate('protect_data_2', 'Your conversations are stored securely in Google Cloud Platform')}</p>
                                    <p>• {translate('protect_data_3', 'We never share your personal data with third parties for advertising')}</p>
                                    <p>• {translate('protect_data_4', 'You can delete your data at any time from Privacy settings')}</p>
                                  </div>
                                </Motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedPrivacy(expandedPrivacy === 'use' ? null : 'use')}
                              className="flex items-center gap-2 text-[14px] text-[#1a1a1a] dark:text-[#ececec] hover:text-[#033C81] transition-colors group"
                            >
                              <span>{translate('how_we_use_data', 'How we use your data')}</span>
                              <ChevronDown size={14} className={`transition-transform ${expandedPrivacy === 'use' ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                            <AnimatePresence>
                              {expandedPrivacy === 'use' && (
                                <Motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 pb-2 pl-4 text-[13px] text-[#676767] dark:text-[#8e8e8e] space-y-2">
                                    <p>• {translate('use_data_1', 'Your questions help improve our legal AI responses')}</p>
                                    <p>• {translate('use_data_2', 'We analyze usage patterns to enhance the product experience')}</p>
                                    <p>• {translate('use_data_3', 'Chat history is used to provide personalized recommendations')}</p>
                                    <p>• {translate('use_data_4', 'You can opt out of data collection in Privacy settings below')}</p>
                                  </div>
                                </Motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <h3 className="text-[18px] font-medium">{translate('privacy_settings', 'Privacy settings')}</h3>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between py-2">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium">{translate('export_data', 'Export data')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{translate('export_data_desc', 'Download all your chat history and uploaded legal documents.')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleExportData}
                              disabled={exportLoading}
                              className="flex items-center gap-2 px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                              {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                              {translate('export_data', 'Export data')}
                            </button>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium text-red-500">{translate('delete_all_chat_history', 'Delete all chat history')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{translate('delete_all_chat_history_desc', 'Permanently delete all your chat sessions and messages. This action cannot be undone.')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowDeleteChatsConfirm(true)}
                              className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-500 rounded-xl text-[13px] font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                              {translate('delete_all', 'Delete all')}
                            </button>
                          </div>

                          {/* Delete All Chats Confirmation Modal */}
                          <AnimatePresence>
                          {showDeleteChatsConfirm && (
                            <Motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                            >
                              <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteChatsConfirm(false)} />
                              <Motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="relative bg-white dark:bg-[#1d1d1b] rounded-[28px] p-8 max-w-[420px] w-full border border-[#e5e5e0] dark:border-[#2d2d2d]"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-red-500" />
                                  </div>
                                  <h3 className="text-[18px] font-medium">{translate('delete_all_chats_question', 'Delete all chats?')}</h3>
                                </div>
                                <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed mb-6">
                                  {translate('delete_all_chats_warning', 'All your chat sessions, messages, and uploaded documents will be permanently deleted.')}
                                </p>
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setShowDeleteChatsConfirm(false)}
                                    className="px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {translate('cancel', 'Cancel')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleDeleteAllChats}
                                    disabled={deleteAllChatsLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    {deleteAllChatsLoading && <Loader2 size={14} className="animate-spin" />}
                                    {translate('delete_all_chats', 'Delete all chats')}
                                  </button>
                                </div>
                              </Motion.div>
                            </Motion.div>
                          )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between py-2">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium">{translate('location_metadata', 'Location metadata')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">
                                {translate('location_metadata_desc', 'Allow Doctoringo to use coarse location metadata (city/region) to improve product experiences.')} <a href="https://doctoringo.com/privacy-policy#location" target="_blank" rel="noopener noreferrer" className="text-[#033C81] hover:underline">{translate('learn_more', 'Learn more')}.</a>
                              </p>
                            </div>
                            <button type="button"
                              onClick={() => handleInputChange('locationMetadata', !formData.locationMetadata)}
                              className={`relative w-11 h-6 rounded-full transition-colors ${formData.locationMetadata ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.locationMetadata ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-medium">{translate('help_improve_knowhow', 'Help improve Doctoringo')}</h4>
                              <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">
                                {translate('help_improve_desc', 'Allow the use of your chats to train and improve Doctoringo AI models.')} <a href="https://doctoringo.com/privacy-policy#data-usage" target="_blank" rel="noopener noreferrer" className="text-[#033C81] hover:underline">{translate('learn_more', 'Learn more')}.</a>
                              </p>
                            </div>
                            <button type="button"
                              onClick={() => handleInputChange('improveDoctoringo', !formData.improveDoctoringo)}
                              className={`relative w-11 h-6 rounded-full transition-colors ${formData.improveDoctoringo ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.improveDoctoringo ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Billing' && (
                    <Motion.div
                      key="billing-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      {billingLoading ? (
                        <div className="flex items-center justify-center py-20">
                          <Loader2 size={32} className="animate-spin text-[#033C81]" />
                        </div>
                      ) : (
                        <>
                          <section className="space-y-8">
                            <h3 className="text-[18px] font-medium">{translate('billing', 'Billing')}</h3>

                            <div className={`p-6 rounded-[28px] border relative overflow-hidden flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                              subscription?.is_paid
                                ? 'border-[#033C81] bg-white dark:bg-[#1f1f1f]'
                                : 'bg-[#fcfaf7] dark:bg-[#1f1f1f] border-[#e5e5e0] dark:border-[#2d2d2d]'
                            }`}>
                              {subscription?.is_paid && <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#033C81]" />}
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#033C81]/10 flex items-center justify-center text-[#033C81] border border-[#033C81]/20 shrink-0">
                                  <Sparkles size={24} />
                                </div>
                                <div>
                                  <h4 className="text-[18px] font-medium capitalize">
                                    {subscription?.plan_name || subscription?.status || 'Free'} {translate('plan_suffix', 'plan')}
                                  </h4>
                                  <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] mb-1">
                                    {subscription?.plan_name === 'max' ? translate('plan_desc_max', '20x more usage than Pro') :
                                     subscription?.plan_name === 'pro' ? translate('plan_desc_pro', '5x more usage than Free') :
                                     translate('plan_desc_free', 'Basic legal research capabilities')}
                                  </p>
                                  {subscription?.expires_at && (
                                    <p className="text-[12px] text-[#8e8e8e]">
                                      {!subscription?.auto_renew && subscription?.expires_at
                                        ? `${translate('subscription_ends_on', 'Subscription ends on')} ${new Date(subscription.expires_at).toLocaleDateString()}`
                                        : `${translate('auto_renews_on', 'Auto renews on')} ${new Date(subscription.expires_at).toLocaleDateString()}`
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => { onClose(); navigate('/pricing'); }}
                                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                                  subscription?.is_paid
                                    ? 'border border-[#e5e5e0] dark:border-[#2d2d2d] hover:bg-black/5 dark:hover:bg-white/5'
                                    : 'bg-[#033C81] text-white hover:bg-[#c07d5b]'
                                }`}
                              >
                                {subscription?.is_paid ? translate('adjust_plan', 'Adjust plan') : translate('upgrade_now', 'Upgrade')}
                              </button>
                            </div>

                            {/* Free tier upgrade prompt */}
                            {!subscription?.is_paid && (
                              <div className="p-5 bg-gradient-to-r from-[#033C81]/5 to-[#033C81]/10 border border-[#033C81]/20 rounded-[28px] flex items-center gap-4">
                                <Zap size={20} className="text-[#033C81] shrink-0" />
                                <div className="flex-1">
                                  <p className="text-[14px] font-medium">{translate('unlock_premium', 'გახსენი Premium ფუნქციები')}</p>
                                  <p className="text-[12px] text-[#8e8e8e]">{translate('unlock_premium_desc', 'შეუზღუდავი Pro მოდელი, პრიორიტეტული მხარდაჭერა, ინვოისები')}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { onClose(); navigate('/pricing'); }}
                                  className="px-4 py-2 bg-[#033C81] text-white rounded-xl text-[13px] font-medium hover:bg-[#c07d5b] transition-colors whitespace-nowrap"
                                >
                                  {translate('see_plans', 'See plans')}
                                </button>
                              </div>
                            )}

                            {subscription?.has_saved_payment_method && (
                              <div className="space-y-4">
                                <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('payment_method', 'გადახდის მეთოდი')}</h4>
                                <div className="flex items-center justify-between py-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-6 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded-md border border-[#e5e5e0] dark:border-[#2d2d2d] flex items-center justify-center text-[8px] font-bold uppercase">
                                      {subscription?.saved_card_brand || 'CARD'}
                                    </div>
                                    <span className="text-[14px]">
                                      {subscription?.saved_card_brand || 'Card'} **** {subscription?.saved_card_last4 || '****'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { onClose(); navigate('/checkout'); }}
                                    className="px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {translate('update', 'Update')}
                                  </button>
                                </div>

                                {/* Auto-renewal toggle */}
                                {subscription?.status === 'active' && (
                                  <div className="flex items-center justify-between py-2 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                                    <div>
                                      <p className="text-[14px] font-medium">{translate('auto_renewal', 'ავტომატური განახლება')}</p>
                                      <p className="text-[12px] text-[#8e8e8e]">
                                        {subscription?.auto_renew
                                          ? `${translate('next_charge', 'შემდეგი ჩამოჭრა')}: ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : ''}`
                                          : translate('renewal_off_desc', 'გამოწერა დასრულდება მიმდინარე პერიოდის ბოლოს')
                                        }
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={cancelSubLoading || reactivateLoading}
                                      onClick={async () => {
                                        if (subscription?.auto_renew) {
                                          setShowCancelSubConfirm(true);
                                        } else {
                                          setReactivateLoading(true);
                                          try {
                                            await paymentApi.reactivateSubscription();
                                            const updated = await paymentApi.getSubscriptionStatus().catch(() => null);
                                            setSubscription(updated || { ...subscription, auto_renew: true });
                                            message.success(translate('subscription_reactivated', 'გამოწერა აღდგენილია'));
                                          } catch (e) {
                                            console.error('Failed to reactivate subscription:', e);
                                            message.error(translate('reactivate_failed', 'გამოწერის აღდგენა ვერ მოხერხდა'));
                                          } finally {
                                            setReactivateLoading(false);
                                          }
                                        }
                                      }}
                                      className={`relative w-11 h-6 rounded-full transition-colors ${subscription?.auto_renew ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                                    >
                                      {(cancelSubLoading || reactivateLoading) ? (
                                        <Loader2 size={12} className="absolute top-1.5 left-1.5 animate-spin text-white" />
                                      ) : (
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${subscription?.auto_renew ? 'translate-x-5' : 'translate-x-0'}`} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </section>

                          <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                            <h3 className="text-[18px] font-medium">{translate('invoices', 'Invoices')}</h3>
                            <div className="space-y-4">
                              {paymentHistory.filter((inv: any) => ['completed', 'succeeded', 'paid'].includes(inv.status)).length > 0 ? (
                                paymentHistory.filter((inv: any) => ['completed', 'succeeded', 'paid'].includes(inv.status)).map((invoice: any, i: number) => (
                                  <div key={i} className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 py-4 border-b border-[#e5e5e0] dark:border-[#2d2d2d] last:border-0">
                                    <div className="text-[13px]">
                                      {new Date(invoice.created_at || invoice.date).toLocaleDateString(
                                        selectedLanguage === LanguageType.GEO ? 'ka-GE' : selectedLanguage === LanguageType.RUS ? 'ru-RU' : 'en-US',
                                        { year: 'numeric', month: 'short', day: 'numeric' }
                                      )}
                                    </div>
                                    <div className="text-[13px] font-medium">
                                      ₾{invoice.amount} {invoice.currency || 'GEL'}
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                                      invoice.status === 'succeeded' || invoice.status === 'completed' || invoice.status === 'paid'
                                        ? 'text-[#2f9e44] dark:text-[#40c057]'
                                        : invoice.status === 'pending'
                                          ? 'text-[#f59f00]'
                                          : invoice.status === 'failed'
                                            ? 'text-[#e03131]'
                                            : 'text-[#8e8e8e]'
                                    }`}>
                                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                      {invoice.status === 'succeeded' || invoice.status === 'completed' || invoice.status === 'paid'
                                        ? translate('paid', 'Paid')
                                        : invoice.status === 'pending'
                                          ? translate('pending_status', 'Pending')
                                          : invoice.status === 'failed'
                                            ? translate('failed_status', 'Failed')
                                            : invoice.status === 'cancelled'
                                              ? translate('cancelled_status', 'Cancelled')
                                              : invoice.status}
                                    </span>
                                    {invoice.invoice_url && (
                                      <a
                                        href={`${API_BASE_URL}${invoice.invoice_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#033C81] hover:underline"
                                      >
                                        <Download size={14} />
                                        {translate('invoice', 'ინვოისი')}
                                      </a>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-[14px] text-[#8e8e8e] py-4">{translate('no_invoices', 'No invoices yet')}</p>
                              )}
                            </div>
                          </section>

                          {/* Cancel Subscription Confirmation Dialog */}
                          <AnimatePresence>
                            {showCancelSubConfirm && (
                              <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                              >
                                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCancelSubConfirm(false)} />
                                <Motion.div
                                  initial={{ scale: 0.95 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0.95 }}
                                  className="relative bg-white dark:bg-[#1d1d1b] rounded-[28px] p-8 max-w-[420px] w-full border border-[#e5e5e0] dark:border-[#2d2d2d]"
                                >
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                      <AlertTriangle size={20} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[18px] font-medium">{translate('cancel_subscription_title', 'Cancel Subscription?')}</h3>
                                  </div>
                                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed mb-6">
                                    {translate('cancel_subscription_desc', 'Your subscription will remain active until the end of the current billing period. After that, you will lose access to Pro features.')}
                                  </p>
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setShowCancelSubConfirm(false)}
                                      className="px-4 py-2 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                      {translate('keep_subscription', 'Keep subscription')}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cancelSubLoading}
                                      onClick={async () => {
                                        setCancelSubLoading(true);
                                        try {
                                          await paymentApi.cancelSubscription();
                                          const updated = await paymentApi.getSubscriptionStatus().catch(() => null);
                                          setSubscription(updated || { ...subscription, auto_renew: false });
                                          setShowCancelSubConfirm(false);
                                          message.success(translate('subscription_cancelled', 'გამოწერა გაუქმებულია'));
                                        } catch (e) {
                                          console.error('Failed to cancel subscription:', e);
                                          message.error(translate('cancel_failed', 'გამოწერის გაუქმება ვერ მოხერხდა'));
                                        } finally {
                                          setCancelSubLoading(false);
                                        }
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                      {cancelSubLoading && <Loader2 size={14} className="animate-spin" />}
                                      {translate('confirm_cancel', 'Yes, cancel')}
                                    </button>
                                  </div>
                                </Motion.div>
                              </Motion.div>
                            )}
                          </AnimatePresence>

                          {/* Warning when auto-renew is off */}
                          {subscription?.status === 'active' && !subscription?.auto_renew && subscription?.expires_at && (
                            <div className="p-4 bg-[#f59f00]/5 border border-[#f59f00]/20 rounded-[28px] flex items-center gap-3">
                              <AlertTriangle size={18} className="text-[#f59f00] shrink-0" />
                              <p className="text-[13px] text-[#f59f00]">
                                {translate('subscription_scheduled_end', 'Your subscription is scheduled to end on')} {new Date(subscription.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </Motion.div>
                  )}

                  {activeTab === 'Usage' && (
                    <Motion.div
                      key="usage-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      {usageLoading ? (
                        <div className="flex items-center justify-center py-20">
                          <Loader2 size={32} className="animate-spin text-[#033C81]" />
                        </div>
                      ) : (
                      <section className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[18px] font-medium">{translate('plan_usage_limits', 'Plan usage limits')}</h3>
                          <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${
                            usageStats?.is_paid
                              ? 'bg-[#033C81]/10 text-[#033C81] border border-[#033C81]/20'
                              : 'bg-[#f3f2ee] dark:bg-[#2d2d2d]'
                          }`}>
                            {usageStats?.plan || 'Basic'} {translate('plan_suffix', 'plan')}
                          </span>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[14px] mb-1">
                              <h4 className="font-medium">{translate('daily_usage', 'Daily usage')}</h4>
                              <span className="text-[#8e8e8e]">
                                {usageStats?.messages?.today || 0} / {usageStats?.limits?.daily || '∞'} {translate('messages', 'messages')}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded-full overflow-hidden">
                              <Motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usageStats?.limits?.daily_used_pct || 0}%` }}
                                className="h-full bg-[#033C81] rounded-full"
                              />
                            </div>
                            <p className="text-[12px] text-[#8e8e8e]">
                              {usageStats?.resets?.daily ? new Date(usageStats.resets.daily).toLocaleTimeString() : translate('resets_at_midnight', 'Resets at midnight')}
                            </p>
                          </div>

                          <div className="space-y-8 pt-8">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[14px] font-medium">{translate('weekly_limits', 'Weekly limits')}</h4>
                              <a href="https://doctoringo.com/pricing#limits" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#033C81] font-medium hover:underline">{translate('learn_about_limits', 'Learn more about usage limits')}</a>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-[13px]">
                                  <span>{translate('all_models', 'All models')}</span>
                                  <span className="text-[#8e8e8e]">
                                    {usageStats?.messages?.this_week || 0} / {usageStats?.limits?.weekly || '∞'} ({usageStats?.limits?.weekly_used_pct || 0}% {translate('used', 'used')})
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded-full overflow-hidden">
                                  <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usageStats?.limits?.weekly_used_pct || 0}%` }}
                                    className="h-full bg-[#033C81] rounded-full"
                                  />
                                </div>
                                <p className="text-[12px] text-[#8e8e8e]">
                                  {usageStats?.resets?.weekly ? new Date(usageStats.resets.weekly).toLocaleDateString() : translate('next_week', 'next week')}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[13px] items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span>{translate('legal_pro_only', 'Legal Pro only')}</span>
                                    <HelpCircle size={14} className="text-[#8e8e8e]" />
                                  </div>
                                  <span className="text-[#8e8e8e]">
                                    {usageStats?.premium_model?.used_today || 0} / {usageStats?.premium_model?.daily_limit ?? '∞'} {translate('today', 'today')}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded-full overflow-hidden">
                                  <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: usageStats?.premium_model?.daily_limit ? `${((usageStats?.premium_model?.used_today || 0) / usageStats.premium_model.daily_limit) * 100}%` : '0%' }}
                                    className="h-full bg-[#033C81] rounded-full"
                                  />
                                </div>
                                <p className="text-[12px] text-[#8e8e8e]">
                                  {usageStats?.premium_model?.daily_limit === null
                                    ? translate('unlimited_pro', 'შეუზღუდავი Pro მოდელი')
                                    : `${usageStats?.premium_model?.remaining ?? 5} ${translate('pro_questions_remaining', 'Pro questions remaining today')}`
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[12px] text-[#8e8e8e] justify-center py-2">
                              <RefreshCw size={12} />
                              <span>{translate('total', 'Total')}: {usageStats?.messages?.total || 0} {translate('messages', 'messages')} / {usageStats?.sessions?.total || 0} {translate('chat_sessions', 'sessions')}</span>
                            </div>
                          </div>
                        </div>
                      </section>
                      )}

                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-medium">{translate('extra_usage', 'Extra usage')}</h4>
                              <span className="px-2 py-0.5 rounded-md bg-[#f3f2ee] dark:bg-[#2d2d2d] text-[9px] font-bold uppercase tracking-widest text-[#8e8e8e]">{translate('coming_soon', 'Coming soon')}</span>
                            </div>
                            <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">
                              {translate('extra_usage_desc', 'Turn on extra usage to keep using Doctoringo if you hit a limit.')}
                            </p>
                          </div>
                          <button type="button"
                            disabled
                            className="relative w-11 h-6 rounded-full transition-colors bg-[#e5e5e0] dark:bg-[#3d3d3d] opacity-50 cursor-not-allowed"
                          >
                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                          </button>
                        </div>
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Capabilities' && (
                    <Motion.div
                      key="capabilities-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-[18px] font-medium">{translate('capabilities', 'Capabilities')}</h3>
                          <p className="text-[13px] text-[#8e8e8e]">{translate('capabilities_subtitle', 'Advanced AI features for enhanced legal research')}</p>
                        </div>

                        {/* AI Capabilities Toggles */}
                        <div className="space-y-4">
                          {[
                            { field: 'searchReference', icon: Search, title: translate('web_search', 'Web Search'), desc: translate('web_search_desc', 'Allow Doctoringo to search the web for up-to-date legal information and references.') },
                            { field: 'generateMemory', icon: Brain, title: translate('memory', 'Memory'), desc: translate('memory_desc', 'Remember context and preferences across conversations for personalized assistance.') },
                            { field: 'historyTraining', icon: BookOpen, title: translate('chat_history_context', 'Chat History for Context'), desc: translate('chat_history_context_desc', 'Use your conversation history to provide more relevant and contextual responses.') },
                          ].map((cap) => (
                            <div key={cap.field} className="flex items-start justify-between gap-4 p-5 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] hover:bg-[#fcfaf7] dark:hover:bg-[#1f1f1f] transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] flex items-center justify-center text-[#033C81] shrink-0">
                                  <cap.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[14px] font-medium">{cap.title}</h4>
                                  <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{cap.desc}</p>
                                </div>
                              </div>
                              <button type="button"
                                onClick={() => handleInputChange(cap.field, !(formData as any)[cap.field])}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-1 ${(formData as any)[cap.field] ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`}
                              >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${(formData as any)[cap.field] ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Advanced Features */}
                      <section className="space-y-8 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d]">
                        <h3 className="text-[18px] font-medium">{translate('advanced_features', 'Advanced Features')}</h3>

                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('citation_style', 'Legal Citation Style')}</label>
                            <p className="text-[12px] text-[#8e8e8e] mb-2">{translate('citation_style_desc', 'Choose the citation format for legal references in responses.')}</p>
                            <div className="relative">
                              <select
                                value={formData.citationStyle}
                                onChange={(e) => handleInputChange('citationStyle', e.target.value)}
                                className="w-full bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none appearance-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all cursor-pointer"
                              >
                                <option value="Auto">{translate('citation_auto', 'Auto (Based on jurisdiction)')}</option>
                                <option value="OSCOLA">{translate('citation_oscola', 'OSCOLA')}</option>
                                <option value="Bluebook">{translate('citation_bluebook', 'Bluebook')}</option>
                                <option value="APA">{translate('citation_apa', 'APA')}</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e] pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('response_length', 'Response Length')}</label>
                            <p className="text-[12px] text-[#8e8e8e] mb-2">{translate('response_length_desc', 'Control how detailed responses should be by default.')}</p>
                            <div className="relative">
                              <select
                                value={formData.responseLength}
                                onChange={(e) => handleInputChange('responseLength', e.target.value)}
                                className="w-full bg-white dark:bg-[#1d1d1b] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl px-4 py-2.5 text-[15px] outline-none appearance-none focus:border-[#033C81] dark:focus:border-[#033C81] transition-all cursor-pointer"
                              >
                                <option value="Concise">{translate('length_concise', 'Concise — Short, to-the-point answers')}</option>
                                <option value="Standard">{translate('length_standard', 'Standard — Balanced detail')}</option>
                                <option value="Detailed">{translate('length_detailed', 'Detailed — Comprehensive analysis')}</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e] pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Connectors' && (
                    <Motion.div
                      key="connectors-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-[18px] font-medium">{translate('connectors', 'Connectors')}</h3>
                          <p className="text-[13px] text-[#8e8e8e]">{translate('connectors_subtitle', 'Connect external apps and services')}</p>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              icon: Globe2,
                              title: 'Matsne.gov.ge',
                              desc: translate('connector_matsne_desc', 'Georgian Legal Database — 50,000+ laws, regulations, and legal acts indexed and searchable.'),
                              status: 'built_in' as const,
                            },
                            {
                              icon: FileText,
                              title: translate('connector_word_title', 'Microsoft Word Add-in'),
                              desc: translate('connector_word_desc', 'Draft, review, and edit contracts and legal documents directly in Microsoft Word with Doctoringo AI assistance.'),
                              status: 'coming_soon' as const,
                            },
                            {
                              icon: HardDrive,
                              title: translate('connector_gdrive_title', 'Google Drive'),
                              desc: translate('connector_gdrive_desc', 'Import and analyze legal documents directly from your Google Drive.'),
                              status: 'coming_soon' as const,
                            },
                            {
                              icon: Cloud,
                              title: translate('connector_dropbox_title', 'Dropbox'),
                              desc: translate('connector_dropbox_desc', 'Sync and access your legal document collections from Dropbox.'),
                              status: 'coming_soon' as const,
                            },
                            {
                              icon: Mail,
                              title: translate('connector_email_title', 'Email (IMAP)'),
                              desc: translate('connector_email_desc', 'Analyze legal correspondence and extract key information from emails.'),
                              status: 'coming_soon' as const,
                            },
                          ].map((connector) => (
                            <div key={connector.title} className="flex items-start justify-between gap-4 p-5 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] hover:bg-[#fcfaf7] dark:hover:bg-[#1f1f1f] transition-colors">
                              <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${connector.status === 'built_in' ? 'bg-[#2f9e44]/10 border-[#2f9e44]/30 text-[#2f9e44]' : 'bg-[#fcfaf7] dark:bg-[#1f1f1f] border-[#e5e5e0] dark:border-[#2d2d2d] text-[#8e8e8e]'}`}>
                                  <connector.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[14px] font-medium">{connector.title}</h4>
                                  <p className="text-[12px] text-[#8e8e8e] max-w-[500px]">{connector.desc}</p>
                                </div>
                              </div>
                              {connector.status === 'built_in' ? (
                                <span className="shrink-0 mt-1 px-3 py-1 rounded-full bg-[#2f9e44]/10 text-[#2f9e44] text-[11px] font-bold uppercase tracking-widest">
                                  {translate('built_in', 'Built-in')}
                                </span>
                              ) : (
                                <span className="shrink-0 mt-1 px-3 py-1 rounded-full bg-[#f3f2ee] dark:bg-[#2d2d2d] text-[#8e8e8e] text-[11px] font-bold uppercase tracking-widest">
                                  {translate('coming_soon', 'Coming Soon')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Legal Analytics' && (
                    <Motion.div
                      key="analytics-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-[18px] font-medium">{translate('research_analytics', 'Research Analytics')}</h3>
                            <p className="text-[13px] text-[#8e8e8e]">{translate('analytics_subtitle', 'Quantitative insights into your legal intelligence operations')}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                             {import.meta.env.VITE_FIREBASE_PROJECT_ID && (
                               <a
                                 href={`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/analytics`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-[#e5e5e0] dark:border-[#2d2d2d] text-[#033C81] hover:bg-[#033C81]/5 transition-colors"
                               >
                                 Firebase
                                 <ExternalLink size={10} />
                               </a>
                             )}
                             <button type="button"
                               onClick={() => setAnalyticsDays(7)}
                               className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${analyticsDays === 7 ? 'bg-[#f3f2ee] dark:bg-[#2d2d2d]' : 'border border-[#e5e5e0] dark:border-[#2d2d2d] text-[#8e8e8e]'}`}
                             >{translate('days_7', '7 Days')}</button>
                             <button type="button"
                               onClick={() => setAnalyticsDays(30)}
                               className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${analyticsDays === 30 ? 'bg-[#f3f2ee] dark:bg-[#2d2d2d]' : 'border border-[#e5e5e0] dark:border-[#2d2d2d] text-[#8e8e8e]'}`}
                             >{translate('days_30', '30 Days')}</button>
                          </div>
                        </div>

                        {analyticsLoading ? (
                          <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-[#033C81]" />
                          </div>
                        ) : analyticsData ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               {[
                                 { label: translate('total_messages', 'Total Messages'), value: analyticsData.summary?.total_messages?.toLocaleString() || '0', icon: Search },
                                 { label: translate('chat_sessions', 'Chat Sessions'), value: analyticsData.summary?.total_sessions?.toLocaleString() || '0', icon: MessageSquare },
                                 { label: translate('pro_queries', 'Pro Queries'), value: analyticsData.summary?.premium_queries?.toLocaleString() || '0', icon: Zap },
                               ].map((stat, i) => (
                                 <div key={i} className="p-6 bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] relative overflow-hidden group">
                                   <div className="relative z-10">
                                     <p className="text-[12px] text-[#8e8e8e] font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                                     <div className="flex items-baseline gap-3">
                                       <span className="text-[24px] font-serif font-bold">{stat.value}</span>
                                     </div>
                                   </div>
                                   <stat.icon size={48} className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform" />
                                 </div>
                               ))}
                            </div>

                            {/* Daily Activity Chart */}
                            {analyticsData.daily && analyticsData.daily.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('daily_activity', 'Daily Activity')}</h4>
                                <div className="p-6 bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px]">
                                  <div className="flex items-end gap-[3px] h-[120px] pt-8">
                                    {(() => {
                                      const maxQueries = Math.max(...analyticsData.daily.map((d: any) => d.queries), 1);
                                      return analyticsData.daily.map((day: any, i: number) => {
                                        const height = Math.max(4, (day.queries / maxQueries) * 100);
                                        const dateObj = new Date(day.date);
                                        const dayLabel = dateObj.toLocaleDateString(
                                          selectedLanguage === LanguageType.GEO ? 'ka-GE' : selectedLanguage === LanguageType.RUS ? 'ru-RU' : 'en-US',
                                          { day: 'numeric', month: 'short' }
                                        );
                                        return (
                                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                              {day.queries} {translate('queries', 'queries')}
                                            </div>
                                            <Motion.div
                                              initial={{ height: 0 }}
                                              animate={{ height: `${height}%` }}
                                              transition={{ delay: i * 0.03, duration: 0.4 }}
                                              className={`w-full rounded-t-md ${day.queries > 0 ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'} group-hover:bg-[#c07d5b] transition-colors cursor-default`}
                                            />
                                            {analyticsData.daily.length <= 14 && (
                                              <span className="text-[8px] text-[#8e8e8e] mt-1 truncate w-full text-center">{dayLabel}</span>
                                            )}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-4">
                              <h4 className="text-[13px] font-medium text-[#676767] dark:text-[#8e8e8e]">{translate('jurisdictional_distribution', 'Jurisdictional Distribution')}</h4>
                              <div className="min-h-[120px] w-full bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] flex items-center justify-center relative overflow-hidden p-6">
                                 <div className="absolute inset-0 opacity-10">
                                    <Globe2 className="w-full h-full scale-150 rotate-12" />
                                 </div>
                                 <div className="relative z-10 flex flex-col items-center gap-4">
                                    {analyticsData.jurisdictions && analyticsData.jurisdictions.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 justify-center">
                                        {analyticsData.jurisdictions.slice(0, 5).map((j: any, i: number) => {
                                          const colors = ['bg-[#033C81]', 'bg-[#033C81]', 'bg-[#8e8e8e]', 'bg-[#2f9e44]', 'bg-[#9c36b5]'];
                                          return (
                                            <div key={i} className={`px-3 py-1.5 ${colors[i % colors.length]} text-white rounded-lg text-[10px] font-bold uppercase tracking-widest`}>
                                              {j.country_name || j.country_code} ({j.percentage?.toFixed(0) || 0}%)
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[13px] text-[#8e8e8e]">{translate('no_jurisdiction_data', 'No jurisdiction data available yet')}</p>
                                    )}
                                 </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-[#e5e5e0] dark:text-[#2d2d2d]" />
                            <p className="text-[14px] text-[#8e8e8e]">{translate('no_analytics_data', 'No analytics data available')}</p>
                            <p className="text-[12px] text-[#b0b0b0] mt-1">{translate('start_chatting_analytics', 'Start chatting to generate analytics')}</p>
                          </div>
                        )}

                        {analyticsData && analyticsData.summary?.total_messages > 0 && (
                          <div className="p-6 border border-[#033C81]/20 bg-[#033C81]/5 rounded-[28px] flex items-start gap-4">
                            <Sparkles className="text-[#033C81] shrink-0 mt-0.5" size={20} />
                            <div>
                              <h4 className="text-[14px] font-medium text-[#033C81]">{translate('activity_summary', 'Activity Summary')}</h4>
                              <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">
                                {analyticsData.summary?.total_messages?.toLocaleString() || 0} {translate('messages', 'messages')} / {analyticsData.summary?.total_sessions?.toLocaleString() || 0} {translate('chat_sessions', 'sessions')} — {analyticsDays} {translate('days', 'days')}.
                                {analyticsData.summary?.premium_queries > 0 && ` ${analyticsData.summary.premium_queries} ${translate('pro_models_used', 'of those used Pro models.')}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </section>
                    </Motion.div>
                  )}

                  {activeTab === 'Legal' && (
                    <Motion.div 
                      key="legal-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <section className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-[18px] font-medium">{translate('legal_governance', 'Legal Governance')}</h3>
                          <p className="text-[13px] text-[#8e8e8e]">{translate('legal_governance_subtitle', 'Terms, Privacy, and Professional Compliance')}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {[
                            {
                              icon: FileText,
                              title: translate('terms_of_service_full', 'Terms of Service'),
                              date: translate('tos_last_updated', 'Last updated: January 15, 2026'),
                              desc: translate('terms_desc', 'The fundamental agreement governing your professional use of the Doctoringo AI ecosystem.'),
                              url: 'https://doctoringo.com/terms'
                            },
                            {
                              icon: ShieldCheck,
                              title: translate('covenant_of_privacy', 'Covenant of Privacy'),
                              date: translate('privacy_last_updated', 'Last updated: February 02, 2026'),
                              desc: translate('privacy_desc', 'Our commitment to the protection of your legal intelligence and data.'),
                              url: 'https://doctoringo.com/privacy-policy'
                            },
                            {
                              icon: Gavel,
                              title: translate('ai_disclaimer_title', 'AI Professional Disclaimer'),
                              date: translate('disclaimer_version', 'Version 2.4'),
                              desc: translate('ai_disclaimer_desc', 'Important notices regarding jurisdictional accuracy and professional liability.'),
                              url: 'https://doctoringo.com/disclaimer'
                            },
                            {
                              icon: Database,
                              title: translate('dpa_title', 'Data Processing Addendum (DPA)'),
                              date: translate('gdpr_ccpa_compliant', 'GDPR/CCPA Compliant'),
                              desc: translate('dpa_desc', 'Standard contractual clauses for international data transfers and multi-jurisdictional compliance.'),
                              url: 'https://doctoringo.com/dpa'
                            }
                          ].map((item, i) => (
                            <a
                              key={i}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-4 p-5 border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] text-left hover:bg-[#fcfaf7] dark:hover:bg-[#1f1f1f] transition-colors group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#fcfaf7] dark:bg-[#1f1f1f] flex items-center justify-center text-[#033C81] shrink-0 border border-[#e5e5e0] dark:border-[#2d2d2d]">
                                <item.icon size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                  <h4 className="text-[14px] font-medium">{item.title}</h4>
                                  <span className="text-[11px] text-[#8e8e8e] font-medium uppercase tracking-wider shrink-0">{item.date}</span>
                                </div>
                                <p className="text-[12px] text-[#8e8e8e] leading-relaxed mb-3">{item.desc}</p>
                                <div className="flex items-center gap-2 text-[12px] font-medium text-[#033C81] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>{translate('review_document', 'Review Document')}</span>
                                  <ExternalLink size={12} />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </section>

                      <section className="pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d] space-y-8">
                        <div className="p-6 bg-[#fcfaf7] dark:bg-[#1f1f1f] border border-[#e5e5e0] dark:border-[#2d2d2d] rounded-[28px] relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Scale size={80} />
                          </div>
                          <h4 className="text-[18px] font-medium mb-2">{translate('professional_notice', 'Professional Responsibility Notice')}</h4>
                          <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed mb-4 italic font-serif">
                            {translate('professional_notice_text', 'Doctoringo AI is a tool for legal practitioners. It does not constitute legal advice, nor does it create an attorney-client relationship. All generated content must be reviewed by a qualified legal professional.')}
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-2 text-[12px] text-[#8e8e8e]">
                          <div className="flex flex-wrap gap-4">
                            <span>© 2026 Doctoringo AI</span>
                            <span>{translate('entity_label', 'Entity: Doctoringo Intelligence Systems LLC')}</span>
                          </div>
                          <a
                            href="mailto:knowhowaiassistant@gmail.com"
                            className="flex items-center gap-2 hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
                          >
                            <Mail size={12} />
                            <span>knowhowaiassistant@gmail.com</span>
                          </a>
                        </div>
                      </section>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Desktop Close Button (hidden on mobile - mobile has header close) */}
          {!isMobile && (
          <button type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="absolute top-8 right-8 p-2 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          )}
      </Motion.div>
    </div>
  );
}
