import { useState, useEffect, useMemo, useCallback } from 'react'
import { Modal, message } from 'src/components/ui'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useAuth } from 'src/providers/AuthProvider'
import { useCountry } from 'src/providers/CountryProvider'
import { documentsApi } from 'src/api/documents'
import useMobile from 'src/hooks/useMobile'
import LoadingSpinner from 'src/core/components/LoadingSpinner'
import { API_BASE_URL } from 'src/lib/api'
import 'src/assets/css/documents.css'

// Icons
const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const FilePdfIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15v-2h2c.6 0 1 .4 1 1s-.4 1-1 1H9z" />
    <path d="M12 15v-2h1.5a1.5 1.5 0 010 3H12" />
    <path d="M15 15v-2h2" />
    <path d="M15 13.5h1.5" />
  </svg>
)

const FileWordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13l1.5 5 1.5-5 1.5 5 1.5-5" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const FormIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TeamIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const CarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
)

const SafetyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const BankIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
)

const ShoppingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
)

const SolutionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
)

const AuditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)

const FileProtectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 22s4-2 4-5v-3l-4-1.5L8 14v3c0 3 4 5 4 5z" />
  </svg>
)

const CrownIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#faad14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Document type categories
interface DocumentType {
  id: string
  icon: React.ReactNode
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  category: 'contracts' | 'corporate' | 'property' | 'employment' | 'family' | 'other'
  promptTemplate: string
}

