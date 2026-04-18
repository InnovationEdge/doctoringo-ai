import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface PrivateModeContextType {
  isPrivateMode: boolean
  togglePrivateMode: () => void
  setPrivateMode: (value: boolean) => void
}

const PrivateModeContext = createContext<PrivateModeContextType | undefined>(undefined)

interface PrivateModeProviderProps {
  children: ReactNode
}

export const PrivateModeProvider: React.FC<PrivateModeProviderProps> = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false)

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => !prev)
  }, [])

  const setPrivateMode = useCallback((value: boolean) => {
    setIsPrivateMode(value)
  }, [])

  return (
    <PrivateModeContext.Provider
      value={{
        isPrivateMode,
        togglePrivateMode,
        setPrivateMode
      }}
    >
      {children}
    </PrivateModeContext.Provider>
  )
}

export const usePrivateMode = (): PrivateModeContextType => {
  const context = useContext(PrivateModeContext)
  if (!context) {
    throw new Error('usePrivateMode must be used within a PrivateModeProvider')
  }
  return context
}

export default PrivateModeProvider
