// Note: All pricing is in GEL (Georgian Lari) as Flitt payment gateway only supports GEL
export const personalPricingPlans = (
  translate: (key: string, defaultValue: string) => string,
  _isEuropean?: boolean  // Unused - always show GEL pricing
) => [
  {
    title: translate('trial', 'უფასო'),
    price: '₾0',
    planType: 'free',
    features: [
      translate('3_in_8', '3 მოთხოვნა / 8 საათში'),
      translate('general_legal_information', 'ზოგადი სამართლებრივი ინფორმაცია'),
      translate('basic_conversation', 'ძირითადი საუბარი'),
      translate('no_official_verification', 'არ ხდება ოფიციალური გადამოწმება'),
      translate('limited_features', 'შეზღუდული ფუნქციები')
    ],
    buttonText: translate('your_current_plan', 'მიმდინარე პაკეტი'),
    isHighlighted: false
  },
  {
    title: translate('pro', 'პრო'),
    price: '₾49',
    planType: 'premium',
    features: [
      translate('advanced_legal_reasoning', 'მოწინავე სამართლებრივი მსჯელობა'),
      translate('verified_answers_with_official_sources', 'ოფიციალურ წყაროებზე გადამოწმებული პასუხები'),
      translate('document_analysis_and_summarization', 'დოკუმენტების ანალიზი და შეჯამება'),
      translate('updated_laws_and_regulations', 'განახლებული კანონები და რეგულაციები'),
      translate('custom_templated_contracts_letters', 'მორგებული შაბლონები (ხელშეკრულებები, წერილები)'),
      translate('case_law_and_dispute_practices', 'პრეცედენტული დავების პრაქტიკა')
    ],
    buttonText: translate('upgrade_to_pro', 'პრო პაკეტზე გადასვლა'),
    isHighlighted: true
  },
  {
    title: translate('ultra', 'ულტრა'),
    price: '₾250',
    features: [
      translate('top_level_legal_support', 'უმაღლესი დონის სამართლებრივი მხარდაჭერა'),
      translate('priority_and_faster_responses', 'პრიორიტეტული და სწრაფი პასუხები'),
      translate('deep_analysis_of_complex_disputes', 'რთული დავების ღრმა ანალიზი'),
      translate('direct_access_to_legal_databases', 'პირდაპირი წვდომა სამართლებრივ ბაზებზე'),
      translate('personalized_legal_guidance', 'პერსონალიზებული რეკომენდაციები'),
      translate('premium_templates', 'პრემიუმ შაბლონები (სპეციალიზებული დოკუმენტები)'),
      translate('latest_legal_updates_by_industry', 'უახლესი სამართლებრივი განახლებები ინდუსტრიების მიხედვით'),
      translate('context_memory', 'Context Memory (ინფორმაციის შენახვა)')
    ],
    buttonText: translate('coming_soon', 'მალე'),
    isHighlighted: false
  }
]
