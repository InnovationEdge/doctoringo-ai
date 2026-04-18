import { Button, Modal } from 'src/components/ui'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'src/providers/AuthProvider'

const WelcomeBackModal = () => {
  const { translate } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Only show modal if user is not authenticated and hasn't dismissed it
    const stayLoggedOut = localStorage.getItem('stayLoggedOut')

    if (!isLoading && !isAuthenticated && !stayLoggedOut) {
      // Delay showing modal by 1 second to avoid showing on first load
      const timer = setTimeout(() => setIsModalVisible(true), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isAuthenticated, isLoading])

  return (
    <Modal
      title={translate('welcome_back', 'კეთილი იყოს თქვენი მობრძანება')}
      open={isModalVisible}
      onClose={() => setIsModalVisible(false)}
      className='welcome-back-modal'
      closable={false}
      footer={null}
      maskClosable={false}
    >
      <p>{translate('log_in_or_sign_up_to_get_smarter_responses', 'გაიარეთ ავტორიზაცია ან დარეგისტრირდით უფრო გონივრული პასუხების მისაღებად')}</p>
      <div className='d-flex flex-column w-100 py-2'>
        <Button
          type='default'
          className='border my-2'
          onClick={() => {
            setIsModalVisible(false)
            navigate('/login')
          }}
        >{translate('log_in', 'ავტორიზაცია')}
        </Button>
        <Button
          type='default'
          className='border bg-dark text-white my-2 p-2'
          onClick={() => {
            setIsModalVisible(false)
            navigate('/signup')
          }}
        >{translate('sign_up', 'რეგისტრაცია')}
        </Button>
      </div>
      <div className='text-center mt-2'>
        <span
          className='text-underline mb-2 p-2'
          style={{ textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => {
            localStorage.setItem('stayLoggedOut', 'true')
            setIsModalVisible(false)
          }}
        >{translate('stay_logged_out', 'დარჩით სისტემიდან გამოსული')}
        </span>
      </div>
    </Modal>
  )
}

export default WelcomeBackModal