const DOCUMENT_TYPES: DocumentType[] = [
  // Contracts
  {
    id: 'service_agreement',
    icon: <FileTextIcon />,
    titleKey: 'doc_service_agreement',
    titleFallback: 'მომსახურების ხელშეკრულება',
    descKey: 'doc_service_agreement_desc',
    descFallback: 'მომსახურების გაწევის სტანდარტული ხელშეკრულება',
    category: 'contracts',
    promptTemplate: 'შექმენი მომსახურების ხელშეკრულება შემდეგი პირობებით:'
  },
  {
    id: 'sales_contract',
    icon: <ShoppingIcon />,
    titleKey: 'doc_sales_contract',
    titleFallback: 'ნასყიდობის ხელშეკრულება',
    descKey: 'doc_sales_contract_desc',
    descFallback: 'ქონების ან საქონლის ნასყიდობის ხელშეკრულება',
    category: 'contracts',
    promptTemplate: 'შექმენი ნასყიდობის ხელშეკრულება შემდეგი პირობებით:'
  },
  {
    id: 'loan_agreement',
    icon: <BankIcon />,
    titleKey: 'doc_loan_agreement',
    titleFallback: 'სესხის ხელშეკრულება',
    descKey: 'doc_loan_agreement_desc',
    descFallback: 'თანხის სესხად აღების ხელშეკრულება',
    category: 'contracts',
    promptTemplate: 'შექმენი სესხის ხელშეკრულება შემდეგი პირობებით:'
  },
  {
    id: 'rental_agreement',
    icon: <HomeIcon />,
    titleKey: 'doc_rental_agreement',
    titleFallback: 'ქირავნობის ხელშეკრულება',
    descKey: 'doc_rental_agreement_desc',
    descFallback: 'უძრავი ან მოძრავი ქონების ქირავნობის ხელშეკრულება',
    category: 'property',
    promptTemplate: 'შექმენი ქირავნობის ხელშეკრულება შემდეგი პირობებით:'
  },
  // Employment
  {
    id: 'employment_contract',
    icon: <TeamIcon />,
    titleKey: 'doc_employment_contract',
    titleFallback: 'შრომითი ხელშეკრულება',
    descKey: 'doc_employment_contract_desc',
    descFallback: 'დამსაქმებლისა და დასაქმებულის შორის შრომითი ხელშეკრულება',
    category: 'employment',
    promptTemplate: 'შექმენი შრომითი ხელშეკრულება შემდეგი პირობებით:'
  },
  {
    id: 'resignation_letter',
    icon: <FormIcon />,
    titleKey: 'doc_resignation_letter',
    titleFallback: 'სამსახურიდან გათავისუფლების განცხადება',
    descKey: 'doc_resignation_letter_desc',
    descFallback: 'საკუთარი სურვილით სამსახურიდან წასვლის განცხადება',
    category: 'employment',
    promptTemplate: 'შექმენი სამსახურიდან გათავისუფლების განცხადება შემდეგი მონაცემებით:'
  },
  {
    id: 'nda',
    icon: <SafetyIcon />,
    titleKey: 'doc_nda',
    titleFallback: 'კონფიდენციალურობის შეთანხმება (NDA)',
    descKey: 'doc_nda_desc',
    descFallback: 'კონფიდენციალური ინფორმაციის გაუმჟღავნებლობის შეთანხმება',
    category: 'employment',
    promptTemplate: 'შექმენი კონფიდენციალურობის შეთანხმება (NDA) შემდეგი პირობებით:'
  },
  // Corporate
  {
    id: 'company_charter',
    icon: <AuditIcon />,
    titleKey: 'doc_company_charter',
    titleFallback: 'კომპანიის წესდება',
    descKey: 'doc_company_charter_desc',
    descFallback: 'შპს-ს ან სხვა სამართლებრივი ფორმის კომპანიის წესდება',
    category: 'corporate',
    promptTemplate: 'შექმენი კომპანიის წესდება შემდეგი მონაცემებით:'
  },
  {
    id: 'shareholders_agreement',
    icon: <SolutionIcon />,
    titleKey: 'doc_shareholders_agreement',
    titleFallback: 'პარტნიორთა შეთანხმება',
    descKey: 'doc_shareholders_agreement_desc',
    descFallback: 'კომპანიის პარტნიორებს/აქციონერებს შორის შეთანხმება',
    category: 'corporate',
    promptTemplate: 'შექმენი პარტნიორთა შეთანხმება შემდეგი პირობებით:'
  },
  {
    id: 'power_of_attorney',
    icon: <FileProtectIcon />,
    titleKey: 'doc_power_of_attorney',
    titleFallback: 'მინდობილობა',
    descKey: 'doc_power_of_attorney_desc',
    descFallback: 'სხვა პირისთვის უფლებამოსილების გადაცემა',
    category: 'other',
    promptTemplate: 'შექმენი მინდობილობა შემდეგი უფლებამოსილებებით:'
  },
  // Property
  {
    id: 'property_deed',
    icon: <HomeIcon />,
    titleKey: 'doc_property_deed',
    titleFallback: 'უძრავი ქონების ნასყიდობა',
    descKey: 'doc_property_deed_desc',
    descFallback: 'უძრავი ქონების ნასყიდობის ხელშეკრულება',
    category: 'property',
    promptTemplate: 'შექმენი უძრავი ქონების ნასყიდობის ხელშეკრულება შემდეგი პირობებით:'
  },
  {
    id: 'vehicle_sale',
    icon: <CarIcon />,
    titleKey: 'doc_vehicle_sale',
    titleFallback: 'ავტომობილის ნასყიდობა',
    descKey: 'doc_vehicle_sale_desc',
    descFallback: 'ავტომობილის ნასყიდობის ხელშეკრულება',
    category: 'property',
    promptTemplate: 'შექმენი ავტომობილის ნასყიდობის ხელშეკრულება შემდეგი პირობებით:'
  },
  // Family
  {
    id: 'prenuptial_agreement',
    icon: <TeamIcon />,
    titleKey: 'doc_prenuptial_agreement',
    titleFallback: 'საქორწინო კონტრაქტი',
    descKey: 'doc_prenuptial_agreement_desc',
    descFallback: 'მეუღლეთა შორის ქონებრივი ურთიერთობის მოწესრიგება',
    category: 'family',
    promptTemplate: 'შექმენი საქორწინო კონტრაქტი შემდეგი პირობებით:'
  },
  {
    id: 'will_testament',
    icon: <FileProtectIcon />,
    titleKey: 'doc_will_testament',
    titleFallback: 'ანდერძი',
    descKey: 'doc_will_testament_desc',
    descFallback: 'სამკვიდრო ქონების განაწილების ანდერძი',
    category: 'family',
    promptTemplate: 'შექმენი ანდერძი შემდეგი მონაცემებით:'
  },
  // Other
  {
    id: 'complaint_letter',
    icon: <FormIcon />,
    titleKey: 'doc_complaint_letter',
    titleFallback: 'საჩივარი',
    descKey: 'doc_complaint_letter_desc',
    descFallback: 'ოფიციალური საჩივარი ორგანიზაციის ან უწყებისთვის',
    category: 'other',
    promptTemplate: 'შექმენი საჩივარი შემდეგი საფუძვლით:'
  },
  {
    id: 'custom_document',
    icon: <FileTextIcon />,
    titleKey: 'doc_custom',
    titleFallback: 'სხვა დოკუმენტი',
    descKey: 'doc_custom_desc',
    descFallback: 'თავად აღწერეთ რა ტიპის დოკუმენტი გჭირდებათ',
    category: 'other',
    promptTemplate: ''
  }
]

