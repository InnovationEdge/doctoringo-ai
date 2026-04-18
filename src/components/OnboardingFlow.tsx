import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Scale, BookOpen, Building2, Users, ArrowRight, Check, ChevronLeft, Lock as LockIcon, Briefcase, Landmark, Fingerprint, Search, Gavel } from 'lucide-react';
import { DoctorLogo } from './DoctorLogo';
import { authApi, countriesApi, Country } from '../lib/api';

const Motion = motion;

interface OnboardingFlowProps {
  onComplete: (data: { jurisdiction: string, role: string, domains: string[] }) => void;
  language?: 'EN' | 'GE' | 'RU';
}

// Default jurisdictions (fallback if API fails)
const defaultJurisdictions = [
  { id: 'georgia', name: 'Georgia (GEO)', flag: '🇬🇪', code: 'GE' },
  { id: 'usa-federal', name: 'United States', flag: '🇺🇸', code: 'US' },
  { id: 'eu-general', name: 'European Union', flag: '🇪🇺', code: 'EU' },
  { id: 'all-global', name: 'Global Knowledge', flag: '🌍', code: 'GLOBAL' },
];

export function OnboardingFlow({ onComplete, language = 'EN' }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>('georgia'); // Default to Georgian jurisdiction
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dynamicJurisdictions, setDynamicJurisdictions] = useState<Array<{id: string, name: string, flag: string, code: string, documentCount?: number}>>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  // Fetch countries from API on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await countriesApi.getCountries();
        if (response.success && response.countries.length > 0) {
          // Map API response to jurisdiction format
          const jurisdictions = response.countries
            .filter((c: Country) => c.is_active)
            .map((c: Country) => ({
              id: c.code.toLowerCase(),
              name: c.name,
              flag: c.flag_emoji,
              code: c.code,
              documentCount: c.document_count,
            }));
          setDynamicJurisdictions(jurisdictions);
        }
      } catch (error) {
        console.error('Failed to fetch countries, using defaults:', error);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const t: Record<string, any> = {
    EN: {
      step0: {
        title: "Hey there, I'm Doctoringo.",
        subtitle: "I'm your AI legal assistant for research, drafting, and complex case analysis.",
        cta: "Let's get started"
      },
      step1: {
        title: "What's your focus?",
        subtitle: "Help me tailor my analysis to your specific professional context.",
        cta: "Next Step"
      },
      step2: {
        title: "Set Your Legal Compass",
        subtitle: "Select your primary jurisdiction to align my intelligence with local legislation.",
        cta: "Confirm Selection"
      },
      step3: {
        title: "Preferred Domains",
        subtitle: "Which areas of law do you work in most frequently? (Select all that apply)",
        cta: "Continue"
      },
      step4: {
        title: "The Privacy Covenant",
        subtitle: "Your cases and research are never used for training. Secure and private by design.",
        cta: "I understand"
      },
      step5: {
        title: "Ready for Precision?",
        subtitle: "Your workspace is ready. Let's start solving legal problems.",
        cta: "Enter Doctoringo"
      },
      back: "Back",
      roles: [
        { id: 'lawyer', name: 'Legal Professional', icon: Scale },
        { id: 'student', name: 'Law Student', icon: BookOpen },
        { id: 'business', name: 'Business / Corporate', icon: Building2 },
        { id: 'other', name: 'Other', icon: Users }
      ],
      // Jurisdictions now loaded from API, with fallback
      jurisdictions: dynamicJurisdictions.length > 0 ? dynamicJurisdictions : defaultJurisdictions,
      domains: [
        { id: 'criminal', name: 'Criminal Law', icon: Gavel },
        { id: 'civil', name: 'Civil Law', icon: Users },
        { id: 'corporate', name: 'Corporate / M&A', icon: Building2 },
        { id: 'tax', name: 'Tax / Finance', icon: Landmark },
        { id: 'ip', name: 'IP / Technology', icon: Fingerprint },
        { id: 'labor', name: 'Labor / HR', icon: Briefcase }
      ]
    },
    GE: {
      step0: {
        title: "გამარჯობა, მე ვარ Doctoringo.",
        subtitle: "მე ვარ თქვენი იურიდიული AI ასისტენტი კვლევისთვის, დრაფტინგისთვის და ანალიზისთვის.",
        cta: "დავიწყოთ"
      },
      step1: {
        title: "რა არის თქვენი სფერო?",
        subtitle: "დამეხმარეთ მოვარგო ჩემი ანალიზი თქვენს პროფესიულ კონტექსტს.",
        cta: "შემდეგი ნაბიჯი"
      },
      step2: {
        title: "აირჩიეთ იურისდიქცია",
        subtitle: "აირჩიეთ ძირითადი კანონმდებლობა ჩემი ინტელექტის მოსარგებად.",
        cta: "არჩევანის დადასტურება"
      },
      step3: {
        title: "სფეროები",
        subtitle: "სამართლის რომელ სფეროებში მუშაობთ ყველაზე ხშირად? (აირჩიეთ რამოდენიმე)",
        cta: "გაგრძელება"
      },
      step4: {
        title: "კონფიდენციალურობა",
        subtitle: "თქვენი მონაცემები არ გამოიყენება მოდელის მოსამზადებლად. დაცულია დიზაინით.",
        cta: "გავიგე"
      },
      step5: {
        title: "მზად ხართ?",
        subtitle: "თქვენი სამუშაო სივრცე მზად არის. დაიწყეთ იურიდიული საკითხების გადაჭრა.",
        cta: "Doctoringo-ში შესვლა"
      },
      back: "უკან",
      roles: [
        { id: 'lawyer', name: 'იურისტი', icon: Scale },
        { id: 'student', name: 'სტუდენტი', icon: BookOpen },
        { id: 'business', name: 'ბიზნესი', icon: Building2 },
        { id: 'other', name: 'სხვა', icon: Users }
      ],
      // Jurisdictions now loaded from API, with fallback
      jurisdictions: dynamicJurisdictions.length > 0 ? dynamicJurisdictions : defaultJurisdictions,
      domains: [
        { id: 'criminal', name: 'სისხლის სამართალი', icon: Gavel },
        { id: 'civil', name: 'სამოქალაქო', icon: Users },
        { id: 'corporate', name: 'კორპორატიული', icon: Building2 },
        { id: 'tax', name: 'საგადასახადო', icon: Landmark },
        { id: 'ip', name: 'IP / ტექნოლოგიები', icon: Fingerprint },
        { id: 'labor', name: 'შრომითი', icon: Briefcase }
      ]
    },
    RU: {
      step0: {
        title: "Привет, я Doctoringo.",
        subtitle: "Я ваш юридический ИИ-помощник для исследований, составления документов и анализа.",
        cta: "Начать"
      },
      step1: {
        title: "Ваша сфера деятельности?",
        subtitle: "Помогите мне настроить анализ под ваш профессиональный контекст.",
        cta: "Далее"
      },
      step2: {
        title: "Выберите юрисдикцию",
        subtitle: "Выберите основное законодательство для настройки моего интеллекта.",
        cta: "Подтвердить выбор"
      },
      step3: {
        title: "Сферы интересов",
        subtitle: "В каких областях права вы работаете чаще всего? (Выберите несколько)",
        cta: "Продолжить"
      },
      step4: {
        title: "Обещание приватности",
        subtitle: "Ваши данные никогда не используются для обучения. Безопасно по определению.",
        cta: "Я понимаю"
      },
      step5: {
        title: "Все готово?",
        subtitle: "Ваше рабочее пространство готово. Приступим к решению задач.",
        cta: "Войти в Doctoringo"
      },
      back: "Назад",
      roles: [
        { id: 'lawyer', name: 'Юрист', icon: Scale },
        { id: 'student', name: 'Студент', icon: BookOpen },
        { id: 'business', name: 'Бизнес', icon: Building2 },
        { id: 'other', name: 'Другое', icon: Users }
      ],
      // Jurisdictions now loaded from API, with fallback
      jurisdictions: dynamicJurisdictions.length > 0 ? dynamicJurisdictions : defaultJurisdictions,
      domains: [
        { id: 'criminal', name: 'Уголовное право', icon: Gavel },
        { id: 'civil', name: 'Гражданское', icon: Users },
        { id: 'corporate', name: 'Корпоративное', icon: Building2 },
        { id: 'tax', name: 'Налоговое', icon: Landmark },
        { id: 'ip', name: 'IP / Технологии', icon: Fingerprint },
        { id: 'labor', name: 'Трудовое', icon: Briefcase }
      ]
    }
  };

  const currentT = t[language] || t.EN;

  const nextStep = async () => {
    if (step === 1 && !selectedRole) return;
    if (step === 2 && !selectedJurisdiction) return;
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Save to backend before completing
      setIsSaving(true);
      setSaveError(null);
      try {
        await authApi.updateProfile({
          jurisdiction: selectedJurisdiction!,
          role: selectedRole!,
          domains: selectedDomains
        });
        // Success - complete onboarding
        onComplete({
          jurisdiction: selectedJurisdiction!,
          role: selectedRole!,
          domains: selectedDomains
        });
      } catch (error) {
        console.error('Failed to save profile during onboarding:', error);
        setSaveError(language === 'GE'
          ? 'პროფილის შენახვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.'
          : 'Failed to save profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#fcfcf9] dark:bg-[#171717] flex flex-col items-center overflow-hidden h-screen transition-colors duration-300">
      {/* Top Progress - Subtle Indicator */}
      <div className="w-full max-w-md pt-12 px-6 md:px-8 flex gap-2 justify-center">
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={`h-1 flex-1 rounded-full transition-all duration-700 ${
              s === step ? 'bg-[#033C81]' : s < step ? 'bg-black dark:bg-white opacity-40' : 'bg-[#e5e5e0] dark:bg-[#2d2d2d]'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center w-full max-w-xl px-6 md:px-12 py-10 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <Motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="w-20 md:w-24 h-20 md:h-24 flex items-center justify-center text-[#033C81] bg-[#033C81]/5 rounded-full mb-4">
                <DoctorLogo className="w-12 md:w-16 h-12 md:h-16" />
              </div>
              <div className="space-y-4">
                <h1 className="text-[28px] md:text-[40px] font-serif leading-tight tracking-tight text-[#1a1a1a] dark:text-white px-2">
                  {currentT.step0.title}
                </h1>
                <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto leading-relaxed px-4">
                  {currentT.step0.subtitle}
                </p>
              </div>
              <button type="button"
                onClick={nextStep}
                className="group flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-[11px] md:text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/5"
              >
                {currentT.step0.cta}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Motion.div>
          )}

          {step === 1 && (
            <Motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center space-y-8 w-full"
            >
              <div className="text-center space-y-3">
                <h2 className="text-[28px] md:text-[32px] font-serif text-[#1a1a1a] dark:text-white">
                  {currentT.step1.title}
                </h2>
                <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto">
                  {currentT.step1.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {currentT.roles.map((role: any) => (
                  <button type="button"
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex flex-col items-center gap-3 p-4 md:p-6 rounded-[24px] border transition-all text-center ${
                      selectedRole === role.id 
                      ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.02]' 
                      : 'bg-white dark:bg-[#212121] border-[#e5e5e0] dark:border-[#2d2d2d] hover:border-[#033C81] dark:hover:border-[#033C81]'
                    }`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${selectedRole === role.id ? 'bg-white/10 dark:bg-black/10' : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#033C81]'}`}>
                      <role.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-[13px] md:text-[14px] font-medium leading-tight">{role.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full pt-6 gap-4">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors py-2 cursor-pointer">
                  <ChevronLeft size={16} />
                  {currentT.back}
                </button>
                <button type="button"
                  onClick={nextStep}
                  disabled={!selectedRole}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all ${
                    selectedRole 
                    ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95' 
                    : 'bg-[#e5e5e0] dark:bg-[#2d2d2d] text-[#8e8e8e] cursor-not-allowed opacity-50'
                  }`}
                >
                  {currentT.step1.cta}
                  <ArrowRight size={16} />
                </button>
              </div>
            </Motion.div>
          )}

          {step === 2 && (
            <Motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center space-y-8 w-full"
            >
              <div className="text-center space-y-3">
                <h2 className="text-[28px] md:text-[32px] font-serif text-[#1a1a1a] dark:text-white">
                  {currentT.step2.title}
                </h2>
                <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto">
                  {currentT.step2.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {currentT.jurisdictions.map((j: any) => (
                  <button type="button"
                    key={j.id}
                    onClick={() => setSelectedJurisdiction(j.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedJurisdiction === j.id 
                      ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.02]' 
                      : 'bg-white dark:bg-[#212121] border-[#e5e5e0] dark:border-[#2d2d2d] hover:border-[#033C81] dark:hover:border-[#033C81]'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{j.flag}</span>
                    <span className="text-[13px] md:text-[14px] font-medium leading-tight">{j.name}</span>
                    {selectedJurisdiction === j.id && <Check size={16} className="ml-auto shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full pt-6 gap-4">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors py-2 cursor-pointer">
                  <ChevronLeft size={16} />
                  {currentT.back}
                </button>
                <button type="button"
                  onClick={nextStep}
                  disabled={!selectedJurisdiction}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all ${
                    selectedJurisdiction 
                    ? 'bg-[#033C81] text-white hover:scale-105 shadow-lg active:scale-95' 
                    : 'bg-[#e5e5e0] dark:bg-[#2d2d2d] text-[#8e8e8e] cursor-not-allowed opacity-50'
                  }`}
                >
                  {currentT.step2.cta}
                  <ArrowRight size={16} />
                </button>
              </div>
            </Motion.div>
          )}

          {step === 3 && (
            <Motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center space-y-8 w-full"
            >
              <div className="text-center space-y-3">
                <h2 className="text-[28px] md:text-[32px] font-serif text-[#1a1a1a] dark:text-white">
                  {currentT.step3.title}
                </h2>
                <p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto">
                  {currentT.step3.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {currentT.domains.map((domain: any) => (
                  <button type="button"
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      selectedDomains.includes(domain.id) 
                      ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black border-transparent shadow-lg' 
                      : 'bg-white dark:bg-[#212121] border-[#e5e5e0] dark:border-[#2d2d2d] hover:border-[#033C81] dark:hover:border-[#033C81]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedDomains.includes(domain.id) ? 'bg-white/20' : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#033C81]'}`}>
                       <domain.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium leading-tight">{domain.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full pt-6 gap-4">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors py-2 cursor-pointer">
                  <ChevronLeft size={16} />
                  {currentT.back}
                </button>
                <button type="button"
                  onClick={nextStep}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 shadow-lg`}
                >
                  {currentT.step3.cta}
                  <ArrowRight size={16} />
                </button>
              </div>
            </Motion.div>
          )}

          {step === 4 && (
            <Motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center space-y-10"
            >
              <div className="relative">
                <div className="w-24 h-24 flex items-center justify-center text-[#033C81] bg-[#033C81]/5 rounded-[32px] rotate-12 transition-transform hover:rotate-0 duration-500">
                  <Shield size={48} />
                </div>
                <Motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg"
                >
                  <LockIcon size={14} />
                </Motion.div>
              </div>
              <div className="space-y-4">
                <h2 className="text-[28px] md:text-[32px] font-serif text-[#1a1a1a] dark:text-white">
                  {currentT.step4.title}
                </h2>
                <p className="text-[16px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto leading-relaxed italic">
                  "{currentT.step4.subtitle}"
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full pt-6 gap-4">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors py-2 cursor-pointer">
                  <ChevronLeft size={16} />
                  {currentT.back}
                </button>
                <button type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {currentT.step4.cta}
                  <ArrowRight size={18} />
                </button>
              </div>
            </Motion.div>
          )}

          {step === 5 && (
            <Motion.div
              key="step5"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-10"
            >
              <div className="w-24 h-24 flex items-center justify-center text-[#033C81] bg-[#033C81]/5 rounded-full relative">
                <Sparkles size={48} className="animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-[#033C81]/20 animate-ping" />
              </div>
              <div className="space-y-4">
                <h2 className="text-[32px] md:text-[40px] font-serif text-[#1a1a1a] dark:text-white leading-tight">
                  {currentT.step5.title}
                </h2>
                <p className="text-[18px] text-[#676767] dark:text-[#8e8e8e] max-w-sm mx-auto">
                  {currentT.step5.subtitle}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 w-full">
                {saveError && (
                  <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                    {saveError}
                  </div>
                )}
                <button type="button"
                  onClick={nextStep}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-[#033C81] text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] md:text-[13px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[#033C81]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      {language === 'GE' ? 'შენახვა...' : language === 'RU' ? 'Сохранение...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {currentT.step5.cta}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
                <button type="button"
                  onClick={prevStep}
                  disabled={isSaving}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {currentT.back}
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Footer - Minimal */}
      <div className="pb-12 px-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8e8e8e]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          {language === 'EN' ? "Encryption Active" : language === 'GE' ? "დაშიფვრა აქტიურია" : "Шифрование активно"}
        </div>
      </div>
    </div>
  );
}

