import { useState, useEffect, useRef } from 'react';
import {
  Search, ExternalLink, FileText, Loader2, Hash, X, AlertCircle,
  BookOpen, Zap, Clock, ChevronRight, Menu, CheckCircle, MessageSquare,
  Upload, Shield, Lock, Scale, Minus, Plus, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DoctorLogo } from './DoctorLogo';
import { publicSearchApi, authApi } from '../lib/api';
import { SEO } from './SEO';

const Motion = motion;

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  article: string | null;
  article_title: string;
  score: number;
  document_type: string;
}

const EXAMPLE_QUERIES = [
  'საკუთრების უფლება',
  'შრომის კოდექსი განთავისუფლება',
  'სამოქალაქო კოდექსი მუხლი 150',
  'მეწარმეთა შესახებ კანონი',
  'ადმინისტრაციული სამართალდარღვევა',
  'პერსონალურ მონაცემთა დაცვა',
  'საგადასახადო კოდექსი დღგ',
];

// Google Cloud badge (identical to LandingPage)
function GoogleCloudBadge() {
  return (
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
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] md:w-5 md:h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function MatsnePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // document.title managed by SEO component

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q || q.length < 2) return;

    setIsSearching(true);
    setError('');
    setHasSearched(true);
    setSearchTime(0);
    if (searchQuery) setQuery(searchQuery);

    const startTime = Date.now();

    try {
      const data = await publicSearchApi.search(q);
      setSearchTime(Date.now() - startTime);
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        const normalized: SearchResult[] = (data.results || []).map((r) => ({
          title: r.title || '',
          snippet: r.snippet || '',
          url: r.url || '',
          article: r.article ?? null,
          article_title: r.article_title || '',
          score: r.score ?? 0,
          document_type: r.document_type || '',
        }));
        setResults(normalized);
      }
    } catch {
      setError('ძიება ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError('');
    setSearchTime(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    authApi.loginWithGoogle();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  // FAQ data
  const faqs = [
    { q: 'რა არის Doctoringo AI ძიება?', a: 'Doctoringo AI ძიება არის ხელოვნური ინტელექტის ტექნოლოგიაზე დაფუძნებული საძიებო სისტემა, რომელიც საქართველოს სრულ საკანონმდებლო ბაზაში ეძებს. განსხვავებით Matsne.gov.ge-ს ჩვეულებრივი ძიებისგან, AI ესმის თქვენი კითხვის მნიშვნელობა და პოულობს ყველაზე რელევანტურ კანონებსა და მუხლებს.' },
    { q: 'უფასოა ძიება?', a: 'დიახ, AI ძიება Matsne.gov.ge-ს ბაზაში სრულიად უფასოა — რეგისტრაციის გარეშე. სრული პლატფორმა (AI ჩატი, დოკუმენტების გენერაცია, ფაილის ანალიზი) ხელმისაწვდომია ხელმოწერით.' },
    { q: 'რამდენად ზუსტია AI ძიების შედეგები?', a: 'AI ძიება იყენებს სემანტიკურ ანალიზს და ვექტორულ ძიებას, რაც საშუალებას აძლევს იპოვოს კონკრეტული მუხლები ბუნებრივი ენის კითხვით. ყოველი შედეგის გვერდით ნაჩვენებია რელევანტურობის ქულა. მაღალი ქულის შედეგები ზუსტად შეესაბამება თქვენს კითხვას.' },
    { q: 'რა კანონები არის ბაზაში?', a: 'ბაზა მოიცავს საქართველოს ძირითად კოდექსებს (სამოქალაქო, სისხლის, ადმინისტრაციულ, შრომის, საგადასახადო), ორგანულ კანონებს, კანონქვემდებარე აქტებს, მთავრობის დადგენილებებს და სხვა ნორმატიულ აქტებს. ბაზა რეგულარულად ახლდება Matsne.gov.ge-ს წყაროდან.' },
    { q: 'დაცულია ჩემი კონფიდენციალურობა?', a: 'აბსოლუტურად. საძიებო მოთხოვნები არ ინახება და არ გამოიყენება AI-ს ტრენინგისთვის. პლატფორმა ჰოსტინგზეა Google Cloud-ის Enterprise-დონის სერვერებზე AES-256 ენკრიფციით.' },
    { q: 'რა განსხვავებაა Matsne.gov.ge-ს ძიებისგან?', a: 'Matsne.gov.ge იყენებს სიტყვების პირდაპირ დამთხვევას — თუ ზუსტი სიტყვა არ მოხვდა, არ იპოვის. Doctoringo AI ესმის კითხვის მნიშვნელობა. მაგალითად, კითხვით „რა ჯარიმაა სიჩქარის გადაჭარბებისთვის?" AI იპოვის შესაბამის მუხლს ადმინისტრაციულ სამართალდარღვევათა კოდექსში, მაშინ როცა Matsne-ზე ზუსტი ტერმინით მოგიწევთ ძიება.' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] text-[#1a1a1a] dark:text-[#ececec] flex flex-col overflow-x-hidden font-sans transition-colors duration-300">
      <SEO
        title="Matsne.gov.ge — AI ძიება საქართველოს კანონმდებლობაში"
        description="ხელოვნური ინტელექტით ძიება საქართველოს სრულ საკანონმდებლო ბაზაში. იპოვეთ კანონები, მუხლები და ნორმატიული აქტები ბუნებრივი ენით."
        url="/matsne"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Matsne AI Search",
          "url": "https://doctoringo.com/matsne",
          "applicationCategory": "LegalService",
          "description": "AI-powered search across Georgian legislation database (Matsne.gov.ge)"
        }}
      />
      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 0 — NAVIGATION (identical to LandingPage)
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4 flex items-center justify-between bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-transparent dark:border-white/5">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="flex items-center gap-2">
            <DoctorLogo className="h-7 w-7" />
            <span className="text-[20px] md:text-[22px] font-serif tracking-tight font-medium">Doctoringo</span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest bg-[#033C81]/10 text-[#033C81] px-3 py-1 rounded-full">
              Matsne.gov.ge
            </span>
          </div>
          <GoogleCloudBadge />
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <button onClick={() => scrollToSection('search')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">სცადეთ ძიება</button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">როგორ მუშაობს</button>
          <button onClick={() => scrollToSection('platform')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">პლატფორმა</button>
          <button onClick={() => scrollToSection('faq')} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">FAQ</button>
          <button onClick={handleGoogleLogin} disabled={isSubmitting} className="bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-[14px] font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
            სცადეთ Doctoringo
          </button>
        </div>

        <div className="lg:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
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
                <GoogleCloudBadge />
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#676767] dark:text-[#8e8e8e]"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col gap-4 text-xl font-serif">
              <button onClick={() => scrollToSection('search')} className="text-left py-1.5">სცადეთ ძიება</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1.5">როგორ მუშაობს</button>
              <button onClick={() => scrollToSection('platform')} className="text-left py-1.5">პლატფორმა</button>
              <button onClick={() => scrollToSection('faq')} className="text-left py-1.5">FAQ</button>
              <div className="pt-2">
                <button onClick={handleGoogleLogin} disabled={isSubmitting} className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-3 rounded-xl text-[15px] font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50">
                  სცადეთ Doctoringo
                </button>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 1 — HERO: Find the right law in seconds
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center text-center px-6 md:px-12 xl:px-32 pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
          {/* Decorative gradient blobs */}
          <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-[#033C81]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-40 -right-32 w-[350px] h-[350px] bg-[#033C81]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-[#033C81]/3 to-transparent rounded-full blur-[80px] pointer-events-none" />
          <div className="relative space-y-6 max-w-3xl mx-auto">
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-[#033C81]/10 text-[#033C81] px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              AI ძიება — უფასოდ, რეგისტრაციის გარეშე
            </Motion.div>
            <Motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-[42px] md:text-[64px] xl:text-[84px] font-serif leading-[1.1] tracking-tight text-[#1a1a1a] dark:text-white"
            >
              იპოვეთ სწორი<br className="hidden md:block" /> <span className="text-[#033C81]">კანონი</span> წამებში
            </Motion.h1>
            <Motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[18px] md:text-[20px] xl:text-[24px] text-[#676767] dark:text-[#8e8e8e] font-serif italic max-w-2xl mx-auto"
            >
              ჩაწერეთ კითხვა ბუნებრივ ქართულ ენაზე — ხელოვნური ინტელექტი წამებში მოძებნის შესაბამის კანონს, მუხლს და ნორმას Matsne.gov.ge-ს სრულ ბაზაში. უფასოდ, რეგისტრაციის გარეშე.
            </Motion.p>

            {/* Trust badges */}
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-2"
            >
              {[
                { icon: Clock, text: 'პასუხი 2-5 წამში' },
                { icon: BookOpen, text: 'Matsne.gov.ge სრული ბაზა' },
                { icon: Search, text: 'რეგისტრაცია არ არის საჭირო' },
                { icon: Shield, text: 'კონფიდენციალური' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] text-[#8e8e8e]">
                  <Icon className="w-3.5 h-3.5 text-[#033C81]" />
                  <span>{text}</span>
                </div>
              ))}
            </Motion.div>

            {/* Scroll CTA */}
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button
                onClick={() => scrollToSection('search')}
                className="mt-4 bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-xl text-[15px] font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                სცადეთ ახლავე — უფასოდ
              </button>
            </Motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 2 — PROBLEM: Why traditional search fails
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-6 mb-16 md:mb-24">
              <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">რატომ ვერ პოულობთ <span className="text-[#033C81]">სწორ კანონს</span> Matsne-ზე?</h2>
                <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">
                  Matsne.gov.ge საქართველოს ოფიციალური საკანონმდებლო ბაზაა — მაგრამ მისი საძიებო სისტემა თანამედროვე მოთხოვნებს ვეღარ აკმაყოფილებს. ტექნოლოგია წინ წავიდა, მაგრამ ძიების ხარისხი იმავე დონეზე დარჩა.
                </p>
              </Motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Search,
                  title: 'სიტყვასიტყვითი ძიება',
                  desc: 'Matsne.gov.ge ეძებს მხოლოდ ზუსტ სიტყვებს. თუ „გადასახადი" დაწერეთ, მაგრამ კანონში „საგადასახადო" წერია — არ იპოვის. ყოველ ჯერზე სხვადასხვა ფორმულირებით ძებნა.',
                  color: 'text-red-500 dark:text-red-400',
                  bg: 'bg-red-50 dark:bg-red-500/10'
                },
                {
                  icon: Clock,
                  title: '10-30 წუთი ყოველ ძიებაზე',
                  desc: 'მოძებნეთ ტერმინი → გადახედეთ 20+ შედეგს → გახსენით 5-6 დოკუმენტი → კოდექსებში გადახტომა → ბმულების გაყოლა. ყოველი სამართლებრივი კითხვა 30-წუთიან მოგზაურობად იქცევა.',
                  color: 'text-orange-500 dark:text-orange-400',
                  bg: 'bg-orange-50 dark:bg-orange-500/10'
                },
                {
                  icon: FileText,
                  title: 'არარელევანტური შედეგები',
                  desc: '„საკუთრების უფლება" კითხვით მიიღებთ ყველაფერს, სადაც ეს სიტყვა გვხვდება — 500+ შედეგი. კონკრეტული მუხლის პოვნა თივის ზვინში ნემსის ძიებას ჰგავს.',
                  color: 'text-yellow-600 dark:text-yellow-400',
                  bg: 'bg-yellow-50 dark:bg-yellow-500/10'
                },
              ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[28px] p-8 border border-[#e5e5e0] dark:border-white/10"
                >
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 3 — BEFORE vs AFTER comparison
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5 overflow-hidden">
          {/* Subtle decorative blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#033C81]/3 rounded-full blur-[150px] pointer-events-none" />
          <div className="relative max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                ძველი ძიება vs <span className="text-[#033C81]">AI ძიება</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                ერთი შეხედვით ნათელია — რატომ ირჩევენ AI ძიებას
              </Motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
              {/* Before */}
              <Motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#1c1c1a] rounded-[28px] p-8 border border-red-200 dark:border-red-500/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-xl font-serif font-medium">Matsne.gov.ge</h3>
                </div>
                <div className="space-y-4">
                  {[
                    'ზუსტი სიტყვით ძიება',
                    '10-30 წუთი ყოველ ჯერზე',
                    '500+ არასორტირებული შედეგი',
                    'კოდექსებში ხელით ნავიგაცია',
                    'ქართული ბრუნვა/ფორმა პრობლემაა',
                    'ბუნებრივი ენით ძიება შეუძლებელია',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[14px] text-[#676767] dark:text-[#8e8e8e]">{item}</span>
                    </div>
                  ))}
                </div>
              </Motion.div>

              {/* After */}
              <Motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#1c1c1a] rounded-[28px] p-8 border border-[#033C81]/30 shadow-lg shadow-[#033C81]/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#033C81]/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#033C81]" />
                  </div>
                  <h3 className="text-xl font-serif font-medium">Doctoringo AI</h3>
                </div>
                <div className="space-y-4">
                  {[
                    'სემანტიკური ძიება — ესმის მნიშვნელობა',
                    'პასუხი 2-5 წამში',
                    'მხოლოდ რელევანტური შედეგები',
                    'პირდაპირ კონკრეტულ მუხლზე',
                    'ქართული ენის სრული გაგება',
                    'კითხვა ბუნებრივ ენაზე',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-[#033C81] mt-0.5 flex-shrink-0" />
                      <span className="text-[14px] text-[#676767] dark:text-[#8e8e8e]">{item}</span>
                    </div>
                  ))}
                </div>
              </Motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 4 — LIVE SEARCH DEMO
        ═══════════════════════════════════════════════════════════════ */}
        <section id="search" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center space-y-4 mb-12">
              <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  ცოცხალი დემო — სცადეთ ახლავე
                </span>
              </Motion.div>
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                ჩაწერეთ კითხვა, <span className="text-[#033C81]">AI იპოვის</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic max-w-xl mx-auto">
                ჩაწერეთ ნებისმიერი სამართლებრივი კითხვა ან ტერმინი ქართულად — ხელოვნური ინტელექტი მოძებნის შესაბამის კანონს Matsne.gov.ge-ს ბაზაში
              </Motion.p>
            </div>

            {/* Search Input */}
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex items-center bg-[#fcfcf9] dark:bg-[#171717] rounded-2xl border border-[#e5e5e0] dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-[#033C81]/20 focus-within:border-[#033C81]/30 transition-all overflow-hidden">
                <Search className="w-5 h-5 text-[#8e8e8e] ml-5 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ჩაწერეთ სამართლებრივი კითხვა ან საკანონმდებლო ტერმინი..."
                  className="flex-1 bg-transparent px-4 py-4 md:py-5 outline-none text-[15px] md:text-[16px] text-[#1a1a1a] dark:text-white placeholder:text-[#8e8e8e]"
                />
                {query && (
                  <button onClick={handleClear} className="p-2 text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                  className="bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-6 py-2.5 mr-2 rounded-xl text-[14px] font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="hidden sm:inline">ძიება</span>
                </button>
              </div>
            </Motion.div>

            {/* Example Queries */}
            {!hasSearched && (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-6 space-y-3"
              >
                <p className="text-center text-[12px] text-[#8e8e8e] uppercase tracking-wider font-bold">პოპულარული ძიებები — დააჭირეთ სცადოთ</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUERIES.map((eq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(eq)}
                      className="text-[13px] px-4 py-2 rounded-full bg-[#f3f2ee] dark:bg-white/5 text-[#676767] dark:text-[#8e8e8e] hover:bg-[#e5e5e0] dark:hover:bg-white/10 hover:text-[#1a1a1a] dark:hover:text-white transition-colors border border-transparent hover:border-[#033C81]/20"
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </Motion.div>
            )}

            {/* Quick re-search chips after results */}
            {hasSearched && !isSearching && results.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[11px] text-[#8e8e8e] self-center mr-1">ასევე მოძებნეთ:</span>
                {EXAMPLE_QUERIES.filter(eq => eq !== query).slice(0, 3).map((eq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(eq)}
                    className="text-[11px] px-3 py-1 rounded-full bg-[#f3f2ee] dark:bg-white/5 text-[#676767] dark:text-[#8e8e8e] hover:text-[#033C81] transition-colors"
                  >
                    {eq}
                  </button>
                ))}
              </div>
            )}

            {/* Results Area */}
            <div className="mt-8">
              {/* Loading */}
              {isSearching && (
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-[#033C81] animate-spin" />
                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-[#033C81]/10 animate-ping" />
                  </div>
                  <p className="text-[14px] text-[#8e8e8e] font-serif italic">AI ეძებს შესაბამის კანონებსა და მუხლებს...</p>
                </Motion.div>
              )}

              {/* Error */}
              {error && !isSearching && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                  <div className="inline-flex flex-col items-center gap-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-8 py-6 rounded-2xl">
                    <AlertCircle className="w-6 h-6" />
                    <p className="text-[15px] font-medium">{error}</p>
                    <button onClick={handleClear} className="text-[13px] text-red-500 hover:underline mt-1">
                      სცადეთ ხელახლა
                    </button>
                  </div>
                </Motion.div>
              )}

              {/* No Results */}
              {hasSearched && !isSearching && !error && results.length === 0 && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#f3f2ee] dark:bg-white/5 flex items-center justify-center mx-auto">
                    <Search className="w-7 h-7 text-[#8e8e8e]" />
                  </div>
                  <p className="text-[17px] text-[#676767] dark:text-[#8e8e8e] font-serif">ამ მოთხოვნით შედეგი ვერ მოიძებნა</p>
                  <p className="text-[14px] text-[#8e8e8e] max-w-[400px] mx-auto">სცადეთ სხვა ფორმულირება ან გამოიყენეთ უფრო ზოგადი ტერმინი. მაგალითად: &ldquo;საკუთრება&rdquo;, &ldquo;შრომა&rdquo;, &ldquo;გადასახადი&rdquo;</p>
                  <button onClick={handleClear} className="text-[13px] text-[#033C81] hover:underline font-medium flex items-center gap-1 mx-auto">
                    <Search className="w-3.5 h-3.5" />
                    ახალი ძიება
                  </button>
                </Motion.div>
              )}

              {/* Results */}
              {!isSearching && results.length > 0 && (
                <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] text-[#8e8e8e]">
                      <span className="font-bold text-[#1a1a1a] dark:text-white">{results.length}</span> შედეგი მოიძებნა
                      {searchTime > 0 && <span className="ml-2 text-[11px]">({(searchTime / 1000).toFixed(1)} წმ)</span>}
                    </p>
                    <button onClick={handleClear} className="text-[12px] text-[#033C81] hover:underline font-medium flex items-center gap-1">
                      <X className="w-3 h-3" />
                      გასუფთავება
                    </button>
                  </div>
                  {results.map((result, i) => (
                    <Motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[20px] p-6 border border-[#e5e5e0] dark:border-white/10 hover:border-[#033C81]/20 hover:shadow-md transition-all group"
                    >
                      {/* Title row */}
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#033C81]/10 flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-[#033C81]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {result.url ? (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[16px] md:text-[17px] font-serif font-medium text-[#1a1a1a] dark:text-white hover:text-[#033C81] transition-colors inline-flex items-center gap-2"
                            >
                              <span className="line-clamp-2">{result.title || 'უსათაურო დოკუმენტი'}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[16px] md:text-[17px] font-serif font-medium line-clamp-2">{result.title || 'უსათაურო დოკუმენტი'}</span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#033C81]/10 text-[#033C81] px-2.5 py-1 rounded-lg">
                          <Globe className="w-3 h-3" />
                          matsne.gov.ge
                        </span>
                        {result.article && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f3f2ee] dark:bg-white/5 text-[#676767] dark:text-[#8e8e8e] px-2.5 py-1 rounded-lg">
                            <Hash className="w-3 h-3" />
                            {result.article_title || result.article}
                          </span>
                        )}
                        {result.document_type && (
                          <span className="text-[11px] bg-[#f3f2ee] dark:bg-white/5 text-[#676767] dark:text-[#8e8e8e] px-2.5 py-1 rounded-lg">
                            {result.document_type}
                          </span>
                        )}
                      </div>

                      {/* Snippet (if available) */}
                      {result.snippet && (
                        <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed line-clamp-3">
                          {result.snippet}
                        </p>
                      )}

                      {/* View on Matsne link */}
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#033C81] hover:underline mt-3 font-medium"
                        >
                          ნახეთ matsne.gov.ge-ზე
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </Motion.div>
                  ))}
                </Motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 5 — HOW AI SEARCH WORKS (3-step process)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="relative py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5 overflow-hidden">
          <div className="absolute -top-20 -right-40 w-[300px] h-[300px] bg-[#033C81]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto relative">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                როგორ მუშაობს <span className="text-[#033C81]">AI ძიება</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                სამი ნაბიჯი — კითხვიდან პასუხამდე 2-5 წამში
              </Motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: MessageSquare,
                  title: 'ჩაწერეთ კითხვა',
                  desc: 'ჩაწერეთ სამართლებრივი კითხვა ბუნებრივ ქართულ ენაზე. არ არის საჭირო იურიდიული ტერმინოლოგია — AI ესმის ყოველდღიური ენა. „რა ჯარიმაა სიჩქარის გადაჭარბებისთვის?" — საკმარისია.',
                },
                {
                  step: '02',
                  icon: Zap,
                  title: 'AI ანალიზებს',
                  desc: 'ხელოვნური ინტელექტი აანალიზებს თქვენი კითხვის მნიშვნელობას, ხელახლა ფორმულირებს იურიდიულ ენაზე და ეძებს საქართველოს სრულ საკანონმდებლო ბაზაში — ვექტორული + ტექსტური ძიებით.',
                },
                {
                  step: '03',
                  icon: CheckCircle,
                  title: 'მიიღეთ პასუხი',
                  desc: 'მიიღებთ კონკრეტულ მუხლებს, ნორმატიულ აქტებს და კანონებს რელევანტურობის ქულით. თითოეული შედეგი შეიცავს პირდაპირ ბმულს Matsne.gov.ge-ზე.',
                },
              ].map(({ step, icon: Icon, title, desc }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-[#1c1c1a] rounded-[28px] p-8 border border-[#e5e5e0] dark:border-white/10 relative"
                >
                  <span className="text-[64px] font-serif font-bold text-[#f3f2ee] dark:text-white/5 absolute top-4 right-6 leading-none">{step}</span>
                  <Icon className="w-10 h-10 text-[#033C81] mb-5" />
                  <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 6 — WHAT MAKES IT DIFFERENT (Technology)
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                რა ტექნოლოგია <span className="text-[#033C81]">დგას უკან</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                Google Cloud AI + სემანტიკური ანალიზი + ჰიბრიდული ალგორითმი
              </Motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
              {[
                {
                  icon: Globe,
                  title: 'სემანტიკური გაგება',
                  desc: 'AI არ ეძებს ზუსტ სიტყვებს — ესმის კითხვის მნიშვნელობა. „როგორ გავაფორმო იჯარა?" კითხვით იპოვის სამოქალაქო კოდექსის იჯარის თავს, თუნდაც ზუსტი სიტყვა „იჯარა" არ წეროს.',
                },
                {
                  icon: Scale,
                  title: 'ჰიბრიდული ძიება',
                  desc: 'ორი ალგორითმი ერთდროულად: ერთი პოულობს მსგავს კონცეფციებსა და სინონიმებს, მეორე — ზუსტ ტერმინებსა და ფრაზებს. ორივე შედეგი იწონება და ყველაზე რელევანტური იწევს ზემოთ.',
                },
                {
                  icon: BookOpen,
                  title: 'Matsne.gov.ge ბაზა',
                  desc: 'საქართველოს ძირითადი კოდექსები, ორგანული კანონები, კანონქვემდებარე აქტები, მთავრობის დადგენილებები და ნორმატიული აქტები — ერთ ადგილას, ერთი ძიებით.',
                },
                {
                  icon: Zap,
                  title: 'რელევანტურობის რანჟირება',
                  desc: 'ყოველი შედეგი ფასდება AI-ს მიერ. ყველაზე ზუსტი პასუხი — ზემოთ, ნაკლებად შესაბამისი — ქვემოთ. პროცენტული ქულა გიჩვენებთ რამდენად რელევანტურია შედეგი.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[28px] p-8 border border-[#e5e5e0] dark:border-white/10"
                >
                  <Icon className="w-10 h-10 text-[#033C81] mb-5" />
                  <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 7 — WHO BENEFITS (6 user types)
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                ვისთვისაა <span className="text-[#033C81]">Doctoringo AI</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                ყველა, ვინც ოდესმე ეძებდა კანონს Matsne.gov.ge-ზე
              </Motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Scale,
                  title: 'ადვოკატები',
                  desc: 'ყოველდღიურ პრაქტიკაში კანონის ძიება ყველაზე ხშირი ამოცანაა. AI ძიებით 30-წუთიანი პროცესი წამებში სრულდება. კვირაში 5-10 საათის დაზოგვა.',
                },
                {
                  icon: BookOpen,
                  title: 'სამართლის სტუდენტები',
                  desc: 'საკურსო ნაშრომი, რეფერატი ან გამოცდისთვის მზადება — სწრაფად იპოვეთ კონკრეტული მუხლი, განმარტება ან ნორმა ზუსტი ციტატისთვის.',
                },
                {
                  icon: Globe,
                  title: 'ჟურნალისტები',
                  desc: 'გამოძიებითი სტატიისთვის კონკრეტული კანონის ციტირება. AI იპოვის ზუსტ მუხლს ბუნებრივი ენის კითხვით — არ არის საჭირო იურიდიული ცოდნა.',
                },
                {
                  icon: MessageSquare,
                  title: 'ბიზნესები',
                  desc: 'რა ვალდებულებები აქვს კომპანიას? საგადასახადო, შრომითი, მონაცემთა დაცვის რეგულაციები — სწრაფად იპოვეთ კონკრეტული ნორმა თქვენი ინდუსტრიისთვის.',
                },
                {
                  icon: FileText,
                  title: 'საჯარო მოხელეები',
                  desc: 'ადმინისტრაციული აქტების მომზადება, რეგულაციების შემოწმება, კანონშესაბამისობა — AI ეძებს მთავრობის დადგენილებებს, ბრძანებულებებს და ბრძანებებს.',
                },
                {
                  icon: Shield,
                  title: 'მოქალაქეები',
                  desc: 'გინდათ იცოდეთ რა უფლებები გაქვთ? ჩაწერეთ კითხვა ყოველდღიურ ენაზე — „რამდენი დღე შვებულება მეკუთვნის?" — AI იპოვის შესაბამის მუხლს.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-[#1c1c1a] rounded-[28px] p-8 border border-[#e5e5e0] dark:border-white/10"
                >
                  <Icon className="w-10 h-10 text-[#033C81] mb-5" />
                  <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 8 — REAL USE CASES (concrete scenarios)
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                რეალური <span className="text-[#033C81]">სცენარები</span>
              </Motion.h2>
              <Motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                ასეთი კითხვები ყოველდღიურად ისმება — AI-ს წამებში შეუძლია პასუხი
              </Motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              {[
                {
                  q: '„რა ჯარიმაა სიჩქარის გადაჭარბებისთვის?"',
                  a: 'AI იპოვის ადმინისტრაციულ სამართალდარღვევათა კოდექსის შესაბამის მუხლს, ჯარიმის ზუსტ ოდენობას, დაჯარიმების პროცედურას და გამონაკლისებს.',
                },
                {
                  q: '„რამდენი დღე შვებულება მეკუთვნის?"',
                  a: 'შრომის კოდექსის შესაბამისი მუხლი — ანაზღაურებადი შვებულების ვადა, პირობები, გამონაკლისები და დამატებითი შვებულების უფლება.',
                },
                {
                  q: '„როგორ ხდება იჯარის ხელშეკრულების შეწყვეტა?"',
                  a: 'სამოქალაქო კოდექსის იჯარის მარეგულირებელი მუხლები — შეწყვეტის საფუძვლები, ვადები, მხარეთა ვალდებულებები და თანხის დაბრუნების წესი.',
                },
                {
                  q: '„კომპანიის დაფუძნების პროცედურა"',
                  a: 'მეწარმეთა შესახებ კანონის შესაბამისი თავი — რეგისტრაციის პროცედურა, წესდების მოთხოვნები, კაპიტალი და დამფუძნებელთა პასუხისმგებლობა.',
                },
                {
                  q: '„პერსონალური მონაცემების დამუშავების წესი"',
                  a: 'პერსონალურ მონაცემთა დაცვის შესახებ კანონი — მონაცემთა სუბიექტის თანხმობა, ლეგიტიმური ინტერესი, სპეციალური კატეგორიის მონაცემები და მონაცემთა დამმუშავებლის ვალდებულებები.',
                },
                {
                  q: '„დღგ-ს გადახდის ვალდებულება"',
                  a: 'საგადასახადო კოდექსის დღგ-ს მარეგულირებელი ნორმები — ვინ არის გადამხდელი, სავალდებულო რეგისტრაციის ზღვარი, განაკვეთი და გათავისუფლების პირობები.',
                },
              ].map(({ q, a }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[28px] p-7 border border-[#e5e5e0] dark:border-white/10"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#033C81]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Search className="w-4 h-4 text-[#033C81]" />
                    </div>
                    <p className="text-[15px] font-serif font-medium text-[#1a1a1a] dark:text-white">{q}</p>
                  </div>
                  <div className="flex items-start gap-3 pl-11">
                    <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{a}</p>
                  </div>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 9 — NUMBERS & STATS
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5 overflow-hidden">
          <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-gradient-to-tr from-[#033C81]/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto relative">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                ციფრებით
              </Motion.h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-[800px] mx-auto">
              {[
                { value: '2-5', unit: 'წამი', label: 'საშუალო პასუხის დრო' },
                { value: '60+', unit: '', label: 'სამართლებრივი შაბლონი' },
                { value: '24/7', unit: '', label: 'ხელმისაწვდომობა' },
                { value: '0₾', unit: '', label: 'AI ძიება უფასოდ' },
                { value: '3', unit: '', label: 'ენა: GE, EN, RU' },
                { value: '100%', unit: '', label: 'კანონმდებლობის დაფარვა' },
              ].map(({ value, unit, label }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-center py-8"
                >
                  <div className="text-[40px] md:text-[56px] font-serif font-bold text-[#033C81] leading-none">
                    {value}
                    {unit && <span className="text-[20px] md:text-[24px] font-normal text-[#8e8e8e] ml-1">{unit}</span>}
                  </div>
                  <p className="text-[13px] md:text-[14px] text-[#676767] dark:text-[#8e8e8e] mt-2 font-medium">{label}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 10 — FULL PLATFORM (what else Doctoringo offers)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="platform" className="relative py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5 overflow-hidden">
          <div className="absolute top-10 -left-20 w-[250px] h-[250px] bg-[#033C81]/4 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 -right-20 w-[250px] h-[250px] bg-[#033C81]/4 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto relative">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                <span className="inline-flex items-center gap-2 bg-[#033C81]/10 text-[#033C81] px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest">
                  სრული პლატფორმა
                </span>
                <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                  ძიება მხოლოდ <span className="text-[#033C81]">დასაწყისია</span>
                </h2>
                <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">
                  Matsne ძიება მხოლოდ დასაწყისია. Doctoringo AI — სრული სამართლებრივი ასისტენტი: AI ჩატი, 60+ დოკუმენტის შაბლონი და ფაილის ანალიზი ერთ პლატფორმაზე.
                </p>
              </Motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Search,
                  title: 'Matsne AI ძიება',
                  desc: 'სრული საკანონმდებლო ბაზა. ბუნებრივი ენით ძიება. უფასოდ.',
                  badge: 'უფასო',
                  badgeColor: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
                },
                {
                  icon: MessageSquare,
                  title: 'AI ჩატი',
                  desc: 'ეკითხეთ სამართლებრივი კითხვები — მიიღეთ პასუხი ციტატებით და მუხლების მითითებით.',
                  badge: 'PRO',
                  badgeColor: 'bg-[#033C81]/10 text-[#033C81]',
                },
                {
                  icon: FileText,
                  title: '60+ შაბლონი',
                  desc: 'სარჩელი, ხელშეკრულება, საჩივარი — მზა დოკუმენტები 30 წამში DOCX-ში.',
                  badge: 'PRO',
                  badgeColor: 'bg-[#033C81]/10 text-[#033C81]',
                },
                {
                  icon: Upload,
                  title: 'ფაილის ანალიზი',
                  desc: 'ატვირთეთ PDF/DOCX — AI წაიკითხავს, გამოავლენს რისკებს და მოგცემთ რეკომენდაციებს.',
                  badge: 'PRO',
                  badgeColor: 'bg-[#033C81]/10 text-[#033C81]',
                },
              ].map(({ icon: Icon, title, desc, badge, badgeColor }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[28px] p-7 border border-[#e5e5e0] dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-5">
                    <Icon className="w-9 h-9 text-[#033C81]" />
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeColor}`}>
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-medium mb-2">{title}</h3>
                  <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>

            {/* Pricing note */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="inline-flex flex-col items-center gap-4 bg-[#fcfcf9] dark:bg-[#171717] rounded-[28px] px-10 py-8 border border-[#e5e5e0] dark:border-white/10">
                <p className="text-[18px] md:text-[20px] font-serif font-medium text-[#1a1a1a] dark:text-white">AI ჩატი, დოკუმენტები, ფაილის ანალიზი</p>
                <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e]">სრული პლატფორმა — ყველა ფუნქცია ერთ სივრცეში</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2.5 py-2.5 md:py-3 px-8 bg-white text-[#1f1f1f] border border-[#747775] rounded-full hover:bg-[#f8f9fa] transition-all text-[14px] md:text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] shadow-sm"
                >
                  <GoogleIcon />
                  <span className="tracking-tight">Google-ით გაგრძელება</span>
                </button>
              </div>
            </Motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 11 — SECURITY & TRUST
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[800px] mx-auto text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                უსაფრთხოება და <span className="text-[#033C81]">კონფიდენციალურობა</span>
              </Motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
              {[
                {
                  icon: Shield,
                  title: 'Google Cloud Infrastructure',
                  desc: 'Enterprise-დონის ჰოსტინგი Google Cloud-ის სერვერებზე. SOC2 და ISO 27001 სტანდარტების სრული შესაბამისობა.',
                },
                {
                  icon: Lock,
                  title: 'AES-256 ენკრიფცია',
                  desc: 'ყველა მონაცემი — საძიებო მოთხოვნები, ატვირთული ფაილები და ჩატის ისტორია — დაშიფრულია ინდუსტრიის უმაღლესი სტანდარტის ენკრიფციით.',
                },
                {
                  icon: Search,
                  title: 'მონაცემთა მინიმიზაცია',
                  desc: 'საძიებო მოთხოვნები არ გამოიყენება AI მოდელის ტრენინგისთვის. თქვენი კითხვა მუშავდება და პასუხი ბრუნდება — მონაცემები არ გაზიარდება მესამე მხარეებთან.',
                },
                {
                  icon: Globe,
                  title: 'GDPR შესაბამისობა',
                  desc: 'პლატფორმა სრულად შეესაბამება ევროპულ მონაცემთა დაცვის რეგულაციას (GDPR) და საქართველოს პერსონალურ მონაცემთა დაცვის კანონს.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-[#1c1c1a] rounded-[28px] p-8 border border-[#e5e5e0] dark:border-white/10"
                >
                  <Icon className="w-10 h-10 text-[#033C81] mb-5" />
                  <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
                  <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 12 — FAQ
        ═══════════════════════════════════════════════════════════════ */}
        <section id="faq" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center space-y-4 mb-16 md:mb-24">
              <Motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">
                ხშირად დასმული <span className="text-[#033C81]">კითხვები</span>
              </Motion.h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[20px] border border-[#e5e5e0] dark:border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-[15px] md:text-[16px] font-serif font-medium pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <Minus className="w-5 h-5 text-[#033C81] flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-[#8e8e8e] flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <Motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">
                          {faq.a}
                        </p>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 13 — FINAL CTA
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#033C81]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[600px] mx-auto text-center space-y-8 relative">
            <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
              <DoctorLogo className="w-14 h-14 mx-auto" />
              <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight">
                მოძებნეთ კანონი<br /><span className="text-[#033C81]">ახლავე</span>
              </h2>
              <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic max-w-md mx-auto">
                AI ძიება სრულიად უფასოა — სცადეთ ზემოთ. სრული პლატფორმისთვის დარეგისტრირდით Google-ით — 10 წამი.
              </p>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-4 items-center"
            >
              <button
                onClick={() => scrollToSection('search')}
                className="bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-xl text-[15px] font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                სცადეთ AI ძიება — უფასოდ
              </button>

              <div className="w-full max-w-[420px] bg-white dark:bg-[#1c1c1a] rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.05)] border border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col gap-5 md:gap-6">
                <p className="text-[13px] text-[#8e8e8e] font-medium">ან შედით სრულ პლატფორმაზე:</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 md:py-3 bg-white text-[#1f1f1f] border border-[#747775] rounded-full hover:bg-[#f8f9fa] transition-all text-[14px] md:text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] shadow-sm"
                >
                  <GoogleIcon />
                  <span className="tracking-tight">Google-ით გაგრძელება</span>
                </button>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['AI ჩატი', '60+ შაბლონი', 'Matsne ძიება', 'PDF ანალიზი'].map((feat, i) => (
                    <span key={i} className="text-[11px] px-3 py-1.5 rounded-full bg-[#f3f2ee] dark:bg-white/5 text-[#676767] dark:text-[#8e8e8e] font-medium">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </Motion.div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER (identical to LandingPage)
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="bg-black text-white py-12 md:py-16 px-6 md:px-12 xl:px-32 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
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
            <p className="text-[13px] md:text-[14px] text-white/40 max-w-xs italic font-serif leading-relaxed mx-auto md:mx-0">
              AI ტექნოლოგია საქართველოს კანონმდებლობის ძიებისთვის.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-x-12 gap-y-6 text-[13px] md:text-[14px] text-white/60 font-medium">
            <a href="/" className="hover:text-white transition-colors">მთავარი</a>
            <a href="/bar-association" className="hover:text-white transition-colors">ადვოკატთა ასოციაცია</a>
            <span className="hover:text-white transition-colors cursor-pointer">კონფიდენციალურობა</span>
            <div className="flex items-center gap-2 text-white/30"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[12px]">სისტემები მუშაობს</span></div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            <span className="text-[11px] md:text-[12px] text-white/20 italic">© 2026 Doctoringo AI. შექმნილია თბილისში</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
