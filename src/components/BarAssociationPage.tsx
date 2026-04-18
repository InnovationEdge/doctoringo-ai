import { useState, useEffect } from 'react';
import {
  Menu, X, CheckCircle, MessageSquare, FileText, Search, Upload,
  Scale, Clock, Minus, Plus, Shield, Zap,
  BookOpen, Lock, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DoctorLogo } from './DoctorLogo';
import { authApi } from '../lib/api';
import { SEO } from './SEO';

const Motion = motion;

const t = {
  GE: {
    badge: 'ადვოკატთა ასოციაცია',
    nav: { about: 'რისთვის', platform: 'პლატფორმა', pricing: 'ფასი', faq: 'კითხვები', start: 'სცადეთ Doctoringo' },
    heroTitle1: 'თქვენი',
    heroTitle2: 'იურიდიული AI.',
    heroSubtitle: 'Matsne ძიება, AI ჩატი, 60+ შაბლონი, ფაილის ანალიზი — ერთ პლატფორმაზე. ექსკლუზიური ფასი ასოციაციის 10,000+ წევრისთვის.',
    continueGoogle: 'Google-ით გაგრძელება',

    // Slide 2: Problem
    problemTitle: 'ადვოკატის ყოველდღიური გამოწვევა',
    problemDesc: 'კლიენტი რეკავს, სასამართლო ხვალაა, ნორმა უნდა მოძებნოთ, კონტრაქტი — გაანალიზოთ, დოკუმენტი — მოამზადოთ. ნაცნობი სიტუაციაა? ეს პრობლემები ყოველდღიურად ზოგავს თქვენს ფულს და დროს.',
    problems: [
      { icon: 'clock', title: 'Matsne-ზე ძიებაში 30+ წუთი იხარჯება', desc: 'ხელით ძიება matsne.gov.ge-ზე — კოდექსებს შორის ნავიგაცია, მუხლების პოვნა, შესაბამისი ნორმების მოძიება. ყოველდღიური რუტინა.' },
      { icon: 'doc', title: 'დოკუმენტის მომზადება 2-3 საათი', desc: 'სარჩელი, საჩივარი, ხელშეკრულება — ყოველ ჯერზე ახლიდან წერა ან ძველი შაბლონების ძიება და ადაპტირება.' },
      { icon: 'upload', title: 'კონტრაქტის ანალიზი — საათობით კითხვა', desc: 'კლიენტის 40-50 გვერდიანი კონტრაქტი. ყოველ მუხლს ხელით კითხულობთ, რისკებს ეძებთ, ხარვეზებს ამოწმებთ.' },
    ],

    // Slide 3: Solution
    solutionTitle: 'Doctoringo AI — თქვენი იურიდიული ასისტენტი',
    solutionDesc: 'ეს არ არის ჩვეულებრივი ChatGPT. Doctoringo AI სპეციალურად ქართული სამართლისთვისაა შექმნილი — იცნობს Matsne.gov.ge-ს სრულ ბაზას, ქართულ სასამართლო პრაქტიკას, სამართლებრივ ტერმინოლოგიას და ადგილობრივ სპეციფიკას. ერთ პლატფორმაზე — ძიება, ჩატი, დოკუმენტები და ფაილის ანალიზი.',

    // Slide 4: AI Chat
    chatTitle: 'AI სამართლებრივი ასისტენტი',
    chatSubtitle: 'ეკითხეთ ნებისმიერი სამართლებრივი კითხვა — ქართულად, ინგლისურად ან რუსულად',
    chatDesc: 'Doctoringo AI იცნობს საქართველოს სამოქალაქო, სისხლის, ადმინისტრაციულ, საგადასახადო, შრომის და კომერციულ სამართალს. მიიღეთ ზუსტი პასუხი ციტატებით, მუხლების მითითებით და სასამართლო პრაქტიკის ანალიზით.',
    chatFeatures: ['პასუხი 5-10 წამში', 'ციტატები კონკრეტული მუხლებიდან', 'სასამართლო პრაქტიკის ანალიზი', 'ქართულად, ინგლისურად და რუსულად'],

    // Slide 5: Matsne Search
    matsneTitle: 'Matsne.gov.ge — AI ძიება',
    matsneSubtitle: 'საქართველოს სრული საკანონმდებლო ბაზა წამებში',
    matsneDesc: 'აღარ დაგჭირდებათ matsne.gov.ge-ზე ხელით ძიება. AI ეძებს სრულ საკანონმდებლო ბაზაში — კოდექსები, ორგანული კანონები, კანონქვემდებარე აქტები, ბრძანებები. იპოვის კონკრეტულ მუხლს, ნორმას ან ჩანაწერს.',
    matsneFeatures: ['რეალურ დროში ძიება Matsne ბაზაში', 'ბუნებრივი ენით კითხვა', 'კონკრეტული მუხლის ციტირება', 'რეგულარულად განახლებული ბაზა'],

    // Slide 6: Documents
    docsTitle: '60+ სამართლებრივი შაბლონი',
    docsSubtitle: 'სასამართლო დოკუმენტები და კონტრაქტები 30 წამში',
    docsDesc: 'სარჩელი, საჩივარი, სააპელაციო საჩივარი, შესაგებელი, იჯარის ხელშეკრულება, ნასყიდობის კონტრაქტი, მინდობილობა, შრომითი ხელშეკრულება, საჩუქრის აქტი და სხვა. ყველა შაბლონი ქართული სამართლის მოთხოვნების შესაბამისად.',
    docsFeatures: ['DOCX და PDF ფორმატში ჩამოტვირთვა', 'მხარეთა მონაცემების ავტომატური შევსება', 'ქართული სამართლის სტანდარტები', 'თანამედროვე ფორმულირებები'],

    // Slide 7: File Analysis
    analysisTitle: 'დოკუმენტის AI ანალიზი',
    analysisSubtitle: 'ატვირთეთ ნებისმიერი PDF — AI წაიკითხავს და გაანალიზებს',
    analysisDesc: 'კლიენტის კონტრაქტი, სასამართლო გადაწყვეტილება, ნოტარიული აქტი — ატვირთეთ და AI წაიკითხავს ყველა გვერდს. გამოავლენს სამართლებრივ რისკებს, პრობლემურ მუხლებს, საჯარიმო პირობებს და მოგცემთ კონკრეტულ რეკომენდაციებს.',
    analysisFeatures: ['PDF, DOCX, TXT ფაილების მხარდაჭერა', 'რისკების ავტომატური იდენტიფიკაცია', 'პრობლემური მუხლების გამოყოფა', 'კონკრეტული რეკომენდაციები'],

    // Slide 8: Use Cases (6 scenarios)
    useCasesTitle: 'როგორ იყენებენ ადვოკატები Doctoringo-ს',
    useCasesSubtitle: 'რეალური სცენარები ყოველდღიური პრაქტიკიდან',
    useCases: [
      { q: '„ხვალ სასამართლო მაქვს. მე მჭირდება სამოქალაქო კოდექსის 150-ე მუხლის ანალიზი და მსგავსი პრეცედენტები"', a: 'AI 10 წამში მოგცემთ მუხლის სრულ ტექსტს, განმარტებას, შესაბამის სასამართლო პრაქტიკას და მსგავს საქმეებს.' },
      { q: '„კლიენტს უნდა იჯარის ხელშეკრულება კომერციულ ფართზე. სტანდარტული ფორმა მჭირდება"', a: 'აირჩიეთ შაბლონი, შეავსეთ მხარეები, ფართის მისამართი და ვადა — 30 წამში გაქვთ მზა DOCX კონტრაქტი.' },
      { q: '„კლიენტმა გამომიგზავნა 40 გვერდიანი ხელშეკრულება. უნდა ვიცოდე რა რისკები არის"', a: 'ატვირთეთ PDF — AI წაიკითხავს ყველა გვერდს, გამოავლენს პრობლემურ მუხლებს, საჯარიმო პირობებს და მოგცემთ რეკომენდაციებს.' },
      { q: '„მჭირდება სააპელაციო საჩივრის მომზადება სამოქალაქო საქმეზე"', a: 'AI დაგეხმარებათ საჩივრის სტრუქტურის შედგენაში, შესაბამისი ნორმების ციტირებაში და არგუმენტაციის გაძლიერებაში.' },
      { q: '„პერსონალურ მონაცემთა დაცვის კანონი — რა ვალდებულებები აქვს ჩემს კლიენტ კომპანიას?"', a: 'AI ჩამოთვლის კონკრეტულ ვალდებულებებს, შესაბამის მუხლებს, ჯარიმების ოდენობას და საჭირო ქმედებების ჩამონათვალს.' },
      { q: '„საგადასახადო დავა მაქვს. რა პრეცედენტები არსებობს მსგავს საქმეებზე?"', a: 'AI მოგცემთ საგადასახადო კოდექსის შესაბამის ნორმებს, შემოსავლების სამსახურის განმარტებებს და სასამართლოს პოზიციას ანალოგიურ საქმეებში.' },
    ],

    // Slide 9: ROI
    roiTitle: 'რატომ ღირს 20₾ თვეში?',
    roiDesc: 'ერთი საათი ადვოკატის მუშაობის ჯდება 100-500₾. Doctoringo AI ზოგავს კვირაში მინიმუმ 5-10 საათს. 20₾ თვეში — ეს ყველაზე მომგებიანი ინვესტიციაა თქვენს პრაქტიკაში.',
    roiItems: [
      { before: 'Matsne-ზე ძიება', old: '30 წუთი', new: '10 წამი', saved: 'დღეში 1-2 საათი' },
      { before: 'სარჩელის შაბლონი', old: '2-3 საათი', new: '2 წუთი', saved: 'საქმეზე 2+ საათი' },
      { before: 'კონტრაქტის ანალიზი', old: '2-4 საათი', new: '2-3 წუთი', saved: 'საქმეზე 2+ საათი' },
      { before: 'კვლევა / პრეცედენტები', old: '1-3 საათი', new: '1 წუთი', saved: 'საქმეზე 1+ საათი' },
    ],
    roiBefore: 'ძველი გზით',
    roiAfter: 'Doctoringo-ით',
    roiSaved: 'დაზოგვა',

    // Slide 10: Numbers
    numbersTitle: 'ციფრებით',
    numbers: [
      { value: '60+', label: 'სამართლებრივი შაბლონი' },
      { value: '10K+', label: 'ადვოკატთა ასოციაციის წევრი' },
      { value: '24/7', label: 'ხელმისაწვდომობა' },
      { value: '10 წმ', label: 'საშუალო პასუხის დრო' },
      { value: '3', label: 'ენა: ქართული, ინგლისური, რუსული' },
      { value: '100%', label: 'კონფიდენციალურობა' },
    ],

    // Slide 11: Security
    securityTitle: 'თქვენი მონაცემები სრულად დაცულია',
    securityDesc: 'ადვოკატ-კლიენტის კონფიდენციალურობა ჩვენთვის პრიორიტეტია. Doctoringo AI აშენებულია Enterprise-დონის უსაფრთხოების სტანდარტებით.',
    securityItems: [
      { icon: 'shield', title: 'Google Cloud Infrastructure', desc: 'Google-ის Enterprise-დონის სერვერებზე ჰოსტინგი — SOC2, ISO 27001 სტანდარტები.' },
      { icon: 'lock', title: 'AES-256 ენკრიფცია', desc: 'თქვენი ყველა კონსულტაცია და ატვირთული ფაილი დაშიფრულია ინდუსტრიის უმაღლესი სტანდარტებით.' },
      { icon: 'zap', title: 'Zero-Training პოლიტიკა', desc: 'თქვენი მონაცემები არასდროს გამოიყენება AI მოდელის სწავლებისთვის. სრული კონფიდენციალურობა.' },
      { icon: 'globe', title: 'GDPR შესაბამისობა', desc: 'ევროკავშირის მონაცემთა დაცვის რეგულაციის სრული დაცვა.' },
    ],

    // Slide 12: Bar Association
    baTitle: 'ექსკლუზიური პარტნიორობა ადვოკატთა ასოციაციასთან',
    baDesc: 'ადვოკატთა ასოციაციის 10,000+ წევრისთვის მოქმედებს სპეციალური ფასი: 20₾/თვეში ნაცვლად სტანდარტული 49₾-ისა. ეს არის 59% ფასდაკლება — ექსკლუზიურად ასოციაციის წევრებისთვის.',

    // Pricing
    pricingTitle: 'წევრის ექსკლუზიური ფასი',
    price: '20', currency: '₾', period: '/თვეში', oldPrice: '49₾', save: 'დაზოგეთ 59%',
    pricingFeatures: [
      'ულიმიტო AI კონსულტაციები — 24 საათი, 7 დღე',
      '60+ სამართლებრივი შაბლონი (DOCX + PDF)',
      'Matsne.gov.ge სრული ძიება რეალურ დროში',
      'დოკუმენტების ატვირთვა და AI ანალიზი',
      'კვლევის გაზიარება კოლეგებთან ერთი ბმულით',
      'ქართული, ინგლისური და რუსული ენა',
      'გაძლიერებული AI მოდელი — მაქსიმალური სიზუსტე',
      'პრიორიტეტული ტექნიკური მხარდაჭერა',
      'რეგულარულად განახლებული საკანონმდებლო ბაზა',
    ],
    pricingCta: 'გააქტიურეთ ახლავე',
    includes: 'მოიცავს:',

    // FAQ (6 questions)
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      { q: 'რა შეუძლია Doctoringo AI-ს, რაც ჩვეულებრივ ChatGPT-ს არ შეუძლია?', a: 'ChatGPT არ იცნობს ქართულ კანონმდებლობას, არ აქვს Matsne.gov.ge-სთან ინტეგრაცია, ვერ ამზადებს სამართლებრივ დოკუმენტებს ქართული სტანდარტებით და არ იცნობს ქართულ სასამართლო პრაქტიკას. Doctoringo სპეციალურად არის შექმნილი ქართული სამართლისთვის.' },
      { q: 'ჩემი კონსულტაციების მონაცემები დაცულია?', a: 'დიახ. Google Cloud ინფრასტრუქტურა, AES-256 ენკრიფცია, GDPR შესაბამისობა. თქვენი კონსულტაციები არასდროს გამოიყენება AI მოდელის სწავლებისთვის. ადვოკატ-კლიენტის კონფიდენციალურობა სრულად დაცულია.' },
      { q: 'შემიძლია თუ არა AI-ს პასუხის სასამართლოში წარდგენა?', a: 'AI-ს პასუხები არის საინფორმაციო ხასიათის და დამხმარე ხელსაწყოა. მის მიერ მოძიებული ნორმები, ციტატები და პრეცედენტები რეალურია და შეგიძლიათ გამოიყენოთ კვლევაში, მაგრამ საბოლოო გადაწყვეტილება და სამართლებრივი რჩევა ყოველთვის ადვოკატის პასუხისმგებლობაა.' },
      { q: 'როგორ გავააქტიურო ასოციაციის წევრის ფასდაკლება?', a: 'დარეგისტრირდით Google ანგარიშით და გადახდის გვერდზე ავტომატურად მიიღებთ წევრის ფასს — 20₾/თვე ნაცვლად 49₾-ისა. არანაირი კოდი ან დამატებითი ვერიფიკაცია არ არის საჭირო.' },
      { q: 'რამდენად ზუსტია AI-ს პასუხები?', a: 'Doctoringo AI სპეციალურად არის ოპტიმიზებული ქართულ სამართალზე და Matsne.gov.ge-ს მონაცემებზე. პასუხები მოიცავს კონკრეტულ მუხლებს, ციტატებს და წყაროს მითითებას. ბაზა რეგულარულად განახლდება ახალი კანონებით.' },
      { q: 'შეიძლება თუ არა AI-სთან ფაილების ატვირთვა?', a: 'დიახ. ატვირთეთ PDF, DOCX ან TXT ფორმატის ფაილი — კონტრაქტი, სასამართლო გადაწყვეტილება, ნებისმიერი იურიდიული დოკუმენტი. AI წაიკითხავს, გაანალიზებს და მოგცემთ დეტალურ შეფასებას რისკებით და რეკომენდაციებით.' },
    ],

    ctaTitle: 'დაიწყეთ დღეს — 10 წამში',
    ctaDesc: 'დარეგისტრირდით Google ანგარიშით, აირჩიეთ 20₾ ადვოკატთა ასოციაციის გეგმა და დაიწყეთ. ნახეთ რამდენ დროს დაზოგავთ პირველივე დღეს.',
    footer: { rights: '© 2026 Doctoringo AI', made: 'შექმნილია თბილისში', main: 'მთავარი', privacy: 'კონფიდენციალურობა', status: 'სისტემები მუშაობს' },
  },
  EN: {
    badge: 'Bar Association',
    nav: { about: 'Why', platform: 'Platform', pricing: 'Pricing', faq: 'FAQ', start: 'Try Doctoringo' },
    heroTitle1: 'Your',
    heroTitle2: 'Legal AI.',
    heroSubtitle: 'Matsne search, AI chat, 60+ templates, file analysis — one platform. Exclusive pricing for 10,000+ association members.',
    continueGoogle: 'Continue with Google',
    problemTitle: 'The daily challenge of a lawyer',
    problemDesc: 'A client calls, court is tomorrow, you need to find a norm, analyze a contract, prepare a document. Sound familiar? These problems cost you time and money every day.',
    problems: [
      { icon: 'clock', title: '30+ minutes searching on Matsne', desc: 'Manual search on matsne.gov.ge — navigating between codes, finding articles, locating relevant norms. A daily routine.' },
      { icon: 'doc', title: 'Document preparation takes 2-3 hours', desc: 'Claims, appeals, contracts — writing from scratch every time or searching and adapting old templates.' },
      { icon: 'upload', title: 'Contract analysis — hours of reading', desc: 'A client\'s 40-50 page contract. Reading every clause manually, searching for risks, checking for gaps.' },
    ],
    solutionTitle: 'Doctoringo AI — Your Legal Assistant',
    solutionDesc: 'This is not a generic ChatGPT. Doctoringo AI is built specifically for Georgian law — knows the entire Matsne.gov.ge database, Georgian court practice, legal terminology, and local specifics. One platform — search, chat, documents, and file analysis.',
    chatTitle: 'AI Legal Assistant',
    chatSubtitle: 'Ask any legal question — in Georgian, English, or Russian',
    chatDesc: 'Doctoringo AI knows Georgian civil, criminal, administrative, tax, labor, and commercial law. Get precise answers with citations, article references, and judicial practice analysis.',
    chatFeatures: ['Response in 5-10 seconds', 'Citations from specific articles', 'Court practice analysis', 'Georgian, English, and Russian'],
    matsneTitle: 'Matsne.gov.ge — AI Search',
    matsneSubtitle: 'Full Georgian legislative database in seconds',
    matsneDesc: 'No more manual searching on matsne.gov.ge. AI searches the entire legislative database — codes, organic laws, subordinate acts, decrees. Finds specific articles, norms, or entries.',
    matsneFeatures: ['Real-time search in Matsne database', 'Natural language queries', 'Specific article citations', 'Regularly updated database'],
    docsTitle: '60+ Legal Templates',
    docsSubtitle: 'Court documents and contracts in 30 seconds',
    docsDesc: 'Claims, appeals, appellate complaints, objections, lease agreements, purchase contracts, powers of attorney, employment contracts, gift deeds and more. All templates compliant with Georgian legal requirements.',
    docsFeatures: ['Download in DOCX and PDF format', 'Automatic party data filling', 'Georgian legal standards', 'Modern legal language'],
    analysisTitle: 'AI Document Analysis',
    analysisSubtitle: 'Upload any PDF — AI reads and analyzes it',
    analysisDesc: 'Client contracts, court decisions, notarial acts — upload and AI reads every page. Identifies legal risks, problematic clauses, penalty conditions, and provides specific recommendations.',
    analysisFeatures: ['PDF, DOCX, TXT file support', 'Automatic risk identification', 'Problematic clause highlighting', 'Specific recommendations'],
    useCasesTitle: 'How lawyers use Doctoringo',
    useCasesSubtitle: 'Real scenarios from daily practice',
    useCases: [
      { q: '"I have court tomorrow. I need analysis of Civil Code Article 150 and similar precedents"', a: 'AI gives you the full article text, interpretation, relevant case law, and similar cases in 10 seconds.' },
      { q: '"My client needs a commercial space lease agreement. I need a standard form"', a: 'Select a template, fill in parties, address and term — you have a ready DOCX contract in 30 seconds.' },
      { q: '"Client sent me a 40-page contract. I need to know what risks exist"', a: 'Upload the PDF — AI reads every page, identifies problematic clauses, penalty conditions, and gives recommendations.' },
      { q: '"I need to prepare an appeal in a civil case"', a: 'AI helps you structure the appeal, cite relevant norms, and strengthen argumentation.' },
      { q: '"Personal data protection law — what obligations does my client company have?"', a: 'AI lists specific obligations, relevant articles, fine amounts, and a checklist of required actions.' },
      { q: '"I have a tax dispute. What precedents exist in similar cases?"', a: 'AI provides relevant Tax Code norms, Revenue Service interpretations, and court positions in analogous cases.' },
    ],
    roiTitle: 'Why is 20₾/month worth it?',
    roiDesc: 'One hour of a lawyer\'s work costs 100-500₾. Doctoringo AI saves at least 5-10 hours per week. 20₾ per month — this is the most profitable investment in your practice.',
    roiItems: [
      { before: 'Matsne search', old: '30 min', new: '10 sec', saved: '1-2 hours/day' },
      { before: 'Claim template', old: '2-3 hours', new: '2 min', saved: '2+ hours/case' },
      { before: 'Contract analysis', old: '2-4 hours', new: '2-3 min', saved: '2+ hours/case' },
      { before: 'Research / precedents', old: '1-3 hours', new: '1 min', saved: '1+ hours/case' },
    ],
    roiBefore: 'Old way', roiAfter: 'With Doctoringo', roiSaved: 'Savings',
    numbersTitle: 'By the numbers',
    numbers: [
      { value: '60+', label: 'Legal templates' },
      { value: '10K+', label: 'Bar Association members' },
      { value: '24/7', label: 'Availability' },
      { value: '10 sec', label: 'Average response time' },
      { value: '3', label: 'Languages: GE, EN, RU' },
      { value: '100%', label: 'Confidentiality' },
    ],
    securityTitle: 'Your data is fully protected',
    securityDesc: 'Attorney-client confidentiality is our priority. Doctoringo AI is built with enterprise-grade security standards.',
    securityItems: [
      { icon: 'shield', title: 'Google Cloud Infrastructure', desc: 'Hosted on Google\'s enterprise servers — SOC2, ISO 27001 standards.' },
      { icon: 'lock', title: 'AES-256 Encryption', desc: 'All your consultations and uploaded files are encrypted with industry-leading standards.' },
      { icon: 'zap', title: 'Zero-Training Policy', desc: 'Your data is never used for AI model training. Complete confidentiality.' },
      { icon: 'globe', title: 'GDPR Compliance', desc: 'Full compliance with EU data protection regulations.' },
    ],
    baTitle: 'Exclusive Bar Association Partnership',
    baDesc: 'Special pricing for 10,000+ Bar Association members: 20₾/month instead of the standard 49₾. That\'s a 59% discount — exclusively for association members.',
    pricingTitle: 'Exclusive member pricing',
    price: '20', currency: '₾', period: '/month', oldPrice: '49₾', save: 'Save 59%',
    pricingFeatures: [
      'Unlimited AI consultations — 24 hours, 7 days',
      '60+ legal templates (DOCX + PDF)',
      'Full Matsne.gov.ge search in real-time',
      'Document upload & AI analysis',
      'Share research with colleagues via one link',
      'Georgian, English, and Russian language support',
      'Enhanced AI model — maximum accuracy',
      'Priority technical support',
      'Regularly updated legislative database',
    ],
    pricingCta: 'Activate Now',
    includes: 'Includes:',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What can Doctoringo AI do that regular ChatGPT cannot?', a: 'ChatGPT doesn\'t know Georgian legislation, has no Matsne.gov.ge integration, cannot generate legal documents to Georgian standards, and doesn\'t know Georgian court practice. Doctoringo is purpose-built for Georgian law.' },
      { q: 'Is my consultation data protected?', a: 'Yes. Google Cloud infrastructure, AES-256 encryption, GDPR compliance. Your consultations are never used for AI model training. Attorney-client confidentiality is fully preserved.' },
      { q: 'Can I submit AI responses to court?', a: 'AI responses are informational and a support tool. The norms, citations, and precedents it finds are real and you can use them in research, but the final decision and legal advice is always the lawyer\'s responsibility.' },
      { q: 'How do I activate the association member discount?', a: 'Register with your Google account and the member price of 20₾/month instead of 49₾ will be automatically applied at checkout. No codes or additional verification needed.' },
      { q: 'How accurate are AI responses?', a: 'Doctoringo AI is specifically optimized for Georgian law and Matsne.gov.ge data. Responses include specific articles, citations, and source references. The database is regularly updated with new legislation.' },
      { q: 'Can I upload files to the AI?', a: 'Yes. Upload PDF, DOCX, or TXT files — contracts, court decisions, any legal document. AI reads, analyzes, and gives you a detailed assessment with risks and recommendations.' },
    ],
    ctaTitle: 'Start today — in 10 seconds',
    ctaDesc: 'Register with your Google account, choose the 20₾ Bar Association plan, and get started. See how much time you save on your very first day.',
    footer: { rights: '© 2026 Doctoringo AI', made: 'Made in Tbilisi', main: 'Main page', privacy: 'Privacy', status: 'Systems Operational' },
  },
  RU: {
    badge: 'Ассоциация адвокатов',
    nav: { about: 'Зачем', platform: 'Платформа', pricing: 'Цена', faq: 'Вопросы', start: 'Попробовать' },
    heroTitle1: 'Ваш',
    heroTitle2: 'юридический ИИ.',
    heroSubtitle: 'Поиск по Matsne, ИИ-чат, 60+ шаблонов, анализ файлов — одна платформа. Эксклюзивная цена для 10 000+ членов ассоциации.',
    continueGoogle: 'Войти через Google',
    problemTitle: 'Ежедневный вызов адвоката',
    problemDesc: 'Клиент звонит, суд завтра, нужно найти норму, проанализировать контракт, подготовить документ. Знакомо? Эти проблемы ежедневно стоят вам времени и денег.',
    problems: [
      { icon: 'clock', title: '30+ минут на поиск в Matsne', desc: 'Ручной поиск на matsne.gov.ge — навигация между кодексами, поиск статей, нахождение релевантных норм. Ежедневная рутина.' },
      { icon: 'doc', title: 'Подготовка документа — 2-3 часа', desc: 'Иски, жалобы, контракты — каждый раз писать заново или искать и адаптировать старые шаблоны.' },
      { icon: 'upload', title: 'Анализ контракта — часы чтения', desc: 'Контракт клиента на 40-50 страниц. Каждый пункт читать вручную, искать риски, проверять на пробелы.' },
    ],
    solutionTitle: 'Doctoringo AI — Ваш юридический ассистент',
    solutionDesc: 'Это не обычный ChatGPT. Doctoringo AI создан специально для грузинского права — знает полную базу Matsne.gov.ge, грузинскую судебную практику, юридическую терминологию и местную специфику. Одна платформа — поиск, чат, документы и анализ файлов.',
    chatTitle: 'ИИ юридический ассистент',
    chatSubtitle: 'Задайте любой юридический вопрос — на грузинском, английском или русском',
    chatDesc: 'Doctoringo AI знает гражданское, уголовное, административное, налоговое, трудовое и коммерческое право Грузии. Получите точные ответы с цитатами, ссылками на статьи и анализом судебной практики.',
    chatFeatures: ['Ответ за 5-10 секунд', 'Цитаты из конкретных статей', 'Анализ судебной практики', 'Грузинский, английский и русский'],
    matsneTitle: 'Matsne.gov.ge — ИИ поиск',
    matsneSubtitle: 'Полная законодательная база Грузии за секунды',
    matsneDesc: 'Больше не нужно искать вручную на matsne.gov.ge. ИИ ищет по всей законодательной базе — кодексы, органические законы, подзаконные акты, указы. Находит конкретные статьи, нормы или записи.',
    matsneFeatures: ['Поиск в реальном времени по базе Matsne', 'Запросы на естественном языке', 'Цитирование конкретных статей', 'Регулярно обновляемая база'],
    docsTitle: '60+ юридических шаблонов',
    docsSubtitle: 'Судебные документы и контракты за 30 секунд',
    docsDesc: 'Иски, жалобы, апелляционные жалобы, возражения, договоры аренды, купли-продажи, доверенности, трудовые договоры, дарственные и многое другое. Все шаблоны соответствуют требованиям грузинского права.',
    docsFeatures: ['Скачивание в DOCX и PDF формате', 'Автоматическое заполнение данных сторон', 'Стандарты грузинского права', 'Современные юридические формулировки'],
    analysisTitle: 'ИИ анализ документов',
    analysisSubtitle: 'Загрузите любой PDF — ИИ прочитает и проанализирует',
    analysisDesc: 'Контракт клиента, решение суда, нотариальный акт — загрузите, и ИИ прочитает каждую страницу. Выявит правовые риски, проблемные пункты, штрафные условия и даст конкретные рекомендации.',
    analysisFeatures: ['Поддержка PDF, DOCX, TXT файлов', 'Автоматическая идентификация рисков', 'Выделение проблемных пунктов', 'Конкретные рекомендации'],
    useCasesTitle: 'Как адвокаты используют Doctoringo',
    useCasesSubtitle: 'Реальные сценарии из ежедневной практики',
    useCases: [
      { q: '«Завтра суд. Мне нужен анализ статьи 150 Гражданского кодекса и похожие прецеденты»', a: 'ИИ за 10 секунд выдаст полный текст статьи, толкование, релевантную судебную практику и похожие дела.' },
      { q: '«Клиенту нужен договор аренды коммерческого помещения. Нужна стандартная форма»', a: 'Выберите шаблон, укажите стороны, адрес и срок — через 30 секунд у вас готовый DOCX контракт.' },
      { q: '«Клиент прислал 40-страничный контракт. Нужно знать какие риски есть»', a: 'Загрузите PDF — ИИ прочитает каждую страницу, найдёт проблемные пункты, штрафные условия и даст рекомендации.' },
      { q: '«Нужно подготовить апелляционную жалобу по гражданскому делу»', a: 'ИИ поможет со структурой жалобы, цитированием норм и усилением аргументации.' },
      { q: '«Закон о защите персональных данных — какие обязанности у компании моего клиента?»', a: 'ИИ перечислит конкретные обязанности, соответствующие статьи, размеры штрафов и чек-лист необходимых действий.' },
      { q: '«У меня налоговый спор. Какие прецеденты существуют по аналогичным делам?»', a: 'ИИ предоставит нормы Налогового кодекса, разъяснения Службы доходов и позицию суда по аналогичным делам.' },
    ],
    roiTitle: 'Зачем платить 20₾ в месяц?',
    roiDesc: 'Час работы адвоката стоит 100-500₾. Doctoringo AI экономит минимум 5-10 часов в неделю. 20₾ в месяц — самая выгодная инвестиция в вашу практику.',
    roiItems: [
      { before: 'Поиск по Matsne', old: '30 мин', new: '10 сек', saved: '1-2 часа/день' },
      { before: 'Подготовка иска', old: '2-3 часа', new: '2 мин', saved: '2+ часа/дело' },
      { before: 'Анализ контракта', old: '2-4 часа', new: '2-3 мин', saved: '2+ часа/дело' },
      { before: 'Исследование', old: '1-3 часа', new: '1 мин', saved: '1+ час/дело' },
    ],
    roiBefore: 'Старый способ', roiAfter: 'С Doctoringo', roiSaved: 'Экономия',
    numbersTitle: 'В цифрах',
    numbers: [
      { value: '60+', label: 'Юридических шаблонов' },
      { value: '10K+', label: 'Членов ассоциации' },
      { value: '24/7', label: 'Доступность' },
      { value: '10 сек', label: 'Среднее время ответа' },
      { value: '3', label: 'Языка: GE, EN, RU' },
      { value: '100%', label: 'Конфиденциальность' },
    ],
    securityTitle: 'Ваши данные полностью защищены',
    securityDesc: 'Конфиденциальность адвокат-клиент — наш приоритет. Doctoringo AI построен со стандартами безопасности корпоративного уровня.',
    securityItems: [
      { icon: 'shield', title: 'Google Cloud Infrastructure', desc: 'Хостинг на серверах Google корпоративного уровня — стандарты SOC2, ISO 27001.' },
      { icon: 'lock', title: 'Шифрование AES-256', desc: 'Все ваши консультации и загруженные файлы зашифрованы по высшим отраслевым стандартам.' },
      { icon: 'zap', title: 'Политика Zero-Training', desc: 'Ваши данные никогда не используются для обучения ИИ. Полная конфиденциальность.' },
      { icon: 'globe', title: 'Соответствие GDPR', desc: 'Полное соблюдение регламента ЕС о защите данных.' },
    ],
    baTitle: 'Эксклюзивное партнёрство с Ассоциацией адвокатов',
    baDesc: 'Специальная цена для 10 000+ членов ассоциации: 20₾/месяц вместо стандартных 49₾. Скидка 59% — эксклюзивно для членов ассоциации.',
    pricingTitle: 'Эксклюзивная цена для членов',
    price: '20', currency: '₾', period: '/месяц', oldPrice: '49₾', save: 'Экономия 59%',
    pricingFeatures: [
      'Безлимитные ИИ-консультации — 24 часа, 7 дней',
      '60+ юридических шаблонов (DOCX + PDF)',
      'Полный поиск по Matsne.gov.ge в реальном времени',
      'Загрузка документов и ИИ-анализ',
      'Обмен исследованиями с коллегами по ссылке',
      'Грузинский, английский и русский язык',
      'Улучшенная модель ИИ — максимальная точность',
      'Приоритетная техническая поддержка',
      'Регулярно обновляемая база законодательства',
    ],
    pricingCta: 'Активировать сейчас',
    includes: 'Включает:',
    faqTitle: 'Часто задаваемые вопросы',
    faqs: [
      { q: 'Что может Doctoringo AI, чего не может обычный ChatGPT?', a: 'ChatGPT не знает грузинское законодательство, не имеет интеграции с Matsne.gov.ge, не может создавать документы по грузинским стандартам и не знает грузинскую судебную практику. Doctoringo создан специально для грузинского права.' },
      { q: 'Мои данные консультаций защищены?', a: 'Да. Инфраструктура Google Cloud, шифрование AES-256, соответствие GDPR. Ваши консультации никогда не используются для обучения ИИ. Конфиденциальность адвокат-клиент полностью сохранена.' },
      { q: 'Можно ли представить ответы ИИ в суде?', a: 'Ответы ИИ носят информационный характер. Нормы, цитаты и прецеденты реальны и могут использоваться в исследованиях, но окончательное решение и юридическая консультация — всегда ответственность адвоката.' },
      { q: 'Как активировать скидку члена ассоциации?', a: 'Зарегистрируйтесь через Google, и на странице оплаты автоматически применится цена 20₾/месяц вместо 49₾. Никаких кодов или дополнительной верификации не нужно.' },
      { q: 'Насколько точны ответы ИИ?', a: 'Doctoringo AI специально оптимизирован для грузинского права и данных Matsne.gov.ge. Ответы включают конкретные статьи, цитаты и ссылки на источники. База регулярно обновляется новым законодательством.' },
      { q: 'Можно ли загружать файлы в ИИ?', a: 'Да. Загрузите PDF, DOCX или TXT — контракты, решения суда, любые юридические документы. ИИ прочитает, проанализирует и даст детальную оценку с рисками и рекомендациями.' },
    ],
    ctaTitle: 'Начните сегодня — за 10 секунд',
    ctaDesc: 'Зарегистрируйтесь через Google, выберите план 20₾ для членов ассоциации и начните. Увидите, сколько времени сэкономите в первый же день.',
    footer: { rights: '© 2026 Doctoringo AI', made: 'Создано в Тбилиси', main: 'Главная', privacy: 'Конфиденциальность', status: 'Системы работают' },
  },
};

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