const CATEGORIES = [
  { key: 'all', labelKey: 'category_all', labelFallback: 'ყველა' },
  { key: 'contracts', labelKey: 'category_contracts', labelFallback: 'ხელშეკრულებები' },
  { key: 'employment', labelKey: 'category_employment', labelFallback: 'შრომითი' },
  { key: 'corporate', labelKey: 'category_corporate', labelFallback: 'კორპორატიული' },
  { key: 'property', labelKey: 'category_property', labelFallback: 'ქონებრივი' },
  { key: 'family', labelKey: 'category_family', labelFallback: 'საოჯახო' },
  { key: 'other', labelKey: 'category_other', labelFallback: 'სხვა' }
]

const DocumentGenerationPage = () => {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const { selectedCountry } = useCountry()
  const isMobile = useMobile()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null)
  const [userInput, setUserInput] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<{
    id: string
    title: string
    format: string
    file_url: string
  } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Check if user has premium subscription
  const isPremium = user?.subscription?.is_paid === true

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Memoize filtered document types to prevent recalculation on every render
  const filteredDocTypes = useMemo(() =>
    selectedCategory === 'all'
      ? DOCUMENT_TYPES
      : DOCUMENT_TYPES.filter(dt => dt.category === selectedCategory),
    [selectedCategory]
  )

  // Memoize handlers to prevent recreation on every render
  const handleDocTypeSelect = useCallback((docType: DocumentType) => {
    setSelectedDocType(docType)
    setDocumentTitle(translate(docType.titleKey, docType.titleFallback))
    setUserInput('')
    setGeneratedDocument(null)
  }, [translate])

  const handleGenerate = async () => {
    if (!selectedDocType || !userInput.trim()) {
      message.warning(translate('please_fill_details', 'გთხოვთ შეავსოთ დეტალები'))
      return
    }

    // Check if user has premium subscription
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    setIsGenerating(true)

    try {
      // Build the full prompt
      const fullPrompt = selectedDocType.promptTemplate
        ? `${selectedDocType.promptTemplate}\n\n${userInput}`
        : userInput

      // Generate document content via AI chat first (using existing chat API)
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || ''

      // Build a comprehensive prompt for high-quality legal document generation
      const documentInstructions = `
შექმენი პროფესიონალური იურიდიული დოკუმენტი შემდეგი მოთხოვნებით:

${fullPrompt}

**დოკუმენტის ფორმატირების წესები:**

1. **სტრუქტურა:**
   - დაიწყე დოკუმენტის სათაურით (მაგ: "ნასყიდობის ხელშეკრულება")
   - მიუთითე თარიღი და ადგილი
   - მხარეების სრული მონაცემები (სახელი, გვარი, პირადი ნომერი/საიდენტიფიკაციო კოდი, მისამართი)
   - დანომრე მუხლები და პუნქტები (მუხლი 1, მუხლი 2, ან 1., 2., 3.)

2. **აუცილებელი სექციები (თუ შესაბამისია):**
   - მხარეები
   - ხელშეკრულების საგანი
   - მხარეთა უფლება-მოვალეობები
   - ფასი და ანგარიშსწორების წესი (თუ შესაბამისია)
   - ვადები
   - პასუხისმგებლობა ხელშეკრულების დარღვევისთვის
   - დავის გადაწყვეტის წესი
   - დასკვნითი დებულებები
   - ხელმოწერის ადგილი

3. **ფორმატი:**
   - გამოიყენე ქართული ენა
   - გამოიყენე ფორმალური იურიდიული ტერმინოლოგია
   - თითოეული მუხლი ახალი აბზაციდან
   - ქვეპუნქტები აღნიშნე ა), ბ), გ) ან 1.1, 1.2, 1.3
   - თარიღები ფორმატით: XX.XX.XXXX
   - თანხები ციფრებით და სიტყვიერად (მაგ: 5000 (ხუთი ათასი) ლარი)

4. **იურისდიქცია:** ${selectedCountry}

დოკუმენტი უნდა იყოს სრული, პროფესიონალური და მზად ხელმოწერისთვის. არ გამოტოვო არცერთი აუცილებელი სექცია.`

      // First, get AI to generate the document content
      const chatResponse = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          message: documentInstructions,
          stream: false,
          country_code: selectedCountry,
          model_tier: 'premium'
        })
      })

      if (!chatResponse.ok) {
        throw new Error(translate('document_generation_failed', 'დოკუმენტის გენერირება ვერ მოხერხდა'))
      }

      const chatData = await chatResponse.json()
      const documentContent = chatData.content

      if (!documentContent || documentContent.length < 100) {
        throw new Error(translate('generated_content_too_short', 'გენერირებული შინაარსი ძალიან მოკლეა'))
      }

      // Now create the actual document file
      const result = await documentsApi.generateDocument({
        content: documentContent,
        title: documentTitle || translate(selectedDocType.titleKey, selectedDocType.titleFallback),
        format: selectedFormat
      })

      setGeneratedDocument({
        id: result.document_id,
        title: result.title,
        format: result.format,
        file_url: result.file_url
      })
      setShowSuccessModal(true)

      // Notify documents list to refresh
      window.dispatchEvent(new Event('document-generated'))

      message.success(translate('document_generated_successfully', 'დოკუმენტი წარმატებით შეიქმნა!'))

    } catch (error: any) {
      message.error(error.message || translate('document_generation_failed', 'დოკუმენტის გენერირება ვერ მოხერხდა'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedDocument) return

    try {
      const blob = await documentsApi.downloadDocument(generatedDocument.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${generatedDocument.title}.${generatedDocument.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success(translate('document_downloaded', 'დოკუმენტი გადმოწერილია'))
    } catch (error) {
      message.error(translate('failed_to_download_document', 'დოკუმენტის გადმოწერა ვერ მოხერხდა'))
    }
  }

  const resetForm = () => {
    setSelectedDocType(null)
    setUserInput('')
    setDocumentTitle('')
    setGeneratedDocument(null)
    setShowSuccessModal(false)
  }

  return (
    <div className={`documents-page ${isMobile ? 'mobile' : ''}`}>
      <div className="documents-container">
        {/* Header */}
        <div className={`documents-header ${isMobile ? 'mobile' : ''}`}>
          <button
            type="button"
            className={`documents-back-btn ${isMobile ? 'mobile' : ''}`}
            onClick={() => navigate('/documents')}
          >
            <ArrowLeftIcon />
            {translate('back', 'უკან')}
          </button>
          <h2>{translate('generate_document', 'დოკუმენტის გენერირება')}</h2>
        </div>

        {!selectedDocType ? (
          /* Document Type Selection */
          <>
            {/* Category Filter */}
            <div className="documents-categories">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className={`documents-category-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {translate(cat.labelKey, cat.labelFallback)}
                </button>
              ))}
            </div>

            {/* Document Types Grid */}
            <div className={`documents-grid ${isMobile ? 'mobile' : ''}`}>
              {filteredDocTypes.map(docType => (
                <div
                  key={docType.id}
                  className="document-card"
                  onClick={() => handleDocTypeSelect(docType)}
                >
                  <div className="document-card-content">
                    <div className="document-card-icon">
                      {docType.icon}
                    </div>
                    <div>
                      <span className="document-card-title">
                        {translate(docType.titleKey, docType.titleFallback)}
                      </span>
                      <span className="document-card-desc">
                        {translate(docType.descKey, docType.descFallback)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Document Details Form */
          <div className="document-form-card">
            {/* Step Indicator */}
            <div className="document-steps">
              <div className="document-step completed">
                <span className="document-step-number">1</span>
                <span className="document-step-label">{translate('select_type', 'ტიპი')}</span>
              </div>
              <div className={`document-step-connector ${userInput.trim() ? 'completed' : ''}`} />
              <div className={`document-step ${userInput.trim() ? 'completed' : 'active'}`}>
                <span className="document-step-number">2</span>
                <span className="document-step-label">{translate('fill_details', 'დეტალები')}</span>
              </div>
              <div className="document-step-connector" />
              <div className="document-step">
                <span className="document-step-number">3</span>
                <span className="document-step-label">{translate('generate', 'გენერირება')}</span>
              </div>
            </div>

            {/* Selected Document Type Header */}
            <div className="document-form-header">
              <div className="document-form-icon">
                {selectedDocType.icon}
              </div>
              <div className="document-form-info">
                <h4>{translate(selectedDocType.titleKey, selectedDocType.titleFallback)}</h4>
                <span>{translate(selectedDocType.descKey, selectedDocType.descFallback)}</span>
              </div>
              <button
                type="button"
                className="document-change-btn"
                onClick={resetForm}
              >
                {translate('change', 'შეცვლა')}
              </button>
            </div>

            {/* Document Title */}
            <div className="document-form-group">
              <label className="document-form-label">
                {translate('document_title', 'დოკუმენტის სათაური')}
              </label>
              <input
                type="text"
                className="document-form-input"
                value={documentTitle}
                onChange={e => setDocumentTitle(e.target.value)}
                placeholder={translate('enter_title', 'შეიყვანეთ სათაური')}
              />
            </div>

            {/* Document Details */}
            <div className="document-form-group">
              <label className="document-form-label">
                {translate('document_details', 'დოკუმენტის დეტალები')}
                <span className="required-star">*</span>
              </label>
              <p className="document-form-hint">
                {selectedDocType.id === 'custom_document'
                  ? translate('describe_document_needed', 'აღწერეთ რა ტიპის დოკუმენტი გჭირდებათ და რა ინფორმაცია უნდა შეიცავდეს')
                  : translate('enter_specific_details', 'შეიყვანეთ კონკრეტული მონაცემები (მხარეების სახელები, თარიღები, თანხები, პირობები და ა.შ.)')
                }
              </p>
              <textarea
                className="document-form-textarea"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder={
                  selectedDocType.id === 'custom_document'
                    ? translate('describe_your_document', 'აღწერეთ თქვენი დოკუმენტი დეტალურად...')
                    : translate('enter_details_placeholder', 'მაგ: გამყიდველი: გიორგი გიორგაძე, პირადი ნომერი: 01001001001\nმყიდველი: მარიამ მარიამაძე\nქონება: ბინა №15, თბილისი\nფასი: 50,000 აშშ დოლარი')
                }
                rows={8}
              />
            </div>

            {/* Format Selection */}
            <div className="document-form-group">
              <label className="document-form-label">
                {translate('output_format', 'ფორმატი')}
              </label>
              <div className="document-format-group">
                <button
                  type="button"
                  className={`document-format-btn pdf ${selectedFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <FilePdfIcon />
                  PDF
                </button>
                <button
                  type="button"
                  className={`document-format-btn docx ${selectedFormat === 'docx' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('docx')}
                >
                  <FileWordIcon />
                  DOCX
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              className="document-generate-btn"
              onClick={handleGenerate}
              disabled={!userInput.trim() || isGenerating}
            >
              {isGenerating ? <LoadingSpinner size="small" /> : <FileTextIcon />}
              {isGenerating
                ? translate('generating', 'გენერირდება...')
                : translate('generate_document', 'დოკუმენტის გენერირება')
              }
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        width={480}
      >
        <div className="document-success-content">
          <div className="document-success-icon">
            <CheckCircleIcon />
          </div>
          <h3 className="document-success-title">
            {translate('document_ready', 'დოკუმენტი მზადაა!')}
          </h3>
          <p className="document-success-message">
            {translate('document_generated_message', 'თქვენი დოკუმენტი წარმატებით შეიქმნა')}
          </p>

          {generatedDocument && (
            <div className="document-success-file">
              <span className={generatedDocument.format === 'pdf' ? 'document-file-icon-pdf' : 'document-file-icon-docx'}>
                {generatedDocument.format === 'pdf' ? <FilePdfIcon /> : <FileWordIcon />}
              </span>
              <div className="document-success-file-info">
                <span className="document-success-file-name">
                  {generatedDocument.title}
                </span>
                <span className="document-success-file-format">
                  {generatedDocument.format.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="document-success-actions">
            <button
              type="button"
              className="document-generate-btn document-modal-btn"
              onClick={handleDownload}
            >
              <DownloadIcon />
              {translate('download', 'გადმოწერა')}
            </button>
            <button
              type="button"
              className="document-change-btn document-modal-secondary-btn"
              onClick={() => {
                setShowSuccessModal(false)
                resetForm()
              }}
            >
              {translate('create_another', 'კიდევ შექმნა')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Premium Upgrade Modal */}
      <Modal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        width={isMobile ? '90%' : 440}
      >
        <div className={`document-upgrade-content ${isMobile ? 'mobile' : ''}`}>
          <div className="document-upgrade-icon">
            <CrownIcon />
          </div>

          <h3 className="document-upgrade-title">
            {translate('premium_feature', 'პრემიუმ ფუნქცია')}
          </h3>

          <p className="document-upgrade-message">
            {translate(
              'document_generation_premium_message',
              'დოკუმენტების გენერირება ხელმისაწვდომია მხოლოდ პრემიუმ მომხმარებლებისთვის. გაიფორმეთ გამოწერა და მიიღეთ წვდომა ყველა ფუნქციაზე.'
            )}
          </p>

          <div className="document-upgrade-features">
            {[
              translate('premium_feature_documents', 'სამართლებრივი დოკუმენტების გენერირება'),
              translate('premium_feature_models', 'პრემიუმ AI მოდელები'),
              translate('premium_feature_analysis', 'დოკუმენტების ანალიზი და შეჯამება'),
              translate('premium_feature_verified', 'გადამოწმებული სამართლებრივი პასუხები')
            ].map((feature, idx) => (
              <div key={idx} className="document-upgrade-feature">
                <CheckIcon />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className={`document-upgrade-actions ${isMobile ? 'mobile' : ''}`}>
            <button
              type="button"
              className="document-generate-btn document-modal-btn"
              onClick={() => {
                setShowUpgradeModal(false)
                navigate('/pricing')
              }}
            >
              <CrownIcon />
              {translate('upgrade_to_premium', 'პრემიუმზე გადასვლა')}
            </button>
            <button
              type="button"
              className="document-change-btn document-modal-secondary-btn"
              onClick={() => setShowUpgradeModal(false)}
            >
              {translate('maybe_later', 'მოგვიანებით')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentGenerationPage
