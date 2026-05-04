import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppSidebar } from './components/AppSidebar';
import { ChatArea } from './components/ChatArea';
import { ChatsPage } from './components/ChatsPage';
import { AuthGuard, PublicRoute } from './components/AuthGuard';
import { authApi, chatApi, paymentApi } from './lib/api';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './components/ThemeContext';
import { useTranslation } from './providers/TranslationProvider';
import { LanguageType } from './core/types';

// Lazy-loaded components (not needed on initial load)
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const PlansPage = lazy(() => import('./components/PlansPage').then(m => ({ default: m.PlansPage })));
const SearchOverlay = lazy(() => import('./components/SearchOverlay').then(m => ({ default: m.SearchOverlay })));
const LegalDocumentsPage = lazy(() => import('./components/LegalDocumentsPage').then(m => ({ default: m.LegalDocumentsPage })));
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const CheckoutPage = lazy(() => import('./modules/payment/views/CheckoutPage'));
const PaymentSuccess = lazy(() => import('./modules/payment/views/PaymentSuccess'));
const SharedChatView = lazy(() => import('./components/SharedChatView').then(m => ({ default: m.SharedChatView })));
const BrandPage = lazy(() => import('./components/BrandPage').then(m => ({ default: m.BrandPage })));
const BarAssociationPage = lazy(() => import('./components/BarAssociationPage').then(m => ({ default: m.BarAssociationPage })));
const MatsnePage = lazy(() => import('./components/MatsnePage').then(m => ({ default: m.MatsnePage })));
const TermsPage = lazy(() => import('./components/legal/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPolicyPage = lazy(() => import('./components/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const DisclaimerPage = lazy(() => import('./components/legal/DisclaimerPage').then(m => ({ default: m.DisclaimerPage })));
const DPAPage = lazy(() => import('./components/legal/DPAPage').then(m => ({ default: m.DPAPage })));

const BookingModalLazy = lazy(() => import('./components/BookingModal').then(m => ({ default: m.BookingModal })));

const Motion = motion;

function DoctorinoLoginPage({ onLogin }: { onLogin: (data: any) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#171717] px-6">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {/* Logo */}
        <img src="/doctoringo-logo.png" alt="Doctoringo AI" className="w-20 h-20 object-contain" />

        <h1 className="text-3xl font-serif font-bold text-[#033C81] dark:text-white">Doctoringo AI</h1>
        <p className="text-center text-[#676767] dark:text-[#8e8e8e] text-[15px]">
          Healthcare in your pocket, 24/7
        </p>

        <button
          type="button"
          onClick={() => onLogin(null)}
          className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-[#033C81] hover:bg-[#022b5e] text-white rounded-xl text-[15px] font-medium transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLanguage } = useTranslation();
  const plansLanguage = selectedLanguage === LanguageType.GEO ? 'GE' as const : selectedLanguage === LanguageType.RUS ? 'RU' as const : 'EN' as const;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [chats, setChats] = useState<{ id: string, title: string }[]>([]);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('General');
  const [showPlans, setShowPlans] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [bookingIntent, setBookingIntent] = useState<any>(null);

  // Initialize — allow everyone in, check auth in background
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        if (userData && userData.id) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Guest mode — still allow access
          setUser({ id: 'guest', email: '', first_name: '', last_name: '' });
          setIsAuthenticated(true);
        }
      } catch {
        // Guest mode
        setUser({ id: 'guest', email: '', first_name: '', last_name: '' });
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for Supabase auth state changes (OAuth callback)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await authApi.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          navigate('/app', { replace: true });
        }
      }
    });

    const handleSessionExpired = () => {
      // Stay in guest mode instead of locking out
      setUser({ id: 'guest', email: '', first_name: '', last_name: '' });
      setIsAuthenticated(true);
    };

    const handleBookAppointment = (e: CustomEvent) => {
      setBookingIntent(e.detail);
    };

    const handleNewChatStarted = () => {
      loadChats();
    };

    const handleChatTitleUpdated = () => {
      loadChats();
    };

    const handleRefreshSessions = () => {
      loadChats();
    };

    const handleChatsDeleted = () => {
      setChats([]);
      setCurrentChatId(null);
      setCurrentChatTitle(null);
      setActiveTab('chat');
    };

    const handleProfileUpdated = (e: CustomEvent) => {
      const updates = e.detail;
      setUser((prev: any) => prev ? { ...prev, ...updates } : prev);
    };

    const handlePaymentSuccess = async () => {
      try {
        const sub = await paymentApi.getSubscriptionStatus();
        setUser((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev, subscription: sub };
          try { localStorage.setItem('doctoringo_user', JSON.stringify(updated)); } catch (e) { /* ignore */ }
          return updated;
        });
      } catch (e) {
        console.error('Failed to refresh subscription after payment:', e);
      }
    };

    window.addEventListener('session-expired', handleSessionExpired);
    window.addEventListener('new-chat-started', handleNewChatStarted);
    window.addEventListener('chat-title-updated', handleChatTitleUpdated);
    window.addEventListener('refresh-sessions', handleRefreshSessions);
    window.addEventListener('chats-deleted', handleChatsDeleted);
    window.addEventListener('profile-updated', handleProfileUpdated as EventListener);
    const handleOpenPlans = () => setShowPlans(true);

    window.addEventListener('payment-success', handlePaymentSuccess);
    window.addEventListener('open-plans', handleOpenPlans);
    window.addEventListener('book-appointment', handleBookAppointment as EventListener);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
      window.removeEventListener('new-chat-started', handleNewChatStarted);
      window.removeEventListener('chat-title-updated', handleChatTitleUpdated);
      window.removeEventListener('refresh-sessions', handleRefreshSessions);
      window.removeEventListener('chats-deleted', handleChatsDeleted);
      window.removeEventListener('profile-updated', handleProfileUpdated as EventListener);
      window.removeEventListener('book-appointment', handleBookAppointment as EventListener);
      window.removeEventListener('payment-success', handlePaymentSuccess);
      window.removeEventListener('open-plans', handleOpenPlans);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  const loadChats = async () => {
    try {
      const response = await chatApi.listSessions();
      setChats(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load chats');
    }
  };

  const handleLogin = async (userData: any) => {
    // If userData is provided (from Google OAuth callback), use it
    // Otherwise, this was triggered by clicking login button
    if (!userData) {
      authApi.loginWithGoogle();
      return;
    }

    const userWithLang = { ...userData, language: (window as any).currentLanguage || 'EN' };
    setUser(userWithLang);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('doctoringo_user', JSON.stringify(userWithLang));
    } catch (e) {
      console.warn('LocalStorage write failed');
    }

    // Navigate to onboarding or app
    if (!userWithLang.jurisdiction) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  };

  const handleOnboardingComplete = (onboardingData: { jurisdiction: string, role: string, domains: string[] }) => {
    const updatedUser = { ...user, ...onboardingData };
    setUser(updatedUser);
    try {
      localStorage.setItem('doctoringo_user', JSON.stringify(updatedUser));
    } catch (e) {
      // ignore
    }
    navigate('/app', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('doctoringo_user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentChatId(null);
    setCurrentChatTitle(null);
    setActiveTab('chat');
    setChats([]);
    navigate('/', { replace: true });
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentChatTitle(null);
    setActiveTab('chat');
    setIsMobileMenuOpen(false);
  };

  const handleSelectChat = (id: string, title: string) => {
    setCurrentChatId(id);
    setCurrentChatTitle(title);
    setActiveTab('chat');
    setIsMobileMenuOpen(false);
  };

  // Minimalistic transition settings
  const pageTransition = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }
  };

  // Dashboard layout - JSX variable (NOT a component function) to prevent remounting on parent re-render
  const dashboardLayout = (
    <Motion.div key="dashboard" {...pageTransition} className="flex h-screen overflow-hidden font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <AnimatePresence mode="sync">
        {!isIncognito && (
          <Motion.div
            key="sidebar-desktop"
            initial={false}
            animate={{ width: isSidebarCollapsed ? 72 : 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:block bg-[#f9f9f8] dark:bg-[#171717] h-full flex-shrink-0 overflow-hidden"
          >
            <AppSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onToggleSearch={() => setShowSearch(true)}
              onOpenSettings={(tab = 'General') => { setSettingsTab(tab); setShowSettings(true); }}
              onOpenUpgrade={() => setShowPlans(true)}
              currentChatId={currentChatId}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              chats={chats}
              user={user}
              isIncognito={isIncognito}
              setIsIncognito={setIsIncognito}
              onRefreshChats={loadChats}
            />
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && !isIncognito && (
          <div className="fixed inset-0 z-[150] md:hidden">
            <Motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <Motion.div
              key="sidebar-mobile"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px]"
            >
              <AppSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onToggleSearch={() => { setShowSearch(true); setIsMobileMenuOpen(false); }}
                onOpenSettings={(tab = 'General') => { setSettingsTab(tab); setShowSettings(true); setIsMobileMenuOpen(false); }}
                onOpenUpgrade={() => { setShowPlans(true); setIsMobileMenuOpen(false); }}
                currentChatId={currentChatId}
                isCollapsed={false}
                setIsCollapsed={() => {}}
                isMobile={true}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                chats={chats}
                user={user}
                isIncognito={isIncognito}
                setIsIncognito={setIsIncognito}
                onRefreshChats={loadChats}
              />
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <AnimatePresence mode="wait">
          <Motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 2 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {activeTab === 'chat' && (
              <ChatArea
                chatId={currentChatId}
                chatTitle={currentChatTitle}
                isSidebarCollapsed={isSidebarCollapsed}
                isIncognito={isIncognito}
                setIsIncognito={setIsIncognito}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                user={user}
              />
            )}

            {activeTab === 'chats' && (
              <ChatsPage
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                currentChatId={currentChatId}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                chats={chats}
              />
            )}

            {activeTab === 'documents' && (
              <LegalDocumentsPage
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                language={plansLanguage}
                user={user}
                onOpenUpgrade={() => setShowPlans(true)}
              />
            )}

            {activeTab !== 'chat' && activeTab !== 'chats' && activeTab !== 'documents' && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <h2 className="text-2xl font-serif">Coming Soon</h2>
                <p>The {activeTab} section is currently under development.</p>
              </div>
            )}
          </Motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays/Modals (lazy-loaded) */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showSearch && (
            <SearchOverlay
              isOpen={showSearch}
              onClose={() => setShowSearch(false)}
              onSelectChat={handleSelectChat}
              user={user}
            />
          )}
        </AnimatePresence>

        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            initialTab={settingsTab}
            user={user}
          />
        )}
        {showPlans && (
          <PlansPage
            onClose={() => setShowPlans(false)}
            language={plansLanguage}
          />
        )}
        {bookingIntent && (
          <BookingModalLazy
            intent={bookingIntent}
            isOpen={!!bookingIntent}
            onClose={() => setBookingIntent(null)}
          />
        )}
      </Suspense>
    </Motion.div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#171717]">
      <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#171717]" />}>
      <Routes>
        {/* Root redirect - go straight to app */}
        <Route
          path="/"
          element={<Navigate to="/app" replace />}
        />

        {/* Onboarding route - Protected */}
        <Route
          path="/onboarding"
          element={
            <AuthGuard isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <AnimatePresence mode="wait">
                <Motion.div key="onboarding" {...pageTransition} className="min-h-screen">
                  <OnboardingFlow
                    onComplete={handleOnboardingComplete}
                    language={plansLanguage}
                  />
                </Motion.div>
              </AnimatePresence>
            </AuthGuard>
          }
        />

        {/* Main app route - login required */}
        <Route
          path="/app"
          element={
            isLoading ? (
              <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#171717]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
              </div>
            ) : isAuthenticated ? (
              dashboardLayout
            ) : (
              <DoctorinoLoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Pricing page - Public */}
        <Route
          path="/pricing"
          element={
            <AnimatePresence mode="wait">
              <Motion.div key="pricing" {...pageTransition} className="min-h-screen">
                <PlansPage onClose={() => navigate('/app')} language={plansLanguage} />
              </Motion.div>
            </AnimatePresence>
          }
        />

        {/* Checkout page - Protected */}
        <Route
          path="/checkout"
          element={
            <AuthGuard isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <CheckoutPage />
            </AuthGuard>
          }
        />

        {/* Payment success - Protected */}
        <Route
          path="/payment/success"
          element={
            <AuthGuard isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <PaymentSuccess />
            </AuthGuard>
          }
        />

        {/* Shared chat view - Public */}
        <Route
          path="/shared/:token"
          element={
            <AnimatePresence mode="wait">
              <Motion.div key="shared" {...pageTransition} className="min-h-screen">
                <SharedChatView />
              </Motion.div>
            </AnimatePresence>
          }
        />

        {/* Brand assets / logo download - Public */}
        <Route
          path="/brand"
          element={
            <AnimatePresence mode="wait">
              <Motion.div key="brand" {...pageTransition} className="min-h-screen">
                <BrandPage />
              </Motion.div>
            </AnimatePresence>
          }
        />

        {/* Bar Association partnership page - Public */}
        <Route
          path="/bar-association"
          element={
            <AnimatePresence mode="wait">
              <Motion.div key="bar-association" {...pageTransition} className="min-h-screen">
                <BarAssociationPage />
              </Motion.div>
            </AnimatePresence>
          }
        />

        {/* Matsne.gov.ge AI search demo - Public */}
        <Route
          path="/matsne"
          element={
            <AnimatePresence mode="wait">
              <Motion.div key="matsne" {...pageTransition} className="min-h-screen">
                <MatsnePage />
              </Motion.div>
            </AnimatePresence>
          }
        />

        {/* Legal pages - Public */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/dpa" element={<DPAPage />} />

        {/* Catch all - redirect to app */}
        <Route
          path="*"
          element={<Navigate to="/app" replace />}
        />
      </Routes>
      </Suspense>
    </div>
  );
}
