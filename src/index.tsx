import 'src/assets/css/tailwind.css'
import 'src/assets/css/style.scss'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import Application from './App'
import TranslationProvider from 'src/providers/TranslationProvider'

const createElement = document.createElement('div')
createElement.className = 'd-flex flex-column flex-root overflow-hidden'
createElement.id = 'root'
document.body.appendChild(createElement)
document.body.className = 'header-fixed header-tablet-and-mobile-fixed toolbar-enabled sidebar-enabled bg-white'

const domNode = document.getElementById('root') as HTMLElement
const root = createRoot(domNode)

root.render(
  <BrowserRouter>
    <TranslationProvider>
      <Application />
    </TranslationProvider>
  </BrowserRouter>
)
