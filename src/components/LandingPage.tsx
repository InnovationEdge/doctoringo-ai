import React, { useState } from 'react';
import { 
  Mail, RefreshCw, Shield, Zap, Globe, Cpu, Twitter, Linkedin, Github, Menu, X, 
  CheckCircle, BookOpen, Lock, Terminal, Users, Scale, FileText, Gavel, 
  ShieldCheck, Search, Database, Send, MessageSquare, MapPin, Building2, Minus, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DoctorLogo } from './DoctorLogo';
import { ImageWithFallback } from './figma/ImageWithFallback';
import lawyerImg from '../assets/lawyer-illustration.webp';
import { authApi, contactApi } from '../lib/api';
import { SEO } from './SEO';

const Motion = motion;

interface LandingPageProps {
  onLogin: (userData: any) => void;
  onNavigate: (step: string) => void;
}

export function LandingPage({ onLogin, onNavigate }: LandingPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'GE' | 'RU'>('EN');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) return;

    setContactSubmitting(true);
    try {
      await contactApi.submit({
        name: contactForm.name,
        email: contactForm.email,
        subject: 'Contact Form - Landing Page',
        message: contactForm.message,
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      console.error('Contact form submission failed:', error);
    } finally {
      setContactSubmitting(false);
    }
  };

  const t: Record<string, any> = {
    EN: {
      meet: "Meet Doctoringo",
      platform: "Platform",
      solutions: "Solutions",
      pricing: "Pricing",
      contact: "Contact or Support",
      contactShort: "Contact Sales",
      try: "Try Doctoringo",
      heroTitle1: "Legal?",
      heroTitle2: "Explained.",
      heroSubtitle: "The AI for legal problem solvers",
      continueGoogle: "Continue with Google",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Legal / Terms",
      madeIn: "Made with precision in Tbilisi",
      meetDesc: "Doctoringo is a next generation AI assistant built for legal professionals and trained to be safe, accurate, and secure to help you do your best work.",
      createTitle: "Create with Doctoringo",
      createDesc: "Draft and iterate on briefs, contracts, and legal opinions alongside your chat with specialized document modes.",
      bringTitle: "Bring your knowledge",
      bringDesc: "Upload case files and evidentiary documents to receive precise, cited analysis based exclusively on your context.",
      collabTitle: "Collaborate with your team",
      collabDesc: "Share research threads and document drafts securely across your entire firm with enterprise-grade controls.",
      deepTitle: "Deep Analysis",
      deepDesc: "Identify risks in multi-party agreements and receive immediate suggestions for clause optimization based on judicial trends.",
      procTitle: "Procedural Intelligence",
      procDesc: "Automated tracking of filing deadlines and procedural requirements across Georgian and international courts.",
      learnTitle: "Continuous Learning",
      learnDesc: "Our models are updated daily with new case law, legislative amendments, and administrative regulations.",
      individual: "Individual",
      enterpriseOnly: "For enterprises only",
      billedMonthly: "Per month",
      freeForEveryone: "Free for everyone",
      includes: "Includes:",
      everythingFree: "Everything in Basic, plus:",
      everythingPro: "Everything in Pro, plus:",
      everythingMax: "Everything in Pro, plus:",
      taxNote: "Prices shown do not include applicable tax. *Usage limits apply.",
      faqTitle: "Frequently asked questions",
      getInTouch: "Get in touch",
      contactDesc: "Whether you're an individual practitioner or a global firm, we're here to help you scale your legal intelligence.",
      formName: "Full Name",
      formEmail: "Work Email",
      formMessage: "How can we help?",
      sendMessage: "Send Message",
      reachOut: "Reach out to us",
      jurisdictionTitle: "Intelligence for every jurisdiction",
      geoLawDesc: "Comprehensive database of Georgian judicial precedents, civil codes, and statutory legislation.",
      intlLawDesc: "Support for international legal standards, comparative law analysis, and cross-border regulatory compliance.",
      multiLangDesc: "Context-aware processing engine capable of translating complex legal concepts between EN, GE and RU accurately.",
      tagline: "The AI cognitive layer for modern legal problem solvers.",
      status: "Systems Operational",
      legalMax: "Legal Max"
    },
    GE: {
      meet: "გაიცანით Doctoringo",
      platform: "პლატფორმა",
      solutions: "გადაწყვეტილებები",
      pricing: "ფასები",
      contact: "კონტაქტი ან მხარდაჭერა",
      contactShort: "გაყიდვები",
      try: "სცადეთ Doctoringo",
      heroTitle1: "სამართალი?",
      heroTitle2: "ახსნილია.",
      heroSubtitle: "ხელოვნური ინტელექტი სამართლებრივი პრობლემების გადამჭრელებისთვის",
      continueGoogle: "Google-ით გაგრძელება",
      privacyPolicy: "კონფიდენციალურობის პოლიტიკა",
      termsOfService: "სამართლებრივი / წესები",
      madeIn: "შექმნილია თბილისში",
      meetDesc: "Doctoringo არის შემდეგი თაობის AI ასისტენტი, რომელიც შექმნილია იურიდიული პროფესიონალებისთვის და გაწვრთნილია უსაფრთხოების, სიზუსტისა და დაცულობისთვის.",
      createTitle: "შექმენით Doctoringo-სთან ერთად",
      createDesc: "მოამზადეთ სარჩელები, კონტრაქტები და იურიდიული დასკვნები სპეციალიზებული დოკუმენტების რეჟიმში.",
      bringTitle: "შემოიტანეთ თქვენი ცოდნა",
      bringDesc: "ატვირთეთ საქმის მასალები და მტკიცებულებები ზუსტი, ციტირებული ანალიზის მისაღებად.",
      collabTitle: "ითანამშრომლეთ გუნდთან",
      collabDesc: "გააზიარეთ კვლევები და დოკუმენტები უსაფრთხოდ მთელ ფირმაში ენტერპრაიზ-დონის კონტროლით.",
      deepTitle: "ღრმა ანალიზი",
      deepDesc: "იდენტიფიცირ���ბა მოახდინეთ რისკების მრავალმხრივ ხელშეკრულებებში და მიიღეთ რეკომენდაციები ოპტიმიზაციისთვის სასამართლო ტენდენციებზე დაყრდნობით.",
      procTitle: "პროცედურული ინტელექტი",
      procDesc: "ვადებისა და პროცედურული მოთხოვნების ავტომატური მონიტორინგი საქართველოსა და საერთაშორისო სასამართლოებში.",
      learnTitle: "უწყვეტი სწავლება",
      learnDesc: "ჩვენი მოდელები ყოველდღიურად ახლდება ახალი სასამართლო პრაქტიკით, საკანონ����დებლო ცვლილებებითა და რეგულაციებით.",
      individual: "ინდივიდუალური",
      enterpriseOnly: "მხოლოდ საწარმოებისთვის",
      billedMonthly: "თვეში",
      freeForEveryone: "უფასო ყველასთვის",
      includes: "მოიცავს:",
      everythingFree: "ყველაფერი Basic პაკეტიდან, პლუს:",
      everythingPro: "ყველაფერი Pro პაკეტიდან, პლუს:",
      everythingMax: "ყველაფერი Pro პაკეტიდან, პლუს:",
      taxNote: "ფასები არ მოიცავს გადასახადებს. *მოქმედებს მოხმარების ლიმიტები.",
      faqTitle: "ხშირად დასმული კითხვები",
      getInTouch: "დაგვიკავშირდით",
      contactDesc: "იქნებით ინდივიდუალური ადვოკატი თუ გლობალური ფირმა, ჩვენ დაგეხმარებით თქვენი იურიდიული ინტელექტის გაფართოებაში.",
      formName: "სრული სახელი",
      formEmail: "სამუშაო ელ-ფოსტა",
      formMessage: "რით შეგვიძლია დაგეხმაროთ?",
      sendMessage: "გაგზავნა",
      reachOut: "დაგვიკავშირდით",
      jurisdictionTitle: "ინტ���ლექტი ყველა იურისდიქციისთვის",
      geoLawDesc: "საქართველოს სასამართლო პრეცედენტების, სამოქალაქო კოდექსებისა და კანონმდებლობის ყოვლისმომცველი ბაზა.",
      intlLawDesc: "საერთაშორისო იურიდიული სტანდარტების, შედარებითი სამართლისა და ტრანსსასაზღვრო რეგულაციების მხარდაჭერა.",
      multiLangDesc: "კონტექსტზე ორიენტირებული დამუშავების სისტემა, რომელსაც შეუძლია რთული იურიდიული ცნებების ზუსტი თარგმნა EN, GE და RU ენებს შორის.",
      tagline: "ხელოვნური ინტელექტის კოგნიტური შრე თანამედროვე იურისტებისთვის.",
      status: "სისტემები მუშაობს",
      legalMax: "Legal Max"
    },
    RU: {
      meet: "О Doctoringo",
      platform: "Платформа",
      solutions: "Решения",
      pricing: "Цены",
      contact: "Контакт или Поддержка",
      contactShort: "Отдел продаж",
      try: "Попробовать Doctoringo",
      heroTitle1: "Право?",
      heroTitle2: "Разъяснено.",
      heroSubtitle: "ИИ для тех, кто решает правовые задачи",
      continueGoogle: "Войти через Google",
      privacyPolicy: "Политика конфиденциальности",
      termsOfService: "Правовая информация / Условия",
      madeIn: "Создано в Тбилиси",
      meetDesc: "Doctoringo — это ИИ-ассистент нового поколения, созданный для юристов и обученный безопасности, точности и надежности.",
      createTitle: "Создавайте с Doctoringo",
      createDesc: "Составляйте и редактируйте иски, контракты и юридические заключения в специальных режимах работы с документами.",
      bringTitle: "Используйте свои знания",
      bringDesc: "Загружайте материалы дел и доказательства для получения точного анализа с цитатами на основе вашего контекста.",
      collabTitle: "Работайте в команде",
      collabDesc: "Безопасно делитесь результатами исследований и черновиками документов внутри всей фирмы.",
      deepTitle: "Глубокий анализ",
      deepDesc: "Выявляйте риски в многосторонних соглашениях и получайте рекомендации по оптимизации на основе судебных тенденций.",
      procTitle: "Процессуальный интеллект",
      procDesc: "Автоматическое отслеживание сроков подачи документов и процедурных требований в грузинских и международных судах.",
      learnTitle: "Непрерывное обучение",
      learnDesc: "Наши модели ежедневно обновляются новыми прецедентами, законодательными актами и административными регламентами.",
      individual: "Индивидуальный",
      enterpriseOnly: "Только для предприятий",
      billedMonthly: "В месяц",
      freeForEveryone: "Бесплатно для всех",
      includes: "Включает:",
      everythingFree: "Все из тарифа Basic, плюс:",
      everythingPro: "Все из тарифа Pro, плюс:",
      everythingMax: "Все из тарифа Pro, плюс:",
      taxNote: "Цены указаны без учета налогов. *Действуют лимиты использования.",
      faqTitle: "Часто задаваемые вопросы",
      getInTouch: "Связаться с нами",
      contactDesc: "Будь вы частным адвокатом или глобальной фирмой, мы поможем вам масштабировать ваш юридический интеллект.",
      formName: "Полное имя",
      formEmail: "Рабочая почта",
      formMessage: "Чем мы можем помочь?",
      sendMessage: "Отправить сообщение",
      reachOut: "Свяжитесь с нами",
      jurisdictionTitle: "Интеллект для каждой юрисдикции",
      geoLawDesc: "Полная база судебных прецедентов, гражданских кодексов и законодательства Грузии.",
      intlLawDesc: "Поддержка международных правовых стандартов, сравнительного анализа и соблюдения трансграничных норм.",
      multiLangDesc: "Контекстный движок обработки, способный точно переводить сложные правовые понятия между EN, GE и RU.",
      tagline: "Когнитивный слой ИИ для современных юристов.",
      status: "Системы работают",
      legalMax: "Legal Max"
    }
  };

  const currentT = t[language] || t.EN;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    // Redirect to Google OAuth - the backend will handle the callback
    authApi.loginWithGoogle();
  };

  const plans = [
    {
      name: 'Legal Basic',
      price: '0',
      currency: '',
      subtitle: currentT.freeForEveryone,
      features: language === 'EN' 
        ? ['Limited queries', 'Standard drafting', 'Access to Legal Basic model', 'Georgian case law search']
        : language === 'GE' 
        ? ['შეზღუდული კითხვები', 'სტანდარტული მომზადება', 'Legal Basic მოდელი', 'საქართველოს სასამართლო პრაქტიკა']
        : ['Ограниченные запросы', 'Стандартная подготовка', 'Модель Legal Basic', 'Поиск по судебной практике Грузии'],
      icon: <Users className="w-8 h-8 text-[#1a1a1a] dark:text-white" />,
      cta: currentT.try,
      type: 'standard'
    },
    {
      name: 'Legal Pro',
      price: '49',
      currency: 'GEL',
      subtitle: currentT.individual,
      features: language === 'EN'
        ? ['Unlimited research', 'Advanced templates', 'Legal Pro model', 'Priority support', 'Jurisdictional cross-checks']
        : language === 'GE'
        ? ['ულიმიტო კვლევა', 'გაფართოებული შაბლონები', 'Legal Pro მოდელი', 'პრიორიტეტული მხარდაჭერა', 'იურისდიქციული კონტროლი']
        : ['Безлимитные исследования', 'Продвинутые шаблоны', 'Модель Legal Pro', 'Приоритетная поддержка', 'Кросс-юрисдикционные проверки'],
      icon: <Zap className="w-8 h-8 text-[#1a1a1a] dark:text-white" />,
      cta: currentT.try,
      type: 'premium'
    },
    {
      name: currentT.legalMax,
      price: currentT.reachOut,
      currency: '',
      subtitle: currentT.enterpriseOnly,
      features: language === 'EN'
        ? ['Custom model fine-tuning', 'Enterprise SSO security', 'Institutional API access', 'Dedicated legal technologist', 'Full firm knowledge base']
        : language === 'GE'
        ? ['მოდელის მორგება', 'Enterprise SSO უსაფრთხოება', 'ინსტიტუციური API წვდომა', 'პერსონალური ტექნოლოგი', 'ფირმის ცოდნის ბაზა']
        : ['Дообучение моделей', 'Безопасность Enterprise SSO', 'Институциональный API', 'Юридический технолог', 'База знаний всей фирмы'],
      icon: <Building2 className="w-8 h-8 text-[#1a1a1a] dark:text-white" />,
      cta: currentT.contactShort,
      type: 'enterprise'
    }
  ];

  const faqs = [
    { 
      q: language === 'EN' ? "What is Doctoringo and how does it work?" : language === 'GE' ? "რა არის Doctoringo და როგორ მუშაობს?" : "Что такое Doctoringo и как это работает?", 
      a: language === 'EN' ? "Doctoringo is a specialized legal AI trained on judicial precedents and statutory laws. It works by processing your queries through a secure legal-focused model with real-time access to the Georgian legislative database." : language === 'GE' ? "Doctoringo არის სპეციალიზებული იურიდიული AI, რომელიც გაწვრთნილია სასამართლო პრეცედენტებსა და კანონმდებლობაზე. ის მუშაობს რეალურ დროში საქართველოს საკანონმდებლო ბაზასთან წვდომით." : "Doctoringo — это специализированный юридический ИИ, обученный на судебных прецедентах и законах. Он работает с доступом к законодательной базе Грузии в реальном времени." 
    },
    { 
      q: language === 'EN' ? "What should I use Doctoringo for?" : language === 'GE' ? "რისთვის უნდა გამოვიყენო Doctoringo?" : "Для чего мне использовать Doctoringo?", 
      a: language === 'EN' ? "Use it for deep legal research, automated contract drafting, case law summarization, and ensuring procedural compliance across multiple courts." : language === 'GE' ? "გამოიყენეთ იგი ღრმა იურიდიული კვლევისთვის, კონტრაქტების მომზადებისთვის და სასამართლო პროცედურების შესაბამისობის კონტროლისთვის." : "Используйте его для глубоких правовых исследований, автоматического составления контрактов и контроля соблюдения судебных процедур." 
    },
    { 
      q: language === 'EN' ? "How much does it cost to use?" : language === 'GE' ? "რა ღირს გამოყენება?" : "Сколько стоит использование?", 
      a: language === 'EN' ? "We offer Legal Basic for free, Legal Pro for 49 GEL per month, and Legal Max for large firms and enterprises on a customized basis." : language === 'GE' ? "ჩვენ გთავაზობთ Legal Basic-ს უფასოდ, Legal Pro-ს 49 ლარად თვეში, ხოლო Legal Max-ს მსხვილი ფირმებისთვის ინდივიდუალური პირობებით." : "Мы предлагаем Legal Basic бесплатно, Legal Pro за 49 лари в месяц, и Legal Max для крупных фирм на индивидуальных условиях." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] text-[#1a1a1a] dark:text-[#ececec] flex flex-col overflow-x-hidden font-sans transition-colors duration-300">
      <SEO
        url="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Doctoringo AI",
          "applicationCategory": "LegalService",
          "operatingSystem": "Web",
          "description": "AI-powered legal assistant for Georgian, US, and EU law.",
          "url": "https://doctoringo.com",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GEL" }
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4 flex items-center justify-between bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-transparent dark:border-white/5">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="flex items-center gap-2">
            <DoctorLogo className="h-7 w-7" />
            <span className="text-[20px] md:text-[22px] font-serif tracking-tight font-medium">Doctoringo</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 ml-1 opacity-50">
            <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-bold font-sans">Powered By</span>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 48 48" className="w-3 h-3 md:w-3.5 md:h-3.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4" />
                <path d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 6.5 29.6 4.5 24 4.5c-7.4 0-13.8 3.9-17.7 10.2z" fill="#EA4335" />
                <path d="M24 43.5c5.6 0 10.4-2 14.1-5.4l-6.8-5.3c-2.1 1.4-4.8 2.2-7.3 2.2-5.4 0-10.1-3.6-11.7-8.6l-6.9 5.3C10.2 39.5 16.6 43.5 24 43.5z" fill="#34A853" />
                <path d="M4.2 28.5c-.7-2-.7-4.1 0-6.1l-6.9-5.3C-4.5 20.8-4.5 27.2-2.7 31l6.9-5.3V28.5z" fill="#FBBC05" />
              </svg>
              <span className="text-[9px] md:text-[10px] font-bold font-sans">Google Cloud</span>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
           <button onClick={() => scrollToSection('about')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{currentT.meet}</button>
           <button onClick={() => scrollToSection('platform')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{currentT.platform}</button>
           <button onClick={() => scrollToSection('solutions')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{currentT.solutions}</button>
           <button onClick={() => scrollToSection('pricing')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{currentT.pricing}</button>
           <button onClick={() => scrollToSection('contact')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{currentT.contactShort}</button>
           <button onClick={handleGoogleLogin} className="bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-[14px] font-medium hover:opacity-90 transition-all active:scale-95">
             {currentT.try}
           </button>
        </div>
        
        <div className="lg:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-[#fcfcf9] dark:bg-[#171717] p-6 flex flex-col gap-10 lg:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <DoctorLogo className="h-7 w-7" />
                  <span className="text-xl font-serif">Doctoringo</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 ml-1">
                  <span className="text-[8px] uppercase tracking-widest font-bold font-sans">Powered By</span>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 48 48" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4" />
                      <path d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 6.5 29.6 4.5 24 4.5c-7.4 0-13.8 3.9-17.7 10.2z" fill="#EA4335" />
                      <path d="M24 43.5c5.6 0 10.4-2 14.1-5.4l-6.8-5.3c-2.1 1.4-4.8 2.2-7.3 2.2-5.4 0-10.1-3.6-11.7-8.6l-6.9 5.3C10.2 39.5 16.6 43.5 24 43.5z" fill="#34A853" />
                      <path d="M4.2 28.5c-.7-2-.7-4.1 0-6.1l-6.9-5.3C-4.5 20.8-4.5 27.2-2.7 31l6.9-5.3V28.5z" fill="#FBBC05" />
                    </svg>
                    <span className="text-[9px] font-bold font-sans">Google Cloud</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#676767] dark:text-[#8e8e8e]"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col gap-4 text-xl font-serif">
              <button onClick={() => scrollToSection('about')} className="text-left py-1.5">{currentT.meet}</button>
              <button onClick={() => scrollToSection('platform')} className="text-left py-1.5">{currentT.platform}</button>
              <button onClick={() => scrollToSection('solutions')} className="text-left py-1.5">{currentT.solutions}</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left py-1.5">{currentT.pricing}</button>
              <button onClick={() => scrollToSection('contact')} className="text-left py-1.5">{currentT.contact}</button>
              <div className="pt-2">
                <button onClick={handleGoogleLogin} className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-3 rounded-xl text-[15px] font-bold shadow-lg active:scale-[0.98] transition-transform">
                  {currentT.try}
                </button>
              </div>
            </div>
            <div className="mt-auto pt-8 border-t border-black/5 dark:border-white/5">
               <div className="flex items-center gap-4 bg-[#f3f2ee] dark:bg-white/5 px-4 py-3 rounded-full w-fit">
                {['EN', 'GE', 'RU'].map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang as any)} className={`px-2 py-1 text-[13px] font-bold rounded-lg transition-colors ${language === lang ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-[#8e8e8e]'}`}>{lang}</button>
                ))}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="flex flex-col lg:flex-row items-center px-6 md:px-12 xl:px-32 pt-32 md:pt-40 pb-20 md:pb-24 min-h-[90vh] lg:min-h-screen">
          <div className="flex-1 flex flex-col items-center text-center lg:items-center lg:text-center space-y-10 md:space-y-12">
            <div className="space-y-6">
              <Motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[42px] md:text-[64px] xl:text-[84px] font-serif leading-[1.1] tracking-tight text-[#1a1a1a] dark:text-white"
              >
                {currentT.heroTitle1}<br />{currentT.heroTitle2}
              </Motion.h1>
              <Motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[18px] md:text-[20px] xl:text-[24px] text-[#676767] dark:text-[#8e8e8e] font-serif italic max-w-lg mx-auto"
              >
                {currentT.heroSubtitle}
              </Motion.p>
            </div>

            <Motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-[420px] bg-white dark:bg-[#1c1c1a] rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.05)] border border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col gap-5 md:gap-6 mx-auto"
            >
              <button 
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 md:py-3 bg-white text-[#1f1f1f] border border-[#747775] rounded-full hover:bg-[#f8f9fa] transition-all text-[14px] md:text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] shadow-sm"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[#4285F4]" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] md:w-5 md:h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span className="tracking-tight">{currentT.continueGoogle}</span>
              </button>
              <p className="text-[11px] text-center text-[#8e8e8e] leading-relaxed px-4">
                {language === 'EN' ? "By continuing, you acknowledge Doctoringo's" : language === 'GE' ? "გაგრძელებით თქვენ ადასტურებთ Doctoringo-ს" : "Продолжая, вы принимаете"} <span className="underline cursor-pointer hover:text-black dark:hover:text-white transition-colors">{currentT.privacyPolicy}</span>.
              </p>
            </Motion.div>
          </div>

          <div className="hidden lg:flex flex-1 justify-end pl-24 h-[85vh]">
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full max-w-[700px] rounded-[24px] overflow-hidden shadow-2xl relative"
            >
              <ImageWithFallback src={lawyerImg} alt="Legal Professional" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/5 dark:bg-black/20 pointer-events-none" />
            </Motion.div>
          </div>
        </section>

        {/* Section - About */}
        <section id="about" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-[800px] mx-auto text-center space-y-6 mb-16 md:mb-24">
            <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight text-[#1a1a1a] dark:text-white leading-tight">{currentT.meet}</h2>
            <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic px-4">{currentT.meetDesc}</p>
          </div>
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="bg-[#f3f2ee] dark:bg-[#212121] rounded-[32px] p-6 md:p-12 aspect-video md:aspect-square flex items-center justify-center shadow-inner overflow-hidden">
               <div className="w-full md:w-3/4 h-full md:h-3/4 bg-white dark:bg-[#1c1c1a] rounded-2xl shadow-2xl p-6 md:p-8 space-y-4 border border-[#e5e5e0] dark:border-white/5 relative top-4 md:top-0">
                  <div className="flex items-center gap-2 mb-4">
                    <DoctorLogo className="w-5 h-5" />
                    <span className="text-[10px] md:text-sm font-medium opacity-50 uppercase tracking-widest">Assistant</span>
                  </div>
                  <div className="h-3 md:h-4 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-3/4" />
                  <div className="h-3 md:h-4 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-full" />
                  <div className="h-16 md:h-20 border border-[#e5e5e0] dark:border-white/10 rounded-xl p-3 md:p-4 flex gap-3 bg-[#fcfcf9] dark:bg-white/5">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#033C81]" />
                    <div className="space-y-2 flex-1"><div className="h-2 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-1/2" /><div className="h-2 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-3/4" /></div>
                  </div>
               </div>
            </div>
            <div className="space-y-10 md:space-y-12">
              <div className="flex gap-4 md:gap-6 group">
                <FileText className="w-7 h-7 text-[#033C81] dark:text-[#033C81] flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-serif">{currentT.createTitle}</h3>
                  <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{currentT.createDesc}</p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 group">
                <BookOpen className="w-7 h-7 text-[#033C81] dark:text-[#033C81] flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-serif">{currentT.bringTitle}</h3>
                  <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{currentT.bringDesc}</p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 group">
                <Users className="w-7 h-7 text-[#033C81] dark:text-[#033C81] flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-serif">{currentT.collabTitle}</h3>
                  <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{currentT.collabDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Platform */}
        <section id="platform" className="bg-[#fcfcf9] dark:bg-[#171717] py-20 md:py-32 px-6 md:px-12 xl:px-32 border-t border-[#e5e5e0] dark:border-white/5">
           <div className="max-w-[1200px] mx-auto space-y-24 md:space-y-32">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
                 <div className="space-y-4 group">
                    <Scale className="w-10 h-10 text-[#033C81]" /><h3 className="text-2xl font-serif">{currentT.deepTitle}</h3><p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">{currentT.deepDesc}</p>
                 </div>
                 <div className="space-y-4 group">
                    <Gavel className="w-10 h-10 text-[#033C81]" /><h3 className="text-2xl font-serif">{currentT.procTitle}</h3><p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">{currentT.procDesc}</p>
                 </div>
                 <div className="space-y-4 group">
                    <RefreshCw className="w-10 h-10 text-[#033C81]" /><h3 className="text-2xl font-serif">{currentT.learnTitle}</h3><p className="text-[15px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">{currentT.learnDesc}</p>
                 </div>
              </div>

              {/* Advanced Capabilities */}
              <div className="pt-20 md:pt-24 border-t border-[#e5e5e0] dark:border-white/5 space-y-12 md:space-y-16">
                 <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-2xl md:text-3xl font-serif">Enterprise-grade Infrastructure</h2>
                    <p className="text-[#676767] dark:text-[#8e8e8e] text-[15px]">Built for the uncompromising requirements of legal institutions.</p>
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {[
                      { icon: Shield, t: 'SOC2 Compliant', d: 'Rigorous standards.' },
                      { icon: Lock, t: 'Zero-Training', d: 'Private data.' },
                      { icon: Globe, t: 'Tbilisi Node', d: 'Local infra.' },
                      { icon: Terminal, t: 'API Access', d: 'Deep integration.' }
                    ].map((item, i) => (
                      <div key={i} className="p-4 md:p-6 rounded-2xl bg-white dark:bg-white/5 border border-[#e5e5e0] dark:border-white/10 space-y-3">
                         <item.icon className="w-5 md:w-6 h-5 md:h-6 text-[#033C81]" />
                         <h4 className="font-bold text-[12px] md:text-sm uppercase tracking-wider">{item.t}</h4>
                         <p className="text-[11px] md:text-[13px] text-[#8e8e8e]">{item.d}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div id="solutions" className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center pt-20 md:pt-24 border-t border-[#e5e5e0] dark:border-white/5">
                <div className="space-y-8">
                  <h2 className="text-[32px] md:text-[36px] font-serif tracking-tight text-[#1a1a1a] dark:text-white leading-tight">{currentT.jurisdictionTitle}</h2>
                  <div className="space-y-6">
                    {['geoLawDesc', 'intlLawDesc', 'multiLangDesc'].map(key => (
                      <div key={key} className="flex gap-4"><div className="w-1.5 h-1.5 rounded-full bg-[#033C81] mt-2 flex-shrink-0" /><p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e]">{currentT[key]}</p></div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {[{icon: Search, t: 'Discovery'}, {icon: ShieldCheck, t: 'Audit'}, {icon: Cpu, t: 'Inference'}, {icon: Database, t: 'Archive'}].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c1a] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-[#e5e5e0] dark:border-white/10 shadow-sm group hover:border-[#033C81]/50 transition-colors">
                      <item.icon className="w-6 h-6 text-[#033C81] mb-4" /><h4 className="font-bold mb-2 text-sm md:text-base">{item.t}</h4><p className="text-[12px] md:text-sm text-[#8e8e8e]">Specialized processing.</p>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </section>

        {/* Section - Pricing */}
        <section id="pricing" className="bg-white dark:bg-[#1a1a1a] py-20 md:py-32 px-6 md:px-12 xl:px-32 border-t border-[#e5e5e0] dark:border-white/5">
           <div className="max-w-[1200px] mx-auto flex flex-col items-center">
              <div className="text-center mb-12 md:mb-16 space-y-4">
                <h2 className="text-[36px] md:text-[48px] font-serif tracking-tight text-[#1a1a1a] dark:text-white leading-tight">{language === 'EN' ? 'Investment in Precision' : language === 'GE' ? 'ინვესტიცია სიზ��სტეში' : 'Инвестиции в точность'}</h2>
                <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] max-w-lg mx-auto italic font-serif px-4">Scalable intelligence for practitioners and firms of all sizes.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {plans.map((plan, idx) => (
                  <div key={idx} className={`relative bg-white dark:bg-[#1c1c1a] rounded-[28px] md:rounded-[32px] border ${plan.type === 'premium' ? 'border-[#033C81]' : 'border-[#e5e5e0] dark:border-white/10'} p-8 md:p-10 flex flex-col h-full shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all`}>
                    {plan.type === 'premium' && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#033C81] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full z-10">
                        Recommended
                      </div>
                    )}
                    <div className="mb-8">{plan.icon}</div><h3 className="text-[28px] md:text-[32px] font-serif mb-1">{plan.name}</h3><p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] mb-6">{plan.subtitle}</p>
                    <div className="flex items-baseline gap-1 mb-2 h-12">
                      <span className={`${plan.type === 'enterprise' ? 'text-[20px] md:text-[32px]' : 'text-[28px] md:text-[32px]'} font-serif font-bold`}>
                        {plan.type === 'enterprise' ? currentT.reachOut : plan.price}
                      </span>
                      <span className="text-[16px] font-serif text-[#8e8e8e]">{plan.currency}</span>
                    </div>
                    <p className="text-[12px] text-[#8e8e8e] mb-8">{plan.price === '0' ? currentT.freeForEveryone : currentT.billedMonthly}</p>
                    
                    <button 
                      onClick={() => plan.type === 'enterprise' ? scrollToSection('contact') : handleGoogleLogin()} 
                      className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] ${
                        plan.type === 'premium' 
                          ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg' 
                          : plan.type === 'enterprise'
                          ? 'bg-transparent border-2 border-[#1a1a1a] dark:border-white text-[#1a1a1a] dark:text-white hover:bg-[#1a1a1a] dark:hover:bg-white hover:text-white dark:hover:text-black'
                          : 'bg-[#f3f2ee] dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#e5e5e0] dark:hover:bg-white/10'
                      } mb-12`}
                    >
                      {plan.cta}
                    </button>

                    <div className="space-y-4 flex-1">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">{idx === 0 ? currentT.includes : idx === 1 ? currentT.everythingFree : currentT.everythingPro}</p>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex gap-3 text-[14px] text-[#676767] dark:text-[#8e8e8e]"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#1a1a1a] dark:text-white" /><span>{feature}</span></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#8e8e8e] mt-12 text-center">{currentT.taxNote}</p>
           </div>
        </section>

        {/* Section - Contact */}
        <section id="contact" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
            <div className="space-y-8 text-center lg:text-left">
              <h2 className="text-[36px] md:text-[48px] font-serif tracking-tight text-[#1a1a1a] dark:text-white leading-tight">{currentT.getInTouch}</h2>
              <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">{currentT.contactDesc}</p>
              <div className="space-y-6 pt-8 flex flex-col items-center lg:items-start">
                <a href="mailto:knowhowaiassistant@gmail.com" className="flex items-center gap-4 text-[#676767] dark:text-[#8e8e8e] hover:text-[#033C81] transition-colors"><Mail className="w-6 h-6 text-[#033C81]" /><span className="text-[15px] md:text-[16px]">knowhowaiassistant@gmail.com</span></a>
                <div className="flex items-center gap-4 text-[#676767] dark:text-[#8e8e8e]"><MessageSquare className="w-6 h-6 text-[#033C81]" /><span className="text-[15px] md:text-[16px]">24/7 Priority Support</span></div>
                <div className="flex items-center gap-4 text-[#676767] dark:text-[#8e8e8e]"><MapPin className="w-6 h-6 text-[#033C81]" /><span className="text-[15px] md:text-[16px]">Liberty Sq, Tbilisi, Georgia</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1c1c1a] rounded-[28px] md:rounded-[32px] p-8 md:p-10 border border-[#e5e5e0] dark:border-white/10 shadow-xl">
              {contactSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-[#2f9e44] mb-4" />
                  <h3 className="text-[20px] font-serif mb-2">Message Sent!</h3>
                  <p className="text-[14px] text-[#8e8e8e]">We'll get back to you soon.</p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleContactSubmit}>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold uppercase tracking-widest text-[#8e8e8e]">{currentT.formName}</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full bg-[#fcfcf9] dark:bg-white/5 border border-[#e5e5e0] dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#033C81]/20 transition-all text-[#1a1a1a] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold uppercase tracking-widest text-[#8e8e8e]">{currentT.formEmail}</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="w-full bg-[#fcfcf9] dark:bg-white/5 border border-[#e5e5e0] dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#033C81]/20 transition-all text-[#1a1a1a] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold uppercase tracking-widest text-[#8e8e8e]">{currentT.formMessage}</label>
                    <textarea
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      className="w-full bg-[#fcfcf9] dark:bg-white/5 border border-[#e5e5e0] dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#033C81]/20 transition-all resize-none text-[#1a1a1a] dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactSubmitting || !contactForm.email || !contactForm.message}
                    className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] disabled:opacity-50"
                  >
                    {contactSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {currentT.sendMessage}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Section - FAQ */}
        <section id="faq" className="py-20 md:py-32 px-6 md:px-12 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-[28px] md:text-[32px] font-serif text-center mb-12 md:mb-16">{currentT.faqTitle}</h2>
            <div className="divide-y divide-[#e5e5e0] dark:divide-white/5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-6 md:py-8">
                  <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full flex items-center justify-between text-left group">
                    <span className="text-lg md:text-xl font-serif text-[#1a1a1a] dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors pr-4">{faq.q}</span>
                    <Motion.div animate={{ rotate: expandedFaq === idx ? 180 : 0 }} className="text-[#8e8e8e] flex-shrink-0">{expandedFaq === idx ? <Minus className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}</Motion.div>
                  </button>
                  <AnimatePresence>{expandedFaq === idx && <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="pt-4 text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{faq.a}</p></Motion.div>}</AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 md:py-16 px-6 md:px-12 xl:px-32 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2">
                <DoctorLogo className="h-6 w-6 brightness-0 invert" />
                <span className="text-xl font-serif tracking-tight">Doctoringo</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                <span className="text-[8px] uppercase tracking-widest font-bold">Powered By</span>
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 48 48" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4" />
                    <path d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 6.5 29.6 4.5 24 4.5c-7.4 0-13.8 3.9-17.7 10.2z" fill="#EA4335" />
                    <path d="M24 43.5c5.6 0 10.4-2 14.1-5.4l-6.8-5.3c-2.1 1.4-4.8 2.2-7.3 2.2-5.4 0-10.1-3.6-11.7-8.6l-6.9 5.3C10.2 39.5 16.6 43.5 24 43.5z" fill="#34A853" />
                    <path d="M4.2 28.5c-.7-2-.7-4.1 0-6.1l-6.9-5.3C-4.5 20.8-4.5 27.2-2.7 31l6.9-5.3V28.5z" fill="#FBBC05" />
                  </svg>
                  <span className="text-[9px] font-bold">Google Cloud</span>
                </div>
              </div>
            </div>
            <p className="text-[13px] md:text-[14px] text-white/40 max-w-xs italic font-serif leading-relaxed mx-auto md:mx-0">{currentT.tagline}</p>
          </div>

          {/* Essential Links */}
          <div className="flex flex-col sm:flex-row items-center gap-x-12 gap-y-6 text-[13px] md:text-[14px] text-white/60 font-medium">
            <button onClick={() => setActiveLegalModal('terms')} className="hover:text-white transition-colors">{currentT.termsOfService}</button>
            <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-white transition-colors">{currentT.privacyPolicy}</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">{currentT.contact}</button>
            <div className="flex items-center gap-2 text-white/30"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[12px]">{currentT.status}</span></div>
          </div>

          {/* Controls & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg">
              {['EN', 'GE', 'RU'].map(lang => (
                <div key={lang} className="flex items-center">
                  <button key={lang} onClick={() => setLanguage(lang as any)} className={`hover:text-white transition-colors text-[11px] md:text-[12px] font-bold ${language === lang ? 'text-white' : 'text-white/40'}`}>{lang}</button>
                  {lang !== 'RU' && <div className="w-px h-3 bg-white/20 ml-4 mr-0" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6"><Twitter className="w-5 h-5 text-white/30 hover:text-white cursor-pointer transition-colors" /><Linkedin className="w-5 h-5 text-white/30 hover:text-white cursor-pointer transition-colors" /><Github className="w-5 h-5 text-white/30 hover:text-white cursor-pointer transition-colors" /></div>
            <span className="text-[11px] md:text-[12px] text-white/20 italic">© 2026 Doctoringo AI. {currentT.madeIn}</span>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <AnimatePresence>
        {activeLegalModal && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
            <Motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-[#1c1c1a] w-full max-w-3xl rounded-[24px] md:rounded-[32px] max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 md:p-8 border-b border-[#e5e5e0] dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-serif text-[#1a1a1a] dark:text-white">{activeLegalModal === 'privacy' ? currentT.privacyPolicy : currentT.termsOfService}</h2>
                <button onClick={() => setActiveLegalModal(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-[#1a1a1a] dark:text-white" /></button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic text-sm md:text-base">
                <p>Last updated: February 3, 2026</p>
                <h3 className="text-black dark:text-white font-bold not-italic">Data Sovereignity & Trust</h3>
                <p>At Doctoringo AI, your data is yours. We adhere to the highest standards of legal confidentiality. Your case files, query history, and drafted materials are encrypted using military-grade standards and are never utilized for model training.</p>
                <p>By using Doctoringo, you enter a partnership built on absolute security and institutional precision.</p>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
