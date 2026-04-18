import { useTranslation } from 'src/providers/TranslationProvider'

const AppFooter = () => {
  const { translate } = useTranslation()
  return (
    <footer className='text-center py-3 border-t border-gray-200 dark:border-gray-700'>
      <span className='text-gray-500 dark:text-gray-400 text-sm'>
        {translate('by_messaging_doctoringo_you_agree_to_our', 'Doctoringo-ს გამოყენებით თქვენ ეთანხმებით ჩვენს')}{' '}
        <a href='/terms' className='text-gray-600 dark:text-gray-300 hover:underline font-medium'>
          {translate('terms', 'პირობებს')}
        </a>{' '}{translate('and_have_read_out', 'და წაკითხული გაქვთ')}{' '}
        <a href='/privacy-policy' className='text-gray-600 dark:text-gray-300 hover:underline font-medium'>
          {translate('privacy_policy', 'კონფიდენციალურობის პოლიტიკა')}
        </a>
      </span>
    </footer>
  )
}

export default AppFooter
