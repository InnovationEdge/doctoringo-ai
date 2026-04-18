import React, { createContext, useContext, ReactNode } from 'react'

interface SessionContextType {
  startNewSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // This will be called from any component that needs to start a new session
  const startNewSession = () => {
    // We'll emit an event that IndexPage will listen for
    const event = new CustomEvent('reset-chat')
    window.dispatchEvent(event)
  }

  return (
    <SessionContext.Provider value={{ startNewSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