const problemIcons = [
  <Clock className="w-8 h-8 text-[#033C81]" />,
  <FileText className="w-8 h-8 text-[#033C81]" />,
  <Upload className="w-8 h-8 text-[#033C81]" />,
];

const securityIconMap: Record<string, React.ReactNode> = {
  shield: <Shield className="w-6 h-6 text-[#033C81]" />,
  lock: <Lock className="w-6 h-6 text-[#033C81]" />,
  zap: <Zap className="w-6 h-6 text-[#033C81]" />,
  globe: <Globe className="w-6 h-6 text-[#033C81]" />,
};

export function BarAssociationPage() {
  const [language, setLanguage] = useState<'EN' | 'GE' | 'RU'>('GE');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const T = t[language];

  const seoTitles = { GE: 'ადვოკატთა ასოციაცია — Doctoringo AI პარტნიორობა', EN: 'Bar Association Partnership', RU: 'Ассоциация адвокатов — Партнёрство' };
  const seoDescs = {
    GE: 'Doctoringo AI — ექსკლუზიური ფასი ადვოკატთა ასოციაციის 10,000+ წევრისთვის. Matsne ძიება, AI ჩატი, 60+ შაბლონი.',
    EN: 'Doctoringo AI — Exclusive pricing for Bar Association members. AI-powered legal assistant with Matsne search.',
    RU: 'Doctoringo AI — Эксклюзивные условия для членов Ассоциации адвокатов.'
  };

  const handleGoogleLogin = () => { setIsSubmitting(true); authApi.loginWithGoogle(); };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' }); setMobileMenuOpen(false); }
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] text-[#1a1a1a] dark:text-[#ececec] flex flex-col overflow-x-hidden font-sans transition-colors duration-300">
      <SEO
        title={seoTitles[language]}
        description={seoDescs[language]}
        url="/bar-association"
      />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4 flex items-center justify-between bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-transparent dark:border-white/5">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="flex items-center gap-2">
            <DoctorLogo className="h-7 w-7" />
            <span className="text-[20px] md:text-[22px] font-serif tracking-tight font-medium">Doctoringo</span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest bg-[#033C81]/10 text-[#033C81] px-3 py-1 rounded-full">{T.badge}</span>
          </div>
          <GoogleCloudBadge />
        </div>
        <div className="hidden lg:flex items-center gap-8">
          {[['about', T.nav.about], ['platform', T.nav.platform], ['pricing', T.nav.pricing], ['faq', T.nav.faq]].map(([id, label]) => (
            <button key={id} onClick={() => scrollToSection(id)} className="text-[14px] text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors font-medium">{label}</button>
          ))}
          <button onClick={handleGoogleLogin} disabled={isSubmitting} className="bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-[14px] font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">{T.nav.start}</button>
        </div>
        <div className="lg:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#676767] dark:text-[#8e8e8e] hover:text-black dark:hover:text-white transition-colors">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-[60] bg-[#fcfcf9] dark:bg-[#171717] p-6 flex flex-col gap-10 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1"><div className="flex items-center gap-2"><DoctorLogo className="h-7 w-7" /><span className="text-xl font-serif">Doctoringo</span></div><GoogleCloudBadge /></div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#676767] dark:text-[#8e8e8e]"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col gap-4 text-xl font-serif">
              {[['about', T.nav.about], ['platform', T.nav.platform], ['pricing', T.nav.pricing], ['faq', T.nav.faq]].map(([id, label]) => (
                <button key={id} onClick={() => scrollToSection(id)} className="text-left py-1.5">{label}</button>
              ))}
              <div className="pt-2"><button onClick={handleGoogleLogin} disabled={isSubmitting} className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-3 rounded-xl text-[15px] font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50">{T.nav.start}</button></div>
            </div>
            <div className="mt-auto pt-8 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-4 bg-[#f3f2ee] dark:bg-white/5 px-4 py-3 rounded-full w-fit">
                {(['GE', 'EN', 'RU'] as const).map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)} className={`px-2 py-1 text-[13px] font-bold rounded-lg transition-colors ${language === lang ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-[#8e8e8e]'}`}>{lang}</button>
                ))}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* SLIDE 1: Hero */}
        <section className="relative flex flex-col items-center text-center px-6 md:px-12 xl:px-32 pt-32 md:pt-40 pb-20 md:pb-24 min-h-[80vh] overflow-hidden">
          {/* Decorative gradient blobs */}
          <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-[#033C81]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-40 -right-32 w-[350px] h-[350px] bg-[#033C81]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-[#033C81]/3 to-transparent rounded-full blur-[80px] pointer-events-none" />
          <div className="relative space-y-6 max-w-lg mx-auto">
            <Motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[42px] md:text-[64px] xl:text-[84px] font-serif leading-[1.1] tracking-tight text-[#1a1a1a] dark:text-white">{T.heroTitle1}<br />{T.heroTitle2}</Motion.h1>
            <Motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[18px] md:text-[20px] xl:text-[24px] text-[#676767] dark:text-[#8e8e8e] font-serif italic max-w-lg mx-auto">{T.heroSubtitle}</Motion.p>
          </div>
          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full max-w-[420px] bg-white dark:bg-[#1c1c1a] rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.05)] border border-[#e5e5e0] dark:border-[#2d2d2d] flex flex-col gap-5 md:gap-6 mx-auto mt-10 md:mt-12">
            <button onClick={handleGoogleLogin} disabled={isSubmitting} className="w-full flex items-center justify-center gap-2.5 py-2.5 md:py-3 bg-white text-[#1f1f1f] border border-[#747775] rounded-full hover:bg-[#f8f9fa] transition-all text-[14px] md:text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] shadow-sm"><GoogleIcon /><span className="tracking-tight">{T.continueGoogle}</span></button>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-baseline gap-1"><span className="text-[28px] md:text-[32px] font-serif font-bold">{T.price}{T.currency}</span><span className="text-[16px] font-serif text-[#8e8e8e]">{T.period}</span></div>
              <span className="text-[14px] text-[#8e8e8e] line-through">{T.oldPrice}</span>
              <span className="text-[11px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full">{T.save}</span>
            </div>
          </Motion.div>
        </section>

        {/* SLIDE 2: Problem */}
        <section id="about" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-[800px] mx-auto text-center space-y-6 mb-16 md:mb-24">
            <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight leading-tight">{T.problemTitle}</h2>
            <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic px-4">{T.problemDesc}</p>
          </div>
          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {T.problems.map((p, i) => (
              <Motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[24px] p-6 md:p-8 border border-[#e5e5e0] dark:border-white/10 space-y-4">
                {problemIcons[i]}
                <h3 className="text-[17px] md:text-[18px] font-serif font-medium">{p.title}</h3>
                <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{p.desc}</p>
              </Motion.div>
            ))}
          </div>
        </section>

        {/* SLIDE 3: Solution */}
        <section className="py-16 md:py-24 px-6 md:px-12 xl:px-32 bg-[#f3f2ee] dark:bg-[#212121] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[800px] mx-auto text-center space-y-6">
            <DoctorLogo className="w-14 h-14 mx-auto" />
            <h2 className="text-[28px] md:text-[40px] font-serif tracking-tight leading-tight">{T.solutionTitle}</h2>
            <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic px-4">{T.solutionDesc}</p>
          </div>
        </section>

        {/* SLIDE 4: AI Chat */}
        <section id="platform" className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="bg-[#f3f2ee] dark:bg-[#212121] rounded-[32px] p-6 md:p-12 aspect-video md:aspect-square flex items-center justify-center shadow-inner overflow-hidden">
              <div className="w-full md:w-3/4 h-full md:h-3/4 bg-white dark:bg-[#1c1c1a] rounded-2xl shadow-2xl p-6 md:p-8 space-y-4 border border-[#e5e5e0] dark:border-white/5 relative top-4 md:top-0">
                <div className="flex items-center gap-2 mb-4"><DoctorLogo className="w-5 h-5" /><span className="text-[10px] md:text-sm font-medium opacity-50 uppercase tracking-widest">Assistant</span></div>
                <div className="h-3 md:h-4 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-3/4" />
                <div className="h-3 md:h-4 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-full" />
                <div className="h-16 md:h-20 border border-[#e5e5e0] dark:border-white/10 rounded-xl p-3 md:p-4 flex gap-3 bg-[#fcfcf9] dark:bg-white/5">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#033C81]" />
                  <div className="space-y-2 flex-1"><div className="h-2 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-1/2" /><div className="h-2 bg-[#f3f2ee] dark:bg-[#2d2d2d] rounded w-3/4" /></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <BookOpen className="w-10 h-10 text-[#033C81]" />
              <h2 className="text-[28px] md:text-[36px] font-serif tracking-tight">{T.chatTitle}</h2>
              <p className="text-[14px] text-[#033C81] font-bold uppercase tracking-widest">{T.chatSubtitle}</p>
              <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{T.chatDesc}</p>
              <div className="space-y-3 pt-2">{T.chatFeatures.map((f, i) => <div key={i} className="flex gap-3 items-center text-[14px]"><CheckCircle className="w-4 h-4 text-[#033C81] flex-shrink-0" /><span className="text-[#676767] dark:text-[#8e8e8e]">{f}</span></div>)}</div>
            </div>
          </div>
        </section>

        {/* SLIDE 5: Matsne + SLIDE 6: Documents + SLIDE 7: Analysis */}
        <section className="bg-white dark:bg-[#1a1a1a] py-20 md:py-32 px-6 md:px-12 xl:px-32 border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto space-y-20 md:space-y-32">
            {([
              { icon: <Search className="w-10 h-10 text-[#033C81]" />, title: T.matsneTitle, sub: T.matsneSubtitle, desc: T.matsneDesc, features: T.matsneFeatures },
              { icon: <FileText className="w-10 h-10 text-[#033C81]" />, title: T.docsTitle, sub: T.docsSubtitle, desc: T.docsDesc, features: T.docsFeatures },
              { icon: <Upload className="w-10 h-10 text-[#033C81]" />, title: T.analysisTitle, sub: T.analysisSubtitle, desc: T.analysisDesc, features: T.analysisFeatures },
            ] as const).map((slide, idx) => (
              <Motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`grid lg:grid-cols-2 gap-12 md:gap-20 items-center ${idx % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
                <div className={`space-y-6 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                  {slide.icon}
                  <h2 className="text-[28px] md:text-[36px] font-serif tracking-tight">{slide.title}</h2>
                  <p className="text-[14px] text-[#033C81] font-bold uppercase tracking-widest">{slide.sub}</p>
                  <p className="text-[15px] md:text-[16px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{slide.desc}</p>
                  <div className="space-y-3 pt-2">{slide.features.map((f, i) => <div key={i} className="flex gap-3 items-center text-[14px]"><CheckCircle className="w-4 h-4 text-[#033C81] flex-shrink-0" /><span className="text-[#676767] dark:text-[#8e8e8e]">{f}</span></div>)}</div>
                </div>
                <div className={`bg-[#f3f2ee] dark:bg-[#212121] rounded-[28px] p-8 md:p-12 flex items-center justify-center min-h-[280px] ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1c1c1a] shadow-lg flex items-center justify-center mx-auto border border-[#e5e5e0] dark:border-white/10">{slide.icon}</div>
                    <p className="text-[13px] text-[#8e8e8e] font-serif italic max-w-[200px] mx-auto">{slide.sub}</p>
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>
        </section>

        {/* SLIDE 8: Use Cases */}
        <section className="bg-[#fcfcf9] dark:bg-[#171717] py-20 md:py-32 px-6 md:px-12 xl:px-32 border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 md:mb-24">
              <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight">{T.useCasesTitle}</h2>
              <p className="text-[16px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">{T.useCasesSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {T.useCases.map((uc, i) => (
                <Motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white dark:bg-[#1c1c1a] rounded-[24px] p-6 md:p-8 border border-[#e5e5e0] dark:border-white/10 shadow-sm hover:shadow-lg transition-all space-y-4">
                  <div className="flex gap-3 items-start"><MessageSquare className="w-5 h-5 text-[#033C81] flex-shrink-0 mt-0.5" /><p className="text-[14px] font-serif italic text-[#1a1a1a] dark:text-white leading-relaxed">{uc.q}</p></div>
                  <div className="flex gap-3 items-start pl-2 border-l-2 border-[#033C81]/20 ml-2"><p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{uc.a}</p></div>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 9: ROI */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center space-y-6 mb-16 md:mb-24">
              <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight">{T.roiTitle}</h2>
              <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic px-4">{T.roiDesc}</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-[11px] font-bold uppercase tracking-wider text-[#8e8e8e] px-6 hidden md:grid">
                <span></span><span>{T.roiBefore}</span><span>{T.roiAfter}</span><span>{T.roiSaved}</span>
              </div>
              {T.roiItems.map((item, i) => (
                <Motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-[#fcfcf9] dark:bg-[#171717] rounded-[20px] p-5 md:p-6 border border-[#e5e5e0] dark:border-white/10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-center">
                  <span className="text-[15px] font-serif font-medium">{item.before}</span>
                  <span className="text-[14px] text-[#8e8e8e] line-through">{item.old}</span>
                  <span className="text-[14px] font-bold text-[#033C81]">{item.new}</span>
                  <span className="text-[13px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full w-fit">{item.saved}</span>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 10: Numbers */}
        <section className="py-16 md:py-24 px-6 md:px-12 xl:px-32 bg-[#f3f2ee] dark:bg-[#212121] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-serif text-center mb-12 md:mb-16">{T.numbersTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
              {T.numbers.map((n, i) => (
                <Motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center space-y-2">
                  <span className="text-[32px] md:text-[40px] font-serif font-bold text-[#033C81]">{n.value}</span>
                  <p className="text-[12px] md:text-[13px] text-[#676767] dark:text-[#8e8e8e] font-medium">{n.label}</p>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 11: Security */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center space-y-6 mb-16 md:mb-24">
              <Shield className="w-12 h-12 text-[#033C81] mx-auto" />
              <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight">{T.securityTitle}</h2>
              <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic px-4">{T.securityDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {T.securityItems.map((item, i) => (
                <Motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-[#1c1c1a] rounded-[24px] p-6 md:p-8 border border-[#e5e5e0] dark:border-white/10 flex gap-4 items-start">
                  <div className="p-2.5 bg-[#033C81]/10 rounded-xl flex-shrink-0">{securityIconMap[item.icon]}</div>
                  <div className="space-y-2"><h3 className="text-[16px] font-serif font-medium">{item.title}</h3><p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed">{item.desc}</p></div>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 12: Bar Association */}
        <section className="py-16 md:py-24 px-6 md:px-12 xl:px-32 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[800px] mx-auto text-center space-y-6">
            <Scale className="w-12 h-12 text-[#033C81] mx-auto" />
            <h2 className="text-[28px] md:text-[36px] font-serif">{T.baTitle}</h2>
            <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] leading-relaxed font-serif italic">{T.baDesc}</p>
          </div>
        </section>

        {/* SLIDE 13: Pricing */}
        <section id="pricing" className="bg-[#fcfcf9] dark:bg-[#171717] py-20 md:py-32 px-6 md:px-12 xl:px-32 border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[560px] mx-auto">
            <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative bg-white dark:bg-[#1c1c1a] rounded-[28px] md:rounded-[32px] border border-[#033C81] p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#033C81] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full z-10">{T.badge}</div>
              <div className="mb-8 pt-2">
                <h3 className="text-[28px] md:text-[32px] font-serif mb-1">{T.pricingTitle}</h3>
                <p className="text-[14px] text-[#676767] dark:text-[#8e8e8e] mb-6">{T.badge}</p>
                <div className="flex items-baseline gap-1 mb-2"><span className="text-[28px] md:text-[32px] font-serif font-bold">{T.price}</span><span className="text-[16px] font-serif text-[#8e8e8e]">{T.currency}{T.period}</span></div>
                <div className="flex items-center gap-3"><span className="text-[14px] text-[#8e8e8e] line-through">{T.oldPrice}</span><span className="text-[11px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">{T.save}</span></div>
              </div>
              <button onClick={handleGoogleLogin} disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mb-12">{T.pricingCta}</button>
              <div className="space-y-4">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">{T.includes}</p>
                {T.pricingFeatures.map((feature, i) => <div key={i} className="flex gap-3 text-[14px] text-[#676767] dark:text-[#8e8e8e]"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#1a1a1a] dark:text-white" /><span>{feature}</span></div>)}
              </div>
            </Motion.div>
          </div>
        </section>

        {/* SLIDE 14: FAQ */}
        <section id="faq" className="py-20 md:py-32 px-6 md:px-12 bg-white dark:bg-[#1a1a1a] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-[28px] md:text-[32px] font-serif text-center mb-12 md:mb-16">{T.faqTitle}</h2>
            <div className="divide-y divide-[#e5e5e0] dark:divide-white/5">
              {T.faqs.map((faq, idx) => (
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

        {/* SLIDE 15: Final CTA */}
        <section className="py-20 md:py-32 px-6 md:px-12 xl:px-32 bg-[#fcfcf9] dark:bg-[#171717] border-t border-[#e5e5e0] dark:border-white/5">
          <div className="max-w-[600px] mx-auto text-center space-y-8">
            <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
              <h2 className="text-[32px] md:text-[48px] font-serif tracking-tight">{T.ctaTitle}</h2>
              <p className="text-[16px] md:text-[18px] text-[#676767] dark:text-[#8e8e8e] font-serif italic">{T.ctaDesc}</p>
            </Motion.div>
            <button onClick={handleGoogleLogin} disabled={isSubmitting} className="w-full max-w-[420px] mx-auto flex items-center justify-center gap-2.5 py-2.5 md:py-3 bg-white text-[#1f1f1f] border border-[#747775] rounded-full hover:bg-[#f8f9fa] transition-all text-[14px] md:text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] shadow-sm"><GoogleIcon /><span className="tracking-tight">{T.continueGoogle}</span></button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 md:py-16 px-6 md:px-12 xl:px-32 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2"><DoctorLogo className="h-6 w-6 brightness-0 invert" /><span className="text-xl font-serif tracking-tight">Doctoringo</span></div>
              <div className="flex items-center gap-1.5 mt-0.5 opacity-60"><span className="text-[8px] uppercase tracking-widest font-bold">Powered By</span><div className="flex items-center gap-1"><svg viewBox="0 0 48 48" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4" /><path d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 6.5 29.6 4.5 24 4.5c-7.4 0-13.8 3.9-17.7 10.2z" fill="#EA4335" /><path d="M24 43.5c5.6 0 10.4-2 14.1-5.4l-6.8-5.3c-2.1 1.4-4.8 2.2-7.3 2.2-5.4 0-10.1-3.6-11.7-8.6l-6.9 5.3C10.2 39.5 16.6 43.5 24 43.5z" fill="#34A853" /><path d="M4.2 28.5c-.7-2-.7-4.1 0-6.1l-6.9-5.3C-4.5 20.8-4.5 27.2-2.7 31l6.9-5.3V28.5z" fill="#FBBC05" /></svg><span className="text-[9px] font-bold">Google Cloud</span></div></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-x-12 gap-y-6 text-[13px] md:text-[14px] text-white/60 font-medium">
            <a href="/" className="hover:text-white transition-colors">{T.footer.main}</a>
            <span className="hover:text-white transition-colors cursor-pointer">{T.footer.privacy}</span>
            <div className="flex items-center gap-2 text-white/30"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[12px]">{T.footer.status}</span></div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg">
              {(['GE', 'EN', 'RU'] as const).map((lang, i) => (
                <div key={lang} className="flex items-center"><button onClick={() => setLanguage(lang)} className={`hover:text-white transition-colors text-[11px] md:text-[12px] font-bold ${language === lang ? 'text-white' : 'text-white/40'}`}>{lang}</button>{i < 2 && <div className="w-px h-3 bg-white/20 ml-4 mr-0" />}</div>
              ))}
            </div>
            <span className="text-[11px] md:text-[12px] text-white/20 italic">{T.footer.rights}. {T.footer.made}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
