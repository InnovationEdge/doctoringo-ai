import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Building2, Globe, Star, Users, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { paymentApi } from '../lib/api';
import { useCountry } from '../providers/CountryProvider';
import { useAuth } from '../providers/AuthProvider';
import { SEO } from './SEO';
const Motion = motion;

interface PricingInfo {
  region: string;
  currency: string;
  currency_symbol: string;
  amount: number;
  formatted: string;
}

interface PlansPageProps {
  onClose: () => void;
  onUpgrade?: () => void;
  language?: 'EN' | 'GE' | 'RU';
  user?: any;
}

export function PlansPage({ onClose, language: initialLanguage = 'EN' }: PlansPageProps) {
  const navigate = useNavigate();
  const { geoInfo } = useCountry();
  const { user } = useAuth();
  const isProUser = user?.subscription?.is_paid && user?.subscription?.is_active;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [language, setLanguage] = useState<'EN' | 'GE' | 'RU'>(initialLanguage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);

  // Fetch pricing based on user's IP location (geoInfo)
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // Use IP-based country detection from CountryProvider
        const region = geoInfo?.country_code || 'GE';
        const response = await paymentApi.getPricing(region);
        setPricing(response);
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
        // Fallback to default Georgian pricing if API fails
      }
    };
    if (geoInfo?.country_code) {
      fetchPricing();
    }
  }, [geoInfo?.country_code]);

  // Handle payment/upgrade - navigate to checkout page
  const handleUpgrade = (planName: string) => {
    if (planName === 'Free' || planName === 'უფასო' || planName === 'Бесплатно') {
      return;
    }

    // Enterprise/Max plan - open email
    if (planName === 'Max' || planName === 'მაქს' || planName === 'Макс') {
      window.open('mailto:knowhowaiassistant@gmail.com?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }

    // Close modal first, then navigate to checkout
    onClose();
    setTimeout(() => navigate('/checkout'), 50);
  };

  const handleLanguageChange = (lang: 'EN' | 'GE' | 'RU') => {
    setLanguage(lang);
  };

  const LFade = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <Motion.div
      key={language}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={className}
    >
      {children}
    </Motion.div>
  );

  const plans = [
    {
      name: language === 'EN' ? 'Free' : language === 'GE' ? 'უფასო' : 'Бесплатно',
      subtitle: language === 'EN' ? 'The Student of Law' : language === 'GE' ? 'საბაზისო გეგმა' : 'Студент права',
      priceLabel: '0',
      currency: pricing?.currency_symbol || (language === 'GE' ? 'ლ' : '$'),
      cta: !isProUser
        ? (language === 'EN' ? 'Current Plan' : language === 'GE' ? 'მიმდინარე გეგმა' : 'Текущий план')
        : (language === 'EN' ? 'Free Plan' : language === 'GE' ? 'უფასო გეგმა' : 'Бесплатный план'),
      features: language === 'EN' ? [
        'Limited legal research queries',
        'Standard drafting tools',
        'Document analysis (up to 5/mo)',
        'Access to Legal Basic model',
        'Mobile app access'
      ] : language === 'GE' ? [
        'შეზღუდული სამართლებრივი კვლევა',
        'სტანდარტული შედგენის ინსტრუმენტები',
        'დოკუმენტების ანალიზი (5/თვეში)',
        'Legal Basic მოდელი',
        'მობილური წვდომა'
      ] : [
        'Ограниченные запросы',
        'Стандартные инструменты',
        'Анализ документов (5/мес)',
        'Модель Legal Basic',
        'Доступ через приложение'
      ],
      icon: <Users className="w-6 h-6" />,
      bonus: null,
      disabled: true
    },
    {
      name: language === 'EN' ? 'Pro' : language === 'GE' ? 'პრო' : 'Про',
      subtitle: language === 'EN' ? 'The Practitioner' : language === 'GE' ? 'პროფესიონალური გეგმა' : 'Практик',
      priceLabel: pricing?.amount.toString() || (language === 'GE' ? '49' : '19'),
      currency: pricing?.currency_symbol || (language === 'GE' ? 'ლ' : '$'),
      subtext: billingCycle === 'yearly'
        ? (language === 'EN' ? '/ mo billed annually' : language === 'GE' ? '/ თვეში, წლიურად' : '/ мес ежегодно')
        : (language === 'EN' ? '/ mo billed monthly' : language === 'GE' ? '/ თვეში' : '/ мес ежемесячно'),
      cta: isProUser
        ? (language === 'EN' ? 'Current Plan' : language === 'GE' ? 'მიმდინარე გეგმა' : 'Текущий план')
        : (language === 'EN' ? 'Elevate Practice' : language === 'GE' ? 'გადასვლა Pro-ზე' : 'Улучшить практику'),
      disabled: !!isProUser,
      features: language === 'EN' ? [
        'Unlimited legal research',
        'Advanced drafting & templates',
        'Unlimited document analysis',
        'Access to Legal Pro model',
        'Priority support (2h response)',
        'LexisNexis & Westlaw Connectors',
        'Full Office Suite integration'
      ] : language === 'GE' ? [
        'შეუზღუდავი სამართლებრივი კვლევა',
        'გაფართოებული შაბლონები',
        'შეუზღუდავი დოკუმენტების ანალიზი',
        'Legal Pro მოდელი',
        'პრიორიტეტული მხარდაჭერა',
        'LexisNexis და Westlaw კავშირი',
        'Office Suite ინტეგრაცია'
      ] : [
        'Безлимитные исследования',
        'Продвинутые шаблоны',
        'Безлимитный анализ документов',
        'Модель Legal Pro',
        'Приоритетная поддержка',
        'LexisNexis и Westlaw',
        'Интеграция с Office'
      ],
      icon: <Zap className="w-6 h-6" />,
      popular: true,
      bonus: language === 'EN' ? 'Chosen by 85% of solo practitioners' : language === 'GE' ? 'პრაქტიკოსების 85%-ის არჩევანი' : 'Выбор 85% частных практиков'
    },
    {
      name: language === 'EN' ? 'Max' : language === 'GE' ? 'მაქს' : 'Макс',
      subtitle: language === 'EN' ? 'The Institution' : language === 'GE' ? 'კორპორატიული გეგმა' : 'Институция',
      priceLabel: language === 'EN' ? 'Custom' : language === 'GE' ? 'ინდ.' : 'Инд.',
      currency: '',
      subtext: language === 'EN' ? 'Contact sales' : language === 'GE' ? 'დაგვიკავშირდით' : 'Связаться с отделом продаж',
      cta: language === 'EN' ? 'Institutional Briefing' : language === 'GE' ? 'მოითხოვეთ შეხვედრა' : 'Презентация для фирмы',
      features: language === 'EN' ? [
        'Custom legal model fine-tuning',
        'Enterprise-grade security controls',
        'Dedicated success manager',
        'Full platform API access',
        'Team collaboration suite',
        'SOC 2 Type II assurance'
      ] : language === 'GE' ? [
        'მოდელის ინდივიდუალური კონფიგურაცია',
        'კორპორატიული უსაფრთხოება',
        'გამოყოფილი მენეჯერი',
        'სრული API წვდომა',
        'გუნდური თანამშრომლობა',
        'SOC 2 Type II სერტიფიკაცია'
      ] : [
        'Тонкая настройка моделей',
        'Корпоративный контроль',
        'Персональный менеджер',
        'Полный доступ к API',
        'Командная работа',
        'SOC 2 Type II'
      ],
      icon: <Building2 className="w-6 h-6" />,
      bonus: language === 'EN' ? 'Optimized for high-volume firms' : language === 'GE' ? 'მსხვილი ფირმებისთვის' : 'Для крупных юридических фирм'
    }
  ];

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#171717] z-[500] flex flex-col items-center pt-20 pb-20 px-6 font-sans transition-colors duration-300 overflow-y-auto overflow-x-hidden">
      <SEO
        title="ფასები — Doctoringo AI"
        description="Doctoringo AI გეგმები და ფასები. უფასო, Pro და Enterprise — აირჩიეთ თქვენთვის შესაფერისი გეგმა."
        url="/pricing"
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[550] px-4 md:px-6 py-3 bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-[#e5e5e5]/50 dark:border-transparent">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group/lang-sub">
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Globe className="w-3.5 h-3.5" />
              {language}
              <ChevronDown className="w-3 h-3 group-hover/lang-sub:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full mt-1.5 right-0 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2d2d2d] rounded-xl shadow-2xl overflow-hidden min-w-[110px] opacity-0 invisible group-hover/lang-sub:opacity-100 group-hover/lang-sub:visible transition-all duration-300 z-50">
              <button type="button" onClick={() => handleLanguageChange('EN')} className="w-full px-3.5 py-2 text-left text-[11px] font-medium hover:bg-[#f3f2ee] dark:hover:bg-[#2d2d2d] transition-colors border-b border-[#e5e5e5]/50 dark:border-[#2d2d2d]">English</button>
              <button type="button" onClick={() => handleLanguageChange('GE')} className="w-full px-3.5 py-2 text-left text-[11px] font-medium hover:bg-[#f3f2ee] dark:hover:bg-[#2d2d2d] transition-colors border-b border-[#e5e5e5]/50 dark:border-[#2d2d2d]">ქართული</button>
              <button type="button" onClick={() => handleLanguageChange('RU')} className="w-full px-3.5 py-2 text-left text-[11px] font-medium hover:bg-[#f3f2ee] dark:hover:bg-[#2d2d2d] transition-colors">Русский</button>
            </div>
          </div>
        </div>
        </div>
      </nav>

      <LFade className="flex flex-col items-center text-center gap-4 mb-12 px-4 max-w-[1200px] w-full">
        <h1 className="text-[32px] md:text-[48px] font-serif tracking-tight leading-[1.1] max-w-2xl">
          {language === 'EN' ? "Choose Your Plan" : language === 'GE' ? "აირჩიეთ თქვენი გეგმა" : "Выберите план"}
        </h1>
        <p className="text-[#676767] dark:text-[#8e8e8e] max-w-xl text-[15px] md:text-[17px] font-serif italic">
          {language === 'EN'
            ? '"The right tool is the foundation of a successful practice."'
            : language === 'GE' ? '"სწორი ინსტრუმენტი — წარმატებული პრაქტიკის საფუძველია."'
            : '"Правильный инструмент — основа успешной практики."'}
        </p>

        <div className="mt-6 flex bg-[#f3f2ee] dark:bg-[#1a1a1a] p-1 rounded-[18px] border border-[#e5e5e5] dark:border-[#2d2d2d] shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-[14px] text-[13px] font-semibold tracking-wide transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-[#2d2d2d] text-black dark:text-white shadow-lg' : 'text-[#8e8e8e]'}`}
          >
            {language === 'EN' ? "Monthly" : language === 'GE' ? "ყოველთვიური" : "Месяц"}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-[14px] text-[13px] font-semibold tracking-wide transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white dark:bg-[#2d2d2d] text-black dark:text-white shadow-lg' : 'text-[#8e8e8e]'}`}
          >
            {language === 'EN' ? "Yearly" : language === 'GE' ? "წლიური" : "Год"} <span className="text-[#033C81] font-semibold text-[10px] bg-[#033C81]/10 px-2 py-0.5 rounded-full">{language === 'EN' ? "Save 17%" : language === 'GE' ? "-17%" : "-17%"}</span>
          </button>
        </div>
      </LFade>

      <div className="max-w-[1100px] w-full grid grid-cols-1 md:grid-cols-3 gap-5 pb-12">
        {plans.map((plan, idx) => (
          <Motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * idx }}
            className={`bg-white dark:bg-[#121212] rounded-[28px] border flex flex-col h-full transition-all duration-500 relative group overflow-hidden ${plan.popular ? 'border-[#033C81] shadow-[0_24px_48px_-12px_rgba(212,142,108,0.12)]' : 'border-[#e5e5e5] dark:border-[#2d2d2d] hover:border-[#033C81]/30'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#033C81]" />
            )}

            <div className="p-7 pb-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 ${plan.popular ? 'bg-[#033C81] text-white rotate-3' : 'bg-[#f3f2ee] dark:bg-[#1a1a1a] text-[#8e8e8e] group-hover:text-[#033C81] group-hover:rotate-6'}`}>
                {plan.icon}
              </div>
              <h2 className="text-[24px] font-serif font-medium mb-0.5 tracking-tight">{plan.name}</h2>
              <p className={`text-[13px] mb-5 font-serif italic ${plan.popular ? 'text-[#033C81]' : 'text-[#676767] dark:text-[#8e8e8e]'}`}>{plan.subtitle}</p>

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[36px] font-serif font-medium tracking-tighter">{plan.priceLabel}</span>
                <span className="text-xl font-serif text-[#8e8e8e]">{plan.currency}</span>
                {plan.subtext && <span className="text-[11px] text-[#8e8e8e] font-medium uppercase tracking-wider ml-1.5">{plan.subtext}</span>}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!plan.disabled && !isProcessing) {
                    handleUpgrade(plan.name);
                  }
                }}
                disabled={plan.disabled || isProcessing}
                className={`w-full py-3.5 rounded-[16px] text-[13px] font-semibold uppercase tracking-[0.15em] transition-all mb-7 shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                  plan.disabled || isProcessing ? 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed' :
                  plan.popular
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-[#f3f2ee] dark:bg-[#1a1a1a] text-[#1a1a1a] dark:text-[#ececec] hover:bg-black dark:hover:bg-[#ececec] hover:text-white dark:hover:text-[#1a1a1a]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'EN' ? 'Processing...' : language === 'GE' ? 'მუშავდება...' : 'Обработка...'}</span>
                  </>
                ) : plan.cta}
              </button>
              {error && !plan.disabled && (
                <p className="text-red-500 text-[12px] text-center -mt-5 mb-3">{error}</p>
              )}
            </div>

            <div className="flex-1 p-7 pt-0 space-y-3.5">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 group/feature">
                  <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-colors ${plan.popular ? 'text-[#033C81]' : 'text-[#e5e5e5] group-hover/feature:text-[#033C81]'}`} />
                  <span className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{feature}</span>
                </div>
              ))}

              {plan.bonus && (
                <div className="flex items-center gap-2.5 pt-5 border-t border-[#f3f3f3] dark:border-[#2d2d2d] mt-3 opacity-80 italic text-[12px]">
                  <Star className="w-3.5 h-3.5 text-[#033C81] fill-[#033C81]" />
                  <span>{plan.bonus}</span>
                </div>
              )}
            </div>
          </Motion.div>
        ))}
      </div>
    </div>
  );
}
